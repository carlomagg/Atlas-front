import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SuccessAlert from '../common/SuccessAlert';
import { listInbox, listSent, listFlagged, listReported, listNotReplied, getMessage, replyMessage, sendMessage, markRead, markUnread, markSpam, flagMessage, reportMessage, deleteMessage, getMessageStats } from '../../services/messagesApi';
import { listContactRequests, replyContactRequest, listProductRequests, replyProductRequest, closeProductRequest, deleteContactRequest, deleteProductRequest, getProductRequestWithReplies } from '../../services/productRequestApi';
import { retrieveProduct } from '../../services/productApi';
import { useAuth } from '../../context/AuthContext';
 

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm rounded-md border ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
  >
    {children}
  </button>
);

const Paginator = ({ page, setPage, hasNext, hasPrev }) => (
  <div className="flex items-center justify-end gap-2 mt-3">
    <button disabled={!hasPrev} onClick={() => setPage(p => Math.max(1, p - 1))} className={`px-3 py-1 text-sm rounded border ${hasPrev ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Prev</button>
    <span className="text-xs text-gray-500">Page {page}</span>
    <button disabled={!hasNext} onClick={() => setPage(p => p + 1)} className={`px-3 py-1 text-sm rounded border ${hasNext ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Next</button>
  </div>
);

// Chat Room UI removed

// Chat Room UI removed

// Chat Room UI removed

const MessageGuide = () => {
  const tabs = useMemo(() => ([
    { key: 'inbox', label: 'Inbox' },
    { key: 'sent', label: 'Sent' },
    { key: 'flagged', label: 'Flagged' },
    { key: 'reported', label: 'Reported' },
    { key: 'not_replied', label: 'Not Replied' },
    { key: 'contact', label: 'Contact Seller Requests' },
    { key: 'product', label: 'Product Requests' },
    { key: 'compose', label: 'Compose' },
  ]), []);

  const [active, setActive] = useState('inbox');
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  // Counts for request tabs
  const [requestCounts, setRequestCounts] = useState({ contact: 0, product: 0 });
  const [selected, setSelected] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyFile, setReplyFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [banner, setBanner] = useState({ type: '', message: '' }); // type: 'error' | 'success'
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [closing, setClosing] = useState(false);
  // Product Request participant routing (creator selects recipient)
  const [recipientId, setRecipientId] = useState('');
  // Cache for product titles (id -> title)
  const [productTitles, setProductTitles] = useState({});
  const [loadingTitles, setLoadingTitles] = useState(false);
  // Force list remount when data refreshes to avoid stale UI
  const [refreshTick, setRefreshTick] = useState(0);

  const { user } = useAuth();
  const currentUserId = user?.id || user?.user_id || user?.pk || user?.atlas_id || user?.atlasId || null;
  const { isOwner, ownerId } = useMemo(() => {
    if (!selected) return { isOwner: false, ownerId: null };
    const _ownerId = selected.owner_id || selected.user_id || selected.created_by_id || selected.created_by?.id || selected.owner?.id || selected.user?.id || null;
    const _isOwner = !!(currentUserId && _ownerId && String(currentUserId) === String(_ownerId));
    return { isOwner: _isOwner, ownerId: _ownerId };
  }, [selected, currentUserId]);

  // Build participant options from replies (unique senders)
  const participantOptions = useMemo(() => {
    if (!selected || !Array.isArray(selected.replies)) return [];
    const map = new Map();
    for (const m of selected.replies) {
      const sid = m?.sender_id ?? m?.sender ?? m?.user_id ?? m?.sender_atlas_id ?? m?.sender_details?.atlas_id ?? m?.sender_pk ?? null;
      if (!sid) continue;
      // Skip owner in list to avoid selecting self
      if (ownerId && String(sid) === String(ownerId)) continue;
      const labelParts = [];
      if (m?.sender_name) labelParts.push(m.sender_name);
      if (m?.sender_business_name) labelParts.push(m.sender_business_name);
      const labelBase = labelParts.filter(Boolean).join(' • ');
      const email = m?.sender_email;
      const label = labelBase || email || `User #${sid}`;
      if (!map.has(String(sid))) map.set(String(sid), { id: String(sid), label });
    }
    return Array.from(map.values());
  }, [selected, ownerId]);

  // Reset recipient when switching selected item
  useEffect(() => { setRecipientId(''); }, [selected?.id]);

  // Compose state
  const [cSubject, setCSubject] = useState('');
  const [cRecipientEmail, setCRecipientEmail] = useState('');
  const [cRecipientAtlasId, setCRecipientAtlasId] = useState('');
  const [cRelatedProduct, setCRelatedProduct] = useState('');
  const [cBody, setCBody] = useState('');
  const [cFile, setCFile] = useState(null);

  const limit = 10;

  // Guard to ensure only the latest fetch updates state
  const fetchSeqRef = useRef(0);

  const fetchData = async (opts = {}) => {
    const seq = ++fetchSeqRef.current;
    const tab = opts.tab ?? active;
    const p = opts.page ?? page;
    // Keep state in sync when an override is explicitly requested
    if (opts.page !== undefined) setPage(opts.page);
    setLoading(true);
    setError('');
    try {
      let data;
      if (tab === 'inbox') data = await listInbox({ page: p });
      else if (tab === 'sent') data = await listSent({ page: p });
      else if (tab === 'flagged') data = await listFlagged({ page: p });
      else if (tab === 'reported') data = await listReported({ page: p });
      else if (tab === 'not_replied') data = await listNotReplied({ page: p });
      else if (tab === 'contact') data = await listContactRequests({ page: p });
      else if (tab === 'product') data = await listProductRequests({ page: p });
      else data = { results: [], count: 0 };
      let results = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      // Ensure newest first for request tabs so new items are visible on page 1
      if (tab === 'product' || tab === 'contact') {
        try {
          results = [...results].sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
        } catch {}
      }
      // Ignore if a newer fetch has started
      if (seq !== fetchSeqRef.current) return;
      setItems(results);
      setCount(typeof data?.count === 'number' ? data.count : results.length);
      setRefreshTick((t) => t + 1);
      // If a row is selected, try to keep it in sync with refreshed list
      try {
        if (selected && results && results.length) {
          const found = results.find((it) => String(it.id) === String(selected.id));
          if (found) setSelected(found);
        }
      } catch {}
      // Refresh request counts when fetching any tab to keep badges fresh
      try {
        const [cRes, pRes] = await Promise.all([
          listContactRequests({ page: 1 }),
          listProductRequests({ page: 1 }),
        ]);
        const cCount = typeof cRes?.count === 'number' ? cRes.count : (Array.isArray(cRes?.results) ? cRes.results.length : (Array.isArray(cRes) ? cRes.length : 0));
        const pCount = typeof pRes?.count === 'number' ? pRes.count : (Array.isArray(pRes?.results) ? pRes.results.length : (Array.isArray(pRes) ? pRes.length : 0));
        setRequestCounts({ contact: cCount, product: pCount });
      } catch {}
    } catch (e) {
      if (seq !== fetchSeqRef.current) return;
      console.error('Load list failed', e);
      setError(e?.message || 'Failed to load');
      setItems([]); setCount(0);
    } finally {
      if (seq === fetchSeqRef.current) setLoading(false);
    }
  };

  const onToggle = async (field, checked) => {
    if (!selected) return;
    try {
      if (field === 'read') {
        if (checked) await markRead(selected.id); else await markUnread(selected.id);
      } else if (field === 'is_spam') {
        if (checked && !selected.is_spam) await markSpam(selected.id);
      } else if (field === 'is_flagged') {
        if (checked && !selected.is_flagged) await flagMessage(selected.id);
      } else if (field === 'is_reported') {
        if (checked && !selected.is_reported) await reportMessage(selected.id);
      } else {
        return;
      }
      const full = await getMessage(selected.id);
      setSelected(full);
      fetchData();
    } catch (e) {
      setBanner({ type: 'error', message: e?.message || 'Update failed' });
    }
  };

  const fetchStats = async () => {
    try {
      const s = await getMessageStats();
      setStats(s);
    } catch (e) {
      // non-blocking
    }
  };

  // Message actions (status/flags/delete)
  const onAction = async (action) => {
    if (!selected) return;
    try {
      if (action === 'read') await markRead(selected.id);
      else if (action === 'unread') await markUnread(selected.id);
      else if (action === 'spam') await markSpam(selected.id);
      else if (action === 'flag') await flagMessage(selected.id);
      else if (action === 'report') await reportMessage(selected.id);
      else if (action === 'delete') {
        // Handled by inline confirm UI
        return;
      }
      // refresh selected
      const full = await getMessage(selected.id);
      setSelected(full);
      fetchData();
    } catch (e) {
      setBanner({ type: 'error', message: e?.message || 'Action failed' });
    }
  };

  const onConfirmDelete = async () => {
    if (!selected) return;
    try {
      if (['inbox', 'sent', 'flagged', 'reported', 'not_replied'].includes(active)) {
        await deleteMessage(selected.id);
      } else if (active === 'contact') {
        await deleteContactRequest(selected.id);
      } else if (active === 'product') {
        // If backend supports deletion of product requests
        await deleteProductRequest(selected.id);
      } else {
        // Fallback: do nothing
        return;
      }
      setConfirmingDelete(false);
      setSelected(null);
      fetchData();
      setBanner({ type: 'success', message: 'Message deleted.' });
    } catch (e) {
      setBanner({ type: 'error', message: e?.message || 'Delete failed' });
    }
  };

  useEffect(() => { setPage(1); setSelected(null); }, [active]);
  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [active, page]);
  useEffect(() => { fetchStats(); }, []);

  // Refresh when a new product request is created elsewhere (e.g., Landing/ProductDetails)
  useEffect(() => {
    const onCreated = () => {
      // If currently on product tab, refetch page 1 immediately; else refresh counts
      if (active === 'product') {
        setSelected(null);
        fetchData({ tab: 'product', page: 1 });
        // Short delayed retry to mitigate eventual consistency or caching layers
        setTimeout(() => {
          fetchData({ tab: 'product', page: 1 });
        }, 1200);
      } else {
        fetchStats();
      }
    };
    try { window.addEventListener('atlas:product-request-created', onCreated); } catch {}
    return () => { try { window.removeEventListener('atlas:product-request-created', onCreated); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, page]);

  // Refresh when window/tab regains focus or becomes visible
  useEffect(() => {
    const onFocusOrVisible = () => { fetchData(); };
    try {
      window.addEventListener('focus', onFocusOrVisible);
      document.addEventListener('visibilitychange', onFocusOrVisible);
    } catch {}
    return () => {
      try {
        window.removeEventListener('focus', onFocusOrVisible);
        document.removeEventListener('visibilitychange', onFocusOrVisible);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, page]);

  // Periodic refresh while on request tabs to keep UI current without manual clicks
  useEffect(() => {
    if (!['product', 'contact'].includes(active)) return;
    const id = setInterval(() => { fetchData(); }, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, page]);

  // Read tab from query string (?tab=inbox|sent|flagged|reported|not_replied|contact|product|compose)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      const t = params.get('tab');
      if (!t) return;
      const allowed = new Set(tabs.map((x) => x.key));
      if (allowed.has(t) && t !== active) {
        setActive(t);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // When on contact tab, fetch missing product titles
  useEffect(() => {
    if (active !== 'contact' || !Array.isArray(items) || items.length === 0) return;
    const ids = Array.from(new Set(items.map((it) => it.product).filter((v) => !!v)));
    const missing = ids.filter((id) => !productTitles[id]);
    if (missing.length === 0) return;
    setLoadingTitles(true);
    (async () => {
      try {
        const entries = await Promise.all(missing.map(async (id) => {
          try {
            const p = await retrieveProduct(id);
            const title = p?.title || p?.name || `Product ${id}`;
            return [id, title];
          } catch {
            return [id, `Product ${id}`];
          }
        }));
        setProductTitles((prev) => {
          const next = { ...prev };
          for (const [id, title] of entries) next[id] = title;
          return next;
        });
      } finally {
        setLoadingTitles(false);
      }
    })();
  }, [active, items, productTitles]);

  const openItem = async (it) => {
    setSelected(it);
    // For messages tab, retrieve full thread if needed
    try {
      if (active === 'inbox' || active === 'sent') {
        const full = await getMessage(it.id);
        setSelected(full);
      } else if (active === 'product') {
        // Fetch full product request including nested replies so creators can see all responses
        const full = await getProductRequestWithReplies(it.id);
        setSelected(full);
      }
    } catch {}
  };

  const onSendReply = async () => {
    if (!selected) return;
    setSending(true);
    try {
      if (active === 'inbox' || active === 'sent') {
        await replyMessage(selected.id, { body: replyBody, attachment: replyFile });
        const full = await getMessage(selected.id);
        setSelected(full);
      } else if (active === 'contact') {
        await replyContactRequest(selected.id, { body: replyBody, attachment: replyFile });
      } else if (active === 'product') {
        const payload = { body: replyBody, attachment: replyFile };
        // If the current user is the request owner, recipient_id must be provided
        if (isOwner && recipientId) {
          payload.recipient_id = recipientId;
        }
        await replyProductRequest(selected.id, payload);
        // Refresh selected request including nested replies so the list updates immediately
        try {
          const full = await getProductRequestWithReplies(selected.id);
          setSelected(full);
        } catch {}
      }
      setReplyBody(''); setReplyFile(null);
      // optimistic refresh list
      fetchData();
      setBanner({ type: 'success', message: 'Reply sent successfully.' });
    } catch (e) {
      console.error('Send reply failed', e);
      setBanner({ type: 'error', message: e?.message || 'Failed to send reply' });
    } finally {
      setSending(false);
    }
  };

  const hasPrev = (page > 1);
  const hasNext = (page * limit < count);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Message Guide</h1>

      <div className="flex gap-2 mb-4 overflow-x-auto whitespace-nowrap">
        {tabs.map(t => {
          let badge = null;
          if (stats) {
            if (t.key === 'inbox' && typeof stats.unread_count === 'number' && stats.unread_count > 0) badge = stats.unread_count;
            if (t.key === 'flagged' && typeof stats.flagged_count === 'number' && stats.flagged_count > 0) badge = stats.flagged_count;
            if (t.key === 'reported' && typeof stats.reported_count === 'number' && stats.reported_count > 0) badge = stats.reported_count;
            if (t.key === 'not_replied' && typeof stats.not_replied_count === 'number' && stats.not_replied_count > 0) badge = stats.not_replied_count;
          }
          // Add badges for request tabs
          if (t.key === 'contact' && requestCounts.contact > 0) badge = requestCounts.contact;
          if (t.key === 'product' && requestCounts.product > 0) badge = requestCounts.product;
          return (
            <TabButton key={t.key} active={active === t.key} onClick={() => setActive(t.key)}>
              <span className="inline-flex items-center gap-2">
                <span>{t.label}</span>
                {badge ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-white">{badge}</span>
                ) : null}
              </span>
            </TabButton>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 border rounded-lg bg-white">
          <div className="p-3 border-b bg-gray-50 rounded-t-lg flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{active === 'inbox' ? 'Inbox' : active === 'sent' ? 'Sent' : active === 'flagged' ? 'Flagged' : active === 'reported' ? 'Reported' : active === 'not_replied' ? 'Not Replied' : active === 'contact' ? 'Contact Seller Requests' : active === 'product' ? 'Product Requests' : 'Compose'}</span>
          </div>
          <div className="p-3 max-h-[60vh] overflow-auto">
            {active !== 'compose' ? (
              <>
                {loading && <div className="text-sm text-gray-500">Loading...</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && !items.length && <div className="text-sm text-gray-500">No items</div>}
                {active === 'contact' ? (
                  <div className="space-y-2">
                    {/* Header (hidden on small screens) */}
                    <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-gray-500 hidden md:grid md:grid-cols-12 md:gap-2">
                      <div className="col-span-6">Product</div>
                      <div className="col-span-3">Sender</div>
                      <div className="col-span-1">Qty</div>
                      <div className="col-span-1">Unit</div>
                      <div className="col-span-1 text-right">Created</div>
                    </div>
                    <ul key={refreshTick} className="space-y-2">
                      {items.map((it) => {
                        const productName = it.product?.title || it.product_name || it.product_title || productTitles[it.product] || (it.title || it.name) || (it.id ? `Contact Request #${it.id}` : 'Untitled');
                        const qty = (it.quantity !== undefined && it.quantity !== null) ? it.quantity : '';
                        const unit = it.unit_type === 'others' ? (it.custom_unit || 'others') : (it.unit_type || '');
                        const preview = it.sourcing_details || it.details || it.body || it.preview || '';
                        const created = it.created_at ? new Date(it.created_at).toLocaleDateString() : '';
                        const sd = it.sender_details || {};
                        const senderName = [sd.first_name, sd.last_name].filter(Boolean).join(' ').trim();
                        const senderDisplay = senderName || sd.email || sd.atlas_id || (it.sender ? `User #${it.sender}` : '');
                        return (
                          <li key={it.id}>
                            <button onClick={() => openItem(it)} className={`w-full text-left p-2 rounded border hover:bg-gray-50 ${selected?.id === it.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                              {/* Desktop layout */}
                              <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-6 min-w-0">
                                  <div className="text-sm font-medium text-gray-800 truncate">{productName}</div>
                                  {preview ? (
                                    <div className="text-xs text-gray-500 truncate">{preview}</div>
                                  ) : null}
                                </div>
                                <div className="col-span-3 min-w-0">
                                  <div className="text-xs text-gray-800 truncate">{senderDisplay}</div>
                                </div>
                                <div className="col-span-1">
                                  <div className="text-xs text-gray-800">{qty}</div>
                                </div>
                                <div className="col-span-1">
                                  <div className="text-xs text-gray-800 truncate">{unit}</div>
                                </div>
                                <div className="col-span-1 text-right">
                                  <div className="text-[11px] text-gray-500">{created}</div>
                                </div>
                              </div>
                              {/* Mobile layout */}
                              <div className="md:hidden space-y-1">
                                <div className="text-sm font-medium text-gray-800 break-words">{productName}</div>
                                {preview ? (
                                  <div className="text-xs text-gray-500 break-words overflow-hidden max-h-10">{preview}</div>
                                ) : null}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-700">
                                  {senderDisplay ? <span className="truncate max-w-[60%]">{senderDisplay}</span> : null}
                                  {(qty || unit) ? <span className="text-gray-400">•</span> : null}
                                  {(qty || unit) ? <span>{qty} {unit}</span> : null}
                                  {created ? <span className="ml-auto text-[11px] text-gray-500">{created}</span> : null}
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <ul key={refreshTick} className="space-y-2">
                    {items.map((it) => (
                      <li key={it.id}>
                        <button onClick={() => openItem(it)} className={`w-full text-left p-2 rounded border hover:bg-gray-50 ${selected?.id === it.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                          <div className="text-sm font-medium text-gray-800 break-words">{it.product?.title || it.product_name || it.product_title || it.subject || it.title || it.name || (it.id ? `Contact Request #${it.id}` : 'Untitled')}</div>
                          <div className="text-xs text-gray-500 break-words overflow-hidden max-h-10">{it.body || it.details || it.preview || it.sourcing_details || ''}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <Paginator page={page} setPage={setPage} hasPrev={hasPrev} hasNext={hasNext} />
              </>
            ) : (
              <div className="text-sm text-gray-600">Fill the form on the right to compose a new message.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 border rounded-lg bg-white min-h-[50vh]">
          <div className="p-3 border-b bg-gray-50 rounded-t-lg">
            <span className="text-sm font-medium text-gray-700">{active === 'compose' ? 'Compose New Message' : 'Details'}</span>
          </div>
          <div className="p-4">
            {banner.message && (
              banner.type === 'success' ? (
                <SuccessAlert message={banner.message} onClose={() => setBanner({ type: '', message: '' })} />
              ) : (
                <div className="mb-3 rounded border px-3 py-2 text-sm border-red-300 bg-red-50 text-red-700">
                  {banner.message}
                </div>
              )
            )}
            {active === 'compose' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input value={cSubject} onChange={(e) => setCSubject(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Subject" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email</label>
                    <input value={cRecipientEmail} onChange={(e) => setCRecipientEmail(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Atlas ID (optional)</label>
                    <input value={cRecipientAtlasId} onChange={(e) => setCRecipientAtlasId(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="e.g. 123" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Provide at least one recipient: email or Atlas ID.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Related Product (optional, product ID)</label>
                  <input value={cRelatedProduct} onChange={(e) => setCRelatedProduct(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Product ID" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea value={cBody} onChange={(e) => setCBody(e.target.value)} rows={5} className="w-full border rounded p-2 text-sm" placeholder="Type your message..." />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <input type="file" onChange={(e) => setCFile(e.target.files?.[0] || null)} className="text-xs" />
                  <button
                    onClick={async () => {
                      setSending(true);
                      try {
                        await sendMessage({
                          subject: cSubject,
                          body: cBody,
                          recipient_email: cRecipientEmail || undefined,
                          recipient_atlas_id: cRecipientAtlasId || undefined,
                          related_product: cRelatedProduct || undefined,
                          attachment: cFile || undefined,
                        });
                        setCSubject(''); setCRecipientEmail(''); setCRecipientAtlasId(''); setCRelatedProduct(''); setCBody(''); setCFile(null);
                        setActive('sent');
                        setPage(1);
                        setBanner({ type: 'success', message: 'Message sent successfully.' });
                      } catch (e) {
                        // Log richer details to help diagnose 400 responses
                        // Expect e.status, e.data (flattened in messagesApi), and message
                        try {
                          // eslint-disable-next-line no-console
                          console.warn('Compose sendMessage failed', {
                            status: e?.status,
                            data: e?.data,
                            message: e?.message,
                          });
                        } catch {}
                        setBanner({ type: 'error', message: e?.message || 'Failed to send message' });
                      } finally {
                        setSending(false);
                      }
                    }}
                    disabled={sending || !cSubject.trim() || !cBody.trim() || (!cRecipientEmail.trim() && !cRecipientAtlasId.trim())}
                    className={`px-3 py-2 text-sm rounded-md text-white ${sending || !cSubject.trim() || !cBody.trim() || (!cRecipientEmail.trim() && !cRecipientAtlasId.trim()) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            ) : !selected ? (
              <div className="text-sm text-gray-500">Select an item to view details and reply.</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-base font-semibold text-gray-900">{(active === 'contact' && selected?.product && productTitles[selected.product]) ? productTitles[selected.product] : (selected.product?.title || selected.product_name || selected.product_title || selected.subject || selected.title || selected.name || (selected.id ? `Contact Request #${selected.id}` : 'Untitled'))}</div>
                  {/* Status and flags */}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    {selected.status && (
                      <span className="px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-700">Status: {String(selected.status)}</span>
                    )}
                    {false && active === 'product' && isOwner && String(selected.status) !== 'CLOSED' && (
                      <button
                        onClick={async () => {
                          setClosing(true);
                          try {
                            const updated = await closeProductRequest(selected.id);
                            setSelected(updated);
                            setBanner({ type: 'success', message: 'Request closed successfully.' });
                            fetchData();
                          } catch (e) {
                            setBanner({ type: 'error', message: e?.message || 'Failed to close request' });
                          } finally {
                            setClosing(false);
                          }
                        }}
                        disabled={closing}
                        className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-white text-xs ${closing ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                        title="Only the owner can close this request"
                      >
                        {closing ? 'Closing…' : 'Close Request'}
                      </button>
                    )}
                    {selected.has_reply && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Has reply</span>
                    )}
                    {active !== 'product' && selected.is_flagged && (
                      <span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">Flagged</span>
                    )}
                    {active !== 'product' && selected.is_spam && (
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Spam</span>
                    )}
                    {active !== 'product' && selected.is_reported && (
                      <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">Reported</span>
                    )}
                  </div>
                  {/* Status/flags checkboxes */}
                  {active !== 'product' && active !== 'contact' && (
                    <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={selected.status === 'read'} onChange={(e) => onToggle('read', e.target.checked)} />
                        <span>Read</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={!!selected.is_spam} disabled={!!selected.is_spam} onChange={(e) => onToggle('is_spam', e.target.checked)} />
                        <span>Is spam</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={!!selected.is_flagged} disabled={!!selected.is_flagged} onChange={(e) => onToggle('is_flagged', e.target.checked)} />
                        <span>Is flagged</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={!!selected.is_reported} disabled={!!selected.is_reported} onChange={(e) => onToggle('is_reported', e.target.checked)} />
                        <span>Is reported</span>
                      </label>
                      <label className="inline-flex items-center gap-2 col-span-2">
                        <input type="checkbox" checked={!!selected.has_reply} disabled />
                        <span>Has reply (server-set when a reply is created)</span>
                      </label>
                    </div>
                  )}
                  {/* Delete with inline confirmation */}
                  <div className="mt-2">
                    {!confirmingDelete ? (
                      <button onClick={() => setConfirmingDelete(true)} className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50 text-red-700">Delete</button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Delete this message? This is a soft delete.</span>
                        <button onClick={onConfirmDelete} className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700">Confirm delete</button>
                        <button onClick={() => setConfirmingDelete(false)} className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50">Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Thread/messages display (for messages) */}
                {Array.isArray(selected?.thread) && selected.thread.length > 0 && (
                  <div className="space-y-3">
                    {selected.thread.map((m) => {
                      const att = m?.attachment_url || m?.attachment_link || m?.attachment || m?.attachment_base64 || m?.attachment_file?.url;
                      const isDataUrl = typeof att === 'string' && att.startsWith('data:');
                      const isImage = typeof att === 'string' && (isDataUrl ? att.startsWith('data:image') : /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.svg)(\?.*)?$/i.test(att));
                      return (
                        <div key={m.id} className="border rounded p-2">
                          <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">{m.body}</div>
                          {att && (
                            <div className="mt-2">
                              {isImage ? (
                                <img src={att} alt="attachment" className="max-h-64 max-w-full h-auto w-auto rounded border" />
                              ) : (
                                <a href={att} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                  View attachment
                                </a>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">{new Date(m.created_at || m.timestamp || Date.now()).toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Product Request replies (show all when available) */}
                {active === 'product' && Array.isArray(selected?.replies) && selected.replies.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">Replies ({selected.replies.length})</div>
                    {selected.replies.map((m) => {
                      const att = m?.attachment_url || m?.attachment_link || m?.attachment || m?.attachment_base64 || m?.attachment_file?.url;
                      const isDataUrl = typeof att === 'string' && att.startsWith('data:');
                      const isImage = typeof att === 'string' && (isDataUrl ? att.startsWith('data:image') : /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.svg)(\?.*)?$/i.test(att));
                      // Sender display
                      const senderName = m?.sender_name || [m?.sender_first_name, m?.sender_last_name].filter(Boolean).join(' ').trim();
                      const senderDisplay = senderName || m?.sender_business_name || m?.sender_email || (m?.sender_id ? `User #${m.sender_id}` : 'Sender');
                      return (
                        <div key={m.id || m.pk || `${m.sender_id}-${m.created_at}`} className="border rounded p-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span className="font-medium text-gray-700 truncate">{senderDisplay}</span>
                            <span>{new Date(m.created_at || m.timestamp || Date.now()).toLocaleString()}</span>
                          </div>
                          <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">{m.message || m.body || ''}</div>
                          {att && (
                            <div className="mt-2">
                              {isImage ? (
                                <img src={att} alt="attachment" className="max-h-64 max-w-full h-auto w-auto rounded border" />
                              ) : (
                                <a href={att} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                  View attachment
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Contact Request summary (reflect backend fields) */}
                {active === 'contact' && selected && (
                  <div className="border rounded p-3 bg-white">
                    <div className="text-sm font-medium text-gray-700 mb-2">Request Details</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-start">
                        <div className="w-36 shrink-0 text-gray-500">Product</div>
                        <div className="text-gray-800 break-words">{productTitles[selected.product] || selected.product?.title || selected.product_name || selected.product_title || (selected.product ? `#${selected.product}` : '')}</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-36 shrink-0 text-gray-500">Quantity</div>
                        <div className="text-gray-800 break-words">{selected.quantity ?? ''}</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-36 shrink-0 text-gray-500">Unit type</div>
                        <div className="text-gray-800 break-words">{selected.unit_type === 'others' ? (selected.custom_unit || 'others') : (selected.unit_type || '')}</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-36 shrink-0 text-gray-500">Created</div>
                        <div className="text-gray-800 break-words">{selected.created_at ? new Date(selected.created_at).toLocaleString() : ''}</div>
                      </div>
                      {/* Sender section */}
                      <div className="flex items-start">
                        <div className="w-36 shrink-0 text-gray-500">Sender</div>
                        <div className="text-gray-800 break-words">
                          {(() => {
                            const sd = selected.sender_details || {};
                            const name = [sd.first_name, sd.last_name].filter(Boolean).join(' ').trim();
                            return name || sd.email || sd.atlas_id || (selected.sender ? `User #${selected.sender}` : '');
                          })()}
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-36 shrink-0 text-gray-500">Sender Email</div>
                        <div className="text-gray-800 break-words">{selected.sender_details?.email || ''}</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-36 shrink-0 text-gray-500">Sender Atlas ID</div>
                        <div className="text-gray-800 break-words">{selected.sender_details?.atlas_id || ''}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Base body/details */}
                {(selected.body || selected.details || selected.sourcing_details) && (
                  <div className="border rounded p-3 bg-gray-50 text-sm text-gray-800 whitespace-pre-wrap">
                    {selected.body || selected.details || selected.sourcing_details}
                  </div>
                )}
                {/* Product Request additional fields */}
                {active === 'product' && selected && (
                  (() => {
                    // Build rows of label/value pairs from possible fields
                    const pick = (v) => (v === null || v === undefined || v === '' ? '' : v);
                    const unit = selected.unit_type === 'others' ? (selected.custom_unit || 'others') : selected.unit_type;
                    const rows = [];
                    // Quantity fields
                    rows.push({ label: 'Quantity', value: pick(selected.quantity) });
                    rows.push({ label: 'Unit', value: pick(unit) });
                    rows.push({ label: 'Purchase Quantity', value: pick(selected.purchase_quantity) });
                    // Pricing/Budget
                    rows.push({ label: 'Budget', value: pick(selected.budget) });
                    rows.push({ label: 'Target Unit Price', value: pick(selected.target_unit_price) });
                    rows.push({ label: 'Max Budget', value: pick(selected.max_budget) });
                    rows.push({ label: 'Currency', value: pick(selected.currency) });
                    // Business meta
                    rows.push({ label: 'Business Type', value: pick(selected.business_type) });
                    rows.push({ label: 'Buying Frequency', value: pick(selected.buying_frequency) });
                    rows.push({ label: 'Time of Validity', value: pick(selected.time_of_validity) });
                    // Content and classification
                    rows.push({ label: 'Details', value: pick(selected.details || selected.sourcing_details) });
                    if (pick(selected.category_text)) {
                      rows.push({ label: 'Category', value: pick(selected.category_text) });
                    }
                    // Location texts (prefer *_text if present)
                    rows.push({ label: 'Country', value: pick(selected.country_text || selected.country) });
                    rows.push({ label: 'State', value: pick(selected.state_text) });
                    rows.push({ label: 'Local Government', value: pick(selected.local_government_text) });
                    rows.push({ label: 'City', value: pick(selected.city) });
                    // Intentionally omit boolean flags from display per request
                    // Clean out empty values
                    const clean = rows.filter(r => String(r.value).toString().trim() !== '');
                    if (clean.length === 0) return null;
                    return (
                      <div className="border rounded p-3 bg-white">
                        <div className="text-sm font-medium text-gray-700 mb-2">Request Details</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {clean.map((r, i) => (
                            <div key={i} className="flex items-start">
                              <div className="w-40 shrink-0 text-gray-500">{r.label}</div>
                              <div className="text-gray-800 break-words">{String(r.value)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}
                {/* Base attachment for selected item (if any) */}
                {(() => {
                  const att = selected?.attachment_url || selected?.attachment_link || selected?.attachment || selected?.attachment_base64 || selected?.attachment_file?.url;
                  if (!att) return null;
                  const isDataUrl = typeof att === 'string' && att.startsWith('data:');
                  const isImage = typeof att === 'string' && (isDataUrl ? att.startsWith('data:image') : /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.svg)(\?.*)?$/i.test(att));
                  return (
                    <div className="border rounded p-3 bg-white">
                      <div className="text-sm font-medium text-gray-700 mb-2">Attachment</div>
                      {isImage ? (
                        <img src={att} alt="attachment" className="max-h-72 rounded border" />
                      ) : (
                        <a href={att} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          View attachment
                        </a>
                      )}
                    </div>
                  );
                })()}

                {/* Reply box */}
                <div className="border-t pt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reply</label>
                  {active === 'product' && isOwner && (
                    <div className="mb-2">
                      <label className="block text-xs text-gray-600 mb-1">Participant</label>
                      <select
                        value={recipientId}
                        onChange={(e) => setRecipientId(e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                      >
                        <option value="">Select a participant…</option>
                        {participantOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {active === 'product' && (
                    <p className="text-xs text-gray-500 mb-2">Replies are private and will appear in your Inbox/Sent. They are not shown inline here.</p>
                  )}
                  <textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} rows={3} className="w-full border rounded p-2 text-sm" placeholder="Type your message..." />
                  <div className="flex items-center justify-between mt-2">
                    <input type="file" onChange={(e) => setReplyFile(e.target.files?.[0] || null)} className="text-xs" />
                    <button onClick={onSendReply} disabled={sending || !replyBody.trim() || (active === 'product' && isOwner && !recipientId)} className={`px-3 py-2 text-sm rounded-md text-white ${sending || !replyBody.trim() || (active === 'product' && isOwner && !recipientId) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{sending ? 'Sending...' : 'Send Reply'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageGuide;
