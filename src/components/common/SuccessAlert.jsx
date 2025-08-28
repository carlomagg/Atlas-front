import React, { useEffect } from 'react';

export default function SuccessAlert({ message, onClose, autoDismissMs = 4000 }) {
  useEffect(() => {
    if (!autoDismissMs) return;
    const t = setTimeout(() => {
      if (typeof onClose === 'function') onClose();
    }, autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs, onClose]);

  if (!message) return null;
  return (
    <div className="mb-3 rounded-md border border-green-300 bg-green-50 text-green-800 shadow-sm">
      <div className="flex items-start gap-2 px-3 py-2">
        <div className="mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <div className="text-sm font-medium">
          {message}
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-green-100" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-700">
              <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
