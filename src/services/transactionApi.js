// Transaction API Service for Invoices and Statements
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  console.log('Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.log('Error data:', errorData);
    
    // Handle different types of API errors
    if (errorData.errors) {
      // Field validation errors - handle both array and object formats
      const errorMessages = Object.entries(errorData.errors)
        .map(([field, messages]) => {
          if (Array.isArray(messages)) {
            return `${field}: ${messages.join(', ')}`;
          } else if (typeof messages === 'object') {
            return `${field}: ${JSON.stringify(messages)}`;
          } else {
            return `${field}: ${messages}`;
          }
        })
        .join('\n');
      throw new Error(`Validation errors:\n${errorMessages}`);
    } else if (Array.isArray(errorData)) {
      // Handle array of errors
      const errorMessages = errorData.map((error, index) => {
        if (typeof error === 'object') {
          return `${index}: ${JSON.stringify(error)}`;
        }
        return `${index}: ${error}`;
      }).join('\n');
      throw new Error(`Validation errors:\n${errorMessages}`);
    } else if (errorData.detail) {
      // Single error detail
      throw new Error(errorData.detail);
    } else if (errorData.message) {
      // Custom error message
      throw new Error(errorData.message);
    } else {
      // Generic error - show the full error data for debugging
      const errorText = JSON.stringify(errorData, null, 2);
      throw new Error(`HTTP error! status: ${response.status}. Response: ${errorText}`);
    }
  }
  return response.json();
};

// INVOICE ENDPOINTS
export const invoiceApi = {
  // Get all invoices
  getInvoices: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/transactions/invoices/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get sent invoices
  getSentInvoices: async () => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoices/sent/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get received invoices
  getReceivedInvoices: async () => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoices/received/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get single invoice
  getInvoice: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoices/${id}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Create invoice
  createInvoice: async (invoiceData) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoices/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(invoiceData),
    });
    
    return handleResponse(response);
  },

  // Update invoice
  updateInvoice: async (id, invoiceData) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoices/${id}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(invoiceData),
    });
    
    return handleResponse(response);
  },

  // Accept invoice
  acceptInvoice: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoices/${id}/accept/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Reject invoice
  rejectInvoice: async (id, rejectionReason) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoices/${id}/reject/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
    
    return handleResponse(response);
  },

  // Delete invoice
  deleteInvoice: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoices/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return { success: true };
  },

  // Get invoice statistics
  getStatistics: async () => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoices/statistics/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get pending actions
  getPendingActions: async () => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoices/pending_actions/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Update invoice status
  updateInvoiceStatus: async (id, statusData) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoices/${id}/update_status/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(statusData),
    });
    
    return handleResponse(response);
  },
};

