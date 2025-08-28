// Privacy API service
// Focus: minimal wrapper around fetch that attaches Authorization from authStorage

import { authStorage } from './authApi';
import { API_BASE_URL } from '../utils/apiConfig';

const BASE_URL = API_BASE_URL;

const request = async (endpoint, { method = 'GET', body, headers = {} } = {}) => {
  const token = authStorage.getToken();
  const url = `${BASE_URL}${endpoint}`;
  const isFormData = body instanceof FormData;

  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      msg = data?.detail || data?.message || msg;
      const err = new Error(msg);
      err.data = data;
      err.status = res.status;
      throw err;
    } catch (e) {
      if (e instanceof Error) throw e;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
  }

  try {
    return await res.json();
  } catch {
    return {};
  }
};

// Endpoints per backend spec
const PRIVACY_ENDPOINT = '/auth/privacy/';

export const getPrivacySettings = async () => {
  // GET returns: { "privacy_setting": "ALL_MEMBERS" }
  return request(PRIVACY_ENDPOINT, { method: 'GET' });
};

export const updatePrivacySettings = async (privacySetting) => {
  // Accept either a string enum or an object; normalize to { privacy_setting: <ENUM> }
  const enumValue = typeof privacySetting === 'string'
    ? privacySetting
    : (privacySetting?.privacy_setting || privacySetting?.visibility || privacySetting);
  if (!enumValue || typeof enumValue !== 'string') throw new Error('Invalid privacy setting');
  // PATCH is preferred, PUT also supported by backend
  return request(PRIVACY_ENDPOINT, { method: 'PATCH', body: { privacy_setting: enumValue } });
};
