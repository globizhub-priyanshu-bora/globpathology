// Save as: /routes/apis/auth-apis.ts

import { createServerFn } from '@tanstack/react-start';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { labSchema, userSchema } from '@/db/schema';
import {
  createSession,
  deleteSession,
  getSession,
  getSessionAsync,
  getSessionFromRequest,
  updateSession,
} from '@/lib/session-manager';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  phoneNumber: z.number().int().positive().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const LabSetupSchema = z.object({
  name: z.string().min(2, 'Lab name is required'),
  addressLine1: z.string().optional(),
  gstinNumber: z.string().optional(),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.number().int().optional(),
  phoneNumber: z.number().int().positive().optional(),
  email: z.string().email().optional(),
});

// ============================================
// API FUNCTIONS
// ============================================

export const registerUser = createServerFn({ method: 'POST' })
  .inputValidator(RegisterSchema)
  .handler(async ({ data }) => {
    try {
      const existingUser = await db
        .select()
        .from(userSchema)
        .where(eq(userSchema.email, data.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error('Email already registered');
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      const [newUser] = await db
        .insert(userSchema)
        .values({
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: 'Admin',
          isAdmin: true,
          permissions: {},
          phoneNumber: data.phoneNumber || null,
          labId: null,
          hasCompletedSetup: false,
          createdBy: null,
        })
        .returning();

      return {
        success: true,
        message: 'Registration successful. Please complete lab setup.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isAdmin: newUser.isAdmin,
          hasCompletedSetup: newUser.hasCompletedSetup,
        },
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Registration failed'
      );
    }
  });

export const setupLab = createServerFn({ method: 'POST' })
  .inputValidator(LabSetupSchema)
  .handler(async ({ data, request }) => {
    try {
      const sessionId = getSessionFromRequest(request);
      if (!sessionId) {
        throw new Error('Not authenticated');
      }

      const session = await getSessionAsync(sessionId);
      if (!session) {
        throw new Error('Session expired');
      }

      const [user] = await db
        .select()
        .from(userSchema)
        .where(eq(userSchema.id, session.userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      if (user.labId) {
        throw new Error('Lab already set up for this user');
      }

      // Create the lab
      const [newLab] = await db
        .insert(labSchema)
        .values({
          name: data.name,
          addressLine1: data.addressLine1 || null,
          gstinNumber: data.gstinNumber || null,
          registrationNumber: data.registrationNumber,
          state: data.state || null,
          country: data.country || null,
          pincode: data.pincode || null,
          phoneNumber: data.phoneNumber || null,
          email: data.email || null,
        })
        .returning();

      // Update user
      const [updatedUser] = await db
        .update(userSchema)
        .set({
          labId: newLab.id,
          hasCompletedSetup: true,
          updatedAt: new Date(),
          permissions: {
            patients: { view: true, create: true, edit: true, delete: true },
            bills: { view: true, create: true, edit: true, delete: true },
            tests: { view: true, create: true, edit: true, delete: true },
            parameters: { view: true, create: true, edit: true, delete: true },
            doctors: { view: true, create: true, edit: true, delete: true },
            reports: { view: true, create: true, edit: true, delete: true },
            users: { view: true, create: true, edit: true, delete: true }
          }
        })
        .where(eq(userSchema.id, session.userId))
        .returning();

      // Update session
      updateSession(sessionId, {
        labId: newLab.id,
        hasCompletedSetup: true,
        permissions: updatedUser.permissions,
      });

      return {
        success: true,
        message: 'Lab setup completed successfully',
        lab: newLab,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          isAdmin: updatedUser.isAdmin,
          labId: updatedUser.labId,
          hasCompletedSetup: updatedUser.hasCompletedSetup,
        },
      };
    } catch (error) {
      console.error('Lab setup error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Lab setup failed'
      );
    }
  });

export const loginUser = createServerFn({ method: 'POST' })
  .inputValidator(LoginSchema)
  .handler(async ({ data }) => {
    try {
      const [user] = await db
        .select()
        .from(userSchema)
        .where(eq(userSchema.email, data.email))
        .limit(1);

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (user.deletedAt) {
        throw new Error('Account has been deactivated');
      }

      const isPasswordValid = await bcrypt.compare(data.password, user.password);

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // ✅ Await createSession to ensure database write completes
      const sessionId = await createSession({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.isAdmin || false,
        permissions: user.permissions || {},
        labId: user.labId,
        hasCompletedSetup: user.hasCompletedSetup || false,
      });

      const cookie = serialize('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 24 * 60 * 60, // 15 days in seconds
        path: '/',
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isAdmin: user.isAdmin || false,
            permissions: user.permissions || {},
            phoneNumber: user.phoneNumber,
            labId: user.labId,
            hasCompletedSetup: user.hasCompletedSetup || false,
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': cookie,
          },
        }
      );
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Login failed'
      );
    }
  });

