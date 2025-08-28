import React from 'react';
import { useMediaLightbox } from './MediaLightboxProvider';

function detectType(src, explicit) {
  if (explicit) return explicit;
  const s = String(src || '').toLowerCase();
  if (/(\.mp4|\.webm|\.ogg|\.mov)(\?|#|$)/.test(s)) return 'video';
  if (/(\.pdf)(\?|#|$)/.test(s)) return 'pdf';
  if (/(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.svg)(\?|#|$)/.test(s)) return 'image';
  // default to image to allow unknown but typically images
  return 'image';
}

// Props:
// - src: string (required)
// - type: 'image'|'video'|'pdf' optional
// - thumb/poster: string optional
// - className: string for thumbnail element
// - children: optional custom thumb element to render
// - onErrorFallback: optional node for thumbnail error; defaults to small link
export default function MediaItem({ src, type, thumb, poster, className = 'w-full h-24 object-cover rounded', children, onErrorFallback }) {
  const { open } = useMediaLightbox();
  const resolvedType = detectType(src, type);

  const handleClick = (e) => {
    e.preventDefault();
    const item = resolvedType === 'pdf'
      ? { type: 'pdf', src, thumb, width: '1200px', height: '80vh' }
      : resolvedType === 'video'
        ? { type: 'video', src, thumb, poster }
        : { type: 'image', src, thumb };
    open([item], 0);
  };

  const fallback = onErrorFallback || (
    <a href={src} target="_blank" rel="noreferrer" className="text-blue-600 text-xs underline">Open file</a>
  );

  // Default thumbnail rendering
  if (children) {
    return (
      <button type="button" onClick={handleClick} className="block w-full text-left">
        {children}
      </button>
    );
  }

  if (resolvedType === 'video') {
    // Show poster or a video element thumbnail
    return (
      <button type="button" onClick={handleClick} className="block w-full">
        {poster || thumb ? (
          <img src={poster || thumb} alt="video" className={className} onError={(e) => { e.currentTarget.replaceWith(fallback); }} />
        ) : (
          <video className={className} src={src} onError={(e) => { e.currentTarget.replaceWith(fallback); }} />
        )}
      </button>
    );
  }

  // image/pdf
  return (
    <button type="button" onClick={handleClick} className="block w-full">
      <img src={thumb || src} alt={resolvedType} className={className} onError={(e) => { e.currentTarget.replaceWith(fallback); }} />
    </button>
  );
}
