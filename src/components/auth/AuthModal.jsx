import React from 'react';

const AuthModal = ({ children, onClose }) => {
  return (
    <div className="w-full bg-gray-50 min-h-screen">
      {/* Top Logo Section - Responsive */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center sm:justify-start">
          <img src="/images/logo.svg" alt="Atlas-WD" className="h-12 sm:h-14 lg:h-16 w-auto mr-3 sm:mr-4" />
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            <div>Maximize Growth, Minimize</div>
            <div>Costs. Find Your Customers</div>
            <div>Effortlessly with ATLAS-WD</div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive padding */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
        {children}
      </div>
    </div>
  );
};

export default AuthModal;
