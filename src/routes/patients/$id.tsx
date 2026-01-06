import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AlertCircle, ArrowLeft, Calendar, ClipboardList, FileText, User } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { getPatientWithTests } from '@/routes/apis/patient-apis';

export const Route = createFileRoute('/patients/$id')({
  component: () => (
    <Layout requiredRole={['admin', 'cashier', 'lab_tech']}>
      <PatientTestsPage />
    </Layout>
  ),
  loader: async ({ params }: { params: { id: string } }) => {
    const result = await getPatientWithTests({
      data: { id: parseInt(params.id) },
    });
    return result;
  },
});

function PatientTestsPage() {
  const patientData = Route.useLoaderData();
  const navigate = useNavigate();
  const params = Route.useParams();

  if (!patientData.success || !patientData.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-700 mb-4">Patient not found</p>
          <Button onClick={() => navigate({ to: '/lab-management' })}>
            Back to Lab Management
          </Button>
        </div>
      </div>
    );
  }

  const { patient, tests, bills } = patientData.data;

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-orange-100', text: 'text-orange-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800' },
    };

    const badge = badges[status.toLowerCase()] || badges.pending;

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.bg} ${badge.text}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => navigate({ to: '/lab-management' })}
            className="mb-4 px-4 py-2 bg-gray-600 hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lab Management
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Patient Tests & Details</h1>
          <p className="text-sm text-gray-600 mt-1">
            Patient ID: {patient.id.toString().padStart(6, '0')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Information Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 p-3 rounded-full">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {patient.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {patient.age && `${patient.age} Years`}
                    {patient.age && patient.gender && ' • '}
                    {patient.gender && patient.gender}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                {patient.phoneNumber && (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-400">📞</div>
                    <div>
                      <p className="text-gray-600 text-xs">Phone Number</p>
                      <p className="text-gray-900 font-medium">
                        {patient.phoneNumber}
                      </p>
                    </div>
                  </div>
                )}

                {(patient.addressLine1 ||
                  patient.city ||
                  patient.state ||
                  patient.pincode) && (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-400">📍</div>
                    <div>
                      <p className="text-gray-600 text-xs">Address</p>
                      <p className="text-gray-900 font-medium">
                        {[
                          patient.addressLine1,
                          patient.city,
                          patient.state,
                          patient.pincode,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-600 text-xs">Registration Date</p>
                    <p className="text-gray-900 font-medium">
                      {formatDate(patient.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tests Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tests List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Test Records ({tests?.length || 0})
                </h2>
              </div>

              {tests && tests.length > 0 ? (
                <div className="space-y-4">
                  {tests.map((testItem: any, index: number) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-base">
                            {testItem.test?.name || 'Unknown Test'}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">
                            Test ID: {testItem.patientTest.id}
                          </p>
                        </div>
                        {getStatusBadge(testItem.patientTest.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div>
                          <p className="text-gray-600 text-xs">Registered On</p>
                          <p className="text-gray-900 font-medium">
                            {formatDate(testItem.patientTest.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Time</p>
                          <p className="text-gray-900 font-medium">
                            {formatTime(testItem.patientTest.createdAt)}
                          </p>
                        </div>
                        {testItem.doctor && (
                          <>
                            <div>
                              <p className="text-gray-600 text-xs">Referred By</p>
                              <p className="text-gray-900 font-medium">
                                {testItem.doctor.name}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">Doctor Reg.</p>
                              <p className="text-gray-900 font-medium">
                                {testItem.doctor.registrationNumber || '-'}
                              </p>
                            </div>
                          </>
                        )}
                        {testItem.patientTest.reportDeliveryDate && (
                          <div>
                            <p className="text-gray-600 text-xs">Delivery Date</p>
                            <p className="text-gray-900 font-medium">
                              {formatDate(testItem.patientTest.reportDeliveryDate)}
                            </p>
                          </div>
                        )}
                        {testItem.test?.price && (
                          <div>
                            <p className="text-gray-600 text-xs">Test Price</p>
                            <p className="text-gray-900 font-medium">
                              ₹{testItem.test.price}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex gap-2">
                        {testItem.patientTest.status.toLowerCase() === 'pending' ? (
                          <Button
                            onClick={() =>
                              navigate({
                                to: '/test-results/$testId',
                                params: { testId: testItem.patientTest.id.toString() },
                              })
                            }
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700"
                          >
                            <ClipboardList className="w-4 h-4 mr-2" />
                            Enter Results
                          </Button>
                        ) : (
                          <Button
                            onClick={() =>
                              navigate({
                                to: '/test-results/$testId',
                                params: { testId: testItem.patientTest.id.toString() },
                              })
                            }
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View/Edit Report
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-600">
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium">No tests recorded</p>
                  <p className="text-sm mt-2">
                    This patient hasn't been assigned any tests yet.
                  </p>
                </div>
              )}
            </div>

            {/* Bills Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Billing History ({bills?.length || 0})
                </h2>
              </div>

              {bills && bills.length > 0 ? (
                <div className="space-y-3">
                  {bills.map((bill: any) => (
                    <div
                      key={bill.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {bill.invoiceNumber}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {formatDate(bill.createdAt)} at {formatTime(bill.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ₹{parseFloat(bill.finalAmount).toFixed(2)}
                          </p>
                          {bill.isPaid ? (
                            <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                              PAID
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                              UNPAID
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button
                          onClick={() =>
                            navigate({
                              to: '/bills/bill/$id',
                              params: { id: bill.id.toString() },
                            })
                          }
                          className="w-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Bill Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-base font-medium">No billing records</p>
                  <p className="text-sm mt-2">
                    No bills have been generated for this patient yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}