import React, { useState, useEffect } from 'react';
import transactionApi from '../../../services/transactionApi';

const ServicesSection = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('it');
  const [itServices, setItServices] = useState([]);
  const [mediaServices, setMediaServices] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    fullName: '',
    email: '',
    atlasId: '',
    message: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [processingBooking, setProcessingBooking] = useState(false);

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
      const [itServicesData, mediaServicesData, bookingsData, walletData] = await Promise.all([
        transactionApi.servicesApi.getITServices().catch(() => []),
        transactionApi.servicesApi.getMediaServices().catch(() => []),
        transactionApi.servicesApi.getMyBookings().catch(() => []),
        transactionApi.servicesApi.getWalletBalance().catch(() => ({ balance: '0.00' }))
      ]);

      setItServices(Array.isArray(itServicesData) ? itServicesData : []);
      setMediaServices(Array.isArray(mediaServicesData) ? mediaServicesData : []);
      setMyBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setWalletBalance(walletData);

      console.log('IT Services:', itServicesData);
      console.log('Media Services:', mediaServicesData);
      console.log('My Bookings:', bookingsData);
      console.log('Wallet Balance:', walletData);
    } catch (error) {
      console.error('Error fetching services data:', error);
      showNotification('Failed to load services data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₦0';
    return `₦${parseFloat(amount).toLocaleString()}`;
  };

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a relative Cloudinary path, add the base URL
    if (imagePath.startsWith('image/upload/')) {
      return `https://res.cloudinary.com/atlas-wd/${imagePath}`;
    }
    
    // For other relative paths, assume it's a Cloudinary path
    return `https://res.cloudinary.com/atlas-wd/image/upload/${imagePath}`;
  };

  const handleBookService = (service, serviceType) => {
    setSelectedService({ ...service, serviceType });
    if (service.has_price) {
      setShowPaymentModal(true);
    } else {
      setShowBookingModal(true);
    }
  };

  const handlePayment = async () => {
    if (!selectedService) return;

    try {
      setProcessingPayment(true);
      const response = await transactionApi.servicesApi.payForService(
        selectedService.serviceType,
        selectedService.id
      );

      if (response.success) {
        showNotification(`Payment successful! ${response.message}`, 'success');
        setShowPaymentModal(false);
        setSelectedService(null);
        fetchData(); // Refresh data
      } else {
        showNotification(response.message || 'Payment failed', 'error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showNotification('Payment failed. Please try again.', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService) return;

    // Validation
    if (!bookingForm.fullName || !bookingForm.message) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    if (!bookingForm.email && !bookingForm.atlasId) {
      showNotification('Please provide either email or Atlas ID', 'error');
      return;
    }

    try {
      setProcessingBooking(true);
      const response = await transactionApi.servicesApi.bookService(
        selectedService.serviceType,
        selectedService.id,
        bookingForm.fullName,
        bookingForm.email,
        bookingForm.atlasId,
        bookingForm.message
      );

      if (response.success) {
        showNotification(response.message, 'success');
        setShowBookingModal(false);
        setSelectedService(null);
        setBookingForm({ fullName: '', email: '', atlasId: '', message: '' });
        fetchData(); // Refresh bookings
      } else {
        const errorMessages = Object.values(response.errors || {}).flat().join(', ');
        showNotification(errorMessages || 'Booking failed', 'error');
      }
    } catch (error) {
      console.error('Booking error:', error);
      showNotification('Booking failed. Please try again.', 'error');
    } finally {
      setProcessingBooking(false);
    }
  };

  const getServiceIcon = (serviceType) => {
    if (serviceType === 'it') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentServices = activeTab === 'it' ? itServices : mediaServices;

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

      {/* My Bookings Section */}
      {myBookings.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 bg-opacity-30 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">My Service Bookings</h3>
                <p className="text-blue-100">{myBookings.length} booking{myBookings.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            <button
              onClick={() => onNavigate && onNavigate('service-history')}
              className="bg-blue-500 bg-opacity-30 hover:bg-opacity-50 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              View All History
            </button>
          </div>
          
          <div className="space-y-3">
            {myBookings.slice(0, 3).map((booking) => (
              <div key={booking.id} className="bg-blue-500 bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{booking.service_title}</h4>
                    <p className="text-blue-200 text-sm">
                      {booking.service_type.toUpperCase()} Service
                      {booking.is_paid && ` • ${formatCurrency(booking.service_price)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(booking.status)}
                    <p className="text-blue-200 text-sm mt-1">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {myBookings.length > 3 && (
              <div className="text-center pt-2">
                <p className="text-blue-200 text-sm">
                  And {myBookings.length - 3} more booking{myBookings.length - 3 !== 1 ? 's' : ''}...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Service Categories */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Professional Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get professional IT and Media services from our expert team. Choose from fixed-price services or contact us for custom solutions.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab('it')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'it'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                IT Services
              </div>
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'media'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Media Services
              </div>
            </button>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentServices.map((service) => (
            <div key={service.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
              {service.image && (
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img 
                    src={getFullImageUrl(service.image)} 
                    alt={service.title}
                    className="w-full h-full object-cover"
                    onLoad={() => {
                      console.log('Image loaded successfully:', getFullImageUrl(service.image));
                    }}
                    onError={(e) => {
                      console.log('Image failed to load:', getFullImageUrl(service.image));
                      console.log('Original image path:', service.image);
                    }}
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${activeTab === 'it' ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'}`}>
                    {getServiceIcon(activeTab)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-3">{service.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    {service.has_price ? (
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(service.price)}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Contact for pricing</div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleBookService(service, activeTab)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      service.has_price
                        ? `${activeTab === 'it' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'} text-white`
                        : `${activeTab === 'it' ? 'border-blue-600 text-blue-600 hover:bg-blue-50' : 'border-teal-600 text-teal-600 hover:bg-teal-50'} border-2`
                    }`}
                  >
                    {service.has_price ? 'Pay Now' : 'Book Session'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {currentServices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {getServiceIcon(activeTab)}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab === 'it' ? 'IT' : 'Media'} Services Available
            </h3>
            <p className="text-gray-500">
              {activeTab === 'it' ? 'IT' : 'Media'} services will be displayed here when available.
            </p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Confirm Payment</h3>
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
              <h4 className="font-semibold text-gray-900 mb-2">{selectedService.title}</h4>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedService.price)}</p>
              <p className="text-sm text-gray-500 mt-1">{selectedService.serviceType.toUpperCase()} Service</p>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Wallet Balance:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(walletBalance?.balance || '0')}
                </span>
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
                onClick={handlePayment}
                disabled={processingPayment}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  'Pay from Wallet'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Book Service</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">{selectedService.title}</h4>
              <p className="text-sm text-gray-600">{selectedService.description}</p>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={bookingForm.fullName}
                  onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Atlas ID
                </label>
                <input
                  type="text"
                  value={bookingForm.atlasId}
                  onChange={(e) => setBookingForm({ ...bookingForm, atlasId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Provide either email or Atlas ID</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={bookingForm.message}
                  onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your requirements..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingBooking}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingBooking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Booking'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesSection;
