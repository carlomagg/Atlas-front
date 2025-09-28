// Centralized country and state/region data with helpers
// Submit ISO 3166-1 alpha-2 codes for countries; states are mostly names except US (uses state codes)

export const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'CA', name: 'Canada' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
];

// For states/regions:
// - US uses state codes (AL, CA, NY, ...)
// - Others (like NG) use state names directly
export const STATES = {
  NG: [
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','FCT'
  ],
  US: [
    { code: 'AL', name: 'Alabama' },{ code: 'AK', name: 'Alaska' },{ code: 'AZ', name: 'Arizona' },{ code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },{ code: 'CO', name: 'Colorado' },{ code: 'CT', name: 'Connecticut' },{ code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },{ code: 'GA', name: 'Georgia' },{ code: 'HI', name: 'Hawaii' },{ code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },{ code: 'IN', name: 'Indiana' },{ code: 'IA', name: 'Iowa' },{ code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },{ code: 'LA', name: 'Louisiana' },{ code: 'ME', name: 'Maine' },{ code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },{ code: 'MI', name: 'Michigan' },{ code: 'MN', name: 'Minnesota' },{ code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },{ code: 'MT', name: 'Montana' },{ code: 'NE', name: 'Nebraska' },{ code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },{ code: 'NJ', name: 'New Jersey' },{ code: 'NM', name: 'New Mexico' },{ code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },{ code: 'ND', name: 'North Dakota' },{ code: 'OH', name: 'Ohio' },{ code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },{ code: 'PA', name: 'Pennsylvania' },{ code: 'RI', name: 'Rhode Island' },{ code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },{ code: 'TN', name: 'Tennessee' },{ code: 'TX', name: 'Texas' },{ code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },{ code: 'VA', name: 'Virginia' },{ code: 'WA', name: 'Washington' },{ code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },{ code: 'WY', name: 'Wyoming' }
  ],
};

export const getCountryName = (codeOrName) => {
  if (!codeOrName) return '';
  const s = String(codeOrName).trim();
  // If already a readable country name, return it
  if (s.length > 2) return s;
  const found = COUNTRIES.find(c => c.code.toUpperCase() === s.toUpperCase());
  return found ? found.name : s;
};

export const getStateDisplay = (countryCode, value) => {
  if (!countryCode || !value) return value || '';
  const cc = String(countryCode).toUpperCase();
  const list = STATES[cc];
  if (!list) return value;
  if (cc === 'US') {
    const found = list.find(s => s.code === value || s.name === value);
    return found ? found.name : value;
  }
  // For countries like NG, states are plain names
  return value;
};
