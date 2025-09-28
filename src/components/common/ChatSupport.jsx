import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

const ChatSupport = ({ isOpen, onClose, isFloating = false }) => {
  const { 
    chatHistory, 
    sendMessage,
    sendTypingIndicator,
    isTyping,
    connectionStatus,
    agentInfo,
    currentConversation,
    markAsRead,
    testWebSocketConnection,
    refreshMessages,
    startConversation
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { isAuthenticated, user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Disabled automatic markAsRead to prevent 404 errors with invalid conversations
  // useEffect(() => {
  //   if (isOpen && currentConversation) {
  //     markAsRead();
  //   }
  // }, [isOpen, currentConversation, markAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      console.log('Empty message, not sending');
      return;
    }

    console.log('🚀 Starting to send message:', newMessage);
    console.log('📋 Current conversation:', currentConversation);

    try {
      setLocalLoading(true);
      const messageText = newMessage;
      setNewMessage('');
      
      // If no conversation exists, start one first
      if (!currentConversation) {
        console.log('🆕 No conversation exists, starting new conversation with message:', messageText);
        await startConversation('General Inquiry', 'general', messageText);
        console.log('✅ New conversation started successfully');
      } else {
        console.log('📤 Sending message to existing conversation:', currentConversation.id);
        await sendMessage(messageText);
        console.log('✅ Message sent successfully');
      }
      
      // Clear typing indicator
      if (currentConversation) {
        sendTypingIndicator(false);
      }
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      // Restore message on error
      setNewMessage(messageText);
    } finally {
      console.log('🏁 Finished sending message, clearing loading state');
      setLocalLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { text: "I need help with my account", icon: "👤" },
    { text: "Product inquiry", icon: "📦" },
    { text: "Payment issues", icon: "💳" },
    { text: "Technical support", icon: "🔧" },
  ];

  const handleQuickAction = (actionText) => {
    setNewMessage(actionText);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (currentConversation && e.target.value.trim()) {
      sendTypingIndicator(true);
      
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to stop typing indicator
      const timeout = setTimeout(() => {
        sendTypingIndicator(false);
        setTypingTimeout(null);
      }, 1000);
      
      setTypingTimeout(timeout);
    } else if (typingTimeout) {
      // Stop typing if message is empty
      sendTypingIndicator(false);
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  if (!isOpen && isFloating) return null;

  const chatContent = (
    <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col ${
      isFloating 
        ? 'fixed bottom-4 right-4 w-80 h-96 z-[9999]' 
        : 'w-full h-full max-w-2xl mx-auto'
    } ${isMinimized && isFloating ? 'h-14' : ''}`}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-sm">🎧</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {agentInfo?.agent_name || 'Atlas-WD Support'}
            </h3>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs opacity-90">Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Refresh Messages Button */}
          <button
            onClick={refreshMessages}
            className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
            title="Refresh messages"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          {/* Mark as Read Button */}
          {currentConversation && (
            <button
              onClick={() => {
                console.log('🔵 Mark as read button clicked');
                markAsRead();
              }}
              className="text-white hover:bg-white hover:bg-opacity-20 px-2 py-1 rounded transition-colors flex items-center space-x-1"
              title="Mark as read"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs">Mark as read</span>
            </button>
          )}
          
          {isFloating && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={isMinimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {!isAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-yellow-800 text-sm">
                  💡 <strong>Tip:</strong> Sign in to get personalized support and faster responses!
                </p>
              </div>
            )}

            {localLoading && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Sending message...</span>
              </div>
            )}

            {!currentConversation && !localLoading && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-gray-600 text-sm">Welcome to Atlas-WD Support!</p>
                <p className="text-gray-500 text-xs mt-1">Click a quick action below or type a message to start chatting.</p>
              </div>
            )}

            {chatHistory.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end space-x-2 max-w-xs ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs overflow-hidden">
                    {message.avatar && message.avatar.startsWith('http') ? (
                      <img src={message.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span>{message.avatar || (message.sender === 'user' ? '👤' : '🎧')}</span>
                    )}
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-end space-x-2 max-w-xs">
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                    🎧
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {(!currentConversation || chatHistory.length <= 1) && !localLoading && (
            <div className="p-4 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-600 mb-2">Quick actions:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.text)}
                    className="text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
                  >
                    <span className="mr-1">{action.icon}</span>
                    {action.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                  placeholder={currentConversation ? "Type your message..." : "Start a conversation..."}
                  className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  rows="1"
                  style={{ minHeight: '36px', maxHeight: '80px' }}
                  disabled={localLoading}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              {isAuthenticated && (
                <p className="text-xs text-gray-500">
                  Logged in as {user?.email || user?.name || 'User'}
                </p>
              )}
              
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-xs text-gray-500">Online</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (isFloating) {
    return chatContent;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="w-full max-w-2xl h-[600px]">
        {chatContent}
      </div>
    </div>
  );
};

export default ChatSupport;
