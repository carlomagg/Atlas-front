import React, { useState, useEffect } from 'react';
import transactionApi from '../../../services/transactionApi';

const WalletSection = ({ onNavigate }) => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletData, transactionsData, summaryData] = await Promise.all([
        transactionApi.walletApi.getBalance(),
        transactionApi.walletApi.getTransactions({ ordering: '-created_at' }),
        transactionApi.walletApi.getSummary()
      ]);

      setWallet(walletData);
      // Handle both array and paginated response formats
      const transactions = Array.isArray(transactionsData) ? transactionsData : (transactionsData.results || []);
      setTransactions(transactions);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
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
      referral_payment: '🔗'
    };
    return icons[type] || '📄';
  };

  const getTransactionColor = (type) => {
    return type === 'deposit' || type === 'referral_earning' ? 'text-green-600' : 'text-red-600';
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
      {/* Wallet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Available Balance</p>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(wallet?.available_balance || 0)}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <span className="text-2xl font-bold text-blue-600">₦</span>
            </div>
          </div>
        </div>

        {/* Total Deposits */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Deposits</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(wallet?.total_deposits || 0)}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Withdrawals */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Withdrawals</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(wallet?.total_withdrawals || 0)}
              </p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate && onNavigate('deposit')}
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
          >
            <div className="bg-green-100 rounded-full p-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-green-900">Add Funds</p>
              <p className="text-sm text-green-700">Deposit to wallet</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('withdrawal')}
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left"
          >
            <div className="bg-red-100 rounded-full p-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-red-900">Withdraw Funds</p>
              <p className="text-sm text-red-700">Transfer to bank</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('history')}
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <div className="bg-blue-100 rounded-full p-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-blue-900">View History</p>
              <p className="text-sm text-blue-700">All transactions</p>
            </div>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transaction History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Transactions</span>
                    <span className="font-semibold">{summary.transaction_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Deposits</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(summary.total_deposits || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Payments</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(summary.total_payments || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Withdrawals</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(summary.total_withdrawals || 0)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Recent Activity</h4>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getTransactionIcon(transaction.transaction_type)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold ${getTransactionColor(transaction.transaction_type)}`}>
                        {parseFloat(transaction.amount) > 0 ? '+' : ''}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-gray-900">Transaction History</h4>
                <button
                  onClick={fetchWalletData}
                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              
              <div className="overflow-hidden">
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="bg-white rounded-full p-2">
                          <span className="text-xl">{getTransactionIcon(transaction.transaction_type)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{new Date(transaction.created_at).toLocaleString()}</span>
                            <span className="capitalize">{transaction.status}</span>
                            {transaction.paystack_reference && (
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                {transaction.paystack_reference}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${getTransactionColor(transaction.transaction_type)}`}>
                          {parseFloat(transaction.amount) > 0 ? '+' : ''}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        <p className="text-sm text-gray-500">
                          Balance: {formatCurrency(transaction.balance_after)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {transactions.length === 0 && (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500">No transactions found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletSection;
