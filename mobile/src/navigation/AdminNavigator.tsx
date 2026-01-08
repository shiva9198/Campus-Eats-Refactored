import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import AdminOrderListScreen from '../screens/Admin/AdminOrderListScreen';
import AdminOrderDetailScreen from '../screens/Admin/AdminOrderDetailScreen';
import PaymentVerificationScreen from '../screens/Admin/PaymentVerificationScreen';
import AdminMenuListScreen from '../screens/Admin/AdminMenuListScreen';
import AdminEditMenuScreen from '../screens/Admin/AdminEditMenuScreen';
import AdminCollectionScreen from '../screens/Admin/AdminCollectionScreen';


// Basic Manual Navigator for Admin Stack (Stability > Elegance)
// In a full app, we'd use React Navigation Stack, but to keep things simple and consistent with current App.tsx manual routing
// we will start with this. If user prefers stack, we can upgrade.
// Given the prompt "Don't refactor... One screen at a time", fitting into App.tsx model is safest.

type AdminScreen = 'dashboard' | 'orders' | 'menu' | 'order_detail' | 'payment_verification' | 'menu_edit' | 'collection';

const AdminNavigator = () => {
    const [currentScreen, setCurrentScreen] = useState<AdminScreen>('dashboard');
    const [selectedOrder, setSelectedOrder] = useState<any>(null); // For detail view later
    const [editingItem, setEditingItem] = useState<any>(null); // For menu edit

    const renderScreen = () => {
        switch (currentScreen) {
            case 'dashboard':
                return <AdminDashboardScreen onNavigate={(screen) => setCurrentScreen(screen)} />;
            case 'orders':
                return <AdminOrderListScreen
                    onSelectOrder={(order: any) => {
                        setSelectedOrder(order);
                        setCurrentScreen('order_detail');
                    }}
                />;
            case 'order_detail':
                return <AdminOrderDetailScreen
                    order={selectedOrder}
                    onBack={() => setCurrentScreen('orders')}
                    onVerifyPayment={() => setCurrentScreen('payment_verification')}
                />;
            case 'payment_verification':
                return <PaymentVerificationScreen
                    order={selectedOrder}
                    onBack={() => setCurrentScreen('order_detail')}
                    onVerified={() => setCurrentScreen('orders')} // Go back to list to refresh
                />;
            case 'menu':
                return <AdminMenuListScreen
                    onAddItem={() => {
                        setEditingItem(null);
                        setCurrentScreen('menu_edit');
                    }}
                    onEditItem={(item: any) => {
                        setEditingItem(item);
                        setCurrentScreen('menu_edit');
                    }}
                />;
            case 'menu_edit':
                return <AdminEditMenuScreen
                    item={editingItem}
                    onBack={() => setCurrentScreen('menu')}
                    onSave={() => setCurrentScreen('menu')}
                />;
            case 'collection':
                return <AdminCollectionScreen
                    onBack={() => setCurrentScreen('dashboard')}
                />;
            default:
                return <AdminDashboardScreen onNavigate={(screen) => setCurrentScreen(screen)} />;
        }
    };


    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {renderScreen()}
            </View>

            {/* Bottom Tab Bar (Simple) */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.tabItem, currentScreen === 'dashboard' && styles.activeTab]}
                    onPress={() => setCurrentScreen('dashboard')}
                >
                    <Text style={[styles.tabText, currentScreen === 'dashboard' && styles.activeText]}>Dashboard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabItem, currentScreen === 'orders' && styles.activeTab]}
                    onPress={() => setCurrentScreen('orders')}
                >
                    <Text style={[styles.tabText, currentScreen === 'orders' && styles.activeText]}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabItem, currentScreen === 'menu' && styles.activeTab]}
                    onPress={() => setCurrentScreen('menu')}
                >
                    <Text style={[styles.tabText, currentScreen === 'menu' && styles.activeText]}>Menu</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { flex: 1 },
    bottomBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 10, backgroundColor: '#fff', elevation: 5 },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: 5 },
    tabText: { color: '#888', fontSize: 12, marginTop: 2 },
    activeTab: {},
    activeText: { color: '#FF4B3A', fontWeight: 'bold' },
});


export default AdminNavigator;
