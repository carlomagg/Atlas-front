import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import { listGeneral } from '../services/productApi';
import { getCategoryDetail } from '../services/categoryApi';

function getThumb(p) {
  return (
    p?.primary_image_url ||
    p?.primary_image ||
    p?.thumbnail ||
    p?.thumb ||
    p?.image ||
    p?.images?.[0]?.url ||
    p?.media?.find?.(m => (m.media_type || m.type) === 'image')?.url ||
    ''
  );
}

export default function CategoryProducts() {
  const { id } = useParams();
  const navigate = useNavigate();
  const categoryId = useMemo(() => Number(id) || id, [id]);

  const [categoryName, setCategoryName] = useState('');
  const [loadingName, setLoadingName] = useState(false);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Load category name (best-effort)
  useEffect(() => {
    let abort = new AbortController();
    async function loadName() {
      if (!categoryId && categoryId !== 0) return;
      try {
        setLoadingName(true);
        const d = await getCategoryDetail(categoryId, { signal: abort.signal });
        if (d?.name) setCategoryName(d.name);
      } catch (_) {
        // ignore name errors
      } finally {
        setLoadingName(false);
      }
    }
    loadName();
    return () => abort.abort();
  }, [categoryId]);

  const mapProducts = useCallback((arr) => {
    return arr.map(p => {
      const rawRating = p?.average_rating ?? p?.avg_rating ?? p?.rating ?? p?.stars ?? 0;
      const rating = Number(rawRating) || 0;
      return {
        id: p.id,
        title: p.title || p.name || 'Untitled',
        thumb: getThumb(p),
        rating,
      };
    });
  }, []);

  // Initial load
  useEffect(() => {
    let abort = new AbortController();
    async function load() {
      if (!categoryId && categoryId !== 0) return;
      setLoading(true); setError('');
      try {
        const LIMIT = 12;
        const data = await listGeneral({ limit: LIMIT, page: 1, category: categoryId });
        const arr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        const mapped = mapProducts(arr);
        setItems(mapped);
        const totalCount = typeof data?.count === 'number' ? data.count : undefined;
        const next = data?.next;
        const has = Boolean(next) || (typeof totalCount === 'number' ? mapped.length < totalCount : mapped.length === LIMIT);
        setHasMore(has);
        setPage(1);
      } catch (e) {
        setError(e?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => abort.abort();
  }, [categoryId, mapProducts]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const LIMIT = 12;
      const nextPage = page + 1;
      const data = await listGeneral({ limit: LIMIT, page: nextPage, category: categoryId });
      const arr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const mapped = mapProducts(arr);
      let newLength = 0;
      setItems(prev => { const combined = [...prev, ...mapped]; newLength = combined.length; return combined; });
      const totalCount = typeof data?.count === 'number' ? data.count : undefined;
      const next = data?.next;
      const has = Boolean(next) || (typeof totalCount === 'number' ? newLength < totalCount : mapped.length === LIMIT);
      setHasMore(has);
      setPage(nextPage);
    } catch (e) {
      setError(e?.message || 'Failed to load more products');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <button className="text-sm text-gray-600 mb-4 hover:text-gray-800" onClick={() => navigate(-1)}>← Back</button>
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{categoryName || 'Products in Category'}</h2>
        {loadingName && <p className="text-gray-500 text-sm">Loading category…</p>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading && Array(8).fill().map((_, i) => (
          <div key={i} className="h-64 rounded-lg border animate-pulse bg-gray-50" />
        ))}
        {!loading && items.map((p, i) => (
          <ProductCard
            key={p.id || i}
            id={p.id}
            imageIndex={(i % 5) + 1}
            rating={p.rating ?? 0}
            imageUrl={p.thumb}
            title={p.title}
          />
        ))}
      </div>
      {error && <div className="text-sm text-red-600 mt-3 text-center">{error}</div>}
      {!loading && hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className={`px-6 py-2 rounded-lg border font-medium transition-colors ${loadingMore ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            {loadingMore ? 'Loading…' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
