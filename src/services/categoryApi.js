// Category API Service for Mega Menu
// BASE for products endpoints (adjust if backend is mounted elsewhere)
const BASE = `${API_BASE_URL}/products/`;

import { API_BASE_URL } from '../utils/apiConfig';
import { authStorage } from './authApi';

async function apiGet(path, { signal } = {}) {
  const url = `${BASE}${path}`;
  const token = authStorage?.getToken?.();

  const doFetch = async (useAuth) => {
    const headers = useAuth
      ? { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
      : { 'Accept': 'application/json' };
    try { console.debug('[categoryApi] GET', path, useAuth ? '(retry auth)' : '(public)'); } catch {}
    return fetch(url, { method: 'GET', headers, credentials: 'include', signal });
  };

  // 1) Try public first
  let res = await doFetch(false);
  // 2) If unauthorized and we have a token, retry with Authorization
  if (res.status === 401 && token) {
    res = await doFetch(true);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let msg = `GET ${path} failed: ${res.status}`;
    try {
      const data = text ? JSON.parse(text) : {};
      msg = data.detail || data.message || msg;
    } catch {}
    const err = new Error(msg);
    err.status = res.status;
    err.raw = text;
    throw err;
  }
  return res.json();
}

export async function getRootCategories(options = {}) {
  return apiGet('categories/root_categories/', options);
}

export async function getCategoryDetail(id, options = {}) {
  if (!id && id !== 0) throw new Error('category id is required');
  return apiGet(`categories/${id}/`, options);
}

export async function listCategories(params = {}, options = {}) {
  const qs = new URLSearchParams(params).toString();
  const path = qs ? `categories/?${qs}` : 'categories/';
  return apiGet(path, options);
}

export async function listCategoryGroups(options = {}) {
  return apiGet('category-groups/', options);
}

export async function listCategoriesByGroupSlug(group_slug, options = {}) {
  if (!group_slug) throw new Error('group_slug is required');
  return apiGet(`categories/by_group/?group_slug=${encodeURIComponent(group_slug)}`, options);
}
