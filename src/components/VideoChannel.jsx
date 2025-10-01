import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listAllProductVideos, searchProductsEnhanced, searchProducts } from '../services/productApi';
import { getRootCategories } from '../services/categoryApi';
import { resolveMediaUrl, getProductThumb } from '../utils/media';

export default function VideoChannel() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Mobile search state (enhanced like landing page)
  const [mobileSearchTerm, setMobileSearchTerm] = useState('');
  const [mobileSuggestResults, setMobileSuggestResults] = useState([]);
  const [mobileSuggestLoading, setMobileSuggestLoading] = useState(false);
  const [rootCategories, setRootCategories] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    category: null,
    categoryName: '',
    includeSubcategories: true,
    businessType: '',
    minPrice: '',
    maxPrice: '',
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const data = await listAllProductVideos({ limit: 24 });
        const arr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        if (alive) setItems(arr);
      } catch (e) {
        console.error('Load global product videos failed', e);
        if (alive) setError(e?.message || 'Failed to load videos');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Video Channel</h1>
          <p className="text-gray-600">All product videos across the platform</p>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="sm:hidden relative">
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
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent text-sm"
          />
          <button
            onClick={() => handleMobileSearch()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#027DDB] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array(9).fill(null).map((_, i) => (
            <div key={i} className="h-64 rounded-lg border bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((m, i) => {
            const product = m?.product || { id: m?.product_id };
            const company = m?.company || {};
            const videoUrl = resolveMediaUrl(m, { preferThumb: false }) || resolveMediaUrl(m?.file || m?.file_url || m?.asset || m?.video, { preferThumb: false });
            const poster = resolveMediaUrl({ thumbnail_url: m?.thumbnail_url || m?.thumb || m?.poster }, { preferThumb: true });
            const productId = product?.id || product?.pk || m?.product_id;
            const productTitle = product?.title || m?.title || 'Product Video';
            const companyName = company?.company_name || company?.name || 'Company';
            const atlasId = company?.atlas_id || '';
            return (
              <div
                key={m?.id || i}
                className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm"
                data-product-id={productId ?? ''}
                data-media-id={m?.id ?? ''}
              >
                <div className="relative bg-black">
                  {videoUrl ? (
                    <video
                      src={videoUrl}
                      controls
                      playsInline
                      preload="metadata"
                      poster={poster || undefined}
                      className="w-full h-56 object-contain bg-black"
                    />
                  ) : (
                    <div className="w-full h-56 flex items-center justify-center text-gray-500">No video URL</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-sm text-gray-500 mb-1">{companyName}{atlasId ? ` • ${atlasId}` : ''}</div>
                  <div className="font-semibold text-gray-900 line-clamp-2 mb-2">{productTitle}</div>
                  {productId ? (
                    <Link to={`/product/${productId}`} className="text-[#027DDB] hover:underline text-sm">View product</Link>
                  ) : null}
                </div>
              </div>
            );
          })}
          {!items.length && !error && (
            <div className="col-span-full text-center text-sm text-gray-600">No videos found.</div>
          )}
        </div>
      )}
    </div>
  );
}
