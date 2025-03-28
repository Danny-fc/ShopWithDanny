import { useState } from "react";
import { Link } from "wouter";
import { X, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const CartSidebar = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    isCartOpen, 
    toggleCart, 
    cartItems, 
    updateCartItem, 
    removeCartItem 
  } = useCart();
  
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const handleUpdateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    
    setIsUpdating(id);
    updateCartItem(id, quantity)
      .finally(() => setIsUpdating(null));
  };

  const handleRemoveItem = (id: number) => {
    removeCartItem(id);
  };

  const subtotal = cartItems.reduce((total, item) => {
    return total + (Number(item.product.price) * item.quantity);
  }, 0);

  const shippingCost = subtotal > 0 ? 9.99 : 0;
  const taxRate = 0.08; // 8% tax
  const tax = subtotal * taxRate;
  const total = subtotal + shippingCost + tax;

  const handleCheckout = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in before checkout",
        variant: "destructive",
      });
      toggleCart();
      return;
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
      isCartOpen ? "translate-x-0" : "translate-x-full"
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            Your Cart ({cartItems.length})
          </h2>
          <Button variant="ghost" size="sm" onClick={toggleCart}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center p-4">
            <div className="text-center">
              <h3 className="font-medium text-lg mb-2">Your cart is empty</h3>
              <p className="text-slate-500 mb-4">Add items to your cart to see them here</p>
              <Button onClick={toggleCart}>
                Continue Shopping
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto p-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center py-4 border-b border-slate-200">
                <img 
                  src={item.product.imageUrl} 
                  alt={item.product.name} 
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="ml-4 flex-grow">
                  <h3 className="font-medium">{item.product.name}</h3>
                  <div className="flex items-center mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-md"
                      disabled={isUpdating === item.id}
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="mx-2">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-md"
                      disabled={isUpdating === item.id}
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                    <span className="font-bold ml-auto">
                      ${(Number(item.product.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-slate-400 hover:text-slate-600"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Summary */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="font-medium">${shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <Link href="/checkout" onClick={toggleCart}>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Proceed to Checkout
              </Button>
            </Link>
            <Button 
              variant="link" 
              className="w-full mt-3" 
              onClick={toggleCart}
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;
