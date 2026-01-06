import { createFileRoute } from '@tanstack/react-router';
import { Edit, Plus, Trash2, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
import { createUser, deleteUser, getAllUsers, updateUser } from '@/routes/apis/user-apis';

export const Route = createFileRoute('/admin/user-management')({
  component: AdminDashboard,
  loader: async (): Promise<any> => {
    try {
      const result = await getAllUsers({
        data: { limit: 100, offset: 0, sortBy: 'createdAt', sortOrder: 'desc' },
      });
      return result;
    } catch (error) {
      console.error('Error loading users:', error);
      return { success: false, data: [], error: 'Failed to load users' };
    }
  },
});

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  phoneNumber: number | null;
  permissions: any;
  isAdmin: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  phoneNumber?: number;
  permissions: {
    patients?: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    bills?: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    tests?: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    parameters?: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    doctors?: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    reports?: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    users?: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  };
}

function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const initialData = Route.useLoaderData();

  const [users, setUsers] = useState<UserData[]>(initialData?.data || []);
  const [selectedView, setSelectedView] = useState<'users' | 'add' | 'edit'>('users');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: '',
    phoneNumber: undefined,
    permissions: {
      patients: { view: false, create: false, edit: false, delete: false },
      bills: { view: false, create: false, edit: false, delete: false },
      tests: { view: false, create: false, edit: false, delete: false },
      parameters: { view: false, create: false, edit: false, delete: false },
      doctors: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
      users: { view: false, create: false, edit: false, delete: false },
    },
  });

  const modules = [
    { key: 'patients', label: 'Patients' },
    { key: 'bills', label: 'Bills' },
    { key: 'tests', label: 'Tests' },
    { key: 'parameters', label: 'Parameters' },
    { key: 'doctors', label: 'Doctors' },
    { key: 'reports', label: 'Reports' },
    { key: 'users', label: 'Users' },
  ];

  const actions = ['view', 'create', 'edit', 'delete'];

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      phoneNumber: undefined,
      permissions: {
        patients: { view: false, create: false, edit: false, delete: false },
        bills: { view: false, create: false, edit: false, delete: false },
        tests: { view: false, create: false, edit: false, delete: false },
        parameters: { view: false, create: false, edit: false, delete: false },
        doctors: { view: false, create: false, edit: false, delete: false },
        reports: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
      },
    });
  };

  const handleAddUser = () => {
    resetForm();
    setSelectedView('add');
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phoneNumber: user.phoneNumber || undefined,
      permissions: user.permissions || {
        patients: { view: false, create: false, edit: false, delete: false },
        bills: { view: false, create: false, edit: false, delete: false },
        tests: { view: false, create: false, edit: false, delete: false },
        parameters: { view: false, create: false, edit: false, delete: false },
        doctors: { view: false, create: false, edit: false, delete: false },
        reports: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
      },
    });
    setSelectedView('edit');
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const result = await deleteUser({ data: { id: userId } });
      if (result.success) {
        setUsers(users.filter(u => u.id !== userId));
        toast.success('User deleted successfully');
      } else {
        toast.error((result as any).error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Validation
      if (!formData.name.trim()) {
        toast.error('Name is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.email.trim()) {
        toast.error('Email is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.password.trim()) {
        toast.error('Password is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.role.trim()) {
        toast.error('Role is required');
        setIsSubmitting(false);
        return;
      }

      const result = (await createUser({ data: formData })) as { success: boolean; error?: string; data?: UserData[] };
      if (result.success) {
        const updatedUsers = (await getAllUsers({
          data: { limit: 100, offset: 0, sortBy: 'createdAt', sortOrder: 'desc' },
        })) as { success: boolean; error?: string; data: UserData[] };
        if (updatedUsers.success) {
          setUsers(updatedUsers.data);
          toast.success('User created successfully');
          setSelectedView('users');
          resetForm();
        } else {
          toast.error('User created but failed to reload list');
        }
      } else {
        toast.error(result.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      // Validation
      if (!formData.name.trim()) {
        toast.error('Name is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.email.trim()) {
        toast.error('Email is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.role.trim()) {
        toast.error('Role is required');
        setIsSubmitting(false);
        return;
      }

      const updateData: any = {
        id: selectedUser.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phoneNumber: formData.phoneNumber,
        permissions: formData.permissions,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const result = (await updateUser({ data: updateData })) as { success: boolean; error?: string };
      if (result.success) {
        const updatedUsers = (await getAllUsers({
          data: { limit: 100, offset: 0, sortBy: 'createdAt', sortOrder: 'desc' },
        })) as { success: boolean; error?: string; data: UserData[] };
        if (updatedUsers.success) {
          setUsers(updatedUsers.data);
          toast.success('User updated successfully');
          setSelectedView('users');
          setSelectedUser(null);
          resetForm();
        } else {
          toast.error('User updated but failed to reload list');
        }
      } else {
        toast.error(result.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (module: string, action: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module as keyof typeof prev.permissions],
          [action]: !(prev.permissions[module as keyof typeof prev.permissions] as any)?.[action],
        },
      },
    }));
  };

  const toggleAllPermissions = (module: string, grant: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          view: grant,
          create: grant,
          edit: grant,
          delete: grant,
        },
      },
    }));
  };

  if (selectedView === 'users') {
    return (
      <Layout requiredRole={['admin']}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <Button
              onClick={handleAddUser}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>

          {users.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.role}</td>
                      <td className="px-6 py-4 text-right text-sm space-x-2">
                        <Button
                          onClick={() => handleEditUser(user)}
                          variant="outline"
                          className="px-3 py-1"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteUser(user.id)}
                          variant="destructive"
                          className="px-3 py-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  const isEdit = selectedView === 'edit';

  return (
    <Layout requiredRole={['admin']}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit User' : 'Add New User'}
          </h1>
          <Button
            onClick={() => {
              setSelectedView('users');
              resetForm();
              setSelectedUser(null);
            }}
            variant="outline"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={isEdit ? handleSubmitEdit : handleSubmitAdd} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-900 mb-1">Name *</Label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Enter user name"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-900 mb-1">Email *</Label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-900 mb-1">
                  Password {isEdit && '(Leave blank to keep current)'}*
                </Label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Enter password"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-900 mb-1">Role *</Label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select role</option>
                  <option value="admin">Admin</option>
                  <option value="lab_tech">Lab Technician</option>
                  <option value="cashier">Cashier</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-900 mb-3">Permissions</Label>
              <div className="space-y-4">
                {modules.map((module) => (
                  <div key={module.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{module.label}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const hasAny = actions.some(
                            (action) =>
                              formData.permissions[module.key as keyof typeof formData.permissions]?.[action as keyof any]
                          );
                          toggleAllPermissions(module.key, !hasAny);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Toggle All
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {actions.map((action) => {
                        const modulePerms = formData.permissions[module.key as keyof typeof formData.permissions];
                        const isChecked = (modulePerms as any)?.[action] ?? false;
                        return (
                          <label key={action} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(module.key, action)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700 capitalize">{action}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                onClick={() => {
                  setSelectedView('users');
                  resetForm();
                  setSelectedUser(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
