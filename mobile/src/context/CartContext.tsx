import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import { MenuItem } from '../types';

export interface CartItem extends MenuItem {
    quantity: number;
}

interface CartState {
    items: CartItem[];
    total: number;
}

type CartAction =
    | { type: 'ADD_ITEM'; payload: MenuItem }
    | { type: 'REMOVE_ITEM'; payload: number } // id
    | { type: 'CLEAR_CART' };

const CartContext = createContext<{
    state: CartState;
    addItem: (item: MenuItem) => void;
    removeItem: (id: number) => void;
    clearCart: () => void;
} | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
    switch (action.type) {
        case 'ADD_ITEM': {
            const existingItemIndex = state.items.findIndex((i) => i.id === action.payload.id);
            if (existingItemIndex > -1) {
                const newItems = [...state.items];
                newItems[existingItemIndex].quantity += 1;
                return {
                    ...state,
                    items: newItems,
                    total: state.total + action.payload.price,
                };
            }
            return {
                ...state,
                items: [...state.items, { ...action.payload, quantity: 1 }],
                total: state.total + action.payload.price,
            };
        }
        case 'REMOVE_ITEM': {
            const itemToRemove = state.items.find(i => i.id === action.payload);
            if (!itemToRemove) {return state;}

            // Remove entire item regardless of quantity (simple rule for now, or decrement?)
            // Let's implement DECREMENT 1 logic for better UX, or simple REMOVE?
            // Prompt says "Remove necessary components", logic isn't strictly defined.
            // Let's go with "Remove completely" for simplicity, or "Decrement" if > 1.
            // Doing Decrement.

            let newItems;
            let priceToDeduct = itemToRemove.price;

            if (itemToRemove.quantity > 1) {
                const existingItemIndex = state.items.findIndex((i) => i.id === action.payload);
                newItems = [...state.items];
                newItems[existingItemIndex].quantity -= 1;
            } else {
                newItems = state.items.filter((i) => i.id !== action.payload);
            }

            return {
                ...state,
                items: newItems,
                total: state.total - priceToDeduct,
            };
        }
        case 'CLEAR_CART':
            return { items: [], total: 0 };
        default:
            return state;
    }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

    const addItem = (item: MenuItem) => dispatch({ type: 'ADD_ITEM', payload: item });
    const removeItem = (id: number) => dispatch({ type: 'REMOVE_ITEM', payload: id });
    const clearCart = () => dispatch({ type: 'CLEAR_CART' });

    return (
        <CartContext.Provider value={{ state, addItem, removeItem, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {throw new Error('useCart must be used within a CartProvider');}
    return context;
};
