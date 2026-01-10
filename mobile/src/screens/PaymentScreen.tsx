import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { apiClient } from '../api/client';


type PaymentScreenProps = {
    orderId: number;
    total: number;
    onPaymentSubmitted: () => void;
};

const PaymentScreen = ({ orderId, total, onPaymentSubmitted }: PaymentScreenProps) => {
    const [submitting, setSubmitting] = useState(false);
    const [utr, setUtr] = useState('');

    const handleCopy = () => {
        Alert.alert('Copied', 'UPI ID copied to clipboard: merchant@upi');
    };

    const handleManualPayment = async () => {
        if (!utr || utr.length < 4) {
            Alert.alert('Validation Error', 'Please enter a valid UTR (Transaction ID) from your UPI app.');
            return;
        }

        setSubmitting(true);
        try {
            await apiClient.post('/payments/submit', {
                order_id: orderId,
                utr: utr.trim(), // Strict UTR
            });
            onPaymentSubmitted();
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Failed to submit payment proof.';
            Alert.alert('Error', msg);
            console.error(error);
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.tokenLabel}>TOKEN NUMBER</Text>
                <Text style={styles.token}>#{orderId}</Text>

                <Text style={styles.amount}>₹ {total}</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Pay via UPI:</Text>
                    <View style={styles.copyRow}>
                        <Text style={styles.upiId}>merchant@upi</Text>
                        <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                            <Text style={styles.copyText}>Copy</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.qrPlaceholder}>
                    <Text style={styles.qrText}>[ QR Code Placeholder ]</Text>
                </View>

                <Text style={styles.instruction}>
                    1. Pay ₹{total} to above UPI.{'\n'}
                    2. Enter UTR / Transaction ID below.
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Enter UTR / Ref No (Required)"
                    placeholderTextColor="#999"
                    value={utr}
                    onChangeText={setUtr}
                    autoCapitalize="characters"
                    autoCorrect={false}
                />

                <TouchableOpacity
                    style={[styles.button, submitting && styles.disabled]}
                    onPress={handleManualPayment}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Submit UTR</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#f5f5f5', padding: 24, alignItems: 'center' },
    tokenLabel: { fontSize: 14, fontWeight: 'bold', color: '#666', letterSpacing: 1, marginTop: 20 },
    token: { fontSize: 48, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    amount: { fontSize: 32, fontWeight: 'bold', color: '#F97316', marginBottom: 32 },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, width: '100%', marginBottom: 24, elevation: 2 },
    label: { fontSize: 14, color: '#666', marginBottom: 4 },
    copyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    upiId: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    copyButton: { backgroundColor: '#eee', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    copyText: { fontSize: 12, fontWeight: 'bold', color: '#555' },
    qrPlaceholder: {
        width: 150, height: 150, backgroundColor: 'white',
        justifyContent: 'center', alignItems: 'center', marginBottom: 24,
        borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    },
    qrText: { fontSize: 14, fontWeight: 'bold', color: '#ccc' },
    instruction: { textAlign: 'center', color: '#555', marginBottom: 16, lineHeight: 22 },
    input: {
        backgroundColor: 'white', width: '100%', padding: 16, borderRadius: 12,
        borderWidth: 1, borderColor: '#ddd', fontSize: 16, marginBottom: 24,
        color: '#333', fontWeight: 'bold'
    },
    button: { backgroundColor: '#F97316', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center', shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    disabled: { opacity: 0.7 },
});

export default PaymentScreen;
