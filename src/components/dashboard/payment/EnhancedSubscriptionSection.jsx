import React, { useState, useEffect } from 'react';
import transactionApi from '../../../services/transactionApi';

const EnhancedSubscriptionSection = () => {
  const [packagesByBusinessType, setPackagesByBusinessType] = useState({});
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [featureUsage, setFeatureUsage] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('wallet');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'all'

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [packagesData, activeSubData, featureUsageData, walletData] = await Promise.all([
        transactionApi.subscriptionApi.getPackagesByBusinessType().catch(() => ({ data: { business_types: {} } })),
        transactionApi.subscriptionApi.getActiveSubscription().catch(() => null),
        transactionApi.subscriptionApi.getFeatureUsage().catch(() => null),
        transactionApi.walletApi.getBalance().catch(() => ({ available_balance: 0 }))
      ]);

      // Handle the backend API response structure
      const businessTypes = packagesData?.data?.business_types || {};
      setPackagesByBusinessType(businessTypes);
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
      } else {
        setFeatureUsage(null);
      }
      
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      showNotification('Failed to load subscription data', 'error');
    } finally {
      setLoading(false);
    }
  };


  const handlePurchaseClick = (pkg) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    if (selectedPaymentMethod === 'wallet') {
      const packagePrice = parseFloat(selectedPackage.price);
      const walletBalance = parseFloat(wallet?.available_balance || 0);
      
      if (walletBalance < packagePrice) {
        showNotification(`Insufficient wallet balance. You need ₦${packagePrice.toLocaleString()} but have ₦${walletBalance.toLocaleString()}`, 'error');
        return;
      }
    }

    try {
      setPurchaseLoading(selectedPackage.id);
      const callbackUrl = `${window.location.origin}/dashboard/payment-platform?section=subscriptions&action=verify`;
      
      const response = await transactionApi.subscriptionApi.purchaseSubscription(
        selectedPackage.id,
        selectedPaymentMethod,
        callbackUrl
      );

      if (response.status === 'success') {
        if (selectedPaymentMethod === 'wallet') {
          showNotification('Subscription purchased successfully!', 'success');
          setShowPaymentModal(false);
          fetchData();
        } else {
          localStorage.setItem('pending_subscription_reference', response.data.reference);
          window.location.href = response.data.authorization_url;
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      showNotification('Failed to purchase subscription. Please try again.', 'error');
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

  const getFeatureUsagePercentage = (featureName) => {
    if (!featureUsage || !activeSubscription) return 0;
    
    const usage = featureUsage[featureName] || 0;
    const limit = activeSubscription.package?.features?.[featureName]?.value || 0;
    
    if (limit === 0) return 0;
    return Math.min((usage / limit) * 100, 100);
  };

  // Mock feature usage for demonstration when backend doesn't exist
  const getMockFeatureUsage = (featureName) => {
    const mockUsage = {
      max_listings: Math.floor(Math.random() * 50),
      featured_listings: Math.floor(Math.random() * 10),
      storage_gb: Math.floor(Math.random() * 5)
    };
    return mockUsage[featureName] || 0;
  };

  const renderBusinessTypePackages = (businessTypeKey, businessTypeData) => {
    const businessTypeIcons = {
      'MANUFACTURER': '🏭',
      'SERVICE_PROVIDER': '🔧',
      'RETAILER': '🏪',
      'DISTRIBUTOR': '📦'
    };

    const packages = businessTypeData?.packages || [];
    const displayName = businessTypeData?.business_type_display || businessTypeKey;

    if (packages.length === 0) return null;

    return (
      <div key={businessTypeKey} className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{businessTypeIcons[businessTypeKey] || '📋'}</span>
          <h3 className="text-2xl font-bold text-gray-900">
            {displayName} Packages
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => renderPackageCard(pkg, businessTypeKey))}
        </div>
      </div>
    );
  };

  const renderPackageCard = (pkg, businessType) => {
    const isPurchasing = purchaseLoading === pkg.id;
    const isCurrentPackage = activeSubscription?.package?.id === pkg.id;
    
    return (
      <div
        key={pkg.id}
        className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
          isCurrentPackage 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        {isCurrentPackage && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
              Current Plan
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="text-center mb-6">
            <h4 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h4>
            <p className="text-gray-600 text-sm mb-4">{pkg.description || `${pkg.tier_display || pkg.tier} tier package for ${pkg.business_type_display || pkg.business_type}`}</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold text-blue-600">
                {pkg.formatted_price || formatCurrency(pkg.price)}
              </span>
            </div>
            {(pkg.tier_display || pkg.tier) && (
              <div className="mt-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {pkg.tier_display || pkg.tier} Tier
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3 mb-6">
            {pkg.features && Object.entries(pkg.features).map(([key, feature]) => {
              const value = feature?.value;
              const isUnlimited = String(value).toLowerCase() === 'unlimited' || feature?.unlimited === true;
              return (
                <div key={key} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm">{feature.description}</span>
                  </div>
                  {value !== undefined && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${isUnlimited ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {isUnlimited ? 'Unlimited' : value}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => handlePurchaseClick(pkg)}
            disabled={isPurchasing || isCurrentPackage}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors text-sm ${
              isCurrentPackage
                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {isPurchasing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
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

      {/* Feature Usage Dashboard - Show only if we have feature data */}
      {activeSubscription && activeSubscription.package?.features && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(activeSubscription.package.features).map(([featureName, feature]) => {
              // Use actual feature usage if available, otherwise use mock data for demo
              const usage = featureUsage ? (featureUsage[featureName] || 0) : getMockFeatureUsage(featureName);
              const limit = parseInt(feature.value) || 0;
              const percentage = limit > 0 ? Math.min((usage / limit) * 100, 100) : 0;
              
              return (
                <div key={featureName} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{feature.description}</h4>
                    <span className="text-sm text-gray-600">{usage}/{limit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        percentage >= 90 ? 'bg-red-500' : 
                        percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  {!featureUsage && (
                    <p className="text-xs text-gray-500 mt-1">Demo data - actual usage tracking requires backend integration</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Package Selection Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Yearly Subscription Plan
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto mb-6">
          Select from our comprehensive yearly subscription packages. All packages are now yearly billing with enhanced features and better value. 
          You can choose ANY package regardless of your business type.
        </p>
        
        <div className="flex justify-center mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">
              🎉 Complete Flexibility: Choose any package that fits your needs, regardless of your business type!
            </p>
          </div>
        </div>
      </div>

      {/* Packages by Business Type */}
      <div>
        {Object.entries(packagesByBusinessType).map(([businessTypeKey, businessTypeData]) => 
          renderBusinessTypePackages(businessTypeKey, businessTypeData)
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
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedPackage.price)}/year</p>
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

export default EnhancedSubscriptionSection;
