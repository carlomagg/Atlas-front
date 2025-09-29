const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Submit a contact form (Public endpoint)
 * @param {Object} contactData - The contact form data
 * @param {Array} contactData.business_purposes - Array of business purposes
 * @param {string} contactData.full_name - Full name
 * @param {string} contactData.company_name - Company name
 * @param {string} contactData.email_address - Email address
 * @param {string} contactData.country_region - Country/Region
 * @param {string} contactData.comments - Comments
 * @returns {Promise} API response
 */
export const submitContactForm = async (contactData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/contact/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting contact form:', error);
    throw error;
  }
};

/**
 * Get contact form submissions (Admin only)
 * @param {string} status - Filter by status (pending, in_progress, completed)
 * @param {string} token - Admin authentication token
 * @returns {Promise} API response
 */
export const getContactSubmissions = async (status = 'pending', token) => {
  try {
    const url = new URL(`${API_BASE_URL}/admin/contact/submissions/`);
    if (status) {
      url.searchParams.append('status', status);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    throw error;
  }
};

/**
 * Update contact submission status and add admin response (Admin only)
 * @param {number} submissionId - The submission ID
 * @param {Object} updateData - Update data
 * @param {string} updateData.status - New status (pending, in_progress, completed)
 * @param {string} updateData.admin_response - Admin response message
 * @param {string} token - Admin authentication token
 * @returns {Promise} API response
 */
export const updateContactSubmission = async (submissionId, updateData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/contact/submissions/${submissionId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating contact submission:', error);
    throw error;
  }
};

// Business purpose options that match the API format
export const BUSINESS_PURPOSE_OPTIONS = {
  'buy_finished': 'Buy finished products or stock products, no customization requirements',
  'buy_custom': 'Buy custom products (e.g. OEM, ODM)',
  'represent_brands': 'Represent national products/brands',
  'find_agent': 'Find a purchasing agent in Atlas-WD',
  'new_business': 'New businesses looking for product solutions',
  'others': 'Others'
};

// Helper function to convert display text to API format
export const getBusinessPurposeKeys = (selectedOptions) => {
  const keyMap = Object.entries(BUSINESS_PURPOSE_OPTIONS).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {});
  
  return selectedOptions.map(option => keyMap[option]).filter(Boolean);
};

// Helper function to convert API format to display text
export const getBusinessPurposeDisplayText = (keys) => {
  return keys.map(key => BUSINESS_PURPOSE_OPTIONS[key]).filter(Boolean);
};

/**
 * Subscribe to newsletter (Public endpoint)
 * @param {string} email - Email address to subscribe
 * @returns {Promise} API response
 */
export const subscribeToNewsletter = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/subscribe/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    throw error;
  }
};

/**
 * Unsubscribe from newsletter (Public endpoint)
 * @param {string} email - Email address to unsubscribe
 * @returns {Promise} API response
 */
export const unsubscribeFromNewsletter = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/unsubscribe/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    throw error;
  }
};
