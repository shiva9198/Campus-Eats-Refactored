import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { adminService } from '../../services/adminService';
import { apiClient } from '../../api/client';

const PaymentVerificationScreen = ({ order, onBack, onVerified }: any) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState<'none' | 'rejecting'>('none');

    // Construct Image URL
    // If backend returns relative path /static/..., prepend base URL
    // apiClient.defaults.baseURL contains the base.
    const getImageUrl = (path: string | null | undefined) => {
        if (!path) { return undefined; }
        if (path.startsWith('http')) { return path; }
        return `${apiClient.defaults.baseURL}${path}`;
    };


    const handleVerify = async () => {
        setLoading(true);
        try {
            const result = await adminService.verifyPayment(order.id, 'admin'); // Hardcoded admin for now
            Alert.alert('Success', `Payment Verified!\n\nOTP: ${result.otp}`, [
                { text: 'OK', onPress: () => onVerified() },
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to verify payment');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!reason.trim()) {
            Alert.alert('Required', 'Please enter a rejection reason.');
            return;
        }
        setLoading(true);
        try {
            await adminService.rejectPayment(order.id, 'admin', reason);
            Alert.alert('Rejected', 'Payment has been rejected.', [
                { text: 'OK', onPress: () => onVerified() },
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to reject payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Verify Payment</Text>
                <View style={{ width: 50 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Proof of Payment</Text>

                {order.verification_proof ? (
                    <Image
                        source={{ uri: getImageUrl(order.verification_proof) }}
                        style={styles.proofImage}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.noImage}>
                        <Text style={styles.noImageText}>No Image Uploaded</Text>
                    </View>
                )}

                <View style={styles.details}>
                    <Text style={styles.detailText}>Order ID: #{order.id}</Text>
                    <Text style={styles.detailText}>User: {order.user?.username || 'Unknown Student'}</Text>
                    <Text style={styles.detailText}>Amount: ₹{order.total_amount}</Text>
                </View>

                {action === 'rejecting' ? (
                    <View style={styles.rejectBox}>
                        <Text style={styles.label}>Reason for Rejection:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Invalid Screenshot, Amount Mismatch"
                            value={reason}
                            onChangeText={setReason}
                        />
                        <View style={styles.row}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAction('none')}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.confirmRejectBtn, loading && styles.disabled]} onPress={handleReject} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirm Reject</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>✅ Approve Payment</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.rejectBtn} onPress={() => setAction('rejecting')} disabled={loading}>
                            <Text style={styles.btnText}>❌ Reject Payment</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    backText: { fontSize: 16, color: '#007AFF' },
    title: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    proofImage: { width: '100%', height: 400, backgroundColor: '#f0f0f0', marginBottom: 20, borderRadius: 8 },
    noImage: { width: '100%', height: 200, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    noImageText: { color: '#888' },
    details: { marginBottom: 30, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 8 },
    detailText: { fontSize: 16, marginBottom: 5 },
    actions: { gap: 10 },
    verifyBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, alignItems: 'center' },
    rejectBtn: { backgroundColor: '#F44336', padding: 15, borderRadius: 8, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    rejectBox: { padding: 15, backgroundColor: '#FFEBEE', borderRadius: 8 },
    label: { marginBottom: 5, fontWeight: 'bold' },
    input: { backgroundColor: '#fff', padding: 10, borderRadius: 5, borderWidth: 1, borderColor: '#ffcdd2', marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    cancelBtn: { padding: 10 },
    cancelText: { color: '#666' },
    confirmRejectBtn: { backgroundColor: '#D32F2F', padding: 10, borderRadius: 5 },
    disabled: { opacity: 0.7 },
});

export default PaymentVerificationScreen;
