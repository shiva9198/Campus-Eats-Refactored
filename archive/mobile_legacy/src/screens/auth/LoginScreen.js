import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import FoodStackButton from '../../components/common/FoodStackButton';
import { databases, DATABASE_ID, COLLECTIONS } from '../../services/appwrite';
import { Query } from 'react-native-appwrite';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);
    const { login } = useAuth();
    const { showNotification } = useNotification();

    // Fetch dynamic logo
    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.SETTINGS,
                    [Query.limit(1)]
                );
                if (response.documents.length > 0 && response.documents[0].logoUrl) {
                    setLogoUrl(response.documents[0].logoUrl);
                }
            } catch (error) {
                console.log('Error fetching logo:', error);
            }
        };
        fetchLogo();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            showNotification('Missing Credentials', 'error');
            return;
        }

        setIsSubmitting(true);

        // Ensure the chewing animation runs for at least 2 seconds
        const minAnimationTime = new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const [result] = await Promise.all([
                login(email, password),
                minAnimationTime
            ]);

            if (result.success) {
                // Trigger the swallow animation instead of immediate navigation
                setLoginSuccess(true);
            } else {
                setIsSubmitting(false);
                showNotification(result.error || 'Authentication Failed', 'error');
            }
        } catch (error) {
            setIsSubmitting(false);
            showNotification('An unexpected error occurred', 'error');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={logoUrl ? { uri: logoUrl } : require('../../../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.title}>Campus Eats</Text>
                    <Text style={styles.subtitle}>Student Login</Text>

                    <View style={styles.form}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <FoodStackButton
                            title="Sign In"
                            onPress={handleLogin}
                            loading={isSubmitting}
                            isSuccess={loginSuccess}
                            onAnimationComplete={() => {
                                // Only navigate after the animation is done!
                                navigation.replace('MainTabs');
                            }}
                            glow={password.length >= 8}
                            progress={Math.min(password.length / 8, 1)}
                            style={styles.button}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.link}>Register</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: theme.spacing.l,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.l,
        height: 100,
    },
    logo: {
        width: 100,
        height: 100,
    },
    title: {
        ...theme.typography.header,
        color: theme.colors.primary,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        ...theme.typography.subheader,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        fontSize: 18,
    },
    form: {
        width: '100%',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.l,
        borderRadius: theme.borderRadius.l,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.medium,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.s,
        marginTop: theme.spacing.s,
    },
    input: {
        backgroundColor: theme.colors.inputBg,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        fontSize: 16,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    button: {
        marginTop: theme.spacing.xl,
        width: '100%',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.l,
    },
    footerText: {
        ...theme.typography.body,
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    link: {
        ...theme.typography.body,
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '700',
    },
});

export default LoginScreen;
