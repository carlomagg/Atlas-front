import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchTopRankingProducts, fetchTopRankingProductsByCategory, searchProductsEnhanced, searchProducts } from '../services/productApi';
import { listCategories, getRootCategories } from '../services/categoryApi';
import { getProductThumb } from '../utils/media';
import ProductCard from './ProductCard';
import Logo from './common/Logo';

export default function TopRanking() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState({});

  // Search state (copied from ProductDetails)
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestResults, setSuggestResults] = useState([]);
  const [rootCategories, setRootCategories] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    category: null,
    categoryName: '',
    includeSubcategories: true,
    businessType: '',
    minPrice: '',
    maxPrice: '',
  });
  
  // Mobile search state (enhanced like landing page)
  const [mobileSearchTerm, setMobileSearchTerm] = useState('');
  const [mobileSuggestResults, setMobileSuggestResults] = useState([]);
  const [mobileSuggestLoading, setMobileSuggestLoading] = useState(false);

  const productsPerCategory = 12; // Show 12 products per category initially

  // Load categories and their top ranking products
  const loadCategoriesAndProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch ALL categories (both root and subcategories)
      const categoriesResponse = await listCategories({}); // Get ALL categories (no parent filter)
      const allCategories = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse?.results || []);
      
      // Filter to get categories that have products (you can also show all)
      // Option 1: Show ALL categories (root + subcategories)
      const mainCategories = allCategories;
      
      // Option 2: If you want to organize by hierarchy, uncomment below:
      // const rootCategories = allCategories.filter(cat => !cat.parent);
      // const subCategories = allCategories.filter(cat => cat.parent);
      // const mainCategories = [...rootCategories, ...subCategories]; // Root first, then subs
      setCategories(mainCategories);

      // Load products for each category
      const categoryProductsData = {};
      
      for (const category of mainCategories) {
        try {
          setLoadingCategories(prev => ({ ...prev, [category.id]: true }));
          
          const response = await fetchTopRankingProductsByCategory(category.id, 1, productsPerCategory);
          const products = Array.isArray(response) ? response : (response?.results || []);
          
          categoryProductsData[category.id] = {
            products: products,
            totalCount: Array.isArray(response) ? products.length : (response?.count || 0),
            hasMore: products.length >= productsPerCategory
          };
        } catch (err) {
          console.error(`Error loading products for category ${category.name}:`, err);
          categoryProductsData[category.id] = {
            products: [],
            totalCount: 0,
            hasMore: false,
            error: err.message
          };
        } finally {
          setLoadingCategories(prev => ({ ...prev, [category.id]: false }));
        }
      }

      setCategoryProducts(categoryProductsData);

    } catch (err) {
      console.error('Error loading categories and products:', err);
      setError(err.message || 'Failed to load top ranking products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoriesAndProducts();
  }, []);


  // Mobile search suggestions (copied from LandingPage)
  useEffect(() => {
    const term = (mobileSearchTerm || '').trim();
    if (term.length < 2) {
      setMobileSuggestResults([]);
      setMobileSuggestLoading(false);
      return;
    }
    setMobileSuggestLoading(true);
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
          console.warn('Enhanced search failed for mobile suggestions, falling back to basic search:', err);
          try {
            const data = await searchProducts({ q: term, page_size: 5 });
            resultsArr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          } catch (fallbackErr) {
            console.error('Both enhanced and basic search failed for mobile suggestions:', fallbackErr);
            resultsArr = [];
          }
        }

        if (!active) return;
        setMobileSuggestResults(resultsArr || []);
      } catch (e) {
        if (!active) return;
        setMobileSuggestResults([]);
      } finally {
        if (active) setMobileSuggestLoading(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(handle); };
  }, [mobileSearchTerm, searchFilters]);


  // Mobile search handler (enhanced like LandingPage)
  const handleMobileSearch = (searchText = mobileSearchTerm) => {
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
    
    setMobileSearchTerm('');
    setMobileSuggestResults([]);
  };

  // Search functions (copied from ProductDetails)
  const getCategorySuggestion = (searchTerm) => {
    if (!searchTerm || !rootCategories) return null;
    
    const term = searchTerm.toLowerCase().trim();
    const matchingCategory = rootCategories.find(cat => 
      cat.name.toLowerCase().includes(term) || term.includes(cat.name.toLowerCase())
    );
    
    return matchingCategory;
  };

  const executeEnhancedSearch = (searchText, additionalFilters = {}) => {
    const filters = { ...searchFilters, ...additionalFilters };
    const params = new URLSearchParams();
    
    if (searchText?.trim()) params.set('q', searchText.trim());
    if (filters.category) params.set('category', filters.category);
    if (filters.categoryName) params.set('category_name', filters.categoryName);
    if (filters.includeSubcategories !== undefined) params.set('include_subcategories', filters.includeSubcategories);
    if (filters.businessType) params.set('business_type', filters.businessType);
    if (filters.minPrice) params.set('min_price', filters.minPrice);
    if (filters.maxPrice) params.set('max_price', filters.maxPrice);
    if (filters.atlasId) params.set('atlas_id', filters.atlasId);
    
    // Navigate to dedicated search results page
    navigate(`/search?${params.toString()}`);
  };

  // Load root categories for search suggestions
  useEffect(() => {
    const loadRootCategories = async () => {
      try {
        const data = await getRootCategories();
        setRootCategories(Array.isArray(data) ? data : (data?.results || []));
      } catch (error) {
        console.error('Failed to load categories for search:', error);
      }
    };
    loadRootCategories();
  }, []);

  // Search suggestions effect (copied from ProductDetails)
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
        };

        // Try enhanced search first
        let resultsArr = [];
        try {
          const data = await searchProductsEnhanced(searchParams);
          resultsArr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        } catch (err) {
          console.warn('Enhanced search failed for suggestions, falling back to basic search:', err);
          // Fallback to basic search if enhanced fails
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
  }, [searchTerm, searchFilters.category, searchFilters.categoryName, searchFilters.includeSubcategories]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestOpen && !event.target.closest('.search-container')) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [suggestOpen]);

  const getImageUrl = (product) => {
    return product.primary_image || 
           product.thumb || 
           product.image_url || 
           (product.media && product.media[0]?.file) ||
           null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        {/* Header with Gradient Colors */}
        <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Top Ranking Products</h1>
              <p className="text-xl text-orange-100 mb-8">
                Discover the highest-ranked products from our premium sellers across all categories
              </p>
              
              {/* Mobile Search Bar */}
              <div className="sm:hidden mt-6 max-w-md mx-auto">
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
                    placeholder="Search products..."
                    className="w-full px-4 py-3 pr-12 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                  <button
                    onClick={() => handleMobileSearch()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  {mobileSearchTerm.trim().length >= 2 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="px-3 py-2 text-xs text-gray-500">
                        {mobileSuggestLoading ? 'Searching…' : `Results for "${mobileSearchTerm.trim()}"`}
                      </div>
                      <div className="max-h-80 overflow-auto divide-y divide-gray-100">
                        {/* Category suggestion if search term matches a category */}
                        {(() => {
                          const categorySuggestion = getCategorySuggestion(mobileSearchTerm.trim());
                          if (categorySuggestion) {
                            return (
                              <div
                                className="flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer border-l-4 border-blue-500 bg-blue-25"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  navigate(`/category/${categorySuggestion.id}`);
                                  setMobileSearchTerm('');
                                  setMobileSuggestResults([]);
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
                        {(!mobileSuggestLoading && (!Array.isArray(mobileSuggestResults) || mobileSuggestResults.length === 0) && !getCategorySuggestion(mobileSearchTerm.trim())) && (
                          <div className="px-4 py-3 text-sm text-gray-500">No products found</div>
                        )}
                        {Array.isArray(mobileSuggestResults) && mobileSuggestResults.map((p) => {
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
                                setMobileSearchTerm('');
                                setMobileSuggestResults([]);
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
            </div>
          </div>
        </div>

        {/* Loading Categories */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {[...Array(4)].map((_, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(12)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 animate-pulse">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="p-3">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center px-4">
        <div className="max-w-xl w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-red-500 mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Error Loading Products</h1>
          <p className="mt-3 text-gray-600">{error}</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={loadCategoriesAndProducts}
              className="px-5 py-2.5 rounded-lg bg-[#027DDB] text-white hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header with Gradient Colors */}
      <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Top Ranking Products</h1>
            <p className="text-xl text-orange-100 mb-8">
              Discover the highest-ranked products from our premium sellers across all categories
            </p>
            
            {/* Mobile Search Bar */}
            <div className="sm:hidden mt-6 max-w-md mx-auto">
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
                  placeholder="Search products..."
                  className="w-full px-4 py-3 pr-12 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-gray-900 placeholder-gray-500"
                />
                <button
                  onClick={() => handleMobileSearch()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                {mobileSearchTerm.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="px-3 py-2 text-xs text-gray-500">
                      {mobileSuggestLoading ? 'Searching…' : `Results for "${mobileSearchTerm.trim()}"`}
                    </div>
                    <div className="max-h-80 overflow-auto divide-y divide-gray-100">
                      {/* Category suggestion if search term matches a category */}
                      {(() => {
                        const categorySuggestion = getCategorySuggestion(mobileSearchTerm.trim());
                        if (categorySuggestion) {
                          return (
                            <div
                              className="flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer border-l-4 border-blue-500 bg-blue-25"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                navigate(`/category/${categorySuggestion.id}`);
                                setMobileSearchTerm('');
                                setMobileSuggestResults([]);
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
                      {(!mobileSuggestLoading && (!Array.isArray(mobileSuggestResults) || mobileSuggestResults.length === 0) && !getCategorySuggestion(mobileSearchTerm.trim())) && (
                        <div className="px-4 py-3 text-sm text-gray-500">No products found</div>
                      )}
                      {Array.isArray(mobileSuggestResults) && mobileSuggestResults.map((p) => {
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
                              setMobileSearchTerm('');
                              setMobileSuggestResults([]);
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
          </div>
        </div>
      </div>

      {/* Categories and Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
            <p className="text-gray-500">There are no categories with top ranking products available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => {
              const categoryData = categoryProducts[category.id] || { products: [], totalCount: 0, hasMore: false };
              const isLoading = loadingCategories[category.id];
              
              return (
                <div key={category.id} className="category-section">
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {category.parent ? (
                          <span className="flex items-center">
                            <span className="text-gray-500 text-lg mr-2">└</span>
                            Top {category.name}
                            <span className="text-sm text-gray-500 ml-2">(Subcategory)</span>
                          </span>
                        ) : (
                          `Top ${category.name}`
                        )}
                      </h2>
                    </div>
                    <Link
                      to={`/category/${category.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center space-x-1"
                    >
                      <span>View All</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>

                  {/* Category Products */}
                  {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {[...Array(12)].map((_, index) => (
                        <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 animate-pulse">
                          <div className="aspect-square bg-gray-200"></div>
                          <div className="p-3">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : categoryData.error ? (
                    <div className="text-center py-8 bg-red-50 rounded-lg">
                      <p className="text-red-600">Error loading {category.name} products: {categoryData.error}</p>
                    </div>
                  ) : categoryData.products.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No top ranking products found in {category.name}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {categoryData.products.map((product) => (
                        <ProductCard
                          key={product.id}
                          id={product.id}
                          imageUrl={getImageUrl(product)}
                          title={product.title}
                          rating={product.avg_rating || 0}
                          subscriptionBadge={product.subscription_badge || product.package_name}
                          dailyBoosterBadge={product.daily_booster_badge}
                          isBoosted={product.is_boosted}
                          boosterEndDate={product.booster_end_date}
                          boosterStatus={product.booster_status}
                          subscriptionEndDate={product.subscription_end_date}
                          subscriptionStatus={product.subscription_status}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
