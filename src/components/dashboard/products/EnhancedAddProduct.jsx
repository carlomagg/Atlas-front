import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createProductWithMedia, buildCreateWithMediaPayload, listCategories } from "../../../services/productApi";
import { useFeatureEnforcement, useFeatureLimit } from "../../../hooks/useFeatureEnforcement";
import FeatureEnforcedButton from "../../common/FeatureEnforcedButton";

/**
 * Enhanced Product Form with Feature Enforcement
 * Demonstrates integration of subscription-based feature limits
 */
export default function EnhancedAddProduct() {
  const navigate = useNavigate();
  const { canUploadProduct, showUpgradePrompt } = useFeatureEnforcement();
  
  // Feature limit check for product uploads
  const { 
    loading: checkingLimits, 
    allowed: canUpload, 
    message: limitMessage, 
    usage: currentProducts, 
    limit: maxProducts, 
    remaining: remainingProducts 
  } = useFeatureLimit('max_listings');

  const [form, setForm] = useState({
    category: "",
    title: "",
    type: "",
    description: "",
    price: "",
    currency: "NGN",
    availability: "in_stock",
    is_featured: false
  });

  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle upgrade prompt
  const handleUpgradePrompt = (message, featureName) => {
    showNotification(
      `${message} Click here to upgrade your subscription for more ${featureName === 'max_listings' ? 'product listings' : 'features'}.`,
      'warning'
    );
    
    // Navigate to subscription page after a delay
    setTimeout(() => {
      navigate('/dashboard/payment-platform?section=subscriptions');
    }, 3000);
  };

  // Handle form submission with feature enforcement
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check feature limit before proceeding
    const uploadCheck = await canUploadProduct();
    if (!uploadCheck.canUpload) {
      showUpgradePrompt(uploadCheck.message, 'max_listings');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Build payload and submit
      const payload = buildCreateWithMediaPayload(form, images, []);
      const result = await createProductWithMedia(payload);

      if (result) {
        showNotification('Product created successfully!', 'success');
        setTimeout(() => {
          navigate('/dashboard/products');
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      showNotification('Failed to create product. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files].slice(0, 10)); // Limit to 10 images
  };

  // Remove image
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  if (checkingLimits) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Checking subscription limits...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4 ${
          notification.type === 'success' ? 'border-green-500' : 
          notification.type === 'error' ? 'border-red-500' : 
          notification.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
        }`}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${
              notification.type === 'success' ? 'text-green-500' : 
              notification.type === 'error' ? 'text-red-500' : 
              notification.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={notification.type === 'success' ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : 
                     notification.type === 'error' ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" :
                     "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"} />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${
                notification.type === 'success' ? 'text-green-800' : 
                notification.type === 'error' ? 'text-red-800' : 
                notification.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
              }`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Feature Limit Status */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Product Upload Status</h3>
            <p className="text-blue-700">
              You have used <span className="font-bold">{currentProducts}</span> of <span className="font-bold">{maxProducts}</span> product listings
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{remainingProducts}</div>
            <div className="text-sm text-blue-600">Remaining</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              (currentProducts / maxProducts) >= 0.9 ? 'bg-red-500' : 
              (currentProducts / maxProducts) >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((currentProducts / maxProducts) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Restriction Warning */}
      {!canUpload && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-yellow-800 font-semibold">Upload Limit Reached</h4>
              <p className="text-yellow-700">{limitMessage}</p>
            </div>
            <button
              onClick={() => handleUpgradePrompt(limitMessage, 'max_listings')}
              className="ml-4 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Product Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!canUpload}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!canUpload}
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canUpload}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canUpload}
              >
                <option value="NGN">Nigerian Naira (₦)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!canUpload}
            />
            
            {/* Image previews */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button with Feature Enforcement */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/products')}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <FeatureEnforcedButton
              featureName="max_listings"
              currentUsage={currentProducts}
              onClick={handleSubmit}
              onUpgrade={handleUpgradePrompt}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              loadingText="Checking limits..."
              restrictedText="Upgrade to Upload"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Product...
                </>
              ) : (
                'Create Product'
              )}
            </FeatureEnforcedButton>
          </div>
        </form>
      </div>
    </div>
  );
}
