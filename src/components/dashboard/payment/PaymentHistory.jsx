import React, { useState, useEffect } from 'react';
import transactionApi from '../../../services/transactionApi';

const PaymentHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [filter, searchTerm, currentPage]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        ordering: '-created_at',
        page: currentPage
      };

      if (filter !== 'all') {
        params.search = filter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const [transactionsData, summaryData] = await Promise.all([
        transactionApi.walletApi.getTransactions(params),
        transactionApi.walletApi.getSummary()
      ]);

      // Handle both array and paginated response formats
      const transactions = Array.isArray(transactionsData) ? transactionsData : (transactionsData.results || []);
      const totalCount = transactionsData.count || transactions.length;
      
      setTransactions(transactions);
      setTotalPages(Math.ceil(totalCount / 20) || 1);
      setSummary(summaryData);
      console.log('Transactions data:', transactionsData); // Debug log
      console.log('Summary data:', summaryData); // Debug log
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showNotification('Failed to load transaction history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getTransactionIcon = (type) => {
    const icons = {
      deposit: '💰',
      withdrawal: '💸',
      subscription: '📦',
      referral_earning: '🎯',
      payment: '💳',
      it_service_payment: '💻',
      media_service_payment: '🎬',
      referral_payment: '🔗',
      daily_booster: '⚡'
    };
    return icons[type] || '📄';
  };

  const getTransactionColor = (type) => {
    const positiveTypes = ['deposit', 'referral_earning'];
    return positiveTypes.includes(type) ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionBgColor = (type) => {
    const positiveTypes = ['deposit', 'referral_earning'];
    return positiveTypes.includes(type) ? 'bg-green-50' : 'bg-red-50';
  };

  const filterOptions = [
    { value: 'all', label: 'All Transactions', icon: '📄' },
    { value: 'deposit', label: 'Deposits', icon: '💰' },
    { value: 'subscription', label: 'Subscriptions', icon: '📦' },
    { value: 'payment', label: 'Payments', icon: '💳' },
    { value: 'referral', label: 'Referrals', icon: '🎯' },
    { value: 'service', label: 'Services', icon: '🛠️' }
  ];

  if (loading && transactions.length === 0) {
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
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary.transaction_count || 0}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Deposits</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(summary.total_deposits || 0)}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Payments</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(summary.total_payments || 0)}
                </p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Withdrawals</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(summary.total_withdrawals || 0)}
                </p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <span className="text-2xl font-bold text-orange-600">₦</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setFilter(option.value);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <button
              onClick={fetchTransactions}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading transactions...</p>
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`rounded-full p-3 flex-shrink-0 ${getTransactionBgColor(transaction.transaction_type)}`}>
                      <span className="text-xl">{getTransactionIcon(transaction.transaction_type)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{transaction.description}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 mt-1">
                        <span className="truncate">{new Date(transaction.created_at).toLocaleString()}</span>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded text-xs inline-block ${
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                          <span className="capitalize bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {transaction.transaction_type.replace('_', ' ')}
                          </span>
                          {transaction.paystack_reference && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded truncate max-w-24">
                              Ref: {transaction.paystack_reference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-lg ${getTransactionColor(transaction.transaction_type)}`}>
                      {parseFloat(transaction.amount) > 0 ? '+' : ''}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <p className="text-sm text-gray-500">
                      Balance: {formatCurrency(transaction.balance_after)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500">No transactions found</p>
              <p className="text-gray-400 text-sm mt-1">
                {filter !== 'all' ? `No ${filter} transactions found` : 'Start making transactions to see them here'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
