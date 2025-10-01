import React from 'react';

/**
 * AddressMapLink Component
 * Renders an address with a clickable link to Google Maps
 * @param {Object} address - Address object with street, city, state, country, etc.
 * @param {string} className - Additional CSS classes
 * @param {boolean} showMapIcon - Whether to show the map icon (default: true)
 * @param {string} mapIconPosition - Position of map icon: 'left' or 'right' (default: 'right')
 */
export default function AddressMapLink({ 
  address, 
  className = '', 
  showMapIcon = true, 
  mapIconPosition = 'right' 
}) {
  // Build the address string for Google Maps
  const buildAddressString = (addr) => {
    const parts = [];
    
    // Add street address
    if (addr.street_address || addr.street) {
      parts.push(addr.street_address || addr.street);
    }
    
    // Add city
    if (addr.city) {
      parts.push(addr.city);
    }
    
    // Add state/region
    if (addr.state_region || addr.state) {
      parts.push(addr.state_region || addr.state);
    }
    
    // Add postal code
    if (addr.postal_code) {
      parts.push(addr.postal_code);
    }
    
    // Add country
    if (addr.country) {
      parts.push(addr.country);
    }
    
    return parts.filter(Boolean).join(', ');
  };

  // Build Google Maps URL
  const buildGoogleMapsUrl = (addr) => {
    const addressString = buildAddressString(addr);
    if (!addressString) return null;
    
    // Encode the address for URL
    const encodedAddress = encodeURIComponent(addressString);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  };

  const addressString = buildAddressString(address);
  const mapsUrl = buildGoogleMapsUrl(address);

  // If no address data, return null
  if (!addressString) {
    return null;
  }

  const MapIcon = () => (
    <svg 
      className="w-4 h-4 text-blue-600 hover:text-blue-800 transition-colors" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );

  // If no maps URL can be built, render as plain text
  if (!mapsUrl) {
    return (
      <div className={className}>
        <div className="text-sm text-slate-900 space-y-1">
          <div className="font-medium">
            {address.street_address || address.street || '—'}
          </div>
          <div className="text-slate-700">
            {address.city || '—'}, {address.state_region || address.state || '—'}
          </div>
          <div className="text-slate-700">
            {address.country || '—'}{address.postal_code ? `, ${address.postal_code}` : ''}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="text-sm text-slate-900 space-y-1">
        <div className="font-medium flex items-center justify-between">
          <span>{address.street_address || address.street || '—'}</span>
          {showMapIcon && mapIconPosition === 'right' && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 p-1 hover:bg-blue-50 rounded transition-colors"
              title="View on Google Maps"
            >
              <MapIcon />
            </a>
          )}
        </div>
        <div className="text-slate-700 flex items-center justify-between">
          <span>{address.city || '—'}, {address.state_region || address.state || '—'}</span>
          {showMapIcon && mapIconPosition === 'left' && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 p-1 hover:bg-blue-50 rounded transition-colors"
              title="View on Google Maps"
            >
              <MapIcon />
            </a>
          )}
        </div>
        <div className="text-slate-700 flex items-center justify-between">
          <span>
            {address.country || '—'}{address.postal_code ? `, ${address.postal_code}` : ''}
          </span>
          {/* View on Maps button for better UX */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            title="View on Google Maps"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on Maps
          </a>
        </div>
      </div>
    </div>
  );
}
