import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { getMyOrders } from '../api/client';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';

interface OrderHistoryScreenProps {
    onBack: () => void;
    onSelectOrder: (orderId: number) => void;
}

const OrderHistoryScreen = ({ onBack, onSelectOrder }: OrderHistoryScreenProps) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const data = await getMyOrders();
            setOrders(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return '#4CAF50';
            case 'Ready': return '#2196F3';
            case 'Preparing': return '#FF9800';
            case 'Paid': return '#8BC34A';
            case 'Pending_Verification': return '#F59E0B';
            default: return '#757575';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity onPress={() => onSelectOrder(item.id)} activeOpacity={0.7}>
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.orderId}>Order #{item.id}</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.badgeText}>
                            {item.status === 'Pending_Verification' ? 'Verifying' : item.status}
                        </Text>
                    </View>
                </View>
                <Text style={styles.date}>{formatDate(item.created_at)}</Text>

                <View style={styles.row}>
                    <Text style={styles.total}>Total: ₹{item.total_amount}</Text>
                    {item.verification_proof && (
                        <Text style={styles.proofIcon}>📷 Proof Uploaded</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <AppHeader title="My Orders" showBack onBack={onBack} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#F97316" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <EmptyState
                            title="No orders yet"
                            message="Hungry? Place your first order now!"
                            icon="🍔"
                        />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    orderId: { fontSize: 16, fontWeight: 'bold' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    date: { color: '#888', marginBottom: 8, fontSize: 12 },
    total: { fontSize: 16, fontWeight: '600', color: '#333' },
    proofIcon: { fontSize: 12, color: '#047857', fontWeight: '500' },
});

export default OrderHistoryScreen;
