import React, { memo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { MenuItem as MenuItemType } from '../types';

interface Props {
    item: MenuItemType;
    onPress?: () => void;
    isAdmin?: boolean;
    onToggleStock?: (item: MenuItemType) => void;
}

const MenuItem = memo(({ item, onPress, isAdmin, onToggleStock }: Props) => {
    const isAvailable = item.is_available;

    const handleToggle = () => {
        if (!onToggleStock) return;

        Alert.alert(
            "Confirm Stock Change",
            `Mark ${item.name} as ${isAvailable ? "Out of Stock" : "Available"}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: () => onToggleStock(item),
                    style: isAvailable ? "destructive" : "default"
                }
            ]
        );
    };

    return (
        <TouchableOpacity
            style={[styles.container, !isAvailable && styles.disabledContainer]}
            onPress={isAvailable ? onPress : undefined}
            activeOpacity={0.7}
        >
            <View style={styles.infoContainer}>
                <Text style={[styles.name, !isAvailable && styles.disabledText]}>{item.name}</Text>
                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>
                <Text style={[styles.price, !isAvailable && styles.disabledText]}>₹ {item.price}</Text>

                {isAdmin ? (
                    <View style={styles.adminRow}>
                        <Text style={styles.adminLabel}>{isAvailable ? "In Stock" : "Out of Stock"}</Text>
                        <Switch
                            value={isAvailable}
                            onValueChange={handleToggle}
                            trackColor={{ false: "#767577", true: "#F97316" }}
                        />
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.addButton, !isAvailable && styles.disabledButton]}
                        onPress={isAvailable ? onPress : undefined}
                        disabled={!isAvailable}
                    >
                        <Text style={styles.addButtonText}>
                            {isAvailable ? "Add +" : "Out of Stock"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
            {item.image_url ? (
                <Image
                    source={{ uri: item.image_url }}
                    style={[styles.image, !isAvailable && styles.disabledImage]}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.image, styles.placeholder]} />
            )}
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'white',
        marginBottom: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    disabledContainer: {
        backgroundColor: '#f9f9f9', // Slightly gray background
    },
    infoContainer: {
        flex: 1,
        marginRight: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F97316',
    },
    disabledText: {
        color: '#999',
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    disabledImage: {
        opacity: 0.5,
    },
    placeholder: {
        backgroundColor: '#eee',
    },
    addButton: {
        marginTop: 8,
        backgroundColor: '#F97316',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    addButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    adminRow: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    adminLabel: {
        fontSize: 12,
        marginRight: 8,
        color: '#555',
    }
});

export default MenuItem;
