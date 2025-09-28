import React, { useState, useEffect } from 'react';
import transactionApi from '../../../services/transactionApi';

const WithdrawalSection = () => {
  const [wallet, setWallet] = useState(null);
  const [banks, setBanks] = useState([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  
  // Form states
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verifiedAccountName, setVerifiedAccountName] = useState('');
  const [isAccountVerified, setIsAccountVerified] = useState(false);
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
      const [walletData, banksData, historyData] = await Promise.all([
        transactionApi.walletApi.getBalance(),
        transactionApi.walletApi.getBanks(),
        transactionApi.walletApi.getWithdrawalHistory()
      ]);

      setWallet(walletData);
      setBanks(banksData.data?.banks || []);
      setWithdrawalHistory(historyData.data?.withdrawals || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyAccount = async () => {
    if (!accountNumber || !selectedBank) {
      showNotification('Please enter account number and select a bank', 'error');
      return;
    }

    try {
      setVerifyingAccount(true);
      const response = await transactionApi.walletApi.verifyAccount(accountNumber, selectedBank);
      
      if (response.status === 'success') {
        setVerifiedAccountName(response.data.account_name);
        setAccountName(response.data.account_name);
        setIsAccountVerified(true);
      }
    } catch (error) {
      console.error('Account verification error:', error);
      showNotification('Failed to verify account. Please check your details.', 'error');
      setIsAccountVerified(false);
    } finally {
      setVerifyingAccount(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!amount || !selectedBank || !accountNumber || !accountName) {
      showNotification('Please fill all required fields', 'error');
      return;
    }

    if (parseFloat(amount) <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }

    if (parseFloat(amount) > parseFloat(wallet?.available_balance || 0)) {
      showNotification('Insufficient balance', 'error');
      return;
    }

    if (!isAccountVerified) {
      showNotification('Please verify your account details first', 'error');
      return;
    }

    try {
      setWithdrawalLoading(true);
      const response = await transactionApi.walletApi.withdraw(
        amount,
        selectedBank,
        accountNumber,
        accountName
      );

      if (response.status === 'success') {
        showNotification('Withdrawal request submitted successfully!', 'success');
        // Reset form
        setAmount('');
        setSelectedBank('');
        setAccountNumber('');
        setAccountName('');
        setVerifiedAccountName('');
        setIsAccountVerified(false);
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      showNotification('Failed to process withdrawal. Please try again.', 'error');
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Reset verification when account details change
  useEffect(() => {
    setIsAccountVerified(false);
    setVerifiedAccountName('');
  }, [accountNumber, selectedBank]);

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
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100 text-sm font-medium">Available for Withdrawal</p>
            <p className="text-3xl font-bold mt-2">
              {formatCurrency(wallet?.available_balance || 0)}
            </p>
            <p className="text-red-200 text-sm mt-1">
              Total Withdrawals: {formatCurrency(wallet?.total_withdrawals || 0)}
            </p>
          </div>
          <div className="bg-red-500 bg-opacity-30 rounded-full p-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-100 rounded-full p-2">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Withdraw Funds</h3>
            <p className="text-gray-600">Transfer money from your wallet to your bank account</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₦</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="block w-full pl-8 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
                min="100"
                max={wallet?.available_balance || 0}
                step="100"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm">NGN</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Available: {formatCurrency(wallet?.available_balance || 0)}
            </p>
          </div>

          {/* Bank Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Bank
            </label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="block w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Choose your bank</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter your account number"
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                maxLength="10"
              />
              <button
                onClick={verifyAccount}
                disabled={verifyingAccount || !accountNumber || !selectedBank}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {verifyingAccount ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                Verify
              </button>
            </div>
          </div>

          {/* Account Name Display */}
          {isAccountVerified && verifiedAccountName && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-green-900">Account Verified</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Account Name: <strong>{verifiedAccountName}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Withdrawal Button */}
          <button
            onClick={handleWithdrawal}
            disabled={withdrawalLoading || !amount || !isAccountVerified || parseFloat(amount) > parseFloat(wallet?.available_balance || 0)}
            className="w-full bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-semibold transition-colors"
          >
            {withdrawalLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing Withdrawal...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
                Withdraw {amount ? formatCurrency(amount) : 'Funds'}
              </>
            )}
          </button>

          {/* Security Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-900">Important Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Withdrawals are processed within 24 hours. Ensure your account details are correct before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Withdrawal History</h3>
          <button
            onClick={fetchData}
            className="text-red-600 hover:text-red-700 text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="space-y-3">
          {withdrawalHistory.length > 0 ? (
            withdrawalHistory.map((withdrawal) => (
              <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 rounded-full p-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{withdrawal.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(withdrawal.created_at).toLocaleString()}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        withdrawal.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : withdrawal.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {withdrawal.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-red-600">
                    -{formatCurrency(withdrawal.amount)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Balance: {formatCurrency(withdrawal.balance_after)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
              <p className="text-gray-500">No withdrawals found</p>
              <p className="text-gray-400 text-sm mt-1">Your withdrawal history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawalSection;
