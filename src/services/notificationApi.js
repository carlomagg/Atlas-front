import { API_BASE_URL } from '../utils/apiConfig';
import { authStorage } from './authApi';

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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`);
  }
  return await response.json();
};

// Notification API Service
class NotificationApiService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/chat`;
  }

  // Get general notification counts
  async getNotificationCounts(sessionId = null) {
    try {
      let url = `${this.baseUrl}/notifications/counts/`;
      
      // Add session_id for anonymous users
      if (sessionId && !authStorage.getToken()) {
        url += `?session_id=${sessionId}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const result = await handleResponse(response);
      console.log('📊 Notification counts fetched:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch notification counts:', error);
      throw error;
    }
  }

  // Get conversation-specific unread count
  async getConversationUnreadCount(conversationId) {
    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/unread-count/`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const result = await handleResponse(response);
      console.log(`📊 Conversation ${conversationId} unread count:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Failed to fetch unread count for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  // Get agent notification summary (for agents only)
  async getAgentNotificationSummary() {
    try {
      const response = await fetch(`${this.baseUrl}/agents/notification-summary/`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const result = await handleResponse(response);
      console.log('📊 Agent notification summary:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch agent notification summary:', error);
      throw error;
    }
  }

  // Mark individual message as read
  async markMessageAsRead(conversationId, messageId) {
    try {
      const url = `${this.baseUrl}/conversations/${conversationId}/messages/${messageId}/read/`;
      const headers = getAuthHeaders();
      
      console.log('📤 Making mark message as read request:');
      console.log('   URL:', url);
      console.log('   Headers:', headers);
      console.log('   Conversation ID:', conversationId);
      console.log('   Message ID:', messageId);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: headers
      });

      console.log('📥 Mark message as read response:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Mark message as read failed with response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json().catch(() => ({}));
      console.log(`✅ Message ${messageId} marked as read successfully:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Failed to mark message ${messageId} as read:`, error);
      throw error;
    }
  }

  // Mark all unread messages in a conversation as read
  async markConversationAsRead(conversationId) {
    try {
      console.log('🔄 Marking all unread messages as read for conversation:', conversationId);
      
      // First, get all messages in the conversation to find unread ones
      const messagesResponse = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages/`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!messagesResponse.ok) {
        throw new Error(`Failed to fetch messages: HTTP ${messagesResponse.status}`);
      }

      const messagesData = await messagesResponse.json();
      const messages = messagesData.messages || messagesData.results || messagesData;
      
      if (!Array.isArray(messages)) {
        console.log('📭 No messages found or invalid response format');
        return { marked_count: 0 };
      }

      // Find unread messages from agents (not from current user)
      const unreadMessages = messages.filter(msg => 
        !msg.is_read && msg.sender_type === 'agent'
      );

      console.log(`📊 Found ${unreadMessages.length} unread agent messages to mark as read`);

      if (unreadMessages.length === 0) {
        console.log('✅ No unread messages to mark');
        return { marked_count: 0 };
      }

      // Mark each unread message as read
      const markPromises = unreadMessages.map(msg => 
        this.markMessageAsRead(conversationId, msg.id)
      );

      const results = await Promise.allSettled(markPromises);
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failureCount = results.filter(result => result.status === 'rejected').length;

      console.log(`✅ Successfully marked ${successCount} messages as read`);
      if (failureCount > 0) {
        console.warn(`⚠️ Failed to mark ${failureCount} messages as read`);
      }

      return { 
        marked_count: successCount,
        failed_count: failureCount,
        total_unread: unreadMessages.length
      };
    } catch (error) {
      console.error(`❌ Failed to mark conversation ${conversationId} as read:`, error);
      throw error;
    }
  }

  // Refresh notification counts (helper method)
  async refreshNotificationCounts(sessionId = null) {
    try {
      return await this.getNotificationCounts(sessionId);
    } catch (error) {
      console.error('❌ Failed to refresh notification counts:', error);
      return {
        unread_messages: 0,
        active_conversations: 0,
        total_conversations: 0,
        user_type: authStorage.getToken() ? 'authenticated' : 'anonymous'
      };
    }
  }
}

// Create and export singleton instance
const notificationApi = new NotificationApiService();
export default notificationApi;

// Export individual methods for convenience
export const {
  getNotificationCounts,
  getConversationUnreadCount,
  getAgentNotificationSummary,
  markConversationAsRead,
  refreshNotificationCounts
} = notificationApi;
