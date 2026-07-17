UNIVERSAL NRG-CO HEADER BLOCK
Use this exact banner at the top of source files. License/covenant terms still apply.

################################################################
#                                                              #
#                ⚡  N R G - C O  ⚡                          #
#                                                              #
#    CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL              #
#    PROPRIETARY / UNDER DEVELOPMENT / SECRET                   #
#                                                              #
################################################################
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [needsDelivery, setNeedsDelivery] = useState(true);

  const toggleDelivery = () => setNeedsDelivery(prev => !prev);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('dirtplace_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dirtplace_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (material, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === material.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === material.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevCart, { ...material, quantity }];
    });
  };

  const removeFromCart = (materialId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== materialId));
  };

  const updateQuantity = (materialId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(materialId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === materialId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.pricePerCubicYard * item.quantity), 0);
  };

  const getItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getItemCount,
        needsDelivery,
        toggleDelivery
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
