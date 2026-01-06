import { createFileRoute } from '@tanstack/react-router';
import { Edit, Plus, Search, Trash2, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '@/components/Layout';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  deleteDoctor,
  getAllDoctors,
  registerDoctor,
  searchDoctors,
  updateDoctor,
} from '@/routes/apis/doctor-apis';

export const Route = createFileRoute('/doctors/')({
  component: DoctorManagement,
  loader: async () => {
    const result = await getAllDoctors({
      data: { limit: 50, offset: 0, sortBy: 'name', sortOrder: 'asc' },
    });
    return result;
  },
});

interface Doctor {
  id: number;
  registrationNumber: string | null;
  name: string;
  specialization: string | null;
  phoneNumber: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt?: Date | null;
}

interface DoctorFormData {
  registrationNumber: string;
  name: string;
  specialization?: string;
  phoneNumber?: number;
}

function DoctorManagement() {
  const initialData = Route.useLoaderData();
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>(initialData?.data || []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Doctor[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd, isSubmitting: isSubmittingAdd },
  } = useForm<DoctorFormData>();

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
  } = useForm<DoctorFormData>();

  const {
    register: registerSearch,
    handleSubmit: handleSubmitSearch,
  } = useForm<{ query: string }>();

  // Load all doctors
  const loadDoctors = async () => {
    try {
      const result = await getAllDoctors({
        data: { limit: 50, offset: 0, sortBy: 'name', sortOrder: 'asc' },
      });
      if (result.success) {
        setDoctors(result.data);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      showToast('Failed to load doctors', 'error');
    }
  };

  // Add doctor
  const onAddDoctor = async (data: DoctorFormData) => {
    try {
      const result = await registerDoctor({
        data: {
          registrationNumber: data.registrationNumber,
          name: data.name,
          specialization: data.specialization || undefined,
          phoneNumber: data.phoneNumber ? Number(data.phoneNumber) : undefined,
        },
      });

      if (result.success) {
        setIsAddModalOpen(false);
        resetAdd();
        await loadDoctors();
        showToast('Doctor added successfully', 'success');
      } else {
        showToast('Failed to add doctor', 'error');
      }
    } catch (error) {
      console.error('Error adding doctor:', error);
      showToast(error instanceof Error ? error.message : 'Failed to add doctor', 'error');
    }
  };

  // Search doctors
  const onSearch = async (data: { query: string }) => {
    if (!data.query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      const result = await searchDoctors({
        data: { query: data.query, limit: 20, offset: 0 },
      });

      if (result.success) {
        setSearchResults(result.data);
        setIsSearching(true);
      }
    } catch (error) {
      console.error('Error searching doctors:', error);
      showToast('Search failed', 'error');
    }
  };

  // Edit doctor
  const openEditModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    resetEdit({
      registrationNumber: doctor.registrationNumber || '',
      name: doctor.name,
      specialization: doctor.specialization || '',
      phoneNumber: doctor.phoneNumber || undefined,
    });
    setIsEditModalOpen(true);
  };

  const onEditDoctor = async (data: DoctorFormData) => {
    if (!selectedDoctor) return;

    try {
      const result = await updateDoctor({
        data: {
          id: selectedDoctor.id,
          registrationNumber: data.registrationNumber,
          name: data.name,
          specialization: data.specialization || undefined,
          phoneNumber: data.phoneNumber ? Number(data.phoneNumber) : undefined,
        },
      });

      if (result.success) {
        setIsEditModalOpen(false);
        setSelectedDoctor(null);
        await loadDoctors();
        if (isSearching) {
          await onSearch({ query: searchQuery });
        }
        showToast('Doctor updated successfully', 'success');
      } else {
        showToast('Failed to update doctor', 'error');
      }
    } catch (error) {
      console.error('Error updating doctor:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update doctor', 'error');
    }
  };

  // Delete doctor
  const onDeleteDoctor = async (id: number) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
      const result = await deleteDoctor({ data: { id } });

      if (result.success) {
        await loadDoctors();
        if (isSearching) {
          await onSearch({ query: searchQuery });
        }
        showToast('Doctor deleted successfully', 'success');
      } else {
        showToast('Failed to delete doctor', 'error');
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      showToast('Failed to delete doctor', 'error');
    }
  };

  const displayedDoctors = isSearching ? searchResults : doctors;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Doctor List */}
            <div className="lg:col-span-2">
              <div className="rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b">
                  <div className="flex flex-row gap-5">
                    <h2 className="text-lg font-semibold">
                      {isSearching ? 'Search Results' : 'Available Doctors'}
                    </h2>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      <Plus className="w-5 h-5" />
                      Add New Doctor
                    </Button>
                  </div>
                  <p className="text-sm mt-1">
                    {displayedDoctors.length} doctor(s) found
                  </p>
                </div>

                <div className="p-6">
                  {displayedDoctors.length === 0 ? (
                    <div className="text-center py-12">
                      <UserPlus className="w-16 h-16 mx-auto mb-4" />
                      <p className="font-medium">
                        No doctors available
                      </p>
                      <p className="text-sm mt-2">
                        Click "Add New Doctor" to register a doctor
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {displayedDoctors.map((doctor) => (
                        <div
                          key={doctor.id}
                          className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-800 text-lg">
                                {doctor.name}
                              </h3>
                              <p className="text-sm text-slate-600 mt-1">
                                Reg: {doctor.registrationNumber}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => openEditModal(doctor)}
                                className="p-2 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => onDeleteDoctor(doctor.id)}
                                className="p-2 rounded-lg transition-colors bg-red-500 hover:bg-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {doctor.specialization && (
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">Specialization:</span> {doctor.specialization}
                              </p>
                            )}
                            {doctor.phoneNumber && (
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">Phone:</span> {doctor.phoneNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Add/Search */}
            <div className="lg:col-span-1">
              {/* Search Form */}
              <div className="rounded-lg shadow-sm border p-6 mb-6">
                <h3 className="font-semibold mb-4">Search Doctors</h3>
                <form onSubmit={handleSubmitSearch(onSearch)} className="space-y-3">
                  <input
                    {...registerSearch('query')}
                    placeholder="Search by name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </form>
                {isSearching && (
                  <Button
                    onClick={() => {
                      setIsSearching(false);
                      setSearchResults([]);
                    }}
                    className="w-full mt-2 bg-gray-600 hover:bg-gray-700"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add New Doctor</h3>
                <Button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <form onSubmit={handleSubmitAdd(onAddDoctor)} className="space-y-4">
                <div>
                  <Label>Registration Number *</Label>
                  <input
                    {...registerAdd('registrationNumber', { required: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., MCI12345"
                  />
                  {errorsAdd.registrationNumber && (
                    <p className="text-red-500 text-sm mt-1">This field is required</p>
                  )}
                </div>
                <div>
                  <Label>Name *</Label>
                  <input
                    {...registerAdd('name', { required: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Doctor name"
                  />
                  {errorsAdd.name && (
                    <p className="text-red-500 text-sm mt-1">This field is required</p>
                  )}
                </div>
                <div>
                  <Label>Specialization</Label>
                  <input
                    {...registerAdd('specialization')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Cardiology"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <input
                    {...registerAdd('phoneNumber')}
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="10-digit number"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingAdd}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmittingAdd ? 'Adding...' : 'Add Doctor'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && selectedDoctor && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit Doctor</h3>
                <Button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedDoctor(null);
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <form onSubmit={handleSubmitEdit(onEditDoctor)} className="space-y-4">
                <div>
                  <Label>Registration Number *</Label>
                  <input
                    {...registerEdit('registrationNumber', { required: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., MCI12345"
                  />
                  {errorsEdit.registrationNumber && (
                    <p className="text-red-500 text-sm mt-1">This field is required</p>
                  )}
                </div>
                <div>
                  <Label>Name *</Label>
                  <input
                    {...registerEdit('name', { required: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Doctor name"
                  />
                  {errorsEdit.name && (
                    <p className="text-red-500 text-sm mt-1">This field is required</p>
                  )}
                </div>
                <div>
                  <Label>Specialization</Label>
                  <input
                    {...registerEdit('specialization')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Cardiology"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <input
                    {...registerEdit('phoneNumber')}
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="10-digit number"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedDoctor(null);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmittingEdit ? 'Updating...' : 'Update Doctor'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
