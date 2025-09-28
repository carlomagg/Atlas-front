import { API_BASE_URL } from '../utils/apiConfig';
import { authStorage } from './authApi';

const CHAT_BASE_URL = `${API_BASE_URL}/chat`;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = authStorage.getToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // If not JSON, use the text as error message
      if (errorText) {
        errorMessage = errorText;
      }
    }
    
    throw new Error(errorMessage);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return await response.text();
};

// Chat API Service for Atlas Chat Support System
class ChatApiService {
  // Session Management (for anonymous users)
  async createSession(pageUrl = null) {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/sessions/create/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          page_url: pageUrl || window.location.href
        })
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  }

  // Conversation Management
  async createConversation(conversationData) {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/conversations/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(conversationData)
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async getConversation(conversationId) {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/conversations/${conversationId}/`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  async getUserConversations(userId) {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/conversations/user/${userId}/`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching user conversations:', error);
      throw error;
    }
  }

  async getSessionConversations(sessionId) {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/conversations/session/${sessionId}/`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching session conversations:', error);
      throw error;
    }
  }

  async updateConversationStatus(conversationId, statusData) {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/conversations/${conversationId}/update_status/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(statusData)
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error updating conversation status:', error);
      throw error;
    }
  }

  // Message Management
  async sendMessage(conversationId, messageData) {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/conversations/${conversationId}/messages/create/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(messageData)
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessages(conversationId, page = 1, pageSize = 50) {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/conversations/${conversationId}/messages/?page=${page}&page_size=${pageSize}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async markMessageAsRead(conversationId, messageId) {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/conversations/${conversationId}/messages/${messageId}/read/`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Agent Management
  async getAvailableAgents(department = null) {
    try {
      const url = department 
        ? `${CHAT_BASE_URL}/agents/available/?department=${department}`
        : `${CHAT_BASE_URL}/agents/available/`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching available agents:', error);
      throw error;
    }
  }

  async updateAgentStatus(agentId, status) {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/agents/${agentId}/update_status/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error updating agent status:', error);
      throw error;
    }
  }

  async getAgentConversations(agentId) {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/agents/${agentId}/conversations/`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching agent conversations:', error);
      throw error;
    }
  }

  // Typing Indicators
  async sendTypingIndicator(conversationId, senderType, isTyping) {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/conversations/${conversationId}/typing/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sender_type: senderType,
          is_typing: isTyping
        })
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error sending typing indicator:', error);
      throw error;
    }
  }

  // WebSocket Connection Management
  createWebSocketConnection(conversationId) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Use environment variable for WebSocket URL if provided, otherwise use current host
    const wsHost = import.meta.env.VITE_WS_BASE_URL || window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/chat/${conversationId}/`;
    
    console.log('🔌 Attempting WebSocket connection to:', wsUrl);
    return new WebSocket(wsUrl);
  }

  createAgentWebSocketConnection() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_WS_BASE_URL || window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/agents/`;
    
    console.log('🔌 Attempting Agent WebSocket connection to:', wsUrl);
    return new WebSocket(wsUrl);
  }

  // Test WebSocket connection
  async testWebSocket(conversationId) {
    try {
      console.log('🧪 Testing WebSocket connection for conversation:', conversationId);
      const response = await fetch(`${CHAT_BASE_URL}/debug/test-websocket/${conversationId}/`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const result = await handleResponse(response);
      console.log('🧪 WebSocket test result:', result);
      return result;
    } catch (error) {
      console.error('🧪 WebSocket test failed:', error);
      throw error;
    }
  }

  // Send heartbeat to keep agent online
  async sendAgentHeartbeat() {
    try {
      const response = await fetch(`${CHAT_BASE_URL}/agents/heartbeat/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          status: 'online'
        })
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('❤️ Agent heartbeat failed:', error);
      throw error;
    }
  }

  // Utility Methods
  generateAvatarUrl(name, backgroundColor = '3B82F6') {
    const encodedName = encodeURIComponent(name || 'User');
    return `https://ui-avatars.com/api/?name=${encodedName}&background=${backgroundColor}&color=fff&size=128`;
  }

  formatMessageForDisplay(message) {
    return {
      id: message.id,
      text: message.message_text,
      sender: message.sender_type,
      senderId: message.sender_id,
      senderName: message.sender_name,
      avatar: message.sender_avatar_url || this.generateAvatarUrl(message.sender_name),
      timestamp: new Date(message.created_at),
      messageType: message.message_type,
      isRead: message.is_read,
      fileUrl: message.file_url,
      fileName: message.file_name,
      fileSize: message.file_size
    };
  }

  // Helper method to create conversation for authenticated user
  async createAuthenticatedUserConversation(subject, department = 'general', initialMessage = null, sessionId = null) {
    const conversationData = {
      subject,
      department,
      priority: 'medium'
    };

    // Backend requires session_id for all conversations
    if (sessionId) {
      conversationData.session_id = sessionId;
    }

    if (initialMessage) {
      conversationData.initial_message = initialMessage;
    }

    return await this.createConversation(conversationData);
  }

  // Helper method to create conversation for anonymous user
  async createAnonymousUserConversation(sessionId, userEmail, userName, subject, department = 'general', initialMessage = null, userAvatarUrl = null) {
    const conversationData = {
      session_id: sessionId,
      user_email: userEmail,
      user_name: userName,
      subject,
      department,
      priority: 'medium'
    };

    if (initialMessage) {
      conversationData.initial_message = initialMessage;
    }

    if (userAvatarUrl) {
      conversationData.user_avatar_url = userAvatarUrl;
    }

    return await this.createConversation(conversationData);
  }

  // Helper method to send user message
  async sendUserMessage(conversationId, messageText, senderId = null, messageType = 'text') {
    const messageData = {
      message_text: messageText,
      sender_type: 'user',
      message_type: messageType
    };

    if (senderId) {
      messageData.sender_id = senderId;
    }

    return await this.sendMessage(conversationId, messageData);
  }

  // Helper method to send agent message
  async sendAgentMessage(conversationId, messageText, agentId, messageType = 'text') {
    const messageData = {
      message_text: messageText,
      sender_type: 'agent',
      sender_id: agentId,
      message_type: messageType
    };

    return await this.sendMessage(conversationId, messageData);
  }
}

// Create and export singleton instance
const chatApi = new ChatApiService();
export default chatApi;

// Export individual methods for convenience
export const {
  // Session Management
  createSession,
  
  // Conversation Management
  createConversation,
  getConversation,
  getUserConversations,
  getSessionConversations,
  updateConversationStatus,
  
  // Message Management
  sendMessage: sendMessageApi,
  getMessages,
  markMessageAsRead,
  
  // Agent Management
  getAvailableAgents,
  updateAgentStatus,
  getAgentConversations,
  sendTypingIndicator,
  sendAgentHeartbeat,
  
  // WebSocket Management
  createWebSocketConnection,
  createAgentWebSocketConnection,
  testWebSocket,
  
  // Utility Methods
  generateAvatarUrl,
  formatMessageForDisplay,
  createAuthenticatedUserConversation,
  createAnonymousUserConversation,
  sendUserMessage,
  sendAgentMessage
} = chatApi;
