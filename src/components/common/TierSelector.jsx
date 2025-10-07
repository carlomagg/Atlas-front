import React from 'react';

/**
 * Tier Selector Component
 * Allows users to select subscription tiers with visual indicators
 */
const TierSelector = ({ selectedTier, onTierSelect, availableTiers = null }) => {
  // Default tiers if not provided by API
  const defaultTiers = [
    { 
      code: 'BASIC', 
      name: 'Basic', 
      price: '₦60,000/year', 
      color: 'blue',
      icon: '🥉',
      description: 'Perfect for getting started'
    },
    { 
      code: 'GOLD', 
      name: 'Gold', 
      price: '₦240,000/year', 
      color: 'yellow',
      icon: '🏅',
      description: 'Most popular choice'
    },
    { 
      code: 'DIAMOND', 
      name: 'Diamond', 
      price: '₦480,000/year', 
      color: 'purple',
      icon: '💎',
      description: 'Advanced features included'
    },
    { 
      code: 'PLATINUM', 
      name: 'Platinum', 
      price: '₦600,000/year', 
      color: 'gray',
      icon: '🏆',
      description: 'Ultimate package with everything'
    }
  ];

  const tiers = availableTiers || defaultTiers;

  const getColorClasses = (color, isSelected) => {
    const colorMap = {
      blue: isSelected 
        ? 'bg-blue-600 text-white border-blue-600' 
        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      yellow: isSelected 
        ? 'bg-yellow-600 text-white border-yellow-600' 
        : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
      purple: isSelected 
        ? 'bg-purple-600 text-white border-purple-600' 
        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      gray: isSelected 
        ? 'bg-gray-800 text-white border-gray-800' 
        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="tier-selector mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Tier</h2>
        <p className="text-gray-600">Select a tier to see all available packages for that level</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map(tier => {
          const isSelected = selectedTier === tier.code;
          const colorClasses = getColorClasses(tier.color, isSelected);
          
          return (
            <button
              key={tier.code}
              className={`tier-btn p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${colorClasses} ${
                isSelected ? 'shadow-lg scale-105' : 'shadow-md'
              }`}
              onClick={() => onTierSelect(tier.code)}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{tier.icon}</div>
                <div className="tier-name text-xl font-bold mb-2">{tier.name}</div>
                <div className="tier-price text-lg font-semibold mb-2">
                  {tier.price || `Starting from ${tier.name} pricing`}
                </div>
                <div className="tier-description text-sm opacity-90">
                  {tier.description}
                </div>
                {isSelected && (
                  <div className="mt-3">
                    <span className="inline-block bg-white bg-opacity-20 text-xs px-2 py-1 rounded-full">
                      Selected
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {selectedTier && (
        <div className="mt-6 text-center">
          <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">
              📋 Showing all {tiers.find(t => t.code === selectedTier)?.name} tier packages across all business types
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TierSelector;
