import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Image,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { API_BASE_URL, ENDPOINTS } from '../../constants/config';
import { databases, DATABASE_ID, COLLECTIONS } from '../../services/appwrite';
import { Query } from 'react-native-appwrite';
import { useWebSocket } from '../../context/WebSocketContext';
import BrandingHeader from '../../components/common/BrandingHeader';
import { useNotification } from '../../context/NotificationContext';
import Card from '../../components/common/Card';
import GlowButton from '../../components/common/GlowButton';


const PaymentScreen = ({ navigation, route }) => {
    const { orderData, totalAmount } = route.params;
    const { user } = useAuth();
    const { clearCart } = useCart();
    const { lastEvent, isSafeState, connectionStatus } = useWebSocket();
    const { showNotification } = useNotification();


    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [paymentMode, setPaymentMode] = useState('manual');
    const [upiId, setUpiId] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [screenshot, setScreenshot] = useState(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockReason, setBlockReason] = useState('');

    const [qrImageUrl, setQrImageUrl] = useState(null); // Added state
    const [createdOrderId, setCreatedOrderId] = useState(null);

    useEffect(() => {
        const initializePayment = async () => {
            await checkPaymentMode();
            await createOrderUpfront();
        };
        initializePayment();
    }, []);

    const createOrderUpfront = async () => {
        if (createdOrderId) return;

        try {
            const backendItems = JSON.parse(orderData.items).map(i => ({
                name: i.name,
                qty: i.qty,
                price: i.price
            }));

            const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ORDERS.CREATE}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.$id,
                    items: backendItems,
                    amount: totalAmount
                })
            });

            const result = await response.json();
            if (response.ok) {
                const newOrderId = result.order?.$id || result.orderId;
                setCreatedOrderId(newOrderId);
                console.log('Order created upfront:', newOrderId);
            }
        } catch (error) {
            console.error('Error creating order upfront:', error);
        }
    };

    // REAL-TIME GUARD LOGIC
    useEffect(() => {
        if (!lastEvent) return;

        const eventType = lastEvent.event || lastEvent.type;

        if (eventType === 'SHOP_STATUS_CHANGE' && lastEvent.value === 'closed') {
            setIsBlocked(true);
            setBlockReason('The shop is currently not accepting orders.');
        }

        if (eventType === 'SECTION_STATUS_CHANGE' && lastEvent.value === 'closed') {
            // Check if any item in the current order belongs to this section
            const cartItems = JSON.parse(orderData.items);
            const affectedItems = cartItems.filter(item => item.category === lastEvent.sectionId || item.category === lastEvent.key);

            if (affectedItems.length > 0) {
                setIsBlocked(true);
                setBlockReason(`The section "${lastEvent.sectionId || lastEvent.key}" has just closed.`);
            }
        }
    }, [lastEvent]);


    const checkPaymentMode = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PAYMENTS.MODE}`);
            const data = await response.json();

            if (data.success) {
                setPaymentMode(data.mode);
                if (data.upi_id) {
                    setUpiId(data.upi_id);
                }
                if (data.qr_image_url) {
                    setQrImageUrl(data.qr_image_url);
                }
            } else {
                setPaymentMode('manual');
            }
        } catch (error) {
            console.log('Error checking payment mode:', error);
            setPaymentMode('manual');
        } finally {
            setLoading(false);
        }
    };

    const getUpiUrl = () => {
        if (!upiId) return null;
        return `upi://pay?pa=${upiId.trim()}&pn=CampusEats&am=${parseFloat(totalAmount).toFixed(2)}&cu=INR`;
    };

    const openUPIApp = () => {
        const upiUrl = getUpiUrl();
        if (!upiUrl) {
            showNotification('Loading payment info...', 'info');
            return;
        }

        console.log('Opening UPI URL:', upiUrl);

        Linking.openURL(upiUrl).catch(err => {
            showNotification('Could not open UPI app', 'error');
        });
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setScreenshot(result.assets[0]);
        }
    };

    const takePhoto = async () => {
        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setScreenshot(result.assets[0]);
        }
    };

    const handleSubmitPayment = async () => {
        // ========== CRITICAL: SESSION VALIDATION ==========
        // This handles the edge case where admin closes session while user is checking out
        try {
            const cartItems = JSON.parse(orderData.items);
            const itemIds = cartItems.map(item => item.id);

            // Fetch FRESH data from database - don't trust cached data
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.MENU_ITEMS,
                [Query.equal('$id', itemIds)]
            );

            // Check if ANY item has sectionClosed = true
            const closedItems = response.documents.filter(item => item.sectionClosed);

            if (closedItems.length > 0) {
                const closedSections = [...new Set(closedItems.map(item => item.category))].join(', ');
                showNotification(`Section Closed: ${closedSections}`, 'error');
                setTimeout(() => navigation.goBack(), 1500);
                return; // STOP PAYMENT
            }
        } catch (error) {
            console.error('Session validation error:', error);
            showNotification('Session Sync Error', 'error');
            return; // STOP PAYMENT on validation error
        }
        // ========== END SESSION VALIDATION ==========

        if (paymentMode === 'manual') {
            if (!screenshot) {
                showNotification('Upload Proof Required', 'error');
                return;
            }
            if (!transactionId.trim()) {
                showNotification('Enter Transaction ID', 'error');
                return;
            }
        }

        setSubmitting(true);
        try {
            let orderIdToUse = createdOrderId;

            // Fallback: If for some reason order wasn't created upfront, create it now
            if (!orderIdToUse) {
                console.log('OrderId missing, creating order now...');
                const backendItems = JSON.parse(orderData.items).map(i => ({
                    name: i.name,
                    qty: i.qty,
                    price: i.price
                }));

                const createOrderResponse = await fetch(`${API_BASE_URL}${ENDPOINTS.ORDERS.CREATE}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.$id,
                        items: backendItems,
                        amount: totalAmount
                    })
                });

                const orderResult = await createOrderResponse.json();
                if (!createOrderResponse.ok) {
                    throw new Error(orderResult.detail || 'Failed to create order');
                }
                orderIdToUse = orderResult.order?.$id || orderResult.orderId;
            }

            let newOrderStatus = 'pending';

            if (paymentMode === 'manual' && screenshot) {
                const formData = new FormData();
                const filename = screenshot.uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                if (Platform.OS === 'web') {
                    const res = await fetch(screenshot.uri);
                    const blob = await res.blob();
                    formData.append('file', blob, filename);
                } else {
                    formData.append('file', {
                        uri: screenshot.uri,
                        name: filename,
                        type: type,
                    });
                }
                formData.append('orderId', orderIdToUse);
                formData.append('transactionId', transactionId);

                const proofResponse = await fetch(`${API_BASE_URL}${ENDPOINTS.PAYMENTS.VERIFY_MANUAL}`, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' },
                });

                const proofData = await proofResponse.json();
                if (!proofResponse.ok) {
                    throw new Error(proofData.detail || 'Failed to submit payment proof');
                }

                if (proofData.order?.status) {
                    newOrderStatus = proofData.order.status;
                }
            }

            await clearCart();

            navigation.navigate('PaymentProof', {
                orderId: orderIdToUse,
                totalAmount: totalAmount,
                orderStatus: newOrderStatus
            });
        } catch (error) {
            console.error('Submit Payment Error:', error);
            showNotification(error.message || 'Payment submission failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading payment options...</Text>
            </View>
        );
    }

    if (paymentMode === 'gateway') {
        return (
            <View style={styles.container}>
                <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                    <BrandingHeader showBack={true} onBackPress={() => navigation.goBack()} title="Payment" />
                </SafeAreaView>
                <View style={[styles.content, styles.centeredContent]}>
                    <Ionicons name="card-outline" size={80} color={theme.colors.primary} />
                    <Text style={styles.title}>Payment Gateway</Text>
                    <Text style={styles.subtitle}>
                        Payment gateway integration coming soon.
                        Please use manual UPI payment for now.
                    </Text>
                    <GlowButton
                        title="Use Manual Payment"
                        onPress={() => setPaymentMode('manual')}
                        style={styles.gatewayButton}
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader showBack={true} onBackPress={() => navigation.goBack()} title="Payment" />
            </SafeAreaView>

            {/* CONNECTION & SAFE STATE WARNING */}
            {!isBlocked && (isSafeState || connectionStatus === 'disconnected') && (
                <View style={styles.warningBanner}>
                    <Ionicons name="wifi-outline" size={16} color="white" />
                    <Text style={styles.warningBannerText}>
                        Connection lost. Relying on "Safe State". Please verify shop status before paying.
                    </Text>
                </View>
            )}

            {/* BLOCK OVERLAY */}
            {isBlocked && (
                <View style={styles.blockOverlay}>
                    <Card style={styles.blockCard}>
                        <Ionicons name="lock-closed" size={60} color={theme.colors.error} />
                        <Text style={styles.blockTitle}>Action Required</Text>
                        <Text style={styles.blockMessage}>{blockReason}</Text>
                        <GlowButton
                            title="Go Back to Cart"
                            onPress={() => navigation.goBack()}
                            variant="secondary"
                            style={{ width: '100%', marginTop: 20 }}
                        />
                    </Card>
                </View>
            )}


            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Card style={styles.amountCard} variant="glow">
                    <Text style={styles.amountLabel}>Amount to Pay</Text>
                    <Text style={styles.amountValue}>₹{totalAmount}</Text>
                </Card>

                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Pay via UPI</Text>

                    {upiId ? (
                        <View style={styles.qrContainer}>
                            <Text style={styles.scanLabel}>Scan with any UPI App</Text>
                            <View style={styles.qrWrapper}>
                                {qrImageUrl ? (
                                    <View>
                                        <Image
                                            source={{ uri: qrImageUrl }}
                                            style={{ width: 250, height: 250, borderRadius: 8 }}
                                            resizeMode="contain"
                                        />
                                        <Text style={[styles.scanLabel, { marginBottom: 0, marginTop: 15, fontSize: 13 }]}>
                                            Shop QR Code
                                        </Text>
                                    </View>
                                ) : upiId ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Ionicons name="qr-code-outline" size={80} color={theme.colors.textSecondary} />
                                        <Text style={[styles.scanLabel, { textAlign: 'center', marginTop: 10 }]}>
                                            Admin QR Image not uploaded.
                                            Please use the "Open UPI App" button below or copy the UPI ID.
                                        </Text>
                                    </View>
                                ) : (
                                    <ActivityIndicator size="small" color={theme.colors.primary} />
                                )}
                            </View>

                            <View style={styles.upiIdContainer}>
                                <Text style={styles.upiIdLabel}>UPI ID:</Text>
                                <Text style={styles.upiIdValue} selectable>{upiId}</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        showNotification('UPI ID copied!', 'success');
                                    }}
                                >
                                    <Ionicons name="copy-outline" size={20} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </View>

                            <GlowButton
                                title="Open UPI App"
                                onPress={openUPIApp}
                                style={styles.upiButton}
                                variant="secondary"
                                textStyle={{ color: theme.colors.primary }}
                            />
                        </View>
                    ) : (
                        <Text style={styles.warningText}>
                            UPI ID not configured. Please contact admin.
                        </Text>
                    )}
                </Card>

                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Transaction Details</Text>
                    <Text style={styles.inputLabel}>Transaction ID / UTR Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter transaction ID"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={transactionId}
                        onChangeText={setTransactionId}
                        autoCapitalize="characters"
                    />
                </Card>

                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Proof</Text>
                    <Text style={styles.inputLabel}>Upload Payment Screenshot</Text>

                    {screenshot ? (
                        <View style={styles.screenshotContainer}>
                            <Image
                                source={{ uri: screenshot.uri }}
                                style={styles.screenshotPreview}
                                resizeMode="contain"
                            />
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => setScreenshot(null)}
                            >
                                <Ionicons name="close-circle" size={32} color={theme.colors.error} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.uploadButtons}>
                            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                                <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
                                <Text style={styles.uploadButtonText}>Gallery</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                                <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
                                <Text style={styles.uploadButtonText}>Camera</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Card>

                <GlowButton
                    title={isBlocked ? "Section Closed" : "Submit for Verification"}
                    onPress={handleSubmitPayment}
                    loading={submitting}
                    disabled={isBlocked}
                    style={styles.submitButton}
                    variant="primary"
                />


                <Text style={styles.noteText}>
                    Your order will be confirmed once payment is verified by admin.
                    You will receive an OTP to collect your order.
                </Text>
            </ScrollView>
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
    loadingText: {
        marginTop: 10,
        color: theme.colors.textSecondary,
    },
    content: {
        flex: 1,
    },
    centeredContent: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    scrollContent: {
        padding: theme.spacing.m,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    amountCard: {
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.primary,
    },
    amountLabel: {
        color: theme.colors.textSecondary,
        fontSize: 16,
    },
    amountValue: {
        color: theme.colors.primary,
        fontSize: 36,
        fontWeight: 'bold',
        marginTop: 5,
    },
    section: {
        marginBottom: theme.spacing.m,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 15,
    },
    upiIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        padding: 12,
        borderRadius: 8,
        gap: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    upiIdLabel: {
        color: theme.colors.textSecondary,
    },
    upiIdValue: {
        flex: 1,
        fontWeight: 'bold',
        color: theme.colors.text,
        fontSize: 16,
    },
    upiButton: {
        marginTop: 15,
        width: '100%',
    },
    qrContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    qrWrapper: {
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 20,
        elevation: 4,
        ...Platform.select({
            web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            }
        }),
    },
    scanLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 15,
        fontWeight: '500',
    },
    warningText: {
        color: theme.colors.error,
        fontStyle: 'italic',
    },
    inputLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: theme.colors.inputBg,
        color: theme.colors.text,
    },
    uploadButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    uploadButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderStyle: 'dashed',
        borderRadius: 8,
        padding: 20,
        gap: 8,
        backgroundColor: theme.colors.surfaceLight,
    },
    uploadButtonText: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    screenshotContainer: {
        position: 'relative',
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 8,
        padding: 4,
    },
    screenshotPreview: {
        width: '100%',
        height: 200,
        borderRadius: 4,
    },
    removeButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
    },
    submitButton: {
        marginTop: 10,
    },
    gatewayButton: {
        marginTop: 20,
    },
    noteText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        fontSize: 13,
        marginTop: 15,
        marginBottom: 30,
        lineHeight: 20,
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
    blockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 999,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    blockCard: {
        width: '100%',
        alignItems: 'center',
        padding: 30,
    },
    blockTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 15,
        marginBottom: 10,
    },
    blockMessage: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default PaymentScreen;

