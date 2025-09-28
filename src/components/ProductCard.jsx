import React from 'react';
import { Link } from 'react-router-dom';
import { useMediaLightbox } from './common/MediaLightboxProvider.jsx';
import SubscriptionBadge from './common/SubscriptionBadge.jsx';
import DailyBoosterBadge from './common/DailyBoosterBadge.jsx';

const ProductCard = ({ id, imageIndex, imageUrl, title, rating, onContactSeller, subscriptionBadge, dailyBoosterBadge, isBoosted, boosterEndDate, boosterStatus, subscriptionEndDate, subscriptionStatus }) => {
  const { open } = useMediaLightbox();
  const Wrapper = ({ children }) => (
    id ? <Link to={`/product/${id}`} target="_blank" rel="noopener noreferrer">{children}</Link> : <div>{children}</div>
  );
  return (
    <Wrapper>
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200 group cursor-pointer h-full flex flex-col">
      <div className="relative">
        <div className="aspect-square bg-gray-50 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              No photos
            </div>
          )}
        </div>

        {/* Badge Overlays */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {subscriptionBadge && (
            <SubscriptionBadge 
              subscriptionBadge={subscriptionBadge}
              subscriptionEndDate={subscriptionEndDate}
              subscriptionStatus={subscriptionStatus}
            />
          )}
          {(dailyBoosterBadge || isBoosted) && (
            <DailyBoosterBadge 
              dailyBoosterBadge={dailyBoosterBadge || (isBoosted ? 'boosted' : null)}
              boosterEndDate={boosterEndDate}
              boosterStatus={boosterStatus}
            />
          )}
        </div>

        {/* Action Icons Overlay */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-col space-y-2">
            <button
              className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors"
              aria-label="View"
              onClick={(e) => {
                e.preventDefault?.();
                e.stopPropagation?.();
                if (imageUrl) open([{ type: 'image', src: imageUrl }], 0);
              }}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              aria-label="Contact Seller"
              title="Contact Seller"
              className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors"
              onClick={(e) => {
                // prevent navigating the Link wrapper
                e.preventDefault?.();
                e.stopPropagation?.();
                onContactSeller && onContactSeller();
              }}
            >
              {/* Message icon to represent contacting the seller */}
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-9 5l3.6-3.6a1 1 0 01.7-.3H19a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 text-center flex-1 flex flex-col justify-between">
        <h3 className="font-bold text-lg sm:text-xl text-gray-800 mb-2 line-clamp-2">{title}</h3>
        <div className="flex items-center justify-center">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
        {/* Price removed as per requirement */}
      </div>
      </div>
    </Wrapper>
  );
};

export default ProductCard;