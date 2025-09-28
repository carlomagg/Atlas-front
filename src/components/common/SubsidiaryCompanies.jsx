import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicSubsidiaries, getMySubsidiaries } from '../../services/subsidiaryApi';
import { resolveMediaUrl } from '../../utils/media';

const SubsidiaryCompanies = ({ parentCompanyId, parentCompanyName }) => {
  console.log('🏗️ SubsidiaryCompanies component rendering with props:', { 
    parentCompanyId, 
    parentCompanyName,
    parentCompanyIdType: typeof parentCompanyId,
    parentCompanyIdValue: parentCompanyId,
    isParentCompanyIdTruthy: !!parentCompanyId
  });
  
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 SubsidiaryCompanies useEffect triggered with parentCompanyId:', parentCompanyId, 'type:', typeof parentCompanyId);
    
    const fetchSubsidiaries = async () => {
      try {
        console.log('🚀 Starting fetchSubsidiaries function');
        setLoading(true);
        setError(null);
        
        // Fetch all public subsidiaries and filter client-side (simpler approach)
        console.log('📡 Fetching all public subsidiaries...');
        const data = await getPublicSubsidiaries();
        console.log('📦 Raw API response:', data);
        
        let allSubsidiaries = Array.isArray(data) ? data : (data?.results || []);
        console.log('📋 All subsidiaries count:', allSubsidiaries.length);
        
        // Debug: Log all subsidiaries to see their structure
        allSubsidiaries.forEach((sub, index) => {
          console.log(`🔍 Subsidiary ${index + 1}:`, {
            name: sub.name,
            id: sub.id,
            parent_company_id: sub.parent_company_id,
            parent_company: sub.parent_company,
            parent_company_id_type: typeof sub.parent_company_id,
            parent_company_obj_id: sub.parent_company?.id,
            parent_company_obj_id_type: typeof sub.parent_company?.id
          });
        });
        
        let subsidiaryList = [];
        
        // Show all subsidiaries and log their complete structure
        console.log('🧪 Showing all subsidiaries and analyzing structure');
        subsidiaryList = allSubsidiaries;
        
        // Log complete structure of each subsidiary
        subsidiaryList.forEach((sub, index) => {
          console.log(`🔍 SUBSIDIARY ${index + 1} COMPLETE DATA:`, sub);
          console.log(`🔍 SUBSIDIARY ${index + 1} KEY FIELDS:`, {
            name: sub.name,
            id: sub.id,
            parent_company_id: sub.parent_company_id,
            parent_company: sub.parent_company,
            company_id: sub.company_id,
            owner_id: sub.owner_id,
            seller_id: sub.seller_id,
            user_id: sub.user_id,
            created_by: sub.created_by
          });
        });
        
        console.log('💾 Setting subsidiaries state:', subsidiaryList);
        setSubsidiaries(subsidiaryList);
      } catch (err) {
        console.error('❌ Error fetching subsidiaries:', err);
        setError(err.message);
        setSubsidiaries([]);
      } finally {
        setLoading(false);
      }
    };

    console.log('📞 About to call fetchSubsidiaries()');
    fetchSubsidiaries();
  }, [parentCompanyId, parentCompanyName]); // Added back dependency array to prevent infinite loop

  const handleVisitSubsidiary = (subsidiary) => {
    console.log('Navigating to subsidiary:', subsidiary);
    console.log('Subsidiary slug:', subsidiary.slug);
    
    // Ensure we have a slug
    if (!subsidiary.slug) {
      console.error('No slug found for subsidiary:', subsidiary);
      return;
    }
    
    // Navigate to subsidiary company page using slug
    navigate(`/subsidiary/${subsidiary.slug}`, {
      state: {
        from: window.location.pathname,
        subsidiaryInfo: subsidiary,
        parentCompany: { id: parentCompanyId, name: parentCompanyName }
      }
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-md shadow-sm border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-200 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-blue-600">Our Subsidiary Companies</h2>
        </div>
        <div className="p-5">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-24 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-md shadow-sm border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-200 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-blue-600">Our Subsidiary Companies</h2>
        </div>
        <div className="p-5">
          <div className="text-center text-red-600">
            <p>Failed to load subsidiary companies: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Always show the section, even if no subsidiaries

  return (
    <div className="bg-white rounded-md shadow-sm border border-slate-200">
      <div className="px-5 py-3 border-b border-slate-200 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-blue-600">Our Subsidiary Companies</h2>
        <p className="text-sm text-slate-600 mt-1">
          Explore our family of companies and their specialized services
        </p>
      </div>
      <div className="p-5">
        {console.log('Rendering with subsidiaries:', subsidiaries, 'Length:', subsidiaries.length)}
        {subsidiaries.length > 0 && console.log('🏗️ RENDER: All subsidiaries with key fields:', 
          subsidiaries.map((sub, index) => ({
            index: index + 1,
            name: sub.name,
            id: sub.id,
            parent_company_id: sub.parent_company_id,
            owner_id: sub.owner_id,
            seller_id: sub.seller_id,
            user_id: sub.user_id,
            created_by: sub.created_by,
            company_id: sub.company_id,
            parent_company: sub.parent_company
          }))
        )}
        {subsidiaries.length === 0 ? (
          // Empty state - no subsidiaries
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
        ) : (
          // Show subsidiaries list
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
                    {subsidiary.target_market && (
                      <span className="bg-slate-100 px-2 py-1 rounded">
                        {subsidiary.target_market}
                      </span>
                    )}
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
        )}
        
        {/* Call to Action - only show if there are subsidiaries */}
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
      </div>
    </div>
  );
};

export default SubsidiaryCompanies;
