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

    const handleManualPayment = async () => {
        setSubmitting(true);
        try {
            // Strict Rule: Student says "I Have Paid", but status remains Pending.
            await apiClient.post('/payments/submit', {
                order_id: orderId,
                reference: 'Manual-Proof-App'
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

            <View style={styles.qrPlaceholder}>
                <Text style={styles.qrText}>[ QR Code Placeholder ]</Text>
                <Text style={styles.qrSubText}>Scan via UPI App</Text>
            </View>

            <Text style={styles.instruction}>
                Please pay the exact amount and click "I Have Paid" below.
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
    container: { flex: 1, backgroundColor: 'white', padding: 24, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
    amount: { fontSize: 40, fontWeight: 'bold', color: '#F97316', marginBottom: 32 },
    qrPlaceholder: {
        width: 200, height: 200, backgroundColor: '#eee',
        justifyContent: 'center', alignItems: 'center', marginBottom: 32,
        borderWidth: 2, borderColor: '#ccc', borderStyle: 'dashed'
    },
    qrText: { fontSize: 18, fontWeight: 'bold', color: '#555' },
    qrSubText: { marginTop: 8, color: '#888' },
    instruction: { textAlign: 'center', color: '#666', marginBottom: 32 },
    button: { backgroundColor: '#F97316', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center' },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    disabled: { opacity: 0.7 }
});

export default PaymentScreen;
