import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from './Login';
import RequestOTP from './RequestOTP';
import VerifyOTP from './VerifyOTP';
import NewPassword from './NewPassword';
import CompleteRegistration from './CompleteRegistration';
import SignupEmailVerification from './SignupEmailVerification';

const AuthFlow = ({ onAuthComplete, initialStep = 'login' }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [authData, setAuthData] = useState({});

  // Navigation handlers
  const handleLogin = (loginData) => {
    console.log('Login successful:', loginData);
    if (onAuthComplete) {
      onAuthComplete({ type: 'login', data: loginData });
    }
    // Redirect to landing page after successful login
    navigate('/');
  };

  const handleForgotPassword = () => {
    setCurrentStep('requestOTP');
  };

  const handleSignUp = () => {
    setCurrentStep('requestOTPSignup');
  };

  // Handle initial step setup
  useEffect(() => {
    if (initialStep === 'signup') {
      setCurrentStep('requestOTPSignup');
    }
  }, [initialStep]);

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
