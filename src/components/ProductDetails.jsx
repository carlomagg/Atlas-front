import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import Logo from './common/Logo';
import ContactModal from './common/ContactModal';
import SuccessAlert from './common/SuccessAlert';
import { retrieveProduct, listReviews, createReview, deleteReview, fetchRelatedProducts, fetchTopRankingProducts, listCategories } from '../services/productApi';
import { getMediaArray, resolveMediaUrl, collectProductImageUrls } from '../utils/media';
import { useMediaLightbox } from './common/MediaLightboxProvider.jsx';
import { useAuth } from '../context/AuthContext';
import { sendMessage } from '../services/messagesApi';
import { createProductRequest } from '../services/productRequestApi';
import ProductCard from './ProductCard';
import CompanyProducts from './CompanyProducts';

// CSS for rich text content rendering
const richTextStyles = `
  .prose h1, .prose h2, .prose h3 { 
    font-weight: bold; 
    margin: 16px 0 8px 0; 
  }
  .prose h1 { font-size: 1.5em; }
  .prose h2 { font-size: 1.3em; }
  .prose h3 { font-size: 1.1em; }
  .prose b, .prose strong { font-weight: bold; }
  .prose i, .prose em { font-style: italic; }
  .prose img { 
    max-width: 100%; 
    height: auto; 
    border-radius: 4px; 
    margin: 8px 0; 
    display: block; 
  }
  .prose a { 
    color: #3b82f6; 
    text-decoration: underline; 
  }
  .prose ul, .prose ol { 
    margin: 8px 0; 
    padding-left: 24px; 
  }
  .prose p { 
    margin: 8px 0; 
  }
`;

