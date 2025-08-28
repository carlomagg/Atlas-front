// API base URL configuration
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || '';
export const API_BASE_URL = RAW_API_BASE ? RAW_API_BASE.replace(/\/$/, '') : '/api';