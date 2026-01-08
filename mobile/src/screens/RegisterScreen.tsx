import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, Image } from 'react-native';
import { register, login, getUserFriendlyError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AuthInput } from '../components/AuthInput';
import { PrimaryButton } from '../components/PrimaryButton';

interface RegisterScreenProps {
    onSwitchToLogin: () => void;
}

export default function RegisterScreen({ onSwitchToLogin }: RegisterScreenProps) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();

    const handleRegister = async () => {
        if (!username || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // 1. Register
            await register({ username, email, password, role: 'student' });

            // 2. Auto Login
            const loginData = await login(username, password);
            await signIn(loginData.access_token);

        } catch (err: any) {
            const msg = getUserFriendlyError(err);
            Alert.alert('Registration Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/logo_in_app.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.brandTitle}>Campus Eats</Text>
                    <Text style={styles.brandSubtitle}>Your Campus Food Delivery</Text>
                </View>

                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Sign up to get started</Text>

                <View style={styles.form}>
                    <AuthInput
                        label="Username"
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter username"
                    />

                    <AuthInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter email"
                        keyboardType="email-address"
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
                        title="Sign Up"
                        onPress={handleRegister}
                        loading={loading}
                    />

                    <Text style={styles.linkText} onPress={onSwitchToLogin}>
                        Already have an account? <Text style={styles.linkBold}>Sign In</Text>
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { flex: 1, padding: 24, justifyContent: 'center' },
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
    title: { fontSize: 32, fontWeight: 'bold', color: '#000', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
    form: {},
    spacer: { height: 16 },
    linkText: { marginTop: 20, textAlign: 'center', color: '#666', fontSize: 14 },
    linkBold: { color: '#FF4B3A', fontWeight: 'bold' },
});
