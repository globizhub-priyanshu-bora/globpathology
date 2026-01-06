import { createFileRoute } from '@tanstack/react-router';
import { AlertCircle, Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
import {
  createTestParameter,
  deleteTestParameter,
  getAllTestParameters,
  searchTestParameters,
  updateTestParameter,
} from '@/routes/apis/test-parameter-apis';

export const Route = createFileRoute('/test-parameters/')({
  component: TestParameterManagement,
});

interface ReferenceRange {
  ageGroup: string;
  gender: string;
  minAge?: number;
  maxAge?: number;
  minValue: string;
  maxValue: string;
}

interface TestParameter {
  id: number;
  name: string;
  unit: string | null;
  price: string | null;
  referenceRanges: ReferenceRange[];
  metadata: any;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt?: Date | null;
}

interface TestParameterFormData {
  name: string;
  unit?: string;
  price?: string;
}

function TestParameterManagement() {
  const [parameters, setParameters] = useState<TestParameter[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedParameter, setSelectedParameter] =
    useState<TestParameter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TestParameter[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Reference Ranges State
  const [referenceRanges, setReferenceRanges] = useState<ReferenceRange[]>([]);

  // Fetch parameters on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const result = await getAllTestParameters({
          data: { limit: 100, offset: 0, sortBy: 'name', sortOrder: 'asc' },
        });
        if (result?.success && result.data) {
          setParameters(result.data);
        } else {
          setParameters([]);
        }
      } catch (error) {
        console.error('Error loading test parameters:', error);
        // Set empty array instead of throwing/toasting to prevent crashes
        setParameters([]);
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
  } = useForm<TestParameterFormData>();

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
  } = useForm<TestParameterFormData>();

  const {
    register: registerSearch,
    handleSubmit: handleSubmitSearch,
  } = useForm<{ query: string }>();

  const loadParameters = async () => {
    try {
      const result = await getAllTestParameters({
        data: { limit: 100, offset: 0, sortBy: 'name', sortOrder: 'asc' },
      });
      if (result.success) {
        setParameters(result.data);
      }
    } catch (error) {
      console.error('Error loading parameters:', error);
    }
  };

  const addReferenceRange = () => {
    setReferenceRanges([
      ...referenceRanges,
      {
        ageGroup: 'adult',
        gender: 'Any',
        minAge: undefined,
        maxAge: undefined,
        minValue: '',
        maxValue: '',
      },
    ]);
  };

  const removeReferenceRange = (index: number) => {
    setReferenceRanges(referenceRanges.filter((_, i) => i !== index));
  };

  const updateReferenceRange = (index: number, field: keyof ReferenceRange, value: any) => {
    const updated = [...referenceRanges];
    updated[index] = { ...updated[index], [field]: value };
    setReferenceRanges(updated);
  };

  const onAddParameter = async (data: TestParameterFormData) => {
    try {
      const result = await createTestParameter({
        data: {
          name: data.name,
          unit: data.unit || undefined,
          price: data.price || undefined,
          referenceRanges: referenceRanges.length > 0 ? referenceRanges : undefined,
        },
      });

      if (result.success) {
        setIsAddModalOpen(false);
        resetAdd();
        setReferenceRanges([]);
        await loadParameters();
      }
    } catch (error) {
      console.error('Error adding parameter:', error);
      alert(error instanceof Error ? error.message : 'Failed to add parameter');
    }
  };

  const onSearch = async (data: { query: string }) => {
    if (!data.query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      const result = await searchTestParameters({
        data: { query: data.query, limit: 50, offset: 0 },
      });

      if (result.success) {
        setSearchResults(result.data);
        setIsSearching(true);
      }
    } catch (error) {
      console.error('Error searching parameters:', error);
    }
  };

  const openEditModal = (parameter: TestParameter) => {
    setSelectedParameter(parameter);
    resetEdit({
      name: parameter.name,
      unit: parameter.unit || '',
      price: parameter.price || '',
    });
    setReferenceRanges(parameter.referenceRanges || []);
    setIsEditModalOpen(true);
  };

  const onEditParameter = async (data: TestParameterFormData) => {
    if (!selectedParameter) return;

    try {
      const result = await updateTestParameter({
        data: {
          id: selectedParameter.id,
          name: data.name,
          unit: data.unit || undefined,
          price: data.price || undefined,
          referenceRanges: referenceRanges.length > 0 ? referenceRanges : undefined,
        },
      });

      if (result.success) {
        setIsEditModalOpen(false);
        setSelectedParameter(null);
        setReferenceRanges([]);
        await loadParameters();
        if (isSearching) {
          await onSearch({ query: searchQuery });
        }
      }
    } catch (error) {
      console.error('Error updating parameter:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to update parameter'
      );
    }
  };

  const onDeleteParameter = async (id: number) => {
    if (!confirm('Are you sure you want to delete this parameter?')) return;

    try {
      const result = await deleteTestParameter({ data: { id } });

      if (result.success) {
        await loadParameters();
        if (isSearching) {
          await onSearch({ query: searchQuery });
        }
      }
    } catch (error) {
      console.error('Error deleting parameter:', error);
      toast.error('Failed to delete parameter');
    }
  };

  const displayedParameters = isSearching ? searchResults : parameters;

  const getRangeDisplay = (ranges: ReferenceRange[]) => {
    if (!ranges || ranges.length === 0) return 'Not set';
    return `${ranges.length} range(s)`;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white border border-gray-300 mb-4 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Test Parameters Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {displayedParameters.length} parameter(s) {isSearching && `for "${searchQuery}"`}
              </p>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Parameter
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingData && (
          <div className="bg-white border border-gray-300 p-8 text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-gray-600">Loading test parameters...</p>
          </div>
        )}

        {!isLoadingData && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-300 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Search Parameters
              </h2>
              <form onSubmit={handleSubmitSearch(onSearch)}>
                <input
                  type="text"
                  placeholder="Search..."
                  {...registerSearch('query')}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-sm mb-2"
                />
                <button
                  type="submit"
                  className="w-full px-3 py-2 bg-white border border-gray-400 text-gray-900 text-sm"
                >
                  <Search className="w-4 h-4 inline mr-1" />
                  Search
                </button>
              </form>

              {isSearching && (
                <Button
                  onClick={() => {
                    setIsSearching(false);
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                  className="w-full mt-2 px-3 py-2 text-sm"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>

          {/* Parameters Table */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-300">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300 bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">
                        Parameter Name
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">
                        Unit
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">
                        Reference Ranges
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">
                        Price (₹)
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedParameters.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-12 text-center"
                        >
                          {isSearching ? (
                            <div className="flex flex-col items-center justify-center">
                              <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
                              <p className="text-gray-700 font-medium text-base">
                                No parameters found
                              </p>
                              <p className="text-gray-500 text-sm mt-1">
                                No results for "{searchQuery}"
                              </p>
                              <Button
                                onClick={() => {
                                  setIsSearching(false);
                                  setSearchResults([]);
                                  setSearchQuery('');
                                }}
                                className="mt-3 px-4 py-2 text-sm"
                              >
                                Clear Search
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
                              <p className="text-gray-700 font-medium text-base">
                                No parameters available
                              </p>
                              <p className="text-gray-500 text-sm mt-1">
                                Click "Add Parameter" to create one
                              </p>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      displayedParameters.map((param) => (
                        <tr key={param.id} className="border-b border-gray-200">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {param.name}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {param.unit || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <span className="text-blue-600 font-medium">
                              {getRangeDisplay(param.referenceRanges)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {param.price ? `₹${param.price}` : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <Button
                                onClick={() => openEditModal(param)}
                                className="px-2 py-1"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => onDeleteParameter(param.id)}
                                variant="destructive"
                                className="px-2 py-1"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        )}

      {/* Add/Edit Modal with Reference Ranges */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-gray-400 max-w-4xl w-full my-8">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                {isAddModalOpen ? 'Add Test Parameter' : 'Edit Test Parameter'}
              </h3>
              <Button
                onClick={() => {
                  isAddModalOpen ? setIsAddModalOpen(false) : setIsEditModalOpen(false);
                  setReferenceRanges([]);
                }}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form 
              onSubmit={isAddModalOpen ? handleSubmitAdd(onAddParameter) : handleSubmitEdit(onEditParameter)} 
              className="p-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="block text-sm font-medium text-gray-900 mb-1">
                      Parameter Name *
                    </Label>
                    <input
                      type="text"
                      {...(isAddModalOpen ? registerAdd('name', { required: 'Name is required' }) : registerEdit('name', { required: 'Name is required' }))}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                    />
                    {(isAddModalOpen ? errorsAdd.name : errorsEdit.name) && (
                      <p className="text-red-600 text-xs mt-1">
                        {(isAddModalOpen ? errorsAdd.name : errorsEdit.name)?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-900 mb-1">
                      Unit
                    </Label>
                    <input
                      type="text"
                      {...(isAddModalOpen ? registerAdd('unit') : registerEdit('unit'))}
                      className="w-full px-3 py-2 border border-gray-300 text-sm"
                      placeholder="mg/dL, mmol/L, etc."
                    />
                  </div>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-900 mb-1">
                    Price (₹)
                  </Label>
                  <input
                    type="text"
                    {...(isAddModalOpen ? registerAdd('price') : registerEdit('price'))}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    placeholder="150.00"
                  />
                </div>

                {/* Reference Ranges Section */}
                <div className="border-t border-gray-300 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-base font-semibold text-gray-900">
                      Reference Ranges (Age & Gender Specific)
                    </Label>
                    <Button
                      type="button"
                      onClick={addReferenceRange}
                      className="px-3 py-1 text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Range
                    </Button>
                  </div>

                  {referenceRanges.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-300 rounded p-4 text-center">
                      <p className="text-sm text-gray-600">
                        No reference ranges added. Click "Add Range" to set age and gender-specific ranges.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referenceRanges.map((range, index) => (
                        <div key={index} className="border border-gray-300 rounded p-3 bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-semibold text-gray-900">
                              Range #{index + 1}
                            </span>
                            <Button
                              type="button"
                              onClick={() => removeReferenceRange(index)}
                              variant="destructive"
                              className="px-2 py-1 text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs text-gray-700 mb-1">Age Group *</Label>
                              <select
                                value={range.ageGroup}
                                onChange={(e) => updateReferenceRange(index, 'ageGroup', e.target.value)}
                                className="w-full px-2 py-2 border border-gray-300 text-sm rounded"
                              >
                                <option value="child">Child (0-12)</option>
                                <option value="teen">Teen (13-19)</option>
                                <option value="adult">Adult (20-64)</option>
                                <option value="senior">Senior (65+)</option>
                                <option value="custom">Custom Age Range</option>
                              </select>
                            </div>

                            <div>
                              <Label className="text-xs text-gray-700 mb-1">Gender *</Label>
                              <select
                                value={range.gender}
                                onChange={(e) => updateReferenceRange(index, 'gender', e.target.value)}
                                className="w-full px-2 py-2 border border-gray-300 text-sm rounded"
                              >
                                <option value="Any">Any</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                              </select>
                            </div>

                            {range.ageGroup === 'custom' && (
                              <div className="col-span-3 grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs text-gray-700 mb-1">Min Age</Label>
                                  <input
                                    type="number"
                                    value={range.minAge || ''}
                                    onChange={(e) => updateReferenceRange(index, 'minAge', e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full px-2 py-2 border border-gray-300 text-sm rounded"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-700 mb-1">Max Age</Label>
                                  <input
                                    type="number"
                                    value={range.maxAge || ''}
                                    onChange={(e) => updateReferenceRange(index, 'maxAge', e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full px-2 py-2 border border-gray-300 text-sm rounded"
                                    placeholder="120"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div>
                              <Label className="text-xs text-gray-700 mb-1">Min Value *</Label>
                              <input
                                type="text"
                                value={range.minValue}
                                onChange={(e) => updateReferenceRange(index, 'minValue', e.target.value)}
                                className="w-full px-2 py-2 border border-gray-300 text-sm rounded"
                                placeholder="e.g., 70"
                                required
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-700 mb-1">Max Value *</Label>
                              <input
                                type="text"
                                value={range.maxValue}
                                onChange={(e) => updateReferenceRange(index, 'maxValue', e.target.value)}
                                className="w-full px-2 py-2 border border-gray-300 text-sm rounded"
                                placeholder="e.g., 100"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    isAddModalOpen ? setIsAddModalOpen(false) : setIsEditModalOpen(false);
                    setReferenceRanges([]);
                  }}
                  className="flex-1 px-3 py-2 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isAddModalOpen ? isSubmittingAdd : isSubmittingEdit}
                  className="flex-1 px-3 py-2 text-sm"
                >
                  {(isAddModalOpen ? isSubmittingAdd : isSubmittingEdit) ? 'Saving...' : (isAddModalOpen ? 'Add Parameter' : 'Update Parameter')}
                </Button>
              </div>
            </form>
          </div>
        </div>
        )}
      </div>
      </div>
    </Layout>
  );
}