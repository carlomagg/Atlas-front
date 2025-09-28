import React, { useState, useEffect } from 'react';
import { fetchCategoriesForUpload } from '../../services/productApi';

const CategorySelector = ({ 
  value, 
  onChange, 
  onCategorySelect, 
  className = "", 
  required = false,
  disabled = false,
  placeholder = "Choose a category..."
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (value && categories.length > 0) {
      const category = categories.find(cat => cat.id === parseInt(value));
      setSelectedCategory(category);
    }
  }, [value, categories]);

  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetchCategoriesForUpload();
      const categoryData = response?.results || response || [];
      
      // Sort categories by level first (root categories first), then by name
      const sortedCategories = categoryData.sort((a, b) => {
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        return (a.name || '').localeCompare(b.name || '');
      });
      
      setCategories(sortedCategories);
    } catch (err) {
      console.error('Error fetching categories for upload:', err);
      setError(err?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setIsDropdownOpen(false);
    
    // Create synthetic event for form compatibility
    const syntheticEvent = {
      target: { value: category.id.toString() }
    };
    
    if (onChange) {
      onChange(syntheticEvent);
    }
    
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const formatCategoryDisplay = (category) => {
    // Use full_path if available, otherwise construct from name
    if (category.full_path) {
      return category.full_path;
    }
    return category.name || `Category ${category.id}`;
  };

  const formatSelectedDisplay = (category) => {
    // Show only the category name (deepest level) for selected display
    return category.name || `Category ${category.id}`;
  };

  const getCategoryIndentation = (level) => {
    return level * 16; // 16px per level
  };

  if (loading) {
    return (
      <div className="category-selector">
        <div className={`mt-1 block w-full border rounded p-2 bg-gray-50 text-gray-500 ${className}`}>
          Loading categories...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="category-selector">
        <div className={`mt-1 block w-full border border-red-300 rounded p-2 text-red-600 ${className}`}>
          Error loading categories
        </div>
        <p className="text-xs text-red-600 mt-1">{error}</p>
        <button 
          type="button"
          onClick={fetchCategories}
          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="category-selector relative">
      {/* Custom Dropdown Button */}
      <button
        type="button"
        className={`mt-1 w-full text-left border rounded p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center ${className}`}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={disabled}
      >
        <span className={selectedCategory ? 'text-gray-900' : 'text-gray-500'}>
          {selectedCategory ? formatSelectedDisplay(selectedCategory) : placeholder}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        value={value || ""}
        required={required}
      />

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {categories.map(category => (
            <button
              key={category.id}
              type="button"
              className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-none bg-transparent ${
                selectedCategory?.id === category.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
              }`}
              style={{
                paddingLeft: `${12 + getCategoryIndentation(category.level || 0)}px`,
                fontWeight: (category.level || 0) === 0 ? '600' : '400',
                fontSize: (category.level || 0) === 0 ? '14px' : '13px'
              }}
              onClick={() => handleCategorySelect(category)}
            >
              {formatCategoryDisplay(category)}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default CategorySelector;
