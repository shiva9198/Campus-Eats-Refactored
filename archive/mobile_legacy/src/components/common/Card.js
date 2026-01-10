import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../constants/theme';

const Card = ({ children, style, onPress, variant = 'default' }) => {
    const isPressable = !!onPress;
    const Component = isPressable ? TouchableOpacity : View;

    const getShadow = () => {
        switch (variant) {
            case 'glow':
                return theme.shadows.glow;
            case 'elevated':
                return theme.shadows.medium;
            default:
                return theme.shadows.small;
        }
    };

    return (
        <Component
            activeOpacity={0.9}
            onPress={onPress}
            style={[
                styles.card,
                { backgroundColor: theme.colors.surface },
                getShadow(),
                style
            ]}
        >
            {children}
        </Component>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
    }
});

export default Card;
