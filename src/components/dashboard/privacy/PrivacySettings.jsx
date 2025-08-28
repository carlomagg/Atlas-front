import React, { useEffect, useState } from 'react';
import { getPrivacySettings, updatePrivacySettings } from '../../../services/privacyApi';

// UI <-> API enum mapping
const UI_TO_API = {
  all: 'ALL_MEMBERS',
  premium: 'PREMIUM_ONLY',
  none: 'PRIVATE'
};

const API_TO_UI = {
  ALL_MEMBERS: 'all',
  PREMIUM_ONLY: 'premium',
  PRIVATE: 'none'
};

// Privacy visibility options (UI)
const OPTIONS = [
  { key: 'all', label: 'Allow company information and full contact details to be viewed by all members.' },
  { key: 'premium', label: 'Allow full contact details to be viewed by premium members only.' },
  { key: 'none', label: 'Do not allow company info or contact details to be viewed by any member.' }
];

const PrivacySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // current value from server
  const [value, setValue] = useState('all');
  // edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('all');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getPrivacySettings().catch(() => null);
        if (!mounted) return;
        const serverEnum = data?.privacy_setting;
        const v = API_TO_UI[serverEnum] || 'all';
        setValue(v);
        setDraft(v);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load privacy settings');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const onSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const enumToSend = UI_TO_API[draft] || 'ALL_MEMBERS';
      const resp = await updatePrivacySettings(enumToSend);
      setValue(draft);
      setIsEditing(false);
      setSuccess(resp?.message || 'Privacy settings updated successfully.');
    } catch (e) {
      setError(e?.message || 'Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const currentLabel = OPTIONS.find(o => o.key === value)?.label || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">{isEditing ? 'Edit Privacy Information' : 'Manage Privacy Information'}</h1>

        {success && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 text-green-800 px-4 py-2 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        {!isEditing ? (
          <div className="">
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12">
                <div className="col-span-3 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 border-r">Permission Setting</div>
                <div className="col-span-9 px-4 py-3 text-sm text-gray-800">{currentLabel}</div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-3">Permission Setting</div>
              <div className="space-y-3">
                {OPTIONS.map(opt => (
                  <label key={opt.key} className="flex items-start space-x-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="privacy-permission"
                      className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      checked={draft === opt.key}
                      onChange={() => setDraft(opt.key)}
                    />
                    <span className="text-sm text-gray-800">{opt.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Member with offers can only choose to allow company info and full contact details to be viewed by all members.
              </p>
            </div>

            <div className="mt-6 flex items-center space-x-4">
              <button
                type="button"
                disabled={saving}
                onClick={onSave}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => { setIsEditing(false); setDraft(value); setError(''); }}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-md text-sm font-medium text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacySettings;
