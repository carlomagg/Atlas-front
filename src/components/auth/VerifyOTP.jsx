import React, { useState, useEffect, useRef } from 'react';
import AuthModal from './AuthModal';
import { verifyOTP, verifyForgotPasswordOTP, resendOTP } from '../../services/authApi';

const VerifyOTP = ({ email, onContinue, onResend, onBack, flowType = 'registration' }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleInputChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    const newOtp = pastedData.split('').slice(0, 4);
    
    // Fill remaining slots with empty strings
    while (newOtp.length < 4) {
      newOtp.push('');
    }
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(val => val === '');
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 3;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 4) {
      setError('Please enter the complete 4-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Submitting OTP verification:', { email, otpCode, flowType });
      
      // Call the appropriate API endpoint based on flow type
      if (flowType === 'forgotPassword') {
        await verifyForgotPasswordOTP(email, otpCode);
      } else {
        const response = await verifyOTP(email, otpCode);
        console.log('Verification response:', response);
      }

      // OTP verified successfully
      if (onContinue) {
        onContinue({ email, otp: otpCode });
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Invalid verification code. Please try again.');
      // Clear OTP fields on error
      setOtp(['', '', '', '']);
      // Focus first input
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;

    setTimeLeft(30);
    setOtp(['', '', '', '']);
    setError('');

    try {
      if (flowType === 'registration') {
        await resendOTP(email);
      } else if (onResend) {
        await onResend();
      }
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AuthModal>
      <div className="flex flex-col justify-center min-h-[60vh] lg:min-h-[70vh]">
        <div className="max-w-md mx-auto w-full bg-white rounded-lg p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">Verification</h2>
            <p className="text-gray-600 text-sm lg:text-base">
              Enter your 4 digits code that you received on your email.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
            {/* OTP Input Fields */}
            <div className="flex justify-center space-x-2 sm:space-x-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  disabled={isLoading}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center">
              <span className="text-red-500 font-medium text-lg">{formatTime(timeLeft)}</span>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading || otp.join('').length !== 4}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
            >
              {isLoading ? 'Verifying...' : 'CONTINUE'}
            </button>
          </form>

          {/* Resend Option */}
          <div className="mt-4 lg:mt-6 text-center">
            <p className="text-gray-600 text-sm">
              If you didn't receive a code!{' '}
              <button
                onClick={handleResend}
                disabled={timeLeft > 0}
                className={`font-medium ${
                  timeLeft > 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-red-500 hover:text-red-600'
                }`}
              >
                Resend
              </button>
            </p>
          </div>

          {onBack && (
            <div className="mt-3 lg:mt-4 text-center">
              <button
                onClick={onBack}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthModal>
  );
};

export default VerifyOTP;
