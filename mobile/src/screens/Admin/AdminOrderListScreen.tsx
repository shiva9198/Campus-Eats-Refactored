import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { adminService, AdminOrder } from '../../services/adminService';
import { AppHeader } from '../../components/AppHeader';

const AdminOrderListScreen = ({ navigation: _navigation, onSelectOrder }: any) => {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'Verify' | 'Kitchen' | 'History'>('Kitchen');

    const loadOrders = useCallback(async () => {
        try {
            const data = await adminService.getOrders();
            setOrders(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const POLL_INTERVAL = 15000; // 15 seconds

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [loadOrders]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    const getFilteredOrders = () => {
        return orders.filter(o => {
            if (filter === 'Verify') {
                // Pending (Unpaid) or Pending_Verification (Proof Uploaded)
                return ['Pending', 'Pending_Verification'].includes(o.status);
            } else if (filter === 'Kitchen') {
                // Validated Orders ready for prep
                return ['Paid', 'Preparing', 'Ready'].includes(o.status);
            } else {
                // Done or Cancelled
                return ['Completed', 'Payment_Rejected'].includes(o.status);
            }
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return '#FFA500';
            case 'Pending_Verification': return '#F06292'; // Pink for attention
            case 'Paid': return '#4CAF50';
            case 'Preparing': return '#2196F3';
            case 'Ready': return '#8BC34A';
            case 'Completed': return '#888';
            case 'Payment_Rejected': return '#F44336';
            default: return '#333';
        }
    };

    const renderItem = ({ item }: { item: AdminOrder }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onSelectOrder && onSelectOrder(item)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.badgeText}>{item.status.replace('_', ' ')}</Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.amount}>₹{item.total_amount}</Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
            {item.status === 'Pending_Verification' && (
                <View style={styles.alertBox}>
                    <Text style={styles.alertText}>⚠️ Verification Needed</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <AppHeader title="All Orders" />

            {/* Filter Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, filter === 'Verify' && styles.activeTab]}
                    onPress={() => setFilter('Verify')}
                >
                    <Text style={[styles.tabText, filter === 'Verify' && styles.activeTabText]}>To Verify</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, filter === 'Kitchen' && styles.activeTab]}
                    onPress={() => setFilter('Kitchen')}
                >
                    <Text style={[styles.tabText, filter === 'Kitchen' && styles.activeTabText]}>Kitchen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, filter === 'History' && styles.activeTab]}
                    onPress={() => setFilter('History')}
                >
                    <Text style={[styles.tabText, filter === 'History' && styles.activeTabText]}>History</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#FF4B3A" />
                </View>
            ) : (
                <FlatList
                    data={getFilteredOrders()}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No orders found.</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 20, backgroundColor: '#fff', elevation: 2 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    tabs: { flexDirection: 'row', padding: 10, justifyContent: 'center' },
    tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginHorizontal: 4, backgroundColor: '#e0e0e0' },
    activeTab: { backgroundColor: '#FF4B3A' },
    tabText: { color: '#666', fontWeight: 'bold', fontSize: 13 },
    activeTabText: { color: '#fff' },
    list: { padding: 15 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    orderId: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amount: { fontSize: 20, fontWeight: 'bold', color: '#2E7D32' },
    date: { color: '#888', fontSize: 12 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },
    alertBox: { marginTop: 10, padding: 8, backgroundColor: '#FFF3E0', borderRadius: 5, alignItems: 'center' },
    alertText: { color: '#FF9800', fontWeight: 'bold', fontSize: 12 },
});

export default AdminOrderListScreen;
