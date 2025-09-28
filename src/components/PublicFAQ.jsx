import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicFAQ = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleLogin = () => {
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const faqSections = [
    {
      id: 'about-atlas-wd',
      title: 'About Atlas-WD',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      questions: [
        {
          question: 'What is Atlas-WD?',
          answer: 'Atlas-WD is a comprehensive B2B platform that connects global buyers with Chinese suppliers, facilitating international trade and business growth.'
        },
        {
          question: 'Does Atlas-WD supply any product?',
          answer: 'No, Atlas-WD is a platform that connects buyers with suppliers. We do not directly supply products but facilitate connections between businesses.'
        },
        {
          question: 'Can Atlas-WD recommend specific products?',
          answer: 'Yes, our platform uses advanced algorithms and expert knowledge to recommend products that match your specific requirements and business needs.'
        }
      ]
    },
    {
      id: 'account-settings',
      title: 'Account Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      questions: [
        {
          question: 'What is Star Buyer?',
          answer: 'Star Buyer is a premium membership level that provides enhanced features, priority support, and better visibility to suppliers on our platform.'
        },
        {
          question: 'What are the benefits of a Star Buyer?',
          answer: 'Star Buyers enjoy priority customer support, advanced search filters, direct supplier contact information, and preferential treatment in negotiations.'
        },
        {
          question: 'How do I upgrade to a Star Buyer?',
          answer: 'You can upgrade to Star Buyer through your account settings by selecting a premium plan that suits your business needs and completing the payment process.'
        }
      ]
    },
    {
      id: 'filtering-suppliers',
      title: 'Filtering Suppliers and Trading Safely',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      questions: [
        {
          question: 'How can I obtain more information about suppliers?',
          answer: 'You can view detailed supplier profiles, check their verification status, read reviews from other buyers, and contact them directly through our platform.'
        },
        {
          question: 'What are the benefits of a Star Buyer?',
          answer: 'Star Buyers get access to verified supplier information, priority customer service, advanced filtering options, and enhanced communication tools.'
        },
        {
          question: 'How do I upgrade to a Star Buyer?',
          answer: 'Visit your account settings, choose the Star Buyer plan, complete the verification process, and make the payment to unlock premium features.'
        }
      ]
    },
    {
      id: 'contacting-suppliers',
      title: 'Contacting Suppliers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      questions: [
        {
          question: 'How can I contact suppliers?',
          answer: 'You can contact suppliers through our messaging system, request quotes, or use the direct contact information available for verified suppliers.'
        },
        {
          question: 'How can I get supplier contact info?',
          answer: 'Verified suppliers contact information is available to registered users. Premium members get access to more detailed contact information including phone numbers and direct email addresses.'
        }
      ]
    },
    {
      id: 'searching-efficiency',
      title: 'Searching Product Efficiency',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      questions: [
        {
          question: 'How can I search for products efficiently?',
          answer: 'Use our advanced search filters, category browsing, and keyword search. You can also use our AI-powered recommendation system for better results.'
        },
        {
          question: 'What should I do if I can\'t find suitable products?',
          answer: 'Try using broader search terms, contact our customer support, or post a buying request. Our team can help connect you with suitable suppliers.'
        },
        {
          question: 'How can I post a sourcing request to get quotations?',
          answer: 'Navigate to the "Post Buying Request" section, provide detailed product specifications, and suppliers will contact you with quotations.'
        }
      ]
    },
    {
      id: 'login-signin',
      title: 'Login and Sign In',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      ),
      questions: [
        {
          question: 'How can I sign in?',
          answer: isAuthenticated 
            ? `You are currently signed in as ${user?.email || 'User'}. You can access all features of Atlas-WD.`
            : 'Click the "Sign In" button below to access your account, or go to the main page to login with your email and password.',
          action: !isAuthenticated ? {
            text: 'Sign In Now',
            onClick: handleLogin,
            className: 'bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm'
          } : {
            text: 'Sign Out',
            onClick: handleLogout,
            className: 'bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm'
          }
        },
        {
          question: 'Why does my account fail to login into Atlas-WD?',
          answer: 'This could be due to incorrect credentials, account suspension, or technical issues. Try resetting your password or contact customer support.'
        },
        {
          question: 'What can I do if I forget my registered email?',
          answer: 'Contact our customer support team with your account details, and they will help you recover your account information.'
        },
        {
          question: 'What can I do if I forget my password?',
          answer: 'Click on "Forgot Password" on the login page, enter your email address, and follow the instructions sent to your email to reset your password.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
              <p className="mt-2 text-gray-600">Find answers to frequently asked questions</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
            <p className="text-gray-600">Select your interested categories to locate your question.</p>
          </div>

          <div className="space-y-4">
            {faqSections.map((section) => (
              <div key={section.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-600">{section.icon}</span>
                    <span className="font-medium text-gray-900">{section.title}</span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedSections[section.id] ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedSections[section.id] && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="space-y-4">
                      {section.questions.map((qa, index) => (
                        <div key={index} className="border-l-2 border-blue-500 pl-4">
                          <h4 className="font-medium text-gray-900 mb-2">{qa.question}</h4>
                          <p className="text-gray-600 text-sm mb-3">{qa.answer}</p>
                          {qa.action && (
                            <button
                              onClick={qa.action.onClick}
                              className={qa.action.className}
                            >
                              {qa.action.text}
                            </button>
                          )}
                        </div>
                      ))}
                      {section.questions.length > 3 && (
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          More
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Additional Help Section */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Still need help?</h3>
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for? Our support team is here to help you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {!isAuthenticated && (
                <button
                  onClick={handleLogin}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign In for More Help
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicFAQ;
