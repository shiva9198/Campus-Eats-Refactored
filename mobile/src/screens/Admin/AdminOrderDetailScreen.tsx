import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { AdminOrder, adminService } from '../../services/adminService';
import { AppHeader } from '../../components/AppHeader';

const AdminOrderDetailScreen = ({ order, onBack, onVerifyPayment }: any) => {
    console.log('Rendering AdminOrderDetailScreen', order?.id);
    const [orderData, setOrderData] = useState<AdminOrder>(order);
    const [currentStatus, setCurrentStatus] = useState(order.status);
    const [updating, setUpdating] = useState(false);

    // Refresh order data (especially for OTP after verification)
    // Wrapped in useCallback to satisfy linter
    const refreshOrder = React.useCallback(async () => {
        try {
            // Since we don't have a direct getOrder(id) in adminService yet that returns AdminOrder with OTP clearly defined for this screen,
            // we will rely on the list or add a helper.
            // Actually, let's just use the adminService.getOrders() and filter.
            // Or better, assume onVerifyPayment returns the updated order or we re-fetch.

            // Temporary: We will assume we can fetch via ID if we added it, but let's stick to existing patterns.
            // Let's fetch all and find. inefficient but safe for now given "no backend changes" prefernce unless needed.
            const orders = await adminService.getOrders();
            const fresh = orders.find(o => o.id === order.id);
            if (fresh) {
                setOrderData(fresh);
                setCurrentStatus(fresh.status);
            }
        } catch (e) {
            console.error('Failed to refresh order', e);
        }
    }, [order.id]);

    // Propagate onVerifyPayment to handle refresh
    const handleVerify = () => {
        // We pass a callback to the parent/navigation for verify screen,
        // but when we come BACK, we need to refresh.
        // If onVerifyPayment invokes navigation, we need to refresh on focus or via callback.
        onVerifyPayment(async () => {
            // Callback after verification success?
            await refreshOrder();
        });
    };

    useEffect(() => {
        refreshOrder();
    }, [refreshOrder]);

    const updateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            await adminService.updateOrderStatus(order.id, newStatus);
            setCurrentStatus(newStatus);
            setOrderData(prev => ({ ...prev, status: newStatus }));
            Alert.alert('Updated', `Order status changed to ${newStatus}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    // Defines next valid state
    const getNextAction = () => {
        if (currentStatus === 'Pending') { return { label: 'Start Preparing', status: 'Preparing' }; }
        if (currentStatus === 'Paid') { return { label: 'Start Preparing', status: 'Preparing' }; }
        if (currentStatus === 'Preparing') { return { label: 'Mark Ready', status: 'Ready' }; }
        // if (currentStatus === 'Ready') { return { label: 'Complete Order', status: 'Completed' }; }
        return null;
    };

    const nextAction = getNextAction();

    return (
        <View style={styles.container}>
            <AppHeader
                title={`Order #${order.id}`}
                showBack
                onBack={onBack}
            />

            <ScrollView style={styles.content}>
                <View style={styles.statusBox}>
                    <Text style={styles.statusLabel}>Current Status:</Text>
                    <Text style={styles.statusValue}>{currentStatus}</Text>
                </View>

                {/* OTP Display if Paid */}
                {orderData.otp && (
                    <View style={styles.otpBox}>
                        <Text style={styles.otpLabel}>Collection OTP:</Text>
                        <Text style={styles.otpValue}>{orderData.otp}</Text>
                    </View>
                )}

                {/* Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    {orderData.items.map((item: any, index: number) => (
                        <View key={index} style={styles.itemRow}>
                            <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                            <Text style={styles.itemName}>{item.menu_item?.name || 'Unknown Item'}</Text>
                            <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalText}>Total</Text>
                        <Text style={styles.totalAmount}>₹{order.total_amount}</Text>
                    </View>
                </View>

                {/* Payment Actions */}
                {currentStatus === 'Pending_Verification' && (
                    <View style={styles.actionSection}>
                        <Text style={styles.alertText}>⚠️ Payment Proof Uploaded</Text>
                        <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify}>
                            <Text style={styles.verifyBtnText}>Review Payment Proof</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Status Actions */}
                {nextAction && currentStatus !== 'Pending_Verification' && (
                    <View style={styles.actionSection}>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => updateStatus(nextAction.status)}
                            disabled={updating}
                        >
                            <Text style={styles.actionBtnText}>
                                {updating ? 'Updating...' : nextAction.label}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backText: { fontSize: 16, color: '#007AFF' },
    title: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    statusBox: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusLabel: { color: '#666' },
    statusValue: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    otpBox: { padding: 15, backgroundColor: '#E8F5E9', borderRadius: 8, marginBottom: 15, alignItems: 'center' },
    otpLabel: { color: '#2E7D32', fontWeight: 'bold' },
    otpValue: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20', letterSpacing: 5, marginTop: 5 },
    section: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 20 },
    sectionTitle: { fontWeight: 'bold', marginBottom: 10, fontSize: 16 },
    itemRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
    itemQuantity: { fontWeight: 'bold', marginRight: 10, width: 30 },
    itemName: { flex: 1 },
    itemPrice: { fontWeight: 'bold', color: '#555' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
    totalText: { fontWeight: 'bold', fontSize: 16 },
    totalAmount: { fontWeight: 'bold', fontSize: 18, color: '#FF4B3A' },
    actionSection: { marginTop: 10 },
    alertText: { color: '#FF9800', fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    verifyBtn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 8, alignItems: 'center' },
    verifyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    actionBtn: { backgroundColor: '#FF4B3A', padding: 15, borderRadius: 8, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default AdminOrderDetailScreen;
