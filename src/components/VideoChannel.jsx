import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAllProductVideos } from '../services/productApi';
import { resolveMediaUrl } from '../utils/media';

export default function VideoChannel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const data = await listAllProductVideos({ limit: 24 });
        const arr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        if (alive) setItems(arr);
      } catch (e) {
        console.error('Load global product videos failed', e);
        if (alive) setError(e?.message || 'Failed to load videos');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Video Channel</h1>
          <p className="text-gray-600">All product videos across the platform</p>
        </div>
        <Link to="/" className="text-[#027DDB] hover:underline text-sm">Back to Home</Link>
      </div>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array(9).fill(null).map((_, i) => (
            <div key={i} className="h-64 rounded-lg border bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((m, i) => {
            const product = m?.product || { id: m?.product_id };
            const company = m?.company || {};
            const videoUrl = resolveMediaUrl(m, { preferThumb: false }) || resolveMediaUrl(m?.file || m?.file_url || m?.asset || m?.video, { preferThumb: false });
            const poster = resolveMediaUrl({ thumbnail_url: m?.thumbnail_url || m?.thumb || m?.poster }, { preferThumb: true });
            const productId = product?.id || product?.pk || m?.product_id;
            const productTitle = product?.title || m?.title || 'Product Video';
            const companyName = company?.company_name || company?.name || 'Company';
            const atlasId = company?.atlas_id || '';
            return (
              <div
                key={m?.id || i}
                className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm"
                data-product-id={productId ?? ''}
                data-media-id={m?.id ?? ''}
              >
                <div className="relative bg-black">
                  {videoUrl ? (
                    <video
                      src={videoUrl}
                      controls
                      playsInline
                      preload="metadata"
                      poster={poster || undefined}
                      className="w-full h-56 object-contain bg-black"
                    />
                  ) : (
                    <div className="w-full h-56 flex items-center justify-center text-gray-500">No video URL</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-sm text-gray-500 mb-1">{companyName}{atlasId ? ` • ${atlasId}` : ''}</div>
                  <div className="font-semibold text-gray-900 line-clamp-2 mb-2">{productTitle}</div>
                  {productId ? (
                    <Link to={`/product/${productId}`} className="text-[#027DDB] hover:underline text-sm">View product</Link>
                  ) : null}
                </div>
              </div>
            );
          })}
          {!items.length && !error && (
            <div className="col-span-full text-center text-sm text-gray-600">No videos found.</div>
          )}
        </div>
      )}
    </div>
  );
}
