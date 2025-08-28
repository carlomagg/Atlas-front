import React from 'react';

const ComingSoon = ({ title = 'Coming Soon', description = 'This feature is under development and will be available soon.' }) => {
  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 flex items-start gap-4">
          <div className="shrink-0">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 mt-2">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
