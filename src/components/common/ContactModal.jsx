import React, { useState } from 'react';
import SuccessAlert from './SuccessAlert';
import { createContactSeller } from '../../services/productRequestApi';

export default function ContactModal({ open, onClose, roleLabel = 'Supplier', productId }) {
  const [quantity, setQuantity] = useState('');
  const [unitType, setUnitType] = useState('pieces');
  const [customUnit, setCustomUnit] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reset = () => {
    setQuantity('');
    setUnitType('pieces');
    setCustomUnit('');
    setDetails('');
    setError('');
  };

  const handleSend = async () => {
    if (!productId) {
      setError('Missing product context');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }
    setSubmitting(true); setError('');
    try {
      await createContactSeller(productId, {
        quantity: Number(quantity),
        unit_type: unitType === 'others' ? 'others' : unitType,
        custom_unit: unitType === 'others' ? (customUnit || '') : undefined,
        sourcing_details: details || ''
      });
      setSuccess('Request sent successfully.');
      reset();
      // Auto-close after the alert shows briefly
      setTimeout(() => { setSuccess(''); if (typeof onClose === 'function') onClose(); }, 1200);
    } catch (e) {
      setError(e?.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Panel */}
      <div className="relative mt-16 w-[92%] max-w-2xl rounded-md bg-white shadow-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-[18px] font-semibold text-slate-900">Contact {roleLabel} for latest Price</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-500">
              <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811Z" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}
          {/* Purchase Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
            <label className="text-sm text-slate-700 sm:pt-2">Purchase Quantity</label>
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="1" placeholder="" className="h-10 rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:col-span-1" />
            <div className="sm:col-span-1">
              <select value={unitType} onChange={(e) => setUnitType(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="pieces">Pieces</option>
                <option value="boxes">Boxes</option>
                <option value="meters">Meters</option>
                <option value="others">Others</option>
              </select>
              {unitType === 'others' && (
                <input value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} type="text" className="mt-2 h-10 w-full rounded border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter custom unit" />
              )}
            </div>
          </div>

          {/* Sourcing Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
            <label className="text-sm text-slate-700 sm:pt-2">Sourcing Details</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={5} className="sm:col-span-2 w-full rounded border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="pt-2">
            <button onClick={handleSend} disabled={submitting} className={`w-full sm:w-40 h-10 rounded text-white text-sm font-medium ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#027DDB] hover:brightness-95'}`}>{submitting ? 'Sending…' : 'Send'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
