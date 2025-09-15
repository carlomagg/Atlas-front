// Product Request and Contact Seller API Service
// Endpoints grouped under /api/products

import { authStorage } from './authApi';
import { API_BASE_URL } from '../utils/apiConfig';
// Cloudinary not used for product request create per latest guide

const BASE_URL = `${API_BASE_URL}/products`;

// Local apiRequest (FormData-safe, attaches Authorization)
const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const token = authStorage.getToken();
  const isSessionPlaceholder = token && token.startsWith('session_');
  const isFormData = options && options.body instanceof FormData;

  const defaultOptions = {
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      ...((token && !isSessionPlaceholder) ? { Authorization: `Bearer ${token}` } : {}),
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

  const res = await fetch(url, config);
  if (!res.ok) {
    let text = '';
    try { text = await res.text(); } catch {}
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch {}
    // Prefer field-level validation errors if present
    let message = data?.detail || data?.message || '';
    if (!message && data && typeof data === 'object' && res.status >= 400 && res.status < 500) {
      const entries = Object.entries(data);
      if (entries.length) {
        const [field, val] = entries[0];
        let fieldMsg = '';
        if (Array.isArray(val) && val.length) fieldMsg = String(val[0]);
        else if (typeof val === 'string') fieldMsg = val;
        if (fieldMsg) message = `${field}: ${fieldMsg}`;
      }
    }
    const err = new Error(message || text || `${res.status} ${res.statusText}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
};

// Contact Seller
export const createContactSeller = async (productId, { quantity, unit_type, custom_unit, sourcing_details } = {}) => {
  const payload = { quantity, unit_type, sourcing_details };
  if (unit_type === 'others' && custom_unit) payload.custom_unit = custom_unit;
  return apiRequest(`/${productId}/contact/`, { method: 'POST', body: JSON.stringify(payload) });
};

export const listContactRequests = async (params = {}) => {
  const _params = { ...(params || {}) };
  if (_params.ordering === undefined) _params.ordering = '-created_at';
  _params._ = Date.now(); // cache-bust
  const q = new URLSearchParams(_params).toString();
  return apiRequest(`/contact-requests/${q ? `?${q}` : ''}`, { method: 'GET' });
};

export const replyContactRequest = async (requestId, { body, message, attachment, attachment_link } = {}) => {
  // Prefer `message`, fallback to `body` for backward compatibility
  const msg = message !== undefined && message !== null ? message : body;
  const isFile = attachment && typeof attachment !== 'string';
  if (isFile) {
    const fd = new FormData();
    // Some backends require the FK explicitly even if provided in URL
    fd.append('product_request', String(requestId));
    if (msg !== undefined && msg !== null) fd.append('message', String(msg));
    fd.append('attachment', attachment, attachment?.name || 'attachment');
    return apiRequest(`/contact-requests/${requestId}/reply/`, { method: 'POST', body: fd });
  }
  const payload = {};
  payload.product_request = String(requestId);
  if (msg !== undefined && msg !== null) payload.message = String(msg);
  // If a URL is provided, API expects attachment_link in JSON
  const link = attachment_link || (typeof attachment === 'string' ? attachment : undefined);
  if (link) payload.attachment_link = String(link);
  return apiRequest(`/contact-requests/${requestId}/reply/`, { method: 'POST', body: JSON.stringify(payload) });
};

// Product Requests
export const listProductRequests = async (params = {}) => {
  const _params = { ...(params || {}) };
  if (_params.ordering === undefined) _params.ordering = '-created_at';
  _params._ = Date.now(); // cache-bust
  const q = new URLSearchParams(_params).toString();
  return apiRequest(`/product-requests/${q ? `?${q}` : ''}`, { method: 'GET' });
};

export const createProductRequest = async (input = {}) => {
  const hasFile = Array.isArray(input.attachments) && input.attachments.filter(Boolean).length > 0;

  // Common fields list
  const fields = [
    'product_name',
    // existing fields for backward compatibility
    'category', 'quantity', 'unit_type', 'custom_unit', 'budget', 'currency',
    'country', 'city', 'details', 'is_buyer', 'is_supplier', 'only_paid_members', 'allow_all_members',
    // new fields per latest spec
    'business_type', 'purchase_quantity', 'time_of_validity', 'piece_unit', 'buying_frequency',
    'target_unit_price', 'max_budget',
    'category_text', 'country_text', 'state_text', 'local_government_text',
    'attachment_link'
  ];

  if (hasFile) {
    // Multipart FormData request with first file as 'attachment'
    const fd = new FormData();
    fields.forEach((k) => {
      const v = input[k];
      if (v !== undefined && v !== null && v !== '') {
        // FormData values are strings; coerce booleans/numbers
        fd.append(k, typeof v === 'boolean' || typeof v === 'number' ? String(v) : v);
      }
    });
    const file = input.attachments.filter(Boolean)[0];
    if (file) {
      fd.append('attachment', file, file.name || 'attachment');
    }
    return apiRequest('/product-requests/', { method: 'POST', body: fd });
  } else {
    // JSON request when no file is attached
    const payload = {};
    fields.forEach((k) => {
      const v = input[k];
      if (v !== undefined && v !== null && v !== '') payload[k] = v;
    });
    return apiRequest('/product-requests/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
};

export const replyProductRequest = async (requestId, { body, message, attachment, attachment_link, recipient_id } = {}) => {
  const msg = message !== undefined && message !== null ? message : body;
  const isFile = attachment && typeof attachment !== 'string';
  if (isFile) {
    const fd = new FormData();
    fd.append('product_request', String(requestId));
    if (msg !== undefined && msg !== null) fd.append('message', String(msg));
    if (recipient_id !== undefined && recipient_id !== null && recipient_id !== '') {
      fd.append('recipient_id', String(recipient_id));
    }
    fd.append('attachment', attachment, attachment?.name || 'attachment');
    return apiRequest(`/product-requests/${requestId}/reply/`, { method: 'POST', body: fd });
  }
  const payload = {};
  payload.product_request = String(requestId);
  if (msg !== undefined && msg !== null) payload.message = String(msg);
  if (recipient_id !== undefined && recipient_id !== null && recipient_id !== '') payload.recipient_id = String(recipient_id);
  const link = attachment_link || (typeof attachment === 'string' ? attachment : undefined);
  if (link) payload.attachment_link = String(link);
  return apiRequest(`/product-requests/${requestId}/reply/`, { method: 'POST', body: JSON.stringify(payload) });
};

// Delete endpoints
export const deleteContactRequest = async (requestId) =>
  apiRequest(`/contact-requests/${requestId}/`, { method: 'DELETE' });

export const deleteProductRequest = async (requestId) =>
  apiRequest(`/product-requests/${requestId}/`, { method: 'DELETE' });

export const closeProductRequest = async (requestId) => apiRequest(`/product-requests/${requestId}/close/`, { method: 'POST' });

// Product Request Replies - Additional Endpoints
// Fetch a single product request including nested replies
export const getProductRequestWithReplies = async (requestId) =>
  apiRequest(`/product-requests/${requestId}/`, { method: 'GET' });

// Mark a specific reply as read
export const markProductRequestReplyRead = async (requestId, replyId) =>
  apiRequest(`/product-requests/${requestId}/mark_reply_read/`, {
    method: 'POST',
    body: JSON.stringify({ reply_id: replyId }),
  });

// Mark a specific reply as unread
export const markProductRequestReplyUnread = async (requestId, replyId) =>
  apiRequest(`/product-requests/${requestId}/mark_reply_unread/`, {
    method: 'POST',
    body: JSON.stringify({ reply_id: replyId }),
  });

// Mark all replies as read for this request
export const markAllProductRequestRepliesRead = async (requestId) =>
  apiRequest(`/product-requests/${requestId}/mark_all_replies_read/`, { method: 'POST' });

// Get unread replies count for current user
export const getUnreadProductRequestRepliesCount = async () =>
  apiRequest('/product-requests/unread_count/', { method: 'GET' });

// Get available categories for filtering (categories that have product requests)
export const getAvailableCategories = async () =>
  apiRequest('/product-requests/available_categories/', { method: 'GET' });

// Get all categories to find ID by name
export const getAllCategories = async () =>
  apiRequest('/categories/', { method: 'GET' });
