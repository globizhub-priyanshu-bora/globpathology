import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AlertCircle, ArrowLeft, Printer, Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  formatReferenceRange,
  getApplicableReferenceRange,
  getResultStatus,
  isAbnormal,
} from '@/lib/reference-range-helper';
import {
  createTestResult,
  getTestResultData,
  updateTestResult,
} from '@/routes/apis/test-results-api';

export const Route = createFileRoute('/test-results/$testId')({
  component: () => (
    <Layout requiredRole={['admin', 'lab_tech']}>
      <TestResultEntry />
    </Layout>
  ),
  loader: async ({ params }: { params: { testId: string } }) => {
    const result = await getTestResultData({
      data: { patientTestId: parseInt(params.testId) },
    });
    return result;
  },
});

const LAB_DATA = {
  name: 'MEDICARE DIAGNOSTIC CENTER',
  tagline: 'Accurate | Caring | Instant',
  address: '105-108, SMART VISION COMPLEX, HEALTHCARE ROAD, OPPOSITE HEALTHCARE COMPLEX, MUMBAI - 689578',
  phone: '0123456789',
  mobilePhone: '09123456789',
  email: 'drlogy.pathlab@drlogy.com',
  website: 'www.medicare.com',
  sampleCollection: {
    address: '125, Shivam Bungalow, S G Road, Mumbai',
  },
};

interface ResultFormData {
  [key: string]: string;
}

