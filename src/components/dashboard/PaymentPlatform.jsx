import React, { useState } from 'react';
import WalletSection from './payment/WalletSection';
import DepositSection from './payment/DepositSection';
import WithdrawalSection from './payment/WithdrawalSection';
import PaymentHistory from './payment/PaymentHistory';
import SubscriptionSection from './payment/SubscriptionSection';
import EnhancedSubscriptionSection from './payment/EnhancedSubscriptionSection';
import TierBasedSubscriptionSection from './payment/TierBasedSubscriptionSection';
import DailyBoosterSection from './payment/DailyBoosterSection';
import ServicesSection from './payment/ServicesSection';
import ServiceBookingHistory from './payment/ServiceBookingHistory';
import ReferralInfoSection from './payment/ReferralPaymentSection';

const PaymentPlatform = () => {
  const [activeSection, setActiveSection] = useState('wallet');

  const sidebarItems = [
    { 
      id: 'wallet', 
      name: 'Wallet', 
      icon: '💰',
      description: 'Manage your wallet balance and transactions'
    },
    { 
      id: 'deposit', 
      name: 'Make a Deposit', 
      icon: '💳',
      description: 'Add funds to your wallet'
    },
    { 
      id: 'withdrawal', 
      name: 'Withdraw Funds', 
      icon: '💸',
      description: 'Transfer money to your bank account'
    },
    { 
      id: 'history', 
      name: 'Payment History', 
      icon: '📋',
      description: 'View all payment transactions'
    },
    { 
      id: 'subscriptions', 
      name: 'Subscriptions', 
      icon: '📦',
      description: 'Manage your subscription packages'
    },
    { 
      id: 'booster', 
      name: 'Daily Booster', 
      icon: '⚡',
      description: 'Boost your products visibility'
    },
    { 
      id: 'services', 
      name: 'Services', 
      icon: '🛠️',
      description: 'IT and Media services'
    },
    { 
      id: 'service-history', 
      name: 'My Bookings', 
      icon: '📋',
      description: 'All services history'
    },
    { 
      id: 'referrals', 
      name: 'Referrals', 
      icon: '🎯',
      description: 'Agent referral management'
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'wallet':
        return <WalletSection onNavigate={setActiveSection} />;
      case 'deposit':
        return <DepositSection />;
      case 'withdrawal':
        return <WithdrawalSection />;
      case 'history':
        return <PaymentHistory />;
      case 'subscriptions':
        // Using tier-based subscription section with proper API integration
        return <TierBasedSubscriptionSection />;
      case 'booster':
        return <DailyBoosterSection />;
      case 'services':
        return <ServicesSection onNavigate={setActiveSection} />;
      case 'service-history':
        return <ServiceBookingHistory />;
      case 'referrals':
        return <ReferralInfoSection />;
      default:
        return <WalletSection />;
    }
  };

  return (
    <div className="dashboard-content bg-gray-50 min-h-screen" style={{ margin: '-1rem' }}>
      {/* Main Content */}
      <div className="dashboard-main">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          {/* Mobile Navigation */}
          <div className="lg:hidden mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Options
            </label>
            
            {/* Quick Access Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {sidebarItems.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    activeSection === item.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-lg mb-1">{item.icon}</div>
                  <div className="text-xs font-medium truncate">{item.name}</div>
                </button>
              ))}
            </div>

            {/* Dropdown for remaining options */}
            {sidebarItems.length > 6 && (
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">More Options...</option>
                {sidebarItems.slice(6).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.icon} {item.name}
                  </option>
                ))}
              </select>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              {sidebarItems.find(item => item.id === activeSection)?.description}
            </p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {sidebarItems.find(item => item.id === activeSection)?.name || 'Payment Center'}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {sidebarItems.find(item => item.id === activeSection)?.description || 'Manage your payments and transactions'}
            </p>
          </div>

          {/* Mobile Header - Simplified */}
          <div className="lg:hidden mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {sidebarItems.find(item => item.id === activeSection)?.name || 'Payment Center'}
            </h1>
          </div>

          {renderContent()}
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm lg:sticky lg:top-4">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-600 rounded-lg p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Payment Center</h2>
                <p className="text-sm text-gray-500">Manage your payments & wallet</p>
              </div>
            </div>
            
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                    activeSection === item.id
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-1 truncate">{item.description}</div>
                  </div>
                  {activeSection === item.id && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPlatform;
