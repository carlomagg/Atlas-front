// Authentication API Service
// Make API base configurable: use env if provided, else default to '/api' for Vite dev proxy.
const RAW_API_BASE = (import.meta && import.meta.env && (import.meta.env.VITE_API_BASE_URL || import.meta.env.API_BASE_URL)) || '';
const BASE_URL = RAW_API_BASE ? RAW_API_BASE.replace(/\/$/, '') : '/api';  // e.g., 'http://34.239.228.72/api' or '/api'

// Enum constants matching the API requirements
export const TITLE_OPTIONS = ['MR', 'MRS', 'MS', 'MISS', 'DR'];
export const BUSINESS_TYPE_OPTIONS = ['ASSOCIATION', 'RETAILER', 'MANUFACTURER', 'DISTRIBUTOR', 'AGENT', 'SERVICE_PROVIDER'];

// Country codes (ISO 3166-1 alpha-2)
export const COUNTRY_OPTIONS = [
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' }
];

// Authentication token management
const TOKEN_KEY = 'atlas_auth_token';
const USER_KEY = 'atlas_user_data';

export const authStorage = {
  // Store authentication data
  setAuth: (token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    // Mirror to generic key used by axios interceptors in docs/examples
    try { localStorage.setItem('token', token); } catch {}
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    // Persist refresh token if present in userData structure for compatibility with refresh flows
    try {
      const refresh = userData?.refresh || userData?.refresh_token || userData?.tokens?.refresh;
      if (refresh) localStorage.setItem('refresh', refresh);
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent('atlas:auth-changed', { detail: { isAuthenticated: true } }));
    } catch {}
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get stored user data
  getUserData: () => {
    const userData = localStorage.getItem(USER_KEY);
    if (!userData) return null;
    try {
      return JSON.parse(userData);
    } catch (e) {
      console.warn('Failed to parse stored user data, preserving token and resetting user data only:', e);
      // If JSON is corrupted, remove only the user data, keep token so user stays logged in
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  // Clear authentication data
  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    // Also clear mirrored/simple keys used by axios examples
    try { localStorage.removeItem('token'); } catch {}
    try { localStorage.removeItem('refresh'); } catch {}
    localStorage.removeItem(USER_KEY);
    try {
      window.dispatchEvent(new CustomEvent('atlas:auth-changed', { detail: { isAuthenticated: false } }));
    } catch {}
  },

  // Debug function to check stored data
  debugAuth: () => {
    console.log('Auth Debug Info:', {
      token: localStorage.getItem(TOKEN_KEY),
      userData: localStorage.getItem(USER_KEY),
      isAuthenticated: !!localStorage.getItem(TOKEN_KEY)
    });
  }
};

// Submit business verification (requires authentication)
// Cloudinary upload helper (unsigned)
// Be lenient in reading config: support Vite-prefixed and non-prefixed env vars, plus per-call override
const ENV = (import.meta && import.meta.env) ? import.meta.env : {};
const DEFAULT_CLOUD = ENV.VITE_CLOUDINARY_CLOUD_NAME || ENV.CLOUDINARY_CLOUD_NAME || ENV.VITE_CLOUD_NAME || '';
const DEFAULT_PRESET = ENV.VITE_CLOUDINARY_UPLOAD_PRESET || ENV.CLOUDINARY_UPLOAD_PRESET || ENV.VITE_UPLOAD_PRESET || '';

const uploadToCloudinary = async (file, overrideCfg) => {
  if (!(file instanceof File)) return null;
  const cloudName = overrideCfg?.cloud_name || DEFAULT_CLOUD;
  const uploadPreset = overrideCfg?.upload_preset || DEFAULT_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary config missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET (or CLOUDINARY_CLOUD_NAME/CLOUDINARY_UPLOAD_PRESET).');
  }
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', uploadPreset);
  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText} ${t}`);
  }
  const data = await res.json();
  return data?.secure_url || data?.url || null;
};

export const submitBusinessVerification = async (payload) => {
  const cloudinaryOverride = payload?.cloudinary && typeof payload.cloudinary === 'object' ? payload.cloudinary : undefined;
  // Build JSON body per Postman schema; upload any Files to Cloudinary to get *_url values
  const body = {};

  // Business details
  if (payload.industry) body.industry = payload.industry;
  if (payload.company_legal_name) body.company_legal_name = payload.company_legal_name;
  if (payload.company_address) body.company_address = payload.company_address;
  if (payload.state) body.state = payload.state;
  if (payload.local_government) body.local_government = payload.local_government;
  if (payload.city) body.city = payload.city;
  if (payload.products_description) body.products_description = payload.products_description;
  if (payload.company_registration_number) body.company_registration_number = payload.company_registration_number;
  if (payload.incorporation_type) body.incorporation_type = payload.incorporation_type;

  // Certificate: prefer file -> Cloudinary URL, else accept provided URL if present
  if (payload.certificate_of_incorporation instanceof File) {
    body.certificate_of_incorporation_url = await uploadToCloudinary(payload.certificate_of_incorporation, cloudinaryOverride);
  } else if (payload.certificate_of_incorporation_url) {
    body.certificate_of_incorporation_url = payload.certificate_of_incorporation_url;
  }

  // Applicant details
  if (payload.are_you_an_owner_of_this_business) body.are_you_an_owner_of_this_business = payload.are_you_an_owner_of_this_business;
  if (payload.relationship_to_company) body.relationship_to_company = payload.relationship_to_company;
  if (payload.date_of_birth) body.date_of_birth = payload.date_of_birth;
  if (payload.country_of_citizenship) body.country_of_citizenship = payload.country_of_citizenship;
  if (payload.national_id_number) body.national_id_number = payload.national_id_number;
  if (payload.country_of_residence) body.country_of_residence = payload.country_of_residence;
  if (payload.home_address) body.home_address = payload.home_address;
  if (payload.applicant_state) body.applicant_state = payload.applicant_state;
  if (payload.applicant_local_government) body.applicant_local_government = payload.applicant_local_government;
  if (payload.applicant_city) body.applicant_city = payload.applicant_city;

  // Applicant photo: file -> Cloudinary URL, else provided URL
  if (payload.photo_id instanceof File) {
    body.photo_id_url = await uploadToCloudinary(payload.photo_id, cloudinaryOverride);
  } else if (payload.photo_id_url) {
    body.photo_id_url = payload.photo_id_url;
  }

  // Owners
  if (Array.isArray(payload.owners) && payload.owners.length) {
    const owners = await Promise.all(
      payload.owners.filter(Boolean).map(async (o) => {
        const out = {
          first_name: o.first_name || o.firstname || '',
          last_name: o.last_name || o.lastname || '',
          ownership_percentage: o.ownership_percentage,
          phone_number: o.phone_number,
          date_of_birth: o.date_of_birth,
          country_of_citizenship: o.country_of_citizenship,
          national_id_number: o.national_id_number,
          country_of_residence: o.country_of_residence,
          home_address: o.home_address,
          state: o.state,
          local_government: o.local_government,
          city: o.city,
          relationship_to_company: o.relationship_to_company,
        };
        if (o.photo_id instanceof File) {
          out.photo_id_url = await uploadToCloudinary(o.photo_id, cloudinaryOverride);
        } else if (o.photo_id_url) {
          out.photo_id_url = o.photo_id_url;
        }
        return out;
      })
    );
    body.owners = owners;
  }

  // POST JSON to backend
  return apiRequest('/auth/business-verification/apply/', {
    method: 'POST',
    body: JSON.stringify(body)
  });
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;

  // Get token for authenticated requests
  const token = authStorage.getToken();
  const isSessionPlaceholder = token && token.startsWith('session_');

  // Determine if we're sending FormData to avoid setting Content-Type manually
  const isFormData = options && options.body instanceof FormData;

  const defaultOptions = {
    // Include credentials so session cookies (if any) are sent along
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      'Accept': 'application/json',
      // Attach Authorization for any non-placeholder token (opaque or JWT)
      ...((token && !isSessionPlaceholder) ? { 'Authorization': `Bearer ${token}` } : {}),
    }
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };

  // Recursively flatten DRF-style error objects into ['field.path: message'] items
  const flattenErrors = (errObj, prefix = '') => {
    const out = [];
    if (!errObj) return out;
    if (Array.isArray(errObj)) {
      // Arrays can contain strings or nested objects
      errObj.forEach((val, idx) => {
        const p = prefix ? `${prefix}[${idx}]` : `[${idx}]`;
        if (typeof val === 'string') out.push(prefix ? `${prefix}: ${val}` : val);
        else if (typeof val === 'object' && val !== null) out.push(...flattenErrors(val, p));
      });
      return out;
    }
    if (typeof errObj === 'object') {
      for (const [key, val] of Object.entries(errObj)) {
        const p = prefix ? `${prefix}.${key}` : key;
        if (Array.isArray(val)) {
          val.forEach((v) => {
            if (typeof v === 'string') out.push(`${p}: ${v}`);
            else if (typeof v === 'object' && v !== null) out.push(...flattenErrors(v, p));
          });
        } else if (typeof val === 'object' && val !== null) {
          out.push(...flattenErrors(val, p));
        } else if (typeof val === 'string') {
          out.push(`${p}: ${val}`);
        }
      }
      return out;
    }
    return out;
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Handle global session expiration on Unauthorized
      if (response.status === 401) {
        // Check if this is a login attempt (don't treat login failures as session expiration)
        const isLoginAttempt = endpoint.includes('/auth/login/') || endpoint.includes('/register/');
        
        if (!isLoginAttempt) {
          // This is a session expiration for an authenticated user
          try {
            // Prevent multiple simultaneous redirects
            if (!window.__atlasSessionHandled401) {
              window.__atlasSessionHandled401 = true;
              // Clear any stored auth and inform user
              try { authStorage.clearAuth(); } catch {}
              // Show a non-blocking styled toast for consistency, then redirect
              try {
                const toast = document.createElement('div');
                toast.setAttribute('role', 'alert');
                toast.className = 'fixed top-4 right-4 max-w-sm bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg shadow-lg z-[9999] animate-[pulse_1.6s_ease-in-out_2]';
                toast.innerHTML = `
                  <div class="flex items-start">
                    <svg class="h-5 w-5 text-amber-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.6c.75 1.334-.213 3.001-1.743 3.001H3.482c-1.53 0-2.493-1.667-1.743-3.001l6.518-11.6zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a.75.75 0 01-.75-.75v-3.5a.75.75 0 011.5 0v3.5A.75.75 0 0110 12z" clip-rule="evenodd" />
                    </svg>
                    <div class="ml-3">
                      <p class="text-sm font-semibold text-amber-800">Session expired</p>
                      <p class="mt-1 text-sm text-amber-700">Please log in again. Redirecting…</p>
                    </div>
                  </div>`;
                document.body.appendChild(toast);
                setTimeout(() => { try { toast.remove(); } catch {} }, 4000);
              } catch {}
              // Delay a bit so the toast is visible, then redirect
              try { if (window.__atlasSession401Timer) { clearTimeout(window.__atlasSession401Timer); } } catch {}
              window.__atlasSession401Timer = setTimeout(() => {
                try { window.location.assign('/login'); } catch { window.location.href = '/login'; }
              }, 1800);
            }
          } catch {}
          // Create and throw a normalized error; execution likely interrupts due to redirect
          const err = new Error('Unauthorized: Session expired. Please log in again.');
          err.status = 401;
          throw err;
        }
        // For login attempts, fall through to normal error handling below
      }
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
      // Extract a user-friendly message with precise fields
      const messages = [];
      let parsedErrors = [];
      if (errorData) {
        // Prefer DRF-style flat errors
        parsedErrors = flattenErrors(errorData);
        if (parsedErrors.length) messages.push(...parsedErrors);
        // Fall back to top-level fields
        if (!messages.length) {
          if (typeof errorData.message === 'string') messages.push(errorData.message);
          else if (typeof errorData.detail === 'string') messages.push(errorData.detail);
          else if (typeof errorData.error === 'string') messages.push(errorData.error);
        }
      }
      // Fallback to raw text if present
      if (!messages.length && rawText && typeof rawText === 'string') messages.push(rawText);
      const finalMessage = messages.length ? messages.join(' \n') : `HTTP error! status: ${response.status} - ${response.statusText}`;
      const err = new Error(finalMessage);
      if (parsedErrors.length) err.parsedErrors = parsedErrors;
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

// Step 1: Initial registration - request OTP
export const registerInitial = async (email) => {
  return apiRequest('/auth/register/initial/', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

// Step 2: Verify OTP
export const verifyOTP = async (email, otp) => {
  console.log('Verifying OTP with payload:', { email, otp });
  try {
    const response = await apiRequest('/auth/register/verify-otp/', {
      method: 'POST',
      body: JSON.stringify({ 
        email: email.trim(),
        otp: otp.toString()
      })
    });
    console.log('OTP verification response:', response);
    return response;
  } catch (error) {
    console.error('OTP verification error:', error);
    throw new Error(error.message || 'Failed to verify OTP. Please try again.');
  }
};

// Step 3: Complete registration
export const completeRegistration = async (registrationData) => {
  const {
    password,
    confirmPassword,
    title,
    fullName,
    companyName,
    country,
    phoneNumber,
    businessType
  } = registrationData;

  // Validate required fields
  if (!password || !confirmPassword || !title || !fullName || !country || !phoneNumber || !businessType) {
    throw new Error('All required fields must be provided');
  }

  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }

  // Validate enums
  if (!TITLE_OPTIONS.includes(title)) {
    throw new Error(`Invalid title. Must be one of: ${TITLE_OPTIONS.join(', ')}`);
  }

  if (!BUSINESS_TYPE_OPTIONS.includes(businessType)) {
    throw new Error(`Invalid business type. Must be one of: ${BUSINESS_TYPE_OPTIONS.join(', ')}`);
  }

  // Find country code
  const countryObj = COUNTRY_OPTIONS.find(c => c.code === country || c.name === country);
  if (!countryObj) {
    throw new Error('Invalid country selection');
  }

  const payload = {
    email: registrationData.email.trim(),
    password,
    confirm_password: confirmPassword,
    title,
    full_name: fullName,
    company_name: companyName || '',
    country: countryObj.code,
    phone_number: phoneNumber,
    business_type: businessType,
    ...(registrationData.state ? { state: registrationData.state } : {}),
    ...(registrationData.referralCode ? { referral_code: registrationData.referralCode } : {})
  };

  console.log('Sending registration payload:', payload);

  try {
    const response = await apiRequest('/auth/register/complete/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    console.log('Complete registration response:', response);

    // Store authentication data if registration is successful
    if (response.token) {
      const userData = {
        email: email,
        atlasId: response.user?.atlas_id || email.split('@')[0],
        businessVerificationStatus: response.user?.business_verification_status || response.user?.business_status || response.user?.company_verification_status || 'PENDING',
        fullName: fullName,
        companyName: companyName,
        ...response.user
      };
      authStorage.setAuth(response.token, userData);
    }

    return response;
  } catch (error) {
    console.error('Complete registration error:', error);
    if (error.message.includes('Email not found or not verified')) {
      throw new Error('Please verify your email first before completing registration');
    }
    throw error;
  }
};

// Login endpoint
export const login = async (email, password) => {
  try {
    console.log('Attempting login with:', { email });
    const response = await apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    console.log('Login response:', response);
    console.log('Login response keys:', Object.keys(response));
    console.log('Login response structure:', JSON.stringify(response, null, 2));

    // Store authentication data if login is successful
    // Check for different possible token field names
    const token = response.token || response.access_token || response.access || response.auth_token;

    if (token) {
      console.log('Found token, storing authentication data...');
      const userData = {
        email: email,
        atlasId: response.user?.atlas_id || response.atlas_id || email.split('@')[0],
        businessVerificationStatus: response.user?.business_verification_status || response.user?.business_status || response.user?.company_verification_status || response.business_verification_status || response.business_status || response.company_verification_status || 'PENDING',
        ...response.user,
        ...response
      };
      console.log('Storing user data:', userData);
      authStorage.setAuth(token, userData);
      console.log('Authentication data stored successfully');
    } else {
      console.warn('No token found in login response. Response keys:', Object.keys(response));

      // Check if the response indicates success even without a token
      if (response.success || response.status === 'success' || response.message?.includes('success')) {
        console.log('Login appears successful but no token provided, storing session data...');
        const userData = {
          email: email,
          atlasId: response.user?.atlas_id || response.atlas_id || email.split('@')[0],
          businessVerificationStatus: response.user?.business_verification_status || response.user?.business_status || response.user?.company_verification_status || response.business_verification_status || response.business_status || response.company_verification_status || 'PENDING',
          ...response.user,
          ...response
        };
        // Use a session-based token if no JWT token is provided
        authStorage.setAuth('session_' + Date.now(), userData);
        console.log('Stored session-based authentication data');
      } else {
        console.error('Login response does not contain token or success indicator');
        throw new Error('Authentication failed - no token received');
      }
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Invalid email or password');
  }
};

// Resend OTP for registration
export const resendOTP = async (email) => {
  return apiRequest('/auth/register/resend-otp/', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

// Get current user profile (requires authentication)
export const getCurrentUser = async () => {
  try {
    const response = await apiRequest('/accounts/profile/', {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Get current user error:', error);
    // Important: Do NOT clear local auth here on 401.
    // Reason: This function is called during app init (see `context/AuthContext.jsx`).
    // If the server check fails (e.g., network hiccup or temporary 401),
    // clearing storage would log the user out on refresh even when a valid
    // token exists locally. Let the caller decide how to handle errors.
    throw error;
  }
};

// Logout function
export const logout = async () => {
  try {
    // Include refresh token if backend requires it
    const storedUserData = authStorage.getUserData();
    const refreshToken = storedUserData?.refresh || storedUserData?.refresh_token || storedUserData?.tokens?.refresh;

    // Call logout endpoint if it exists
    await apiRequest('/auth/logout/', {
      method: 'POST',
      ...(refreshToken ? { body: JSON.stringify({ refresh: refreshToken }) } : {})
    });
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue with local logout even if API call fails
  } finally {
    // Always clear local storage
    authStorage.clearAuth();
  }
};

// Forgot password - request OTP
export const forgotPassword = async (email) => {
  return apiRequest('/auth/forgot-password/', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

// Verify forgot password OTP
export const verifyForgotPasswordOTP = async (email, otp) => {
  return apiRequest('/auth/verify-forgot-password-otp/', {
    method: 'POST',
    body: JSON.stringify({ email, otp })
  });
};

// Reset password (after OTP verification)
export const resetPassword = async (newPassword, confirmPassword) => {
  return apiRequest('/auth/reset-password/', {
    method: 'POST',
    body: JSON.stringify({
      new_password: newPassword,
      confirm_password: confirmPassword
    })
  });
};

// Change password (for logged-in users)
export const changePassword = async (oldPassword, newPassword, confirmPassword) => {
  return apiRequest('/auth/change-password/', {
    method: 'POST',
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    })
  });
};

// Profile Management API Functions

// Get user profile
export const getUserProfile = async () => {
  try {
    const response = await apiRequest('/accounts/profile/', {
      method: 'GET'
    });
    // Normalize profile image fields for consumers
    const user = response.user || response;
    const profile_image = user.profile_image || user.profilePhoto || user.profile_photo || null;
    const profile_image_url = user.profile_image_url || user.profilePhotoUrl || user.profile_photo_url || user.profilePhoto || user.profile_photo || null;

    // Return the same shape but ensure keys exist
    return {
      ...response,
      user: {
        ...user,
        profile_image,
        profile_image_url
      },
      profile_image,
      profile_image_url
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    // Do NOT clear local auth here. This function may run during app init
    // via components like `BasicInfo.jsx` or `CompanyInfo.jsx`. Clearing auth
    // on a transient 401 would log the user out on refresh. Let the caller
    // decide how to handle 401s consistently with getCurrentUser().
    throw error;
  }
};

// Get company profile by user ID (for parent company lookup)
export const getCompanyProfileByUserId = async (userId) => {
  try {
    const response = await apiRequest(`/accounts/users/${userId}/profile/`, {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Get company profile by user ID error:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  // If FormData is provided (e.g., with profile photo), pass through directly
  if (profileData instanceof FormData) {
    try {
      const response = await apiRequest('/accounts/profile/', {
        method: 'PUT',
        // Important: do NOT set Content-Type; browser will set multipart boundary
        body: profileData
      });

      // Normalize response profile image fields
      const userResp = response.user || response;
      const norm_profile_image = userResp.profile_image || userResp.profilePhoto || userResp.profile_photo || null;
      const norm_profile_image_url = userResp.profile_image_url || userResp.profilePhotoUrl || userResp.profile_photo_url || userResp.profilePhoto || userResp.profile_photo || null;

      // Update stored user data with server response if present
      const currentUserData = authStorage.getUserData();
      if (currentUserData) {
        const updatedUserData = {
          ...currentUserData,
          ...response.user,
          ...response,
          state: response.user?.state ?? currentUserData.state,
          profile_image: norm_profile_image,
          profile_image_url: norm_profile_image_url
        };
        authStorage.setAuth(authStorage.getToken(), updatedUserData);
      }

      return {
        ...response,
        user: {
          ...(response.user || {}),
          profile_image: norm_profile_image,
          profile_image_url: norm_profile_image_url
        },
        profile_image: norm_profile_image,
        profile_image_url: norm_profile_image_url
      };
    } catch (error) {
      console.error('Update user profile (FormData) error:', error);
      throw error;
    }
  }

  // Otherwise treat as plain object and validate then send JSON
  const { title, fullName, companyName, country, phoneNumber, businessType, profile_image_url, social_links,
    backup_email, alternative_email, department, position, social_media_contact, website, state } = profileData;

  // Validate required fields
  if (!title || !fullName || !country || !phoneNumber || !businessType) {
    throw new Error('All required fields must be provided');
  }

  // Validate enums
  if (!TITLE_OPTIONS.includes(title)) {
    throw new Error(`Invalid title. Must be one of: ${TITLE_OPTIONS.join(', ')}`);
  }

  if (!BUSINESS_TYPE_OPTIONS.includes(businessType)) {
    throw new Error(`Invalid business type. Must be one of: ${BUSINESS_TYPE_OPTIONS.join(', ')}`);
  }

  // Find country code
  const countryObj = COUNTRY_OPTIONS.find(c => c.code === country || c.name === country);
  if (!countryObj) {
    throw new Error('Invalid country selection');
  }

  const payload = {
    title,
    full_name: fullName,
    company_name: companyName || '',
    country: countryObj.code,
    phone_number: phoneNumber,
    business_type: businessType,
    ...(state ? { state } : {}),
    ...(profile_image_url ? { profile_image_url } : {}),
    ...(backup_email ? { backup_email } : {}),
    ...(alternative_email ? { alternative_email } : {}),
    ...(department ? { department } : {}),
    ...(position ? { position } : {}),
    ...(social_media_contact ? { social_media_contact } : {}),
    ...(website ? { website } : {}),
    ...(social_links && Object.keys(social_links || {}).length > 0 ? { social_links } : {})
  };

  try {
    const response = await apiRequest('/accounts/profile/', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    // Normalize response image fields if server echoes them back
    const userResp = response.user || response;
    const norm_profile_image = userResp.profile_image || userResp.profilePhoto || userResp.profile_photo || null;
    const norm_profile_image_url = userResp.profile_image_url || userResp.profilePhotoUrl || userResp.profile_photo_url || userResp.profilePhoto || userResp.profile_photo || null;

    // Update stored user data
    const currentUserData = authStorage.getUserData();
    if (currentUserData) {
      const updatedUserData = {
        ...currentUserData,
        title,
        fullName,
        companyName,
        country: countryObj.code,
        phoneNumber,
        businessType,
        state: state || currentUserData.state,
        ...response.user,
        profile_image: norm_profile_image,
        profile_image_url: norm_profile_image_url
      };
      authStorage.setAuth(authStorage.getToken(), updatedUserData);
    }

    return {
      ...response,
      user: {
        ...(response.user || {}),
        profile_image: norm_profile_image,
        profile_image_url: norm_profile_image_url
      },
      profile_image: norm_profile_image,
      profile_image_url: norm_profile_image_url
    };
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

// Delete user account
export const deleteUserAccount = async (password) => {
  try {
    const response = await apiRequest('/accounts/profile/', {
      method: 'DELETE',
      body: JSON.stringify({ password })
    });

    // Clear authentication data after successful deletion
    authStorage.clearAuth();

    return response;
  } catch (error) {
    console.error('Delete user account error:', error);
    throw error;
  }
};

// Agent Application API Functions

// Submit agent application (requires authentication)
export const submitAgentApplication = async (applicationData) => {
  const {
    firstName,
    lastName,
    phoneNumber,
    email,
    address,
    state,
    bankName,
    accountNumber,
    idType,
    idNumber,
    idDocument,
    referralCode
  } = applicationData;

  // Validate required fields
  if (!firstName || !lastName || !phoneNumber || !email || !address || !state || !bankName || !accountNumber || !idType || !idNumber) {
    throw new Error('All required fields must be provided');
  }

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('first_name', firstName);
  formData.append('last_name', lastName);
  formData.append('phone_number', phoneNumber);
  formData.append('email', email);
  formData.append('address', address);
  formData.append('state', state);
  formData.append('bank_name', bankName);
  formData.append('account_number', accountNumber);
  formData.append('id_type', idType);
  formData.append('id_number', idNumber);
  // Optional referral code
  if (referralCode) {
    formData.append('referral_code', referralCode);
  }

  // Add file if provided
  if (idDocument) {
    formData.append('id_document', idDocument);
  }

  try {
    // Use centralized apiRequest which handles FormData, Authorization, and error normalization
    const data = await apiRequest('/auth/agents/apply/', {
      method: 'POST',
      body: formData
    });
    console.log('Agent application response:', data);
    return data;
  } catch (error) {
    console.error('Submit agent application error:', error);
    throw error;
  }
};

// List my agent applications
export const listMyAgentApplications = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/auth/agents/applications/${query ? `?${query}` : ''}`;
  return apiRequest(endpoint, { method: 'GET' });
};

