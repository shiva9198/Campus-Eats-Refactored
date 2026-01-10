import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useNavigation, DrawerActions, useFocusEffect } from '@react-navigation/native';
import { databases, DATABASE_ID, COLLECTIONS } from '../../services/appwrite';
import { Query } from 'react-native-appwrite';

const BrandingHeader = ({ showBack = false, showMenu = false, onBackPress, title, rightAction }) => {
    const navigation = useNavigation();
    const [logoUrl, setLogoUrl] = useState(null);

    const fetchLogo = async () => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.SETTINGS,
                [Query.limit(1)]
            );
            if (response.documents.length > 0 && response.documents[0].logoUrl) {
                setLogoUrl(response.documents[0].logoUrl);
            }
        } catch (error) {
            console.log('Error fetching logo:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchLogo();
        }, [])
    );

    const handleMenuPress = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Left Section: Back OR Logo (Circular) */}
                <View style={styles.leftContainer}>
                    {showBack ? (
                        <TouchableOpacity onPress={onBackPress || (() => navigation.goBack())} style={styles.iconButton}>
                            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    ) : (
                        <Image
                            source={logoUrl ? { uri: logoUrl } : require('../../../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain" // Changed from cover to contain to avoid clipping
                        />
                    )}
                </View>

                {/* Center Section: BRANDING (Centered exactly) */}
                <View style={styles.centerContainer}>
                    <Text style={styles.brandTitle}>Campus Eats</Text>
                </View>

                {/* Right Section: Utilities + Admin Menu */}
                <View style={styles.rightContainer}>
                    {rightAction}

                    {/* Admin Side Drawer Trigger (Right Side) */}
                    {showMenu && (
                        <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
                            <Ionicons name="menu" size={28} color={theme.colors.primary} />
                        </TouchableOpacity>
                    )}

                    {!rightAction && !showMenu && <View style={{ width: 40 }} />}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: theme.colors.background,
        paddingTop: Platform.OS === 'android' ? 10 : 0,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20, // Consistent 20px outer margin
        paddingVertical: theme.spacing.s,
        backgroundColor: theme.colors.background,
        height: 70,
    },
    leftContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    centerContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: -1,
    },
    rightContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: theme.spacing.s,
    },
    logo: {
        width: 38,
        height: 38,
        borderRadius: 19,
        // Removed border as per request
    },
    brandTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: theme.colors.text,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    iconButton: {
        padding: 4,
    },
    menuButton: {
        padding: 4,
        marginLeft: theme.spacing.s,
    },
});

export default BrandingHeader;