function Badge({ children, color = 'bg-blue-50 text-blue-700 border-blue-200' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-sm font-medium ${color}`}>
      {children}
    </span>
  );
}

// ContactModal moved to shared component: './common/ContactModal'

function CompanyInfoCard({ companyLogo, companyName, badges = [], onClick }) {
  return (
    <div 
      className={`bg-white rounded-md shadow-sm border border-slate-200 p-4 ${onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-all' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <img src={companyLogo || '/images/img_image_2.png'} alt="company" className="w-10 h-10 rounded object-cover" />
        <div className="flex-1">
          <div className="text-sm md:text-base font-semibold text-slate-800 flex items-center gap-1">
            {companyName || '—'}
            <span className="text-slate-400">›</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.isArray(badges) && badges.length > 0 ? (
              badges.map((b, i) => (
                <Badge key={i} color={b.color}>
                  {b.icon}
                  <span>{b.label}</span>
                </Badge>
              ))
            ) : (
              <>
                <Badge>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M12 2 2 7l10 5 10-5-10-5Zm0 7L2 4v13l10 5 10-5V4l-10 5Z" />
                  </svg>
                  <span>Member</span>
                </Badge>
                <Badge color="bg-violet-50 text-violet-700 border-violet-200">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M12 2 3 7v7a8.99 8.99 0 0 0 9 9 8.99 8.99 0 0 0 9-9V7l-9-5Zm-1 15-4-4 1.414-1.414L11 13.172l5.586-5.586L18 9l-7 8Z" />
                  </svg>
                  <span>Verified</span>
                </Badge>
              </>
            )}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {/* Optional: business type/summary could appear here if needed */}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, right, children }) {
  return (
    <div className="bg-white rounded-md shadow-sm border border-slate-200">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
        <h3 className="text-base md:text-lg font-semibold text-slate-800">{title}</h3>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MediaGallery({ items }) {
  const [active, setActive] = useState(0);
  const { open } = useMediaLightbox();
  const hasItems = Array.isArray(items) && items.length > 0;
  const current = hasItems ? items[active] : null;
  const slides = hasItems ? items.map((it) => (
    it.type === 'video' ? { type: 'video', src: it.url } : { type: 'image', src: it.url }
  )) : [];
  return (
    <div>
      <button
        type="button"
        onClick={() => hasItems && open(slides, active)}
        className="w-full h-[360px] md:h-[380px] overflow-hidden rounded-md border border-slate-200 bg-white flex items-center justify-center"
      >
        {hasItems ? (
          current.type === 'video' ? (
            <video src={current.url} controls className="w-full h-full object-contain bg-black" />
          ) : (
            <img
              src={current.url}
              alt="product"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null; // prevent loop
                e.currentTarget.src = '/images/img_image_2.png';
              }}
            />
          )
        ) : (
          <div className="text-sm md:text-base text-slate-500">No media</div>
        )}
      </button>
      {hasItems && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); open(slides, i); }}
              className={`relative w-16 h-16 rounded-md border overflow-hidden focus:outline-none ${
                i === active
                  ? 'border-[#027DDB] ring-2 ring-[#027DDB]/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {it.type === 'video' ? (
                <div className="relative w-full h-full">
                  <video 
                    src={it.url} 
                    className="w-full h-full object-cover" 
                    muted 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center" style={{display: 'none'}}>
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent flex items-center justify-center">
                    <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-700 ml-0.5"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={it.url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // hide broken thumb to avoid showing alt text
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SellerCard({ onContact, name, role, avatarUrl, onAffiliateClick, onLeaveMessageClick }) {
  return (
    <div className="bg-white rounded-md shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h3 className="text-base md:text-lg font-semibold text-slate-800">{`Contact ${role || 'Supplier'}`}</h3>
        {/* small doc icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400">
          <path d="M19 2H8a2 2 0 0 0-2 2v2H5a2 2 0 0 0-2 2v10a4 4 0 0 0 4 4h11a3 3 0 0 0 3-3V4a2 2 0 0 0-2-2Zm-1 18H7a2 2 0 0 1-2-2V8h1v8a2 2 0 0 0 2 2h10v2Zm0-4H8V4h10v12Z" />
        </svg>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Profile row */}
        <div className="flex items-center gap-3">
          <img src={avatarUrl || '/images/img_image_2.png'} alt="contact" className="w-10 h-10 rounded object-cover" />
          <div>
            <div className="text-sm md:text-base font-semibold text-slate-800">{name || '—'}</div>
            <div className="text-sm text-slate-500">{role || 'Supplier'}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-2">
          {/* Contact Now */}
          <button onClick={() => onContact && onContact()} className="w-full h-10 rounded-md bg-[#027DDB] text-white text-sm md:text-base font-medium hover:brightness-95 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.236-7.445 5.209a1.5 1.5 0 0 1-1.11.245 1.5 1.5 0 0 1-1.11-.245L3 8.236V6l8 5.6L20 6v2.236Z" />
            </svg>
            Contact Now
          </button>

          {/* Leave a message like an input */}
          <button type="button" onClick={() => onLeaveMessageClick && onLeaveMessageClick()} className="w-full h-10 rounded-md border border-slate-300 bg-slate-50 text-slate-600 text-sm md:text-base px-3 flex items-center gap-2 hover:bg-slate-100 cursor-pointer text-left">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M20 2H4a2 2 0 0 0-2 2v14l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
            </svg>
            Leave a message
          </button>

          {/* Affiliate Request */}
          <button onClick={() => onAffiliateClick && onAffiliateClick()} className="w-full h-10 rounded-md bg-[#027DDB] text-white text-sm md:text-base font-medium hover:brightness-95">
            Send Affiliate Request
          </button>
        </div>
      </div>
    </div>
  );
}

function KeyInfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-12 gap-3 py-2 text-sm md:text-base">
      <div className="col-span-4 text-slate-500">{label}</div>
      <div className="col-span-8 text-slate-800">{value}</div>
    </div>
  );
}

function CertificatesGrid({ urls = [] }) {
  if (!Array.isArray(urls) || urls.length === 0) {
    return <div className="text-sm md:text-base text-slate-500">No certificates uploaded.</div>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {urls.map((src, i) => (
        <div key={i} className="rounded-md border border-slate-200 overflow-hidden">
          <img src={src} alt={`cert-${i}`} className="w-full h-36 object-cover" />
        </div>
      ))}
    </div>
  );
}

// Generic media thumbnail grid that opens items in the lightbox
function MediaThumbGrid({ items = [], emptyText = 'No files uploaded.' }) {
  const { open } = useMediaLightbox();
  const media = Array.isArray(items) ? items.map((it) => {
    const url = it?.url || it?.file || it;
    if (!url) return null;
    const isVideo = /\/video\//.test(String(url)) || /\.(mp4|webm|ogg)(\?|$)/i.test(String(url));
    // Lightbox expects { type: 'image'|'video', src: string }
    return { type: isVideo ? 'video' : 'image', src: url };
  }).filter(Boolean) : [];
  if (media.length === 0) return <div className="text-sm md:text-base text-slate-500">{emptyText}</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {media.map((m, i) => (
        <button
          key={i}
          type="button"
          onClick={() => open(media, i)}
          className="relative rounded-md border border-slate-200 overflow-hidden focus:outline-none"
        >
          {m.type === 'video' ? (
            <div className="w-full h-36 bg-black/70 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
            </div>
          ) : (
            <img src={m.src} alt={`file-${i}`} className="w-full h-36 object-cover" />
          )}
        </button>
      ))}
    </div>
  );
}

// 2-column media grid with "See more" functionality for company sections
function CompanyMediaGrid({ items = [], emptyText = 'No files uploaded.', showMore = false, onToggleShowMore }) {
  const { open } = useMediaLightbox();
  const media = Array.isArray(items) ? items.map((it) => {
    const url = it?.url || it?.file || it;
    if (!url) return null;
    const isVideo = /\/video\//.test(String(url)) || /\.(mp4|webm|ogg)(\?|$)/i.test(String(url));
    return { type: isVideo ? 'video' : 'image', src: url };
  }).filter(Boolean) : [];
  
  if (media.length === 0) return <div className="text-sm md:text-base text-slate-500">{emptyText}</div>;
  
  const displayItems = showMore ? media : media.slice(0, 2);
  
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {displayItems.map((m, i) => (
          <button
            key={i}
            type="button"
            onClick={() => open(media, i)}
            className="relative rounded-md border border-slate-200 overflow-hidden focus:outline-none hover:shadow-md transition-shadow"
          >
            {m.type === 'video' ? (
              <div className="relative w-full h-56">
                <video 
                  src={m.src} 
                  className="w-full h-full object-cover" 
                  muted 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center" style={{display: 'none'}}>
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-white"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-slate-700 ml-0.5"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              </div>
            ) : (
              <img src={m.src} alt={`file-${i}`} className="w-full h-56 object-cover" />
            )}
          </button>
        ))}
      </div>
      {media.length > 2 && onToggleShowMore && (
        <div className="mt-4 text-center">
          <button
            className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 text-sm md:text-base hover:bg-slate-50"
            onClick={onToggleShowMore}
          >
            {showMore ? 'See less' : 'See more'}
          </button>
        </div>
      )}
    </>
  );
}

function BasicInfoTable({ specs = [] }) {
  const rows = Array.isArray(specs) ? specs.filter(r => r && (r.name || r.value)) : [];
  if (rows.length === 0) return <div className="text-sm md:text-base text-slate-500">No specifications provided.</div>;
  const Cell = ({ label, value }) => (
    <div className="grid grid-cols-5">
      <div className="col-span-2 px-3 py-2 text-slate-600 text-sm md:text-base border-r border-slate-200">{label}</div>
      <div className="col-span-3 px-3 py-2 text-slate-800 text-sm md:text-base">{value}</div>
    </div>
  );
  return (
    <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
      {rows.map((r, i) => (
        <div key={i} className={`border-b border-slate-200 last:border-b-0`}>
          <Cell label={r.name || '-'} value={r.value || '-'} />
        </div>
      ))}
    </div>
  );
}

function TabCard({ tabs, active, onChange, right, children }) {
  return (
    <div className="bg-white rounded-md shadow-sm border border-slate-200">
      <div className="px-5 pt-2">
        <div className="flex items-end justify-between border-b border-slate-200">
          <div className="flex items-center gap-6">
            {tabs.map((t, idx) => (
              <button
                key={t}
                onClick={() => onChange(idx)}
                className={`-mb-px px-1 pb-3 text-sm md:text-base font-medium transition-colors ${
                  active === idx
                    ? 'text-[#027DDB] border-b-2 border-[#027DDB]'
                    : 'text-slate-600 hover:text-slate-700 border-b-2 border-transparent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {right}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// Small Top Ranking Products component for sidebar
function SidebarTopRanking() {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const productsPerPage = 5;

  const loadTopProducts = async (page = 1, reset = false) => {
    setLoading(true);
    try {
      const response = await fetchTopRankingProducts(1, 50); // Get more products to filter from
      const products = Array.isArray(response) ? response : (response?.results || []);
      
      // Filter for boosted products first (good for advertising)
      let boostedProducts = products.filter(product => 
        product.is_boosted || 
        product.daily_booster_badge
      );
      
      // If no boosted products, fallback to platinum or gold subscribers
      if (boostedProducts.length === 0) {
        boostedProducts = products.filter(product => {
          const subscription = (product.subscription_badge || product.package_name || '').toLowerCase();
          return subscription.includes('platinum') || subscription.includes('gold');
        });
      }
      
      // Remove the limit - show all boosted products with pagination
      setTotalProducts(boostedProducts.length);
      
      // Calculate pagination
      const startIndex = (page - 1) * productsPerPage;
      const endIndex = startIndex + productsPerPage;
      const paginatedProducts = boostedProducts.slice(startIndex, endIndex);
      
      if (reset) {
        setTopProducts(paginatedProducts);
      } else {
        setTopProducts(prev => [...prev, ...paginatedProducts]);
      }
      
      setHasMore(endIndex < boostedProducts.length);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch top ranking products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopProducts(1, true);
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center space-x-3 p-2 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-2 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!topProducts.length) {
    return (
      <div className="text-center py-4 text-slate-500 text-sm md:text-base">
        No top ranking products available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {topProducts.map((product, index) => {
        const imageUrl = product.primary_image || 
                        product.thumb || 
                        product.image_url ||
                        (product.media && product.media[0]?.file) ||
                        '/images/img_image_2.png';
        
        return (
          <Link 
            key={product.id} 
            to={`/product/${product.id}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
          >
            <div className="flex-shrink-0">
              <img 
                src={imageUrl} 
                alt={product.title} 
                className="w-12 h-12 object-cover rounded border border-gray-200"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-medium text-gray-800 group-hover:text-blue-600 line-clamp-2 leading-tight">
                {product.title}
              </h4>
            </div>
          </Link>
        );
      })}
      
      {/* Pagination Controls */}
      {hasMore && (
        <div className="pt-3 border-t border-slate-200">
          <button
            onClick={() => loadTopProducts(currentPage + 1, false)}
            disabled={loading}
            className="w-full text-base text-blue-600 hover:text-blue-800 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Show More'}
          </button>
        </div>
      )}
      
      {/* Product Count Info */}
      {totalProducts > productsPerPage && (
        <div className="text-sm text-slate-500 text-center pt-2">
          Showing {topProducts.length} of {totalProducts} boosted products
        </div>
      )}
    </div>
  );
}

function RelatedProducts({ productId }) {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSameCategory, setShowSameCategory] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    if (!productId) return;
    
    const loadRelatedProducts = async () => {
      setLoading(true);
      setError('');
      setIsFallback(false);
      try {
        const data = await fetchRelatedProducts(productId, { 
          limit: 6,
          sameCategory: showSameCategory 
        });
        
        // Handle both paginated response and direct array
        const products = data?.results || data || [];
        setRelatedProducts(products);
        
        // Check if this is fallback data
        if (data?.fallback) {
          setIsFallback(true);
          console.log('Using fallback method for related products');
        }
      } catch (err) {
        console.error('Failed to fetch related products:', err);
        // Provide more specific error messages
        if (err.status === 404) {
          setError('Related products feature is not available yet');
        } else if (err.status >= 500) {
          setError('Server error - please try again later');
        } else {
          setError('Failed to load related products');
        }
      } finally {
        setLoading(false);
      }
    };

    loadRelatedProducts();
  }, [productId, showSameCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-500 text-base">Loading related products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-500 text-base">{error}</div>
      </div>
    );
  }

  if (!relatedProducts.length) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-500 text-base">No related products found</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            className={`px-3 py-1 text-base rounded-md border transition-colors ${
              !showSameCategory 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
            onClick={() => setShowSameCategory(false)}
          >
            All Related
          </button>
          <button 
            className={`px-3 py-1 text-base rounded-md border transition-colors ${
              showSameCategory 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
            onClick={() => setShowSameCategory(true)}
          >
            Same Category
          </button>
        </div>
        
        {/* Fallback indicator */}
        {isFallback && (
          <div className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
            Showing similar products
          </div>
        )}
      </div>

      {/* Products Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {relatedProducts.map((product) => {
          // Extract image URL from product data
          const imageUrl = product.primary_image || 
                          product.thumb || 
                          product.image_url ||
                          (product.media && product.media[0]?.file) ||
                          '/images/img_image_2.png';
          
          return (
            <div key={product.id} className="flex-shrink-0 w-48">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200 group cursor-pointer h-full flex flex-col">
                <Link to={`/product/${product.id}`} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="relative">
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                          No Image
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-3 text-center flex-1 flex flex-col justify-between">
                    <h3 className="font-medium text-gray-800 text-base mb-2 line-clamp-2">{product.title}</h3>
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProductDetailsNew() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const [highlightedReviewId, setHighlightedReviewId] = useState(null);
  const reviewsRefs = useRef({});
  const hasUserReview = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    return reviews.some((rv) => (rv.user_id === user.id) || (rv.user && rv.user.id === user.id));
  }, [isAuthenticated, user, reviews]);
  const loadReviews = async (productId, { limit = 50 } = {}) => {
    setReviewsLoading(true); setReviewError('');
    try {
      const data = await listReviews(productId, { limit, ordering: '-created_at' });
      const arr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      setReviews(arr);
    } catch (e) {
      console.error('Load reviews failed', e);
      setReviewError(e?.message || 'Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  // Prefer full name when available for reviewer name
  const getReviewerName = (rv) => {
    if (!rv) return 'Anonymous';
    const u = rv.user || {};
    const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
    const byFields = [
      rv.user_full_name,
      full || null,
      u.full_name,
      u.name,
      rv.user_name,
      rv.user_display,
      u.username,
      (u.email && u.email.split('@')[0]),
    ].filter(Boolean);
    return byFields[0] || 'Anonymous';
  };
  const mediaItems = useMemo(() => {
    const items = [];
    // Prefer collected primary images first
    const collectedImgs = collectProductImageUrls(product);
    if (Array.isArray(collectedImgs) && collectedImgs.length) {
      collectedImgs.forEach((u) => items.push({ type: 'image', url: u }));
    }
    // Then append any remaining media (images/videos)
    const m = getMediaArray(product);
    m.forEach((raw) => {
      const type = raw?.media_type || (raw?.is_video ? 'video' : (raw?.type || 'image'));
      const url = resolveMediaUrl(raw, { preferThumb: false });
      if (!url) return;
      // Avoid duplicates for images already in collected list
      if (type === 'image' && items.some(it => it.url === url)) return;
      if (type === 'image' || type === 'video') items.push({ type, url });
    });
    return items;
  }, [product]);
  
  // Compute a simple Minimum Order text for the title panel
  const minOrderText = useMemo(() => {
    const val = product?.min_order || product?.minimum_order || product?.moq || product?.minimum_order_quantity;
    const unit = product?.min_order_unit || product?.order_unit || product?.unit;
    if (val !== null && val !== undefined && String(val).toString().trim() !== '') {
      return `${val}${unit ? ` ${unit}` : ''} (Min. Order)`;
    }
    // Dummy placeholder; replace with real data later
    return '100 Meters (Min. Order)';
  }, [product]);

  // Preview specific text sections under the title in this order and append a few specification pairs
  const specPreview = useMemo(() => {
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
    // Prepend product meta the user requested
    rows.push(
      { label: 'Product Type', value: getOrFallback(product?.product_type, '—') },
      { label: 'Article/Model No', value: getOrFallback(product?.article_model_no, '—') },
      { label: 'Keywords', value: getOrFallback(product?.keywords, '—') },
    );
    // Exclude 'Specification' from the preview entirely per request
    // Append grouped name/value specification pairs (merge duplicate names and join values)
    const specPairs = (() => {
      const arr = Array.isArray(product?.specifications) ? product.specifications : [];
      if (arr.length === 0) return [];
      const titleCase = (s) => {
        if (!s) return '-';
        const str = String(s).trim();
        return str.charAt(0).toUpperCase() + str.slice(1);
      };
      const map = new Map(); // key: lowercased name, value: { label, values: Set, order }
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
    return [...rows, ...specPairs];
  }, [product]);
  // 0 = Product description, 1 = Company info (default active per design)
  const [tab, setTab] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [affiliateOpen, setAffiliateOpen] = useState(false);
  // Send Message modal state
  const [smOpen, setSmOpen] = useState(false);
  const [smSubject, setSmSubject] = useState('');
  const [smRecipientEmail, setSmRecipientEmail] = useState('');
  const [smRecipientAtlasId, setSmRecipientAtlasId] = useState('');
  const [smBody, setSmBody] = useState('');
  const [smFile, setSmFile] = useState(null);
  const [smSending, setSmSending] = useState(false);
  const [smError, setSmError] = useState('');
  const [smSuccess, setSmSuccess] = useState('');
  // Placeholder: swap to 'Manufacturer' if a manufacturer logs in
  const roleLabel = 'Supplier';
  const location = useLocation();
  const navigate = useNavigate();
  // Message form state (Company Info tab)
  const [msgFromEmail, setMsgFromEmail] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [msgSuccess, setMsgSuccess] = useState('');
  // Product Request modal state (mirror LandingPage)
  const [prOpen, setPrOpen] = useState(false);
  const [prSubmitting, setPrSubmitting] = useState(false);
  const [prError, setPrError] = useState('');
  const [prSuccess, setPrSuccess] = useState('');
  const [prProductName, setPrProductName] = useState('');
  const [prQuantity, setPrQuantity] = useState('');
  const [prUnitType, setPrUnitType] = useState('pieces');
  const [prCustomUnit, setPrCustomUnit] = useState('');
  const [prCountry, setPrCountry] = useState('');
  const [prCity, setPrCity] = useState('');
  const [prDetails, setPrDetails] = useState('');
  const [prFiles, setPrFiles] = useState([]);
  const [prBudget, setPrBudget] = useState('');
  const [prCurrency, setPrCurrency] = useState('NGN');
  const [prIsBuyer, setPrIsBuyer] = useState(true);
  const [prIsSupplier, setPrIsSupplier] = useState(false);
  const [prOnlyPaid, setPrOnlyPaid] = useState(false);
  const [prAllowAll, setPrAllowAll] = useState(true);
  // New spec fields
  const [prBusinessType, setPrBusinessType] = useState('');
  const [prPurchaseQty, setPrPurchaseQty] = useState('');
  const [prTimeValidity, setPrTimeValidity] = useState('');
  const [prPieceUnit, setPrPieceUnit] = useState('');
  const [prBuyingFrequency, setPrBuyingFrequency] = useState('');
  const [prTargetUnitPrice, setPrTargetUnitPrice] = useState('');
  const [prMaxBudget, setPrMaxBudget] = useState('');
  const [prCategoryText, setPrCategoryText] = useState('');
  // Category dropdown state (like LandingPage)
  const [prCategoryId, setPrCategoryId] = useState('');
  const [prCategoryName, setPrCategoryName] = useState('');
  const [prCategories, setPrCategories] = useState([]);
  const [prCatLoading, setPrCatLoading] = useState(false);
  const [prCatError, setPrCatError] = useState('');
  const successRef = useRef(null);

  const resetPR = () => {
    setPrProductName('');
    setPrQuantity('');
    setPrUnitType('pieces');
    setPrCustomUnit('');
    setPrCountry('');
    setPrCity('');
    setPrDetails('');
    setPrFiles([]);
    setPrBudget('');
    setPrCurrency('NGN');
    setPrIsBuyer(false);
    setPrIsSupplier(false);
    setPrOnlyPaid(false);
    setPrAllowAll(true);
    setPrBusinessType('');
    setPrPurchaseQty('');
    setPrTimeValidity('');
    setPrPieceUnit('');
    setPrBuyingFrequency('');
    setPrTargetUnitPrice('');
    setPrMaxBudget('');
    setPrCategoryText('');
    setPrCategoryId('');
    setPrCategoryName('');
    setPrError('');
  };

  const openProductRequestModal = () => {
    if (!isAuthenticated) {
      navigate('/?login=true');
      return;
    }
    setPrProductName(product?.title || '');
    // default to Buyer role for convenience
    setPrIsBuyer(true);
    setPrIsSupplier(false);
    setPrOpen(true);
  };

  const submitProductRequest = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!prProductName.trim()) { setPrError('Please enter product name'); return; }
    if (!prDetails.trim()) { setPrError('Please provide Details.'); return; }
    const roleCount = (prIsBuyer ? 1 : 0) + (prIsSupplier ? 1 : 0);
    if (roleCount !== 1) { setPrError('Select exactly one role: Buyer or Supplier'); return; }
    setPrSubmitting(true); setPrError('');
    try {
      await createProductRequest({
        product_name: prProductName.trim(),
        // retain backward compatibility and send new keys
        quantity: prQuantity ? Number(prQuantity) : undefined,
        purchase_quantity: prPurchaseQty ? Number(prPurchaseQty) : (prQuantity ? Number(prQuantity) : undefined),
        unit_type: prUnitType === 'others' ? 'others' : prUnitType,
        custom_unit: prUnitType === 'others' ? (prCustomUnit || '') : undefined,
        country: prCountry || undefined,
        city: prCity || undefined,
        category_text: prCategoryText || prCategoryName || undefined,
        category_id: prCategoryId || undefined,
        time_of_validity: prTimeValidity || undefined,
        piece_unit: prPieceUnit || undefined,
        buying_frequency: prBuyingFrequency || undefined,
        budget: prBudget ? Number(prBudget) : undefined,
        currency: prCurrency || undefined,
        target_unit_price: prTargetUnitPrice ? Number(prTargetUnitPrice) : undefined,
        max_budget: prMaxBudget ? Number(prMaxBudget) : undefined,
        is_buyer: prIsBuyer,
        is_supplier: prIsSupplier,
        only_paid_members: prOnlyPaid || undefined,
        allow_all_members: prAllowAll || undefined,
        // new spec fields
        business_type: prBusinessType || undefined,
        // important: include details like LandingPage does
        details: prDetails || undefined,
        attachments: prFiles,
      });
      // Broadcast creation so other parts of the app (e.g., dashboard) can refresh immediately
      try { window.dispatchEvent(new CustomEvent('atlas:product-request-created')); } catch {}

      setPrSuccess('Product request submitted successfully.');
      setTimeout(() => {
        setPrOpen(false);
        setPrSuccess('');
        resetPR();
      }, 2500);
    } catch (e) {
      // Log and surface field-level errors when available
      // eslint-disable-next-line no-console
      console.error('Product request error:', e?.status, e?.data || e);
      const fieldMsg = (e?.data && typeof e.data === 'object')
        ? (Object.entries(e.data)[0]?.[1])
        : null;
      const msg = Array.isArray(fieldMsg) ? String(fieldMsg[0]) : (typeof fieldMsg === 'string' ? fieldMsg : null);
      setPrError(msg || e?.message || 'Failed to submit request');
    } finally { setPrSubmitting(false); }
  };
  // Share dropdown state
  const [shareOpen, setShareOpen] = useState(false);
  
  // See more toggles for media sections in Company Info tab
  const [showMoreCompanySections, setShowMoreCompanySections] = useState({
    aboutUsFiles: false,
    certificates: false,
    blogAwards: false,
    productionSites: false,
    storageSites: false,
    exhibitions: false,
  });
  // Compose share links for current page
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = product?.title ? `Check this on Atlas: ${product.title}` : 'Check this product on Atlas';
  const shareLinks = useMemo(() => ({
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + pageUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareTitle)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
  }), [pageUrl, shareTitle]);
  // Derive seller and company info from loaded product (owner of product)
  const sellerInfo = useMemo(() => {
    const s = product?.seller_info || {};
    const company = s.company || {};
    const fullName = s.full_name || s.name || '';
    const displayName = fullName || s.company_name || (s.email && s.email.split('@')[0]) || '';
    const businessType = (s.business_type || '').toString().replaceAll('_', ' ').toLowerCase();
    const role = businessType ? businessType.charAt(0).toUpperCase() + businessType.slice(1) : 'Supplier';
    const avatarUrl = s.profile_image || company.company_logo_url || company.company_image_url || '';
    const companyLogo = company.company_logo_url || company.company_image_url || '';
    const companyName = company.company_name || s.company_name || '';
    // Derive badges from seller profile
    const profile = s.profile || s;
    const rawBiz = (profile?.businessVerificationStatus || profile?.business_verification_status || profile?.business_status || profile?.company_verification_status || '').toString().toLowerCase();
    let bizLabel = 'Unverified';
    let bizColor = 'bg-slate-100 text-slate-700 border-slate-200';
    if (['verified', 'approved'].includes(rawBiz)) { bizLabel = 'Verified'; bizColor = 'bg-violet-50 text-violet-700 border-violet-200'; }
    else if (rawBiz === 'pending') { bizLabel = 'Pending'; bizColor = 'bg-amber-50 text-amber-700 border-amber-200'; }
    else if (rawBiz === 'rejected') { bizLabel = 'Rejected'; bizColor = 'bg-rose-50 text-rose-700 border-rose-200'; }

    const memberRaw = (profile?.member_status || profile?.membership_status || '').toString().toLowerCase();
    const isMember = profile?.is_member === true || memberRaw === 'member' || memberRaw === 'active';
    const memberLabel = isMember ? 'Member' : 'Non‑member';
    const memberColor = isMember ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200';
    const badges = [
      { label: memberLabel, color: memberColor, icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M12 2 2 7l10 5 10-5-10-5Zm0 7L2 4v13l10 5 10-5V4l-10 5Z" />
        </svg>
      )},
      { label: bizLabel, color: bizColor, icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M12 2 3 7v7a8.99 8.99 0 0 0 9 9 8.99 8.99 0 0 0 9-9V7l-9-5Zm-1 15-4-4 1.414-1.414L11 13.172l5.586-5.586L18 9l-7 8Z" />
        </svg>
      )},
    ];
    return { name: displayName, role, avatarUrl, companyLogo, companyName, badges };
  }, [product]);

  const openSendMessageModal = () => {
    // Prefill subject and recipient EMAIL only from seller info when available
    const s = product?.seller_info || {};
    const subj = product?.title ? `Inquiry about ${product.title}` : '';
    setSmSubject(subj);
    setSmRecipientEmail(s.email || '');
    // Do NOT prefill Atlas ID per request
    setSmRecipientAtlasId('');
    setSmBody('');
    setSmFile(null);
    setSmError('');
    setSmSuccess('');
    setSmOpen(true);
  };

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const data = await retrieveProduct(id);
        if (alive) setProduct(data);
      } catch (e) {
        console.error('Load product failed', e);
        if (alive) setError(e?.message || 'Failed to load product');
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id]);

  // Load reviews for product
  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      if (!alive) return;
      await loadReviews(id, { limit: 50 });
    })();
    return () => { alive = false; };
  }, [id]);

  // When a review is highlighted, attempt to scroll it into view
  useEffect(() => {
    if (!highlightedReviewId) return;
    const el = reviewsRefs.current[highlightedReviewId];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Remove highlight after a short delay
    const t = setTimeout(() => setHighlightedReviewId(null), 2500);
    return () => clearTimeout(t);
  }, [highlightedReviewId]);

  // Load categories for product request dropdown (like LandingPage)
  useEffect(() => {
    const loadCategories = async () => {
      setPrCatLoading(true);
      setPrCatError('');
      try {
        const res = await listCategories();
        const items = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
        const mapped = items.map(it => ({ 
          id: it.id ?? it.value ?? it.pk ?? it.slug ?? it.code, 
          name: it.name ?? it.title ?? it.label ?? String(it.id ?? it.value ?? '') 
        }));
        setPrCategories(mapped.filter(c => c.id != null));
      } catch (e) {
        console.error('Load categories failed', e);
        setPrCatError(e?.message || 'Failed to load categories');
      } finally {
        setPrCatLoading(false);
      }
    };
    loadCategories();
  }, []);

  const handleCreateReview = async () => {
    setCreateError('');
    setCreateSuccess('');
    const comment = newReview.trim();
    if (!isAuthenticated) { setCreateError('Please sign in to leave a review.'); return; }
    if (!rating) { setCreateError('Please select a rating.'); return; }
    if (!comment) { setCreateError('Please enter a comment.'); return; }
    setCreating(true);
    try {
      const payload = { product: Number(id), rating: Number(rating), comment, user: user?.id };
      const created = await createReview(id, payload);
      setNewReview('');
      setRating(0);
      setCreateSuccess('Review posted.');
      // Prepend to list
      setReviews((prev) => [created, ...prev]);
      // Clear success after a short delay
      setTimeout(() => setCreateSuccess(''), 2000);
    } catch (e) {
      console.error('Create review failed', e);
      let msg = 'Failed to submit review';
      if (e?.status === 400 || e?.status === 409) {
        msg = e?.data?.detail || 'You have already reviewed this product.';
        // If backend provides existing_review_id, highlight it
        const existingId = e?.data?.existing_review_id;
        // Reload reviews so the user's existing review appears
        loadReviews(id, { limit: 50 }).then(() => {
          if (existingId) setHighlightedReviewId(existingId);
        });
      } else if (e?.data) {
        msg = e.data.detail || JSON.stringify(e.data);
      } else if (e?.message) {
        msg = e.message;
      }
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteReview = async (rid) => {
    if (!rid) return;
    setDeletingId(rid);
    try {
      await deleteReview(id, rid);
      setReviews((prev) => prev.filter((r) => r.id !== rid));
    } catch (e) {
      console.error('Delete review failed', e);
      setReviewError(e?.message || 'Failed to delete review');
      setTimeout(() => setReviewError(''), 2000);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-slate-50">
      {/* Add CSS for rich text rendering */}
      <style dangerouslySetInnerHTML={{ __html: richTextStyles }} />
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex-shrink-0">
            <Logo height="h-14 md:h-16 lg:h-20" />
          </div>
          <nav className="flex items-center gap-6 text-base text-slate-600">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 rounded-md bg-[#027DDB] text-white text-sm sm:text-base font-medium hover:bg-[#0066B8] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
                <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
              </svg>
              <span className="hidden xs:inline sm:inline">Back to </span>Home
            </Link>
          </nav>
        </div>
      </header>
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {location.state?.fromManageProducts && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/product-info/manage')}
              className="inline-flex items-center gap-2 text-base px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <span className="text-slate-400">←</span>
              Back to Manage Products
            </button>
          </div>
        )}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9 space-y-6">
            <div className="bg-white rounded-md shadow-sm border border-slate-200 p-4 md:p-5">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: gallery + actions below */}
                <div>
                  <MediaGallery items={mediaItems} />
                  <div className="mt-3">
                    {/* Average rating computed from reviews */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        {(() => {
                          const count = reviews.length;
                          const avg = count ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count) : 0;
                          const rounded = Math.round(avg * 10) / 10;
                          return (
                            <>
                              <div className="flex items-center">
                                {[1,2,3,4,5].map(i => (
                                  <svg key={i} viewBox="0 0 20 20" className={`w-4 h-4 ${i <= Math.round(avg) ? 'text-amber-400' : 'text-slate-300'}`} fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.803-2.036a1 1 0 00-1.175 0l-2.803 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z"/></svg>
                                ))}
                              </div>
                              <div className="flex items-baseline gap-1 ml-1 flex-nowrap">
                                <span className="text-slate-700 whitespace-nowrap">{rounded} / 5</span>
                                <span className="text-slate-500 whitespace-nowrap">({count} review{count===1?'':'s'})</span>
                              </div>
                            </>
                          );
                        })()}
                          {/* Views (read-only) */}
                          <div className="ml-6 flex items-center gap-1 text-xs text-slate-500">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/></svg>
                            <span>{Number(product?.view_count ?? product?.views ?? 0)}</span>
                            <span className="hidden sm:inline">views</span>
                          </div>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShareOpen((v) => !v)}
                          className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-800 border border-slate-300 bg-white px-3 py-1.5 rounded-md"
                          aria-haspopup="menu"
                          aria-expanded={shareOpen}
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7 0-.24-.04-.47-.09-.7l7.05-4.11A3 3 0 1 0 15 5a2.96 2.96 0 0 0 .09.7L8.04 9.81A3 3 0 1 0 9 12c0-.24-.04-.47-.09-.7l7.13 4.16c.5-.45 1.16-.73 1.9-.73a3 3 0 1 0 0-1.65Z"/></svg>
                          <span>Share</span>
                        </button>
                        {shareOpen && (
                          <div
                            role="menu"
                            className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-slate-200 bg-white shadow-lg p-2 text-sm"
                          >
                            <a href={shareLinks.whatsapp} target="_blank" rel="noopener" className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50">
                              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                              </svg>
                              <span>WhatsApp</span>
                            </a>
                            <a href={shareLinks.facebook} target="_blank" rel="noopener" className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                              <span>Facebook</span>
                            </a>
                            <a href={shareLinks.twitter} target="_blank" rel="noopener" className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50">
                              <span className="w-4 h-4 text-slate-800">𝕏</span>
                              <span>Share on X</span>
                            </a>
                            <a href={shareLinks.linkedin} target="_blank" rel="noopener" className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50">
                              <span className="w-4 h-4 text-sky-700">in</span>
                              <span>LinkedIn</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(pageUrl);
                                setShareOpen(false);
                              }}
                              className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 text-slate-700"
                            >
                              <span className="w-4 h-4">🔗</span>
                              <span>Copy link</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Star rating selector (only show if user hasn't reviewed yet) */}
                    {isAuthenticated && !hasUserReview && (
                      <div className="mt-3">
                        <div className="text-xs text-slate-600 mb-1">Your rating</div>
                        <div className="flex items-center gap-2">
                          {[1,2,3,4,5].map((i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setRating(i)}
                              className="p-0.5"
                              aria-label={`Rate ${i} star${i>1?'s':''}`}
                            >
                              <svg viewBox="0 0 20 20" className={`w-5 h-5 ${i <= rating ? 'text-amber-400' : 'text-slate-300'}`} fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.803-2.036a1 1 0 00-1.175 0l-2.803 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z"/></svg>
                            </button>
                          ))}
                          <span className="text-xs text-slate-500 ml-1">{rating ? `${rating}/5` : 'Select rating'}</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 flex gap-2">
                      <input
                        value={newReview}
                        onChange={(e) => setNewReview(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateReview(); }}
                        className="flex-1 h-10 rounded-md border border-slate-300 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={isAuthenticated ? (hasUserReview ? "You have already reviewed this product" : "Write your comment") : "Sign in to write a review"}
                        disabled={!isAuthenticated || creating || hasUserReview}
                      />
                      <button
                        onClick={handleCreateReview}
                        disabled={!isAuthenticated || creating || hasUserReview}
                        className="h-10 px-4 rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
                      >
                        {creating ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                    {(createError || createSuccess) && (
                      <div className={`mt-2 text-xs ${createError ? 'text-red-600' : 'text-green-600'}`}>{createError || createSuccess}</div>
                    )}
                    {/* Reviews list */}
                    <div className="mt-4 space-y-3">
                      {reviewsLoading && <div className="text-xs text-slate-500">Loading reviews...</div>}
                      {reviewError && <div className="text-xs text-red-600">{reviewError}</div>}
                      {!reviewsLoading && !reviewError && reviews.map((rv) => (
                        <div
                          key={rv.id}
                          ref={(el) => { if (el) reviewsRefs.current[rv.id] = el; }}
                          className={`rounded-md border p-3 ${highlightedReviewId === rv.id ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-slate-800">{getReviewerName(rv)}</div>
                            <div className="text-xs text-slate-500">{rv.created_at ? new Date(rv.created_at).toLocaleString() : ''}</div>
                          </div>
                          {/* Show rating as numeric to avoid double star rows */}
                          {typeof rv.rating === 'number' && rv.rating > 0 && (
                            <div className="mt-1 text-xs text-slate-600">Rating: {rv.rating}/5</div>
                          )}
                          <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{rv.comment || rv.content || rv.text || ''}</div>
                          {isAuthenticated && (rv.user_id === user?.id || rv.user?.id === user?.id) && (
                            <div className="mt-2 text-right">
                              <button onClick={() => handleDeleteReview(rv.id)} disabled={deletingId === rv.id} className="text-xs text-red-600 hover:underline disabled:opacity-60">{deletingId === rv.id ? 'Deleting...' : 'Delete'}</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: title, company */}
                <div>
                  <h1 className="text-[22px] md:text-[24px] leading-snug font-semibold text-slate-900">{product?.title || 'Product'}</h1>

                  {/* Reference FOB Price panel */}
                  <div className="mt-2 rounded-md border border-slate-100 bg-[#F7FAFF] p-3">
                    <div className="flex items-center justify-between text-base text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Reference FOB Price</span>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sky-100 text-sky-600 text-xs">i</span>
                      </div>
                      <a className="text-[#027DDB] text-sm hover:underline cursor-pointer">Get Latest Price ›</a>
                    </div>
                    <div className="mt-2 bg-white rounded-md border border-slate-200 px-3 py-2 text-base text-slate-900">
                      {minOrderText}
                    </div>
                  </div>

                  {/* Specifications preview (simple label:value list) */}
                  {specPreview && specPreview.length > 0 && (
                    <div className="mt-3">
                      {specPreview.map((r, i) => (
                        <div key={i} className="py-1.5">
                          <KeyInfoRow label={`${(r.label || r.name || '-')}:`} value={r.value || '-'} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Company + CTA (seller company) */}
                  <div className="mt-5 grid sm:grid-cols-2 gap-3">
                    <div className="rounded-md border border-slate-200 p-3 flex items-center gap-3 bg-white">
                      <img src={product?.seller_info?.profile_image || product?.seller_info?.avatar || product?.company_info?.company_logo_url || product?.company_info?.company_image_url || '/images/img_image_2.png'} alt="company" className="w-10 h-10 rounded object-cover" />
                      <div className="text-base font-medium text-slate-800">{product?.seller_info?.full_name || product?.seller_info?.name || product?.seller_info?.company_name || product?.company_info?.company_name || (product?.seller_info?.first_name && product?.seller_info?.last_name ? `${product?.seller_info?.first_name} ${product?.seller_info?.last_name}` : '') || '—'}</div>
                    </div>
                    <button 
                      onClick={() => {
                        // Smart navigation: check if product belongs to subsidiary or parent company
                        const sellerId = product?.seller_info?.id || product?.seller_id || product?.seller;
                        const subsidiarySlug = product?.subsidiary_slug || product?.seller_info?.subsidiary_slug;
                        const subsidiaryId = product?.subsidiary_id || product?.seller_info?.subsidiary_id;
                        
                        // DEBUG: Log available product data to help backend team
                        console.log('🔍 Button Navigation Debug:', {
                          sellerId,
                          subsidiarySlug,
                          subsidiaryId,
                          product_seller_info: product?.seller_info,
                          product_keys: Object.keys(product || {}),
                          seller_info_keys: Object.keys(product?.seller_info || {})
                        });
                        
                        // Navigate to subsidiary page if product belongs to subsidiary
                        if (subsidiarySlug) {
                          navigate(`/subsidiary/${subsidiarySlug}`, {
                            state: { from: location.pathname, sellerProfile: product?.seller_info }
                          });
                        } 
                        // Try subsidiary ID if no slug available
                        else if (subsidiaryId) {
                          navigate(`/subsidiary/${subsidiaryId}`, {
                            state: { from: location.pathname, sellerProfile: product?.seller_info }
                          });
                        }
                        // Navigate to parent company page
                        else if (sellerId) {
                          navigate(`/company/${sellerId}`, {
                            state: { 
                              from: location.pathname, 
                              sellerProfile: {
                                ...product?.seller_info,
                                company_info: product?.company_info
                              }
                            }
                          });
                        }
                        // Fallback to generic company page
                        else {
                          navigate('/company', {
                            state: { 
                              from: location.pathname, 
                              sellerProfile: {
                                ...product?.seller_info,
                                company_info: product?.company_info
                              }
                            }
                          });
                        }
                      }}
                      className="h-16 rounded-md bg-[#027DDB] text-white text-base font-medium hover:brightness-95 flex items-center justify-center transition-colors"
                    >
                      View Company Page
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <TabCard tabs={["Product Details", "Company Info."]} active={tab} onChange={setTab}>
              {tab === 0 && (
                <div className="space-y-6">
                  <SectionCard title="Specifications">
                    <BasicInfoTable specs={product?.specifications} />
                  </SectionCard>

                  <SectionCard title="Description">
                    {product?.description ? (
                      <div className="prose prose-base max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: product.description }} />
                    ) : (
                      <div className="text-base text-slate-500">No description provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.description_files} emptyText="No description files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Specification">
                    {product?.specification ? (
                      <div className="prose prose-base max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: product.specification }} />
                    ) : (
                      <div className="text-base text-slate-500">No specification provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.specification_files} emptyText="No specification files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Production Capacity">
                    {product?.production_capacity ? (
                      <div className="prose prose-base max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: product.production_capacity }} />
                    ) : (
                      <div className="text-base text-slate-500">No production capacity information provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.production_capacity_files} emptyText="No production capacity files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Packaging & Delivery">
                    {product?.packaging_delivery ? (
                      <div className="prose prose-base max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: product.packaging_delivery }} />
                    ) : (
                      <div className="text-base text-slate-500">No packaging and delivery information provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.packaging_delivery_files} emptyText="No packaging & delivery files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Benefits">
                    {product?.benefits ? (
                      <div className="prose prose-base max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: product.benefits }} />
                    ) : (
                      <div className="text-base text-slate-500">No benefits provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.benefits_files} emptyText="No benefits files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Others">
                    {product?.others ? (
                      <div className="prose prose-base max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: product.others }} />
                    ) : (
                      <div className="text-base text-slate-500">No other information provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.others_files} emptyText="No other files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Customer Feedback">
                    {product?.customer_feedback ? (
                      <div className="prose prose-base max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: product.customer_feedback }} />
                    ) : (
                      <div className="text-base text-slate-500">No customer feedback provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.customer_feedback_files} emptyText="No customer feedback files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Questions & Answers">
                    {product?.questions_answers ? (
                      <div className="prose prose-base max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: product.questions_answers }} />
                    ) : (
                      <div className="text-base text-slate-500">No questions and answers provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.questions_answers_files} emptyText="No Q&A files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Brochure">
                    {(() => {
                      // Debug: Log all product fields to console to see brochure data structure
                      console.log('🔍 Product Debug - All field names:', Object.keys(product || {}));
                      console.log('🔍 Product Debug - Full product object:', product);
                      
                      // Look for any field that might contain file/URL data
                      const possibleFileFields = Object.keys(product || {}).filter(key => {
                        const value = product[key];
                        const keyLower = key.toLowerCase();
                        return keyLower.includes('file') || 
                               keyLower.includes('url') || 
                               keyLower.includes('document') || 
                               keyLower.includes('brochure') || 
                               keyLower.includes('pdf') ||
                               keyLower.includes('media') ||
                               keyLower.includes('attachment') ||
                               (typeof value === 'string' && (value.includes('.pdf') || value.includes('/media/') || value.includes('http'))) ||
                               (Array.isArray(value) && value.length > 0);
                      });
                      console.log('🔍 Product Debug - Possible file fields:', possibleFileFields);
                      console.log('🔍 Product Debug - Possible file field values:', 
                        possibleFileFields.reduce((acc, key) => {
                          acc[key] = product[key];
                          return acc;
                        }, {})
                      );
                      
                      // Collect brochure files from various possible sources in product data
                      const brochureFiles = [];
                      
                      // Check for direct brochure field
                      if (product?.brochure) {
                        brochureFiles.push({
                          title: 'Product Brochure',
                          url: product.brochure,
                          source: 'direct'
                        });
                      }
                      
                      // Check for brochure_files array
                      if (Array.isArray(product?.brochure_files)) {
                        product.brochure_files.forEach((file, index) => {
                          brochureFiles.push({
                            title: file?.title || file?.name || `Brochure ${index + 1}`,
                            url: file?.file || file?.url || file?.download_url || file,
                            source: 'files_array'
                          });
                        });
                      }
                      
                      // Check for brochures array
                      if (Array.isArray(product?.brochures)) {
                        product.brochures.forEach((file, index) => {
                          brochureFiles.push({
                            title: file?.title || file?.name || `Brochure ${index + 1}`,
                            url: file?.file || file?.url || file?.download_url || file,
                            source: 'brochures_array'
                          });
                        });
                      }
                      
                      // Check for other possible single brochure fields
                      if (product?.brochure_file) {
                        brochureFiles.push({
                          title: 'Product Brochure',
                          url: product.brochure_file,
                          source: 'brochure_file'
                        });
                      }
                      
                      if (product?.brochure_url) {
                        brochureFiles.push({
                          title: 'Product Brochure',
                          url: product.brochure_url,
                          source: 'brochure_url'
                        });
                      }
                      
                      if (product?.brochure_document) {
                        brochureFiles.push({
                          title: 'Product Brochure',
                          url: product.brochure_document,
                          source: 'brochure_document'
                        });
                      }
                      
                      // Check for documents array
                      if (Array.isArray(product?.documents)) {
                        product.documents.forEach((file, index) => {
                          brochureFiles.push({
                            title: file?.title || file?.name || `Document ${index + 1}`,
                            url: file?.file || file?.url || file?.download_url || file,
                            source: 'documents_array'
                          });
                        });
                      }
                      
                      // Check for files array
                      if (Array.isArray(product?.files)) {
                        product.files.forEach((file, index) => {
                          const fileName = file?.title || file?.name || '';
                          if (fileName.toLowerCase().includes('brochure') || fileName.toLowerCase().includes('pdf')) {
                            brochureFiles.push({
                              title: file?.title || file?.name || `File ${index + 1}`,
                              url: file?.file || file?.url || file?.download_url || file,
                              source: 'files_array'
                            });
                          }
                        });
                      }
                      
                      // Check for attachments array
                      if (Array.isArray(product?.attachments)) {
                        product.attachments.forEach((file, index) => {
                          brochureFiles.push({
                            title: file?.title || file?.name || `Attachment ${index + 1}`,
                            url: file?.file || file?.url || file?.download_url || file,
                            source: 'attachments_array'
                          });
                        });
                      }
                      
                      // Check additional_files for brochure-related items
                      if (Array.isArray(product?.additional_files)) {
                        product.additional_files.forEach((file, index) => {
                          const section = (file?.section_type || file?.field_type || '').toLowerCase();
                          const title = (file?.title || '').toLowerCase();
                          if (section.includes('brochure') || title.includes('brochure') || section.includes('specification')) {
                            brochureFiles.push({
                              title: file?.title || file?.name || `Brochure ${index + 1}`,
                              url: file?.file || file?.url || file?.download_url,
                              source: 'additional_files'
                            });
                          }
                        });
                      }
                      
                      if (brochureFiles.length === 0) {
                        return <div className="text-base text-slate-500">No brochure available.</div>;
                      }
                      
                      return (
                        <div className="space-y-3">
                          {brochureFiles.map((brochure, index) => {
                            const fileUrl = brochure.url;
                            if (!fileUrl) return null;
                            
                            // Make URL absolute if needed
                            const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : 
                              fileUrl.startsWith('/') ? `${API_BASE_URL}${fileUrl}` : fileUrl;
                            
                            return (
                              <div key={index} className="flex items-center justify-between gap-3 p-3 border border-slate-200 rounded-md bg-white">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 flex items-center justify-center rounded bg-slate-100 text-slate-600 flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                      <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
                                      <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                                    </svg>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-slate-800 font-medium truncate">{brochure.title}</div>
                                    <div className="text-sm text-slate-500 truncate" title={absoluteUrl}>
                                      {absoluteUrl}
                                    </div>
                                  </div>
                                </div>
                                <a 
                                  href={absoluteUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M6.75 20.25a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM17.25 20.25a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75z" clipRule="evenodd" />
                                  </svg>
                                  <span>Download</span>
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </SectionCard>
                </div>
              )}
              {tab === 1 && (
                <div className="space-y-6">

                  {/* ABOUT US Section */}
                  {(() => {
                    // Use the new company_info structure from backend
                    const company = product?.company_info || {};
                    const sellerInfo = product?.seller_info || {};
                    const aboutUsMedia = company?.about_us_media || [];
                    const hasMedia = Array.isArray(aboutUsMedia) && aboutUsMedia.length > 0;
                    
                    // Check for any available text content
                    const companyName = company?.company_name || sellerInfo?.company_name;
                    const businessType = sellerInfo?.business_type || company?.business_type;
                    const website = company?.website || sellerInfo?.website;
                    const country = sellerInfo?.country_name || company?.address_country;
                    const state = sellerInfo?.state || company?.address_state;
                    
                    const hasText = company?.about_us || company?.why_choose_us || company?.additional_info || companyName || businessType;
                    
                    // Only render the section if there's content
                    if (!hasMedia && !hasText) {
                      return null; // Hide the entire section when no content
                    }
                    
                    return (
                      <SectionCard title={<span className="font-bold">ABOUT US</span>}>
                        <div className="space-y-8">
                          {/* Company Story Text */}
                          {hasText && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                </div>
                                <div className="flex-1 space-y-4">
                                  <h3 className="text-xl font-semibold text-slate-900">Company Information</h3>
                                  
                                  {/* Company Name and Business Type */}
                                  {companyName && (
                                    <div className="prose prose-slate max-w-none">
                                      <div className="text-slate-700 leading-relaxed">
                                        <strong>Company:</strong> {companyName}
                                        {businessType && <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{businessType}</span>}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Website */}
                                  {website && (
                                    <div className="prose prose-slate max-w-none">
                                      <div className="text-slate-700 leading-relaxed">
                                        <strong>Website:</strong> <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{website}</a>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Location */}
                                  {(country || state) && (
                                    <div className="prose prose-slate max-w-none">
                                      <div className="text-slate-700 leading-relaxed">
                                        <strong>Location:</strong> {[state, country].filter(Boolean).join(', ')}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Business Verification Status */}
                                  {sellerInfo?.business_verification_status && (
                                    <div className="prose prose-slate max-w-none">
                                      <div className="text-slate-700 leading-relaxed">
                                        <strong>Verification Status:</strong> 
                                        <span className={`ml-2 text-sm px-2 py-1 rounded ${
                                          sellerInfo.business_verification_status === 'VERIFIED' ? 'bg-green-100 text-green-800' : 
                                          sellerInfo.business_verification_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {sellerInfo.business_verification_status}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* About Us */}
                                  {company?.about_us && (
                                    <div className="prose prose-slate max-w-none">
                                      <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        <strong>About Us:</strong><br />
                                        {company.about_us}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Why Choose Us */}
                                  {company?.why_choose_us && (
                                    <div className="mt-6 p-4 bg-white/60 rounded-lg border border-blue-200">
                                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Why Choose Us
                                      </h4>
                                      <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{company.why_choose_us}</div>
                                    </div>
                                  )}
                                  
                                  {/* Additional Info */}
                                  {company?.additional_info && (
                                    <div className="prose prose-slate max-w-none">
                                      <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        <strong>Additional Information:</strong><br />
                                        {company.additional_info}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </SectionCard>
                    );
                  })()}
                  
                  {/* Media Gallery - Full Width Section */}
                  {(() => {
                    const company = product?.seller_info?.company || {};
                    const sellerInfo = product?.seller_info || {};
                    const aboutUsMedia = company?.about_us_media || sellerInfo?.about_us_media || [];
                    const hasMedia = Array.isArray(aboutUsMedia) && aboutUsMedia.length > 0;
                    
                    if (!hasMedia) return null;
                    
                    return (
                      <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden -mx-6">
                        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                          <h3 className="text-lg md:text-xl text-slate-800 font-bold">VISUAL STORY</h3>
                        </div>
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-0">
                          {(() => {
                            const displayItems = showMoreCompanySections.aboutUsMedia ? aboutUsMedia : aboutUsMedia.slice(0, 6);
                            return (
                              <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                                  {displayItems.map((media, i) => {
                                    const mediaUrl = media?.url || media?.file || media;
                                    const isVideo = /\/video\//.test(String(mediaUrl)) || /\.(mp4|webm|ogg)(\?|$)/i.test(String(mediaUrl));
                                    return (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => open([{ type: isVideo ? 'video' : 'image', src: mediaUrl }], i)}
                                        className="group relative aspect-[4/3] overflow-hidden hover:z-10 transition-all duration-300 hover:shadow-2xl hover:scale-105"
                                      >
                                        {isVideo ? (
                                          <div className="relative w-full h-full">
                                            <video 
                                              src={mediaUrl} 
                                              className="w-full h-full object-cover" 
                                              muted 
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                              }}
                                            />
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center" style={{display: 'none'}}>
                                              <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center">
                                                <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                              </div>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/30 transition-colors flex items-center justify-center">
                                              <div className="w-20 h-20 bg-white/95 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                <svg className="w-10 h-10 text-slate-700 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M8 5v14l11-7z"/>
                                                </svg>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <img 
                                              src={mediaUrl} 
                                              alt={`About us ${i + 1}`} 
                                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                              }}
                                            />
                                            <div className="absolute inset-0 bg-slate-200 flex items-center justify-center" style={{display: 'none'}}>
                                              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                              </svg>
                                            </div>
                                          </>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                                {aboutUsMedia.length > 6 && (
                                  <div className="text-center pt-6 pb-6 bg-gradient-to-br from-slate-50 to-blue-50">
                                    <button
                                      className="inline-flex items-center gap-3 px-8 py-4 rounded-xl border-2 border-white/60 bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-300 font-medium text-lg"
                                      onClick={() => setShowMoreCompanySections(prev => ({ ...prev, aboutUsMedia: !prev.aboutUsMedia }))}
                                    >
                                      {showMoreCompanySections.aboutUsMedia ? (
                                        <>
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                          </svg>
                                          Show Less
                                        </>
                                      ) : (
                                        <>
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                          </svg>
                                          View All {aboutUsMedia.length} Items
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Company Details */}
                  {(() => {
                    // Use the new company_info structure from backend
                    const c = product?.company_info || {};
                    const sellerInfo = product?.seller_info || {};
                    return (
                      <SectionCard title="Company Details">
                        <div className="space-y-2 text-base">
                          <KeyInfoRow label="Company Name" value={c.company_name || sellerInfo.company_name || '—'} />
                          <KeyInfoRow label="Full Name" value={sellerInfo.full_name || '—'} />
                          <KeyInfoRow label="Business Type" value={sellerInfo.business_type || '—'} />
                          <KeyInfoRow label="Member Status" value={sellerInfo.member_status || '—'} />
                          <KeyInfoRow label="Website" value={c.website || sellerInfo.website ? (
                            <a href={c.website || sellerInfo.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{c.website || sellerInfo.website}</a>
                          ) : '—'} />
                          <KeyInfoRow label="Business Verification" value={
                            sellerInfo.business_verification_status ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                sellerInfo.business_verification_status === 'VERIFIED' ? 'bg-green-100 text-green-800' : 
                                sellerInfo.business_verification_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {sellerInfo.business_verification_status}
                              </span>
                            ) : '—'
                          } />
                          <KeyInfoRow label="Country" value={sellerInfo.country_name || c.address_country || '—'} />
                          <KeyInfoRow label="State" value={sellerInfo.state || c.address_state || '—'} />
                          <KeyInfoRow label="Phone Number" value={sellerInfo.phone_number || '—'} />
                          {/* Company specific fields */}
                          <KeyInfoRow label="Why choose us" value={c.why_choose_us || '—'} />
                          <KeyInfoRow label="Year of establishment" value={c.year_of_establishment || '—'} />
                          <KeyInfoRow label="Number of employees" value={c.number_of_employees || '—'} />
                          <KeyInfoRow label="Annual turnover" value={c.annual_turnover || '—'} />
                          <KeyInfoRow label="Brand name" value={c.brand_name || '—'} />
                          <KeyInfoRow label="Company capacity" value={c.company_capacity || '—'} />
                          <KeyInfoRow label="City" value={c.address_city || '—'} />
                          <KeyInfoRow label="Street" value={c.street || '—'} />
                        </div>
                      </SectionCard>
                    );
                  })()}

                  {/* Company Media Sections - Using new company_info structure */}
                  <SectionCard title="Certificates">
                    <CompanyMediaGrid 
                      items={product?.company_info?.certificates || []} 
                      emptyText="No certificates uploaded."
                      showMore={showMoreCompanySections.certificates}
                      onToggleShowMore={() => setShowMoreCompanySections(prev => ({ ...prev, certificates: !prev.certificates }))}
                    />
                  </SectionCard>

                  <SectionCard title="Blog & Awards">
                    <CompanyMediaGrid 
                      items={product?.company_info?.blog_awards || []} 
                      emptyText="No blog/awards uploaded."
                      showMore={showMoreCompanySections.blogAwards}
                      onToggleShowMore={() => setShowMoreCompanySections(prev => ({ ...prev, blogAwards: !prev.blogAwards }))}
                    />
                  </SectionCard>

                  <SectionCard title="Production Sites">
                    <CompanyMediaGrid 
                      items={product?.company_info?.production_sites || []} 
                      emptyText="No production sites uploaded."
                      showMore={showMoreCompanySections.productionSites}
                      onToggleShowMore={() => setShowMoreCompanySections(prev => ({ ...prev, productionSites: !prev.productionSites }))}
                    />
                  </SectionCard>

                  <SectionCard title="Storage Sites">
                    <CompanyMediaGrid 
                      items={product?.company_info?.storage_sites || []} 
                      emptyText="No storage sites uploaded."
                      showMore={showMoreCompanySections.storageSites}
                      onToggleShowMore={() => setShowMoreCompanySections(prev => ({ ...prev, storageSites: !prev.storageSites }))}
                    />
                  </SectionCard>

                  <SectionCard title="Exhibitions">
                    <CompanyMediaGrid 
                      items={product?.company_info?.exhibitions || []} 
                      emptyText="No exhibitions uploaded."
                      showMore={showMoreCompanySections.exhibitions}
                      onToggleShowMore={() => setShowMoreCompanySections(prev => ({ ...prev, exhibitions: !prev.exhibitions }))}
                    />
                  </SectionCard>


                  <SectionCard title={product?.company_info?.company_name ? `Send your message to ${product.company_info.company_name}` : product?.seller_info?.company_name ? `Send your message to ${product.seller_info.company_name}` : 'Send your message to this supplier'}>
                    <form className="space-y-4" onSubmit={async (e) => {
                      e.preventDefault();
                      setMsgError(''); setMsgSuccess('');
                      if (!isAuthenticated) { navigate('/login'); return; }
                      const body = msgBody.trim();
                      const fromEmail = msgFromEmail.trim();
                      if (fromEmail === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) { setMsgError('Please enter a valid email.'); return; }
                      if (body.length < 20) { setMsgError('Message must be at least 20 characters.'); return; }
                      setMsgSending(true);
                      try {
                        const recipientEmail = product?.seller_info?.email || undefined;
                        const recipientAtlas = product?.seller_info?.atlas_id || product?.seller_info?.atlasId || undefined;
                        const subject = product?.title ? `Inquiry about: ${product.title}` : 'Supplier inquiry';
                        // Include the "From" email at the top of the message body for backend visibility if needed
                        const finalBody = `From: ${fromEmail}\n\n${body}`;
                        await sendMessage({ subject, body: finalBody, recipient_email: recipientEmail, recipient_atlas_id: recipientAtlas, related_product: product?.id });
                        setMsgSuccess('Message sent successfully.');
                        setMsgBody('');
                        // keep from email for convenience
                        setTimeout(() => setMsgSuccess(''), 2500);
                      } catch (err) {
                        setMsgError(err?.message || 'Failed to send message');
                      } finally { setMsgSending(false); }
                    }}>
                      {/* From */}
                      <div className="flex flex-col gap-1">
                        <label className="text-base text-slate-700">
                          <span className="text-blue-600">*</span> From:
                        </label>
                        <input
                          type="email"
                          placeholder="Enter your email address"
                          className="h-10 rounded border border-slate-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={msgFromEmail}
                          onChange={(e) => setMsgFromEmail(e.target.value)}
                        />
                      </div>

                      {/* To (seller) */}
                      <div className="flex flex-col gap-1">
                        <label className="text-base text-slate-700">
                          <span className="text-blue-600">*</span> To:
                        </label>
                        <div className="flex items-center gap-2">
                          <img src={sellerInfo.avatarUrl || '/images/img_image_2.png'} alt="contact" className="w-8 h-8 rounded object-cover" />
                          <div className="text-base text-slate-800">{sellerInfo.name || '—'}</div>
                        </div>
                      </div>

                      {/* Message */}
                      <div className="flex flex-col gap-1">
                        <label className="text-base text-slate-700">
                          <span className="text-blue-600">*</span> Message:
                        </label>
                        <textarea
                          rows={5}
                          className="w-full rounded border border-slate-300 p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={msgBody}
                          onChange={(e) => setMsgBody(e.target.value)}
                        />
                        <div className="text-sm text-slate-500">Enter between 20 to 4,000 characters.</div>
                      </div>
                      {msgError && <div className="text-sm text-rose-600 mt-1">{msgError}</div>}
                      {msgSuccess && <div className="text-sm text-green-600 mt-1">{msgSuccess}</div>}
                      {/* Actions */}
                      <div className="flex items-center gap-4">
                        <button type="submit" disabled={msgSending} className={`h-10 px-5 rounded text-white text-base font-medium ${msgSending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{msgSending ? 'Sending…' : 'Send'}</button>
                        <div className="text-sm text-slate-500">
                          This is not what you are looking for?{' '}
                          <button type="button" onClick={openProductRequestModal} className="text-blue-600 hover:underline">Post a Sourcing Request Now</button>
                        </div>
                      </div>
                    </form>
                  </SectionCard>

                  <SectionCard title="Related Products">
                    <CompanyProducts 
                      sellerId={product?.seller_info?.id || product?.seller_id || product?.seller} 
                      companyName={sellerInfo?.companyName}
                    />
                  </SectionCard>
                </div>
              )}
            </TabCard>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <SellerCard onContact={() => setContactOpen(true)} onLeaveMessageClick={openSendMessageModal} onAffiliateClick={() => setAffiliateOpen(true)} name={sellerInfo.name} role={sellerInfo.role} avatarUrl={sellerInfo.avatarUrl} />
            <CompanyInfoCard 
              companyLogo={product?.seller_info?.profile_image || product?.seller_info?.avatar || product?.company_info?.company_logo_url || product?.company_info?.company_image_url} 
              companyName={product?.seller_info?.full_name || product?.seller_info?.name || product?.seller_info?.company_name || product?.company_info?.company_name || (product?.seller_info?.first_name && product?.seller_info?.last_name ? `${product?.seller_info?.first_name} ${product?.seller_info?.last_name}` : '')} 
              badges={(() => {
                // Get the actual business verification status from API
                const rawStatus = product?.seller_info?.business_verification_status || product?.seller_info?.verification_status || '';
                
                // Only show badge if there's an actual status
                if (!rawStatus) return [];
                
                // Use the actual status value from API as the label
                const statusLabel = String(rawStatus).charAt(0).toUpperCase() + String(rawStatus).slice(1).toLowerCase();
                const statusUpper = String(rawStatus).toUpperCase();
                
                // Determine color based on status
                let badgeColor = 'bg-gray-50 text-gray-700 border-gray-200'; // Default
                
                if (statusUpper === 'VERIFIED' || statusUpper === 'APPROVED') {
                  badgeColor = 'bg-green-50 text-green-700 border-green-200';
                } else if (statusUpper === 'PENDING') {
                  badgeColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                } else if (statusUpper === 'REJECTED' || statusUpper === 'DENIED') {
                  badgeColor = 'bg-red-50 text-red-700 border-red-200';
                }
                
                return [{
                  label: statusLabel, // Use actual API status as label
                  color: badgeColor,
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                    </svg>
                  )
                }];
              })()}
              onClick={() => {
                // Smart navigation: check if product belongs to subsidiary or parent company
                const sellerId = product?.seller_info?.id || product?.seller_id || product?.seller;
                const subsidiarySlug = product?.subsidiary_slug || product?.seller_info?.subsidiary_slug;
                const subsidiaryId = product?.subsidiary_id || product?.seller_info?.subsidiary_id;
                
                // DEBUG: Log available product data to help backend team
                console.log('🔍 Product Navigation Debug:', {
                  sellerId,
                  subsidiarySlug,
                  subsidiaryId,
                  product_seller_info: product?.seller_info,
                  product_keys: Object.keys(product || {}),
                  seller_info_keys: Object.keys(product?.seller_info || {})
                });
                
                // Navigate to subsidiary page if product belongs to subsidiary
                if (subsidiarySlug) {
                  navigate(`/subsidiary/${subsidiarySlug}`, {
                    state: { from: location.pathname, sellerProfile: product?.seller_info }
                  });
                } 
                // Try subsidiary ID if no slug available
                else if (subsidiaryId) {
                  navigate(`/subsidiary/${subsidiaryId}`, {
                    state: { from: location.pathname, sellerProfile: product?.seller_info }
                  });
                }
                // Navigate to parent company page
                else if (sellerId) {
                  navigate(`/company/${sellerId}`, {
                    state: { from: location.pathname, sellerProfile: product?.seller_info }
                  });
                }
                // Fallback to generic company page
                else {
                  navigate('/company', {
                    state: { from: location.pathname, sellerProfile: product?.seller_info }
                  });
                }
              }}
            />
            <div className="bg-white rounded-md shadow-sm border border-slate-200">
              <div className="px-4 py-3 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">You May Like</h3>
              </div>
              <div className="p-3">
                <SidebarTopRanking />
              </div>
            </div>
          </div>
        </div>
      </div>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} roleLabel={roleLabel} productId={product?.id} />
      {affiliateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAffiliateOpen(false)} />
          <div className="relative w-[90%] max-w-sm rounded-md bg-white shadow-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-slate-900">Coming soon</div>
                <div className="mt-1 text-base text-slate-600">Affiliate requests will be available shortly.</div>
              </div>
              <button onClick={() => setAffiliateOpen(false)} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-500"><path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" /></svg>
              </button>
            </div>
            <div className="mt-4 flex items-center justify-end">
              <button onClick={() => setAffiliateOpen(false)} className="px-3 py-2 text-base rounded border border-slate-300 bg-white hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
      {smOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSmOpen(false)} />
          <div className="relative mt-12 w-[92%] max-w-lg rounded-xl bg-white shadow-xl border border-gray-200 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 flex-none">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Send Message</h3>
                  <p className="text-blue-100 text-sm">Contact the supplier directly</p>
                </div>
              </div>
              <button onClick={() => setSmOpen(false)} className="p-2 rounded-lg hover:bg-white/20 transition-colors" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                  <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-gray-50">
              {smSuccess ? (
                <SuccessAlert message={smSuccess} onClose={() => setSmSuccess('')} />
              ) : null}
              {smError ? (
                <div className="rounded border px-3 py-2 text-sm border-red-300 bg-red-50 text-red-700">{smError}</div>
              ) : null}
              {/* Subject Section */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Message Details</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                    <input 
                      value={smSubject} 
                      onChange={(e) => setSmSubject(e.target.value)} 
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                      placeholder="Enter message subject" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Email *</label>
                      <input 
                        value={smRecipientEmail} 
                        onChange={(e) => setSmRecipientEmail(e.target.value)} 
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                        placeholder="email@example.com" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Atlas ID (optional)</label>
                      <input 
                        value={smRecipientAtlasId} 
                        onChange={(e) => setSmRecipientAtlasId(e.target.value)} 
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                        placeholder="e.g. ATL123" 
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-blue-700">Provide at least one recipient: email or Atlas ID.</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                    <textarea 
                      value={smBody} 
                      onChange={(e) => setSmBody(e.target.value)} 
                      rows={5} 
                      className="w-full rounded-lg border border-gray-300 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm resize-none" 
                      placeholder="Type your message here..." 
                    />
                  </div>
                </div>
              </div>
              {/* Attachment & Actions Section */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Attachment & Send</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attachment (optional)</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        onChange={(e) => setSmFile(e.target.files?.[0] || null)} 
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setSmOpen(false)}
                      className="px-6 py-3 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        setSmSending(true); setSmError(''); setSmSuccess('');
                        try {
                          await sendMessage({
                            subject: smSubject,
                            body: smBody,
                            recipient_email: smRecipientEmail || undefined,
                            recipient_atlas_id: smRecipientAtlasId || undefined,
                            related_product: product?.id || undefined,
                            attachment: smFile || undefined,
                          });
                          setSmSuccess('Message sent successfully.');
                          setTimeout(() => { setSmOpen(false); setSmSuccess(''); }, 1800);
                          setSmSubject(''); setSmRecipientEmail(''); setSmRecipientAtlasId(''); setSmBody(''); setSmFile(null);
                        } catch (e) {
                          try { console.warn('sendMessage failed', e?.status, e?.data, e?.message); } catch {}
                          setSmError(e?.message || 'Failed to send message');
                        } finally { setSmSending(false); }
                      }}
                      disabled={smSending || !smSubject.trim() || !smBody.trim() || (!smRecipientEmail.trim() && !smRecipientAtlasId.trim())}
                      className={`px-6 py-3 text-sm font-medium rounded-lg text-white transition-all duration-200 ${
                        smSending || !smSubject.trim() || !smBody.trim() || (!smRecipientEmail.trim() && !smRecipientAtlasId.trim()) 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {smSending ? (
                        <div className="flex items-center space-x-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Sending…</span>
                        </div>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {prOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPrOpen(false)} />
          <div className="relative mt-12 w-[92%] max-w-2xl rounded-xl bg-white shadow-xl border border-gray-200 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 flex-none">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Post a Sourcing Request</h3>
                  <p className="text-blue-100 text-sm">Tell us what you're looking for and connect with suppliers</p>
                </div>
              </div>
              <button onClick={() => setPrOpen(false)} className="p-2 rounded-lg hover:bg-white/20 transition-colors" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                  <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-gray-50">
              {prSuccess && (
                <div ref={successRef}>
                  <SuccessAlert message={prSuccess} onClose={() => setPrSuccess('')} />
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-700 mb-1">Product name</label>
                <input
                  value={prProductName}
                  onChange={(e) => setPrProductName(e.target.value)}
                  type="text"
                  className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What product do you need?"
                />
              </div>
              {/* Category (dropdown) */}
              <div>
                <label className="block text-sm text-slate-700 mb-1">Category</label>
                <select 
                  value={prCategoryId} 
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setPrCategoryId(selectedId);
                    // Find and store the category name for display
                    if (selectedId) {
                      const selectedCategory = prCategories.find(c => c.id.toString() === selectedId);
                      setPrCategoryName(selectedCategory ? selectedCategory.name : '');
                      setPrCategoryText(''); // Clear text input when dropdown is used
                    } else {
                      setPrCategoryName('');
                    }
                  }} 
                  className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{prCatLoading ? 'Loading categories...' : 'Select a category'}</option>
                  {prCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {prCatError && <p className="text-xs text-red-600 mt-1">{prCatError}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Quantity</label>
                  <input value={prQuantity} onChange={(e) => setPrQuantity(e.target.value)} type="number" min="0" className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Unit</label>
                  <select value={prUnitType} onChange={(e) => setPrUnitType(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="pieces">Pieces</option>
                    <option value="boxes">Boxes</option>
                    <option value="meters">Meters</option>
                    <option value="others">Others</option>
                  </select>
                  {prUnitType === 'others' && (
                    <input value={prCustomUnit} onChange={(e) => setPrCustomUnit(e.target.value)} type="text" className="mt-2 h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter custom unit" />
                  )}
                </div>
              </div>
              {/* Purchase Quantity (new spec) */}
              <div>
                <label className="block text-sm text-slate-700 mb-1">Purchase Quantity (optional)</label>
                <input value={prPurchaseQty} onChange={(e) => setPrPurchaseQty(e.target.value)} type="number" min="0" className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 100" />
              </div>
              {/* Business Type */}
              <div>
                <label className="block text-sm text-slate-700 mb-1">Business Type</label>
                <select value={prBusinessType} onChange={(e) => setPrBusinessType(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option value="ASSOCIATION">ASSOCIATION</option>
                  <option value="RETAILER">RETAILER</option>
                  <option value="MANUFACTURER">MANUFACTURER</option>
                  <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                  <option value="AGENT">AGENT</option>
                </select>
              </div>
              {/* Enums per spec */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Time of Validity</label>
                  <select value={prTimeValidity} onChange={(e) => setPrTimeValidity(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select</option>
                    <option value="1_WEEK">1_WEEK</option>
                    <option value="2_WEEKS">2_WEEKS</option>
                    <option value="1_MONTH">1_MONTH</option>
                    <option value="3_MONTHS">3_MONTHS</option>
                    <option value="6_MONTHS">6_MONTHS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Piece Unit</label>
                  <select value={prPieceUnit} onChange={(e) => setPrPieceUnit(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select</option>
                    <option value="UNITS">UNITS</option>
                    <option value="KG">KG</option>
                    <option value="TON">TON</option>
                    <option value="PIECES">PIECES</option>
                    <option value="BOXES">BOXES</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Buying Frequency</label>
                <select value={prBuyingFrequency} onChange={(e) => setPrBuyingFrequency(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option value="WEEKLY">WEEKLY</option>
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="QUARTERLY">QUARTERLY</option>
                  <option value="YEARLY">YEARLY</option>
                  <option value="ONE_TIME">ONE_TIME</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Country</label>
                <select value={prCountry} onChange={(e) => setPrCountry(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Country</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="South Africa">South Africa</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="China">China</option>
                  <option value="India">India</option>
                  <option value="UAE">UAE</option>
                </select>
              </div>
              {/* City */}
              <div>
                <label className="block text-sm text-slate-700 mb-1">City (optional)</label>
                <input value={prCity} onChange={(e) => setPrCity(e.target.value)} type="text" className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="City" />
              </div>
              {/* Budget and Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Budget (optional)</label>
                  <input value={prBudget} onChange={(e) => setPrBudget(e.target.value)} type="number" min="0" step="0.01" className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 5000" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Currency</label>
                  <select value={prCurrency} onChange={(e) => setPrCurrency(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="NGN">NGN</option>
                    <option value="USD">USD</option>
                    <option value="GHS">GHS</option>
                    <option value="KES">KES</option>
                    <option value="ZAR">ZAR</option>
                    <option value="CNY">CNY</option>
                    <option value="INR">INR</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              {/* Target price and Max budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Target Unit Price</label>
                  <input value={prTargetUnitPrice} onChange={(e) => setPrTargetUnitPrice(e.target.value)} type="number" min="0" step="0.01" className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 2.75" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Max Budget</label>
                  <input value={prMaxBudget} onChange={(e) => setPrMaxBudget(e.target.value)} type="number" min="0" step="0.01" className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 15000" />
                </div>
              </div>
              {/* Role toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={prIsBuyer} onChange={(e) => { const v = e.target.checked; setPrIsBuyer(v); if (v) setPrIsSupplier(false); }} />
                  <span>I am a Buyer</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={prIsSupplier} onChange={(e) => { const v = e.target.checked; setPrIsSupplier(v); if (v) setPrIsBuyer(false); }} />
                  <span>I am a Supplier</span>
                </label>
              </div>
              {/* Visibility toggles (mutually exclusive) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={prOnlyPaid}
                    onChange={(e) => { const v = e.target.checked; setPrOnlyPaid(v); if (v) setPrAllowAll(false); }}
                  />
                  <span>Only paid members</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={prAllowAll}
                    onChange={(e) => { const v = e.target.checked; setPrAllowAll(v); if (v) setPrOnlyPaid(false); }}
                  />
                  <span>Allow all members</span>
                </label>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Details</label>
                <textarea value={prDetails} onChange={(e) => setPrDetails(e.target.value)} rows={5} className="w-full rounded border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe your sourcing needs..." />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Attachments (optional)</label>
                <input multiple type="file" onChange={(e) => setPrFiles(Array.from(e.target.files || []))} className="text-sm" />
              </div>
              {prError && <div className="text-sm text-red-600">{prError}</div>}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button onClick={() => setPrOpen(false)} className="px-3 py-2 text-sm rounded border border-slate-300 bg-white hover:bg-gray-50">Cancel</button>
                <button onClick={submitProductRequest} disabled={prSubmitting} className={`px-3 py-2 text-sm rounded text-white ${prSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#027DDB] hover:brightness-95'}`}>{prSubmitting ? 'Submitting…' : 'Submit Request'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
