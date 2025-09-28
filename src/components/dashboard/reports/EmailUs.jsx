import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { submitContactForm, BUSINESS_PURPOSE_OPTIONS, getBusinessPurposeKeys } from '../../../services/contactApi';

const EmailUs = () => {
  const { isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    businessPurpose: [],
    comments: '',
    fullName: '',
    companyName: '',
    emailAddress: '',
    countryRegion: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

  // Pre-fill form with user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || user.full_name || '',
        companyName: user.companyName || user.company_name || '',
        emailAddress: user.email || ''
      }));
    }
  }, [isAuthenticated, user]);

  const businessPurposeOptions = Object.values(BUSINESS_PURPOSE_OPTIONS);

  const handleBusinessPurposeChange = (option) => {
    setFormData(prev => ({
      ...prev,
      businessPurpose: prev.businessPurpose.includes(option)
        ? prev.businessPurpose.filter(item => item !== option)
        : [...prev.businessPurpose, option]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Validate required fields
      if (!formData.fullName.trim() || !formData.emailAddress.trim() || !formData.comments.trim() || formData.businessPurpose.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      // Convert business purposes to API format
      const businessPurposeKeys = getBusinessPurposeKeys(formData.businessPurpose);

      // Prepare data for API
      const apiData = {
        business_purposes: businessPurposeKeys,
        full_name: formData.fullName.trim(),
        company_name: formData.companyName.trim(),
        email_address: formData.emailAddress.trim(),
        country_region: formData.countryRegion.trim(),
        comments: formData.comments.trim()
      };

      await submitContactForm(apiData);
      
      setSubmitStatus('success');
      // Reset form after successful submission
      setFormData({
        businessPurpose: [],
        comments: '',
        fullName: isAuthenticated && user ? (user.fullName || user.full_name || '') : '',
        companyName: isAuthenticated && user ? (user.companyName || user.company_name || '') : '',
        emailAddress: isAuthenticated && user ? (user.email || '') : '',
        countryRegion: ''
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header with illustration */}
        <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Send us Email</h1>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              Atlas-WD is very interested in knowing what you think and how we can better serve you.
            </p>
            <p className="text-gray-600">
              Please take a moment to fill out the form below. (* indicates required fields)
            </p>
          </div>

          {/* Success Message */}
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-800 font-medium">Thank you for contacting us!</p>
              </div>
              <p className="text-green-700 text-sm mt-1">Your message has been sent successfully. We will respond within 2 business days.</p>
            </div>
          )}

          {/* Error Message */}
          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 font-medium">Error sending message</p>
              </div>
              <p className="text-red-700 text-sm mt-1">Please check your information and try again. If the problem persists, please contact us directly.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                1* Main Business Purpose on using Atlas-WD
              </label>
              <div className="space-y-2">
                {businessPurposeOptions.map((option, index) => (
                  <label key={index} className="flex items-start">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.businessPurpose.includes(option)}
                      onChange={() => handleBusinessPurposeChange(option)}
                    />
                    <span className="ml-2 text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-900 mb-2">
                2* Comments
              </label>
              <textarea
                id="comments"
                name="comments"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.comments}
                onChange={handleInputChange}
                placeholder="Please share your thoughts, questions, or feedback..."
              />
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">3* Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.companyName}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="emailAddress"
                    name="emailAddress"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.emailAddress}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="countryRegion" className="block text-sm font-medium text-gray-700 mb-1">
                    Country/Region
                  </label>
                  <input
                    type="text"
                    id="countryRegion"
                    name="countryRegion"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.countryRegion}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium ${
                  isSubmitting 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </div>
                ) : (
                  'SEND'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailUs;