export const logoutUser = createServerFn({ method: 'POST' })
  .handler(async ({ request }) => {
    try {
      const sessionId = getSessionFromRequest(request);

      if (sessionId) {
        await deleteSession(sessionId);
      }

      const cookie = serialize('sessionId', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Logout successful',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': cookie,
          },
        }
      );
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  });

export const getCurrentUser = createServerFn({ method: 'GET' })
  .handler(async ({ request }: any) => {
    try {
      const sessionId = getSessionFromRequest(request);

      if (!sessionId) {
        return {
          success: false,
          user: null,
        };
      }

      // Use async version to check database on Vercel serverless
      const session = await getSessionAsync(sessionId);

      if (!session) {
        return {
          success: false,
          user: null,
        };
      }

      const [user] = await db
        .select({
          id: userSchema.id,
          name: userSchema.name,
          email: userSchema.email,
          role: userSchema.role,
          isAdmin: userSchema.isAdmin,
          permissions: userSchema.permissions,
          phoneNumber: userSchema.phoneNumber,
          labId: userSchema.labId,
          hasCompletedSetup: userSchema.hasCompletedSetup,
        })
        .from(userSchema)
        .where(eq(userSchema.id, session.userId))
        .limit(1);

      if (!user) {
        await deleteSession(sessionId);
        return {
          success: false,
          user: null,
        };
      }

      return {
        success: true,
        user: {
          ...user,
          permissions: (user.permissions || {}) as Record<string, any>,
        },
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        user: null,
      };
    }
  });

export const checkAuthorization = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    requiredPermission: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    try {
      const userResult = await getCurrentUser({} as any);

      if (!userResult.success || !userResult.user) {
        return {
          authorized: false,
          message: 'Not authenticated',
        };
      }

      if (!userResult.user.hasCompletedSetup) {
        return {
          authorized: false,
          message: 'Lab setup not completed',
          requiresSetup: true,
        };
      }

      if (userResult.user.isAdmin) {
        return {
          authorized: true,
          user: userResult.user,
        };
      }

      if (data.requiredPermission) {
        const [module, action] = data.requiredPermission.split('.');
        const permissions = userResult.user.permissions || {};
        
        if (!permissions[module] || !permissions[module][action]) {
          return {
            authorized: false,
            message: 'Insufficient permissions',
          };
        }
      }

      return {
        authorized: true,
        user: userResult.user,
      };
    } catch (error) {
      console.error('Authorization check error:', error);
      return {
        authorized: false,
        message: 'Authorization failed',
      };
    }
  });

// ============================================
// SESSION VALIDATION ENDPOINTS
// ============================================

/**
 * Validate if session is still valid
 * Returns session validity status
 */
export const validateSessionEndpoint = createServerFn({ method: 'GET' })
  .handler(async ({ request }: any) => {
    try {
      const sessionId = getSessionFromRequest(request);
      
      if (!sessionId) {
        return {
          valid: false,
          message: 'No session found',
        };
      }

      // Session validation will be performed by session-manager
      // which checks for expiration and activity timeout
      const session = await getSessionAsync(sessionId);
      const isValid = session && session.userId;

      return {
        valid: isValid,
        sessionId: sessionId,
        userId: session?.userId,
        lastActivity: (session as any)?.lastActivity,
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return {
        valid: false,
        message: 'Session validation failed',
      };
    }
  });

/**
 * Keep session alive by updating last activity
 * Used to prevent timeout during user activity
 */
export const keepSessionAlive = createServerFn({ method: 'POST' })
  .handler(async ({ request }: any) => {
    try {
      const sessionId = getSessionFromRequest(request);
      
      if (!sessionId) {
        return {
          success: false,
          message: 'No session to keep alive',
        };
      }

      // Update session activity
      const session = await getSessionAsync(sessionId);
      if (!session) {
        return {
          success: false,
          message: 'Session not found',
        };
      }

      updateSession(sessionId, {
        ...session,
        lastActivity: Date.now(),
      });

      return {
        success: true,
        message: 'Session kept alive',
        nextActivityCheckIn: 5 * 60 * 1000, // 5 minutes
      };
    } catch (error) {
      console.error('Keep session alive error:', error);
      return {
        success: false,
        message: 'Keep alive failed',
      };
    }
  });

/**
 * Force logout - delete session
 * Explicitly delete user session
 */
export const forceLogout = createServerFn({ method: 'POST' })
  .handler(async ({ request }) => {
    try {
      const sessionId = getSessionFromRequest(request);
      
      if (sessionId) {
        await deleteSession(sessionId);
        console.log(`✅ Session ${sessionId} deleted - user logged out`);
      }

      return {
        success: true,
        message: 'Logged out successfully',
        redirectTo: '/',
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed',
      };
    }
  });