import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitBusinessVerification } from '../../services/authApi';
import { getErrorMessage } from '../../utils/errorUtils';
import { COUNTRIES, STATES } from '../../utils/locationData';

// Enums (labels shown; values posted as strings provided)
const INDUSTRY_OPTIONS = [
  'Electronics and Gadget',
  'Home & Living',
  'Fashion Apparel',
  'Computer Product',
  'Construction & Decoration',
  'Lights & Lightening',
  'Arts & Crafts',
  'Jewelry & Accessories',
  'Others'
];

const INCORPORATION_OPTIONS = [
  'SOLE_PROPRIETORSHIP',
  'PRIVATE_LIMITED_COMPANY',
  'PUBLIC_LIMITED_COMPANY',
  'PUBLIC_COMPANY_LIMITED_BY_GUARANTEE',
  'PRIVATE_UNLIMITED_COMPANY'
];

const OWNERSHIP_SELF_OPTIONS = [
  { value: 'OWN_25_OR_MORE', label: 'YES – I own 25% or more' },
  { value: 'OWN_LESS_THAN_25', label: 'YES – I own less than 25%' },
  { value: 'NOT_OWNER', label: 'NO – Not an owner' }
];

const RELATIONSHIP_OPTIONS = [
  'FOUNDER',
  'CO_FOUNDER',
  'EXECUTIVE',
  'SENIOR_LEADERSHIP',
  'OTHERS'
];

const initialOwner = () => ({
  first_name: '',
  last_name: '',
  ownership_percentage: '',
  phone_number: '',
  date_of_birth: '',
  country_of_citizenship: '',
  national_id_number: '',
  country_of_residence: '',
  home_address: '',
  state: '',
  relationship_to_company: '',
  local_government: '',
  city: '',
  photo_id: null
});

