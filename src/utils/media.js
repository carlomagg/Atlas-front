// Central media utilities: robust Cloudinary-aware URL resolution

const getEnv = (key, fallback = '') => {
  try {
    // Vite-style import.meta.env
    if (typeof import.meta !== 'undefined' && import.meta && import.meta.env && key in import.meta.env) {
      return import.meta.env[key] ?? fallback;
    }
  } catch (e) {
    // noop
  }
  return fallback;
};

// Extract a product thumbnail prioritizing primary image and section files, with robust fallbacks
export const getProductThumb = (p) => {
  if (!p) return null;

  // 1) Primary image fields (string URL or object with url/public_id)
  try {
    if (p.primary_image) {
      const url = typeof p.primary_image === 'string'
        ? resolveMediaUrl({ url: p.primary_image }, { preferThumb: true })
        : resolveMediaUrl(p.primary_image, { preferThumb: true });
      if (url) return url;
    }
  } catch {}

  // 2) Common direct single-field locations (string or nested)
  const directKeys = [
    'thumbnail_url', 'thumbnail', 'image_url', 'product_image_url', 'cover_image_url',
    'thumb', 'img', 'image', 'asset.url', 'asset.secure_url'
  ];
  const direct = pick(p, directKeys);
  if (direct) {
    const url = resolveMediaUrl({ url: direct }, { preferThumb: true });
    if (url) return url;
  }

  // 3) Detail: media array with objects { file, media_type, is_primary }
  if (Array.isArray(p.media) && p.media.length) {
    const images = p.media.filter(m => (m?.media_type || '').toString().toLowerCase().startsWith('image'));
    const primary = images.find(m => m?.is_primary) || images[0] || p.media.find(m => m?.is_primary) || p.media[0];
    const url = resolveMediaUrl(primary, { preferThumb: true });
    if (url) return url;
  }

  // 4) Section file arrays (first viable image-like entry) - detail only
  const sectionKeys = [
    'description_files',
    'specification_files',
    'production_capacity_files',
    'packaging_delivery_files',
    'benefits_files',
    'others_files',
    'customer_feedback_files',
    'questions_answers_files',
  ];
  for (const key of sectionKeys) {
    const arr = p?.[key];
    if (Array.isArray(arr) && arr.length) {
      for (const item of arr) {
        const url = typeof item === 'string'
          ? resolveMediaUrl({ url: item }, { preferThumb: true })
          : resolveMediaUrl(item, { preferThumb: true });
        if (url) return url;
      }
    }
  }

  // 5) Fallback to media array (supports other shapes via getMediaArray)
  const arr = getMediaArray(p);
  const primary = getPrimaryMedia(arr);
  return resolveMediaUrl(primary, { preferThumb: true });
};

// Align with company components which use VITE_CLOUDINARY_CLOUD
const CLOUDINARY_CLOUD = getEnv('VITE_CLOUDINARY_CLOUD', getEnv('VITE_CLOUDINARY_CLOUD_NAME', ''));

// Safely pick the first non-empty string among many nested paths
const pick = (obj, paths) => {
  for (const p of paths) {
    try {
      const val = p.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
      if (typeof val === 'string' && val.trim()) return val.trim();
    } catch {}
  }
  return null;
};

