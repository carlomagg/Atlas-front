import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../services/authApi';
import Logo from './common/Logo';
import { resolveMediaUrl } from '../utils/media';

export default function CompanyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location?.state?.from;
  const sellerProfile = location?.state?.sellerProfile || null; // provided by ProductDetails link

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (sellerProfile) {
          setProfile(sellerProfile);
        } else {
          const data = await getUserProfile();
          setProfile(data?.user || data || {});
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load company profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [sellerProfile]);

  const company = profile?.company || {};
  const companyName = company?.company_name || profile?.company_name || profile?.companyName || 'Company';
  const contactName = profile?.full_name || profile?.fullName || '';
  const country = profile?.country_name || profile?.country || '';
  const businessType = profile?.business_type || profile?.businessType || '';
  const profileImg = resolveMediaUrl(
    company?.company_logo_url ||
    company?.company_logo ||
    company?.company_image_url ||
    company?.company_image ||
    profile?.profile_image_url ||
    profile?.profile_image ||
    ''
  ) || '';
  const coverUrl = resolveMediaUrl(
    company?.company_cover_photo_url ||
    company?.company_cover_photo ||
    company?.company_cover_url ||
    company?.cover_image_url ||
    profile?.cover_image_url ||
    profile?.coverImage ||
    ''
  ) || '';

  return (
    <div className="bg-slate-50 min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
          <Logo height="h-10 md:h-12" />
          <div />
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Status */}
        {loading && (
          <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6 text-slate-600">Loading company...</div>
        )}
        {!loading && error && (
          <div className="bg-white rounded-md shadow-sm border border-rose-200 p-6 text-rose-700">{error}</div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            {/* Facebook-style Cover Header */}
            <section className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
              <div
                className="relative h-48 sm:h-60 md:h-72 w-full"
                style={{
                  backgroundImage: `url('${coverUrl || '/images/img_unsplash2cfzfb08um.png'}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
              </div>
              <div className="px-5 sm:px-6 pb-4">
                <div className="relative -mt-6 sm:-mt-8 flex items-end gap-4">
                  <img
                    src={profileImg || '/images/img_image_2.png'}
                    alt="company avatar"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-md object-cover border-4 border-white shadow-md"
                  />
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">{companyName}</h1>
                    <div className="mt-1 text-xs sm:text-sm text-slate-600">
                      <span className="mr-3">Contact: <span className="font-medium text-slate-800">{contactName || '—'}</span></span>
                      {country ? <span className="mr-3">Country: <span className="font-medium text-slate-800">{country}</span></span> : null}
                      {businessType ? <span>Business Type: <span className="font-medium text-slate-800">{businessType}</span></span> : null}
                    </div>
                  </div>
                  <div className="hidden sm:block pb-1">
                    <button
                      onClick={() => {
                        if (fromPath) return navigate(fromPath);
                        return navigate(-1);
                      }}
                      className="h-10 px-4 rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
                    >
                      Back to product
                    </button>
                  </div>
                </div>
                {/* Mobile back button */}
                <div className="sm:hidden mt-3">
                  <button
                    onClick={() => {
                      if (fromPath) return navigate(fromPath);
                      return navigate(-1);
                    }}
                    className="w-full h-10 px-4 rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
                  >
                    Back to product
                  </button>
                </div>
              </div>
            </section>

            {/* Details cards */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-md shadow-sm border border-slate-200">
                  <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-slate-800 font-semibold">Company Overview</h3>
                  </div>
                  <div className="p-5 text-sm">
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Company Name</div>
                      <div className="col-span-8 text-slate-800">{companyName || '—'}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Business Type</div>
                      <div className="col-span-8 text-slate-800">{businessType || '—'}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Country</div>
                      <div className="col-span-8 text-slate-800">{country || '—'}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-md shadow-sm border border-slate-200">
                  <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-slate-800 font-semibold">Contact Person</h3>
                  </div>
                  <div className="p-5 text-sm">
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Full Name</div>
                      <div className="col-span-8 text-slate-800">{contactName || '—'}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Email</div>
                      <div className="col-span-8 text-slate-800 break-all">{profile?.email || '—'}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Phone</div>
                      <div className="col-span-8 text-slate-800">{profile?.phone_number || profile?.phoneNumber || '—'}</div>
                    </div>
                    {profile?.website ? (
                      <div className="grid grid-cols-12 gap-3 py-2">
                        <div className="col-span-4 text-slate-500">Website</div>
                        <div className="col-span-8 text-[#027DDB]">
                          <a href={profile.website} target="_blank" rel="noreferrer" className="hover:underline">{profile.website}</a>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-4"></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
