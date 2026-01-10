import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { theme } from './src/constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

import HomeScreen from './src/screens/home/HomeScreen';
import CartScreen from './src/screens/cart/CartScreen';
import PaymentProofScreen from './src/screens/payment/PaymentProofScreen';
import PaymentScreen from './src/screens/payment/PaymentScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import { CartProvider, useCart } from './src/context/CartContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import { NotificationProvider } from './src/context/NotificationContext';
import LogoTitle from './src/components/LogoTitle';
import BrandedSplashScreen from './src/components/common/BrandedSplashScreen';


import OrdersScreen from './src/screens/orders/OrdersScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Header Right Component (Cart Icon)
const HeaderRight = () => {
  const { cartItems } = useCart();
  const navigation = useNavigation();
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  return (
    <View style={{ flexDirection: 'row', marginRight: 15, alignItems: 'center' }}>
      {/* Notification Bell (Visual Only) */}
      <TouchableOpacity
        style={{ marginRight: 15 }}
        onPress={() => navigation.navigate('Notifications')}
      >
        <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
      </TouchableOpacity>

      {/* Cart Icon */}
      <TouchableOpacity
        style={{ position: 'relative' }}
        onPress={() => navigation.navigate('Cart')}
      >
        <Ionicons name="cart-outline" size={28} color={theme.colors.primary} />
        {cartCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AppTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // BrandingHeader handled in screens
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
          height: 60 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fast-food-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};


import AdminDashboardScreen from './src/screens/admin/dashboard/AdminDashboardScreen';
import AdminPostAdScreen from './src/screens/admin/dashboard/AdminPostAdScreen';
import AdminCollectionScreen from './src/screens/admin/dashboard/AdminCollectionScreen';
import PaymentVerificationListScreen from './src/screens/admin/payment/PaymentVerificationListScreen';
import PaymentVerificationDetailScreen from './src/screens/admin/payment/PaymentVerificationDetailScreen';
import AdminOrderListScreen from './src/screens/admin/orders/AdminOrderListScreen';
import AdminOrderDetailScreen from './src/screens/admin/orders/AdminOrderDetailScreen';
import AdminMenuListScreen from './src/screens/admin/menu/AdminMenuListScreen';
import AdminEditMenuScreen from './src/screens/admin/menu/AdminEditMenuScreen';
import AdminSessionControlScreen from './src/screens/admin/session/AdminSessionControlScreen';
import AdminSettingsScreen from './src/screens/admin/settings/AdminSettingsScreen';

// ... (Existing Imports)

// CustomAdminHeader removed

// ... (Existing Imports)

// ... (imports remain)

const AdminPaymentStack = createNativeStackNavigator();
const AdminPaymentNavigator = () => (
  <AdminPaymentStack.Navigator
    screenOptions={{
      headerShown: false, // BrandingHeader handled in screens
    }}
  >
    <AdminPaymentStack.Screen
      name="VerificationList"
      component={PaymentVerificationListScreen}
      options={{ title: 'Payment Verification' }}
    />
    <AdminPaymentStack.Screen
      name="PaymentVerificationDetail"
      component={PaymentVerificationDetailScreen}
      options={{ title: 'Verification Details' }}
    />
  </AdminPaymentStack.Navigator>
);

const AdminOrderStack = createNativeStackNavigator();
const AdminOrderNavigator = () => (
  <AdminOrderStack.Navigator
    screenOptions={{
      headerShown: false, // BrandingHeader handled in screens
    }}
  >
    <AdminOrderStack.Screen
      name="OrderList"
      component={AdminOrderListScreen}
      options={{ title: 'Manage Orders' }}
    />
    <AdminOrderStack.Screen
      name="AdminOrderDetail"
      component={AdminOrderDetailScreen}
      options={{ title: 'Order Details' }}
    />
  </AdminOrderStack.Navigator>
);

import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from './src/components/CustomDrawerContent';

const AdminTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // BrandingHeader handled in screens
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="ManageOrders"
        component={AdminOrderNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="Verify"
        component={AdminPaymentNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-done-circle" size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="Collection"
        component={AdminCollectionScreen}
        options={{
          title: 'Collection Center',
          tabBarIcon: ({ color, size }) => <Ionicons name="barcode-outline" size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="Settings"
        component={AdminSettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
};

const Drawer = createDrawerNavigator();

const AdminDrawer = () => (
  <Drawer.Navigator
    screenOptions={{
      headerShown: false,
      drawerPosition: 'right',
      drawerStyle: {
        width: '80%',
        backgroundColor: theme.colors.background,
      }
    }}
    drawerContent={(props) => <CustomDrawerContent {...props} />}
  >
    <Drawer.Screen name="AdminTabs" component={AdminTabs} />
    <Drawer.Screen
      name="Menu"
      component={AdminMenuListScreen}
      options={{ headerShown: false }} // BrandingHeader handled in screen
    />
    <Drawer.Screen
      name="AdminSessionControl"
      component={AdminSessionControlScreen}
      options={{ headerShown: false }} // BrandingHeader handled in screen
    />
  </Drawer.Navigator>
);

// ... (rest of file)


const Navigation = () => {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return <BrandedSplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          user.role === 'admin' ? (
            // ADMIN FLOW - Including Menu Maintenance Screens
            <>
              <Stack.Screen name="AdminMain" component={AdminDrawer} />
              <Stack.Screen
                name="AdminPostAd"
                component={AdminPostAdScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="AdminEditMenu"
                component={AdminEditMenuScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            // STUDENT FLOW
            <>
              <Stack.Screen name="Main" component={AppTabs} />
              <Stack.Screen
                name="Cart"
                component={CartScreen}
                options={{ headerShown: false }} // BrandingHeader in component
              />
              <Stack.Screen
                name="Payment"
                component={PaymentScreen}
                options={{ headerShown: false }} // BrandingHeader in component
              />
              <Stack.Screen
                name="PaymentProof"
                component={PaymentProofScreen}
                options={{ headerShown: false }} // BrandingHeader in component
              />
              <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ presentation: 'transparentModal', headerShown: false }}
              />
              <Stack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{ headerShown: false }} // BrandingHeader in component
              />
            </>
          )
        ) : (
          // AUTH FLOW
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <WebSocketProvider>
              <Navigation />
            </WebSocketProvider>
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#d32f2f',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
