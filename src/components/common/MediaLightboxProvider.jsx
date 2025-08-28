import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Video from 'yet-another-react-lightbox/plugins/video';
import 'yet-another-react-lightbox/styles.css';

const MediaLightboxContext = createContext({
  open: (_items, _startIndex = 0) => {},
});

function toSlide(item) {
  // item: { type: 'image'|'video'|'pdf'|'iframe', src, thumb?, poster?, width?, height? }
  if (!item) return { src: '' };
  if (item.type === 'video') {
    return {
      type: 'video',
      sources: [{ src: item.src, type: 'video/mp4' }],
      poster: item.poster || item.thumb,
    };
  }
  if (item.type === 'pdf' || item.type === 'iframe') {
    // Use iframe slide for PDFs and generic iframes
    return { type: 'iframe', src: item.src, width: item.width || 1200, height: item.height || 800 };
  }
  // default image
  return { src: item.src };
}

export function MediaLightboxProvider({ children }) {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(-1); // -1 means closed

  const open = useCallback((items, index = 0) => {
    const s = (items || []).map(toSlide);
    setSlides(s);
    setIndex(Math.max(0, index || 0));
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <MediaLightboxContext.Provider value={value}>
      {children}
      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={slides}
        plugins={[Zoom, Fullscreen, Video]}
        controller={{ closeOnBackdropClick: true }}
      />
    </MediaLightboxContext.Provider>
  );
}

export function useMediaLightbox() {
  return useContext(MediaLightboxContext);
}
