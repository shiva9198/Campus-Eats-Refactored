import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { orderService } from '../../../services/orderService';
import { theme } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import BrandingHeader from '../../../components/common/BrandingHeader';
import Card from '../../../components/common/Card';
import { SafeAreaView } from 'react-native-safe-area-context';

const AdminOrderListScreen = ({ navigation, route }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('active'); // 'active' (preparing/ready) or 'history' (completed/rejected)

    const fetchOrders = async () => {
        try {
            const response = await orderService.getOrdersByStatus(filter);
            setOrders(response.documents);
        } catch (error) {
            console.error('Error fetching admin orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [filter, route?.params?.refresh])
    );

    // Also refresh when route params change
    React.useEffect(() => {
        if (route?.params?.refresh) {
            fetchOrders();
        }
    }, [route?.params?.refresh]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return theme.colors.primary;
            case 'preparing': return theme.colors.warning;
            case 'ready': return theme.colors.success;
            case 'completed':
            case 'collected': return theme.colors.textSecondary;
            case 'rejected': return theme.colors.error;
            default: return theme.colors.primary;
        }
    };

    const renderItem = ({ item }) => (
        <Card
            style={styles.card}
            onPress={() => navigation.navigate('AdminOrderDetail', { order: item })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item.$id.substring(0, 8)}</Text>
                <View style={styles.badgeRow}>
                    {item.readyToCollect && (
                        <View style={[styles.statusBadge, { backgroundColor: theme.colors.success + '20', marginRight: 5, borderWidth: 1, borderColor: theme.colors.success }]}>
                            <Text style={[styles.statusText, { color: theme.colors.success }]}>READY</Text>
                        </View>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20', borderWidth: 1, borderColor: getStatusColor(item.status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.cardBody}>
                <Text style={[styles.amount, { marginBottom: 5 }]}>₹{item.amount || item.totalAmount}</Text>
                <Text style={styles.itemsText} numberOfLines={1}>
                    {(() => {
                        try {
                            const parsedItems = typeof item.items === 'string' ? JSON.parse(item.items) : item.items;
                            return Array.isArray(parsedItems)
                                ? parsedItems.map(i => `${i.qty}x ${i.name}`).join(', ')
                                : 'Invalid Items';
                        } catch (e) {
                            return 'Error parsing items';
                        }
                    })()}
                </Text>
                <Text style={styles.date}>
                    {dayjs(item.$createdAt).format('MMM D, h:mm A')}
                </Text>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader title="Orders" />
            </SafeAreaView>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'active' && styles.activeTab]}
                    onPress={() => { setFilter('active'); setLoading(true); }}
                >
                    <Text style={[styles.filterText, filter === 'active' && styles.activeFilterText]}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'history' && styles.activeTab]}
                    onPress={() => { setFilter('history'); setLoading(true); }}
                >
                    <Text style={[styles.filterText, filter === 'history' && styles.activeFilterText]}>History</Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderItem}
                    keyExtractor={item => item.$id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="fast-food-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={styles.emptyText}>No Orders Found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: theme.colors.primary,
    },
    filterText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        fontWeight: 'bold',
    },
    activeFilterText: {
        color: theme.colors.primary,
    },
    listContent: {
        padding: theme.spacing.m,
    },
    card: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        marginBottom: theme.spacing.m,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    itemsText: {
        color: theme.colors.text,
        marginBottom: 8,
    },
    date: {
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        color: theme.colors.textSecondary,
        marginTop: 16,
    }
});

export default AdminOrderListScreen;
