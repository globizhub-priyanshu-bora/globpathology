import { createFileRoute } from '@tanstack/react-router';
import { Edit, Search, Trash2, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
import {
  deleteDoctor,
  getAllDoctors,
  registerDoctor,
  searchDoctors,
  updateDoctor,
} from '@/routes/apis/doctor-apis';

export const Route = createFileRoute('/doctors/')({
  component: DoctorsPage,
});

interface Doctor {
  id: number;
  name: string;
  gender?: string;
  registrationNumber: string | null;
  specialization: string | null;
  phoneNumber: number | null;
  photoDocument?: string;
}

interface DoctorFormData {
  registrationNumber: string;
  name: string;
  gender?: string;
  specialization?: string;
  phoneNumber?: number;
  photoDocument?: string;
}

function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Doctor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch doctors on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const result = await getAllDoctors({
          data: { limit: 100, offset: 0, sortBy: 'name', sortOrder: 'asc' },
        });
        if (result?.success && result.data) {
          setDoctors(result.data);
        } else {
          setDoctors([]);
        }
      } catch (error) {
        console.error('Error loading doctors:', error);
        // Set empty array instead of throwing/toasting to prevent crashes
        setDoctors([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

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

  const displayedDoctors = isSearching ? searchResults : doctors;

  // Load doctors
  const loadDoctors = async () => {
    try {
      const result = await getAllDoctors({
        data: { limit: 100, offset: 0, sortBy: 'name', sortOrder: 'asc' },
      });
      if (result.success) {
        // Trigger re-render
        window.location.reload();
      }
    } catch (error) {
      toast.error('Failed to load doctors');
    }
  };

  // Add doctor
  const onAddDoctor = async (data: DoctorFormData) => {
    try {
      const result = await registerDoctor({
        data: {
          registrationNumber: data.registrationNumber,
          name: data.name,
          gender: data.gender || undefined,
          specialization: data.specialization || undefined,
          phoneNumber: data.phoneNumber ? Number(data.phoneNumber) : undefined,
          photoDocument: photoPreview || undefined,
        },
      });

      if (result.success) {
        setIsAddModalOpen(false);
        resetAdd();
        setPhotoPreview(null);
        await loadDoctors();
        toast.success('Doctor added successfully');
      } else {
        toast.error('Failed to add doctor');
      }
    } catch (error) {
      console.error('Error adding doctor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add doctor');
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
      toast.error('Search failed');
    }
  };

  // Edit doctor
  const openEditModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setEditPhotoPreview(doctor.photoDocument || null);
    resetEdit({
      registrationNumber: doctor.registrationNumber || '',
      name: doctor.name,
      gender: doctor.gender || '',
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
          gender: data.gender || undefined,
          specialization: data.specialization || undefined,
          phoneNumber: data.phoneNumber ? Number(data.phoneNumber) : undefined,
          photoDocument: editPhotoPreview || undefined,
        },
      });

      if (result.success) {
        setIsEditModalOpen(false);
        setSelectedDoctor(null);
        setEditPhotoPreview(null);
        await loadDoctors();
        if (isSearching) {
          await onSearch({ query: searchQuery });
        }
        toast.success('Doctor updated successfully');
      } else {
        toast.error('Failed to update doctor');
      }
    } catch (error) {
      console.error('Error updating doctor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update doctor');
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
        toast.success('Doctor deleted successfully');
      } else {
        toast.error('Failed to delete doctor');
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast.error('Failed to delete doctor');
    }
  };

  // Handle photo file selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isEdit) {
          setEditPhotoPreview(base64);
        } else {
          setPhotoPreview(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Doctors Management</h1>
          <p className="text-gray-600 mt-2">Manage medical professionals and their information</p>
        </div>

        {/* Loading State */}
        {isLoadingData && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-gray-600">Loading doctors...</p>
          </div>
        )}

        {!isLoadingData && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Doctors List</h2>
                  <p className="text-sm text-gray-600 mt-1">{displayedDoctors.length} doctor(s) found</p>
                </div>
                <Button
                  onClick={() => {
                    setIsAddModalOpen(true);
                    setPhotoPreview(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add New Doctor
                </Button>
              </div>

              <div className="p-6">
                {displayedDoctors.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="font-medium text-gray-900">No doctors available</p>
                    <p className="text-sm text-gray-600 mt-2">Click "Add New Doctor" to register a doctor</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Registration</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Gender</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Specialization</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedDoctors.map((doctor) => (
                          <tr key={doctor.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{doctor.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{doctor.registrationNumber || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{doctor.gender || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{doctor.specialization || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{doctor.phoneNumber || "-"}</td>
                            <td className="px-4 py-3 text-sm flex gap-2">
                              <Button
                                onClick={() => openEditModal(doctor)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => onDeleteDoctor(doctor.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete"
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
            </div>
          </div>

          {/* Sidebar - Search */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Search Doctors</h3>
              <form onSubmit={(e) => { e.preventDefault(); onSearch({ query: searchQuery }); }} className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or specialization"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                {isSearching && (
                  <Button
                    type="button"
                    onClick={() => {
                      setSearchResults([]);
                      setIsSearching(false);
                      setSearchQuery('');
                    }}
                    className="w-full bg-gray-600 hover:bg-gray-700"
                  >
                    Clear Search
                  </Button>
                )}
              </form>
            </div>
          </div>
        </div>
        )}

        {/* Add Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New Doctor</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmitAdd(onAddDoctor)} className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-900">Registration Number *</Label>
                  <input
                    {...registerAdd('registrationNumber', { required: 'Required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                    placeholder="e.g., MCI12345"
                  />
                  {errorsAdd.registrationNumber && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900">Name *</Label>
                  <input
                    {...registerAdd('name', { required: 'Required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                    placeholder="Doctor name"
                  />
                  {errorsAdd.name && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900">Gender</Label>
                  <select
                    {...registerAdd('gender')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900">Specialization</Label>
                  <input
                    {...registerAdd('specialization')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                    placeholder="e.g., Cardiology"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900">Phone Number</Label>
                  <input
                    {...registerAdd('phoneNumber')}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                    placeholder="10-digit number"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900">Photo / ID Document</Label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handlePhotoSelect(e, false)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                  />
                  {photoPreview && (
                    <div className="mt-2 relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                      {photoPreview.includes('pdf') ? (
                        <div className="flex items-center justify-center h-full text-gray-600">PDF Document</div>
                      ) : (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingAdd}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
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
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Doctor</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmitEdit(onEditDoctor)} className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-900">Registration Number *</Label>
                  <input
                    {...registerEdit('registrationNumber', { required: 'Required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                    placeholder="e.g., MCI12345"
                  />
                  {errorsEdit.registrationNumber && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900">Name *</Label>
                  <input
                    {...registerEdit('name', { required: 'Required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                    placeholder="Doctor name"
                  />
                  {errorsEdit.name && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900">Gender</Label>
                  <select
                    {...registerEdit('gender')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900">Specialization</Label>
                  <input
                    {...registerEdit('specialization')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                    placeholder="e.g., Cardiology"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900">Phone Number</Label>
                  <input
                    {...registerEdit('phoneNumber')}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                    placeholder="10-digit number"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900">Photo / ID Document</Label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handlePhotoSelect(e, true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                  />
                  {editPhotoPreview && (
                    <div className="mt-2 relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                      {editPhotoPreview.includes('pdf') || editPhotoPreview.includes('application') ? (
                        <div className="flex items-center justify-center h-full text-gray-600">PDF Document</div>
                      ) : (
                        <img src={editPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
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
