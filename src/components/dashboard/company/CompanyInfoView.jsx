import React, { useEffect, useMemo, useState } from 'react';
import { getCountryName, getStateDisplay } from '../../../utils/locationData';
import { Link, useLocation } from 'react-router-dom';
import { getMyCompany, listNestedFiles } from '../../../services/companyApi';
import MediaItem from '../../common/MediaItem';

const CompanyInfoView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [company, setCompany] = useState(null);
  const [collections, setCollections] = useState({
    about_us_media: [],
    certificates: [],
    blog_awards: [],
    production_sites: [],
    storage_sites: [],
    exhibitions: []
  });

  const location = useLocation();
  const [flash, setFlash] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getMyCompany();
        // /me returns a single company object
        if (mounted) setCompany(data?.company || data || null);
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load company');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [location.state?.ts]);

  // Load nested media collections so counts match edit/create selections
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const id = company?.id || company?.company_id;
        if (!id) return;
        const segs = [
          ['about_us_media', 'about-us-media'],
          ['certificates', 'certificates'],
          ['blog_awards', 'blog-awards'],
          ['production_sites', 'production-sites'],
          ['storage_sites', 'storage-sites'],
          ['exhibitions', 'exhibitions']
        ];
        const results = await Promise.all(
          segs.map(([key, seg]) => listNestedFiles(String(id), seg).catch(() => []))
        );
        if (!active) return;
        const next = {};
        segs.forEach(([key], i) => { next[key] = Array.isArray(results[i]) ? results[i] : []; });
        setCollections(next);
      } catch (_) {
        // ignore; page still renders main company fields
      }
    })();
    return () => { active = false; };
  }, [company?.id, company?.company_id]);

  // Capture flash message passed via navigation state and clear it after display
  useEffect(() => {
    if (location.state?.flash) {
      setFlash(location.state.flash);
    }
  }, [location.state?.flash]);

  const resolveMediaUrl = useMemo(() => (url, opts = {}) => {
    if (!url) return '';
    const s = String(url);
    if (/^https?:\/\//i.test(s)) return s;
    // Cloudinary support (public_id or path without origin)
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD;
    if (cloud) {
      const cleaned = s.replace(/^\/+/, '');
      const type = opts.resourceType === 'video' ? 'video' : 'image';
      // if caller already provided a resource prefix like image/upload
      if (/^(image|video)\//.test(cleaned)) {
        return `https://res.cloudinary.com/${cloud}/${cleaned}`;
      }
      // Otherwise, build standard delivery URL
      const maybeExt = opts.format ? `.${opts.format}` : '';
      return `https://res.cloudinary.com/${cloud}/${type}/upload/${cleaned}${maybeExt}`;
    }
    // Generic media base fallback
    const base = import.meta.env.VITE_MEDIA_BASE_URL || '';
    if (!base) return s; // fallback: return as-is
    return `${base.replace(/\/?$/, '/')}${s.replace(/^\//, '')}`;
  }, []);

  const hasVideoExt = (v = '') => /\.(mp4|webm|ogg|mov)$/i.test(String(v));
  const hasImageExt = (v = '') => /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(String(v));
  const isPdf = (v = '') => /\.(pdf)$/i.test(String(v));

  const mediaSourceForItem = (item) => {
    if (!item) return { kind: 'none', url: '' };
    // Prefer direct URLs first
    const fileField = item.file;
    const nestedFileUrl = typeof fileField === 'object' && fileField !== null
      ? (fileField.secure_url || fileField.url || fileField.path || '')
      : '';
    const direct = item.secure_url || item.url || item.file_url || nestedFileUrl || (typeof fileField === 'string' ? fileField : '') || item.path || item.public_id || '';
    const format = item.format || '';
    const resourceType = item.resource_type || (hasVideoExt(direct) || /^(mp4|webm|ogg|mov)$/i.test(format) ? 'video' : 'image');
    let url = resolveMediaUrl(direct || item.public_id, { resourceType, format });
    // Determine kind
    if (resourceType === 'video' || hasVideoExt(url)) return { kind: 'video', url };
    if (isPdf(url)) return { kind: 'file', url };
    // If explicit image ext or default image
    if (hasImageExt(url) || resourceType === 'image') return { kind: 'image', url };
    // Fallback to file link
    return { kind: 'file', url };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <img
              src={(company?.company_logo_url || company?.company_logo) ? resolveMediaUrl(company.company_logo_url || company.company_logo) : '/default-avatar.png'}
              alt="Company"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow"
              onError={e => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
            />
            <h1 className="text-2xl font-bold text-gray-900">Company Information</h1>
          </div>
          <Link
            to={company ? `/dashboard/contact-info/company/edit?companyId=${encodeURIComponent(company.id || company.company_id || '')}` : '/dashboard/contact-info/company/edit'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {company ? 'Edit Company Info' : 'Create Company'}
          </Link>
        </div>

        {flash && (
          <div className="mb-4 rounded bg-green-50 border border-green-200 text-green-800 px-4 py-2 text-sm">{flash}</div>
        )}
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {!error && !company && <p className="text-sm text-gray-600">No company found.</p>}

        {company && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Company Name', value: company.company_name },
              { label: 'Brand Name', value: company.brand_name },
              { label: 'Website', value: company.website },
              { label: 'Year of Establishment', value: company.year_of_establishment },
              { label: 'Employees', value: company.number_of_employees },
              { label: 'Annual Turnover', value: company.annual_turnover },
              { label: 'Capacity', value: company.company_capacity },
            ].map((field, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500">{field.label}</p>
                <p className="text-lg font-semibold text-gray-900">{field.value ?? 'Not specified'}</p>
              </div>
            ))}
          </div>
        )}

        {/* Addresses Section: Head Office + Other Branches */}
        {company && (company.head_office || (Array.isArray(company.addresses) && company.addresses.length > 0)) && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Company Addresses</h2>

            {/* Head Office */}
            {company.head_office && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-800">Head Office</p>
                  <span className="text-xs text-blue-700">Primary Location</span>
                </div>
                <div className="mt-2 text-gray-900">
                  <div className="text-base font-semibold">
                    {company.head_office.street_address || company.head_office.street || '—'}
                  </div>
                  <div className="text-sm text-gray-700">
                    {(company.head_office.city || '—')}, {(company.head_office.state_region || company.head_office.state || '—')}
                  </div>
                  <div className="text-sm text-gray-700">
                    {company.head_office.country || '—'}{company.head_office.postal_code ? `, ${company.head_office.postal_code}` : ''}
                  </div>
                  {(company.head_office.phone_number || company.head_office.email) && (
                    <div className="mt-1 text-sm text-gray-700">
                      {company.head_office.phone_number && (<span className="mr-4">📞 {company.head_office.phone_number}</span>)}
                      {company.head_office.email && (<span>✉️ {company.head_office.email}</span>)}
                    </div>
                  )}
                  {(company.head_office.latitude || company.head_office.longitude) && (
                    <div className="mt-1 text-xs text-gray-600">
                      Coordinates: {company.head_office.latitude ?? '—'}, {company.head_office.longitude ?? '—'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Other Branches */}
            {Array.isArray(company.addresses) && company.addresses.filter(a => !a?.is_head_office).length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-800">Other Branches</p>
                  <span className="text-xs text-gray-500">{company.addresses.filter(a => !a?.is_head_office).length} location(s)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {company.addresses.filter(a => !a?.is_head_office).map((addr, i) => (
                    <div key={i} className="rounded border bg-white p-3">
                      <div className="text-sm font-semibold text-gray-900">{addr.street_address || addr.street || '—'}</div>
                      <div className="text-xs text-gray-700">{addr.city || '—'}, {addr.state_region || addr.state || '—'}</div>
                      <div className="text-xs text-gray-700">{addr.country || '—'}{addr.postal_code ? `, ${addr.postal_code}` : ''}</div>
                      {(addr.phone_number || addr.email) && (
                        <div className="mt-1 text-xs text-gray-700">
                          {addr.phone_number && (<span className="mr-3">📞 {addr.phone_number}</span>)}
                          {addr.email && (<span>✉️ {addr.email}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Media Section */}
        {company && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Media</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Logo */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Logo</p>
                {(company.company_logo_url || company.company_logo) ? (
                  <MediaItem
                    src={`${resolveMediaUrl(company.company_logo_url || company.company_logo)}${location.state?.ts ? (((company.company_logo_url || company.company_logo) || '').includes('?') ? '&' : '?') + 'v=' + location.state.ts : ''}`}
                    type="image"
                    className="h-24 w-24 object-cover rounded border"
                  />
                ) : (
                  <span className="text-gray-500">Not provided</span>
                )}
              </div>

              {/* Image */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Image</p>
                {(company.company_image_url || company.company_image) ? (
                  <MediaItem
                    src={`${resolveMediaUrl(company.company_image_url || company.company_image)}${location.state?.ts ? (((company.company_image_url || company.company_image) || '').includes('?') ? '&' : '?') + 'v=' + location.state.ts : ''}`}
                    type="image"
                    className="h-24 w-24 object-cover rounded border"
                  />
                ) : (
                  <span className="text-gray-500">Not provided</span>
                )}
              </div>

              {/* Cover Photo */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Cover Photo</p>
                {(company.company_cover_photo_url || company.company_cover_photo) ? (
                  <MediaItem
                    src={`${resolveMediaUrl(company.company_cover_photo_url || company.company_cover_photo)}${location.state?.ts ? (((company.company_cover_photo_url || company.company_cover_photo) || '').includes('?') ? '&' : '?') + 'v=' + location.state.ts : ''}`}
                    type="image"
                    className="h-24 w-full object-cover rounded border"
                  />
                ) : (
                  <span className="text-gray-500">Not provided</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Collections: show counts and thumbnails matching uploaded items */}
        {company && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Collections</h2>
            {[
              { key: 'about_us_media', label: 'About Us Media' },
              { key: 'certificates', label: 'Certificates' },
              { key: 'blog_awards', label: 'Blog & Awards' },
              { key: 'production_sites', label: 'Production Sites' },
              { key: 'storage_sites', label: 'Storage Sites' },
              { key: 'exhibitions', label: 'Exhibitions' }
            ].map(({ key, label }) => (
              <div key={key} className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <span className="text-xs text-gray-500">{collections[key]?.length || 0} item(s)</span>
                </div>
                {(!collections[key] || collections[key].length === 0) ? (
                  <div className="text-gray-500 text-sm">Not provided</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {collections[key].map((it, idx) => {
                      const { kind, url } = mediaSourceForItem(it);
                      return (
                        <div key={idx} className="bg-gray-50 rounded border p-2 flex items-center justify-center">
                          <MediaItem
                            src={url}
                            type={kind === 'file' ? undefined : kind}
                            className="max-h-24 w-full object-cover rounded"
                          />
                          <div className="mt-1 w-full text-[10px] text-gray-600 truncate text-center" title={it.original_filename || it.public_id || url || 'Media file'}>
                            {it.original_filename || it.public_id?.split('/').pop() || `${kind} file` || 'Media file'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Optional long-text sections to follow BasicInfo's simplicity while still showing content */}
        {company?.about_us && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About Us</h2>
            <p className="text-gray-800 whitespace-pre-line">{company.about_us}</p>
            
            {/* About Us Media */}
            {company?.about_us_media && Array.isArray(company.about_us_media) && company.about_us_media.length > 0 && (
              <div className="mt-4">
                <h3 className="text-md font-medium text-gray-700 mb-2">About Us Media</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {company.about_us_media.map((mediaItem, idx) => {
                    const { kind, url } = mediaSourceForItem(mediaItem);
                    return (
                      <div key={idx} className="bg-gray-50 rounded border p-2">
                        <MediaItem
                          src={url}
                          type={kind === 'file' ? undefined : kind}
                          className="w-full h-20 object-cover rounded"
                        />
                        <div className="mt-1 text-[10px] text-gray-600 truncate text-center" title={mediaItem.original_filename || mediaItem.public_id || url || 'Media file'}>
                          {mediaItem.original_filename || mediaItem.public_id?.split('/').pop() || `${kind} file` || 'Media file'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        {company?.why_choose_us && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Why Choose Us</h2>
            <p className="text-gray-800 whitespace-pre-line">{company.why_choose_us}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyInfoView;
