import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getSubsidiaryBySlug, getSubsidiaryProducts } from '../services/subsidiaryApi';
import { getUserProfile, getCompanyProfileByUserId } from '../services/authApi';
import { resolveMediaUrl } from '../utils/media';
import { getCountryName } from '../utils/locationData';
import { sendMessage } from '../services/messagesApi';
import { useAuth } from '../context/AuthContext';

// API functions for subsidiary products
const subsidiaryProductsApi = {
  // Get subsidiary products (public)
  getSubsidiaryProducts: async (subsidiarySlug, params = {}) => {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`/api/companies/subsidiaries/${subsidiarySlug}/products/?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch subsidiary products');
    return response.json();
  },
  
  // Get subsidiary products by category
  getSubsidiaryProductsByCategory: async (subsidiarySlug, categoryId, params = {}) => {
    const queryParams = new URLSearchParams({ ...params, category: categoryId });
    const response = await fetch(`/api/companies/subsidiaries/${subsidiarySlug}/products/?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch subsidiary products by category');
    return response.json();
  },
  
  // Get all subsidiary products (public)
  getAllProducts: async (subsidiarySlug, params = {}) => {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`/api/companies/subsidiaries/${subsidiarySlug}/products/?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch subsidiary products');
    return response.json();
  },

  // Get subsidiary details (public endpoint now includes all fields)
  getSubsidiaryDetails: async (subsidiarySlug) => {
    const response = await fetch(`/api/companies/subsidiaries/${subsidiarySlug}/public/`);
    if (!response.ok) throw new Error('Failed to fetch subsidiary details');
    return response.json();
  }
};

// Simple component for displaying subsidiary products
const SubsidiaryProducts = ({ subsidiarySlug, subsidiary }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('Fetching products for subsidiary:', subsidiarySlug);
        
        // Use the existing getSubsidiaryProducts function from subsidiaryApi
        const response = await getSubsidiaryProducts(subsidiarySlug, { page_size: 50 });
        console.log('Subsidiary products response:', response);
        
        const productList = Array.isArray(response) ? response : (response?.results || []);
        console.log('Processed product list:', productList);
        
        setProducts(productList);
      } catch (err) {
        console.error('Error fetching subsidiary products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (subsidiarySlug) {
      fetchProducts();
    }
  }, [subsidiarySlug]);

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error loading products: {error}</div>;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No Products Available</h3>
        <p className="text-slate-600">This subsidiary doesn't have any products yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <p className="text-slate-600">Showing {products.length} product{products.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => window.location.href = `/product/${product.id}`}>
            <div className="aspect-square bg-slate-100 overflow-hidden">
              {product.primary_image || product.image || product.thumb ? (
                <img 
                  src={resolveMediaUrl(product.primary_image || product.image || product.thumb)} 
                  alt={product.title || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-4">
              <h4 className="font-medium text-slate-900 mb-1 line-clamp-2">{product.title || product.name}</h4>
              <p className="text-sm text-slate-600 mb-2">{product.product_type || product.category}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {product.brand_info?.name || subsidiary?.name || 'Brand'}
                </span>
                {product.status && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    product.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {product.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for displaying products by categories
const SubsidiaryProductsByCategories = ({ subsidiarySlug, subsidiary }) => {
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    const fetchProductsByCategories = async () => {
      try {
        setLoading(true);
        
        // Get all categories
        const categoriesData = await listCategories();
        const allCategories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.results || []);
        
        // Get products for each category
        const categoryProductSections = [];
        
        for (const category of allCategories) {
          try {
            const products = await subsidiaryProductsApi.getProductsByCategory(subsidiarySlug, category.id);
            const productList = Array.isArray(products) ? products : (products?.results || []);
            
            if (productList.length > 0) {
              categoryProductSections.push({
                category: category,
                products: productList
              });
            }
          } catch (err) {
            // Skip categories with no products or errors
            console.log(`No products found for category ${category.name}:`, err.message);
          }
        }
        
        setCategories(allCategories);
        setCategoryProducts(categoryProductSections);
      } catch (err) {
        console.error('Error fetching products by categories:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (subsidiarySlug) {
      fetchProductsByCategories();
    }
  }, [subsidiarySlug]);

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error loading products: {error}</div>;
  }

  if (categoryProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No Products Available</h3>
        <p className="text-slate-600">This subsidiary doesn't have any products yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{subsidiary?.name} Products</h2>
        <p className="text-slate-600">Browse our products organized by category</p>
      </div>

      {categoryProducts.map((section) => {
        const isExpanded = expandedCategories[section.category.id];
        const displayProducts = isExpanded ? section.products : section.products.slice(0, 4);
        const hasMore = section.products.length > 4;

        return (
          <div key={section.category.id} className="category-section">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">{section.category.name}</h3>
              <span className="text-sm text-slate-500">{section.products.length} products</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-4">
              {displayProducts.map((product) => (
                <div key={product.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => window.location.href = `/product/${product.id}`}>
                  <div className="aspect-square bg-slate-100 rounded-md mb-3 overflow-hidden">
                    {product.primary_image ? (
                      <img 
                        src={resolveMediaUrl(product.primary_image)} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 mb-1 line-clamp-2">{product.title}</h4>
                    <p className="text-sm text-slate-600 mb-2">{product.product_type}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {product.brand_info?.name || subsidiary?.name || 'Brand'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        product.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="text-center">
                <button
                  onClick={() => toggleCategoryExpansion(section.category.id)}
                  className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                >
                  {isExpanded ? 'Show Less' : `See All ${section.products.length} Products`}
                  <svg className={`ml-2 h-4 w-4 transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Component for displaying products organized by categories
const SubsidiaryProductsByCategory = ({ subsidiarySlug, subsidiary }) => {
  const [productsByCategory, setProductsByCategory] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState({});

  // First, get all products to extract unique categories
  useEffect(() => {
    const fetchCategoriesAndProducts = async () => {
      try {
        setLoading(true);
        console.log('Fetching all products to extract categories for:', subsidiarySlug);
        
        // Get all products first to extract categories
        const allProductsResponse = await subsidiaryProductsApi.getSubsidiaryProducts(subsidiarySlug, { page_size: 100 });
        const allProducts = Array.isArray(allProductsResponse) ? allProductsResponse : (allProductsResponse?.results || []);
        
        // Extract unique categories from products
        const uniqueCategories = [];
        const categoryMap = new Map();
        
        allProducts.forEach(product => {
          const c = product?.category_info;
          if (c && c.id != null && !categoryMap.has(c.id)) {
            categoryMap.set(c.id, {
              id: c.id,
              name: c.name || c.title || 'Category',
              slug: c.slug,
              count: 0
            });
          }
        });
        
        // Count products per category
        allProducts.forEach(product => {
          const c = product?.category_info;
          if (c && c.id != null && categoryMap.has(c.id)) {
            const category = categoryMap.get(c.id);
            category.count += 1;
          }
        });
        
        const categoriesArray = Array.from(categoryMap.values()).filter(cat => cat.count > 0);
        console.log('Extracted categories:', categoriesArray);
        
        setCategories(categoriesArray);
        
        // Now fetch products for each category
        const productsByCat = {};
        for (const category of categoriesArray) {
          setLoadingCategories(prev => ({ ...prev, [category.id]: true }));
          
          try {
            const categoryProducts = await subsidiaryProductsApi.getSubsidiaryProductsByCategory(
              subsidiarySlug, 
              category.id, 
              { page_size: 20 }
            );
            
            const productList = Array.isArray(categoryProducts) ? categoryProducts : (categoryProducts?.results || []);
            productsByCat[category.id] = productList;
            console.log(`Products for category ${category.name}:`, productList.length);
            
          } catch (err) {
            console.error(`Error fetching products for category ${category.name}:`, err);
            productsByCat[category.id] = [];
          } finally {
            setLoadingCategories(prev => ({ ...prev, [category.id]: false }));
          }
        }
        
        setProductsByCategory(productsByCat);
        
      } catch (err) {
        console.error('Error fetching categories and products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (subsidiarySlug) {
      fetchCategoriesAndProducts();
    }
  }, [subsidiarySlug]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-slate-600">Loading products by category...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error loading products by category: {error}</div>;
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No Product Categories</h3>
        <p className="text-slate-600">This subsidiary doesn't have products organized by categories yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <div key={category.id} className="border border-slate-200 rounded-lg overflow-hidden">
          {/* Category Header */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-blue-600">{category.name}</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {category.count} {category.count === 1 ? 'product' : 'products'} available
                </p>
              </div>
              <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {category.count}
              </div>
            </div>
          </div>

          {/* Category Products */}
          <div className="p-6">
            {loadingCategories[category.id] ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-slate-600">Loading {category.name} products...</p>
              </div>
            ) : productsByCategory[category.id]?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productsByCategory[category.id].map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      // Open product details in new window
                      const productUrl = `/product/${product.id}`;
                      window.open(productUrl, '_blank');
                    }}
                  >
                    {/* Product Image */}
                    <div className="aspect-w-16 aspect-h-12 bg-slate-100">
                      {product.primary_image || product.thumb || product.image_url ? (
                        <img
                          src={resolveMediaUrl(product.primary_image || product.thumb || product.image_url)}
                          alt={product.product_name || product.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-slate-100 flex items-center justify-center">
                          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                        {product.product_name || product.name}
                      </h4>
                      {product.description && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        {product.price && (
                          <span className="text-lg font-bold text-blue-600">
                            ₦{parseFloat(product.price).toLocaleString()}
                          </span>
                        )}
                        <span className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No products found in this category</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function SubsidiaryCompanyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subsidiary, setSubsidiary] = useState(null);
  const [parentCompanyProfile, setParentCompanyProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { subsidiarySlug } = useParams();
  const fromPath = location?.state?.from;
  const subsidiaryInfo = location?.state?.subsidiaryInfo || null;
  const parentCompany = location?.state?.parentCompany || null;
  const { isAuthenticated } = useAuth();

  // Contact form state
  const [isContactExpanded, setIsContactExpanded] = useState(false);
  const [msgFromEmail, setMsgFromEmail] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [msgSuccess, setMsgSuccess] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Always fetch fresh data from API instead of using cached state
        console.log('📡 Fetching subsidiary details from API for slug:', subsidiarySlug);
        const data = await subsidiaryProductsApi.getSubsidiaryDetails(subsidiarySlug);
        console.log('✅ Subsidiary API response:', data);
        setSubsidiary(data);
        
        // If we have parent company information, try to fetch parent company profile
        if (data?.parent_company_name || data?.parent_company?.company_name) {
          try {
            console.log('📡 Fetching parent company profile for:', data.parent_company_name || data.parent_company?.company_name);
            
            // Try to extract parent company user ID from the data structure
            // Based on your API response, the parent company ID might be in different places
            let parentCompanyUserId = null;
            
            // Check if we have direct parent company ID
            if (data?.parent_company?.id) {
              parentCompanyUserId = data.parent_company.id;
            } 
            // Check if we have parent company user ID
            else if (data?.parent_company?.user_id) {
              parentCompanyUserId = data.parent_company.user_id;
            }
            // Check if we have parent company owner ID
            else if (data?.parent_company?.owner_id) {
              parentCompanyUserId = data.parent_company.owner_id;
            }
            // If we only have the company name, we might need to search or use a different approach
            else if (data?.parent_company_name) {
              console.log('🔍 Only have parent company name, will use subsidiary data for display');
            }
            
            if (parentCompanyUserId) {
              console.log('📡 Fetching parent company profile for user ID:', parentCompanyUserId);
              const parentProfile = await getCompanyProfileByUserId(parentCompanyUserId);
              console.log('✅ Parent company profile:', parentProfile);
              setParentCompanyProfile(parentProfile);
            } else {
              console.log('⚠️ No parent company user ID found, using subsidiary data only');
            }
          } catch (parentError) {
            console.warn('Could not fetch parent company profile:', parentError);
            // Don't fail the whole page if parent company fetch fails
          }
        }
      } catch (e) {
        if (!mounted) return;
        console.error('Error loading subsidiary:', e);
        setError(e?.message || 'Failed to load subsidiary company profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [subsidiarySlug]);

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <main className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6 text-slate-600">
            Loading subsidiary company...
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <main className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="bg-white rounded-md shadow-sm border border-rose-200 p-6 text-rose-700">
            {error}
          </div>
        </main>
      </div>
    );
  }


  // Use actual API response structure (handles null values from backend)
  const companyName = subsidiary?.name || 'Subsidiary Company';
  const tagline = subsidiary?.tagline || '';
  const description = subsidiary?.description || '';
  const targetMarket = subsidiary?.target_market || '';
  const brandStory = subsidiary?.brand_story || '';
  const brandValues = subsidiary?.brand_values || '';
  const website = subsidiary?.website || '';
  const email = subsidiary?.email || '';  // Now properly returns null instead of undefined
  const phone = subsidiary?.phone || '';  // Now properly returns null instead of undefined
  const country = getCountryName(subsidiary?.address_country) || subsidiary?.address_country || '';
  const state = subsidiary?.address_state || '';
  const city = subsidiary?.address_city || '';
  const streetAddress = subsidiary?.street_address || '';  // Now properly returns null instead of undefined
  const postalCode = subsidiary?.postal_code || '';        // Now properly returns null instead of undefined
  const profileImg = resolveMediaUrl(subsidiary?.logo_url) || '';
  const coverUrl = resolveMediaUrl(subsidiary?.cover_image_url) || '';
  const brandImg = resolveMediaUrl(subsidiary?.brand_image_url) || '';
  const parentCompanyName = subsidiary?.parent_company_name || subsidiary?.parent_company?.company_name || parentCompanyProfile?.company?.company_name || '';
  const parentCompanyLogo = subsidiary?.parent_company?.company_logo ? resolveMediaUrl(subsidiary.parent_company.company_logo) : (parentCompanyProfile?.company?.company_logo_url ? resolveMediaUrl(parentCompanyProfile.company.company_logo_url) : '');
  const parentCompanyId = subsidiary?.parent_company?.id || parentCompanyProfile?.company?.id || parentCompanyProfile?.id;
  const productCount = subsidiary?.product_count || 0;
  const viewCount = subsidiary?.view_count || 0;
  const isActive = subsidiary?.is_active;
  const isFeatured = subsidiary?.is_featured;

  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Parent Company Link */}
          {parentCompanyName && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {parentCompanyLogo && (
                    <img
                      src={parentCompanyLogo}
                      alt={`${parentCompanyName} logo`}
                      className="w-8 h-8 rounded object-cover border border-blue-300"
                    />
                  )}
                  {!parentCompanyLogo && (
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6" />
                    </svg>
                  )}
                  <div>
                    <p className="text-sm text-blue-800">
                      <strong>Subsidiary of:</strong> {parentCompanyName}
                    </p>
                    <p className="text-xs text-blue-600">Part of the {parentCompanyName} family of companies</p>
                  </div>
                </div>
                {parentCompanyId && (
                  <button
                    onClick={() => navigate(`/company/${parentCompanyId}`)}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visit Parent Company
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cover Header */}
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
                {profileImg ? (
                  <img
                    src={profileImg}
                    alt="subsidiary company logo"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-md object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-md bg-slate-100 border-4 border-white shadow-md flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">{companyName}</h1>
                    {subsidiary?.is_featured && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Featured Brand
                      </span>
                    )}
                  </div>
                  {tagline && (
                    <p className="text-sm sm:text-base text-blue-600 font-medium mt-1">{tagline}</p>
                  )}
                  <div className="mt-1 text-sm sm:text-base text-slate-600">
                    {targetMarket && <span className="mr-3">Market: <span className="font-medium text-slate-800">{targetMarket}</span></span>}
                    {country && <span className="mr-3">Location: <span className="font-medium text-slate-800">{country}</span></span>}
                    {subsidiary?.product_count !== undefined && <span>Products: <span className="font-medium text-slate-800">{subsidiary.product_count}</span></span>}
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
                    Back
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Company Details */}
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
                    <div className="col-span-4 text-slate-500">Country</div>
                    <div className="col-span-8 text-slate-800">{country || '—'}</div>
                  </div>
                  {description && (
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Description</div>
                      <div className="col-span-8 text-slate-800">{description}</div>
                    </div>
                  )}
                  {tagline && (
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Tagline</div>
                      <div className="col-span-8 text-slate-800">{tagline}</div>
                    </div>
                  )}
                  {targetMarket && (
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Target Market</div>
                      <div className="col-span-8 text-slate-800">{targetMarket}</div>
                    </div>
                  )}
                  {brandValues && (
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Brand Values</div>
                      <div className="col-span-8 text-slate-800">{brandValues}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-12 gap-3 py-2">
                    <div className="col-span-4 text-slate-500">Products</div>
                    <div className="col-span-8 text-slate-800">{productCount}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-3 py-2">
                    <div className="col-span-4 text-slate-500">Views</div>
                    <div className="col-span-8 text-slate-800">{viewCount.toLocaleString()}</div>
                  </div>
                  {subsidiary?.established_year && (
                    <div className="grid grid-cols-12 gap-3 py-2">
                      <div className="col-span-4 text-slate-500">Established</div>
                      <div className="col-span-8 text-slate-800">{subsidiary.established_year}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-md shadow-sm border border-slate-200">
                <div className="px-5 py-3 border-b border-slate-200 text-center">
                  <h3 className="text-slate-800 font-semibold">Contact Information</h3>
                </div>
                <div className="p-5 text-sm md:text-base">
                  <div className="grid grid-cols-12 gap-3 py-2">
                    <div className="col-span-4 text-slate-500">Email</div>
                    <div className="col-span-8 text-slate-800 break-all">{email || '—'}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-3 py-2">
                    <div className="col-span-4 text-slate-500">Phone</div>
                    <div className="col-span-8 text-slate-800">{phone || '—'}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-3 py-2">
                    <div className="col-span-4 text-slate-500">Website</div>
                    <div className="col-span-8 text-[#027DDB]">
                      {website ? (
                        <a href={website} target="_blank" rel="noreferrer" className="hover:underline">
                          {website}
                        </a>
                      ) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Address Information */}
              <div className="bg-white rounded-md shadow-sm border border-slate-200">
                <div className="px-5 py-3 border-b border-slate-200 text-center">
                  <h3 className="text-slate-800 font-semibold">Address Information</h3>
                </div>
                <div className="p-5 text-sm md:text-base">
                  <div className="grid grid-cols-12 gap-3 py-2">
                    <div className="col-span-4 text-slate-500">Country</div>
                    <div className="col-span-8 text-slate-800">{country || '—'}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-3 py-2">
                    <div className="col-span-4 text-slate-500">State/Region</div>
                    <div className="col-span-8 text-slate-800">{state || '—'}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-3 py-2">
                    <div className="col-span-4 text-slate-500">City</div>
                    <div className="col-span-8 text-slate-800">{city || '—'}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-3 py-2">
                    <div className="col-span-4 text-slate-500">Street Address</div>
                    <div className="col-span-8 text-slate-800">{streetAddress || '—'}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-3 py-2">
                    <div className="col-span-4 text-slate-500">Postal Code</div>
                    <div className="col-span-8 text-slate-800">{postalCode || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About Us Section */}
          {brandStory && (
            <div className="bg-white rounded-md shadow-sm border border-slate-200">
              <div className="px-5 py-3 border-b border-slate-200 text-center">
                <h3 className="text-lg md:text-xl text-slate-800 font-bold">ABOUT US</h3>
              </div>
              <div className="p-5">
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                  {brandStory}
                </p>
              </div>
            </div>
          )}

          {/* Products Section */}
          <div className="bg-white rounded-md shadow-sm border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-200 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-blue-600">Products from {companyName}</h2>
            </div>
            <div className="p-5">
              <SubsidiaryProducts 
                subsidiarySlug={subsidiarySlug}
                subsidiary={subsidiary}
              />
            </div>
          </div>

          {/* Products by Category Section */}
          <div className="bg-white rounded-md shadow-sm border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-200 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-blue-600">Products by Category</h2>
              <p className="text-sm text-slate-600 mt-2">
                Explore {companyName}'s products organized by categories
              </p>
            </div>
            <div className="p-5">
              <SubsidiaryProductsByCategory 
                subsidiarySlug={subsidiarySlug}
                subsidiary={subsidiary}
              />
            </div>
          </div>
        </div>
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
                  <div className="text-sm md:text-base font-medium">{companyName}</div>
                  <div className="text-sm opacity-90">Subsidiary</div>
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
                    const recipientEmail = email || undefined;
                    const subject = `Inquiry about ${companyName}`;
                    const finalBody = `From: ${fromEmail}\n\n${body}`;
                    await sendMessage({ 
                      subject, 
                      body: finalBody, 
                      recipient_email: recipientEmail
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
                <div className="text-sm text-slate-500">Click to contact subsidiary</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
