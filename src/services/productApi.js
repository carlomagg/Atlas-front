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
// Hierarchical "My Products by Categories"
// Endpoint: GET /api/products/my-products-by-categories/
// Auth required. Supports: include_subcategories (default true), status, category
export const listMyProductsByCategories = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/my-products-by-categories/${q ? `?${q}` : ''}`, { method: 'GET' });
};
export const listFeatured = () => apiRequest('/featured/', { method: 'GET' });
export const listPendingApproval = () => apiRequest('/pending-approval/', { method: 'GET' });
export const userProductCounts = () => apiRequest('/user-product-counts/', { method: 'GET' });
export const checkVisibility = (id) => apiRequest(`/${id}/check-visibility/`, { method: 'GET' });
export const approveProduct = (id, payload = {}) => apiRequest(`/approve/${id}/`, { method: 'PUT', body: JSON.stringify(payload) });

// Enhanced Global Search with Category Support
export const searchProducts = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/search/${q ? `?${q}` : ''}`, { method: 'GET' });
};

// Enhanced search with category support and parameter validation
export const searchProductsEnhanced = (params = {}) => {
  // Clean and validate parameters
  const cleanParams = {};
  
  // Basic search parameters
  if (params.q) cleanParams.q = params.q;
  if (params.product_name) cleanParams.product_name = params.product_name;
  if (params.company_name) cleanParams.company_name = params.company_name;
  if (params.atlas_id) cleanParams.atlas_id = params.atlas_id;
  if (params.business_type) cleanParams.business_type = params.business_type;
  
  // NEW: Category search parameters
  if (params.category) cleanParams.category = params.category;
  if (params.category_name) cleanParams.category_name = params.category_name;
  if (params.include_subcategories !== undefined) {
    cleanParams.include_subcategories = Boolean(params.include_subcategories);
  }
  
  // NEW: Price range parameters
  if (params.min_price) cleanParams.min_price = params.min_price;
  if (params.max_price) cleanParams.max_price = params.max_price;
  
  // Pagination parameters
  if (params.page) cleanParams.page = params.page;
  if (params.page_size) cleanParams.page_size = params.page_size;
  if (params.limit) cleanParams.limit = params.limit;
  
  const q = new URLSearchParams(cleanParams).toString();
  return apiRequest(`/search/${q ? `?${q}` : ''}`, { method: 'GET' });
};

// NEW: Separate Search Results Page API
// Uses the dedicated search results endpoint with enhanced metadata
export const searchProductsResults = (params = {}) => {
  // Clean and validate parameters
  const cleanParams = {};
  
  // Search term is required for this endpoint
  if (!params.q || !params.q.trim()) {
    throw new Error('Search term (q) is required for search results page');
  }
  
  // Basic search parameters
  cleanParams.q = params.q.trim();
  if (params.product_name) cleanParams.product_name = params.product_name;
  if (params.company_name) cleanParams.company_name = params.company_name;
  if (params.atlas_id) cleanParams.atlas_id = params.atlas_id;
  if (params.business_type) cleanParams.business_type = params.business_type;
  
  // Category search parameters
  if (params.category) cleanParams.category = params.category;
  if (params.category_name) cleanParams.category_name = params.category_name;
  if (params.include_subcategories !== undefined) {
    cleanParams.include_subcategories = Boolean(params.include_subcategories);
  }
  
  // Price range parameters
  if (params.min_price) cleanParams.min_price = params.min_price;
  if (params.max_price) cleanParams.max_price = params.max_price;
  
  // Pagination parameters
  if (params.page) cleanParams.page = params.page;
  if (params.page_size) cleanParams.page_size = params.page_size;
  
  const q = new URLSearchParams(cleanParams).toString();
  return apiRequest(`/search-results/${q ? `?${q}` : ''}`, { method: 'GET' });
};

// NEW: Atlas ID specific search helper
export const searchByAtlasId = (atlasId, options = {}) => {
  return searchProductsEnhanced({
    atlas_id: atlasId,
    ...options
  });
};

// Category-specific search helpers
export const searchByCategory = (categoryId, options = {}) => {
  return searchProductsEnhanced({
    category: categoryId,
    include_subcategories: options.includeSubcategories !== undefined ? options.includeSubcategories : true, // Default to true
    ...options
  });
};

export const searchByCategoryName = (categoryName, options = {}) => {
  return searchProductsEnhanced({
    category_name: categoryName,
    include_subcategories: options.includeSubcategories !== undefined ? options.includeSubcategories : true, // Default to true
    ...options
  });
};

