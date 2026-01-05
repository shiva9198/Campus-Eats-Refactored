import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { apiClient, getUserFriendlyError } from '../api/client';

const POLL_INTERVAL = 15000; // 15 seconds

type OrderStatusScreenProps = {
    orderId: number;
    onHome: () => void;
};

const OrderStatusScreen = ({ orderId, onHome }: OrderStatusScreenProps) => {
    const [status, setStatus] = useState<string>('Pending');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // Day 10: Error state
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null); // Day 10: Last update timestamp

    useEffect(() => {
        let isMounted = true;

        const fetchStatus = async () => {
            try {
                const response = await apiClient.get(`/orders/${orderId}`);
                if (isMounted) {
                    setStatus(response.data.status);
                    setLastUpdated(new Date());
                    setError(null); // Clear error on success
                    setLoading(false);
                }
            } catch (err) {
                console.log("Polling error:", err);
                if (isMounted) {
                    // Day 10: Show error but continue polling
                    setError(getUserFriendlyError(err));
                    setLoading(false);
                    // Don't stop polling - network might recover
                }
            }
        };

        fetchStatus(); // Initial
        const interval = setInterval(fetchStatus, POLL_INTERVAL);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [orderId]);

    const manualRefresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/orders/${orderId}`);
            setStatus(response.data.status);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            setError(getUserFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Order #{orderId}</Text>

            {/* Day 10: Error Banner */}
            {error && !loading && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>⚠️ {error}</Text>
                    <Text style={styles.errorSubtext}>Auto-retrying every 15s</Text>
                </View>
            )}

            <View style={styles.statusContainer}>
                <Text style={styles.statusLabel}>Current Status</Text>
                <Text style={[styles.statusValue, status === 'Pending' ? styles.pending : styles.active]}>
                    {status}
                </Text>
                {status === 'Pending' && (
                    <Text style={styles.verificationText}>Waiting for Verification...</Text>
                )}

                {/* Day 10: Last Updated Timestamp */}
                {lastUpdated && (
                    <Text style={styles.lastUpdatedText}>
                        Last updated: {lastUpdated.toLocaleTimeString()}
                    </Text>
                )}
            </View>

            <View style={styles.timeline}>
                {['Pending', 'Preparing', 'Ready'].map((s, i) => {
                    const active = s === status || (status === 'Ready' && s !== 'Completed');
                    // Simple logic for visual timeline
                    return (
                        <View key={s} style={styles.timelineItem}>
                            <View style={[styles.dot, active ? styles.activeDot : null]} />
                            <Text style={[styles.timelineText, active ? styles.activeText : null]}>{s}</Text>
                        </View>
                    )
                })}
            </View>

            {/* Day 10: Manual Refresh Button */}
            <TouchableOpacity
                style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
                onPress={manualRefresh}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#F97316" size="small" />
                ) : (
                    <Text style={styles.refreshButtonText}>🔄 Refresh Now</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.homeButton} onPress={onHome}>
                <Text style={styles.homeButtonText}>Back to Menu</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white', padding: 24, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    errorBanner: {
        backgroundColor: '#FEE2E2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    errorBannerText: {
        color: '#DC2626',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 4,
    },
    errorSubtext: {
        color: '#EF4444',
        fontSize: 12,
        fontStyle: 'italic',
    },
    statusContainer: { alignItems: 'center', marginBottom: 40 },
    statusLabel: { fontSize: 16, color: '#666', marginBottom: 8 },
    statusValue: { fontSize: 32, fontWeight: 'bold' },
    pending: { color: '#F97316' },
    active: { color: 'green' },
    verificationText: { marginTop: 8, fontStyle: 'italic', color: '#888' },
    lastUpdatedText: {
        marginTop: 8,
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },

    timeline: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 40 },
    timelineItem: { alignItems: 'center' },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#eee', marginBottom: 8 },
    activeDot: { backgroundColor: '#F97316' },
    timelineText: { color: '#ccc' },
    activeText: { color: '#333', fontWeight: 'bold' },

    refreshButton: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 16,
        minWidth: 160,
        alignItems: 'center',
    },
    refreshButtonDisabled: {
        opacity: 0.6,
    },
    refreshButtonText: {
        color: '#F97316',
        fontSize: 16,
        fontWeight: '600',
    },

    homeButton: { padding: 16 },
    homeButtonText: { color: '#007AFF', fontSize: 16 }
});

export default OrderStatusScreen;
