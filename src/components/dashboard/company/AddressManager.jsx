import React, { useState, useEffect } from 'react';
import { COUNTRIES, STATES } from '../../../utils/locationData';

const AddressManager = ({ addresses = [], onChange, className = '' }) => {
  const [localAddresses, setLocalAddresses] = useState([]);

  // Initialize local state from props
  useEffect(() => {
    if (Array.isArray(addresses) && addresses.length > 0) {
      setLocalAddresses(addresses);
    } else {
      // Start with one empty address if none provided
      setLocalAddresses([createEmptyAddress(true)]);
    }
  }, [addresses]);

  // Helper function to notify parent of changes
  const notifyParent = (newAddresses) => {
    if (onChange) {
      onChange(newAddresses);
    }
  };

  const createEmptyAddress = (isHeadOffice = false) => ({
    id: undefined, // Will be set by backend for new addresses
    country: '',
    state_region: '',
    city: '',
    street_address: '',
    postal_code: '',
    phone_number: '',
    email: '',
    latitude: null,
    longitude: null,
    is_head_office: isHeadOffice
  });

  const addAddress = () => {
    const newAddresses = [...localAddresses, createEmptyAddress(false)];
    setLocalAddresses(newAddresses);
    notifyParent(newAddresses);
  };

  const removeAddress = (index) => {
    let newAddresses = localAddresses.filter((_, i) => i !== index);
    
    // Ensure at least one address remains
    if (newAddresses.length === 0) {
      newAddresses = [createEmptyAddress(true)];
    }
    
    // If we removed the head office, make the first remaining address the head office
    if (localAddresses[index]?.is_head_office && newAddresses.length > 0) {
      newAddresses[0] = { ...newAddresses[0], is_head_office: true };
    }
    
    setLocalAddresses(newAddresses);
    notifyParent(newAddresses);
  };

  const updateAddressField = (index, field, value) => {
    const newAddresses = localAddresses.map((addr, i) => {
      if (i !== index) return addr;
      
      // Handle country change - reset state when country changes
      if (field === 'country' && value !== addr.country) {
        return { ...addr, [field]: value, state_region: '' };
      }
      
      return { ...addr, [field]: value };
    });
    
    setLocalAddresses(newAddresses);
    notifyParent(newAddresses);
  };

  const setHeadOffice = (index) => {
    const newAddresses = localAddresses.map((addr, i) => ({
      ...addr,
      is_head_office: i === index
    }));
    
    setLocalAddresses(newAddresses);
    notifyParent(newAddresses);
  };

  const validateAddresses = () => {
    const errors = [];
    
    if (localAddresses.length === 0) {
      errors.push('At least one address is required.');
      return errors;
    }
    
    const hasHeadOffice = localAddresses.some(addr => addr.is_head_office);
    if (!hasHeadOffice) {
      errors.push('Please select a head office.');
    }
    
    localAddresses.forEach((addr, index) => {
      const hasAnyField = addr.country || addr.state_region || addr.city || addr.street_address;
      if (!hasAnyField) {
        errors.push(`Address ${index + 1}: Provide at least one of street address, city, state/region, or country.`);
      }
      
      // Email validation if provided
      if (addr.email && !/^[^@]+@[^@]+\.[^@]+$/.test(addr.email)) {
        errors.push(`Address ${index + 1}: Invalid email format.`);
      }
    });
    
    return errors;
  };

  const getValidationErrors = () => validateAddresses();

  // Expose validation function to parent
  React.useImperativeHandle(onChange?.ref, () => ({
    validate: getValidationErrors
  }));

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Company Addresses</h3>
        <button
          type="button"
          onClick={addAddress}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Address
        </button>
      </div>

      <div className="space-y-6">
        {localAddresses.map((address, index) => (
          <div
            key={address.id || `address-${index}`}
            className={`border rounded-lg p-4 ${
              address.is_head_office 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            {/* Address Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="head_office"
                    checked={address.is_head_office || false}
                    onChange={() => setHeadOffice(index)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {address.is_head_office ? '🏢 Head Office' : 'Branch Office'}
                  </span>
                </label>
                {address.is_head_office && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Primary
                  </span>
                )}
              </div>
              
              {localAddresses.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAddress(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Address Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  value={address.country || ''}
                  onChange={(e) => updateAddressField(index, 'country', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* State/Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Region
                </label>
                {STATES[address.country] ? (
                  <select
                    value={address.state_region || ''}
                    onChange={(e) => updateAddressField(index, 'state_region', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select state/region</option>
                    {Array.isArray(STATES[address.country]) && STATES[address.country].map((state) => (
                      typeof state === 'string' ? (
                        <option key={state} value={state}>{state}</option>
                      ) : (
                        <option key={state.code} value={state.code}>{state.name}</option>
                      )
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={address.state_region || ''}
                    onChange={(e) => updateAddressField(index, 'state_region', e.target.value)}
                    placeholder="State/Region"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={address.city || ''}
                  onChange={(e) => updateAddressField(index, 'city', e.target.value)}
                  placeholder="City"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Postal Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={address.postal_code || ''}
                  onChange={(e) => updateAddressField(index, 'postal_code', e.target.value)}
                  placeholder="Postal Code"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Street Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={address.street_address || ''}
                  onChange={(e) => updateAddressField(index, 'street_address', e.target.value)}
                  placeholder="Street Address"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={address.phone_number || ''}
                  onChange={(e) => updateAddressField(index, 'phone_number', e.target.value)}
                  placeholder="Phone Number"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={address.email || ''}
                  onChange={(e) => updateAddressField(index, 'email', e.target.value)}
                  placeholder="Email"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Validation Summary */}
      {localAddresses.length > 0 && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <p className="font-medium">Address Requirements:</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>At least one address with some location information is required</li>
            <li>One address must be marked as Head Office</li>
            <li>Email addresses must be valid if provided</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AddressManager;
