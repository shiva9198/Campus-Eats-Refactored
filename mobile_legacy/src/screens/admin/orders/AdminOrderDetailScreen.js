import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../constants/theme';
import { databases, DATABASE_ID, COLLECTIONS } from '../../../services/appwrite';
import dayjs from 'dayjs';
import BrandingHeader from '../../../components/common/BrandingHeader';
import Card from '../../../components/common/Card';
import GlowButton from '../../../components/common/GlowButton';

const AdminOrderDetailScreen = ({ route, navigation }) => {
    const { order } = route.params;
    const [loading, setLoading] = useState(false);
    const [otpInput, setOtpInput] = useState('');

    const updateStatus = async (updates, shouldNavigate = true) => {
        setLoading(true);
        try {
            const now = Math.floor(Date.now() / 1000);
            const result = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.ORDERS,
                order.$id,
                {
                    ...updates,
                    updatedAt: now
                }
            );

            if (shouldNavigate) {
                Alert.alert("Success", "Order updated successfully");
                navigation.goBack();
            }

            return result;
        } catch (error) {
            Alert.alert("Error", error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader showBack={true} onBackPress={() => navigation.goBack()} title={`Order #${order.$id.substring(0, 8)}`} />
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Header Info */}
                <View style={styles.header}>
                    <View style={styles.statusContainer}>
                        <View style={[styles.statusBadge, { borderColor: theme.colors.primary }]}>
                            <Text style={styles.status}>{order.status.toUpperCase()}</Text>
                        </View>
                        {order.readyToCollect && (
                            <View style={[styles.statusBadge, { borderColor: theme.colors.success, backgroundColor: theme.colors.success + '20' }]}>
                                <Text style={[styles.status, { color: theme.colors.success }]}>READY TO COLLECT</Text>
                            </View>
                        )}
                    </View>
                    {order.otp && (
                        <View style={styles.otpBadge}>
                            <Text style={styles.otpLabel}>OTP: </Text>
                            <Text style={styles.otpValue}>{order.otp}</Text>
                        </View>
                    )}
                </View>

                {/* Items */}
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    {(() => {
                        try {
                            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                            return items.map((item, index) => (
                                <View key={index} style={styles.itemRow}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemQty}>x{item.qty || item.quantity}</Text>
                                    </View>
                                    <Text style={styles.itemPrice}>₹{(item.price || 0) * (item.qty || item.quantity || 0)}</Text>
                                </View>
                            ));
                        } catch (e) {
                            return <Text style={styles.errorText}>Error loading items</Text>;
                        }
                    })()}
                    <View style={styles.divider} />
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalAmount}>₹{order.amount || order.totalAmount}</Text>
                    </View>
                </Card>

                {/* Actions */}
                <Text style={styles.sectionTitle}>Manage Order</Text>

                {order.status === 'paid' && !order.readyToCollect && (
                    <GlowButton
                        title="Notify: Ready for Pickup"
                        onPress={() => updateStatus({ readyToCollect: true, status: 'preparing' })}
                        loading={loading}
                        variant="secondary"
                    />
                )}

                {(order.status === 'preparing' || (order.status === 'paid' && order.readyToCollect)) && (
                    <Card style={styles.collectionContainer}>
                        <Text style={styles.collectionTitle}>Verify OTP for Collection</Text>
                        <TextInput
                            style={styles.otpInput}
                            placeholder="Enter 6-digit OTP"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={otpInput}
                            onChangeText={setOtpInput}
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                        <GlowButton
                            title="Verify OTP & Complete"
                            onPress={() => {
                                if (order.otp && otpInput !== order.otp) {
                                    Alert.alert("Invalid OTP", "The entered OTP does not match the order records.");
                                    return;
                                }
                                updateStatus({
                                    status: 'collected',
                                    collectedAt: Math.floor(Date.now() / 1000),
                                    qrUsed: true,
                                    otp: null  // Clear OTP after collection
                                }, false).then(() => {
                                    // Navigate back to the list and force a refresh
                                    Alert.alert("Success", "Order Collected Successfully", [
                                        {
                                            text: "OK",
                                            onPress: () => {
                                                setOtpInput('');
                                                navigation.navigate('AdminOrderList', { refresh: Date.now() });
                                            }
                                        }
                                    ]);
                                }).catch((error) => {
                                    console.error('Collection error:', error);
                                    Alert.alert('Error', 'Failed to complete collection');
                                });
                            }}
                            loading={loading}
                            variant="success"
                            style={{ opacity: (otpInput !== order.otp && order.otp) ? 0.5 : 1 }}
                        />
                    </Card>
                )}

                {order.status === 'collected' && (
                    <Card style={styles.successBox}>
                        <Text style={styles.infoText}>This order was collected at:</Text>
                        <Text style={styles.dateText}>{dayjs(order.collectedAt * 1000).format('MMM D, h:mm A')}</Text>
                    </Card>
                )}

                {order.status === 'payment_rejected' && (
                    <Text style={styles.errorText}>Payment Rejected. Waiting for student to resubmit.</Text>
                )}

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.m,
    },
    header: {
        marginBottom: 20,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 5,
        flexWrap: 'wrap'
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.surface,
    },
    status: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    otpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.warning,
        marginTop: 10,
        alignSelf: 'flex-start'
    },
    otpLabel: {
        fontSize: 14,
        color: theme.colors.warning,
        fontWeight: '500',
    },
    otpValue: {
        fontSize: 16,
        color: theme.colors.warning,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: theme.colors.text,
        marginTop: 10,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    itemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    itemName: {
        fontSize: 16,
        color: theme.colors.text,
    },
    itemQty: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    itemPrice: {
        fontSize: 16,
        color: theme.colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 10,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    successBox: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.success,
        borderWidth: 1,
        alignItems: 'center',
        marginTop: 10,
    },
    dateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.success,
        marginTop: 5,
    },
    errorText: {
        color: theme.colors.error,
        textAlign: 'center',
        fontWeight: 'bold',
        marginTop: 10,
    },
    infoText: {
        color: theme.colors.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    collectionContainer: {
        backgroundColor: theme.colors.surface,
        padding: 20,
        marginTop: 10,
    },
    collectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: theme.colors.text,
        textAlign: 'center',
    },
    otpInput: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 20,
        textAlign: 'center',
        letterSpacing: 5,
        fontWeight: 'bold',
        marginBottom: 15,
        backgroundColor: theme.colors.inputBg,
        color: theme.colors.text,
    }
});

export default AdminOrderDetailScreen;
