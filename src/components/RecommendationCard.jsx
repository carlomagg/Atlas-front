import React from 'react';

const RecommendationCard = ({ imageIndex, title }) => {
  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center flex-shrink-0">
          <img
            src={`/images/recommendation-${imageIndex}.svg`}
            alt={title}
            className="w-8 h-8 object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-800 truncate">{title}</h3>
          {/* Price removed as per requirement */}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;