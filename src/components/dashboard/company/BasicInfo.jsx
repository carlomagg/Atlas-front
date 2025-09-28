import React, { useState, useEffect } from 'react';
import { getCountryName, getStateDisplay } from '../../../utils/locationData';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getUserProfile } from '../../../services/authApi';

const BasicInfo = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const normalizeBool = (v) => {
    if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1' || v.toLowerCase() === 'yes';
    if (typeof v === 'number') return v === 1;
    return !!v;
  };

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        setLoading(true);
        const profile = await getUserProfile();
        setCompanyData(profile.user || profile);
        if (profile.user || profile) {
          // Merge with existing user to preserve fields like email/atlas_id that
          // might not be returned by the profile endpoint
          const incoming = profile.user || profile;
          updateUser({
            ...user,
            ...incoming,
            email: incoming.email || user?.email,
            atlas_id: incoming.atlas_id || incoming.atlasId || user?.atlas_id || user?.atlasId,
          });
        }
      } catch (err) {
        setError('Failed to load company information');
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

  const infoFields = [
    { label: 'Atlas ID', value: data?.atlas_id || data?.atlasId || data?.user?.atlas_id || data?.user?.atlasId || user?.atlas_id || user?.atlasId },
    { label: 'Title', value: data?.title },
    { label: 'Full Name', value: data?.full_name || data?.fullName },
    { label: 'Company Name', value: data?.company_name || data?.companyName },
    { label: 'Country', value: getCountryName(data?.country) },
    { label: 'State', value: getStateDisplay(data?.country, data?.state) },
    { label: 'Phone Number', value: data?.phone_number || data?.phoneNumber },
    { label: 'Business Type', value: data?.business_type || data?.businessType },
    { label: 'Is Active', value: normalizeBool(data?.is_active ?? data?.isActive) ? 'Yes' : 'No' },
    { label: 'Is Agent', value: normalizeBool(data?.is_agent ?? data?.isAgent ?? data?.user?.is_agent ?? data?.user?.isAgent) ? 'Yes' : 'No' },
    { label: 'Is Agent Active', value: normalizeBool(data?.is_agent_active ?? data?.isAgentActive ?? data?.user?.is_agent_active ?? data?.user?.isAgentActive) ? 'Yes' : 'No' },
    { label: 'Agent Approved At', value: data?.agent_approved_at || data?.agentApprovedAt || data?.user?.agent_approved_at || data?.user?.agentApprovedAt },
    { label: 'Business Verification Status', value: data?.business_verification_status || data?.businessVerificationStatus || data?.user?.business_verification_status || data?.user?.businessVerificationStatus },
    { label: 'Business Verified At', value: data?.business_verified_at || data?.businessVerifiedAt || data?.user?.business_verified_at || data?.user?.businessVerifiedAt },
    { label: 'Website', value: data?.website },
    { label: 'Member Status', value: data?.member_status || data?.memberStatus },
    { label: 'Backup Email', value: data?.backup_email || data?.backupEmail },
    { label: 'Alternative Email', value: data?.alternative_email || data?.alternativeEmail },
    { label: 'Department', value: data?.department },
    { label: 'Social Media Contact', value: data?.social_media_contact },
    { label: 'Position', value: data?.position },
    { label: 'Email', value: data?.email || data?.user?.email || user?.email },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <img
              src={data?.profile_image_url || data?.profile_image || '/default-avatar.png'}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow"
              onError={e => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
            />
            <h1 className="text-2xl font-bold text-gray-900">Basic Information</h1>
          </div>
          <Link
            to="/dashboard/contact-info/basic/edit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Basic Info
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

        {/* Note: Social media contact (text or link) is already included above in infoFields.
            If it's a URL, display it as a clickable link below for convenience. */}
        {data?.social_media_contact && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Social Media Contact</h2>
            <p className="text-gray-800 break-words">
              {data.social_media_contact.split(/(\s+)/).map((part, idx) => {
                const isUrl = /^(https?:\/\/|www\.)[\w.-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=.]+)?$/i.test(part.trim());
                if (isUrl) {
                  const href = part.startsWith('http') ? part : `https://${part}`;
                  return (
                    <a key={idx} href={href} target="_blank" rel="noreferrer" className="text-blue-700 underline break-all">{part}</a>
                  );
                }
                return <span key={idx}>{part}</span>;
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicInfo;
