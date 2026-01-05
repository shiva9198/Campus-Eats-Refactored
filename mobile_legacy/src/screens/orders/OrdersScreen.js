import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL, ENDPOINTS } from '../../constants/config';
import { useWebSocket } from '../../context/WebSocketContext';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../constants/theme';
import { useFocusEffect } from '@react-navigation/native';
import BrandingHeader from '../../components/common/BrandingHeader';
import Card from '../../components/common/Card';
import GlowButton from '../../components/common/GlowButton';



const OrdersScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const { lastEvent } = useWebSocket();

    const fetchOrders = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ORDERS.MY_ORDERS(user.$id)}`);
            const data = await response.json();

            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    // Real-time status sync
    useEffect(() => {
        if (lastEvent && (lastEvent.event === 'ORDER_STATUS_CHANGE' || lastEvent.type === 'ORDER_STATUS_CHANGE')) {
            console.log('📢 Order status updated real-time!');
            fetchOrders();
        }
    }, [lastEvent]);


    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return theme.colors.warning;
            case 'paid':
            case 'preparing': return '#2196f3'; // Blue
            case 'ready': return theme.colors.success;
            case 'payment_rejected':
            case 'cancelled': return theme.colors.error;
            case 'completed':
            case 'collected': return theme.colors.textSecondary;
            default: return theme.colors.text;
        }
    };

    const renderOrderItem = ({ item }) => {
        const items = JSON.parse(item.items);
        const date = new Date(item.$createdAt).toLocaleDateString();
        const time = new Date(item.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <Card style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>Order #{item.$id.substring(0, 8).toUpperCase()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <Text style={styles.orderDate}>{date} at {time}</Text>

                <View style={styles.divider} />

                <View style={styles.itemsList}>
                    {items.map((orderItem, index) => (
                        <Text key={index} style={styles.itemText}>
                            {orderItem.qty}x {orderItem.name}
                        </Text>
                    ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.footer}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
                </View>

                {/* OTP for Collection */}
                {item.otp && (item.status === 'paid' || item.status === 'preparing' || item.status === 'ready') && (
                    <View style={styles.otpBox}>
                        <Text style={styles.otpLabel}>Collection OTP:</Text>
                        <Text style={styles.otpValue}>{item.otp}</Text>
                    </View>
                )}

                {/* Rejection Reason */}
                {item.status === 'payment_rejected' && item.rejectionReason && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorLabel}>Reason for rejection:</Text>
                        <Text style={styles.errorText}>{item.rejectionReason}</Text>
                    </View>
                )}

                {/* Payment Proof button if pending */}
                {item.status === 'pending' && (
                    <GlowButton
                        title="Upload Payment Proof"
                        onPress={() => navigation.navigate('PaymentProof', { order: item })}
                        style={styles.payButton}
                        variant="primary"
                    />
                )}
            </Card>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader title="My Orders" />
            </SafeAreaView>

            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={item => item.$id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No orders found</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    listContent: {
        padding: theme.spacing.m,
    },
    orderCard: {
        backgroundColor: theme.colors.surface,
        marginBottom: theme.spacing.m,
        padding: theme.spacing.m,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    orderId: {
        fontSize: 15,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    orderDate: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 10,
    },
    itemsList: {
        marginBottom: 8,
    },
    itemText: {
        fontSize: 14,
        color: theme.colors.text,
        marginBottom: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontSize: 16
    },
    payButton: {
        marginTop: 16,
        width: '100%',
    },
    otpBox: {
        marginTop: 16,
        padding: 12,
        backgroundColor: 'rgba(33, 150, 243, 0.1)', // Blue tint
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2196f3',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    otpLabel: {
        color: '#2196f3',
        fontWeight: '600',
    },
    otpValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2196f3',
        letterSpacing: 3,
    },
    errorBox: {
        marginTop: 12,
        padding: 10,
        backgroundColor: 'rgba(244, 67, 54, 0.1)', // Red tint
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.error,
    },
    errorLabel: {
        color: theme.colors.error,
        fontWeight: '600',
        fontSize: 12,
        marginBottom: 2,
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 14,
    }
});

export default OrdersScreen;
