// Import the API base URL and create our own authenticated request function
import { authStorage } from './authApi';
import { API_BASE_URL } from '../utils/apiConfig';

// Helper function to make authenticated API requests
const authApiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Get token for authenticated requests
  const token = authStorage.getToken();
  
  // Don't set Content-Type for FormData - let browser set it with boundary
  const isFormData = options.body instanceof FormData;
  
  const defaultOptions = {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  };

  const config = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorJson.detail || 'Request failed';
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Upload image for rich text editor content
 * This function handles image uploads from rich text editors
 * @param {File} file - The image file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<string>} - Returns the uploaded image URL
 */
export const uploadRichTextImage = async (file, options = {}) => {
  try {
    // Validate file
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file provided');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed.');
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('image', file);

    // Upload to your backend endpoint (new clean global endpoint)
    const response = await authApiRequest('/upload/rich-text-image/', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary
    });

    if (response.success && response.image_url) {
      console.log('✅ Image uploaded successfully:', {
        url: response.image_url,
        fileName: response.file_name,
        size: response.file_size,
        dimensions: `${response.width}x${response.height}`,
        format: response.format
      });
      return response.image_url;
    } else {
      throw new Error(response.error || 'Upload failed');
    }
  } catch (error) {
    console.error('❌ Rich text image upload failed:', error);
    throw error;
  }
};

/**
 * Upload multiple images for rich text editor content
 * @param {File[]} files - Array of image files to upload
 * @param {Object} options - Upload options
 * @returns {Promise<string[]>} - Returns array of uploaded image URLs
 */
export const uploadMultipleRichTextImages = async (files, options = {}) => {
  try {
    const uploadPromises = files.map(file => uploadRichTextImage(file, options));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple rich text image upload failed:', error);
    throw error;
  }
};

/**
 * Delete uploaded rich text image
 * @param {string} imageUrl - The image URL to delete
 * @returns {Promise<boolean>} - Returns true if successful
 */
export const deleteRichTextImage = async (imageUrl) => {
  try {
    const response = await authApiRequest('/api/upload/rich-text-image/delete/', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: imageUrl }),
    });

    return response.success || true;
  } catch (error) {
    console.error('Rich text image deletion failed:', error);
    throw new Error(error.message || 'Failed to delete image');
  }
};

/**
 * Get image upload limits and settings
 * @returns {Promise<Object>} - Returns upload configuration
 */
export const getRichTextImageUploadConfig = async () => {
  try {
    const response = await authApiRequest('/api/upload/rich-text-image/config/', {
      method: 'GET',
    });

    return {
      maxFileSize: response.max_file_size || 5 * 1024 * 1024, // 5MB default
      allowedFormats: response.allowed_formats || ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxImagesPerProduct: response.max_images_per_product || 50,
      ...response
    };
  } catch (error) {
    console.warn('Could not fetch upload config, using defaults:', error);
    return {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxImagesPerProduct: 50
    };
  }
};
