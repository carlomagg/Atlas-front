import React, { useState, useEffect } from 'react';
import transactionApi from '../../../services/transactionApi';

const DailyBoosterSection = () => {
  const [packages, setPackages] = useState([]);
  const [activeBoosters, setActiveBoosters] = useState([]);
  const [userBoosters, setUserBoosters] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('wallet');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showBoosterHistory, setShowBoosterHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [manualProductId, setManualProductId] = useState('');
  const [useManualEntry, setUseManualEntry] = useState(false);

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
      
      // Fetch data with individual error handling for better debugging
      const packagesData = await transactionApi.dailyBoosterApi.getPackages();
      const activeBoostersData = await transactionApi.dailyBoosterApi.getActiveBoosters().catch((error) => {
        console.error('Error fetching active boosters:', error);
        return { results: [] };
      });
      const userBoostersData = await transactionApi.dailyBoosterApi.getUserBoosters().catch((error) => {
        console.error('Error fetching user boosters:', error);
        return { results: [] };
      });
      
      // Try to fetch products with detailed error logging
      let myProductsData = { results: [] };
      try {
        myProductsData = await transactionApi.dailyBoosterApi.getMyProducts();
        console.log('Raw myProductsData response:', myProductsData);
      } catch (error) {
        console.error('Error fetching my products:', error);
        console.error('Error details:', error.message);
        // If the endpoint doesn't exist, show a helpful message
        if (error.message.includes('404') || error.message.includes('Not found')) {
          showNotification('Product listing endpoint not available. Please contact support.', 'warning');
        }
      }
      
      const walletData = await transactionApi.walletApi.getBalance();

      // Handle both array and paginated response formats
      const packagesArray = Array.isArray(packagesData) ? packagesData : (packagesData.results || []);
      const activeBoostersArray = Array.isArray(activeBoostersData) ? activeBoostersData : (activeBoostersData.results || []);
      const userBoostersArray = Array.isArray(userBoostersData) ? userBoostersData : (userBoostersData.results || []);
      const myProductsArray = Array.isArray(myProductsData) ? myProductsData : (myProductsData.results || []);

      setPackages(packagesArray);
      setActiveBoosters(activeBoostersArray);
      setUserBoosters(userBoostersArray);
      setMyProducts(myProductsArray);
      setWallet(walletData);
      
      console.log('Daily Booster Packages:', packagesArray);
      console.log('Active Boosters:', activeBoostersArray);
      console.log('User Boosters:', userBoostersArray);
      console.log('My Products Array:', myProductsArray);
      console.log('My Products Length:', myProductsArray.length);
      
      // Show notification if no products found
      if (myProductsArray.length === 0) {
        console.warn('No approved products found for boosting');
        showNotification('No approved products available for boosting. Make sure you have products with "APPROVED" status.', 'info');
      } else {
        console.log(`Found ${myProductsArray.length} approved products available for boosting`);
      }
    } catch (error) {
      console.error('Error fetching daily booster data:', error);
      showNotification('Failed to load daily booster data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (pkg) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !selectedProduct) {
      showNotification('Please select a product to boost', 'error');
      return;
    }

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
      const callbackUrl = `${window.location.origin}/dashboard/payment-platform?section=booster&action=verify`;
      
      // Use product title for dropdown selection
      const response = await transactionApi.dailyBoosterApi.purchaseBooster(
        selectedProduct.title,
        selectedPackage.id,
        selectedPaymentMethod,
        callbackUrl,
        true // useTitle = true
      );

      if (response.status === 'success') {
        if (selectedPaymentMethod === 'wallet') {
          showNotification('Daily booster purchased successfully!', 'success');
          setShowPaymentModal(false);
          setSelectedProduct(null);
          fetchData(); // Refresh data
        } else {
          // Paystack payment - redirect to authorization URL
          localStorage.setItem('pending_booster_reference', response.data.reference);
          window.location.href = response.data.authorization_url;
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      showNotification('Failed to purchase daily booster. Please try again.', 'error');
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

  const getHoursRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffHours = Math.max(0, diffTime / (1000 * 60 * 60));
    return diffHours;
  };

  const formatTimeRemaining = (hours) => {
    if (hours <= 0) return 'Expired';
    if (hours < 1) return `${Math.ceil(hours * 60)} minutes`;
    return `${Math.floor(hours)}h ${Math.ceil((hours % 1) * 60)}m`;
  };

  const getPopularPackageId = () => {
    // Mark the fourth package (Platinum) as popular for daily boosters
    if (packages.length >= 4) {
      return packages[3].id; // Fourth package (index 3)
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4 ${
          notification.type === 'success' ? 'border-green-500' : 
          notification.type === 'error' ? 'border-red-500' : 'border-orange-500'
        }`}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${
              notification.type === 'success' ? 'text-green-500' : 
              notification.type === 'error' ? 'text-red-500' : 'text-orange-500'
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
                notification.type === 'error' ? 'text-red-800' : 'text-orange-800'
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

      {/* Active Boosters Dashboard */}
      {activeBoosters.length > 0 ? (
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6 text-white">
          <div>
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-orange-500 bg-opacity-30 rounded-full p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Active Boosters</h3>
                  <p className="text-orange-100">{activeBoosters.length} product{activeBoosters.length !== 1 ? 's' : ''} currently boosted</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {activeBoosters.slice(0, 2).map((booster) => (
                  <div key={booster.id} className="bg-orange-500 bg-opacity-20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{booster.product_details?.title || 'Product'}</h4>
                        <p className="text-orange-200 text-sm">{booster.package_details?.name || 'Booster Package'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatTimeRemaining(booster.hours_remaining || 0)}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 rounded-xl p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-gray-200 rounded-full p-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Boosters</h3>
              <p className="text-gray-600">Boost your products below to increase visibility and get more customers.</p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Booster Packages */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Daily Booster Packages</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Boost your products for 24 hours to increase visibility, improve search rankings, and attract more customers. Choose the perfect booster for your needs.
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
                    ? 'border-orange-500 transform scale-105' 
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className={`${isPopular ? 'pt-6' : 'pt-6'} px-6 pb-6`}>
                  {/* Package Header */}
                  <div className={`text-center mb-6 ${isPopular ? 'mt-6' : ''}`}>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-bold text-orange-600">{formatCurrency(pkg.price)}</span>
                      <span className="text-gray-500 text-sm">/24hrs</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {pkg.features && Object.entries(pkg.features).map(([key, feature]) => (
                      <div key={key} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors text-sm ${
                      isPopular
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {isPurchasing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Boost Product
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
              <h3 className="text-xl font-bold text-gray-900">Boost Your Product</h3>
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
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(selectedPackage.price)}</p>
              <p className="text-sm text-gray-500 mt-1">24-hour boost duration</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Product to Boost</label>
                
                {/* Product dropdown selection */}
                {myProducts.length > 0 ? (
                  <select
                    value={selectedProduct ? selectedProduct.id : ''}
                    onChange={(e) => {
                      const productId = e.target.value;
                      const product = myProducts.find(p => p.id.toString() === productId);
                      setSelectedProduct(product || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Choose a product to boost...</option>
                    {myProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.title} {product.is_boosted ? '(Currently Boosted)' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    No approved products found. Only products with "APPROVED" status can be boosted.
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  {selectedProduct && selectedProduct.is_boosted 
                    ? '⚠️ This product already has an active booster' 
                    : 'Only your approved products can be boosted'
                  }
                </p>
              </div>

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
                      className="text-orange-600"
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
                      className="text-orange-600"
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
                disabled={purchaseLoading === selectedPackage.id || !selectedProduct || (selectedProduct && selectedProduct.is_boosted)}
                className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {purchaseLoading === selectedPackage.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Boost Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booster History */}
      {showBoosterHistory && userBoosters.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Booster History</h3>
            <button
              onClick={() => setShowBoosterHistory(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            {userBoosters.map((booster) => (
              <div key={booster.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{booster.product_details?.title || 'Product'}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      booster.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : booster.status === 'EXPIRED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booster.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="text-gray-500">Package</p>
                      <p className="font-medium">{booster.package_details?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Views</p>
                      <p className="font-medium">{booster.views_generated || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Clicks</p>
                      <p className="font-medium">{booster.clicks_generated || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Time Left</p>
                      <p className="font-medium">{formatTimeRemaining(booster.hours_remaining || 0)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-xl text-gray-900">
                    {formatCurrency(booster.amount_paid)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(booster.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {userBoosters.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p>No booster history found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyBoosterSection;
