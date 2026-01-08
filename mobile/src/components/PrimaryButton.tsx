import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const PrimaryButton = ({ title, onPress, loading = false, disabled = false, style, textStyle }: PrimaryButtonProps) => {
    const isIdsabled = disabled || loading;
    return (
        <TouchableOpacity
            style={[styles.button, isIdsabled && styles.disabled, style]}
            onPress={onPress}
            disabled={isIdsabled}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text style={[styles.text, textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#F97316',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        width: '100%',
    },
    disabled: {
        opacity: 0.6,
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
