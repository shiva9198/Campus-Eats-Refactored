import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState({
        visible: false,
        message: '',
        type: 'info', // 'success', 'error', 'info'
    });

    const showNotification = useCallback((message, type = 'info', duration = 3000) => {
        setNotification({
            visible: true,
            message,
            type,
        });

        if (duration) {
            setTimeout(() => {
                hideNotification();
            }, duration);
        }
    }, []);

    const hideNotification = useCallback(() => {
        setNotification(prev => ({
            ...prev,
            visible: false,
        }));
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {/* The Notification component will be rendered at the root level in App.js or here */}
            {/* But we need to pass the notification state down to its component */}
            <NotificationInternal state={notification} onHide={hideNotification} />
        </NotificationContext.Provider>
    );
};

// Internal component to handle display so we don't re-render entire app on toast state change
import CustomToast from '../components/common/CustomToast';
const NotificationInternal = ({ state, onHide }) => {
    return (
        <CustomToast
            visible={state.visible}
            message={state.message}
            type={state.type}
            onHide={onHide}
        />
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
