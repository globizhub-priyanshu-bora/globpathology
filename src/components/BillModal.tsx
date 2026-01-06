import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/toast';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  billData?: {
    bill: any;
    patient: any;
    tests: Array<{ test?: any; patientTest?: any; doctor?: any }>;
  };
}

export function BillModal({ isOpen, onClose, billData }: BillModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !billData) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const handleDownloadPDF = () => {
    toast.success('PDF download feature coming soon');
  };

  const calculateTotal = () => {
    return billData.tests.reduce((sum, item) => {
      return sum + (item.test ? parseFloat(item.test.price || 0) : 0);
    }, 0);
  };

  const total = calculateTotal();
  const discount = parseFloat(billData.bill?.discount || 0);
  const tax = parseFloat(billData.bill?.tax || 0);
  const discountAmount = (total * discount) / 100;
  const taxAmount = ((total - discountAmount) * tax) / 100;
  const finalAmount = total - discountAmount + taxAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Invoice</h2>
            <p className="text-blue-100 text-sm">Invoice #: {billData.bill?.invoiceNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Lab & Patient Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">LAB INFORMATION</h3>
              <p className="font-bold text-gray-900">Your Laboratory</p>
              <p className="text-sm text-gray-600">Registration: LAB-12345</p>
              <p className="text-sm text-gray-600">Phone: +91 9876543210</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">PATIENT INFORMATION</h3>
              <p className="font-bold text-gray-900">{billData.patient?.name}</p>
              <p className="text-sm text-gray-600">Phone: {billData.patient?.phoneNumber}</p>
              <p className="text-sm text-gray-600">Age: {billData.patient?.age || 'N/A'} | Gender: {billData.patient?.gender || 'N/A'}</p>
            </div>
          </div>

          {/* Tests Table */}
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden mb-8">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Test Name</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-900">Price</th>
                </tr>
              </thead>
              <tbody>
                {billData.tests && billData.tests.length > 0 ? (
                  billData.tests.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-900">{item.test?.name || 'N/A'}</td>
                      <td className="px-6 py-3 text-right text-gray-900">‚Çπ{item.test?.price || '0.00'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                      No tests selected
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bill Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-full max-w-xs border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
              <div className="space-y-3">
                <div className="flex justify-between text-gray-900">
                  <span className="font-semibold">Subtotal:</span>
                  <span>‚Çπ{total.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span className="font-semibold">Discount ({discount}%):</span>
                    <span>-‚Çπ{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-semibold">Tax ({tax}%):</span>
                    <span>+‚Çπ{taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Amount:</span>
                    <span>‚Çπ{finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className={`p-4 rounded-lg mb-6 ${
            billData.bill?.isPaid 
              ? 'bg-green-50 border-2 border-green-300' 
              : 'bg-yellow-50 border-2 border-yellow-300'
          }`}>
            <p className={`font-semibold ${
              billData.bill?.isPaid 
                ? 'text-green-700' 
                : 'text-yellow-700'
            }`}>
              Payment Status: {billData.bill?.isPaid ? '‚úì PAID' : '‚è≥ UNPAID'}
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 border-t border-gray-300 pt-4 mb-6">
            <p>Thank you for using our laboratory services!</p>
            <p className="text-xs mt-2">Generated on: {new Date().toLocaleString()}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end print:hidden">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              Ì≥• Download PDF
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {isPrinting ? 'Processing...' : 'Ì∂®Ô∏è Print'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
