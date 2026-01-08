import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
    token: string | null;
    userRole: string | null;
    isLoading: boolean;
    signIn: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
}

import { parseJwt } from '../utils/jwt';


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);


    // Restore token on app launch
    useEffect(() => {
        const restoreToken = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('token');
                if (storedToken) {
                    setToken(storedToken);
                    const decoded = parseJwt(storedToken);
                    if (decoded?.role) {
                        setUserRole(decoded.role);
                    }
                }

            } catch (e) {
                console.error('Failed to restore token', e);
            } finally {
                setIsLoading(false);
            }
        };
        restoreToken();
    }, []);

    const signIn = async (newToken: string) => {
        try {
            await AsyncStorage.setItem('token', newToken);
            setToken(newToken);
            const decoded = parseJwt(newToken);
            if (decoded?.role) {
                setUserRole(decoded.role);
            }

        } catch (e) {
            console.error('Failed to save token', e);
        }
    };

    const signOut = async () => {
        try {
            await AsyncStorage.removeItem('token');
            setToken(null);
            setUserRole(null);

        } catch (e) {
            console.error('Failed to remove token', e);
        }
    };

    return (
        <AuthContext.Provider value={{ token, userRole, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );

};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
