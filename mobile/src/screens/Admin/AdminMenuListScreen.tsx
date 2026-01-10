import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { getMenu, updateMenuItemAvailability } from '../../api/client'; // Shared client methods
import { adminService } from '../../services/adminService';
import { apiClient } from '../../api/client';
import { AppHeader } from '../../components/AppHeader';

const AdminMenuListScreen = ({ onEditItem, onAddItem }: any) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadMenu = useCallback(async () => {
        try {
            const data = await getMenu();
            setItems(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load menu');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadMenu();
    }, [loadMenu]);

    const handleToggleAvailability = async (id: number, currentStatus: boolean) => {
        // Optimistic update
        const originalItems = [...items];
        setItems(items.map(i => i.id === id ? { ...i, is_available: !currentStatus } : i));

        try {
            await updateMenuItemAvailability(id, !currentStatus);
        } catch (error) {
            // Revert
            setItems(originalItems);
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleDelete = (id: number, name: string) => {
        Alert.alert(
            'Delete Item',
            `Are you sure you want to delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await adminService.deleteMenuItem(id);
                            setItems(items.filter(i => i.id !== id));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete item. It might be in active orders.');
                        }
                    },
                },
            ]
        );
    };

    const getImageUrl = (path: string | null) => {
        if (!path) { return undefined; }
        if (path.startsWith('http')) { return path; }
        return `${apiClient.defaults.baseURL}${path}`;
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <Image
                source={{ uri: getImageUrl(item.image_url) }}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.details}>
                <View style={styles.headerRow}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.price}>₹{item.price}</Text>
                </View>
                <Text style={styles.category}>{item.category} • {item.is_vegetarian ? '🟢 Veg' : '🔴 Non-Veg'}</Text>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, item.is_available ? styles.btnActive : styles.btnInactive]}
                        onPress={() => handleToggleAvailability(item.id, item.is_available)}
                    >
                        <Text style={styles.toggleText}>{item.is_available ? 'Available' : 'Unavailable'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.editBtn} onPress={() => onEditItem(item)}>
                        <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
                        <Text style={styles.actionText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <AppHeader
                title="Menu Management"
                rightAction={
                    <TouchableOpacity style={styles.addBtn} onPress={onAddItem}>
                        <Text style={styles.addBtnText}>+ Add Item</Text>
                    </TouchableOpacity>
                }
            />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#FF4B3A" />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMenu(); }} />}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    addBtn: { backgroundColor: '#FF4B3A', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    addBtnText: { color: '#fff', fontWeight: 'bold' },
    list: { padding: 15 },
    card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, overflow: 'hidden', elevation: 2 },
    image: { width: 100, height: 100, backgroundColor: '#eee' },
    details: { flex: 1, padding: 10 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
    price: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
    category: { color: '#666', fontSize: 12, marginBottom: 10 },
    actions: { flexDirection: 'row', gap: 10 },
    toggleBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5, borderWidth: 1 },
    btnActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
    btnInactive: { backgroundColor: '#FFEBEE', borderColor: '#F44336' },
    toggleText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
    editBtn: { paddingVertical: 5, paddingHorizontal: 10, backgroundColor: '#E3F2FD', borderRadius: 5 },
    deleteBtn: { paddingVertical: 5, paddingHorizontal: 10, backgroundColor: '#FFEBEE', borderRadius: 5 },
    actionText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
});

export default AdminMenuListScreen;
