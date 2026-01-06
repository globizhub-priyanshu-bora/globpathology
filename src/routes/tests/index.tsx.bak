import { createFileRoute } from '@tanstack/react-router';
import { AlertCircle, Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  calculateTestPrice,
  createTest,
  deleteTest,
  getAllTests,
  searchTests,
  updateTest,
} from '@/routes/apis/test-apis';
import { getAllTestParameters } from '@/routes/apis/test-parameter-apis';

export const Route = createFileRoute('/tests/')({
  component: TestManagement,
  loader: async () => {
    const [testsResult, parametersResult] = await Promise.all([
      getAllTests({
        data: { limit: 100, offset: 0, sortBy: 'name', sortOrder: 'asc' },
      }),
      getAllTestParameters({
        data: { limit: 100, offset: 0, sortBy: 'name', sortOrder: 'asc' },
      }),
    ]);
    return { tests: testsResult, parameters: parametersResult };
  },
});

interface Test {
  id: number;
  name: string;
  price: string;
  metadata: any;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt?: Date | null;
}

interface TestParameter {
  id: number;
  name: string;
  unit: string | null;
  value: string | null;
  price: string | null;
}

interface TestFormData {
  name: string;
  price: string;
}

function TestManagement() {
  const initialData = Route.useLoaderData();
  const [tests, setTests] = useState<Test[]>(initialData?.tests?.data || []);
  const [allParameters, setAllParameters] = useState<TestParameter[]>(
    initialData?.parameters?.data || []
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Test[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Parameter selection
  const [selectedParameterIds, setSelectedParameterIds] = useState<number[]>(
    []
  );
  const [calculatedPrice, setCalculatedPrice] = useState<string>('0.00');
  const [paramSearchQuery, setParamSearchQuery] = useState('');
  const [filteredParameters, setFilteredParameters] = useState<TestParameter[]>(
    []
  );

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    setValue: setValueAdd,
    formState: { errors: errorsAdd, isSubmitting: isSubmittingAdd },
  } = useForm<TestFormData>();

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
  } = useForm<TestFormData>();

  const {
    register: registerSearch,
    handleSubmit: handleSubmitSearch,
  } = useForm<{ query: string }>();

  useEffect(() => {
    if (paramSearchQuery) {
      const filtered = allParameters.filter((param) =>
        param.name.toLowerCase().includes(paramSearchQuery.toLowerCase())
      );
      setFilteredParameters(filtered);
    } else {
      setFilteredParameters(allParameters);
    }
  }, [paramSearchQuery, allParameters]);

  useEffect(() => {
    const calculatePrice = async () => {
      if (selectedParameterIds.length === 0) {
        setCalculatedPrice('0.00');
        return;
      }

      try {
        const result = await calculateTestPrice({
          data: { parameterIds: selectedParameterIds },
        });
        if (result.success) {
          setCalculatedPrice(result.totalPrice);
          setValueAdd('price', result.totalPrice);
        }
      } catch (error) {
        console.error('Error calculating price:', error);
      }
    };

    calculatePrice();
  }, [selectedParameterIds, setValueAdd]);

  const loadTests = async () => {
    try {
      const result = await getAllTests({
        data: { limit: 100, offset: 0, sortBy: 'name', sortOrder: 'asc' },
      });
      if (result.success) {
        setTests(result.data);
      }
    } catch (error) {
      console.error('Error loading tests:', error);
    }
  };

  const toggleParameter = (id: number) => {
    setSelectedParameterIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const onAddTest = async (data: TestFormData) => {
    try {
      const result = await createTest({
        data: {
          name: data.name,
          price: data.price,
          parameterIds: selectedParameterIds,
        },
      });

      if (result.success) {
        setIsAddModalOpen(false);
        resetAdd();
        setSelectedParameterIds([]);
        setCalculatedPrice('0.00');
        await loadTests();
      }
    } catch (error) {
      console.error('Error adding test:', error);
      alert(error instanceof Error ? error.message : 'Failed to add test');
    }
  };

  const onSearch = async (data: { query: string }) => {
    if (!data.query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      const result = await searchTests({
        data: { query: data.query, limit: 50, offset: 0 },
      });

      if (result.success) {
        setSearchResults(result.data);
        setIsSearching(true);
      }
    } catch (error) {
      console.error('Error searching tests:', error);
    }
  };

  const openEditModal = async (test: Test) => {
    setSelectedTest(test);
    const paramIds = (test.metadata as any)?.parameterIds || [];
    setSelectedParameterIds(paramIds);

    resetEdit({
      name: test.name,
      price: test.price,
    });

    // Calculate price for edit mode
    if (paramIds.length > 0) {
      try {
        const result = await calculateTestPrice({
          data: { parameterIds: paramIds },
        });
        if (result.success) {
          setCalculatedPrice(result.totalPrice);
        }
      } catch (error) {
        console.error('Error calculating price:', error);
      }
    }

    setIsEditModalOpen(true);
  };

  const onEditTest = async (data: TestFormData) => {
    if (!selectedTest) return;

    try {
      const result = await updateTest({
        data: {
          id: selectedTest.id,
          name: data.name,
          price: data.price,
          parameterIds: selectedParameterIds,
        },
      });

      if (result.success) {
        setIsEditModalOpen(false);
        setSelectedTest(null);
        setSelectedParameterIds([]);
        setCalculatedPrice('0.00');
        await loadTests();
        if (isSearching) {
          await onSearch({ query: searchQuery });
        }
      }
    } catch (error) {
      console.error('Error updating test:', error);
      alert(error instanceof Error ? error.message : 'Failed to update test');
    }
  };

  const onDeleteTest = async (id: number) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      const result = await deleteTest({ data: { id } });

      if (result.success) {
        await loadTests();
        if (isSearching) {
          await onSearch({ query: searchQuery });
        }
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Failed to delete test');
    }
  };

  const displayedTests = isSearching ? searchResults : tests;

  const getTestParameters = (test: Test) => {
    const paramIds = (test.metadata as any)?.parameterIds || [];
    return allParameters.filter((p) => paramIds.includes(p.id));
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
                Test Bundles Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {displayedTests.length} test(s) {isSearching && `for "${searchQuery}"`}
              </p>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Test
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-300 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Search Tests
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

          {/* Tests Table */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-300">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300 bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">
                        Test Name
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">
                        Parameters
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
                    {displayedTests.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-12 text-center"
                        >
                          {isSearching ? (
                            <div className="flex flex-col items-center justify-center">
                              <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
                              <p className="text-gray-700 font-medium text-base">
                                No tests found
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
                                No tests available
                              </p>
                              <p className="text-gray-500 text-sm mt-1">
                                Click "Add Test" to create one
                              </p>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      displayedTests.map((test) => {
                        const params = getTestParameters(test);
                        return (
                          <tr
                            key={test.id}
                            className="border-b border-gray-200"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {test.name}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {params.length > 0
                                ? params.map((p) => p.name).join(', ')
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-gray-900">
                              ₹{test.price}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center gap-2">
                                <Button
                                  onClick={() => openEditModal(test)}
                                  className="px-2 py-1"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => onDeleteTest(test.id)}
                                  variant="destructive"
                                  className="px-2 py-1"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-gray-400 max-w-3xl w-full my-8">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Test Bundle
              </h3>
              <Button
                variant="destructive"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSelectedParameterIds([]);
                  setCalculatedPrice('0.00');
                }}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmitAdd(onAddTest)} className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-900 mb-1">
                    Test Name *
                  </Label>
                  <input
                    type="text"
                    {...registerAdd('name', {
                      required: 'Test name is required',
                    })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                  />
                  {errorsAdd.name && (
                    <p className="text-red-600 text-xs mt-1">
                      {errorsAdd.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-900 mb-1">
                    Price (₹) *
                  </Label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      {...registerAdd('price', {
                        required: 'Price is required',
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 text-sm"
                      placeholder={`Calculated: ${calculatedPrice}`}
                    />
                  </div>
                  {errorsAdd.price && (
                    <p className="text-red-600 text-xs mt-1">
                      {errorsAdd.price.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    Calculated: ₹{calculatedPrice}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-4">
                <Label className="block text-sm font-medium text-gray-900 mb-2">
                  Select Parameters ({selectedParameterIds.length} selected)
                </Label>

                <input
                  type="text"
                  placeholder="Search parameters..."
                  value={paramSearchQuery}
                  onChange={(e) => setParamSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-sm mb-3"
                />

                <div className="border border-gray-300 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="border-b border-gray-300">
                        <th className="px-3 py-2 text-left font-semibold text-gray-900 w-12">
                          Select
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-900">
                          Parameter
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-900">
                          Unit
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-900">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParameters.map((param) => (
                        <tr
                          key={param.id}
                          className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleParameter(param.id)}
                        >
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedParameterIds.includes(param.id)}
                              onChange={() => toggleParameter(param.id)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            {param.name}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {param.unit || '-'}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-900">
                            {param.price ? `₹${param.price}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setSelectedParameterIds([]);
                    setCalculatedPrice('0.00');
                  }}
                  className="flex-1 px-3 py-2 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="flex-1 px-3 py-2 text-sm"
                >
                  {isSubmittingAdd ? 'Adding...' : 'Add Test'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-gray-400 max-w-3xl w-full my-8">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Test Bundle
              </h3>
              <Button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedParameterIds([]);
                  setCalculatedPrice('0.00');
                }}
                className="p-1 bg-white border border-gray-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmitEdit(onEditTest)} className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-900 mb-1">
                    Test Name *
                  </Label>
                  <input
                    type="text"
                    {...registerEdit('name', {
                      required: 'Test name is required',
                    })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                  />
                  {errorsEdit.name && (
                    <p className="text-red-600 text-xs mt-1">
                      {errorsEdit.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-900 mb-1">
                    Price (₹) *
                  </Label>
                  <input
                    type="text"
                    {...registerEdit('price', {
                      required: 'Price is required',
                    })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                  />
                  {errorsEdit.price && (
                    <p className="text-red-600 text-xs mt-1">
                      {errorsEdit.price.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    Calculated: ₹{calculatedPrice}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-4">
                <Label className="block text-sm font-medium text-gray-900 mb-2">
                  Select Parameters ({selectedParameterIds.length} selected)
                </Label>

                <input
                  type="text"
                  placeholder="Search parameters..."
                  value={paramSearchQuery}
                  onChange={(e) => setParamSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-sm mb-3"
                />

                <div className="border border-gray-300 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="border-b border-gray-300">
                        <th className="px-3 py-2 text-left font-semibold text-gray-900 w-12">
                          Select
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-900">
                          Parameter
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-900">
                          Unit
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-900">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParameters.map((param) => (
                        <tr
                          key={param.id}
                          className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleParameter(param.id)}
                        >
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedParameterIds.includes(param.id)}
                              onChange={() => toggleParameter(param.id)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            {param.name}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {param.unit || '-'}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-900">
                            {param.price ? `₹${param.price}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedParameterIds([]);
                    setCalculatedPrice('0.00');
                  }}
                  className="flex-1 px-3 py-2 bg-white border border-gray-400 text-gray-900 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex-1 px-3 py-2 bg-white border border-gray-400 text-gray-900 text-sm"
                >
                  {isSubmittingEdit ? 'Updating...' : 'Update Test'}
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