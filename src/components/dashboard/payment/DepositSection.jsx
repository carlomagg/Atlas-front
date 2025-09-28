import React, { useState, useEffect } from 'react';
import transactionApi from '../../../services/transactionApi';

const DepositSection = () => {
  const [wallet, setWallet] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [recentDeposits, setRecentDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

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
      const [walletData, depositsData] = await Promise.all([
        transactionApi.walletApi.getBalance(),
        transactionApi.walletApi.getTransactions({ ordering: '-created_at' })
      ]);

      setWallet(walletData);
      // Handle both array and paginated response formats
      const allTransactions = Array.isArray(depositsData) ? depositsData : (depositsData.results || []);
      // Filter only deposit transactions
      const deposits = allTransactions.filter(transaction => transaction.transaction_type === 'deposit');
      setRecentDeposits(deposits);
      console.log('All transactions:', depositsData); // Debug log
      console.log('Filtered deposits:', deposits); // Debug log
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Failed to load deposit data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }

    if (parseFloat(depositAmount) < 100) {
      showNotification('Minimum deposit amount is ₦100', 'error');
      return;
    }

    try {
      setDepositLoading(true);
      const response = await transactionApi.walletApi.deposit(
        depositAmount,
        `${window.location.origin}/dashboard/payment-platform?tab=deposit&action=verify`
      );

      if (response.status === 'success') {
        // Store reference for verification
        localStorage.setItem('pending_deposit_reference', response.data.reference);
        // Redirect to Paystack
        window.location.href = response.data.authorization_url;
      }
    } catch (error) {
      console.error('Deposit error:', error);
      showNotification('Failed to initialize deposit. Please try again.', 'error');
    } finally {
      setDepositLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000];

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
      {/* Current Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Current Wallet Balance</p>
            <p className="text-3xl font-bold mt-2">
              {formatCurrency(wallet?.available_balance || 0)}
            </p>
            <p className="text-blue-200 text-sm mt-1">
              Total Deposits: {formatCurrency(wallet?.total_deposits || 0)}
            </p>
          </div>
          <div className="bg-blue-500 bg-opacity-30 rounded-full p-4">
            <span className="text-3xl font-bold text-white">₦</span>
          </div>
        </div>
      </div>

      {/* Deposit Form */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-100 rounded-full p-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Add Funds to Wallet</h3>
            <p className="text-gray-600">Securely deposit money using Paystack</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Amount Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Select Amount
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setDepositAmount(amount.toString())}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    depositAmount === amount.toString()
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="font-semibold">{formatCurrency(amount)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Enter Custom Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₦</span>
              </div>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className="block w-full pl-8 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                min="100"
                step="100"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm">NGN</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">Minimum deposit: ₦100</p>
          </div>

          {/* Deposit Button */}
          <button
            onClick={handleDeposit}
            disabled={depositLoading || !depositAmount || parseFloat(depositAmount) < 100}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-semibold transition-colors"
          >
            {depositLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Deposit {depositAmount ? formatCurrency(depositAmount) : 'Funds'}
              </>
            )}
          </button>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-900">Secure Payment</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your payment is processed securely through Paystack. We never store your card details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deposits */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Deposits</h3>
          <button
            onClick={fetchData}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="space-y-3">
          {recentDeposits.slice(0, 10).map((deposit) => (
            <div key={deposit.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 rounded-full p-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{deposit.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{new Date(deposit.created_at).toLocaleString()}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      deposit.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {deposit.status}
                    </span>
                    {deposit.paystack_reference && (
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {deposit.paystack_reference}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-green-600">
                  +{formatCurrency(deposit.amount)}
                </p>
                <p className="text-sm text-gray-500">
                  Balance: {formatCurrency(deposit.balance_after)}
                </p>
              </div>
            </div>
          ))}

          {recentDeposits.length === 0 && (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <p className="text-gray-500">No deposits found</p>
              <p className="text-gray-400 text-sm mt-1">Make your first deposit to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositSection;
