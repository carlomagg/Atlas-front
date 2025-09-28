import { API_BASE_URL } from '../utils/apiConfig';
import { authStorage } from './authApi';

// Agent Heartbeat Service to keep agents online during active sessions
class AgentHeartbeatService {
  constructor() {
    this.heartbeatInterval = null;
    this.heartbeatFrequency = 30000; // 30 seconds
    this.isActive = false;
  }

  // Start sending heartbeat signals
  startHeartbeat() {
    if (this.isActive) {
      console.log('❤️ Heartbeat already active');
      return;
    }

    console.log('❤️ Starting agent heartbeat service');
    this.isActive = true;

    // Send initial heartbeat
    this.sendHeartbeat();

    // Set up interval for regular heartbeats
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatFrequency);
  }

  // Stop sending heartbeat signals
  stopHeartbeat() {
    if (!this.isActive) {
      console.log('❤️ Heartbeat already stopped');
      return;
    }

    console.log('❤️ Stopping agent heartbeat service');
    this.isActive = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Send heartbeat to backend
  async sendHeartbeat() {
    try {
      const token = authStorage.getToken();
      if (!token) {
        console.log('❤️ No auth token, skipping heartbeat');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/chat/agents/heartbeat/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          status: 'online'
        })
      });

      if (response.ok) {
        console.log('❤️ Heartbeat sent successfully');
      } else {
        console.warn('❤️ Heartbeat failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❤️ Heartbeat error:', error);
    }
  }

  // Check if heartbeat is active
  isHeartbeatActive() {
    return this.isActive;
  }

  // Update heartbeat frequency
  setHeartbeatFrequency(frequency) {
    this.heartbeatFrequency = frequency;
    
    // Restart with new frequency if currently active
    if (this.isActive) {
      this.stopHeartbeat();
      this.startHeartbeat();
    }
  }
}

// Create singleton instance
const agentHeartbeat = new AgentHeartbeatService();

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
  agentHeartbeat.stopHeartbeat();
});

// Auto-cleanup on visibility change (when tab becomes hidden)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Tab is hidden, reduce heartbeat frequency or stop
    console.log('❤️ Tab hidden, reducing heartbeat frequency');
    agentHeartbeat.setHeartbeatFrequency(60000); // 1 minute when hidden
  } else {
    // Tab is visible, restore normal frequency
    console.log('❤️ Tab visible, restoring normal heartbeat frequency');
    agentHeartbeat.setHeartbeatFrequency(30000); // 30 seconds when active
  }
});

export default agentHeartbeat;
