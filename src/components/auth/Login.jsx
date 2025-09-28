import { useState } from 'react';
import { getErrorMessage } from '../../utils/errorUtils';
import { login } from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';

const Login = ({ onLogin, onForgotPassword, onSignUp }) => {
  const { login: authLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Call the actual login API
      const result = await login(formData.email, formData.password);
      console.log('Login successful:', result);

      // Extract token and user data from result
      const token = result.token || result.access_token || result.access || result.auth_token;
      const userData = {
        email: formData.email,
        atlasId: result.user?.atlas_id || result.atlas_id || formData.email.split('@')[0],
        businessVerificationStatus: result.user?.business_verification_status || result.business_verification_status || 'PENDING',
        fullName: result.user?.full_name || result.full_name,
        companyName: result.user?.company_name || result.company_name,
        ...result.user,
        ...result
      };

      // Update auth context
      if (token) {
        authLogin(token, userData);
      } else {
        // Use session-based token if no JWT token is provided
        authLogin('session_' + Date.now(), userData);
      }

      // Show success message
      setError('');

      // Show success alert with green styling
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-lg z-50';
      successDiv.innerHTML = `
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-800">Login successful!</p>
          </div>
        </div>
      `;
      document.body.appendChild(successDiv);

      // Remove the alert after 3 seconds
      setTimeout(() => {
        successDiv.remove();
      }, 3000);

      // Don't auto-navigate to dashboard - let user click dashboard button

      // Call onLogin callback if provided
      if (onLogin) {
        onLogin({ ...formData, loginResult: result });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(getErrorMessage(err) || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen flex flex-col lg:flex-row lg:items-center lg:justify-center p-4 pt-24 sm:pt-28 lg:pt-32">
      {/* Top Logo Section - Responsive */}
      <div className="absolute top-0 left-0 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center">
          <Logo height="h-12 sm:h-14 lg:h-16" to="/" />
          <div className="ml-3 sm:ml-4 text-xs sm:text-sm text-gray-600">
            <div>Maximize Growth, Minimize</div>
            <div>Costs. Find Your Customers</div>
            <div>Effortlessly with ATLAS-WD</div>
          </div>
        </div>
      </div>

      {/* Main Login Container - Responsive */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl w-full flex-1 lg:flex-none lg:h-auto">
        <div className="flex flex-col lg:flex-row lg:h-[500px]">
          {/* Left Side - Warehouse Image (hidden on mobile) */}
          <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gray-100 p-6">
            <div className="relative w-full h-full max-w-md">
              <img
                src="/images/warehouse.png"
                alt="Warehouse"
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  // Fallback to placeholder if image doesn't exist
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Fallback placeholder (hidden by default) */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-semibold rounded-lg" style={{display: 'none'}}>
                Warehouse Image
              </div>
            </div>
          </div>

          {/* Right Side - Login Form (full width on mobile) */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8 bg-white">
            <div className="w-full max-w-sm">

          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-base"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-base"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Forget Password?
              </button>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 lg:mt-6 flex flex-col sm:flex-row items-center justify-between text-sm space-y-2 sm:space-y-0">
            <button
              onClick={onForgotPassword}
              className="text-red-500 hover:text-red-600 font-medium"
            >
              Forget Password
            </button>
            <div className="text-gray-600 text-center sm:text-right">
              New User?{' '}
              <button
                onClick={onSignUp}
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Join Free
              </button>
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
