// Agent Chat API Service
// Separate from direct messages. Mirrors messagesApi.js patterns, avoids touching existing flows.

import { API_BASE_URL } from '../utils/apiConfig';
import { authStorage } from './authApi';

const BASE_URL = '/api/messages';

// Helper to read a cookie value by name
const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

// Local apiRequest (FormData-safe)
const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const token = authStorage.getToken() || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
  const isSessionPlaceholder = token && token.startsWith('session_');
  const isFormData = options && options.body instanceof FormData;
  const method = (options?.method || 'GET').toUpperCase();
  const needsCsrf = isSessionPlaceholder && !['GET', 'HEAD', 'OPTIONS'].includes(method);

  const csrfToken = needsCsrf ? (getCookie('csrftoken') || getCookie('CSRF-TOKEN') || getCookie('XSRF-TOKEN')) : null;

  const defaultOptions = {
    credentials: 'include',
    headers: {
      // Let the browser set multipart boundaries for FormData
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      ...((token && !isSessionPlaceholder) ? { Authorization: `Bearer ${token}` } : {}),
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

  const res = await fetch(url, config);
  if (!res.ok) {
    let text = '';
    try { text = await res.text(); } catch {}
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch {}

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

// ===== Agent Chat: Rooms =====
export const listChatRooms = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/chat-rooms/${q ? `?${q}` : ''}`, { method: 'GET' });
};

// Admin only
export const createChatRoom = async ({ name, state, description, is_active = true }) => {
  const payload = { name, state, description, is_active };
  return apiRequest(`/chat-rooms/`, { method: 'POST', body: JSON.stringify(payload) });
};

// Admin only
export const broadcastRoomMessage = async (roomId, { content }) => {
  return apiRequest(`/chat-rooms/${roomId}/broadcast_message/`, { method: 'POST', body: JSON.stringify({ content }) });
};

// ===== Agent Chat: Messages =====
export const listChatMessages = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/chat-messages/${q ? `?${q}` : ''}`, { method: 'GET' });
};

// Add Chat Message: supports JSON (no file) and multipart/form-data (with file)
export const postChatMessage = async ({ room, room_id, roomId, content, attachment } = {}) => {
  // Resolve room id (must be a number)
  const rawRoom = room !== undefined && room !== null ? room
    : room_id !== undefined && room_id !== null ? room_id
    : roomId !== undefined && roomId !== null ? roomId
    : undefined;
  const roomNum = rawRoom !== undefined ? Number(rawRoom) : undefined;
  if (roomNum === undefined || Number.isNaN(roomNum)) {
    throw new Error('room/room_id/roomId must be a number');
  }

  // If a file is present, send multipart/form-data with keys: room, content, attachment
  if (attachment) {
    const form = new FormData();
    // Backend expects `room` here (not room_id)
    form.append('room', String(roomNum));
    if (content !== undefined && content !== null) form.append('content', content);
    // If a string (e.g., data URL or http URL) is passed, try to fetch and convert to Blob
    if (typeof attachment === 'string') {
      try {
        const res = await fetch(attachment);
        const blob = await res.blob();
        form.append('attachment', blob, 'attachment');
        form.append('attachment_name', 'attachment');
      } catch {
        // If conversion fails, skip the attachment rather than breaking the request
      }
    } else {
      form.append('attachment', attachment);
      if (attachment?.name) form.append('attachment_name', attachment.name);
    }
    return apiRequest(`/chat-messages/`, { method: 'POST', body: form });
  }

  // Otherwise send JSON. Accept any of room/room_id/roomId but serialize as backend-expected key: `room`.
  // Note: Some backends reject `roomId` and require `room` or `room_id`.
  const payload = { room: roomNum };
  if (content !== undefined && content !== null) payload.content = String(content);
  return apiRequest(`/chat-messages/`, { method: 'POST', body: JSON.stringify(payload) });
};

// Admin only
export const pinChatMessage = async (messageId) => apiRequest(`/chat-messages/${messageId}/pin_message/`, { method: 'POST' });

// ===== Agent Chat: Memberships =====
export const listChatMemberships = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiRequest(`/chat-memberships/${q ? `?${q}` : ''}`, { method: 'GET' });
};

// Admin only
export const createChatMembership = async ({ room, user, is_muted = false }) => {
  const payload = { room, user, is_muted };
  return apiRequest(`/chat-memberships/`, { method: 'POST', body: JSON.stringify(payload) });
};

// Owner or Admin
export const muteChatMembership = async (membershipId) => apiRequest(`/chat-memberships/${membershipId}/mute_room/`, { method: 'POST' });