// STATEMENT ENDPOINTS
export const statementApi = {
  // List all statements
  getStatements: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/transactions/statements/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Generate new statement
  generateStatement: async (statementData) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/statements/generate/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(statementData),
    });
    
    return handleResponse(response);
  },

  // View statement history
  getStatementHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/transactions/statements/view_history/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get specific statement
  getStatement: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/statements/${id}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get specific statement with detailed transaction data
  getStatementDetailedView: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/statements/${id}/detailed_view/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Update statement
  updateStatement: async (id, statementData) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/statements/${id}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(statementData),
    });
    
    return handleResponse(response);
  },

  // Partial update statement
  patchStatement: async (id, statementData) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/statements/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(statementData),
    });
    
    return handleResponse(response);
  },

  // Delete statement
  deleteStatement: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/statements/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return { success: true };
  },

  // Search statements
  searchStatements: async (query, params = {}) => {
    const searchParams = new URLSearchParams({ search: query, ...params }).toString();
    const url = `${API_BASE_URL}/api/transactions/statements/?${searchParams}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },
};

// INVOICE DOCUMENTS ENDPOINTS
export const invoiceDocumentApi = {
  // Get all invoice documents (user's documents)
  getInvoiceDocuments: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/transactions/invoice-documents/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get single invoice document
  getInvoiceDocument: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoice-documents/${id}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get received invoice documents
  getReceivedInvoiceDocuments: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/transactions/invoice-documents/received/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Upload single invoice document
  uploadInvoiceDocument: async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoice-documents/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, let browser set it
      },
      body: formData,
    });
    
    return handleResponse(response);
  },

  // Batch upload invoice documents
  batchUploadInvoiceDocuments: async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoice-documents/batch_upload/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    return handleResponse(response);
  },

  // Update invoice document
  updateInvoiceDocument: async (id, documentData) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoice-documents/${id}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(documentData),
    });
    
    return handleResponse(response);
  },

  // Update document status
  updateDocumentStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoice-documents/${id}/update_status/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    
    return handleResponse(response);
  },

  // Delete invoice document
  deleteInvoiceDocument: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/invoice-documents/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return { success: true };
  },
};

// BUSINESS SEARCH ENDPOINT
export const businessApi = {
  // Search verified businesses
  searchBusinesses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/transactions/search/businesses/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },
};

// Wallet API functions
const walletApi = {
  // Get wallet balance
  getBalance: async () => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/wallet/balance/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Deposit to wallet
  deposit: async (amount, callbackUrl) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/wallet/deposit/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        amount: parseFloat(amount),
        callback_url: callbackUrl
      }),
    });
    
    return handleResponse(response);
  },

  // Verify wallet deposit
  verifyDeposit: async (reference) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/wallet/verify_deposit/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        reference: reference
      }),
    });
    
    return handleResponse(response);
  },

  // Get transaction history
  getTransactions: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/transactions/wallet-transactions/${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching transactions from:', url);
    console.log('With params:', params);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    console.log('Transactions response status:', response.status);
    const result = await handleResponse(response);
    console.log('Transactions result:', result);
    return result;
  },

  // Get deposits only
  getDeposits: async () => {
    console.log('Fetching deposits from:', `${API_BASE_URL}/api/transactions/wallet-transactions/deposits/`);
    const response = await fetch(`${API_BASE_URL}/api/transactions/wallet-transactions/deposits/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    console.log('Deposits response status:', response.status);
    const result = await handleResponse(response);
    console.log('Deposits result:', result);
    return result;
  },

  // Get transaction summary
  getSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/wallet-transactions/summary/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Withdrawal functions
  withdraw: async (amount, bankCode, accountNumber, accountName) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/wallet/withdraw/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        amount: amount,
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName
      }),
    });
    
    return handleResponse(response);
  },

  // Get withdrawal history
  getWithdrawalHistory: async () => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/wallet/withdrawal_history/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get available banks
  getBanks: async () => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/wallet/banks/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Verify bank account
  verifyAccount: async (accountNumber, bankCode) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions/wallet/verify_account/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        account_number: accountNumber,
        bank_code: bankCode
      }),
    });
    
    return handleResponse(response);
  },
};

