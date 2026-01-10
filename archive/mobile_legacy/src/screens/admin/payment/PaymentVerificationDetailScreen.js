import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { orderService } from '../../../services/orderService';
import { storage, BUCKET_ID } from '../../../services/appwrite';
import dayjs from 'dayjs';
import { useAuth } from '../../../context/AuthContext';
import BrandingHeader from '../../../components/common/BrandingHeader';
import Card from '../../../components/common/Card';
import GlowButton from '../../../components/common/GlowButton';

const PaymentVerificationDetailScreen = ({ route, navigation }) => {
    const { user } = useAuth();
    const { order } = route.params;
    const [loading, setLoading] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [verifyModalVisible, setVerifyModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [imageLoadError, setImageLoadError] = useState(false);

    // Construct Image Source - handle multiple storage methods
    let imageSource = null;

    // Check for Cloudinary URL (backend saves as payment_screenshot_url)
    if (order.payment_screenshot_url) {
        imageSource = { uri: order.payment_screenshot_url };
    } else if (order.screenshotUrl) {
        // Legacy field name
        imageSource = { uri: order.screenshotUrl };
    } else if (order.paymentScreenshot) {
        // Appwrite storage file ID - construct the URL manually
        const appwriteEndpoint = 'https://sgp.cloud.appwrite.io/v1';
        const projectId = '6953efa40036d5e409af';
        imageSource = {
            uri: `${appwriteEndpoint}/storage/buckets/${BUCKET_ID}/files/${order.paymentScreenshot}/view?project=${projectId}`
        };
    }

    const hasScreenshot = !!imageSource && !imageLoadError;

    // Debug image source
    console.log('Order data:', {
        orderId: order.$id,
        payment_screenshot_url: order.payment_screenshot_url,
        screenshotUrl: order.screenshotUrl,
        paymentScreenshot: order.paymentScreenshot,
        imageSource: imageSource,
        hasScreenshot: hasScreenshot
    });

    const handleVerify = async () => {
        if (loading) return; // Prevent multiple calls

        setVerifyModalVisible(true);
    };

    const confirmVerification = async () => {
        setVerifyModalVisible(false);
        setLoading(true);
        try {
            console.log('Verifying payment for order:', order.$id);

            const result = await orderService.verifyPayment(order.$id, user?.email || user?.name || 'Admin');

            console.log('Verification successful:', result);

            // Filter out this order from the parent list
            const parentRoute = navigation.getState()?.routes[navigation.getState()?.index - 1];
            if (parentRoute?.name === 'PaymentVerificationList') {
                // Navigate back and filter out the verified order
                navigation.navigate('PaymentVerificationList', {
                    removeOrderId: order.$id,
                    refresh: Date.now()
                });
            } else {
                navigation.goBack();
            }

            Alert.alert("Success", `Payment Verified!\\n\\nOTP for Collection: ${generatedOtp}\\n\\nOrder moved to Kitchen.`);
        } catch (error) {
            console.error('Verification detailed error:', error);
            Alert.alert("Verification Failed", `Error: ${error.message || 'Unknown error'}\\nPlease check console logs.`);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            Alert.alert("Error", "Please provide a reason for rejection");
            return;
        }

        setLoading(true);
        try {
            console.log('Rejecting payment for order:', order.$id);

            const result = await orderService.rejectPayment(
                order.$id,
                user?.email || user?.name || 'Admin',
                rejectReason
            );

            console.log('Rejection successful:', result);

            setRejectModalVisible(false);
            setRejectReason(''); // Clear reason

            // Filter out this order from the parent list
            const parentRoute = navigation.getState()?.routes[navigation.getState()?.index - 1];
            if (parentRoute?.name === 'PaymentVerificationList') {
                // Navigate back and filter out the rejected order
                navigation.navigate('PaymentVerificationList', {
                    removeOrderId: order.$id,
                    refresh: Date.now()
                });
            } else {
                navigation.goBack();
            }

            Alert.alert("Rejected", "Payment has been rejected.");
        } catch (error) {
            console.error("Rejection Update Error:", error);
            Alert.alert("Error", `Rejection failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader showBack={true} onBackPress={() => navigation.goBack()} title="Verify Payment" />
            </SafeAreaView>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.content}
            >

                {/* Image Section */}
                <View style={styles.imageContainer}>
                    {hasScreenshot && imageSource && !imageLoadError ? (
                        <Image
                            source={{
                                uri: imageSource.uri,
                                cache: 'reload' // Force fresh load
                            }}
                            style={styles.screenshot}
                            resizeMode="contain"
                            onError={(error) => {
                                console.log('Image load error:', error.nativeEvent?.error || error);
                                console.log('Failed to load image:', imageSource.uri);
                                setImageLoadError(true);
                            }}
                            onLoad={() => {
                                console.log('Image loaded successfully:', imageSource.uri);
                                setImageLoadError(false);
                            }}
                        />
                    ) : (
                        <View style={styles.noImage}>
                            <Ionicons name="image-outline" size={48} color={theme.colors.textSecondary} />
                            <Text style={styles.noImageText}>
                                {imageLoadError ? 'Failed to Load Screenshot' : 'No Screenshot Attached'}
                            </Text>
                            {(order.screenshotUrl || order.paymentScreenshot) && (
                                <>
                                    <Text style={styles.debugText}>
                                        Screenshot URL: {order.screenshotUrl || 'Using Appwrite Storage'}
                                    </Text>
                                    {imageLoadError && (
                                        <TouchableOpacity
                                            style={styles.retryButton}
                                            onPress={() => setImageLoadError(false)}
                                        >
                                            <Text style={styles.retryText}>Retry Loading</Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                        </View>
                    )}
                </View>

                {/* Details Section */}
                <Card style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Transaction Details</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Order ID:</Text>
                        <Text style={styles.value}>#{order.$id}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Customer:</Text>
                        <Text style={styles.value}>{order.studentName || 'N/A'}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Total Amount:</Text>
                        <Text style={styles.value}>₹{order.total}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Submission Date:</Text>
                        <Text style={styles.value}>
                            {order.createdAt ? dayjs.unix(order.createdAt).format('DD/MM/YYYY hh:mm A') : 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Payment Method:</Text>
                        <Text style={styles.value}>UPI/Bank Transfer</Text>
                    </View>
                </Card>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    <Text style={styles.actionsTitle}>Verify Payment Proof</Text>
                    <Text style={styles.actionsSubtitle}>
                        Review the screenshot above and verify or reject this payment.
                    </Text>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => setRejectModalVisible(true)}
                    disabled={loading}
                >
                    <Text style={[styles.buttonText, styles.rejectText]}>Reject</Text>
                </TouchableOpacity>

                <View style={{ flex: 1, marginLeft: 10 }}>
                    <GlowButton
                        title="Verify Payment"
                        onPress={handleVerify}
                        loading={loading}
                        variant="primary"
                    />
                </View>
            </View>

            {/* Reject Modal */}
            <Modal
                visible={rejectModalVisible}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <Card style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reject Payment</Text>
                        <Text style={styles.modalSubtitle}>Please provide a reason for the student.</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Image unclear, Amount mismatch..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            multiline
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setRejectModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleReject}
                            >
                                <Text style={styles.confirmButtonText}>Confirm Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                </View>
            </Modal>

            {/* Verify Modal */}
            <Modal
                visible={verifyModalVisible}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <Card style={styles.modalContent}>
                        <Text style={styles.modalTitle}>🔥 VERIFY PAYMENT</Text>
                        <Text style={styles.modalSubtitle}>
                            Are you sure this payment has been received and verified?{'\\n\\n'}
                            This will:{'\n'}
                            • Mark payment as verified{'\n'}
                            • Generate collection OTP{'\n'}
                            • Send order to kitchen
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setVerifyModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.verifyButton]}
                                onPress={confirmVerification}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <Text style={styles.verifyButtonText}>✅ CONFIRM & VERIFY</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Card>
                </View>
            </Modal>
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
    imageContainer: {
        height: 400,
        backgroundColor: '#000',
        borderRadius: theme.borderRadius.l,
        marginBottom: theme.spacing.m,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    screenshot: {
        width: '100%',
        height: '100%',
    },
    noImage: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    noImageText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.s,
    },
    debugText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.s,
        fontSize: 11,
    },
    retryButton: {
        marginTop: theme.spacing.s,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.s,
    },
    retryText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    detailsCard: {
        marginBottom: theme.spacing.m,
    },
    sectionTitle: {
        ...theme.typography.header,
        fontSize: 18,
        marginBottom: theme.spacing.m,
        color: theme.colors.text,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border + '20',
    },
    label: {
        ...theme.typography.body,
        fontWeight: '600',
        color: theme.colors.text,
    },
    value: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'right',
        flex: 1,
        marginLeft: theme.spacing.s,
    },
    actionsContainer: {
        marginBottom: theme.spacing.l,
    },
    actionsTitle: {
        ...theme.typography.header,
        fontSize: 16,
        marginBottom: theme.spacing.s,
        color: theme.colors.text,
    },
    actionsSubtitle: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    buttonContainer: {
        flexDirection: 'row',
        padding: theme.spacing.m,
        paddingBottom: theme.spacing.xl,
        gap: theme.spacing.s,
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: theme.spacing.l,
        borderRadius: theme.borderRadius.l,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    rejectButton: {
        backgroundColor: theme.colors.surfaceLight,
        borderWidth: 1,
        borderColor: theme.colors.error,
        flex: 1,
    },
    buttonText: {
        ...theme.typography.button,
        fontWeight: '600',
    },
    rejectText: {
        color: theme.colors.error,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.m,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        padding: theme.spacing.l,
    },
    modalTitle: {
        ...theme.typography.header,
        fontSize: 20,
        marginBottom: 8,
        color: theme.colors.text
    },
    modalSubtitle: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.m,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
        fontSize: 16,
        color: theme.colors.text,
        backgroundColor: theme.colors.inputBg,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: theme.borderRadius.s,
    },
    cancelButton: {
        backgroundColor: theme.colors.surfaceLight,
    },
    confirmButton: {
        backgroundColor: theme.colors.error,
    },
    verifyButton: {
        backgroundColor: theme.colors.primary,
        flex: 1,
    },
    cancelButtonText: {
        color: theme.colors.text,
        fontWeight: '600',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    verifyButtonText: {
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
    }
});

export default PaymentVerificationDetailScreen;