import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AppHeader } from '../../components/AppHeader';
import { apiClient, getUserFriendlyError } from '../../api/client';

type AdminCollectionScreenProps = {
    onBack: () => void;
};

const AdminCollectionScreen = ({ onBack }: AdminCollectionScreenProps) => {
    const [otp, setOtp] = useState('');
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (!otp.trim()) {
            Alert.alert('Error', 'Please enter OTP');
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.post('/admin/verify-otp', { otp: otp.trim() });
            setOrder(res.data);
        } catch (err: any) {
            setOrder(null);
            Alert.alert('Not Found', getUserFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleCollect = async () => {
        if (!order) return;
        
        setLoading(true);
        try {
            await apiClient.patch(`/admin/orders/${order.id}/status`, { status: "Completed" });
            Alert.alert("Success", "Order marked as Collected!");
            setOrder(null);
            setOtp('');
        } catch (err: any) {
            Alert.alert('Error', getUserFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <AppHeader title="Collect Order" showBack onBack={onBack} />
            
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                
                {/* OTP Input Section */}
                <View style={styles.inputCard}>
                    <Text style={styles.label}>Enter Customer OTP</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 1234"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={4}
                        autoFocus
                    />
                    <PrimaryButton 
                        title="Find Order" 
                        onPress={handleVerify} 
                        loading={loading && !order}
                        disabled={loading || otp.length < 4}
                        style={{ marginTop: 12 }}
                    />
                </View>

                {/* Order Details Result */}
                {order && (
                    <View style={styles.resultCard}>
                        <View style={styles.headerRow}>
                            <Text style={styles.orderId}>Order #{order.id}</Text>
                            <Text style={styles.statusBadge}>{order.status}</Text>
                        </View>
                        
                        <View style={styles.divider} />

                        <View style={styles. detailRow}>
                            <Text style={styles.detailLabel}>Customer:</Text>
                            <Text style={styles.detailValue}>{order.user?.full_name || order.user?.username || 'Unknown'}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Amount:</Text>
                            <Text style={styles.detailValue}>₹{order.total_amount}</Text>
                        </View>

                        <Text style={[styles.detailLabel, { marginTop: 12, marginBottom: 8 }]}>Items:</Text>
                        {order.items.map((item: any, index: number) => (
                            <View key={index} style={styles.itemRow}>
                                <Text style={styles.itemText}>
                                    {item.quantity}x {item.item_name || "Item"}
                                </Text>
                                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                            </View>
                        ))}

                        <View style={styles.divider} />

                        <PrimaryButton 
                            title="Confirm Collection" 
                            onPress={handleCollect}
                            loading={loading}
                            style={{ backgroundColor: '#10B981', marginTop: 16 }}
                        />
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    content: { padding: 20 },
    
    inputCard: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 12,
        marginBottom: 24,
        elevation: 2,
    },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 24,
        textAlign: 'center',
        letterSpacing: 8,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333'
    },

    resultCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    orderId: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    statusBadge: { 
        backgroundColor: '#FEF3C7', 
        color: '#D97706', 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 4, 
        fontSize: 12, 
        fontWeight: 'bold' 
    },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    detailLabel: { color: '#666', fontSize: 14 },
    detailValue: { color: '#111', fontWeight: '600', fontSize: 14 },
    
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, paddingLeft: 8 },
    itemText: { color: '#444', fontSize: 14 },
    itemPrice: { color: '#888', fontSize: 14 },
});

export default AdminCollectionScreen;
