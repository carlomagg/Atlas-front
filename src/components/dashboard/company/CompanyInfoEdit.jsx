import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCompany, getCompanyById, updateCompany, uploadNestedFiles } from '../../../services/companyApi';

const CompanyInfoEdit = () => {
  const [companyId, setCompanyId] = useState('');
  const [form, setForm] = useState({
    company_name: '',
    about_us: '',
    why_choose_us: '',
    year_of_establishment: '',
    number_of_employees: '',
    annual_turnover: '',
    brand_name: '',
    website: '',
    company_capacity: '',
    additional_info: '',
    questions_and_answers: '',
    others: '',
    address_country: '',
    address_state: '',
    address_city: '',
    street: '',
    company_logo: null,
    company_image: null,
    company_cover_photo: null,
    // collections as files (arrays)
    certificates: [],
    blog_awards: [],
    production_sites: [],
    storage_sites: [],
    exhibitions: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Read companyId from query string for update flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qId = params.get('companyId');
    if (qId) setCompanyId(qId);
  }, []);

  // Prefill when updating (note: cannot prefill file inputs)
  useEffect(() => {
    (async () => {
      if (!companyId) return;
      try {
        setError('');
        const data = await getCompanyById(companyId);
        const c = data?.company || data;
        // Map API fields directly; ignore files
        setForm(prev => ({
          ...prev,
          company_name: c.company_name || '',
          about_us: c.about_us || '',
          why_choose_us: c.why_choose_us || '',
          year_of_establishment: c.year_of_establishment ?? '',
          number_of_employees: c.number_of_employees ?? '',
          annual_turnover: c.annual_turnover ?? '',
          brand_name: c.brand_name || '',
          website: c.website || '',
          company_capacity: c.company_capacity || '',
          additional_info: c.additional_info || '',
          questions_and_answers: c.questions_and_answers || '',
          others: c.others || '',
          address_country: c.address_country || '',
          address_state: c.address_state || '',
          address_city: c.address_city || '',
          street: c.street || '',
          // keep arrays of files empty unless user selects new ones
          certificates: [],
          blog_awards: [],
          production_sites: [],
          storage_sites: [],
          exhibitions: [],
        }));
      } catch (e) {
        setError(e.message || 'Failed to load company');
      }
    })();
  }, [companyId]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onFileChange = (e) => {
    const { name, files } = e.target;
    setForm(prev => ({ ...prev, [name]: files && files[0] ? files[0] : null }));
  };

  const onMultiFileChange = (e) => {
    const { name, files } = e.target;
    const arr = files ? Array.from(files) : [];
    setForm(prev => ({ ...prev, [name]: arr }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...form };
      // Only include multi-file arrays if user selected files; otherwise omit to avoid overwriting on PATCH
      ['certificates','blog_awards','production_sites','storage_sites','exhibitions'].forEach(k => {
        if (!Array.isArray(payload[k]) || payload[k].length === 0) {
          delete payload[k];
        }
      });
      // Omit single-file fields if user did not pick a file
      ['company_logo','company_image','company_cover_photo'].forEach(k => {
        if (!payload[k]) delete payload[k];
      });
      const res = companyId
        ? await updateCompany(companyId, payload)
        : await createCompany(payload);
      // Determine target company id
      let targetId = companyId;
      if (!targetId) {
        const newId = res?.id || res?.company?.id || res?.data?.id;
        if (newId) {
          targetId = String(newId);
          setCompanyId(targetId);
        }
      }

      // Upload nested files if any were selected
      let nestedSummary = [];
      if (targetId) {
        const nestedMap = [
          ['certificates', 'certificates'],
          ['blog_awards', 'blog-awards'],
          ['production_sites', 'production-sites'],
          ['storage_sites', 'storage-sites'],
          ['exhibitions', 'exhibitions']
        ];
        for (const [stateKey, segment] of nestedMap) {
          const files = form[stateKey];
          if (Array.isArray(files) && files.length > 0) {
            console.log('[nested-upload] start', { companyId: targetId, segment, count: files.length, kinds: files.map(f => (typeof File !== 'undefined' && f instanceof File) || (typeof Blob !== 'undefined' && f instanceof Blob) ? 'file' : 'public_id') });
            try {
              // eslint-disable-next-line no-await-in-loop
              const uploaded = await uploadNestedFiles(targetId, segment, files);
              nestedSummary.push(`${segment}: ${uploaded.length}`);
            } catch (nestedErr) {
              console.error(`Nested upload failed for ${segment}:`, nestedErr);
              throw new Error(`Failed uploading ${segment}. ${nestedErr?.message || ''}`.trim());
            }
          }
        }
      }

      const flashMsg = (companyId ? 'Company updated.' : 'Company created.') + (nestedSummary.length ? ` Uploaded -> ${nestedSummary.join(', ')}` : '');
      setSuccess(flashMsg);

      // Floating success toast (top-right) like in BasicInfoEdit
      try {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-lg z-50';
        toast.innerHTML = `
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-800">${flashMsg}</p>
              <p class="text-xs text-green-700 mt-0.5">Redirecting to Company Info...</p>
            </div>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
      } catch (_) { /* no-op if DOM unavailable */ }

      // Redirect after a short delay to ensure the toast is visible
      setTimeout(() => {
        navigate('/dashboard/contact-info/company', { replace: true, state: { flash: flashMsg, ts: Date.now() } });
      }, 4000);
    } catch (err) {
      console.error('[company-submit] failed', err);
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Page heading to align with BasicInfoEdit */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{companyId ? 'Edit Company Information' : 'Create Company Information'}</h1>
        <p className="mt-1 text-sm text-gray-600">Provide accurate and complete company details for better trust and discovery.</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow mb-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            <p className="ml-3 text-sm font-medium text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Form area styled like BasicInfoEdit grid */}
      <form onSubmit={onSubmit}>
        <div className="bg-white border border-blue-100 rounded-md shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr]">
            {/* Company Logo */}
            <div className="bg-gray-100 text-gray-700 px-4 py-5 border-b border-blue-100 flex items-center">Company Logo</div>
            <div className="px-4 py-5 border-b md:border-l border-blue-100">
              <input type="file" name="company_logo" onChange={onFileChange} className="block w-full text-sm" />
              <p className="mt-2 text-xs text-gray-500">Upload your company logo (PNG, JPG).</p>
            </div>

            {/* Company Image */}
            <div className="bg-gray-100 text-gray-700 px-4 py-5 border-b border-blue-100 flex items-center">Company Image</div>
            <div className="px-4 py-5 border-b md:border-l border-blue-100">
              <input type="file" name="company_image" onChange={onFileChange} className="block w-full text-sm" />
              <p className="mt-2 text-xs text-gray-500">Primary image that represents your company.</p>
            </div>

            {/* Cover Photo */}
            <div className="bg-gray-100 text-gray-700 px-4 py-5 border-b border-blue-100 flex items-center">Cover Photo</div>
            <div className="px-4 py-5 border-b md:border-l border-blue-100">
              <input type="file" name="company_cover_photo" onChange={onFileChange} className="block w-full text-sm" />
              <p className="mt-2 text-xs text-gray-500">Wide banner-style image.</p>
            </div>

            {/* Company Name */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Company Name</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input name="company_name" value={form.company_name} onChange={onChange} placeholder="Enter company name" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none" />
            </div>

            {/* Brand Name */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Brand Name</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input name="brand_name" value={form.brand_name} onChange={onChange} placeholder="Enter brand name" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none" />
            </div>

            {/* Website */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Website</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input name="website" value={form.website} onChange={onChange} placeholder="https://example.com" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none" />
            </div>

            {/* Year of Establishment */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Year of Establishment</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input name="year_of_establishment" value={form.year_of_establishment} onChange={onChange} placeholder="e.g. 2010" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none" />
            </div>

            {/* Number of Employees */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Number of Employees</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input name="number_of_employees" value={form.number_of_employees} onChange={onChange} placeholder="e.g. 50" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none" />
            </div>

            {/* Annual Turnover */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Annual Turnover</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input name="annual_turnover" value={form.annual_turnover} onChange={onChange} placeholder="e.g. $1M" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none" />
            </div>

            {/* Capacity */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Capacity</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input name="company_capacity" value={form.company_capacity} onChange={onChange} placeholder="e.g. 10,000 units/mo" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none" />
            </div>

            {/* About Us */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">About Us</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <textarea name="about_us" value={form.about_us} onChange={onChange} rows={3} placeholder="Describe your company" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"></textarea>
            </div>

            {/* Why Choose Us */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Why Choose Us</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <textarea name="why_choose_us" value={form.why_choose_us} onChange={onChange} rows={3} placeholder="What sets you apart" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"></textarea>
            </div>

            {/* Address - Country */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Country</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input name="address_country" value={form.address_country} onChange={onChange} placeholder="Country" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none" />
            </div>

            {/* Address - State */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">State</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input name="address_state" value={form.address_state} onChange={onChange} placeholder="State" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none" />
            </div>

            {/* Address - City */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">City</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input name="address_city" value={form.address_city} onChange={onChange} placeholder="City" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none" />
            </div>

            {/* Address - Street */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Street</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input name="street" value={form.street} onChange={onChange} placeholder="Street" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none" />
            </div>

            {/* Collections - Certificates */}
            <div className="bg-gray-100 text-gray-700 px-4 py-5 border-b border-blue-100 flex items-center">Certificates</div>
            <div className="px-4 py-5 border-b md:border-l border-blue-100">
              <input type="file" name="certificates" multiple onChange={onMultiFileChange} className="block w-full text-sm" />
              <p className="mt-2 text-xs text-gray-500">Upload multiple files.</p>
            </div>

            {/* Collections - Blog & Awards */}
            <div className="bg-gray-100 text-gray-700 px-4 py-5 border-b border-blue-100 flex items-center">Blog & Awards</div>
            <div className="px-4 py-5 border-b md:border-l border-blue-100">
              <input type="file" name="blog_awards" multiple onChange={onMultiFileChange} className="block w-full text-sm" />
              <p className="mt-2 text-xs text-gray-500">Upload multiple files.</p>
            </div>

            {/* Collections - Production Sites */}
            <div className="bg-gray-100 text-gray-700 px-4 py-5 border-b border-blue-100 flex items-center">Production Sites</div>
            <div className="px-4 py-5 border-b md:border-l border-blue-100">
              <input type="file" name="production_sites" multiple onChange={onMultiFileChange} className="block w-full text-sm" />
              <p className="mt-2 text-xs text-gray-500">Upload multiple files.</p>
            </div>

            {/* Collections - Storage Sites */}
            <div className="bg-gray-100 text-gray-700 px-4 py-5 border-b border-blue-100 flex items-center">Storage Sites</div>
            <div className="px-4 py-5 border-b md:border-l border-blue-100">
              <input type="file" name="storage_sites" multiple onChange={onMultiFileChange} className="block w-full text-sm" />
              <p className="mt-2 text-xs text-gray-500">Upload multiple files.</p>
            </div>

            {/* Collections - Exhibitions */}
            <div className="bg-gray-100 text-gray-700 px-4 py-5 border-b border-blue-100 flex items-center">Exhibitions</div>
            <div className="px-4 py-5 border-b md:border-l border-blue-100">
              <input type="file" name="exhibitions" multiple onChange={onMultiFileChange} className="block w-full text-sm" />
              <p className="mt-2 text-xs text-gray-500">Upload multiple files.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-4 flex items-center gap-3">
            <button type="button" onClick={() => navigate('/dashboard/contact-info/company')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded">
              Cancel
            </button>
            <button disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
              {submitting ? 'Submitting...' : (companyId ? 'Update' : 'Create')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CompanyInfoEdit;