// Get a specific application by ID
export const getAgentApplication = async (id) => {
  if (!id && id !== 0) throw new Error('Application ID is required');
  return apiRequest(`/auth/agents/applications/${id}/`, { method: 'GET' });
};

// Browse agents directory
export const listAgents = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/auth/agents/list/${query ? `?${query}` : ''}`;
  return apiRequest(endpoint, { method: 'GET' });
};

// Get agent details by ID
export const getAgentDetails = async (id) => {
  if (!id && id !== 0) throw new Error('Agent ID is required');
  return apiRequest(`/auth/agents/${id}/`, { method: 'GET' });
};

// Referral stats for logged-in agent
export const getAgentReferralStats = async () => {
  return apiRequest(`/auth/agents/referral-stats/`, { method: 'GET' });
};

// Referral earnings for logged-in agent
export const getAgentReferralEarnings = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/auth/agents/referral-earnings/${query ? `?${query}` : ''}`;
  return apiRequest(endpoint, { method: 'GET' });
};

// Get referral info (FREE - no payment needed)
export const getReferralInfo = async () => {
  return apiRequest(`/auth/agents/referral-info/`, { method: 'GET' });
};

// Legacy method for backward compatibility
export const getReferralPaymentStatus = async () => {
  console.log('⚠️ getReferralPaymentStatus is deprecated, using getReferralInfo instead');
  return getReferralInfo();
};

