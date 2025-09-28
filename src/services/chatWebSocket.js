import chatApi from './chatApi';

class ChatWebSocketManager {
  constructor() {
    this.connections = new Map(); // conversationId -> WebSocket
    this.reconnectAttempts = new Map(); // conversationId -> attempt count
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.messageQueue = new Map(); // conversationId -> message array
    this.eventListeners = new Map(); // conversationId -> event listeners
  }

  // Connect to a conversation's WebSocket
  connect(conversationId, eventHandlers = {}) {
    if (this.connections.has(conversationId)) {
      console.log(`Already connected to conversation ${conversationId}`);
      return this.connections.get(conversationId);
    }

    try {
      const ws = this.createWebSocketConnection(conversationId);
      
      ws.onopen = () => {
        console.log(`Connected to chat WebSocket for conversation ${conversationId}`);
        this.reconnectAttempts.set(conversationId, 0);
        
        // Send queued messages
        this.sendQueuedMessages(conversationId);
        
        if (eventHandlers.onOpen) {
          eventHandlers.onOpen();
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(conversationId, data, eventHandlers);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket closed for conversation ${conversationId}:`, event);
        this.connections.delete(conversationId);
        
        if (eventHandlers.onClose) {
          eventHandlers.onClose(event);
        }

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000) {
          this.attemptReconnect(conversationId, eventHandlers);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for conversation ${conversationId}:`, error);
        
        if (eventHandlers.onError) {
          eventHandlers.onError(error);
        }
      };

      this.connections.set(conversationId, ws);
      this.eventListeners.set(conversationId, eventHandlers);
      
      return ws;
    } catch (error) {
      console.error(`Failed to create WebSocket connection for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  // Handle incoming WebSocket messages
  handleMessage(conversationId, data, eventHandlers) {
    console.log('📨 Received WebSocket message:', data);
    
    // Handle different message types
    switch (data.type) {
      case 'new_message':
        // Real-time message delivery - display immediately
        console.log('💬 New message received via WebSocket');
        if (eventHandlers.onNewMessage) {
          eventHandlers.onNewMessage(data.data);
        }
        break;
      case 'typing':
        // Real-time typing indicators
        console.log('⌨️ Typing indicator received');
        if (eventHandlers.onTyping) {
          eventHandlers.onTyping(data.data);
        }
        break;
      case 'agent_status':
        // Real-time agent status updates
        console.log('👤 Agent status update received');
        if (eventHandlers.onAgentStatus) {
          eventHandlers.onAgentStatus(data.data);
        }
        break;
      case 'agent_online':
        // Agent came online
        console.log('🟢 Agent came online');
        if (eventHandlers.onAgentOnline) {
          eventHandlers.onAgentOnline(data.data);
        }
        break;
      case 'agent_offline':
        // Agent went offline
        console.log('🔴 Agent went offline');
        if (eventHandlers.onAgentOffline) {
          eventHandlers.onAgentOffline(data.data);
        }
        break;
      case 'test_message':
        // WebSocket test message
        console.log('🧪 WebSocket test message received:', data.data);
        if (eventHandlers.onTestMessage) {
          eventHandlers.onTestMessage(data.data);
        }
        break;
      case 'conversation_assigned':
        // Agent assigned to conversation
        console.log('👨‍💼 Agent assigned to conversation');
        if (eventHandlers.onAgentAssigned) {
          eventHandlers.onAgentAssigned(data.data);
        }
        break;
      case 'notification_count_update':
        // Notification count update
        console.log('📊 Notification count update received');
        if (eventHandlers.onNotificationCountUpdate) {
          eventHandlers.onNotificationCountUpdate(data.data);
        }
        break;
      default:
        console.log('❓ Unknown message type:', data.type);
    }
  }

  // Send message via WebSocket
  sendMessage(conversationId, messageText, senderType = 'user', senderId = null, messageType = 'text') {
    const ws = this.connections.get(conversationId);
    
    const message = {
      type: 'chat_message',
      message_text: messageText,
      sender_type: senderType,
      message_type: messageType
    };

    if (senderId) {
      message.sender_id = senderId;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    } else {
      // Queue message if not connected
      this.queueMessage(conversationId, message);
      return false;
    }
  }

  // Send typing indicator
  sendTypingIndicator(conversationId, senderType, senderName, isTyping) {
    const ws = this.connections.get(conversationId);
    
    const message = {
      type: 'typing',
      sender_type: senderType,
      sender_name: senderName,
      is_typing: isTyping
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Mark message as read
  markMessageAsRead(conversationId, messageId) {
    const ws = this.connections.get(conversationId);
    
    const message = {
      type: 'mark_read',
      message_id: messageId
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Queue message for later sending
  queueMessage(conversationId, message) {
    if (!this.messageQueue.has(conversationId)) {
      this.messageQueue.set(conversationId, []);
    }
    this.messageQueue.get(conversationId).push(message);
  }

  // Send all queued messages
  sendQueuedMessages(conversationId) {
    const queue = this.messageQueue.get(conversationId);
    if (!queue || queue.length === 0) return;

    const ws = this.connections.get(conversationId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      queue.forEach(message => {
        ws.send(JSON.stringify(message));
      });
      this.messageQueue.set(conversationId, []);
    }
  }

  // Attempt to reconnect
  attemptReconnect(conversationId, eventHandlers) {
    const attempts = this.reconnectAttempts.get(conversationId) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.log(`Max reconnection attempts reached for conversation ${conversationId}`);
      if (eventHandlers.onMaxReconnectAttemptsReached) {
        eventHandlers.onMaxReconnectAttemptsReached();
      }
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, attempts); // Exponential backoff
    console.log(`Attempting to reconnect to conversation ${conversationId} in ${delay}ms (attempt ${attempts + 1})`);

    setTimeout(() => {
      this.reconnectAttempts.set(conversationId, attempts + 1);
      
      if (eventHandlers.onReconnecting) {
        eventHandlers.onReconnecting(attempts + 1);
      }
      
      this.connect(conversationId, eventHandlers);
    }, delay);
  }

  // Disconnect from a conversation
  disconnect(conversationId) {
    const ws = this.connections.get(conversationId);
    if (ws) {
      ws.close(1000, 'Normal closure');
      this.connections.delete(conversationId);
      this.eventListeners.delete(conversationId);
      this.messageQueue.delete(conversationId);
      this.reconnectAttempts.delete(conversationId);
    }
  }

  // Disconnect from all conversations
  disconnectAll() {
    this.connections.forEach((ws, conversationId) => {
      this.disconnect(conversationId);
    });
  }

  // Check if connected to a conversation
  isConnected(conversationId) {
    const ws = this.connections.get(conversationId);
    return ws && ws.readyState === WebSocket.OPEN;
  }

  // Get connection status
  getConnectionStatus(conversationId) {
    const ws = this.connections.get(conversationId);
    if (!ws) return 'disconnected';
    
    switch (ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  // Update event handlers for a conversation
  updateEventHandlers(conversationId, newEventHandlers) {
    const existingHandlers = this.eventListeners.get(conversationId) || {};
    const updatedHandlers = { ...existingHandlers, ...newEventHandlers };
    this.eventListeners.set(conversationId, updatedHandlers);
  }

  // Get all active connections
  getActiveConnections() {
    const active = [];
    this.connections.forEach((ws, conversationId) => {
      if (ws.readyState === WebSocket.OPEN) {
        active.push(conversationId);
      }
    });
    return active;
  }
}

// Create and export singleton instance
const chatWebSocket = new ChatWebSocketManager();

// Clean up connections when page unloads
window.addEventListener('beforeunload', () => {
  chatWebSocket.disconnectAll();
});

export default chatWebSocket;
