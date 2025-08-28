  // ProductForm.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createProductWithMedia, buildCreateWithMediaPayload, listCategories, createBrochure, listBrochures } from "../../../services/productApi";

/* Lightweight Rich Text Editor (contentEditable + execCommand) */
function RichTextEditor({ value = "", onChange, id }) {
  const editorRef = useRef();
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd, arg = null) => {
    document.execCommand(cmd, false, arg);
    onChange && onChange(editorRef.current.innerHTML);
    editorRef.current.focus();
  };

  // Shared LTR props for text inputs and textareas
  const ltrProps = {
    dir: 'ltr',
    style: { direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left' }
  };

  return (
    <div className="space-y-2">
      <div className="bg-gray-50 border rounded p-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => exec("bold")} className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100">B</button>
        <button type="button" onClick={() => exec("italic")} className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100">I</button>
        <button type="button" onClick={() => exec("underline")} className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100">U</button>
        <button type="button" onClick={() => exec("insertUnorderedList")} className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100">• List</button>
        <button type="button" onClick={() => exec("insertOrderedList")} className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100">1. List</button>
        <button type="button" onClick={() => {
          const url = prompt("Enter URL");
          if (url) exec("createLink", url);
        }} className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100">Link</button>

        <button type="button" onClick={() => { exec("removeFormat"); }} className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100">Clear</button>

        <div className="ml-auto">
          <button type="button" onClick={() => setShowPreview(true)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded">View Sample</button>
        </div>
      </div>

      <div
        ref={editorRef}
        id={id}
        className="min-h-[110px] border rounded p-3 focus:outline-none"
        dir="ltr"
        style={{ direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left' }}
        contentEditable
        onInput={() => onChange && onChange(editorRef.current.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
      />

      {showPreview && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-lg max-w-3xl w-full p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Sample Preview</h3>
              <button className="text-sm text-gray-600" onClick={() => setShowPreview(false)}>Close</button>
            </div>
            <div className="prose max-h-[60vh] overflow-auto" dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || "" }} />
            <div className="mt-4 text-right">
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => setShowPreview(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Categories state
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");

  useEffect(() => {
    const loadCats = async () => {
      setCatLoading(true); setCatError("");
      try {
        const res = await listCategories();
        const items = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
        const mapped = items.map(it => ({ id: it.id ?? it.value ?? it.pk ?? it.slug ?? it.code, name: it.name ?? it.title ?? it.label ?? String(it.id ?? it.value ?? '') }));
        setCategories(mapped.filter(c => c.id != null));
      } catch (e) {
        console.error('Load categories failed', e);
        setCatError(e?.message || 'Failed to load categories');
      } finally {
        setCatLoading(false);
      }
    };
    loadCats();
  }, []);

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

  /* more product details handlers */
  const moreAdd = () => setForm(prev => ({ ...prev, moreDetails: [...prev.moreDetails, { key: "", value: "" }] }));
  const moreChange = (i, field, val) => {
    setForm(prev => {
      const arr = prev.moreDetails.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
      return { ...prev, moreDetails: arr };
    });
  };
  const moreRemove = (i) => setForm(prev => ({ ...prev, moreDetails: prev.moreDetails.filter((_, idx) => idx !== i) }));

  const handleSubmit = (mode = 'post') => {
    if (submitting) return;
    setSubmitting(true);
    (async () => {
      try {
        const payload = await buildCreateWithMediaPayload(form);
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
    <form dir="ltr" style={{ direction: 'ltr' }} onSubmit={(e) => { e.preventDefault(); handleSubmit('post'); }} className="dashboard-form max-w-4xl mx-auto bg-white p-6 border rounded shadow-sm space-y-6">
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
      {/* Product Basics */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Select categories :</label>
          <select
            className="mt-1 block w-full border rounded p-2"
            value={form.category}
            onChange={e => handleChange("category", Number(e.target.value))}
          >
            <option value="">{catLoading ? 'Loading…' : 'Select'}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {catError && (<p className="text-xs text-red-600 mt-1">{catError}</p>)}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Product Title :</label>
          <LtrInput className="mt-1 block w-full border rounded p-2" placeholder="Enter exact product name to appear in search results" value={form.title} onChange={e => handleChange("title", e.target.value)} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Type :</label>
            <LtrInput className="mt-1 block w-full border rounded p-2" value={form.type} onChange={e => handleChange("type", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Keyword :</label>
            <LtrInput className="mt-1 block w-full border rounded p-2" value={form.keywords} onChange={e => handleChange("keywords", e.target.value)} />
          </div>
        </div>

      </div>

      {/* Product Image Uploads (with Primary selection) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Product Image :</label>
        <div className="flex items-center gap-4">
          <div className="w-36 h-28 border-2 border-dashed rounded flex items-center justify-center text-sm text-gray-400">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={e => onProductImages(e.target.files)} className="hidden" />
              Upload Images
            </label>
          </div>
          <div className="w-36 h-28 border-2 border-dashed rounded flex items-center justify-center text-sm text-gray-400">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={e => onProductImages(e.target.files)} className="hidden" />
              Upload Images
            </label>
          </div>

          <div className="flex-1">
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
                        // If unchecked on current primary, ignore to ensure one primary always exists
                      }}
                    />
                    Primary
                  </label>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-500">You can upload multiple images. Select one as <span className="font-medium">Primary</span>.</div>
              <button type="button" className="text-xs text-blue-600" onClick={() => imageInputRef.current?.click()}>+ Add more</button>
            </div>
            {/* Hidden input triggered by + Add more */}
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" multiple onChange={e => onProductImages(e.target.files)} />
          </div>
        </div>
      </div>

      {/* Product Videos */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Videos</label>
        <div className="mt-2 flex items-start gap-4">
          <div className="w-36 h-28 border-2 border-dashed rounded flex items-center justify-center text-sm text-gray-400 bg-white">
            <label className="cursor-pointer px-2 text-center">
              <input type="file" accept="video/*" onChange={e => onProductVideos(e.target.files)} className="hidden" multiple />
              Upload Videos
            </label>
          </div>
          <div className="flex-1">
            {form.productVideos.length === 0 ? (
              <p className="text-sm text-gray-500">No videos selected.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {form.productVideos.map((v, idx) => (
                  <li key={idx} className="flex items-center justify-between border rounded px-2 py-1 bg-white">
                    <div className="truncate mr-2"><span className="text-gray-600">{v.name}</span> <span className="text-gray-400">({Math.round((v.size||0)/1024)} KB)</span></div>
                    <button type="button" className="text-xs text-red-600" onClick={() => removeProductVideo(idx)}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">Accepted: mp4, webm, mov. You can upload multiple videos.</p>
              <button type="button" className="text-xs text-blue-600" onClick={() => videoInputRef.current?.click()}>+ Add more</button>
            </div>
            {/* Hidden input triggered by + Add more */}
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" multiple onChange={e => onProductVideos(e.target.files)} />
          </div>
        </div>
      </div>

      {/* Product Brochure */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Brochure</label>
        <div className="mt-1 flex items-center gap-3">
          <div className="flex-1 border rounded p-2 text-sm text-gray-700 bg-white flex items-center justify-between">
            <span>{form.brochure ? form.brochure.name : "No file selected"}</span>
            {form.brochure && (
              <button type="button" className="text-xs text-red-600" onClick={() => onBrochure(null)}>Remove</button>
            )}
          </div>
          <label className="px-3 py-2 text-sm bg-white border rounded cursor-pointer">
            Click to upload brochure
            <input type="file" accept="application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => onBrochure(e.target.files && e.target.files[0])} className="hidden" />
          </label>
        </div>
      </div>

      {/* Product Specification */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Specification :</label>
        <p className="text-xs text-gray-500 mb-2">Information to help buyers find your product in search results. Buyers can use terms like "size", "color" etc.</p>
        <textarea {...ltrProps} className="w-full border rounded p-2" rows={3} value={form.spec} onChange={e => handleChange("spec", e.target.value)} />
      </div>

      {/* Specifications (dynamic key/value) */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Specifications</label>
          <button type="button" onClick={moreAdd} className="text-sm text-blue-600">+ Add more</button>
        </div>
        <div className="mt-2 space-y-2">
          {form.moreDetails.map((md, idx) => (
            <div key={idx} className="flex gap-2">
              <LtrInput placeholder="Attribute (e.g., Color)" className="flex-1 border rounded p-2 text-sm" value={md.key} onChange={e => moreChange(idx, "key", e.target.value)} />
              <LtrInput placeholder="Value (e.g., Red)" className="flex-1 border rounded p-2 text-sm" value={md.value} onChange={e => moreChange(idx, "value", e.target.value)} />
              <button type="button" className="text-xs text-red-600" onClick={() => moreRemove(idx)}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      {/* Product / Services Description (Rich Editor) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Product/ Services Description:</label>
        <textarea {...ltrProps} className="mt-1 block w-full border rounded p-2 min-h-[110px]" value={form.description} onChange={e => handleChange("description", e.target.value)} />
      </div>

      {/* Benefits, Capacity, Packaging */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Benefit of Products / Services</label>
        <textarea {...ltrProps} className="mt-1 block w-full border rounded p-2 min-h-[110px]" value={form.benefits} onChange={e => handleChange("benefits", e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Capacity:</label>
          <LtrInput className="mt-1 block w-full border rounded p-2" value={form.capacity} onChange={e => handleChange("capacity", e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Packaging and Delivery</label>
          <textarea {...ltrProps} className="mt-1 block w-full border rounded p-2 min-h-[110px]" value={form.packaging} onChange={e => handleChange("packaging", e.target.value)} />
        </div>
      </div>

      {/* Feedback / Q&A / Others */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Customer Feedback</label>
        <textarea {...ltrProps} className="mt-1 block w-full border rounded p-2 min-h-[110px]" value={form.customerFeedback} onChange={e => handleChange("customerFeedback", e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Questions and Answers</label>
        <textarea {...ltrProps} className="mt-1 block w-full border rounded p-2 min-h-[110px]" value={form.qna} onChange={e => handleChange("qna", e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Others</label>
        <textarea {...ltrProps} className="mt-1 block w-full border rounded p-2 min-h-[110px]" value={form.others} onChange={e => handleChange("others", e.target.value)} />
      </div>

      {/* Flags */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.isFeatured} onChange={e => handleChange('isFeatured', e.target.checked)} />
          Is Featured
        </label>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <button type="button" disabled={submitting} onClick={() => handleSubmit('post')} className={`px-5 py-2 rounded text-white ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600'}`}>
          {submitting ? 'Posting…' : 'Post'}
        </button>
        <button type="button" disabled={submitting} onClick={() => handleSubmit('post_and_advertise')} className={`px-5 py-2 rounded text-white ${submitting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600'}`}>
          {submitting ? 'Posting…' : 'Post and advertise product'}
        </button>
      </div>
    </form>
  );
}
