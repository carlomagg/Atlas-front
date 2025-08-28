// Product API Service for CRUD, listings, search, and media
// Uses JSON payloads with base64 for create-with-media as per product_endpoints.txt

import { authStorage } from './authApi';
import { API_BASE_URL } from '../utils/apiConfig';

const BASE_URL = `${API_BASE_URL}/products`;
// Some deployments mount the products router under '/api/products/products/'.
// Keep main BASE_URL for general endpoints and use a dedicated base for nested product routes (brochures, media when needed).
const PRODUCTS_BASE_URL = `${API_BASE_URL}/products/products`;

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
    const err = new Error(data?.detail || data?.message || text || `${res.status} ${res.statusText}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
};

// Secondary requester for routes under '/api/products/products/...'
const apiRequestProducts = async (endpoint, options = {}) => {
  const url = `${PRODUCTS_BASE_URL}${endpoint}`;
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
    const err = new Error(data?.detail || data?.message || text || `${res.status} ${res.statusText}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
};

// Utilities
export const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// Basic CRUD
export const listProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const createProduct = (payload) => apiRequest('/', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const retrieveProduct = (id) => apiRequest(`/${id}/`, { method: 'GET' });

export const updateProduct = (id, payload, { partial = false } = {}) => apiRequest(`/${id}/`, {
  method: partial ? 'PATCH' : 'PUT',
  body: JSON.stringify(payload),
});

export const deleteProduct = (id) => apiRequest(`/${id}/`, { method: 'DELETE' });

// Listings/Details
export const listGeneral = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/list/${q ? `?${q}` : ''}`, { method: 'GET' });
};
export const getBySlug = (slug) => apiRequest(`/detail/${slug}/`, { method: 'GET' });
export const listMyProducts = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/my-products/${q ? `?${q}` : ''}`, { method: 'GET' });
};
export const listFeatured = () => apiRequest('/featured/', { method: 'GET' });
export const listPendingApproval = () => apiRequest('/pending-approval/', { method: 'GET' });
export const userProductCounts = () => apiRequest('/user-product-counts/', { method: 'GET' });
export const checkVisibility = (id) => apiRequest(`/${id}/check-visibility/`, { method: 'GET' });
export const approveProduct = (id, payload = {}) => apiRequest(`/approve/${id}/`, { method: 'PUT', body: JSON.stringify(payload) });

// Global search
export const searchProducts = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/search/${q ? `?${q}` : ''}`, { method: 'GET' });
};

// Categories
// NOTE: Adjust endpoint if backend differs (e.g., '/api/categories/').
export const listCategories = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/categories/${q ? `?${q}` : ''}`, { method: 'GET' });
};

// Global media listing (e.g., all product media across the platform)
// Example endpoint: GET /api/products/media/?media_type=video
export const listGlobalMedia = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/media/${q ? `?${q}` : ''}`, { method: 'GET' });
};

// Convenience: list all product videos across the platform
export const listAllProductVideos = (params = {}) => {
  return listGlobalMedia({ media_type: 'video', ...params });
};

// Unified media endpoints
export const listMedia = (productId, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/${productId}/media/${q ? `?${q}` : ''}`, { method: 'GET' });
};
export const uploadMedia = (productId, { file, media_type, title, is_primary } = {}) => {
  const fd = new FormData();
  if (file) fd.append('file', file);
  if (media_type) fd.append('media_type', media_type);
  if (title) fd.append('title', title);
  if (typeof is_primary === 'boolean') fd.append('is_primary', String(is_primary));
  return apiRequest(`/${productId}/media/`, { method: 'POST', body: fd });
};
export const getMedia = (productId, mediaId) => apiRequest(`/${productId}/media/${mediaId}/`, { method: 'GET' });
export const updateMedia = (productId, mediaId, payload, { partial = false } = {}) => apiRequest(`/${productId}/media/${mediaId}/`, { method: partial ? 'PATCH' : 'PUT', body: JSON.stringify(payload) });
export const deleteMedia = (productId, mediaId) => apiRequest(`/${productId}/media/${mediaId}/`, { method: 'DELETE' });
export const setPrimaryImage = (productId, mediaId) => apiRequest(`/${productId}/media/${mediaId}/set_primary/`, { method: 'POST' });

