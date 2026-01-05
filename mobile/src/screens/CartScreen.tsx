import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useCart } from '../context/CartContext';
import { apiClient, getUserFriendlyError } from '../api/client';

type CartScreenProps = {
    onBack: () => void;
    onOrderPlaced: (orderId: number, total: number) => void;
};

const CartScreen = ({ onBack, onOrderPlaced }: CartScreenProps) => {
    const { state, removeItem, clearCart } = useCart();
    const [ordering, setOrdering] = useState(false);

    const placeOrder = async () => {
        if (state.items.length === 0) {
            Alert.alert('Cart Empty', 'Please add items to your cart before placing an order.');
            return;
        }

        // Day 10: Confirmation Dialog (prevent accidental submissions)
        Alert.alert(
            'Confirm Order',
            `Place order for ₹${state.total}?\n\nThis action cannot be undone.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        setOrdering(true);
                        try {
                            const orderPayload = {
                                items: state.items.map(item => ({
                                    menu_item_id: item.id,
                                    quantity: item.quantity
                                }))
                            };

                            const response = await apiClient.post('/orders', orderPayload);
                            console.log('Order Response:', response.data);
                            // Success! Clear cart and navigate to payment
                            clearCart();
                            onOrderPlaced(response.data.id, response.data.total_amount);
                        } catch (err) {
                            console.error('Order placement error:', err);
                            // Day 10: User-friendly errors
                            const errorMsg = getUserFriendlyError(err);
                            Alert.alert('Order Failed', errorMsg);
                        } finally {
                            setOrdering(false);
                        }
                    }
                }
            ]
        );
    };

    if (state.items.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>Your cart is empty.</Text>
                <TouchableOpacity style={styles.button} onPress={onBack}>
                    <Text style={styles.buttonText}>Back to Menu</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backText}>← Menu</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Your Cart</Text>
            </View>

            <FlatList
                data={state.items}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.itemRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemPrice}>₹{item.price} x {item.quantity}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
                            <Text style={styles.removeText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.rowTotal}>₹{item.price * item.quantity}</Text>
                    </View>
                )}
            />

            <View style={styles.footer}>
                <Text style={styles.totalText}>Total: ₹ {state.total}</Text>
                <TouchableOpacity
                    style={[styles.placeOrderBtn, ordering && styles.disabled]}
                    onPress={placeOrder}
                    disabled={ordering}
                >
                    {ordering ? <ActivityIndicator color="white" /> : <Text style={styles.placeOrderText}>Place Order</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: { padding: 16, backgroundColor: '#eee', flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 16 },
    backText: { fontSize: 16, color: '#007AFF' },
    title: { fontSize: 20, fontWeight: 'bold' },
    itemRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
    itemName: { fontSize: 16, fontWeight: '600' },
    itemPrice: { color: '#666' },
    removeBtn: { padding: 8, marginHorizontal: 8, backgroundColor: '#f0f0f0', borderRadius: 4 },
    removeText: { fontSize: 18, fontWeight: 'bold', color: 'red' },
    rowTotal: { fontSize: 16, fontWeight: 'bold' },
    footer: { padding: 20, borderTopWidth: 1, borderColor: '#ccc' },
    totalText: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'right' },
    placeOrderBtn: { backgroundColor: '#F97316', padding: 16, borderRadius: 8, alignItems: 'center' },
    placeOrderText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    disabled: { opacity: 0.7 },
    emptyText: { fontSize: 18, marginBottom: 20, color: '#888' },
    button: { padding: 12, backgroundColor: '#F97316', borderRadius: 8 },
    buttonText: { color: 'white', fontSize: 16 },
    successText: { fontSize: 24, fontWeight: 'bold', color: 'green', marginBottom: 10 },
    subText: { fontSize: 16, color: '#666', marginBottom: 20 }
});

export default CartScreen;
