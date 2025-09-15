import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import SuccessAlert from './common/SuccessAlert';
import { getProductThumb } from '../utils/media';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ProductCard from './ProductCard';
import { listGeneral, searchProducts, listCategories } from '../services/productApi';
import RecommendationCard from './RecommendationCard';
import { AuthFlow } from './auth';
import { authStorage, getCurrentUser, logout } from '../services/authApi';
import { useAuth } from '../context/AuthContext';
import Logo from './common/Logo';
import { getRootCategories, getCategoryDetail } from '../services/categoryApi';
import ContactModal from './common/ContactModal';
import { getNotificationCounts } from '../services/messagesApi';
import { createProductRequest, listProductRequests } from '../services/productRequestApi';

const LandingPage = () => {
  const { user, isAuthenticated, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userAtlasId, setUserAtlasId] = useState(null);
  const [businessVerificationStatus, setBusinessVerificationStatus] = useState('UNVERIFIED'); // 'UNVERIFIED' (default), 'PENDING', 'VERIFIED'/'APPROVED', 'REJECTED'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthFlow, setShowAuthFlow] = useState(false);
  const [authStartType, setAuthStartType] = useState('login'); // 'login' or 'signup'
  const hoverCloseTimeout = useRef(null);
  const successRef = useRef(null);

  // Categories state for Mega Menu
  const [rootCategories, setRootCategories] = useState([]);
  const [categoryTrees, setCategoryTrees] = useState({}); // { [id]: full detail with recursive children }
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [hoveredRootId, setHoveredRootId] = useState(null);
  const megaCloseTimeout = useRef(null);
  const controllersRef = useRef({}); // { [id]: AbortController }
  const [loadingTrees, setLoadingTrees] = useState({}); // { [id]: true }
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState({}); // { [id]: boolean }
  const [isMobileAppOpen, setIsMobileAppOpen] = useState(false);
  // Contact Seller modal state (shared with ProductDetails)
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const roleLabel = 'Supplier';
  // Notifications
  const [notif, setNotif] = useState({ unread_messages: 0, new_product_request_replies: 0 });
  // Total Product Requests count for header bell
  const [prTotalCount, setPrTotalCount] = useState(0);

  // Product Request modal state
  const [prOpen, setPrOpen] = useState(false);
  const [prSubmitting, setPrSubmitting] = useState(false);
  const [prError, setPrError] = useState('');
  const [prSuccess, setPrSuccess] = useState('');
  const [prProductName, setPrProductName] = useState('');
  const [prQuantity, setPrQuantity] = useState('');
  const [prUnitType, setPrUnitType] = useState('pieces');
  const [prCustomUnit, setPrCustomUnit] = useState('');
  const [prCountry, setPrCountry] = useState('');
  const [prDetails, setPrDetails] = useState('');
  const [prFiles, setPrFiles] = useState([]);
  // Additional Product Request fields
  const [prCity, setPrCity] = useState('');
  const [prCategoryText, setPrCategoryText] = useState(''); // free-text category
  const [prCategoryId, setPrCategoryId] = useState(''); // selected category ID
  const [prCategoryName, setPrCategoryName] = useState(''); // selected category name for display
  // Categories state for product request
  const [prCategories, setPrCategories] = useState([]);
  const [prCatLoading, setPrCatLoading] = useState(false);
  const [prCatError, setPrCatError] = useState('');
  const [prBudget, setPrBudget] = useState('');
  const [prCurrency, setPrCurrency] = useState('USD');
  const [prIsBuyer, setPrIsBuyer] = useState(false);
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
  // removed: prAttachmentLink (Attachment Link field)

  const resetPR = () => {
    setPrProductName('');
    setPrQuantity('');
    setPrUnitType('pieces');
    setPrCustomUnit('');
    setPrCountry('');
    setPrCity('');
    setPrCategoryText('');
    setPrCategoryId('');
    setPrCategoryName('');
    setPrBudget('');
    setPrCurrency('USD');
    setPrIsBuyer(false);
    setPrIsSupplier(false);
    setPrOnlyPaid(false);
    setPrAllowAll(true);
    setPrDetails('');
    setPrFiles([]);
    setPrError('');
    setPrBusinessType('');
    setPrPurchaseQty('');
    setPrTimeValidity('');
    setPrPieceUnit('');
    setPrBuyingFrequency('');
    setPrTargetUnitPrice('');
    setPrMaxBudget('');
  };

  // Ensure success alert is visible
  useEffect(() => {
    if (prSuccess && successRef.current) {
      try {
        successRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {}
    }
  }, [prSuccess]);

  // Load categories for product request dropdown
  useEffect(() => {
    const loadCategories = async () => {
      setPrCatLoading(true);
      setPrCatError('');
      try {
        const res = await listCategories();
        const items = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
        const mapped = items.map(it => ({ 
          id: it.id ?? it.value ?? it.pk ?? it.slug ?? it.code, 
          name: it.name ?? it.title ?? it.label ?? String(it.id ?? it.value ?? '') 
        }));
        setPrCategories(mapped.filter(c => c.id != null));
      } catch (e) {
        console.error('Load categories failed', e);
        setPrCatError(e?.message || 'Failed to load categories');
      } finally {
        setPrCatLoading(false);
      }
    };
    loadCategories();
  }, []);

  const onSubmitProductRequest = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (!prProductName.trim()) { setPrError('Please enter product name'); return; }
    // Validate attachment (size/type) before reading base64 in API service
    if (Array.isArray(prFiles) && prFiles.length) {
      const file = prFiles[0];
      const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
      const ALLOWED = new Set(['image/jpeg','image/png','image/webp','application/pdf']);
      if (file.size > MAX_BYTES) { setPrError('Attachment too large. Max size is 2 MB.'); return; }
      if (file.type && !ALLOWED.has(file.type)) { setPrError('Unsupported file type. Allowed: JPG, PNG, WEBP, PDF.'); return; }
    }
    // Validate XOR for role flags
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
        category_text: prCategoryText || prCategoryName || undefined,
        category_id: prCategoryId || undefined,
        budget: prBudget !== '' ? Number(prBudget) : undefined,
        currency: prCurrency || undefined,
        is_buyer: prIsBuyer,
        is_supplier: prIsSupplier,
        only_paid_members: prOnlyPaid || undefined,
        allow_all_members: prAllowAll || undefined,
        // new spec fields
        business_type: prBusinessType || undefined,
        time_of_validity: prTimeValidity || undefined,
        piece_unit: prPieceUnit || undefined,
        buying_frequency: prBuyingFrequency || undefined,
        target_unit_price: prTargetUnitPrice !== '' ? Number(prTargetUnitPrice) : undefined,
        max_budget: prMaxBudget !== '' ? Number(prMaxBudget) : undefined,
        // removed attachment_link; attachments handled via base64 in API service
        details: prDetails || undefined,
        attachments: prFiles,
      });
      // Broadcast creation so other parts of the app can refresh immediately
      try { window.dispatchEvent(new CustomEvent('atlas:product-request-created')); } catch {}

      // Immediately refresh PR counts (header bell) without waiting for polling
      try {
        const prList = await listProductRequests({ page: 1 });
        const count = typeof prList?.count === 'number'
          ? prList.count
          : (Array.isArray(prList?.results) ? prList.results.length : (Array.isArray(prList) ? prList.length : 0));
        setPrTotalCount(Number(count) || 0);
      } catch {}

      setPrSuccess('Product request submitted successfully.');
      // Do not redirect; show success and close after brief delay
      setTimeout(() => {
        setPrOpen(false);
        setPrSuccess('');
        resetPR();
      }, 2500);
    } catch (e) {
      setPrError(e?.message || 'Failed to submit request');
    } finally {
      setPrSubmitting(false);
    }
  };

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  // Live suggestions (debounced header search)
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestResults, setSuggestResults] = useState([]);

  // Slider state (images are free Unsplash placeholders; you can swap the URLs later)
  const slides = [
    {
      image: '/images/img_image_2.png',
      title: 'Shop the latest',
      subtitle: 'Fresh arrivals from top brands',
    },
    {
      image: '/images/img_unsplash2cfzfb08um.png',
      title: 'Featured selection',
      subtitle: 'Curated picks for you',
    },
    {
      image: '/images/warehouse.png',
      title: 'Efficient warehousing',
      subtitle: 'Seamless fulfillment and logistics',
    },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  // Preload images to avoid blank frames on some networks/browsers
  useEffect(() => {
    slides.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  // Video Channel moved to its own page

  // On mount or URL change, if q param present, perform search
  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const q = params.get('q') || '';
    if (!q || q.trim().length < 2) return;
    setSearchTerm(q);
    (async () => {
      setSearchLoading(true); setSearchError('');
      const candidates = [ { key: 'q', val: q }, { key: 'query', val: q }, { key: 'keyword', val: q } ];
      let lastErr = null;
      for (const cand of candidates) {
        try {
          const data = await searchProducts({ [cand.key]: cand.val });
          const results = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          setSearchResults(results);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          // try next key
        }
      }
      if (lastErr) {
        console.error('Search failed', lastErr);
        const msg = lastErr?.data ? JSON.stringify(lastErr.data) : (lastErr?.message || 'Search failed');
        setSearchError(msg);
      }
      setSearchLoading(false);
    })();
  }, [location.search]);

  // Debounced live suggestions for header input
  useEffect(() => {
    const term = (searchTerm || '').trim();
    if (term.length < 2) {
      setSuggestResults([]);
      setSuggestOpen(false);
      setSuggestLoading(false);
      return;
    }
    setSuggestLoading(true);
    let active = true;
    const handle = setTimeout(async () => {
      try {
        const candidates = [
          { key: 'q', val: term },
          { key: 'product_name', val: term },
        ];
        let resultsArr = [];
        let lastErr = null;
        for (const cand of candidates) {
          try {
            // Try page_size first, fall back to limit
            const data = await searchProducts({ [cand.key]: cand.val, page_size: 5 });
            const arr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
            resultsArr = arr;
            lastErr = null;
            // If we have any results, stop. Otherwise, try with 'limit' as some backends use it.
            if (arr && arr.length) break;
            const data2 = await searchProducts({ [cand.key]: cand.val, limit: 5 });
            const arr2 = Array.isArray(data2?.results) ? data2.results : (Array.isArray(data2) ? data2 : []);
            resultsArr = arr2;
            if (arr2 && arr2.length) break;
          } catch (err) {
            lastErr = err;
          }
        }
        if (!active) return;
        setSuggestResults(resultsArr || []);
        setSuggestOpen(true);
      } catch (e) {
        if (!active) return;
        setSuggestResults([]);
        setSuggestOpen(true);
      } finally {
        if (active) setSuggestLoading(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(handle); };
  }, [searchTerm]);
  useEffect(() => {
    const id = setInterval(nextSlide, 5000);
    return () => clearInterval(id);
  }, []);

  // Poll notifications when logged in
  useEffect(() => {
    let timer;
    let aborted = false;
    const fetchCounts = async () => {
      if (!isLoggedIn) return;
      try {
        const [notifData, prList] = await Promise.all([
          getNotificationCounts(),
          listProductRequests({ page: 1 })
        ]);
        if (!aborted) {
          if (notifData && typeof notifData === 'object') {
            setNotif({
              unread_messages: Number(notifData.unread_messages) || 0,
              new_product_request_replies: Number(notifData.new_product_request_replies) || 0,
            });
          }
          const count = typeof prList?.count === 'number'
            ? prList.count
            : (Array.isArray(prList?.results) ? prList.results.length : (Array.isArray(prList) ? prList.length : 0));
          setPrTotalCount(Number(count) || 0);
        }
      } catch (e) {
        // Silent fail; avoid toast noise on intermittent 401/network
        if (!aborted) {
          setNotif((n) => n); // no-op keep last
          setPrTotalCount((c) => c);
        }
      }
    };
    fetchCounts();
    if (isLoggedIn) {
      timer = setInterval(fetchCounts, 30000);
    }
    return () => { aborted = true; if (timer) clearInterval(timer); };
  }, [isLoggedIn]);

  // Load top-level categories (roots) and seed cache from sessionStorage
  useEffect(() => {
    let isMounted = true;
    const CACHE_KEY = 'atlas_root_categories';
    const TTL_MS = 10 * 60 * 1000; // 10 minutes
    // Seed cache from sessionStorage (if present)
    try {
      const cached = sessionStorage.getItem('atlas_category_trees');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') setCategoryTrees(parsed);
      }
    } catch {}
    // Try cached roots first
    let hasFreshCache = false;
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.data) && typeof parsed.ts === 'number') {
          const fresh = Date.now() - parsed.ts < TTL_MS;
          if (fresh) {
            hasFreshCache = true;
            if (isMounted) setRootCategories(parsed.data);
          }
        }
      }
    } catch {}

    // Fetch only if we don't have fresh cache
    if (!hasFreshCache) {
      (async () => {
        try {
          const roots = await getRootCategories();
          if (isMounted) {
            const data = Array.isArray(roots) ? roots : [];
            setRootCategories(data);
            try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
          }
        } catch (e) {
          console.error('Failed to load root categories:', e);
          if (isMounted) setRootCategories([]);
        }
      })();
    }
    return () => { isMounted = false; };
  }, []);

  // Refetch roots after login without page refresh
  useEffect(() => {
    const onAuthChanged = (e) => {
      if (e?.detail?.isAuthenticated) {
        (async () => {
          try {
            const roots = await getRootCategories();
            const data = Array.isArray(roots) ? roots : [];
            setRootCategories(data);
            try { sessionStorage.setItem('atlas_root_categories', JSON.stringify({ data, ts: Date.now() })); } catch {}
          } catch (err) {
            console.error('Refetch roots after auth failed:', err);
          }
        })();
      }
    };
    window.addEventListener('atlas:auth-changed', onAuthChanged);
    return () => window.removeEventListener('atlas:auth-changed', onAuthChanged);
  }, []);

  // Abort any in-flight category requests on unmount
  useEffect(() => {
    return () => {
      try {
        const ctrls = controllersRef.current || {};
        Object.values(ctrls).forEach((c) => {
          try { c.abort(); } catch {}
        });
      } catch {}
    };
  }, []);

  // Persist categoryTrees to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('atlas_category_trees', JSON.stringify(categoryTrees || {}));
    } catch {}
  }, [categoryTrees]);

  // Landing products (Trending)
  const [landingProducts, setLandingProducts] = useState([]);
  const [lpLoading, setLpLoading] = useState(false);
  const [lpError, setLpError] = useState('');
  const [lpPage, setLpPage] = useState(1);
  const [lpHasMore, setLpHasMore] = useState(false);
  const [lpLoadingMore, setLpLoadingMore] = useState(false);
  useEffect(() => {
    const load = async () => {
      setLpLoading(true); setLpError('');
      try {
        const LIMIT = 8;
        const data = await listGeneral({ limit: LIMIT, page: 1 });
        const arr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        const mapped = arr.map(p => {
          // Derive the highest rating from API fields; fallback to average rating, then 0
          const rawRating = p?.highest_rating ?? p?.max_rating ?? p?.highest_review ?? p?.average_rating ?? p?.avg_rating ?? p?.rating ?? p?.stars ?? 0;
          const rating = Number(rawRating) || 0;
          return {
            id: p.id,
            title: p.title || p.name || 'Untitled',
            thumb: getProductThumb(p),
            rating,
          };
        });
        setLandingProducts(mapped);
        const totalCount = typeof data?.count === 'number' ? data.count : undefined;
        const next = data?.next;
        const hasMore = Boolean(next) || (typeof totalCount === 'number' ? mapped.length < totalCount : mapped.length === LIMIT);
        setLpHasMore(hasMore);
        setLpPage(1);
      } catch (e) {
        console.error('Load landing products failed', e);
        setLpError(e?.message || 'Failed to load products');
      } finally { setLpLoading(false); }
    };
    load();
  }, []);

  const loadMoreLanding = async () => {
    if (lpLoadingMore || !lpHasMore) return;
    setLpLoadingMore(true);
    setLpError('');
    try {
      const LIMIT = 8;
      const nextPage = lpPage + 1;
      const data = await listGeneral({ limit: LIMIT, page: nextPage });
      const arr = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const mapped = arr.map(p => {
        const rawRating = p?.highest_rating ?? p?.max_rating ?? p?.highest_review ?? p?.average_rating ?? p?.avg_rating ?? p?.rating ?? p?.stars ?? 0;
        const rating = Number(rawRating) || 0;
        return {
          id: p.id,
          title: p.title || p.name || 'Untitled',
          thumb: getProductThumb(p),
          rating,
        };
      });
      let newLength = 0;
      setLandingProducts(prev => {
        const combined = [...prev, ...mapped];
        newLength = combined.length;
        return combined;
      });
      const totalCount = typeof data?.count === 'number' ? data.count : undefined;
      const next = data?.next;
      const hasMore = Boolean(next) || (typeof totalCount === 'number' ? newLength < totalCount : mapped.length === LIMIT);
      setLpHasMore(hasMore);
      setLpPage(nextPage);
    } catch (e) {
      console.error('Load more landing products failed', e);
      setLpError(e?.message || 'Failed to load more products');
    } finally {
      setLpLoadingMore(false);
    }
  };

  // Helper function to get business verification status styling
  const getStatusStyling = (status) => {
    // Normalize status to lowercase for comparison
    const normalizedStatus = status?.toLowerCase();

    switch (normalizedStatus) {
      case 'unverified':
        return {
          bgColor: 'bg-gray-100 text-gray-800',
          dotColor: 'bg-gray-400',
          textColor: 'text-gray-600',
          icon: '!',
          label: 'Unverified'
        };
      case 'verified':
      case 'approved':
        return {
          bgColor: 'bg-green-100 text-green-800',
          dotColor: 'bg-green-500',
          textColor: 'text-green-600',
          icon: '✓',
          label: 'Verified'
        };
      case 'rejected':
        return {
          bgColor: 'bg-red-100 text-red-800',
          dotColor: 'bg-red-500',
          textColor: 'text-red-600',
          icon: '✗',
          label: 'Rejected'
        };
      case 'pending':
        return {
          bgColor: 'bg-yellow-100 text-yellow-800',
          dotColor: 'bg-yellow-500',
          textColor: 'text-yellow-600',
          icon: '⏳',
          label: 'Pending'
        };
      default:
        return {
          bgColor: 'bg-gray-100 text-gray-800',
          dotColor: 'bg-gray-400',
          textColor: 'text-gray-600',
          icon: '!',
          label: 'Unverified'
        };
    }
  };

  // --- Mega Menu helpers ---
  const ensureTree = useCallback(async (id) => {
    if (!id) return;
    if (categoryTrees[id]) return;
    if (loadingTrees[id]) return;
    // Start loading state
    setLoadingTrees(prev => ({ ...prev, [id]: true }));
    // Abort any previous controller for this id
    try { controllersRef.current[id]?.abort(); } catch {}
    const controller = new AbortController();
    controllersRef.current[id] = controller;
    try {
      const detail = await getCategoryDetail(id, { signal: controller.signal });
      setCategoryTrees(prev => ({ ...prev, [id]: detail }));
    } catch (e) {
      if (e?.name !== 'AbortError') {
        console.error('Failed to load category detail:', e);
      }
    } finally {
      // Clear loading and controller if still current
      setLoadingTrees(prev => {
        const nxt = { ...prev };
        delete nxt[id];
        return nxt;
      });
      if (controllersRef.current[id] === controller) {
        delete controllersRef.current[id];
      }
    }
  }, [categoryTrees, loadingTrees]);

  const openMega = useCallback(() => {
    if (megaCloseTimeout.current) {
      clearTimeout(megaCloseTimeout.current);
      megaCloseTimeout.current = null;
    }
    setIsMegaOpen(true);
    // Prefetch first few roots for instant hover UX
    queueMicrotask?.(() => {
      const PREFETCH_COUNT = 4;
      const ids = (rootCategories || []).slice(0, PREFETCH_COUNT).map(r => r.id);
      ids.forEach((rid) => {
        if (!categoryTrees[rid] && !loadingTrees[rid]) {
          ensureTree(rid);
        }
      });
      // If nothing is hovered yet, select the first root so the panel isn't empty
      if (!hoveredRootId && Array.isArray(rootCategories) && rootCategories.length > 0) {
        const firstId = rootCategories[0].id;
        setHoveredRootId(firstId);
        if (!categoryTrees[firstId] && !loadingTrees[firstId]) ensureTree(firstId);
      }
    });
  }, [rootCategories, categoryTrees, loadingTrees, ensureTree, hoveredRootId]);

  const delayedCloseMega = useCallback(() => {
    if (megaCloseTimeout.current) clearTimeout(megaCloseTimeout.current);
    // Small delay so users can move the cursor into the panel without it disappearing
    megaCloseTimeout.current = setTimeout(() => setIsMegaOpen(false), 400);
  }, []);

  const handleRootHover = useCallback((id) => {
    setHoveredRootId(id);
    // Debounced fetch (microtask)
    Promise.resolve().then(() => ensureTree(id));
  }, [ensureTree]);

  const hoveredTree = useMemo(() => (hoveredRootId ? categoryTrees[hoveredRootId] : null), [hoveredRootId, categoryTrees]);

  // Sidebar (next to slider) independent hover mega
  const [isSideMegaOpen, setIsSideMegaOpen] = useState(false);
  const [sideHoveredRootId, setSideHoveredRootId] = useState(null);
  const sideCloseTimeout = useRef(null);

  const openSideMega = useCallback(() => {
    if (sideCloseTimeout.current) {
      clearTimeout(sideCloseTimeout.current);
      sideCloseTimeout.current = null;
    }
    setIsSideMegaOpen(true);
  }, []);

  const delayedCloseSideMega = useCallback(() => {
    if (sideCloseTimeout.current) clearTimeout(sideCloseTimeout.current);
    sideCloseTimeout.current = setTimeout(() => setIsSideMegaOpen(false), 400);
  }, []);

  const handleSideRootHover = useCallback((id) => {
    setSideHoveredRootId(id);
    Promise.resolve().then(() => ensureTree(id));
  }, [ensureTree]);

  const sideHoveredTree = useMemo(() => (sideHoveredRootId ? categoryTrees[sideHoveredRootId] : null), [sideHoveredRootId, categoryTrees]);

  const onSelectCategory = useCallback((id) => {
    if (!id && id !== 0) return;
    try {
      navigate(`/category/${id}`);
    } finally {
      setIsMegaOpen(false);
      setHoveredRootId(null);
    }
  }, [navigate]);

  // Function to sync with AuthContext
  const syncWithAuthContext = () => {
    if (isAuthenticated && user) {
      setUserAtlasId(user.atlasId || user.atlas_id || user.email?.split('@')[0]);
      setBusinessVerificationStatus(
        user.businessVerificationStatus ||
        user.business_verification_status ||
        'UNVERIFIED'
      );
      setIsLoggedIn(true);
    } else {
      setUserAtlasId(null);
      setBusinessVerificationStatus('UNVERIFIED');
      setIsLoggedIn(false);
    }
    setIsLoading(false);
  };

  // Authentication handlers
  const handleAuthComplete = (authResult) => {
    console.log('Authentication completed:', authResult);

    // Debug: Check what's in localStorage
    authStorage.debugAuth();

    if (authResult.type === 'login') {
      console.log('Handling login completion...');

      // Get user data from stored auth or use email as fallback
      const storedUserData = authStorage.getUserData();
      console.log('Stored user data after login:', storedUserData);

      const atlasId = storedUserData?.atlasId || authResult.data.email.split('@')[0];
      const businessStatus = storedUserData?.businessVerificationStatus || storedUserData?.business_verification_status || storedUserData?.business_status || storedUserData?.company_verification_status || 'UNVERIFIED';

      console.log('Setting user state:', { atlasId, businessStatus });

      setIsLoggedIn(true);
      setUserAtlasId(atlasId);
      setBusinessVerificationStatus(businessStatus);
    } else if (authResult.type === 'registration') {
      console.log('Handling registration completion...');

      // For registration, the auth data should already be stored by the API call
      const storedUserData = authStorage.getUserData();
      console.log('Stored user data after registration:', storedUserData);

      const atlasId = storedUserData?.atlasId || authResult.data.email.split('@')[0];
      const businessStatus = storedUserData?.businessVerificationStatus || storedUserData?.business_verification_status || storedUserData?.business_status || storedUserData?.company_verification_status || 'PENDING';

      setIsLoggedIn(true);
      setUserAtlasId(atlasId);
      setBusinessVerificationStatus(businessStatus);
    } else if (authResult.type === 'passwordReset') {
      // Password reset completed, show success message
      console.log('Password reset successful');
    }

    setShowAuthFlow(false);
    setIsLoading(false);
  };

  const handleSignIn = () => {
    setAuthStartType('login');
    setShowAuthFlow(true);
    setIsAccountDropdownOpen(false);
  };

  const handleSignUp = () => {
    setAuthStartType('signup');
    setShowAuthFlow(true);
    setIsAccountDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      // Call logout API and clear stored data
      await logout();
      // Use AuthContext logout
      authLogout();
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout from context even if API call fails
      authLogout();
    } finally {
      // Always update UI state
      setIsLoggedIn(false);
      setUserAtlasId(null);
      setBusinessVerificationStatus('UNVERIFIED');
      setIsAccountDropdownOpen(false);
    }
  };

  const handleBecomeAgentClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setAuthStartType('login');
      setShowAuthFlow(true);
    }
    // If logged in, the Link will navigate normally
  };



  // Sync with AuthContext when authentication state changes
  useEffect(() => {
    console.log('LandingPage: AuthContext state changed', { isAuthenticated, user });
    syncWithAuthContext();
  }, [isAuthenticated, user]);

  // Close dropdown and mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAccountDropdownOpen && !event.target.closest('.account-dropdown')) {
        setIsAccountDropdownOpen(false);
      }
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAccountDropdownOpen, isMobileMenuOpen]);

  // Show AuthFlow as modal if authentication is needed

  return (
    <div className="relative w-full min-h-screen bg-[#FAFBFC]">
      {/* Header Navigation */}
      <header className="w-full bg-white shadow-sm">
        <div className="mx-auto px-4 sm:px-6 py-4 max-w-7xl flex items-center justify-between flex-nowrap">
          <div className="flex items-center space-x-4 sm:space-x-8 flex-nowrap">
            {/* Logo */}
            <Logo to="/" height="h-20 md:h-24" />

            {/* Product text */}
            <div className="hidden md:flex items-center">
              <span className="text-gray-700">Product</span>
            </div>

            <div className="hidden md:block relative w-64 lg:w-96">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { navigate(`/?q=${encodeURIComponent(searchTerm.trim())}`); } }}
                placeholder="Enter keyword to search Product..."
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
              />
              <button
                onClick={() => navigate(`/?q=${encodeURIComponent(searchTerm.trim())}`)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#027DDB] text-white p-2 rounded-md hover:bg-[#0266b3] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              {searchTerm.trim().length >= 2 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="px-3 py-2 text-xs text-gray-500">
                    {suggestLoading ? 'Searching…' : `Results for "${searchTerm.trim()}"`}
                  </div>
                  <div className="max-h-80 overflow-auto divide-y divide-gray-100">
                    {(!suggestLoading && (!Array.isArray(suggestResults) || suggestResults.length === 0)) && (
                      <div className="px-4 py-3 text-sm text-gray-500">No results</div>
                    )}
                    {Array.isArray(suggestResults) && suggestResults.map((p) => {
                      const id = p?.id ?? p?.pk ?? p?.uuid;
                      const title = (p?.title || p?.name || 'Untitled').toString();
                      const thumb = getProductThumb(p);
                      const displayTitle = title.length > 60 ? `${title.slice(0, 57)}…` : title;
                      return (
                        <div
                          key={id || title}
                          className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            if (id) navigate(`/product/${id}`);
                            setSearchTerm('');
                            setSuggestOpen(false);
                          }}
                        >
                          <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-100 mr-3">
                            {thumb ? (
                              <img src={thumb} alt={title} className="w-10 h-10 object-cover" />
                            ) : (
                              <div className="w-10 h-10 flex items-center justify-center text-[10px] text-gray-400">No image</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-gray-800 truncate">{displayTitle}</div>
                            <div className="text-xs text-gray-500 truncate">#{id}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-6 flex-nowrap">
            {/* Mobile Atlas ID and Account - Show on mobile */}
            <div className="flex lg:hidden items-center space-x-2">
              {/* Mobile Atlas ID */}
              <div className="text-xs">
                {isLoading ? (
                  <span className="animate-pulse text-gray-700">Loading...</span>
                ) : (
                  <div className="flex flex-col items-end">
                    <div className="text-gray-700 font-medium text-xs">Atlas-WD</div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600 text-xs">
                        {isLoggedIn && userAtlasId ? `#${userAtlasId}` : 'Guest'}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        isLoggedIn ? getStatusStyling(businessVerificationStatus).dotColor : 'bg-gray-400'
                      }`}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Account Dropdown */}
            <div
              className="hidden lg:block relative account-dropdown"
              onMouseEnter={() => {
                if (hoverCloseTimeout.current) {
                  clearTimeout(hoverCloseTimeout.current);
                  hoverCloseTimeout.current = null;
                }
                setIsAccountDropdownOpen(true);
              }}
              onMouseLeave={() => {
                // Small delay to allow moving from trigger to menu without closing
                if (hoverCloseTimeout.current) {
                  clearTimeout(hoverCloseTimeout.current);
                }
                hoverCloseTimeout.current = setTimeout(() => {
                  setIsAccountDropdownOpen(false);
                }, 150);
              }}
            >
              <button
                type="button"
                onFocus={() => setIsAccountDropdownOpen(true)}
                onBlur={(e) => {
                  // Close only if focus leaves the dropdown container
                  if (!e.currentTarget.closest('.account-dropdown')?.contains(document.activeElement)) {
                    setIsAccountDropdownOpen(false);
                  }
                }}
                className="flex items-center space-x-2 text-gray-700 hover:text-[#027DDB] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm">Account</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Account Dropdown Menu */}
              {isAccountDropdownOpen && (
                <div className="absolute right-0 top-full mt-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-2">
                    {isAuthenticated ? (
                      // Logged in user options
                      <>
                        <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                          <div className="font-medium">ATLAS ID: {userAtlasId}</div>
                          <div className={`text-xs ${isAuthenticated ? getStatusStyling(businessVerificationStatus).textColor : 'text-gray-600'}`}>
                            {isAuthenticated ? `${getStatusStyling(businessVerificationStatus).icon} ${getStatusStyling(businessVerificationStatus).label}` : 'Guest'}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setIsAccountDropdownOpen(false);
                            navigate('/dashboard');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>Dashboard</span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setIsAccountDropdownOpen(false);
                            navigate('/dashboard/verification');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Verify your business</span>
                          </div>
                        </button>
                        {/* removed duplicate verify link */}
                        <hr className="my-2 border-gray-200" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                          </div>
                        </button>
                      </>
                    ) : (
                      // Not logged in options
                      <>
                        <button
                          onClick={handleSignIn}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            <span>Sign In</span>
                          </div>
                        </button>
                        <button
                          onClick={handleSignUp}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span>Sign Up</span>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Mobile Navigation Icons - Show only icons on mobile */}
            <div className="flex sm:hidden items-center space-x-2">
              {/* Messages */}
              <button
                onClick={() => navigate('/dashboard/message-guide?tab=inbox')}
                className="relative p-1 text-gray-700 hover:text-[#027DDB] transition-colors"
                aria-label="Messages"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {isLoggedIn && notif.unread_messages > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
                    {Math.min(99, notif.unread_messages)}
                  </span>
                )}
              </button>
              {/* Product Request */}
              <div
                className="relative p-1 text-gray-700"
                aria-label="Product Requests"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {isLoggedIn && prTotalCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
                    {Math.min(99, prTotalCount)}
                  </span>
                )}
              </div>
              {/* Video Channel */}
              <Link to="/video-channel" className="p-1 text-gray-700 hover:text-[#027DDB] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </Link>
              {/* Mobile Account Dropdown */}
              <div className="relative account-dropdown">
                <button
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="p-1 text-gray-700 hover:text-[#027DDB] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                {/* Mobile Account Dropdown Menu */}
                {isAccountDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-2">
                      {isLoggedIn ? (
                        // Logged in user options
                        <>
                          <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                            <div className="font-medium">ATLAS ID: {userAtlasId}</div>
                            <div className={`text-xs ${isLoggedIn ? getStatusStyling(businessVerificationStatus).textColor : 'text-gray-600'}`}>
                              {isLoggedIn ? `${getStatusStyling(businessVerificationStatus).icon} ${getStatusStyling(businessVerificationStatus).label}` : 'Guest'}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setIsAccountDropdownOpen(false);
                              navigate('/dashboard');
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <span>Dashboard</span>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setIsAccountDropdownOpen(false);
                              navigate('/dashboard/verification');
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Verify your business</span>
                            </div>
                          </button>
                          <hr className="my-2 border-gray-200" />
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              <span>Logout</span>
                            </div>
                          </button>
                        </>
                      ) : (
                        // Not logged in options
                        <>
                          <button
                            onClick={handleSignIn}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                              </svg>
                              <span>Sign In</span>
                            </div>
                          </button>
                          <button
                            onClick={handleSignUp}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                              <span>Sign Up</span>
                            </div>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            

            {/* Desktop Navigation - Show with text on larger screens */}
            <button onClick={() => navigate('/dashboard/message-guide?tab=inbox')} className="relative hidden md:flex items-center space-x-2 text-gray-700 hover:text-[#027DDB] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="hidden lg:inline text-sm">Messages</span>
              {isLoggedIn && notif.unread_messages > 0 && (
                <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
                  {Math.min(99, notif.unread_messages)}
                </span>
              )}
            </button>
            <div className="relative hidden md:flex items-center space-x-2 text-gray-700 whitespace-nowrap">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="hidden lg:inline text-sm">Product request</span>
              {isLoggedIn && prTotalCount > 0 && (
                <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
                  {Math.min(99, prTotalCount)}
                </span>
              )}
            </div>
            <Link to="/video-channel" className="hidden md:flex items-center space-x-2 text-gray-700 hover:text-[#027DDB] transition-colors whitespace-nowrap">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="hidden lg:inline text-sm">Video Channel</span>
            </Link>

            {/* Account Dropdown - Tablet/Desktop */}
            <div className="relative hidden md:flex lg:hidden items-center account-dropdown">
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                aria-haspopup="menu"
                aria-expanded={isAccountDropdownOpen ? 'true' : 'false'}
                className="px-2 py-1 text-gray-700 hover:text-[#027DDB] transition-colors flex items-center space-x-2 shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium">Account</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isAccountDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-2">
                    {isLoggedIn ? (
                      <>
                        <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                          <div className="font-medium">ATLAS ID: {userAtlasId}</div>
                          <div className={`text-xs ${isLoggedIn ? getStatusStyling(businessVerificationStatus).textColor : 'text-gray-600'}`}>
                            {isLoggedIn ? `${getStatusStyling(businessVerificationStatus).icon} ${getStatusStyling(businessVerificationStatus).label}` : 'Guest'}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsAccountDropdownOpen(false);
                            navigate('/dashboard');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>Dashboard</span>
                          </div>
                        </button>
                        <hr className="my-2 border-gray-200" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                          </div>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleSignIn}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            <span>Sign In</span>
                          </div>
                        </button>
                        <button
                          onClick={handleSignUp}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span>Sign Up</span>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Atlas-WD ID and Verification Status - Dynamic from backend */}
            <div className="hidden lg:block text-sm">
              {isLoading ? (
                <span className="animate-pulse text-gray-700">Loading...</span>
              ) : (
                <div className="flex flex-col items-end space-y-1">
                  <div className="text-gray-700 hidden">
                    {/* Company label hidden per request */}
                    <span className="font-medium">Atlas-WD LLC</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Show Atlas ID only if logged in, otherwise show generic text */}
                    <span className="text-gray-600 text-xs">
                      {isLoggedIn && userAtlasId ? `ATLAS ID: ${userAtlasId}` : 'Guest User'}
                    </span>
                    {/* Always show verification status */}
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                      isLoggedIn ? getStatusStyling(businessVerificationStatus).bgColor : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        isLoggedIn ? getStatusStyling(businessVerificationStatus).dotColor : 'bg-gray-400'
                      }`}></div>
                      <span>{isLoggedIn ? getStatusStyling(businessVerificationStatus).label : 'Guest'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-[#027DDB] mobile-menu-container"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 mobile-menu-container">
            <div className="px-4 py-4 space-y-3">
              <a href="#" className="block py-2 text-gray-700 hover:text-[#027DDB] transition-colors border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <button type="button" onClick={() => setIsMobileCategoriesOpen(true)} className="text-left w-full">All Categories</button>
                </div>
              </a>
              <Link
                to="/become-agent"
                onClick={handleBecomeAgentClick}
                className="block py-2 text-gray-700 hover:text-[#027DDB] transition-colors border-b border-gray-100"
              >
                Become an Agent {!isLoggedIn && <span className="text-xs text-gray-500">(Login Required)</span>}
              </Link>
              <Link to="/top-ranking" className="block py-2 text-gray-700 hover:text-[#027DDB] transition-colors border-b border-gray-100">
                Top Ranking Product
              </Link>
              <div className="border-b border-gray-100">
                <button className="w-full text-left py-2 text-gray-700 hover:text-[#027DDB] transition-colors flex items-center justify-between">
                  <span>Manufacturer</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <div className="border-b border-gray-100">
                <button
                  className="w-full text-left py-2 text-gray-700 hover:text-[#027DDB] transition-colors flex items-center justify-between"
                  onClick={() => setIsMobileAppOpen(v => !v)}
                  aria-expanded={isMobileAppOpen}
                  aria-controls="mobile-app-links"
                >
                  <span>App</span>
                  <svg className={`w-4 h-4 transition-transform ${isMobileAppOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isMobileAppOpen && (
                  <div id="mobile-app-links" className="px-2 pb-3 space-y-2">
                    <a href="#" className="block" aria-label="Download on the App Store (coming soon)">
                      <div className="inline-flex items-center space-x-2 bg-black text-white rounded-md px-3 py-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                          <path d="M318.7 268.7c-.2-36.7 16.3-64.4 49.6-84.8-18.8-27-46.9-41.8-84-44.8-35.2-2.8-73.2 20.5-87.3 20.5-14.4 0-49.1-19.5-76.1-19.5-55.6.9-115.5 45.6-115.5 136.3 0 26.8 4.9 54.6 14.8 83.5 13.2 38 60.9 131 110.2 129.5 25.9-.6 44.2-18.3 77.9-18.3 33.3 0 50.4 18.3 76.1 18.3 49.6-.7 93.1-85.3 106.3-123.4-67.2-31.9-61.9-93.1-61.9-97.3zM260.1 85.3c26.4-31.4 24-60 23.1-70.3-22.3 1.3-48.2 15-63.3 33.1-16.5 19.3-26.3 43.4-24.2 69 24.1 1.9 47-12.1 64.4-31.8z"/>
                        </svg>
                        <div className="leading-tight">
                          <div className="text-[10px]">Download on the</div>
                          <div className="text-sm font-semibold">App Store</div>
                        </div>
                      </div>
                    </a>
                    <a href="#" className="block" aria-label="Get it on Google Play (coming soon)">
                      <div className="inline-flex items-center space-x-2 bg-black text-white rounded-md px-3 py-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                          <path d="M325.3 234.3L104.6 13.6C96.2 5.1 85.6 0 74.1 0 49.1 0 28.2 20.9 28.2 46v420c0 25.1 20.9 46 46 46 11.5 0 22.1-5.1 30.5-13.6l220.6-220.6c17.3-17.4 17.3-45.5 0-62.8zM361.1 198.5l-34.4 34.3 121.7 121.7c8.5-8.5 13.8-20.3 13.8-33.4 0-13-5.3-24.8-13.8-33.4l-87.3-89.2zM326.7 314.9l34.4 34.4 87.3-87.3-34.4-34.4-87.3 87.3z"/>
                        </svg>
                        <div className="leading-tight">
                          <div className="text-[10px]">GET IT ON</div>
                          <div className="text-sm font-semibold">Google Play</div>
                        </div>
                      </div>
                    </a>
                  </div>
                )}
              </div>
              <a href="#" className="block py-2 text-gray-700 hover:text-[#027DDB] transition-colors border-b border-gray-100">
                Updates
              </a>
              <a href="#" className="block py-2 text-gray-700 hover:text-[#027DDB] transition-colors border-b border-gray-100">
                Help
              </a>
              <Link to="/dashboard/message-guide?tab=product" className="block py-2 text-gray-700 hover:text-[#027DDB] transition-colors border-b border-gray-100">
                Source Request
              </Link>
              <div className="pt-2">
                <button className="w-full text-left py-2 text-gray-700 hover:text-[#027DDB] transition-colors flex items-center justify-between">
                  <span>English</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 sm:px-6 pb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Enter keywords to search Products"
              className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#027DDB] text-white p-2 rounded-md hover:bg-[#0266b3] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Blue accent line */}
        <div className="h-1 bg-[#027DDB]"></div>

        {/* Secondary Navigation */}
        <nav className="hidden lg:block border-t border-gray-200 bg-white">
          <div className="mx-auto px-4 sm:px-6 flex items-center justify-between max-w-7xl">
            <div className="flex items-center space-x-8">
              <div
                className="relative"
                onMouseEnter={openMega}
                onMouseLeave={delayedCloseMega}
              >
                <button
                  className={`flex items-center space-x-2 py-3 transition-colors ${isMegaOpen ? 'text-[#027DDB]' : 'text-gray-700 hover:text-[#027DDB]'}`}
                  onClick={() => openMega()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="font-medium">All Categories</span>
                </button>
                {isMegaOpen && (
                  <div
                    className="absolute left-0 top-full z-50 mt-0 w-[72rem] max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-xl"
                    onMouseEnter={openMega}
                    onMouseLeave={delayedCloseMega}
                  >
                    <div className="flex">
                      {/* Roots column */}
                      <div className="w-64 border-r border-gray-100 p-3 space-y-1 overflow-y-auto max-h-[70vh]">
                        {rootCategories.length === 0 ? (
                          <div className="text-sm text-gray-500 px-2 py-1">Loading…</div>
                        ) : (
                          rootCategories.map((root) => (
                            <button
                              key={root.id}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm ${hoveredRootId === root.id ? 'bg-blue-50 text-[#027DDB]' : 'text-gray-700 hover:bg-gray-50'}`}
                              onMouseEnter={() => handleRootHover(root.id)}
                              onClick={() => onSelectCategory(root.id)}
                            >
                              {root.name}
                            </button>
                          ))
                        )}
                      </div>
                      {/* Nested panel */}
                      <div className="flex-1 p-4 overflow-auto max-h-[70vh]">
                        {hoveredRootId && loadingTrees[hoveredRootId] && (
                          <div className="space-y-3">
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-40" />
                            <div className="grid grid-cols-3 gap-4">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
                              ))}
                            </div>
                          </div>
                        )}
                        {!loadingTrees[hoveredRootId] && hoveredTree ? (
                          <div className="grid grid-flow-col auto-cols-[260px] gap-4">
                            <CategoryNode node={hoveredTree} depth={0} onSelectCategory={onSelectCategory} />
                          </div>
                        ) : !hoveredRootId ? (
                          <div className="text-sm text-gray-500">Hover a root category to explore subcategories</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Link
                to="/become-agent"
                onClick={handleBecomeAgentClick}
                className="py-3 text-gray-700 hover:text-[#027DDB] transition-colors"
              >
                Become an Agent {!isLoggedIn && <span className="text-xs text-gray-500">(Login Required)</span>}
              </Link>
              <Link to="/top-ranking" className="py-3 text-gray-700 hover:text-[#027DDB] transition-colors">Top Ranking Product</Link>
              <div className="relative group">
                <button className="py-3 text-gray-700 hover:text-[#027DDB] transition-colors flex items-center space-x-1">
                  <span>Manufacturer</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <div className="relative group">
                <button className="py-3 text-gray-700 hover:text-[#027DDB] transition-colors flex items-center space-x-1">
                  <span>App</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 top-full mt-1 w-[260px] bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-3 space-y-2">
                  <a href="#" className="block" aria-label="Download on the App Store (coming soon)">
                    <div className="w-full flex items-center justify-center bg-black text-white rounded-md px-3 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-4 h-4 mr-2" fill="currentColor" aria-hidden="true">
                        <path d="M318.7 268.7c-.2-36.7 16.3-64.4 49.6-84.8-18.8-27-46.9-41.8-84-44.8-35.2-2.8-73.2 20.5-87.3 20.5-14.4 0-49.1-19.5-76.1-19.5-55.6.9-115.5 45.6-115.5 136.3 0 26.8 4.9 54.6 14.8 83.5 13.2 38 60.9 131 110.2 129.5 25.9-.6 44.2-18.3 77.9-18.3 33.3 0 50.4 18.3 76.1 18.3 49.6-.7 93.1-85.3 106.3-123.4-67.2-31.9-61.9-93.1-61.9-97.3zM260.1 85.3c26.4-31.4 24-60 23.1-70.3-22.3 1.3-48.2 15-63.3 33.1-16.5 19.3-26.3 43.4-24.2 69 24.1 1.9 47-12.1 64.4-31.8z"/>
                      </svg>
                      <div className="leading-tight text-left">
                        <div className="text-[10px]">Download on the</div>
                        <div className="text-sm font-semibold">App Store</div>
                      </div>
                    </div>
                  </a>
                  <a href="#" className="block" aria-label="Get it on Google Play (coming soon)">
                    <div className="w-full flex items-center justify-center bg-black text-white rounded-md px-3 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-4 h-4 mr-2" fill="currentColor" aria-hidden="true">
                        <path d="M325.3 234.3L104.6 13.6C96.2 5.1 85.6 0 74.1 0 49.1 0 28.2 20.9 28.2 46v420c0 25.1 20.9 46 46 46 11.5 0 22.1-5.1 30.5-13.6l220.6-220.6c17.3-17.4 17.3-45.5 0-62.8zM361.1 198.5l-34.4 34.3 121.7 121.7c8.5-8.5 13.8-20.3 13.8-33.4 0-13-5.3-24.8-13.8-33.4l-87.3-89.2zM326.7 314.9l34.4 34.4 87.3-87.3-34.4-34.4-87.3 87.3z"/>
                      </svg>
                      <div className="leading-tight text-left">
                        <div className="text-[10px]">GET IT ON</div>
                        <div className="text-sm font-semibold">Google Play</div>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
              <a href="#" className="py-3 text-gray-700 hover:text-[#027DDB] transition-colors">Updates</a>
              <a href="#" className="py-3 text-gray-700 hover:text-[#027DDB] transition-colors">Help</a>
              <Link to="/dashboard/message-guide?tab=product" className="py-3 text-gray-700 hover:text-[#027DDB] transition-colors">Source Request</Link>
            </div>
            <div className="flex items-center">
              <div className="relative group">
                <button className="py-3 flex items-center space-x-1 text-gray-700 hover:text-[#027DDB] transition-colors">
                  <span>English</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {/* Language dropdown */}
                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">English</a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">German</a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">French</a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Spanish</a>
                </div>
              </div>
            </div>
          </div>
        </nav>

      </header>

      {/* Authentication Modal */}
      {showAuthFlow && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Modal Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowAuthFlow(false)}></div>

          {/* Modal Content - Full Screen */}
          <div className="relative w-full h-full">
            {/* Close Button */}
            <button
              onClick={() => setShowAuthFlow(false)}
              className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-md"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Auth Flow Content */}
            <AuthFlow onAuthComplete={handleAuthComplete} initialStep={authStartType} />
          </div>
        </div>
      )}

      {/* Mobile/Tablet Categories Drawer */}
      {isMobileCategoriesOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileCategoriesOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[88vw] max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">All Categories</h3>
              <button className="p-2" onClick={() => setIsMobileCategoriesOpen(false)} aria-label="Close categories">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-3">
              {rootCategories.length === 0 ? (
                <div className="text-sm text-gray-500">Loading…</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {rootCategories.map(root => (
                    <li key={root.id} className="py-2">
                      <button
                        className="w-full flex items-center justify-between py-2 text-left font-medium text-gray-800"
                        onClick={() => {
                          setExpandedMobile(prev => ({ ...prev, [root.id]: !prev[root.id] }));
                          if (!categoryTrees[root.id]) ensureTree(root.id);
                        }}
                      >
                        <span className="pr-3 text-[#027DDB]">{root.name}</span>
                        <svg className={`w-4 h-4 transition-transform ${expandedMobile[root.id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </button>
                      {expandedMobile[root.id] && (
                        <div className="pl-3 pt-1">
                          {loadingTrees[root.id] && (
                            <div className="space-y-2">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                              ))}
                            </div>
                          )}
                          {!loadingTrees[root.id] && categoryTrees[root.id] && (
                            <MobileCategoryItem node={categoryTrees[root.id]} depth={0} onSelectCategory={(id) => {
                              onSelectCategory(id);
                              setIsMobileCategoriesOpen(false);
                            }} />
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Banner Area with Light Blue Background */}
      <div className="bg-blue-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-8 flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Categories Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm relative">
              <h2 className="font-semibold text-lg mb-6 text-gray-800 border-b border-gray-200 pb-3">
                <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Categories
              </h2>
              <ul className="space-y-3">
                {rootCategories.length === 0 ? (
                  <li className="text-sm text-gray-500">Loading categories…</li>
                ) : (
                  rootCategories.slice(0, 8).map((c) => (
                    <li key={c.id}
                        onMouseEnter={() => { if (typeof window !== 'undefined' && window.innerWidth >= 1024) { openSideMega(); handleSideRootHover(c.id); } }}
                        onMouseLeave={() => { if (typeof window !== 'undefined' && window.innerWidth >= 1024) { delayedCloseSideMega(); } }}
                    >
                      <button
                        className="w-full text-left block py-2 px-3 rounded-md text-gray-700 hover:text-[#027DDB] hover:bg-blue-50 transition-colors"
                        onClick={() => {
                          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                            setIsMobileCategoriesOpen(true);
                            setExpandedMobile(prev => ({ ...prev, [c.id]: true }));
                            ensureTree(c.id);
                          } else {
                            // Desktop: go directly to the category listing page
                            onSelectCategory(c.id);
                          }
                        }}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))
                )}
              </ul>
              {/* Side hover mega panel */}
              {isSideMegaOpen && (
                <div
                  className="hidden lg:block absolute left-[15.5rem] top-[6.5rem] z-40 w-[56rem] max-w-[75vw] bg-white border border-gray-200 rounded-lg shadow-xl"
                  onMouseEnter={openSideMega}
                  onMouseLeave={delayedCloseSideMega}
                >
                  <div className="p-4 overflow-auto max-h-[70vh]">
                    {sideHoveredRootId && loadingTrees[sideHoveredRootId] && (
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-40" />
                        <div className="grid grid-cols-3 gap-4">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
                          ))}
                        </div>
                      </div>
                    )}
                    {!loadingTrees[sideHoveredRootId] && sideHoveredTree ? (
                      <div className="grid grid-flow-col auto-cols-[260px] gap-4">
                        <CategoryNode node={sideHoveredTree} depth={0} onSelectCategory={onSelectCategory} />
                      </div>
                    ) : !sideHoveredRootId ? (
                      <div className="text-sm text-gray-500">Hover a category to explore subcategories</div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Hero Slider */}
          <div className="flex-1 lg:flex-1">
            <div className="relative rounded-lg overflow-hidden shadow-sm bg-black">
              <div className="relative h-[300px] sm:h-[380px] lg:h-[420px] w-full">
                {slides.map((s, idx) => (
                  <img
                    key={idx}
                    src={s.image}
                    alt={s.title}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 z-0 ${
                      idx === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                ))}
                {/* Overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />

                {/* Text/content */}
                <div className="absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 max-w-[75%] sm:max-w-[60%] z-20">
                  <div className="inline-block bg-black/40 backdrop-blur-[2px] rounded-md p-3 sm:p-4">
                    <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-extrabold drop-shadow-md">
                      {slides[currentSlide].title}
                    </h2>
                    <p className="mt-2 text-white/95 text-sm sm:text-base lg:text-lg">
                      {slides[currentSlide].subtitle}
                    </p>
                    <div className="mt-4">
                      <Link
                        to="/become-agent"
                        onClick={handleBecomeAgentClick}
                        className="inline-block bg-[#027DDB] text-white px-5 py-2.5 rounded-md text-sm sm:text-base hover:bg-[#0266b3] transition-colors"
                      >
                        Explore Now
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <button
                  aria-label="Previous slide"
                  onClick={prevSlide}
                  className="absolute left-3 top-2/3 md:top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/80 hover:bg-white shadow transition z-30"
                >
                  <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  aria-label="Next slide"
                  onClick={nextSlide}
                  className="absolute right-3 top-2/3 md:top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/80 hover:bg-white shadow transition z-30"
                >
                  <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Dots */}
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-30">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      aria-label={`Go to slide ${idx + 1}`}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        idx === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* You May Like Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h2 className="font-semibold text-lg mb-4 text-gray-800">You May Like</h2>
              <div className="text-gray-500 text-sm">Coming soon</div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button onClick={() => setPrOpen(true)} className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm">
                  Post Your Product Request Now
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Video Channel moved to dedicated route /video-channel */}

      {/* Trending Products Section - Separate from Banner */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <section>
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Trending Products</h2>
            <p className="text-gray-600">Find our online product that best for everyone</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
            {lpLoading && (
              Array(4).fill().map((_, i) => (
                <div key={i} className="h-64 rounded-lg border animate-pulse bg-gray-50" />
              ))
            )}
            {!lpLoading && landingProducts.map((p, i) => (
              <ProductCard
                key={p.id || i}
                id={p.id}
                imageIndex={(i % 5) + 1}
                rating={p.rating ?? 0}
                imageUrl={p.thumb}
                title={p.title}
                onContactSeller={() => { setSelectedProductId(p.id); setContactOpen(true); }}
              />
            ))}
            {!lpLoading && !landingProducts.length && !lpError && (
              Array(8).fill().map((_, i) => (
                <ProductCard
                  key={`ph-${i}`}
                  id={i + 1}
                  imageIndex={(i % 5) + 1}
                  rating={0}
                  imageUrl={getProductThumb({})}
                  title={`Product ${i + 1}`}
                />
              ))
            )}
          </div>
          {lpError && <div className="text-sm text-red-600 mt-3">{lpError}</div>}
          {!lpLoading && lpHasMore && (
            <div className="text-center mt-6">
              <button
                onClick={loadMoreLanding}
                disabled={lpLoadingMore}
                className={`px-6 py-2 rounded-lg border font-medium transition-colors ${lpLoadingMore ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {lpLoadingMore ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
          <div className="text-center mt-8">
            <button onClick={() => navigate('/top-ranking')} className="bg-[#027DDB] text-white px-8 py-3 rounded-lg hover:bg-[#0266b3] transition-colors font-medium">
              View Top Ranking Products
            </button>
          </div>
        </section>
      </main>

      {/* Newsletter */}
      <section className="bg-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-md">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Subscribe to Our Newsletter</h2>
            <div className="flex">
              <input
                type="email"
                placeholder="Your Email Address"
                className="flex-1 px-4 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button className="px-6 py-2 bg-orange-500 text-white rounded-r-md hover:bg-orange-600 transition-colors font-medium">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-5 gap-8">
            <div className="col-span-1">
              <h3 className="font-bold text-lg mb-2 text-gray-800">ATLAS-WD</h3>
              <p className="text-sm text-gray-600">Your best online market</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-gray-800">Features</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Sourcing Guide</li>
                <li>• Trending products</li>
                <li>• Supplier Ranking</li>
                <li>• Product Design</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-gray-800">Support</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Customer Service</li>
                <li>• Help Center</li>
                <li>• Submit a Dispute</li>
                <li>• Report IPR</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-gray-800">Company</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Trade Assurance</li>
                <li>• Business Identity</li>
                <li>• Logistics Service</li>
                <li>• Secure Payment</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-gray-800">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Get mobile app</li>
                <li>• Product Monitoring</li>
                <li>• Trade Alert</li>
                <li>• Production Flow</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-300 text-center text-sm text-gray-600">
            <p>Copyright ©2022 ATLAS-WD. Trade Alert | All rights reserved.</p>
          </div>
        </div>
      </footer>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} roleLabel={roleLabel} productId={selectedProductId} />

      {/* Product Request Modal */}
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
              {/* Category (dropdown) */}
              <div>
                <label className="block text-sm text-slate-700 mb-1">Category</label>
                <select 
                  value={prCategoryId} 
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setPrCategoryId(selectedId);
                    // Find and store the category name for display
                    if (selectedId) {
                      const selectedCategory = prCategories.find(c => c.id.toString() === selectedId);
                      setPrCategoryName(selectedCategory ? selectedCategory.name : '');
                      setPrCategoryText(''); // Clear text input when dropdown is used
                    } else {
                      setPrCategoryName('');
                    }
                  }} 
                  className="w-full h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{prCatLoading ? 'Loading categories...' : 'Select a category'}</option>
                  {prCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {prCatError && <p className="text-xs text-red-600 mt-1">{prCatError}</p>}
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
                  {/* TODO: replace with full country list */}
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
                <button onClick={onSubmitProductRequest} disabled={prSubmitting} className={`px-3 py-2 text-sm rounded text-white ${prSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#027DDB] hover:brightness-95'}`}>{prSubmitting ? 'Submitting…' : 'Submit Request'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Recursive renderer for nested categories in the mega menu
function CategoryNode({ node, depth, onSelectCategory }) {
  return (
    <div className={`mega-col depth-${depth}`}>
      <div
        className="font-semibold mb-2 cursor-pointer text-[#027DDB]"
        onClick={() => onSelectCategory?.(node.id)}
      >
        {node.name}
      </div>
      {Array.isArray(node.children) && node.children.length > 0 && (
        <ul className="space-y-1">
          {node.children.map((child) => (
            <li key={child.id}>
              <div
                className="text-sm text-gray-700 hover:text-[#027DDB] cursor-pointer"
                onClick={() => onSelectCategory?.(child.id)}
              >
                {child.name}
              </div>
              {Array.isArray(child.children) && child.children.length > 0 && (
                <div className="mt-2 pl-2 border-l border-gray-100">
                  <CategoryNode node={child} depth={(depth || 0) + 1} onSelectCategory={onSelectCategory} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Mobile-friendly recursive list item for categories drawer
function MobileCategoryItem({ node, depth = 0, onSelectCategory }) {
  const [openIds, setOpenIds] = React.useState({}); // local open state for children
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;

  return (
    <div className={`mobile-cat depth-${depth}`}>
      {hasChildren ? (
        <ul className="space-y-1">
          {node.children.map((child) => {
            const childHas = Array.isArray(child.children) && child.children.length > 0;
            const isOpen = !!openIds[child.id];
            return (
              <li key={child.id} className="py-1">
                <div
                  className="flex items-center justify-between text-sm text-gray-800"
                >
                  <button
                    className="text-left flex-1 pr-2 hover:text-[#027DDB]"
                    onClick={() => onSelectCategory?.(child.id)}
                  >
                    {child.name}
                  </button>
                  {childHas && (
                    <button
                      aria-label="Toggle"
                      className="p-1"
                      onClick={() => setOpenIds((prev) => ({ ...prev, [child.id]: !prev[child.id] }))}
                    >
                      <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
                {childHas && isOpen && (
                  <div className="pl-3 mt-1 border-l border-gray-100">
                    <MobileCategoryItem node={child} depth={depth + 1} onSelectCategory={onSelectCategory} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default LandingPage;