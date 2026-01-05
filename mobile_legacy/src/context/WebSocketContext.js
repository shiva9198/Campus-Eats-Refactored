import React, { createContext, useContext, useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [isSafeState, setIsSafeState] = useState(false);
    const [lastEvent, setLastEvent] = useState(null);

    useEffect(() => {
        // Connect when user ID is available, or as anonymous
        webSocketService.connect(user?.$id);

        const unsubscribe = webSocketService.subscribe((data) => {
            const eventType = data.event || data.type;
            console.log('DEBUG: WebSocket Event:', eventType);

            setLastEvent(data);

            if (eventType === 'CONNECTION_STATUS') {
                setConnectionStatus(data.status);
                if (data.status === 'connected') {
                    setIsSafeState(false);
                }
            }

            if (eventType === 'SAFE_STATE_REQUIRED') {
                setIsSafeState(true);
            }

            // Handle global shop status
            if (eventType === 'SHOP_STATUS_CHANGE') {
                if (data.value === 'closed') {
                    // You could trigger a global alert here
                }
            }
        });

        return () => {
            unsubscribe();
            webSocketService.disconnect();
        };
    }, [user?.$id]);

    return (
        <WebSocketContext.Provider value={{ connectionStatus, isSafeState, lastEvent }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
