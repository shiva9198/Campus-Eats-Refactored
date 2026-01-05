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

const PaymentVerificationListScreen = ({ navigation, route }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const response = await orderService.getPendingPayments();
            setOrders(response.documents);
        } catch (error) {
            console.error('Error fetching pending orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [route?.params?.refresh])
    );

    // Handle local filtering and dashboard redirect
    React.useEffect(() => {
        if (route?.params?.removeOrderId) {
            // Filter out the specific order locally
            setOrders(prevOrders => {
                const filteredOrders = prevOrders.filter(order => order.$id !== route.params.removeOrderId);
                // If no orders left, redirect to dashboard
                if (filteredOrders.length === 0) {
                    setTimeout(() => {
                        navigation.navigate('AdminDashboard');
                    }, 100);
                }
                return filteredOrders;
            });
        } else if (route?.params?.refresh) {
            fetchOrders();
        }
    }, [route?.params?.refresh, route?.params?.removeOrderId]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const renderItem = ({ item }) => (
        <Card
            style={styles.card}
            onPress={() => navigation.navigate('PaymentVerificationDetail', { order: item })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item.$id.substring(0, 8)}</Text>
                <Text style={styles.amount}>₹{item.amount || item.totalAmount}</Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.row}>
                    <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.customerName}>
                        Student Order
                    </Text>
                </View>
                <View style={styles.row}>
                    <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.date}>
                        {dayjs(item.$createdAt).format('MMM D, h:mm A')}
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>PENDING VERIFICATION</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
            </View>
        </Card>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader title="Pending Payments" />
            </SafeAreaView>
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
                        <Ionicons name="checkmark-circle-outline" size={64} color={theme.colors.success} />
                        <Text style={styles.emptyText}>All Caught Up!</Text>
                        <Text style={styles.emptySubtext}>No pending payments to verify</Text>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    listContent: {
        padding: theme.spacing.m,
    },
    card: {
        padding: theme.spacing.m,
        marginBottom: theme.spacing.m,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    cardBody: {
        marginBottom: theme.spacing.m,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 8,
    },
    customerName: {
        color: theme.colors.text,
        fontSize: 14,
    },
    date: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: theme.spacing.s,
    },
    statusBadge: {
        backgroundColor: theme.colors.warning + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.warning,
    },
    statusText: {
        color: theme.colors.warning,
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginTop: 8,
    }
});

export default PaymentVerificationListScreen;
