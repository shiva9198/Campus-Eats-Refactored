import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../constants/theme';
import { orderService } from '../../../services/orderService';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import BrandingHeader from '../../../components/common/BrandingHeader';
import Card from '../../../components/common/Card';
import GlowButton from '../../../components/common/GlowButton';

const AdminCollectionScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState(null);
    const [verifying, setVerifying] = useState(false);

    const searchOrder = async () => {
        if (otp.length !== 6) {
            Alert.alert("Invalid Code", "Please enter a 6-digit OTP.");
            return;
        }

        setLoading(true);
        setOrder(null);
        try {
            const foundOrder = await orderService.searchOrderByOtp(otp);

            if (!foundOrder) {
                Alert.alert("Not Found", "No active order found with this OTP.");
            } else {
                setOrder(foundOrder);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to search for order: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteCollection = async () => {
        if (!order) return;

        console.log('Starting collection for order:', order.$id);
        setVerifying(true);
        try {
            await orderService.markAsCollected(order.$id);

            console.log('Order updated successfully');

            Alert.alert("Success", "Order marked as collected!", [
                {
                    text: "OK",
                    onPress: () => {
                        setOrder(null);
                        setOtp('');
                    }
                }
            ]);
        } catch (error) {
            console.error('Collection error:', error);
            Alert.alert("Error", "Failed to update order: " + error.message);
        } finally {
            setVerifying(false);
        }
    };

    const OrderDetails = () => {
        if (!order) return null;

        const items = JSON.parse(order.items || '[]');

        return (
            <View style={styles.detailsContainer}>
                <Card style={styles.detailsCard}>
                    <View style={styles.successHeader}>
                        <View style={styles.successIconContainer}>
                            <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
                        </View>
                        <Text style={styles.successTitle}>Order Found!</Text>
                        <Text style={styles.successSubtitle}>Ready for collection</Text>
                    </View>

                    <View style={styles.orderInfoSection}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoLabelContainer}>
                                <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
                                <Text style={styles.infoLabel}>Order ID</Text>
                            </View>
                            <Text style={styles.infoValue}>#{order.$id.substring(0, 8).toUpperCase()}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <View style={styles.infoLabelContainer}>
                                <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                                <Text style={styles.infoLabel}>Student ID</Text>
                            </View>
                            <Text style={styles.infoValue}>{order.userId.substring(0, 12)}...</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <View style={styles.infoLabelContainer}>
                                <Ionicons name="cash-outline" size={20} color={theme.colors.primary} />
                                <Text style={styles.infoLabel}>Amount</Text>
                            </View>
                            <Text style={[styles.infoValue, styles.amountText]}>₹{order.amount}</Text>
                        </View>
                    </View>

                    <View style={styles.itemsSection}>
                        <View style={styles.itemsHeader}>
                            <Ionicons name="fast-food-outline" size={24} color={theme.colors.primary} />
                            <Text style={styles.itemsTitle}>Items to Collect</Text>
                        </View>
                        {items.map((item, index) => (
                            <View key={index} style={styles.itemRow}>
                                <View style={styles.itemQtyBadge}>
                                    <Text style={styles.itemQty}>{item.qty}x</Text>
                                </View>
                                <Text style={styles.itemName}>{item.name}</Text>
                            </View>
                        ))}
                    </View>
                </Card>

                <View style={styles.actionButtons}>
                    <GlowButton
                        title="✓ Complete Collection"
                        onPress={handleCompleteCollection}
                        loading={verifying}
                        style={styles.collectButton}
                    />

                    <GlowButton
                        title="Cancel & Search Again"
                        onPress={() => setOrder(null)}
                        style={styles.cancelButton}
                        variant="outline"
                    />
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader
                    showMenu={true}
                    title="Collection Center"
                />
            </SafeAreaView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {!order ? (
                        <View style={styles.searchContainer}>
                            <Card style={styles.searchCard}>
                                <View style={styles.searchHeader}>
                                    <View style={styles.searchIconContainer}>
                                        <Ionicons name="search" size={40} color={theme.colors.primary} />
                                    </View>
                                    <Text style={styles.searchTitle}>Enter Collection OTP</Text>
                                    <Text style={styles.searchSubtitle}>
                                        Student will provide a 6-digit verification code
                                    </Text>
                                </View>

                                <View style={styles.inputSection}>
                                    <Text style={styles.inputLabel}>OTP Code</Text>
                                    <TextInput
                                        style={styles.otpInput}
                                        value={otp}
                                        onChangeText={setOtp}
                                        placeholder="••••••"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        textAlign="center"
                                        autoFocus={true}
                                    />

                                    <GlowButton
                                        title={loading ? "Searching..." : "Search Order"}
                                        onPress={searchOrder}
                                        loading={loading}
                                        disabled={otp.length !== 6}
                                        style={styles.searchButton}
                                    />
                                </View>

                                <View style={styles.helpSection}>
                                    <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
                                    <Text style={styles.helpText}>
                                        Ask the student to show their order OTP from the app
                                    </Text>
                                </View>
                            </Card>
                        </View>
                    ) : (
                        <OrderDetails />
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    searchContainer: {
        flex: 1,
    },
    searchCard: {
        marginBottom: 20,
    },
    searchHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    searchIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    searchTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    searchSubtitle: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    inputSection: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 12,
    },
    otpInput: {
        height: 70,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderRadius: 16,
        paddingHorizontal: 20,
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text,
        backgroundColor: theme.colors.surface,
        letterSpacing: 12,
        marginBottom: 20,
    },
    searchButton: {
        height: 56,
    },
    helpSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    helpText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    detailsContainer: {
        flex: 1,
    },
    detailsCard: {
        marginBottom: 20,
    },
    successHeader: {
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        marginBottom: 20,
    },
    successIconContainer: {
        marginBottom: 12,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.success,
        marginBottom: 4,
    },
    successSubtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    orderInfoSection: {
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    infoLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    amountText: {
        fontSize: 20,
        color: theme.colors.primary,
    },
    itemsSection: {
        paddingTop: 20,
    },
    itemsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    itemsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    itemQtyBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 12,
    },
    itemQty: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    itemName: {
        fontSize: 16,
        color: theme.colors.text,
        flex: 1,
        fontWeight: '500',
    },
    actionButtons: {
        gap: 12,
    },
    collectButton: {
        height: 56,
        backgroundColor: theme.colors.success,
    },
    cancelButton: {
        height: 56,
        borderColor: theme.colors.error,
        borderWidth: 2,
    },
});

export default AdminCollectionScreen;