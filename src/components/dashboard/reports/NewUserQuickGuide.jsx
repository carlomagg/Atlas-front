import React, { useState, useEffect } from 'react';
import { 
  listPublishedQuickGuides, 
  getNewUserGuides, 
  getFeaturedGuides,
  getGuidesByType,
  searchGuides,
  incrementViewCount,
  incrementDownloadCount,
  getFileTypeIconType,
  getGuideTypeDisplayName,
  GUIDE_TYPES,
  FILE_TYPES
} from '../../../services/quickGuidesApi';

const NewUserQuickGuide = () => {
  const [guides, setGuides] = useState([]);
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [guideTypes, setGuideTypes] = useState([]);

  // Helper function to get file type icon
  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case FILE_TYPES.VIDEO:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case FILE_TYPES.IMAGE:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case FILE_TYPES.DOCUMENT:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case FILE_TYPES.AUDIO:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  // Load initial data
  useEffect(() => {
    loadGuides();
  }, []);

  // Filter guides when activeFilter or searchTerm changes
  useEffect(() => {
    filterGuides();
  }, [guides, activeFilter, searchTerm]);

  const loadGuides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all published guides
      const response = await listPublishedQuickGuides({
        ordering: 'order,created_at'
      });
      
      const guidesData = response?.results || response || [];
      setGuides(guidesData);
      
      // Extract unique guide types for filtering
      const types = [...new Set(guidesData.map(guide => guide.guide_type))];
      setGuideTypes(types);
      
    } catch (err) {
      console.error('Error loading quick guides:', err);
      setError('Failed to load quick guides. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterGuides = () => {
    let filtered = [...guides];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(guide => 
        guide.title?.toLowerCase().includes(search) ||
        guide.description?.toLowerCase().includes(search) ||
        guide.tags_list?.some(tag => tag.toLowerCase().includes(search))
      );
    }

    // Apply category filter
    switch (activeFilter) {
      case 'featured':
        filtered = filtered.filter(guide => guide.is_featured);
        break;
      case 'beginner':
        filtered = filtered.filter(guide => guide.is_beginner_friendly);
        break;
      case 'getting_started':
      case 'account_setup':
      case 'product_listing':
      case 'messaging':
      case 'payments':
      case 'agent_program':
      case 'business_verification':
      case 'troubleshooting':
      case 'faq':
        filtered = filtered.filter(guide => guide.guide_type === activeFilter);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    setFilteredGuides(filtered);
  };

  const handleGuideClick = async (guide) => {
    try {
      // Try to increment view count (may fail for unauthenticated users)
      await incrementViewCount(guide.id);
    } catch (err) {
      console.warn('Could not increment view count (user may not be authenticated):', err);
      // This is expected for unauthenticated users, so we don't show an error
    }
    // Always show the guide regardless of view count success/failure
    setSelectedGuide(guide);
  };

  const handleView = async (guide) => {
    try {
      // Try to increment view count (may fail for unauthenticated users)
      await incrementViewCount(guide.id);
    } catch (err) {
      console.warn('Could not increment view count (user may not be authenticated):', err);
      // This is expected for unauthenticated users, so we don't show an error
    }
    
    // Open file in new tab for viewing
    if (guide.file_url) {
      window.open(guide.file_url, '_blank');
    }
  };

  const handleDownload = async (guide) => {
    try {
      // Try to increment download count (may fail for unauthenticated users)
      await incrementDownloadCount(guide.id);
    } catch (err) {
      console.warn('Could not increment download count (user may not be authenticated):', err);
      // This is expected for unauthenticated users, so we don't show an error
    }
    
    // Force download by creating a temporary link with download attribute
    if (guide.file_url) {
      const link = document.createElement('a');
      link.href = guide.file_url;
      link.download = guide.title || 'guide-file';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const closeModal = () => {
    setSelectedGuide(null);
  };

  const getFileTypeColor = (fileType) => {
    switch (fileType) {
      case FILE_TYPES.VIDEO:
        return 'text-red-600 bg-red-50';
      case FILE_TYPES.IMAGE:
        return 'text-green-600 bg-green-50';
      case FILE_TYPES.DOCUMENT:
        return 'text-blue-600 bg-blue-50';
      case FILE_TYPES.AUDIO:
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getGuideTypeColor = (guideType) => {
    const colors = {
      [GUIDE_TYPES.GETTING_STARTED]: 'bg-green-100 text-green-800',
      [GUIDE_TYPES.ACCOUNT_SETUP]: 'bg-blue-100 text-blue-800',
      [GUIDE_TYPES.PRODUCT_LISTING]: 'bg-purple-100 text-purple-800',
      [GUIDE_TYPES.MESSAGING]: 'bg-yellow-100 text-yellow-800',
      [GUIDE_TYPES.PAYMENTS]: 'bg-red-100 text-red-800',
      [GUIDE_TYPES.AGENT_PROGRAM]: 'bg-indigo-100 text-indigo-800',
      [GUIDE_TYPES.BUSINESS_VERIFICATION]: 'bg-pink-100 text-pink-800',
      [GUIDE_TYPES.TROUBLESHOOTING]: 'bg-orange-100 text-orange-800',
      [GUIDE_TYPES.FAQ]: 'bg-teal-100 text-teal-800',
      [GUIDE_TYPES.OTHER]: 'bg-gray-100 text-gray-800'
    };
    
    return colors[guideType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Guides</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadGuides}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">New User Quick Guides</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Welcome to Atlas-WD! These guides will help you get started and make the most of our platform.
          </p>

          {/* Search Bar */}
          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search guides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">All Guides ({guides.length})</span>
              <span className="sm:hidden">All ({guides.length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('featured')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeFilter === 'featured'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">⭐ Featured</span>
              <span className="sm:hidden">⭐</span>
            </button>
            <button
              onClick={() => setActiveFilter('beginner')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeFilter === 'beginner'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">🔰 Beginner Friendly</span>
              <span className="sm:hidden">🔰</span>
            </button>
            <button
              onClick={() => setActiveFilter('getting_started')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeFilter === 'getting_started'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">🚀 Getting Started</span>
              <span className="sm:hidden">🚀</span>
            </button>
          </div>
        </div>

        {/* Guides Grid */}
        {filteredGuides.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Guides Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms or filters.' : 'No guides are available at the moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredGuides.map((guide) => (
              <div
                key={guide.id}
                className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                onClick={() => handleGuideClick(guide)}
              >
                {/* Guide Header */}
                <div className="mb-3 sm:mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 
                      className="text-sm sm:text-lg font-semibold text-gray-900 flex-1 pr-2"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                        hyphens: 'auto'
                      }}
                    >
                      {guide.title}
                    </h3>
                    {guide.is_featured && (
                      <span className="text-yellow-500 flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p 
                    className="text-xs sm:text-sm text-gray-600 break-words"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      wordBreak: 'break-word',
                      hyphens: 'auto'
                    }}
                  >
                    {guide.description}
                  </p>
                </div>

                {/* Guide Metadata */}
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                  <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getGuideTypeColor(guide.guide_type)}`}>
                    <span className="hidden sm:inline">{guide.guide_type_display || getGuideTypeDisplayName(guide.guide_type)}</span>
                    <span className="sm:hidden">{(guide.guide_type_display || getGuideTypeDisplayName(guide.guide_type)).split(' ')[0]}</span>
                  </span>
                  {guide.is_beginner_friendly && (
                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="hidden sm:inline">Beginner Friendly</span>
                      <span className="sm:hidden">Beginner</span>
                    </span>
                  )}
                  {guide.file_type && (
                    <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getFileTypeColor(guide.file_type)}`}>
                      <span className="mr-1">{getFileTypeIcon(guide.file_type)}</span>
                      <span className="hidden sm:inline">{guide.file_type_display || guide.file_type.charAt(0).toUpperCase() + guide.file_type.slice(1)}</span>
                    </span>
                  )}
                </div>

                {/* Guide Stats */}
                <div className="space-y-3">
                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="whitespace-nowrap">{guide.view_count || 0} views</span>
                    </span>
                    <span className="text-xs whitespace-nowrap">Order: {guide.order || 0}</span>
                  </div>
                  
                  {/* Action Buttons Row */}
                  {guide.file_url && (
                    <div className="flex items-center justify-center space-x-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(guide);
                        }}
                        className="flex items-center justify-center px-2.5 sm:px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-md text-xs font-medium transition-colors min-w-0 flex-1"
                        title="View Guide"
                      >
                        <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="truncate">View</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(guide);
                        }}
                        className="flex items-center justify-center px-2.5 sm:px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-xs font-medium transition-colors min-w-0 flex-1"
                        title="Download Guide"
                      >
                        <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">Download</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Guide Detail Modal */}
        {selectedGuide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 pr-2">
                      {selectedGuide.title}
                    </h2>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGuideTypeColor(selectedGuide.guide_type)}`}>
                        {selectedGuide.guide_type_display || getGuideTypeDisplayName(selectedGuide.guide_type)}
                      </span>
                      {selectedGuide.is_featured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⭐ Featured
                        </span>
                      )}
                      {selectedGuide.is_beginner_friendly && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          🔰 Beginner Friendly
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="ml-2 sm:ml-4 text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600">{selectedGuide.description}</p>
                  </div>

                  {selectedGuide.tags_list && selectedGuide.tags_list.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedGuide.tags_list.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {selectedGuide.view_count || 0} views
                      </span>
                      {selectedGuide.created_at && (
                        <span>
                          Created: {new Date(selectedGuide.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {selectedGuide.file_url && (
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => handleView(selectedGuide)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center text-sm sm:text-base min-w-0 flex-1 sm:flex-initial whitespace-nowrap"
                        >
                          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="truncate">View Guide</span>
                        </button>
                        <button
                          onClick={() => handleDownload(selectedGuide)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-sm sm:text-base min-w-0 flex-1 sm:flex-initial whitespace-nowrap"
                        >
                          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="truncate">Download Guide</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewUserQuickGuide;
