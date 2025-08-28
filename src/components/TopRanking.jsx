import React from 'react';
import { Link } from 'react-router-dom';

export default function TopRanking() {
  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 text-[#027DDB] mb-6">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Coming Soon</h1>
        <p className="mt-3 text-gray-600">
          This page will display top ranking products from our <span className="font-semibold">Platinum subscribers</span>.
        </p>
        <p className="mt-1 text-gray-500 text-sm">Were putting the final touches. Stay tuned!</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
