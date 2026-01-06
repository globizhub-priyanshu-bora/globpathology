import { useLocation, useNavigate } from '@tanstack/react-router';
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from '@/lib/toast';
import { getLabInfo } from '@/routes/apis/lab-apis';
import { useAuth } from './ProtectedRoute';
import { Button } from './ui/button';

const MENU_ITEMS = [
  { to: '/patients/register', label: 'Patient Registration' },
  { to: '/bills/$id', label: 'Bills' },
  { to: '/tests', label: 'Tests' },
  { to: '/test-parameters', label: 'Parameters' },
  { to: '/doctors', label: 'Doctors' },
  { to: '/lab-management', label: 'Lab Management' },
  { to: '/more', label: 'More', isDropdown: true },
];

// Helper function to check if a route is active
function isRouteActive(pathname: string, routePath: string): boolean {
  // If route has parameters (contains $), check if pathname starts with the base path
  if (routePath.includes('$')) {
    const basePath = routePath.split('/').filter(part => !part.includes('$')).join('/');
    return pathname.startsWith(basePath) && pathname !== basePath;
  }
  // Otherwise, do exact match
  return pathname === routePath;
}

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [lab, setLab] = useState<{ name: string; registrationNumber: string | null } | null>(null);

  useEffect(() => {
    const fetchLabInfo = async () => {
      try {
        const result = await getLabInfo();
        if (result.success && result.data) {
          setLab({
            name: result.data.name,
            registrationNumber: result.data.registrationNumber,
          });
        }
      } catch (error) {
        console.error('Error fetching lab info:', error);
      }
    };

    if (user?.labId) {
      fetchLabInfo();
    }
  }, [user?.labId]);

  const handleLogout = async () => {
    try {
      const result = await logout();
      toast.success('Logged out successfully');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed, redirecting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  };

  const isLabManagementPage = location.pathname === '/lab-management';

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Button 
              className="flex items-center gap-3 hover:bg-white cursor-pointer bg-transparent border-none p-0"
              onClick={() => navigate({ to: '/lab-management' })}
              type="button"
            >
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900">Globpathology</h1>
                <p className="text-xs text-gray-500">Professional Healthcare Lab</p>
              </div>
            </Button>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-1">
              {MENU_ITEMS.map((item) => {
                if (item.isDropdown) {
                  return (
                    <div key={item.to} className="relative">
                      <Button
                        onClick={() => setShowMore((v) => !v)}
                        className="px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-1"
                      >
                        {item.label}
                        <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
                      </Button>
                      {showMore && (
                        <div className="absolute left-0 mt-2 w-56 bg-white border-2 border-gray-300 rounded-lg shadow-2xl py-3 z-50 space-y-1">
                          {user?.isAdmin && (
                            <DropdownButton onClick={() => { setShowMore(false); navigate({ to: '/admin/user-management' }); }}>
                              👤 User Management
                            </DropdownButton>
                          )}
                          <DropdownButton onClick={() => { setShowMore(false); navigate({ to: '/dashboard' }); }}>
                            📊 Dashboard
                          </DropdownButton>
                          {user?.isAdmin && (
                            <DropdownButton onClick={() => { setShowMore(false); navigate({ to: '/lab-details' }); }}>
                              🏥 Lab Details
                            </DropdownButton>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    active={isRouteActive(location.pathname, item.to)}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </div>

            {/* User Avatar & Dropdown */}
            <div className="hidden lg:flex items-center gap-4 relative">
              <Button
                type="button"
                onClick={() => setShowUserMenu((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setShowUserMenu((v) => !v);
                  }
                }}
                className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-gray-800 transition-colors"
                title={user?.name}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-gray-300 rounded-lg shadow-2xl py-2 z-50 top-full">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                  </div>
                  <Button
                    onClick={() => { setShowUserMenu(false); handleLogout(); }}
                    className="w-full text-left px-4 bg-white py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              onClick={() => setShowMobile((v) => !v)}
              className="lg:hidden p-2 text-gray-700 rounded-md"
            >
              {showMobile ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Lab Info Bar */}
      {isLabManagementPage && (
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 border-b border-blue-200 sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Lab Information</p>
                <p className="text-xs text-gray-600">
                  Name: {lab?.name || 'Loading...'} | Registration: {lab?.registrationNumber || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {showMobile && (
        <div className="lg:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-2 space-y-1">
            {MENU_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setShowMobile(false)}
                active={isRouteActive(location.pathname, item.to)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
              {user?.isAdmin && (
                <DropdownButton onClick={() => { setShowMobile(false); navigate({ to: '/admin/user-management' }); }}>
                  User Management
                </DropdownButton>
              )}
              <DropdownButton onClick={() => { setShowMobile(false); navigate({ to: '/dashboard' }); }}>
                Dashboard
              </DropdownButton>
              {user?.isAdmin && (
                <DropdownButton onClick={() => { setShowMobile(false); navigate({ to: '/lab-details' }); }}>
                  Lab Details
                </DropdownButton>
              )}
              <DropdownButton onClick={() => { setShowMobile(false); handleLogout(); }} danger>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Navigation Link
function NavLink({ to, active, children, onClick }: { to: string; active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  const navigate = useNavigate();
  return (
    <Button
      onClick={() => { onClick?.(); navigate({ to }); }}
      className={`px-4 py-2 text-sm font-semibold rounded-md hover:bg-white hover:text-inherit ${
        active 
          ? 'bg-white text-blue-600' 
          : 'bg-white text-black'
      }`}
    >
      {children}
    </Button>
  );
}

// Dropdown Button
function DropdownButton({ onClick, children, danger }: { onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 text-sm font-medium rounded-md transition-all ${
        danger 
          ? 'text-red-600 bg-red-50 hover:bg-red-100' 
          : 'text-gray-900 bg-gray-50 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}
