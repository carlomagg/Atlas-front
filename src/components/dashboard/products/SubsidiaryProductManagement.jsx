import React, { useState, useEffect } from 'react';
import { getMySubsidiaries } from '../../../services/subsidiaryApi';
import { listMyProducts, deleteProduct, updateProduct, retrieveProduct } from '../../../services/productApi';

// API functions for subsidiary product management
const subsidiaryProductApi = {
  // Get subsidiary products for management
  getSubsidiaryProducts: async (subsidiarySlug, params = {}) => {
    const queryParams = new URLSearchParams({
      status: 'ALL', // Show all products for management
      ...params
    });
    const response = await fetch(`/api/companies/subsidiaries/${subsidiarySlug}/manage/products/?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch subsidiary products');
    return response.json();
  },

  // Move product to subsidiary
  moveProductToSubsidiary: async (subsidiarySlug, productId) => {
    const response = await fetch(`/api/companies/subsidiaries/${subsidiarySlug}/manage/products/${productId}/move/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to move product to subsidiary');
    return response.json();
  },

  // Remove product from subsidiary
  removeProductFromSubsidiary: async (subsidiarySlug, productId) => {
    const response = await fetch(`/api/companies/subsidiaries/${subsidiarySlug}/manage/products/${productId}/remove/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to remove product from subsidiary');
    return response.json();
  },

  // Bulk move products to subsidiary
  bulkMoveProducts: async (subsidiarySlug, productIds) => {
    const response = await fetch(`/api/companies/subsidiaries/${subsidiarySlug}/manage/products/bulk-move/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ product_ids: productIds })
    });
    if (!response.ok) throw new Error('Failed to bulk move products');
    return response.json();
  }
};

