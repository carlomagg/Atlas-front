import React, { useState, useRef, useEffect } from 'react';

// All 36 Nigerian states plus FCT
const NIGERIA_STATES = [
  'Abia',
  'Adamawa', 
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT (Abuja)',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara'
];

const NigeriaStatesDropdown = ({ 
  name = "state", 
  value = "", 
  onChange, 
  className = "", 
  required = false,
  placeholder = "Select State",
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter states based on search term
  const filteredStates = NIGERIA_STATES.filter(state =>
    state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle state selection
  const handleStateSelect = (state) => {
    console.log('🔍 NigeriaStatesDropdown - State selected:', state, 'for field:', name);
    // Create synthetic event for onChange handler
    const syntheticEvent = {
      target: {
        name: name,
        value: state
      }
    };
    onChange(syntheticEvent);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle input click
  const handleInputClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredStates.length === 1) {
        handleStateSelect(filteredStates[0]);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value} />
      
      {/* Display input */}
      <div
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent bg-white cursor-pointer flex items-center justify-between ${className}`}
        onClick={handleInputClick}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown list - Always opens downward */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search states..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#027DDB]"
              onKeyDown={handleKeyDown}
            />
          </div>
          
          {/* States list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredStates.length > 0 ? (
              filteredStates.map((state) => (
                <div
                  key={state}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                  onClick={() => handleStateSelect(state)}
                >
                  {state}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                No states found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NigeriaStatesDropdown;
