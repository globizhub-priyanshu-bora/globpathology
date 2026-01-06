// import { createFileRoute, Link } from '@tanstack/react-router';
// import { AlertCircle, FileText, RefreshCw, Search } from 'lucide-react';
// import { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { Button } from '@/components/ui/button';
// import { getAllBills, searchBills } from '@/routes/apis/bill-apis';

// export const Route = createFileRoute('/bills/')({
//   component: BillsManagement,
//   loader: async () => {
//     const result = await getAllBills({
//       data: { limit: 50, offset: 0, sortBy: 'createdAt', sortOrder: 'desc' },
//     });
//     return result;
//   },
// });

// interface Bill {
//   bill: {
//     id: number;
//     invoiceNumber: string;
//     totalAmount: string;
//     discount: string | null;
//     tax: string | null;
//     finalAmount: string;
//     isPaid: boolean;
//     createdAt: Date | null;
//   };
//   patient: {
//     id: number;
//     name: string;
//     phoneNumber: number | null;
//     age: number | null;
//     gender: string | null;
//   } | null;
// }

// function BillsManagement() {
//   const initialData = Route.useLoaderData();
//   const [bills, setBills] = useState<Bill[]>(initialData?.data || []);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState<Bill[]>([]);
//   const [isSearching, setIsSearching] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   const { register, handleSubmit } = useForm<{ query: string }>();

