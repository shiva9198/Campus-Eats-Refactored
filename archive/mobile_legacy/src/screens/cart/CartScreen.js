import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import BrandingHeader from '../../components/common/BrandingHeader';
import { useNotification } from '../../context/NotificationContext';
import Card from '../../components/common/Card';
import GlowButton from '../../components/common/GlowButton';


const CartScreen = ({ navigation }) => {
    const { cartItems, removeFromCart, updateQuantity, totalAmount } = useCart();
    const { lastEvent, isSafeState, connectionStatus } = useWebSocket();
    const { showNotification } = useNotification();

    const isShopClosed = (lastEvent?.event || lastEvent?.type) === 'SHOP_STATUS_CHANGE' && lastEvent?.value === 'closed';


    const handleCheckout = () => {
        if (cartItems.length === 0) {
            showNotification('Your cart is empty', 'info');
            return;
        }

        if (isShopClosed) {
            showNotification('Shop is closed!', 'error');
            return;
        }

        // Navigate to payment screen with order data
        const orderData = {
            items: JSON.stringify(cartItems.map(item => ({
                name: item.name,
                price: item.price,
                qty: item.qty,
                id: item._id
            }))),
        };

        navigation.navigate('Payment', {
            orderData,
            totalAmount
        });
    };

    const renderItem = ({ item }) => (
        <Card style={styles.cartItem}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>

            <View style={styles.quantityContainer}>
                <TouchableOpacity
                    onPress={() => updateQuantity(item._id, -1)}
                    style={styles.qtyButton}
                >
                    <Ionicons name="remove" size={20} color={theme.colors.primary} />
                </TouchableOpacity>

                <Text style={styles.qtyText}>{item.qty}</Text>

                <TouchableOpacity
                    onPress={() => updateQuantity(item._id, 1)}
                    style={styles.qtyButton}
                >
                    <Ionicons name="add" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                onPress={() => removeFromCart(item._id)}
                style={styles.removeButton}
            >
                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            </TouchableOpacity>
        </Card>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader
                    showBack={true}
                    onBackPress={() => navigation.goBack()}
                    title="Your Cart"
                />
            </SafeAreaView>

            {/* SHOP CLOSED WARNING */}
            {isShopClosed && (
                <View style={styles.shopClosedBanner}>
                    <Ionicons name="lock-closed" size={16} color="white" />
                    <Text style={styles.shopClosedText}>Shop is currently closed. Order placement is disabled.</Text>
                </View>
            )}

            {/* CONNECTION & SAFE STATE WARNING */}
            {!isShopClosed && (isSafeState || connectionStatus === 'disconnected') && (
                <View style={styles.warningBanner}>
                    <Ionicons name="wifi-outline" size={16} color="white" />
                    <Text style={styles.warningBannerText}>
                        Connection lost. Proceed with caution.
                    </Text>
                </View>
            )}


            {cartItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={80} color={theme.colors.textSecondary} />
                    <Text style={styles.emptyText}>Your cart is empty</Text>
                    <GlowButton
                        title="Explore Menu"
                        onPress={() => navigation.navigate('Main', { screen: 'Home' })}
                        style={styles.exploreButton}
                    />
                </View>
            ) : (
                <>
                    <FlatList
                        data={cartItems}
                        renderItem={renderItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.listContent}
                    />

                    <View style={styles.footer}>
                        <View style={styles.totalContainer}>
                            <Text style={styles.totalLabel}>Total Amount:</Text>
                            <Text style={styles.totalValue}>₹{totalAmount}</Text>
                        </View>

                        <GlowButton
                            title={isShopClosed ? "Shop Closed" : "Place Order"}
                            onPress={handleCheckout}
                            disabled={isShopClosed}
                            style={styles.checkoutButton}
                        />

                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    listContent: {
        paddingHorizontal: 20, // Consistent 20px outer margin
        paddingTop: theme.spacing.m,
        paddingBottom: 100,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
        paddingVertical: 12,
        backgroundColor: theme.colors.surface,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    itemPrice: {
        fontSize: 14,
        color: theme.colors.secondary,
        marginTop: 4,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 8,
        marginRight: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    qtyButton: {
        padding: 8,
    },
    qtyText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginHorizontal: 8,
        color: theme.colors.text,
    },
    removeButton: {
        padding: 8,
    },
    footer: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        ...theme.shadows.large,
        paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing.m,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.m,
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    checkoutButton: {
        width: '100%',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: theme.colors.textSecondary,
        marginVertical: 16
    },
    exploreButton: {
        marginTop: 16,
    },
    shopClosedBanner: {
        backgroundColor: theme.colors.error,
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    shopClosedText: {
        color: 'white',
        fontSize: 13,
        fontWeight: 'bold',
    },
    warningBanner: {
        backgroundColor: theme.colors.warning,
        flexDirection: 'row',
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    warningBannerText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default CartScreen;

