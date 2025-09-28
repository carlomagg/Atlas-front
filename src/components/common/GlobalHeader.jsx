import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authStorage, logout } from '../../services/authApi';
import { getProductThumb } from '../../utils/media';
import { searchProducts, searchProductsEnhanced, searchProductsResults, searchByAtlasId } from '../../services/productApi';
import { getRootCategories, getCategoryDetail } from '../../services/categoryApi';
import { getNotificationCounts } from '../../services/messagesApi';
import { listProductRequests } from '../../services/productRequestApi';
import Logo from './Logo';

const GlobalHeader = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileSearchTerm, setMobileSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState({});
  const [suggestResults, setSuggestResults] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [mobileSuggestResults, setMobileSuggestResults] = useState([]);
  const [mobileSuggestLoading, setMobileSuggestLoading] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  // Dropdown states
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  
  // Categories and mega menu
  const [rootCategories, setRootCategories] = useState([]);
  const [categoryTrees, setCategoryTrees] = useState({});
  const [loadingTrees, setLoadingTrees] = useState({});
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [hoveredRootId, setHoveredRootId] = useState(null);
  
  // User state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAtlasId, setUserAtlasId] = useState(null);
  const [businessVerificationStatus, setBusinessVerificationStatus] = useState('UNVERIFIED');
  const [isLoading, setIsLoading] = useState(true);
  
  // Notifications
  const [notif, setNotif] = useState({ unread_messages: 0, active_conversations: 0, total_conversations: 0 });
  const [prTotalCount, setPrTotalCount] = useState(0);

  // Refs
  const controllersRef = useRef({});
  const megaCloseTimeout = useRef(null);
  const hoverCloseTimeout = useRef(null);


  // Initialize authentication state
  useEffect(() => {
    const syncWithAuthContext = () => {
      if (isAuthenticated && user) {
        setUserAtlasId(user.atlasId || user.atlas_id || user.email?.split('@')[0]);
        setBusinessVerificationStatus(
          user.businessVerificationStatus ||
          user.business_verification_status ||
          'UNVERIFIED'
        );
        setIsLoggedIn(true);
      } else {
        setUserAtlasId(null);
        setBusinessVerificationStatus('UNVERIFIED');
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    };

    syncWithAuthContext();
  }, [isAuthenticated, user]);

  // Poll notifications when logged in
  useEffect(() => {
    let timer;
    let aborted = false;
    
    const fetchCounts = async () => {
      if (!isLoggedIn) return;
      try {
        const [notifData, prList] = await Promise.all([
          getNotificationCounts(),
          listProductRequests({ page: 1, page_size: 1 })
        ]);
        
        if (aborted) return;
        
        setNotif({
          unread_messages: notifData?.unread_messages || 0,
          active_conversations: notifData?.active_conversations || 0,
          total_conversations: notifData?.total_conversations || 0
        });
        
        const prCount = typeof prList?.count === 'number' ? prList.count : 0;
        setPrTotalCount(prCount);
      } catch (error) {
        if (!aborted) {
          console.warn('Failed to fetch notification counts:', error);
        }
      }
    };

    if (isLoggedIn) {
      fetchCounts();
      timer = setInterval(fetchCounts, 30000);
    }
    
    return () => { 
      aborted = true; 
      if (timer) clearInterval(timer); 
    };
  }, [isLoggedIn]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.account-dropdown')) {
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsMobileSearchOpen(false);
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Enhanced search function
  const executeEnhancedSearch = (searchText, additionalFilters = {}) => {
    if (!searchText?.trim()) return;
    
    const filters = { ...searchFilters, ...additionalFilters };
    const searchParams = new URLSearchParams();
    
    // Add search parameters
    if (searchText.trim()) searchParams.set('q', searchText.trim());
    if (filters.category) searchParams.set('category', filters.category);
    if (filters.categoryName) searchParams.set('category_name', filters.categoryName);
    if (filters.atlasId) searchParams.set('atlas_id', filters.atlasId);
    if (filters.minPrice) searchParams.set('min_price', filters.minPrice);
    if (filters.maxPrice) searchParams.set('max_price', filters.maxPrice);
    if (filters.businessType) searchParams.set('business_type', filters.businessType);
    
    navigate(`/search?${searchParams.toString()}`);
  };

  // Mobile search handler
  const handleMobileSearch = (searchText = mobileSearchTerm) => {
    if (!searchText?.trim()) return;
    
    const atlasIdPattern = /^ATL[A-Z0-9]+$/i;
    const filters = { ...searchFilters };
    
    if (atlasIdPattern.test(searchText.trim())) {
      filters.atlasId = searchText.trim().toUpperCase();
    }
    
    executeEnhancedSearch(searchText.trim(), filters);
    setIsMobileSearchOpen(false);
  };

  // Authentication handlers
  const handleSignIn = () => navigate('/login');
  const handleSignUp = () => navigate('/auth/register');
  const handleLogout = async () => {
    try {
      await authLogout();
      await logout();
      setIsLoggedIn(false);
      setUserAtlasId(null);
      setBusinessVerificationStatus('UNVERIFIED');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  // Status styling helper
  const getStatusStyling = (status) => {
    switch (status?.toLowerCase()) {
      case 'unverified':
      case 'not_verified':
        return {
          bgColor: 'bg-gray-100 text-gray-800',
          dotColor: 'bg-gray-400',
          textColor: 'text-gray-600',
          icon: '!',
          label: 'Unverified'
        };
      case 'verified':
      case 'approved':
        return {
          bgColor: 'bg-green-100 text-green-800',
          dotColor: 'bg-green-500',
          textColor: 'text-green-600',
          icon: '✓',
          label: 'Verified'
        };
      case 'rejected':
        return {
          bgColor: 'bg-red-100 text-red-800',
          dotColor: 'bg-red-500',
          textColor: 'text-red-600',
          icon: '✗',
          label: 'Rejected'
        };
      case 'pending':
        return {
          bgColor: 'bg-yellow-100 text-yellow-800',
          dotColor: 'bg-yellow-500',
          textColor: 'text-yellow-600',
          icon: '⏳',
          label: 'Pending'
        };
      default:
        return {
          bgColor: 'bg-gray-100 text-gray-800',
          dotColor: 'bg-gray-400',
          textColor: 'text-gray-600',
          icon: '!',
          label: 'Unverified'
        };
    }
  };

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="mx-auto px-2 sm:px-4 py-5 max-w-none flex items-center justify-between flex-nowrap">
        <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-8 flex-nowrap min-w-0">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo to="/" height="h-10 sm:h-14 md:h-20 lg:h-24" />
          </div>

          {/* Product text */}
          <div className="hidden xl:flex items-center">
            <span className="text-gray-700 text-lg">Product</span>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:block relative flex-none w-[120px] sm:w-[140px] lg:w-[180px] xl:w-[220px] ml-1 sm:ml-2 lg:ml-3 mr-2 sm:mr-3 lg:mr-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter') { 
                  const searchText = searchTerm.trim();
                  if (!searchText) return;
                  
                  const atlasIdPattern = /^ATL[A-Z0-9]+$/i;
                  const filters = { ...searchFilters };
                  
                  if (atlasIdPattern.test(searchText)) {
                    filters.atlasId = searchText.toUpperCase();
                  }
                  
                  executeEnhancedSearch(searchText, filters);
                } 
              }}
              placeholder={t('searchPlaceholder') || "Enter keyword, Atlas ID (ATL...), or product name..."}
              className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
            />
            <button
              onClick={() => {
                const searchText = searchTerm.trim();
                if (!searchText) return;
                
                const atlasIdPattern = /^ATL[A-Z0-9]+$/i;
                const filters = { ...searchFilters };
                
                if (atlasIdPattern.test(searchText)) {
                  filters.atlasId = searchText.toUpperCase();
                }
                
                executeEnhancedSearch(searchText, filters);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#027DDB] text-white p-2 rounded-md hover:bg-[#0266b3] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6 flex-nowrap shrink-0 ml-4">
          {/* Mobile Atlas ID and Account */}
          <div className="flex lg:hidden items-center min-w-0">
            <div className="text-xs min-w-0 max-w-[120px]">
              {isLoading ? (
                <span className="animate-pulse text-gray-700 text-xs">Loading...</span>
              ) : (
                <div className="flex flex-col items-end min-w-0">
                  <div className="text-gray-700 font-medium text-xs whitespace-nowrap">Atlas-WD</div>
                  <div className="flex items-center space-x-1 min-w-0">
                    <span className="text-gray-600 text-xs truncate max-w-[80px]">
                      {isLoggedIn && userAtlasId ? `#${userAtlasId}` : 'Guest'}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isLoggedIn ? getStatusStyling(businessVerificationStatus).dotColor : 'bg-gray-400'
                    }`}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Account Dropdown */}
          <div className="hidden lg:block relative account-dropdown">
            <button
              type="button"
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="flex items-center space-x-2 text-gray-700 hover:text-[#027DDB] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-lg">Account</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Account Dropdown Menu */}
            {isAccountDropdownOpen && (
              <div className="absolute right-0 top-full mt-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-[9999]">
                <div className="py-2">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                        <div className="font-medium">ATLAS ID: {userAtlasId}</div>
                        <div className={`text-xs ${isAuthenticated ? getStatusStyling(businessVerificationStatus).textColor : 'text-gray-600'}`}>
                          {isAuthenticated ? `${getStatusStyling(businessVerificationStatus).icon} ${getStatusStyling(businessVerificationStatus).label}` : 'Guest'}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          navigate('/dashboard');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>Dashboard</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          navigate('/dashboard/verification');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Verify your business</span>
                        </div>
                      </button>
                      <hr className="my-2 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Logout</span>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleSignIn}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          <span>Sign In</span>
                        </div>
                      </button>
                      <button
                        onClick={handleSignUp}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          <span>Sign Up</span>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Navigation Icons */}
          <div className="flex sm:hidden items-center space-x-2">
            {/* Mobile Search Icon */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-1 text-gray-700 hover:text-[#027DDB] transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Messages */}
            <button
              onClick={() => navigate('/dashboard/message-guide?tab=inbox')}
              className="relative p-1 text-gray-700 hover:text-[#027DDB] transition-colors"
              aria-label="Messages"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {isLoggedIn && notif.unread_messages > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
                  {Math.min(99, notif.unread_messages)}
                </span>
              )}
            </button>

            {/* Mobile Account Dropdown */}
            <div className="relative account-dropdown">
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="p-1 text-gray-700 hover:text-[#027DDB] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Mobile Account Dropdown Menu */}
              {isAccountDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-2">
                    {isLoggedIn ? (
                      <>
                        <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                          <div className="font-medium">ATLAS ID: {userAtlasId}</div>
                          <div className={`text-xs ${isLoggedIn ? getStatusStyling(businessVerificationStatus).textColor : 'text-gray-600'}`}>
                            {isLoggedIn ? `${getStatusStyling(businessVerificationStatus).icon} ${getStatusStyling(businessVerificationStatus).label}` : 'Guest'}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsAccountDropdownOpen(false);
                            navigate('/dashboard');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>Dashboard</span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setIsAccountDropdownOpen(false);
                            navigate('/dashboard/verification');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Verify your business</span>
                          </div>
                        </button>
                        <hr className="my-2 border-gray-200" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                          </div>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleSignIn}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            <span>Sign In</span>
                          </div>
                        </button>
                        <button
                          onClick={handleSignUp}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span>Sign Up</span>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <button onClick={() => navigate('/dashboard/message-guide?tab=inbox')} className="relative hidden md:flex items-center space-x-2 text-gray-700 hover:text-[#027DDB] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="hidden lg:inline text-lg">Messages</span>
            {isLoggedIn && notif.unread_messages > 0 && (
              <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
                {Math.min(99, notif.unread_messages)}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* Mobile Search Modal */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-4">
          <div className="bg-white w-full max-w-md mx-4 rounded-lg shadow-lg">
            <div className="bg-[#027DDB] text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Search Products</h3>
                <button
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="text-white hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="relative">
                <input
                  type="text"
                  value={mobileSearchTerm}
                  onChange={(e) => setMobileSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleMobileSearch();
                    }
                  }}
                  placeholder="Enter keyword, Atlas ID, or product name..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={() => handleMobileSearch()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#027DDB] text-white p-2 rounded-md hover:bg-[#0266b3] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default GlobalHeader;
