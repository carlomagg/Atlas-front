import React, { useState, useEffect } from 'react';
import transactionApi from '../../../services/transactionApi';
import TierSelector from '../../common/TierSelector';

const TierBasedSubscriptionSection = () => {
  const [selectedTier, setSelectedTier] = useState('BASIC');
  const [viewMode, setViewMode] = useState('tier'); // 'tier' or 'business_type'
  const [packagesByBusinessType, setPackagesByBusinessType] = useState({});
  const [packagesByTier, setPackagesByTier] = useState({});
  const [availableTiers, setAvailableTiers] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [featureUsage, setFeatureUsage] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('wallet');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [expandedFeatures, setExpandedFeatures] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTier && viewMode === 'tier') {
      fetchTierPackages(selectedTier);
    }
  }, [selectedTier, viewMode]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const [tierData, businessTypeData, activeSubData, featureUsageData, walletData] = await Promise.all([
        transactionApi.subscriptionApi.getPackagesByTier().catch(() => ({ data: { tiers: {}, available_tiers: [] } })),
        transactionApi.subscriptionApi.getPackagesByBusinessType().catch(() => ({ data: { business_types: {} } })),
        transactionApi.subscriptionApi.getActiveSubscription().catch(() => null),
        transactionApi.subscriptionApi.getFeatureUsage().catch(() => null),
        transactionApi.walletApi.getBalance().catch(() => ({ available_balance: 0 }))
      ]);

      // Set tier data
      setPackagesByTier(tierData?.data?.tiers || {});
      setAvailableTiers(tierData?.data?.available_tiers || []);
      
      // Set business type data
      setPackagesByBusinessType(businessTypeData?.data?.business_types || {});
      
      // Set other data
      setActiveSubscription(activeSubData);
      setWallet(walletData);
      
      // Handle feature usage data structure from backend
      if (featureUsageData?.usage) {
        const formattedUsage = {
          max_listings: featureUsageData.usage.listings?.current || 0,
          featured_listings: featureUsageData.usage.featured_listings?.current || 0,
          storage_gb: featureUsageData.usage.storage?.current_gb || 0
        };
        setFeatureUsage(formattedUsage);
      }
      
      // Load initial tier packages
      if (selectedTier) {
        fetchTierPackages(selectedTier);
      }
      
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      showNotification('Failed to load subscription data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTierPackages = async (tier) => {
    try {
      const tierPackagesData = await transactionApi.subscriptionApi.getPackagesForTier(tier);
      
      if (tierPackagesData?.data?.business_types) {
        setPackagesByBusinessType(tierPackagesData.data.business_types);
      }
    } catch (error) {
      console.error('Error fetching tier packages:', error);
      showNotification(`Failed to load ${tier} tier packages`, 'error');
    }
  };

  const handleTierSelect = (tier) => {
    setSelectedTier(tier);
    setViewMode('tier');
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'business_type') {
      // Fetch all packages grouped by business type
      fetchInitialData();
    }
  };

  const handlePurchaseClick = (pkg) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      showNotification('No package selected', 'error');
      return;
    }

    console.log('Starting purchase process for package:', selectedPackage);
    console.log('Payment method:', selectedPaymentMethod);

    if (selectedPaymentMethod === 'wallet') {
      const packagePrice = parseFloat(selectedPackage.price);
      const walletBalance = parseFloat(wallet?.available_balance || 0);
      
      console.log('Wallet payment - Price:', packagePrice, 'Balance:', walletBalance);
      
      if (walletBalance < packagePrice) {
        showNotification(`Insufficient wallet balance. You need ₦${packagePrice.toLocaleString()} but have ₦${walletBalance.toLocaleString()}`, 'error');
        return;
      }
    }

    try {
      setPurchaseLoading(selectedPackage.id);
      const callbackUrl = `${window.location.origin}/dashboard/payment-platform?section=subscriptions&action=verify`;
      
      console.log('Making purchase request with:', {
        packageId: selectedPackage.id,
        paymentMethod: selectedPaymentMethod,
        callbackUrl
      });
      
      const response = await transactionApi.subscriptionApi.purchaseSubscription(
        selectedPackage.id,
        selectedPaymentMethod,
        callbackUrl
      );

      console.log('Purchase response received:', response);

      if (response && response.status === 'success') {
        if (selectedPaymentMethod === 'wallet') {
          showNotification('Subscription purchased successfully!', 'success');
          setShowPaymentModal(false);
          fetchInitialData();
        } else if (response.data && response.data.authorization_url) {
          localStorage.setItem('pending_subscription_reference', response.data.reference);
          window.location.href = response.data.authorization_url;
        } else {
          showNotification('Payment initialized but no redirect URL received', 'error');
        }
      } else {
        showNotification(response?.message || 'Purchase failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      showNotification(`Failed to purchase subscription: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Render all packages from same tier together in one row
  const renderTierPackages = () => {
    // Collect all packages from all business types for the selected tier
    const allTierPackages = [];
    Object.entries(packagesByBusinessType).forEach(([businessTypeKey, businessTypeData]) => {
      const packages = businessTypeData?.packages || [];
      packages.forEach(pkg => {
        allTierPackages.push({
          ...pkg,
          business_type_key: businessTypeKey,
          business_type_display: businessTypeData?.business_type_display || businessTypeKey
        });
      });
    });

    if (allTierPackages.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No packages available for {selectedTier} tier</p>
        </div>
      );
    }

    return (
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <h3 className="text-2xl font-bold text-gray-900">
            {selectedTier} Tier - All Business Types
          </h3>
        </div>
        
        {/* All packages laid out responsively: 1 per row on small screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTierPackages.map((pkg) => renderPackageCard(pkg, pkg.business_type_key))}
        </div>
      </div>
    );
  };

  // Render all packages from all business types together in business type mode
  const renderAllBusinessTypePackages = () => {
    // Collect all packages from all business types
    const allPackages = [];
    Object.entries(packagesByBusinessType).forEach(([businessTypeKey, businessTypeData]) => {
      const packages = businessTypeData?.packages || [];
      packages.forEach(pkg => {
        allPackages.push({
          ...pkg,
          business_type_key: businessTypeKey,
          business_type_display: businessTypeData?.business_type_display || businessTypeKey
        });
      });
    });

    if (allPackages.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No packages available</p>
        </div>
      );
    }

    return (
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <h3 className="text-2xl font-bold text-gray-900">
            All Subscription Packages
          </h3>
        </div>
        
        {/* All packages laid out responsively: 1 per row on small screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allPackages.map((pkg) => renderPackageCard(pkg, pkg.business_type_key))}
        </div>
      </div>
    );
  };

  const renderPackageCard = (pkg, businessType) => {
    const isPurchasing = purchaseLoading === pkg.id;
    const isCurrentPackage = activeSubscription?.package?.id === pkg.id;
    const isExpanded = expandedFeatures[pkg.id];
    
    const toggleFeatures = () => {
      setExpandedFeatures(prev => ({
        ...prev,
        [pkg.id]: !prev[pkg.id]
      }));
    };
    
    return (
      <div
        key={pkg.id}
        className={`relative bg-white rounded-lg shadow-md border transition-all duration-200 hover:shadow-lg ${
          isCurrentPackage 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200 hover:border-blue-300'
        } flex-1 min-w-[280px] max-w-[350px]`}
      >
        {isCurrentPackage && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
              Current Plan
            </div>
          </div>
        )}

        <div className="p-4">
          {/* Header Section */}
          <div className="text-center mb-4">
            <div className="mb-2 flex justify-center gap-2">
              {viewMode === 'tier' ? (
                <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                  {pkg.business_type_display || businessType}
                </span>
              ) : (
                <>
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                    {pkg.business_type_display || businessType}
                  </span>
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                    {pkg.tier_display || pkg.tier} Tier
                  </span>
                </>
              )}
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{pkg.name}</h4>
            <p className="text-gray-600 text-xs mb-3 line-clamp-2">
              {pkg.description || `${pkg.tier_display || pkg.tier} tier package for ${pkg.business_type_display || pkg.business_type}`}
            </p>
            <div className="mb-3">
              <div className="text-2xl font-bold text-blue-600 break-words">
                {pkg.formatted_price || formatCurrency(pkg.price)}
              </div>
              <div className="text-gray-500 text-xs">/year</div>
            </div>
            {(pkg.tier_display || pkg.tier) && (
              <div className="mb-3">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                  {pkg.tier_display || pkg.tier} Tier
                </span>
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="space-y-2 mb-4">
            {pkg.features && Object.entries(pkg.features).slice(0, isExpanded ? undefined : 3).map(([key, feature]) => {
              const value = feature?.value;
              const isUnlimited = String(value).toLowerCase() === 'unlimited' || feature?.unlimited === true;
              return (
                <div key={key} className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-2.5 h-2.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-xs leading-relaxed">{feature.description}</span>
                  </div>
                  {value !== undefined && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${isUnlimited ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {isUnlimited ? 'Unlimited' : value}
                    </span>
                  )}
                </div>
              );
            })}
            {pkg.features && Object.entries(pkg.features).length > 3 && (
              <div className="text-center">
                <button
                  onClick={toggleFeatures}
                  className="text-blue-600 text-xs font-medium hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                >
                  {isExpanded ? (
                    <>
                      Show less
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      +{Object.entries(pkg.features).length - 3} more features
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Button Section */}
          <div>
            <button
              onClick={() => handlePurchaseClick(pkg)}
              disabled={isPurchasing || isCurrentPackage}
              className={`w-full py-2.5 px-3 rounded-lg font-semibold transition-colors text-sm ${
                isCurrentPackage
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isPurchasing ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                  Processing...
                </>
              ) : isCurrentPackage ? (
                'Current Plan'
              ) : (
                'Choose Plan'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4 ${
          notification.type === 'success' ? 'border-green-500' : 
          notification.type === 'error' ? 'border-red-500' : 'border-blue-500'
        }`}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${
              notification.type === 'success' ? 'text-green-500' : 
              notification.type === 'error' ? 'text-red-500' : 'text-blue-500'
            }`}>
              {notification.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${
                notification.type === 'success' ? 'text-green-800' : 
                notification.type === 'error' ? 'text-red-800' : 'text-blue-800'
              }`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Current Subscription Status */}
      {activeSubscription && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500 bg-opacity-30 rounded-full p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Current Subscription</h3>
                  <p className="text-blue-100">{activeSubscription.package_name || activeSubscription.package?.name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-blue-200 text-sm">Status</p>
                  <p className="font-semibold">{activeSubscription.status}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Amount Paid</p>
                  <p className="font-semibold">{formatCurrency(activeSubscription.amount_paid)}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Start Date</p>
                  <p className="font-semibold">{new Date(activeSubscription.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Days Remaining</p>
                  <p className="font-semibold">{activeSubscription.days_remaining || 0} days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => handleViewModeChange('tier')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'tier' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Browse by Tier
          </button>
          <button
            onClick={() => handleViewModeChange('business_type')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'business_type' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Browse by Business Type
          </button>
        </div>
      </div>

      {/* Tier Selector (only show in tier mode) */}
      {viewMode === 'tier' && (
        <TierSelector
          selectedTier={selectedTier}
          onTierSelect={handleTierSelect}
          availableTiers={availableTiers}
        />
      )}

      {/* Package Selection Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {viewMode === 'tier' 
            ? `${selectedTier} Tier Packages` 
            : 'Choose Your Yearly Subscription Plan'
          }
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto mb-6">
          {viewMode === 'tier' 
            ? `All ${selectedTier} tier packages across different business types. Choose any package that fits your needs!`
            : 'Select from our comprehensive yearly subscription packages. All packages are now yearly billing with enhanced features and better value.'
          }
        </p>
        
        <div className="flex justify-center mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">
              🎉 Complete Flexibility: Choose any package that fits your needs, regardless of your business type!
            </p>
          </div>
        </div>
      </div>

      {/* Packages Display */}
      <div>
        {viewMode === 'tier' ? (
          renderTierPackages()
        ) : (
          renderAllBusinessTypePackages()
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Complete Purchase</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">{selectedPackage.name}</h4>
              <p className="text-2xl font-bold text-blue-600">
                {selectedPackage.formatted_price || formatCurrency(selectedPackage.price)}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                
                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={selectedPaymentMethod === 'wallet'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="text-blue-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Pay from Wallet</p>
                          <p className="text-sm text-gray-500">Available: {formatCurrency(wallet?.available_balance || 0)}</p>
                        </div>
                        <span className="text-2xl">💰</span>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paystack"
                      checked={selectedPaymentMethod === 'paystack'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="text-blue-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Pay with Card/Bank</p>
                          <p className="text-sm text-gray-500">Secure payment via Paystack</p>
                        </div>
                        <span className="text-2xl">💳</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchaseLoading === selectedPackage.id}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {purchaseLoading === selectedPackage.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  'Complete Purchase'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TierBasedSubscriptionSection;