const SubsidiaryProductManagement = () => {
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState('');
  const [subsidiaryProducts, setSubsidiaryProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [activeView, setActiveView] = useState('manage'); // 'manage' or 'move'
  const [editModal, setEditModal] = useState({
    open: false,
    loading: false,
    product: null,
    title: '',
    product_type: '',
    description: '',
    is_featured: false
  });
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    message: '',
    onConfirm: null
  });

  // Load subsidiaries on mount
  useEffect(() => {
    loadSubsidiaries();
  }, []);

  // Load subsidiary products when subsidiary is selected
  useEffect(() => {
    if (selectedSubsidiary) {
      loadSubsidiaryProducts();
    }
  }, [selectedSubsidiary]);

  const loadSubsidiaries = async () => {
    try {
      const data = await getMySubsidiaries();
      const subsidiaryList = Array.isArray(data) ? data : (data?.results || []);
      setSubsidiaries(subsidiaryList);
      if (subsidiaryList.length > 0 && !selectedSubsidiary) {
        setSelectedSubsidiary(subsidiaryList[0].slug);
      }
    } catch (err) {
      console.error('Failed to load subsidiaries:', err);
      setError('Failed to load subsidiaries');
    }
  };

  const loadSubsidiaryProducts = async () => {
    if (!selectedSubsidiary) return;
    
    try {
      setLoading(true);
      const data = await subsidiaryProductApi.getSubsidiaryProducts(selectedSubsidiary);
      const products = Array.isArray(data) ? data : (data?.results || []);
      
      // Debug logging to see the actual API response structure
      console.log('Subsidiary products API response:', data);
      if (products.length > 0) {
        console.log('First product structure:', products[0]);
        console.log('Category info:', {
          category: products[0].category,
          category_name: products[0].category_name,
          category_info: products[0].category_info,
          category_id: products[0].category_id
        });
        console.log('Brand info:', {
          brand_info: products[0].brand_info,
          subsidiary_info: products[0].subsidiary_info,
          seller_info: products[0].seller_info
        });
      }
      
      setSubsidiaryProducts(products);
    } catch (err) {
      console.error('Failed to load subsidiary products:', err);
      setError('Failed to load subsidiary products');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableProducts = async () => {
    try {
      setLoading(true);
      const data = await listMyProducts();
      // Filter out products that are already in the selected subsidiary
      const available = (Array.isArray(data) ? data : (data?.results || []))
        .filter(product => !product.subsidiary || product.subsidiary.slug !== selectedSubsidiary);
      setAvailableProducts(available);
    } catch (err) {
      console.error('Failed to load available products:', err);
      setError('Failed to load available products');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveProduct = async (productId) => {
    if (!selectedSubsidiary) return;
    
    try {
      await subsidiaryProductApi.moveProductToSubsidiary(selectedSubsidiary, productId);
      await loadSubsidiaryProducts();
      await loadAvailableProducts();
      setError('');
    } catch (err) {
      setError(`Failed to move product: ${err.message}`);
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!selectedSubsidiary) return;
    
    try {
      await subsidiaryProductApi.removeProductFromSubsidiary(selectedSubsidiary, productId);
      await loadSubsidiaryProducts();
      setError('');
    } catch (err) {
      setError(`Failed to remove product: ${err.message}`);
    }
  };

  const handleBulkMove = async () => {
    if (!selectedSubsidiary || selectedProductIds.length === 0) return;
    
    try {
      await subsidiaryProductApi.bulkMoveProducts(selectedSubsidiary, selectedProductIds);
      await loadSubsidiaryProducts();
      await loadAvailableProducts();
      setSelectedProductIds([]);
      setError('');
    } catch (err) {
      setError(`Failed to bulk move products: ${err.message}`);
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleEditProduct = async (product) => {
    try {
      // Fetch full product details
      const fullProduct = await retrieveProduct(product.id);
      setEditModal({
        open: true,
        loading: false,
        product: fullProduct,
        title: fullProduct.title || '',
        product_type: fullProduct.product_type || '',
        description: fullProduct.description || '',
        is_featured: fullProduct.is_featured || false
      });
    } catch (err) {
      setError(`Failed to load product details: ${err.message}`);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editModal.product) return;
    
    try {
      setEditModal(prev => ({ ...prev, loading: true }));
      await updateProduct(editModal.product.id, {
        title: editModal.title,
        product_type: editModal.product_type,
        description: editModal.description,
        is_featured: editModal.is_featured
      }, { partial: true });
      
      await loadSubsidiaryProducts();
      setEditModal({
        open: false,
        loading: false,
        product: null,
        title: '',
        product_type: '',
        description: '',
        is_featured: false
      });
      setError('');
    } catch (err) {
      setError(`Failed to update product: ${err.message}`);
      setEditModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteProduct = async (productId) => {
    setConfirmModal({
      open: true,
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteProduct(productId);
          await loadSubsidiaryProducts();
          setConfirmModal({ open: false, message: '', onConfirm: null });
          setError('');
        } catch (err) {
          setError(`Failed to delete product: ${err.message}`);
          setConfirmModal({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  if (subsidiaries.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Subsidiaries Found</h3>
        <p className="text-gray-600 mb-4">
          You need to create subsidiaries before you can manage their products.
        </p>
        <button
          onClick={() => window.location.assign('/dashboard/contact-info/subsidiaries')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
        >
          Create Subsidiaries
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subsidiary Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Subsidiary</h3>
        <select
          value={selectedSubsidiary}
          onChange={(e) => setSelectedSubsidiary(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Choose a subsidiary...</option>
          {subsidiaries.map(subsidiary => (
            <option key={subsidiary.slug} value={subsidiary.slug}>
              {subsidiary.name}
            </option>
          ))}
        </select>
      </div>

      {selectedSubsidiary && (
        <>
          {/* View Toggle */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveView('manage')}
              className={`pb-2 px-1 font-medium ${
                activeView === 'manage'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Manage Products
            </button>
            <button
              onClick={() => {
                setActiveView('move');
                loadAvailableProducts();
              }}
              className={`pb-2 px-1 font-medium ${
                activeView === 'move'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Move Products
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Manage Products View */}
          {activeView === 'manage' && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Products in {subsidiaries.find(s => s.slug === selectedSubsidiary)?.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manage products currently assigned to this subsidiary
                </p>
              </div>
              
              {loading ? (
                <div className="p-6 text-center text-gray-500">Loading products...</div>
              ) : subsidiaryProducts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No products found in this subsidiary
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-700">Product</th>
                        <th className="text-left p-4 font-medium text-gray-700">Brand/Owner</th>
                        <th className="text-left p-4 font-medium text-gray-700">Status</th>
                        <th className="text-left p-4 font-medium text-gray-700">Category</th>
                        <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {subsidiaryProducts.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <div className="font-medium text-gray-900">{product.title}</div>
                            <div className="text-sm text-gray-500">{product.product_type}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-900">
                              {product.brand_info?.name || product.subsidiary_info?.name || product.seller_info?.company_name || 'Main Company'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.brand_info?.name ? 'Subsidiary Brand' : 'Main Company'}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              product.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {product.status}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-900">
                            {product.category?.name || 
                             product.category_name || 
                             product.category_info?.name ||
                             (product.category_id ? `Category ID: ${product.category_id}` : 'Uncategorized')}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => handleRemoveProduct(product.id)}
                                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                              >
                                Remove from Subsidiary
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Move Products View */}
          {activeView === 'move' && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Move Products to {subsidiaries.find(s => s.slug === selectedSubsidiary)?.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Select products from your main company to move to this subsidiary
                </p>
                {selectedProductIds.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={handleBulkMove}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Move {selectedProductIds.length} Selected Products
                    </button>
                  </div>
                )}
              </div>
              
              {loading ? (
                <div className="p-6 text-center text-gray-500">Loading available products...</div>
              ) : availableProducts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No available products to move
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.length === availableProducts.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds(availableProducts.map(p => p.id));
                              } else {
                                setSelectedProductIds([]);
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="text-left p-4 font-medium text-gray-700">Product</th>
                        <th className="text-left p-4 font-medium text-gray-700">Status</th>
                        <th className="text-left p-4 font-medium text-gray-700">Category</th>
                        <th className="text-left p-4 font-medium text-gray-700">Current Location</th>
                        <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {availableProducts.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(product.id)}
                              onChange={() => toggleProductSelection(product.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-900">{product.title}</div>
                            <div className="text-sm text-gray-500">{product.product_type}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              product.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {product.status}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-900">
                            {product.category?.name || 
                             product.category_name || 
                             product.category_info?.name ||
                             (product.category_id ? `Category ID: ${product.category_id}` : 'Uncategorized')}
                          </td>
                          <td className="p-4 text-sm text-gray-900">
                            {product.brand_info?.name || 
                             product.subsidiary_info?.name || 
                             product.subsidiary?.name || 
                             'Main Company'}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleMoveProduct(product.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Move to Subsidiary
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit Product Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditModal({ open: false, loading: false, product: null, title: '', product_type: '', description: '', is_featured: false })} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 my-8 flex flex-col max-h-[calc(100vh-4rem)]">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Edit Subsidiary Product</h3>
                  <p className="text-blue-100 text-sm">Update product information for subsidiary brand</p>
                </div>
              </div>
              <button 
                onClick={() => setEditModal({ open: false, loading: false, product: null, title: '', product_type: '', description: '', is_featured: false })} 
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
              {/* Product Information Section */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Product Information</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Title *</label>
                    <input
                      type="text"
                      value={editModal.title}
                      onChange={(e) => setEditModal(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                      placeholder="Enter product title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                    <input
                      type="text"
                      value={editModal.product_type}
                      onChange={(e) => setEditModal(prev => ({ ...prev, product_type: e.target.value }))}
                      className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                      placeholder="e.g., Electronics, Machinery"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
                    <textarea
                      value={editModal.description}
                      onChange={(e) => setEditModal(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm resize-none"
                      placeholder="Describe your product in detail..."
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        id="is_featured"
                        checked={editModal.is_featured}
                        onChange={(e) => setEditModal(prev => ({ ...prev, is_featured: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Mark as Featured Product
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mt-6">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setEditModal({ open: false, loading: false, product: null, title: '', product_type: '', description: '', is_featured: false })}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    disabled={editModal.loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProduct}
                    disabled={editModal.loading}
                    className="px-8 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editModal.loading ? 'Updating Product...' : 'Update Product'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-700 mb-4">{confirmModal.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmModal({ open: false, message: '', onConfirm: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmModal.onConfirm && confirmModal.onConfirm()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubsidiaryProductManagement;
