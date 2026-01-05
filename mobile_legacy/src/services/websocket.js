import { API_BASE_URL } from '../constants/config';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.userId = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.listeners = new Set();
        this.isConnected = false;
        this.reconnectTimer = null;
        this.pingTimer = null;
    }

    connect(userId = null) {
        if (this.socket) {
            this.socket.onclose = null;
            this.socket.close();
        }

        this.userId = userId;
        const protocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
        const baseUrl = API_BASE_URL.replace(/^https?:\/\//, '');
        const url = `${protocol}://${baseUrl}/ws${userId ? `/${userId}` : ''}`;

        console.log(`DEBUG: Connecting to WebSocket: ${url}`);
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log('DEBUG: WebSocket Connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.startHeartbeat();
            this.notifyListeners({ type: 'CONNECTION_STATUS', status: 'connected' });
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.notifyListeners(data);
            } catch (e) {
                console.error('DEBUG: WebSocket message error:', e);
            }
        };

        this.socket.onclose = (e) => {
            console.log(`DEBUG: WebSocket Closed. Code: ${e.code}, Reason: ${e.reason}`);
            this.isConnected = false;
            this.stopHeartbeat();
            this.notifyListeners({ type: 'CONNECTION_STATUS', status: 'disconnected' });
            this.handleReconnect();
        };

        this.socket.onerror = (e) => {
            console.error('DEBUG: WebSocket Error:', e.message);
        };
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.notifyListeners({ type: 'CONNECTION_STATUS', status: 'reconnecting' });
            const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000); // Exponential backoff capped at 30s
            console.log(`DEBUG: Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);

            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => {
                this.connect(this.userId);
            }, delay);
        } else {
            console.log('DEBUG: Max reconnect attempts reached. Transitioning to Safe State.');
            this.notifyListeners({ type: 'SAFE_STATE_REQUIRED', reason: 'connection_lost' });
        }
    }

    startHeartbeat() {
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
            if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000); // 30s heartbeat
    }

    stopHeartbeat() {
        if (this.pingTimer) clearInterval(this.pingTimer);
    }

    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(data) {
        this.listeners.forEach(callback => callback(data));
    }

    disconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.stopHeartbeat();
        if (this.socket) {
            this.socket.onclose = null;
            this.socket.close();
        }
    }
}

export const webSocketService = new WebSocketService();
