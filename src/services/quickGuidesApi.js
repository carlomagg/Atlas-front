// Quick Guides API Service for fetching published guides for new users
// Uses public endpoints that don't require authentication

import { API_BASE_URL } from '../utils/apiConfig';

const BASE_URL = `${API_BASE_URL}/quick-guides`;

// Public API request (NO authentication - completely public)
const publicApiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  // Create completely clean request with NO authentication headers
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    // Explicitly NO credentials, NO authorization headers
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let text = '';
      try { 
        text = await response.text(); 
      } catch {}
      
      let data = {};
      try { 
        data = text ? JSON.parse(text) : {}; 
      } catch {}
      
      const err = new Error(data?.detail || data?.message || text || `HTTP ${response.status}: ${response.statusText}`);
      err.status = response.status;
      err.data = data;
      throw err;
    }
    
    if (response.status === 204) return null;
    return response.json();
  } catch (error) {
    console.error('Quick Guides Public API Error:', error);
    throw error;
  }
};

// Authenticated API request (requires authentication) - uses admin portal route
const authApiRequest = async (endpoint, options = {}) => {
  const adminUrl = `${API_BASE_URL}/admin-portal/quick-guides${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  try {
    const res = await fetch(adminUrl, config);
    
    if (!res.ok) {
      let text = '';
      try { 
        text = await res.text(); 
      } catch {}
      
      let data = {};
      try { 
        data = text ? JSON.parse(text) : {}; 
      } catch {}
      
      const err = new Error(data?.detail || data?.message || text || `${res.status} ${res.statusText}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    
    if (res.status === 204) return null;
    return res.json();
  } catch (error) {
    console.error('Quick Guides Authenticated API Error:', error);
    throw error;
  }
};

// PUBLIC ENDPOINTS (No Authentication Required)

/**
 * List Published Quick Guides
 * GET /api/quick-guides/public/
 * Query Parameters:
 * - guide_type: Filter by guide type (getting_started, account_setup, etc.)
 * - is_featured: Filter by featured (true/false)
 * - is_beginner_friendly: Filter by beginner friendly (true/false)
 * - search: Search in title, description, tags
 * - ordering: Sort by fields (title, guide_type, order, created_at, view_count)
 */
export const listPublishedQuickGuides = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return publicApiRequest(`/public/${query ? `?${query}` : ''}`, { method: 'GET' });
};

/**
 * Get Published Quick Guide Details
 * GET /api/quick-guides/public/{id}/
 * Note: Automatically increments view count when accessed
 */
export const getPublishedQuickGuide = async (id) => {
  return publicApiRequest(`/public/${id}/`, { method: 'GET' });
};

/**
 * Get Guide Types and Counts
 * GET /api/quick-guides/types/
 * Response: Available guide types with their counts
 */
export const getGuideTypes = async () => {
  return publicApiRequest('/types/', { method: 'GET' });
};

/**
 * Increment View Count
 * POST /api/admin-portal/quick-guides/{id}/increment_view/
 */
export const incrementViewCount = async (id) => {
  return authApiRequest(`/${id}/increment_view/`, { method: 'POST' });
};

/**
 * Increment Download Count
 * POST /api/admin-portal/quick-guides/{id}/increment_download/
 */
export const incrementDownloadCount = async (id) => {
  return authApiRequest(`/${id}/increment_download/`, { method: 'POST' });
};

// Helper functions for filtering and organizing guides

/**
 * Get guides specifically for new users (beginner-friendly and getting started)
 */
export const getNewUserGuides = async () => {
  return listPublishedQuickGuides({
    is_beginner_friendly: 'true',
    ordering: 'order,created_at'
  });
};

/**
 * Get featured guides for quick access
 */
export const getFeaturedGuides = async () => {
  return listPublishedQuickGuides({
    is_featured: 'true',
    ordering: 'order,created_at'
  });
};

/**
 * Get guides by specific type
 */
export const getGuidesByType = async (guideType) => {
  return listPublishedQuickGuides({
    guide_type: guideType,
    ordering: 'order,created_at'
  });
};

/**
 * Search guides
 */
export const searchGuides = async (searchTerm) => {
  return listPublishedQuickGuides({
    search: searchTerm,
    ordering: '-view_count,created_at'
  });
};

// Guide type constants for easy reference
export const GUIDE_TYPES = {
  GETTING_STARTED: 'getting_started',
  ACCOUNT_SETUP: 'account_setup',
  PRODUCT_LISTING: 'product_listing',
  MESSAGING: 'messaging',
  PAYMENTS: 'payments',
  AGENT_PROGRAM: 'agent_program',
  BUSINESS_VERIFICATION: 'business_verification',
  TROUBLESHOOTING: 'troubleshooting',
  FAQ: 'faq',
  OTHER: 'other'
};

// File type constants
export const FILE_TYPES = {
  VIDEO: 'video',
  IMAGE: 'image',
  DOCUMENT: 'document',
  AUDIO: 'audio',
  OTHER: 'other'
};

// Status constants
export const STATUS_TYPES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

// Helper function to get file type icon class/identifier
export const getFileTypeIconType = (fileType) => {
  switch (fileType) {
    case FILE_TYPES.VIDEO:
      return 'video';
    case FILE_TYPES.IMAGE:
      return 'image';
    case FILE_TYPES.DOCUMENT:
      return 'document';
    case FILE_TYPES.AUDIO:
      return 'audio';
    default:
      return 'document';
  }
};

// Helper function to get guide type display name
export const getGuideTypeDisplayName = (guideType) => {
  const displayNames = {
    [GUIDE_TYPES.GETTING_STARTED]: 'Getting Started',
    [GUIDE_TYPES.ACCOUNT_SETUP]: 'Account Setup',
    [GUIDE_TYPES.PRODUCT_LISTING]: 'Product Listing',
    [GUIDE_TYPES.MESSAGING]: 'Messaging & Communication',
    [GUIDE_TYPES.PAYMENTS]: 'Payments & Transactions',
    [GUIDE_TYPES.AGENT_PROGRAM]: 'Agent Program',
    [GUIDE_TYPES.BUSINESS_VERIFICATION]: 'Business Verification',
    [GUIDE_TYPES.TROUBLESHOOTING]: 'Troubleshooting',
    [GUIDE_TYPES.FAQ]: 'Frequently Asked Questions',
    [GUIDE_TYPES.OTHER]: 'Other'
  };
  
  return displayNames[guideType] || guideType;
};