// Replace media file (multipart PUT) - for images or videos
export const replaceMediaFile = (productId, mediaId, { file, media_type, title, is_primary } = {}) => {
  const fd = new FormData();
  if (file) fd.append('file', file);
  if (media_type) fd.append('media_type', media_type);
  if (title) fd.append('title', title);
  if (typeof is_primary === 'boolean') fd.append('is_primary', String(is_primary));
  return apiRequest(`/${productId}/media/${mediaId}/`, { method: 'PUT', body: fd });
};

// Combined create with media (JSON base64 or multipart) - we will use JSON base64
export const createProductWithMedia = (payload) => apiRequest('/create-product-with-media/', {
  method: 'POST',
  body: JSON.stringify(payload),
});

// Helper to build JSON body per spec from UI form state
export const buildCreateWithMediaPayload = async (form) => {
  // product_data mapping
  const product_data = {
    title: form.title?.trim(),
    product_type: form.type?.trim(),
    keywords: form.keywords || '',
    article_model_no: form.modelNo || '',
    category: Number(form.category) || form.category, // expect numeric id where possible
    description: form.description || '',
    specification: form.spec || '',
    production_capacity: form.capacity || '',
    packaging_delivery: form.packaging || '',
    benefits: form.benefits || '',
    others: form.others || '',
    customer_feedback: form.customerFeedback || '',
    questions_answers: form.qna || '',
    is_active: true,
    is_featured: !!form.isFeatured,
    specifications: Array.isArray(form.moreDetails)
      ? form.moreDetails.filter(d => d && (d.key || d.value)).map(d => ({ name: d.key || '', value: d.value || '' }))
      : [],
  };

  // media_items from productImages + imagesOfProduct (images)
  const imageFiles = [
    ...(Array.isArray(form.productImages) ? form.productImages : []),
    ...(Array.isArray(form.imagesOfProduct) ? form.imagesOfProduct : []),
  ].filter(Boolean);

  const media_items = [];
  const primaryIdx = Number.isInteger(form?.primaryImageIndex) ? form.primaryImageIndex : 0;
  for (let i = 0; i < imageFiles.length; i++) {
    const dataUrl = await fileToDataUrl(imageFiles[i]);
    media_items.push({
      base64_data: dataUrl,
      media_type: 'image',
      title: imageFiles[i]?.name || `image_${i + 1}`,
      ...(i === primaryIdx ? { is_primary: true } : {}),
    });
  }

  // videos from productVideos
  if (Array.isArray(form.productVideos)) {
    for (let i = 0; i < form.productVideos.length; i++) {
      const vf = form.productVideos[i];
      if (!vf) continue;
      const dataUrl = await fileToDataUrl(vf);
      media_items.push({
        base64_data: dataUrl,
        media_type: 'video',
        title: vf?.name || `video_${i + 1}`,
      });
    }
  }

  // additional_files from brochure and catalog
  const additional_files = [];
  if (form.brochure) {
    const dataUrl = await fileToDataUrl(form.brochure);
    additional_files.push({ base64_data: dataUrl, field_type: 'specification', title: form.brochure.name || 'Brochure' });
  }
  if (Array.isArray(form.catalog)) {
    for (let i = 0; i < form.catalog.length; i++) {
      const f = form.catalog[i];
      const dataUrl = await fileToDataUrl(f);
      additional_files.push({ base64_data: dataUrl, field_type: 'others', title: f.name || `File ${i + 1}` });
    }
  }

  // Map new optional section file arrays to backend field types
  const sectionMap = [
    { key: 'descriptionFiles', field: 'description' },
    { key: 'specificationFiles', field: 'specification' },
    { key: 'productionCapacityFiles', field: 'production_capacity' },
    { key: 'packagingDeliveryFiles', field: 'packaging_delivery' },
    { key: 'benefitsFiles', field: 'benefits' },
    { key: 'othersFiles', field: 'others' },
    { key: 'customerFeedbackFiles', field: 'customer_feedback' },
    { key: 'qnaFiles', field: 'questions_answers' },
  ];
  for (const { key, field } of sectionMap) {
    const arr = form?.[key];
    if (Array.isArray(arr) && arr.length) {
      for (let i = 0; i < arr.length; i++) {
        const f = arr[i];
        if (!f) continue;
        const dataUrl = await fileToDataUrl(f);
        additional_files.push({ base64_data: dataUrl, field_type: field, title: f.name || `${field}_file_${i + 1}` });
      }
    }
  }

  return { product_data, media_items, additional_files };
};

