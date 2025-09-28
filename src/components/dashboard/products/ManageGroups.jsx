import React, { useState, useEffect } from 'react';
import { 
  listProductGroups, 
  getProductGroup,
  createProductGroup, 
  updateProductGroup, 
  deleteProductGroup, 
  addProductToGroup, 
  removeProductFromGroup,
  listMyProducts 
} from '../../../services/productApi';

const ManageGroups = () => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 0,
    is_active: true,
    is_featured: false
  });

  // Main state
  const [groups, setGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupToDelete, setGroupToDelete] = useState(null);

  // Product management state
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadGroups();
    loadProducts();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await listProductGroups();
      const groupsData = Array.isArray(response) ? response : response?.results || [];
      console.log('📦 Loaded groups:', groupsData);
      setGroups(groupsData);
    } catch (err) {
      setError('Failed to load product groups: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await listMyProducts({ page_size: 100 });
      setProducts(Array.isArray(response) ? response : response?.results || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const newGroup = await createProductGroup(formData);
      
      // Add the new group to local state immediately
      const groupWithDefaults = {
        ...newGroup,
        products: [],
        product_count: 0
      };
      setGroups(prevGroups => [...prevGroups, groupWithDefaults]);
      
      setSuccess('Product group created successfully!');
      setFormData({
        name: '',
        description: '',
        display_order: 0,
        is_active: true,
        is_featured: false
      });
      setShowCreateModal(false);
      
      // Refresh in background to get complete data
      loadGroups();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create group: ' + err.message);
    }
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const updatedGroup = await updateProductGroup(editingGroup.id, formData);
      
      // Update the group in local state immediately
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === editingGroup.id 
            ? { ...group, ...updatedGroup, ...formData }
            : group
        )
      );
      
      setSuccess('Product group updated successfully!');
      setShowEditModal(false);
      setEditingGroup(null);
      
      // Refresh in background to get complete data
      loadGroups();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update group: ' + err.message);
    }
  };

  const openDeleteModal = (group) => {
    setGroupToDelete(group);
    setShowDeleteModal(true);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    
    try {
      setError('');
      await deleteProductGroup(groupToDelete.id);
      
      // Remove the group from local state immediately
      setGroups(prevGroups => 
        prevGroups.filter(group => group.id !== groupToDelete.id)
      );
      
      setSuccess('Product group deleted successfully!');
      setShowDeleteModal(false);
      setGroupToDelete(null);
      
      // Refresh in background to sync with server
      loadGroups();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete group: ' + err.message);
    }
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      display_order: group.display_order || 0,
      is_active: group.is_active !== false,
      is_featured: group.is_featured || false
    });
    setShowEditModal(true);
  };

  const openProductModal = async (group) => {
    try {
      setSelectedGroup(group);
      setShowProductModal(true);
      
      // Fetch detailed group information with products
      console.log('🔍 Fetching group details for:', group.id);
      const groupDetails = await getProductGroup(group.id);
      console.log('📋 Group details received:', groupDetails);
      
      // Update selected group with detailed info
      setSelectedGroup(groupDetails);
      
      // Set selected products based on the group's current products
      const currentProductIds = groupDetails.products?.map(p => p.id) || [];
      console.log('✅ Current products in group:', currentProductIds);
      setSelectedProducts(currentProductIds);
      
    } catch (err) {
      console.error('Failed to load group details:', err);
      // Fallback to basic group info
      setSelectedProducts(group.products?.map(p => p.id) || []);
    }
  };

  const handleProductToggle = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSaveProducts = async () => {
    try {
      setError('');
      const currentProductIds = selectedGroup.products?.map(p => p.id) || [];
      
      console.log('💾 Saving products...');
      console.log('Current products in group:', currentProductIds);
      console.log('Selected products:', selectedProducts);
      
      // Add new products
      const toAdd = selectedProducts.filter(id => !currentProductIds.includes(id));
      console.log('Products to add:', toAdd);
      
      for (const productId of toAdd) {
        console.log(`➕ Adding product ${productId} to group ${selectedGroup.id}`);
        await addProductToGroup(selectedGroup.id, productId);
      }
      
      // Remove products
      const toRemove = currentProductIds.filter(id => !selectedProducts.includes(id));
      console.log('Products to remove:', toRemove);
      
      for (const productId of toRemove) {
        console.log(`➖ Removing product ${productId} from group ${selectedGroup.id}`);
        await removeProductFromGroup(selectedGroup.id, productId);
      }
      
      // Update the local groups state immediately with new product count
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === selectedGroup.id 
            ? { 
                ...group, 
                product_count: selectedProducts.length,
                products: selectedProducts.map(id => ({ id })) // Create minimal product objects
              }
            : group
        )
      );
      
      setSuccess('Products updated successfully!');
      setShowProductModal(false);
      
      // Also refresh the groups list in the background to get complete data
      loadGroups();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving products:', err);
      setError('Failed to update products: ' + err.message);
    }
  };

  const filteredProducts = products.filter(product =>
    product.product_name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.title?.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Product Groups</h1>
          <div className="flex gap-3">
            <button
              onClick={loadGroups}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              title="Refresh groups"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Group
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Groups Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading product groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Product Groups</h3>
              <p className="text-gray-500 mb-4">Create your first product group to organize your products.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Create Group
              </button>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Group Name</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Description</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Products</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Order</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {groups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{group.name}</span>
                        {group.is_featured && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 max-w-xs truncate">
                      {group.description || 'No description'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                          {group.products?.length || group.product_count || 0} products
                        </span>
                        {(group.products?.length > 0 || group.product_count > 0) && (
                          <button
                            onClick={() => openProductModal(group)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                            title="View products"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{group.display_order || 0}</td>
                    <td className="p-4">
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        group.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {group.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openProductModal(group)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          title="Manage Products"
                        >
                          Products
                        </button>
                        <button
                          onClick={() => openEditModal(group)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(group)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 my-8 flex flex-col max-h-[calc(100vh-4rem)]">
              {/* Enhanced Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Create New Product Group</h3>
                    <p className="text-green-100 text-sm">Organize your products into manageable groups</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)} 
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
                <form onSubmit={handleCreateGroup} className="space-y-6">
                  {/* Group Information Section */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Group Information</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Group Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                          placeholder="Enter group name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm resize-none"
                          placeholder="Enter group description"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                        <input
                          type="number"
                          name="display_order"
                          value={formData.display_order}
                          onChange={handleInputChange}
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          Group Active
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            name="is_featured"
                            checked={formData.is_featured}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          Featured Group
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 hover:shadow-lg transition-all duration-200"
                      >
                        Create Group
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Group Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
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
                    <h3 className="text-xl font-bold text-white">Edit Product Group</h3>
                    <p className="text-blue-100 text-sm">Update group information and settings</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)} 
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
                <form onSubmit={handleEditGroup} className="space-y-6">
                  {/* Group Information Section */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Group Information</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Group Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                          placeholder="Enter group name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm resize-none"
                          placeholder="Enter group description"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                        <input
                          type="number"
                          name="display_order"
                          value={formData.display_order}
                          onChange={handleInputChange}
                          className="w-full h-12 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          Group Active
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            name="is_featured"
                            checked={formData.is_featured}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          Featured Group
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
                      >
                        Update Group
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Manage Products Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Manage Products for "{selectedGroup?.name}"
                  </h3>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 flex-1 overflow-hidden flex flex-col">
                {/* Search */}
                <div className="mb-4 flex-shrink-0">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Products List */}
                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-2">No products found</p>
                      <p className="text-gray-500">Try adjusting your search terms</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <label key={product.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleProductToggle(product.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                          />
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {product.product_name || product.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {product.id}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSaveProducts}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Product Group</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the group "{groupToDelete?.name}"? This will remove the group and all its product associations.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteGroup}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Delete Group
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setGroupToDelete(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageGroups;
