import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const FrequentlyAskedQuestions = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [showAllQuestions, setShowAllQuestions] = useState({});
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleShowAllQuestions = (sectionId) => {
    setShowAllQuestions(prev => ({
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
          answer: 'AtlasWD is a comprehensive B2B and B2C platform that connects buyers and sellers locally and internationally. Beyond products, we also provide access to services, helping businesses and individuals find the right partners to grow. Acting as a trusted bridge, AtlasWD makes trade and service connections simple, reliable, and secure whether across town or across the globe.'
        },
        {
          question: 'Can AtlasWD recommend specific products or services?',
          answer: 'Yes. Our platform uses smart algorithms and expert knowledge to recommend products and services tailored to your needs, whether for local markets or international trade.'
        },
        {
          question: 'Who can use AtlasWD?',
          answer: 'AtlasWD is designed for individuals, small businesses, and large enterprises anyone who wants to buy, sell, or promote products and services locally or globally.'
        },
        {
          question: 'Does AtlasWD support both products and services?',
          answer: 'Absolutely. You can discover and trade physical products as well as professional services across multiple industries.'
        },
        {
          question: 'How do I find suppliers or service providers on AtlasWD?',
          answer: 'You can browse categories, use search and filters, or rely on our recommendation system to connect with verified providers.'
        },
        {
          question: 'How does AtlasWD ensure trust between buyers and sellers?',
          answer: 'We verify business profiles, encourage transparency, and provide tools to ensure safer and more reliable trade.'
        },
        {
          question: 'Is AtlasWD limited to international trade?',
          answer: 'No. AtlasWD supports both local and international trade, giving businesses opportunities to expand at home and abroad.'
        },
        {
          question: 'How do I list my products or services on AtlasWD?',
          answer: 'Create a company profile, upload your product or service details, and instantly showcase your offerings to a global and local audience.'
        },
        {
          question: 'Can consumers (B2C) also buy on AtlasWD?',
          answer: 'Yes. In addition to business-to-business (B2B) transactions, AtlasWD allows direct sales to consumers worldwide.'
        },
        {
          question: 'What kind of services can be listed on AtlasWD?',
          answer: 'A wide range of professional and business services can be listed, from logistics and consulting to creative and technical support.'
        }
      ]
    },
    {
      id: 'account-settings',
      title: 'Star Buyer',
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
        },
        {
          question: 'What should I do if I can\'t find suitable products?',
          answer: 'You can refine your search, post buying requests, or contact suppliers directly for custom solutions.'
        },
        {
          question: 'How can I contact suppliers or service providers?',
          answer: 'Click on the supplier\'s profile to view their contact details, send inquiries, or chat directly through the platform.'
        },
        {
          question: 'How can I get more information about suppliers?',
          answer: 'Each supplier has a detailed profile, including company background, certifications, membership level, and customer reviews.'
        },
        {
          question: 'What are the benefits of membership levels (Gold, Diamond, etc.)?',
          answer: 'Higher membership levels provide more visibility, credibility, and access to premium tools that help increase buyer trust and exposure.'
        },
        {
          question: 'Can I sell both locally and internationally on AtlasWD?',
          answer: 'Yes. AtlasWD supports both local trade within your country and international trade across global markets.'
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
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
                    {(showAllQuestions[section.id] ? section.questions : section.questions.slice(0, 3)).map((qa, index) => (
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
                      <button 
                        onClick={() => toggleShowAllQuestions(section.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                      >
                        {showAllQuestions[section.id] ? 'See Less' : 'See More'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FrequentlyAskedQuestions;
