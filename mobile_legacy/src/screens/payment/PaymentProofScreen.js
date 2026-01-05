import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
    ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL, ENDPOINTS } from '../../constants/config';
import BrandingHeader from '../../components/common/BrandingHeader';
import Card from '../../components/common/Card';
import GlowButton from '../../components/common/GlowButton';

const PaymentProofScreen = ({ route, navigation }) => {
    const { orderId, totalAmount, orderStatus = 'pending' } = route.params || {};
    const [transactionId, setTransactionId] = useState('');
    const [image, setImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Lock screen if payment already submitted
    const isPaymentAlreadySubmitted = orderStatus && orderStatus === 'pending_verification';

    // Redirect to Orders page if payment is already submitted
    React.useEffect(() => {
        if (isPaymentAlreadySubmitted) {
            navigation.replace('Orders');
        }
    }, [isPaymentAlreadySubmitted, navigation]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const uploadProof = async () => {
        if (!transactionId || !image) {
            Alert.alert('Missing Information', 'Please provide both Transaction ID and a Screenshot.');
            return;
        }

        if (isSubmitting) return; // Prevent multiple submissions

        setIsSubmitting(true);
        try {
            console.log('Starting proof upload...');
            const formData = new FormData();
            const filename = image.uri.split('/').pop() || 'payment.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('file', {
                uri: image.uri,
                name: filename,
                type: type,
            });
            formData.append('orderId', orderId);
            formData.append('transactionId', transactionId);

            console.log('Submitting to backend...');

            const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PAYMENTS.VERIFY_MANUAL}`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            console.log('Backend response:', data);

            if (response.ok) {
                // SUCCESS: Navigate directly to Orders page
                navigation.navigate('Orders');
            } else {
                Alert.alert('Submission Failed', data.detail || 'Could not verify payment.');
            }

        } catch (error) {
            console.error('Upload Error:', error);
            Alert.alert('Upload Failed', 'Could not connect to server. ' + error.message);
        } finally {
            setIsSubmitting(false);
        }

    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader showBack={true} onBackPress={() => navigation.goBack()} title="Upload Payment Proof" />
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Enhanced Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.orderBadge}>
                        <Text style={styles.orderLabel}>Order</Text>
                        <Text style={styles.orderId}>#{orderId.substring(0, 8)}</Text>
                    </View>
                    <View style={styles.amountContainer}>
                        <Text style={styles.amountLabel}>Total Amount</Text>
                        <Text style={styles.amount}>₹{totalAmount}</Text>
                    </View>
                </View>

                {/* Payment Steps */}
                <Card style={[styles.card, styles.stepsCard]}>
                    <Text style={styles.cardTitle}>💳 Payment Instructions</Text>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Scan QR & Pay</Text>
                            <Text style={styles.stepDescription}>Use any UPI app to pay ₹{totalAmount} to canteen admin</Text>
                        </View>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Enter Transaction ID</Text>
                            <TextInput
                                style={styles.enhancedInput}
                                placeholder="UPI Reference Number (12-digit)"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={transactionId}
                                onChangeText={setTransactionId}
                                autoCapitalize="characters"
                            />
                        </View>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Upload Screenshot</Text>
                            <TouchableOpacity style={styles.enhancedUploadBox} onPress={pickImage}>
                                {image ? (
                                    <View style={styles.imageContainer}>
                                        <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" />
                                        <View style={styles.imageOverlay}>
                                            <Ionicons name="checkmark-circle" size={30} color={theme.colors.success} />
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.enhancedPlaceholder}>
                                        <View style={styles.uploadIconContainer}>
                                            <Ionicons name="camera-outline" size={40} color={theme.colors.primary} />
                                        </View>
                                        <Text style={styles.uploadTitle}>Tap to add screenshot</Text>
                                        <Text style={styles.uploadSubtitle}>Clear image of payment confirmation</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Card>

                {isPaymentAlreadySubmitted ? (
                    <Card style={styles.lockCard}>
                        <View style={styles.lockIconContainer}>
                            <Ionicons name="shield-checkmark" size={50} color={theme.colors.success} />
                        </View>
                        <Text style={styles.lockTitle}>Payment Submitted Successfully!</Text>
                        <Text style={styles.lockDescription}>Your payment proof is under review. You'll be notified once verified.</Text>
                        <GlowButton
                            title="View Order Status"
                            onPress={() => navigation.navigate('Orders')}
                            style={styles.viewOrdersButton}
                            variant="primary"
                        />
                    </Card>
                ) : (
                    <>
                        <GlowButton
                            title="Submit Proof"
                            onPress={uploadProof}
                            loading={isSubmitting}
                            style={styles.submitButton}
                            variant="primary"
                        />

                        <GlowButton
                            title="Cancel"
                            onPress={() => navigation.goBack()}
                            style={styles.cancelButton}
                            variant="outline"
                            textStyle={{ color: theme.colors.textSecondary, borderColor: theme.colors.textSecondary }}
                        />
                    </>
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
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 24,
        flexGrow: 1,
    },

    // Enhanced Header Styles
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    orderBadge: {
        backgroundColor: theme.colors.primary + '20',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    orderLabel: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: '600',
        textAlign: 'center',
    },
    orderId: {
        fontSize: 16,
        color: theme.colors.primary,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amountLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
    amount: {
        fontSize: 24,
        color: theme.colors.text,
        fontWeight: 'bold',
    },

    // Card and Steps Styles
    card: {
        padding: 24,
        marginBottom: 16,
    },
    stepsCard: {
        paddingVertical: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    step: {
        flexDirection: 'row',
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        marginTop: 2,
    },
    stepNumberText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 12,
        lineHeight: 20,
    },

    // Enhanced Input Styles
    enhancedInput: {
        borderWidth: 2,
        borderColor: theme.colors.inputBorder,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 16,
        color: theme.colors.text,
        backgroundColor: theme.colors.inputBackground,
        fontWeight: '500',
    },

    // Enhanced Upload Box Styles
    enhancedUploadBox: {
        borderWidth: 3,
        borderColor: theme.colors.primary,
        borderStyle: 'dashed',
        borderRadius: 20,
        backgroundColor: theme.colors.primary + '08',
        overflow: 'hidden',
        minHeight: 160,
    },
    enhancedPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    uploadIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    uploadTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.primary,
        marginBottom: 4,
    },
    uploadSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 4,
    },

    // Lock Card Styles
    lockCard: {
        padding: 32,
        alignItems: 'center',
        backgroundColor: theme.colors.success + '10',
        borderWidth: 2,
        borderColor: theme.colors.success + '30',
    },
    lockIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.success + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    lockTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.success,
        marginBottom: 8,
        textAlign: 'center',
    },
    lockDescription: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },

    // Button Styles
    submitButton: {
        marginTop: 32,
        marginBottom: 20,
    },
    viewOrdersButton: {
        width: '100%',
    },
    cancelButton: {
        borderColor: theme.colors.border,
    },

    // Legacy styles kept for compatibility
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 8,
        color: theme.colors.text,
    },
    instruction: {
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        backgroundColor: theme.colors.inputBg,
        color: theme.colors.text,
    },
    uploadBox: {
        height: 200,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: theme.colors.surfaceLight,
        overflow: 'hidden',
    },
    placeholder: {
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 10,
        color: theme.colors.primary,
    },
    lockContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
        marginBottom: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderWidth: 1,
        borderColor: theme.colors.error,
    },
    lockText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.error,
        marginTop: 15,
    },
    lockSubtext: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 10,
    }
});

export default PaymentProofScreen;
