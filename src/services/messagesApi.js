// Messaging API Service
// Handles inbox, sent, send, reply, mark read/unread, and notification counts

import { authStorage } from './authApi';

const BASE_URL = '/api/messages';

// Helper to read a cookie value by name
const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

// Local apiRequest mirroring authApi behavior (FormData-safe, attaches Authorization or CSRF for session)
const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const token = authStorage.getToken() || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
  const isSessionPlaceholder = token && token.startsWith('session_');
  const isFormData = options && options.body instanceof FormData;
  const method = (options?.method || 'GET').toUpperCase();
  const needsCsrf = isSessionPlaceholder && !['GET', 'HEAD', 'OPTIONS'].includes(method);

  // Try common CSRF cookie names
  const csrfToken = needsCsrf ? (getCookie('csrftoken') || getCookie('CSRF-TOKEN') || getCookie('XSRF-TOKEN')) : null;

  const defaultOptions = {
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      // Bearer for real tokens
      ...((token && !isSessionPlaceholder) ? { Authorization: `Bearer ${token}` } : {}),
      // CSRF for session-based requests
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
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

  // TEMP DEBUG: Inspect headers being sent
  try {
    const hdrs = config.headers || {};
    console.debug('[messagesApi] Request', {
      method,
      url,
      hasAuth: !!hdrs.Authorization,
      authPrefix: hdrs.Authorization ? String(hdrs.Authorization).slice(0, 20) + '…' : null,
      hasCsrf: !!hdrs['X-CSRFToken']
    });
  } catch {}

  const res = await fetch(url, config);
  if (!res.ok) {
    let text = '';
    try { text = await res.text(); } catch {}
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch {}

    // Flatten DRF-style errors into a user-friendly message list
    const flattenErrors = (errObj, prefix = '') => {
      const out = [];
      if (!errObj) return out;
      if (Array.isArray(errObj)) {
        errObj.forEach((val) => {
          if (typeof val === 'string') out.push(prefix ? `${prefix}: ${val}` : val);
          else if (typeof val === 'object' && val !== null) out.push(...flattenErrors(val, prefix));
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

    const candidates = [];
    if (data) {
      candidates.push(...flattenErrors(data));
      if (typeof data.message === 'string') candidates.push(data.message);
      if (typeof data.detail === 'string') candidates.push(data.detail);
      if (typeof data.error === 'string') candidates.push(data.error);
      if (Array.isArray(data.non_field_errors)) candidates.push(...data.non_field_errors);
    }
    if (!candidates.length && text && typeof text === 'string') candidates.push(text);

    const finalMessage = candidates.length ? candidates.join(' \n') : `${res.status} ${res.statusText}`;
    const err = new Error(finalMessage);
    try { console.warn('[messagesApi] Error response', { status: res.status, url, data, text }); } catch {}
    err.status = res.status;
    err.data = data;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
};

// Helper: convert a Blob/File to a data URL (base64)
const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  try {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(blob);
  } catch (e) { reject(e); }
});

// Messages
export const listInbox = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/messages/inbox/${q ? `?${q}` : ''}`, { method: 'GET' });
};

export const listSent = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/messages/sent/${q ? `?${q}` : ''}`, { method: 'GET' });
};

export const listAllMessages = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/messages/${q ? `?${q}` : ''}`, { method: 'GET' });
};

// Additional lists per spec
export const listFlagged = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/messages/flagged/${q ? `?${q}` : ''}`, { method: 'GET' });
};

export const listReported = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/messages/reported/${q ? `?${q}` : ''}`, { method: 'GET' });
};

export const listNotReplied = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/messages/not_replied/${q ? `?${q}` : ''}`, { method: 'GET' });
};

export const getMessage = async (id) => apiRequest(`/messages/${id}/`, { method: 'GET' });

export const sendMessage = async ({ subject, body, recipient, recipient_email, recipient_atlas_id, related_product, attachment } = {}) => {
  const payload = {};
  if (subject !== undefined && subject !== null) payload.subject = String(subject);
  if (body !== undefined && body !== null) payload.body = String(body);
  if (recipient) payload.recipient = String(recipient);
  if (recipient_email) payload.recipient_email = String(recipient_email);
  if (recipient_atlas_id) payload.recipient_atlas_id = String(recipient_atlas_id);
  if (related_product) payload.related_product = String(related_product);
  if (attachment) {
    if (typeof attachment === 'string') {
      // If already a data URL, pass through; if it's an http(s) URL, backend expects base64, so we pass as-is only if it's data:
      if (attachment.startsWith('data:')) {
        payload.attachment_base64 = attachment;
      } else {
        // Not a data URL; leave off to avoid invalid URL issues. Caller should provide a File or data URL.
        // Alternatively, you can implement fetch->blob->dataURL here if needed.
        payload.attachment_base64 = attachment; // assume it's already a valid data URL provided by caller
      }
      payload.attachment_filename = 'attachment';
    } else {
      const dataUrl = await blobToDataUrl(attachment);
      payload.attachment_base64 = dataUrl;
      payload.attachment_filename = String(attachment?.name || 'attachment');
    }
  }
  return apiRequest(`/messages/`, { method: 'POST', body: JSON.stringify(payload) });
};

export const replyMessage = async (id, { body, attachment } = {}) => {
  const payload = {};
  if (body !== undefined && body !== null) payload.body = String(body);
  if (attachment) {
    if (typeof attachment === 'string') {
      if (attachment.startsWith('data:')) {
        payload.attachment_base64 = attachment;
      } else {
        payload.attachment_base64 = attachment; // assume data URL provided
      }
      payload.attachment_filename = 'attachment';
    } else {
      const dataUrl = await blobToDataUrl(attachment);
      payload.attachment_base64 = dataUrl;
      payload.attachment_filename = String(attachment?.name || 'attachment');
    }
  }
  return apiRequest(`/messages/${id}/reply/`, { method: 'POST', body: JSON.stringify(payload) });
};

export const markRead = async (id) => apiRequest(`/messages/${id}/mark_as_read/`, { method: 'POST' });
export const markUnread = async (id) => apiRequest(`/messages/${id}/mark_as_unread/`, { method: 'POST' });
export const markSpam = async (id) => apiRequest(`/messages/${id}/mark_as_spam/`, { method: 'POST' });
export const flagMessage = async (id) => apiRequest(`/messages/${id}/flag/`, { method: 'POST' });
export const reportMessage = async (id) => apiRequest(`/messages/${id}/report/`, { method: 'POST' });
export const deleteMessage = async (id) => apiRequest(`/messages/${id}/`, { method: 'DELETE' });

// Notifications
export const getNotificationCounts = async () => apiRequest(`/notifications/counts/`, { method: 'GET' });

// Stats
export const getMessageStats = async () => apiRequest(`/messages/stats/`, { method: 'GET' });
