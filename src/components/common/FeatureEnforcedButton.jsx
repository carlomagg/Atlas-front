import React from 'react';
import { useFeatureLimit } from '../../hooks/useFeatureEnforcement';

/**
 * Button component with built-in feature enforcement
 * Automatically checks feature limits and shows appropriate UI
 */
const FeatureEnforcedButton = ({
  featureName,
  currentUsage = null,
  onClick,
  children,
  className = '',
  showUpgradePrompt = true,
  onUpgrade,
  loadingText = 'Checking...',
  restrictedText = 'Upgrade Required',
  ...props
}) => {
  const { loading, allowed, message, remaining, recheck } = useFeatureLimit(featureName, currentUsage);

  const handleClick = async (e) => {
    if (!allowed) {
      e.preventDefault();
      
      if (showUpgradePrompt && onUpgrade) {
        onUpgrade(message, featureName);
      } else {
        alert(message);
      }
      return;
    }

    if (onClick) {
      await onClick(e);
      // Recheck limits after action
      setTimeout(() => recheck(), 1000);
    }
  };

  if (loading) {
    return (
      <button 
        disabled 
        className={`${className} opacity-50 cursor-not-allowed`}
        {...props}
      >
        {loadingText}
      </button>
    );
  }

  const buttonClass = allowed 
    ? className 
    : `${className} bg-yellow-500 hover:bg-yellow-600 text-white`;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={buttonClass}
        title={allowed ? '' : message}
        {...props}
      >
        {allowed ? children : restrictedText}
      </button>
      
      {!allowed && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800 whitespace-nowrap z-10">
          {message}
          {remaining !== undefined && (
            <div className="mt-1">
              <span className="font-semibold">Remaining: {remaining}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeatureEnforcedButton;
