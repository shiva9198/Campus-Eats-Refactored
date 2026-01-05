import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { theme } from '../../constants/theme';

const GlowButton = ({ title, onPress, loading = false, style, textStyle, variant = 'primary', glow = true, progress = 0 }) => {
    const animatedWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(animatedWidth, {
            toValue: progress,
            useNativeDriver: false,
            friction: 8,
            tension: 40
        }).start();
    }, [progress]);

    const handlePress = () => {
        if (!loading && onPress && glow) {
            onPress();
        }
    };

    const fillWidth = animatedWidth.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={loading || !glow}
            activeOpacity={0.8}
            style={[
                styles.button,
                variant === 'primary' && styles.primary,
                variant === 'primary' && glow && !loading && styles.glowActive,
                variant === 'secondary' && styles.secondary,
                variant === 'outline' && styles.outline,
                loading && styles.disabled,
                style,
                // If progress is active, override standard background for a filled effect
                variant === 'primary' && !glow && { backgroundColor: theme.colors.surfaceLight }
            ]}
        >
            {/* FLUID PROGRESS FILL LAYER */}
            {variant === 'primary' && !glow && (
                <Animated.View
                    style={[
                        styles.progressFill,
                        { width: fillWidth }
                    ]}
                />
            )}

            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? theme.colors.primary : '#FFF'} />
            ) : (
                <Text style={[
                    styles.text,
                    variant === 'outline' && styles.outlineText,
                    textStyle
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: theme.borderRadius.l,
        paddingVertical: 14,
        paddingHorizontal: theme.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
        overflow: 'hidden', // Required for fill effect
    },
    progressFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: theme.colors.primary,
        opacity: 0.85, // Higher opacity for "fluid" look
        ...theme.shadows.glow, // Add glow to the filling part
    },
    primary: {
        backgroundColor: theme.colors.primary,
    },
    glowActive: {
        ...theme.shadows.glow,
    },
    secondary: {
        backgroundColor: theme.colors.surfaceLight,
        ...theme.shadows.small,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
    }, disabled: {
        opacity: 0.6,
    }, text: {
        ...theme.typography.button,
    },
    outlineText: {
        color: theme.colors.primary,
    }
});

export default GlowButton;
