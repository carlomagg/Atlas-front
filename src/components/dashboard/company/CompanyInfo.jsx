import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getUserProfile } from '../../../services/authApi';

const CompanyInfo = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  
  // Resolve media URLs (relative or Cloudinary public_id) similar to CompanyInfoView
  const resolveMediaUrl = useMemo(() => (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD;
    if (cloud) {
      const cleaned = String(url).replace(/^\/+/, '');
      if (!/^image\//.test(cleaned)) {
        return `https://res.cloudinary.com/${cloud}/image/upload/${cleaned}`;
      }
      return `https://res.cloudinary.com/${cloud}/${cleaned}`;
    }
    const base = import.meta.env.VITE_MEDIA_BASE_URL || '';
    if (!base) return url;
    return `${base.replace(/\/?$/, '/')}${String(url).replace(/^\//, '')}`;
  }, []);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        setLoading(true);
        const profile = await getUserProfile();
        setCompanyData(profile.user || profile);
        if (profile.user || profile) {
          updateUser(profile.user || profile);
        }
      } catch (err) {
        console.error('Failed to fetch company info:', err);
        setError('Failed to load company information');
        // Use cached user data if available
        setCompanyData(user);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const data = companyData || user;

  // Build fields similar to BasicInfo layout
  const infoFields = [
    { label: 'Company Name', value: data?.company_name || data?.companyName },
    { label: 'Business Type', value: data?.business_type || data?.businessType },
    { label: 'Website', value: data?.website },
    { label: 'Country', value: data?.country || data?.address_country },
    { label: 'Phone Number', value: data?.phone_number || data?.phoneNumber },
    { label: 'Verification Status', value: data?.business_verification_status || data?.businessVerificationStatus || 'Pending' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <img
              src={(data?.company_logo_url || data?.company_logo || data?.profile_image_url)
                ? resolveMediaUrl(data.company_logo_url || data.company_logo || data.profile_image_url)
                : '/default-avatar.png'}
              alt="Company"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow"
              onError={e => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
            />
            <h1 className="text-2xl font-bold text-gray-900">Company Information</h1>
          </div>
          <Link
            to={"/dashboard/contact-info/company/edit"}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Company Info
          </Link>
        </div>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {infoFields.map((field, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-500">{field.label}</p>
              <p className="text-lg font-semibold text-gray-900">{field.value ?? 'Not specified'}</p>
            </div>
          ))}
        </div>
        {/* Optional long-text sections to keep parity with BasicInfo's clean layout */}
        {data?.about_us && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About Us</h2>
            <p className="text-gray-800 whitespace-pre-line">{data.about_us}</p>
          </div>
        )}
        {data?.why_choose_us && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Why Choose Us</h2>
            <p className="text-gray-800 whitespace-pre-line">{data.why_choose_us}</p>
          </div>
        )}
      </div>
      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
          <p className="mt-1 text-sm text-gray-500">Company information updates and changes will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfo;
