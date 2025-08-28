        import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyProducts, userProductCounts, deleteProduct, updateProduct, uploadMedia, retrieveProduct, listCategories, replaceMediaFile, updateMedia, listMedia, deleteMedia, setPrimaryImage, listBrochures, createBrochure, updateBrochure, replaceBrochureFile, deleteBrochure, listAdditionalFiles, uploadAdditionalFile, deleteAdditionalFile } from '../../../services/productApi';
import { getProductThumb } from '../../../utils/media';

const ManageProducts = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, disapproved: 0, approved: 0 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [uiAlert, setUiAlert] = useState({ type: null, message: '' });
  const [editModal, setEditModal] = useState({
    open: false,
    id: null,
    loading: false,
    // basic
    title: '',
    displayOrder: '',
    product_type: '',
    keywords: '',
    article_model_no: '',
    category: '',
    is_featured: false,
    is_active: true,
    // rich/long fields
    description: '',
    specification: '',
    production_capacity: '',
    packaging_delivery: '',
    benefits: '',
    others: '',
    customer_feedback: '',
    questions_answers: '',
    specifications: [],
  });
  const [editCategories, setEditCategories] = useState({ loading: false, items: [], error: '' });
  const [imageTargetId, setImageTargetId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null });
  const [mediaModal, setMediaModal] = useState({ open: false, loading: false, productId: null, items: [], error: '' });
  const [brochureModal, setBrochureModal] = useState({ open: false, loading: false, productId: null, items: [], error: '' });
  const [sectionFilesModal, setSectionFilesModal] = useState({ open: false, loading: false, productId: null, items: [], error: '' });
  const [newSectionFile, setNewSectionFile] = useState({ section: '', title: '', file: null });
  const [uploadIntent, setUploadIntent] = useState(null); // { type: 'image'|'video'|'brochure', productId, mediaId? }
  const [uploadPreview, setUploadPreview] = useState({
    open: false,
    file: null,
    url: '',
    intent: null, // mirrors uploadIntent.type
    productId: null,
    mediaId: null,
    brochureId: null,
    media_type: null, // 'image' | 'video'
    title: '',
    is_primary: false,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        const data = await listMyProducts();
        // Normalize array from various possible shapes
        const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        const mapped = items.map((p) => {
          return {
            id: p.id,
            title: p.title || p.name || 'Untitled',
            group: p.group || p.product_group || '—',
            displayOrder: p.display_order || p.order || '—',
            postedOn: (p.created_at || p.created || p.posted_on || '').slice(0, 10),
            updatedOn: (p.updated_at || p.updated || '').slice(0, 10),
            hasPhotos: !!getProductThumb(p),
            thumb: getProductThumb(p),
            status: p.status || p.approval_status || (p.is_approved === true ? 'approved' : (p.is_approved === false ? 'disapproved' : undefined)),
            views: Number(p.view_count ?? p.views ?? 0),
          };
        });
        setProducts(mapped);
        // Fallback: set counts from fetched products in case counts endpoint is unavailable
        const cAll = mapped.length;
        const cPending = mapped.filter(p => (p.status || '').toLowerCase().includes('pending')).length;
        const cDisapproved = mapped.filter(p => (p.status || '').toLowerCase().includes('disapproved') || (p.status || '').toLowerCase().includes('rejected')).length;
        const cApproved = Math.max(0, cAll - cPending - cDisapproved);
        setCounts((prev) => ({ ...prev, all: cAll || prev.all, pending: cPending || prev.pending, disapproved: cDisapproved || prev.disapproved, approved: cApproved || prev.approved }));
        setSelectedIds([]);
      } catch (e) {
        console.error('Load products failed', e);
        setError(e?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load user product counts for dynamic tab badges
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const data = await userProductCounts();
        // Defensive parsing to accommodate different backend key names
        const all = (data?.total ?? data?.all ?? data?.all_count ?? counts.all) || 0;
        const pending = (data?.pending ?? data?.pending_count ?? data?.approval_pending ?? 0) || 0;
        const disapproved = (data?.disapproved ?? data?.rejected ?? data?.disapproved_count ?? 0) || 0;
        const approved = (data?.approved ?? data?.approved_count ?? (all - pending - disapproved)) || 0;
        setCounts({ all, pending, disapproved, approved });
      } catch (e) {
        // Silently ignore but keep whatever fallback we have
        console.warn('Failed to load user product counts', e);
      }
    };
    loadCounts();
  }, []);

  const handleOptionsClick = (productId) => {
    setShowOptionsDropdown(showOptionsDropdown === productId ? null : productId);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) setSelectedIds([]);
    else setSelectedIds(products.map(p => p.id));
  };

  const refreshProducts = async () => {
    try {
      const data = await listMyProducts();
      const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const mapped = items.map((p) => ({
        id: p.id,
        title: p.title || p.name || 'Untitled',
        group: p.group || p.product_group || '—',
        displayOrder: p.display_order || p.order || '—',
        postedOn: (p.created_at || p.created || p.posted_on || '').slice(0, 10),
        updatedOn: (p.updated_at || p.updated || '').slice(0, 10),
        hasPhotos: !!getProductThumb(p),
        thumb: getProductThumb(p),
        status: p.status || p.approval_status || (p.is_approved === true ? 'approved' : (p.is_approved === false ? 'disapproved' : undefined)),
        views: Number(p.view_count ?? p.views ?? 0),
      }));
      setProducts(mapped);
      setCounts((prev) => ({ ...prev, all: mapped.length }));
      setSelectedIds([]);
    } catch (e) {
      console.error('Refresh products failed', e);
      setUiAlert({ type: 'error', message: e?.message || 'Failed to refresh products' });
    }
  };

  // Media modal handlers
  const openMediaModal = async (productId) => {
    setMediaModal({ open: true, loading: true, productId, items: [], error: '' });
    try {
      const items = await listMedia(productId).catch(() => ({ results: [] }));
      const arr = Array.isArray(items?.results) ? items.results : (Array.isArray(items) ? items : []);
      setMediaModal({ open: true, loading: false, productId, items: arr, error: '' });
    } catch (e) {
      setMediaModal({ open: true, loading: false, productId, items: [], error: e?.message || 'Failed to load media' });
    }
  };
  const closeMediaModal = () => setMediaModal({ open: false, loading: false, productId: null, items: [], error: '' });
  const saveMediaTitle = async (m, title) => {
    try {
      await updateMedia(mediaModal.productId, m.id ?? m.pk ?? m.media_id ?? m.uuid, { title }, { partial: true });
      await openMediaModal(mediaModal.productId);
    } catch (e) {
      setUiAlert({ type: 'error', message: e?.message || 'Failed to update media title' });
    }
  };
  const makePrimary = async (m) => {
    try {
      const mid = m.id ?? m.pk ?? m.media_id ?? m.uuid;
      await setPrimaryImage(mediaModal.productId, mid);
      await openMediaModal(mediaModal.productId);
    } catch (e) {
      setUiAlert({ type: 'error', message: e?.message || 'Failed to set primary image' });
    }
  };
  const replaceMedia = (m) => {
    const mid = m.id ?? m.pk ?? m.media_id ?? m.uuid;
    setUploadIntent({ type: 'replace_media', productId: mediaModal.productId, mediaId: mid, media_type: m.media_type || (m.is_video ? 'video' : 'image') });
    document.getElementById('hiddenUniversalFile')?.click();
  };
  const deleteMediaItem = async (m) => {
    try {
      const mid = m.id ?? m.pk ?? m.media_id ?? m.uuid;
      await deleteMedia(mediaModal.productId, mid);
      await openMediaModal(mediaModal.productId);
    } catch (e) {
      setUiAlert({ type: 'error', message: e?.message || 'Failed to delete media' });
    }
  };
  const uploadNewMedia = (type) => {
    setUploadIntent({ type: `upload_${type}`, productId: mediaModal.productId, media_type: type });
    document.getElementById('hiddenUniversalFile')?.click();
  };

  // Brochure modal handlers
  const openBrochureModal = async (productId) => {
    setBrochureModal({ open: true, loading: true, productId, items: [], error: '' });
    try {
      const items = await listBrochures(productId).catch(() => ({ results: [] }));
      const arr = Array.isArray(items?.results) ? items.results : (Array.isArray(items) ? items : []);
      setBrochureModal({ open: true, loading: false, productId, items: arr, error: '' });
    } catch (e) {
      setBrochureModal({ open: true, loading: false, productId, items: [], error: e?.message || 'Failed to load brochures' });
    }
  };
  const closeBrochureModal = () => setBrochureModal({ open: false, loading: false, productId: null, items: [], error: '' });
  const saveBrochureTitle = async (b, title) => {
    try {
      const bid = b.id ?? b.pk ?? b.brochure_id ?? b.uuid;
      await updateBrochure(brochureModal.productId, bid, { title }, { partial: true });
      await openBrochureModal(brochureModal.productId);
    } catch (e) {
      setUiAlert({ type: 'error', message: e?.message || 'Failed to update brochure title' });
    }
  };
  const replaceBrochure = (b) => {
    const bid = b.id ?? b.pk ?? b.brochure_id ?? b.uuid;
    setUploadIntent({ type: 'replace_brochure', productId: brochureModal.productId, brochureId: bid });
    document.getElementById('hiddenUniversalFile')?.click();
  };
  const deleteBrochureItem = async (b) => {
    try {
      const bid = b.id ?? b.pk ?? b.brochure_id ?? b.uuid;
      await deleteBrochure(brochureModal.productId, bid);
      await openBrochureModal(brochureModal.productId);
    } catch (e) {
      setUiAlert({ type: 'error', message: e?.message || 'Failed to delete brochure' });
    }
  };
  const uploadNewBrochure = () => {
    setUploadIntent({ type: 'upload_brochure', productId: brochureModal.productId });
    document.getElementById('hiddenUniversalFile')?.click();
  };

  // Section files modal handlers
  const openSectionFilesModal = async (productId) => {
    setSectionFilesModal({ open: true, loading: true, productId, items: [], error: '' });
    try {
      const res = await listAdditionalFiles(productId).catch(() => ({ results: [] }));
      const arr = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
      setSectionFilesModal({ open: true, loading: false, productId, items: arr, error: '' });
    } catch (e) {
      setSectionFilesModal({ open: true, loading: false, productId, items: [], error: e?.message || 'Failed to load section files' });
    }
  };
  const closeSectionFilesModal = () => {
    setSectionFilesModal({ open: false, loading: false, productId: null, items: [], error: '' });
    setNewSectionFile({ section: '', title: '', file: null });
  };
  const onPickSectionFile = () => {
    document.getElementById('hiddenSectionFile')?.click();
  };
  const onSectionFileChosen = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setNewSectionFile(prev => ({ ...prev, file: f, title: prev.title || f.name }));
  };
  const doUploadSectionFile = async () => {
    const { section, title, file } = newSectionFile;
    if (!file || !section) { setUiAlert({ type: 'error', message: 'Select a section and file' }); return; }
    try {
      await uploadAdditionalFile(sectionFilesModal.productId, { file, section_type: section, title });
      setUiAlert({ type: 'success', message: 'File uploaded.' });
      setNewSectionFile({ section: '', title: '', file: null });
      await openSectionFilesModal(sectionFilesModal.productId);
    } catch (e) {
      setUiAlert({ type: 'error', message: e?.message || 'Upload failed' });
    }
  };
  const removeSectionFile = async (item) => {
    try {
      const fid = item.id ?? item.pk ?? item.file_id ?? item.uuid;
      await deleteAdditionalFile(sectionFilesModal.productId, fid);
      setUiAlert({ type: 'success', message: 'File deleted.' });
      await openSectionFilesModal(sectionFilesModal.productId);
    } catch (e) {
      setUiAlert({ type: 'error', message: e?.message || 'Delete failed' });
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    setConfirmModal({
      open: true,
      message: `Delete ${selectedIds.length} selected product(s)? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await Promise.all(selectedIds.map(id => deleteProduct(id).catch(err => ({ err, id }))));
          setUiAlert({ type: 'success', message: 'Selected products deleted.' });
          await refreshProducts();
        } catch (e) {
          setUiAlert({ type: 'error', message: e?.message || 'Failed to delete selected products' });
        } finally {
          setConfirmModal({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  const handleDeleteSingle = async (id) => {
    setConfirmModal({
      open: true,
      message: 'Delete this product? This cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteProduct(id);
          setUiAlert({ type: 'success', message: 'Product deleted.' });
          await refreshProducts();
        } catch (e) {
          setUiAlert({ type: 'error', message: e?.message || 'Failed to delete product' });
        } finally {
          setConfirmModal({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  const openEditModal = async (product) => {
    setShowOptionsDropdown(null);
    setEditModal(prev => ({ ...prev, open: true, id: product.id, loading: true }));
    // Load categories in parallel
    setEditCategories({ loading: true, items: [], error: '' });
    try {
      const [detail, catsRes] = await Promise.all([
        retrieveProduct(product.id),
        listCategories().catch(() => ({ results: [] }))
      ]);
      const cats = Array.isArray(catsRes?.results) ? catsRes.results : (Array.isArray(catsRes) ? catsRes : []);
      const catItems = cats.map(it => ({ id: it.id ?? it.value ?? it.pk ?? it.slug ?? it.code, name: it.name ?? it.title ?? it.label ?? String(it.id ?? it.value ?? '') })).filter(c => c.id != null);
      setEditCategories({ loading: false, items: catItems, error: '' });
      setEditModal(prev => ({
        ...prev,
        loading: false,
        title: detail?.title || product.title || '',
        displayOrder: String(detail?.display_order ?? product.displayOrder ?? ''),
        product_type: detail?.product_type || '',
        keywords: detail?.keywords || '',
        article_model_no: detail?.article_model_no || '',
        category: detail?.category ?? '',
        is_featured: !!detail?.is_featured,
        is_active: detail?.is_active !== false,
        description: detail?.description || '',
        specification: detail?.specification || '',
        production_capacity: detail?.production_capacity || '',
        packaging_delivery: detail?.packaging_delivery || '',
        benefits: detail?.benefits || '',
        others: detail?.others || '',
        customer_feedback: detail?.customer_feedback || '',
        questions_answers: detail?.questions_answers || '',
        specifications: Array.isArray(detail?.specifications) ? detail.specifications.map(s => ({ name: s.name || '', value: s.value || '' })) : [],
      }));
    } catch (e) {
      setEditModal(prev => ({ ...prev, loading: false }));
      setUiAlert({ type: 'error', message: e?.message || 'Failed to load product details' });
    }
  };
  const closeEditModal = () => setEditModal({
    open: false,
    id: null,
    loading: false,
    title: '',
    displayOrder: '',
    product_type: '',
    keywords: '',
    article_model_no: '',
    category: '',
    is_featured: false,
    is_active: true,
    description: '',
    specification: '',
    production_capacity: '',
    packaging_delivery: '',
    benefits: '',
    others: '',
    customer_feedback: '',
    questions_answers: '',
    specifications: [],
  });
  const saveEditModal = async () => {
    const id = editModal.id;
    if (!id) return;
    const payload = {
      title: (editModal.title || '').trim(),
      product_type: (editModal.product_type || '').trim(),
      keywords: (editModal.keywords || '').trim(),
      article_model_no: (editModal.article_model_no || '').trim() || null,
      category: editModal.category || null,
      is_featured: !!editModal.is_featured,
      is_active: !!editModal.is_active,
      description: editModal.description || '',
      specification: editModal.specification || '',
      production_capacity: editModal.production_capacity || '',
      packaging_delivery: editModal.packaging_delivery || '',
      benefits: editModal.benefits || '',
      others: editModal.others || '',
      customer_feedback: editModal.customer_feedback || '',
      questions_answers: editModal.questions_answers || '',
      specifications: Array.isArray(editModal.specifications) ? editModal.specifications.filter(d => d && (d.name || d.value)).map(d => ({ name: d.name || '', value: d.value || '' })) : [],
    };
    if (editModal.displayOrder !== '' && !isNaN(Number(editModal.displayOrder))) payload.display_order = Number(editModal.displayOrder);
    try {
      await updateProduct(id, payload, { partial: true });
      setUiAlert({ type: 'success', message: 'Product updated.' });
      closeEditModal();
      await refreshProducts();
    } catch (e) {
      setUiAlert({ type: 'error', message: e?.message || 'Failed to update product' });
    }
  };

  const onPickImageFor = (id) => {
    setImageTargetId(id);
    document.getElementById('hiddenImageInput')?.click();
    setShowOptionsDropdown(null);
  };
  const onImageChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !imageTargetId) return;
    try {
      await uploadMedia(imageTargetId, { file, media_type: 'image', title: file.name, is_primary: true });
      setUiAlert({ type: 'success', message: 'Image uploaded and set as primary.' });
      await refreshProducts();
    } catch (err) {
      setUiAlert({ type: 'error', message: err?.message || 'Failed to upload image' });
    } finally {
      setImageTargetId(null);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Manage Product</h1>
        {/* Global Inline Alert */}
        {uiAlert.type && (
          <div className={`mb-4 flex items-start gap-2 px-3 py-2 rounded border text-sm ${uiAlert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <div className="mt-0.5">{uiAlert.type === 'success' ? '✔' : '⚠'}</div>
            <div className="flex-1">{uiAlert.message}</div>
            <button className="text-xs text-gray-500" onClick={() => setUiAlert({ type: null, message: '' })}>Dismiss</button>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-gray-200">
          <button 
            className={`pb-2 px-1 font-medium ${
              activeTab === 'all' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All ({counts.all})
          </button>
          <button 
            className={`pb-2 px-1 font-medium ${
              activeTab === 'pending' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            Approval pending ({counts.pending})
          </button>
          <button 
            className={`pb-2 px-1 font-medium ${
              activeTab === 'disapproved' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('disapproved')}
          >
            Disapproved (Editing required) ({counts.disapproved})
          </button>
        </div>

        {/* Add Product Button */}
        <div className="mb-4">
          <button onClick={() => navigate('/dashboard/product-info/add')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">
            Add Product
          </button>
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-700 mb-2">
          To remove a product, select the checkbox next to it and click <span className="font-medium">Remove</span> below. To edit a product, use <span className="font-medium">Options → Edit Product</span>. To manage images/videos use <span className="font-medium">Options → Manage Media</span>. To manage brochures use <span className="font-medium">Options → Manage Brochures</span>.
        </div>
        <div className="text-sm text-gray-600 mb-6">
          Display Order controls how products appear in the catalog. Lower numbers show first. For example, a product with display order <span className="font-medium">1</span> appears at the top.
        </div>

        {/* Search removed per request */}

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <button onClick={handleDeleteSelected} className={`border ${selectedIds.length ? 'border-red-300 hover:bg-red-50 text-red-700' : 'border-gray-300 text-gray-400'} px-3 py-2 rounded-md text-sm`} disabled={!selectedIds.length}>
            Remove
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-white border border-gray-200 rounded-lg">
          {loading && (<div className="p-4 text-sm text-gray-500">Loading products…</div>)}
          {!!error && (<div className="p-4 text-sm text-red-600">{error}</div>)}
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">
                  <input type="checkbox" className="rounded border-gray-300" checked={products.length>0 && selectedIds.length === products.length} onChange={toggleSelectAll} />
                </th>
                <th className="text-left p-4 font-medium text-gray-700">Title</th>
                <th className="text-left p-4 font-medium text-gray-700">Display order</th>
                <th className="text-left p-4 font-medium text-gray-700">Posted on</th>
                <th className="text-left p-4 font-medium text-gray-700">Updated on</th>
                <th className="text-left p-4 font-medium text-gray-700">Views</th>
                <th className="text-left p-4 font-medium text-gray-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <input type="checkbox" className="rounded border-gray-300" checked={selectedIds.includes(product.id)} onChange={() => toggleSelect(product.id)} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {product.thumb ? (
                        <img src={product.thumb} alt={product.title} className="w-12 h-12 object-cover rounded-md border" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                          <span className="text-xs text-gray-500">No photos</span>
                        </div>
                      )}

        {/* Section Files Modal */}
        {sectionFilesModal.open && (
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow-lg w-full max-w-3xl p-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Manage Additional Product Files</h3>
                <button className="text-sm text-gray-600" onClick={closeSectionFilesModal}>Close</button>
              </div>
              {sectionFilesModal.loading ? (
                <div className="p-3 text-sm text-gray-500">Loading…</div>
              ) : (
                <>
                  {!!sectionFilesModal.error && <div className="mb-2 text-sm text-red-600">{sectionFilesModal.error}</div>}
                  <div className="mb-4 border rounded p-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-700">Section</label>
                        <select className="mt-1 w-full border rounded px-3 py-2 text-sm" value={newSectionFile.section} onChange={(e)=> setNewSectionFile(prev=> ({...prev, section: e.target.value }))}>
                          <option value="">Select section</option>
                          <option value="description">Description</option>
                          <option value="specification">Specification</option>
                          <option value="production_capacity">Production capacity</option>
                          <option value="packaging_delivery">Packaging & Delivery</option>
                          <option value="benefits">Benefits</option>
                          <option value="others">Others</option>
                          <option value="customer_feedback">Customer feedback</option>
                          <option value="questions_answers">Q&A</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700">Title (optional)</label>
                        <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={newSectionFile.title} onChange={(e)=> setNewSectionFile(prev=> ({...prev, title: e.target.value }))} />
                      </div>
                      <div className="flex items-end gap-2">
                        <button className="border px-3 py-2 rounded text-sm" onClick={onPickSectionFile}>{newSectionFile.file ? 'Change file' : 'Choose file'}</button>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm" onClick={doUploadSectionFile} disabled={!newSectionFile.section || !newSectionFile.file}>Upload</button>
                      </div>
                    </div>
                    {newSectionFile.file && (
                      <div className="mt-2 text-xs text-gray-600">Selected: {newSectionFile.file.name}</div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Existing files</h4>
                    <div className="divide-y">
                      {sectionFilesModal.items.length === 0 && (
                        <div className="text-sm text-gray-500 p-2">No files uploaded yet.</div>
                      )}
                      {sectionFilesModal.items.map((it) => {
                        const sid = it.id ?? it.pk ?? it.file_id ?? it.uuid;
                        const sec = it.section_type || it.section || it.field_type || '—';
                        const name = it.title || it.name || it.file_name || 'Untitled';
                        const url = it.file_url || it.url || it.file || it.path || '';
                        return (
                          <div key={sid} className="flex items-center justify-between p-2">
                            <div className="min-w-0">
                              <div className="text-sm text-gray-900 truncate">{name}</div>
                              <div className="text-xs text-gray-500">Section: {sec}</div>
                              {!!url && <a className="text-xs text-blue-600 break-all" href={url} target="_blank" rel="noreferrer">{url}</a>}
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="border px-2 py-1 rounded text-xs text-red-600" onClick={() => removeSectionFile(it)}>Delete</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
                      <div>
                        <div className="font-medium text-gray-900">{product.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-900">{product.displayOrder}</td>
                  <td className="p-4 text-gray-900">{product.postedOn}</td>
                  <td className="p-4 text-gray-900">{product.updatedOn}</td>
                  <td className="p-4 text-gray-900">
                    <div className="inline-flex items-center gap-1 text-sm text-gray-700">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/></svg>
                      {Number(product.views ?? 0)}
                    </div>
                  </td>
                  <td className="p-4 relative">
                    <button 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      onClick={() => handleOptionsClick(product.id)}
                    >
                      Options
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showOptionsDropdown === product.id && (
                      <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <div className="py-1">
                          <button onClick={() => openEditModal(product)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit Product</button>
                          <button onClick={() => openMediaModal(product.id)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Manage Media</button>
                          <button onClick={() => openBrochureModal(product.id)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Manage Brochures</button>
                          <button onClick={() => openSectionFilesModal(product.id)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Manage Additional Product Files</button>
                          <button onClick={() => navigate(`/product/${product.id}`, { state: { fromManageProducts: true } })} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Details</button>
                          <button onClick={() => handleDeleteSingle(product.id)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete</button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex gap-2 mt-6">
          <button onClick={handleDeleteSelected} className={`border ${selectedIds.length ? 'border-red-300 hover:bg-red-50 text-red-700' : 'border-gray-300 text-gray-400'} px-3 py-2 rounded-md text-sm`} disabled={!selectedIds.length}>
            Remove
          </button>
        </div>

        {/* Hidden file input for image change */}
        <input id="hiddenImageInput" type="file" accept="image/*" className="hidden" onChange={onImageChosen} />
        {/* Universal hidden input for media/brochure replace/upload */}
        <input id="hiddenUniversalFile" type="file" accept="image/*,video/*,application/pdf" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file || !uploadIntent) return;
          // Open preview modal instead of immediate upload
          const url = URL.createObjectURL(file);
          const base = {
            open: true,
            file,
            url,
            intent: uploadIntent.type,
            productId: uploadIntent.productId,
            mediaId: uploadIntent.mediaId || null,
            brochureId: uploadIntent.brochureId || null,
            media_type: uploadIntent.media_type || null,
            title: file.name || '',
            is_primary: uploadIntent.media_type === 'image',
          };
          setUploadPreview(base);
        }} />
        {/* Hidden input for section files */}
        <input id="hiddenSectionFile" type="file" className="hidden" onChange={onSectionFileChosen} />

        {/* Edit Modal */}
        {editModal.open && (
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow-lg w-full max-w-2xl p-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Edit Product</h3>
                <button className="text-sm text-gray-600" onClick={closeEditModal}>Close</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700">Title</label>
                  <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={editModal.title} onChange={(e) => setEditModal(prev => ({ ...prev, title: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Product type</label>
                  <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={editModal.product_type} onChange={(e) => setEditModal(prev => ({ ...prev, product_type: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700">Keywords (comma-separated)</label>
                  <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={editModal.keywords} onChange={(e) => setEditModal(prev => ({ ...prev, keywords: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Article/Model No</label>
                  <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={editModal.article_model_no} onChange={(e) => setEditModal(prev => ({ ...prev, article_model_no: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Category</label>
                  <select className="mt-1 w-full border rounded px-3 py-2 text-sm" value={editModal.category} onChange={(e) => setEditModal(prev => ({ ...prev, category: e.target.value }))}>
                    <option value="">Select category</option>
                    {editCategories.items.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700 flex items-center gap-2"><input type="checkbox" className="rounded" checked={!!editModal.is_featured} onChange={(e) => setEditModal(prev => ({ ...prev, is_featured: e.target.checked }))} /> Featured</label>
                  <label className="text-sm text-gray-700 flex items-center gap-2"><input type="checkbox" className="rounded" checked={!!editModal.is_active} onChange={(e) => setEditModal(prev => ({ ...prev, is_active: e.target.checked }))} /> Active</label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700">Description</label>
                  <textarea className="mt-1 w-full border rounded px-3 py-2 text-sm" rows={3} value={editModal.description} onChange={(e) => setEditModal(prev => ({ ...prev, description: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700">Specification</label>
                  <textarea className="mt-1 w-full border rounded px-3 py-2 text-sm" rows={3} value={editModal.specification} onChange={(e) => setEditModal(prev => ({ ...prev, specification: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Production capacity</label>
                  <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={editModal.production_capacity} onChange={(e) => setEditModal(prev => ({ ...prev, production_capacity: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Packaging & Delivery</label>
                  <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={editModal.packaging_delivery} onChange={(e) => setEditModal(prev => ({ ...prev, packaging_delivery: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Benefits</label>
                  <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={editModal.benefits} onChange={(e) => setEditModal(prev => ({ ...prev, benefits: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Others</label>
                  <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={editModal.others} onChange={(e) => setEditModal(prev => ({ ...prev, others: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700">Customer feedback</label>
                  <textarea className="mt-1 w-full border rounded px-3 py-2 text-sm" rows={2} value={editModal.customer_feedback} onChange={(e) => setEditModal(prev => ({ ...prev, customer_feedback: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700">Questions & Answers</label>
                  <textarea className="mt-1 w-full border rounded px-3 py-2 text-sm" rows={2} value={editModal.questions_answers} onChange={(e) => setEditModal(prev => ({ ...prev, questions_answers: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Specifications</label>
                  <div className="space-y-2">
                    {Array.isArray(editModal.specifications) && editModal.specifications.map((sp, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input className="flex-1 border rounded px-2 py-1 text-sm" placeholder="Name" value={sp.name} onChange={(e) => setEditModal(prev => ({ ...prev, specifications: prev.specifications.map((s,i)=> i===idx? { ...s, name: e.target.value }: s) }))} />
                        <input className="flex-1 border rounded px-2 py-1 text-sm" placeholder="Value" value={sp.value} onChange={(e) => setEditModal(prev => ({ ...prev, specifications: prev.specifications.map((s,i)=> i===idx? { ...s, value: e.target.value }: s) }))} />
                        <button className="text-sm text-red-600" onClick={() => setEditModal(prev => ({ ...prev, specifications: prev.specifications.filter((_,i)=>i!==idx) }))}>Remove</button>
                      </div>
                    ))}
                    <button className="text-sm text-blue-600" onClick={() => setEditModal(prev => ({ ...prev, specifications: [...(prev.specifications||[]), { name: '', value: '' }] }))}>+ Add specification</button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button className="px-3 py-2 text-sm border rounded" onClick={closeEditModal}>Cancel</button>
                <button className="px-3 py-2 text-sm rounded text-white bg-blue-600" onClick={saveEditModal}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Media Modal */}
        {mediaModal.open && (
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow-lg w-full max-w-3xl p-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Manage Media</h3>
                <button className="text-sm text-gray-600" onClick={closeMediaModal}>Close</button>
              </div>
              {mediaModal.loading ? (
                <div className="text-sm text-gray-600">Loading…</div>
              ) : (
                <div className="space-y-3">
                  {!!mediaModal.error && <div className="text-sm text-red-600">{mediaModal.error}</div>}
                  <div className="flex gap-2 mb-2">
                    <button className="px-3 py-2 text-sm border rounded" onClick={() => uploadNewMedia('image')}>Upload Image</button>
                    <button className="px-3 py-2 text-sm border rounded" onClick={() => uploadNewMedia('video')}>Upload Video</button>
                  </div>
                  {Array.isArray(mediaModal.items) && mediaModal.items.length === 0 && (
                    <div className="text-sm text-gray-600">No media yet.</div>
                  )}
                  <div className="divide-y">
                    {Array.isArray(mediaModal.items) && mediaModal.items.map((m) => {
                      const mid = m.id ?? m.pk ?? m.media_id ?? m.uuid;
                      return (
                        <div key={mid} className="py-3 flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-sm text-gray-800 mb-1">{m.title || 'Untitled'}</div>
                            <div className="flex items-center gap-2">
                              <input
                                className="flex-1 border rounded px-2 py-1 text-sm"
                                defaultValue={m.title || ''}
                                placeholder="Title"
                                onBlur={(e) => saveMediaTitle(m, e.target.value)}
                              />
                              {(
                                (m.media_type || (m.is_video ? 'video' : 'image')) === 'image'
                              ) && (
                                <button className="px-2 py-1 text-xs border rounded" onClick={() => makePrimary(m)}>Set primary</button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="px-2 py-1 text-xs border rounded" onClick={() => replaceMedia(m)}>Replace</button>
                            <button className="px-2 py-1 text-xs border rounded text-red-600" onClick={() => deleteMediaItem(m)}>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Brochure Modal */}
        {brochureModal.open && (
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow-lg w-full max-w-3xl p-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Manage Brochures</h3>
                <button className="text-sm text-gray-600" onClick={closeBrochureModal}>Close</button>
              </div>
              {brochureModal.loading ? (
                <div className="text-sm text-gray-600">Loading…</div>
              ) : (
                <div className="space-y-3">
                  {!!brochureModal.error && <div className="text-sm text-red-600">{brochureModal.error}</div>}
                  <div>
                    <button className="px-3 py-2 text-sm border rounded" onClick={uploadNewBrochure}>Upload Brochure (PDF)</button>
                  </div>
                  {Array.isArray(brochureModal.items) && brochureModal.items.length === 0 && (
                    <div className="text-sm text-gray-600">No brochures yet.</div>
                  )}
                  <div className="divide-y">
                    {Array.isArray(brochureModal.items) && brochureModal.items.map((b) => {
                      const bid = b.id ?? b.pk ?? b.brochure_id ?? b.uuid;
                      return (
                        <div key={bid} className="py-3 flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-sm text-gray-800 mb-1">{b.title || 'Untitled brochure'}</div>
                            <input
                              className="w-full border rounded px-2 py-1 text-sm"
                              defaultValue={b.title || ''}
                              placeholder="Title"
                              onBlur={(e) => saveBrochureTitle(b, e.target.value)}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="px-2 py-1 text-xs border rounded" onClick={() => replaceBrochure(b)}>Replace</button>
                            <button className="px-2 py-1 text-xs border rounded text-red-600" onClick={() => deleteBrochureItem(b)}>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Preview Modal */}
        {uploadPreview.open && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow-lg w-full max-w-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Confirm {uploadPreview.intent?.includes('brochure') ? 'Brochure' : 'Media'} Upload</h3>
                <button
                  className="text-sm text-gray-600"
                  onClick={() => {
                    try { uploadPreview.url && URL.revokeObjectURL(uploadPreview.url); } catch {}
                    setUploadPreview({ open: false, file: null, url: '', intent: null, productId: null, mediaId: null, brochureId: null, media_type: null, title: '', is_primary: false });
                    setUploadIntent(null);
                  }}
                >Close</button>
              </div>
              <div className="space-y-3">
                {uploadPreview.intent?.includes('brochure') ? (
                  <div className="flex items-center gap-3 p-3 rounded border">
                    <div className="w-10 h-10 flex items-center justify-center rounded bg-gray-100 text-gray-600">PDF</div>
                    <div className="text-sm text-gray-700 break-all">{uploadPreview.file?.name}</div>
                  </div>
                ) : (
                  <div className="rounded border overflow-hidden">
                    {uploadPreview.media_type === 'video' ? (
                      <video src={uploadPreview.url} controls className="w-full max-h-64" />
                    ) : (
                      <img src={uploadPreview.url} alt="preview" className="w-full max-h-64 object-contain" />
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm text-gray-700">Title</label>
                  <input
                    className="mt-1 w-full border rounded px-3 py-2 text-sm"
                    value={uploadPreview.title}
                    onChange={(e) => setUploadPreview(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                {(!uploadPreview.intent?.includes('brochure') && uploadPreview.media_type === 'image') && (
                  <label className="text-sm text-gray-700 flex items-center gap-2">
                    <input type="checkbox" className="rounded" checked={!!uploadPreview.is_primary} onChange={(e) => setUploadPreview(prev => ({ ...prev, is_primary: e.target.checked }))} />
                    Set as primary image
                  </label>
                )}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    className="px-3 py-2 text-sm border rounded"
                    onClick={() => {
                      try { uploadPreview.url && URL.revokeObjectURL(uploadPreview.url); } catch {}
                      setUploadPreview({ open: false, file: null, url: '', intent: null, productId: null, mediaId: null, brochureId: null, media_type: null, title: '', is_primary: false });
                      setUploadIntent(null);
                    }}
                  >Cancel</button>
                  <button
                    className="px-3 py-2 text-sm rounded text-white bg-blue-600"
                    onClick={async () => {
                      const { intent, productId, mediaId, brochureId, file, media_type, title, is_primary } = uploadPreview;
                      try {
                        if (intent === 'replace_media') {
                          await replaceMediaFile(productId, mediaId, { file, media_type, title, is_primary });
                          closeMediaModal();
                          await refreshProducts();
                        } else if (intent === 'upload_image' || intent === 'upload_video') {
                          await uploadMedia(productId, { file, media_type, title, is_primary });
                          closeMediaModal();
                          await refreshProducts();
                        } else if (intent === 'replace_brochure') {
                          await replaceBrochureFile(productId, brochureId, { file, title });
                          closeBrochureModal();
                          await refreshProducts();
                        } else if (intent === 'upload_brochure') {
                          await createBrochure(productId, { file, title });
                          closeBrochureModal();
                          await refreshProducts();
                        }
                        setUiAlert({ type: 'success', message: 'File uploaded.' });
                      } catch (err) {
                        setUiAlert({ type: 'error', message: err?.message || 'Upload failed' });
                      } finally {
                        try { uploadPreview.url && URL.revokeObjectURL(uploadPreview.url); } catch {}
                        setUploadPreview({ open: false, file: null, url: '', intent: null, productId: null, mediaId: null, brochureId: null, media_type: null, title: '', is_primary: false });
                        setUploadIntent(null);
                      }
                    }}
                  >Upload</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirmModal.open && (
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow-lg w-full max-w-sm p-4">
              <h3 className="font-medium mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-700 mb-4">{confirmModal.message}</p>
              <div className="flex items-center justify-end gap-2">
                <button className="px-3 py-2 text-sm border rounded" onClick={() => setConfirmModal({ open: false, message: '', onConfirm: null })}>Cancel</button>
                <button className="px-3 py-2 text-sm rounded text-white bg-red-600" onClick={() => confirmModal.onConfirm && confirmModal.onConfirm()}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageProducts;
