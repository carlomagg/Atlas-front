import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChatSupport from '../../common/ChatSupport';

const ContactUs = ({ onNavigateToEmailUs, onNavigateToQuickGuide }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLoginRedirect = () => {
    navigate('/');
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to contact Atlas-WD!</h1>
          <p className="text-gray-600 mb-2">Maximize Growth, Minimize Costs, Find Your Customers</p>
          <p className="text-gray-600">Effortlessly with ATLAS-WD</p>
          
          {/* User Status */}
          {isAuthenticated ? (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                ✅ You are logged in as: <strong>{user?.email || 'User'}</strong>
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ You are not logged in. 
                <button 
                  onClick={handleLoginRedirect}
                  className="ml-2 text-blue-600 hover:text-blue-700 underline"
                >
                  Sign in here
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Chat with us online */}
          <div className="text-center p-6 border border-gray-200 rounded-lg relative hover:border-blue-300 transition-colors">
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat with us online</h3>
            <p className="text-gray-600 text-sm mb-4">Need Help? Chat with Atlas-WD Support</p>
            <button 
              onClick={handleOpenChat}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Start Chat
            </button>
            <div className="absolute top-2 right-2">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Online
              </span>
            </div>
          </div>

          {/* Send us a message */}
          <div className="text-center p-6 border border-gray-200 rounded-lg">
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Send us a message</h3>
            <p className="text-gray-600 text-sm mb-4">Messages will be replied within 2 workdays.</p>
            <button 
              onClick={onNavigateToEmailUs}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Email Us
            </button>
          </div>

          {/* New user quick guide */}
          <div className="text-center p-6 border border-gray-200 rounded-lg">
            <div className="mb-4">
              <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">New user quick guide</h3>
            <p className="text-gray-600 text-sm mb-4">Step-by-step guides to help you get started with Atlas-WD</p>
            <button 
              onClick={onNavigateToQuickGuide}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              View Guides
            </button>
          </div>
        </div>

        {/* Popular Questions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Questions from Other Buyers</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">Can Atlas-WD recommend specific products to me?</span>
              <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">HOT</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">What should I do if I can't find suitable products?</span>
              <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">HOT</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">How can I contact suppliers?</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">What's the difference between Gold Member, Diamond Member, Audited Supplier and License Verified?</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">How can I get more information about suppliers?</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">How can I reduce trade risks during business?</span>
            </div>
          </div>
        </div>

        {/* Alternate Contacts */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alternate Contacts</h3>
          <p className="text-gray-600 text-sm mb-2">You can also contact Atlas-WD directly via phone for immediate assistance.</p>
          <div className="text-sm text-gray-600">
            <p className="mb-1"><strong>No 18 Leek Lagos</strong></p>
            <p className="mb-1">Post Code:210032, Fax Number:+86(25)6667 0000 (* Please leave your email on the fax. We will contact you via email.)</p>
          </div>
        </div>
      </div>

      {/* Chat Support Modal */}
      {isChatOpen && (
        <ChatSupport 
          isOpen={isChatOpen} 
          onClose={handleCloseChat} 
          isFloating={false}
        />
      )}
    </div>
  );
};

export default ContactUs;
