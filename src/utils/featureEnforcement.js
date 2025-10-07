// Feature Enforcement Utility
import transactionApi from '../services/transactionApi';

/**
 * Feature enforcement utility for subscription-based features
 * Provides methods to check feature limits, validate access, and enforce restrictions
 */

class FeatureEnforcement {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Check if user can perform an action based on feature limits
   * @param {string} featureName - Name of the feature to check
   * @param {number} currentUsage - Current usage count (optional, will fetch if not provided)
   * @returns {Promise<{allowed: boolean, message: string, limit: number, usage: number}>}
   */
  async checkFeatureLimit(featureName, currentUsage = null) {
    try {
      // Check cache first
      const cacheKey = `feature_limit_${featureName}`;
      const cached = this.getFromCache(cacheKey);
      if (cached && currentUsage === null) {
        return cached;
      }

      const result = await transactionApi.subscriptionApi.checkFeatureLimit(featureName, currentUsage);
      
      // Cache the result
      this.setCache(cacheKey, result);
      
      return {
        allowed: result.allowed || false,
        message: result.message || '',
        limit: result.limit || 0,
        usage: result.current_usage || 0,
        remaining: Math.max(0, (result.limit || 0) - (result.current_usage || 0))
      };
    } catch (error) {
      console.error('Error checking feature limit:', error);
      
      // Fallback: Allow action when backend endpoints don't exist
      // This prevents breaking existing functionality
      if (error.message.includes('404') || error.message.includes('Not found')) {
        console.warn(`Feature enforcement endpoint not available for ${featureName}. Allowing action as fallback.`);
        return {
          allowed: true,
          message: 'Feature enforcement not configured - action allowed',
          limit: 999999,
          usage: 0,
          remaining: 999999
        };
      }
      
      return {
        allowed: false,
        message: 'Unable to verify feature access. Please try again.',
        limit: 0,
        usage: 0,
        remaining: 0
      };
    }
  }

  /**
   * Validate if user has access to a specific feature
   * @param {string} featureName - Name of the feature to validate
   * @returns {Promise<{hasAccess: boolean, message: string}>}
   */
  async validateFeatureAccess(featureName) {
    try {
      const cacheKey = `feature_access_${featureName}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await transactionApi.subscriptionApi.validateFeatureAccess(featureName);
      
      const response = {
        hasAccess: result.has_access || false,
        message: result.message || ''
      };
      
      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error validating feature access:', error);
      return {
        hasAccess: false,
        message: 'Unable to verify feature access. Please check your subscription.'
      };
    }
  }

  /**
   * Get user's current feature usage summary
   * @returns {Promise<Object>} Feature usage data
   */
  async getFeatureUsage() {
    try {
      const cacheKey = 'feature_usage';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await transactionApi.subscriptionApi.getFeatureUsage();
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching feature usage:', error);
      return {};
    }
  }

  /**
   * Get subscription summary with limits and usage
   * @returns {Promise<Object>} Subscription summary
   */
  async getSubscriptionSummary() {
    try {
      const cacheKey = 'subscription_summary';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await transactionApi.subscriptionApi.getSubscriptionSummary();
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching subscription summary:', error);
      return null;
    }
  }

  /**
   * Check if user can upload more products
   * @returns {Promise<{canUpload: boolean, message: string, remaining: number}>}
   */
  async canUploadProduct() {
    const result = await this.checkFeatureLimit('max_listings');
    return {
      canUpload: result.allowed,
      message: result.message,
      remaining: result.remaining
    };
  }

  /**
   * Check if user can feature more products
   * @returns {Promise<{canFeature: boolean, message: string, remaining: number}>}
   */
  async canFeatureProduct() {
    const result = await this.checkFeatureLimit('featured_listings');
    return {
      canFeature: result.allowed,
      message: result.message,
      remaining: result.remaining
    };
  }

  /**
   * Check if user has API access
   * @returns {Promise<{hasAccess: boolean, message: string}>}
   */
  async hasApiAccess() {
    return await this.validateFeatureAccess('api_access');
  }

  /**
   * Check if user has custom branding access
   * @returns {Promise<{hasAccess: boolean, message: string}>}
   */
  async hasCustomBranding() {
    return await this.validateFeatureAccess('custom_branding');
  }

  /**
   * Check storage limit
   * @param {number} currentUsageGB - Current storage usage in GB
   * @returns {Promise<{withinLimit: boolean, message: string, remaining: number}>}
   */
  async checkStorageLimit(currentUsageGB = null) {
    const result = await this.checkFeatureLimit('storage_gb', currentUsageGB);
    return {
      withinLimit: result.allowed,
      message: result.message,
      remaining: result.remaining
    };
  }

  /**
   * Show upgrade prompt for feature limits
   * @param {string} featureName - Feature that hit the limit
   * @param {Function} onUpgrade - Callback for upgrade action
   */
  showUpgradePrompt(featureName, onUpgrade) {
    const featureDisplayNames = {
      'max_listings': 'Product Listings',
      'featured_listings': 'Featured Products',
      'storage_gb': 'Storage Space',
      'api_access': 'API Access',
      'custom_branding': 'Custom Branding'
    };

    const displayName = featureDisplayNames[featureName] || featureName;
    
    // You can integrate this with your notification system
    const message = `You've reached your ${displayName} limit. Upgrade your subscription to get more!`;
    
    if (typeof onUpgrade === 'function') {
      onUpgrade(message, featureName);
    } else {
      // Default behavior - could be a toast notification
      console.warn(message);
      alert(message);
    }
  }

  /**
   * Cache management methods
   */
  setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Feature enforcement decorators for React components
   */
  
  /**
   * HOC to enforce feature limits on components
   * @param {React.Component} WrappedComponent 
   * @param {string} featureName 
   * @param {Object} options 
   */
  withFeatureEnforcement(WrappedComponent, featureName, options = {}) {
    return function FeatureEnforcedComponent(props) {
      const [featureCheck, setFeatureCheck] = React.useState({
        loading: true,
        allowed: false,
        message: ''
      });

      React.useEffect(() => {
        const checkFeature = async () => {
          const result = await this.checkFeatureLimit(featureName);
          setFeatureCheck({
            loading: false,
            allowed: result.allowed,
            message: result.message
          });
        };

        checkFeature();
      }, []);

      if (featureCheck.loading) {
        return options.loadingComponent || <div>Checking access...</div>;
      }

      if (!featureCheck.allowed) {
        return options.restrictedComponent || (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">{featureCheck.message}</p>
            {options.showUpgradeButton && (
              <button 
                onClick={() => this.showUpgradePrompt(featureName, options.onUpgrade)}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Upgrade Now
              </button>
            )}
          </div>
        );
      }

      return <WrappedComponent {...props} />;
    }.bind(this);
  }
}

// Create singleton instance
const featureEnforcement = new FeatureEnforcement();

// Export both the class and singleton instance
export { FeatureEnforcement };
export default featureEnforcement;

// Convenience methods for common feature checks
export const featureChecks = {
  canUploadProduct: () => featureEnforcement.canUploadProduct(),
  canFeatureProduct: () => featureEnforcement.canFeatureProduct(),
  hasApiAccess: () => featureEnforcement.hasApiAccess(),
  hasCustomBranding: () => featureEnforcement.hasCustomBranding(),
  checkStorageLimit: (usage) => featureEnforcement.checkStorageLimit(usage),
  getFeatureUsage: () => featureEnforcement.getFeatureUsage(),
  showUpgradePrompt: (feature, callback) => featureEnforcement.showUpgradePrompt(feature, callback)
};
