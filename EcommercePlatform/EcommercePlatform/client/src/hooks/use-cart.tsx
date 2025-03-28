import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { CartItem, Product } from "@shared/schema";

type CartItemWithProduct = CartItem & { product: Product };

interface CartContextType {
  isCartOpen: boolean;
  toggleCart: () => void;
  cartItems: CartItemWithProduct[];
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateCartItem: (cartItemId: number, quantity: number) => Promise<void>;
  removeCartItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Fetch cart items if user is logged in
  const { data: cartItems = [] } = useQuery<CartItemWithProduct[]>({
    queryKey: ['/api/cart'],
    enabled: !!user,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (data: { productId: number; quantity: number }) => {
      await apiRequest('POST', '/api/cart', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const updateCartItemMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      await apiRequest('PUT', `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const removeCartItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', '/api/cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const addToCart = async (productId: number, quantity = 1) => {
    await addToCartMutation.mutateAsync({ productId, quantity });
  };

  const updateCartItem = async (cartItemId: number, quantity: number) => {
    await updateCartItemMutation.mutateAsync({ id: cartItemId, quantity });
  };

  const removeCartItem = async (cartItemId: number) => {
    await removeCartItemMutation.mutateAsync(cartItemId);
  };

  const clearCart = async () => {
    await clearCartMutation.mutateAsync();
  };

  // Close cart when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isCartOpen && target.closest('[data-cart-sidebar]') === null) {
        setIsCartOpen(false);
      }
    };

    if (isCartOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCartOpen]);

  return (
    <CartContext.Provider
      value={{
        isCartOpen,
        toggleCart,
        cartItems,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
