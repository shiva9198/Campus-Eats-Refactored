import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableOpacity,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

const { width } = Dimensions.get('window');

const CustomToast = ({ visible, message, type, onHide }) => {
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Slide Down & Fade In
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: Platform.OS === 'ios' ? 60 : 40,
                    duration: 400,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ]).start();
        } else {
            // Slide up & Fade Out
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ]).start();
        }
    }, [visible]);

    if (!visible && opacityAnim._value === 0) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'alert-circle';
            case 'info': return 'information-circle';
            default: return 'information-circle';
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success': return theme.colors.success;
            case 'error': return theme.colors.error;
            case 'info': return theme.colors.primary;
            default: return theme.colors.primary;
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim,
                    borderColor: getColors(),
                }
            ]}
        >
            <View style={[styles.iconContainer, { backgroundColor: getColors() + '20' }]}>
                <Ionicons name={getIcon()} size={24} color={getColors()} />
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.message}>{message}</Text>
            </View>

            <TouchableOpacity onPress={onHide} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        zIndex: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1.5,
        ...theme.shadows.medium,
        // High Contrast Glow Effect
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    message: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
        lineHeight: 18,
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,
    }
});

export default CustomToast;
