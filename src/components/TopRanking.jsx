import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchTopRankingProducts, fetchTopRankingProductsByCategory } from '../services/productApi';
import { listCategories } from '../services/categoryApi';
import ProductCard from './ProductCard';

export default function TopRanking() {
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState({});

  const productsPerCategory = 12; // Show 12 products per category initially

  // Load categories and their top ranking products
  const loadCategoriesAndProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch ALL categories (both root and subcategories)
      const categoriesResponse = await listCategories({}); // Get ALL categories (no parent filter)
      const allCategories = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse?.results || []);
      
      // Filter to get categories that have products (you can also show all)
      // Option 1: Show ALL categories (root + subcategories)
      const mainCategories = allCategories;
      
      // Option 2: If you want to organize by hierarchy, uncomment below:
      // const rootCategories = allCategories.filter(cat => !cat.parent);
      // const subCategories = allCategories.filter(cat => cat.parent);
      // const mainCategories = [...rootCategories, ...subCategories]; // Root first, then subs
      setCategories(mainCategories);

      // Load products for each category
      const categoryProductsData = {};
      
      for (const category of mainCategories) {
        try {
          setLoadingCategories(prev => ({ ...prev, [category.id]: true }));
          
          const response = await fetchTopRankingProductsByCategory(category.id, 1, productsPerCategory);
          const products = Array.isArray(response) ? response : (response?.results || []);
          
          categoryProductsData[category.id] = {
            products: products,
            totalCount: Array.isArray(response) ? products.length : (response?.count || 0),
            hasMore: products.length >= productsPerCategory
          };
        } catch (err) {
          console.error(`Error loading products for category ${category.name}:`, err);
          categoryProductsData[category.id] = {
            products: [],
            totalCount: 0,
            hasMore: false,
            error: err.message
          };
        } finally {
          setLoadingCategories(prev => ({ ...prev, [category.id]: false }));
        }
      }

      setCategoryProducts(categoryProductsData);

    } catch (err) {
      console.error('Error loading categories and products:', err);
      setError(err.message || 'Failed to load top ranking products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoriesAndProducts();
  }, []);

  const getImageUrl = (product) => {
    return product.primary_image || 
           product.thumb || 
           product.image_url || 
           (product.media && product.media[0]?.file) ||
           null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        {/* Header with Gradient Colors */}
        <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Top Ranking Products</h1>
              <p className="text-xl text-orange-100 mb-8">
                Discover the highest-ranked products from our premium sellers across all categories
              </p>
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-orange-600 hover:bg-gray-100 transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Loading Categories */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {[...Array(4)].map((_, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(12)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 animate-pulse">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="p-3">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center px-4">
        <div className="max-w-xl w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-red-500 mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Error Loading Products</h1>
          <p className="mt-3 text-gray-600">{error}</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={loadCategoriesAndProducts}
              className="px-5 py-2.5 rounded-lg bg-[#027DDB] text-white hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header with Gradient Colors */}
      <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Top Ranking Products</h1>
            <p className="text-xl text-orange-100 mb-8">
              Discover the highest-ranked products from our premium sellers across all categories
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-orange-600 hover:bg-gray-100 transition-colors font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Categories and Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
            <p className="text-gray-500">There are no categories with top ranking products available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => {
              const categoryData = categoryProducts[category.id] || { products: [], totalCount: 0, hasMore: false };
              const isLoading = loadingCategories[category.id];
              
              return (
                <div key={category.id} className="category-section">
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {category.parent ? (
                          <span className="flex items-center">
                            <span className="text-gray-500 text-lg mr-2">└</span>
                            Top {category.name}
                            <span className="text-sm text-gray-500 ml-2">(Subcategory)</span>
                          </span>
                        ) : (
                          `Top ${category.name}`
                        )}
                      </h2>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        category.parent 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {categoryData.totalCount} products
                      </span>
                    </div>
                    <Link
                      to={`/category/${category.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center space-x-1"
                    >
                      <span>View All</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>

                  {/* Category Products */}
                  {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {[...Array(12)].map((_, index) => (
                        <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 animate-pulse">
                          <div className="aspect-square bg-gray-200"></div>
                          <div className="p-3">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : categoryData.error ? (
                    <div className="text-center py-8 bg-red-50 rounded-lg">
                      <p className="text-red-600">Error loading {category.name} products: {categoryData.error}</p>
                    </div>
                  ) : categoryData.products.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No top ranking products found in {category.name}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {categoryData.products.map((product) => (
                        <ProductCard
                          key={product.id}
                          id={product.id}
                          imageUrl={getImageUrl(product)}
                          title={product.title}
                          rating={product.avg_rating || 0}
                          subscriptionBadge={product.subscription_badge || product.package_name}
                          dailyBoosterBadge={product.daily_booster_badge}
                          isBoosted={product.is_boosted}
                          boosterEndDate={product.booster_end_date}
                          boosterStatus={product.booster_status}
                          subscriptionEndDate={product.subscription_end_date}
                          subscriptionStatus={product.subscription_status}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
