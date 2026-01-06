// Save as: /routes/lab-setup.tsx

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Building2, FileText, Mail, MapPin, Phone, Upload } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { setupLab } from '@/routes/apis/auth-apis';
import { toast } from '@/lib/toast';

export const Route = createFileRoute('/lab-setup')({
  component: LabSetup,
});

interface LabSetupFormData {
  name: string;
  registrationNumber: string;
  addressLine1?: string;
  gstinNumber?: string;
  state?: string;
  country?: string;
  pincode?: number;
  phoneNumber?: number;
  email?: string;
  photoDocument?: string;
}

function LabSetup() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LabSetupFormData>();

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: LabSetupFormData) => {
    try {
      setErrorMessage('');
      
      const submitData = {
        ...data,
        photoDocument: photoPreview || undefined,
      };

      const result = await setupLab({ data: submitData });

      if (result.success) {
        toast.success('Lab setup completed successfully!');
        // Redirect to lab management after successful setup
        navigate({ to: '/lab-management' });
      } else {
        setErrorMessage(result.error || 'Lab setup failed. Please try again.');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lab setup failed. Please try again.';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Lab Setup
            </h1>
            <p className="text-gray-600">
              Please provide your laboratory details to get started
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Lab Name */}
            <div>
              <Label className="block text-sm font-semibold text-gray-900 mb-2">
                Laboratory Name *
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  {...register('name', {
                    required: 'Lab name is required',
                    minLength: {
                      value: 2,
                      message: 'Lab name must be at least 2 characters',
                    },
                  })}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter laboratory name"
                />
              </div>
              {errors.name && (
                <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Registration Number */}
            <div>
              <Label className="block text-sm font-semibold text-gray-900 mb-2">
                Registration Number *
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  {...register('registrationNumber', {
                    required: 'Registration number is required',
                  })}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter registration number"
                />
              </div>
              {errors.registrationNumber && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.registrationNumber.message}
                </p>
              )}
            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* GSTIN Number */}
              <div>
                <Label className="block text-sm font-semibold text-gray-900 mb-2">
                  GSTIN Number
                </Label>
                <input
                  type="text"
                  {...register('gstinNumber')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter GSTIN"
                />
              </div>

              {/* Phone Number */}
              <div>
                <Label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    {...register('phoneNumber', { valueAsNumber: true })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <Label className="block text-sm font-semibold text-gray-900 mb-2">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <Label className="block text-sm font-semibold text-gray-900 mb-2">
                Address
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  {...register('addressLine1')}
                  rows={3}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter laboratory address"
                />
              </div>
            </div>

            {/* Three Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* State */}
              <div>
                <Label className="block text-sm font-semibold text-gray-900 mb-2">
                  State
                </Label>
                <input
                  type="text"
                  {...register('state')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="State"
                />
              </div>

              {/* Country */}
              <div>
                <Label className="block text-sm font-semibold text-gray-900 mb-2">
                  Country
                </Label>
                <input
                  type="text"
                  {...register('country')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Country"
                />
              </div>

              {/* Pincode */}
              <div>
                <Label className="block text-sm font-semibold text-gray-900 mb-2">
                  Pincode
                </Label>
                <input
                  type="number"
                  {...register('pincode', { valueAsNumber: true })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Pincode"
                />
              </div>
            </div>

            {/* Lab Registration Document / Photo */}
            <div>
              <Label className="block text-sm font-semibold text-gray-900 mb-2">
                Lab Registration Document / Photo
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="photo-input"
                />
                <label htmlFor="photo-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, or PDF (Max 5MB)
                  </p>
                </label>
              </div>

              {/* Photo Preview */}
              {photoPreview && (
                <div className="mt-4 relative">
                  <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {photoPreview.includes('pdf') ? (
                      <div className="flex items-center justify-center h-full text-gray-600">
                        <FileText className="w-8 h-8 mr-2" />
                        PDF Document Uploaded
                      </div>
                    ) : (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      const input = document.getElementById('photo-input') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove Document
                  </button>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This information will be used for all your laboratory's
                reports, bills, and official documents. You can update these details later
                from the settings.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl text-lg"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Setting up laboratory...
                </span>
              ) : (
                'Complete Setup & Continue'
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Need help? Contact support at{' '}
            <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LabSetup;
