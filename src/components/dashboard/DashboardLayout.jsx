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
      setActiveTab('Contact');
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

      {/* Mobile-First Responsive Layout Container */}
      <div className="dashboard-container">
        <div className="dashboard-content">
          {/* Main content - appears first on mobile */}
          <main className="dashboard-main">
            <div className="w-full">
              {/* Mobile menu button for sidebar tabs */}
              {shouldShowSidebar && (
                <div className="lg:hidden mb-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Menu
                  </button>
                </div>
              )}
              
              {/* Page content */}
              <div className="w-full">
                {children}
              </div>
            </div>
          </main>

          {/* Sidebar - appears second on mobile, first on desktop */}
          {shouldShowSidebar && (
            <aside className="dashboard-sidebar">
              {/* Desktop sidebar */}
              <div className="hidden lg:block">
                <div className="sticky top-4">
                  <Sidebar
                    isOpen={true}
                    onClose={() => setSidebarOpen(false)}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm"
                  />
                </div>
              </div>
              
              {/* Mobile sidebar overlay */}
              {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                  <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                  <div className="absolute left-0 top-0 h-full w-80 max-w-[90vw]">
                    <Sidebar
                      isOpen={sidebarOpen}
                      onClose={() => setSidebarOpen(false)}
                      isMobile={true}
                    />
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
