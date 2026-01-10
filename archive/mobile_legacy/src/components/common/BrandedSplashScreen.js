import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text, Image, Platform } from 'react-native';
import { theme } from '../../constants/theme';

const BrandedSplashScreen = () => {
    // 1. Initialized Animated Values
    const pulseAnim = useRef(new Animated.Value(0.6)).current; // For Opacity
    const scaleAnim = useRef(new Animated.Value(0.95)).current; // For Breathing Size

    useEffect(() => {
        // 2. Define the Pulse Loop
        const startPulse = () => {
            Animated.loop(
                Animated.parallel([
                    // Opacity Sequence: 0.6 -> 1 -> 0.6
                    Animated.sequence([
                        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
                        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
                    ]),
                    // Scale Sequence: 0.95 -> 1.05 -> 0.95
                    Animated.sequence([
                        Animated.timing(scaleAnim, { toValue: 1.05, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
                        Animated.timing(scaleAnim, { toValue: 0.95, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
                    ]),
                ])
            ).start();
        };

        startPulse();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={{
                opacity: pulseAnim,
                transform: [{ scale: scaleAnim }],
                alignItems: 'center'
            }}>
                <Image
                    source={require('../../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 100,
    },
    footerText: {
        position: 'absolute',
        bottom: 50,
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
});

export default BrandedSplashScreen;
