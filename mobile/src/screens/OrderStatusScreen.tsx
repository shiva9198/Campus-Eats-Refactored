import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Image } from 'react-native';
import { apiClient, getUserFriendlyError } from '../api/client';
import { PrimaryButton } from '../components/PrimaryButton';
import { AppHeader } from '../components/AppHeader';

const POLL_INTERVAL = 5000; // 5 seconds

type OrderStatusScreenProps = {
    orderId: number;
    onHome: () => void;
};

// Define local interface for full order data including proof and OTP
interface OrderDetails {
    id: number;
    status: string;
    verification_proof?: string;
    otp?: string;
    total_amount: number;
}

const OrderStatusScreen = ({ orderId, onHome }: OrderStatusScreenProps) => {
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchStatus = async () => {
            try {
                const response = await apiClient.get(`/orders/${orderId}`);
                if (isMounted) {
                    setOrder(response.data);
                    setLastUpdated(new Date());
                    setError(null);
                    setLoading(false);
                }
            } catch (err) {
                console.log('Polling error:', err);
                if (isMounted) {
                    setError(getUserFriendlyError(err));
                    setLoading(false);
                }
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, POLL_INTERVAL);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [orderId]);

    const manualRefresh = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/orders/${orderId}`);
            setOrder(response.data);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            setError(getUserFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    if (!order && loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={styles.loadingText}>Fetching order stats...</Text>
            </View>
        );
    }

    if (!order) { return null; } // Should ideally show error state

    // Status Visualization Logic
    const steps = ['Pending', 'Preparing', 'Ready', 'Completed'];
    const currentStepIndex = steps.indexOf(order.status) !== -1 ? steps.indexOf(order.status) : 0;

    // Explicit mapping for "Pending Verification" and "Paid"
    const getDisplayStatus = (status: string) => {
        if (status === 'Pending_Verification') { return 'Verifying Payment...'; }
        if (status === 'Paid') { return 'Payment Verified'; }
        return status;
    };

    const isPaid = ['Paid', 'Preparing', 'Ready', 'Completed'].includes(order.status);
    const showOtp = ['Paid', 'Preparing', 'Ready'].includes(order.status); // Hide when Completed

    return (
        <View style={styles.container}>
            <AppHeader title={`Order #${orderId}`} showBack onBack={onHome} />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 1. Network Error Banner */}
                {error && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorBannerText}>⚠️ {error}</Text>
                        <Text style={styles.errorSubtext}>Auto-retrying...</Text>
                    </View>
                )}

                {/* 2. Main Status Card */}
                <View style={styles.card}>
                    <Text style={styles.statusLabel}>Current Status</Text>
                    <Text style={[styles.statusValue, styles.activeStatus]}>
                        {getDisplayStatus(order.status)}
                    </Text>
                    {lastUpdated && (
                        <Text style={styles.lastUpdatedText}>
                            Updated: {lastUpdated.toLocaleTimeString()}
                        </Text>
                    )}
                </View>

                {/* 3. Payment Proof Section (Trust) */}
                {order.verification_proof && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Payment Proof</Text>
                        <Image
                            source={{ uri: order.verification_proof }}
                            style={styles.proofImage}
                            resizeMode="cover"
                        />
                        <Text style={styles.proofLabel}>
                            {isPaid ? '✅ Verified by Admin' : '⏳ Pending Verification'}
                        </Text>
                    </View>
                )}

                {/* 4. OTP Section (Security) */}
                {/* Show OTP only if active and not completed */}
                {showOtp && order.otp && (
                    <View style={[styles.card, styles.otpCard]}>
                        <Text style={styles.otpLabel}>Collection OTP</Text>
                        <Text style={styles.otpValue}>{order.otp}</Text>
                        <Text style={styles.otpHint}>Show this to the counter when Ready</Text>
                    </View>
                )}

                {/* 5. Visual Timeline */}
                <View style={[styles.card, styles.timelineCard]}>
                    {steps.map((step, index) => {
                        const isActive = index <= currentStepIndex ||
                            (step === 'Pending' && (order.status === 'Pending_Verification' || order.status === 'Paid'));

                        return (
                            <View key={step} style={styles.timelineItem}>
                                <View style={[styles.dot, isActive && styles.activeDot]} />
                                <Text style={[styles.timelineText, isActive && styles.activeTimelineText]}>
                                    {step}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                <PrimaryButton
                    title={loading ? 'Refreshing...' : '🔄 Refresh Status'}
                    onPress={manualRefresh}
                    loading={loading}
                    style={{ marginTop: 20 }}
                />

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 16 },
    loadingText: { marginTop: 12, color: '#888' },

    // Cards
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        alignItems: 'center',
    },
    otpCard: {
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
        borderWidth: 1,
    },
    timelineCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },

    // Typography
    statusLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
    statusValue: { fontSize: 24, fontWeight: 'bold', color: '#111', textAlign: 'center' },
    activeStatus: { color: '#F97316' },
    lastUpdatedText: { fontSize: 12, color: '#999', marginTop: 8 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, width: '100%' },

    // Proof
    proofImage: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#eee' },
    proofLabel: { marginTop: 8, fontWeight: '600', color: '#666' },

    // OTP
    otpLabel: { fontSize: 14, color: '#047857', fontWeight: 'bold', textTransform: 'uppercase' },
    otpValue: { fontSize: 36, fontWeight: 'bold', color: '#047857', marginVertical: 4, letterSpacing: 4 },
    otpHint: { fontSize: 12, color: '#047857' },

    // Timeline
    timelineItem: { alignItems: 'center', flex: 1 },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#eee', marginBottom: 8 },
    activeDot: { backgroundColor: '#F97316' },
    timelineText: { fontSize: 10, color: '#ccc' },
    activeTimelineText: { color: '#333', fontWeight: 'bold' },

    // Errors
    errorBanner: {
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        alignItems: 'center',
    },
    errorBannerText: { color: '#EF4444', fontWeight: 'bold' },
    errorSubtext: { color: '#EF4444', fontSize: 12 },
});

export default OrderStatusScreen;
