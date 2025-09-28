import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getUserProfile, updateUserProfile, TITLE_OPTIONS } from '../../../services/authApi';
import { COUNTRIES, STATES, getCountryName } from '../../../utils/locationData';

const BasicInfoEdit = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  // UI-only state (does not affect API fields)
  const [sendUpdatesToBackup, setSendUpdatesToBackup] = useState(false);
  const [socialPlatform, setSocialPlatform] = useState('Facebook');
  const [socialHandle, setSocialHandle] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    fullName: '',
    companyName: '',
    country: '',
    state: '',
    phoneNumber: '',
    businessType: '',
    profile_image_url: '',
    // Additional optional fields
    backupEmail: '',
    alternativeEmail: '',
    department: '',
    position: '',
    socialMediaContact: '',
    website: '',
    // No separate website/social links in this form; use socialMediaContact for links or text
  });

  useEffect(() => {
    const fetchBasicInfo = async () => {
      try {
        setLoading(true);
        const profile = await getUserProfile();
        const data = profile.user || profile;
        
        // Normalize country -> ISO code for dropdown, normalize US state names -> codes
        (() => {
          let countryVal = data?.country || '';
          if (countryVal && String(countryVal).length > 2) {
            const found = COUNTRIES.find(c => c.name.toLowerCase() === String(countryVal).toLowerCase());
            if (found) countryVal = found.code;
          }
          let stateVal = data?.state || '';
          if (countryVal === 'US' && stateVal) {
            const foundState = (STATES.US || []).find(s => s.name?.toLowerCase() === String(stateVal).toLowerCase() || s.code === stateVal);
            if (foundState) stateVal = foundState.code;
          }
          setFormData({
            title: data?.title || '',
            fullName: data?.fullName || data?.full_name || '',
            companyName: data?.companyName || data?.company_name || '',
            country: countryVal,
            state: stateVal,
          phoneNumber: data?.phoneNumber || data?.phone_number || '',
          businessType: data?.businessType || data?.business_type || '',
          profile_image_url: data?.profile_image_url || data?.profilePhotoUrl || data?.profile_photo_url || data?.profile_image || data?.profile_photo || '',
          backupEmail: data?.backup_email || '',
          alternativeEmail: data?.alternative_email || '',
          department: data?.department || '',
          position: data?.position || '',
          socialMediaContact: data?.social_media_contact || data?.socialMediaContact || '',
          website: data?.website || ''
          });
        })();

        // Set photo preview if exists
        if (data?.profile_image_url || data?.profilePhotoUrl || data?.profile_photo_url || data?.profile_image || data?.profile_photo) {
          setPhotoPreview(
            data.profile_image_url || data.profilePhotoUrl || data.profile_photo_url || data.profile_image || data.profile_photo
          );
        }
        // Hydrate UI-only fields from existing values where possible
        const sm = (data?.social_media_contact || data?.socialMediaContact || '').toString();
        const parts = sm.includes(':') ? sm.split(':') : [];
        if (parts.length >= 2) {
          setSocialPlatform(parts[0].trim() || 'Facebook');
          setSocialHandle(parts.slice(1).join(':').trim());
        }
      } catch (err) {
        console.error('Failed to fetch basic info:', err);
        setError('Failed to load basic information');
        // Use cached user data if available
        if (user) {
          (() => {
            let countryVal = user?.country || '';
            if (countryVal && String(countryVal).length > 2) {
              const found = COUNTRIES.find(c => c.name.toLowerCase() === String(countryVal).toLowerCase());
              if (found) countryVal = found.code;
            }
            let stateVal = user?.state || '';
            if (countryVal === 'US' && stateVal) {
              const foundState = (STATES.US || []).find(s => s.name?.toLowerCase() === String(stateVal).toLowerCase() || s.code === stateVal);
              if (foundState) stateVal = foundState.code;
            }
            setFormData({
              title: user?.title || '',
              fullName: user?.fullName || user?.full_name || '',
              companyName: user?.companyName || user?.company_name || '',
              country: countryVal,
              state: stateVal,
            phoneNumber: user?.phoneNumber || user?.phone_number || '',
            businessType: user?.businessType || user?.business_type || '',
            profile_image_url: user?.profile_image_url || user?.profilePhotoUrl || user?.profile_photo_url || user?.profile_image || user?.profile_photo || '',
            backupEmail: user?.backup_email || '',
            alternativeEmail: user?.alternative_email || '',
            department: user?.department || '',
            position: user?.position || '',
            socialMediaContact: user?.social_media_contact || user?.socialMediaContact || '',
            website: user?.website || ''
            });
          })();
          const sm = (user?.social_media_contact || user?.socialMediaContact || '').toString();
          const parts = sm.includes(':') ? sm.split(':') : [];
          if (parts.length >= 2) {
            setSocialPlatform(parts[0].trim() || 'Facebook');
            setSocialHandle(parts.slice(1).join(':').trim());
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBasicInfo();
  }, [user]);

  // If user provides a profile image URL (and hasn't selected a new file), reflect it in preview
  useEffect(() => {
    if (!profilePhoto && formData.profile_image_url) {
      setPhotoPreview(formData.profile_image_url);
    }
    if (!profilePhoto && !formData.profile_image_url) {
      // no url and no file: keep existing or clear
    }
  }, [formData.profile_image_url, profilePhoto]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // If country changed, clear state to avoid inconsistent selection
      if (name === 'country' && value !== prev.country) {
        return { ...prev, country: value, state: '' };
      }
      return { ...prev, [name]: value };
    });
    // Clear error when user starts typing
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      // Validate required fields
      const { title, fullName, companyName, country, state, phoneNumber, businessType, backupEmail, alternativeEmail, department, position, socialMediaContact, website } = formData;
      if (!title || !fullName || !companyName || !country || !phoneNumber || !businessType) {
        throw new Error('Please fill in all required fields');
      }

      // No extra social_links; socialMediaContact will hold text or URL
      const socialMediaCombined = socialHandle
        ? `${socialPlatform}: ${socialHandle}`
        : (socialMediaContact || '');

      // Submit as FormData if a new file was selected, else JSON
      let resp;
      if (profilePhoto) {
        const fd = new FormData();
        fd.append('title', title);
        fd.append('full_name', fullName);
        fd.append('company_name', companyName || '');
        fd.append('country', country);
        if (state) fd.append('state', state);
        fd.append('phone_number', phoneNumber);
        fd.append('business_type', businessType);
        fd.append('profile_image', profilePhoto);
        if (backupEmail) fd.append('backup_email', backupEmail);
        if (alternativeEmail) fd.append('alternative_email', alternativeEmail);
        if (department) fd.append('department', department);
        if (position) fd.append('position', position);
        if (socialMediaCombined) fd.append('social_media_contact', socialMediaCombined);
        if (website) fd.append('website', website);
        // No longer sending profile_image_url via multipart; file upload only
        resp = await updateUserProfile(fd);
      } else {
        resp = await updateUserProfile({
          title,
          fullName,
          companyName,
          country,
          ...(state ? { state } : {}),
          phoneNumber,
          businessType,
          ...(backupEmail ? { backup_email: backupEmail } : {}),
          ...(alternativeEmail ? { alternative_email: alternativeEmail } : {}),
          ...(department ? { department } : {}),
          ...(position ? { position } : {}),
          ...(socialMediaCombined ? { social_media_contact: socialMediaCombined } : {}),
          ...(website ? { website } : {})
        });
      }
      
      // Update local user context from server response (normalized)
      if (resp) {
        const u = resp.user || resp;
        updateUser({
          ...user,
          // Keep server's latest values (snake_case) for display components
          title: (u.title != null ? u.title : formData.title),
          full_name: (u.full_name != null ? u.full_name : formData.fullName),
          company_name: (u.company_name != null ? u.company_name : formData.companyName),
          country: (u.country != null ? u.country : formData.country),
          state: (u.state != null ? u.state : (formData.state || undefined)),
          phone_number: (u.phone_number != null ? u.phone_number : formData.phoneNumber),
          business_type: (u.business_type != null ? u.business_type : formData.businessType),
          backup_email: (u.backup_email != null ? u.backup_email : (formData.backupEmail || undefined)),
          alternative_email: (u.alternative_email != null ? u.alternative_email : (formData.alternativeEmail || undefined)),
          department: (u.department != null ? u.department : (formData.department || undefined)),
          position: (u.position != null ? u.position : (formData.position || undefined)),
          social_media_contact: (u.social_media_contact != null ? u.social_media_contact : (formData.socialMediaContact || undefined)),
          website: (u.website != null ? u.website : (formData.website || undefined)),
          profile_image: u.profile_image || null,
          profile_image_url: u.profile_image_url || null
        });
        if (u.profile_image_url) setPhotoPreview(u.profile_image_url);
      }
      
      setSuccess(true);

      // Show a floating success toast (top-right) so user can't miss it
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
              <p class="text-sm font-medium text-green-800">Basic information updated successfully!</p>
            </div>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
      } catch (_) {
        // no-op if DOM unavailable
      }
      
      // Redirect after successful update to Basic Info view (longer delay to show success)
      setTimeout(() => {
        navigate('/dashboard/contact-info/basic');
      }, 4000);
      
    } catch (err) {
      console.error('Failed to update basic info:', err);
      setError(err.message || 'Failed to update basic information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Page heading to match mock */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Basics Information - Company Representative</h1>
        <p className="mt-1 text-sm text-gray-600">Reliable and authenticated contacts will aid in establishing trust.</p>
      </div>

      {/* Error Message */}
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

      {/* Form area styled like bordered sheet */}
      {/* Container mimics the blueprint panel with subtle blue border and spacious padding */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-blue-100 rounded-md shadow-sm">
          {/* Grid table */}
          <div className="grid grid-cols-1 md:grid-cols-[220px,1fr]">
            {/* Photo Row */}
            <div className="bg-gray-100 text-gray-700 px-4 py-5 border-b border-blue-100 flex items-center justify-between">
              <span className="font-medium">Photo</span>
            </div>
            <div className="px-4 py-5 border-b md:border-l border-blue-100">
              <div className="flex items-start gap-6">
                <label htmlFor="photo-upload" className="w-56 h-56 flex items-center justify-center border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-md cursor-pointer hover:border-blue-300">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover rounded-md" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0-9l-3 3m3-3l3 3M12 3v9" />
                      </svg>
                      <p className="mt-2 text-sm">JPG, JPEG or PNG</p>
                      <p className="text-xs">Maximum size of 5MB</p>
                    </div>
                  )}
                </label>
                <div>
                  <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <label htmlFor="photo-upload" className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                    Upload
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Use a clear headshot.</p>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Title</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <select
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
              >
                <option value="">Select title</option>
                {TITLE_OPTIONS.map((title) => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
            </div>

            {/* Full Name */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Full Name</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
              />
            </div>

            {/* Company Name */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Company Name</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Enter company name"
                className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
              />
            </div>

            {/* Country */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Country</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
              >
                <option value="">Select country</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* State/Region (optional) */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">State (Optional)</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              {STATES[formData.country] ? (
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
                >
                  <option value="">Select state/region</option>
                  {Array.isArray(STATES[formData.country]) && STATES[formData.country].map((s) => (
                    typeof s === 'string' ? (
                      <option key={s} value={s}>{s}</option>
                    ) : (
                      <option key={s.code} value={s.code}>{s.name}</option>
                    )
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="Enter state/region"
                  className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
                />
              )}
            </div>

            {/* Business Type */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Business Type</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input
                type="text"
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                placeholder="Enter business type"
                className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
              />
            </div>

            {/* Phone Number */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Phone Number</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+234"
                className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
              />
            </div>

            {/* Backup Email */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Backup Email</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input
                type="email"
                id="backupEmail"
                name="backupEmail"
                value={formData.backupEmail}
                onChange={handleInputChange}
                placeholder="Enter backup email"
                className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
              />
              <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600 select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  checked={sendUpdatesToBackup}
                  onChange={(e) => setSendUpdatesToBackup(e.target.checked)}
                />
                <span>Send important updates and messages to your backup email</span>
              </label>
            </div>

            {/* Alternative Email */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Alternative Email</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input
                type="email"
                id="alternativeEmail"
                name="alternativeEmail"
                value={formData.alternativeEmail}
                onChange={handleInputChange}
                placeholder="Enter alternative email"
                className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
              />
            </div>

            {/* Department */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Department</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="Enter department"
                className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
              />
            </div>

            {/* Position */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Position</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                placeholder="Enter position"
                className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
              />
            </div>

            {/* Social Media Contact */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Social media Contact</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-3">
                <select
                  value={socialPlatform}
                  onChange={(e) => setSocialPlatform(e.target.value)}
                  className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
                >
                  {['Facebook','WhatsApp','Twitter','Instagram','LinkedIn','Telegram'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={socialHandle}
                  onChange={(e) => setSocialHandle(e.target.value)}
                  placeholder="Enter your account or link"
                  className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
                />
              </div>
              {/* Keep original hidden field to preserve formData shape and typing */}
              <input type="hidden" id="socialMediaContact" name="socialMediaContact" value={formData.socialMediaContact} readOnly />
            </div>

            {/* Website */}
            <div className="bg-gray-100 text-gray-700 px-4 py-4 border-b border-blue-100 flex items-center">Website</div>
            <div className="px-4 py-4 border-b md:border-l border-blue-100">
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="block w-full border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
              />
            </div>
          </div>

          {/* Bottom action area */}
          <div className="py-6 flex justify-center gap-4 flex-wrap sm:flex-nowrap">
            <button
              type="submit"
              disabled={saving}
              className="min-w-[160px] px-6 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <Link
              to="/dashboard/company-info"
              className="min-w-[160px] px-6 py-2.5 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 shadow-sm text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BasicInfoEdit;
