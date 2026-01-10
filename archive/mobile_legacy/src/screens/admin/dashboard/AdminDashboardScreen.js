import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../constants/theme';
import { adminService } from '../../../services/adminService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import BrandingHeader from '../../../components/common/BrandingHeader';
import { useNotification } from '../../../context/NotificationContext';
import Card from '../../../components/common/Card';
import GlowButton from '../../../components/common/GlowButton';
// OffersCarousel removed
import * as ImagePicker from 'expo-image-picker';

const AdminDashboardScreen = ({ navigation }) => {
    const [stats, setStats] = useState({
        pending: 0,
        todaySales: 0,
        totalOrders: 0,
        activeOrders: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { showNotification } = useNotification();

    const fetchStats = async () => {
        try {
            // Use adminService to get dashboard statistics
            const dashboardStats = await adminService.getDashboardStats();

            setStats({
                pending: dashboardStats.pendingPayments,
                activeOrders: dashboardStats.activeOrders,
                todaySales: dashboardStats.totalRevenue,
                totalOrders: dashboardStats.orderCount
            });
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const handleLogoUpload = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], // Changed to array format for web compatibility
                allowsEditing: true,
                aspect: [4, 1], // Wide aspect for logo
                quality: 1,
            });

            if (!result.canceled) {
                setUploading(true);
                const asset = result.assets[0];

                // Prepare FormData for upload
                const formData = new FormData();

                if (Platform.OS === 'web') {
                    const response = await fetch(asset.uri);
                    const blob = await response.blob();
                    formData.append('file', blob, asset.fileName || 'logo.png');
                } else {
                    formData.append('file', {
                        uri: asset.uri,
                        type: 'image/png',
                        name: asset.fileName || 'logo.png'
                    });
                }

                formData.append('folder', 'campus-eats/logos');

                // Upload to backend
                const uploadResponse = await fetch('http://localhost:8000/upload/image', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadResponse.ok) {
                    showNotification('Logo upload failed', 'error');
                    throw new Error('Logo upload failed');
                }

                const uploadData = await uploadResponse.json();
                const fileUrl = uploadData.url;





                // Update Settings using adminService
                await adminService.updateGlobalSettings({ logoUrl: fileUrl });

                alert("Logo updated successfully! Reload the page to see changes.");
            }
        } catch (error) {
            console.error("Upload Error:", error);
            alert("Failed to upload logo: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader showMenu={true} title="Dashboard" />
            </SafeAreaView>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                }
            >
                <View style={styles.welcomeSection}>
                    <Text style={styles.greeting}>Hello, Admin 👋</Text>
                    <Text style={styles.subtitle}>Here's what's happening today</Text>
                </View>

                {/* Ads/Promo Carousel Removed for Admin as per request */}

                {/* Logo Management Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleLogoUpload} disabled={uploading}>
                        {uploading ? (
                            <ActivityIndicator color={theme.colors.primary} />
                        ) : (
                            <>
                                <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
                                <Text style={styles.actionText}>Change App Logo</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => {
                        console.log("Navigating to AdminPostAd...");
                        try {
                            navigation.navigate('AdminPostAd');
                        } catch (e) {
                            Alert.alert("Navigation Error", e.message);
                        }
                    }}>
                        <Ionicons name="pricetags-outline" size={24} color={theme.colors.primary} />
                        <Text style={styles.actionText}>Post Ads</Text>
                    </TouchableOpacity>
                </View>


                {/* Main Stats Cards */}
                <View style={styles.statsGrid}>
                    <Card style={[styles.card, styles.pendingCard]} onPress={() => navigation.navigate('Verify')}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="card-outline" size={24} color={theme.colors.warning} />
                            <Text style={styles.cardLabel}>Pending Payments</Text>
                        </View>
                        <Text style={styles.cardValue}>{stats.pending}</Text>
                        <Text style={[styles.linkText, { color: theme.colors.warning }]}>Review Now →</Text>
                    </Card>

                    <Card style={[styles.card, styles.activeCard]} onPress={() => navigation.navigate('ManageOrders')}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="flame-outline" size={24} color={theme.colors.primary} />
                            <Text style={styles.cardLabel}>Kitchen Active</Text>
                        </View>
                        <Text style={styles.cardValue}>{stats.activeOrders}</Text>
                        <Text style={[styles.linkText, { color: theme.colors.primary }]}>View Kitchen →</Text>
                    </Card>
                </View>

                {/* Secondary Stats */}
                <View style={styles.row}>
                    <Card style={styles.smallCard}>
                        <Text style={styles.smallLabel}>Today's Revenue</Text>
                        <Text style={styles.smallValue}>₹{stats.todaySales}</Text>
                    </Card>
                    <Card style={styles.smallCard}>
                        <Text style={styles.smallLabel}>Total Orders</Text>
                        <Text style={styles.smallValue}>{stats.totalOrders}</Text>
                    </Card>
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
        paddingHorizontal: 20, // Consistent 20px outer margin
        paddingTop: 8,
        paddingBottom: 30,
    },
    welcomeSection: {
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    sectionHeader: {
        marginBottom: 10,
        marginTop: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 25,
    },
    actionButton: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        gap: 8,
    },
    actionText: {
        color: theme.colors.text,
        fontWeight: '600',
        fontSize: 14,
    },
    // Stats Styles
    statsGrid: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 15,
    },
    card: {
        flex: 1,
        padding: 16,
        backgroundColor: theme.colors.surface,
    },
    cardHeader: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
        alignItems: 'center'
    },
    cardValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    cardLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '600'
    },
    linkText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 'auto',
    },
    row: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 25,
    },
    smallCard: {
        flex: 1,
        padding: 15,
        backgroundColor: theme.colors.surface,
    },
    smallLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    smallValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
});

export default AdminDashboardScreen;
