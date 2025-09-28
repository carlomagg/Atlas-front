import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ContactUs from './ContactUs';
import EmailUs from './EmailUs';
import FrequentlyAskedQuestions from './FrequentlyAskedQuestions';
import NewUserQuickGuide from './NewUserQuickGuide';
import EmailSubscription from './EmailSubscription';

const Reports = () => {
  const [activeSection, setActiveSection] = useState('contact-us');
  const location = useLocation();

  // Handle URL parameters to automatically navigate to specific sections
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const section = searchParams.get('section');
    
    if (section && ['contact-us', 'email-us', 'faq', 'quick-guide', 'email-subscription'].includes(section)) {
      setActiveSection(section);
    }
  }, [location.search]);

  const sidebarItems = [
    {
      id: 'contact-us',
      name: 'Contact Us',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L6.16 11.37a11.045 11.045 0 005.516 5.516l1.983-4.064a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    },
    {
      id: 'email-us',
      name: 'Email Us',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'quick-guide',
      name: 'New User Quick Guide',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 'faq',
      name: 'Frequently Asked Questions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const handleNavigateToEmailUs = () => {
    setActiveSection('email-us');
  };

  const handleNavigateToQuickGuide = () => {
    setActiveSection('quick-guide');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'contact-us':
        return <ContactUs onNavigateToEmailUs={handleNavigateToEmailUs} onNavigateToQuickGuide={handleNavigateToQuickGuide} />;
      case 'email-us':
        return <EmailUs />;
      case 'quick-guide':
        return <NewUserQuickGuide />;
      case 'faq':
        return <FrequentlyAskedQuestions />;
      default:
        return <ContactUs onNavigateToEmailUs={handleNavigateToEmailUs} onNavigateToQuickGuide={handleNavigateToQuickGuide} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 shadow-sm flex-shrink-0">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Support Center</h2>
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 text-left ${
                  activeSection === item.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 flex-shrink-0">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Reports;
