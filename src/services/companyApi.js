// Company Information API Service
import { authStorage } from './authApi';

const BASE_URL = '/api';

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;

  // Get token for authenticated requests
  const token = authStorage.getToken();

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  };

  const config = {
    ...defaultOptions,
    ...options
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let rawText = '';
      try { rawText = await response.text(); } catch {}
      let errorData = {};
      try { errorData = rawText ? JSON.parse(rawText) : {}; } catch { errorData = {}; }
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        rawText
      });
      // Extract a user-friendly message
      const messages = [];
      if (errorData && Array.isArray(errorData.errors)) {
        const arr = errorData.errors
          .map(e => (e && (e.message || e.detail || e.code)) || '')
          .filter(Boolean);
        if (arr.length) messages.push(...arr);
      }
      if (!messages.length && errorData) {
        if (typeof errorData.message === 'string') messages.push(errorData.message);
        else if (typeof errorData.detail === 'string') messages.push(errorData.detail);
        else if (typeof errorData.error === 'string') messages.push(errorData.error);
        else if (typeof errorData === 'object' && Object.keys(errorData).length) {
          const vals = Object.values(errorData).flat();
          const strVals = vals.filter(v => typeof v === 'string');
          if (strVals.length) messages.push(...strVals);
        }
      }
      if (!messages.length && rawText && typeof rawText === 'string') messages.push(rawText);
      const finalMessage = messages.length ? messages.join(' ') : `HTTP error! status: ${response.status} - ${response.statusText}`;
      const err = new Error(finalMessage);
      err.data = errorData;
      err.status = response.status;
      err.raw = rawText;
      throw err;
    }
    const data = await response.json();
    console.log(`API Success Response for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, {
      error,
      url,
      config
    });
    throw error;
  }
};

// Company Information CRUD Operations

// Get company information
export const getCompanyInfo = async () => {
  try {
    const response = await apiRequest('/company/info/', {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Get company info error:', error);
    // If company-specific endpoint doesn't exist, fall back to user profile
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      // Import here to avoid circular dependency
      const { getUserProfile } = await import('./authApi');
      return await getUserProfile();
    }
    throw error;
  }
};

// Update company information
export const updateCompanyInfo = async (companyData) => {
  try {
    const response = await apiRequest('/company/info/', {
      method: 'PUT',
      body: JSON.stringify(companyData)
    });

    // Update stored user data
    const currentUserData = authStorage.getUserData();
    if (currentUserData) {
      const updatedUserData = {
        ...currentUserData,
        ...companyData,
        ...response.company || response.user || response
      };
      authStorage.setAuth(authStorage.getToken(), updatedUserData);
    }

    return response;
  } catch (error) {
    console.error('Update company info error:', error);
    // If company-specific endpoint doesn't exist, fall back to user profile update
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      const { updateUserProfile } = await import('./authApi');
      return await updateUserProfile(companyData);
    }
    throw error;
  }
};

// Create company information (for new companies)
export const createCompanyInfo = async (companyData) => {
  try {
    const response = await apiRequest('/company/info/', {
      method: 'POST',
      body: JSON.stringify(companyData)
    });

    // Update stored user data
    const currentUserData = authStorage.getUserData();
    if (currentUserData) {
      const updatedUserData = {
        ...currentUserData,
        ...companyData,
        ...response.company || response.user || response
      };
      authStorage.setAuth(authStorage.getToken(), updatedUserData);
    }

    return response;
  } catch (error) {
    console.error('Create company info error:', error);
    throw error;
  }
};

// Delete company information
export const deleteCompanyInfo = async () => {
  try {
    const response = await apiRequest('/company/info/', {
      method: 'DELETE'
    });

    // Clear company-related data from stored user data
    const currentUserData = authStorage.getUserData();
    if (currentUserData) {
      const updatedUserData = {
        ...currentUserData,
        companyName: '',
        company_name: '',
        businessType: '',
        business_type: '',
        businessVerificationStatus: 'PENDING',
        business_verification_status: 'PENDING'
      };
      authStorage.setAuth(authStorage.getToken(), updatedUserData);
    }

    return response;
  } catch (error) {
    console.error('Delete company info error:', error);
    throw error;
  }
};

// Get company verification status
export const getCompanyVerificationStatus = async () => {
  try {
    const response = await apiRequest('/company/verification-status/', {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Get company verification status error:', error);
    throw error;
  }
};

// Submit company for verification
export const submitCompanyForVerification = async (verificationData) => {
  try {
    const response = await apiRequest('/company/submit-verification/', {
      method: 'POST',
      body: JSON.stringify(verificationData)
    });

    // Update verification status in stored user data
    const currentUserData = authStorage.getUserData();
    if (currentUserData) {
      const updatedUserData = {
        ...currentUserData,
        businessVerificationStatus: 'PENDING',
        business_verification_status: 'PENDING'
      };
      authStorage.setAuth(authStorage.getToken(), updatedUserData);
    }

    return response;
  } catch (error) {
    console.error('Submit company for verification error:', error);
    throw error;
  }
};

// Get company documents
export const getCompanyDocuments = async () => {
  try {
    const response = await apiRequest('/company/documents/', {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Get company documents error:', error);
    throw error;
  }
};

// Upload company document
export const uploadCompanyDocument = async (documentData) => {
  try {
    // Create FormData for file upload
    const formData = new FormData();
    
    Object.keys(documentData).forEach(key => {
      if (documentData[key] !== null && documentData[key] !== undefined) {
        formData.append(key, documentData[key]);
      }
    });

    const token = authStorage.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${BASE_URL}/company/documents/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Upload company document error:', error);
    throw error;
  }
};

// Delete company document
export const deleteCompanyDocument = async (documentId) => {
  try {
    const response = await apiRequest(`/company/documents/${documentId}/`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('Delete company document error:', error);
    throw error;
  }
};

// Get company activity log
export const getCompanyActivityLog = async () => {
  try {
    const response = await apiRequest('/company/activity-log/', {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Get company activity log error:', error);
    throw error;
  }
};

export default {
  getCompanyInfo,
  updateCompanyInfo,
  createCompanyInfo,
  deleteCompanyInfo,
  getCompanyVerificationStatus,
  submitCompanyForVerification,
  getCompanyDocuments,
  uploadCompanyDocument,
  deleteCompanyDocument,
  getCompanyActivityLog,
  listCompanies,
  getMyCompany,
  createCompany,
  updateCompany,
  updateCompanyJson
};

// ==========================
// New Multipart Company APIs
// ==========================

// Helper: recursively build FormData from nested payload
function buildFormData(formData, data, parentKey) {
  if (data === null || data === undefined) return;

  // Handle Date instances
  if (data instanceof Date) {
    formData.append(parentKey, data.toISOString());
    return;
  }

  // Handle File or Blob directly
  if ((typeof File !== 'undefined' && data instanceof File) || (typeof Blob !== 'undefined' && data instanceof Blob)) {
    formData.append(parentKey, data);
    return;
  }

  // Arrays: if array of files/primitives -> use repeated key[]; if array of objects -> index-based
  if (Array.isArray(data)) {
    const isAllFilesOrPrimitives = data.every(v => {
      const isFile = (typeof File !== 'undefined' && v instanceof File) || (typeof Blob !== 'undefined' && v instanceof Blob);
      const isPrimitive = v === null || ['string', 'number', 'boolean'].includes(typeof v);
      return isFile || isPrimitive;
    });
    if (isAllFilesOrPrimitives) {
      data.forEach(value => {
        const key = `${parentKey}[]`;
        buildFormData(formData, value, key);
      });
    } else {
      data.forEach((value, index) => {
        const key = `${parentKey}[${index}]`;
        if (typeof value === 'object' && value !== null) {
          Object.keys(value).forEach(childKey => {
            buildFormData(formData, value[childKey], `${key}[${childKey}]`);
          });
        } else {
          buildFormData(formData, value, key);
        }
      });
    }
    return;
  }

  // Plain objects
  if (typeof data === 'object') {
    Object.keys(data).forEach(key => {
      const value = data[key];
      const formKey = parentKey ? `${parentKey}[${key}]` : key;
      buildFormData(formData, value, formKey);
    });
    return;
  }

  // Primitives
  formData.append(parentKey, data);
}

// Build FormData entry point
function toFormData(payload) {
  const fd = new FormData();
  Object.keys(payload || {}).forEach(key => {
    buildFormData(fd, payload[key], key);
  });
  return fd;
}

// GET /api/companies/
export async function listCompanies() {
  const token = authStorage.getToken();
  // Correct GET endpoint per user: /companies/companies/ (add cache-busting)
  const ts = Date.now();
  const res = await fetch(`${BASE_URL}/companies/companies/?_ts=${ts}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}

