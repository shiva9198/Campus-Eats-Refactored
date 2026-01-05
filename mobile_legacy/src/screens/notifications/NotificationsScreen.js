import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const NotificationsScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);

    // MOCK Data for visualization (since backend is empty)
    // Remove this in production or use real fetch
    useEffect(() => {
        // setNotifications([
        //     { $id: '1', title: 'Order Ready', body: 'Your order #123 is ready!', $createdAt: new Date().toISOString() }
        // ]);
        setNotifications([]);
    }, []);

    return (
        <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <View style={styles.modalContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>Notifications</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                {notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="checkmark-circle-outline" size={60} color={theme.colors.success} />
                        <Text style={styles.emptyTitle}>All caught up!</Text>
                        <Text style={styles.emptySubtitle}>No new notifications.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        keyExtractor={item => item.$id}
                        renderItem={({ item }) => (
                            <View style={styles.notificationItem}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="restaurant-outline" size={20} color="#fff" />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.notificationTitle}>{item.title}</Text>
                                    <Text style={styles.notificationBody}>{item.body}</Text>
                                    <Text style={styles.timestamp}>{new Date(item.$createdAt).toLocaleTimeString()}</Text>
                                </View>
                            </View>
                        )}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-start', // Align to top
        paddingTop: 60, // approximate header height offset
        alignItems: 'flex-end', // Align to right (like web dropdown)
        paddingRight: 10,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent', // Allow clicking through if needed, or 'rgba(0,0,0,0.2)' for dim
    },
    modalContainer: {
        width: 300,
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 6,
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            }
        }),
        maxHeight: 400,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    emptyContainer: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 10,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.colors.textLight,
    },
    listContent: {
        padding: 10,
    },
    notificationItem: {
        flexDirection: 'row',
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
    },
    notificationTitle: {
        fontWeight: 'bold',
        color: theme.colors.text,
        fontSize: 14,
    },
    notificationBody: {
        fontSize: 12,
        color: theme.colors.textLight,
        marginVertical: 2,
    },
    timestamp: {
        fontSize: 10,
        color: '#999',
    },
});

export default NotificationsScreen;
