import React, { useState } from 'react';
import AuthModal from './AuthModal';
import { registerInitial } from '../../services/authApi';

const SignupEmailVerification = ({ onContinue, onBack, referralCode }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const benefits = [
    'Seamless Supply, Simply Reliable',
    'Easy Sourcing, Seamless Delivery',
    'Maximize Growth, Minimize Cost',
    'Connecting Buyers and Sellers'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the actual API endpoint
      await registerInitial(email);

      // Call parent component's continue function
      if (onContinue) {
        onContinue({ email });
      }
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      {/* Step circles */}
      <div className="flex items-center justify-center mb-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 1 ? 'bg-green-500 text-white' :
              'bg-gray-300 text-gray-600'
            }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-20 h-0.5 mx-3 ${
                step < 1 ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex justify-between text-sm text-gray-600 max-w-sm mx-auto px-4">
        <span className="text-green-600 font-medium">Verification</span>
        <span>Information</span>
        <span>Complete</span>
      </div>
    </div>
  );

  return (
    <AuthModal>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
        {/* Left Column - Form */}
        <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 lg:mb-8">Create Account</h2>

          {renderStepIndicator()}

          {/* Referral Code Indicator */}
          {referralCode && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  🎉 You're registering with referral code: <span className="font-mono font-bold">{referralCode}</span>
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Complete registration to connect with your referring agent!
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Joshua@gmail.com"
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

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
            >
              {isLoading ? 'Sending...' : 'Next'}
            </button>
          </form>

          {onBack && (
            <div className="mt-4 lg:mt-6 text-center">
              <button
                onClick={onBack}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Back to Login
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Benefits (hidden on mobile, shown on lg+) */}
        <div className="hidden lg:flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Why register with us?</h3>

          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 text-base">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Benefits Section - shown only on mobile */}
        <div className="lg:hidden bg-gray-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Why register with us?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-4 h-4 mt-0.5">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthModal>
  );
};

export default SignupEmailVerification;
