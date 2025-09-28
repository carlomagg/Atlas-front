import React, { useState, useEffect } from 'react';
import ChatSupport from './ChatSupport';
import { useChat } from '../../context/ChatContext';

const FloatingChatWidget = () => {
  const { 
    isChatOpen, 
    toggleChat,
    closeChat,
    isFloatingVisible, 
    unreadCount,
    notificationCounts,
    hideFloatingWidget,
    showFloatingWidget
  } = useChat();
  
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  // Show welcome message after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isChatOpen && isFloatingVisible) {
        setShowWelcomeMessage(true);
        
        // Hide welcome message after 5 seconds
        setTimeout(() => {
          setShowWelcomeMessage(false);
        }, 5000);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isChatOpen, isFloatingVisible]);

  const handleToggleChat = () => {
    toggleChat();
    setShowWelcomeMessage(false);
  };

  const handleCloseChat = () => {
    closeChat();
  };

  if (!isFloatingVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9998]">
      {/* Welcome Message Bubble */}
      {showWelcomeMessage && !isChatOpen && (
        <div className="absolute bottom-16 right-0 mb-2 mr-2">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs relative animate-bounce">
            <button
              onClick={() => setShowWelcomeMessage(false)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center text-xs transition-colors"
            >
              ×
            </button>
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm">🎧</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Atlas-WD Support</p>
                <p className="text-xs text-gray-600 mt-1">
                  Hi! 👋 Need help? I'm here to assist you with any questions about Atlas-WD.
                </p>
              </div>
            </div>
            {/* Arrow pointing to chat button */}
            <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
          </div>
        </div>
      )}

      {/* Chat Support Component */}
      {isChatOpen && (
        <ChatSupport 
          isOpen={isChatOpen} 
          onClose={handleCloseChat} 
          isFloating={true}
        />
      )}

      {/* Chat Toggle Button */}
      {!isChatOpen && (
        <button
          onClick={handleToggleChat}
          className="relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
        >
          {/* Notification Badge */}
          {(notificationCounts.unread_messages > 0 || unreadCount > 0) && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {(notificationCounts.unread_messages || unreadCount) > 9 ? '9+' : (notificationCounts.unread_messages || unreadCount)}
            </div>
          )}
          
          {/* Chat Icon */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
              Chat with Support
              <div className="absolute top-full right-2 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1"></div>
            </div>
          </div>
        </button>
      )}

      {/* Minimize Button (when chat is open) */}
      {isChatOpen && (
        <div className="absolute -top-2 -left-2">
          <button
            onClick={hideFloatingWidget}
            className="w-6 h-6 bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center text-xs transition-colors"
            title="Hide chat widget"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default FloatingChatWidget;
