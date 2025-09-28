import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ContactModal from './common/ContactModal';
import MessageModal from './common/MessageModal';
import { listGeneral, retrieveProduct } from '../services/productApi';
import { getCategoryDetail } from '../services/categoryApi';

function getThumb(p) {
  return (
    p?.primary_image_url ||
    p?.primary_image ||
    p?.thumbnail ||
    p?.thumb ||
    p?.image ||
    p?.images?.[0]?.url ||
    p?.media?.find?.(m => (m.media_type || m.type) === 'image')?.url ||
    ''
  );
}

export default function CategoryProducts() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const categoryId = useMemo(() => Number(id) || id, [id]);

  const [categoryName, setCategoryName] = useState('');
  const [loadingName, setLoadingName] = useState(false);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Enhanced product details state (same as SearchResults)
  const [enhancedProducts, setEnhancedProducts] = useState(new Map());
  const [loadingMoreEnhanced, setLoadingMoreEnhanced] = useState(false);
  
  // Contact modal state
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const roleLabel = 'Supplier';
  
  // Message modal state
  const [messageOpen, setMessageOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Load category name (best-effort)
  useEffect(() => {
    let abort = new AbortController();
    async function loadName() {
      if (!categoryId && categoryId !== 0) return;
      try {
        setLoadingName(true);
        const d = await getCategoryDetail(categoryId, { signal: abort.signal });
        if (d?.name) setCategoryName(d.name);
      } catch (_) {
        // ignore name errors
      } finally {
        setLoadingName(false);
      }
    }
    loadName();
    return () => abort.abort();
  }, [categoryId]);

  const mapProducts = useCallback((arr) => {
    return arr.map(p => {
      const rawRating = p?.highest_rating ?? p?.max_rating ?? p?.highest_review ?? p?.average_rating ?? p?.avg_rating ?? p?.rating ?? p?.stars ?? 0;
      const rating = Number(rawRating) || 0;
      return {
        ...p, // Preserve all original fields including subscription_badge
        id: p.id,
        title: p.title || p.name || 'Untitled',
        thumb: getThumb(p),
        rating,
      };
    });
  }, []);

  // Initial load
  useEffect(() => {
    let abort = new AbortController();
    async function load() {
      if (!categoryId && categoryId !== 0) return;
      setLoading(true); setError('');
      try {
        const LIMIT = 12;
        const data = await listGeneral({ limit: LIMIT, page: 1, category: categoryId, include_subcategories: true });
        const arr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        const mapped = mapProducts(arr);
        setItems(mapped);
        const totalCount = typeof data?.count === 'number' ? data.count : undefined;
        const next = data?.next;
        const has = Boolean(next) || (typeof totalCount === 'number' ? mapped.length < totalCount : mapped.length === LIMIT);
        setHasMore(has);
        setPage(1);
        
        // Fetch enhanced product details for initial load
        fetchEnhancedProductDetails(mapped);
      } catch (e) {
        setError(e?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => abort.abort();
  }, [categoryId, mapProducts]);

  // Fetch enhanced product details for the specific fields we need (same as SearchResults)
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

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const LIMIT = 12;
      const nextPage = page + 1;
      const data = await listGeneral({ limit: LIMIT, page: nextPage, category: categoryId, include_subcategories: true });
      const arr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const mapped = mapProducts(arr);
      let newLength = 0;
      setItems(prev => { const combined = [...prev, ...mapped]; newLength = combined.length; return combined; });
      const totalCount = typeof data?.count === 'number' ? data.count : undefined;
      const next = data?.next;
      const has = Boolean(next) || (typeof totalCount === 'number' ? newLength < totalCount : mapped.length === LIMIT);
      setHasMore(has);
      setPage(nextPage);
      
      // Fetch enhanced product details for new items
      fetchEnhancedProductDetails(mapped);
    } catch (e) {
      setError(e?.message || 'Failed to load more products');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <button className="text-sm text-gray-600 mb-4 hover:text-gray-800" onClick={() => navigate(-1)}>← Back</button>
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{categoryName || 'Products in Category'}</h2>
        {loadingName && <p className="text-gray-500 text-sm">Loading category…</p>}
      </div>

      {/* Results List - Same layout as SearchResults */}
      <div className="space-y-6">
        {loading && Array(4).fill().map((_, i) => (
          <div key={i} className="h-48 rounded-lg border animate-pulse bg-gray-50" />
        ))}

        {!loading && items.map((product, index) => {
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
                    {product.thumb ? (
                      <img 
                        src={product.thumb} 
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

      {error && <div className="text-sm text-red-600 mt-3 text-center">{error}</div>}
      
      {/* Load More Button */}
      {!loading && hasMore && (
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
}
