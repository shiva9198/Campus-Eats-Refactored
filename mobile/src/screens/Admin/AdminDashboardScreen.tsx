import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert, ActivityIndicator, Switch } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { adminService, AdminStats } from '../../services/adminService';
import { AppHeader } from '../../components/AppHeader';


interface AdminDashboardProps {
    onNavigate: (screen: 'orders' | 'menu' | 'collection') => void;
}

const AdminDashboardScreen = ({ onNavigate }: AdminDashboardProps) => {
    const { signOut } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [shopOpen, setShopOpen] = useState(true);
    const [toggling, setToggling] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [statsData, settingsData] = await Promise.all([
                adminService.getStats(),
                adminService.getSettings(),
            ]);
            setStats(statsData);

            const statusSetting = settingsData.find(s => s.key === 'shop_status');
            if (statusSetting) {
                setShopOpen(statusSetting.value === 'open');
            }
        } catch (error) {
            console.error(error);
            // Alert.alert('Error', 'Failed to load dashboard data');
            // Silent fail better for dashboard
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const POLL_INTERVAL = 15000; // 15 seconds

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [loadData]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const toggleShopStatus = async (value: boolean) => {
        setToggling(true);
        try {
            // Optimistic update
            const nextValue = value ? 'open' : 'closed';
            console.log(`Toggling shop to: ${nextValue}`);
            setShopOpen(value);
            await adminService.updateSetting('shop_status', nextValue, 'shop');
        } catch (error) {
            console.error('Toggle failed:', error);
            // Revert on failure
            setShopOpen(!value);
            Alert.alert('Error', 'Failed to update shop status');
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FF4B3A" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AppHeader
                title="Admin Dashboard"
                rightAction={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: shopOpen ? '#4CAF50' : '#F44336' }} />
                            <Text style={{ fontSize: 12, color: shopOpen ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
                                {shopOpen ? 'OPEN' : 'CLOSED'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            <ScrollView
                style={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {/* Shop Status Control */}
                <View style={styles.statusCard}>
                    <View>
                        <Text style={styles.sectionTitle}>Shop Status</Text>
                        <Text style={[styles.statusText, shopOpen ? styles.textOpen : styles.textClosed]}>
                            {shopOpen ? 'Currently Open' : 'Currently Closed'}
                        </Text>
                    </View>
                    <Switch
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={shopOpen ? '#2196F3' : '#f4f3f4'}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleShopStatus}
                        value={shopOpen}
                        disabled={toggling}
                    />
                </View>

                {/* Stats Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <View style={styles.grid}>
                        <View style={styles.card}>
                            <Text style={styles.cardValue}>{stats?.counts.Pending || 0}</Text>
                            <Text style={styles.cardLabel}>Pending</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.cardValue}>₹{stats?.revenue.today || 0}</Text>
                            <Text style={styles.cardLabel}>Today</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.cardValue}>{stats?.counts.Pending_Verification || 0}</Text>
                            <Text style={styles.cardLabel}>To Verify</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.cardValue}>{stats?.counts.Paid || 0}</Text>
                            <Text style={styles.cardLabel}>Paid</Text>
                        </View>
                    </View>
                </View>

                {/* Navigation Links */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Management</Text>

                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ECFDF5', borderColor: '#10B981', borderWidth: 1 }]} onPress={() => onNavigate('collection')}>
                        <Text style={styles.actionIcon}>🔢</Text>
                        <View>
                            <Text style={[styles.actionBtnText, { color: '#047857' }]}>Collect Order</Text>
                            <Text style={{ fontSize: 12, color: '#047857' }}>Verify OTP & Handover</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigate('orders')}>
                        <Text style={styles.actionIcon}>📦</Text>
                        <Text style={styles.actionBtnText}>Manage Orders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigate('orders')}>
                        <Text style={styles.actionIcon}>💰</Text>
                        <Text style={styles.actionBtnText}>Verify Payments</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigate('menu')}>
                        <Text style={styles.actionIcon}>🍔</Text>
                        <Text style={styles.actionBtnText}>Manage Menu</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    scrollContent: { padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    logoutBtn: { padding: 8 },
    logoutText: { color: '#FF4B3A', fontWeight: 'bold' },

    statusCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        elevation: 2,
    },
    statusText: { fontSize: 14, fontWeight: 'bold', marginTop: 4 },
    textOpen: { color: '#4CAF50' },
    textClosed: { color: '#F44336' },

    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: {
        width: '48%',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 1,
    },
    cardValue: { fontSize: 24, fontWeight: 'bold', color: '#FF4B3A', marginBottom: 4 },
    cardLabel: { fontSize: 12, color: '#666' },

    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 1,
    },
    actionIcon: { fontSize: 24, marginRight: 16 },
    actionBtnText: { fontSize: 16, fontWeight: '600', color: '#333' },
});

export default AdminDashboardScreen;
