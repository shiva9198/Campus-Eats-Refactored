import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { login, getUserFriendlyError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AuthInput } from '../components/AuthInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { BrandingLogo } from '../components/BrandingLogo';

interface LoginScreenProps {
    onSwitchToRegister: () => void;
}

export default function LoginScreen({ onSwitchToRegister }: LoginScreenProps) {
    const [username, setUsername] = useState('student');
    const [password, setPassword] = useState('student123'); // Default for easy testing
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter username and password');
            return;
        }

        setLoading(true);
        try {
            const data = await login(username, password);
            await signIn(data.access_token);
        } catch (err: any) {
            const msg = getUserFriendlyError(err);
            Alert.alert('Login Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <BrandingLogo style={styles.logo} />
                    <Text style={styles.brandTitle}>Campus Eats</Text>
                    <Text style={styles.brandSubtitle}>Your Campus Food Delivery</Text>
                </View>

                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>

                <View style={styles.form}>
                    <AuthInput
                        label="Username"
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter username"
                    />

                    <AuthInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter password"
                        secureTextEntry
                    />

                    <View style={styles.spacer} />

                    <PrimaryButton
                        title="Sign In"
                        onPress={handleLogin}
                        loading={loading}
                    />

                    <Text style={styles.linkText} onPress={onSwitchToRegister}>
                        Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
                    </Text>

                    {/* Hint removed for production */}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 16,
    },
    brandTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF4B3A',
        marginBottom: 4,
    },
    brandSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
    },
    form: {
    },
    spacer: {
        height: 16,
    },
    linkText: { marginTop: 20, textAlign: 'center', color: '#666', fontSize: 14 },
    linkBold: { color: '#FF4B3A', fontWeight: 'bold' },
    hint: {
        marginTop: 20,
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
    },
});
