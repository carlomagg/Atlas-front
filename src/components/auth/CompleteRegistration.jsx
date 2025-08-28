import { useState } from 'react';
import AuthModal from './AuthModal';
import { completeRegistration, TITLE_OPTIONS, BUSINESS_TYPE_OPTIONS, COUNTRY_OPTIONS } from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';

const CompleteRegistration = ({ email, onComplete, onBack }) => {
  // We no longer auto-login after registration; keep hook if needed later
  // const { login: authLogin } = useAuth();
  // Track current step in the registration flow (2 = information, 3 = complete)
  const [currentStep, setCurrentStep] = useState(2);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: email || '',
    password: '',
    confirmPassword: '',
    country: 'NG',
    state: '',
    title: 'MR',
    fullName: '',
    companyName: '',
    phoneNumber: '',
    businessType: '',
    referralCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Use the API constants for consistency
  const countries = COUNTRY_OPTIONS;
  const titles = TITLE_OPTIONS;
  const businessTypes = BUSINESS_TYPE_OPTIONS;

  const benefits = [
    'Seamless Supply, Simply Reliable',
    'Easy Sourcing, Seamless Delivery',
    'Maximize Growth, Minimize Cost',
    'Connecting Buyers and Sellers'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 2) {
      if (!formData.password) newErrors.password = 'Password is required';
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.country) newErrors.country = 'Country is required';
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
      if (!formData.businessType) newErrors.businessType = 'Business type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    setErrors({});

    try {
      console.log('Submitting registration with data:', formData);

      if (!formData.email) {
        throw new Error('Email is required. Please go back and verify your email first.');
      }

      // Call the actual API endpoint
      const result = await completeRegistration(formData);

      console.log('Registration successful:', result);

      // Extract token and user data from result
      const token = result.token || result.access_token || result.access || result.auth_token;
      const userData = {
        email: formData.email,
        atlasId: result.user?.atlas_id || result.atlas_id || formData.email.split('@')[0],
        businessVerificationStatus: result.user?.business_verification_status || result.business_verification_status || 'PENDING',
        fullName: formData.fullName,
        companyName: formData.companyName,
        title: formData.title,
        country: formData.country,
        phoneNumber: formData.phoneNumber,
        businessType: formData.businessType,
        ...result.user,
        ...result
      };

      // Do NOT log the user in here. Registration should lead to login screen.
      // If needed, we could stash minimal info locally, but we avoid setting auth state.

      // Show success state with modern alert
      setIsSuccess(true);
      setCurrentStep(3);

      // Also show a floating success toast so it's visible regardless of layout
      try {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-lg z-50';
        toast.innerHTML = `
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-800">Registration successful! Redirecting to login...</p>
            </div>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      } catch (_) {
        // no-op if DOM unavailable
      }

      // Auto-redirect to Login after a brief delay so user sees the success alert
      if (onComplete) {
        setTimeout(() => {
          onComplete({ type: 'showLogin', from: 'registrationSuccess' });
        }, 2500);
      }

      // Call onComplete with the result
      if (onComplete) {
        onComplete({
          type: 'registration',
          data: { ...formData, registrationResult: result }
        });
      }

    } catch (err) {
      console.error('Registration error:', err);
      if (err.message.includes('verify your email') || err.message.includes('Email not found')) {
        setErrors({ 
          general: 'Please complete email verification first before proceeding with registration.' 
        });
        // Optionally go back to verification step
        if (onBack) {
          onBack();
        }
      } else {
        setErrors({ general: err.message || 'Registration failed. Please try again.' });
      }
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 1 ? 'bg-green-500 text-white' :
            step === currentStep ? 'bg-blue-600 text-white' :
            'bg-gray-300 text-gray-600'
          }`}>
            {step === 1 ? '✓' : step}
          </div>
          {step < 3 && (
            <div className={`w-16 h-0.5 mx-2 ${
              step < currentStep ? 'bg-green-500' : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepLabels = () => (
    <div className="flex justify-between text-xs text-gray-600 mb-8 max-w-xs mx-auto">
      <span className={currentStep >= 1 ? 'text-green-600' : ''}>Verification</span>
      <span className={currentStep >= 2 ? 'text-blue-600' : ''}>Information</span>
      <span className={currentStep >= 3 ? 'text-blue-600' : ''}>Complete</span>
    </div>
  );

  return (
    <AuthModal>
      <div className="max-w-2xl mx-auto bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Create Account</h2>

        <div className="mb-6 lg:mb-8">
          {renderStepIndicator()}
          {renderStepLabels()}
        </div>

        {isSuccess ? (
          <div className="text-center py-8">
            {/* Removed inline success alert to avoid duplication; keeping top-right toast only */}

            {/* Success Content */}
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Atlas-WD!</h3>
            <p className="text-gray-600 mb-8">
              Your account has been created successfully. You can now log in to access your account.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-4 max-w-xs mx-auto">
              <button
                onClick={() => onComplete && onComplete({ type: 'showLogin' })}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Log In to Your Account
              </button>
              <button
                onClick={() => onComplete && onComplete({ type: 'home' })}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Return to Homepage
              </button>
            </div>
          </div>
        ) : currentStep === 2 && (
          <div className="max-h-[60vh] overflow-y-auto">
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #cbd5e0;
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #a0aec0;
              }
            `}</style>
            <form className="space-y-4 lg:space-y-6 pb-4 custom-scrollbar">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email: {formData.email}
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 pr-12 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showConfirmPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Country/Region</label>
              <select
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>

            {/* Optional State */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">State <span className="text-gray-500">(Optional)</span></label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="e.g., Lagos"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
              <div className="flex space-x-2">
                <select
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-16 px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {titles.map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Joshua catty"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="+234"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Business Type</label>
              <select
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Please select</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.businessType && <p className="text-red-500 text-xs mt-1">{errors.businessType}</p>}
            </div>

            {/* Optional Referral Code */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Referral Code <span className="text-gray-500">(Optional)</span></label>
              <input
                type="text"
                value={formData.referralCode}
                onChange={(e) => handleInputChange('referralCode', e.target.value.trim())}
                placeholder="Enter referral code if you have one"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">If provided, it must belong to an agent whose link is paid, active, and not expired.</p>
            </div>

            {errors.general && (
              <div className="text-red-600 text-xs text-center">{errors.general}</div>
            )}

              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading || isSuccess}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Submitting...' : isSuccess ? 'Submitted!' : 'Submit'}
              </button>
            </form>
          </div>
        )}

        {onBack && !isSuccess && (
          <div className="mt-4 text-center flex-shrink-0">
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </AuthModal>
  );
};

export default CompleteRegistration;
