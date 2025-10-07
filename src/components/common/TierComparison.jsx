import React, { useState, useEffect } from 'react';
import transactionApi from '../../services/transactionApi';

/**
 * Tier Comparison Component
 * Shows all business types within a specific tier in a comparison table
 */
const TierComparison = ({ tier, onSelectPackage }) => {
  const [packages, setPackages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tier) {
      fetchTierPackages();
    }
  }, [tier]);

  const fetchTierPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await transactionApi.subscriptionApi.getPackagesForTier(tier);
      
      if (response?.data?.business_types) {
        setPackages(response.data.business_types);
      }
    } catch (err) {
      console.error('Error fetching tier packages:', err);
      setError('Failed to load tier packages');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getBusinessTypeIcon = (businessType) => {
    const icons = {
      'MANUFACTURER': '🏭',
      'SERVICE_PROVIDER': '🔧',
      'RETAILER': '🏪',
      'DISTRIBUTOR': '📦'
    };
    return icons[businessType] || '📋';
  };

  const getTierColor = (tier) => {
    const colors = {
      'BASIC': 'blue',
      'GOLD': 'yellow',
      'DIAMOND': 'purple',
      'PLATINUM': 'gray'
    };
    return colors[tier] || 'blue';
  };

  const getTierColorClasses = (tier) => {
    const colorClasses = {
      'BASIC': 'bg-blue-50 text-blue-700 border-blue-200',
      'GOLD': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'DIAMOND': 'bg-purple-50 text-purple-700 border-purple-200',
      'PLATINUM': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colorClasses[tier] || colorClasses['BASIC'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading {tier} tier packages...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-2">⚠️ {error}</div>
        <button 
          onClick={fetchTierPackages}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const allPackages = Object.values(packages).flatMap(businessType => 
    businessType.packages.map(pkg => ({
      ...pkg,
      business_type_display: businessType.business_type_display
    }))
  );

  if (allPackages.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-500 mb-2">No packages found for {tier} tier</div>
      </div>
    );
  }

  return (
    <div className="tier-comparison">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`px-4 py-2 rounded-lg border-2 ${getTierColorClasses(tier)}`}>
            <h2 className="text-2xl font-bold">{tier} Tier Comparison</h2>
          </div>
        </div>
        <p className="text-gray-600">
          Compare all {tier} tier packages across different business types
        </p>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {allPackages.map(pkg => (
          <div key={pkg.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{getBusinessTypeIcon(pkg.business_type)}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{pkg.business_type_display}</h3>
                <p className="text-sm text-gray-600">{pkg.name}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-semibold">{pkg.formatted_price || formatCurrency(pkg.price)}</span>
              </div>
              {pkg.features?.max_listings && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Listings:</span>
                  <span>{pkg.features.max_listings.value}</span>
                </div>
              )}
              {pkg.features?.featured_listings && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Featured Listings:</span>
                  <span>{pkg.features.featured_listings.value}</span>
                </div>
              )}
              {pkg.features?.storage_gb && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage:</span>
                  <span>{pkg.features.storage_gb.value}GB</span>
                </div>
              )}
              {pkg.features?.support_level && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Support:</span>
                  <span className="capitalize">{pkg.features.support_level.value}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => onSelectPackage && onSelectPackage(pkg)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose Plan
            </button>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Business Type</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Package Name</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Price</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Max Listings</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Featured Listings</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Storage</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Support</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody>
            {allPackages.map((pkg, index) => (
              <tr 
                key={pkg.id} 
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                }`}
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getBusinessTypeIcon(pkg.business_type)}</span>
                    <span className="font-medium text-gray-900">{pkg.business_type_display}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-gray-700">{pkg.name}</td>
                <td className="py-4 px-6">
                  <span className="font-semibold text-blue-600">
                    {pkg.formatted_price || formatCurrency(pkg.price)}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-700">
                  {pkg.features?.max_listings?.value || 'N/A'}
                </td>
                <td className="py-4 px-6 text-gray-700">
                  {pkg.features?.featured_listings?.value || 'N/A'}
                </td>
                <td className="py-4 px-6 text-gray-700">
                  {pkg.features?.storage_gb ? `${pkg.features.storage_gb.value}GB` : 'N/A'}
                </td>
                <td className="py-4 px-6 text-gray-700 capitalize">
                  {pkg.features?.support_level?.value || 'N/A'}
                </td>
                <td className="py-4 px-6">
                  <button
                    onClick={() => onSelectPackage && onSelectPackage(pkg)}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Choose Plan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Features Comparison */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          {tier} Tier Features Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allPackages.length > 0 && allPackages[0].features && 
            Object.entries(allPackages[0].features).map(([key, feature]) => (
              <div key={key} className="bg-white rounded-lg p-4 border border-blue-100">
                <h4 className="font-medium text-gray-900 mb-2">{feature.description}</h4>
                <div className="space-y-1">
                  {allPackages.map(pkg => (
                    <div key={pkg.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{pkg.business_type_display}:</span>
                      <span className="font-medium">{pkg.features?.[key]?.value || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default TierComparison;
