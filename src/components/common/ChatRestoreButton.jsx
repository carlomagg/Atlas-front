import React from 'react';
import { useChat } from '../../context/ChatContext';

const ChatRestoreButton = () => {
  const { isFloatingVisible, showFloatingWidget, unreadCount } = useChat();

  if (isFloatingVisible) return null;

  return (
    <button
      onClick={showFloatingWidget}
      className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-300 transform hover:scale-105 z-[9997] group"
      title="Show chat widget"
    >
      {/* Notification Badge */}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
      
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          Show Chat Support
          <div className="absolute top-full right-2 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1"></div>
        </div>
      </div>
    </button>
  );
};

export default ChatRestoreButton;
