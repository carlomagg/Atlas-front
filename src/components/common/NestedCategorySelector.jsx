import React, { useState, useEffect, useRef } from 'react';
import { fetchCategoryTree } from '../../services/productApi';

const NestedCategorySelector = ({ 
  value, 
  onChange, 
  onCategorySelect, 
  placeholder = "Select a category...",
  className = "",
  disabled = false,
  required = false 
}) => {
  const [categoryTree, setCategoryTree] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Find selected category when value changes
    if (value && categoryTree.length > 0) {
      const category = findCategoryById(categoryTree, parseInt(value));
      setSelectedCategory(category);
    } else {
      setSelectedCategory(null);
    }
  }, [value, categoryTree]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCategoryTree();
      setCategoryTree(data.results || data || []);
    } catch (err) {
      console.error('Error fetching category tree:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const findCategoryById = (categories, id) => {
    for (const category of categories) {
      if (category.id === id) {
        return category;
      }
      if (category.children && category.children.length > 0) {
        const found = findCategoryById(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleExpanded = (categoryId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleCategorySelect = (category) => {
    // Only select and close dropdown when user actually wants to select
    setSelectedCategory(category);
    setIsDropdownOpen(false);
    
    // Create synthetic event for form compatibility
    const syntheticEvent = {
      target: {
        value: category.id.toString()
      }
    };
    
    if (onChange) {
      onChange(syntheticEvent);
    }
    
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const handleExpandToggle = (categoryId, event) => {
    // Prevent event bubbling to avoid closing dropdown
    event.stopPropagation();
    toggleExpanded(categoryId);
  };

  const CategoryNode = ({ category, level = 0 }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedNodes.has(category.id);
    const isSelected = selectedCategory?.id === category.id;

    return (
      <div className="category-node">
        <div 
          className={`category-item flex items-center py-2 px-3 transition-all duration-200 border-l-3 border-transparent hover:bg-gray-50 hover:border-blue-400 ${
            isSelected ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          {hasChildren ? (
            <span 
              className={`expand-icon w-4 h-4 mr-2 text-gray-500 transition-transform duration-200 cursor-pointer hover:text-blue-600 ${
                isExpanded ? 'transform rotate-90' : ''
              }`}
              onClick={(e) => handleExpandToggle(category.id, e)}
            >
              ▶
            </span>
          ) : (
            <span className="w-4 h-4 mr-2"></span>
          )}
          
          <span 
            className="category-name flex-1 text-sm cursor-pointer"
            onClick={() => handleCategorySelect(category)}
          >
            {category.name}
          </span>
          
          <span className="category-info flex items-center gap-2 text-xs">
            <span className="product-count text-green-600 font-medium">
              ({category.product_count || 0})
            </span>
            {hasChildren && (
              <span className="children-count text-gray-500 italic">
                {category.children.length} sub
              </span>
            )}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="category-children border-l border-dashed border-gray-300 ml-5">
            {category.children.map(child => (
              <CategoryNode
                key={child.id}
                category={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="nested-category-selector">
        <div className="p-4 text-center text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
          Loading categories...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nested-category-selector border border-red-300 rounded-lg p-4">
        <div className="text-red-600 text-sm mb-2">⚠️ {error}</div>
        <button 
          onClick={fetchCategories}
          className="text-blue-600 hover:text-blue-800 text-sm underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="nested-category-selector relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        type="button"
        className={`mt-1 w-full text-left border rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center ${className}`}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={disabled}
      >
        <span className={selectedCategory ? 'text-gray-900' : 'text-gray-500'}>
          {selectedCategory ? selectedCategory.name : placeholder}
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

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <div className="category-header p-3 border-b border-gray-200 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Select Category</h4>
            <small className="text-xs text-gray-600">Click to expand categories with subcategories</small>
          </div>
          
          <div className="category-tree py-2">
            {categoryTree.map(category => (
              <CategoryNode key={category.id} category={category} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NestedCategorySelector;
