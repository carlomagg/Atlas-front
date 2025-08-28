import React, { useState } from 'react';
import AuthModal from './AuthModal';
import { forgotPassword } from '../../services/authApi';

const RequestOTP = ({ onContinue, onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      // Call the actual API endpoint for forgot password
      await forgotPassword(email);

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

  return (
    <AuthModal>
      <div className="flex flex-col justify-center min-h-[60vh] lg:min-h-[70vh]">
        <div className="max-w-md mx-auto w-full bg-white rounded-lg p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">Forgot password</h2>
            <p className="text-gray-600 text-sm lg:text-base">
              Enter your email for the verification process, we will send 4 digits code to your email.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hannah.green@test.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-base"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
            >
              {isLoading ? 'Sending...' : 'CONTINUE'}
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
      </div>
    </AuthModal>
  );
};

export default RequestOTP;
