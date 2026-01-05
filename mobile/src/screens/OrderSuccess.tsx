import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const OrderSuccess = ({ onHome }: { onHome: () => void }) => (
    <View style={styles.center}>
        <Text style={styles.successText}>Order Placed Successfully!</Text>
        <Text style={styles.subText}>Your order is now Pending.</Text>
        <TouchableOpacity style={styles.button} onPress={onHome}>
            <Text style={styles.buttonText}>Order More</Text>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    successText: { fontSize: 24, fontWeight: 'bold', color: 'green', marginBottom: 10 },
    subText: { fontSize: 16, color: '#666', marginBottom: 20 },
    button: { padding: 12, backgroundColor: '#F97316', borderRadius: 8 },
    buttonText: { color: 'white', fontSize: 16 },
});

export default OrderSuccess;
