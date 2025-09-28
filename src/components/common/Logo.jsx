import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable brand logo component using the main SVG logo.
 * Props:
 * - height: Tailwind height classes (e.g., "h-16", "h-20 md:h-24")
 * - className: extra classes to apply to the img
 * - to: optional Link destination (default: '/')
 * - withText: whether to render brand text next to logo (default: false)
 * - textClassName: classes for the brand text
 */
const Logo = ({ height = 'h-20', className = '', to = '/', withText = false, textClassName = 'ml-2 text-xl font-bold text-gray-900 whitespace-nowrap' }) => {
  const img = (
    <img
      src="/images/logo.svg?v=1"
      alt="Atlas-WD"
      className={`${height} w-auto ${className}`}
    />
  );

  const content = withText ? (
    <div className="flex items-center">
      {img}
      <span className={textClassName}>Atlas-WD</span>
    </div>
  ) : (
    img
  );

  // If 'to' is provided, wrap with Link
  return to ? (
    <Link to={to} className="flex items-center hover:opacity-90 transition-opacity">
      {content}
    </Link>
  ) : (
    content
  );
};

export default Logo;
