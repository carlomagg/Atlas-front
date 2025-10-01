        import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyProducts, userProductCounts, deleteProduct, updateProduct, uploadMedia, retrieveProduct, listCategories, replaceMediaFile, updateMedia, listMedia, deleteMedia, setPrimaryImage, listBrochures, createBrochure, updateBrochure, replaceBrochureFile, deleteBrochure, listAdditionalFiles, uploadAdditionalFile, deleteAdditionalFile } from '../../../services/productApi';
import { uploadRichTextImage } from '../../../services/imageUploadApi';
import { getProductThumb } from '../../../utils/media';
import RichTextEditor from '../../common/RichTextEditor';
import SubsidiaryProductManagement from './SubsidiaryProductManagement';
import ImageBackgroundEditor from '../../common/ImageBackgroundEditor';

// Rich text editor image upload handler for edit modal
const handleEditRichTextImageUpload = async (file, context = {}) => {
  try {
    const imageUrl = await uploadRichTextImage(file, {
      context: 'product_edit',
      ...context
    });
    return imageUrl;
  } catch (error) {
    console.error('Rich text image upload failed:', error);
    throw error;
  }
};

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

  // Background editor state
  const [showBackgroundEditor, setShowBackgroundEditor] = useState(false);
  const [backgroundEditorProductId, setBackgroundEditorProductId] = useState(null);

  // Background editor handler
  const handleBackgroundEditorImage = async (processedFile) => {
    if (!backgroundEditorProductId) return;
    
    try {
      await uploadMedia(backgroundEditorProductId, { 
        file: processedFile, 
        media_type: 'image', 
        title: processedFile.name || 'Background-edited image', 
        is_primary: false 
      });
      setUiAlert({ type: 'success', message: 'Background-edited image uploaded successfully!' });
      await openMediaModal(backgroundEditorProductId);
      setShowBackgroundEditor(false);
      setBackgroundEditorProductId(null);
    } catch (err) {
      setUiAlert({ type: 'error', message: err?.message || 'Failed to upload background-edited image' });
    }
  };

  const openBackgroundEditor = (productId) => {
    setBackgroundEditorProductId(productId);
    setShowBackgroundEditor(true);
  };

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
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
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
          <button 
            className={`pb-2 px-1 font-medium ${
              activeTab === 'subsidiary' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('subsidiary')}
          >
            Subsidiary Products
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

        {/* Regular Products Management */}
        {activeTab !== 'subsidiary' && (
          <>
            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <button onClick={handleDeleteSelected} className={`border ${selectedIds.length ? 'border-red-300 hover:bg-red-50 text-red-700' : 'border-gray-300 text-gray-400'} px-3 py-2 rounded-md text-sm`} disabled={!selectedIds.length}>
                Remove
              </button>
            </div>

            {/* Products Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeSectionFilesModal} />
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 my-8 flex flex-col max-h-[calc(100vh-4rem)]">
              {/* Enhanced Header */}
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h1a1 1 0 001-1V3a2 2 0 012 2v6.5A1.5 1.5 0 0112.5 11H16a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Manage Additional Product Files</h3>
                    <p className="text-orange-100 text-sm">Upload files for specific product sections and details</p>
                  </div>
                </div>
                <button 
                  onClick={closeSectionFilesModal} 
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors" 
                  aria-label="Close"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                {sectionFilesModal.loading ? (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                      <span className="ml-3 text-gray-600">Loading files...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {!!sectionFilesModal.error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-red-800 text-sm">{sectionFilesModal.error}</span>
                        </div>
                      </div>
                    )}

                    {/* Upload New File Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Upload New Section File</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Product Section *</label>
                          <select 
                            className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                            value={newSectionFile.section} 
                            onChange={(e)=> setNewSectionFile(prev=> ({...prev, section: e.target.value }))}
                          >
                            <option value="">Select section</option>
                            <option value="description">Description</option>
                            <option value="specification">Specification</option>
                            <option value="production_capacity">Production Capacity</option>
                            <option value="packaging_delivery">Packaging & Delivery</option>
                            <option value="benefits">Benefits</option>
                            <option value="others">Others</option>
                            <option value="customer_feedback">Customer Feedback</option>
                            <option value="questions_answers">Q&A</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">File Title (Optional)</label>
                          <input 
                            className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                            value={newSectionFile.title} 
                            onChange={(e)=> setNewSectionFile(prev=> ({...prev, title: e.target.value }))} 
                            placeholder="Enter file title"
                          />
                        </div>
                        
                        <div className="flex items-end gap-2">
                          <button 
                            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200" 
                            onClick={onPickSectionFile}
                          >
                            {newSectionFile.file ? 'Change File' : 'Choose File'}
                          </button>
                          <button 
                            className="px-6 py-3 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                            onClick={doUploadSectionFile} 
                            disabled={!newSectionFile.section || !newSectionFile.file}
                          >
                            Upload
                          </button>
                        </div>
                      </div>
                      
                      {newSectionFile.file && (
                        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-orange-800">Selected: {newSectionFile.file.name}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Existing Files Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Existing Section Files</h4>
                      </div>
                      
                      {sectionFilesModal.items.length === 0 ? (
                        <div className="text-center py-8">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">No section files uploaded yet.</p>
                          <p className="text-xs text-gray-500">Upload files to provide additional information for specific product sections.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sectionFilesModal.items.map((it) => {
                            const sid = it.id ?? it.pk ?? it.file_id ?? it.uuid;
                            const sec = it.section_type || it.section || it.field_type || '—';
                            const name = it.title || it.name || it.file_name || 'Untitled';
                            const url = it.file_url || it.url || it.file || it.path || '';
                            return (
                              <div key={sid} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
                                      <div className="text-xs text-gray-500 mt-1">Section: {sec}</div>
                                      {!!url && (
                                        <a 
                                          className="text-xs text-blue-600 hover:text-blue-800 break-all mt-1 inline-block" 
                                          href={url} 
                                          target="_blank" 
                                          rel="noreferrer"
                                        >
                                          View File
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      className="px-3 py-2 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 transition-colors" 
                                      onClick={() => removeSectionFile(it)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
          </>
        )}

        {/* Subsidiary Products Management */}
        {activeTab === 'subsidiary' && (
          <SubsidiaryProductManagement />
        )}

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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeEditModal} />
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 my-8 flex flex-col max-h-[calc(100vh-4rem)]">
              {/* Enhanced Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Edit Product</h3>
                    <p className="text-blue-100 text-sm">Update your product information and details</p>
                  </div>
                </div>
                <button 
                  onClick={closeEditModal} 
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors" 
                  aria-label="Close"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50 space-y-6">
                {/* Product Basic Information Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Title *</label>
                        <input 
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                          value={editModal.title} 
                          onChange={(e) => setEditModal(prev => ({ ...prev, title: e.target.value }))} 
                          placeholder="Enter product title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                        <input 
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                          value={editModal.product_type} 
                          onChange={(e) => setEditModal(prev => ({ ...prev, product_type: e.target.value }))} 
                          placeholder="e.g., Electronics, Machinery"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                      <input 
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                        value={editModal.keywords} 
                        onChange={(e) => setEditModal(prev => ({ ...prev, keywords: e.target.value }))} 
                        placeholder="Enter keywords separated by commas"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Article/Model No</label>
                        <input 
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                          value={editModal.article_model_no} 
                          onChange={(e) => setEditModal(prev => ({ ...prev, article_model_no: e.target.value }))} 
                          placeholder="Enter model number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select 
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                          value={editModal.category} 
                          onChange={(e) => setEditModal(prev => ({ ...prev, category: e.target.value }))}
                        >
                          <option value="">Select category</option>
                          {editCategories.items.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          checked={!!editModal.is_featured} 
                          onChange={(e) => setEditModal(prev => ({ ...prev, is_featured: e.target.checked }))} 
                        />
                        Mark as Featured Product
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          checked={!!editModal.is_active} 
                          onChange={(e) => setEditModal(prev => ({ ...prev, is_active: e.target.checked }))} 
                        />
                        Product Active
                      </label>
                    </div>
                  </div>
                </div>

                {/* Product Details Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Product Details & Specifications</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
                      <RichTextEditor
                        value={editModal.description}
                        onChange={(value) => setEditModal(prev => ({ ...prev, description: value }))}
                        placeholder="Describe your product in detail..."
                        height="200px"
                        onImageUpload={(file) => handleEditRichTextImageUpload(file, { section: 'description', productId: editModal.id })}
                        className="mb-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Specification</label>
                      <RichTextEditor
                        value={editModal.specification}
                        onChange={(value) => setEditModal(prev => ({ ...prev, specification: value }))}
                        placeholder="Enter detailed product specifications..."
                        height="200px"
                        onImageUpload={(file) => handleEditRichTextImageUpload(file, { section: 'specification', productId: editModal.id })}
                        className="mb-2"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Additional Specifications</label>
                        <button 
                          type="button"
                          className="text-sm text-blue-600 hover:text-blue-800" 
                          onClick={() => setEditModal(prev => ({ ...prev, specifications: [...(prev.specifications||[]), { name: '', value: '' }] }))}
                        >
                          + Add specification
                        </button>
                      </div>
                      <div className="space-y-2">
                        {Array.isArray(editModal.specifications) && editModal.specifications.map((sp, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input 
                              className="flex-1 h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                              placeholder="Attribute (e.g., Color)" 
                              value={sp.name} 
                              onChange={(e) => setEditModal(prev => ({ ...prev, specifications: prev.specifications.map((s,i)=> i===idx? { ...s, name: e.target.value }: s) }))} 
                            />
                            <input 
                              className="flex-1 h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                              placeholder="Value (e.g., Red)" 
                              value={sp.value} 
                              onChange={(e) => setEditModal(prev => ({ ...prev, specifications: prev.specifications.map((s,i)=> i===idx? { ...s, value: e.target.value }: s) }))} 
                            />
                            <button 
                              type="button"
                              className="text-xs text-red-600 hover:text-red-800 px-2" 
                              onClick={() => setEditModal(prev => ({ ...prev, specifications: prev.specifications.filter((_,i)=>i!==idx) }))}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Production & Delivery Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Production & Delivery</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Production Capacity</label>
                        <input 
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                          value={editModal.production_capacity} 
                          onChange={(e) => setEditModal(prev => ({ ...prev, production_capacity: e.target.value }))} 
                          placeholder="e.g., 1000 units per month"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Packaging & Delivery</label>
                        <RichTextEditor
                          value={editModal.packaging_delivery}
                          onChange={(value) => setEditModal(prev => ({ ...prev, packaging_delivery: value }))}
                          placeholder="Describe packaging and delivery options..."
                          height="150px"
                          onImageUpload={(file) => handleEditRichTextImageUpload(file, { section: 'packaging_delivery', productId: editModal.id })}
                          className="mb-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Benefits</label>
                        <RichTextEditor
                          value={editModal.benefits}
                          onChange={(value) => setEditModal(prev => ({ ...prev, benefits: value }))}
                          placeholder="Key benefits of your product"
                          height="150px"
                          onImageUpload={(file) => handleEditRichTextImageUpload(file, { section: 'benefits', productId: editModal.id })}
                          className="mb-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Other Information</label>
                        <RichTextEditor
                          value={editModal.others}
                          onChange={(value) => setEditModal(prev => ({ ...prev, others: value }))}
                          placeholder="Any other relevant information"
                          height="150px"
                          onImageUpload={(file) => handleEditRichTextImageUpload(file, { section: 'others', productId: editModal.id })}
                          className="mb-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Customer Information</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customer Feedback</label>
                      <RichTextEditor
                        value={editModal.customer_feedback}
                        onChange={(value) => setEditModal(prev => ({ ...prev, customer_feedback: value }))}
                        placeholder="Share customer testimonials or feedback..."
                        height="150px"
                        onImageUpload={(file) => handleEditRichTextImageUpload(file, { section: 'customer_feedback', productId: editModal.id })}
                        className="mb-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Questions & Answers</label>
                      <RichTextEditor
                        value={editModal.questions_answers}
                        onChange={(value) => setEditModal(prev => ({ ...prev, questions_answers: value }))}
                        placeholder="Common questions and answers about your product..."
                        height="150px"
                        onImageUpload={(file) => handleEditRichTextImageUpload(file, { section: 'questions_answers', productId: editModal.id })}
                        className="mb-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-center gap-4">
                    <button 
                      type="button"
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200" 
                      onClick={closeEditModal}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      className="px-8 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all duration-200" 
                      onClick={saveEditModal}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Modal */}
        {mediaModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeMediaModal} />
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 my-8 flex flex-col max-h-[calc(100vh-4rem)]">
              {/* Enhanced Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Manage Product Media</h3>
                    <p className="text-green-100 text-sm">Upload and manage images and videos for your product</p>
                  </div>
                </div>
                <button 
                  onClick={closeMediaModal} 
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors" 
                  aria-label="Close"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                {mediaModal.loading ? (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      <span className="ml-3 text-gray-600">Loading media...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {!!mediaModal.error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-red-800 text-sm">{mediaModal.error}</span>
                        </div>
                      </div>
                    )}

                    {/* Upload Actions Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Upload New Media</h4>
                      </div>
                      
                      <div className="flex gap-3">
                        <button 
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2" 
                          onClick={() => uploadNewMedia('image')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Upload Image
                        </button>
                        <button 
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2" 
                          onClick={() => uploadNewMedia('video')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Upload Video
                        </button>
                        <button 
                          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2" 
                          onClick={() => openBackgroundEditor(mediaModal.productId)}
                        >
                          🎨 Remove Background
                        </button>
                      </div>
                    </div>

                    {/* Media List Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Current Media Files</h4>
                      </div>
                      
                      {Array.isArray(mediaModal.items) && mediaModal.items.length === 0 ? (
                        <div className="text-center py-8">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">No media files uploaded yet.</p>
                          <p className="text-xs text-gray-500">Upload images and videos to showcase your product.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Array.isArray(mediaModal.items) && mediaModal.items.map((m) => {
                            const mid = m.id ?? m.pk ?? m.media_id ?? m.uuid;
                            return (
                              <div key={mid} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900 mb-2">{m.title || 'Untitled'}</div>
                                    <div className="flex items-center gap-3">
                                      <input
                                        className="flex-1 h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                                        defaultValue={m.title || ''}
                                        placeholder="Enter media title"
                                        onBlur={(e) => saveMediaTitle(m, e.target.value)}
                                      />
                                      {(
                                        (m.media_type || (m.is_video ? 'video' : 'image')) === 'image'
                                      ) && (
                                        <button 
                                          className="px-3 py-2 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200 transition-colors" 
                                          onClick={() => makePrimary(m)}
                                        >
                                          Set Primary
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 transition-colors" 
                                      onClick={() => replaceMedia(m)}
                                    >
                                      Replace
                                    </button>
                                    <button 
                                      className="px-3 py-2 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 transition-colors" 
                                      onClick={() => deleteMediaItem(m)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Brochure Modal */}
        {brochureModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeBrochureModal} />
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 my-8 flex flex-col max-h-[calc(100vh-4rem)]">
              {/* Enhanced Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Manage Product Brochures</h3>
                    <p className="text-red-100 text-sm">Upload and manage PDF brochures for your product</p>
                  </div>
                </div>
                <button 
                  onClick={closeBrochureModal} 
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors" 
                  aria-label="Close"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                {brochureModal.loading ? (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      <span className="ml-3 text-gray-600">Loading brochures...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {!!brochureModal.error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-red-800 text-sm">{brochureModal.error}</span>
                        </div>
                      </div>
                    )}

                    {/* Upload Actions Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Upload New Brochure</h4>
                      </div>
                      
                      <button 
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2" 
                        onClick={uploadNewBrochure}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Upload Brochure (PDF)
                      </button>
                    </div>

                    {/* Brochure List Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Current Brochures</h4>
                      </div>
                      
                      {Array.isArray(brochureModal.items) && brochureModal.items.length === 0 ? (
                        <div className="text-center py-8">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">No brochures uploaded yet.</p>
                          <p className="text-xs text-gray-500">Upload PDF brochures to provide detailed product information.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Array.isArray(brochureModal.items) && brochureModal.items.map((b) => {
                            const bid = b.id ?? b.pk ?? b.brochure_id ?? b.uuid;
                            return (
                              <div key={bid} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-900 mb-2">{b.title || 'Untitled brochure'}</div>
                                      <input
                                        className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                                        defaultValue={b.title || ''}
                                        placeholder="Enter brochure title"
                                        onBlur={(e) => saveBrochureTitle(b, e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 transition-colors" 
                                      onClick={() => replaceBrochure(b)}
                                    >
                                      Replace
                                    </button>
                                    <button 
                                      className="px-3 py-2 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 transition-colors" 
                                      onClick={() => deleteBrochureItem(b)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Preview Modal */}
        {uploadPreview.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
              try { uploadPreview.url && URL.revokeObjectURL(uploadPreview.url); } catch {}
              setUploadPreview({ open: false, file: null, url: '', intent: null, productId: null, mediaId: null, brochureId: null, media_type: null, title: '', is_primary: false });
              setUploadIntent(null);
            }} />
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 my-8 flex flex-col max-h-[calc(100vh-4rem)]">
              {/* Enhanced Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Confirm {uploadPreview.intent?.includes('brochure') ? 'Brochure' : 'Media'} Upload</h3>
                    <p className="text-purple-100 text-sm">Review and confirm your file upload</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    try { uploadPreview.url && URL.revokeObjectURL(uploadPreview.url); } catch {}
                    setUploadPreview({ open: false, file: null, url: '', intent: null, productId: null, mediaId: null, brochureId: null, media_type: null, title: '', is_primary: false });
                    setUploadIntent(null);
                  }} 
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors" 
                  aria-label="Close"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                {/* File Preview Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">File Preview</h4>
                  </div>
                  
                  {uploadPreview.intent?.includes('brochure') ? (
                    <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-red-100 text-red-600 font-bold text-sm">PDF</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{uploadPreview.file?.name}</div>
                        <div className="text-sm text-gray-500">PDF Document</div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                      {uploadPreview.media_type === 'video' ? (
                        <video src={uploadPreview.url} controls className="w-full max-h-64 object-contain" />
                      ) : (
                        <img src={uploadPreview.url} alt="preview" className="w-full max-h-64 object-contain" />
                      )}
                    </div>
                  )}
                </div>

                {/* File Details Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">File Details</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">File Title</label>
                      <input
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                        value={uploadPreview.title}
                        onChange={(e) => setUploadPreview(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter file title"
                      />
                    </div>
                    
                    {(!uploadPreview.intent?.includes('brochure') && uploadPreview.media_type === 'image') && (
                      <div className="flex items-center gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                            checked={!!uploadPreview.is_primary} 
                            onChange={(e) => setUploadPreview(prev => ({ ...prev, is_primary: e.target.checked }))} 
                          />
                          Set as Primary Image
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => {
                        try { uploadPreview.url && URL.revokeObjectURL(uploadPreview.url); } catch {}
                        setUploadPreview({ open: false, file: null, url: '', intent: null, productId: null, mediaId: null, brochureId: null, media_type: null, title: '', is_primary: false });
                        setUploadIntent(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-8 py-3 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 hover:shadow-lg transition-all duration-200"
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
                    >
                      Upload File
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirmModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmModal({ open: false, message: '', onConfirm: null })} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 my-8 flex flex-col">
              {/* Enhanced Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Confirm Delete</h3>
                    <p className="text-red-100 text-sm">This action cannot be undone</p>
                  </div>
                </div>
                <button 
                  onClick={() => setConfirmModal({ open: false, message: '', onConfirm: null })} 
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors" 
                  aria-label="Close"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 bg-gray-50">
                {/* Warning Message Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Warning</h4>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed">{confirmModal.message}</p>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setConfirmModal({ open: false, message: '', onConfirm: null })}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-8 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 hover:shadow-lg transition-all duration-200"
                      onClick={() => confirmModal.onConfirm && confirmModal.onConfirm()}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Background Editor Modal */}
        {showBackgroundEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Background Remover & Editor</h3>
                <button 
                  onClick={() => {
                    setShowBackgroundEditor(false);
                    setBackgroundEditorProductId(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <ImageBackgroundEditor 
                  onImageProcessed={handleBackgroundEditorImage}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageProducts;
