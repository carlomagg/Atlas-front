import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { subscribeToNewsletter, unsubscribeFromNewsletter } from '../../../services/contactApi';

const EmailSubscription = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState(user?.email || '');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  
  // Unsubscribe state
  const [unsubscribeEmail, setUnsubscribeEmail] = useState(user?.email || '');
  const [unsubscribeLoading, setUnsubscribeLoading] = useState(false);
  const [unsubscribeMessage, setUnsubscribeMessage] = useState('');
  const [unsubscribeSuccess, setUnsubscribeSuccess] = useState(false);

  // Newsletter subscription function (copied from GlobalFooter)
  const subscribeToNewsletterHandler = async (email) => {
    console.log('Newsletter subscription started for email:', email);
    
    if (!email || !email.trim()) {
      setNewsletterMessage('Email is required');
      setNewsletterSuccess(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setNewsletterMessage('Please enter a valid email address');
      setNewsletterSuccess(false);
      return;
    }

    setNewsletterLoading(true);
    setNewsletterMessage('');
    setNewsletterSuccess(false);

    try {
      console.log('Making API request to subscribe');
      const data = await subscribeToNewsletter(email);
      console.log('API response data:', data);
      
      setNewsletterMessage(data.message || 'Successfully subscribed to newsletter!');
      setNewsletterSuccess(true);
      setNewsletterEmail(''); // Clear the input on success
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      
      // More specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setNewsletterMessage('Unable to connect to server. Please check if the API server is running.');
      } else if (error.name === 'SyntaxError') {
        setNewsletterMessage('Server returned invalid response. Please try again.');
      } else {
        setNewsletterMessage(error.message || `Network error: ${error.message}. Please try again.`);
      }
      setNewsletterSuccess(false);
    } finally {
      setNewsletterLoading(false);
      // Clear message after 8 seconds
      setTimeout(() => {
        setNewsletterMessage('');
        setNewsletterSuccess(false);
      }, 8000);
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted! Email:', newsletterEmail);
    subscribeToNewsletterHandler(newsletterEmail);
  };

  // Unsubscribe function
  const unsubscribeFromNewsletterHandler = async (email) => {
    console.log('Newsletter unsubscribe started for email:', email);
    
    if (!email || !email.trim()) {
      setUnsubscribeMessage('Email is required');
      setUnsubscribeSuccess(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setUnsubscribeMessage('Please enter a valid email address');
      setUnsubscribeSuccess(false);
      return;
    }

    setUnsubscribeLoading(true);
    setUnsubscribeMessage('');
    setUnsubscribeSuccess(false);

    try {
      console.log('Making API request to unsubscribe');
      const data = await unsubscribeFromNewsletter(email);
      console.log('API response data:', data);
      
      setUnsubscribeMessage(data.message || 'Successfully unsubscribed from newsletter!');
      setUnsubscribeSuccess(true);
      setUnsubscribeEmail(''); // Clear the input on success
    } catch (error) {
      console.error('Newsletter unsubscribe error:', error);
      
      // More specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setUnsubscribeMessage('Unable to connect to server. Please check if the API server is running.');
      } else if (error.name === 'SyntaxError') {
        setUnsubscribeMessage('Server returned invalid response. Please try again.');
      } else {
        setUnsubscribeMessage(error.message || `Network error: ${error.message}. Please try again.`);
      }
      setUnsubscribeSuccess(false);
    } finally {
      setUnsubscribeLoading(false);
      // Clear message after 8 seconds
      setTimeout(() => {
        setUnsubscribeMessage('');
        setUnsubscribeSuccess(false);
      }, 8000);
    }
  };

  const handleUnsubscribeSubmit = (e) => {
    e.preventDefault();
    console.log('Unsubscribe form submitted! Email:', unsubscribeEmail);
    unsubscribeFromNewsletterHandler(unsubscribeEmail);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Newsletter Subscription</h1>
          <p className="text-gray-600 mb-2">Manage your newsletter subscription preferences</p>
          <p className="text-gray-600">Stay updated with the latest news, products, and offers from Atlas-WD</p>
          
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
                ⚠️ You can subscribe/unsubscribe even without being logged in
              </p>
            </div>
          )}
        </div>

        {/* Subscription and Unsubscription Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Subscribe Section */}
          <div className="bg-gray-100 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Subscribe to Newsletter</h2>
                <p className="text-gray-600 text-sm">Get the latest updates and offers</p>
              </div>
            </div>
            
            <form onSubmit={handleNewsletterSubmit} className="space-y-4">
              <div>
                <label htmlFor="subscribe-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="subscribe-email"
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={newsletterLoading}
                />
              </div>
              
              <button 
                type="submit"
                disabled={newsletterLoading || !newsletterEmail.trim()}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {newsletterLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Subscribing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Subscribe to Newsletter
                  </>
                )}
              </button>
              
              {newsletterMessage && (
                <div className={`text-sm p-3 rounded-lg ${
                  newsletterSuccess 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  <div className="flex items-center">
                    {newsletterSuccess ? (
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {newsletterMessage}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Unsubscribe Section */}
          <div className="bg-gray-100 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-3 mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Unsubscribe from Newsletter</h2>
                <p className="text-gray-600 text-sm">Stop receiving newsletter emails</p>
              </div>
            </div>
            
            <form onSubmit={handleUnsubscribeSubmit} className="space-y-4">
              <div>
                <label htmlFor="unsubscribe-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="unsubscribe-email"
                  type="email"
                  value={unsubscribeEmail}
                  onChange={(e) => setUnsubscribeEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={unsubscribeLoading}
                />
              </div>
              
              <button 
                type="submit"
                disabled={unsubscribeLoading || !unsubscribeEmail.trim()}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {unsubscribeLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Unsubscribing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Unsubscribe from Newsletter
                  </>
                )}
              </button>
              
              {unsubscribeMessage && (
                <div className={`text-sm p-3 rounded-lg ${
                  unsubscribeSuccess 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  <div className="flex items-center">
                    {unsubscribeSuccess ? (
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {unsubscribeMessage}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-blue-50 rounded-xl p-6">
          <div className="flex items-start">
            <div className="bg-blue-100 rounded-full p-2 mr-4 flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Newsletter Information</h3>
              <div className="text-blue-800 text-sm space-y-2">
                <p>• <strong>Frequency:</strong> Weekly newsletter with the latest updates</p>
                <p>• <strong>Content:</strong> New products, special offers, market insights, and platform updates</p>
                <p>• <strong>Privacy:</strong> Your email is secure and will never be shared with third parties</p>
                <p>• <strong>Unsubscribe:</strong> You can unsubscribe at any time using the form above or the link in any email</p>
                <p>• <strong>Support:</strong> If you have issues with subscription, please contact our support team</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="bg-orange-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Latest Updates</h4>
            <p className="text-gray-600 text-sm">Be the first to know about new features and platform improvements</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Exclusive Offers</h4>
            <p className="text-gray-600 text-sm">Get access to special discounts and promotional deals</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Market Insights</h4>
            <p className="text-gray-600 text-sm">Stay informed about market trends and business opportunities</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSubscription;