// Subscription API functions
const subscriptionApi = {
  // Get available subscription packages
  getPackages: async () => {
    console.log('Fetching subscription packages from:', `${API_BASE_URL}/api/transactions/subscription-packages/`);
    const response = await fetch(`${API_BASE_URL}/api/transactions/subscription-packages/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    console.log('Packages response status:', response.status);
    const result = await handleResponse(response);
    console.log('Packages result:', result);
    return result;
  },

  // Purchase subscription
  purchaseSubscription: async (packageId, paymentMethod, callbackUrl) => {
    console.log('Purchasing subscription:', { packageId, paymentMethod });
    const response = await fetch(`${API_BASE_URL}/api/transactions/payments/purchase_subscription/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        package_id: packageId,
        payment_method: paymentMethod,
        callback_url: callbackUrl
      }),
    });

    console.log('Purchase response status:', response.status);
    const result = await handleResponse(response);
    console.log('Purchase result:', result);
    return result;
  },

  // Get user subscriptions
  getUserSubscriptions: async () => {
    console.log('Fetching user subscriptions from:', `${API_BASE_URL}/api/transactions/subscriptions/`);
    const response = await fetch(`${API_BASE_URL}/api/transactions/subscriptions/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('User subscriptions response status:', response.status);
    const result = await handleResponse(response);
    console.log('User subscriptions result:', result);
    return result;
  },

  // Get active subscription
  getActiveSubscription: async () => {
    console.log('Fetching active subscription from:', `${API_BASE_URL}/api/transactions/subscriptions/active/`);
    const response = await fetch(`${API_BASE_URL}/api/transactions/subscriptions/active/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('Active subscription response status:', response.status);
    const result = await handleResponse(response);
    console.log('Active subscription result:', result);
    return result;
  },

  // Renew subscription
  renewSubscription: async (subscriptionId) => {
    console.log('Renewing subscription:', subscriptionId);
    const response = await fetch(`${API_BASE_URL}/api/transactions/subscriptions/${subscriptionId}/renew/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    console.log('Renew response status:', response.status);
    const result = await handleResponse(response);
    console.log('Renew result:', result);
    return result;
  },
};

// Daily Booster API functions
const dailyBoosterApi = {
  // Get available daily booster packages
  getPackages: async () => {
    console.log('Fetching daily booster packages from:', `${API_BASE_URL}/api/transactions/daily-booster-packages/`);
    const response = await fetch(`${API_BASE_URL}/api/transactions/daily-booster-packages/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    console.log('Daily booster packages response status:', response.status);
    const result = await handleResponse(response);
    console.log('Daily booster packages result:', result);
    return result;
  },

  // Purchase daily booster (supports both product_id and product_title)
  purchaseBooster: async (productIdentifier, packageId, paymentMethod, callbackUrl, useTitle = false) => {
    console.log('Purchasing daily booster:', { productIdentifier, packageId, paymentMethod, useTitle });
    
    const requestBody = {
      package_id: packageId,
      payment_method: paymentMethod,
      callback_url: callbackUrl
    };

    // Add either product_id or product_title based on the useTitle flag
    if (useTitle) {
      requestBody.product_title = productIdentifier;
    } else {
      requestBody.product_id = parseInt(productIdentifier);
    }

    const response = await fetch(`${API_BASE_URL}/api/transactions/daily-boosters/purchase/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody),
    });

    console.log('Daily booster purchase response status:', response.status);
    const result = await handleResponse(response);
    console.log('Daily booster purchase result:', result);
    return result;
  },

  // Get user's daily boosters
  getUserBoosters: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/transactions/daily-boosters/${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching user daily boosters from:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('User daily boosters response status:', response.status);
    const result = await handleResponse(response);
    console.log('User daily boosters result:', result);
    return result;
  },

  // Get active boosters
  getActiveBoosters: async () => {
    console.log('Fetching active daily boosters from:', `${API_BASE_URL}/api/transactions/daily-boosters/active_boosters/`);
    const response = await fetch(`${API_BASE_URL}/api/transactions/daily-boosters/active_boosters/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('Active daily boosters response status:', response.status);
    const result = await handleResponse(response);
    console.log('Active daily boosters result:', result);
    return result;
  },

  // Get user's boostable products (approved products only)
  getMyProducts: async () => {
    console.log('Fetching user boostable products from:', `${API_BASE_URL}/api/transactions/daily-boosters/my_products/`);
    const response = await fetch(`${API_BASE_URL}/api/transactions/daily-boosters/my_products/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('My products response status:', response.status);
    const result = await handleResponse(response);
    console.log('My products result:', result);
    
    // The endpoint returns { status: "success", data: [...] } format
    // Return the data array directly for consistency with other endpoints
    if (result && result.status === 'success' && result.data) {
      return { results: result.data };
    }
    
    return result;
  },

  // Verify daily booster payment (for Paystack payments)
  verifyBoosterPayment: async (reference) => {
    console.log('Verifying daily booster payment:', reference);
    const response = await fetch(`${API_BASE_URL}/api/transactions/daily-boosters/verify_payment/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        reference: reference
      }),
    });

    console.log('Daily booster verify response status:', response.status);
    const result = await handleResponse(response);
    console.log('Daily booster verify result:', result);
    return result;
  },
};

