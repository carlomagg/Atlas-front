import React, { useState, useEffect } from 'react';
import transactionApi from '../../../services/transactionApi';

const SubscriptionSection = () => {
  const [packages, setPackages] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('wallet');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showSubscriptionHistory, setShowSubscriptionHistory] = useState(false);

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
      const [packagesData, activeSubData, userSubsData, walletData] = await Promise.all([
        transactionApi.subscriptionApi.getPackages(),
        transactionApi.subscriptionApi.getActiveSubscription().catch(() => null),
        transactionApi.subscriptionApi.getUserSubscriptions().catch(() => ({ results: [] })),
        transactionApi.walletApi.getBalance()
      ]);

      // Handle both array and paginated response formats
      const packagesArray = Array.isArray(packagesData) ? packagesData : (packagesData.results || []);
      const subscriptionsArray = Array.isArray(userSubsData) ? userSubsData : (userSubsData.results || []);

      setPackages(packagesArray);
      setActiveSubscription(activeSubData);
      setUserSubscriptions(subscriptionsArray);
      setWallet(walletData);
      
      console.log('Packages:', packagesArray);
      console.log('Active subscription:', activeSubData);
      console.log('User subscriptions:', subscriptionsArray);
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

    // Check wallet balance for wallet payments
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
          fetchData(); // Refresh data
        } else {
          // Paystack payment - redirect to authorization URL
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

  const handleRenew = async (subscriptionId) => {
    try {
      setPurchaseLoading(`renew-${subscriptionId}`);
      const response = await transactionApi.subscriptionApi.renewSubscription(subscriptionId);
      
      if (response.status === 'success') {
        showNotification('Subscription renewed successfully!', 'success');
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Renewal error:', error);
      showNotification('Failed to renew subscription. Please try again.', 'error');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getPopularPackageId = () => {
    // Mark the third package (Platinum) as popular, or fallback to middle package
    if (packages.length >= 3) {
      return packages[2].id; // Third package (index 2)
    } else if (packages.length >= 2) {
      return packages[1].id; // Fallback to second package
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              ) : notification.type === 'error' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

      {/* Subscription Management Dashboard */}
      {activeSubscription ? (
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
                  <p className="text-blue-100">{activeSubscription.package_name || activeSubscription.package?.name || 'Subscription'}</p>
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
                  <p className="font-semibold">{activeSubscription.days_remaining || getDaysRemaining(activeSubscription.end_date)} days</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => handleRenew(activeSubscription.id)}
                disabled={purchaseLoading === `renew-${activeSubscription.id}`}
                className="bg-white text-blue-700 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {purchaseLoading === `renew-${activeSubscription.id}` ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Renew Subscription
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 rounded-xl p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-gray-200 rounded-full p-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
              <p className="text-gray-600">Choose a subscription plan below to get started with premium features.</p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Packages */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Select the perfect subscription package for your business needs. All plans include our core features with varying limits and benefits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isPopular = pkg.id === getPopularPackageId();
            const isPurchasing = purchaseLoading === pkg.id;
            
            return (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                  isPopular 
                    ? 'border-blue-500 transform scale-105' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className={`${isPopular ? 'pt-6' : 'pt-6'} px-6 pb-6 sm:px-8 sm:pb-8`}>
                  {/* Package Header */}
                  <div className={`text-center mb-6 ${isPopular ? 'mt-6' : ''}`}>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl sm:text-4xl font-bold text-blue-600">{formatCurrency(pkg.price)}</span>
                      <span className="text-gray-500 text-sm sm:text-base">/{pkg.duration_days} days</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6 sm:mb-8">
                    {pkg.features && Object.entries(pkg.features).map(([key, feature]) => (
                      <div key={key} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700 text-sm">{feature.description}</span>
                      </div>
                    ))}
                  </div>

                  {/* Purchase Button */}
                  <button
                    onClick={() => handlePurchaseClick(pkg)}
                    disabled={isPurchasing}
                    className={`w-full py-3 px-4 sm:px-6 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                      isPopular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {isPurchasing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-current"></div>
                        <span className="hidden sm:inline">Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Choose Plan
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Method Modal */}
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
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedPackage.price)}</p>
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
                  <>
                    Complete Purchase
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription History */}
      {showSubscriptionHistory && userSubscriptions.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Subscription History</h3>
            <button
              onClick={() => setShowSubscriptionHistory(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            {userSubscriptions.map((subscription) => (
              <div key={subscription.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{subscription.package_name || subscription.package?.name || 'Subscription'}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      subscription.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : subscription.status === 'EXPIRED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {subscription.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="text-gray-500">Start Date</p>
                      <p className="font-medium">{new Date(subscription.start_date || subscription.created_at).toLocaleDateString()}</p>
                    </div>
                    {subscription.end_date && (
                      <div>
                        <p className="text-gray-500">End Date</p>
                        <p className="font-medium">{new Date(subscription.end_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500">Payment Reference</p>
                      <p className="font-medium text-xs">{subscription.payment_reference || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-xl text-gray-900">
                    {formatCurrency(subscription.amount_paid)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {subscription.status === 'EXPIRED' && (
                      <button
                        onClick={() => handlePurchaseClick(subscription.package)}
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200"
                      >
                        Resubscribe
                      </button>
                    )}
                    {subscription.status === 'ACTIVE' && subscription.id && (
                      <button
                        onClick={() => handleRenew(subscription.id)}
                        disabled={purchaseLoading === `renew-${subscription.id}`}
                        className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 disabled:opacity-50"
                      >
                        {purchaseLoading === `renew-${subscription.id}` ? 'Renewing...' : 'Renew'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {userSubscriptions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No subscription history found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionSection;
