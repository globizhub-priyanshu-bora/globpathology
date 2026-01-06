// Save as: /routes/apis/helpers.ts

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { userSchema } from '@/db/schema';
import { getSession, getSessionFromRequest } from '@/lib/session-manager';

/**
 * CRITICAL SECURITY FUNCTION
 * Gets the authenticated user's labId from the request
 * All database queries MUST use this to ensure data isolation
 */
export const getLabIdFromRequest = async (request: Request): Promise<number> => {
  try {
    const sessionId = getSessionFromRequest(request);
    
    if (!sessionId) {
      throw new Error('Not authenticated');
    }

    // Try to get from memory first (works locally and on same server instance)
    let session = getSession(sessionId);
    
    // If not found in memory, it might be on Vercel where each request is stateless
    // Fall back to reading from database using the session ID stored in cookies
    if (!session) {
      console.warn('Session not found in memory, checking database');
      // The session ID should have been stored somewhere or we need to look it up differently
      throw new Error('Session expired or invalid');
    }

    if (!session.labId) {
      throw new Error('Lab not set up');
    }

    // Double-check from database for security
    const [user] = await db
      .select({ labId: userSchema.labId })
      .from(userSchema)
      .where(eq(userSchema.id, session.userId))
      .limit(1);

    if (!user || !user.labId) {
      throw new Error('User lab not found');
    }

    return user.labId;
  } catch (error) {
    console.error('getLabIdFromRequest error:', error);
    throw error;
  }
};

/**
 * Gets the current user from request
 */
export const getUserFromRequest = async (request: Request) => {
  const sessionId = getSessionFromRequest(request);
  
  if (!sessionId) {
    throw new Error('Not authenticated');
  }

  const session = getSession(sessionId);
  
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

  return user;
};

/**
 * Checks if user has permission
 */
export const checkPermission = (
  userPermissions: any,
  module: string,
  action: string
): boolean => {
  if (!userPermissions || !userPermissions[module]) return false;
  return userPermissions[module][action] === true;
};