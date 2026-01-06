import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AlertCircle, ArrowLeft, Download, Printer } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { printBillAsPDF } from '@/lib/pdf-generator';
import { toast } from '@/lib/toast';
import { getBillById } from '@/routes/apis/bill-apis';
import { getLabInfo } from '@/routes/apis/lab-apis';

export const Route = createFileRoute('/bills/bill/$id')({
  component: () => (
    <Layout requiredRole={['admin', 'cashier', 'lab_tech']}>
      <BillDetailPage />
    </Layout>
  ),
  loader: async ({ params }: { params: { id: string } }) => {
    try {
      const billResult = await getBillById({
        data: { id: parseInt(params.id) },
      });
      
      const labInfo = await getLabInfo();
      
      return { ...billResult, lab: labInfo?.data };
    } catch (error) {
      console.error('Error fetching bill:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch bill' };
    }
  },
});

function BillDetailPage() {
  const loaderData = Route.useLoaderData();
  const navigate = useNavigate();

  if (!loaderData.success || !loaderData.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-700 mb-4">Bill not found</p>
          <p className="text-sm text-gray-600 mb-6">{loaderData.error || 'Unable to load the requested bill'}</p>
          <Button onClick={() => navigate({ to: '/lab-management' })}>
            Back to Lab Management
          </Button>
        </div>
      </div>
    );
  }

  const { bill, patient, tests } = loaderData.data;
  const labInfo = loaderData.lab;

  const handlePrint = () => {
    const printContent = document.getElementById('bill-print-content');
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${bill.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
            @page { size: A4; margin: 15mm; }
            @media print { body { margin: 0; } }
            .container { width: 100%; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .lab-name { font-size: 20px; font-weight: bold; }
            .bill-title { font-size: 16px; font-weight: bold; margin-top: 10px; }
            .section { margin-bottom: 15px; }
            .section-title { font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .amount-words { margin: 10px 0; font-style: italic; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = async () => {
    try {
      // Format bill data for PDF
      const billDataForPDF = {
        labName: labInfo?.name || 'Laboratory',
        labRegistration: labInfo?.registrationNumber || '',
        labAddress: labInfo?.address || '',
        labPhone: labInfo?.contactPhone || '',
        patientName: patient?.name || 'N/A',
        patientAge: patient?.age || undefined,
        patientPhone: patient?.phone || undefined,
        invoiceNumber: bill.invoiceNumber,
        totalAmount: bill.totalAmount?.toString() || '0',
        discount: bill.discount?.toString() || '0',
        tax: bill.tax?.toString() || '0',
        finalAmount: bill.finalAmount?.toString() || '0',
        isPaid: bill.isPaid || false,
        createdAt: bill.createdAt?.toString() || new Date().toISOString(),
        tests: tests?.map((test: any) => ({
          name: test.test?.name || test.testName || test.name || 'Test',
          price: (test.test?.price || test.price)?.toString() || '0',
        })) || [],
      };

      // Create HTML for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Bill - ${billDataForPDF.invoiceNumber}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
              }
              .bill-container {
                max-width: 800px;
                margin: 0 auto;
                background-color: white;
                padding: 40px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              .header {
                border-bottom: 3px solid #333;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .lab-name {
                font-size: 28px;
                font-weight: bold;
                color: #333;
                margin: 0;
              }
              .lab-details {
                font-size: 12px;
                color: #666;
                margin-top: 5px;
              }
              .section {
                margin-bottom: 20px;
              }
              .section-title {
                font-weight: bold;
                font-size: 14px;
                color: #333;
                margin-bottom: 10px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                font-size: 13px;
                margin-bottom: 8px;
              }
              .label {
                font-weight: 600;
                color: #555;
                width: 150px;
              }
              .value {
                color: #333;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              th {
                background-color: #f0f0f0;
                padding: 10px;
                text-align: left;
                font-weight: bold;
                border-bottom: 2px solid #333;
                font-size: 12px;
              }
              td {
                padding: 10px;
                border-bottom: 1px solid #ddd;
                font-size: 12px;
              }
              .totals {
                width: 100%;
                margin-top: 20px;
                border-top: 2px solid #333;
                padding-top: 15px;
              }
              .total-row {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 10px;
                font-size: 13px;
              }
              .total-label {
                width: 150px;
                font-weight: 600;
              }
              .total-value {
                width: 100px;
                text-align: right;
              }
              .final-amount {
                font-size: 18px;
                font-weight: bold;
                color: #2c5282;
                background-color: #f0f7ff;
                padding: 10px;
                border-radius: 5px;
              }
              .payment-status {
                margin-top: 20px;
                padding: 10px;
                border-radius: 5px;
                font-weight: bold;
              }
              .paid {
                background-color: #d4edda;
                color: #155724;
              }
              .unpaid {
                background-color: #f8d7da;
                color: #721c24;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                text-align: center;
                font-size: 11px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="bill-container">
              <div class="header">
                <p class="lab-name">${billDataForPDF.labName}</p>
                <div class="lab-details">
                  <div>Registration: ${billDataForPDF.labRegistration || 'N/A'}</div>
                  ${billDataForPDF.labAddress ? `<div>Address: ${billDataForPDF.labAddress}</div>` : ''}
                  ${billDataForPDF.labPhone ? `<div>Phone: ${billDataForPDF.labPhone}</div>` : ''}
                </div>
              </div>

              <div class="section">
                <div class="section-title">Bill Information</div>
                <div class="info-row">
                  <span class="label">Invoice Number:</span>
                  <span class="value">${billDataForPDF.invoiceNumber}</span>
                </div>
                <div class="info-row">
                  <span class="label">Date:</span>
                  <span class="value">${new Date(billDataForPDF.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Patient Information</div>
                <div class="info-row">
                  <span class="label">Patient Name:</span>
                  <span class="value">${billDataForPDF.patientName}</span>
                </div>
                ${billDataForPDF.patientAge ? `
                <div class="info-row">
                  <span class="label">Age:</span>
                  <span class="value">${billDataForPDF.patientAge}</span>
                </div>
                ` : ''}
                ${billDataForPDF.patientPhone ? `
                <div class="info-row">
                  <span class="label">Phone:</span>
                  <span class="value">${billDataForPDF.patientPhone}</span>
                </div>
                ` : ''}
              </div>

              ${billDataForPDF.tests && billDataForPDF.tests.length > 0 ? `
              <div class="section">
                <div class="section-title">Tests</div>
                <table>
                  <thead>
                    <tr>
                      <th>Test Name</th>
                      <th style="text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${billDataForPDF.tests.map(test => `
                      <tr>
                        <td>${test.name}</td>
                        <td style="text-align: right;">₹${parseFloat(test.price).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ` : ''}

              <div class="totals">
                <div class="total-row">
                  <span class="total-label">Subtotal:</span>
                  <span class="total-value">₹${parseFloat(billDataForPDF.totalAmount).toFixed(2)}</span>
                </div>
                ${billDataForPDF.discount ? `
                <div class="total-row">
                  <span class="total-label">Discount:</span>
                  <span class="total-value">-₹${parseFloat(billDataForPDF.discount).toFixed(2)}</span>
                </div>
                ` : ''}
                ${billDataForPDF.tax ? `
                <div class="total-row">
                  <span class="total-label">Tax:</span>
                  <span class="total-value">+₹${parseFloat(billDataForPDF.tax).toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="total-row final-amount">
                  <span class="total-label">Total Amount:</span>
                  <span class="total-value">₹${parseFloat(billDataForPDF.finalAmount).toFixed(2)}</span>
                </div>
              </div>

              <div class="payment-status ${billDataForPDF.isPaid ? 'paid' : 'unpaid'}">
                Payment Status: ${billDataForPDF.isPaid ? 'PAID' : 'UNPAID'}
              </div>

              <div class="footer">
                <p>This is a computer-generated bill. No signature required.</p>
                <p>Generated on ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Create PDF using print dialog
      const newWindow = window.open('', '', 'width=800,height=600');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        
        // Trigger save as PDF from print dialog
        setTimeout(() => {
          newWindow.print();
          toast.success('PDF download started. Use "Save as PDF" in the print dialog.');
        }, 100);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

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
      second: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate({ to: '/lab-management' })}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Bill Details</h1>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Bill Content */}
        <div id="bill-print-content" className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8 border-b border-gray-300 pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{labInfo?.name || 'Laboratory'}</h1>
            <p className="text-sm text-gray-600">{labInfo?.address || 'Laboratory Address'}</p>
            <p className="text-sm text-gray-600">Registration: {labInfo?.registrationNumber || 'N/A'}</p>
            <p className="text-sm text-gray-600">Phone: {labInfo?.contactPhone || 'N/A'}</p>
            <h2 className="text-xl font-semibold text-gray-900 mt-4">BILL / INVOICE</h2>
          </div>

          {/* Bill Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Bill Information</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-gray-700">Invoice Number:</span>
                  <span className="text-gray-900 ml-2">{bill.invoiceNumber}</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700">Date:</span>
                  <span className="text-gray-900 ml-2">{formatDate(bill.createdAt)}</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700">Time:</span>
                  <span className="text-gray-900 ml-2">{formatTime(bill.createdAt)}</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Patient Information</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="text-gray-900 ml-2">{patient?.name || '-'}</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700">Age:</span>
                  <span className="text-gray-900 ml-2">{patient?.age || '-'}</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <span className="text-gray-900 ml-2">{patient?.phone || '-'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Tests Table */}
          {tests && tests.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Tests</h3>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Test Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-right font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{test.test?.name || test.testName || test.name}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">₹{parseFloat(test.test?.price || test.price || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="border-t-2 border-gray-300 pt-4 mb-6">
            <div className="flex justify-end mb-2">
              <span className="font-medium text-gray-700 w-40">Subtotal:</span>
              <span className="text-gray-900 w-24 text-right">₹{parseFloat(bill.totalAmount || 0).toFixed(2)}</span>
            </div>
            {bill.discount && bill.discount > 0 && (
              <div className="flex justify-end mb-2">
                <span className="font-medium text-gray-700 w-40">Discount:</span>
                <span className="text-gray-900 w-24 text-right">-₹{parseFloat(bill.discount).toFixed(2)}</span>
              </div>
            )}
            {bill.tax && bill.tax > 0 && (
              <div className="flex justify-end mb-2">
                <span className="font-medium text-gray-700 w-40">Tax:</span>
                <span className="text-gray-900 w-24 text-right">+₹{parseFloat(bill.tax).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-end border-t border-gray-300 pt-2">
              <span className="font-bold text-gray-900 w-40">Total Amount:</span>
              <span className="text-lg font-bold text-blue-600 w-24 text-right">₹{parseFloat(bill.finalAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Status */}
          <div className={`p-4 rounded-lg font-semibold text-center mb-6 ${bill.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Payment Status: {bill.isPaid ? 'PAID' : 'UNPAID'}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 pt-4 text-center text-xs text-gray-600">
            <p>This is a computer-generated bill. No signature required.</p>
            <p>Generated on {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
