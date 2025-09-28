import React from 'react';

const DailyBoosterBadge = ({ dailyBoosterBadge, boosterEndDate, boosterStatus }) => {
  if (!dailyBoosterBadge) return null;

  // Trust backend filtering - only hide if explicitly marked as expired
  // Backend should handle expiration logic and not send expired badges
  if (boosterStatus) {
    const status = boosterStatus.toLowerCase();
    // Only hide if backend explicitly says it's expired
    if (status === 'expired' || status === 'inactive' || status === 'ended') {
      return null;
    }
  }

  // If backend sent the badge, trust it and show it
  // Backend should handle date-based expiration server-side

  const getBadgeStyles = (badge) => {
    const styles = {
      basic: {
        color: '#6B7280', // gray-500
        backgroundColor: '#F3F4F6', // gray-100
      },
      silver: {
        color: '#4B5563', // gray-600
        backgroundColor: '#E5E7EB', // gray-200
      },
      gold: {
        color: '#D97706', // orange-600
        backgroundColor: '#FEF3C7', // yellow-100
      },
      platinum: {
        color: '#7C3AED', // violet-600
        backgroundColor: '#EDE9FE', // violet-100
      },
      boosted: {
        color: '#EA580C', // orange-600
        backgroundColor: '#FED7AA', // orange-200
      }
    };

    return styles[badge.toLowerCase()] || styles.basic;
  };

  const badgeStyles = getBadgeStyles(dailyBoosterBadge);

  return (
    <span
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
      style={{
        color: badgeStyles.color,
        backgroundColor: badgeStyles.backgroundColor,
        fontSize: '10px',
        fontWeight: '600',
      }}
    >
      🚀 {dailyBoosterBadge}
    </span>
  );
};

export default DailyBoosterBadge;
