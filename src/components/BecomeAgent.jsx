import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authStorage, submitAgentApplication } from '../services/authApi';
import { searchProductsEnhanced, searchProducts } from '../services/productApi';
import { getRootCategories } from '../services/categoryApi';
import { getProductThumb } from '../utils/media';
import { getErrorMessage } from '../utils/errorUtils';
import Logo from './common/Logo';
import GlobalFooter from './common/GlobalFooter';
import NigeriaStatesDropdown from './common/NigeriaStatesDropdown';

const BecomeAgent = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    address: '',
    state: '',
    bankName: '',
    accountNumber: '',
    idType: '',
    idNumber: '',
    idDocument: null,
    referralCode: ''
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [error, setError] = useState('');
  
  // Enhanced search state (like landing page)
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestResults, setSuggestResults] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [rootCategories, setRootCategories] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    category: null,
    categoryName: '',
    includeSubcategories: true,
    businessType: '',
    minPrice: '',
    maxPrice: '',
  });

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authStorage.isAuthenticated();
      setIsLoggedIn(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Load root categories for search suggestions
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const roots = await getRootCategories();
        if (isMounted) {
          const data = Array.isArray(roots) ? roots : [];
          setRootCategories(data);
        }
      } catch (e) {
        console.error('Failed to load root categories for search:', e);
        if (isMounted) setRootCategories([]);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Enhanced search suggestions (copied from LandingPage)
  useEffect(() => {
    const term = (searchTerm || '').trim();
    if (term.length < 2) {
      setSuggestResults([]);
      setSuggestOpen(false);
      setSuggestLoading(false);
      return;
    }
    setSuggestLoading(true);
    let active = true;
    const handle = setTimeout(async () => {
      try {
        // Build search parameters with current filters
        const searchParams = {
          q: term,
          page_size: 5,
          ...(searchFilters.category && { category: searchFilters.category }),
          ...(searchFilters.categoryName && { category_name: searchFilters.categoryName }),
          ...(searchFilters.category || searchFilters.categoryName ? { include_subcategories: searchFilters.includeSubcategories } : {}),
          ...(searchFilters.businessType && { business_type: searchFilters.businessType }),
        };

        // Try enhanced search first
        let resultsArr = [];
        try {
          const data = await searchProductsEnhanced(searchParams);
          resultsArr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        } catch (err) {
          console.warn('Enhanced search failed for suggestions, falling back to basic search:', err);
          try {
            const data = await searchProducts({ q: term, page_size: 5 });
            resultsArr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          } catch (fallbackErr) {
            console.error('Both enhanced and basic search failed for suggestions:', fallbackErr);
            resultsArr = [];
          }
        }

        if (!active) return;
        setSuggestResults(resultsArr || []);
        setSuggestOpen(true);
      } catch (e) {
        if (!active) return;
        setSuggestResults([]);
        setSuggestOpen(true);
      } finally {
        if (active) setSuggestLoading(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(handle); };
  }, [searchTerm, searchFilters]);

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setSuggestOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Smart search - detect category names and suggest categories (copied from LandingPage)
  const getCategorySuggestion = (searchTerm) => {
    if (!searchTerm || !rootCategories) return null;
    
    const term = searchTerm.toLowerCase().trim();
    const matchingCategory = rootCategories.find(cat => 
      cat.name.toLowerCase().includes(term) || term.includes(cat.name.toLowerCase())
    );
    
    return matchingCategory;
  };

  // Enhanced search execution (copied from LandingPage)
  const executeEnhancedSearch = (searchText, additionalFilters = {}) => {
    if (!searchText?.trim()) return;
    
    const filters = { ...searchFilters, ...additionalFilters };
    const searchParams = new URLSearchParams();
    
    // Add search parameters
    if (searchText.trim()) searchParams.set('q', searchText.trim());
    if (filters.category) searchParams.set('category', filters.category);
    if (filters.categoryName) searchParams.set('category_name', filters.categoryName);
    if (filters.includeSubcategories !== undefined) searchParams.set('include_subcategories', filters.includeSubcategories);
    if (filters.atlasId) searchParams.set('atlas_id', filters.atlasId);
    if (filters.minPrice) searchParams.set('min_price', filters.minPrice);
    if (filters.maxPrice) searchParams.set('max_price', filters.maxPrice);
    if (filters.businessType) searchParams.set('business_type', filters.businessType);
    
    navigate(`/search?${searchParams.toString()}`);
  };

  // Enhanced search handler
  const handleEnhancedSearch = (searchText = searchTerm) => {
    if (!searchText?.trim()) return;
    
    // Check if there's a category suggestion for this search term
    const categorySuggestion = getCategorySuggestion(searchText);
    
    // Detect Atlas ID pattern (e.g., ATL0JZTVA8O)
    const atlasIdPattern = /^ATL[A-Z0-9]+$/i;
    const filters = { ...searchFilters };
    
    if (atlasIdPattern.test(searchText.trim())) {
      filters.atlasId = searchText.trim().toUpperCase();
      executeEnhancedSearch(searchText.trim(), filters);
    } else if (categorySuggestion) {
      // If there's a category suggestion, navigate to category page instead of searching
      navigate(`/category/${categorySuggestion.id}`);
      return;
    } else {
      executeEnhancedSearch(searchText.trim(), filters);
    }
    
    setSearchTerm('');
    setSuggestResults([]);
    setSuggestOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      idDocument: file
    }));
    // Clear error when user selects file
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check authentication before submitting
    if (!authStorage.isAuthenticated()) {
      setShowLoginModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🔍 BecomeAgent - Form data being submitted:', formData);
      await submitAgentApplication(formData);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Agent application submission error:', error);
      setError(getErrorMessage(error) || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      address: '',
      state: '',
      bankName: '',
      accountNumber: '',
      idType: '',
      idNumber: '',
      idDocument: null
    });
  };


  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    navigate('/');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#027DDB]"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-[#FAFBFC]">
      {/* Enhanced Header Navigation */}
      <header className="w-full bg-white shadow-sm">
        <div className="mx-auto px-4 sm:px-6 py-4 max-w-7xl flex items-center justify-between flex-nowrap gap-4">
          {/* Logo - Optimized size for better layout */}
          <div className="flex-shrink-0">
            <Logo to="/" height="h-10 sm:h-14 md:h-20 lg:h-24" />
          </div>

          {/* Page Title - Hidden on mobile to save space */}
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold text-[#027DDB]">Become an Agent</h1>
          </div>

          {/* Enhanced Search Bar */}
          <div className="relative flex-1 max-w-md search-container">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEnhancedSearch();
                }
              }}
              placeholder="Search products..."
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent text-sm md:text-base"
            />
            <button
              onClick={() => handleEnhancedSearch()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#027DDB] transition-colors"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {searchTerm.trim().length >= 2 && suggestOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="px-3 py-2 text-xs text-gray-500">
                  {suggestLoading ? 'Searching…' : `Results for "${searchTerm.trim()}"`}
                </div>
                <div className="max-h-80 overflow-auto divide-y divide-gray-100">
                  {/* Category suggestion if search term matches a category */}
                  {(() => {
                    const categorySuggestion = getCategorySuggestion(searchTerm.trim());
                    if (categorySuggestion) {
                      return (
                        <div
                          className="flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer border-l-4 border-blue-500 bg-blue-25"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            navigate(`/category/${categorySuggestion.id}`);
                            setSearchTerm('');
                            setSuggestOpen(false);
                          }}
                        >
                          <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-blue-100 mr-3 flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-blue-800 font-medium">Browse {categorySuggestion.name} Category</div>
                            <div className="text-xs text-blue-600">View all products in this category</div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Product search results */}
                  {(!suggestLoading && (!Array.isArray(suggestResults) || suggestResults.length === 0) && !getCategorySuggestion(searchTerm.trim())) && (
                    <div className="px-4 py-3 text-sm text-gray-500">No products found</div>
                  )}
                  {Array.isArray(suggestResults) && suggestResults.map((p) => {
                    const id = p?.id ?? p?.pk ?? p?.uuid;
                    const title = (p?.title || p?.name || 'Untitled').toString();
                    const thumb = getProductThumb(p);
                    const displayTitle = title.length > 60 ? `${title.slice(0, 57)}…` : title;
                    return (
                      <div
                        key={id || title}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (id) navigate(`/product/${id}`);
                          setSearchTerm('');
                          setSuggestOpen(false);
                        }}
                      >
                        <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-100 mr-3">
                          {thumb ? (
                            <img src={thumb} alt={title} className="w-10 h-10 object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No img</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-800 truncate">{displayTitle}</div>
                          <div className="text-xs text-gray-500 truncate">#{id}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Blue accent line */}
        <div className="h-1 bg-[#027DDB]"></div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#027DDB] mb-4">Become Atlas-WD Agent</h1>
          <p className="text-gray-600 text-lg">Earn high commissions and offer your customers reliable products as Atlas-WD Agent</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Become an Agent</h2>



          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <NigeriaStatesDropdown
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                placeholder="Select your state"
              />
            </div>

            {/* Bank Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Identity Verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Means of Identity</label>
              <select
                name="idType"
                value={formData.idType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
                required
              >
                <option value="">Select</option>
                <option value="DRIVERS_LICENSE">Driver's License</option>
                <option value="VOTERS_CARD">Voter's Card</option>
                <option value="INTERNATIONAL_PASSPORT">International Passport</option>
                <option value="NIN">National Identification Number (NIN)</option>
              </select>
            </div>

            {/* Optional Referral Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Code <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleInputChange}
                placeholder="Enter referral code if you have one"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">If provided, it must belong to an agent whose link is paid, active, and not expired.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID/ID Number</label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                placeholder="1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
                required
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Document <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm">
                      <span className="font-medium text-[#027DDB]">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF or PDF (Max 10MB)</p>
                  </div>
                </label>
                {formData.idDocument && (
                  <p className="mt-2 text-sm text-green-600">
                    File selected: {formData.idDocument.name}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#027DDB] text-white py-3 px-6 rounded-md hover:bg-[#0066BB] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </div>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Request Submitted Successfully</h3>
              <p className="text-sm text-gray-500 mb-4">
                Thank you for submitting your application to become Atlas-WD Agent.<br />
                Our team will review your application and inform you of your status via email soon.<br />
                Thank you for your interest in joining our community.
              </p>
              <button
                onClick={closeSuccessModal}
                className="w-full bg-[#027DDB] text-white py-2 px-4 rounded-md hover:bg-[#0066BB] transition-colors"
              >
                Got it
              </button>
              <button
                onClick={closeSuccessModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
              <p className="text-sm text-gray-500 mb-4">
                You need to be logged in to submit an agent application. Please log in to your account first.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleLoginRedirect}
                  className="flex-1 bg-[#027DDB] text-white py-2 px-4 rounded-md hover:bg-[#0066BB] transition-colors"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <GlobalFooter />
    </div>
  );
};

export default BecomeAgent;
