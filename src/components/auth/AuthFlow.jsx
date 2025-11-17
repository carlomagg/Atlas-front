import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Login from './Login';
import RequestOTP from './RequestOTP';
import VerifyOTP from './VerifyOTP';
import NewPassword from './NewPassword';
import CompleteRegistration from './CompleteRegistration';
import SignupEmailVerification from './SignupEmailVerification';

const AuthFlow = ({ onAuthComplete, initialStep = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [authData, setAuthData] = useState({});
  const [referralCode, setReferralCode] = useState('');

  // Navigation handlers
  const handleLogin = (loginData) => {
    console.log('Login successful:', loginData);
    if (onAuthComplete) {
      onAuthComplete({ type: 'login', data: loginData });
    }
    
    // Check if user was redirected from a protected route (like dashboard)
    const from = location.state?.from?.pathname;
    if (from && from !== '/login') {
      // Redirect back to the dashboard page they were trying to access
      navigate(from, { replace: true });
    } else {
      // Default redirect to landing page for direct login
      navigate('/');
    }
  };

  const handleForgotPassword = () => {
    setCurrentStep('requestOTP');
  };

  const handleSignUp = () => {
    setCurrentStep('requestOTPSignup');
  };

  // Handle initial step setup and referral code capture
  useEffect(() => {
    if (initialStep === 'signup') {
      setCurrentStep('requestOTPSignup');
    }

    // Capture referral code from URL parameter (?ref=CODE)
    const urlParams = new URLSearchParams(location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      setReferralCode(refCode);
      // Store in localStorage for persistence across page refreshes during this registration session
      localStorage.setItem('referralCode', refCode);
      console.log('Referral code captured from URL:', refCode);
    } else {
      // If no referral code in URL, clear any existing referral code
      // This ensures fresh registration attempts don't inherit old referral codes
      setReferralCode('');
      localStorage.removeItem('referralCode');
      console.log('No referral code in URL, cleared any existing referral code');
    }
  }, [initialStep, location.search]);

  const handleRequestOTPContinue = (data) => {
    setAuthData(prev => ({ ...prev, email: data.email }));
    if (currentStep === 'requestOTP') {
      setCurrentStep('verifyOTPPassword');
    } else {
      setCurrentStep('verifyOTPSignup');
    }
  };

  const handleVerifyOTPContinue = (data) => {
    setAuthData(prev => ({ ...prev, ...data }));
    if (currentStep === 'verifyOTPPassword') {
      setCurrentStep('newPassword');
    } else {
      setCurrentStep('completeRegistration');
    }
  };

  const handleNewPasswordComplete = (data) => {
    console.log('Password reset successful:', data);
    if (onAuthComplete) {
      onAuthComplete({ type: 'passwordReset', data });
    }
  };

  const handleRegistrationComplete = (data) => {
    console.log('Registration complete:', data);
    // Clear referral code from localStorage after successful registration
    localStorage.removeItem('referralCode');
    setReferralCode('');
    
    if (data.type === 'showLogin') {
      setCurrentStep('login');
    } else if (data.type === 'home') {
      if (onAuthComplete) {
        onAuthComplete({ type: 'home' });
      }
    } else {
      if (onAuthComplete) {
        onAuthComplete({ type: 'registration', data });
      }
    }
  };

  const handleResendOTP = async () => {
    // Simulate resending OTP
    console.log('Resending OTP to:', authData.email);
    // In a real app, you would make an API call here
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'requestOTP':
      case 'requestOTPSignup':
        setCurrentStep('login');
        break;
      case 'verifyOTPPassword':
        setCurrentStep('requestOTP');
        break;
      case 'verifyOTPSignup':
        setCurrentStep('requestOTPSignup');
        break;
      case 'newPassword':
        setCurrentStep('verifyOTPPassword');
        break;
      case 'completeRegistration':
        setCurrentStep('verifyOTPSignup');
        break;
      default:
        setCurrentStep('login');
    }
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'login':
        return (
          <Login
            onLogin={handleLogin}
            onForgotPassword={handleForgotPassword}
            onSignUp={handleSignUp}
          />
        );

      case 'requestOTP':
        return (
          <RequestOTP
            onContinue={handleRequestOTPContinue}
            onBack={handleBack}
          />
        );

      case 'requestOTPSignup':
        return (
          <SignupEmailVerification
            referralCode={referralCode}
            onContinue={handleRequestOTPContinue}
            onBack={handleBack}
          />
        );

      case 'verifyOTPPassword':
        return (
          <VerifyOTP
            email={authData.email}
            onContinue={handleVerifyOTPContinue}
            onResend={handleResendOTP}
            onBack={handleBack}
            flowType="forgotPassword"
          />
        );

      case 'verifyOTPSignup':
        return (
          <VerifyOTP
            email={authData.email}
            onContinue={handleVerifyOTPContinue}
            onResend={handleResendOTP}
            onBack={handleBack}
            flowType="registration"
          />
        );

      case 'newPassword':
        return (
          <NewPassword
            email={authData.email}
            onComplete={handleNewPasswordComplete}
            onBack={handleBack}
          />
        );

      case 'completeRegistration':
        return (
          <CompleteRegistration
            email={authData.email}
            referralCode={referralCode}
            onComplete={handleRegistrationComplete}
            onBack={handleBack}
          />
        );

      default:
        return (
          <Login
            onLogin={handleLogin}
            onForgotPassword={handleForgotPassword}
            onSignUp={handleSignUp}
          />
        );
    }
  };

  return (
    <div className="auth-flow">
      {renderCurrentStep()}
    </div>
  );
};

export default AuthFlow;
