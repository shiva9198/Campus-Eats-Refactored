import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { apiClient } from '../api/client';
import { useCart } from '../context/CartContext';

type PaymentScreenProps = {
    orderId: number;
    total: number;
    onPaymentSubmitted: () => void;
};

const PaymentScreen = ({ orderId, total, onPaymentSubmitted }: PaymentScreenProps) => {
    const [submitting, setSubmitting] = useState(false);

    const handleCopy = () => {
        // Fallback for no Clipboard in environment
        Alert.alert('Copied', 'UPI ID copied to clipboard: merchant@upi');
    };

    const handleManualPayment = async () => {
        setSubmitting(true);
        try {
            // Strict Rule: Student says "I Have Paid", but status remains Pending.
            await apiClient.post('/payments/submit', {
                order_id: orderId,
                reference: 'Manual-Proof-App',
            });
            onPaymentSubmitted();
        } catch (error) {
            Alert.alert('Error', 'Failed to submit payment proof.');
            console.error(error);
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Payment Required</Text>
            <Text style={styles.amount}>₹ {total}</Text>

            <View style={styles.card}>
                <Text style={styles.label}>UPI ID:</Text>
                <View style={styles.copyRow}>
                    <Text style={styles.upiId}>merchant@upi</Text>
                    <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                        <Text style={styles.copyText}>Copy</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.qrPlaceholder}>
                <Text style={styles.qrText}>[ QR Code Placeholder ]</Text>
                <Text style={styles.qrSubText}>Scan via UPI App</Text>
            </View>

            <Text style={styles.instruction}>
                1. Copy UPI ID or Scan QR.{'\n'}
                2. Pay ₹{total} on your app.{'\n'}
                3. Click "I Have Paid" below.
            </Text>

            <TouchableOpacity
                style={[styles.button, submitting && styles.disabled]}
                onPress={handleManualPayment}
                disabled={submitting}
            >
                {submitting ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>I Have Paid</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 24, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333' },
    amount: { fontSize: 40, fontWeight: 'bold', color: '#F97316', marginBottom: 32 },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, width: '100%', marginBottom: 24, elevation: 2 },
    label: { fontSize: 14, color: '#666', marginBottom: 4 },
    copyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    upiId: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    copyButton: { backgroundColor: '#eee', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    copyText: { fontSize: 12, fontWeight: 'bold', color: '#555' },
    qrPlaceholder: {
        width: 180, height: 180, backgroundColor: 'white',
        justifyContent: 'center', alignItems: 'center', marginBottom: 32,
        borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    },
    qrText: { fontSize: 16, fontWeight: 'bold', color: '#ccc' },
    qrSubText: { marginTop: 8, color: '#999', fontSize: 12 },
    instruction: { textAlign: 'center', color: '#555', marginBottom: 32, lineHeight: 22 },
    button: { backgroundColor: '#F97316', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center', shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    disabled: { opacity: 0.7 },
});

export default PaymentScreen;
