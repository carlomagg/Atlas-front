  // ProductForm.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createProductWithMedia, buildCreateWithMediaPayload, listCategories, createBrochure, listBrochures } from "../../../services/productApi";
import { getMySubsidiaries } from "../../../services/subsidiaryApi";
import { uploadRichTextImage } from "../../../services/imageUploadApi";
import NestedCategorySelector from '../../common/NestedCategorySelector';
import RichTextEditor from '../../common/RichTextEditor';

// Rich text editor image upload handler
const handleRichTextImageUpload = async (file, context = {}) => {
  try {
    const imageUrl = await uploadRichTextImage(file, {
      context: 'product_form',
      ...context
    });
    return imageUrl;
  } catch (error) {
    console.error('Rich text image upload failed:', error);
    throw error;
  }
};

/* Image preview helper */
function ImageThumb({ file, onRemove }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setSrc(e.target.result);
    reader.readAsDataURL(file);
  }, [file]);
  return (
    <div className="relative w-28 h-20 border-dashed border rounded overflow-hidden">
      {src ? <img src={src} className="object-cover w-full h-full" alt={file.name} /> : <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">Preview</div>}
      <button className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 text-xs" onClick={onRemove}>×</button>
    </div>
  );
}

export default function ProductForm() {
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [form, setForm] = useState({
    category: "",
    subsidiary: "", // NEW: Subsidiary selection
    title: "",
    type: "",
    keywords: "",
    productImages: [],
    primaryImageIndex: 0,
    spec: "",
    moreDetails: [{ key: "", value: "" }],
    modelNo: "",
    brochure: null,
    description: "",
    benefits: "",
    capacity: "",
    packaging: "",
    productVideos: [],
    customerFeedback: "",
    qna: "",
    others: "",
    isFeatured: false,
  });

  // Inline alert state
  const [uiAlert, setUiAlert] = useState({ type: null, message: '' });
  const [submitting, setSubmitting] = useState(false);

  // Enhanced category selection state
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Subsidiary selection state
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [subsidiariesLoading, setSubsidiariesLoading] = useState(false);

  /* generic handlers */
  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleArray = (field, value) => {
    setForm(prev => {
      const arr = prev[field] || [];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]
      };
    });
  };

  // Shared LTR props for text inputs and textareas (used in JSX below)
  const ltrProps = {
    dir: 'ltr',
    style: { direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left' }
  };

  // LTR Input that preserves caret at end to avoid perceived reverse typing
  const LtrInput = React.useMemo(() => {
    return React.forwardRef(function LtrInputInner(props, forwardedRef) {
      const innerRef = useRef(null);
      const ref = forwardedRef || innerRef;
      const { onChange, style, ...rest } = props;
      const handleChange = (e) => {
        onChange && onChange(e);
        try {
          const el = ref && 'current' in ref ? ref.current : null;
          if (el && typeof el.setSelectionRange === 'function') {
            const len = el.value?.length ?? 0;
            el.setSelectionRange(len, len);
          }
        } catch {}
      };
      return (
        <input
          ref={ref}
          dir="ltr"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          inputMode="text"
          style={{ direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left', ...(style || {}) }}
          onChange={handleChange}
          {...rest}
        />
      );
    });
  }, []);

  /* image uploads */
  const onProductImages = (files) => {
    const arr = Array.from(files);
    setForm(prev => ({ ...prev, productImages: prev.productImages.concat(arr) }));
  };
  const removeProductImage = (index) => {
    setForm(prev => ({ ...prev, productImages: prev.productImages.filter((_,i) => i !== index) }));
  };

  /* primary image selection */
  const setPrimaryImage = (index) => setForm(prev => ({ ...prev, primaryImageIndex: index }));

  /* videos */
  const onProductVideos = (files) => {
    const arr = Array.from(files || []).filter(Boolean);
    setForm(prev => ({ ...prev, productVideos: prev.productVideos.concat(arr) }));
  };
  const removeProductVideo = (i) => setForm(prev => ({ ...prev, productVideos: prev.productVideos.filter((_, idx) => idx !== i) }));

  /* brochure */
  const onBrochure = (file) => setForm(prev => ({ ...prev, brochure: file || null }));

  // (Removed) section file upload handlers, as per request to manage these separately

  /* Enhanced category selection handler */
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    handleChange("category", category.id);
    console.log('Selected category:', category);
  };

  /* more product details handlers */
  const moreAdd = () => setForm(prev => ({ ...prev, moreDetails: [...prev.moreDetails, { key: "", value: "" }] }));
  const moreChange = (i, field, val) => {
    setForm(prev => {
      const arr = prev.moreDetails.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
      return { ...prev, moreDetails: arr };
    });
  };
  const moreRemove = (i) => setForm(prev => ({ ...prev, moreDetails: prev.moreDetails.filter((_, idx) => idx !== i) }));

  // Load subsidiaries function (extracted for reuse)
  const loadSubsidiaries = async () => {
    try {
      setSubsidiariesLoading(true);
      const data = await getMySubsidiaries();
      console.log('Raw subsidiaries API response:', data);
      const subsidiaryList = Array.isArray(data) ? data : (data?.results || []);
      setSubsidiaries(subsidiaryList);
    } catch (error) {
      console.error('Failed to load subsidiaries:', error);
      setSubsidiaries([]);
    } finally {
      setSubsidiariesLoading(false);
    }
  };

  // Load subsidiaries on component mount
  useEffect(() => {
    loadSubsidiaries();
  }, []);

  const handleSubmit = (mode = 'post') => {
    if (submitting) return;
    setSubmitting(true);
    (async () => {
      try {
        const payload = await buildCreateWithMediaPayload(form);
        console.log('Product creation payload:', payload);
        console.log('Subsidiary in form:', form.subsidiary);
        console.log('Subsidiary in payload:', payload.product_data?.subsidiary);
        
        // If later we need to include advertisement flag, we can add to payload here based on mode
        const res = await createProductWithMedia(payload);
        console.debug('Create product response:', res);
        // Upload brochure via dedicated endpoint if provided and product id is available
        try {
          const productId = res?.id ?? res?.product_id ?? res?.product?.id ?? res?.data?.id;
          if (!productId) {
            if (form.brochure) {
              setUiAlert({ type: 'error', message: 'Product created, but could not determine product ID to upload brochure.' });
            } else {
              setUiAlert({ type: 'success', message: 'Product created successfully. Redirecting…' });
            }
          } else if (form.brochure) {
            console.debug('Probing brochure list URL before upload:', `/api/products/${productId}/brochures/`);
            try {
              await listBrochures(productId);
            } catch (probeErr) {
              console.warn('Brochure list probe failed:', probeErr);
              setUiAlert({ type: 'error', message: 'Product created, but brochure endpoint returned 404 on probe. Verify backend routes at /api/products/{id}/brochures/.' });
              throw probeErr; // go to outer catch to show unified error
            }
            console.debug('Attempting brochure upload to:', `/api/products/${productId}/brochures/`);
            await createBrochure(productId, { file: form.brochure, title: form.brochure?.name });
            setUiAlert({ type: 'success', message: 'Product created successfully. Brochure uploaded. Redirecting…' });
          } else {
            setUiAlert({ type: 'success', message: 'Product created successfully. Redirecting…' });
          }
          
          // Refresh subsidiaries to update product counts
          if (form.subsidiary) {
            console.log('Refreshing subsidiaries after product creation...');
            await loadSubsidiaries();
          }
        } catch (bErr) {
          console.warn('Brochure upload failed after product creation', bErr);
          // Non-blocking: still proceed but inform user
          setUiAlert({ type: 'error', message: (bErr && bErr.message) ? `Product created, but brochure upload failed: ${bErr.message}` : 'Product created, but brochure upload failed' });
        }
        try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
        // Reset minimal fields for a clean state
        setForm(prev => ({
          ...prev,
          title: "",
          type: "",
          keywords: "",
          modelNo: "",
          productImages: [],
          brochure: null,
          productVideos: [],
          primaryImageIndex: 0,
          isFeatured: false,
        }));
        // Brief delay so users can see the success alert before redirect
        setTimeout(() => {
          navigate('/dashboard/product-info/manage');
        }, 2000);
      } catch (err) {
        console.error('Create product failed:', err);
        setUiAlert({ type: 'error', message: (err && err.message) || 'Failed to create product' });
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Add New Product</h1>
        <p className="mt-1 text-sm text-gray-600">Create a new product listing with detailed information and media.</p>
      </div>

      {/* Inline Alert */}
      {uiAlert.type && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 px-4 py-3 rounded border text-sm shadow-lg ${uiAlert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`} role="status" aria-live="polite">
          <div className="mt-0.5">
            {uiAlert.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10A8 8 0 11.001 9.999 8 8 0 0118 10zM9 5h2v6H9V5zm0 8h2v2H9v-2z" clipRule="evenodd"/></svg>
            )}
          </div>
          <div className="flex-1">{uiAlert.message}</div>
          <button type="button" className="text-xs text-gray-500 hover:text-gray-700" onClick={() => setUiAlert({ type: null, message: '' })}>Dismiss</button>
        </div>
      )}

      <form dir="ltr" style={{ direction: 'ltr' }} onSubmit={(e) => { e.preventDefault(); handleSubmit('post'); }} className="space-y-6">
        {/* Product Basic Information Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Product Basic Information</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Category *</label>
              <NestedCategorySelector
                value={form.category}
                onChange={e => handleChange("category", Number(e.target.value))}
                onCategorySelect={handleCategorySelect}
                required
                placeholder="Choose a category..."
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
              />
              {selectedCategory && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <p className="text-blue-800">
                    <span className="font-medium">Selected:</span> {selectedCategory.name}
                  </p>
                  {selectedCategory.group && (
                    <p className="text-blue-600 text-xs mt-1">
                      Group: {selectedCategory.group.name}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand/Subsidiary (Optional)</label>
              <select
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                value={form.subsidiary}
                onChange={e => handleChange("subsidiary", e.target.value)}
                disabled={subsidiariesLoading}
              >
                <option value="">Unbranded (Main Company)</option>
                {subsidiariesLoading ? (
                  <option disabled>Loading subsidiaries...</option>
                ) : (
                  subsidiaries.map(subsidiary => (
                    <option key={subsidiary.id} value={subsidiary.id}>
                      {subsidiary.name}
                    </option>
                  ))
                )}
              </select>
              {form.subsidiary && subsidiaries.length > 0 && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <p className="text-green-800">
                    <span className="font-medium">Brand:</span> {subsidiaries.find(s => s.id.toString() === form.subsidiary)?.name}
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    This product will be associated with the selected subsidiary brand
                  </p>
                </div>
              )}
              {!subsidiariesLoading && subsidiaries.length === 0 && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  <p>No subsidiaries found for your company. Products will be associated with your main company.</p>
                  <button
                    type="button"
                    onClick={() => window.location.assign('/dashboard/contact-info/subsidiaries')}
                    className="mt-2 inline-flex items-center px-3 py-1.5 rounded-lg border text-xs border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
                  >
                    Manage Subsidiaries
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Title *</label>
              <LtrInput 
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                placeholder="Enter exact product name to appear in search results" 
                value={form.title} 
                onChange={e => handleChange("title", e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                <LtrInput 
                  className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                  placeholder="e.g., Electronics, Machinery"
                  value={form.type} 
                  onChange={e => handleChange("type", e.target.value)} 
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Product Keywords</label>
                  <div className="relative group">
                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-64">
                      <div className="text-left space-y-1">
                        <div className="font-medium text-yellow-300">(Max 8):</div>
                        <div>Add words buyers might use to search for your product.</div>
                        <div className="text-gray-300">Use relevant terms only (brand, type, features, synonyms).</div>
                        <div className="text-gray-300">Separate each keyword with a comma.</div>
                        <div className="text-gray-300">Maximum 8 keywords, each under 30 characters.</div>
                        <div className="text-red-300">Do not repeat the same word or add unrelated terms.</div>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <LtrInput 
                  className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                  placeholder="e.g., smartphone, mobile, device"
                  value={form.keywords} 
                  onChange={e => handleChange("keywords", e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Media Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Product Media</h4>
          </div>
          
          <div className="space-y-6">
            {/* Product Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Upload Areas */}
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  <div className="pointer-events-none">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">Click to upload images</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => onProductImages(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  <div className="pointer-events-none">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">Click to upload images</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => onProductImages(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {/* Image Preview Area */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {form.productImages.map((f, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <ImageThumb file={f} onRemove={() => removeProductImage(i)} />
                        <label className="mt-1 text-xs flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={form.primaryImageIndex === i}
                            onChange={(e) => {
                              if (e.target.checked) setPrimaryImage(i);
                            }}
                          />
                          Primary
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">Select one image as <span className="font-medium">Primary</span>.</div>
                  <button type="button" className="text-xs text-blue-600 hover:text-blue-800" onClick={() => imageInputRef.current?.click()}>+ Add more images</button>
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" multiple onChange={e => onProductImages(e.target.files)} />
                </div>
              </div>
            </div>

            {/* Product Videos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Videos</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  <div className="pointer-events-none">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">Click to upload videos</p>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={e => onProductVideos(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  {form.productVideos.length === 0 ? (
                    <p className="text-sm text-gray-500">No videos selected.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {form.productVideos.map((v, idx) => (
                        <li key={idx} className="flex items-center justify-between border rounded-lg px-3 py-2 bg-gray-50">
                          <div className="truncate mr-2">
                            <span className="text-gray-600">{v.name}</span> 
                            <span className="text-gray-400 ml-2">({Math.round((v.size||0)/1024)} KB)</span>
                          </div>
                          <button type="button" className="text-xs text-red-600 hover:text-red-800" onClick={() => removeProductVideo(idx)}>Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-gray-500">Accepted: mp4, webm, mov. You can upload multiple videos.</p>
                  <button type="button" className="text-xs text-blue-600 hover:text-blue-800" onClick={() => videoInputRef.current?.click()}>+ Add more videos</button>
                  <input ref={videoInputRef} type="file" accept="video/*" className="hidden" multiple onChange={e => onProductVideos(e.target.files)} />
                </div>
              </div>
            </div>

            {/* Product Brochure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Brochure</label>
              <div className="flex items-center gap-3">
                <div className="flex-1 border border-gray-300 rounded-lg p-3 text-sm text-gray-700 bg-white flex items-center justify-between">
                  <span>{form.brochure ? form.brochure.name : "No file selected"}</span>
                  {form.brochure && (
                    <button type="button" className="text-xs text-red-600 hover:text-red-800" onClick={() => onBrochure(null)}>Remove</button>
                  )}
                </div>
                <label className="px-4 py-3 text-sm bg-blue-600 text-white border border-blue-600 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                  Upload Brochure
                  <input type="file" accept="application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => onBrochure(e.target.files && e.target.files[0])} className="hidden" />
                </label>
              </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Specification</label>
              <p className="text-xs text-gray-500 mb-2">Information to help buyers find your product in search results. Buyers can use terms like "size", "color" etc.</p>
              <RichTextEditor
                value={form.spec}
                onChange={(value) => handleChange("spec", value)}
                placeholder="Enter detailed product specifications..."
                height="150px"
                onImageUpload={(file) => handleRichTextImageUpload(file, { section: 'specification' })}
                className="mb-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Additional Specifications</label>
                <button type="button" onClick={moreAdd} className="text-sm text-blue-600 hover:text-blue-800">+ Add more</button>
              </div>
              <div className="space-y-2">
                {form.moreDetails.map((md, idx) => (
                  <div key={idx} className="flex gap-2">
                    <LtrInput 
                      placeholder="Attribute (e.g., Color)" 
                      className="flex-1 h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                      value={md.key} 
                      onChange={e => moreChange(idx, "key", e.target.value)} 
                    />
                    <LtrInput 
                      placeholder="Value (e.g., Red)" 
                      className="flex-1 h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                      value={md.value} 
                      onChange={e => moreChange(idx, "value", e.target.value)} 
                    />
                    <button type="button" className="text-xs text-red-600 hover:text-red-800 px-2" onClick={() => moreRemove(idx)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Description Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Product Description & Benefits</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product/Services Description</label>
              <RichTextEditor
                value={form.description}
                onChange={(value) => handleChange("description", value)}
                placeholder="Describe your product or service in detail..."
                height="200px"
                onImageUpload={(file) => handleRichTextImageUpload(file, { section: 'description' })}
                className="mb-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Benefits of Products/Services</label>
              <RichTextEditor
                value={form.benefits}
                onChange={(value) => handleChange("benefits", value)}
                placeholder="What benefits does your product provide to customers..."
                height="200px"
                onImageUpload={(file) => handleRichTextImageUpload(file, { section: 'benefits' })}
                className="mb-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Capacity</label>
                <LtrInput 
                  className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" 
                  value={form.capacity} 
                  onChange={e => handleChange("capacity", e.target.value)} 
                  placeholder="e.g., 1000 units per month"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Packaging and Delivery</label>
                <RichTextEditor
                  value={form.packaging}
                  onChange={(value) => handleChange("packaging", value)}
                  placeholder="Describe packaging and delivery options..."
                  height="150px"
                  onImageUpload={(file) => handleRichTextImageUpload(file, { section: 'packaging' })}
                  className="mb-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Additional Information</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Feedback</label>
              <RichTextEditor
                value={form.customerFeedback}
                onChange={(value) => handleChange("customerFeedback", value)}
                placeholder="Share customer testimonials or feedback..."
                height="150px"
                onImageUpload={(file) => handleRichTextImageUpload(file, { section: 'customer_feedback' })}
                className="mb-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Questions and Answers</label>
              <RichTextEditor
                value={form.qna}
                onChange={(value) => handleChange("qna", value)}
                placeholder="Common questions and answers about your product..."
                height="150px"
                onImageUpload={(file) => handleRichTextImageUpload(file, { section: 'qna' })}
                className="mb-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Other Information</label>
              <RichTextEditor
                value={form.others}
                onChange={(value) => handleChange("others", value)}
                placeholder="Any other relevant information..."
                height="150px"
                onImageUpload={(file) => handleRichTextImageUpload(file, { section: 'others' })}
                className="mb-2"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input 
                  type="checkbox" 
                  checked={form.isFeatured} 
                  onChange={e => handleChange('isFeatured', e.target.checked)} 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Mark as Featured Product
              </label>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-center">
            <button 
              type="button" 
              disabled={submitting} 
              onClick={() => handleSubmit('post')} 
              className={`px-8 py-3 rounded-lg text-white font-medium w-48 transition-all duration-200 ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}`}
            >
              {submitting ? 'Creating Product...' : 'Create Product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
