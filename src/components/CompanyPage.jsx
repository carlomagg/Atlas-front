import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getUserProfile } from '../services/authApi';
import { resolveMediaUrl } from '../utils/media';
import CompanyProducts from './CompanyProducts';
import { sendMessage } from '../services/messagesApi';
import { useAuth } from '../context/AuthContext';
import { useMediaLightbox } from './common/MediaLightboxProvider.jsx';
import { getSellerFeaturedProducts, getSellerProductsByCategory, fetchSellerProducts, getSellerGroupedProducts, getSellerGroupedProductsByGroup, getMyGroupsWithProducts } from '../services/productApi';
import FeaturedProductCard from './common/FeaturedProductCard';
import SubsidiaryCompanies from './common/SubsidiaryCompanies';
import AddressMapLink from './common/AddressMapLink';
import { getCountryName, getStateDisplay } from '../utils/locationData';

export default function CompanyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { sellerId } = useParams(); // Get seller ID from URL params
  const fromPath = location?.state?.from;
  const sellerProfile = location?.state?.sellerProfile || null; // provided by ProductDetails link
  const { isAuthenticated } = useAuth();
  const { open } = useMediaLightbox();

  // Contact form state
  const [isContactExpanded, setIsContactExpanded] = useState(false);
  const [msgFromEmail, setMsgFromEmail] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [msgSuccess, setMsgSuccess] = useState('');

  // Featured products state
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredError, setFeaturedError] = useState('');
  const [featuredPage, setFeaturedPage] = useState(1);
  const [featuredHasMore, setFeaturedHasMore] = useState(false);

  // Products by category state
  const [categoryProducts, setCategoryProducts] = useState({});
  const [categoryLoading, setCategoryLoading] = useState({});
  const [categoryError, setCategoryError] = useState({});
  const [categoryPages, setCategoryPages] = useState({});
  const [categoryHasMore, setCategoryHasMore] = useState({});
  const [sellerCategories, setSellerCategories] = useState([]); // [{id, name}]
  const [activeCategory, setActiveCategory] = useState(null); // Currently selected category tab

  // Grouped products state
  const [groupedProducts, setGroupedProducts] = useState({});
  const [groupedLoading, setGroupedLoading] = useState({});
  const [groupedError, setGroupedError] = useState({});
  const [groupedPages, setGroupedPages] = useState({});
  const [groupedHasMore, setGroupedHasMore] = useState({});
  const [sellerGroups, setSellerGroups] = useState([]); // [{id, name}]
  const [activeGroup, setActiveGroup] = useState(null); // Currently selected group tab

  // Seller's own groups state (for displaying group info)
  const [sellerOwnGroups, setSellerOwnGroups] = useState([]);
  const [sellerGroupsLoading, setSellerGroupsLoading] = useState(false);
  const [sellerGroupsError, setSellerGroupsError] = useState('');
  const [activeSellerGroup, setActiveSellerGroup] = useState(null);
  
  // Product Groups state (new implementation)
  const [productGroups, setProductGroups] = useState([]);
  const [productGroupsLoading, setProductGroupsLoading] = useState(false);
  const [productGroupsError, setProductGroupsError] = useState('');
  const [activeProductGroup, setActiveProductGroup] = useState(null);
  
  // See more toggles for media sections
  const [showMoreSections, setShowMoreSections] = useState({
    aboutUsFiles: false,
    featuredProducts: false,
    certificates: false,
    blogAwards: false,
    productionSites: false,
    storageSites: false,
    exhibitions: false,
    subsidiaries: false,
  });

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

  // Load featured products
  const loadFeaturedProducts = async (page = 1) => {
    const currentSellerId = sellerId || profile?.id || profile?.user_id;
    if (!currentSellerId) {
      console.log('CompanyPage - No seller ID available for featured products');
      return;
    }

    console.log('CompanyPage - Loading featured products for seller:', currentSellerId);
    setFeaturedLoading(true);
    setFeaturedError('');
    
    try {
      const data = await getSellerFeaturedProducts({
        seller_id: currentSellerId,
        page,
        page_size: 12,
        status: 'APPROVED'
      });
      
      console.log('CompanyPage - Featured products response:', data);
      // Handle both direct array and paginated response
      const results = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
      
      if (page === 1) {
        setFeaturedProducts(results);
      } else {
        setFeaturedProducts(prev => [...prev, ...results]);
      }
      
      // Handle pagination - check for next page
      const hasNext = data?.next || (Array.isArray(data) && data.length >= 12);
      setFeaturedHasMore(hasNext);
      setFeaturedPage(page);
    } catch (error) {
      console.error('Failed to load featured products:', error);
      setFeaturedError(`Failed to load featured products: ${error.message}`);
    } finally {
      setFeaturedLoading(false);
    }
  };

  // Load products by category
  const loadProductsByCategory = async (categoryId, categoryName, page = 1) => {
    const currentSellerId = sellerId || profile?.id || profile?.user_id;
    if (!currentSellerId || !categoryId) {
      console.log('CompanyPage - Missing seller ID or category ID:', { currentSellerId, categoryId });
      return;
    }

    console.log(`CompanyPage - Loading ${categoryName} products for seller:`, currentSellerId);
    setCategoryLoading(prev => ({ ...prev, [categoryId]: true }));
    setCategoryError(prev => ({ ...prev, [categoryId]: '' }));
    
    try {
      const data = await getSellerProductsByCategory({
        seller_id: currentSellerId,
        category: categoryId,
        page,
        page_size: 12,
        status: 'APPROVED',
        include_subcategories: true
      });
      
      console.log(`CompanyPage - ${categoryName} products response:`, data);
      // Handle both direct array and paginated response
      const results = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
      
      if (page === 1) {
        setCategoryProducts(prev => ({ ...prev, [categoryId]: { products: results, name: categoryName } }));
      } else {
        setCategoryProducts(prev => ({
          ...prev,
          [categoryId]: {
            ...prev[categoryId],
            products: [...(prev[categoryId]?.products || []), ...results]
          }
        }));
      }
      
      // Handle pagination - check for next page
      const hasNext = data?.next || (Array.isArray(data) && data.length >= 12);
      setCategoryHasMore(prev => ({ ...prev, [categoryId]: hasNext }));
      setCategoryPages(prev => ({ ...prev, [categoryId]: page }));
    } catch (error) {
      console.error(`Failed to load products for category ${categoryId}:`, error);
      setCategoryError(prev => ({ ...prev, [categoryId]: `Failed to load products: ${error.message}` }));
    } finally {
      setCategoryLoading(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  // Handle category tab switching
  const handleCategorySwitch = (categoryId, categoryName) => {
    setActiveCategory(categoryId);
    
    // Only load if we haven't loaded this category yet
    if (!categoryProducts[categoryId]) {
      loadProductsByCategory(categoryId, categoryName, 1);
    }
  };

  // Load grouped products
  const loadGroupedProducts = async () => {
    const currentSellerId = sellerId || profile?.id || profile?.user_id;
    if (!currentSellerId) {
      console.log('CompanyPage - No seller ID available for grouped products');
      return;
    }

    console.log('CompanyPage - Loading grouped products for seller:', currentSellerId);
    setGroupedLoading(prev => ({ ...prev, main: true }));
    setGroupedError(prev => ({ ...prev, main: '' }));
    
    try {
      const data = await getSellerGroupedProducts({
        seller_id: currentSellerId,
        page: 1,
        page_size: 50,
        status: 'APPROVED'
      });
      
      console.log('CompanyPage - Grouped products response:', data);
      
      // Extract groups from the response
      const groups = data?.groups || [];
      console.log('CompanyPage - Discovered groups:', groups);
      setSellerGroups(groups);
      
      // Set first group as active and load its products if groups exist
      if (groups.length > 0 && !activeGroup) {
        setActiveGroup(groups[0].id);
        // Load products for the first group
        loadProductsByGroup(groups[0].id, groups[0].name, 1);
      }
      
    } catch (error) {
      console.error('Failed to load grouped products:', error);
      setGroupedError(prev => ({ ...prev, main: `Failed to load grouped products: ${error.message}` }));
    } finally {
      setGroupedLoading(prev => ({ ...prev, main: false }));
    }
  };

  // Load products by group
  const loadProductsByGroup = async (groupId, groupName, page = 1) => {
    const currentSellerId = sellerId || profile?.id || profile?.user_id;
    if (!currentSellerId || !groupId) {
      console.log('CompanyPage - Missing seller ID or group ID:', { currentSellerId, groupId });
      return;
    }

    console.log(`CompanyPage - Loading ${groupName} products for seller:`, currentSellerId);
    setGroupedLoading(prev => ({ ...prev, [groupId]: true }));
    setGroupedError(prev => ({ ...prev, [groupId]: '' }));
    
    try {
      const data = await getSellerGroupedProductsByGroup({
        seller_id: currentSellerId,
        group_id: groupId,
        page,
        page_size: 12,
        status: 'APPROVED'
      });
      
      console.log(`CompanyPage - ${groupName} grouped products response:`, data);
      // Handle both direct array and paginated response
      const results = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
      
      if (page === 1) {
        setGroupedProducts(prev => ({ ...prev, [groupId]: { products: results, name: groupName } }));
      } else {
        setGroupedProducts(prev => ({
          ...prev,
          [groupId]: {
            ...prev[groupId],
            products: [...(prev[groupId]?.products || []), ...results]
          }
        }));
      }
      
      // Handle pagination - check for next page
      const hasNext = data?.next || (Array.isArray(data) && data.length >= 12);
      setGroupedHasMore(prev => ({ ...prev, [groupId]: hasNext }));
      setGroupedPages(prev => ({ ...prev, [groupId]: page }));
    } catch (error) {
      console.error(`Failed to load products for group ${groupId}:`, error);
      setGroupedError(prev => ({ ...prev, [groupId]: `Failed to load products: ${error.message}` }));
    } finally {
      setGroupedLoading(prev => ({ ...prev, [groupId]: false }));
    }
  };

  // Handle group tab switching
  const handleGroupSwitch = (groupId, groupName) => {
    setActiveGroup(groupId);
    
    // Only load if we haven't loaded this group yet
    if (!groupedProducts[groupId]) {
      loadProductsByGroup(groupId, groupName, 1);
    }
  };

  // Load seller's own groups with products
  const loadSellerOwnGroups = async () => {
    const currentSellerId = sellerId || profile?.id || profile?.user_id;
    if (!currentSellerId) {
      return;
    }

    setSellerGroupsLoading(true);
    setSellerGroupsError('');

    try {
      const response = await getMyGroupsWithProducts({
        status: 'active', // Only show active groups
        approved_only: 'true' // Only show approved products
      });

      const groups = Array.isArray(response) ? response : response?.results || [];
      setSellerOwnGroups(groups);
      
      // Set first group as active if we don't have an active group yet
      if (groups.length > 0 && !activeSellerGroup) {
        setActiveSellerGroup(groups[0].id);
      }

    } catch (error) {
      console.error('Failed to load seller groups:', error);
      setSellerGroupsError(`Failed to load seller groups: ${error.message}`);
    } finally {
      setSellerGroupsLoading(false);
    }
  };

  // Load product groups for the current seller
  const loadProductGroups = async () => {
    const currentSellerId = sellerId || profile?.id || profile?.user_id;
    if (!currentSellerId) {
      console.log('CompanyPage - No seller ID available for product groups');
      return;
    }

    console.log('CompanyPage - Loading product groups for seller:', currentSellerId);
    setProductGroupsLoading(true);
    setProductGroupsError('');

    try {
      // Fetch ONLY this seller's product groups using the unified endpoint
      const response = await fetch(
        `/api/products/product-groups/?user_id=${currentSellerId}&status=active&approved_only=true&page_size=20`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to load product groups: ${response.status}`);
      }
      
      const data = await response.json();
      const groups = data.results || [];
      
      // Filter out groups with no products
      const groupsWithProducts = groups.filter(group => 
        group.products && Array.isArray(group.products) && group.products.length > 0
      );
      
      console.log('CompanyPage - Groups with products:', groupsWithProducts);
      setProductGroups(groupsWithProducts);
      
      // Set first group as active
      if (groupsWithProducts.length > 0 && !activeProductGroup) {
        setActiveProductGroup(groupsWithProducts[0].id);
      }

    } catch (error) {
      console.error('Failed to load product groups:', error);
      setProductGroupsError(`Failed to load product groups: ${error.message}`);
    } finally {
      setProductGroupsLoading(false);
    }
  };

  // Load data when profile is available
  useEffect(() => {
    const currentSellerId = sellerId || profile?.id || profile?.user_id;
    console.log('CompanyPage - Loading data for seller:', currentSellerId, { sellerId, profile });
    
    if (currentSellerId && !loading) {
      console.log('CompanyPage - Loading featured products, categories, grouped products, seller groups, and product groups');
      loadFeaturedProducts(1);
      loadGroupedProducts();
      loadSellerOwnGroups();
      loadProductGroups();

      // Discover seller categories from their products (no hard-coding)
      (async () => {
        try {
          // Fetch first 100 products to collect categories - use same endpoint as "All Products" section
          const resp = await fetchSellerProducts(currentSellerId, { page: '1', page_size: '100', status: 'APPROVED' });
          console.log('CompanyPage - Seller products for category discovery:', resp);
          
          const items = Array.isArray(resp) ? resp : (resp?.results || []);
          console.log('CompanyPage - Processing products for categories:', items);
          
          const map = new Map();
          for (const p of items) {
            // Check category_info first (from your console log), then category
            const cat = p?.category_info || p?.category;
            console.log('CompanyPage - Product category data:', { productId: p.id, category: cat });
            
            if (!cat) continue;
            
            if (typeof cat === 'object' && cat.id) {
              const categoryName = cat.name || cat.title || `Category ${cat.id}`;
              map.set(String(cat.id), { id: cat.id, name: categoryName });
              console.log('CompanyPage - Added category:', { id: cat.id, name: categoryName });
            } else if (typeof cat === 'number') {
              // Name unknown; will be shown as "Category {id}" until resolved
              if (!map.has(String(cat))) {
                map.set(String(cat), { id: cat, name: `Category ${cat}` });
                console.log('CompanyPage - Added numeric category:', { id: cat, name: `Category ${cat}` });
              }
            }
          }
          
          const cats = Array.from(map.values());
          console.log('CompanyPage - Discovered categories:', cats);
          setSellerCategories(cats);

          // Load products for ALL discovered categories
          if (cats.length > 0) {
            console.log('CompanyPage - Loading products for all categories:', cats);
            console.log('CompanyPage - Total categories found:', cats.length);
            cats.forEach((cat, index) => {
              console.log(`CompanyPage - Loading category ${index + 1}/${cats.length}:`, cat.name, 'ID:', cat.id);
              loadProductsByCategory(cat.id, cat.name, 1);
            });
          } else {
            console.log('CompanyPage - No categories found!');
          }
        } catch (e) {
          console.warn('CompanyPage - Failed to discover seller categories:', e);
        }
      })();
    }
  }, [sellerId, profile, loading]);

  // Extract seller info from ProductDetails navigation state or profile
  // When coming from ProductDetails: sellerProfile has company_info structure
  // When loading directly: profile has company structure  
  const company = sellerProfile?.company_info || sellerProfile?.company || profile?.company || {};
  const sellerInfo = sellerProfile || profile || {};
  
  // Use actual API data structure - follow ProductDetails pattern
  const companyName = company?.company_name || sellerInfo?.company_name || sellerInfo?.full_name || sellerInfo?.name || 'Company';
  const contactName = sellerInfo?.full_name || sellerInfo?.name || '';
  const countryCode = sellerInfo?.country || '';
  const country = getCountryName(countryCode) || sellerInfo?.country_name || countryCode || '';
  const businessType = sellerInfo?.business_type || sellerInfo?.businessType || '';
  
  // Debug: Log the actual data structure
  console.log('🔍 CompanyPage Data Debug:', {
    profile: profile,
    sellerProfile: sellerProfile,
    company: company,
    sellerInfo: sellerInfo,
    companyName: companyName,
    contactName: contactName,
    country: country,
    businessType: businessType,
    certificates: company?.certificates,
    exhibitions: company?.exhibitions,
    subsidiaries: company?.subsidiaries
  });
  const role = businessType ? businessType.toString().replaceAll('_', ' ').toLowerCase().charAt(0).toUpperCase() + businessType.toString().replaceAll('_', ' ').toLowerCase().slice(1) : 'Supplier';
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
                <div className="relative -mt-3 sm:-mt-8 flex items-end gap-4">
                  <img
                    src={profileImg || '/images/img_image_2.png'}
                    alt="company avatar"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-md object-cover border-4 border-white shadow-md"
                  />
                  <div className="flex-1 mt-2 sm:mt-0">
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">{companyName}</h1>
                    <div className="mt-1 text-sm sm:text-base text-slate-600">
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
                      className="h-10 px-4 rounded-md border border-slate-300 bg-white text-slate-700 text-sm md:text-base font-medium hover:bg-slate-50"
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
                  <div className="px-5 py-3 border-b border-slate-200 text-center">
                    <h3 className="text-slate-800 font-semibold">Company Overview</h3>
                  </div>
                  <div className="p-5 text-sm md:text-base">
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Company Name</div>
                      <div className="col-span-8 text-slate-800">{companyName || '—'}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Business Type</div>
                      <div className="col-span-8 text-slate-800">{role || '—'}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Country</div>
                      <div className="col-span-8 text-slate-800">{country || '—'}</div>
                    </div>
                    {(company?.year_of_establishment || sellerInfo?.year_of_establishment) && (
                      <div className="grid grid-cols-12 gap-3 py-2">
                        <div className="col-span-4 text-slate-500">Year of Establishment</div>
                        <div className="col-span-8 text-slate-800">{company?.year_of_establishment || sellerInfo?.year_of_establishment}</div>
                      </div>
                    )}
                    {(company?.number_of_employees || sellerInfo?.number_of_employees) && (
                      <div className="grid grid-cols-12 gap-3 py-2">
                        <div className="col-span-4 text-slate-500">Number of Employees</div>
                        <div className="col-span-8 text-slate-800">{company?.number_of_employees || sellerInfo?.number_of_employees}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-md shadow-sm border border-slate-200">
                  <div className="px-5 py-3 border-b border-slate-200 text-center">
                    <h3 className="text-slate-800 font-semibold">Contact Person</h3>
                  </div>
                  <div className="p-5 text-sm md:text-base">
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Full Name</div>
                      <div className="col-span-8 text-slate-800">{contactName || '—'}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Email</div>
                      <div className="col-span-8 text-slate-800 break-all">{sellerInfo?.email || profile?.email || '—'}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Phone</div>
                      <div className="col-span-8 text-slate-800">{sellerInfo?.phone_number || profile?.phone_number || profile?.phoneNumber || '—'}</div>
                    </div>
                    {(company?.website || sellerInfo?.website || profile?.website) ? (
                      <div className="grid grid-cols-12 gap-3 py-2">
                        <div className="col-span-4 text-slate-500">Website</div>
                        <div className="col-span-8 text-[#027DDB]">
                          <a href={company?.website || sellerInfo?.website || profile?.website} target="_blank" rel="noreferrer" className="hover:underline">{company?.website || sellerInfo?.website || profile?.website}</a>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Company Addresses Section */}
                {(company?.head_office || (Array.isArray(company?.addresses) && company.addresses.length > 0)) && (
                  <div className="bg-white rounded-md shadow-sm border border-slate-200">
                    <div className="px-5 py-3 border-b border-slate-200 text-center">
                      <h3 className="text-slate-800 font-semibold">Company Addresses</h3>
                    </div>
                    <div className="p-5 space-y-4">
                      {/* Head Office */}
                      {company.head_office && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Head Office
                            </p>
                            <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">Primary</span>
                          </div>
                          <div>
                            <AddressMapLink 
                              address={{
                                ...company.head_office,
                                country: getCountryName(company.head_office.country) || company.head_office.country
                              }}
                            />
                            {(company.head_office.phone_number || company.head_office.email) && (
                              <div className="pt-2 border-t border-blue-200 mt-2 space-y-1">
                                {company.head_office.phone_number && (
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {company.head_office.phone_number}
                                  </div>
                                )}
                                {company.head_office.email && (
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {company.head_office.email}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Branch Offices */}
                      {Array.isArray(company.addresses) && company.addresses.filter(a => !a?.is_head_office).length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Branch Offices
                            </p>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                              {company.addresses.filter(a => !a?.is_head_office).length} location{company.addresses.filter(a => !a?.is_head_office).length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {company.addresses.filter(a => !a?.is_head_office).map((addr, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                              <div>
                                <AddressMapLink 
                                  address={{
                                    ...addr,
                                    country: getCountryName(addr.country) || addr.country
                                  }}
                                />
                                {(addr.phone_number || addr.email) && (
                                  <div className="pt-2 border-t border-slate-300 mt-2 space-y-1">
                                    {addr.phone_number && (
                                      <div className="flex items-center gap-2 text-slate-600 text-xs">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {addr.phone_number}
                                      </div>
                                    )}
                                    {addr.email && (
                                      <div className="flex items-center gap-2 text-slate-600 text-xs">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {addr.email}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Fallback for legacy single address data */}
                      {!company.head_office && (!Array.isArray(company.addresses) || company.addresses.length === 0) && 
                       (company.address_country || company.address_state || company.address_city || company.street || sellerInfo.country_name || sellerInfo.state) && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-sm font-medium text-slate-700">Company Address</p>
                          </div>
                          <AddressMapLink 
                            address={{
                              street_address: company.street,
                              city: company.address_city,
                              state_region: company.address_state || sellerInfo.state,
                              country: getCountryName(company.address_country) || company.address_country || sellerInfo.country_name
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ABOUT US Section */}
            {(() => {
              // Check seller info, company object and profile for about us data
              const aboutUsMedia = company?.about_us_media || sellerInfo?.about_us_media || profile?.about_us_media || [];
              const hasMedia = Array.isArray(aboutUsMedia) && aboutUsMedia.length > 0;
              const hasText = company?.about_us || sellerInfo?.about_us || profile?.about_us || company?.company_description || profile?.company_description || company?.description || profile?.description || company?.why_choose_us || sellerInfo?.why_choose_us || profile?.why_choose_us;
              
              // Only render the section if there's content
              if (!hasMedia && !hasText) {
                return null; // Hide the entire section when no content
              }
              
              return (
                <div className="bg-white rounded-md shadow-sm border border-slate-200">
                  <div className="px-5 py-3 border-b border-slate-200 text-center">
                    <h3 className="text-lg md:text-xl text-slate-800 font-bold">ABOUT US</h3>
                  </div>
                  <div className="p-5">
                    <div className="space-y-8">
                      {/* Company Story Text */}
                      {hasText && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <div className="flex-1 space-y-4">
                              <h3 className="text-xl font-semibold text-slate-900">Our Story</h3>
                              {(company?.about_us || sellerInfo?.about_us || profile?.about_us) && (
                                <div className="prose prose-slate max-w-none">
                                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{company?.about_us || sellerInfo?.about_us || profile?.about_us}</div>
                                </div>
                              )}
                              {(company?.company_description || profile?.company_description) && (
                                <div className="prose prose-slate max-w-none">
                                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{company?.company_description || profile?.company_description}</div>
                                </div>
                              )}
                              {(company?.description || profile?.description) && (
                                <div className="prose prose-slate max-w-none">
                                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{company?.description || profile?.description}</div>
                                </div>
                              )}
                              {(company?.why_choose_us || sellerInfo?.why_choose_us || profile?.why_choose_us) && (
                                <div className="mt-6 p-4 bg-white/60 rounded-lg border border-blue-200">
                                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Why Choose Us
                                  </h4>
                                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{company?.why_choose_us || sellerInfo?.why_choose_us || profile?.why_choose_us}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Visual Story - Full Width Media Section */}
            {(() => {
              const aboutUsMedia = company?.about_us_media || profile?.about_us_media || [];
              const hasMedia = Array.isArray(aboutUsMedia) && aboutUsMedia.length > 0;
              if (!hasMedia) return null;
              return (
                <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden -mx-6">
                  <div className="px-5 py-3 border-b border-slate-200 text-center">
                    <h3 className="text-lg md:text-xl text-slate-800 font-bold">VISUAL STORY</h3>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-0">
                    {(() => {
                      const displayItems = showMoreSections.aboutUsMedia ? aboutUsMedia : aboutUsMedia.slice(0, 6);
                      return (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                            {displayItems.map((media, i) => {
                              const mediaUrl = media?.url || media?.file || media;
                              const isVideo = /\/video\//.test(String(mediaUrl)) || /\.(mp4|webm|ogg)(\?|$)/i.test(String(mediaUrl));
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => open([{ type: isVideo ? 'video' : 'image', src: mediaUrl }], i)}
                                  className="group relative aspect-[4/3] overflow-hidden hover:z-10 transition-all duration-300 hover:shadow-2xl hover:scale-105"
                                >
                                  {isVideo ? (
                                    <div className="relative w-full h-full">
                                      <video src={mediaUrl} className="w-full h-full object-cover" muted onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center" style={{display: 'none'}}>
                                        <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center">
                                          <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                      </div>
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/30 transition-colors flex items-center justify-center">
                                        <div className="w-20 h-20 bg-white/95 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                          <svg className="w-10 h-10 text-slate-700 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z"/>
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <img src={mediaUrl} alt={`About us ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                      <div className="absolute inset-0 bg-slate-200 flex items-center justify-center" style={{display: 'none'}}>
                                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    </>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {aboutUsMedia.length > 6 && (
                            <div className="text-center pt-6 pb-6 bg-gradient-to-br from-slate-50 to-blue-50">
                              <button className="inline-flex items-center gap-3 px-8 py-4 rounded-xl border-2 border-white/60 bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-300 font-medium text-lg" onClick={() => setShowMoreSections(prev => ({ ...prev, aboutUsMedia: !prev.aboutUsMedia }))}>
                                {showMoreSections.aboutUsMedia ? (
                                  <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                                    Show Less
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    View All {aboutUsMedia.length} Items
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })()}

            {/* Our Subsidiary Companies Section - Moved here after Our Story */}
            <div className="bg-white rounded-md shadow-sm border border-slate-200">
              <div className="px-5 py-3 border-b border-slate-200 text-center">
                <h2 className="text-xl md:text-2xl font-bold text-blue-600">Our Subsidiary Companies</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Explore our family of companies and their specialized services
                </p>
              </div>
              <div className="p-5">
                {(() => {
                  const subsidiaries = company?.subsidiaries || [];
                  console.log('🔍 Subsidiaries Debug:', {
                    company: company,
                    subsidiaries: subsidiaries,
                    isArray: Array.isArray(subsidiaries),
                    length: subsidiaries?.length
                  });
                  
                  const handleVisitSubsidiary = (subsidiary) => {
                    console.log('Opening subsidiary in new window:', subsidiary);
                    console.log('Subsidiary slug:', subsidiary.slug);
                    
                    // Ensure we have a slug
                    if (!subsidiary.slug) {
                      console.error('No slug found for subsidiary:', subsidiary);
                      return;
                    }
                    
                    // Open subsidiary company page in new window
                    const subsidiaryUrl = `/subsidiary/${subsidiary.slug}`;
                    window.open(subsidiaryUrl, '_blank', 'noopener,noreferrer');
                  };

                  if (!Array.isArray(subsidiaries) || subsidiaries.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No Subsidiary Companies</h3>
                        <p className="text-slate-600 mb-4">
                          This company doesn't have any subsidiary companies yet.
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      <div className="space-y-4">
                        {subsidiaries.map((subsidiary) => (
                          <div
                            key={subsidiary.id}
                            className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                          >
                            <div className="flex items-center space-x-4 flex-1">
                              {/* Subsidiary Logo */}
                              <div className="flex-shrink-0">
                                {subsidiary.logo_url && resolveMediaUrl(subsidiary.logo_url) ? (
                                  <img
                                    src={resolveMediaUrl(subsidiary.logo_url)}
                                    alt={`${subsidiary.name} logo`}
                                    className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              
                              {/* Subsidiary Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-semibold text-slate-900 truncate">
                                    {subsidiary.name}
                                  </h3>
                                  {subsidiary.is_featured && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                      Featured
                                    </span>
                                  )}
                                </div>
                                {subsidiary.tagline && (
                                  <p className="text-sm text-blue-600 font-medium mt-1">
                                    {subsidiary.tagline}
                                  </p>
                                )}
                                <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                  {subsidiary.description || 'Specialized services and products'}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                                  {subsidiary.product_count !== undefined && (
                                    <span className="flex items-center">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                      </svg>
                                      {subsidiary.product_count} products
                                    </span>
                                  )}
                                  {subsidiary.view_count !== undefined && (
                                    <span className="flex items-center">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      {subsidiary.view_count} views
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Visit Button */}
                            <div className="flex-shrink-0 ml-4">
                              <button
                                onClick={() => handleVisitSubsidiary(subsidiary)}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Visit Company
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Call to Action */}
                      {subsidiaries.length > 0 && (
                        <div className="mt-6 space-y-4">
                          <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Visit our subsidiary companies</strong> to explore their specialized services and products. 
                              Each company offers unique solutions tailored to different market needs.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Featured Products Section - Full Width */}
            <div className="bg-white rounded-md shadow-sm border border-slate-200">
              <div className="px-5 py-3 border-b border-slate-200 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-blue-600">Featured Products from {companyName}</h2>
                
              </div>
              <div className="p-5">
                {featuredLoading ? (
                  <div className="text-sm md:text-base text-slate-500">Loading featured products...</div>
                ) : featuredError ? (
                  <div className="text-sm md:text-base text-red-500">{featuredError}</div>
                ) : featuredProducts.length > 0 ? (
                  <>
                    {(() => {
                      const items = showMoreSections.featuredProducts ? featuredProducts : featuredProducts.slice(0, 4);
                      return (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {items.map((product) => (
                              <FeaturedProductCard key={product.id} product={product} />
                            ))}
                          </div>
                          {featuredProducts.length > 4 && (
                            <div className="mt-4 text-center">
                              <button
                                className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 text-sm md:text-base hover:bg-slate-50"
                                onClick={() => setShowMoreSections(prev => ({ ...prev, featuredProducts: !prev.featuredProducts }))}
                              >
                                {showMoreSections.featuredProducts ? 'See less' : 'See more'}
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    
                    {featuredHasMore && !showMoreSections.featuredProducts && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => loadFeaturedProducts(featuredPage + 1)}
                          disabled={featuredLoading}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                        >
                          {featuredLoading ? 'Loading...' : 'Load More Featured Products'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm md:text-base text-slate-500">No featured products available.</div>
                )}
              </div>
            </div>

            {/* Product Groups Section */}
            {productGroups.length > 0 && (
              <div className="bg-white rounded-md shadow-sm border border-slate-200">
                <div className="px-5 py-3 border-b border-slate-200 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-blue-600">Product Collections by {companyName}</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Explore our organized product collections ({productGroups.length} collections available)
                  </p>
                </div>
                
                {productGroupsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-slate-500">Loading product collections...</div>
                  </div>
                ) : productGroupsError ? (
                  <div className="text-center py-8">
                    <div className="text-red-500 mb-4">{productGroupsError}</div>
                    <button 
                      onClick={loadProductGroups}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Group Tabs */}
                    <div className="px-5 pt-4">
                      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                        {productGroups.map((group) => (
                          <button
                            key={group.id}
                            onClick={() => setActiveProductGroup(group.id)}
                            className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                              activeProductGroup === group.id
                                ? 'bg-blue-600 text-white shadow-md transform -translate-y-1'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{group.name}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                activeProductGroup === group.id 
                                  ? 'bg-white bg-opacity-20 text-white' 
                                  : 'bg-blue-100 text-blue-600'
                              }`}>
                                {group.products?.length || 0}
                              </span>
                              {group.is_featured && (
                                <span className="text-xs bg-yellow-400 text-yellow-900 px-1 py-0.5 rounded">
                                  ★
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Products Display */}
                    <div className="p-5">
                      {(() => {
                        const activeGroup = productGroups.find(g => g.id === activeProductGroup) || productGroups[0];
                        const products = activeGroup?.products || [];
                        
                        if (products.length === 0) {
                          return (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <div className="text-slate-500">No products in this collection yet.</div>
                            </div>
                          );
                        }

                        return (
                          <>
                            {/* Group Header with Description */}
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-semibold text-gray-900">{activeGroup.name}</h3>
                                <span className="text-sm text-gray-500">
                                  {products.length} product{products.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {activeGroup?.description && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-sm text-blue-800">{activeGroup.description}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Products Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                              {products.map((product) => (
                                <FeaturedProductCard key={product.id} product={product} />
                              ))}
                            </div>

                            {/* Show more products if available */}
                            {activeGroup.product_count > products.length && (
                              <div className="mt-6 text-center">
                                <p className="text-sm text-gray-600 mb-3">
                                  Showing {products.length} of {activeGroup.product_count} products in this collection
                                </p>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors">
                                  View All {activeGroup.product_count} Products
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Seller Groups with Products Section - HIDDEN */}
            {false && sellerOwnGroups.length > 0 && (
              <div className="bg-white rounded-md shadow-sm border border-slate-200">
                <div className="px-5 py-3 border-b border-slate-200 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-blue-600">Product Groups by {companyName}</h2>
                </div>
                
                {sellerGroupsLoading ? (
                  <div className="text-center py-8">
                    <div className="text-slate-500">Loading product groups...</div>
                  </div>
                ) : sellerGroupsError ? (
                  <div className="text-center py-8">
                    <div className="text-red-500">{sellerGroupsError}</div>
                  </div>
                ) : (
                  <>
                    {/* Group Tabs */}
                    <div className="px-5 pt-4">
                      <div className="flex flex-wrap gap-2 border-b border-slate-200">
                        {sellerOwnGroups.map((group) => (
                          <button
                            key={group.id}
                            onClick={() => setActiveSellerGroup(group.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                              activeSellerGroup === group.id
                                ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {group.name}
                            <span className="ml-2 bg-white bg-opacity-20 text-xs px-2 py-1 rounded-full">
                              {group.products?.length || 0}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Products Display */}
                    <div className="p-5">
                      {(() => {
                        const activeGroup = sellerOwnGroups.find(g => g.id === activeSellerGroup) || sellerOwnGroups[0];
                        const products = activeGroup?.products || [];
                        
                        if (products.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <div className="text-slate-500">No products in this group.</div>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.map((product) => (
                              <div
                                key={product.id}
                                onClick={() => window.open(`/product/${product.id}`, '_blank')}
                                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                              >
                                {/* Product Image */}
                                <div className="relative h-48 bg-gray-100">
                                  {(() => {
                                    const imageUrl = product.primary_image || 
                                                   product.thumb || 
                                                   product.image_url || 
                                                   (product.images && product.images[0]?.image) ||
                                                   (product.media && product.media[0]?.url);
                                    
                                    return imageUrl ? (
                                      <img
                                        src={resolveMediaUrl(imageUrl)}
                                        alt={product.title || product.product_name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null;
                                  })()}
                                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center" style={{display: 'none'}}>
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  
                                  {/* Click indicator */}
                                  <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </div>
                                </div>

                                {/* Product Info */}
                                <div className="p-4">
                                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                    {product.title || product.product_name}
                                  </h3>
                                  {product.description && (
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                      {product.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Grouped Products Section - Tabs Design - HIDDEN */}
            {false && sellerGroups.length > 0 && (
              <div className="bg-white rounded-md shadow-sm border border-slate-200">
                <div className="px-5 py-3 border-b border-slate-200 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-blue-600">Grouped Products from {companyName}</h2>
                </div>
                {/* Group Tabs */}
                <div className="px-5 pt-4">
                  <div className="flex flex-wrap gap-2 border-b border-slate-200">
                    {sellerGroups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => handleGroupSwitch(group.id, group.name)}
                        className={`px-4 py-2 text-sm md:text-base font-medium rounded-t-lg transition-colors ${
                          activeGroup === group.id
                            ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                            : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Group Products */}
                <div className="p-5">
                  {(() => {
                    if (!activeGroup) return null;
                    
                    const groupData = groupedProducts[activeGroup];
                    const isLoading = groupedLoading[activeGroup];
                    const error = groupedError[activeGroup];
                    const hasMore = groupedHasMore[activeGroup];
                    const products = groupData?.products || [];
                    const activeGroupName = sellerGroups.find(g => g.id === activeGroup)?.name || 'Group';
                    
                    if (isLoading) {
                      return (
                        <div className="text-center py-8">
                          <div className="text-slate-500">Loading {activeGroupName} products...</div>
                        </div>
                      );
                    }
                    
                    if (error) {
                      return (
                        <div className="text-center py-8">
                          <div className="text-red-500">{error}</div>
                        </div>
                      );
                    }
                    
                    if (products.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <div className="text-slate-500">No products available in {activeGroupName}.</div>
                        </div>
                      );
                    }
                    
                    return (
                      <>
                        {/* Show first 4 products */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          {products.slice(0, 4).map((product) => (
                            <FeaturedProductCard key={product.id} product={product} />
                          ))}
                        </div>
                        
                        {/* See More button if more than 4 products */}
                        {products.length > 4 && (
                          <div className="mt-6 text-center">
                            <button
                              onClick={() => {
                                // Load more products for this group
                                loadProductsByGroup(activeGroup, activeGroupName, (groupedPages[activeGroup] || 1) + 1);
                              }}
                              disabled={isLoading}
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-md hover:shadow-lg"
                            >
                              {isLoading ? 'Loading...' : `See More ${activeGroupName} Products`}
                            </button>
                          </div>
                        )}
                        
                        {/* Load More from API if available */}
                        {hasMore && products.length >= 4 && (
                          <div className="mt-4 text-center">
                            <button
                              onClick={() => loadProductsByGroup(activeGroup, activeGroupName, (groupedPages[activeGroup] || 1) + 1)}
                              disabled={isLoading}
                              className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                            >
                              {isLoading ? 'Loading...' : 'Load More from Server'}
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Products by Categories - Separate Sections */}
            {sellerCategories.length > 0 ? (
              <div className="space-y-8">
                {sellerCategories.map((category) => {
                  const categoryData = categoryProducts[category.id];
                  const isLoading = categoryLoading[category.id];
                  const error = categoryError[category.id];
                  const hasMore = categoryHasMore[category.id];
                  const products = categoryData?.products || [];
                  
                  return (
                    <div key={category.id} className="bg-white rounded-md shadow-sm border border-slate-200">
                      {/* Category Title - Blue, Bold, Centered */}
                      <div className="px-5 py-4 border-b border-slate-200 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-blue-600">
                          {category.name}
                        </h2>

                      </div>
                      
                      <div className="p-5">
                        {isLoading ? (
                          <div className="text-center py-8">
                            <div className="text-slate-500">Loading {category.name} products...</div>
                          </div>
                        ) : error ? (
                          <div className="text-center py-8">
                            <div className="text-red-500">{error}</div>
                          </div>
                        ) : products.length > 0 ? (
                          <>
                            {/* Show first 4 products */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                              {products.slice(0, 4).map((product) => (
                                <FeaturedProductCard key={product.id} product={product} />
                              ))}
                            </div>
                            
                            {/* See More button if more than 4 products */}
                            {products.length > 4 && (
                              <div className="mt-6 text-center">
                                <button
                                  onClick={() => {
                                    // Load more products for this category
                                    loadProductsByCategory(category.id, category.name, (categoryPages[category.id] || 1) + 1);
                                  }}
                                  disabled={isLoading}
                                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-md hover:shadow-lg"
                                >
                                  {isLoading ? 'Loading...' : `See More ${category.name} Products`}
                                </button>
                              </div>
                            )}
                            
                            {/* Load More from API if available */}
                            {hasMore && products.length >= 4 && (
                              <div className="mt-4 text-center">
                                <button
                                  onClick={() => loadProductsByCategory(category.id, category.name, (categoryPages[category.id] || 1) + 1)}
                                  disabled={isLoading}
                                  className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                                >
                                  {isLoading ? 'Loading...' : 'Load More from Server'}
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-slate-500">No {category.name.toLowerCase()} products available.</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-md shadow-sm border border-slate-200">
                <div className="px-5 py-3 border-b border-slate-200 text-center">
                  <h3 className="text-2xl md:text-3xl font-bold text-blue-600">Products by Category</h3>
                </div>
                <div className="p-5">
                  <div className="text-center py-8">
                    <div className="text-slate-500">No category data available yet for this seller.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Certificates Section - Full Width */}
            <div className="bg-white rounded-md shadow-sm border border-slate-200">
              <div className="px-5 py-3 border-b border-slate-200 text-center">
                <h3 className="text-lg md:text-xl text-slate-800 font-semibold">Certificates</h3>
              </div>
              <div className="p-5">
                {(() => {
                  const certs = company?.certificates || sellerInfo?.certificates || profile?.company?.certificates || [];
                  if (!Array.isArray(certs) || certs.length === 0) {
                    return <div className="text-sm md:text-base text-slate-500">No certificates uploaded.</div>;
                  }
                  const items = showMoreSections.certificates ? certs : certs.slice(0, 2);
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {items.map((cert, i) => {
                          const certUrl = cert?.url || cert?.file || cert;
                          return (
                            <button
                              key={i}
                              className="rounded-md border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => open([{ type: 'image', src: certUrl }], 0)}
                            >
                              <img src={certUrl} alt={`certificate-${i}`} className="w-full h-56 object-cover" />
                            </button>
                          );
                        })}
                      </div>
                      {certs.length > 2 && (
                        <div className="mt-4 text-center">
                          <button
                            className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 text-sm md:text-base hover:bg-slate-50"
                            onClick={() => setShowMoreSections(prev => ({ ...prev, certificates: !prev.certificates }))}
                          >
                            {showMoreSections.certificates ? 'See less' : 'See more'}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Blog & Awards Section - Full Width */}
            <div className="bg-white rounded-md shadow-sm border border-slate-200">
              <div className="px-5 py-3 border-b border-slate-200 text-center">
                <h3 className="text-lg md:text-xl text-slate-800 font-semibold">Blog & Awards</h3>
              </div>
              <div className="p-5">
                {(() => {
                  const blogAwards = profile?.company?.blog_awards || [];
                  if (!Array.isArray(blogAwards) || blogAwards.length === 0) {
                    return <div className="text-sm md:text-base text-slate-500">No blog/awards uploaded.</div>;
                  }
                  const items = showMoreSections.blogAwards ? blogAwards : blogAwards.slice(0, 2);
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {items.map((item, i) => {
                          const itemUrl = item?.url || item?.file || item;
                          const isVideo = /\/video\//.test(String(itemUrl)) || /\.(mp4|webm|ogg)(\?|$)/i.test(String(itemUrl));
                          return (
                            <button
                              key={i}
                              className="rounded-md border border-slate-200 overflow-hidden bg-slate-50 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => open([{ type: isVideo ? 'video' : 'image', src: itemUrl }], 0)}
                            >
                              {isVideo ? (
                                <div className="relative w-full h-56">
                                  <video 
                                    src={itemUrl} 
                                    className="w-full h-full object-cover" 
                                    muted 
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center" style={{display: 'none'}}>
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                      <svg className="w-6 h-6 text-slate-700 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <img src={itemUrl} alt={`blog-award-${i}`} className="w-full h-56 object-cover" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {blogAwards.length > 2 && (
                        <div className="mt-4 text-center">
                          <button
                            className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 text-sm md:text-base hover:bg-slate-50"
                            onClick={() => setShowMoreSections(prev => ({ ...prev, blogAwards: !prev.blogAwards }))}
                          >
                            {showMoreSections.blogAwards ? 'See less' : 'See more'}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Production Sites Section - Full Width */}
            <div className="bg-white rounded-md shadow-sm border border-slate-200">
              <div className="px-5 py-3 border-b border-slate-200 text-center">
                <h3 className="text-lg md:text-xl text-slate-800 font-semibold">Production Sites</h3>
              </div>
              <div className="p-5">
                {(() => {
                  const productionSites = profile?.company?.production_sites || [];
                  if (!Array.isArray(productionSites) || productionSites.length === 0) {
                    return <div className="text-sm md:text-base text-slate-500">No production sites uploaded.</div>;
                  }
                  const items = showMoreSections.productionSites ? productionSites : productionSites.slice(0, 2);
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {items.map((site, i) => {
                          const siteUrl = site?.url || site?.file || site;
                          const isVideo = /\/video\//.test(String(siteUrl)) || /\.(mp4|webm|ogg)(\?|$)/i.test(String(siteUrl));
                          return (
                            <button
                              key={i}
                              className="rounded-md border border-slate-200 overflow-hidden bg-slate-50 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => open([{ type: isVideo ? 'video' : 'image', src: siteUrl }], 0)}
                            >
                              {isVideo ? (
                                <div className="relative w-full h-56">
                                  <video 
                                    src={siteUrl} 
                                    className="w-full h-full object-cover" 
                                    muted 
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center" style={{display: 'none'}}>
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                      <svg className="w-6 h-6 text-slate-700 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <img src={siteUrl} alt={`production-site-${i}`} className="w-full h-56 object-cover" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {productionSites.length > 2 && (
                        <div className="mt-4 text-center">
                          <button
                            className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 text-sm md:text-base hover:bg-slate-50"
                            onClick={() => setShowMoreSections(prev => ({ ...prev, productionSites: !prev.productionSites }))}
                          >
                            {showMoreSections.productionSites ? 'See less' : 'See more'}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Storage Sites Section - Full Width */}
            <div className="bg-white rounded-md shadow-sm border border-slate-200">
              <div className="px-5 py-3 border-b border-slate-200 text-center">
                <h3 className="text-lg md:text-xl text-slate-800 font-semibold">Storage Sites</h3>
              </div>
              <div className="p-5">
                {(() => {
                  const storageSites = profile?.company?.storage_sites || [];
                  if (!Array.isArray(storageSites) || storageSites.length === 0) {
                    return <div className="text-sm md:text-base text-slate-500">No storage sites uploaded.</div>;
                  }
                  const items = showMoreSections.storageSites ? storageSites : storageSites.slice(0, 2);
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {items.map((site, i) => {
                          const siteUrl = site?.url || site?.file || site;
                          const isVideo = /\/video\//.test(String(siteUrl)) || /\.(mp4|webm|ogg)(\?|$)/i.test(String(siteUrl));
                          return (
                            <button
                              key={i}
                              className="rounded-md border border-slate-200 overflow-hidden bg-slate-50 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => open([{ type: isVideo ? 'video' : 'image', src: siteUrl }], 0)}
                            >
                              {isVideo ? (
                                <div className="relative w-full h-56">
                                  <video 
                                    src={siteUrl} 
                                    className="w-full h-full object-cover" 
                                    muted 
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center" style={{display: 'none'}}>
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                      <svg className="w-6 h-6 text-slate-700 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <img src={siteUrl} alt={`storage-site-${i}`} className="w-full h-56 object-cover" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {storageSites.length > 2 && (
                        <div className="mt-4 text-center">
                          <button
                            className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 text-sm md:text-base hover:bg-slate-50"
                            onClick={() => setShowMoreSections(prev => ({ ...prev, storageSites: !prev.storageSites }))}
                          >
                            {showMoreSections.storageSites ? 'See less' : 'See more'}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Exhibitions Section - Full Width */}
            <div className="bg-white rounded-md shadow-sm border border-slate-200">
              <div className="px-5 py-3 border-b border-slate-200 text-center">
                <h3 className="text-lg md:text-xl text-slate-800 font-semibold">Exhibitions</h3>
              </div>
              <div className="p-5">
                {(() => {
                  const exhibitions = company?.exhibitions || sellerInfo?.exhibitions || profile?.company?.exhibitions || [];
                  if (!Array.isArray(exhibitions) || exhibitions.length === 0) {
                    return <div className="text-sm md:text-base text-slate-500">No exhibitions uploaded.</div>;
                  }
                  const items = showMoreSections.exhibitions ? exhibitions : exhibitions.slice(0, 2);
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {items.map((exhibition, i) => {
                          const exhibitionUrl = exhibition?.url || exhibition?.file || exhibition;
                          const isVideo = /\/video\//.test(String(exhibitionUrl)) || /\.(mp4|webm|ogg)(\?|$)/i.test(String(exhibitionUrl));
                          return (
                            <button
                              key={i}
                              className="rounded-md border border-slate-200 overflow-hidden bg-slate-50 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => open([{ type: isVideo ? 'video' : 'image', src: exhibitionUrl }], 0)}
                            >
                              {isVideo ? (
                                <div className="relative w-full h-56">
                                  <video 
                                    src={exhibitionUrl} 
                                    className="w-full h-full object-cover" 
                                    muted 
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center" style={{display: 'none'}}>
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                      <svg className="w-6 h-6 text-slate-700 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <img src={exhibitionUrl} alt={`exhibition-${i}`} className="w-full h-56 object-cover" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {exhibitions.length > 2 && (
                        <div className="mt-4 text-center">
                          <button
                            className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 text-sm md:text-base hover:bg-slate-50"
                            onClick={() => setShowMoreSections(prev => ({ ...prev, exhibitions: !prev.exhibitions }))}
                          >
                            {showMoreSections.exhibitions ? 'See less' : 'See more'}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Floating Contact Card */}
      {!loading && !error && (
        <div className="fixed bottom-24 right-6 z-40">
          <div className={`bg-white rounded-lg shadow-xl border border-slate-200 transition-all duration-300 ${
            isContactExpanded ? 'w-80' : 'w-64'
          }`}>
            {/* Header - Always visible */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-blue-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <img 
                  src={profileImg || '/images/img_image_2.png'} 
                  alt="contact" 
                  className="w-8 h-8 rounded-full object-cover border-2 border-white" 
                />
                <div>
                  <div className="text-sm md:text-base font-medium">{contactName || companyName}</div>
                  <div className="text-sm opacity-90">{role}</div>
                </div>
              </div>
              <button 
                onClick={() => setIsContactExpanded(!isContactExpanded)} 
                className="p-1 rounded hover:bg-blue-700 transition-colors" 
                aria-label={isContactExpanded ? "Minimize" : "Expand"}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className={`w-4 h-4 transition-transform duration-300 ${isContactExpanded ? 'rotate-180' : ''}`}
                >
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </button>
            </div>

            {/* Expandable Form Content */}
            <div className={`overflow-hidden transition-all duration-300 ${
              isContactExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="p-4">
                <form className="space-y-3" onSubmit={async (e) => {
                  e.preventDefault();
                  setMsgError(''); setMsgSuccess('');
                  if (!isAuthenticated) { navigate('/login'); return; }
                  const body = msgBody.trim();
                  const fromEmail = msgFromEmail.trim();
                  if (fromEmail === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) { 
                    setMsgError('Please enter a valid email.'); 
                    return; 
                  }
                  if (body.length < 20) { 
                    setMsgError('Message must be at least 20 characters.'); 
                    return; 
                  }
                  setMsgSending(true);
                  try {
                    const recipientEmail = profile?.email || undefined;
                    const recipientAtlas = profile?.atlas_id || profile?.atlasId || undefined;
                    const subject = `Inquiry about ${companyName}`;
                    const finalBody = `From: ${fromEmail}\n\n${body}`;
                    await sendMessage({ 
                      subject, 
                      body: finalBody, 
                      recipient_email: recipientEmail, 
                      recipient_atlas_id: recipientAtlas 
                    });
                    setMsgSuccess('Message sent successfully.');
                    setMsgBody('');
                    setTimeout(() => {
                      setMsgSuccess('');
                    }, 2500);
                  } catch (err) {
                    setMsgError(err?.message || 'Failed to send message');
                  } finally { 
                    setMsgSending(false); 
                  }
                }}>
                  {/* From */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-slate-700">
                      <span className="text-red-500">*</span> From:
                    </label>
                    <input
                      type="email"
                      placeholder="Your email"
                      className="h-9 rounded border border-slate-300 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={msgFromEmail}
                      onChange={(e) => setMsgFromEmail(e.target.value)}
                    />
                  </div>

                  {/* Message */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-slate-700">
                      <span className="text-red-500">*</span> Message:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enter between 20 to 4,000 characters"
                      className="w-full rounded border border-slate-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      value={msgBody}
                      onChange={(e) => setMsgBody(e.target.value)}
                    />
                  </div>

                  {msgError && <div className="text-sm text-red-600">{msgError}</div>}
                  {msgSuccess && <div className="text-sm text-green-600">{msgSuccess}</div>}

                  {/* Send Button */}
                  <button 
                    type="submit" 
                    disabled={msgSending} 
                    className={`w-full h-9 px-3 rounded text-white text-sm font-medium ${
                      msgSending ? 'bg-red-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {msgSending ? 'Sending…' : 'Send'}
                  </button>
                </form>
              </div>
            </div>

            {/* Minimized state - Quick message hint */}
            {!isContactExpanded && (
              <div className="px-4 py-2 text-center">
                <div className="text-sm text-slate-500">Click to contact {role.toLowerCase()}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
