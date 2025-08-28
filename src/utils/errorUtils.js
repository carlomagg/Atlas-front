// Utility to consistently extract a readable message from various error shapes
export function getErrorMessage(err) {
  if (!err) return 'An unknown error occurred';

  // If it's a standard Error with message
  if (typeof err.message === 'string' && err.message.trim()) return err.message.trim();

  // If backend payload attached
  const data = err.data || err.response?.data || err.body;
  const candidates = [];

  if (data) {
    if (Array.isArray(data.errors)) {
      const msgs = data.errors
        .map(e => (e && (e.message || e.detail || e.code)) || '')
        .filter(Boolean);
      if (msgs.length) candidates.push(...msgs);
    }
    if (typeof data.message === 'string') candidates.push(data.message);
    if (typeof data.detail === 'string') candidates.push(data.detail);
    if (typeof data.error === 'string') candidates.push(data.error);

    if (candidates.length === 0 && typeof data === 'object') {
      const flat = Object.values(data).flat().filter(v => typeof v === 'string');
      if (flat.length) candidates.push(...flat);
    }
  }

  if (candidates.length) return candidates.join(' ');

  // As a last resort
  if (typeof err === 'string') return err;
  try { return JSON.stringify(err); } catch { return 'Request failed'; }
}
