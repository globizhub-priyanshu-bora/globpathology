import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface LayoutProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'cashier' | 'lab_tech' | string[];
}

export const Layout: React.FC<LayoutProps> = ({ children, requiredRole }) => {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
};