// GET /api/companies/companies/me/
export async function getMyCompany() {
  const token = authStorage.getToken();
  const ts = Date.now();
  const res = await fetch(`${BASE_URL}/companies/companies/me/?_ts=${ts}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    // If the user has no company yet, backend may return 404. Treat this as "no company" instead of error.
    if (res.status === 404) {
      return null;
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}

// -------- Nested file resources uploads --------
// Helper: POST a single file to a nested segment with FormData { file }
async function postNestedFile(companyId, segment, file) {
  const token = authStorage.getToken();
  if (!token) throw new Error('Authentication required');
  const fd = new FormData();
  fd.append('file', file);
  console.log(`[nested-upload] POST multipart ->`, { companyId, segment, type: 'multipart', fileName: (file && file.name) || 'blob' });
  const res = await fetch(`${BASE_URL}/companies/companies/${companyId}/${segment}/`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: fd
  });
  if (!res.ok) {
    let details = '';
    try { details = await res.text(); } catch (_) { /* ignore */ }
    const msg = `Failed to upload to ${segment}: ${res.status}${details ? ` - ${details}` : ''}`;
    console.error('[nested-upload] POST multipart failed', { companyId, segment, status: res.status, details });
    throw new Error(msg);
  }
  console.log('[nested-upload] POST multipart success', { companyId, segment });
  return res.json();
}

// Batch upload many files to a segment
export async function uploadNestedFiles(companyId, segment, files = []) {
  const results = [];
  for (const f of files || []) {
    if (!f) continue;
    // Support either File/Blob or string public_id
    const isBlob = (typeof File !== 'undefined' && f instanceof File) || (typeof Blob !== 'undefined' && f instanceof Blob);
    // eslint-disable-next-line no-await-in-loop
    const r = isBlob ? await postNestedFile(companyId, segment, f) : await postNestedFileJson(companyId, segment, String(f));
    results.push(r);
  }
  return results;
}

// List nested files for a segment: GET .../companies/{id}/{segment}/
export async function listNestedFiles(companyId, segment) {
  const token = authStorage.getToken();
  if (!companyId) throw new Error('companyId is required');
  const ts = Date.now();
  const res = await fetch(`${BASE_URL}/companies/companies/${companyId}/${segment}/?_ts=${ts}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    // 404 -> treat as empty list (segment may not exist yet)
    if (res.status === 404) return [];
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to list ${segment}: ${res.status}`);
  }
  const data = await res.json();
  // Support both plain arrays and DRF pagination { results: [...] }
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

// Create nested via JSON public_id: POST .../{segment}/ with { file: "<public_id>" }
export async function postNestedFileJson(companyId, segment, publicId) {
  const token = authStorage.getToken();
  if (!token) throw new Error('Authentication required');
  console.log(`[nested-upload] POST json ->`, { companyId, segment, type: 'json', publicId });
  const res = await fetch(`${BASE_URL}/companies/companies/${companyId}/${segment}/`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ file: publicId })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('[nested-upload] POST json failed', { companyId, segment, status: res.status, errorData });
    throw new Error(errorData.message || `Failed to upload public_id to ${segment}: ${res.status}`);
  }
  console.log('[nested-upload] POST json success', { companyId, segment });
  return res.json();
}

// Update nested item with multipart PATCH: PATCH .../{segment}/{id}/ with FormData { file }
export async function patchNestedFile(companyId, segment, itemId, file) {
  const token = authStorage.getToken();
  if (!token) throw new Error('Authentication required');
  const fd = new FormData();
  fd.append('file', file);
  console.log('[nested-upload] PATCH multipart ->', { companyId, segment, itemId, type: 'multipart', fileName: (file && file.name) || 'blob' });
  const res = await fetch(`${BASE_URL}/companies/companies/${companyId}/${segment}/${itemId}/`, {
    method: 'PATCH',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: fd
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('[nested-upload] PATCH multipart failed', { companyId, segment, itemId, status: res.status, errorData });
    throw new Error(errorData.message || `Failed to update ${segment} ${itemId}: ${res.status}`);
  }
  console.log('[nested-upload] PATCH multipart success', { companyId, segment, itemId });
  return res.json();
}

// Update nested item via JSON public_id: PATCH .../{segment}/{id}/ with { file: "<public_id>" }
export async function patchNestedFileJson(companyId, segment, itemId, publicId) {
  const token = authStorage.getToken();
  if (!token) throw new Error('Authentication required');
  console.log('[nested-upload] PATCH json ->', { companyId, segment, itemId, type: 'json', publicId });
  const res = await fetch(`${BASE_URL}/companies/companies/${companyId}/${segment}/${itemId}/`, {
    method: 'PATCH',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ file: publicId })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update ${segment} ${itemId}: ${res.status}`);
  }
  return res.json();
}

