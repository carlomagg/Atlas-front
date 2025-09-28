import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { sendMessage } from '../../services/messagesApi';
import { useAuth } from '../../context/AuthContext';

const MessageModal = ({ isOpen, onClose, productId, productTitle, recipientInfo }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Form state
  const [msgFromEmail, setMsgFromEmail] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [msgSuccess, setMsgSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsgError('');
    setMsgSuccess('');
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const body = msgBody.trim();
    const fromEmail = msgFromEmail.trim();
    
    if (fromEmail === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
      setMsgError('Please enter a valid email.');
      return;
    }
    
    if (body.length < 20) {
      setMsgError('Message must be at least 20 characters.');
      return;
    }

    // Check if we have at least one recipient identifier
    const hasRecipient = recipientInfo?.email || recipientInfo?.atlas_id || recipientInfo?.user || recipientInfo?.name || productId;
    if (!hasRecipient) {
      setMsgError('Unable to send message: Recipient information not available.');
      return;
    }

    setMsgSending(true);
    try {
      const subject = `Inquiry about ${productTitle || `Product #${productId}`}`;
      const finalBody = `From: ${fromEmail}\n\nProduct: ${productTitle || `#${productId}`}\n\n${body}`;
      
      const messageData = {
        subject,
        body: finalBody,
        related_product: productId
      };

      // Add available recipient identifiers (following ProductDetails pattern)
      if (recipientInfo?.email) messageData.recipient_email = recipientInfo.email;
      if (recipientInfo?.atlas_id) messageData.recipient_atlas_id = recipientInfo.atlas_id;
      
      // If no other recipient info is available, the backend should be able to find the recipient via related_product
      console.log('Sending message with data:', messageData);
      
      await sendMessage(messageData);
      
      setMsgSuccess('Message sent successfully.');
      setMsgBody('');
      setMsgFromEmail('');
      
      setTimeout(() => {
        setMsgSuccess('');
        onClose();
      }, 2500);
    } catch (err) {
      setMsgError(err?.message || 'Failed to send message');
    } finally {
      setMsgSending(false);
    }
  };

  const handleClose = () => {
    setMsgError('');
    setMsgSuccess('');
    setMsgBody('');
    setMsgFromEmail('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose}></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#027DDB] text-white rounded-t-lg">
            <div>
              <h3 className="text-lg font-semibold">{t('leaveMessage') || 'Leave a Message'}</h3>
              <p className="text-sm opacity-90">
                {productTitle ? `About: ${productTitle}` : `Product #${productId}`}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded hover:bg-blue-700 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* From Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> {t('fromEmail') || 'Your Email'}:
                </label>
                <input
                  type="email"
                  placeholder={t('enterYourEmail') || 'Enter your email address'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent"
                  value={msgFromEmail}
                  onChange={(e) => setMsgFromEmail(e.target.value)}
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> {t('message') || 'Message'}:
                </label>
                <textarea
                  rows={5}
                  placeholder={t('enterMessage') || 'Enter your message (minimum 20 characters)'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#027DDB] focus:border-transparent resize-none"
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  required
                  minLength={20}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {msgBody.length}/4000 characters (minimum 20)
                </div>
              </div>

              {/* Error/Success Messages */}
              {msgError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {msgError}
                </div>
              )}
              {msgSuccess && (
                <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3">
                  {msgSuccess}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={msgSending}
                  className={`flex-1 px-4 py-2 rounded-md text-white font-medium transition-colors ${
                    msgSending 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#027DDB] hover:bg-[#0266b3]'
                  }`}
                >
                  {msgSending ? (t('sending') || 'Sending...') : (t('sendMessage') || 'Send Message')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
