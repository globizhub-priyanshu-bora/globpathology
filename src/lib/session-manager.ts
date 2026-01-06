import { parse } from 'cookie';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sessionSchema } from '@/db/schema';

export interface SessionData {
  userId: number;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  permissions: any;
  labId: number | null;
  hasCompletedSetup: boolean;
  createdAt: number;
  lastActivity: number;
}

// CRITICAL: Session storage with better lifecycle management
const sessions = new Map<string, SessionData>();

// Session configuration
// UPDATED: 7 days inactivity timeout, 15 days absolute max
const SESSION_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days of inactivity before auto-logout
const SESSION_MAX_AGE_MS = 15 * 24 * 60 * 60 * 1000; // 15 days absolute max session duration

// Cleanup interval - every 1 hour to save resources on Vercel
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [sessionId, session] of sessions.entries()) {
    // Remove if inactive for too long (7 days)
    if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
      sessions.delete(sessionId);
      cleaned++;
      console.log(`Removed session ${sessionId} due to 7-day inactivity`);
      continue;
    }
    
    // Remove if absolute max age reached (15 days)
    if (now - session.createdAt > SESSION_MAX_AGE_MS) {
      sessions.delete(sessionId);
      cleaned++;
      console.log(`Removed session ${sessionId} due to 15-day max age`);
    }
  }
  
  if (cleaned > 0) {
    console.log(`��� Cleaned up ${cleaned} expired sessions`);
  }
}, 60 * 60 * 1000);

// Prevent memory leaks
if (typeof process !== 'undefined') {
  process.on('exit', () => clearInterval(cleanupInterval));
}

export const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export const createSession = (userData: Omit<SessionData, 'createdAt' | 'lastActivity'>): string => {
  const sessionId = generateSessionId();
  const now = Date.now();
  const expiresAt = new Date(now + SESSION_MAX_AGE_MS);
  
  const sessionData: SessionData = {
    ...userData,
    createdAt: now,
    lastActivity: now,
  };
  
  // Store in memory
  sessions.set(sessionId, sessionData);
  
  // Store in database for Vercel serverless persistence (non-blocking)
  try {
    // Use setImmediate to avoid blocking the request
    setImmediate(() => {
      try {
        db.insert(sessionSchema).values({
          id: sessionId,
          userId: userData.userId,
          labId: userData.labId,
          email: userData.email,
          role: userData.role,
          isAdmin: userData.isAdmin,
          permissions: userData.permissions,
          hasCompletedSetup: userData.hasCompletedSetup,
          expiresAt,
        });
        console.log('✅ Session stored in database:', sessionId);
      } catch (error) {
        console.warn('Failed to store session in database:', error);
      }
    });
  } catch (error) {
    console.warn('Could not queue session storage:', error);
  }
  
  console.log('✅ Session created:', sessionId, 'for user:', userData.email);
  return sessionId;
};

export const getSession = (sessionId: string): SessionData | null => {
  const session = sessions.get(sessionId);
  
  if (!session) {
    console.log('❌ Session not found in memory:', sessionId);
    return null;
  }

  const now = Date.now();
  
  // Check inactivity timeout
  if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
    console.log('❌ Session inactive timeout:', sessionId);
    sessions.delete(sessionId);
    return null;
  }
  
  // Check absolute max age
  if (now - session.createdAt > SESSION_MAX_AGE_MS) {
    console.log('❌ Session max age exceeded:', sessionId);
    sessions.delete(sessionId);
    return null;
  }

  // Update last activity
  session.lastActivity = now;
  
  console.log('✅ Session valid:', sessionId);
  return session;
};

// Async version that checks database if session not in memory (for Vercel serverless)
export const getSessionAsync = async (sessionId: string): Promise<SessionData | null> => {
  // First try memory
  const session = sessions.get(sessionId);
  
  if (session) {
    const now = Date.now();
    
    // Check inactivity timeout
    if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
      console.log('❌ Session inactive timeout:', sessionId);
      sessions.delete(sessionId);
      return null;
    }
    
    // Check absolute max age
    if (now - session.createdAt > SESSION_MAX_AGE_MS) {
      console.log('❌ Session max age exceeded:', sessionId);
      sessions.delete(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = now;
    console.log('✅ Session valid (from memory):', sessionId);
    return session;
  }

  // Session not in memory - try to get from database (for Vercel serverless)
  console.log('Session not in memory, checking database:', sessionId);
  try {
    const [dbSession] = await db
      .select()
      .from(sessionSchema)
      .where(eq(sessionSchema.id, sessionId))
      .limit(1);
    
    if (!dbSession) {
      console.log('❌ Session not found in database:', sessionId);
      return null;
    }

    // Check if expired
    if (new Date() > new Date(dbSession.expiresAt)) {
      console.log('❌ Session expired in database:', sessionId);
      try {
        await db.delete(sessionSchema).where(eq(sessionSchema.id, sessionId));
      } catch (error) {
        console.warn('Failed to delete expired session:', error);
      }
      return null;
    }

    // Restore to memory
    const restoredSession: SessionData = {
      userId: dbSession.userId,
      email: dbSession.email,
      name: dbSession.email.split('@')[0], // Use email prefix as name
      role: dbSession.role,
      isAdmin: dbSession.isAdmin,
      permissions: dbSession.permissions,
      labId: dbSession.labId,
      hasCompletedSetup: dbSession.hasCompletedSetup,
      createdAt: new Date(dbSession.createdAt).getTime(),
      lastActivity: Date.now(),
    };

    sessions.set(sessionId, restoredSession);
    console.log('✅ Session restored from database:', sessionId);
    return restoredSession;
  } catch (error) {
    console.error('Error checking database session:', error);
    return null;
  }
};

export const updateSession = (sessionId: string, updates: Partial<SessionData>): boolean => {
  const session = sessions.get(sessionId);
  
  if (!session) {
    return false;
  }
  
  const now = Date.now();
  sessions.set(sessionId, {
    ...session,
    ...updates,
    lastActivity: now, // Always update activity on any session access
  });
  
  console.log('✅ Session updated:', sessionId);
  return true;
};

export const deleteSession = (sessionId: string): void => {
  sessions.delete(sessionId);
  
  // Also delete from database
  try {
    db.delete(sessionSchema).where(eq(sessionSchema.id, sessionId)).run();
  } catch (error) {
    console.warn('Failed to delete session from database:', error);
  }
  
  console.log('✅ Session deleted:', sessionId);
};

export const getSessionFromRequest = (request: Request): string | null => {
  const cookieHeader = request.headers.get('cookie');
  
  if (!cookieHeader) {
    console.log('❌ No cookie header found');
    return null;
  }

  try {
    const cookies = parse(cookieHeader);
    const sessionId = cookies.sessionId || null;
    
    if (sessionId) {
      console.log('��� Session ID from cookie:', sessionId);
    }
    
    return sessionId;
  } catch (error) {
    console.error('❌ Error parsing cookies:', error);
    return null;
  }
};

// Session validation endpoint
export const validateSession = (sessionId: string): { valid: boolean; remaining: number } => {
  const session = getSession(sessionId);
  
  if (!session) {
    return { valid: false, remaining: 0 };
  }
  
  const remaining = SESSION_TIMEOUT_MS - (Date.now() - session.lastActivity);
  return { valid: true, remaining: Math.max(0, remaining) };
};

// Get all active sessions count (for monitoring)
export const getActiveSessionCount = (): number => {
  return sessions.size;
};