const VerifyBusiness = () => {
  const { user, updateUser } = useAuth();
  const status = (user?.businessVerificationStatus || '').toUpperCase();
  const isVerified = useMemo(() => ['APPROVED', 'VERIFIED'].includes(status), [status]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    // Business
    industry: '',
    custom_industry: '', // Add custom industry field
    company_legal_name: '',
    company_address: '',
    state: '',
    local_government: '',
    city: '',
    products_description: '',
    company_registration_number: '',
    incorporation_type: '',
    certificate_of_incorporation: null,
    // Applicant
    are_you_an_owner_of_this_business: '',
    relationship_to_company: '',
    date_of_birth: '',
    country_of_citizenship: '',
    national_id_number: '',
    country_of_residence: '',
    home_address: '',
    applicant_state: '',
    applicant_local_government: '',
    applicant_city: '',
    photo_id: null,
    // Owners (optional)
    owners: []
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      // Reset state when country changes
      if (name === 'country_of_citizenship' && value !== prev.country_of_citizenship) {
        return { ...prev, [name]: value };
      }
      if (name === 'country_of_residence' && value !== prev.country_of_residence) {
        return { ...prev, [name]: value };
      }
      if (name === 'state' && value !== prev.state) {
        return { ...prev, [name]: value };
      }
      if (name === 'applicant_state' && value !== prev.applicant_state) {
        return { ...prev, [name]: value };
      }
      
      // Handle industry change - show/hide custom industry field
      if (name === 'industry') {
        const newForm = { ...prev, [name]: value };
        // Clear custom_industry if not "Others"
        if (value !== 'Others') {
          newForm.custom_industry = '';
        }
        return newForm;
      }
      
      return { ...prev, [name]: value };
    });
    if (error) setError('');
  };

  const onFile = (name) => (e) => {
    const file = e.target.files[0] || null;
    setForm(prev => ({ ...prev, [name]: file }));
    if (error) setError('');
  };

  const addOwner = () => {
    setForm(prev => ({ ...prev, owners: [...prev.owners, initialOwner()] }));
  };

  const removeOwner = (idx) => {
    setForm(prev => ({ ...prev, owners: prev.owners.filter((_, i) => i !== idx) }));
  };

  const onOwnerChange = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      owners: prev.owners.map((o, i) => i === idx ? { ...o, [field]: value } : o)
    }));
    if (error) setError('');
  };

  const onOwnerFile = (idx) => (e) => {
    const file = e.target.files[0] || null;
    setForm(prev => ({
      ...prev,
      owners: prev.owners.map((o, i) => i === idx ? { ...o, photo_id: file } : o)
    }));
    if (error) setError('');
  };

  // Graceful API error formatting
  const formatApiErrors = (apiErr) => {
    const data = apiErr?.response?.data || apiErr?.data || apiErr;
    if (!data) return 'An unexpected error occurred.';
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) return data.join(', ');
    if (typeof data === 'object') {
      // DRF style: { field: ["msg"], owners: [{...}] }
      const parts = [];
      for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val)) {
          parts.push(`${key.replaceAll('_', ' ')}: ${val.map(v => (typeof v === 'string' ? v : v?.message || JSON.stringify(v))).join(', ')}`);
        } else if (typeof val === 'object') {
          // Possibly nested (e.g., owners index dict)
          try {
            parts.push(`${key.replaceAll('_', ' ')}: ${JSON.stringify(val)}`);
          } catch {
            parts.push(`${key.replaceAll('_', ' ')}: ${String(val)}`);
          }
        } else {
          parts.push(`${key.replaceAll('_', ' ')}: ${String(val)}`);
        }
      }
      return parts.join(' | ');
    }
    return 'An unexpected error occurred.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (isVerified) return;

    // Basic required client-side fields
    const required = [
      'industry',
      'company_legal_name',
      'company_address',
      'state',
      'local_government',
      'city',
      'products_description',
      'company_registration_number',
      'incorporation_type',
      'are_you_an_owner_of_this_business',
      'relationship_to_company',
      'date_of_birth',
      'country_of_citizenship',
      'national_id_number',
      'country_of_residence',
      'home_address',
      'applicant_state',
      'applicant_local_government',
      'applicant_city'
    ];
    for (const key of required) {
      if (!form[key] || (typeof form[key] === 'string' && !form[key].trim())) {
        setError(`Please provide ${key.replaceAll('_', ' ')}`);
        return;
      }
    }

    // Validate custom_industry if "Others" is selected
    if (form.industry === 'Others' && (!form.custom_industry || !form.custom_industry.trim())) {
      setError('Please specify your industry when "Others" is selected');
      return;
    }

    // Require certificate file upload
    if (!form.certificate_of_incorporation) {
      setError('Please upload Certificate of Incorporation');
      return;
    }
    // Require applicant photo file upload
    if (!form.photo_id) {
      setError('Please upload Applicant Photo ID');
      return;
    }

    // Validate owners if provided: all key fields required when an owner is added
    if (form.owners.length > 0) {
      const ownerRequired = [
        'first_name',
        'last_name',
        'ownership_percentage',
        'phone_number',
        'date_of_birth',
        'country_of_citizenship',
        'national_id_number',
        'country_of_residence',
        'home_address',
        'state',
        'relationship_to_company',
        'local_government',
        'city'
      ];
      for (let i = 0; i < form.owners.length; i++) {
        const o = form.owners[i];
        for (const key of ownerRequired) {
          const val = o?.[key];
          if (val === undefined || val === null || (typeof val === 'string' && !val.trim())) {
            setError(`Owner #${i + 1}: Please provide ${key.replaceAll('_', ' ')}`);
            return;
          }
        }
        // Require owner photo file upload
        if (!o?.photo_id) {
          setError(`Owner #${i + 1}: Please upload photo ID`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      // Debug: Log form data before submission
      console.log('🔍 Form data before submission:', {
        industry: form.industry,
        custom_industry: form.custom_industry,
        allFormData: form
      });
      
      // Provide Cloudinary config override to avoid missing env vars
      const cloud_name = (import.meta && import.meta.env && import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) || 'dpyjezkla';
      const upload_preset = (import.meta && import.meta.env && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) || 'carlomagg';
      
      const submissionPayload = {
        ...form,
        cloudinary: { cloud_name, upload_preset }
      };
      
      console.log('🚀 Final submission payload:', {
        industry: submissionPayload.industry,
        custom_industry: submissionPayload.custom_industry,
        payload: submissionPayload
      });
      
      await submitBusinessVerification(submissionPayload);
      setSuccess('Verification application submitted successfully.');
      // Immediately reflect PENDING status in UI headers
      try { updateUser && updateUser({ businessVerificationStatus: 'PENDING' }); } catch {}
      // Reset only files and owners to encourage re-submission clarity
      setForm(prev => ({ ...prev, certificate_of_incorporation: null, photo_id: null, owners: [] }));
    } catch (err) {
      console.error('Business verification submission error:', err);
      const friendly = getErrorMessage?.(err) || formatApiErrors(err) || err.message;
      setError(friendly || 'Failed to submit verification.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Verify Your Business</h1>
      <p className="text-gray-600 mt-2">Fill in your company and applicant details. Owners are optional.</p>

      {/* Status gate */}
      {isVerified && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
          Your business is already verified. No further action is required.
        </div>
      )}

      <div className="mt-6 bg-white rounded-lg shadow-sm p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Business Verification</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">{error}</div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md text-green-800">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 dashboard-form">
          {/* Business Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <select name="industry" value={form.industry} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required>
                  <option value="">Select</option>
                  {INDUSTRY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {/* Custom Industry Field - Show when "Others" is selected */}
              {form.industry === 'Others' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specify Your Industry *</label>
                  <input 
                    type="text" 
                    name="custom_industry" 
                    value={form.custom_industry}
                    onChange={onChange}
                    placeholder="Enter your specific industry"
                    maxLength="255"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
                    disabled={isVerified}
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Legal Name</label>
                <input type="text" name="company_legal_name" value={form.company_legal_name} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                <input type="text" name="company_address" value={form.company_address} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                {STATES['NG'] ? (
                  <select name="state" value={form.state} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required>
                    <option value="">Select State</option>
                    {STATES['NG'].map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" name="state" value={form.state} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required/>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Local Government</label>
                <input type="text" name="local_government" value={form.local_government} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input type="text" name="city" value={form.city} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Products Description</label>
                <textarea name="products_description" value={form.products_description} onChange={onChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Registration Number</label>
                <input type="text" name="company_registration_number" value={form.company_registration_number} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Incorporation Type</label>
                <select name="incorporation_type" value={form.incorporation_type} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required>
                  <option value="">Select</option>
                  {INCORPORATION_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt.replaceAll('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificate of Incorporation <span className="text-gray-500">(Upload)</span></label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input type="file" id="certificate-upload" onChange={onFile('certificate_of_incorporation')} accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={isVerified} />
                  <label htmlFor="certificate-upload" className={`cursor-pointer ${isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-2 text-sm"><span className="font-medium text-[#027DDB]">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</p>
                    </div>
                  </label>
                  {form.certificate_of_incorporation && (
                    <p className="mt-2 text-sm text-green-600">File selected: {form.certificate_of_incorporation.name}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Applicant Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Are you an owner of this business?</label>
                <select name="are_you_an_owner_of_this_business" value={form.are_you_an_owner_of_this_business} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required>
                  <option value="">Select</option>
                  {OWNERSHIP_SELF_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship to Company</label>
                <select name="relationship_to_company" value={form.relationship_to_company} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required>
                  <option value="">Select</option>
                  {RELATIONSHIP_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt.replaceAll('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country of Citizenship</label>
                <select name="country_of_citizenship" value={form.country_of_citizenship} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required>
                  <option value="">Select Country</option>
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>{country.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">National ID Number</label>
                <input type="text" name="national_id_number" value={form.national_id_number} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country of Residence</label>
                <select name="country_of_residence" value={form.country_of_residence} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required>
                  <option value="">Select Country</option>
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>{country.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Home Address</label>
                <input type="text" name="home_address" value={form.home_address} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                {STATES['NG'] ? (
                  <select name="applicant_state" value={form.applicant_state} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required>
                    <option value="">Select State</option>
                    {STATES['NG'].map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" name="applicant_state" value={form.applicant_state} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required/>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Local Government</label>
                <input type="text" name="applicant_local_government" value={form.applicant_local_government} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input type="text" name="applicant_city" value={form.applicant_city} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} required/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Applicant Photo ID <span className="text-gray-500">(Upload)</span></label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input type="file" id="applicant-photo-id" onChange={onFile('photo_id')} accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={isVerified} />
                  <label htmlFor="applicant-photo-id" className={`cursor-pointer ${isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-2 text-sm"><span className="font-medium text-[#027DDB]">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</p>
                    </div>
                  </label>
                  {form.photo_id && (
                    <p className="mt-2 text-sm text-green-600">File selected: {form.photo_id.name}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Owners Section (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Owners (Optional)</h3>
              <button type="button" onClick={addOwner} disabled={isVerified} className="inline-flex items-center px-3 py-2 text-sm bg-[#027DDB] text-white rounded-md hover:bg-[#0066BB] disabled:opacity-50">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Add owner
              </button>
            </div>

            {form.owners.length === 0 && (
              <p className="text-sm text-gray-500">No owners added. You can submit without adding owners.</p>
            )}

            <div className="space-y-6">
              {form.owners.map((owner, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">Owner #{idx + 1}</h4>
                    <button type="button" onClick={() => removeOwner(idx)} disabled={isVerified} className="text-red-600 text-sm hover:underline disabled:opacity-50">Remove</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input type="text" value={owner.first_name} onChange={(e) => onOwnerChange(idx, 'first_name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input type="text" value={owner.last_name} onChange={(e) => onOwnerChange(idx, 'last_name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ownership Percentage</label>
                      <input type="number" value={owner.ownership_percentage} onChange={(e) => onOwnerChange(idx, 'ownership_percentage', e.target.value)} min="0" max="100" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input type="tel" value={owner.phone_number} onChange={(e) => onOwnerChange(idx, 'phone_number', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      <input type="date" value={owner.date_of_birth} onChange={(e) => onOwnerChange(idx, 'date_of_birth', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country of Citizenship</label>
                      <select value={owner.country_of_citizenship} onChange={(e) => onOwnerChange(idx, 'country_of_citizenship', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified}>
                        <option value="">Select Country</option>
                        {COUNTRIES.map(country => (
                          <option key={country.code} value={country.code}>{country.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">National ID Number</label>
                      <input type="text" value={owner.national_id_number} onChange={(e) => onOwnerChange(idx, 'national_id_number', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country of Residence</label>
                      <select value={owner.country_of_residence} onChange={(e) => onOwnerChange(idx, 'country_of_residence', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified}>
                        <option value="">Select Country</option>
                        {COUNTRIES.map(country => (
                          <option key={country.code} value={country.code}>{country.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Home Address</label>
                      <input type="text" value={owner.home_address} onChange={(e) => onOwnerChange(idx, 'home_address', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      {STATES['NG'] ? (
                        <select value={owner.state} onChange={(e) => onOwnerChange(idx, 'state', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified}>
                          <option value="">Select State</option>
                          {STATES['NG'].map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      ) : (
                        <input type="text" value={owner.state} onChange={(e) => onOwnerChange(idx, 'state', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relationship to Company</label>
                      <select value={owner.relationship_to_company} onChange={(e) => onOwnerChange(idx, 'relationship_to_company', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified}>
                        <option value="">Select</option>
                        {RELATIONSHIP_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt.replaceAll('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Local Government</label>
                      <input type="text" value={owner.local_government} onChange={(e) => onOwnerChange(idx, 'local_government', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input type="text" value={owner.city} onChange={(e) => onOwnerChange(idx, 'city', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent" disabled={isVerified} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Owner Photo ID <span className="text-gray-500">(Upload)</span></label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input type="file" id={`owner-photo-${idx}`} onChange={onOwnerFile(idx)} accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={isVerified} />
                        <label htmlFor={`owner-photo-${idx}`} className={`cursor-pointer ${isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <div className="text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="mt-2 text-sm"><span className="font-medium text-[#027DDB]">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</p>
                          </div>
                        </label>
                        {owner.photo_id && (
                          <p className="mt-2 text-sm text-green-600">File selected: {owner.photo_id.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button type="submit" disabled={submitting || isVerified} className="w-full bg-[#027DDB] text-white py-3 px-6 rounded-md hover:bg-[#0066BB] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Submitting...' : 'Submit Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyBusiness;