// Combined search with text and category
export const searchProductsWithCategory = (searchText, categoryOptions = {}, otherParams = {}) => {
  // Ensure subcategories are included by default if not explicitly set
  const finalCategoryOptions = {
    include_subcategories: true, // Default to true
    ...categoryOptions
  };
  
  return searchProductsEnhanced({
    q: searchText,
    ...finalCategoryOptions,
    ...otherParams
  });
};

// Categories
// NOTE: Adjust endpoint if backend differs (e.g., '/api/categories/').
export const listCategories = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/categories/${q ? `?${q}` : ''}`, { method: 'GET' });
};

// Enhanced Category API Endpoints for Product Upload
// These new endpoints provide hierarchical category structure optimized for product upload forms

// 1. Categories for Upload - Recommended for Product Upload Forms
// Endpoint: GET /api/products/categories/for_upload/
// Returns flat list with full path information (e.g., "Electronics > Mobile Devices > Smartphones")
export const fetchCategoriesForUpload = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/categories/for_upload/${q ? `?${q}` : ''}`, { method: 'GET' });
};

// 2. Category Tree Structure
// Endpoint: GET /api/products/categories/tree/
// Returns nested tree structure with children for expandable tree components
export const fetchCategoryTree = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/categories/tree/${q ? `?${q}` : ''}`, { method: 'GET' });
};

// 3. Category Cascade Information
// Endpoint: GET /api/products/categories/cascade/
// Returns detailed hierarchy information with ancestors and descendants
export const fetchCategoryCascade = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/categories/cascade/${q ? `?${q}` : ''}`, { method: 'GET' });
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
    subsidiary: form.subsidiary ? Number(form.subsidiary) : null, // NEW: Subsidiary selection
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

// Top Ranking Products
// Endpoint: GET /api/products/top_ranking/
// Returns globally top-ranked products across the entire platform
// Supports category filtering with automatic subcategory inclusion
export const fetchTopRankingProducts = async (page = 1, pageSize = 20, categoryId = null) => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  });
  
  // Add category filter if provided (automatically includes subcategories)
  if (categoryId) {
    params.append('category', categoryId.toString());
  }
  
  const query = params.toString();
  
  return await apiRequest(`/top_ranking/${query ? `?${query}` : ''}`, { method: 'GET' });
};

// Fetch top ranking products by specific category
// Automatically includes subcategories as per backend enhancement
export const fetchTopRankingProductsByCategory = async (categoryId, page = 1, pageSize = 20) => {
  return await fetchTopRankingProducts(page, pageSize, categoryId);
};

// Featured Products
// Endpoint: GET /api/products/featured/
// Returns featured products across the platform
export const fetchFeaturedProducts = async (page = 1, pageSize = 20) => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  });
  
  const query = params.toString();
  
  return await apiRequest(`/featured/${query ? `?${query}` : ''}`, { method: 'GET' });
};

// Seller's Products
// Endpoint: GET /api/products/?seller={seller_id}
// Returns all products from a specific seller using the general products endpoint with seller filter
export const fetchSellerProducts = async (sellerId, params = {}) => {
  const queryParams = new URLSearchParams({
    page: '1',
    page_size: '20',
    seller: sellerId.toString(),
    status: 'APPROVED', // Only show approved products
    ...params
  });
  
  const query = queryParams.toString();
  
  return await apiRequest(`/${query ? `?${query}` : ''}`, { method: 'GET' });
};

// Business Type Filter
// Endpoint: GET /api/products/by-business-type/
// Filters products by seller business type: ASSOCIATION, RETAILER, MANUFACTURER, DISTRIBUTOR, AGENT, SERVICE_PROVIDER
export const fetchProductsByBusinessType = async (businessType, params = {}) => {
  const queryParams = new URLSearchParams({
    business_type: businessType,
    ...params
  });
  
  const query = queryParams.toString();
  
  return await apiRequest(`/by-business-type/${query ? `?${query}` : ''}`, { method: 'GET' });
};

