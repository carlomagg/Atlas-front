import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import Logo from './common/Logo';
import ContactModal from './common/ContactModal';
import SuccessAlert from './common/SuccessAlert';
import { retrieveProduct, listReviews, createReview, deleteReview } from '../services/productApi';
import { getMediaArray, resolveMediaUrl, collectProductImageUrls } from '../utils/media';
import { useMediaLightbox } from './common/MediaLightboxProvider.jsx';
import { useAuth } from '../context/AuthContext';
import { sendMessage } from '../services/messagesApi';
import { createProductRequest } from '../services/productRequestApi';

function Badge({ children, color = 'bg-blue-50 text-blue-700 border-blue-200' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${color}`}>
      {children}
    </span>
  );
}

// ContactModal moved to shared component: './common/ContactModal'

function CompanyInfoCard({ companyLogo, companyName, badges = [] }) {
  return (
    <div className="bg-white rounded-md shadow-sm border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <img src={companyLogo || '/images/img_image_2.png'} alt="company" className="w-10 h-10 rounded object-cover" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-800 flex items-center gap-1">
            {companyName || '—'}
            <span className="text-slate-400">›</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.isArray(badges) && badges.length > 0 ? (
              badges.map((b, i) => (
                <Badge key={i} color={b.color}>
                  {b.icon}
                  <span>{b.label}</span>
                </Badge>
              ))
            ) : (
              <>
                <Badge>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M12 2 2 7l10 5 10-5-10-5Zm0 7L2 4v13l10 5 10-5V4l-10 5Z" />
                  </svg>
                  <span>Member</span>
                </Badge>
                <Badge color="bg-violet-50 text-violet-700 border-violet-200">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M12 2 3 7v7a8.99 8.99 0 0 0 9 9 8.99 8.99 0 0 0 9-9V7l-9-5Zm-1 15-4-4 1.414-1.414L11 13.172l5.586-5.586L18 9l-7 8Z" />
                  </svg>
                  <span>Verified</span>
                </Badge>
              </>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-600">
            {/* Optional: business type/summary could appear here if needed */}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, right, children }) {
  return (
    <div className="bg-white rounded-md shadow-sm border border-slate-200">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
        <h3 className="text-slate-800 font-semibold">{title}</h3>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MediaGallery({ items }) {
  const [active, setActive] = useState(0);
  const { open } = useMediaLightbox();
  const hasItems = Array.isArray(items) && items.length > 0;
  const current = hasItems ? items[active] : null;
  const slides = hasItems ? items.map((it) => (
    it.type === 'video' ? { type: 'video', src: it.url } : { type: 'image', src: it.url }
  )) : [];
  return (
    <div>
      <button
        type="button"
        onClick={() => hasItems && open(slides, active)}
        className="w-full h-[360px] md:h-[380px] overflow-hidden rounded-md border border-slate-200 bg-white flex items-center justify-center"
      >
        {hasItems ? (
          current.type === 'video' ? (
            <video src={current.url} controls className="w-full h-full object-contain bg-black" />
          ) : (
            <img
              src={current.url}
              alt="product"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null; // prevent loop
                e.currentTarget.src = '/images/img_image_2.png';
              }}
            />
          )
        ) : (
          <div className="text-sm text-slate-500">No media</div>
        )}
      </button>
      {hasItems && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); open(slides, i); }}
              className={`relative w-16 h-16 rounded-md border overflow-hidden focus:outline-none ${
                i === active
                  ? 'border-[#027DDB] ring-2 ring-[#027DDB]/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {it.type === 'video' ? (
                <>
                  <div className="w-full h-full bg-black/70 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                  </div>
                </>
              ) : (
                <img
                  src={it.url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // hide broken thumb to avoid showing alt text
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SellerCard({ onContact, name, role, avatarUrl, onAffiliateClick, onLeaveMessageClick }) {
  return (
    <div className="bg-white rounded-md shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h3 className="text-slate-800 font-semibold">{`Contact ${role || 'Supplier'}`}</h3>
        {/* small doc icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400">
          <path d="M19 2H8a2 2 0 0 0-2 2v2H5a2 2 0 0 0-2 2v10a4 4 0 0 0 4 4h11a3 3 0 0 0 3-3V4a2 2 0 0 0-2-2Zm-1 18H7a2 2 0 0 1-2-2V8h1v8a2 2 0 0 0 2 2h10v2Zm0-4H8V4h10v12Z" />
        </svg>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Profile row */}
        <div className="flex items-center gap-3">
          <img src={avatarUrl || '/images/img_image_2.png'} alt="contact" className="w-10 h-10 rounded object-cover" />
          <div>
            <div className="text-sm font-semibold text-slate-800">{name || '—'}</div>
            <div className="text-xs text-slate-500">{role || 'Supplier'}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-2">
          {/* Contact Now */}
          <button onClick={() => onContact && onContact()} className="w-full h-10 rounded-md bg-[#027DDB] text-white text-sm font-medium hover:brightness-95 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.236-7.445 5.209a1.5 1.5 0 0 1-1.11.245 1.5 1.5 0 0 1-1.11-.245L3 8.236V6l8 5.6L20 6v2.236Z" />
            </svg>
            Contact Now
          </button>

          {/* Leave a message like an input */}
          <button type="button" onClick={() => onLeaveMessageClick && onLeaveMessageClick()} className="w-full h-10 rounded-md border border-slate-300 bg-slate-50 text-slate-600 text-sm px-3 flex items-center gap-2 hover:bg-slate-100 cursor-pointer text-left">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M20 2H4a2 2 0 0 0-2 2v14l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
            </svg>
            Leave a message
          </button>

          {/* Affiliate Request */}
          <button onClick={() => onAffiliateClick && onAffiliateClick()} className="w-full h-10 rounded-md bg-[#027DDB] text-white text-sm font-medium hover:brightness-95">
            Send Affiliate Request
          </button>
        </div>
      </div>
    </div>
  );
}

function KeyInfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-12 gap-3 py-2 text-sm">
      <div className="col-span-4 text-slate-500">{label}</div>
      <div className="col-span-8 text-slate-800">{value}</div>
    </div>
  );
}

function CertificatesGrid({ urls = [] }) {
  if (!Array.isArray(urls) || urls.length === 0) {
    return <div className="text-sm text-slate-500">No certificates uploaded.</div>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {urls.map((src, i) => (
        <div key={i} className="rounded-md border border-slate-200 overflow-hidden">
          <img src={src} alt={`cert-${i}`} className="w-full h-36 object-cover" />
        </div>
      ))}
    </div>
  );
}

// Generic media thumbnail grid that opens items in the lightbox
function MediaThumbGrid({ items = [], emptyText = 'No files uploaded.' }) {
  const { open } = useMediaLightbox();
  const media = Array.isArray(items) ? items.map((it) => {
    const url = it?.url || it?.file || it;
    if (!url) return null;
    const isVideo = /\/video\//.test(String(url)) || /\.(mp4|webm|ogg)(\?|$)/i.test(String(url));
    // Lightbox expects { type: 'image'|'video', src: string }
    return { type: isVideo ? 'video' : 'image', src: url };
  }).filter(Boolean) : [];
  if (media.length === 0) return <div className="text-sm text-slate-500">{emptyText}</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {media.map((m, i) => (
        <button
          key={i}
          type="button"
          onClick={() => open(media, i)}
          className="relative rounded-md border border-slate-200 overflow-hidden focus:outline-none"
        >
          {m.type === 'video' ? (
            <div className="w-full h-36 bg-black/70 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
            </div>
          ) : (
            <img src={m.src} alt={`file-${i}`} className="w-full h-36 object-cover" />
          )}
        </button>
      ))}
    </div>
  );
}

function BasicInfoTable({ specs = [] }) {
  const rows = Array.isArray(specs) ? specs.filter(r => r && (r.name || r.value)) : [];
  if (rows.length === 0) return <div className="text-sm text-slate-500">No specifications provided.</div>;
  const Cell = ({ label, value }) => (
    <div className="grid grid-cols-5">
      <div className="col-span-2 px-3 py-2 text-slate-600 text-sm border-r border-slate-200">{label}</div>
      <div className="col-span-3 px-3 py-2 text-slate-800 text-sm">{value}</div>
    </div>
  );
  return (
    <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
      {rows.map((r, i) => (
        <div key={i} className={`border-b border-slate-200 last:border-b-0`}>
          <Cell label={r.name || '-'} value={r.value || '-'} />
        </div>
      ))}
    </div>
  );
}

function TabCard({ tabs, active, onChange, right, children }) {
  return (
    <div className="bg-white rounded-md shadow-sm border border-slate-200">
      <div className="px-5 pt-2">
        <div className="flex items-end justify-between border-b border-slate-200">
          <div className="flex items-center gap-6">
            {tabs.map((t, idx) => (
              <button
                key={t}
                onClick={() => onChange(idx)}
                className={`-mb-px px-1 pb-3 text-sm font-medium transition-colors ${
                  active === idx
                    ? 'text-[#027DDB] border-b-2 border-[#027DDB]'
                    : 'text-slate-600 hover:text-slate-700 border-b-2 border-transparent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {right}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function RelatedProducts() {
  const items = [
    { id: 1, title: 'Copper Wire 2.5mm', price: '$3.80', img: '/images/img_image_3.png' },
    { id: 2, title: 'Flexible Cable 10m', price: '$6.20', img: '/images/img_image_2.png' },
    { id: 3, title: 'Industrial Cable', price: '$12.00', img: '/images/img_image_3.png' },
    { id: 4, title: 'Insulated Wire', price: '$4.50', img: '/images/img_image_2.png' },
  ];
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((p) => (
        <div key={p.id} className="rounded-md border border-slate-200 bg-white">
          <img src={p.img} alt={p.title} className="w-full h-36 object-cover rounded-t-md" />
          <div className="p-3">
            <div className="text-sm text-slate-700 line-clamp-2">{p.title}</div>
            <div className="mt-1 font-semibold text-slate-900">{p.price}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductDetailsNew() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const [highlightedReviewId, setHighlightedReviewId] = useState(null);
  const reviewsRefs = useRef({});
  const hasUserReview = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    return reviews.some((rv) => (rv.user_id === user.id) || (rv.user && rv.user.id === user.id));
  }, [isAuthenticated, user, reviews]);
  const loadReviews = async (productId, { limit = 50 } = {}) => {
    setReviewsLoading(true); setReviewError('');
    try {
      const data = await listReviews(productId, { limit, ordering: '-created_at' });
      const arr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      setReviews(arr);
    } catch (e) {
      console.error('Load reviews failed', e);
      setReviewError(e?.message || 'Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  // Prefer full name when available for reviewer name
  const getReviewerName = (rv) => {
    if (!rv) return 'Anonymous';
    const u = rv.user || {};
    const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
    const byFields = [
      rv.user_full_name,
      full || null,
      u.full_name,
      u.name,
      rv.user_name,
      rv.user_display,
      u.username,
      (u.email && u.email.split('@')[0]),
    ].filter(Boolean);
    return byFields[0] || 'Anonymous';
  };
  const mediaItems = useMemo(() => {
    const items = [];
    // Prefer collected primary images first
    const collectedImgs = collectProductImageUrls(product);
    if (Array.isArray(collectedImgs) && collectedImgs.length) {
      collectedImgs.forEach((u) => items.push({ type: 'image', url: u }));
    }
    // Then append any remaining media (images/videos)
    const m = getMediaArray(product);
    m.forEach((raw) => {
      const type = raw?.media_type || (raw?.is_video ? 'video' : (raw?.type || 'image'));
      const url = resolveMediaUrl(raw, { preferThumb: false });
      if (!url) return;
      // Avoid duplicates for images already in collected list
      if (type === 'image' && items.some(it => it.url === url)) return;
      if (type === 'image' || type === 'video') items.push({ type, url });
    });
    return items;
  }, [product]);
  
  // Compute a simple Minimum Order text for the title panel
  const minOrderText = useMemo(() => {
    const val = product?.min_order || product?.minimum_order || product?.moq || product?.minimum_order_quantity;
    const unit = product?.min_order_unit || product?.order_unit || product?.unit;
    if (val !== null && val !== undefined && String(val).toString().trim() !== '') {
      return `${val}${unit ? ` ${unit}` : ''} (Min. Order)`;
    }
    // Dummy placeholder; replace with real data later
    return '100 Meters (Min. Order)';
  }, [product]);

  // Preview specific text sections under the title in this order and append a few specification pairs
  const specPreview = useMemo(() => {
    const stripHtml = (s) => String(s).replace(/<[^>]*>/g, ' ');
    const getOrFallback = (val, emptyMsg) => {
      if (val === null || val === undefined) return emptyMsg;
      if (typeof val === 'string') {
        const plain = stripHtml(val).replace(/\s+/g, ' ').trim();
        return plain ? val.trim() : emptyMsg;
      }
      if (typeof val === 'number' && !Number.isNaN(val)) return String(val);
      if (Array.isArray(val)) {
        const joined = val.map((x) => (x && typeof x === 'object' ? Object.values(x).join(' ') : String(x))).join(', ');
        const plain = joined.replace(/\s+/g, ' ').trim();
        return plain || emptyMsg;
      }
      if (typeof val === 'object') {
        const cand = val.text || val.value || val.content || JSON.stringify(val);
        const plain = stripHtml(cand).replace(/\s+/g, ' ').trim();
        return plain || emptyMsg;
      }
      return emptyMsg;
    };
    const rows = [];
    // Prepend product meta the user requested
    rows.push(
      { label: 'Product Type', value: getOrFallback(product?.product_type, '—') },
      { label: 'Article/Model No', value: getOrFallback(product?.article_model_no, '—') },
      { label: 'Benefits', value: getOrFallback(product?.benefits, 'No benefits provided.') },
    );
    // Show Packaging & Delivery (with fallback)
    rows.push(
      { label: 'Packaging & Delivery', value: getOrFallback(product?.packaging_delivery, 'No packaging and delivery information provided.') },
    );
    // Exclude 'Specification' from the preview entirely per request
    // Append grouped name/value specification pairs (merge duplicate names and join values)
    const specPairs = (() => {
      const arr = Array.isArray(product?.specifications) ? product.specifications : [];
      if (arr.length === 0) return [];
      const titleCase = (s) => {
        if (!s) return '-';
        const str = String(s).trim();
        return str.charAt(0).toUpperCase() + str.slice(1);
      };
      const map = new Map(); // key: lowercased name, value: { label, values: Set, order }
      let order = 0;
      for (const r of arr) {
        const rawName = r?.name ?? '';
        const key = String(rawName).trim().toLowerCase();
        if (key === 'color') continue; // exclude Color from preview
        const val = getOrFallback(r?.value, '—');
        if (!map.has(key)) {
          map.set(key, { label: titleCase(rawName || '-'), values: new Set(), order: order++ });
        }
        if (val && val !== '—') {
          map.get(key).values.add(String(val));
        }
      }
      const grouped = Array.from(map.values())
        .sort((a, b) => a.order - b.order)
        .slice(0, 6)
        .map((g) => ({ label: g.label, value: Array.from(g.values).join(', ') || '—' }));
      return grouped;
    })();
    return [...rows, ...specPairs];
  }, [product]);
  // 0 = Product description, 1 = Company info (default active per design)
  const [tab, setTab] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [affiliateOpen, setAffiliateOpen] = useState(false);
  // Send Message modal state
  const [smOpen, setSmOpen] = useState(false);
  const [smSubject, setSmSubject] = useState('');
  const [smRecipientEmail, setSmRecipientEmail] = useState('');
  const [smRecipientAtlasId, setSmRecipientAtlasId] = useState('');
  const [smBody, setSmBody] = useState('');
  const [smFile, setSmFile] = useState(null);
  const [smSending, setSmSending] = useState(false);
  const [smError, setSmError] = useState('');
  const [smSuccess, setSmSuccess] = useState('');
  // Placeholder: swap to 'Manufacturer' if a manufacturer logs in
  const roleLabel = 'Supplier';
  const location = useLocation();
  const navigate = useNavigate();
  // Message form state (Company Info tab)
  const [msgFromEmail, setMsgFromEmail] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [msgSuccess, setMsgSuccess] = useState('');
  // Product Request modal state (mirror LandingPage)
  const [prOpen, setPrOpen] = useState(false);
  const [prSubmitting, setPrSubmitting] = useState(false);
  const [prError, setPrError] = useState('');
  const [prSuccess, setPrSuccess] = useState('');
  const [prProductName, setPrProductName] = useState('');
  const [prQuantity, setPrQuantity] = useState('');
  const [prUnitType, setPrUnitType] = useState('pieces');
  const [prCustomUnit, setPrCustomUnit] = useState('');
  const [prCountry, setPrCountry] = useState('');
  const [prCity, setPrCity] = useState('');
  const [prDetails, setPrDetails] = useState('');
  const [prFiles, setPrFiles] = useState([]);
  const [prBudget, setPrBudget] = useState('');
  const [prCurrency, setPrCurrency] = useState('USD');
  const [prIsBuyer, setPrIsBuyer] = useState(true);
  const [prIsSupplier, setPrIsSupplier] = useState(false);
  const [prOnlyPaid, setPrOnlyPaid] = useState(false);
  const [prAllowAll, setPrAllowAll] = useState(true);
  // New spec fields
  const [prBusinessType, setPrBusinessType] = useState('');
  const [prPurchaseQty, setPrPurchaseQty] = useState('');
  const [prTimeValidity, setPrTimeValidity] = useState('');
  const [prPieceUnit, setPrPieceUnit] = useState('');
  const [prBuyingFrequency, setPrBuyingFrequency] = useState('');
  const [prTargetUnitPrice, setPrTargetUnitPrice] = useState('');
  const [prMaxBudget, setPrMaxBudget] = useState('');
  const [prCategoryText, setPrCategoryText] = useState('');
  const successRef = useRef(null);

  const resetPR = () => {
    setPrProductName('');
    setPrQuantity('');
    setPrUnitType('pieces');
    setPrCustomUnit('');
    setPrCountry('');
    setPrCity('');
    setPrDetails('');
    setPrFiles([]);
    setPrBudget('');
    setPrCurrency('USD');
    setPrIsBuyer(false);
    setPrIsSupplier(false);
    setPrOnlyPaid(false);
    setPrAllowAll(true);
    setPrBusinessType('');
    setPrPurchaseQty('');
    setPrTimeValidity('');
    setPrPieceUnit('');
    setPrBuyingFrequency('');
    setPrTargetUnitPrice('');
    setPrMaxBudget('');
    setPrCategoryText('');
    setPrError('');
  };

  const openProductRequestModal = () => {
    setPrProductName(product?.title || '');
    // default to Buyer role for convenience
    setPrIsBuyer(true);
    setPrIsSupplier(false);
    setPrOpen(true);
  };

  const submitProductRequest = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!prProductName.trim()) { setPrError('Please enter product name'); return; }
    if (!prDetails.trim()) { setPrError('Please provide Details.'); return; }
    const roleCount = (prIsBuyer ? 1 : 0) + (prIsSupplier ? 1 : 0);
    if (roleCount !== 1) { setPrError('Select exactly one role: Buyer or Supplier'); return; }
    setPrSubmitting(true); setPrError('');
    try {
      await createProductRequest({
        product_name: prProductName.trim(),
        // retain backward compatibility and send new keys
        quantity: prQuantity ? Number(prQuantity) : undefined,
        purchase_quantity: prPurchaseQty ? Number(prPurchaseQty) : (prQuantity ? Number(prQuantity) : undefined),
        unit_type: prUnitType === 'others' ? 'others' : prUnitType,
        custom_unit: prUnitType === 'others' ? (prCustomUnit || '') : undefined,
        country: prCountry || undefined,
        city: prCity || undefined,
        category_text: prCategoryText || undefined,
        time_of_validity: prTimeValidity || undefined,
        piece_unit: prPieceUnit || undefined,
        buying_frequency: prBuyingFrequency || undefined,
        budget: prBudget ? Number(prBudget) : undefined,
        currency: prCurrency || undefined,
        target_unit_price: prTargetUnitPrice ? Number(prTargetUnitPrice) : undefined,
        max_budget: prMaxBudget ? Number(prMaxBudget) : undefined,
        is_buyer: prIsBuyer,
        is_supplier: prIsSupplier,
        only_paid_members: prOnlyPaid || undefined,
        allow_all_members: prAllowAll || undefined,
        // new spec fields
        business_type: prBusinessType || undefined,
        // important: include details like LandingPage does
        details: prDetails || undefined,
        attachments: prFiles,
      });
      // Broadcast creation so other parts of the app (e.g., dashboard) can refresh immediately
      try { window.dispatchEvent(new CustomEvent('atlas:product-request-created')); } catch {}

      setPrSuccess('Product request submitted successfully.');
      setTimeout(() => {
        setPrOpen(false);
        setPrSuccess('');
        resetPR();
      }, 2500);
    } catch (e) {
      // Log and surface field-level errors when available
      // eslint-disable-next-line no-console
      console.error('Product request error:', e?.status, e?.data || e);
      const fieldMsg = (e?.data && typeof e.data === 'object')
        ? (Object.entries(e.data)[0]?.[1])
        : null;
      const msg = Array.isArray(fieldMsg) ? String(fieldMsg[0]) : (typeof fieldMsg === 'string' ? fieldMsg : null);
      setPrError(msg || e?.message || 'Failed to submit request');
    } finally { setPrSubmitting(false); }
  };
  // Share dropdown state
  const [shareOpen, setShareOpen] = useState(false);
  // Compose share links for current page
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = product?.title ? `Check this on Atlas: ${product.title}` : 'Check this product on Atlas';
  const shareLinks = useMemo(() => ({
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + pageUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareTitle)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
  }), [pageUrl, shareTitle]);
  // Derive seller and company info from loaded product (owner of product)
  const sellerInfo = useMemo(() => {
    const s = product?.seller_info || {};
    const company = s.company || {};
    const fullName = s.full_name || s.name || '';
    const displayName = fullName || s.company_name || (s.email && s.email.split('@')[0]) || '';
    const businessType = (s.business_type || '').toString().replaceAll('_', ' ').toLowerCase();
    const role = businessType ? businessType.charAt(0).toUpperCase() + businessType.slice(1) : 'Supplier';
    const avatarUrl = s.profile_image || company.company_logo_url || company.company_image_url || '';
    const companyLogo = company.company_logo_url || company.company_image_url || '';
    const companyName = company.company_name || s.company_name || '';
    // Derive badges from seller profile
    const profile = s.profile || s;
    const rawBiz = (profile?.businessVerificationStatus || profile?.business_verification_status || profile?.business_status || profile?.company_verification_status || '').toString().toLowerCase();
    let bizLabel = 'Unverified';
    let bizColor = 'bg-slate-100 text-slate-700 border-slate-200';
    if (['verified', 'approved'].includes(rawBiz)) { bizLabel = 'Verified'; bizColor = 'bg-violet-50 text-violet-700 border-violet-200'; }
    else if (rawBiz === 'pending') { bizLabel = 'Pending'; bizColor = 'bg-amber-50 text-amber-700 border-amber-200'; }
    else if (rawBiz === 'rejected') { bizLabel = 'Rejected'; bizColor = 'bg-rose-50 text-rose-700 border-rose-200'; }

    const memberRaw = (profile?.member_status || profile?.membership_status || '').toString().toLowerCase();
    const isMember = profile?.is_member === true || memberRaw === 'member' || memberRaw === 'active';
    const memberLabel = isMember ? 'Member' : 'Non‑member';
    const memberColor = isMember ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200';
    const badges = [
      { label: memberLabel, color: memberColor, icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M12 2 2 7l10 5 10-5-10-5Zm0 7L2 4v13l10 5 10-5V4l-10 5Z" />
        </svg>
      )},
      { label: bizLabel, color: bizColor, icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M12 2 3 7v7a8.99 8.99 0 0 0 9 9 8.99 8.99 0 0 0 9-9V7l-9-5Zm-1 15-4-4 1.414-1.414L11 13.172l5.586-5.586L18 9l-7 8Z" />
        </svg>
      )},
    ];
    return { name: displayName, role, avatarUrl, companyLogo, companyName, badges };
  }, [product]);

  const openSendMessageModal = () => {
    // Prefill subject and recipient EMAIL only from seller info when available
    const s = product?.seller_info || {};
    const subj = product?.title ? `Inquiry about ${product.title}` : '';
    setSmSubject(subj);
    setSmRecipientEmail(s.email || '');
    // Do NOT prefill Atlas ID per request
    setSmRecipientAtlasId('');
    setSmBody('');
    setSmFile(null);
    setSmError('');
    setSmSuccess('');
    setSmOpen(true);
  };

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const data = await retrieveProduct(id);
        if (alive) setProduct(data);
      } catch (e) {
        console.error('Load product failed', e);
        if (alive) setError(e?.message || 'Failed to load product');
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id]);

  // Load reviews for product
  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      if (!alive) return;
      await loadReviews(id, { limit: 50 });
    })();
    return () => { alive = false; };
  }, [id]);

  // When a review is highlighted, attempt to scroll it into view
  useEffect(() => {
    if (!highlightedReviewId) return;
    const el = reviewsRefs.current[highlightedReviewId];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Remove highlight after a short delay
    const t = setTimeout(() => setHighlightedReviewId(null), 2500);
    return () => clearTimeout(t);
  }, [highlightedReviewId]);

  const handleCreateReview = async () => {
    setCreateError('');
    setCreateSuccess('');
    const comment = newReview.trim();
    if (!isAuthenticated) { setCreateError('Please sign in to leave a review.'); return; }
    if (!rating) { setCreateError('Please select a rating.'); return; }
    if (!comment) { setCreateError('Please enter a comment.'); return; }
    setCreating(true);
    try {
      const payload = { product: Number(id), rating: Number(rating), comment, user: user?.id };
      const created = await createReview(id, payload);
      setNewReview('');
      setRating(0);
      setCreateSuccess('Review posted.');
      // Prepend to list
      setReviews((prev) => [created, ...prev]);
      // Clear success after a short delay
      setTimeout(() => setCreateSuccess(''), 2000);
    } catch (e) {
      console.error('Create review failed', e);
      let msg = 'Failed to submit review';
      if (e?.status === 400 || e?.status === 409) {
        msg = e?.data?.detail || 'You have already reviewed this product.';
        // If backend provides existing_review_id, highlight it
        const existingId = e?.data?.existing_review_id;
        // Reload reviews so the user's existing review appears
        loadReviews(id, { limit: 50 }).then(() => {
          if (existingId) setHighlightedReviewId(existingId);
        });
      } else if (e?.data) {
        msg = e.data.detail || JSON.stringify(e.data);
      } else if (e?.message) {
        msg = e.message;
      }
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteReview = async (rid) => {
    if (!rid) return;
    setDeletingId(rid);
    try {
      await deleteReview(id, rid);
      setReviews((prev) => prev.filter((r) => r.id !== rid));
    } catch (e) {
      console.error('Delete review failed', e);
      setReviewError(e?.message || 'Failed to delete review');
      setTimeout(() => setReviewError(''), 2000);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
          <Logo height="h-10 md:h-12" />
          <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-600">
            <Link to="/" className="hover:text-slate-900">Home</Link>
            <a href="#" className="hover:text-slate-900">Products</a>
          </nav>
        </div>
      </header>
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {location.state?.fromManageProducts && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/product-info/manage')}
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <span className="text-slate-400">←</span>
              Back to Manage Products
            </button>
          </div>
        )}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9 space-y-6">
            <div className="bg-white rounded-md shadow-sm border border-slate-200 p-4 md:p-5">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: gallery + actions below */}
                <div>
                  <MediaGallery items={mediaItems} />
                  <div className="mt-3">
                    {/* Average rating computed from reviews */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        {(() => {
                          const count = reviews.length;
                          const avg = count ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count) : 0;
                          const rounded = Math.round(avg * 10) / 10;
                          return (
                            <>
                              <div className="flex items-center">
                                {[1,2,3,4,5].map(i => (
                                  <svg key={i} viewBox="0 0 20 20" className={`w-4 h-4 ${i <= Math.round(avg) ? 'text-amber-400' : 'text-slate-300'}`} fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.803-2.036a1 1 0 00-1.175 0l-2.803 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z"/></svg>
                                ))}
                              </div>
                              <span className="text-slate-700 ml-1">{rounded} / 5</span>
                              <span className="text-slate-500">({count} review{count===1?'':'s'})</span>
                            </>
                          );
                        })()}
                          {/* Views (read-only) */}
                          <div className="ml-3 flex items-center gap-1 text-xs text-slate-500">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/></svg>
                            <span>{Number(product?.view_count ?? product?.views ?? 0)}</span>
                            <span className="hidden sm:inline">views</span>
                          </div>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShareOpen((v) => !v)}
                          className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-800 border border-slate-300 bg-white px-3 py-1.5 rounded-md"
                          aria-haspopup="menu"
                          aria-expanded={shareOpen}
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7 0-.24-.04-.47-.09-.7l7.05-4.11A3 3 0 1 0 15 5a2.96 2.96 0 0 0 .09.7L8.04 9.81A3 3 0 1 0 9 12c0-.24-.04-.47-.09-.7l7.13 4.16c.5-.45 1.16-.73 1.9-.73a3 3 0 1 0 0-1.65Z"/></svg>
                          <span>Share</span>
                        </button>
                        {shareOpen && (
                          <div
                            role="menu"
                            className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-slate-200 bg-white shadow-lg p-2 text-sm"
                          >
                            <a href={shareLinks.whatsapp} target="_blank" rel="noopener" className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50">
                              <span className="w-4 h-4 text-green-500">🟢</span>
                              <span>WhatsApp</span>
                            </a>
                            <a href={shareLinks.facebook} target="_blank" rel="noopener" className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50">
                              <span className="w-4 h-4 text-blue-600">📘</span>
                              <span>Facebook</span>
                            </a>
                            <a href={shareLinks.twitter} target="_blank" rel="noopener" className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50">
                              <span className="w-4 h-4 text-slate-800">𝕏</span>
                              <span>Share on X</span>
                            </a>
                            <a href={shareLinks.linkedin} target="_blank" rel="noopener" className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50">
                              <span className="w-4 h-4 text-sky-700">in</span>
                              <span>LinkedIn</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(pageUrl);
                                setShareOpen(false);
                              }}
                              className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 text-slate-700"
                            >
                              <span className="w-4 h-4">🔗</span>
                              <span>Copy link</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Star rating selector (only show if user hasn't reviewed yet) */}
                    {isAuthenticated && !hasUserReview && (
                      <div className="mt-3">
                        <div className="text-xs text-slate-600 mb-1">Your rating</div>
                        <div className="flex items-center gap-2">
                          {[1,2,3,4,5].map((i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setRating(i)}
                              className="p-0.5"
                              aria-label={`Rate ${i} star${i>1?'s':''}`}
                            >
                              <svg viewBox="0 0 20 20" className={`w-5 h-5 ${i <= rating ? 'text-amber-400' : 'text-slate-300'}`} fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.803-2.036a1 1 0 00-1.175 0l-2.803 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z"/></svg>
                            </button>
                          ))}
                          <span className="text-xs text-slate-500 ml-1">{rating ? `${rating}/5` : 'Select rating'}</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 flex gap-2">
                      <input
                        value={newReview}
                        onChange={(e) => setNewReview(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateReview(); }}
                        className="flex-1 h-10 rounded-md border border-slate-300 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={isAuthenticated ? (hasUserReview ? "You have already reviewed this product" : "Write your comment") : "Sign in to write a review"}
                        disabled={!isAuthenticated || creating || hasUserReview}
                      />
                      <button
                        onClick={handleCreateReview}
                        disabled={!isAuthenticated || creating || hasUserReview}
                        className="h-10 px-4 rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
                      >
                        {creating ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                    {(createError || createSuccess) && (
                      <div className={`mt-2 text-xs ${createError ? 'text-red-600' : 'text-green-600'}`}>{createError || createSuccess}</div>
                    )}
                    {/* Reviews list */}
                    <div className="mt-4 space-y-3">
                      {reviewsLoading && <div className="text-xs text-slate-500">Loading reviews...</div>}
                      {reviewError && <div className="text-xs text-red-600">{reviewError}</div>}
                      {!reviewsLoading && !reviewError && reviews.map((rv) => (
                        <div
                          key={rv.id}
                          ref={(el) => { if (el) reviewsRefs.current[rv.id] = el; }}
                          className={`rounded-md border p-3 ${highlightedReviewId === rv.id ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-slate-800">{getReviewerName(rv)}</div>
                            <div className="text-xs text-slate-500">{rv.created_at ? new Date(rv.created_at).toLocaleString() : ''}</div>
                          </div>
                          {/* Show rating as numeric to avoid double star rows */}
                          {typeof rv.rating === 'number' && rv.rating > 0 && (
                            <div className="mt-1 text-xs text-slate-600">Rating: {rv.rating}/5</div>
                          )}
                          <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{rv.comment || rv.content || rv.text || ''}</div>
                          {isAuthenticated && (rv.user_id === user?.id || rv.user?.id === user?.id) && (
                            <div className="mt-2 text-right">
                              <button onClick={() => handleDeleteReview(rv.id)} disabled={deletingId === rv.id} className="text-xs text-red-600 hover:underline disabled:opacity-60">{deletingId === rv.id ? 'Deleting...' : 'Delete'}</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: title, company */}
                <div>
                  <h1 className="text-[20px] md:text-[22px] leading-snug font-semibold text-slate-900">{product?.title || 'Product'}</h1>

                  {/* Reference FOB Price panel */}
                  <div className="mt-2 rounded-md border border-slate-100 bg-[#F7FAFF] p-3">
                    <div className="flex items-center justify-between text-[13px] text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Reference FOB Price</span>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sky-100 text-sky-600 text-[10px]">i</span>
                      </div>
                      <a className="text-[#027DDB] text-[12px] hover:underline cursor-pointer">Get Latest Price ›</a>
                    </div>
                    <div className="mt-2 bg-white rounded-md border border-slate-200 px-3 py-2 text-[13px] text-slate-900">
                      {minOrderText}
                    </div>
                  </div>

                  {/* Specifications preview (simple label:value list) */}
                  {specPreview && specPreview.length > 0 && (
                    <div className="mt-3">
                      {specPreview.map((r, i) => (
                        <div key={i} className="py-1.5">
                          <KeyInfoRow label={`${(r.label || r.name || '-')}:`} value={r.value || '-'} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Company + CTA (seller company) */}
                  <div className="mt-5 grid sm:grid-cols-2 gap-3">
                    <div className="rounded-md border border-slate-200 p-3 flex items-center gap-3 bg-white">
                      <img src={sellerInfo.companyLogo || '/images/img_image_2.png'} alt="company" className="w-10 h-10 rounded object-cover" />
                      <div className="text-sm font-medium text-slate-800">{sellerInfo.companyName || '—'}</div>
                    </div>
                    <Link to="/company" state={{ from: location.pathname, sellerProfile: product?.seller_info }} className="h-11 rounded-md bg-[#027DDB] text-white text-sm font-medium hover:brightness-95 flex items-center justify-center">View Company Page</Link>
                  </div>
                </div>
              </div>
            </div>

            <TabCard tabs={["Product Details", "Company Info."]} active={tab} onChange={setTab}>
              {tab === 0 && (
                <div className="space-y-6">
                  <SectionCard title="Specifications">
                    <BasicInfoTable specs={product?.specifications} />
                  </SectionCard>

                  <SectionCard title="Description">
                    {product?.description ? (
                      <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{product.description}</div>
                    ) : (
                      <div className="text-sm text-slate-500">No description provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.description_files} emptyText="No description files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Specification">
                    {product?.specification ? (
                      <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{product.specification}</div>
                    ) : (
                      <div className="text-sm text-slate-500">No specification provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.specification_files} emptyText="No specification files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Production Capacity">
                    {product?.production_capacity ? (
                      <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{product.production_capacity}</div>
                    ) : (
                      <div className="text-sm text-slate-500">No production capacity information provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.production_capacity_files} emptyText="No production capacity files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Packaging & Delivery">
                    {product?.packaging_delivery ? (
                      <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{product.packaging_delivery}</div>
                    ) : (
                      <div className="text-sm text-slate-500">No packaging and delivery information provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.packaging_delivery_files} emptyText="No packaging & delivery files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Benefits">
                    {product?.benefits ? (
                      <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{product.benefits}</div>
                    ) : (
                      <div className="text-sm text-slate-500">No benefits provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.benefits_files} emptyText="No benefits files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Others">
                    {product?.others ? (
                      <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{product.others}</div>
                    ) : (
                      <div className="text-sm text-slate-500">No other information provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.others_files} emptyText="No other files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Customer Feedback">
                    {product?.customer_feedback ? (
                      <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{product.customer_feedback}</div>
                    ) : (
                      <div className="text-sm text-slate-500">No customer feedback provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.customer_feedback_files} emptyText="No customer feedback files uploaded." />
                    </div>
                  </SectionCard>

                  <SectionCard title="Questions & Answers">
                    {product?.questions_answers ? (
                      <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{product.questions_answers}</div>
                    ) : (
                      <div className="text-sm text-slate-500">No questions and answers provided.</div>
                    )}
                    <div className="mt-3">
                      <MediaThumbGrid items={product?.questions_answers_files} emptyText="No Q&A files uploaded." />
                    </div>
                  </SectionCard>
                </div>
              )}
              {tab === 1 && (
                <div className="space-y-6">
                  <SectionCard title="Company profile">
                    {(() => {
                      const company = (product?.seller_info && product.seller_info.company) || {};
                      const cover = company.company_cover_photo_url || company.company_image_url || sellerInfo.companyLogo;
                      const about = company.about_us;
                      return (
                        <div className="grid md:grid-cols-3 gap-5">
                          <img src={cover || '/images/img_image_2.png'} alt="company" className="w-full h-40 object-cover rounded-md border border-slate-200" />
                          <div className="md:col-span-2 space-y-2 text-sm">
                            <div className="text-slate-900 font-semibold">{sellerInfo.companyName || '—'}</div>
                            {about ? (
                              <p className="text-slate-700 whitespace-pre-wrap">{about}</p>
                            ) : (
                              <div className="text-slate-500">No company profile provided.</div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </SectionCard>

                  <SectionCard title="Company Show" right={<div className="text-sm text-blue-600 hover:underline cursor-pointer">Certificates</div>}>
                    {(() => {
                      const certs = product?.seller_info?.company?.certificates || [];
                      return <MediaThumbGrid items={certs} emptyText="No certificates uploaded." />;
                    })()}
                  </SectionCard>

                  {/* Company Details */}
                  {(() => {
                    const c = product?.seller_info?.company || {};
                    return (
                      <SectionCard title="Company Details">
                        <div className="space-y-2 text-sm">
                          <KeyInfoRow label="Why choose us" value={c.why_choose_us || '—'} />
                          <KeyInfoRow label="Year of establishment" value={c.year_of_establishment || '—'} />
                          <KeyInfoRow label="Number of employees" value={c.number_of_employees || '—'} />
                          <KeyInfoRow label="Annual turnover" value={c.annual_turnover || '—'} />
                          <KeyInfoRow label="Brand name" value={c.brand_name || '—'} />
                          <KeyInfoRow label="Website" value={c.website ? (
                            <a href={c.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{c.website}</a>
                          ) : '—'} />
                          <KeyInfoRow label="Company capacity" value={c.company_capacity || '—'} />
                          <KeyInfoRow label="Country" value={c.address_country || '—'} />
                          <KeyInfoRow label="State" value={c.address_state || '—'} />
                          <KeyInfoRow label="City" value={c.address_city || '—'} />
                          <KeyInfoRow label="Street" value={c.street || '—'} />
                        </div>
                      </SectionCard>
                    );
                  })()}

                  {/* Company Media Sections */}
                  <SectionCard title="Blog & Awards">
                    <MediaThumbGrid items={product?.seller_info?.company?.blog_awards} emptyText="No blog/awards uploaded." />
                  </SectionCard>
                  <SectionCard title="Additional Info">
                    {product?.seller_info?.company?.additional_info ? (
                      <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{product.seller_info.company.additional_info}</div>
                    ) : (
                      <div className="text-sm text-slate-500">No additional info provided.</div>
                    )}
                  </SectionCard>
                  <SectionCard title="Questions & Answers (Company)">
                    {product?.seller_info?.company?.questions_and_answers ? (
                      <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{product.seller_info.company.questions_and_answers}</div>
                    ) : (
                      <div className="text-sm text-slate-500">No questions and answers provided.</div>
                    )}
                  </SectionCard>
                  <SectionCard title="Others (Company)">
                    {product?.seller_info?.company?.others ? (
                      <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{product.seller_info.company.others}</div>
                    ) : (
                      <div className="text-sm text-slate-500">No other information provided.</div>
                    )}
                  </SectionCard>
                  <SectionCard title="Production Sites">
                    <MediaThumbGrid items={product?.seller_info?.company?.production_sites} emptyText="No production sites uploaded." />
                  </SectionCard>
                  <SectionCard title="Storage Sites">
                    <MediaThumbGrid items={product?.seller_info?.company?.storage_sites} emptyText="No storage sites uploaded." />
                  </SectionCard>
                  <SectionCard title="Exhibitions">
                    <MediaThumbGrid items={product?.seller_info?.company?.exhibitions} emptyText="No exhibitions uploaded." />
                  </SectionCard>

                  <SectionCard title={sellerInfo?.companyName ? `Send your message to ${sellerInfo.companyName}` : 'Send your message to this supplier'}>
                    <form className="space-y-4" onSubmit={async (e) => {
                      e.preventDefault();
                      setMsgError(''); setMsgSuccess('');
                      if (!isAuthenticated) { navigate('/login'); return; }
                      const body = msgBody.trim();
                      const fromEmail = msgFromEmail.trim();
                      if (fromEmail === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) { setMsgError('Please enter a valid email.'); return; }
                      if (body.length < 20) { setMsgError('Message must be at least 20 characters.'); return; }
                      setMsgSending(true);
                      try {
                        const recipientEmail = product?.seller_info?.email || undefined;
                        const recipientAtlas = product?.seller_info?.atlas_id || product?.seller_info?.atlasId || undefined;
                        const subject = product?.title ? `Inquiry about: ${product.title}` : 'Supplier inquiry';
                        // Include the "From" email at the top of the message body for backend visibility if needed
                        const finalBody = `From: ${fromEmail}\n\n${body}`;
                        await sendMessage({ subject, body: finalBody, recipient_email: recipientEmail, recipient_atlas_id: recipientAtlas, related_product: product?.id });
                        setMsgSuccess('Message sent successfully.');
                        setMsgBody('');
                        // keep from email for convenience
                        setTimeout(() => setMsgSuccess(''), 2500);
                      } catch (err) {
                        setMsgError(err?.message || 'Failed to send message');
                      } finally { setMsgSending(false); }
                    }}>
                      {/* From */}
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-slate-700">
                          <span className="text-blue-600">*</span> From:
                        </label>
                        <input
                          type="email"
                          placeholder="Enter your email address"
                          className="h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={msgFromEmail}
                          onChange={(e) => setMsgFromEmail(e.target.value)}
                        />
                      </div>

                      {/* To (seller) */}
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-slate-700">
                          <span className="text-blue-600">*</span> To:
                        </label>
                        <div className="flex items-center gap-2">
                          <img src={sellerInfo.avatarUrl || '/images/img_image_2.png'} alt="contact" className="w-8 h-8 rounded object-cover" />
                          <div className="text-sm text-slate-800">{sellerInfo.name || '—'}</div>
                        </div>
                      </div>

                      {/* Message */}
                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-slate-700">
                          <span className="text-blue-600">*</span> Message:
                        </label>
                        <textarea
                          rows={5}
                          className="w-full rounded border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={msgBody}
                          onChange={(e) => setMsgBody(e.target.value)}
                        />
                        <div className="text-xs text-slate-500">Enter between 20 to 4,000 characters.</div>
                      </div>
                      {msgError && <div className="text-xs text-rose-600 mt-1">{msgError}</div>}
                      {msgSuccess && <div className="text-xs text-green-600 mt-1">{msgSuccess}</div>}
                      {/* Actions */}
                      <div className="flex items-center gap-4">
                        <button type="submit" disabled={msgSending} className={`h-10 px-5 rounded text-white text-sm font-medium ${msgSending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{msgSending ? 'Sending…' : 'Send'}</button>
                        <div className="text-xs text-slate-500">
                          This is not what you are looking for?{' '}
                          <button type="button" onClick={openProductRequestModal} className="text-blue-600 hover:underline">Post a Sourcing Request Now</button>
                        </div>
                      </div>
                    </form>
                  </SectionCard>

                  <SectionCard title="People who viewed this also viewed">
                    <div className="text-slate-500 text-sm">Coming soon</div>
                  </SectionCard>
                </div>
              )}
            </TabCard>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <SellerCard onContact={() => setContactOpen(true)} onLeaveMessageClick={openSendMessageModal} onAffiliateClick={() => setAffiliateOpen(true)} name={sellerInfo.name} role={sellerInfo.role} avatarUrl={sellerInfo.avatarUrl} />
            <CompanyInfoCard companyLogo={sellerInfo.companyLogo} companyName={sellerInfo.companyName} badges={sellerInfo.badges} />
            <div className="bg-white rounded-md shadow-sm border border-slate-200 p-4">
              <div className="font-semibold mb-3 text-slate-800">You May Like</div>
              <div className="text-slate-500 text-sm">Coming soon</div>
            </div>
          </div>
        </div>
      </div>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} roleLabel={roleLabel} productId={product?.id} />
      {affiliateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAffiliateOpen(false)} />
          <div className="relative w-[90%] max-w-sm rounded-md bg-white shadow-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[18px] font-semibold text-slate-900">Coming soon</div>
                <div className="mt-1 text-sm text-slate-600">Affiliate requests will be available shortly.</div>
              </div>
              <button onClick={() => setAffiliateOpen(false)} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-500"><path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" /></svg>
              </button>
            </div>
            <div className="mt-4 flex items-center justify-end">
              <button onClick={() => setAffiliateOpen(false)} className="px-3 py-2 text-sm rounded border border-slate-300 bg-white hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
      {smOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSmOpen(false)} />
          <div className="relative mt-12 w-[92%] max-w-lg rounded-md bg-white shadow-xl border border-slate-200 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-none">
              <h3 className="text-[18px] font-semibold text-slate-900">Send Message</h3>
              <button onClick={() => setSmOpen(false)} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-500"><path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              {smSuccess ? (
                <SuccessAlert message={smSuccess} onClose={() => setSmSuccess('')} />
              ) : null}
              {smError ? (
                <div className="rounded border px-3 py-2 text-sm border-red-300 bg-red-50 text-red-700">{smError}</div>
              ) : null}
              <div>
                <label className="block text-sm text-slate-700 mb-1">Subject</label>
                <input value={smSubject} onChange={(e) => setSmSubject(e.target.value)} className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Subject" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Recipient Email</label>
                  <input value={smRecipientEmail} onChange={(e) => setSmRecipientEmail(e.target.value)} className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Recipient Atlas ID (optional)</label>
                  <input value={smRecipientAtlasId} onChange={(e) => setSmRecipientAtlasId(e.target.value)} className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 123" />
                </div>
              </div>
              <p className="text-xs text-slate-500">Provide at least one recipient: email or Atlas ID.</p>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Message</label>
                <textarea value={smBody} onChange={(e) => setSmBody(e.target.value)} rows={5} className="w-full rounded border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Type your message..." />
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <input type="file" onChange={(e) => setSmFile(e.target.files?.[0] || null)} className="text-xs" />
                <button
                  onClick={async () => {
                    setSmSending(true); setSmError(''); setSmSuccess('');
                    try {
                      await sendMessage({
                        subject: smSubject,
                        body: smBody,
                        recipient_email: smRecipientEmail || undefined,
                        recipient_atlas_id: smRecipientAtlasId || undefined,
                        related_product: product?.id || undefined,
                        attachment: smFile || undefined,
                      });
                      setSmSuccess('Message sent successfully.');
                      setTimeout(() => { setSmOpen(false); setSmSuccess(''); }, 1800);
                      setSmSubject(''); setSmRecipientEmail(''); setSmRecipientAtlasId(''); setSmBody(''); setSmFile(null);
                    } catch (e) {
                      try { console.warn('sendMessage failed', e?.status, e?.data, e?.message); } catch {}
                      setSmError(e?.message || 'Failed to send message');
                    } finally { setSmSending(false); }
                  }}
                  disabled={smSending || !smSubject.trim() || !smBody.trim() || (!smRecipientEmail.trim() && !smRecipientAtlasId.trim())}
                  className={`px-3 py-2 text-sm rounded-md text-white ${smSending || !smSubject.trim() || !smBody.trim() || (!smRecipientEmail.trim() && !smRecipientAtlasId.trim()) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {smSending ? 'Sending…' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {prOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPrOpen(false)} />
          <div className="relative mt-12 w-[92%] max-w-2xl rounded-md bg-white shadow-xl border border-slate-200 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-none">
              <h3 className="text-[18px] font-semibold text-slate-900">Post a Product Request</h3>
              <button onClick={() => setPrOpen(false)} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-500"><path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {prSuccess && (
                <div ref={successRef}>
                  <SuccessAlert message={prSuccess} onClose={() => setPrSuccess('')} />
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-700 mb-1">Product name</label>
                <input
                  value={prProductName}
                  onChange={(e) => setPrProductName(e.target.value)}
                  type="text"
                  className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What product do you need?"
                />
              </div>
              {/* Category (free text) */}
              <div>
                <label className="block text-sm text-slate-700 mb-1">Category</label>
                <input value={prCategoryText} onChange={(e) => setPrCategoryText(e.target.value)} type="text" className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Lighting > LED Panels" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Quantity</label>
                  <input value={prQuantity} onChange={(e) => setPrQuantity(e.target.value)} type="number" min="0" className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Unit</label>
                  <select value={prUnitType} onChange={(e) => setPrUnitType(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="pieces">Pieces</option>
                    <option value="boxes">Boxes</option>
                    <option value="meters">Meters</option>
                    <option value="others">Others</option>
                  </select>
                  {prUnitType === 'others' && (
                    <input value={prCustomUnit} onChange={(e) => setPrCustomUnit(e.target.value)} type="text" className="mt-2 h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter custom unit" />
                  )}
                </div>
              </div>
              {/* Purchase Quantity (new spec) */}
              <div>
                <label className="block text-sm text-slate-700 mb-1">Purchase Quantity (optional)</label>
                <input value={prPurchaseQty} onChange={(e) => setPrPurchaseQty(e.target.value)} type="number" min="0" className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 100" />
              </div>
              {/* Business Type */}
              <div>
                <label className="block text-sm text-slate-700 mb-1">Business Type</label>
                <select value={prBusinessType} onChange={(e) => setPrBusinessType(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option value="ASSOCIATION">ASSOCIATION</option>
                  <option value="RETAILER">RETAILER</option>
                  <option value="MANUFACTURER">MANUFACTURER</option>
                  <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                  <option value="AGENT">AGENT</option>
                </select>
              </div>
              {/* Enums per spec */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Time of Validity</label>
                  <select value={prTimeValidity} onChange={(e) => setPrTimeValidity(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select</option>
                    <option value="1_WEEK">1_WEEK</option>
                    <option value="2_WEEKS">2_WEEKS</option>
                    <option value="1_MONTH">1_MONTH</option>
                    <option value="3_MONTHS">3_MONTHS</option>
                    <option value="6_MONTHS">6_MONTHS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Piece Unit</label>
                  <select value={prPieceUnit} onChange={(e) => setPrPieceUnit(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select</option>
                    <option value="UNITS">UNITS</option>
                    <option value="KG">KG</option>
                    <option value="TON">TON</option>
                    <option value="PIECES">PIECES</option>
                    <option value="BOXES">BOXES</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Buying Frequency</label>
                <select value={prBuyingFrequency} onChange={(e) => setPrBuyingFrequency(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option value="WEEKLY">WEEKLY</option>
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="QUARTERLY">QUARTERLY</option>
                  <option value="YEARLY">YEARLY</option>
                  <option value="ONE_TIME">ONE_TIME</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Country</label>
                <select value={prCountry} onChange={(e) => setPrCountry(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Country</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="South Africa">South Africa</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="China">China</option>
                  <option value="India">India</option>
                  <option value="UAE">UAE</option>
                </select>
              </div>
              {/* City */}
              <div>
                <label className="block text-sm text-slate-700 mb-1">City (optional)</label>
                <input value={prCity} onChange={(e) => setPrCity(e.target.value)} type="text" className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="City" />
              </div>
              {/* Budget and Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Budget (optional)</label>
                  <input value={prBudget} onChange={(e) => setPrBudget(e.target.value)} type="number" min="0" step="0.01" className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 5000" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Currency</label>
                  <select value={prCurrency} onChange={(e) => setPrCurrency(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="USD">USD</option>
                    <option value="NGN">NGN</option>
                    <option value="GHS">GHS</option>
                    <option value="KES">KES</option>
                    <option value="ZAR">ZAR</option>
                    <option value="CNY">CNY</option>
                    <option value="INR">INR</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              {/* Target price and Max budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Target Unit Price</label>
                  <input value={prTargetUnitPrice} onChange={(e) => setPrTargetUnitPrice(e.target.value)} type="number" min="0" step="0.01" className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 2.75" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Max Budget</label>
                  <input value={prMaxBudget} onChange={(e) => setPrMaxBudget(e.target.value)} type="number" min="0" step="0.01" className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 15000" />
                </div>
              </div>
              {/* Role toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={prIsBuyer} onChange={(e) => { const v = e.target.checked; setPrIsBuyer(v); if (v) setPrIsSupplier(false); }} />
                  <span>I am a Buyer</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={prIsSupplier} onChange={(e) => { const v = e.target.checked; setPrIsSupplier(v); if (v) setPrIsBuyer(false); }} />
                  <span>I am a Supplier</span>
                </label>
              </div>
              {/* Visibility toggles (mutually exclusive) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={prOnlyPaid}
                    onChange={(e) => { const v = e.target.checked; setPrOnlyPaid(v); if (v) setPrAllowAll(false); }}
                  />
                  <span>Only paid members</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={prAllowAll}
                    onChange={(e) => { const v = e.target.checked; setPrAllowAll(v); if (v) setPrOnlyPaid(false); }}
                  />
                  <span>Allow all members</span>
                </label>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Details</label>
                <textarea value={prDetails} onChange={(e) => setPrDetails(e.target.value)} rows={5} className="w-full rounded border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe your sourcing needs..." />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Attachments (optional)</label>
                <input multiple type="file" onChange={(e) => setPrFiles(Array.from(e.target.files || []))} className="text-sm" />
              </div>
              {prError && <div className="text-sm text-red-600">{prError}</div>}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button onClick={() => setPrOpen(false)} className="px-3 py-2 text-sm rounded border border-slate-300 bg-white hover:bg-gray-50">Cancel</button>
                <button onClick={submitProductRequest} disabled={prSubmitting} className={`px-3 py-2 text-sm rounded text-white ${prSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#027DDB] hover:brightness-95'}`}>{prSubmitting ? 'Submitting…' : 'Submit Request'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
