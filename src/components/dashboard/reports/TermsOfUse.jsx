import React from 'react';

const TermsOfUse = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ATLASWD LIMITED</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">TERMS OF USE AGREEMENT</h2>
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-blue-800 font-medium">Last Updated Date: 2nd October, 2025</p>
        </div>
      </div>

      <div className="prose prose-lg max-w-none">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Agreement to Terms</h3>
              <div className="mt-2 text-sm text-blue-700 space-y-2">
                <p>These Terms of Use ("Agreement") govern your access to and use of AtlasWD.com (the "Platform"), which is owned and operated by AtlasWD Limited, a company incorporated under the laws of the Federal Republic of Nigeria.</p>
                <p>Lux Tech 25 Limited is the official IT company responsible for the technical management, maintenance, and development of the Platform.</p>
                <p>By registering, accessing, or using AtlasWD.com, including as a buyer, supplier, service provider, agent, or visitor, you agree to comply with these Terms of Use, the Privacy Policy, and all applicable laws. If you do not agree, you must discontinue use of the Platform immediately.</p>
              </div>
            </div>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <div className="space-y-4 text-gray-700">
            <p>By using AtlasWD.com, you agree to be bound by this Agreement.</p>
            <p>AtlasWD may amend these Terms at any time by posting updates on the Platform. Continued use of the Platform after notice of changes constitutes your acceptance.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
          <div className="space-y-4 text-gray-700">
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be at least 18 years old to create an account or use AtlasWD's services</li>
              <li>You must have full legal authority to enter into agreements on behalf of yourself or the business you represent</li>
              <li>AtlasWD reserves the right to verify your identity and business documents</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Services Provided</h2>
          <div className="space-y-4 text-gray-700">
            <p>AtlasWD is an e-commerce and business platform that allows:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Buyers to source products and services</li>
              <li>Suppliers and service providers to list, advertise, and promote their offerings</li>
              <li>Agents and super-agents to register users and earn commissions</li>
              <li>Businesses to access tools such as product listings, premium membership, digital advertising, and verified supplier badges</li>
            </ul>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <p className="text-yellow-800 font-medium">AtlasWD is not a buyer, seller, manufacturer, or logistics company. It only provides an online platform for connecting parties.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Responsibilities</h2>
          <div className="space-y-4 text-gray-700">
            <p>You agree that you will:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and truthful registration information</li>
              <li>Ensure that all products, services, and content you upload are lawful and comply with Nigerian and international trade regulations</li>
              <li>Not engage in fraudulent activity, scams, or misrepresentation</li>
              <li>Not upload viruses, malware, or harmful content</li>
              <li>Not use the Platform for unlawful purposes including money laundering, arms trade, drugs, or human trafficking</li>
            </ul>
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
              <p className="text-red-800 font-medium">AtlasWD reserves the right to suspend or terminate accounts found in violation.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Payments, Fees, and Commissions</h2>
          <div className="space-y-4 text-gray-700">
            <ul className="list-disc pl-6 space-y-2">
              <li>Some services (including advertising, supplier verification, and premium membership) require payment of fees</li>
              <li>AtlasWD may deduct commissions from transactions facilitated on the Platform</li>
              <li>All payments are made in the currency specified on the Platform. Users are responsible for any bank charges, transaction fees, or taxes</li>
              <li>AtlasWD is not a bank or escrow service. Payments between buyers and suppliers are their own responsibility</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property Rights</h2>
          <div className="space-y-4 text-gray-700">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">(a) Platform Content</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>The design, layout, software, text, graphics, and content of AtlasWD.com are the intellectual property of AtlasWD Limited</li>
                <li>No person may copy, modify, distribute, or exploit content without written permission</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">(b) User-Uploaded Content</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>By uploading content (e.g., logos, product images, service descriptions), you grant AtlasWD Limited a royalty free, perpetual, worldwide license to use, reproduce, translate, and distribute such content for Platform purposes</li>
                <li>You confirm you own or have the right to use any material you upload</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Trademarks</h2>
          <div className="space-y-4 text-gray-700">
            <ul className="list-disc pl-6 space-y-2">
              <li>AtlasWD, AtlasWD Limited, and related service badges are trademarks of AtlasWD Limited</li>
              <li>Other trademarks displayed on the Platform belong to their rightful owners</li>
              <li>Unauthorized use is prohibited</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Protection & Privacy</h2>
          <div className="space-y-4 text-gray-700">
            <ul className="list-disc pl-6 space-y-2">
              <li>AtlasWD processes personal and business data in compliance with the Nigerian Data Protection Regulation (NDPR) and applicable international privacy standards</li>
              <li>Data may be shared with Lux Tech 25 Limited (IT provider) and third-party partners where necessary to operate services</li>
              <li>Users have the right to request data correction, deletion, or restriction</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
          <div className="space-y-4 text-gray-700">
            <p>AtlasWD Limited is not responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Quality, safety, legality, or delivery of products or services offered by suppliers or service providers</li>
              <li>Disputes, delays, or losses arising from business transactions between users</li>
              <li>Any indirect damages, lost profits, or business interruptions</li>
            </ul>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <p className="text-yellow-800 font-medium">If liability is established by law, AtlasWD's maximum liability shall not exceed the total service fees paid by the user in the last 12 months.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Disclaimer of Warranties</h2>
          <div className="space-y-4 text-gray-700">
            <ul className="list-disc pl-6 space-y-2">
              <li>The Platform is provided on an "as is" and "as available" basis</li>
              <li>AtlasWD does not guarantee uninterrupted, secure, or error-free service</li>
              <li>Translations of the Platform may be offered for convenience, but in case of conflict, the English version shall prevail</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
          <div className="space-y-4 text-gray-700">
            <ul className="list-disc pl-6 space-y-2">
              <li>AtlasWD may suspend or terminate any account without notice if terms are violated</li>
              <li>Users may close their accounts at any time, but pending obligations (fees, liabilities, or commissions) remain binding</li>
              <li>AtlasWD may retain necessary records to comply with legal obligations</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law & Jurisdiction</h2>
          <div className="space-y-4 text-gray-700">
            <ul className="list-disc pl-6 space-y-2">
              <li>This Agreement is governed by the laws of the Federal Republic of Nigeria</li>
              <li>Any disputes shall be resolved exclusively in the courts of Nigeria</li>
              <li>In the event of international conflict, the English version of these Terms shall be legally binding</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Indemnification</h2>
          <div className="space-y-4 text-gray-700">
            <p>You agree to indemnify and hold harmless AtlasWD Limited, Lux Tech 25 Limited, its officers, employees, and affiliates from any claims, liabilities, damages, or expenses arising from your:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violation of these Terms or Privacy Policy</li>
              <li>Breach of any laws or third-party rights</li>
              <li>Misuse of the Platform</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Entire Agreement</h2>
          <div className="space-y-4 text-gray-700">
            <p>This Agreement, together with the Privacy Policy and other published policies, constitutes the complete agreement between you and AtlasWD Limited and supersedes all prior agreements.</p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default TermsOfUse;