// GET /api/companies/{id}/ (or fallback to /company/info/)
export async function getCompanyById(companyId) {
  const token = authStorage.getToken();
  // Primary per user
  const primary = await fetch(`${BASE_URL}/companies/companies/${companyId}/`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (primary.ok) return primary.json();
  if (primary.status === 404 || primary.status === 405) {
    // Fallbacks
    const alt1 = await fetch(`${BASE_URL}/companies/${companyId}/`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (alt1.ok) return alt1.json();
    const alt = await fetch(`${BASE_URL}/company/info/`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (alt.ok) return alt.json();
  }
  const err = await primary.json().catch(() => ({}));
  throw new Error(err.message || `Failed to fetch company ${companyId}`);
}

// POST /api/companies/ (multipart)
export async function createCompany(formPayload) {
  const token = authStorage.getToken();
  if (!token) throw new Error('Authentication required');

  const body = toFormData(formPayload || {});
  // Primary create endpoint per user spec
  let res = await fetch(`${BASE_URL}/companies/companies/full-submit/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      // DO NOT set Content-Type for FormData
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body
  });
  // Fallback if backend expects a different path (405/404)
  if (!res.ok && (res.status === 405 || res.status === 404)) {
    // Try generic collection
    res = await fetch(`${BASE_URL}/companies/companies/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body
    });
  }
  if (!res.ok && (res.status === 405 || res.status === 404)) {
    res = await fetch(`${BASE_URL}/company/info/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body
    });
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}

// PUT /api/companies/{id}/ (multipart full update)
export async function updateCompany(companyId, formPayload) {
  if (!companyId) throw new Error('companyId is required for update');
  const token = authStorage.getToken();
  if (!token) throw new Error('Authentication required');

  const body = toFormData(formPayload || {});
  // Primary endpoint (PATCH for partial/multipart)
  let res = await fetch(`${BASE_URL}/companies/companies/${companyId}/`, {
    method: 'PATCH',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body
  });
  // Fallback to alternate path with PUT
  if (!res.ok && (res.status === 405 || res.status === 404)) {
    res = await fetch(`${BASE_URL}/companies/${companyId}/`, {
      method: 'PUT',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body
    });
  }
  // If still not OK, attempt PUT on primary path
  if (!res.ok && (res.status === 405 || res.status === 404)) {
    res = await fetch(`${BASE_URL}/companies/companies/${companyId}/`, {
      method: 'PUT',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body
    });
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}

// JSON PATCH update for public_id updates
export async function updateCompanyJson(companyId, jsonPayload) {
  if (!companyId) throw new Error('companyId is required for update');
  const token = authStorage.getToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BASE_URL}/companies/companies/${companyId}/`, {
    method: 'PATCH',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(jsonPayload || {})
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}