//   const loadBills = async () => {
//     setIsRefreshing(true);
//     try {
//       const result = await getAllBills({
//         data: { limit: 50, offset: 0, sortBy: 'createdAt', sortOrder: 'desc' },
//       });
//       if (result.success) {
//         setBills(result.data);
//       }
//     } catch (error) {
//       console.error('Error loading bills:', error);
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   const onSearch = async (data: { query: string }) => {
//     if (!data.query.trim()) {
//       setSearchResults([]);
//       setIsSearching(false);
//       return;
//     }

//     try {
//       const result = await searchBills({
//         data: { query: data.query, limit: 50, offset: 0 },
//       });

//       if (result.success) {
//         setSearchResults(result.data);
//         setIsSearching(true);
//       }
//     } catch (error) {
//       console.error('Error searching bills:', error);
//     }
//   };

//   const displayedBills = isSearching ? searchResults : bills;

//   const formatDate = (date: Date | null) => {
//     if (!date) return '-';
//     return new Date(date).toLocaleString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   const getStatusBadge = (isPaid: boolean) => {
//     return isPaid ? (
//       <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
//         PAID
//       </span>
//     ) : (
//       <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
//         DUES
//       </span>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto px-4 py-6">
//         {/* Header */}
//         <div className="bg-white border border-gray-300 mb-4 p-4">
//           <div className="flex justify-between items-center">
//             <div>
//               <h1 className="text-xl font-semibold text-gray-900">
//                 Bills Management
//               </h1>
//               <p className="text-sm text-gray-600 mt-1">
//                 Total Bills: {displayedBills.length}
//                 {isSearching && ` (filtered)`}
//               </p>
//             </div>
//             <div className="flex gap-2">
//               <Button
//                 onClick={loadBills}
//                 disabled={isRefreshing}
//                 className="px-4 py-2"
//               >
//                 <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
//                 Refresh
//               </Button>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
//           {/* Search Panel */}
//           <div className="lg:col-span-1">
//             <div className="bg-white border border-gray-300 p-4">
//               <h2 className="text-sm font-semibold text-gray-900 mb-3">
//                 Quick Filter
//               </h2>
//               <form onSubmit={handleSubmit(onSearch)}>
//                 <input
//                   type="text"
//                   placeholder="Search by invoice or patient..."
//                   {...register('query')}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 text-sm mb-2 rounded"
//                 />
//                 <button
//                   type="submit"
//                   className="w-full px-3 py-2 bg-white border border-gray-400 text-gray-900 text-sm rounded hover:bg-gray-50"
//                 >
//                   <Search className="w-4 h-4 inline mr-1" />
//                   Search
//                 </button>
//               </form>

//               {isSearching && (
//                 <Button
//                   onClick={() => {
//                     setIsSearching(false);
//                     setSearchResults([]);
//                     setSearchQuery('');
//                   }}
//                   className="w-full mt-2 px-3 py-2 text-sm"
//                 >
//                   Clear Search
//                 </Button>
//               )}
//             </div>
//           </div>

//           {/* Bills Table */}
//           <div className="lg:col-span-3">
//             <div className="bg-white border border-gray-300 overflow-hidden">
//               <div className="overflow-x-auto">
//                 <table className="w-full text-sm">
//                   <thead>
//                     <tr className="border-b border-gray-300 bg-gray-50">
//                       <th className="px-4 py-3 text-left font-semibold text-gray-900">
//                         Lab ID
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold text-gray-900">
//                         Patient
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold text-gray-900">
//                         TAT
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold text-gray-900">
//                         Ref. By
//                       </th>
//                       <th className="px-4 py-3 text-left font-semibold text-gray-900">
//                         Billing
//                       </th>
//                       <th className="px-4 py-3 text-center font-semibold text-gray-900">
//                         Actions
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {displayedBills.length === 0 ? (
//                       <tr>
//                         <td colSpan={6} className="px-4 py-12 text-center">
//                           {isSearching ? (
//                             <div className="flex flex-col items-center justify-center">
//                               <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
//                               <p className="text-gray-700 font-medium text-base">
//                                 No bills found
//                               </p>
//                               <p className="text-gray-500 text-sm mt-1">
//                                 No results for "{searchQuery}"
//                               </p>
//                             </div>
//                           ) : (
//                             <div className="flex flex-col items-center justify-center">
//                               <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
//                               <p className="text-gray-700 font-medium text-base">
//                                 No bills available
//                               </p>
//                               <p className="text-gray-500 text-sm mt-1">
//                                 Register patients to create bills
//                               </p>
//                             </div>
//                           )}
//                         </td>
//                       </tr>
//                     ) : (
//                       displayedBills.map(({ bill, patient }) => (
//                         <tr
//                           key={bill.id}
//                           className="border-b border-gray-200 hover:bg-gray-50"
//                         >
//                           <td className="px-4 py-3">
//                             <div className="font-medium text-gray-900">
//                               {bill.invoiceNumber.split('-')[1]}
//                             </div>
//                             <div className="text-xs text-gray-500">
//                               {bill.invoiceNumber}
//                             </div>
//                           </td>
//                           <td className="px-4 py-3">
//                             <div className="font-medium text-gray-900">
//                               {patient?.name || 'N/A'}
//                             </div>
//                             <div className="text-xs text-gray-600">
//                               {patient?.age && `${patient.age} Yrs`}
//                               {patient?.age && patient?.gender && ' • '}
//                               {patient?.gender && `(${patient.gender.charAt(0)})`}
//                             </div>
//                           </td>
//                           <td className="px-4 py-3 text-gray-700">
//                             {formatDate(bill.createdAt)}
//                           </td>
//                           <td className="px-4 py-3 text-gray-700">
//                             {patient?.phoneNumber || '-'}
//                           </td>
//                           <td className="px-4 py-3">
//                             <div className="font-medium text-gray-900">
//                               ₹{bill.finalAmount}
//                             </div>
//                             <div className="text-xs">
//                               {getStatusBadge(bill.isPaid)}
//                             </div>
//                           </td>
//                           <td className="px-4 py-3">
//                             <div className="flex justify-center gap-2">
//                               <Link
//                                 to="/bills/$id"
//                                 params={{ id: bill.id.toString() }}
//                               >
//                                 <Button className="px-3 py-1 text-xs">
//                                   <FileText className="w-3 h-3 mr-1" />
//                                   View Details
//                                 </Button>
//                               </Link>
//                             </div>
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }