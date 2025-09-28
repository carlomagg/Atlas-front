import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import chatApi from '../services/chatApi';
import chatWebSocket from '../services/chatWebSocket';
import agentHeartbeat from '../services/agentHeartbeat';
import notificationApi from '../services/notificationApi';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFloatingVisible, setIsFloatingVisible] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('api_only');
  const [agentInfo, setAgentInfo] = useState(null);
  const [notificationCounts, setNotificationCounts] = useState({
    unread_messages: 0,
    active_conversations: 0,
    total_conversations: 0,
    user_type: 'anonymous'
  });

  // Initialize session for all users (backend requires session_id for all conversations)
  useEffect(() => {
    if (!sessionId) {
      initializeSession();
    }
  }, [sessionId]);

  // Fetch notification counts
  const fetchNotificationCounts = async () => {
    try {
      const counts = await notificationApi.getNotificationCounts(sessionId);
      setNotificationCounts(counts);
      
      // Update legacy unread count for backward compatibility
      setUnreadCount(counts.unread_messages);
      
      console.log('📊 Notification counts updated:', counts);
    } catch (error) {
      console.error('❌ Failed to fetch notification counts:', error);
    }
  };

  // Fetch notification counts when session or authentication changes
  useEffect(() => {
    if (sessionId || isAuthenticated) {
      fetchNotificationCounts();
    }
  }, [sessionId, isAuthenticated]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize session for anonymous users
  const initializeSession = async () => {
    try {
      const session = await chatApi.createSession();
      setSessionId(session.session_id);
      localStorage.setItem('chat_session_id', session.session_id);
    } catch (error) {
      console.error('Failed to create chat session:', error);
    }
  };

  // Load existing session from localStorage
  useEffect(() => {
    const storedSessionId = localStorage.getItem('chat_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    }
  }, []);

  // Start a new conversation
  const startConversation = async (subject = 'General Inquiry', department = 'general', initialMessage = null) => {
    setIsLoading(true);
    try {
      // Ensure we have a session ID before creating any conversation
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        await initializeSession();
        currentSessionId = localStorage.getItem('chat_session_id');
      }

      let conversation;
      
      if (isAuthenticated) {
        // Authenticated user conversation (still needs session_id per backend requirement)
        conversation = await chatApi.createAuthenticatedUserConversation(subject, department, initialMessage, currentSessionId);
      } else {
        // Anonymous user conversation
        const userEmail = 'guest@example.com'; // You might want to collect this
        const userName = 'Guest User'; // You might want to collect this
        
        conversation = await chatApi.createAnonymousUserConversation(
          currentSessionId,
          userEmail,
          userName,
          subject,
          department,
          initialMessage
        );
      }
      
      setCurrentConversation(conversation);
      
      // Load conversation messages
      if (conversation.messages && conversation.messages.length > 0) {
        const formattedMessages = conversation.messages.map(msg => chatApi.formatMessageForDisplay(msg));
        setChatHistory(formattedMessages);
      } else {
        // Add welcome message if no messages
        const welcomeMessage = {
          id: 'welcome-' + Date.now(),
          text: "Hello! Welcome to Atlas-WD Support. How can I help you today?",
          sender: 'agent',
          timestamp: new Date(),
          avatar: conversation.agent?.avatar_url || chatApi.generateAvatarUrl(conversation.agent?.agent_name || 'Support', '10B981')
        };
        setChatHistory([welcomeMessage]);
      }
      
      // Set agent info
      if (conversation.agent) {
        setAgentInfo(conversation.agent);
      }
      
      // WebSocket disabled - using API-only mode
      // connectToWebSocket(conversation.id);
      
      // Set status as online for authenticated users, api_only for others
      if (isAuthenticated) {
        setConnectionStatus('api_only'); // Shows as "Online" in UI
      } else {
        setConnectionStatus('api_only');
      }
      
      return conversation;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    } finally {
      setIsLoading(false);
      // Don't override connection status here
    }
  };

  // Connect to WebSocket for real-time messaging
  const connectToWebSocket = (conversationId) => {
    const eventHandlers = {
      onOpen: () => {
        setConnectionStatus('connected');
        console.log('🟢 Connected to chat WebSocket - Real-time messaging active!');
        
        // Start agent heartbeat if user is authenticated (potential agent)
        if (isAuthenticated) {
          agentHeartbeat.startHeartbeat();
        }
      },
      onClose: (event) => {
        // Stop heartbeat when WebSocket closes
        agentHeartbeat.stopHeartbeat();
        
        // If WebSocket is not available, fall back to API-only mode
        if (event && (event.code === 1006 || event.code === 1002)) {
          console.log('🔵 WebSocket not available, using API-only mode');
          setConnectionStatus('api_only');
        } else {
          setConnectionStatus('disconnected');
        }
      },
      onError: (error) => {
        console.error('❌ WebSocket error:', error);
        // Fall back to API-only mode if WebSocket fails
        setConnectionStatus('api_only');
        agentHeartbeat.stopHeartbeat();
      },
      onNewMessage: (message) => {
        console.log('💬 Real-time message received!');
        const formattedMessage = chatApi.formatMessageForDisplay(message);
        setChatHistory(prev => [...prev, formattedMessage]);
        
        // If message is from agent and chat is closed, increment unread count
        if (message.sender === 'agent' && !isChatOpen) {
          setUnreadCount(prev => prev + 1);
          // Also update notification counts
          setNotificationCounts(prev => ({
            ...prev,
            unread_messages: prev.unread_messages + 1
          }));
        }
        
        // Refresh notification counts after receiving message
        setTimeout(fetchNotificationCounts, 500);
      },
      onTyping: (data) => {
        console.log('⌨️ Real-time typing indicator:', data);
        if (data.sender_type === 'agent') {
          setIsTyping(data.is_typing);
        }
      },
      onAgentStatus: (data) => {
        console.log('👤 Real-time agent status update:', data);
        setAgentInfo(prev => prev ? { ...prev, status: data.status } : null);
      },
      onAgentOnline: (data) => {
        console.log('🟢 Agent came online:', data);
        setAgentInfo(prev => prev ? { ...prev, status: 'online' } : null);
      },
      onAgentOffline: (data) => {
        console.log('🔴 Agent went offline:', data);
        setAgentInfo(prev => prev ? { ...prev, status: 'offline' } : null);
      },
      onTestMessage: (data) => {
        console.log('🧪 WebSocket test message received:', data);
        // Add test message to chat for verification
        const testMessage = {
          id: 'test-' + Date.now(),
          text: `🧪 WebSocket Test: ${data.message || 'Connection working!'}`,
          sender: 'system',
          timestamp: new Date(),
          avatar: '🧪'
        };
        setChatHistory(prev => [...prev, testMessage]);
      },
      onAgentAssigned: (data) => {
        console.log('👨‍💼 Agent assigned to conversation:', data);
        if (data.agent) {
          setAgentInfo(data.agent);
        }
      },
      onNotificationCountUpdate: (data) => {
        console.log('📊 Real-time notification count update:', data);
        // Refresh notification counts when update is received
        fetchNotificationCounts();
      },
      onReconnecting: (attempt) => {
        setConnectionStatus('reconnecting');
        console.log(`🔄 Reconnecting attempt ${attempt}`);
      },
      onMaxReconnectAttemptsReached: () => {
        console.log('🔴 Max WebSocket reconnect attempts reached, falling back to API-only mode');
        setConnectionStatus('api_only');
        agentHeartbeat.stopHeartbeat();
      }
    };

    try {
      chatWebSocket.connect(conversationId, eventHandlers);
    } catch (error) {
      console.error('❌ Failed to connect to WebSocket:', error);
      setConnectionStatus('api_only');
    }
  };

  // Send a message
  const sendMessage = async (messageText, messageType = 'text') => {
    if (!currentConversation || !messageText.trim()) return;

    try {
      // Add message to UI immediately for better UX
      const tempMessage = {
        id: 'temp-' + Date.now(),
        text: messageText,
        sender: 'user',
        timestamp: new Date(),
        avatar: user?.avatar_url || chatApi.generateAvatarUrl(user?.name || user?.email || 'User'),
        senderName: user?.name || user?.email || 'User'
      };
      
      setChatHistory(prev => [...prev, tempMessage]);

      // Send via API (WebSocket disabled)
      await chatApi.sendUserMessage(currentConversation.id, messageText, user?.id, messageType);

      // Refresh messages after sending (fallback for when WebSocket isn't working)
      setTimeout(async () => {
        try {
          const messages = await chatApi.getMessages(currentConversation.id);
          if (messages.messages && messages.messages.length > 0) {
            const formattedMessages = messages.messages.map(msg => chatApi.formatMessageForDisplay(msg));
            setChatHistory(formattedMessages);
          }
        } catch (error) {
          console.error('Failed to refresh messages after sending:', error);
        }
      }, 1000); // Wait 1 second for potential agent response

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // If conversation doesn't exist (404), start a new one
      if (error.message.includes('Not found') || error.message.includes('404')) {
        console.log('Conversation not found, starting new conversation...');
        // Remove temp message
        setChatHistory(prev => prev.filter(msg => !msg.id.toString().startsWith('temp-')));
        
        try {
          // Start new conversation and resend message
          await startConversation('General Inquiry', 'general', messageText);
        } catch (newConvError) {
          console.error('Failed to start new conversation:', newConvError);
          throw newConvError;
        }
      } else {
        // Remove temp message on other errors
        setChatHistory(prev => prev.filter(msg => !msg.id.toString().startsWith('temp-')));
        throw error;
      }
    }
  };

  // Send typing indicator
  const sendTypingIndicator = (isTyping) => {
    if (!currentConversation) return;

    // Try WebSocket first
    const sent = chatWebSocket.sendTypingIndicator(
      currentConversation.id, 
      isAuthenticated ? 'user' : 'guest', 
      isTyping
    );

    // Fallback to API if WebSocket not available
    if (!sent) {
      chatApi.sendTypingIndicator(currentConversation.id, 'user', isTyping)
        .catch(error => console.error('Failed to send typing indicator via API:', error));
    }
  };

  // Test WebSocket connection
  const testWebSocketConnection = async () => {
    if (!currentConversation) {
      console.warn('🧪 No active conversation to test WebSocket');
      return;
    }

    try {
      console.log('🧪 Testing WebSocket connection...');
      await chatApi.testWebSocket(currentConversation.id);
      
      // Add a test message to show the test was initiated
      const testInitMessage = {
        id: 'test-init-' + Date.now(),
        text: '🧪 WebSocket test initiated... Check for test response!',
        sender: 'system',
        timestamp: new Date(),
        avatar: '🧪'
      };
      setChatHistory(prev => [...prev, testInitMessage]);
      
    } catch (error) {
      console.error('🧪 WebSocket test failed:', error);
      
      // Add error message to chat
      const errorMessage = {
        id: 'test-error-' + Date.now(),
        text: `🧪 WebSocket test failed: ${error.message}`,
        sender: 'system',
        timestamp: new Date(),
        avatar: '❌'
      };
      setChatHistory(prev => [...prev, errorMessage]);
    }
  };

  // Validate if current conversation exists
  const validateCurrentConversation = async () => {
    if (!currentConversation) return false;
    
    try {
      await chatApi.getConversation(currentConversation.id);
      return true;
    } catch (error) {
      if (error.message.includes('Not found') || error.message.includes('404')) {
        console.log('Current conversation no longer exists, clearing state');
        setCurrentConversation(null);
        setChatHistory([]);
        return false;
      }
      // For other errors, assume conversation still exists
      return true;
    }
  };

  // Refresh messages manually
  const refreshMessages = async () => {
    if (!currentConversation) return;
    
    // Validate conversation exists first
    const isValid = await validateCurrentConversation();
    if (!isValid) return;
    
    try {
      const messages = await chatApi.getMessages(currentConversation.id);
      if (messages.messages && messages.messages.length > 0) {
        const formattedMessages = messages.messages.map(msg => chatApi.formatMessageForDisplay(msg));
        setChatHistory(formattedMessages);
        console.log('🔄 Messages refreshed:', formattedMessages.length, 'messages loaded');
      }
    } catch (error) {
      console.error('Failed to refresh messages:', error);
      
      // If conversation doesn't exist (404), clear the current conversation
      if (error.message.includes('Not found') || error.message.includes('404')) {
        console.log('Conversation not found during refresh, clearing current conversation state');
        setCurrentConversation(null);
        setChatHistory([]);
      }
    }
  };

  const openChat = async () => {
    setIsChatOpen(true);
    setUnreadCount(0);
    
    // For authenticated users, always try to load existing conversation first
    if (isAuthenticated && user?.id) {
      try {
        console.log('Opening chat for authenticated user, checking for existing conversations');
        
        // Always check for existing conversations, even if we think we have one
        const conversations = await chatApi.getUserConversations(user.id);
        if (conversations && conversations.length > 0) {
          // Get the most recent active conversation
          const activeConversation = conversations.find(conv => conv.status === 'active') || conversations[0];
          
          if (activeConversation) {
            // Only set if it's different from current conversation
            if (!currentConversation || currentConversation.id !== activeConversation.id) {
              console.log('Loading existing conversation:', activeConversation.id);
              setCurrentConversation(activeConversation);
              
              // Load messages
              const messages = await chatApi.getMessages(activeConversation.id);
              if (messages.messages) {
                const formattedMessages = messages.messages.map(msg => chatApi.formatMessageForDisplay(msg));
                setChatHistory(formattedMessages);
              }
              
              // Set agent info
              if (activeConversation.agent) {
                setAgentInfo(activeConversation.agent);
              }
            } else {
              // Same conversation, just refresh messages
              console.log('Same conversation, refreshing messages');
              await refreshMessages();
            }
            return; // Exit early, we have a conversation
          }
        }
        
        // No existing conversations found, start a new one
        console.log('No existing conversations found, starting new one');
        await startConversation();
        
      } catch (error) {
        console.error('Failed to load existing conversation, starting new one:', error);
        await startConversation();
      }
    } else if (!currentConversation) {
      // Start new conversation for anonymous users or if no existing conversation
      try {
        await startConversation();
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }
    } else {
      // Refresh messages when opening existing conversation
      await refreshMessages();
    }
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const toggleChat = async () => {
    if (isChatOpen) {
      closeChat();
    } else {
      await openChat();
    }
  };

  const hideFloatingWidget = () => {
    setIsFloatingVisible(false);
    closeChat();
  };

  const showFloatingWidget = () => {
    setIsFloatingVisible(true);
  };

  const markAsRead = async () => {
    console.log('🔵 Mark as read clicked');
    console.log('📋 Current conversation:', currentConversation);
    console.log('🔢 Current unread count:', unreadCount);
    console.log('💬 Current chat history length:', chatHistory.length);
    
    // Optimistically set unread count to 0
    setUnreadCount(0);
    
    // Only attempt to mark conversation as read if we have a valid conversation
    if (!currentConversation || !currentConversation.id) {
      console.log('❌ No valid conversation to mark as read');
      return;
    }
    
    try {
      console.log('📤 Attempting to mark all unread messages as read for conversation:', currentConversation.id);
      const result = await notificationApi.markConversationAsRead(currentConversation.id);
      
      console.log('✅ Mark as read completed:', result);
      console.log(`📊 Marked ${result.marked_count} messages as read`);
      
      if (result.marked_count > 0) {
        // Update the chat history to reflect read status
        setChatHistory(prevHistory => 
          prevHistory.map(msg => 
            msg.sender === 'agent' && !msg.isRead 
              ? { ...msg, isRead: true }
              : msg
          )
        );
        console.log('✅ Updated chat history with read status');
      }
      
      // Refresh notification counts after marking as read
      console.log('🔄 Refreshing notification counts...');
      await fetchNotificationCounts();
      console.log('✅ Notification counts refreshed');
      
    } catch (error) {
      console.error('❌ Failed to mark conversation as read:', error);
      
      // Reset unread count on error
      setUnreadCount(unreadCount);
      
      // If conversation doesn't exist (404), clear the current conversation
      if (error.message.includes('HTTP 404') || error.message.includes('Not found')) {
        console.log('🚫 Conversation not found, clearing current conversation state');
        setCurrentConversation(null);
        setChatHistory([]);
        // Still refresh notification counts to get accurate state
        await fetchNotificationCounts();
      }
    }
  };

  // Load existing conversation for authenticated users
  const loadExistingConversation = async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      console.log('🔍 Loading existing conversations for user:', user.id);
      const conversations = await chatApi.getUserConversations(user.id);
      
      if (conversations && conversations.length > 0) {
        console.log('📋 Found', conversations.length, 'existing conversations');
        
        // Get the most recent active conversation, or the most recent one
        const activeConversation = conversations.find(conv => conv.status === 'active') || 
                                 conversations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        
        if (activeConversation) {
          console.log('✅ Loading conversation:', activeConversation.id, 'Status:', activeConversation.status);
          
          // Only set if it's different from current conversation
          if (!currentConversation || currentConversation.id !== activeConversation.id) {
            setCurrentConversation(activeConversation);
            
            // Load messages
            const messages = await chatApi.getMessages(activeConversation.id);
            if (messages.messages && messages.messages.length > 0) {
              const formattedMessages = messages.messages.map(msg => chatApi.formatMessageForDisplay(msg));
              setChatHistory(formattedMessages);
              console.log('💬 Loaded', formattedMessages.length, 'messages from existing conversation');
            } else {
              // Add welcome message if no messages
              const welcomeMessage = {
                id: 'welcome-' + Date.now(),
                text: "Hello! Welcome back to Atlas-WD Support. How can I help you today?",
                sender: 'agent',
                timestamp: new Date(),
                avatar: activeConversation.agent?.avatar_url || chatApi.generateAvatarUrl(activeConversation.agent?.agent_name || 'Support', '10B981')
              };
              setChatHistory([welcomeMessage]);
            }
            
            // Set agent info
            if (activeConversation.agent) {
              setAgentInfo(activeConversation.agent);
            }
          } else {
            console.log('📝 Same conversation already loaded, skipping');
          }
        }
      } else {
        console.log('📭 No existing conversations found for user');
      }
    } catch (error) {
      console.error('❌ Failed to load existing conversation:', error);
    }
  };

  // Clear chat state when user logs out or different user logs in
  const clearChatState = () => {
    setCurrentConversation(null);
    setChatHistory([]);
    setAgentInfo(null);
    setUnreadCount(0);
    setConnectionStatus('api_only');
    setIsTyping(false);
    setIsChatOpen(false);
    
    // WebSocket disabled - no connections to disconnect
    // if (currentConversation) {
    //   chatWebSocket.disconnect(currentConversation.id);
    // }
    
    // Clear session for anonymous users when logging out
    if (!isAuthenticated) {
      setSessionId(null);
      localStorage.removeItem('chat_session_id');
    }
  };

  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // User logged in - load their conversations
      console.log('User authenticated, loading user conversations for:', user.id);
      
      // Always try to load existing conversations for authenticated users
      loadExistingConversation();
    } else if (!isAuthenticated) {
      // User logged out - clear all authenticated user data
      console.log('User logged out, clearing chat state');
      clearChatState();
      // Create new anonymous session
      initializeSession();
    }
  }, [isAuthenticated, user?.id]);

  // Load existing conversation on app initialization for authenticated users
  useEffect(() => {
    // This runs when authentication state is ready
    if (isAuthenticated && user?.id && !currentConversation) {
      console.log('App initialized with authenticated user, loading existing conversations');
      loadExistingConversation();
    }
  }, [isAuthenticated, user?.id, currentConversation]); // Depends on auth state and current conversation

  // Clear chat state when user changes (different user ID)
  const [previousUserId, setPreviousUserId] = useState(null);
  useEffect(() => {
    if (user?.id && previousUserId && user.id !== previousUserId) {
      // Different user logged in - clear previous user's chat data
      console.log('Different user detected, clearing chat state');
      clearChatState();
    }
    setPreviousUserId(user?.id || null);
  }, [user?.id, previousUserId]);

  // Clean up WebSocket connections on unmount
  useEffect(() => {
    return () => {
      if (currentConversation) {
        chatWebSocket.disconnect(currentConversation.id);
      }
    };
  }, [currentConversation]);

  const value = {
    // State
    isChatOpen,
    isFloatingVisible,
    unreadCount,
    chatHistory,
    isOnline,
    currentConversation,
    sessionId,
    isLoading,
    isTyping,
    connectionStatus,
    agentInfo,
    notificationCounts,
    
    // Actions
    openChat,
    closeChat,
    toggleChat,
    hideFloatingWidget,
    showFloatingWidget,
    markAsRead,
    startConversation,
    sendMessage,
    sendTypingIndicator,
    loadExistingConversation,
    clearChatState,
    testWebSocketConnection,
    refreshMessages,
    fetchNotificationCounts,
    validateCurrentConversation
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
