import React, { useState, useEffect } from 'react';
import { fetchSellerProducts } from '../services/productApi';
import ProductCard from './ProductCard';
import ContactModal from './common/ContactModal';

const CompanyProducts = ({ sellerId, companyName }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const productsPerPage = 12; // Fetch 12 products per page from API
  const initialDisplayCount = 4; // Show only 4 products initially

  const loadProducts = async (page = 1, reset = false) => {
    if (!sellerId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetchSellerProducts(sellerId, {
        page: page.toString(),
        page_size: productsPerPage.toString(),
        status: 'APPROVED' // Only show approved products
      });
      
      // Handle both paginated response and direct array
      const newProducts = Array.isArray(response) ? response : (response?.results || []);
      const total = response?.count || newProducts.length;
      
      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }
      
      setTotalProducts(total);
      setCurrentPage(page);
      
      // Check if there are more products to load
      const totalPages = Math.ceil(total / productsPerPage);
      setHasMore(page < totalPages);
      
    } catch (err) {
      console.error('Failed to fetch seller products:', err);
      setError(err?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sellerId) {
      loadProducts(1, true);
    }
  }, [sellerId]);

  const handleContactSeller = (productId) => {
    setSelectedProductId(productId);
    setContactModalOpen(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadProducts(currentPage + 1, false);
    }
  };

  const handleSeeMore = () => {
    setShowAll(true);
  };

  const handleSeeLess = () => {
    setShowAll(false);
  };

  // Determine which products to display
  const displayedProducts = showAll ? products : products.slice(0, initialDisplayCount);
  const shouldShowSeeMore = !showAll && products.length > initialDisplayCount;

  if (loading && products.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => loadProducts(1, true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">
          {companyName ? `${companyName} hasn't listed any products yet.` : 'No products found.'}
        </div>
        <div className="text-sm text-gray-400">
          Check back later for new listings.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Removed product count text */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {companyName ? `${companyName}` : 'Company Products'}
          </h3>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedProducts.map((product) => {
          // Extract image URL from product data
          const imageUrl = product.primary_image || 
                          product.thumb || 
                          product.image_url ||
                          (product.media && product.media[0]?.file) ||
                          null;
          
          return (
            <ProductCard
              key={product.id}
              id={product.id}
              imageUrl={imageUrl}
              title={product.title}
              rating={product.rating || 0}
              subscriptionBadge={product.subscription_badge}
              dailyBoosterBadge={product.daily_booster_badge}
              isBoosted={product.is_boosted}
              boosterEndDate={product.booster_end_date}
              boosterStatus={product.booster_status}
              subscriptionEndDate={product.subscription_end_date}
              subscriptionStatus={product.subscription_status}
              onContactSeller={() => handleContactSeller(product.id)}
            />
          );
        })}
      </div>

      {/* See More/See Less and Load More Buttons */}
      <div className="text-center pt-6 space-y-3">
        {/* See More/See Less Button */}
        {shouldShowSeeMore && (
          <button
            onClick={handleSeeMore}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors mr-3"
          >
            See More ({products.length - initialDisplayCount} more)
          </button>
        )}
        
        {showAll && products.length > initialDisplayCount && (
          <button
            onClick={handleSeeLess}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors mr-3"
          >
            See Less
          </button>
        )}

        {/* Load More Button (only show when showing all and there are more to load) */}
        {showAll && hasMore && (
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load More Products'}
          </button>
        )}
      </div>

      {/* Contact Modal */}
      <ContactModal 
        open={contactModalOpen} 
        onClose={() => setContactModalOpen(false)} 
        roleLabel="Supplier"
        productId={selectedProductId}
      />
    </div>
  );
};

export default CompanyProducts;
