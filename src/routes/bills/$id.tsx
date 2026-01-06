import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertCircle, DollarSign, FileText, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { getAllBills, searchBills } from '@/routes/apis/bill-apis';

export const Route = createFileRoute('/bills/$id')({
  component: () => (
    <Layout requiredRole={['admin', 'cashier']}>
      <BillsManagement />
    </Layout>
  ),
  loader: async () => {
    const result = await getAllBills({
      data: { limit: 100, offset: 0, sortBy: 'createdAt', sortOrder: 'desc' },
    });
    return result;
  },
});

interface Bill {
  bill: {
    id: number;
    invoiceNumber: string;
    totalAmount: string;
    discount: string | null;
    tax: string | null;
    finalAmount: string;
    isPaid: boolean;
    createdAt: Date | null;
  };
  patient: {
    id: number;
    name: string;
    phoneNumber: number | null;
    age: number | null;
    gender: string | null;
  } | null;
}

function BillsManagement() {
  const initialData = Route.useLoaderData();
  const [bills, setBills] = useState<Bill[]>(initialData?.data || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Bill[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { register, handleSubmit } = useForm<{ query: string }>();

  const loadBills = async () => {
    setIsRefreshing(true);
    try {
      const result = await getAllBills({
        data: { limit: 100, offset: 0, sortBy: 'createdAt', sortOrder: 'desc' },
      });
      if (result.success) {
        setBills(result.data);
        // If currently searching, also update search results
        if (isSearching && searchQuery) {
          onSearch({ query: searchQuery });
        }
      }
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const onSearch = async (data: { query: string }) => {
    const trimmedQuery = data.query.trim();
    
    if (!trimmedQuery) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchQuery('');
      return;
    }

    try {
      const result = await searchBills({
        data: { query: trimmedQuery, limit: 100, offset: 0 },
      });

      if (result.success) {
        setSearchResults(result.data);
        setIsSearching(true);
        setSearchQuery(trimmedQuery);
      }
    } catch (error) {
      console.error('Error searching bills:', error);
      showToast('Failed to search bills. Please try again.');
    }
  };

  const clearSearch = () => {
    setIsSearching(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  const displayedBills = isSearching ? searchResults : bills;

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (isPaid: boolean) => {
    return isPaid ? (
      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
        PAID
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
        UNPAID
      </span>
    );
  };

  // Calculate statistics
  const stats = {
    total: displayedBills.length,
    paid: displayedBills.filter(b => b.bill.isPaid).length,
    unpaid: displayedBills.filter(b => !b.bill.isPaid).length,
    totalAmount: displayedBills.reduce((sum, b) => sum + parseFloat(b.bill.finalAmount), 0),
    paidAmount: displayedBills
      .filter(b => b.bill.isPaid)
      .reduce((sum, b) => sum + parseFloat(b.bill.finalAmount), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Bills Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            View and manage all laboratory bills
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bills</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid Bills</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unpaid Bills</p>
                <p className="text-2xl font-bold text-red-600">{stats.unpaid}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue Collected</p>
                <p className="text-2xl font-bold text-blue-600">₹{stats.paidAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm mb-4">
          <div className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <form
                onSubmit={handleSubmit(onSearch)}
                className="flex-1 min-w-[300px] max-w-md"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by invoice number, patient name, or patient ID..."
                    {...register('query')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </form>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  onClick={handleSubmit(onSearch)}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>

                {isSearching && (
                  <Button
                    onClick={clearSearch}
                    variant="destructive"
                    className="px-4 py-2 text-sm"
                  >
                    Clear Search
                  </Button>
                )}

                <Button
                  onClick={loadBills}
                  disabled={isRefreshing}
                  className="px-4 py-2 text-sm"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {isSearching && (
              <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Showing results for: <span className="font-semibold">"{searchQuery}"</span>
                  {' '}({searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">
                    Invoice Number
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">
                    Patient Details
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedBills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      {isSearching ? (
                        <div className="flex flex-col items-center justify-center">
                          <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
                          <p className="text-gray-700 font-medium text-lg">
                            No bills found
                          </p>
                          <p className="text-gray-500 text-sm mt-2">
                            No results matching "{searchQuery}"
                          </p>
                          <Button
                            onClick={clearSearch}
                            className="mt-4 px-6 py-2"
                          >
                            Clear Search
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="w-16 h-16 text-gray-400 mb-4" />
                          <p className="text-gray-700 font-medium text-lg">
                            No bills available
                          </p>
                          <p className="text-gray-500 text-sm mt-2">
                            Bills will appear here once patients are registered
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  displayedBills.map(({ bill, patient }) => (
                    <tr
                      key={bill.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-blue-600">
                          {bill.invoiceNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {bill.id.toString().padStart(6, '0')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {patient?.name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {patient?.age && `${patient.age} Yrs`}
                          {patient?.age && patient?.gender && ' • '}
                          {patient?.gender && `${patient.gender.charAt(0)}`}
                          {patient?.id && (
                            <>
                              {' • '}
                              <span className="text-blue-600">
                                PID: {patient.id.toString().padStart(6, '0')}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">
                          {formatDate(bill.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {patient?.phoneNumber || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">
                          ₹{parseFloat(bill.finalAmount).toFixed(2)}
                        </div>
                        {(parseFloat(bill.discount || '0') > 0 || parseFloat(bill.tax || '0') > 0) && (
                          <div className="text-xs text-gray-500">
                            Base: ₹{parseFloat(bill.totalAmount).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(bill.isPaid)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <Link to="/bills/bill/$id" params={{ id: bill.id.toString() }}>
                            <Button className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700">
                              <FileText className="w-3 h-3 mr-1" />
                              View Bill
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {displayedBills.length > 0 && (
            <div className="border-t border-gray-300 px-4 py-3 bg-gray-50">
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-600">
                  Showing <span className="font-semibold">{displayedBills.length}</span> bill(s)
                  {isSearching && ' (filtered)'}
                </div>
                <div className="flex gap-6 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-600">Paid: {stats.paid}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-gray-600">Unpaid: {stats.unpaid}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-gray-600" />
                    <span className="text-gray-600">
                      Total: ₹{stats.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}