// Validate referral code (for registration)
export const validateReferralCode = async (referralCode) => {
  return apiRequest(`/auth/agents/validate-referral-code/`, {
    method: 'POST',
    body: JSON.stringify({ referral_code: referralCode })
  });
};

// Removed: purchaseOrExtendReferralLink - referral codes are now FREE!

// List users referred by me
export const listReferredUsers = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/auth/agents/referred-users/${query ? `?${query}` : ''}`;
  return apiRequest(endpoint, { method: 'GET' });
};

// Agent registers a new user
export const agentRegisterUser = async (payload) => {
  console.log('🔍 agentRegisterUser - Received payload:', payload);
  
  // Basic validation (backend also validates and returns field-specific 400s)
  const baseRequired = ['email', 'password', 'full_name', 'phone_number'];
  const baseMissing = baseRequired.filter((k) => !(k in payload) || payload[k] === '' || payload[k] == null);
  if (baseMissing.length) throw new Error(`Missing fields: ${baseMissing.join(', ')}`);

  // Determine if this registration intends the new user to be an agent
  const businessType = payload.business_type;
  const isAgentFlag = payload.is_agent;
  const hasAgentObj = !!payload.agent_application;
  const intendsAgent = (String(isAgentFlag).toLowerCase() === 'true' || isAgentFlag === true)
    || businessType === 'AGENT' || hasAgentObj;
  // Prefer JSON. If agent_application includes a File, try Cloudinary first; on failure or missing config, fall back to multipart/form-data.
  const jsonPayload = { ...payload };
  const cloudinaryOverride = payload?.cloudinary && typeof payload.cloudinary === 'object' ? payload.cloudinary : undefined;
  const maybeDoc = payload?.agent_application?.id_document;
  const hasFile = (typeof File !== 'undefined') && (maybeDoc instanceof File);

  let shouldSendMultipart = false;

  if (intendsAgent && jsonPayload.agent_application) {
    jsonPayload.agent_application = { ...jsonPayload.agent_application };
    if (hasFile) {
      try {
        // Attempt Cloudinary upload when config is available
        const url = await uploadToCloudinary(maybeDoc, cloudinaryOverride);
        if (url) {
          jsonPayload.agent_application.id_document_url = url;
          // Remove File reference; avoid server double-upload
          if (jsonPayload.agent_application.id_document instanceof File) {
            delete jsonPayload.agent_application.id_document;
          }
        } else {
          // No URL returned — fall back to multipart
          shouldSendMultipart = true;
        }
      } catch (e) {
        console.warn('Cloudinary upload failed, falling back to multipart/form-data for agentRegisterUser:', e);
        shouldSendMultipart = true;
      }
    }
  }

  // Normalize boolean-like is_agent to a primitive boolean where possible
  if (typeof jsonPayload.is_agent === 'string') {
    const v = jsonPayload.is_agent.toLowerCase();
    jsonPayload.is_agent = (v === 'true' || v === '1' || v === 'yes');
  }

  // If we still have a File present (Cloudinary not used), construct multipart with flattened nested keys
  if (shouldSendMultipart && intendsAgent && payload?.agent_application?.id_document instanceof File) {
    console.log('🔍 agentRegisterUser - Using FormData (multipart) submission');
    const fd = new FormData();
    // Base fields
    fd.append('email', String(payload.email ?? ''));
    fd.append('password', String(payload.password ?? ''));
    if (payload.confirm_password != null) fd.append('confirm_password', String(payload.confirm_password));
    if (payload.title != null) fd.append('title', String(payload.title));
    if (payload.full_name != null) fd.append('full_name', String(payload.full_name));
    if (payload.phone_number != null) fd.append('phone_number', String(payload.phone_number));
    if (payload.company_name != null) fd.append('company_name', String(payload.company_name));
    if (payload.country != null) fd.append('country', String(payload.country));
    if (payload.state != null) {
      console.log('🔍 agentRegisterUser - Adding state to FormData:', payload.state);
      fd.append('state', String(payload.state));
    }
    if (payload.business_type != null) fd.append('business_type', String(payload.business_type));
    if (payload.referral_code != null && payload.referral_code !== '') fd.append('referral_code', String(payload.referral_code));
    if (payload.is_agent != null) fd.append('is_agent', String(payload.is_agent));

    // Agent application (flattened)
    const aa = payload.agent_application || {};
    if (aa.first_name != null) fd.append('agent_application.first_name', String(aa.first_name));
    if (aa.last_name != null) fd.append('agent_application.last_name', String(aa.last_name));
    if (aa.phone_number != null) fd.append('agent_application.phone_number', String(aa.phone_number));
    if (aa.address != null) fd.append('agent_application.address', String(aa.address));
    if (aa.state != null) fd.append('agent_application.state', String(aa.state));
    if (aa.bank_name != null) fd.append('agent_application.bank_name', String(aa.bank_name));
    if (aa.account_number != null) fd.append('agent_application.account_number', String(aa.account_number));
    if (aa.id_type != null) fd.append('agent_application.id_type', String(aa.id_type));
    if (aa.id_number != null) fd.append('agent_application.id_number', String(aa.id_number));
    // File
    fd.append('agent_application.id_document', aa.id_document);

    return apiRequest(`/auth/agents/register-user/`, {
      method: 'POST',
      body: fd,
    });
  }

  // Default: JSON submission
  console.log('🔍 agentRegisterUser - Using JSON submission');
  console.log('🔍 agentRegisterUser - Final JSON payload:', jsonPayload);
  // Do not leak temporary client-only fields
  if (jsonPayload.cloudinary) {
    delete jsonPayload.cloudinary;
  }
  return apiRequest(`/auth/agents/register-user/`, {
    method: 'POST',
    body: JSON.stringify(jsonPayload),
  });
};
