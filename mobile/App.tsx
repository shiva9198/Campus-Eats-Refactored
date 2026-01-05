import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, useColorScheme, View, ActivityIndicator } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import MenuScreen from './src/screens/MenuScreen';
import CartScreen from './src/screens/CartScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import OrderStatusScreen from './src/screens/OrderStatusScreen';
import LoginScreen from './src/screens/LoginScreen';
import { CartProvider } from './src/context/CartContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

type Screen = 'menu' | 'cart' | 'payment' | 'status';

function AppContent(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [activeOrderTotal, setActiveOrderTotal] = useState<number>(0);
  const { token, isLoading } = useAuth(); // Auth State

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
    return <LoginScreen />;
  }

  // 3. Authenticated App Flow
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

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      {currentScreen === 'menu' ? (
        <MenuScreen onGoToCart={() => setCurrentScreen('cart')} />
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
      ) : (
        // Fallback
        <MenuScreen onGoToCart={() => setCurrentScreen('cart')} />
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
  }
});

export default App;
