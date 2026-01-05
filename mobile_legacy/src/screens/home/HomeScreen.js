import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Image,
} from 'react-native';

import { theme } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import BrandingHeader from '../../components/common/BrandingHeader';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import GlowButton from '../../components/common/GlowButton';
import OffersCarousel from '../../components/common/OffersCarousel';
import { API_BASE_URL, ENDPOINTS } from '../../constants/config';
import { useWebSocket } from '../../context/WebSocketContext';


const HomeScreen = ({ navigation }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState(['All']); // Dynamic categories
    const [shopStatus, setShopStatus] = useState('open'); // 'open' or 'closed'
    const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart();
    const { lastEvent, connectionStatus, isSafeState } = useWebSocket();

    const isShopClosed = shopStatus === 'closed';


    const fetchMenu = async () => {
        if (loading && menuItems.length > 0) return; // Don't show loader if we have items
        try {
            const response = await fetch(`${API_BASE_URL}${ENDPOINTS.MENU.LIST}`);
            const data = await response.json();

            if (!data.success) throw new Error(data.detail || 'Failed to fetch menu');

            const items = data.items.map(doc => ({
                _id: doc.$id,
                name: doc.name,
                description: doc.description,
                price: doc.price,
                category: doc.category,
                available: doc.available,
                sectionClosed: doc.sectionClosed || (doc.value === 'closed' && (doc.event === 'SECTION_STATUS_CHANGE' || doc.type === 'SECTION_STATUS')),
                imageUrl: doc.imageUrl
            }));

            setMenuItems(items);

            // Extract unique categories dynamically
            const uniqueCategories = ['All', ...new Set(
                items.map(item => item.category).filter(cat => cat)
            )];
            setCategories(uniqueCategories);

        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    // REAL-TIME ORCHESTRATION GUARD
    useEffect(() => {
        if (!lastEvent) return;

        const eventType = lastEvent.event || lastEvent.type;

        // Auto-refresh menu or update local state on session/section changes
        if (eventType === 'SECTION_STATUS_CHANGE' || eventType === 'SHOP_STATUS_CHANGE') {
            console.log('📢 Real-time Status Update Received:', eventType);

            if (eventType === 'SHOP_STATUS_CHANGE') {
                setShopStatus(lastEvent.value);
            }

            fetchMenu(); // Fetch fresh data to ensure consistency
        }
    }, [lastEvent]);


    const onRefresh = () => {
        setRefreshing(true);
        fetchMenu();
    };

    // Helper function to get category icons
    const getCategoryIcon = (category) => {
        const icons = {
            'All': '🍽️',
            'Fast Food': '🍔',
            'Meals': '🍱',
            'Drinks': '☕',
            'Dessert': '🍰',
            'Desserts': '🍰',
            'Beverages': '☕',
            'Breakfast': '🍳',
            'Lunch': '🍱',
            'Snacks': '🍟',
            'Pizza': '🍕',
            'Indian': '🍛',
            'Chinese': '🥡',
            'Burgers': '🍔'
        };
        return icons[category] || '🍽️'; // Default icon for unknown categories
    };

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const renderMenuItem = ({ item }) => {
        const cartItem = cartItems.find(c => c._id === item._id);
        const qty = cartItem ? cartItem.qty : 0;
        const isUnavailable = !item.available || item.sectionClosed;

        return (
            <Card style={styles.menuCard} variant="default">
                <View style={styles.imageContainer}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.foodImage} />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Ionicons name="fast-food-outline" size={48} color={theme.colors.textSecondary} />
                        </View>
                    )}
                    {isUnavailable && (
                        <View style={styles.unavailableOverlay}>
                            <Text style={styles.unavailableText}>Sold Out</Text>
                        </View>
                    )}
                </View>

                <View style={styles.menuInfo}>
                    <Text style={styles.menuName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.priceActionRow}>
                        <Text style={styles.menuPrice}>₹{item.price}</Text>

                        {!isUnavailable && (
                            <View style={styles.actionContainer}>
                                {qty > 0 ? (
                                    <View style={styles.qtyContainer}>
                                        <TouchableOpacity
                                            style={styles.qtyBtn}
                                            onPress={() => updateQuantity(item._id, -1)}
                                        >
                                            <Text style={styles.qtyText}>−</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.qtyValue}>{qty}</Text>
                                        <TouchableOpacity
                                            style={styles.qtyBtn}
                                            onPress={() => updateQuantity(item._id, 1)}
                                        >
                                            <Text style={styles.qtyText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => addToCart(item)}
                                        style={styles.addBtnSmall}
                                    >
                                        <Ionicons name="add" size={20} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <BrandingHeader
                showMenu={false}
                rightAction={
                    <TouchableOpacity
                        style={styles.cartIconContainer}
                        onPress={() => navigation.navigate('Cart')}
                    >
                        <Ionicons name="cart-outline" size={24} color={theme.colors.primary} />
                        {cartItems.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{cartItems.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                }
            />

            <FlatList
                data={filteredItems}
                renderItem={renderMenuItem}
                keyExtractor={item => item._id}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.menuList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
                ListHeaderComponent={
                    <>
                        {/* SHOP STATUS GUARD BANNER */}
                        {isShopClosed && (
                            <View style={styles.shopClosedBanner}>
                                <Ionicons name="lock-closed" size={16} color="white" />
                                <Text style={styles.shopClosedText}>Shop is currently closed.</Text>
                            </View>
                        )}

                        <View style={styles.searchContainer}>
                            <View style={styles.searchBar}>
                                <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search for meals..."
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                        </View>

                        <View style={styles.bannerContainer}>
                            <OffersCarousel />
                        </View>

                        {/* Categories Section */}
                        <View style={styles.categoriesSection}>
                            <Text style={styles.sectionTitle}>Categories</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.categoriesContainer}
                            >
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={styles.categoryItem}
                                        onPress={() => setSelectedCategory(cat)}
                                    >
                                        <View style={[
                                            styles.categoryCircle,
                                            selectedCategory === cat && styles.categoryCircleActive,
                                        ]}>
                                            <Text style={styles.categoryIcon}>{getCategoryIcon(cat)}</Text>
                                        </View>
                                        <Text style={[
                                            styles.categoryLabel,
                                            selectedCategory === cat && styles.categoryLabelActive
                                        ]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <Text style={styles.sectionTitleList}>Special for you</Text>
                    </>
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No items found.</Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.l,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        color: theme.colors.text,
        fontSize: 15,
    },
    bannerContainer: {
        marginTop: 8,
    },
    categoriesSection: {
        paddingVertical: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    sectionTitleList: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    categoriesContainer: {
        paddingHorizontal: 20,
        gap: 20,
    },
    categoryItem: {
        alignItems: 'center',
        width: 70,
    },
    categoryCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 8,
    },
    categoryCircleActive: {
        backgroundColor: theme.colors.primarySoft,
        borderColor: theme.colors.primary,
        ...theme.shadows.glow,
    },
    categoryIcon: {
        fontSize: 28,
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    categoryLabelActive: {
        color: theme.colors.primary,
        fontWeight: '700',
    },
    menuList: {
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        gap: 16,
    },
    menuCard: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.l,
        marginBottom: 16,
        padding: 12, // Increased internal padding
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
    },
    imageContainer: {
        width: '100%',
        height: 120, // Slightly shorter to accommodate card padding
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.m, // Round image corners too
        overflow: 'hidden',
        position: 'relative',
    },
    foodImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    unavailableOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    unavailableText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    menuInfo: {
        paddingTop: 12, // Space between image and text
    },
    menuName: {
        fontSize: 16, // Slightly larger
        fontWeight: '800', // Bolder title
        color: theme.colors.text,
        marginBottom: 4,
    },
    priceActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    menuPrice: {
        fontSize: 14, // Slightly smaller
        fontWeight: '600', // Lighter weight
        color: theme.colors.textSecondary, // Lighter color for price as description-like hierarchy
    },
    actionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addBtnSmall: {
        backgroundColor: theme.colors.primary,
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 15,
        paddingHorizontal: 4,
    },
    qtyBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    qtyValue: {
        paddingHorizontal: 8,
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text,
    },
    cartIconContainer: {
        position: 'relative',
        padding: 4,
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: theme.colors.textSecondary,
        fontSize: 15,
    },
    shopClosedBanner: {
        backgroundColor: theme.colors.error,
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 20, // Align text with content
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    shopClosedText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default HomeScreen;