// Additional Section Files API
// Endpoints:
// - GET    /api/products/{product_id}/additional-files/
// - POST   /api/products/{product_id}/additional-files/
// - GET    /api/products/{product_id}/additional-files/{id}/
// - PUT    /api/products/{product_id}/additional-files/{id}/
// - PATCH  /api/products/{product_id}/additional-files/{id}/
// - DELETE /api/products/{product_id}/additional-files/{id}/
// Notes:
// - Uploads use multipart/form-data. Required fields: file and section identifier.
// - Backend may accept section key as 'section_type', 'section', or legacy 'field_type'. We support all.
export const listAdditionalFiles = (productId, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/${productId}/additional-files/${q ? `?${q}` : ''}`, { method: 'GET' });
};

export const uploadAdditionalFile = (productId, { file, section_type, section, field_type, title } = {}) => {
  const fd = new FormData();
  if (file) fd.append('file', file);
  // Prefer explicit section_type; fall back to section; finally legacy field_type
  const sectionVal = section_type || section || field_type || '';
  if (section_type) fd.append('section_type', section_type);
  if (section) fd.append('section', section);
  // Always include field_type as backend requires it
  if (sectionVal) fd.append('field_type', sectionVal);
  if (title) fd.append('title', title);
  return apiRequest(`/${productId}/additional-files/`, { method: 'POST', body: fd });
};

export const updateAdditionalFile = (productId, fileId, { file, section_type, section, field_type, title } = {}, { partial = false } = {}) => {
  const fd = new FormData();
  if (file) fd.append('file', file);
  const sectionVal = section_type || section || field_type || '';
  if (section_type) fd.append('section_type', section_type);
  if (section) fd.append('section', section);
  if (sectionVal) fd.append('field_type', sectionVal);
  if (title) fd.append('title', title);
  return apiRequest(`/${productId}/additional-files/${fileId}/`, { method: partial ? 'PATCH' : 'PUT', body: fd });
};

export const deleteAdditionalFile = (productId, fileId) => {
  return apiRequest(`/${productId}/additional-files/${fileId}/`, { method: 'DELETE' });
};

// Brochures (legacy but available)
export const listBrochures = (productId, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequestProducts(`/${productId}/brochures/${q ? `?${q}` : ''}`, { method: 'GET' });
};
export const createBrochure = (productId, { file, title } = {}) => {
  const fd = new FormData();
  if (file) fd.append('file', file);
  if (title) fd.append('title', title);
  return apiRequestProducts(`/${productId}/brochures/`, { method: 'POST', body: fd });
};
export const getBrochure = (productId, brochureId) => apiRequestProducts(`/${productId}/brochures/${brochureId}/`, { method: 'GET' });
export const updateBrochure = (productId, brochureId, payload = {}, { partial = false } = {}) => {
  const fd = new FormData();
  if (payload.file) fd.append('file', payload.file);
  if (payload.title) fd.append('title', payload.title);
  return apiRequestProducts(`/${productId}/brochures/${brochureId}/`, { method: partial ? 'PATCH' : 'PUT', body: fd });
};
export const replaceBrochureFile = (productId, brochureId, { file, title } = {}) => {
  const fd = new FormData();
  if (file) fd.append('file', file);
  if (title) fd.append('title', title);
  return apiRequestProducts(`/${productId}/brochures/${brochureId}/`, { method: 'PUT', body: fd });
};
export const deleteBrochure = (productId, brochureId) => apiRequestProducts(`/${productId}/brochures/${brochureId}/`, { method: 'DELETE' });

// Product Reviews
// Endpoints expected:
// - GET    /api/products/{product_id}/reviews/
// - POST   /api/products/{product_id}/reviews/
// - PUT    /api/products/{product_id}/reviews/{review_id}/
// - PATCH  /api/products/{product_id}/reviews/{review_id}/
// - DELETE /api/products/{product_id}/reviews/{review_id}/
export const listReviews = (productId, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/${productId}/reviews/${q ? `?${q}` : ''}`, { method: 'GET' });
};

export const createReview = (productId, payload = {}) => {
  return apiRequest(`/${productId}/reviews/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateReview = (productId, reviewId, payload = {}, { partial = false } = {}) => {
  return apiRequest(`/${productId}/reviews/${reviewId}/`, {
    method: partial ? 'PATCH' : 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteReview = (productId, reviewId) => {
  return apiRequest(`/${productId}/reviews/${reviewId}/`, { method: 'DELETE' });
};
