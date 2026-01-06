/**
 * PDF Generation utility for bills and reports
 * Uses HTML to PDF conversion
 */

interface BillData {
  labName: string;
  labRegistration: string;
  labAddress?: string;
  labPhone?: string;
  patientName: string;
  patientAge?: number;
  patientPhone?: string;
  invoiceNumber: string;
  totalAmount: string;
  discount?: string;
  tax?: string;
  finalAmount: string;
  isPaid: boolean;
  createdAt: string;
  tests?: Array<{
    name: string;
    price: string;
  }>;
}

export const generateBillPDF = async (billData: BillData): Promise<void> => {
  try {
    // Create HTML content for the bill
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Bill - ${billData.invoiceNumber}</title>
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
              <p class="lab-name">${billData.labName}</p>
              <div class="lab-details">
                <div>Registration: ${billData.labRegistration || 'N/A'}</div>
                ${billData.labAddress ? `<div>Address: ${billData.labAddress}</div>` : ''}
                ${billData.labPhone ? `<div>Phone: ${billData.labPhone}</div>` : ''}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Bill Information</div>
              <div class="info-row">
                <span class="label">Invoice Number:</span>
                <span class="value">${billData.invoiceNumber}</span>
              </div>
              <div class="info-row">
                <span class="label">Date:</span>
                <span class="value">${new Date(billData.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Patient Information</div>
              <div class="info-row">
                <span class="label">Patient Name:</span>
                <span class="value">${billData.patientName}</span>
              </div>
              ${billData.patientAge ? `
              <div class="info-row">
                <span class="label">Age:</span>
                <span class="value">${billData.patientAge}</span>
              </div>
              ` : ''}
              ${billData.patientPhone ? `
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value">${billData.patientPhone}</span>
              </div>
              ` : ''}
            </div>

            ${billData.tests && billData.tests.length > 0 ? `
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
                  ${billData.tests.map(test => `
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
                <span class="total-value">₹${parseFloat(billData.totalAmount).toFixed(2)}</span>
              </div>
              ${billData.discount ? `
              <div class="total-row">
                <span class="total-label">Discount:</span>
                <span class="total-value">-₹${parseFloat(billData.discount).toFixed(2)}</span>
              </div>
              ` : ''}
              ${billData.tax ? `
              <div class="total-row">
                <span class="total-label">Tax:</span>
                <span class="total-value">+₹${parseFloat(billData.tax).toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="total-row final-amount">
                <span class="total-label">Total Amount:</span>
                <span class="total-value">₹${parseFloat(billData.finalAmount).toFixed(2)}</span>
              </div>
            </div>

            <div class="payment-status ${billData.isPaid ? 'paid' : 'unpaid'}">
              Payment Status: ${billData.isPaid ? 'PAID' : 'UNPAID'}
            </div>

            <div class="footer">
              <p>This is a computer-generated bill. No signature required.</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>

          <script>
            // Auto-print when loaded (optional)
            // window.print();
          </script>
        </body>
      </html>
    `;

    // Create a blob and download
    const blob = new Blob([htmlContent], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bill-${billData.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

/**
 * Alternative: Print-to-PDF using browser print dialog
 * Call this function and user can save as PDF from print dialog
 */
export const printBillAsPDF = (billData: BillData): void => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Bill - ${billData.invoiceNumber}</title>
        <style>
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .bill-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .lab-name {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .section-title {
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 8px;
            border: 1px solid #ddd;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
          }
        </style>
      </head>
      <body onload="window.print()">
        <div class="bill-container">
          <div class="header">
            <h1 class="lab-name">${billData.labName}</h1>
            <p>Reg: ${billData.labRegistration || 'N/A'}</p>
          </div>
          <p><strong>Invoice:</strong> ${billData.invoiceNumber}</p>
          <p><strong>Patient:</strong> ${billData.patientName}</p>
          <p><strong>Amount:</strong> ₹${parseFloat(billData.finalAmount).toFixed(2)}</p>
          <p><strong>Status:</strong> ${billData.isPaid ? 'PAID' : 'UNPAID'}</p>
        </div>
      </body>
    </html>
  `;

  const newWindow = window.open('', '', 'width=800,height=600');
  if (newWindow) {
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  }
};
