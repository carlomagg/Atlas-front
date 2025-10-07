import { useState, useEffect, useCallback } from 'react';
import featureEnforcement from '../utils/featureEnforcement';

/**
 * React hook for feature enforcement
 * Provides easy access to subscription feature limits and validation
 */

export const useFeatureEnforcement = () => {
  const [featureUsage, setFeatureUsage] = useState(null);
  const [subscriptionSummary, setSubscriptionSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [usage, summary] = await Promise.all([
          featureEnforcement.getFeatureUsage().catch(() => null),
          featureEnforcement.getSubscriptionSummary().catch(() => null)
        ]);
        
        setFeatureUsage(usage);
        setSubscriptionSummary(summary);
      } catch (error) {
        console.error('Error loading feature enforcement data:', error);
        // Set defaults when backend endpoints don't exist
        setFeatureUsage(null);
        setSubscriptionSummary(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    featureEnforcement.clearCache();
    const [usage, summary] = await Promise.all([
      featureEnforcement.getFeatureUsage(),
      featureEnforcement.getSubscriptionSummary()
    ]);
    
    setFeatureUsage(usage);
    setSubscriptionSummary(summary);
  }, []);

  // Feature check methods
  const checkFeatureLimit = useCallback(async (featureName, currentUsage = null) => {
    return await featureEnforcement.checkFeatureLimit(featureName, currentUsage);
  }, []);

  const validateFeatureAccess = useCallback(async (featureName) => {
    return await featureEnforcement.validateFeatureAccess(featureName);
  }, []);

  // Convenience methods for common features
  const canUploadProduct = useCallback(async () => {
    return await featureEnforcement.canUploadProduct();
  }, []);

  const canFeatureProduct = useCallback(async () => {
    return await featureEnforcement.canFeatureProduct();
  }, []);

  const hasApiAccess = useCallback(async () => {
    return await featureEnforcement.hasApiAccess();
  }, []);

  const hasCustomBranding = useCallback(async () => {
    return await featureEnforcement.hasCustomBranding();
  }, []);

  const checkStorageLimit = useCallback(async (currentUsageGB = null) => {
    return await featureEnforcement.checkStorageLimit(currentUsageGB);
  }, []);

  const showUpgradePrompt = useCallback((featureName, onUpgrade) => {
    featureEnforcement.showUpgradePrompt(featureName, onUpgrade);
  }, []);

  return {
    // Data
    featureUsage,
    subscriptionSummary,
    loading,
    
    // Methods
    refresh,
    checkFeatureLimit,
    validateFeatureAccess,
    
    // Convenience methods
    canUploadProduct,
    canFeatureProduct,
    hasApiAccess,
    hasCustomBranding,
    checkStorageLimit,
    showUpgradePrompt
  };
};

/**
 * Hook for checking a specific feature limit
 * @param {string} featureName - Name of the feature to check
 * @param {number} currentUsage - Current usage (optional)
 */
export const useFeatureLimit = (featureName, currentUsage = null) => {
  const [featureCheck, setFeatureCheck] = useState({
    loading: true,
    allowed: false,
    message: '',
    limit: 0,
    usage: 0,
    remaining: 0
  });

  useEffect(() => {
    const checkFeature = async () => {
      try {
        const result = await featureEnforcement.checkFeatureLimit(featureName, currentUsage);
        setFeatureCheck({
          loading: false,
          allowed: result.allowed,
          message: result.message,
          limit: result.limit,
          usage: result.usage,
          remaining: result.remaining
        });
      } catch (error) {
        console.error('Error checking feature limit:', error);
        setFeatureCheck({
          loading: false,
          allowed: false,
          message: 'Error checking feature access',
          limit: 0,
          usage: 0,
          remaining: 0
        });
      }
    };

    checkFeature();
  }, [featureName, currentUsage]);

  const recheck = useCallback(async () => {
    setFeatureCheck(prev => ({ ...prev, loading: true }));
    try {
      const result = await featureEnforcement.checkFeatureLimit(featureName, currentUsage);
      setFeatureCheck({
        loading: false,
        allowed: result.allowed,
        message: result.message,
        limit: result.limit,
        usage: result.usage,
        remaining: result.remaining
      });
    } catch (error) {
      console.error('Error rechecking feature limit:', error);
      setFeatureCheck({
        loading: false,
        allowed: false,
        message: 'Error checking feature access',
        limit: 0,
        usage: 0,
        remaining: 0
      });
    }
  }, [featureName, currentUsage]);

  return {
    ...featureCheck,
    recheck
  };
};

/**
 * Hook for checking feature access (boolean check)
 * @param {string} featureName - Name of the feature to check
 */
export const useFeatureAccess = (featureName) => {
  const [accessCheck, setAccessCheck] = useState({
    loading: true,
    hasAccess: false,
    message: ''
  });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const result = await featureEnforcement.validateFeatureAccess(featureName);
        setAccessCheck({
          loading: false,
          hasAccess: result.hasAccess,
          message: result.message
        });
      } catch (error) {
        console.error('Error checking feature access:', error);
        setAccessCheck({
          loading: false,
          hasAccess: false,
          message: 'Error checking feature access'
        });
      }
    };

    checkAccess();
  }, [featureName]);

  const recheck = useCallback(async () => {
    setAccessCheck(prev => ({ ...prev, loading: true }));
    try {
      const result = await featureEnforcement.validateFeatureAccess(featureName);
      setAccessCheck({
        loading: false,
        hasAccess: result.hasAccess,
        message: result.message
      });
    } catch (error) {
      console.error('Error rechecking feature access:', error);
      setAccessCheck({
        loading: false,
        hasAccess: false,
        message: 'Error checking feature access'
      });
    }
  }, [featureName]);

  return {
    ...accessCheck,
    recheck
  };
};

export default useFeatureEnforcement;
