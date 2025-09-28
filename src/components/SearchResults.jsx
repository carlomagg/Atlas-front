import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from './ProductCard';
import ContactModal from './common/ContactModal';
import MessageModal from './common/MessageModal';
import { searchProductsEnhanced, searchProductsResults, searchByAtlasId, retrieveProduct } from '../services/productApi';
import { getProductThumb } from '../utils/media';

const SearchResults = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchMetadata, setSearchMetadata] = useState(null);
  
  // Enhanced product details state
  const [enhancedProducts, setEnhancedProducts] = useState(new Map());
  const [loadingMoreEnhanced, setLoadingMoreEnhanced] = useState(false);
  
  // Contact modal state
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const roleLabel = 'Supplier';
  
  // Message modal state
  const [messageOpen, setMessageOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Parse search parameters from URL
  const parseSearchParams = () => {
    const params = new URLSearchParams(location.search);
    return {
      q: params.get('q') || '',
      category: params.get('category') || '',
      categoryName: params.get('category_name') || '',
      includeSubcategories: params.get('include_subcategories') !== 'false', // Default to true unless explicitly set to false
      atlasId: params.get('atlas_id') || '',
      minPrice: params.get('min_price') || '',
      maxPrice: params.get('max_price') || '',
      businessType: params.get('business_type') || '',
      page: parseInt(params.get('page')) || 1,
    };
  };

  // Execute search based on URL parameters
  const executeSearch = async (params, page = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setSearchLoading(true);
      setSearchError('');
    }
    
    try {
      // Build search parameters
      const searchParams = {
        page: page.toString(),
        page_size: '20',
        ...(params.q && { q: params.q.trim() }),
        ...(params.category && { category: params.category }),
        ...(params.categoryName && { category_name: params.categoryName }),
        ...(params.includeSubcategories !== undefined && { include_subcategories: params.includeSubcategories }),
        ...(params.atlasId && { atlas_id: params.atlasId }),
        ...(params.minPrice && { min_price: params.minPrice }),
        ...(params.maxPrice && { max_price: params.maxPrice }),
        ...(params.businessType && { business_type: params.businessType }),
      };

      let data;
      
      // Try to use the dedicated search results endpoint if we have a search term
      if (params.q && params.q.trim()) {
        try {
          data = await searchProductsResults(searchParams);
        } catch (err) {
          console.warn('Search results endpoint failed, falling back to enhanced search:', err);
          data = await searchProductsEnhanced(searchParams);
        }
      } else {
        // Use enhanced search for other types of searches
        data = await searchProductsEnhanced(searchParams);
      }
      
      const results = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      
      // Process results to ensure proper format
      const processedResults = results.map(p => ({
        ...p,
        id: p.id,
        title: p.title || p.name || 'Untitled',
        thumb: getProductThumb(p),
        rating: Number(p?.highest_rating ?? p?.max_rating ?? p?.average_rating ?? p?.rating ?? 0) || 0,
      }));

      if (append) {
        setSearchResults(prev => [...prev, ...processedResults]);
      } else {
        setSearchResults(processedResults);
      }
      
      // Handle pagination
      const totalCount = data?.count || processedResults.length;
      const nextPage = data?.next;
      setHasMore(Boolean(nextPage) || (page * 20 < totalCount));
      setCurrentPage(page);
      
      // Store search metadata if available
      if (data?.search_metadata) {
        setSearchMetadata(data.search_metadata);
      }
      
      // Fetch enhanced product details for the fields we need
      if (!append) {
        fetchEnhancedProductDetails(processedResults);
      }
      
    } catch (error) {
      console.error('Search failed:', error);
      const msg = error?.data ? JSON.stringify(error.data) : (error?.message || 'Search failed');
      setSearchError(msg);
      if (!append) {
        setSearchResults([]);
      }
    } finally {
      setSearchLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch enhanced product details for the specific fields we need
  const fetchEnhancedProductDetails = async (products) => {
    setLoadingMoreEnhanced(true);
    const newEnhancedProducts = new Map(enhancedProducts);
    
    // Fetch details for products we don't have yet
    const productsToFetch = products.filter(p => !newEnhancedProducts.has(p.id));
    
    try {
      // Fetch all product details in parallel (limit to avoid overwhelming the server)
      const batchSize = 5; // Process 5 products at a time
      for (let i = 0; i < productsToFetch.length; i += batchSize) {
        const batch = productsToFetch.slice(i, i + batchSize);
        const promises = batch.map(async (product) => {
          try {
            const fullProduct = await retrieveProduct(product.id);
            return { id: product.id, data: fullProduct };
          } catch (error) {
            console.error(`Failed to fetch details for product ${product.id}:`, error);
            return { id: product.id, data: null };
          }
        });
        
        const results = await Promise.all(promises);
        results.forEach(({ id, data }) => {
          if (data) {
            newEnhancedProducts.set(id, data);
          }
        });
        
        // Update state after each batch
        setEnhancedProducts(new Map(newEnhancedProducts));
      }
    } catch (error) {
      console.error('Failed to fetch enhanced product details:', error);
    } finally {
      setLoadingMoreEnhanced(false);
    }
  };

  // Load more results
  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const params = parseSearchParams();
    executeSearch(params, currentPage + 1, true);
  };

  // Execute search when URL changes
  useEffect(() => {
    const params = parseSearchParams();
    
    // Only search if we have search parameters
    if (params.q || params.category || params.categoryName || params.atlasId || params.minPrice || params.maxPrice) {
      executeSearch(params, params.page);
    } else {
      // No search parameters, redirect to home
      navigate('/');
    }
  }, [location.search, navigate]);

  // Get current search filters for display
  const getCurrentFilters = () => {
    const params = parseSearchParams();
    const filters = [];
    
    if (params.q) {
      filters.push({
        type: 'search',
        label: `"${params.q}"`,
        color: 'bg-blue-100 text-blue-800'
      });
    }
    
    if (params.categoryName) {
      filters.push({
        type: 'category',
        label: params.categoryName,
        color: 'bg-green-100 text-green-800'
      });
    }
    
    if (params.atlasId) {
      filters.push({
        type: 'atlas',
        label: `Atlas ID: ${params.atlasId}`,
        color: 'bg-purple-100 text-purple-800'
      });
    }
    
    if (params.minPrice || params.maxPrice) {
      const priceLabel = params.minPrice && params.maxPrice 
        ? `₦${params.minPrice} - ₦${params.maxPrice}`
        : params.minPrice 
        ? `From ₦${params.minPrice}`
        : `Up to ₦${params.maxPrice}`;
      filters.push({
        type: 'price',
        label: priceLabel,
        color: 'bg-yellow-100 text-yellow-800'
      });
    }
    
    if (params.businessType) {
      const businessTypes = {
        'ASSOCIATION': 'Association',
        'RETAILER': 'Retailer', 
        'MANUFACTURER': 'Manufacturer',
        'DISTRIBUTOR': 'Distributor'
      };
      filters.push({
        type: 'business',
        label: businessTypes[params.businessType] || params.businessType,
        color: 'bg-indigo-100 text-indigo-800'
      });
    }
    
    return filters;
  };

  const clearAllFilters = () => {
    navigate('/');
  };

  const removeFilter = (filterType) => {
    const params = parseSearchParams();
    const newParams = new URLSearchParams();
    
    // Keep all params except the one being removed
    Object.entries(params).forEach(([key, value]) => {
      if (value && !shouldRemoveParam(key, filterType)) {
        newParams.set(key, value);
      }
    });
    
    if (newParams.toString()) {
      navigate(`/search?${newParams.toString()}`);
    } else {
      navigate('/');
    }
  };

  const shouldRemoveParam = (paramKey, filterType) => {
    switch (filterType) {
      case 'search': return paramKey === 'q';
      case 'category': return paramKey === 'category' || paramKey === 'category_name' || paramKey === 'include_subcategories';
      case 'atlas': return paramKey === 'atlas_id';
      case 'price': return paramKey === 'min_price' || paramKey === 'max_price';
      case 'business': return paramKey === 'business_type';
      default: return false;
    }
  };

  const currentFilters = getCurrentFilters();
  const params = parseSearchParams();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/" className="flex items-center text-[#027DDB] hover:text-[#0266b3] transition-colors mb-1 sm:mb-0">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('backToHome') || 'Back to Home'}
            </Link>
            
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800 text-center sm:text-left">
              {t('searchResults') || 'Search Results'}
            </h1>
            
            <div className="hidden sm:block w-24"></div> {/* Spacer for centering on larger screens */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search Info and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {searchLoading ? (t('searching') || 'Searching...') : 
                 searchResults.length > 0 ? 
                   `${searchResults.length} ${t('productsFound') || 'products found'}` :
                   (t('noProductsFound') || 'No products found')
                }
              </h2>
              {searchMetadata && (
                <p className="text-gray-600">
                  {t('totalResults') || 'Total results'}: {searchMetadata.total_results}
                </p>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {currentFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {currentFilters.map((filter, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${filter.color}`}
                >
                  {filter.label}
                  <button
                    onClick={() => removeFilter(filter.type)}
                    className="ml-2 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('clearAll') || 'Clear All'}
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {searchLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array(8).fill().map((_, i) => (
              <div key={i} className="h-64 rounded-lg border animate-pulse bg-gray-100" />
            ))}
          </div>
        )}

        {/* Error State */}
        {searchError && !searchLoading && (
          <div className="text-center py-12">
            <div className="text-red-600 mb-2">{t('searchError') || 'Search Error'}</div>
            <div className="text-gray-600 mb-4">{searchError}</div>
            <button
              onClick={() => executeSearch(parseSearchParams())}
              className="bg-[#027DDB] text-white px-4 py-2 rounded-lg hover:bg-[#0266b3] transition-colors"
            >
              {t('tryAgain') || 'Try Again'}
            </button>
          </div>
        )}

        {/* Results List */}
        {!searchLoading && !searchError && searchResults.length > 0 && (
          <>
            <div className="space-y-6">
              {searchResults.map((product, index) => {
                // Get enhanced product data if available, otherwise show loading or basic info
                const enhancedProduct = enhancedProducts.get(product.id);
                
                const getSpecPreview = () => {
                  const stripHtml = (s) => String(s).replace(/<[^>]*>/g, ' ');
                  const getOrFallback = (val, emptyMsg) => {
                    if (val === null || val === undefined) return emptyMsg;
                    if (typeof val === 'string') {
                      const plain = stripHtml(val).replace(/\s+/g, ' ').trim();
                      return plain ? val.trim() : emptyMsg;
                    }
                    if (typeof val === 'number' && !Number.isNaN(val)) return String(val);
                    if (Array.isArray(val)) {
                      const joined = val.map((x) => (x && typeof x === 'object' ? Object.values(x).join(' ') : String(x))).join(', ');
                      const plain = joined.replace(/\s+/g, ' ').trim();
                      return plain || emptyMsg;
                    }
                    if (typeof val === 'object') {
                      const cand = val.text || val.value || val.content || JSON.stringify(val);
                      const plain = stripHtml(cand).replace(/\s+/g, ' ').trim();
                      return plain || emptyMsg;
                    }
                    return emptyMsg;
                  };
                  
                  const rows = [];
                  
                  if (enhancedProduct) {
                    // Match ProductDetails preview fields exactly
                    rows.push(
                      { label: 'Product Type', value: getOrFallback(enhancedProduct?.product_type, '—') },
                      { label: 'Article/Model No', value: getOrFallback(enhancedProduct?.article_model_no, '—') },
                      { label: 'Keywords', value: getOrFallback(enhancedProduct?.keywords, '—') },
                    );
                    
                    // Add specifications if available
                    const specPairs = (() => {
                      const arr = Array.isArray(enhancedProduct?.specifications) ? enhancedProduct.specifications : [];
                      if (arr.length === 0) return [];
                      const titleCase = (s) => {
                        if (!s) return '-';
                        const str = String(s).trim();
                        return str.charAt(0).toUpperCase() + str.slice(1);
                      };
                      const map = new Map();
                      let order = 0;
                      for (const r of arr) {
                        const rawName = r?.name ?? '';
                        const key = String(rawName).trim().toLowerCase();
                        // Allow all specifications in preview (including color)
                        const val = getOrFallback(r?.value, '—');
                        if (!map.has(key)) {
                          map.set(key, { label: titleCase(rawName || '-'), values: new Set(), order: order++ });
                        }
                        if (val && val !== '—') {
                          map.get(key).values.add(String(val));
                        }
                      }
                      const grouped = Array.from(map.values())
                        .sort((a, b) => a.order - b.order)
                        .slice(0, 6)
                        .map((g) => ({ label: g.label, value: Array.from(g.values).join(', ') || '—' }));
                      return grouped;
                    })();
                    
                    rows.push(...specPairs);
                  } else {
                    // Show loading state or basic info while enhanced data is being fetched
                    if (loadingMoreEnhanced) {
                      rows.push({ label: 'Loading details...', value: '⏳' });
                    } else {
                      // Fallback to basic search data
                      if (product?.product_type) {
                        rows.push({ label: 'Product Type', value: product.product_type });
                      }
                      rows.push({ label: 'Loading additional details...', value: '⏳' });
                    }
                  }
                  
                  return rows;
                };

                const specPreview = getSpecPreview();

                return (
                  <div key={product.id || index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Product Image with Buttons */}
                      <div className="flex-shrink-0 w-full lg:w-60 lg:mr-4">
                        <Link 
                          to={`/product/${product.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full lg:w-48 h-48 bg-gray-100 rounded-lg overflow-hidden mb-3 hover:opacity-90 transition-opacity"
                        >
                          {product.thumb || product.primary_image || product.image_url ? (
                            <img 
                              src={product.thumb || product.primary_image || product.image_url} 
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </Link>
                        
                        {/* Action Buttons under image */}
                        <div className="flex gap-2 w-full lg:w-60 mt-3 mb-5 relative z-20">
                          <button
                            onClick={() => {
                              setSelectedProductId(product.id);
                              setContactOpen(true);
                            }}
                            className="flex-1 px-3 py-2 bg-[#027DDB] text-white text-xs font-medium rounded-lg hover:bg-[#0266b3] transition-colors"
                          >
                            Contact Seller
                          </button>
                          
                          <button
                            onClick={() => {
                              console.log('Product data for messaging:', product);
                              setSelectedProduct(product);
                              setMessageOpen(true);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Leave A Message
                          </button>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 relative z-0">
                        {/* Product Title - Clickable */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                          <Link 
                            to={`/product/${product.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#027DDB] transition-colors"
                          >
                            {product.title}
                          </Link>
                        </h3>

                        {/* Rating */}
                        {product.rating > 0 && (
                          <div className="flex items-center mb-3">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="ml-2 text-sm text-gray-600">({product.rating})</span>
                            </div>
                          </div>
                        )}

                        {/* Description Preview */}
                        {product.description && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {product.description}
                            </p>
                          </div>
                        )}

                        {/* Specifications Preview */}
                        {specPreview.length > 0 && (
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                              <h4 className="text-sm font-medium text-gray-800">Product Details</h4>
                            </div>
                            <div className="divide-y divide-gray-100">
                              {specPreview.map((spec, i) => (
                                <div key={i} className="flex">
                                  <div className="w-1/3 px-3 py-2 text-xs text-gray-600 bg-gray-50 border-r border-gray-200">
                                    {spec.label}
                                  </div>
                                  <div className="flex-1 px-3 py-2 text-xs text-gray-800">
                                    {spec.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    loadingMore 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-[#027DDB] text-white hover:bg-[#0266b3]'
                  }`}
                >
                  {loadingMore ? (t('loading') || 'Loading...') : (t('loadMore') || 'Load More')}
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!searchLoading && !searchError && searchResults.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('noProductsFound') || 'No products found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('tryDifferentSearch') || 'Try adjusting your search terms or filters'}
            </p>
            <Link
              to="/"
              className="bg-[#027DDB] text-white px-6 py-3 rounded-lg hover:bg-[#0266b3] transition-colors inline-block"
            >
              {t('backToHome') || 'Back to Home'}
            </Link>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      <ContactModal 
        open={contactOpen} 
        onClose={() => setContactOpen(false)} 
        roleLabel={roleLabel} 
        productId={selectedProductId} 
      />

      {/* Message Modal */}
      <MessageModal
        isOpen={messageOpen}
        onClose={() => {
          setMessageOpen(false);
          setSelectedProduct(null);
        }}
        productId={selectedProduct?.id}
        productTitle={selectedProduct?.title}
        recipientInfo={{
          email: selectedProduct?.seller_info?.email || selectedProduct?.seller_email || selectedProduct?.user_email || selectedProduct?.email,
          atlas_id: selectedProduct?.seller_info?.atlas_id || selectedProduct?.seller_info?.atlasId || selectedProduct?.seller_atlas_id || selectedProduct?.user_atlas_id || selectedProduct?.atlas_id,
          user: selectedProduct?.seller_info?.id || selectedProduct?.seller_id || selectedProduct?.user_id || selectedProduct?.user,
          name: selectedProduct?.seller_info?.full_name || selectedProduct?.seller_info?.name || selectedProduct?.seller_name || selectedProduct?.user_name || selectedProduct?.company_name
        }}
      />
    </div>
  );
};

export default SearchResults;
