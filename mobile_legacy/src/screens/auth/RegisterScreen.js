import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL, ENDPOINTS } from '../../constants/config';
import GlowButton from '../../components/common/GlowButton';
import { databases, DATABASE_ID, COLLECTIONS } from '../../services/appwrite';
import { Query } from 'react-native-appwrite';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [logoUrl, setLogoUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register } = useAuth();
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

    const handleRegister = async () => {
        if (!name || !email || !mobile || !password || !confirmPassword) {
            showNotification('Missing Fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showNotification('Passwords Mismatch', 'error');
            return;
        }

        if (password.length < 8) {
            showNotification('Password too short (8+ chars)', 'error');
            return;
        }

        if (mobile.length !== 10) {
            showNotification('Invalid Mobile Number', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            console.log('Registering user directly...', { email, name });
            const result = await register(email, password, name, mobile);

            if (result.success) {
                showNotification('Account Created!', 'success');
                setIsSubmitting(false);
                navigation.navigate('Login');
            } else {
                showNotification(result.error || 'Registration Failed', 'error');
                setIsSubmitting(false);
            }

        } catch (error) {
            console.error('Register Error:', error);
            Alert.alert('Error', 'Registration failed. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.content}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={logoUrl ? { uri: logoUrl } : require('../../../assets/logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join Campus Eats</Text>

                        <View style={styles.form}>
                            {/* Personal Details */}
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />

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

                            <Text style={styles.label}>Mobile Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your mobile number"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={mobile}
                                onChangeText={setMobile}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />

                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Create a password (min 8 chars)"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />

                            <Text style={styles.label}>Confirm Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm your password"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />

                            {/* Action Buttons */}
                            <GlowButton
                                title="Sign Up"
                                onPress={handleRegister}
                                loading={isSubmitting}
                                disabled={isSubmitting}
                                style={styles.button}
                            />

                            <Text style={styles.noteText}>
                                * Mobile verification coming soon. Feature disabled for simplified access.
                            </Text>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.link}>Sign In</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        padding: theme.spacing.l,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.l,
        height: 80,
    },
    logo: {
        width: 80,
        height: 80,
    },
    title: {
        ...theme.typography.header,
        color: theme.colors.primary,
        textAlign: 'center',
        marginBottom: theme.spacing.s,
    },
    subtitle: {
        ...theme.typography.subheader,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    form: {
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
        marginTop: theme.spacing.m,
    },
    input: {
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.m,
        padding: theme.spacing.m,
        fontSize: 16,
        color: theme.colors.text,
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
    noteText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 15,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 20,
    }
});

export default RegisterScreen;
