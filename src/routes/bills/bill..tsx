import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AlertCircle, ArrowLeft, Download, Printer } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { getBillById } from '@/routes/apis/bill-apis';

// Helper function to convert numbers to words
function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  function convertHundreds(n: number): string {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertHundreds(n % 100) : '');
  }

  if (num < 1000) return convertHundreds(num);
  if (num < 100000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return convertHundreds(thousands) + ' Thousand' + (remainder !== 0 ? ' ' + convertHundreds(remainder) : '');
  }
  if (num < 10000000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    return convertHundreds(lakhs) + ' Lakh' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
  }
  return 'Number too large';
}

export const Route = createFileRoute('/bills/bill/')({
  component: () => (
    <Layout requiredRole={['admin', 'cashier', 'lab_tech']}>
      <BillDetailPage />
    </Layout>
  ),
  loader: async ({ params }: { params: { id: string } }) => {
    try {
      const result = await getBillById({
        data: { id: parseInt(params.id) },
      });
      return result;
    } catch (error) {
      console.error('Error fetching bill:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch bill' };
    }
  },
});

function BillDetailPage() {
  const billData = Route.useLoaderData();
  const navigate = useNavigate();

  if (!billData.success || !billData.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-700 mb-4">Bill not found</p>
          <p className="text-sm text-gray-600 mb-6">{billData.error || "Unable to load the requested bill"}</p>
          <Button onClick={() => navigate({ to: '/lab-management' })}>
            Back to Lab Management
          </Button>
        </div>
      </div>
    );
  }

  const { bill, lab, patient, tests } = billData.data;

  const formatDateTime = (date: Date | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return `${d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })} ${d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })}`;
  };

  const totalAmount = parseFloat(bill.totalAmount);
  const discountAmount = (totalAmount * parseFloat(bill.discount || '0')) / 100;
  const taxAmount = ((totalAmount - discountAmount) * parseFloat(bill.tax || '0')) / 100;
  const finalAmount = parseFloat(bill.finalAmount);
  const amountInWords = numberToWords(Math.floor(finalAmount)) + ' Rupees';

  const handlePrint = () => {
    const printContent = document.getElementById('bill-print-content');
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=1000,height=800');
    if (!printWindow) return;

    const cssStyles = `
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        body { 
          font-family: Arial, sans-serif; 
          background: white;
        }
        .bill-container {
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
        }
        .border-2 { border: 2px solid #000; }
        .border { border: 1px solid #000; }
        .border-b-2 { border-bottom: 2px solid #000; }
        .border-b { border-bottom: 1px solid #000; }
        .border-r { border-right: 1px solid #000; }
        .border-t-2 { border-top: 2px solid #000; }
        .border-t { border-top: 1px solid #000; }
        .p-6 { padding: 16px; }
        .p-4 { padding: 12px; }
        .p-3 { padding: 8px; }
        .py-3 { padding-top: 8px; padding-bottom: 8px; }
        .py-2 { padding-top: 6px; padding-bottom: 6px; }
        .py-1 { padding-top: 4px; padding-bottom: 4px; }
        .px-4 { padding-left: 12px; padding-right: 12px; }
        .px-3 { padding-left: 8px; padding-right: 8px; }
        .px-2 { padding-left: 6px; padding-right: 6px; }
        .px-8 { padding-left: 24px; padding-right: 24px; }
        .mt-4 { margin-top: 12px; }
        .mt-3 { margin-top: 8px; }
        .mt-2 { margin-top: 6px; }
        .mt-1 { margin-top: 4px; }
        .mb-3 { margin-bottom: 8px; }
        .mb-2 { margin-bottom: 6px; }
        .mb-1 { margin-bottom: 4px; }
        .text-3xl { font-size: 24px; line-height: 1.2; }
        .text-xl { font-size: 16px; line-height: 1.4; }
        .text-lg { font-size: 14px; }
        .text-base { font-size: 13px; }
        .text-sm { font-size: 11px; }
        .text-xs { font-size: 10px; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        .uppercase { text-transform: uppercase; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .justify-center { justify-content: center; }
        .justify-end { justify-content: flex-end; }
        .items-start { align-items: flex-start; }
        .items-center { align-items: center; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .col-span-2 { grid-column: span 2; }
        .gap-2 { gap: 6px; }
        .gap-1 { gap: 4px; }
        .space-y-2 > * + * { margin-top: 6px; }
        .space-y-3 > * + * { margin-top: 8px; }
        .space-y-1 > * + * { margin-top: 4px; }
        .bg-red-600 { background-color: #dc2626; color: white; }
        .bg-gray-50 { background-color: #f9fafb; }
        .bg-gray-100 { background-color: #f3f4f6; }
        .text-red-600 { color: #dc2626; }
        .text-gray-900 { color: #111827; }
        .text-gray-700 { color: #374151; }
        .text-gray-600 { color: #4b5563; }
        .w-full { width: 100%; }
        .w-64 { width: 280px; }
        table { 
          border-collapse: collapse; 
          width: 100%; 
        }
        th, td {
          padding: 0;
        }
        @media print {
          body { 
            padding: 0; 
          }
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${bill.invoiceNumber}</title>
          ${cssStyles}
        </head>
        <body>
          <div class="bill-container">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Header Actions */}
        <div className="mb-6 flex justify-between items-center">
          <Button
            onClick={() => navigate({ to: '/lab-management' })}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={handlePrint}
              className="px-4 py-2 bg-black hover:bg-gray-800 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={() => {
                const element = document.getElementById('bill-print-content');
                if (element) {
                  const link = document.createElement('a');
                  link.href = 'data:text/html,' + encodeURIComponent(element.innerHTML);
                  link.download = `bill-${bill.invoiceNumber}.html`;
                  link.click();
                }
              }}
              className="px-4 py-2 bg-black hover:bg-gray-800 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Bill Content */}
        <div id="bill-print-content" className="bg-white border-2 border-gray-900">
          {/* Header */}
          <div className="border-b-2 border-gray-900 p-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 uppercase">
                  {lab?.name || 'LAB NAME'}
                </h1>
                {lab?.addressLine1 && (
                  <p className="text-xs text-gray-700 mt-1">{lab.addressLine1}</p>
                )}
                {(lab?.city || lab?.state) && (
                  <p className="text-xs text-gray-700">{[lab?.city, lab?.state].filter(Boolean).join(", ")}</p>
                )}
                {lab?.country && (
                  <p className="text-xs text-gray-700">{lab.country}</p>
                )}
                {lab?.phoneNumber && (
                  <p className="text-xs text-gray-700 mt-1">Tel: {lab.phoneNumber}</p>
                )}
              </div>
              <div className="text-right">
                {lab?.email && (
                  <p className="text-xs text-gray-700">{lab.email}</p>
                )}
              </div>
            </div>

            <div className="mt-3 flex justify-between text-xs text-gray-600">
              <span></span>
              <div className="text-right">
                {lab?.gstinNumber && <div>{lab.gstinNumber}</div>}
                {lab?.registrationNumber && <div>{lab.registrationNumber}</div>}
              </div>
            </div>
          </div>

          {/* Bill Title */}
          <div className="text-center py-2 border-b border-gray-900">
            <h2 className="text-lg font-bold text-gray-900">LABORATORY BILL</h2>
          </div>

          {/* Patient & Bill Details */}
          <div className="grid grid-cols-2 border-b border-gray-900">
            <div className="border-r border-gray-900 p-3">
              <h3 className="font-bold text-xs text-gray-900 mb-2">PATIENT DETAILS</h3>
              <div className="space-y-1 text-xs">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-gray-600">Name:</span>
                  <span className="col-span-2 font-medium text-gray-900">{patient?.name || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-gray-600">Age/Gender:</span>
                  <span className="col-span-2 font-medium text-gray-900">
                    {patient?.age || '-'} / {patient?.gender || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-gray-600">Phone:</span>
                  <span className="col-span-2 font-medium text-gray-900">{patient?.phoneNumber || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-gray-600">Address:</span>
                  <span className="col-span-2 font-medium text-gray-900">
                    {[patient?.addressLine1, patient?.city, patient?.state, patient?.pincode]
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3">
              <h3 className="font-bold text-xs text-gray-900 mb-2">BILL DETAILS</h3>
              <div className="space-y-1 text-xs">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-gray-600">Patient ID:</span>
                  <span className="col-span-2 font-medium text-gray-900">{patient?.id}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-gray-600">Bill No:</span>
                  <span className="col-span-2 font-medium text-gray-900">{bill.invoiceNumber}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-gray-600">Bill Date:</span>
                  <span className="col-span-2 font-medium text-gray-900">{formatDateTime(bill.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Services Table */}
          <div className="p-3">
            <h3 className="font-bold text-xs text-gray-900 mb-2">DETAILS</h3>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-1 px-2 text-gray-900 font-bold">Service Name</th>
                  <th className="text-right py-1 px-2 text-gray-900 font-bold">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {tests && tests.length > 0 ? (
                  tests.map((testItem, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="py-1 px-2 text-gray-900">{testItem.test?.name || "-"}</td>
                      <td className="text-right py-1 px-2 text-gray-900">₹{(parseFloat(testItem.test?.price || '0') || 0).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-3 px-2 text-center text-gray-600">
                      No tests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-gray-900 mt-2">
            <div className="flex justify-end p-3">
              <div className="w-64">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-900">Subtotal:</span>
                    <span className="text-gray-900 font-medium">₹{totalAmount.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-900">Discount ({bill.discount}%):</span>
                      <span className="text-red-600 font-medium">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-900">Tax ({bill.tax}%):</span>
                      <span className="text-gray-900 font-medium">+₹{taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-t-2 border-gray-900">
                    <span className="text-gray-900 font-bold text-sm">Bill Amount:</span>
                    <span className="text-gray-900 font-bold text-sm">₹{finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="border-t border-gray-900 p-3 bg-gray-50">
            <div className="text-xs">
              <span className="text-gray-600">In Words: </span>
              <span className="font-medium text-gray-900">
                {amountInWords} Only
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="border-t border-gray-900 p-3">
            <div className="text-xs text-gray-600 text-center">
              <p className="mb-1">This is a computer generated statement and requires no signature.</p>
              <p>For billing and general enquiries, please contact us.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-900 bg-gray-100 p-2 text-center text-xs text-gray-600">
            © {lab?.name || 'Lab Name'} {new Date().getFullYear()}. All Rights Reserved
          </div>
        </div>
      </div>
    </div>
  );
}