// Construct a Cloudinary URL from public_id when only identifiers are returned.
const buildCloudinaryUrl = (m, { thumb = false } = {}) => {
  const publicId = m?.public_id;
  if (!publicId || typeof publicId !== 'string') return null;
  const resourceType = m?.resource_type === 'video' ? 'video' : 'image';
  if (!CLOUDINARY_CLOUD) return null;
  const base = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/${resourceType}/upload`;
  // Default thumbnail transformation
  const transform = thumb
    ? (resourceType === 'video' ? 'so_0,c_fill,w_400,h_300,q_auto,f_auto' : 'c_fill,w_400,h_300,q_auto,f_auto')
    : 'q_auto,f_auto';
  const fmt = m?.format ? `.${m.format}` : '';
  return `${base}/${transform}/${publicId}${fmt}`;
};

export const resolveMediaUrl = (m, { preferThumb = true } = {}) => {
  if (!m) return null;

  // Support raw string URL entries
  if (typeof m === 'string') {
    const s = m.trim();
    if (!s) return null;
    if (s.startsWith('http') || s.startsWith('data:')) return s;
    if (s.startsWith('//')) return (typeof window !== 'undefined' ? window.location.protocol : 'https:') + s;
    const withSlash = s.startsWith('/') ? s : `/${s}`;
    return (typeof window !== 'undefined' ? window.location.origin : '') + withSlash;
  }

  // Prefer Cloudinary explicit URLs
  const candidates = [
    ...(preferThumb ? ['thumbnail_url', 'thumbnail.secure_url', 'thumbnail.url'] : []),
    'secure_url',
    'url',
    'file',
    'image',
    'src',
    'path',
    'file_url',
    // Nested common places
    'asset.secure_url',
    'asset.url',
    'file.secure_url',
    'file.url',
  ];
  let cand = pick(m, candidates);

  // Try constructing from Cloudinary public_id if needed
  if (!cand) {
    cand = buildCloudinaryUrl(m, { thumb: preferThumb }) || null;
  }

  if (!cand || typeof cand !== 'string') return null;
  const s = cand.trim();
  if (s.startsWith('http') || s.startsWith('data:')) return s;
  if (s.startsWith('//')) return (typeof window !== 'undefined' ? window.location.protocol : 'https:') + s;
  const withSlash = s.startsWith('/') ? s : `/${s}`;
  return (typeof window !== 'undefined' ? window.location.origin : '') + withSlash;
};

// Normalize to HTTPS to avoid mixed-content issues in production
// Safe client-side stopgap; real fix should force secure URLs from backend/CDN
export const toHttps = (u) => {
  try {
    if (!u || typeof u !== 'string') return u;
    const lower = u.toLowerCase();
    // Only upgrade known CDN that must be https in production
    if (lower.startsWith('http://res.cloudinary.com/')) {
      return u.replace('http://', 'https://');
    }
    return u;
  } catch {
    return u;
  }
};

export const getMediaArray = (p) => {
  const candidates = [
    p?.media,
    p?.images,
    p?.media_items,
    p?.media_set,
    p?.media?.results,
    p?.images?.results,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) return c;
  }
  // return empty array if none
  return Array.isArray(p) ? p : [];
};

export const getPrimaryMedia = (arr) => {
  if (!Array.isArray(arr) || !arr.length) return null;
  const isImage = (m) => {
    const t = (m?.media_type || m?.type || '').toString().toLowerCase();
    if (t) return t === 'image' || t.startsWith('image/');
    // heuristics based on extension
    const u = resolveMediaUrl(m, { preferThumb: true }) || '';
    return /(\.png|\.jpe?g|\.webp|\.gif)(\?.*)?$/i.test(u);
  };
  // 1) explicit primary image
  const primaryImage = arr.find(m => m?.is_primary && isImage(m));
  if (primaryImage) return primaryImage;
  // 2) any image
  const anyImage = arr.find(isImage);
  if (anyImage) return anyImage;
  // 3) explicit primary (even if not image)
  const primaryAny = arr.find(m => m?.is_primary);
  if (primaryAny) return primaryAny;
  // 4) fallback first
  return arr[0];
};

// Aggregate image URLs from various optional product file arrays and primary image
// Backends sometimes expose section-specific arrays like `description_files`, each containing URLs (strings)
// We collect all image-like URLs for gallery display
export const collectProductImageUrls = (p) => {
  if (!p) return [];
  const urls = [];

  // 1) primary_image can be a direct URL string
  try {
    if (typeof p.primary_image === 'string' && p.primary_image.trim()) urls.push(p.primary_image.trim());
    if (typeof p.primary_image_url === 'string' && p.primary_image_url.trim()) urls.push(p.primary_image_url.trim());
  } catch {}

  // 2) media arrays (existing logic) -> only images
  try {
    const arr = getMediaArray(p) || [];
    for (const m of arr) {
      const u = resolveMediaUrl(m, { preferThumb: false });
      if (u) urls.push(u);
    }
  } catch {}

  // 3) optional section file arrays: may be arrays of strings (absolute URLs)
  const sectionKeys = [
    'description_files',
    'specification_files',
    'production_capacity_files',
    'packaging_delivery_files',
    'benefits_files',
    'others_files',
    'customer_feedback_files',
    'questions_answers_files',
  ];
  for (const key of sectionKeys) {
    try {
      const arr = p[key];
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (typeof item === 'string' && item.trim()) urls.push(item.trim());
          else if (item && typeof item === 'object') {
            const u = resolveMediaUrl(item, { preferThumb: false });
            if (u) urls.push(u);
          }
        }
      }
    } catch {}
  }

  // 4) de-duplicate while preserving order and filter images only
  const seen = new Set();
  const isImageUrl = (u) => {
    if (!u || typeof u !== 'string') return false;
    const s = u.trim().toLowerCase();
    // Exclude obvious non-image file types
    if (/\.(pdf|docx?|pptx?|xlsx?|zip|rar|7z|csv|txt)(\?.*)?$/.test(s)) return false;
    // Common image extensions
    if (/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/.test(s)) return true;
    // Cloudinary explicit image delivery (allow images without file extension)
    if (s.includes('res.cloudinary.com') && /\/image\/upload/.test(s)) return true;
    // Heuristic: data URLs for images
    if (s.startsWith('data:image/')) return true;
    // Otherwise, be conservative (do not treat generic URLs without indicators as images)
    return false;
  };
  const result = [];
  for (const u of urls) {
    if (!isImageUrl(u)) continue;
    if (!seen.has(u)) { seen.add(u); result.push(u); }
  }

  // If our image heuristic filtered everything out, return all URLs as a fallback
  return result.length ? result : Array.from(new Set(urls));
};
