import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import BrandingHeader from '../../components/common/BrandingHeader';
import Card from '../../components/common/Card';
import GlowButton from '../../components/common/GlowButton';

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        if (Platform.OS === 'web') {
            const confirm = window.confirm("Are you sure you want to logout?");
            if (confirm) {
                await logout();
            }
        } else {
            Alert.alert(
                "Logout",
                "Are you sure you want to logout?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Logout", style: "destructive", onPress: async () => {
                            await logout();
                        }
                    }
                ]
            );
        }
    };

    if (!user) return null;

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader title="My Profile" />
            </SafeAreaView>

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{user.name ? user.name[0].toUpperCase() : 'U'}</Text>
                    </View>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.email}>{user.email}</Text>
                </View>

                <Card style={styles.menu}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
                        <View style={styles.menuItemIcon}>
                            <Ionicons name="person-circle-outline" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.menuText}>Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => navigation.navigate('Orders')}>
                        <View style={styles.menuItemIcon}>
                            <Ionicons name="receipt-outline" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.menuText}>My Orders</Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </Card>

                <GlowButton
                    title="Log Out"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    variant="outline"
                    textStyle={{ color: theme.colors.error, borderColor: theme.colors.error }}
                />
            </View>
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
        alignItems: 'center',
        paddingVertical: 30,
        marginBottom: 20,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.surfaceLight, // Darker circle background
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        ...theme.shadows.glow,
    },
    avatarText: {
        color: theme.colors.primary,
        fontSize: 32,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    email: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginTop: 5,
    },
    menu: {
        backgroundColor: theme.colors.surface,
        padding: 0,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: theme.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuItemIcon: {
        width: 32,
        alignItems: 'center',
    },
    menuText: {
        flex: 1,
        marginLeft: 15,
        fontSize: 16,
        color: theme.colors.text,
    },
    logoutButton: {
        marginTop: 30,
        borderColor: theme.colors.error,
        borderWidth: 1.5,
    }
});

export default ProfileScreen;