function TestResultEntry() {
  const testData = Route.useLoaderData();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [impression, setImpression] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [savedResults, setSavedResults] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { isDirty } } =
    useForm<ResultFormData>();

  useEffect(() => {
    if (testData.data?.existingResult) {
      const existingData = testData.data.existingResult.result as any;

      if (existingData?.results) {
        existingData.results.forEach((r: any) => {
          setValue(`result_${r.parameterId}`, r.value);
        });
      }

      if (existingData?.impression) {
        setImpression(existingData.impression);
      }
    }
  }, [testData, setValue]);

  if (!testData.success || !testData.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-700 mb-4">Test data not found</p>
          <Button onClick={() => navigate({ to: '/lab-management' })}>
            Back to Lab Management
          </Button>
        </div>
      </div>
    );
  }

  const { patientTest, test, patient, doctor, bill, parameters, existingResult } = testData.data;

  // Patient demographics for reference range selection
  const patientDemographics = {
    age: patient.age,
    gender: patient.gender,
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const allFormValues = watch();
  const hasAnyResults = Object.keys(allFormValues).some((key) => allFormValues[key]?.trim());
  const filledCount = parameters.filter((param: any) =>
    allFormValues[`result_${param.id}`]?.trim()
  ).length;
  const totalCount = parameters.length;
  const completionPercentage = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  const onSubmit = async (formData: ResultFormData) => {
    if (!hasAnyResults) {
      setSaveError('Please enter at least one test result');
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      const results = parameters
        .map((param: any) => {
          const value = formData[`result_${param.id}`];
          if (!value?.trim()) return null;

          const referenceRange = getApplicableReferenceRange(
            param.referenceRanges || [],
            patientDemographics
          );
          const referenceRangeStr = formatReferenceRange(referenceRange);
          const abnormal = isAbnormal(
            value,
            referenceRange,
            param.referenceRanges || []
          );
          const status = getResultStatus(value, referenceRange);

          return {
            parameterId: param.id,
            parameterName: param.name,
            value,
            unit: param.unit || '',
            referenceRange: referenceRangeStr,
            isAbnormal: abnormal,
            status: status || undefined,
          };
        })
        .filter(Boolean);

      const resultData = {
        patientTestId: patientTest.id,
        results,
        impression: impression.trim() || undefined,
      };

      let result;
      if (existingResult) {
        result = await updateTestResult({
          data: {
            id: existingResult.id,
            ...resultData,
          },
        });
      } else {
        result = await createTestResult({
          data: resultData,
        });
      }

      if (result.success) {
        setSavedResults(results);
        setIsPreview(true);
      }
    } catch (error) {
      console.error('Error saving results:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save results');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isPreview && savedResults) {
    return (
      <>
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 8mm;
            }
            body {
              margin: 0;
              padding: 0;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            nav,
            header,
            .no-print,
            button,
            [role="button"],
            [class*="nav"],
            [class*="header"],
            [class*="menu"],
            [class*="sidebar"] {
              display: none !important;
              visibility: hidden !important;
            }
          }
        `}</style>

        <div className="min-h-screen bg-gray-50 print:bg-white">
          <div className="fixed top-4 right-4 z-50 flex gap-2 no-print bg-white p-3 rounded-lg shadow-lg">
            <Button
              onClick={() => setIsPreview(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Edit
            </Button>
            <Button onClick={handlePrint} className="px-4 py-2 bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </div>

          <div className="pt-20 pb-8 print:pt-0 print:pb-0">
            <div ref={printRef} className="max-w-[210mm] mx-auto bg-white p-8 print:p-4 shadow-lg print:shadow-none">
              {/* Header */}
              <div className="border-4 border-blue-600 mb-3">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold tracking-wide">{LAB_DATA.name}</h1>
                      <p className="text-xs mt-1 font-medium">{LAB_DATA.tagline}</p>
                      <p className="text-[10px] mt-2 max-w-2xl leading-tight">{LAB_DATA.address}</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-white text-blue-700 px-3 py-1.5 rounded font-bold text-xs">
                        Ì≥û {LAB_DATA.phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] mt-2 border-t border-blue-400 pt-1.5">
                    <span>Ì≥ß {LAB_DATA.email}</span>
                    <span>Ìºê {LAB_DATA.website}</span>
                  </div>
                </div>
              </div>

              {/* Patient & Test Info */}
              <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                <div className="border border-gray-300 p-2.5">
                  <h3 className="font-bold mb-1.5 text-sm text-gray-800">{patient.name}</h3>
                  <div className="space-y-0.5 text-[10px]">
                    <p className="text-gray-700">Age: <span className="font-semibold">{patient.age || 'N/A'} Years</span></p>
                    <p className="text-gray-700">Sex: <span className="font-semibold">{patient.gender || 'N/A'}</span></p>
                    <p className="text-gray-700">PID: <span className="font-semibold">{patient.id}</span></p>
                  </div>
                </div>

                <div className="border border-gray-300 p-2.5">
                  <h3 className="font-bold mb-1.5 text-[11px] text-gray-800">Sample Collected At:</h3>
                  <p className="text-gray-700 text-[9px] leading-tight mb-2">{LAB_DATA.sampleCollection.address}</p>
                  <p className="text-gray-700 text-[10px]">
                    Ref. By: <span className="font-semibold">{doctor?.name || 'N/A'}</span>
                  </p>
                </div>

                <div className="border border-gray-300 p-2.5">
                  <div className="space-y-1 text-[9px]">
                    <p className="text-gray-700">
                      <span className="font-semibold">Registered on:</span>{' '}
                      {formatDate(patientTest.createdAt)} {formatTime(patientTest.createdAt)}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Collected on:</span>{' '}
                      {formatDate(patientTest.createdAt)} {formatTime(patientTest.createdAt)}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Reported on:</span>{' '}
                      {formatDate(new Date())} {formatTime(new Date())}
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Title */}
              <div className="bg-gray-100 border-t-2 border-b-2 border-gray-800 py-1.5 px-4 mb-3">
                <h2 className="text-base font-bold text-center text-gray-900">{test.name}</h2>
              </div>

              {/* Results Table */}
              <table className="w-full border-collapse mb-3 text-[10px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-1.5 text-left font-bold text-gray-800">Parameter</th>
                    <th className="border border-gray-300 px-3 py-1.5 text-center font-bold text-gray-800">Result</th>
                    <th className="border border-gray-300 px-3 py-1.5 text-center font-bold text-gray-800">Reference Value</th>
                    <th className="border border-gray-300 px-3 py-1.5 text-center font-bold text-gray-800">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-50 border-b-2 border-blue-400">
                    <td colSpan={4} className="border border-gray-300 px-3 py-1.5 text-[10px] font-bold text-blue-900">
                      {test.name} - Primary Sample Type: Serum
                    </td>
                  </tr>
                  {savedResults.map((result: any) => {
                    return (
                      <tr key={result.parameterId} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-1.5 text-gray-800">{result.parameterName}</td>
                        <td className={`border border-gray-300 px-3 py-1.5 text-center font-semibold ${
                          result.status === 'High' ? 'text-red-600' : result.status === 'Low' ? 'text-blue-600' : 'text-gray-800'
                        }`}>
                          {result.value || '-'}
                          {result.status && result.status !== 'Normal' && (
                            <span className="ml-1.5 text-[9px] font-bold">({result.status})</span>
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-1.5 text-center text-gray-700">{result.referenceRange || '-'}</td>
                        <td className="border border-gray-300 px-3 py-1.5 text-center text-gray-700">{result.unit || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Impression Section */}
              {impression && (
                <div className="mb-3">
                  <h3 className="text-[11px] font-bold text-gray-900 mb-2">Clinical Impression / Notes:</h3>
                  <div className="border border-gray-300 p-2.5 text-[10px] text-gray-700 whitespace-pre-wrap break-words">
                    {impression}
                  </div>
                </div>
              )}

              {/* Sign Section */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div></div>
                <div>
                  <div className="mb-2">
                    <div className="h-10 flex items-end justify-center">
                      <div className="text-sm italic text-gray-600">Dr. Vimal Shah</div>
                    </div>
                  </div>
                  <p className="font-bold text-[10px] text-gray-800">Dr. Vimal Shah</p>
                  <p className="text-gray-600 text-[8px]">(MD, Pathologist)</p>
                </div>
                <div>
                  <div className="mb-2">
                    <div className="h-10 flex items-end justify-center">
                      <div className="text-sm italic text-gray-600">Dr. Vimal Shah</div>
                    </div>
                  </div>
                  <p className="font-bold text-[10px] text-gray-800">Dr. Vimal Shah</p>
                  <p className="text-gray-600 text-[8px]">(MD, Pathologist)</p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-2 px-4 flex justify-between items-center text-[9px] mt-4">
                <div className="flex items-center gap-3">
                  <span>Ì≥û Sample Collection</span>
                  <span className="font-bold">Ì≥± {LAB_DATA.mobilePhone}</span>
                </div>
                <div>
                  <span>Generated on: {formatDate(new Date())} {formatTime(new Date())}</span>
                  <span className="ml-4">Page 1 of 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Test Result Entry</h1>
              <p className="text-sm text-gray-600 mt-1">
                Patient: <span className="font-semibold">{patient.name}</span> | Test: <span className="font-semibold">{test.name}</span>
              </p>
              {patient.age && patient.gender && (
                <p className="text-xs text-blue-600 mt-1">
                  Reference ranges are automatically selected based on patient's age ({patient.age} years) and gender ({patient.gender})
                </p>
              )}
            </div>
            <Button onClick={() => navigate({ to: '/lab-management' })} className="px-4 py-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lab
            </Button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Completion Progress</span>
              <span className="text-sm font-semibold text-gray-900">
                {filledCount} / {totalCount} ({completionPercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {saveError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{saveError}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Parameters</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {parameters.map((param: any) => {
                const referenceRange = getApplicableReferenceRange(
                  param.referenceRanges || [],
                  patientDemographics
                );
                const referenceRangeStr = formatReferenceRange(referenceRange);

                return (
                  <div
                    key={param.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <Label className="text-base font-semibold text-gray-900">
                          {param.name}
                        </Label>
                        {param.unit && (
                          <p className="text-xs text-gray-600 mt-1">Unit: {param.unit}</p>
                        )}
                      </div>
                      {referenceRangeStr && (
                        <div className="text-right">
                          <p className="text-xs text-gray-600 font-semibold">Reference</p>
                          <p className="text-xs text-blue-600 font-bold">{referenceRangeStr}</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      {...register(`result_${param.id}`)}
                      placeholder="Enter result value"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <Label className="block text-lg font-semibold text-gray-900 mb-3">
              Clinical Impression / Notes
            </Label>
            <textarea
              value={impression}
              onChange={(e) => setImpression(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter clinical impression, observations, recommendations, or any relevant notes here..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Optional: Add any clinical observations or recommendations
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              onClick={() => navigate({ to: '/lab-management' })}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !hasAnyResults}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5 mr-2" />
              {isSaving
                ? 'Saving...'
                : existingResult
                ? 'Update & Preview Report'
                : 'Save & Preview Report'}
            </Button>
          </div>

          {!hasAnyResults && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Please enter at least one test result to save and generate the report.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
