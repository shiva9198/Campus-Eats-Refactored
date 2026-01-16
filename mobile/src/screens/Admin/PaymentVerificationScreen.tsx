import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { adminService } from '../../services/adminService';
import { AppHeader } from '../../components/AppHeader';

const PaymentVerificationScreen = ({ order, onBack, onVerified }: any) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState<'none' | 'rejecting'>('none');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [checkingProof, setCheckingProof] = useState(false);

    useEffect(() => {
        let mounted = true;
        let timeoutId: any;

        const fetchProof = async () => {
            if (order.verification_proof && order.verification_proof.startsWith('payment_proofs/')) {
                if (mounted) {setCheckingProof(true);}
                try {
                    const data = await adminService.getPaymentProofUrl(order.id);
                    if (mounted) {
                        setImageUrl(data.url);
                        // Auto-refresh before expiry (4.5 mins)
                        timeoutId = setTimeout(fetchProof, 270000);
                    }
                } catch (error) {
                    console.log('Failed to fetch proof URL:', error);
                } finally {
                    if (mounted) {setCheckingProof(false);}
                }
            } else {
                if (mounted) {setImageUrl(null);}
            }
        };

        fetchProof();

        return () => {
            mounted = false;
            if (timeoutId) {clearTimeout(timeoutId);}
        };
    }, [order.id, order.verification_proof]);

    const handleVerify = async () => {
        // ADMIN SAFEGUARD: Confirmation Dialog
        Alert.alert(
            'Confirm Verification',
            `Have you checked UTR: ${order.verification_proof} in your BANK APP?`,
            [
                { text: 'No, Cancel', style: 'cancel' },
                {
                    text: 'Yes, I Validated It',
                    onPress: async () => {
                        performVerification();
                    },
                },
            ]
        );
    };

    const performVerification = async () => {
        setLoading(true);
        try {
            const result = await adminService.verifyPayment(order.id, 'admin'); // Hardcoded admin for now
            Alert.alert('Success', `Payment Verified!\n\nOTP Generated: ${result.otp}`, [
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
            <AppHeader
                title="Verify Payment"
                showBack
                onBack={onBack}
            />

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Verification Details</Text>

                <View style={styles.utrBox}>
                    <Text style={styles.utrLabel}>
                        {imageUrl ? 'PAYMENT PROOF SCAN' : 'UTR / REFERENCE NO'}
                    </Text>

                    {checkingProof ? (
                        <ActivityIndicator size="large" color="#1976D2" style={{ marginVertical: 20 }} />
                    ) : imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={{ width: '100%', height: 400, borderRadius: 8, backgroundColor: '#f0f0f0' }}
                            resizeMode="contain"
                        />
                    ) : (
                        <Text style={styles.utrValue}>{order.verification_proof || 'MISSING'}</Text>
                    )}
                </View>

                <View style={styles.details}>
                    <Text style={styles.detailText}>Order ID: #{order.id}</Text>
                    <Text style={styles.detailText}>Student: {order.user?.username || 'Unknown'}</Text>
                    <Text style={styles.amountText}>Amount: ₹{order.total_amount}</Text>
                </View>

                <View style={styles.instructionBox}>
                    <Text style={styles.instructionText}>
                        1. Open your Bank App.{'\n'}
                        2. Search for UTR above.{'\n'}
                        3. Confirm amount ₹{order.total_amount}.
                    </Text>
                </View>

                {action === 'rejecting' ? (
                    <View style={styles.rejectBox}>
                        <Text style={styles.label}>Reason for Rejection:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Duplicate UTR, Amount Mismatch"
                            value={reason}
                            onChangeText={setReason}
                            autoCapitalize="sentences"
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
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>✅ Verify in Bank App</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.rejectBtn} onPress={() => setAction('rejecting')} disabled={loading}>
                            <Text style={styles.btnText}>❌ Reject (Invalid UTR)</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { padding: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    utrBox: { backgroundColor: '#E3F2FD', padding: 20, borderRadius: 12, marginBottom: 20, alignItems: 'center', borderColor: '#2196F3', borderWidth: 1 },
    utrLabel: { color: '#1976D2', fontSize: 12, fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 },
    utrValue: { fontSize: 28, fontWeight: 'bold', color: '#0D47A1' },
    details: { marginBottom: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 8 },
    detailText: { fontSize: 16, marginBottom: 8, color: '#555' },
    amountText: { fontSize: 20, fontWeight: 'bold', color: '#2E7D32', marginTop: 5 },
    instructionBox: { marginBottom: 30, padding: 15, backgroundColor: '#FFF3E0', borderRadius: 8, borderColor: '#FFB74D', borderWidth: 1 },
    instructionText: { color: '#E65100', lineHeight: 22, fontWeight: '500' },
    actions: { gap: 15 },
    verifyBtn: { backgroundColor: '#2E7D32', padding: 18, borderRadius: 12, alignItems: 'center', elevation: 3 },
    rejectBtn: { backgroundColor: '#D32F2F', padding: 18, borderRadius: 12, alignItems: 'center', elevation: 1 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    rejectBox: { padding: 15, backgroundColor: '#FFEBEE', borderRadius: 8 },
    label: { marginBottom: 5, fontWeight: 'bold' },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ffcdd2', marginBottom: 15, fontSize: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cancelBtn: { padding: 10 },
    cancelText: { color: '#666', fontWeight: 'bold' },
    confirmRejectBtn: { backgroundColor: '#C62828', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
    disabled: { opacity: 0.7 },
});

export default PaymentVerificationScreen;
