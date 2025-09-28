import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';

const GlobalFooter = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  // Newsletter subscription function
  const subscribeToNewsletter = async (email) => {
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
      console.log('Making API request to /api/auth/subscribe/');
      const response = await fetch('/api/auth/subscribe/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim()
        })
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);
      
      if (response.ok) {
        setNewsletterMessage(data.message || 'Successfully subscribed to newsletter!');
        setNewsletterSuccess(true);
        setNewsletterEmail(''); // Clear the input on success
      } else {
        setNewsletterMessage(data.message || 'An error occurred while processing your subscription');
        setNewsletterSuccess(false);
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      
      // More specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setNewsletterMessage('Unable to connect to server. Please check if the API server is running.');
      } else if (error.name === 'SyntaxError') {
        setNewsletterMessage('Server returned invalid response. Please try again.');
      } else {
        setNewsletterMessage(`Network error: ${error.message}. Please try again.`);
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
    subscribeToNewsletter(newsletterEmail);
  };

  // Handle support link clicks
  const handleSupportClick = (supportType) => {
    if (isAuthenticated) {
      // Redirect to dashboard reports with specific section
      navigate(`/dashboard/reports?section=${supportType}`);
    } else {
      // Redirect to help page for non-logged-in users and scroll to top
      navigate('/help');
      // Scroll to top after navigation
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  // Handle become agent click (same logic as navigation)
  const handleBecomeAgentClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      // For non-authenticated users, redirect to login page
      navigate('/?login=true');
    }
    // If logged in, the Link will navigate normally to /become-agent
  };

  // Handle trending products click with scroll to top
  const handleTrendingProductsClick = () => {
    navigate('/top-ranking');
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Handle sourcing guide click (product request form) with authentication validation
  const handleSourcingGuideClick = (e) => {
    if (isAuthenticated) {
      // Redirect to dashboard message guide product tab
      navigate('/dashboard/message-guide?tab=product');
    } else {
      // For non-authenticated users, redirect to login page
      e.preventDefault();
      navigate('/?login=true');
    }
  };

  return (
    <>
      {/* Newsletter Section */}
      <section className="bg-gray-100 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-md mx-auto sm:mx-0">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 text-gray-800 text-center sm:text-left">Subscribe to Our Newsletter</h2>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Your Email Address"
                  className="flex-1 px-4 py-2 sm:rounded-l-md rounded-md sm:rounded-r-none border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={newsletterLoading}
                />
                <button 
                  type="submit"
                  disabled={newsletterLoading || !newsletterEmail.trim()}
                  className="px-6 py-2 bg-orange-500 text-white sm:rounded-r-md rounded-md sm:rounded-l-none hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
              {newsletterMessage && (
                <div className={`text-sm p-3 rounded-md ${
                  newsletterSuccess 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {newsletterMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Mobile: Stack vertically, Tablet: 2 columns, Desktop: 6 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 sm:gap-8">
            
            {/* Company Info - Full width on mobile, spans 2 cols on tablet */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="mb-3">
                <Logo to="/" height="h-12 md:h-14" />
              </div>
              <p className="text-sm text-gray-600">Your best online market</p>
            </div>
            
            {/* Features */}
            <div>
              <h3 className="font-semibold mb-4 text-gray-800">Features</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <button 
                    onClick={handleSourcingGuideClick}
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    • Sourcing Guide {!isAuthenticated && <span className="text-xs text-gray-500">(Login Required)</span>}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleTrendingProductsClick}
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    • Trending products
                  </button>
                </li>
                <li>
                  <Link 
                    to="/become-agent"
                    onClick={handleBecomeAgentClick}
                    className="hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    • Become an Agent {!isAuthenticated && <span className="text-xs text-gray-500">(Login Required)</span>}
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4 text-gray-800">Support</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <button 
                    onClick={() => handleSupportClick('contact-us')}
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    • Customer Service
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleSupportClick('faq')}
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    • Help Center
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleSupportClick('contact-us')}
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    • Submit a Dispute
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleSupportClick('contact-us')}
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    • Report IPR
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h3 className="font-semibold mb-4 text-gray-800">Company</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Trade Assurance</li>
                <li>• Business Identity</li>
                <li>• Logistics Service</li>
                <li>• Secure Payment</li>
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4 text-gray-800">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <button 
                    onClick={() => handleSupportClick('contact-us')}
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    • Product Monitoring
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleSupportClick('contact-us')}
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    • Trade Alert
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleSupportClick('contact-us')}
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    • Production Flow
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Social Media - Full width on mobile and tablet */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="font-semibold mb-4 text-gray-800">Follow Us</h3>
              <p className="text-sm text-gray-600 mb-4">Connect with us on social media</p>
              <div className="flex gap-2">
                {/* Facebook */}
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  title="Follow us on Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all"
                  title="Follow us on Instagram"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                {/* TikTok */}
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                  title="Follow us on TikTok"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors"
                  title="Follow us on LinkedIn"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-300 text-center text-sm text-gray-600">
            <p>Copyright ©2022 ATLAS-WD. Trade Alert | All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default GlobalFooter;
