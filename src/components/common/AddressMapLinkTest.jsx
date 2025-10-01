import React from 'react';
import AddressMapLink from './AddressMapLink';

// Test component to verify AddressMapLink functionality
export default function AddressMapLinkTest() {
  const testAddress = {
    street_address: "123 Business Street",
    city: "Lagos",
    state_region: "Lagos State",
    country: "Nigeria",
    postal_code: "100001",
    phone_number: "+234 123 456 7890",
    email: "contact@company.com"
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4">Address Map Link Test</h2>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <AddressMapLink address={testAddress} />
      </div>
    </div>
  );
}
