import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        loadCart();
    }, []);

    useEffect(() => {
        saveCart();
    }, [cartItems]);

    const loadCart = async () => {
        try {
            const storedCart = await AsyncStorage.getItem('cart');
            if (storedCart) {
                setCartItems(JSON.parse(storedCart));
            }
        } catch (error) {
            console.error('Failed to load cart', error);
        }
    };

    const saveCart = async () => {
        try {
            await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
        } catch (error) {
            console.error('Failed to save cart', error);
        }
    };

    const addToCart = (item) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((i) => i._id === item._id);
            if (existingItem) {
                return prevItems.map((i) =>
                    i._id === item._id ? { ...i, qty: i.qty + 1 } : i
                );
            }
            return [...prevItems, { ...item, qty: 1 }];
        });
    };

    const removeFromCart = (itemId) => {
        setCartItems((prevItems) => prevItems.filter((i) => i._id !== itemId));
    };

    const updateQuantity = (itemId, change) => {
        setCartItems((prevItems) =>
            prevItems.map((item) => {
                if (item._id === itemId) {
                    const newQty = Math.max(0, item.qty + change);
                    return { ...item, qty: newQty };
                }
                return item;
            }).filter((item) => item.qty > 0)
        );
    };

    const clearCart = async () => {
        setCartItems([]);
        await AsyncStorage.removeItem('cart');
    };

    const totalAmount = cartItems.reduce(
        (total, item) => total + item.price * item.qty,
        0
    );

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                totalAmount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