// Services API
const servicesApi = {
  // Get all services overview
  getServicesOverview: async () => {
    console.log('Fetching services overview from:', `${API_BASE_URL}/api/services/overview/`);
    const response = await fetch(`${API_BASE_URL}/api/services/overview/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Services overview response status:', response.status);
    const result = await handleResponse(response);
    console.log('Services overview result:', result);
    return result;
  },

  // Get IT services
  getITServices: async () => {
    console.log('Fetching IT services from:', `${API_BASE_URL}/api/services/it-services/`);
    const response = await fetch(`${API_BASE_URL}/api/services/it-services/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('IT services response status:', response.status);
    const result = await handleResponse(response);
    console.log('IT services result:', result);
    return result;
  },

  // Get Media services
  getMediaServices: async () => {
    console.log('Fetching Media services from:', `${API_BASE_URL}/api/services/media-services/`);
    const response = await fetch(`${API_BASE_URL}/api/services/media-services/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Media services response status:', response.status);
    const result = await handleResponse(response);
    console.log('Media services result:', result);
    return result;
  },

  // Get specific IT service
  getITService: async (id) => {
    console.log('Fetching IT service:', id);
    const response = await fetch(`${API_BASE_URL}/api/services/it-services/${id}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('IT service response status:', response.status);
    const result = await handleResponse(response);
    console.log('IT service result:', result);
    return result;
  },

  // Get specific Media service
  getMediaService: async (id) => {
    console.log('Fetching Media service:', id);
    const response = await fetch(`${API_BASE_URL}/api/services/media-services/${id}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Media service response status:', response.status);
    const result = await handleResponse(response);
    console.log('Media service result:', result);
    return result;
  },

  // Book service (contact form)
  bookService: async (serviceType, serviceId, fullName, email, atlasId, message) => {
    console.log('Booking service:', { serviceType, serviceId, fullName, email, atlasId });
    const response = await fetch(`${API_BASE_URL}/api/services/book/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_type: serviceType,
        service_id: serviceId,
        full_name: fullName,
        email: email,
        atlas_id: atlasId,
        message: message
      }),
    });

    console.log('Book service response status:', response.status);
    const result = await handleResponse(response);
    console.log('Book service result:', result);
    return result;
  },

  // Pay for service (wallet payment)
  payForService: async (serviceType, serviceId) => {
    console.log('Paying for service:', { serviceType, serviceId });
    const response = await fetch(`${API_BASE_URL}/api/services/pay/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        service_type: serviceType,
        service_id: serviceId
      }),
    });

    console.log('Pay for service response status:', response.status);
    const result = await handleResponse(response);
    console.log('Pay for service result:', result);
    return result;
  },

  // Check wallet balance for services
  getWalletBalance: async () => {
    console.log('Fetching wallet balance from:', `${API_BASE_URL}/api/services/wallet-balance/`);
    const response = await fetch(`${API_BASE_URL}/api/services/wallet-balance/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('Wallet balance response status:', response.status);
    const result = await handleResponse(response);
    console.log('Wallet balance result:', result);
    return result;
  },

  // Get user's bookings
  getMyBookings: async () => {
    console.log('Fetching user bookings from:', `${API_BASE_URL}/api/services/my-bookings/`);
    const response = await fetch(`${API_BASE_URL}/api/services/my-bookings/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('My bookings response status:', response.status);
    const result = await handleResponse(response);
    console.log('My bookings result:', result);
    return result;
  },

  // Get specific user booking
  getMyBooking: async (id) => {
    console.log('Fetching user booking:', id);
    const response = await fetch(`${API_BASE_URL}/api/services/my-bookings/${id}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('My booking response status:', response.status);
    const result = await handleResponse(response);
    console.log('My booking result:', result);
    return result;
  },

  // Get user's booking history (specific history view)
  getMyBookingsHistory: async () => {
    console.log('Fetching user booking history from:', `${API_BASE_URL}/api/services/my-bookings-history/`);
    const response = await fetch(`${API_BASE_URL}/api/services/my-bookings-history/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('My booking history response status:', response.status);
    const result = await handleResponse(response);
    console.log('My booking history result:', result);
    return result;
  },
};

// Agent Referral API functions (FREE SYSTEM)
const referralPaymentApi = {
  // Get referral info (FREE - no payment needed)
  getReferralInfo: async () => {
    console.log('Fetching referral info from:', `${API_BASE_URL}/api/auth/agents/referral-info/`);
    const response = await fetch(`${API_BASE_URL}/api/auth/agents/referral-info/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('Referral info response status:', response.status);
    const result = await handleResponse(response);
    console.log('Referral info result:', result);
    return result;
  },

  // Legacy method for backward compatibility
  getReferralPaymentStatus: async () => {
    console.log('⚠️ getReferralPaymentStatus is deprecated, using getReferralInfo instead');
    return referralPaymentApi.getReferralInfo();
  },

  // Validate referral code (for registration)
  validateReferralCode: async (referralCode) => {
    console.log('Validating referral code:', referralCode);
    const response = await fetch(`${API_BASE_URL}/api/auth/agents/validate-referral-code/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referral_code: referralCode
      }),
    });

    console.log('Referral code validation response status:', response.status);
    const result = await handleResponse(response);
    console.log('Referral code validation result:', result);
    return result;
  },

  // Get referral statistics
  getReferralStats: async () => {
    console.log('Fetching referral stats from:', `${API_BASE_URL}/api/auth/agents/referral-stats/`);
    const response = await fetch(`${API_BASE_URL}/api/auth/agents/referral-stats/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('Referral stats response status:', response.status);
    const result = await handleResponse(response);
    console.log('Referral stats result:', result);
    return result;
  },

  // Get referral earnings history (subscription-based only)
  getReferralEarnings: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/auth/agents/referral-earnings/${queryString ? `?${queryString}` : ''}`;
    console.log('Fetching referral earnings from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('Referral earnings response status:', response.status);
    const result = await handleResponse(response);
    console.log('Referral earnings result:', result);
    return result;
  },

  // Get referred users with search and filtering
  getReferredUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/auth/agents/referred-users/${queryString ? `?${queryString}` : ''}`;
    console.log('Fetching referred users from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('Referred users response status:', response.status);
    const result = await handleResponse(response);
    console.log('Referred users result:', result);
    return result;
  },
};

export default {
  invoiceApi,
  statementApi,
  invoiceDocumentApi,
  businessApi,
  walletApi,
  subscriptionApi,
  dailyBoosterApi,
  servicesApi,
  referralPaymentApi,
};
