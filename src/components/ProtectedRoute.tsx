import { useNavigate } from '@tanstack/react-router';
import { createContext, useContext, useEffect, useState } from 'react';
import { hasRoleAccess } from '@/lib/permission-manager';
import { getCurrentUser, logoutUser } from '@/routes/apis/auth-apis';
import { useActivityTracker } from '@/hooks/useSessionMonitor';
import { toast } from '@/lib/toast';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  permissions: any;
  phoneNumber?: number | null;
  labId: number | null;
  hasCompletedSetup: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'cashier' | 'lab_tech' | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track user activity to keep session alive
  useActivityTracker();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await getCurrentUser();

        if (!result || typeof result !== 'object' || !('success' in result) || !result.success || !('user' in result) || !result.user) {
          // Not authenticated - redirect to login
          setLoading(false);
          navigate({ to: '/' });
          return;
        }

        const userData = (result as any).user;

        // CRITICAL: Check if lab setup is completed
        if (!userData.hasCompletedSetup || !userData.labId) {
          // User needs to complete lab setup
          setLoading(false);
          navigate({ to: '/lab-setup' });
          return;
        }

        // CRITICAL: Check role-based access
        if (requiredRole && !hasRoleAccess(userData.role, requiredRole)) {
          setError(`Access denied. This page requires ${Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole} role.`);
          setLoading(false);
          // Don't redirect, show error instead
          return;
        }

        // User is authenticated and setup is complete
        setUser(userData);
        setLoading(false);

      } catch (error) {
        console.error('Auth check error:', error);
        setError('Failed to verify authentication');
        setLoading(false);
        navigate({ to: '/' });
      }
    };

    checkAuth();
  }, [navigate, requiredRole]);

  const handleLogout = async () => {
    try {
      const result = await logoutUser({});
      if (result && typeof result === 'object' && 'success' in result && (result as any).success) {
        toast.success('Logged out successfully!');
        setUser(null);
        navigate({ to: '/' });
      } else {
        toast.error('Failed to logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to logout');
      // Force logout even if API fails
      setUser(null);
      navigate({ to: '/' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => navigate({ to: '/dashboard' })}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};
