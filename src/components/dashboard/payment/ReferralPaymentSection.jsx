import React, { useState, useEffect } from 'react';
import transactionApi from '../../../services/transactionApi';

const ReferralInfoSection = () => {
  const [loading, setLoading] = useState(true);
  const [referralInfo, setReferralInfo] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [referralEarnings, setReferralEarnings] = useState([]);
  const [referredUsers, setReferredUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all referral data - now FREE!
      const [infoData, statsData, earningsData, usersData] = await Promise.all([
        transactionApi.referralPaymentApi.getReferralInfo(),
        transactionApi.referralPaymentApi.getReferralStats().catch(() => null),
        transactionApi.referralPaymentApi.getReferralEarnings().catch(() => []),
        transactionApi.referralPaymentApi.getReferredUsers().catch(() => [])
      ]);

      // Normalize arrays vs paginated {results}
      const normalizedEarnings = Array.isArray(earningsData) ? earningsData : (earningsData?.results || []);
      const normalizedUsers = Array.isArray(usersData) ? usersData : (usersData?.results || []);

      setReferralInfo(infoData || null);
      setReferralStats(statsData || null);
      setReferralEarnings(normalizedEarnings);
      setReferredUsers(normalizedUsers);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      setError('Failed to load referral data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Removed payment functionality - referral codes are now FREE!

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Removed pricing calculation - referral codes are now FREE!

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading referral data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* FREE Referral Code Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Referral Code (FREE) 🎉</h3>
          <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            FREE
          </div>
        </div>

        {referralInfo?.referral_code ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Your Referral Code</p>
                  <p className="font-mono text-2xl font-bold text-green-800 mt-1">
                    {referralInfo.referral_code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600">Total Earnings</p>
                  <p className="text-xl font-bold text-green-800">
                    {formatCurrency(referralInfo.total_earnings || 0)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Earnings Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">How You Earn</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>{referralInfo.earnings_info?.percentage || referralInfo.earning_percentage + '%' || '10%'}</strong> commission when referred users purchase subscriptions</p>
                <p><strong>Minimum subscription:</strong> {referralInfo.earnings_info?.minimum_amount || formatCurrency(referralInfo.minimum_subscription_amount) || '₦1,000'}</p>
                <p><strong>Earning type:</strong> {referralInfo.earnings_info?.description || 'Subscription-based commissions'}</p>
              </div>
            </div>
            
            {/* Share Your Code */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Share Your Referral Link</h4>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={`${window.location.origin}/auth/register?ref=${referralInfo.referral_code}`}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/auth/register?ref=${referralInfo.referral_code}`);
                    setSuccess('Referral link copied to clipboard!');
                    setTimeout(() => setSuccess(''), 3000);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Get Your FREE Referral Code</h4>
            <p className="text-gray-600 mb-4">Start earning commissions when people subscribe using your referral code!</p>
            <button 
              onClick={fetchReferralData}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Get My Free Code
            </button>
          </div>
        )}
      </div>

      {/* How Referral System Works */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 How the NEW Referral System Works</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Get Your FREE Code</h4>
                <p className="text-sm text-gray-600">Every user gets a free referral code automatically - no payment required!</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Share Your Link</h4>
                <p className="text-sm text-gray-600">Share your referral link with friends and potential customers.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Earn Commissions</h4>
                <p className="text-sm text-gray-600">Get {referralInfo?.earnings_info?.percentage || referralInfo?.earning_percentage + '%' || '10%'} when they purchase subscriptions!</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">💰 Earning Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Commission Rate:</span>
                <span className="font-semibold text-green-600">{referralInfo?.earnings_info?.percentage || referralInfo?.earning_percentage + '%' || '10%'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Minimum Purchase:</span>
                <span className="font-semibold">{referralInfo?.earnings_info?.minimum_amount || formatCurrency(referralInfo?.minimum_subscription_amount) || '₦1,000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Earning Type:</span>
                <span className="font-semibold">Subscription Only</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">System Status:</span>
                <span className="font-semibold text-green-600">
                  {referralInfo?.referral_system_active ? '✅ Active' : '❌ Inactive'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg">
              <p className="text-xs text-gray-700">
                <strong>🆕 New System:</strong> Referral codes are now completely FREE! You earn commissions only when referred users purchase monthly subscriptions, not on signup.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {referralStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{referralStats.total_referrals || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(referralStats.total_earnings || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{referralStats.active_referrals || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Earnings - Subscription Based Only */}
      {referralEarnings && referralEarnings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Subscription Earnings History</h3>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>🆕 New System:</strong> You now earn commissions only when referred users purchase monthly subscriptions. No more earnings from simple signups.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referralEarnings.slice(0, 5).map((earning, index) => (
                  <tr key={earning.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(earning.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(earning.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {earning.referred_user || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {earning.earning_type === 'SUBSCRIPTION_PURCHASE' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          📊 Subscription Purchase
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          {earning.earning_type || earning.type || 'Other'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        earning.payment_status === 'PAID' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {earning.payment_status || earning.status || 'Paid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Referred Users */}
      {referredUsers && referredUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Your Referrals</h3>
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> You earn commissions only when these users purchase subscriptions, not from their initial signup.
            </p>
          </div>
          <div className="space-y-3">
            {referredUsers.slice(0, 5).map((user, index) => (
              <div key={user.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user.full_name || user.email || 'Anonymous'}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500">Joined {formatDate(user.date_joined)}</p>
                      {user.has_subscription && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          ✓ Subscribed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.subscription_status || 'No subscription'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.has_subscription ? 'Active subscriber' : 'Not subscribed yet'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralInfoSection;
