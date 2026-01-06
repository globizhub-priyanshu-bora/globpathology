import { createFileRoute } from '@tanstack/react-router';
import { 
  TrendingUp, Users, DollarSign, CheckCircle, Clock, AlertCircle,
  Mail, Phone, Badge, Eye, EyeOff
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/routes/apis/auth-apis';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await getCurrentUser();
        if (result.success && result.user) {
          setUser(result.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-700">Loading your information...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-gray-700">No user data available. Please login again.</p>
        </div>
      </Layout>
    );
  }

  const mockPassword = '••••••••';

  return (
    <Layout>
      <div className="min-h-screen bg-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Welcome Section */}
          <div className="mb-8 border-b-2 border-black pb-6">
            <h1 className="text-5xl font-bold text-black mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-lg text-gray-700">
              Here's your dashboard overview and account information
            </p>
          </div>

          {/* User Information Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-2 border-black">
            <h2 className="text-2xl font-bold text-black mb-8 border-b-2 border-gray-300 pb-4">Your Account Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Name */}
              <div className="bg-gray-100 rounded-lg p-6 border border-gray-400">
                <div className="flex items-center gap-4">
                  <div className="bg-black text-white p-3 rounded-lg">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Full Name</p>
                    <p className="text-2xl font-bold text-black">{user?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="bg-gray-100 rounded-lg p-6 border border-gray-400">
                <div className="flex items-center gap-4">
                  <div className="bg-black text-white p-3 rounded-lg">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Email Address</p>
                    <p className="text-2xl font-bold text-black break-all">{user?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="bg-gray-100 rounded-lg p-6 border border-gray-400">
                <div className="flex items-center gap-4">
                  <div className="bg-black text-white p-3 rounded-lg">
                    <Badge className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Your Role</p>
                    <p className="text-2xl font-bold text-black capitalize">
                      {user?.isAdmin ? 'Administrator' : user?.role?.replace(/_/g, ' ') || 'User'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-gray-100 rounded-lg p-6 border border-gray-400 md:col-span-1">
                <div className="flex items-center gap-4">
                  <div className="bg-black text-white p-3 rounded-lg">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Phone Number</p>
                    <p className="text-2xl font-bold text-black">
                      {user?.phoneNumber ? user.phoneNumber : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Dashboard */}
          <div>
            <h2 className="text-3xl font-bold text-black mb-6 border-b-2 border-gray-300 pb-4">Medical Lab Analytics</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Sales */}
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-black">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-semibold mb-1">Total Sales</p>
                    <p className="text-3xl font-bold text-black">₹45,230</p>
                    <p className="text-gray-600 text-sm font-semibold mt-2">↑ 12% from last month</p>
                  </div>
                  <div className="bg-gray-200 p-4 rounded-lg">
                    <DollarSign className="w-8 h-8 text-black" />
                  </div>
                </div>
              </div>

              {/* Total Patients */}
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-black">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-semibold mb-1">Total Patients</p>
                    <p className="text-3xl font-bold text-black">328</p>
                    <p className="text-gray-600 text-sm font-semibold mt-2">↑ 8% from last month</p>
                  </div>
                  <div className="bg-gray-200 p-4 rounded-lg">
                    <Users className="w-8 h-8 text-black" />
                  </div>
                </div>
              </div>

              {/* Completed Tests */}
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-black">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-semibold mb-1">Completed Tests</p>
                    <p className="text-3xl font-bold text-black">562</p>
                    <p className="text-gray-600 text-sm font-semibold mt-2">↑ 15% from last month</p>
                  </div>
                  <div className="bg-gray-200 p-4 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-black" />
                  </div>
                </div>
              </div>

              {/* Pending Tests */}
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-black">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-semibold mb-1">Pending Tests</p>
                    <p className="text-3xl font-bold text-black">47</p>
                    <p className="text-gray-600 text-sm font-semibold mt-2">⚠ Needs attention</p>
                  </div>
                  <div className="bg-gray-200 p-4 rounded-lg">
                    <Clock className="w-8 h-8 text-black" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Revenue Trend */}
              <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-black">
                <h3 className="text-lg font-bold text-black mb-6">Revenue Trend</h3>
                <div className="h-64 bg-gray-100 rounded-lg flex items-end justify-around px-4 py-6 gap-2 border border-gray-300">
                  {[45, 52, 48, 65, 58, 72, 68, 75, 82, 88, 85, 92].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-black rounded-t-lg hover:shadow-lg transition-shadow"
                      style={{ height: `${(height / 100) * 200}px` }}
                    />
                  ))}
                </div>
                <p className="text-gray-700 text-sm mt-4 text-center">Monthly Revenue Growth</p>
              </div>

              {/* Test Distribution */}
              <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-black">
                <h3 className="text-lg font-bold text-black mb-6">Test Distribution</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Blood Tests', value: 45 },
                    { label: 'Pathology Tests', value: 28 },
                    { label: 'Radiology', value: 18 },
                    { label: 'Ultrasound', value: 9 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-800 font-semibold">{item.label}</p>
                        <p className="text-black font-bold">{item.value}%</p>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full transition-all"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Efficiency Card */}
              <div className="bg-black rounded-lg shadow-lg p-6 text-white border-2 border-gray-800">
                <TrendingUp className="w-8 h-8 mb-4 opacity-90" />
                <h3 className="text-lg font-bold mb-2">Lab Efficiency</h3>
                <p className="text-3xl font-bold mb-2">94%</p>
                <p className="text-gray-300">Tests completed on time</p>
              </div>

              {/* Customer Satisfaction */}
              <div className="bg-black rounded-lg shadow-lg p-6 text-white border-2 border-gray-800">
                <Users className="w-8 h-8 mb-4 opacity-90" />
                <h3 className="text-lg font-bold mb-2">Satisfaction Rate</h3>
                <p className="text-3xl font-bold mb-2">98%</p>
                <p className="text-gray-300">Customer satisfaction score</p>
              </div>

              {/* Average Processing Time */}
              <div className="bg-black rounded-lg shadow-lg p-6 text-white border-2 border-gray-800">
                <Clock className="w-8 h-8 mb-4 opacity-90" />
                <h3 className="text-lg font-bold mb-2">Avg Processing</h3>
                <p className="text-3xl font-bold mb-2">2.4h</p>
                <p className="text-gray-300">Average test processing time</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4 justify-center pt-8 border-t-2 border-gray-300">
            <a href="/patients/register">
              <Button className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold">
                Register New Patient
              </Button>
            </a>
            <a href="/lab-management">
              <Button className="bg-gray-700 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold">
                Go to Lab Management
              </Button>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
