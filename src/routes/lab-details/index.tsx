import { createFileRoute } from '@tanstack/react-router';
import { Building2, FileText, Mail, MapPin, Phone } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/lab-details/')({
  component: LabDetails,
});

function LabDetails() {
  // This would normally fetch from an API
  const labData = {
    id: 1,
    name: 'Your Laboratory',
    registrationNumber: 'LAB-12345',
    email: 'contact@yourlaboratory.com',
    phone: '+91 9876543210',
    address: '123 Medical Street, Health City, HC 12345',
    city: 'Health City',
    state: 'HC',
    country: 'India',
    zipCode: '12345',
    licenseNumber: 'LIC-98765',
    licenseExpiryDate: '2025-12-31',
    totalEmployees: 15,
    testedSamples: 1250,
    averageTestTime: '24 hours',
    createdAt: '2024-01-15',
  };

  return (
    <Layout requiredRole="admin">
      <div className="container mx-auto py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Lab Details</h1>
          <p className="text-gray-600">Complete information about your laboratory </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2">
            {/* Basic Information Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                Basic Information 
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    Laboratory Name
                  </Label>
                  <p className="text-lg text-gray-900 font-semibold">{labData.name}</p>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number
                  </Label>
                  <p className="text-lg text-gray-900 font-semibold">
                    {labData.registrationNumber}
                  </p>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number
                  </Label>
                  <p className="text-lg text-gray-900 font-semibold">
                    {labData.licenseNumber}
                  </p>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    License Expiry Date
                  </Label>
                  <p className="text-lg text-gray-900 font-semibold">
                    {new Date(labData.licenseExpiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Contact Information
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email Address</p>
                    <p className="text-gray-900">{labData.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone Number</p>
                    <p className="text-gray-900">{labData.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Address</p>
                    <p className="text-gray-900">{labData.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Location Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </Label>
                  <p className="text-gray-900">{labData.city}</p>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </Label>
                  <p className="text-gray-900">{labData.state}</p>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </Label>
                  <p className="text-gray-900">{labData.country}</p>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code
                  </Label>
                  <p className="text-gray-900">{labData.zipCode}</p>
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Lab Statistics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Total Employees</p>
                  <p className="text-3xl font-bold text-blue-600">{labData.totalEmployees}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Tested Samples</p>
                  <p className="text-3xl font-bold text-green-600">{labData.testedSamples}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Average Test Time</p>
                  <p className="text-3xl font-bold text-purple-600">{labData.averageTestTime}</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Lab Since</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {new Date(labData.createdAt).getFullYear()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>

              <div className="space-y-3">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Edit Lab Details
                </Button>
                <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white">
                  Manage Documents
                </Button>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  View Reports
                </Button>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Staff Management
                </Button>
              </div>

              {/* License Status */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-900 mb-1">License Status</p>
                <p className="text-xs text-yellow-700">
                  Active until {new Date(labData.licenseExpiryDate).toLocaleDateString()}
                </p>
                <div className="mt-2 h-2 bg-yellow-200 rounded-full">
                  <div className="h-full w-3/4 bg-yellow-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
