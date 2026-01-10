import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, useColorScheme, View, ActivityIndicator } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import MenuScreen from './src/screens/MenuScreen';
import CartScreen from './src/screens/CartScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import OrderStatusScreen from './src/screens/OrderStatusScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import { CartProvider } from './src/context/CartContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AdminNavigator from './src/navigation/AdminNavigator';


type Screen = 'menu' | 'cart' | 'payment' | 'status' | 'profile' | 'history';

function AppContent(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [activeOrderTotal, setActiveOrderTotal] = useState<number>(0);
  const { token, userRole, isLoading } = useAuth(); // Auth State

  const backgroundStyle = {

    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <View style={[styles.center, backgroundStyle]}>
        <ActivityIndicator size="large" color="#FF4B3A" />
      </View>
    );
  }

  // 2. Auth Gate
  if (!token) {
    if (authMode === 'register') {
      return <RegisterScreen onSwitchToLogin={() => setAuthMode('login')} />;
    }
    return <LoginScreen onSwitchToRegister={() => setAuthMode('register')} />;
  }

  // 3. Authenticated App Flow

  // Admin Route
  if (userRole === 'admin') {
    return (
      <SafeAreaView style={backgroundStyle}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AdminNavigator />
      </SafeAreaView>
    );
  }

  // Student Route
  const handleOrderPlaced = (orderId: number, total: number) => {

    setActiveOrderId(orderId);
    setActiveOrderTotal(total);
    setCurrentScreen('payment');
  };

  const handlePaymentSubmitted = () => {
    setCurrentScreen('status');
  };

  const handleBackToMenu = () => {
    // setActiveOrderId(null);
    setCurrentScreen('menu');
  };

  const handleViewOrder = (orderId: number) => {
    setActiveOrderId(orderId);
    setCurrentScreen('status');
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      {currentScreen === 'menu' ? (
        <MenuScreen
          onGoToCart={() => setCurrentScreen('cart')}
          onGoToProfile={() => setCurrentScreen('profile')}
          onGoToHistory={() => setCurrentScreen('history')}
        />
      ) : currentScreen === 'cart' ? (
        <CartScreen
          onBack={() => setCurrentScreen('menu')}
          onOrderPlaced={handleOrderPlaced}
        />
      ) : currentScreen === 'payment' && activeOrderId ? (
        <PaymentScreen
          orderId={activeOrderId}
          total={activeOrderTotal}
          onPaymentSubmitted={handlePaymentSubmitted}
        />
      ) : currentScreen === 'status' && activeOrderId ? (
        <OrderStatusScreen
          orderId={activeOrderId}
          onHome={handleBackToMenu}
        />
      ) : currentScreen === 'profile' ? (
        <ProfileScreen onBack={handleBackToMenu} />
      ) : currentScreen === 'history' ? (
        <OrderHistoryScreen onBack={handleBackToMenu} onSelectOrder={handleViewOrder} />
      ) : (
        // Fallback
        <MenuScreen
          onGoToCart={() => setCurrentScreen('cart')}
          onGoToProfile={() => setCurrentScreen('profile')}
          onGoToHistory={() => setCurrentScreen('history')}
        />
      )}
    </SafeAreaView>
  );
}

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
