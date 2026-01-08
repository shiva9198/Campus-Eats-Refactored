import React, { useEffect, useState, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { getMenu, updateMenuItemAvailability, getUserFriendlyError } from '../api/client';
import { MenuItem as MenuItemType } from '../types';
import MenuItem from '../components/MenuItem';
import { useCart } from '../context/CartContext';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';

interface MenuScreenProps {
    onGoToCart: () => void;
    onGoToProfile: () => void;
    onGoToHistory: () => void;
}

const MenuScreen = ({ onGoToCart, onGoToProfile, onGoToHistory }: MenuScreenProps) => {
    const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addItem, state } = useCart();

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeType, setActiveType] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
    const [activeCategory, setActiveCategory] = useState<string>('All');

    // Day 5: Simple Admin Toggle for Verification
    const [isAdmin, setIsAdmin] = useState(false);

    const fetchMenu = async () => {
        try {
            setError(null);
            const data = await getMenu();
            setMenuItems(data);
        } catch (err) {
            const errorMsg = getUserFriendlyError(err);
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

    // Extract Unique Categories
    const categories = useMemo(() => {
        const uniqueCats = Array.from(new Set(menuItems.map(i => i.category).filter(Boolean)));
        return ['All', ...uniqueCats.sort()];
    }, [menuItems]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMenu();
    };

    const handleToggleStock = async (item: MenuItemType) => {
        try {
            const updatedItem = await updateMenuItemAvailability(item.id, !item.is_available);
            setMenuItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
        } catch (err) {
            Alert.alert('Error', getUserFriendlyError(err));
        }
    };

    // Client-side Composite Filtering Logic
    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            // 1. Text Search (Case-insensitive)
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());

            // 2. Type Filter (Veg / Non-Veg)
            let matchesType = true;
            if (activeType === 'Veg') matchesType = item.is_vegetarian;
            if (activeType === 'Non-Veg') matchesType = !item.is_vegetarian;

            // 3. Category Filter
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;

            return matchesSearch && matchesType && matchesCategory;
        });
    }, [menuItems, searchQuery, activeType, activeCategory]);


    if (error && !refreshing && !loading) {
        return (
            <View style={styles.center}>
                <EmptyState
                    title="Network Error"
                    message={error}
                    icon="⚠️"
                />
                <PrimaryButton
                    title="Retry"
                    onPress={() => {
                        setLoading(true);
                        fetchMenu();
                    }}
                    style={{ width: 200, marginTop: 16 }}
                />
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

    // Header Right Actions
    const HeaderActions = (
        <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={onGoToProfile}>
                <Text style={styles.iconText}>👤</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={onGoToHistory}>
                <Text style={styles.iconText}>📜</Text>
            </TouchableOpacity>
            {state.items.length > 0 && (
                <TouchableOpacity style={styles.cartButton} onPress={onGoToCart}>
                    <Text style={styles.cartButtonText}>🛒 ({state.items.reduce((acc, i) => acc + i.quantity, 0)})</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* 1. Reusable Header */}
            <AppHeader
                title={isAdmin ? "Menu (Admin Mode)" : "Campus Eats"}
                rightAction={HeaderActions}
            />

            {/* Admin Toggle (Secret) */}
            <TouchableOpacity onPress={() => setIsAdmin(!isAdmin)} style={{ height: 1, width: '100%' }} />

            {/* 2. Search & Filter Section */}
            <View style={styles.filterContainer}>
                {/* Search Bar */}
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for food..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Text style={styles.clearIcon}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Type Filter (Veg/Non-Veg) */}
                <View style={styles.typeFilterContainer}>
                    {(['All', 'Veg', 'Non-Veg'] as const).map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.typeChip,
                                activeType === type && styles.typeChipActive
                            ]}
                            onPress={() => setActiveType(type)}
                        >
                            <Text style={[
                                styles.typeChipText,
                                activeType === type && styles.typeChipTextActive
                            ]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Category Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryChip,
                                activeCategory === cat && styles.categoryChipActive
                            ]}
                            onPress={() => setActiveCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryChipText,
                                activeCategory === cat && styles.categoryChipTextActive
                            ]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* 3. Menu List */}
            <FlatList
                data={filteredItems}
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
                    <EmptyState
                        title="No items found"
                        message={`We couldn't find anything matching "${searchQuery}"`}
                    />
                }
            />
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    // Filter Styles
    filterContainer: {
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        marginBottom: 12,
    },
    searchIcon: { marginRight: 8, fontSize: 16, color: '#888' },
    searchInput: { flex: 1, fontSize: 16, color: '#333', height: '100%' },
    clearIcon: { fontSize: 16, color: '#888', padding: 4 },

    // Type Filter (Veg/Non-Veg)
    typeFilterContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 8,
    },
    typeChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    typeChipActive: {
        backgroundColor: '#fff',
        borderColor: '#22c55e', // Green for Veg/Active
    },
    typeChipText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    typeChipTextActive: {
        color: '#22c55e',
        fontWeight: '700',
    },

    // Category Chips
    categoryScroll: { flexDirection: 'row' },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 1,
    },
    categoryChipActive: {
        backgroundColor: '#F97316',
        borderColor: '#F97316',
    },
    categoryChipText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 14,
    },
    categoryChipTextActive: {
        color: 'white',
    },

    // Header Right
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
        fontSize: 12,
    },
    iconButton: {
        padding: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
    },
    iconText: {
        fontSize: 16,
    },

    // Global
    list: {
        padding: 16,
        paddingTop: 8,
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
    retryButton: {
        backgroundColor: '#F97316',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default MenuScreen;
