import { createServerFn } from '@tanstack/react-start';
import bcrypt from 'bcryptjs';
import { and, count, desc, eq, isNull, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { userSchema } from '@/db/schema';
import { getLabIdFromRequest, getUserFromRequest } from './helpers';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().min(1, 'Role is required'),
  phoneNumber: z.number().int().positive().optional(),
  permissions: z.object({
    patients: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }).optional(),
    bills: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }).optional(),
    tests: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }).optional(),
    parameters: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }).optional(),
    doctors: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }).optional(),
    reports: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }).optional(),
    users: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }).optional(),
  }),
});

const UpdateUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.string().min(1).optional(),
  phoneNumber: z.number().int().positive().optional(),
  permissions: z.object({
    patients: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }).optional(),
    bills: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }).optional(),
    tests: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }).optional(),
    parameters: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }).optional(),
    doctors: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }).optional(),
    reports: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }).optional(),
    users: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }).optional(),
  }).optional(),
});

const UserIdSchema = z.object({
  id: z.number().int().positive(),
});

const UserListSchema = z.object({
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['name', 'createdAt', 'role', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// API FUNCTIONS - ALL WITH LAB SECURITY
// ============================================

export const createUser = createServerFn({ method: 'POST' })
  .inputValidator(CreateUserSchema)
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get current user and labId
      const currentUser = await getUserFromRequest(request);
      const labId = await getLabIdFromRequest(request);

      // Check if email already exists GLOBALLY (not just in this lab)
      const existingUser = await db
        .select()
        .from(userSchema)
        .where(eq(userSchema.email, data.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error('Email already exists');
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      // Create user and assign to same lab as current user
      const [newUser] = await db
        .insert(userSchema)
        .values({
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role,
          phoneNumber: data.phoneNumber || null,
          permissions: data.permissions,
          isAdmin: false,
          createdBy: currentUser.id,
          labId: labId, // CRITICAL: Assign to current user's lab
          hasCompletedSetup: true, // New users inherit lab setup
        })
        .returning();

      return {
        success: true,
        message: 'User created successfully',
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phoneNumber: newUser.phoneNumber,
          permissions: newUser.permissions,
          isAdmin: newUser.isAdmin,
        },
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create user'
      );
    }
  });

export const getAllUsers = createServerFn({ method: 'GET' })
  .inputValidator(UserListSchema)
  .handler(async ({ data, request }) => {
    try {
      const { limit, offset, sortBy, sortOrder } = data;
      
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      const orderByColumn = userSchema[sortBy];
      const orderBy = sortOrder === 'desc' ? desc(orderByColumn) : orderByColumn;

      // Count only users from the same lab
      const countResult = await db
        .select({ count: count() })
        .from(userSchema)
        .where(
          and(
            eq(userSchema.labId, labId), // CRITICAL: Filter by labId
            isNull(userSchema.deletedAt)
          )
        );

      const totalCount = Number(countResult[0]?.count || 0);

      // Get only users from the same lab
      const users = await db
        .select({
          id: userSchema.id,
          name: userSchema.name,
          email: userSchema.email,
          role: userSchema.role,
          phoneNumber: userSchema.phoneNumber,
          permissions: userSchema.permissions,
          isAdmin: userSchema.isAdmin,
          createdAt: userSchema.createdAt,
          updatedAt: userSchema.updatedAt,
        })
        .from(userSchema)
        .where(
          and(
            eq(userSchema.labId, labId), // CRITICAL: Filter by labId
            isNull(userSchema.deletedAt)
          )
        )
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return {
        success: true,
        data: users,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  });

export const getUserById = createServerFn({ method: 'GET' })
  .inputValidator(UserIdSchema)
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      const [user] = await db
        .select({
          id: userSchema.id,
          name: userSchema.name,
          email: userSchema.email,
          role: userSchema.role,
          phoneNumber: userSchema.phoneNumber,
          permissions: userSchema.permissions,
          isAdmin: userSchema.isAdmin,
          createdAt: userSchema.createdAt,
          updatedAt: userSchema.updatedAt,
        })
        .from(userSchema)
        .where(
          and(
            eq(userSchema.id, data.id),
            eq(userSchema.labId, labId), // CRITICAL: Verify ownership
            isNull(userSchema.deletedAt)
          )
        )
        .limit(1);

      if (!user) {
        throw new Error('User not found or access denied');
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch user'
      );
    }
  });

export const updateUser = createServerFn({ method: 'POST' })
  .inputValidator(UpdateUserSchema)
  .handler(async ({ data, request }) => {
    try {
      const { id, password, ...updateData } = data;
      
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      const [existing] = await db
        .select()
        .from(userSchema)
        .where(
          and(
            eq(userSchema.id, id),
            eq(userSchema.labId, labId), // CRITICAL: Verify ownership
            isNull(userSchema.deletedAt)
          )
        )
        .limit(1);

      if (!existing) {
        throw new Error('User not found or access denied');
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== existing.email) {
        const [duplicate] = await db
          .select()
          .from(userSchema)
          .where(
            and(
              eq(userSchema.email, updateData.email),
              ne(userSchema.id, id),
              isNull(userSchema.deletedAt)
            )
          )
          .limit(1);

        if (duplicate) {
          throw new Error('Email already exists');
        }
      }

      const updateValues: any = {
        ...updateData,
        updatedAt: new Date(),
      };

      // Hash password if provided
      if (password) {
        const saltRounds = 12;
        updateValues.password = await bcrypt.hash(password, saltRounds);
      }

      const [updated] = await db
        .update(userSchema)
        .set(updateValues)
        .where(
          and(
            eq(userSchema.id, id),
            eq(userSchema.labId, labId) // CRITICAL: Ensure update is for user's lab
          )
        )
        .returning();

      return {
        success: true,
        message: 'User updated successfully',
        data: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          phoneNumber: updated.phoneNumber,
          permissions: updated.permissions,
          isAdmin: updated.isAdmin,
        },
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update user'
      );
    }
  });

export const deleteUser = createServerFn({ method: 'POST' })
  .inputValidator(UserIdSchema)
  .handler(async ({ data, request }) => {
    try {
      // CRITICAL: Get labId from authenticated user
      const labId = await getLabIdFromRequest(request);

      const [existing] = await db
        .select()
        .from(userSchema)
        .where(
          and(
            eq(userSchema.id, data.id),
            eq(userSchema.labId, labId), // CRITICAL: Verify ownership
            isNull(userSchema.deletedAt)
          )
        )
        .limit(1);

      if (!existing) {
        throw new Error('User not found or access denied');
      }

      // Prevent deleting admin accounts
      if (existing.isAdmin) {
        throw new Error('Cannot delete admin accounts');
      }

      await db
        .update(userSchema)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userSchema.id, data.id),
            eq(userSchema.labId, labId) // CRITICAL
          )
        );

      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete user'
      );
    }
  });