import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

interface AppHeaderProps {
    title: string;
    showBack?: boolean;
    onBack?: () => void;
    rightAction?: React.ReactNode;
}

export const AppHeader = ({ title, showBack, onBack, rightAction }: AppHeaderProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                {showBack && onBack && (
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Text style={styles.backText}>←</Text>
                    </TouchableOpacity>
                )}
                <Image
                    source={require('../assets/logo_in_app.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={[styles.title, showBack && styles.titleWithBack]}>{title}</Text>
            </View>
            {rightAction && <View style={styles.rightContainer}>{rightAction}</View>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        elevation: 2,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    backText: {
        fontSize: 24,
        color: '#333',
        lineHeight: 24,
    },
    logo: {
        width: 32,
        height: 32,
        marginRight: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111',
    },
    titleWithBack: {
        marginLeft: 0,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
