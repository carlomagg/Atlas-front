import React from 'react';

const SubscriptionBadge = ({ subscriptionBadge, subscriptionEndDate, subscriptionStatus }) => {
  if (!subscriptionBadge) return null;

  // Trust backend filtering - only hide if explicitly marked as expired
  // Backend should handle expiration logic and not send expired badges
  if (subscriptionStatus) {
    const status = subscriptionStatus.toLowerCase();
    // Only hide if backend explicitly says it's expired
    if (status === 'expired' || status === 'inactive' || status === 'cancelled' || status === 'ended') {
      return null;
    }
  }

  // If backend sent the badge, trust it and show it
  // Backend should handle date-based expiration server-side

  const getBadgeConfig = (badge) => {
    switch (badge) {
      case 'basic':
        return {
          text: 'Basic',
          color: '#6B7280',
          bgColor: '#F3F4F6'
        };
      case 'silver':
        return {
          text: 'Silver',
          color: '#4B5563',
          bgColor: '#E5E7EB'
        };
      case 'gold':
        return {
          text: 'Gold',
          color: '#D97706',
          bgColor: '#FEF3C7'
        };
      case 'platinum':
        return {
          text: 'Platinum',
          color: '#7C3AED',
          bgColor: '#EDE9FE'
        };
      default:
        return null;
    }
  };

  const badgeConfig = getBadgeConfig(subscriptionBadge);
  if (!badgeConfig) return null;

  return (
    <span 
      style={{
        color: badgeConfig.color,
        backgroundColor: badgeConfig.bgColor,
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}
    >
      {badgeConfig.text}
    </span>
  );
};

export default SubscriptionBadge;
