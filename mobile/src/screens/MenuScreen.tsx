import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { getMenu, updateMenuItemAvailability, getUserFriendlyError } from '../api/client';
import { MenuItem as MenuItemType } from '../types';
import MenuItem from '../components/MenuItem';
import { useCart } from '../context/CartContext';

const MenuScreen = ({ onGoToCart }: { onGoToCart: () => void }) => {
    const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null); // Day 10: Error state
    const { addItem, state } = useCart();

    // Day 5: Simple Admin Toggle for Verification
    // In a real app, this would be determined by Auth Context
    const [isAdmin, setIsAdmin] = useState(false);

    const fetchMenu = async () => {
        try {
            setError(null); // Clear previous errors
            const data = await getMenu();
            setMenuItems(data);
        } catch (err) {
            const errorMsg = getUserFriendlyError(err); // Day 10: User-friendly errors
            setError(errorMsg);
            console.error('Menu fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMenu();
    };

    const handleToggleStock = async (item: MenuItemType) => {
        try {
            // "Reliability > Elegance": Wait for server confirmation, then update UI
            // But to feel responsive, we could optimize. Let's stick to safe.
            const updatedItem = await updateMenuItemAvailability(item.id, !item.is_available);

            // Update local state to reflect change without full refresh
            setMenuItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
        } catch (err) {
            Alert.alert("Error", getUserFriendlyError(err)); // Day 10: Better error messages
        }
    };

    // Day 10: Error State with Retry
    if (error && !refreshing && !loading) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => {
                    setLoading(true);
                    fetchMenu();
                }}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={styles.loadingText}>Loading menu...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setIsAdmin(!isAdmin)} activeOpacity={0.8}>
                    <Text style={styles.headerTitle}>Campus Eats {isAdmin ? "(Admin)" : ""}</Text>
                </TouchableOpacity>
                {state.items.length > 0 && (
                    <TouchableOpacity style={styles.cartButton} onPress={onGoToCart}>
                        <Text style={styles.cartButtonText}>Cart ({state.items.reduce((acc, i) => acc + i.quantity, 0)})</Text>
                    </TouchableOpacity>
                )}
            </View>
            <FlatList
                data={menuItems}
                renderItem={({ item }) => (
                    <MenuItem
                        item={item}
                        onPress={() => addItem(item)}
                        isAdmin={isAdmin}
                        onToggleStock={handleToggleStock}
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text>No items found.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        elevation: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#F97316',
    },
    cartButton: {
        backgroundColor: '#F97316',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    cartButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    list: {
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#888',
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 32,
    },
    retryButton: {
        backgroundColor: '#F97316',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default MenuScreen;
