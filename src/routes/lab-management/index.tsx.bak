import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Edit, FileText, Filter, FlaskConical, RefreshCw, Search, Trash2, Users, UserPlus, X, TrendingUp, Calendar } from 'lucide-react';
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { bulkDeletePatients, getAllPatients, updatePatient } from '@/routes/apis/patient-apis';
import { getAllBills } from '@/routes/apis/bill-apis';

export const Route = createFileRoute('/lab-management/')({
  component: () => (
    <Layout requiredRole={['admin', 'cashier', 'lab_tech']}>
      <LabManagement />
    </Layout>
  ),
  loader: async () => {
    const result = await getAllPatients({
      data: { limit: 100, offset: 0, sortBy: 'createdAt', sortOrder: 'desc' },
    });
    return result;
  },
});

interface Patient {
  id: number;
  name: string;
  age: number | null;
  gender: string | null;
  phoneNumber: number | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface FilterFormData {
  searchQuery: string;
  gender: string;
  city: string;
  state: string;
  dateFrom: string;
  dateTo: string;
  ageMin: string;
  ageMax: string;
}

interface EditPatientFormData {
  name: string;
  age?: number;
  gender?: string;
  phoneNumber?: number;
  addressLine1?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: number;
}

function LabManagement() {
  const initialData = Route.useLoaderData();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>(initialData?.data || []);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>(initialData?.data || []);
  const [selectedPatients, setSelectedPatients] = useState<number[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [activeFilters, setActiveFilters] = useState<Partial<FilterFormData>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filterForm, setFilterForm] = useState<FilterFormData>({
    searchQuery: '',
    gender: '',
    city: '',
    state: '',
    dateFrom: '',
    dateTo: '',
    ageMin: '',
    ageMax: ''
  });

  const [editForm, setEditForm] = useState<EditPatientFormData>({
    name: '',
    age: undefined,
    gender: '',
    phoneNumber: undefined,
    addressLine1: '',
    city: '',
    state: '',
    country: '',
    pincode: undefined
  });

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await getAllPatients({
        data: { limit: 100, offset: 0, sortBy: 'createdAt', sortOrder: 'desc' },
      });
      if (result.success) {
        setPatients(result.data);
        setFilteredPatients(result.data);
        setActiveFilters({});
        setFilterForm({
          searchQuery: '',
          gender: '',
          city: '',
          state: '',
          dateFrom: '',
          dateTo: '',
          ageMin: '',
          ageMax: ''
        });
        setSelectedPatients([]);
      }
    } catch (error) {
      console.error('Error refreshing:', error);
      alert('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectPatient = (patientId: number) => {
    setSelectedPatients((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(filteredPatients.map((p) => p.id));
    }
  };

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    let filtered = [...patients];

    if (filterForm.searchQuery.trim()) {
      const query = filterForm.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.phoneNumber?.toString().includes(query) ||
        p.city?.toLowerCase().includes(query) ||
        p.state?.toLowerCase().includes(query)
      );
    }

    if (filterForm.gender) {
      filtered = filtered.filter(p => p.gender?.toLowerCase() === filterForm.gender.toLowerCase());
    }

    if (filterForm.city.trim()) {
      filtered = filtered.filter(p => 
        p.city?.toLowerCase().includes(filterForm.city.toLowerCase())
      );
    }

    if (filterForm.state.trim()) {
      filtered = filtered.filter(p => 
        p.state?.toLowerCase().includes(filterForm.state.toLowerCase())
      );
    }

    if (filterForm.ageMin) {
      const minAge = parseInt(filterForm.ageMin);
      filtered = filtered.filter(p => p.age !== null && p.age >= minAge);
    }
    if (filterForm.ageMax) {
      const maxAge = parseInt(filterForm.ageMax);
      filtered = filtered.filter(p => p.age !== null && p.age <= maxAge);
    }

    if (filterForm.dateFrom) {
      const fromDate = new Date(filterForm.dateFrom);
      filtered = filtered.filter(p => {
        if (!p.createdAt) return false;
        return new Date(p.createdAt) >= fromDate;
      });
    }
    if (filterForm.dateTo) {
      const toDate = new Date(filterForm.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(p => {
        if (!p.createdAt) return false;
        return new Date(p.createdAt) <= toDate;
      });
    }

    setFilteredPatients(filtered);
    setActiveFilters(filterForm);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilterForm({
      searchQuery: '',
      gender: '',
      city: '',
      state: '',
      dateFrom: '',
      dateTo: '',
      ageMin: '',
      ageMax: ''
    });
    setFilteredPatients(patients);
    setActiveFilters({});
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setEditForm({
      name: patient.name,
      age: patient.age || undefined,
      gender: patient.gender || '',
      phoneNumber: patient.phoneNumber || undefined,
      addressLine1: patient.addressLine1 || '',
      city: patient.city || '',
      state: patient.state || '',
      country: patient.country || '',
      pincode: patient.pincode || undefined,
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = () => {
    if (selectedPatients.length === 0) {
      alert('Please select a patient to edit');
      return;
    }
    if (selectedPatients.length > 1) {
      alert('Please select only one patient to edit');
      return;
    }
    const patient = filteredPatients.find(p => p.id === selectedPatients[0]);
    if (patient) {
      openEditModal(patient);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    try {
      const result = await updatePatient({
        data: {
          id: editingPatient.id,
          ...editForm
        }
      });

      if (result.success) {
        const updatedPatients = patients.map(p => 
          p.id === editingPatient.id ? result.data : p
        );
        setPatients(updatedPatients);
        setFilteredPatients(updatedPatients);
        setIsEditModalOpen(false);
        setEditingPatient(null);
        setSelectedPatients([]);
        alert('Patient updated successfully!');
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      alert(error instanceof Error ? error.message : 'Failed to update patient');
    }
  };

  const handleDelete = async () => {
    if (selectedPatients.length === 0) {
      alert('Please select at least one patient to delete');
      return;
    }

    const confirmMsg = `Are you sure you want to delete ${selectedPatients.length} patient(s)? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    try {
      const result = await bulkDeletePatients({
        data: { ids: selectedPatients }
      });

      if (result.success) {
        const updatedPatients = patients.filter(p => !selectedPatients.includes(p.id));
        setPatients(updatedPatients);
        setFilteredPatients(updatedPatients);
        setSelectedPatients([]);
        alert(result.message);
      }
    } catch (error) {
      console.error('Error deleting patients:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete patients');
    }
  };

  const hasActiveFilters = Object.values(activeFilters).some(v => v && v !== '');

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color.split(' ')[0]} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.split(' ')[1]}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={Users}
            label="Total Patients"
            value={patients.length}
            color="border-l-4 border-blue-500"
          />
          <StatCard 
            icon={FileText}
            label="Total Bills"
            value={filteredPatients.length}
            color="border-l-4 border-green-500"
          />
          <StatCard 
            icon={TrendingUp}
            label="Active Records"
            value={filteredPatients.length}
            color="border-l-4 border-purple-500"
          />
          <StatCard 
            icon={Calendar}
            label="This Month"
            value={patients.filter(p => {
              if (!p.createdAt) return false;
              const date = new Date(p.createdAt);
              const now = new Date();
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length}
            color="border-l-4 border-orange-500"
          />
        </div>

        {/* Patients Management Section */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Manage Patients</h2>
          <p className="text-sm text-gray-600 mt-1">
            Total Patients: <span className="font-semibold">{patients.length}</span>
            {filteredPatients.length !== patients.length && (
              <> • Filtered: <span className="font-semibold">{filteredPatients.length}</span></>
            )}
          </p>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg shadow-sm mb-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-75 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    const query = e.target.value.toLowerCase();
                    if (!query) {
                      setFilteredPatients(patients);
                    } else {
                      const filtered = patients.filter(p =>
                        p.name.toLowerCase().includes(query) ||
                        p.phoneNumber?.toString().includes(query) ||
                        p.city?.toLowerCase().includes(query) ||
                        p.state?.toLowerCase().includes(query)
                      );
                      setFilteredPatients(filtered);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className="px-4 py-2 text-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button 
                onClick={() => navigate({ to: '/patients/register' })}
                className="px-4 py-2 text-sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                New Patient
              </Button>

              <Button 
                disabled={selectedPatients.length === 0}
                onClick={handleEdit}
                className="px-4 py-2 text-sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>

              <Button
                disabled={selectedPatients.length === 0}
                onClick={handleDelete}
                variant="destructive"
                className="px-4 py-2 text-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>

              <Button 
                onClick={() => setIsFilterModalOpen(true)}
                className={`px-4 py-2 text-sm ${hasActiveFilters ? 'bg-blue-700' : ''}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              {Object.entries(activeFilters).map(([key, value]) => {
                if (!value) return null;
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                  >
                    {key}: {value}
                  </span>
                );
              })}
              <Button
                onClick={clearFilters}
                variant="destructive"
                className="px-2 py-1 text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="px-4 py-3 text-center w-12">
                    <input
                      type="checkbox"
                      checked={selectedPatients.length === filteredPatients.length && filteredPatients.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Lab ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Patient</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Registered</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Contact</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Location</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Filter className="w-16 h-16 text-gray-400 mb-4" />
                        <p className="text-gray-700 font-medium text-lg">No patients found</p>
                        <p className="text-gray-500 text-sm mt-2">
                          {hasActiveFilters ? 'Try adjusting your filters' : 'Click "New Patient" to register'}
                        </p>
                        {hasActiveFilters && (
                          <Button onClick={clearFilters} className="mt-4 px-6 py-2">
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                        selectedPatients.includes(patient.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedPatients.includes(patient.id)}
                          onChange={() => handleSelectPatient(patient.id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-blue-600">
                          {patient.id.toString().padStart(6, '0')}
                        </div>
                        <div className="text-xs text-gray-500">{formatDate(patient.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{patient.name}</div>
                        <div className="text-xs text-gray-600">
                          {patient.age && `${patient.age} Yrs`}
                          {patient.age && patient.gender && ' • '}
                          {patient.gender && `(${patient.gender})`}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 font-medium">{formatTime(patient.createdAt)}</div>
                        <div className="text-xs text-gray-500">{formatDate(patient.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{patient.phoneNumber || '-'}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {patient.city || '-'}
                        {patient.city && patient.state && ', '}
                        {patient.state || ''}
                      </td>
                      <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            {/* <Button 
                              className="px-3 py-1 text-xs" 
                              title="View Tests"
                              onClick={() => navigate({ to: '/patients/$id', params: { id: patient.id.toString() } })}
                            >
                              <FlaskConical className="w-3 h-3 mr-1" />
                              Tests
                            </Button> */}
                            <Button 
                              className="px-3 py-1 text-xs" 
                              title="View Details"
                              onClick={() => navigate({ to: '/patients/$id', params: { id: patient.id.toString() } })}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredPatients.length > 0 && (
            <div className="border-t border-gray-300 px-4 py-3 bg-gray-50">
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-600">
                  Showing {filteredPatients.length} patient(s)
                  {selectedPatients.length > 0 && ` • ${selectedPatients.length} selected`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                Filter Patients
              </h3>
              <Button onClick={() => setIsFilterModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </Button>
            </div>

            <form onSubmit={applyFilters} className="p-6">
              <div className="space-y-4">
                <div>
                  <Label className="mb-2">Search Text</Label>
                  <input
                    type="text"
                    value={filterForm.searchQuery}
                    onChange={(e) => setFilterForm({...filterForm, searchQuery: e.target.value})}
                    placeholder="Search by name, phone, city, or state..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label className="mb-2">Gender</Label>
                  <select
                    value={filterForm.gender}
                    onChange={(e) => setFilterForm({...filterForm, gender: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Genders</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">City</Label>
                    <input
                      type="text"
                      value={filterForm.city}
                      onChange={(e) => setFilterForm({...filterForm, city: e.target.value})}
                      placeholder="Enter city"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label className="mb-2">State</Label>
                    <input
                      type="text"
                      value={filterForm.state}
                      onChange={(e) => setFilterForm({...filterForm, state: e.target.value})}
                      placeholder="Enter state"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-2">Age Range</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={filterForm.ageMin}
                      onChange={(e) => setFilterForm({...filterForm, ageMin: e.target.value})}
                      placeholder="Min age"
                      min="0"
                      max="150"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={filterForm.ageMax}
                      onChange={(e) => setFilterForm({...filterForm, ageMax: e.target.value})}
                      placeholder="Max age"
                      min="0"
                      max="150"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-2">Registration Date Range</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">From</Label>
                      <input
                        type="date"
                        value={filterForm.dateFrom}
                        onChange={(e) => setFilterForm({...filterForm, dateFrom: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">To</Label>
                      <input
                        type="date"
                        value={filterForm.dateTo}
                        onChange={(e) => setFilterForm({...filterForm, dateTo: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  onClick={clearFilters}
                  variant="destructive"
                  className="flex-1 px-4 py-2"
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsFilterModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 px-4 py-2"
                >
                  Apply Filters
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {isEditModalOpen && editingPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit Patient Information
              </h3>
              <Button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPatient(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </Button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">Full Name *</Label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <Label className="mb-2">Age</Label>
                    <input
                      type="number"
                      value={editForm.age || ''}
                      onChange={(e) => setEditForm({...editForm, age: e.target.value ? Number(e.target.value) : undefined})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">Gender</Label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label className="mb-2">Phone Number</Label>
                    <input
                      type="number"
                      value={editForm.phoneNumber || ''}
                      onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value ? Number(e.target.value) : undefined})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-2">Address</Label>
                  <input
                    type="text"
                    value={editForm.addressLine1}
                    onChange={(e) => setEditForm({...editForm, addressLine1: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">City</Label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <Label className="mb-2">State</Label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">Country</Label>
                    <input
                      type="text"
                      value={editForm.country}
                      onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <Label className="mb-2">Pincode</Label>
                    <input
                      type="number"
                      value={editForm.pincode || ''}
                      onChange={(e) => setEditForm({...editForm, pincode: e.target.value ? Number(e.target.value) : undefined})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingPatient(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700"
                >
                  Update Patient
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}