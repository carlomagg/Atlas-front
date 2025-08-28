import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import TopNavigation from './TopNavigation';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Company Info');
  const location = useLocation();

  // Determine active tab based on current route
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes('/contact-info') || path.includes('/product-info') || path.includes('/quotation-builder') || path.includes('/privacy-info')) {
      setActiveTab('Company Info');
    } else if (path.includes('/message-guide')) {
      setActiveTab('Message Guide');
    } else if (path.includes('/agent-management')) {
      setActiveTab('Agent Management');
    } else if (path.includes('/transaction-activities')) {
      setActiveTab('Transaction Activities');
    } else if (path.includes('/payment-platform')) {
      setActiveTab('Payment Platform');
    } else if (path.includes('/reports')) {
      setActiveTab('Reports');
    } else {
      setActiveTab('Dashboard');
    }
  }, [location.pathname]);

  // Check if current tab should show sidebar
  const shouldShowSidebar = activeTab === 'Company Info';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Top Navigation */}
      <TopNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Layout Container */}
      <div className="relative">
        <div className="flex">
          {/* Conditional Sidebar */}
          {shouldShowSidebar && (
            <div className="hidden lg:block">
              <Sidebar
                isOpen={true}
                onClose={() => setSidebarOpen(false)}
                className="fixed top-32 left-0 h-[calc(100vh-8rem)] w-64 bg-white border-r border-gray-200 z-30"
              />
            </div>
          )}

          {/* Main content */}
          <div className={`flex-1 min-h-[calc(100vh-8rem)] ${shouldShowSidebar ? 'lg:ml-64' : ''}`}>
            {/* Mobile sidebar overlay */}
            {shouldShowSidebar && sidebarOpen && (
              <div className="lg:hidden">
                <Sidebar
                  isOpen={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                  isMobile={true}
                />
              </div>
            )}

            {/* Page content */}
            <main className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Mobile menu button for sidebar tabs */}
                {shouldShowSidebar && (
                  <div className="lg:hidden mb-4">
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      Menu
                    </button>
                  </div>
                )}
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
