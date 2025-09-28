import { API_BASE_URL } from '../utils/apiConfig';
import { authStorage } from './authApi';

// Helper function to get auth headers
const getAuthHeaders = (isFormData = false) => {
  const token = authStorage.getToken();
  const headers = {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  // Don't set Content-Type for FormData, let browser set it with boundary
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      if (typeof errorData === 'object' && errorData !== null) {
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      }
    } catch {
      errorMessage = await response.text() || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
};

// Base URL for subsidiary API endpoints
const SUBSIDIARY_BASE_URL = `${API_BASE_URL}/companies/subsidiaries`;

// Get user's company subsidiaries (authenticated)
export const getMySubsidiaries = async () => {
  try {
    console.log('Fetching my company subsidiaries');
    
    const response = await fetch(`${SUBSIDIARY_BASE_URL}/`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    const data = await handleResponse(response);
    console.log('My subsidiaries API response:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching my subsidiaries:', error);
    throw error;
  }
};

// Get all public subsidiaries with optional filtering
export const getPublicSubsidiaries = async (params = {}) => {
  try {
    // Build query string from parameters
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = `${SUBSIDIARY_BASE_URL}/public/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    const data = await handleResponse(response);
    
    return data;
  } catch (error) {
    console.error('Error fetching public subsidiaries:', error);
    throw error;
  }
};

// Get subsidiary details by slug (public)
export const getSubsidiaryBySlug = async (slug) => {
  try {
    console.log('Fetching subsidiary details for slug:', slug);
    
    const response = await fetch(`${SUBSIDIARY_BASE_URL}/${slug}/public/`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    const data = await handleResponse(response);
    console.log('Subsidiary details API response:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching subsidiary details:', error);
    throw error;
  }
};

// Get subsidiary details by slug (authenticated - for management)
export const getSubsidiaryDetails = async (slug) => {
  try {
    console.log('Fetching subsidiary details for management:', slug);
    
    const response = await fetch(`${SUBSIDIARY_BASE_URL}/${slug}/`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    const data = await handleResponse(response);
    console.log('Subsidiary management details API response:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching subsidiary management details:', error);
    throw error;
  }
};

// Create new subsidiary
export const createSubsidiary = async (subsidiaryData) => {
  try {
    console.log('Creating subsidiary:', subsidiaryData);
    
    const isFormData = subsidiaryData instanceof FormData;
    
    const response = await fetch(`${SUBSIDIARY_BASE_URL}/`, {
      method: 'POST',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? subsidiaryData : JSON.stringify(subsidiaryData)
    });
    
    const data = await handleResponse(response);
    console.log('Create subsidiary API response:', data);
    
    return data;
  } catch (error) {
    console.error('Error creating subsidiary:', error);
    throw error;
  }
};

// Get subsidiary products
export const getSubsidiaryProducts = async (slug, params = {}) => {
  try {
    console.log('Fetching products for subsidiary:', slug, params);
    
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = `${SUBSIDIARY_BASE_URL}/${slug}/products/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    const data = await handleResponse(response);
    console.log('Subsidiary products API response:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching subsidiary products:', error);
    throw error;
  }
};

// Get subsidiary products by category
export const getSubsidiaryProductsByCategory = async (slug, categoryId, params = {}) => {
  try {
    console.log('Fetching products for subsidiary by category:', slug, categoryId, params);
    
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = `${SUBSIDIARY_BASE_URL}/${slug}/products/category/${categoryId}/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    const data = await handleResponse(response);
    console.log('Subsidiary category products API response:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching subsidiary category products:', error);
    throw error;
  }
};

// Update subsidiary
export const updateSubsidiary = async (slug, subsidiaryData) => {
  try {
    console.log('Updating subsidiary:', slug, subsidiaryData);
    
    const isFormData = subsidiaryData instanceof FormData;
    
    const response = await fetch(`${SUBSIDIARY_BASE_URL}/${slug}/`, {
      method: 'PUT',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? subsidiaryData : JSON.stringify(subsidiaryData)
    });
    
    const data = await handleResponse(response);
    console.log('Update subsidiary API response:', data);
    
    return data;
  } catch (error) {
    console.error('Error updating subsidiary:', error);
    throw error;
  }
};

// Delete subsidiary
export const deleteSubsidiary = async (slug) => {
  try {
    console.log('Deleting subsidiary:', slug);
    
    const response = await fetch(`${SUBSIDIARY_BASE_URL}/${slug}/`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (response.status === 204) {
      return { success: true };
    }
    
    const data = await handleResponse(response);
    console.log('Delete subsidiary API response:', data);
    
    return data;
  } catch (error) {
    console.error('Error deleting subsidiary:', error);
    throw error;
  }
};

export default {
  getMySubsidiaries,
  getPublicSubsidiaries,
  getSubsidiaryBySlug,
  getSubsidiaryDetails,
  getSubsidiaryProducts,
  getSubsidiaryProductsByCategory,
  createSubsidiary,
  updateSubsidiary,
  deleteSubsidiary
};
