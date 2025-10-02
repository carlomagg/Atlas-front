import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ATLASWD LIMITED</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Privacy Policy</h2>
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-blue-800 font-medium">Update Date: 1st October, 2025</p>
          <p className="text-blue-800 font-medium">Effective Date: 2nd October, 2025</p>
        </div>
      </div>

      <div className="prose prose-lg max-w-none">
        <div className="bg-green-50 border-l-4 border-green-400 p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Your Privacy Matters</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Atlas Wholesale & Distributions (AtlasWD Limited) is committed to protecting the privacy and rights of all users of its platform, including buyers, sellers, and service providers. This Privacy Policy explains how we collect, use, and safeguard your information.</p>
                <p className="mt-2">By registering and using AtlasWD services, you agree to the terms outlined in this Privacy Policy and our Terms & Conditions.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
          <div className="space-y-2">
            <p className="text-gray-700"><strong>Email:</strong> support@atlaswd.com</p>
            <p className="text-gray-700"><strong>Tel:</strong> +234 806 773 7852</p>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
          <div className="space-y-6 text-gray-700">
            <p>We collect information depending on whether you are a buyer or a seller/service provider:</p>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">For Buyers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name, contact details (email, phone number, address)</li>
                <li>Account details and login activity</li>
                <li>Purchase history, payment details, and delivery information</li>
                <li>Communication records with sellers or AtlasWD support</li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">For Sellers & Service Providers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Business registration details (e.g., NIN, CAC number in Nigeria or international equivalents)</li>
                <li>Company name, address, and authorized representatives</li>
                <li>Contact details, payment/bank information for settlements</li>
                <li>Product/service listings, catalogues, specifications, and pricing</li>
                <li>Account usage data, including login history and device information</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Information</h2>
          <div className="space-y-4 text-gray-700">
            <p>We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Verify identity and eligibility of buyers and sellers</li>
              <li>Facilitate transactions between buyers and sellers/service providers</li>
              <li>Enable communication between users</li>
              <li>Process payments, settlements, and commissions</li>
              <li>Ensure platform security, prevent fraud, and enforce compliance</li>
              <li>Improve our services, features, and user experience</li>
              <li>Send important updates, promotional offers, and alerts</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Sharing and Disclosure</h2>
          <div className="space-y-4 text-gray-700">
            <p>AtlasWD may share your data in the following circumstances:</p>
            
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>With Buyers or Sellers:</strong> To facilitate orders, delivery, and communication.</li>
              <li><strong>With Service Providers:</strong> For IT support, payments, logistics, or verification (including Lux Tech 25 Limited, AtlasWD's IT partner).</li>
              <li><strong>With Regulators/Authorities:</strong> As required by Nigerian law or international regulations.</li>
              <li><strong>With Consent:</strong> Where you authorize us to share information for marketing or partnership purposes.</li>
            </ul>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
              <p className="text-yellow-800 font-medium">We do not sell your data to unauthorized third parties.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
          <div className="space-y-4 text-gray-700">
            <ul className="list-disc pl-6 space-y-2">
              <li>All personal and business data is encrypted and stored securely</li>
              <li>Access is restricted to authorized personnel only</li>
              <li>Security measures are in place to detect and prevent fraud, malware, and unauthorized access</li>
              <li>In case of a breach, affected users will be notified promptly</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
          <div className="space-y-4 text-gray-700">
            <p>As a user of AtlasWD, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access, review, and update your information</li>
              <li>Request deletion of certain personal data (where legally possible)</li>
              <li>Opt out of promotional or marketing communications</li>
              <li>Request suspension or closure of your account</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Compliance and Verification</h2>
          <div className="space-y-4 text-gray-700">
            <ul className="list-disc pl-6 space-y-2">
              <li>Sellers and service providers must undergo verification through NIN, CAC (Corporate Affairs Commission of Nigeria) or international equivalents</li>
              <li>Buyers may also be required to provide identification to reduce fraud</li>
              <li>Failure to provide accurate information may lead to account suspension or termination</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cross-Border Data Transfers</h2>
          <div className="space-y-4 text-gray-700">
            <p>As AtlasWD operates globally, your data may be processed or stored outside Nigeria. By using our platform, you consent to such transfers, subject to applicable data protection laws.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Language and Jurisdiction</h2>
          <div className="space-y-4 text-gray-700">
            <p>This Privacy Policy is provided in multiple languages for user convenience. In the event of any conflict, the English version shall prevail in all legal matters.</p>
            <p className="font-medium">This agreement is governed by the laws of the Federal Republic of Nigeria.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Updates to This Policy</h2>
          <div className="space-y-4 text-gray-700">
            <p>AtlasWD may update this Privacy Policy from time to time. Changes will be posted on the website and, where appropriate, communicated to you directly. Continued use of the platform after updates means acceptance of the revised policy.</p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