// Related Products
// Primary endpoint: GET /api/products/{product_id}/related/
// Fallback: Use listGeneral with category filtering when related endpoint is not available
export const fetchRelatedProducts = async (productId, options = {}) => {
  const params = new URLSearchParams();
  
  if (options.sameCategory) {
    params.append('same_category', 'true');
  }
  
  if (options.limit) {
    params.append('limit', options.limit.toString());
  }
  
  const query = params.toString();
  
  try {
    // Try the dedicated related products endpoint first
    return await apiRequest(`/${productId}/related/${query ? `?${query}` : ''}`, { method: 'GET' });
  } catch (error) {
    // If related endpoint doesn't exist (404), fall back to general product listing
    if (error.status === 404) {
      console.log('Related products endpoint not available, using fallback method');
      
      try {
        // First, get the current product to know its category
        const currentProduct = await retrieveProduct(productId);
        
        // Prepare fallback parameters
        const fallbackParams = {
          limit: options.limit || 6,
          page: 1,
          // Exclude the current product from results
          exclude: productId
        };
        
        // If same category is requested and we have category info
        if (options.sameCategory && currentProduct?.category) {
          // Add category filter if the product has category information
          if (typeof currentProduct.category === 'object' && currentProduct.category.id) {
            fallbackParams.category = currentProduct.category.id;
          } else if (typeof currentProduct.category === 'number') {
            fallbackParams.category = currentProduct.category;
          }
        }
        
        // Use listGeneral as fallback
        const fallbackData = await listGeneral(fallbackParams);
        
        // Filter out the current product from results if exclude parameter didn't work
        const results = Array.isArray(fallbackData?.results) ? fallbackData.results : (Array.isArray(fallbackData) ? fallbackData : []);
        const filteredResults = results.filter(product => product.id !== parseInt(productId));
        
        // Return in the same format as the original endpoint would
        return {
          results: filteredResults,
          count: filteredResults.length,
          fallback: true // Flag to indicate this is fallback data
        };
        
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        throw fallbackError;
      }
    } else {
      // Re-throw other errors (network issues, etc.)
      throw error;
    }
  }
};

// Seller-specific product endpoints
export const getSellerFeaturedProducts = (params = {}) => {
  // Accept both camelCase (preferred) and snake_case for backward compatibility
  const sellerId = params.sellerId ?? params.seller_id;
  const category = params.category;
  const includeSubcategories = (params.includeSubcategories ?? params.include_subcategories);
  const status = params.status;
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? params.page_size ?? 12;
  const search = params.search;

  const qs = new URLSearchParams({
    seller_id: String(sellerId),
    page: String(page),
    page_size: String(pageSize),
  });
  if (category) qs.set('category', String(category));
  if (includeSubcategories !== undefined) qs.set('include_subcategories', String(Boolean(includeSubcategories)));
  if (status) qs.set('status', status);
  if (search) qs.set('search', search);

  const query = qs.toString();

  // Try the new endpoint first, fallback to regular listFeatured when 404
  return apiRequest(`/seller-featured-products/${query ? `?${query}` : ''}`, { method: 'GET' })
    .catch(async (error) => {
      if (error.status === 404) {
        console.log('Seller featured products endpoint not available, using fallback');
        return listFeatured().then(data => ({
          results: Array.isArray(data?.results) ? data.results.filter(p =>
            p.seller_id == sellerId || p.seller?.id == sellerId || p.user_id == sellerId
          ) : [],
          count: 0,
          next: null,
          previous: null
        }));
      }
      throw error;
    });
};

export const getSellerProductsByCategory = (params = {}) => {
  // Accept both camelCase (preferred) and snake_case for backward compatibility
  const sellerId = params.sellerId ?? params.seller_id;
  const category = params.category; // required
  const includeSubcategories = (params.includeSubcategories ?? params.include_subcategories);
  const status = params.status;
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? params.page_size ?? 12;
  const search = params.search;

  const qs = new URLSearchParams({
    seller_id: String(sellerId),
    category: String(category),
    page: String(page),
    page_size: String(pageSize),
    include_subcategories: String(includeSubcategories === undefined ? true : Boolean(includeSubcategories)),
  });
  if (status) qs.set('status', status);
  if (search) qs.set('search', search);

  const query = qs.toString();

  // Try the new endpoint first, fallback to general search when 404
  return apiRequest(`/seller-products-by-category/${query ? `?${query}` : ''}`, { method: 'GET' })
    .catch(async (error) => {
      if (error.status === 404) {
        console.log('Seller products by category endpoint not available, using fallback');
        return searchProducts({
          category,
          seller_id: sellerId,
          page,
          page_size: pageSize,
          include_subcategories: includeSubcategories,
          status,
          q: search,
        }).then(data => ({
          results: Array.isArray(data?.results) ? data.results : [],
          count: data?.count || 0,
          next: data?.next || null,
          previous: data?.previous || null
        }));
      }
      throw error;
    });
};

