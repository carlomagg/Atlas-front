import React, { useState } from 'react';
import AuthFlow from './AuthFlow';

const AuthTestPage = () => {
  const [currentFlow, setCurrentFlow] = useState('login');
  const [showFlow, setShowFlow] = useState(true);

  const handleAuthComplete = (result) => {
    console.log('Auth completed:', result);
    alert(`Auth completed: ${result.type}`);
  };

  const resetFlow = () => {
    setShowFlow(false);
    setTimeout(() => setShowFlow(true), 100);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Test Controls */}
      <div className="fixed top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border">
        <h3 className="text-sm font-bold mb-2">Test Auth Flows</h3>
        <div className="space-y-2">
          <button
            onClick={() => { setCurrentFlow('login'); resetFlow(); }}
            className={`block w-full text-left px-3 py-1 text-xs rounded ${
              currentFlow === 'login' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setCurrentFlow('signup'); resetFlow(); }}
            className={`block w-full text-left px-3 py-1 text-xs rounded ${
              currentFlow === 'signup' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
            }`}
          >
            Signup
          </button>
          <button
            onClick={() => { setCurrentFlow('forgot'); resetFlow(); }}
            className={`block w-full text-left px-3 py-1 text-xs rounded ${
              currentFlow === 'forgot' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
            }`}
          >
            Forgot Password
          </button>
        </div>
        <div className="mt-3 pt-2 border-t">
          <p className="text-xs text-gray-600">
            Test on different screen sizes:
          </p>
          <div className="text-xs text-gray-500 mt-1">
            • Mobile: 375px<br/>
            • Tablet: 768px<br/>
            • Desktop: 1024px+
          </div>
        </div>
      </div>

      {/* Auth Flow */}
      {showFlow && (
        <AuthFlow
          initialStep={currentFlow === 'forgot' ? 'requestOTP' : currentFlow}
          onAuthComplete={handleAuthComplete}
        />
      )}
    </div>
  );
};

export default AuthTestPage;
