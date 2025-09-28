import React, { useState, useEffect } from 'react';
import transactionApi from '../../../services/transactionApi';

const ServiceBookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [activeView, setActiveView] = useState('all'); // 'all' or 'history'

  useEffect(() => {
    fetchBookingData();
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      
      const [allBookings, historyBookings] = await Promise.all([
        transactionApi.servicesApi.getMyBookings().catch(() => []),
        transactionApi.servicesApi.getMyBookingsHistory().catch(() => [])
      ]);

      // Handle different response formats
      const processedAllBookings = Array.isArray(allBookings) ? allBookings : (allBookings?.results || allBookings?.data || []);
      const processedHistoryBookings = Array.isArray(historyBookings) ? historyBookings : (historyBookings?.results || historyBookings?.data || []);

      setBookings(processedAllBookings);
      setBookingHistory(processedHistoryBookings);

      // If history is empty but all bookings has data, use all bookings as fallback
      if (processedHistoryBookings.length === 0 && processedAllBookings.length > 0) {
        setBookingHistory(processedAllBookings);
      }
      
    } catch (error) {
      console.error('Error fetching booking data:', error);
      showNotification('Failed to load booking history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBookingDetails = async (bookingId) => {
    try {
      const bookingDetails = await transactionApi.servicesApi.getMyBooking(bookingId);
      setSelectedBooking(bookingDetails);
      setShowBookingDetails(true);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      showNotification('Failed to load booking details', 'error');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₦0';
    return `₦${parseFloat(amount).toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-purple-100 text-purple-800 border-purple-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getServiceTypeIcon = (serviceType) => {
    if (serviceType === 'it') {
      return (
        <div className="p-2 bg-blue-100 rounded-lg">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="p-2 bg-teal-100 rounded-lg">
        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    );
  };

  const currentData = activeView === 'all' ? bookings : bookingHistory;

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
        <div className={`rounded-md p-4 ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' : 
          notification.type === 'error' ? 'bg-red-50 border border-red-200' : 
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : notification.type === 'error' ? (
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-slate-500 bg-opacity-30 rounded-full p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Service Booking History</h2>
            <p className="text-slate-200">View all your service bookings and their status</p>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setActiveView('all')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeView === 'all'
                ? 'bg-slate-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              All Bookings ({bookings.length})
            </div>
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeView === 'history'
                ? 'bg-slate-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History View ({bookingHistory.length})
            </div>
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {currentData.length > 0 ? (
        <div className="space-y-4">
          {currentData.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    {getServiceTypeIcon(booking.service_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{booking.service_title}</h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {booking.service_type.toUpperCase()} Service • Booking ID: #{booking.id}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 font-medium">Payment Status</p>
                          <p className={`font-semibold ${booking.is_paid ? 'text-green-600' : 'text-gray-600'}`}>
                            {booking.is_paid ? `Paid ${formatCurrency(booking.service_price)}` : 'Contact-based'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Booking Date</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(booking.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        {booking.paid_at ? (
                          <div>
                            <p className="text-gray-500 font-medium">Payment Date</p>
                            <p className="font-semibold text-gray-900">
                              {new Date(booking.paid_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        ) : booking.responded_at && (
                          <div>
                            <p className="text-gray-500 font-medium">Admin Response</p>
                            <p className="font-semibold text-gray-900">
                              {new Date(booking.responded_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                      </div>

                      {booking.payment_reference && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 font-medium">Payment Reference</p>
                          <p className="text-sm font-mono text-gray-900">{booking.payment_reference}</p>
                        </div>
                      )}

                      {booking.admin_response && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                          <p className="text-xs text-blue-600 font-medium mb-1">Admin Response</p>
                          <p className="text-sm text-gray-900">{booking.admin_response}</p>
                          {booking.responded_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              Responded on {new Date(booking.responded_at).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleViewBookingDetails(booking.id)}
                    className="ml-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Bookings Found</h3>
          <p className="text-gray-500">
            {activeView === 'all' 
              ? 'You haven\'t made any service bookings yet. Visit the Services section to book IT or Media services.'
              : 'No booking history available at this time.'
            }
          </p>
        </div>
      )}

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Booking Details</h3>
                <button
                  onClick={() => setShowBookingDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Service Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Service Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Service Title</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.service_title}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Service Type</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.service_type.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Booking Status</p>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Booking ID</p>
                    <p className="font-semibold text-gray-900">#{selectedBooking.id}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Payment Status</p>
                    <p className={`font-semibold ${selectedBooking.is_paid ? 'text-green-600' : 'text-gray-600'}`}>
                      {selectedBooking.is_paid ? 'Paid' : 'Contact-based Service'}
                    </p>
                  </div>
                  {selectedBooking.is_paid && (
                    <div>
                      <p className="text-gray-500 font-medium">Amount Paid</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(selectedBooking.service_price)}</p>
                    </div>
                  )}
                  {selectedBooking.payment_reference && (
                    <div className="md:col-span-2">
                      <p className="text-gray-500 font-medium">Payment Reference</p>
                      <p className="font-mono text-sm text-gray-900 bg-white p-2 rounded border">
                        {selectedBooking.payment_reference}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Service Booked</p>
                      <p className="text-gray-500">
                        {new Date(selectedBooking.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {selectedBooking.paid_at && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">Payment Completed</p>
                        <p className="text-gray-500">
                          {new Date(selectedBooking.paid_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedBooking.responded_at && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">Admin Response</p>
                        <p className="text-gray-500">
                          {new Date(selectedBooking.responded_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedBooking.status === 'completed' && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">Service Completed</p>
                        <p className="text-gray-500">Status updated to completed</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Response */}
              {selectedBooking.admin_response && (
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                  <h4 className="font-semibold text-blue-900 mb-3">Admin Response</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{selectedBooking.admin_response}</p>
                  {selectedBooking.responded_at && (
                    <p className="text-xs text-gray-500">
                      Responded on {new Date(selectedBooking.responded_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Booking Details */}
              {selectedBooking.booking_details && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Additional Details</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedBooking.booking_details}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceBookingHistory;
