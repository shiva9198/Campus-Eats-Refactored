import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../constants/theme';
import { adminService } from '../../../services/adminService';
import { API_BASE_URL } from '../../../constants/config';
import { Ionicons } from '@expo/vector-icons';
import BrandingHeader from '../../../components/common/BrandingHeader';
import GlowButton from '../../../components/common/GlowButton';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';

const AdminPostAdScreen = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [link, setLink] = useState('');
    const [buttonText, setButtonText] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeAds, setActiveAds] = useState([]);
    const [loadingAds, setLoadingAds] = useState(true);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const fetchActiveAds = async () => {
        setLoadingAds(true);
        try {
            const response = await adminService.getOffers();
            setActiveAds(response.documents);
        } catch (error) {
            console.error('Error fetching ads:', error);
        } finally {
            setLoadingAds(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchActiveAds();
        }, [])
    );

    const handlePostAd = async () => {
        if (!image) {
            Alert.alert('Required', 'Please select an image for the ad.');
            return;
        }

        if (link && !buttonText) {
            Alert.alert('Required', 'Please provide a button label since you added a link.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();

            if (Platform.OS === 'web') {
                const response = await fetch(image.uri);
                const blob = await response.blob();
                formData.append('file', blob, image.fileName || 'ad_banner.png');
            } else {
                formData.append('file', {
                    uri: image.uri,
                    type: 'image/png',
                    name: image.fileName || 'ad_banner.png'
                });
            }

            formData.append('folder', 'campus-eats/ads');

            const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Image upload failed');
            }

            const uploadData = await uploadResponse.json();
            const fileUrl = uploadData.url;

            await adminService.createOffer({
                title: title,
                subtitle: subtitle,
                link: link || undefined,
                cta: (link && buttonText) ? buttonText : undefined,
                imageUrl: fileUrl,
                color: theme.colors.surface
            });

            Alert.alert('Success', 'Ad posted successfully!');
            setTitle('');
            setSubtitle('');
            setLink('');
            setButtonText('');
            setImage(null);
            fetchActiveAds();

        } catch (error) {
            console.error('Error posting ad:', error);
            Alert.alert('Error', 'Failed to post ad. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAd = async (adId) => {
        const confirmed = window.confirm("Are you sure you want to remove this ad?");

        if (confirmed) {
            try {
                await adminService.deleteOffer(adId);
                alert("Ad has been removed.");
                fetchActiveAds();
            } catch (error) {
                console.error("Error deleting ad:", error);
                alert("Could not delete ad: " + error.message);
            }
        }
    };

    const renderAdItem = ({ item }) => (
        <View style={styles.adItem}>
            <Image source={{ uri: item.imageUrl }} style={styles.adThumbnail} />
            <View style={styles.adInfo}>
                <Text style={styles.adTitle} numberOfLines={1}>{item.title || '(No Title)'}</Text>
                <Text style={styles.adSubtitle} numberOfLines={1}>{item.subtitle || 'Image Only'}</Text>
                {item.link && <Text style={styles.adLink} numberOfLines={1}>🔗 {item.link}</Text>}
            </View>
            <TouchableOpacity onPress={() => handleDeleteAd(item.$id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader showBack={true} title="Post New Ad" />
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content}>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {image ? (
                        <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="image-outline" size={40} color={theme.colors.textSecondary} />
                            <Text style={styles.placeholderText}>Tap to Add Banner Image *</Text>
                            <Text style={[styles.hint, { marginTop: 4 }]}>Rec: 1200x600px (16:9)</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.form}>
                    <Text style={styles.label}>Title (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Student Deal"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.label}>Subtitle (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 50% off on all pizzas"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={subtitle}
                        onChangeText={setSubtitle}
                    />

                    <Text style={styles.label}>Link / URL (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="https://..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={link}
                        onChangeText={setLink}
                        autoCapitalize="none"
                    />
                    <Text style={styles.hint}>If provided, a button will appear.</Text>
                </View>

                {link ? (
                    <View style={styles.form}>
                        <Text style={styles.label}>Button Label (Required)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Shop Now, Learn More"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={buttonText}
                            onChangeText={setButtonText}
                        />
                    </View>
                ) : null}

                <GlowButton
                    title={loading ? "Posting..." : "Post Ad"}
                    onPress={handlePostAd}
                    disabled={loading}
                    style={styles.submitBtn}
                />

                <View style={styles.listSection}>
                    <Text style={styles.sectionTitle}>Active Ads</Text>
                    {loadingAds ? (
                        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
                    ) : activeAds.length === 0 ? (
                        <Text style={styles.emptyText}>No active ads running.</Text>
                    ) : (
                        activeAds.map(item => (
                            <View key={item.$id}>
                                {renderAdItem({ item })}
                            </View>
                        ))
                    )}
                </View>
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
        paddingBottom: 40,
    },
    imagePicker: {
        height: 180,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.l,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        overflow: 'hidden',
        marginBottom: theme.spacing.m,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 8,
        color: theme.colors.textSecondary,
    },
    form: {
        marginBottom: theme.spacing.m,
    },
    label: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 6,
        marginTop: 10,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.m,
        padding: 12,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
        fontSize: 14,
    },
    hint: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    submitBtn: {
        marginTop: 10,
        marginBottom: 30,
    },
    listSection: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 15,
    },
    adItem: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.m,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    adThumbnail: {
        width: 60,
        height: 60,
        borderRadius: theme.borderRadius.s,
        backgroundColor: theme.colors.surfaceLight,
        marginRight: 10,
    },
    adInfo: {
        flex: 1,
    },
    adTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 2,
    },
    adSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    adLink: {
        fontSize: 10,
        color: theme.colors.primary,
        marginTop: 2,
    },
    deleteBtn: {
        padding: 8,
    },
    emptyText: {
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 10,
        fontStyle: 'italic',
    }
});

export default AdminPostAdScreen;
