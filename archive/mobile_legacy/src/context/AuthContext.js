import React, { createContext, useState, useEffect, useContext } from 'react';
import { account, databases, DATABASE_ID, COLLECTIONS } from '../services/appwrite';
import { ID, Query } from 'react-native-appwrite';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Not strictly needed if session is managed by SDK

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // DEV MODE: Hardcoded Admin User
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const session = await account.get();
            let role = 'student';
            let additionalData = {};

            // 1. Check Admin Whitelist & Labels
            try {
                const searchEmail = session.email.toLowerCase();

                // 1a. Check for 'admin' label (Most reliable)
                if (session.labels && session.labels.includes('admin')) {
                    role = 'admin';
                }

                // 1b. Hardcoded Check (For Dev Speed/Bypass)
                if (searchEmail === 'admin@college.edu') {
                    role = 'admin';
                }

                // 1c. Whitelist Collection (Fallback)
                if (role !== 'admin') {
                    const adminCheck = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTIONS.ADMIN,
                        [Query.equal('email', searchEmail)]
                    );
                    if (adminCheck.documents.length > 0) {
                        role = 'admin';
                        additionalData = { ...adminCheck.documents[0] };
                    }
                }
            } catch (e) {
                // Silently fail or log minimally
            }

            // 2. If not admin, or to get extra user details, check Users collection
            try {
                const userDoc = await databases.getDocument(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    session.$id
                );
                // If whitelist said Admin, keep it. Else take role from DB (if any)
                if (role === 'admin') {
                    // Start with UserDoc, overwrite role with Admin
                    additionalData = { ...userDoc, ...additionalData, role: 'admin' };
                } else {
                    additionalData = userDoc;
                }
            } catch (dbError) {
                // User doc not found
                // Cannot self-heal here because we lack the required 'password' field
            }

            const finalUser = {
                ...session,
                ...additionalData,
                role: role === 'admin' ? 'admin' : (additionalData.role || 'student')
            };
            setUser(finalUser);

        } catch (error) {
            // 401 Unauthorized / general_unauthorized_scope is expected if not logged in
            // No need to log it as an error
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const mapAuthError = (message) => {
        const msg = message.toLowerCase();
        if (msg.includes('invalid credentials') || msg.includes('password') || msg.includes('invalid_param')) return "Incorrect email or password";
        if (msg.includes('user_not_found')) return "Account not found";
        if (msg.includes('network')) return "Connection failed. Check your internet";
        if (msg.includes('rate_limit') || msg.includes('429')) return "Too many attempts. Wait a moment";
        if (msg.includes('already exists')) return "An account with this email already exists";
        return "Authentication error. Please try again";
    };

    const login = async (email, password) => {
        try {
            // 1. Create Session
            await account.createEmailPasswordSession(email, password);

            // 2. Fetch Account Details
            const session = await account.get();
            let role = 'student';
            let additionalData = {};

            // 3. Check Admin Whitelist & Labels
            try {
                const searchEmail = session.email.toLowerCase();

                // 3a. Check for 'admin' label
                if (session.labels && session.labels.includes('admin')) {
                    role = 'admin';
                }

                // 3b. Hardcoded Check
                if (searchEmail === 'admin@college.edu') {
                    role = 'admin';
                }

                // 3c. Whitelist Collection
                if (role !== 'admin') {
                    const adminCheck = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTIONS.ADMIN,
                        [Query.equal('email', searchEmail)]
                    );
                    if (adminCheck.documents.length > 0) {
                        role = 'admin';
                        additionalData = { ...adminCheck.documents[0] };
                    }
                }
            } catch (e) {
                // Silently fail
            }

            // 4. Fetch User Doc
            try {
                const userDoc = await databases.getDocument(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    session.$id
                );
                if (role === 'admin') {
                    additionalData = { ...userDoc, ...additionalData, role: 'admin' };
                } else {
                    additionalData = userDoc;
                }
            } catch (dbError) {
                console.log("User doc fetch failed", dbError);
                // Self-Healing: If doc missing, create it now
                if (dbError.code === 404) {
                    try {
                        const newDoc = await databases.createDocument(
                            DATABASE_ID,
                            COLLECTIONS.USERS,
                            session.$id,
                            {
                                name: session.name || 'User',
                                email: session.email,
                                password: password,
                                mobileNumber: '', // Required but unknown at login
                                role: role,
                                department: 'General', // Required default
                                uniqueId: session.$id // Use Appwrite Auth ID
                            }
                        );
                        additionalData = newDoc;
                        console.log("Self-healed: User Doc Created");
                    } catch (createErr) {
                        console.error("Failed to self-heal user doc", createErr);
                    }
                }
            }

            const finalUser = {
                ...session,
                ...additionalData,
                role: role === 'admin' ? 'admin' : (additionalData.role || 'student')
            };
            setUser(finalUser);
            return { success: true };

        } catch (error) {
            console.error('Login Error:', error);
            return { success: false, error: mapAuthError(error.message) };
        }
    };

    const logout = async () => {
        try {
            await account.deleteSession('current');
        } catch (error) {
            console.error('Logout Error:', error);
        } finally {
            // Always clear local user state, even if API fails
            setUser(null);
        }
    };

    const register = async (email, password, name, mobile) => {
        try {
            // 1. Create Auth Account
            const newAccount = await account.create(ID.unique(), email, password, name);

            // 2. Auto Login
            await login(email, password);

            // 3. Create User Document
            try {
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    newAccount.$id,
                    {
                        name: name,
                        email: email,
                        password: password,
                        mobileNumber: mobile || '',
                        role: 'student',
                        department: 'General',
                        uniqueId: newAccount.$id
                    }
                );
            } catch (dbError) {
                console.error('Error creating user doc:', dbError);
            }

            return { success: true };
        } catch (error) {
            console.error('Register Error:', error);
            return { success: false, error: mapAuthError(error.message) };
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
