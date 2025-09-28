import React, { useState, useEffect } from 'react';
import { getMySubsidiaries, createSubsidiary, updateSubsidiary, deleteSubsidiary } from '../../services/subsidiaryApi';
import { resolveMediaUrl } from '../../utils/media';

const CompanySubsidiaries = () => {
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubsidiary, setEditingSubsidiary] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info'); // 'success', 'error', 'info', 'warning'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tagline: '',
    target_market: '',
    brand_story: '',
    brand_values: '',
    email: '',
    phone: '',
    website: '',
    street_address: '',
    address_city: '',
    address_state: '',
    address_country: '',
    postal_code: '',
    is_featured: false,
    is_active: true
  });
  const [imageFiles, setImageFiles] = useState({
    logo: null,
    cover_image: null,
    brand_image: null
  });
  const [imagePreviews, setImagePreviews] = useState({
    logo: null,
    cover_image: null,
    brand_image: null
  });

  const fetchSubsidiaries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMySubsidiaries();
      console.log('My subsidiaries response:', data);
      setSubsidiaries(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error('Error fetching subsidiaries:', err);
      setError(err.message);
      
      // Mock data for development
      const mockSubsidiaries = [
        {
          id: 1,
          name: 'Atlas Tech Solutions',
          slug: 'atlas-tech-solutions',
          tagline: 'Innovation at its finest',
          description: 'Technology and software development services',
          logo_url: '/images/img_image_2.png',
          target_market: 'B2B Technology Solutions',
          product_count: 25,
          is_featured: true,
          is_active: true
        },
        {
          id: 2,
          name: 'Atlas Manufacturing Ltd',
          slug: 'atlas-manufacturing',
          tagline: 'Quality manufacturing solutions',
          description: 'Industrial manufacturing and production',
          logo_url: '/images/img_image_3.png',
          target_market: 'Industrial Manufacturing',
          product_count: 18,
          is_featured: false,
          is_active: true
        }
      ];
      setSubsidiaries(mockSubsidiaries);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (imageType, file) => {
    if (file) {
      setImageFiles(prev => ({ ...prev, [imageType]: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => ({ ...prev, [imageType]: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (imageType) => {
    setImageFiles(prev => ({ ...prev, [imageType]: null }));
    setImagePreviews(prev => ({ ...prev, [imageType]: null }));
  };

  const handleAddSubsidiary = () => {
    setEditingSubsidiary(null);
    setFormData({
      name: '',
      description: '',
      tagline: '',
      target_market: '',
      brand_story: '',
      brand_values: '',
      email: '',
      phone: '',
      website: '',
      street_address: '',
      address_city: '',
      address_state: '',
      address_country: '',
      postal_code: '',
      is_featured: false,
      is_active: true
    });
    setImageFiles({
      logo: null,
      cover_image: null,
      brand_image: null
    });
    setImagePreviews({
      logo: null,
      cover_image: null,
      brand_image: null
    });
    setShowAddModal(true);
  };

  const handleEditSubsidiary = (subsidiary) => {
    setEditingSubsidiary(subsidiary);
    setFormData({
      name: subsidiary.name || '',
      description: subsidiary.description || '',
      tagline: subsidiary.tagline || '',
      target_market: subsidiary.target_market || '',
      brand_story: subsidiary.brand_story || '',
      brand_values: subsidiary.brand_values || '',
      email: subsidiary.email || '',
      phone: subsidiary.phone || '',
      website: subsidiary.website || '',
      street_address: subsidiary.street_address || '',
      address_city: subsidiary.address_city || '',
      address_state: subsidiary.address_state || '',
      address_country: subsidiary.address_country || '',
      postal_code: subsidiary.postal_code || '',
      is_featured: subsidiary.is_featured || false,
      is_active: subsidiary.is_active !== undefined ? subsidiary.is_active : true
    });
    
    // Load existing images as previews
    setImagePreviews({
      logo: subsidiary.logo_url ? resolveMediaUrl(subsidiary.logo_url) : null,
      cover_image: subsidiary.cover_image_url ? resolveMediaUrl(subsidiary.cover_image_url) : null,
      brand_image: subsidiary.brand_image_url ? resolveMediaUrl(subsidiary.brand_image_url) : null
    });
    
    // Clear image files since we're editing existing data
    setImageFiles({
      logo: null,
      cover_image: null,
      brand_image: null
    });
    
    setShowAddModal(true);
  };

  const handleDeleteSubsidiary = async (subsidiary) => {
    if (!window.confirm(`Are you sure you want to delete "${subsidiary.name}"?`)) {
      return;
    }

    try {
      await deleteSubsidiary(subsidiary.slug);
      await fetchSubsidiaries(); // Refresh the list
      setAlertMessage('Subsidiary deleted successfully!');
      setAlertType('success');
    } catch (err) {
      console.error('Error deleting subsidiary:', err);
      setAlertMessage('Failed to delete subsidiary: ' + err.message);
      setAlertType('error');
    }
  };

  const handleSubmitSubsidiary = async (e) => {
    e.preventDefault();
    
    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      
      // Add image files
      Object.keys(imageFiles).forEach(imageType => {
        if (imageFiles[imageType]) {
          submitData.append(imageType, imageFiles[imageType]);
        }
      });
      
      if (editingSubsidiary) {
        // Update existing subsidiary
        await updateSubsidiary(editingSubsidiary.slug, submitData);
        setAlertMessage('Subsidiary updated successfully!');
        setAlertType('success');
      } else {
        // Create new subsidiary
        await createSubsidiary(submitData);
        setAlertMessage('Subsidiary created successfully!');
        setAlertType('success');
      }
      
      setShowAddModal(false);
      await fetchSubsidiaries(); // Refresh the list
    } catch (err) {
      console.error('Error saving subsidiary:', err);
      setAlertMessage('Failed to save subsidiary: ' + err.message);
      setAlertType('error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    if (alertMessage && alertType === 'success') {
      const timer = setTimeout(() => {
        setAlertMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage, alertType]);

  useEffect(() => {
    fetchSubsidiaries();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading subsidiaries</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Alert Messages */}
      {alertMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className={`mb-4 flex items-start gap-2 px-3 py-2 rounded border text-sm ${
            alertType === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            alertType === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            alertType === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="mt-0.5">{
              alertType === 'success' ? '✔' :
              alertType === 'error' ? '⚠' :
              alertType === 'warning' ? '⚠' :
              'ℹ'
            }</div>
            <div className="flex-1">{alertMessage}</div>
            <button className="text-xs opacity-60 hover:opacity-100" onClick={() => setAlertMessage('')}>✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Company Subsidiaries</h1>
        <p className="text-gray-600">
          Manage your company's subsidiary organizations and their information.
        </p>
      </div>

      {/* Add New Subsidiary Button */}
      <div className="mb-6">
        <button 
          onClick={handleAddSubsidiary}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Subsidiary
        </button>
      </div>

      {/* Subsidiaries List */}
      {subsidiaries.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No subsidiaries</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first subsidiary company.
          </p>
          <div className="mt-6">
            <button 
              onClick={handleAddSubsidiary}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Subsidiary
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {subsidiaries.map((subsidiary) => (
              <li key={subsidiary.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {subsidiary.logo_url ? (
                        <img
                          src={resolveMediaUrl(subsidiary.logo_url)}
                          alt={`${subsidiary.name} logo`}
                          className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-300 flex items-center justify-center">
                          <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">{subsidiary.name}</div>
                        {subsidiary.is_featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Featured
                          </span>
                        )}
                        {!subsidiary.is_active && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      {subsidiary.tagline && (
                        <div className="text-xs text-blue-600 font-medium">{subsidiary.tagline}</div>
                      )}
                      <div className="text-sm text-gray-500 mt-1">{subsidiary.description}</div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        {subsidiary.product_count !== undefined && (
                          <span>{subsidiary.product_count} products</span>
                        )}
                        {subsidiary.target_market && (
                          <span>Market: {subsidiary.target_market}</span>
                        )}
                        {subsidiary.slug && (
                          <span>Slug: {subsidiary.slug}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleEditSubsidiary(subsidiary)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteSubsidiary(subsidiary)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add/Edit Subsidiary Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 my-8 flex flex-col max-h-[calc(100vh-4rem)]">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {editingSubsidiary ? 'Edit Subsidiary Brand' : 'Create New Subsidiary Brand'}
                  </h3>
                  <p className="text-blue-100 text-sm">Manage your company's subsidiary brands and their visual identity</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-2 rounded-lg hover:bg-white/20 transition-colors" 
                aria-label="Close"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                  <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              
              <form id="subsidiary-form" onSubmit={handleSubmitSubsidiary} className="space-y-6">
                {/* Brand Information Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Brand Information</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subsidiary Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                          placeholder="e.g., Atlas Tech Solutions"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                        <input
                          type="text"
                          name="tagline"
                          value={formData.tagline}
                          onChange={handleInputChange}
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                          placeholder="e.g., Innovation at its finest"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm resize-none"
                        placeholder="Brief description of the subsidiary company"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Market</label>
                      <input
                        type="text"
                        name="target_market"
                        value={formData.target_market}
                        onChange={handleInputChange}
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                        placeholder="e.g., B2B Technology Solutions"
                      />
                    </div>
                  </div>
                </div>

                {/* Brand Visuals Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Brand Visuals</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Brand Logo</label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                        {imagePreviews.logo ? (
                          <div className="relative">
                            <img src={imagePreviews.logo} alt="Logo preview" className="w-full h-32 object-contain rounded" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeImage('logo');
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="pointer-events-none">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-600">Click to upload logo</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleImageChange('logo', e.target.files[0]);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Cover Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                        {imagePreviews.cover_image ? (
                          <div className="relative">
                            <img src={imagePreviews.cover_image} alt="Cover preview" className="w-full h-32 object-cover rounded" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeImage('cover_image');
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="pointer-events-none">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-600">Click to upload cover</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleImageChange('cover_image', e.target.files[0]);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Brand Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Brand Image</label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                        {imagePreviews.brand_image ? (
                          <div className="relative">
                            <img src={imagePreviews.brand_image} alt="Brand preview" className="w-full h-32 object-cover rounded" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeImage('brand_image');
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="pointer-events-none">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-600">Click to upload image</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleImageChange('brand_image', e.target.files[0]);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Brand Story & Values Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Brand Story & Values</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Brand Story</label>
                      <textarea
                        name="brand_story"
                        value={formData.brand_story}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm resize-none"
                        placeholder="Tell the story behind this subsidiary brand..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Brand Values</label>
                      <input
                        type="text"
                        name="brand_values"
                        value={formData.brand_values}
                        onChange={handleInputChange}
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                        placeholder="e.g., Innovation, Quality, Customer Success"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Contact Information</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                        placeholder="contact@subsidiary.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                        placeholder="+1-234-567-8900"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                        placeholder="https://subsidiary.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Address Information</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <input
                          type="text"
                          name="address_country"
                          value={formData.address_country}
                          onChange={handleInputChange}
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                          placeholder="e.g., United States"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State/Region</label>
                        <input
                          type="text"
                          name="address_state"
                          value={formData.address_state}
                          onChange={handleInputChange}
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                          placeholder="e.g., California"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          name="address_city"
                          value={formData.address_city}
                          onChange={handleInputChange}
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                          placeholder="e.g., San Francisco"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                        <input
                          type="text"
                          name="postal_code"
                          value={formData.postal_code}
                          onChange={handleInputChange}
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                          placeholder="e.g., 94102"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                      <input
                        type="text"
                        name="street_address"
                        value={formData.street_address}
                        onChange={handleInputChange}
                        className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                        placeholder="e.g., 123 Main Street, Suite 100"
                      />
                    </div>
                  </div>
                </div>

                {/* Settings Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Settings</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-3 block text-sm text-gray-700">
                        <span className="font-medium">Active subsidiary</span>
                        <span className="block text-gray-500">This subsidiary is active and visible to users</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-3 block text-sm text-gray-700">
                        <span className="font-medium">Featured subsidiary</span>
                        <span className="block text-gray-500">This subsidiary will be highlighted in displays and get priority placement</span>
                      </label>
                    </div>
                  </div>
                </div>

              </form>
              
              {/* Form Actions - Fixed at bottom */}
              <div className="flex justify-end space-x-3 pt-4 bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0 -mx-6 -mb-6 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="subsidiary-form"
                  className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {editingSubsidiary ? 'Update Subsidiary Brand' : 'Create Subsidiary Brand'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySubsidiaries;
