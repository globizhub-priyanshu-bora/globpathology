import { createFileRoute, redirect } from '@tanstack/react-router';
import { Activity, Eye, EyeOff, Lock, Mail, Phone, TestTube, TestTubeDiagonal, TestTubes, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  getCurrentUser,
  loginUser,
  registerUser,
} from '@/routes/apis/auth-apis';

export const Route = createFileRoute('/')({
  component: AuthPage,
  beforeLoad: async () => {
    const result = await getCurrentUser();
    
    if (result.success && result.user) {
      if (!result.user.hasCompletedSetup || !result.user.labId) {
        throw redirect({ to: '/lab-setup' });
      } else {
        throw redirect({ to: '/lab-management' });
      }
    }
  },
});

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
}

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: errorsLogin, isSubmitting: isSubmittingLogin },
    reset: resetLogin,
  } = useForm<LoginFormData>();

  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    formState: { errors: errorsSignup, isSubmitting: isSubmittingSignup },
    reset: resetSignup,
    watch,
  } = useForm<RegisterFormData>();

  const onLogin = async (data: LoginFormData) => {
    try {
      setErrorMessage('');
      const response = await loginUser({ data });

      let result: any;
      if (response instanceof Response) {
        result = await response.json();
      } else {
        result = response;
      }

      if (result.success) {
        if (!result.user.hasCompletedSetup || !result.user.labId) {
          window.location.href = '/lab-setup';
        } else {
          window.location.href = '/lab-management';
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Login failed. Please try again.'
      );
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      
      const phoneNumber = data.phoneNumber ? parseInt(data.phoneNumber.replace(/\D/g, '')) : undefined;
      
      const result = await registerUser({
        data: {
          ...data,
          phoneNumber,
        },
      });

      if (result.success) {
        setSuccessMessage(
          'Registration successful! Please login to complete lab setup.'
        );
        resetSignup();
        setShowPassword(false);
        setShowConfirmPassword(false);
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMessage('');
        }, 2000);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Registration failed. Please try again.'
      );
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setErrorMessage('');
    setSuccessMessage('');
    resetLogin();
    resetSignup();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-100 rounded-xl shadow-2xl p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-300 rounded-2xl mb-4">
              <TestTubes className="w-8 h-8 text-gray-800" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h1>
            <p className="text-sm text-gray-600">
              {isLogin ? 'Sign in to your lab dashboard' : 'Create your lab account'}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleSubmitLogin(onLogin)} className="space-y-5">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    {...registerLogin('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="admin@lab.com"
                  />
                </div>
                {errorsLogin.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errorsLogin.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="block text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <button
                    type="button"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...registerLogin('password', {
                      required: 'Password is required',
                    })}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder:text-gray-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errorsLogin.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errorsLogin.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmittingLogin}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md  transition-all"
              >
                {isSubmittingLogin ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSubmitSignup(onRegister)} className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    {...registerSignup('name', {
                      required: 'Name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters',
                      },
                    })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder:text-gray-400"
                    placeholder="John Doe"
                  />
                </div>
                {errorsSignup.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errorsSignup.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    {...registerSignup('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="your.email@example.com"
                  />
                </div>
                {errorsSignup.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errorsSignup.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    {...registerSignup('phoneNumber')}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...registerSignup('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
                        message:
                          'Password must contain uppercase, lowercase, number, and special character',
                      },
                    })}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder:text-gray-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errorsSignup.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errorsSignup.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...registerSignup('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === watch('password') || 'Passwords do not match',
                    })}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errorsSignup.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errorsSignup.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs text-gray-700">
                  <strong>Note:</strong> After registration, you'll be prompted to complete 
                  your lab setup with details like registration number, address, etc.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmittingSignup}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-all"
              >
                {isSubmittingSignup ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          )}

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "New to GlobPathology?" : 'Already have an account?'}
              <button
                onClick={switchMode}
                type="button"
                className="ml-1 text-gray-900 font-semibold hover:text-gray-700 transition-colors"
              >
                {isLogin ? 'Create an account' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}