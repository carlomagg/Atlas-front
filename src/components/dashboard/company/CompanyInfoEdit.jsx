import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCompany, getCompanyById, updateCompany, uploadNestedFiles, getMyCompany, getMyCompanyWithAddresses, updateMyCompanyWithAddresses } from '../../../services/companyApi';
import { COUNTRIES, STATES } from '../../../utils/locationData';
import AddressManager from './AddressManager';

const CompanyInfoEdit = () => {
  const [companyId, setCompanyId] = useState('');
  const [form, setForm] = useState({
    company_name: '',
    about_us: '',
    about_us_media: [],
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
    // New enhanced addresses array
    addresses: [],
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

  // Load company data for editing (works for both companyId and current user's company)
  useEffect(() => {
    (async () => {
      try {
        setError('');
        // Try the new bulk replace API endpoint to get company with addresses
        let data;
        try {
          data = await getMyCompanyWithAddresses();
        } catch (error) {
          console.warn('New addresses endpoint failed for loading, falling back to existing logic:', error.message);
          // Fallback to existing company loading logic
          data = await getMyCompany();
        }
        
        if (!data) {
          // No company profile exists yet - this is fine for new company creation
          console.log('No company profile found - ready for new company creation');
          return;
        }
        
        const c = data?.company || data;
        
        // Set companyId if we loaded existing company data
        if (c?.id && !companyId) {
          setCompanyId(String(c.id));
        }
        
        // Map API fields directly; ignore files
        // Normalize country/state for dropdowns
        let cc = c.address_country || '';
        if (cc && String(cc).length > 2) {
          const foundC = COUNTRIES.find(x => x.name.toLowerCase() === String(cc).toLowerCase());
          if (foundC) cc = foundC.code;
        }
        let st = c.address_state || '';
        if (cc === 'US' && st) {
          const foundS = (STATES.US || []).find(x => x.name?.toLowerCase() === String(st).toLowerCase() || x.code === st);
          if (foundS) st = foundS.code;
        }
        // Prefill addresses array (from c.addresses) and ensure head office marked
        const apiAddresses = Array.isArray(c.addresses) ? c.addresses : [];
        // If backend also returns head_office separately, ensure it's reflected in addresses
        const headOffice = c.head_office || null;
        let addresses = apiAddresses.map(a => ({
          country: a.country || '',
          state_region: a.state_region || a.state || '',
          city: a.city || '',
          street_address: a.street_address || a.street || '',
          postal_code: a.postal_code || '',
          phone_number: a.phone_number || '',
          email: a.email || '',
          latitude: (a.latitude ?? ''),
          longitude: (a.longitude ?? ''),
          is_head_office: !!a.is_head_office
        }));
        if (headOffice && !addresses.some(a => a.is_head_office)) {
          // Try to match head_office to one of the addresses, else push it
          const hoObj = {
            country: headOffice.country || '',
            state_region: headOffice.state_region || headOffice.state || '',
            city: headOffice.city || '',
            street_address: headOffice.street_address || headOffice.street || '',
            postal_code: headOffice.postal_code || '',
            phone_number: headOffice.phone_number || '',
            email: headOffice.email || '',
            latitude: (headOffice.latitude ?? ''),
            longitude: (headOffice.longitude ?? ''),
            is_head_office: true
          };
          addresses = [hoObj, ...addresses];
        }
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
          address_country: cc,
          address_state: st,
          address_city: c.address_city || '',
          street: c.street || '',
          // prefill addresses
          addresses,
          // keep arrays of files empty unless user selects new ones
          about_us_media: [],
          certificates: [],
          blog_awards: [],
          production_sites: [],
          storage_sites: [],
          exhibitions: [],
        }));
      } catch (e) {
        console.error('Failed to load company data:', e);
        setError(e.message || 'Failed to load company');
      }
    })();
  }, []); // Load on mount

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      if (name === 'address_country' && value !== prev.address_country) {
        return { ...prev, address_country: value, address_state: '' };
      }
      return { ...prev, [name]: value };
    });
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
      console.log('Form submission - original payload addresses:', form.addresses);
      
      const payload = { ...form };
      
      // Clean up addresses array for API submission
      if (Array.isArray(payload.addresses) && payload.addresses.length > 0) {
        // Filter out empty addresses - only include addresses with at least one location field
        const validAddresses = payload.addresses.filter(addr => {
          const hasLocationData = addr.country?.trim() || 
                                 addr.state_region?.trim() || 
                                 addr.city?.trim() || 
                                 addr.street_address?.trim();
          return hasLocationData;
        });
        
        if (validAddresses.length === 0) {
          // No valid addresses, remove addresses array entirely
          delete payload.addresses;
        } else {
          // Clean and format valid addresses
          payload.addresses = validAddresses.map(addr => ({
            id: addr.id, // Include ID for updates, omit for creates
            country: addr.country?.trim() || null,
            state_region: addr.state_region?.trim() || null,
            city: addr.city?.trim() || null,
            street_address: addr.street_address?.trim() || null,
            postal_code: addr.postal_code?.trim() || null,
            phone_number: addr.phone_number?.trim() || null,
            email: addr.email?.trim() || null,
            latitude: addr.latitude ?? null,
            longitude: addr.longitude ?? null,
            is_head_office: !!addr.is_head_office,
          }));
          
          // Ensure exactly one head office
          const headOfficeCount = payload.addresses.filter(a => a.is_head_office).length;
          if (headOfficeCount === 0 && payload.addresses.length > 0) {
            payload.addresses[0].is_head_office = true;
          } else if (headOfficeCount > 1) {
            let firstHeadOfficeFound = false;
            payload.addresses = payload.addresses.map(addr => {
              if (addr.is_head_office && !firstHeadOfficeFound) {
                firstHeadOfficeFound = true;
                return addr;
              }
              return { ...addr, is_head_office: false };
            });
          }
        }
      } else {
        // If no addresses provided, create a minimal head office from legacy fields
        if (payload.address_country || payload.address_state || payload.address_city || payload.street) {
          payload.addresses = [{
            country: payload.address_country || null,
            state_region: payload.address_state || null,
            city: payload.address_city || null,
            street_address: payload.street || null,
            postal_code: null,
            phone_number: null,
            email: null,
            latitude: null,
            longitude: null,
            is_head_office: true
          }];
        }
      }
      
      console.log('Final payload addresses before submission:', payload.addresses);
      console.log('Complete payload being sent:', payload);
      // Only include multi-file arrays if user selected files; otherwise omit to avoid overwriting on PATCH
      ['about_us_media','certificates','blog_awards','production_sites','storage_sites','exhibitions'].forEach(k => {
        if (!Array.isArray(payload[k]) || payload[k].length === 0) {
          delete payload[k];
        }
      });
      // Omit single-file fields if user did not pick a file
      ['company_logo','company_image','company_cover_photo'].forEach(k => {
        if (!payload[k]) delete payload[k];
      });
      // Try the new bulk replace API endpoint for addresses, with fallback to existing logic
      let res;
      if (companyId) {
        try {
          res = await updateMyCompanyWithAddresses(payload);
        } catch (error) {
          console.warn('New addresses endpoint failed, falling back to existing update:', error.message);
          // Fallback to existing update logic
          res = await updateCompany(companyId, payload);
        }
      } else {
        res = await createCompany(payload);
      }
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
          ['about_us_media', 'about-us-media'],
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

  // ---------- Addresses UI Helpers ----------
  const emptyAddress = () => ({
    country: '',
    state_region: '',
    city: '',
    street_address: '',
    postal_code: '',
    phone_number: '',
    email: '',
    latitude: '',
    longitude: '',
    is_head_office: false
  });

  const addAddress = () => {
    setForm(prev => ({ ...prev, addresses: [...(prev.addresses || []), emptyAddress()] }));
  };

  const removeAddress = (idx) => {
    setForm(prev => ({ ...prev, addresses: (prev.addresses || []).filter((_, i) => i !== idx) }));
  };

  const updateAddressField = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      addresses: (prev.addresses || []).map((a, i) => i === idx ? { ...a, [field]: value } : a)
    }));
  };

  const setHeadOffice = (idx) => {
    setForm(prev => ({
      ...prev,
      addresses: (prev.addresses || []).map((a, i) => ({ ...a, is_head_office: i === idx }))
    }));
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
              <input name="annual_turnover" value={form.annual_turnover} onChange={onChange} placeholder="e.g. ₦1M" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none" />
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

            {/* About Us Media */}
            <div className="bg-gray-100 text-gray-700 px-4 py-5 border-b border-blue-100 flex items-center">About Us Media</div>
            <div className="px-4 py-5 border-b md:border-l border-blue-100">
              <input type="file" name="about_us_media" multiple onChange={onMultiFileChange} className="block w-full text-sm" />
              <p className="mt-2 text-xs text-gray-500">Upload multiple images/videos to showcase your company story.</p>
            </div>

            {/* Why Choose Us */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Why Choose Us</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <textarea name="why_choose_us" value={form.why_choose_us} onChange={onChange} rows={3} placeholder="What sets you apart" className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"></textarea>
            </div>

            {/* Multiple Addresses Manager */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Company Addresses</div>
            <div className="px-4 py-6 border-b md:border-l border-blue-100">
              <AddressManager
                addresses={form.addresses}
                onChange={(addresses) => setForm(prev => ({ ...prev, addresses }))}
                className="w-full"
              />
              <p className="mt-3 text-xs text-gray-500">
                Manage multiple company addresses. Mark one as head office. Use bulk replace - all addresses are saved together.
              </p>
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
