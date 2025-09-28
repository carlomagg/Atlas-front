import React from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../../utils/media';

export default function FeaturedProductCard({ product }) {
  if (!product) return null;

  const imageUrl = resolveMediaUrl(
    product.primary_image || 
    product.thumb || 
    product.image_url || 
    product.image || 
    ''
  ) || '/images/img_image_2.png';

  const productName = product.title || product.product_name || product.name || 'Untitled Product';
  const price = product.price || product.unit_price || 0;
  const minOrder = product.minimum_order_quantity || product.min_order || 0;
  const unit = product.unit || 'Piece';
  
  // Format price display
  const formatPrice = (price) => {
    if (!price || price === 0) return 'Price on Request';
    return `US$${parseFloat(price).toFixed(2)}`;
  };

  // Format minimum order display
  const formatMinOrder = (minOrder, unit) => {
    if (!minOrder || minOrder === 0) return '';
    return `${minOrder} ${unit}${minOrder > 1 ? 's' : ''} (MOQ)`;
  };

  return (
    <Link 
      to={`/product/${product.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 group"
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        <img 
          src={imageUrl}
          alt={productName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/img_image_2.png';
          }}
        />
        {/* Play button overlay for videos */}
        {product.has_video && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-slate-700 ml-0.5" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Product Name */}
        <h3 className="text-base md:text-lg font-semibold text-slate-900 line-clamp-2 mb-2">
          {productName}
        </h3>

        {/* Price - Only show if price exists */}
        {price > 0 && (
          <div className="mb-2">
            <div className="text-lg font-semibold text-slate-900">
              {formatPrice(price)}
              <span className="text-sm font-normal text-slate-500 ml-1">
                / {unit}
              </span>
            </div>
          </div>
        )}

        {/* Minimum Order */}
        {minOrder > 0 && (
          <div className="text-sm text-slate-600">
            {formatMinOrder(minOrder, unit)}
          </div>
        )}
      </div>
    </Link>
  );
}
