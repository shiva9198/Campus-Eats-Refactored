import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const CustomDrawerContent = (props) => {
    const { logout, user } = useAuth();
    const { state, navigation } = props;
    const activeRoute = state.routeNames[state.index];

    // Helper to check if a route is active
    const isActive = (routeName, tabName) => {
        if (routeName === 'AdminTabs') {
            return state.routes[state.index].params?.screen === tabName;
        }
        return activeRoute === routeName;
    };

    const MenuItem = ({ label, icon, onPress, active }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={[
                styles.menuItem,
                active && styles.activeMenuItem
            ]}
        >
            <View style={[styles.iconContainer, active && styles.activeIconContainer]}>
                <Ionicons
                    name={icon}
                    size={22}
                    color={active ? theme.colors.primary : theme.colors.textSecondary}
                />
            </View>
            <Text style={[
                styles.menuLabel,
                active && styles.activeMenuLabel
            ]}>
                {label}
            </Text>
            {active && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.mainContainer}>
            <View style={styles.headerWrapper}>
                <View style={styles.logoBadge}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>
                <View style={styles.adminProfile}>
                    <Text style={styles.adminRole}>Admin Console</Text>
                    <Text style={styles.adminName} numberOfLines={1}>{user?.name || 'Administrator'}</Text>
                </View>
            </View>

            <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
                <View style={styles.navSection}>
                    <Text style={styles.navHeading}>Navigation</Text>

                    <MenuItem
                        label="Dashboard"
                        icon="grid-outline"
                        active={isActive('AdminTabs', 'Dashboard')}
                        onPress={() => navigation.navigate('AdminTabs', { screen: 'Dashboard' })}
                    />

                    <MenuItem
                        label="Manage Orders"
                        icon="receipt-outline"
                        active={isActive('AdminTabs', 'ManageOrders')}
                        onPress={() => navigation.navigate('AdminTabs', { screen: 'ManageOrders' })}
                    />

                    <MenuItem
                        label="Verify Payments"
                        icon="shield-checkmark-outline"
                        active={isActive('AdminTabs', 'Verify')}
                        onPress={() => navigation.navigate('AdminTabs', { screen: 'Verify' })}
                    />

                    <MenuItem
                        label="Collection Desk"
                        icon="qr-code-outline"
                        active={isActive('AdminTabs', 'Collection')}
                        onPress={() => navigation.navigate('AdminTabs', { screen: 'Collection' })}
                    />

                    <View style={styles.menuDivider} />
                    <Text style={styles.navHeading}>Maintenance</Text>

                    <MenuItem
                        label="Menu Editor"
                        icon="restaurant-outline"
                        active={isActive('Menu')}
                        onPress={() => navigation.navigate('Menu')}
                    />

                    <MenuItem
                        label="Session Control"
                        icon="timer-outline"
                        active={isActive('AdminSessionControl')}
                        onPress={() => navigation.navigate('AdminSessionControl')}
                    />

                    <MenuItem
                        label="Global Settings"
                        icon="settings-outline"
                        active={isActive('AdminTabs', 'Settings')}
                        onPress={() => navigation.navigate('AdminTabs', { screen: 'Settings' })}
                    />
                </View>
            </DrawerContentScrollView>

            <View style={styles.footerBranding}>
                <TouchableOpacity
                    onPress={logout}
                    style={styles.logoutBtn}
                >
                    <Ionicons name="log-out" size={24} color={theme.colors.error} />
                    <Text style={styles.logoutLabel}>Disconnect App</Text>
                </TouchableOpacity>
                <Text style={styles.versionTag}>v1.0.4 - Production</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerWrapper: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 25,
        paddingHorizontal: 20,
        backgroundColor: theme.colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    logoBadge: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#FFF',
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    adminProfile: {
        flex: 1,
    },
    adminRole: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    adminName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginTop: 2,
    },
    scrollContent: {
        paddingTop: 10,
    },
    navSection: {
        paddingHorizontal: 15,
    },
    navHeading: {
        fontSize: 11,
        fontWeight: '800',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginTop: 20,
        marginBottom: 10,
        marginLeft: 10,
        opacity: 0.6,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    activeMenuItem: {
        backgroundColor: 'rgba(255, 107, 0, 0.1)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    activeIconContainer: {
        backgroundColor: 'rgba(255, 107, 0, 0.15)',
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        flex: 1,
    },
    activeMenuLabel: {
        color: theme.colors.primary,
        fontWeight: '700',
    },
    activeIndicator: {
        width: 4,
        height: 20,
        backgroundColor: theme.colors.primary,
        borderRadius: 2,
        position: 'absolute',
        right: 0,
    },
    menuDivider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 15,
        marginHorizontal: 10,
    },
    footerBranding: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(244, 67, 54, 0.08)',
        padding: 14,
        borderRadius: 12,
        gap: 12,
    },
    logoutLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.error,
    },
    versionTag: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 15,
        opacity: 0.4,
    }
});

export default CustomDrawerContent;