// Seller Grouped Products
// Endpoint: GET /api/products/seller-grouped-products/
// Returns grouped products for a specific seller organized by group categories
export const getSellerGroupedProducts = (params = {}) => {
  // Accept both camelCase (preferred) and snake_case for backward compatibility
  const sellerId = params.sellerId ?? params.seller_id;
  const page = params.page || 1;
  const pageSize = params.pageSize ?? params.page_size ?? 20;
  const status = params.status;

  if (!sellerId) {
    throw new Error('Seller ID is required for grouped products');
  }

  const qs = new URLSearchParams({
    seller_id: String(sellerId),
    page: String(page),
    page_size: String(pageSize),
  });

  if (status) qs.append('status', status);

  const query = qs.toString();

  // Try the new endpoint first, fallback to empty response when 404
  return apiRequest(`/seller-grouped-products/${query ? `?${query}` : ''}`, { method: 'GET' })
    .catch(async (error) => {
      if (error.status === 404) {
        console.log('Seller grouped products endpoint not available, returning empty response');
        return {
          results: [],
          groups: [],
          count: 0,
          next: null,
          previous: null
        };
      }
      throw error;
    });
};

// Seller Grouped Products by Group
// Endpoint: GET /api/products/seller-grouped-products-by-group/
// Returns products from a specific group for a seller
export const getSellerGroupedProductsByGroup = (params = {}) => {
  // Accept both camelCase (preferred) and snake_case for backward compatibility
  const sellerId = params.sellerId ?? params.seller_id;
  const groupId = params.groupId ?? params.group_id;
  const page = params.page || 1;
  const pageSize = params.pageSize ?? params.page_size ?? 20;
  const status = params.status;

  if (!sellerId) {
    throw new Error('Seller ID is required for grouped products by group');
  }
  if (!groupId) {
    throw new Error('Group ID is required for grouped products by group');
  }

  const qs = new URLSearchParams({
    seller_id: String(sellerId),
    group_id: String(groupId),
    page: String(page),
    page_size: String(pageSize),
  });

  if (status) qs.append('status', status);

  const query = qs.toString();

  // Try the new endpoint first, fallback to empty response when 404
  return apiRequest(`/seller-grouped-products-by-group/${query ? `?${query}` : ''}`, { method: 'GET' })
    .catch(async (error) => {
      if (error.status === 404) {
        console.log('Seller grouped products by group endpoint not available, returning empty response');
        return {
          results: [],
          count: 0,
          next: null,
          previous: null
        };
      }
      throw error;
    });
};

// Product Groups Management API
// Based on the provided endpoints for CRUD operations

// List Product Groups
// GET /api/products/product-groups/
export const listProductGroups = (params = {}) => {
  const queryParams = new URLSearchParams({
    page: '1',
    page_size: '20',
    ...params
  });
  
  const query = queryParams.toString();
  return apiRequest(`/product-groups/${query ? `?${query}` : ''}`, { method: 'GET' });
};

// Get Product Group Details
// GET /api/products/product-groups/{id}/
export const getProductGroup = (id) => {
  return apiRequest(`/product-groups/${id}/`, { method: 'GET' });
};

// Create Product Group
// POST /api/products/product-groups/
export const createProductGroup = (data) => {
  return apiRequest('/product-groups/', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Update Product Group
// PUT /api/products/product-groups/{id}/
export const updateProductGroup = (id, data) => {
  return apiRequest(`/product-groups/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// Delete Product Group
// DELETE /api/products/product-groups/{id}/
export const deleteProductGroup = (id) => {
  return apiRequest(`/product-groups/${id}/`, { method: 'DELETE' });
};

// Add Product to Group
// POST /api/products/product-groups/{id}/add_product/
export const addProductToGroup = (groupId, productId) => {
  return apiRequest(`/product-groups/${groupId}/add_product/`, {
    method: 'POST',
    body: JSON.stringify({ product_id: productId })
  });
};

// Remove Product from Group
// POST /api/products/product-groups/{id}/remove_product/
export const removeProductFromGroup = (groupId, productId) => {
  return apiRequest(`/product-groups/${groupId}/remove_product/`, {
    method: 'POST',
    body: JSON.stringify({ product_id: productId })
  });
};

// Get My Groups with Products
// GET /api/products/product-groups/my_groups_with_products/
export const getMyGroupsWithProducts = (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.status) {
    queryParams.append('status', params.status);
  }

  if (params.approved_only) {
    queryParams.append('approved_only', params.approved_only);
  }

  const query = queryParams.toString();
  return apiRequest(`/product-groups/my_groups_with_products/${query ? `?${query}` : ''}`, { method: 'GET' });
};
