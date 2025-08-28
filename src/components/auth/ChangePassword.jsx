import React, { useCallback, useEffect, useState, memo } from 'react';
import { changePassword } from '../../services/authApi';

// Memoized password input to avoid unnecessary re-mounts and keep focus
const PasswordInput = memo(function PasswordInput({
  label,
  field,
  placeholder,
  value,
  showPassword,
  onToggle,
  onChange,
  onFocusField,
  onBlurField,
  isActive,
  isLoading,
  error,
}) {
  return (
    <div className={`transition-colors ${isActive ? 'text-blue-600' : ''}`}>
      <label className={`block text-sm font-medium mb-2 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-700'}`}>
        {label}
      </label>
      <div className={`relative rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500`}>
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          onFocus={() => onFocusField(field)}
          onBlur={() => onBlurField(field)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-900 transition-colors ${isActive || value ? 'bg-blue-50/30' : 'bg-white'}`}
          autoComplete={field === 'oldPassword' ? 'current-password' : 'new-password'}
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => onToggle(field)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showPassword ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            )}
          </svg>
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
});

const ChangePassword = ({ onComplete, onCancel }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [activeField, setActiveField] = useState(null);

  // Auto-hide success after 4s
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev));
  }, []);

  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleFocusField = useCallback((field) => {
    setActiveField(field);
  }, []);

  const handleBlurField = useCallback((field) => {
    setActiveField(prev => (prev === field ? null : prev));
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.oldPassword) {
      newErrors.oldPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.oldPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await changePassword(
        formData.oldPassword,
        formData.newPassword,
        formData.confirmPassword
      );

      // Show success alert and clear form
      setSuccess('Your password has been changed successfully.');
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });

      if (onComplete) {
        onComplete({ success: true, result });
      }
    } catch (err) {
      setErrors({ general: err.message || 'Failed to change password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>

      {success && (
        <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-800 shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500" />
          <div className="flex items-start">
            <svg className="w-5 h-5 mt-0.5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="font-semibold">Password changed successfully</p>
              <p className="text-sm">You can now use your new password to sign in next time.</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          label="Current Password"
          field="oldPassword"
          placeholder="Enter your current password"
          value={formData.oldPassword}
          showPassword={showPasswords.oldPassword}
          onToggle={togglePasswordVisibility}
          onChange={handleInputChange}
          onFocusField={handleFocusField}
          onBlurField={handleBlurField}
          isActive={activeField === 'oldPassword'}
          isLoading={isLoading}
          error={errors.oldPassword}
        />

        <PasswordInput
          label="New Password"
          field="newPassword"
          placeholder="Enter your new password"
          value={formData.newPassword}
          showPassword={showPasswords.newPassword}
          onToggle={togglePasswordVisibility}
          onChange={handleInputChange}
          onFocusField={handleFocusField}
          onBlurField={handleBlurField}
          isActive={activeField === 'newPassword'}
          isLoading={isLoading}
          error={errors.newPassword}
        />

        <PasswordInput
          label="Confirm New Password"
          field="confirmPassword"
          placeholder="Confirm your new password"
          value={formData.confirmPassword}
          showPassword={showPasswords.confirmPassword}
          onToggle={togglePasswordVisibility}
          onChange={handleInputChange}
          onFocusField={handleFocusField}
          onBlurField={handleBlurField}
          isActive={activeField === 'confirmPassword'}
          isLoading={isLoading}
          error={errors.confirmPassword}
        />

        {errors.general && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
            {errors.general}
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
