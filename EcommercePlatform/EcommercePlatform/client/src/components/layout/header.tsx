import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, User, ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import CartSidebar from "@/components/cart/cart-sidebar";
import MobileMenu from "@/components/layout/mobile-menu";

const Header = () => {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { cartItems, toggleCart, isCartOpen } = useCart();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
    if (showMobileSearch) setShowMobileSearch(false);
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    if (showMobileMenu) setShowMobileMenu(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        {/* Top Header */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-primary">
            ShopWithDanny
          </Link>
          
          {/* Search Bar (Medium+ screens) */}
          <div className="hidden md:block flex-grow max-w-md mx-6">
            <form className="relative" onSubmit={handleSearch}>
              <Input
                type="text"
                placeholder="Search for products..."
                className="w-full py-2 px-4 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
          
          {/* Icons */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={toggleMobileSearch}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {user ? (
              <div className="relative group">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
                <div className="absolute right-0 w-48 bg-white shadow-lg rounded-md mt-2 py-2 z-50 hidden group-hover:block">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-medium text-gray-800">
                      {user.firstName || user.username}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <Link href="/account" className="block px-4 py-2 hover:bg-gray-100">
                    My Account
                  </Link>
                  <Link href="/orders" className="block px-4 py-2 hover:bg-gray-100">
                    Orders
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/auth">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative" 
              onClick={toggleCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 rounded-full text-white text-xs w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={toggleMobileMenu}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="hidden md:block border-t border-slate-200">
          <ul className="flex space-x-8 py-3">
            <li>
              <Link 
                href="/" 
                className={`font-medium hover:text-primary transition-colors ${
                  location === "/" ? "text-primary" : ""
                }`}
              >
                Home
              </Link>
            </li>
            <li className="relative group">
              <Link 
                href="/products" 
                className={`flex items-center font-medium hover:text-primary transition-colors ${
                  location.startsWith("/products") ? "text-primary" : ""
                }`}
              >
                Categories <span className="ml-1 text-xs">▼</span>
              </Link>
              {/* Dropdown */}
              <div className="absolute hidden group-hover:block w-48 bg-white shadow-lg rounded-md mt-2 py-2 z-50">
                <Link href="/products?category=1" className="block px-4 py-2 hover:bg-slate-100">
                  Electronics
                </Link>
                <Link href="/products?category=2" className="block px-4 py-2 hover:bg-slate-100">
                  Clothing
                </Link>
                <Link href="/products?category=3" className="block px-4 py-2 hover:bg-slate-100">
                  Home & Kitchen
                </Link>
                <Link href="/products?category=4" className="block px-4 py-2 hover:bg-slate-100">
                  Beauty
                </Link>
                <Link href="/products?category=5" className="block px-4 py-2 hover:bg-slate-100">
                  Sports
                </Link>
              </div>
            </li>
            <li>
              <Link 
                href="/products?new=true" 
                className="font-medium hover:text-primary transition-colors"
              >
                New Arrivals
              </Link>
            </li>
            <li>
              <Link 
                href="/products?sale=true" 
                className="font-medium hover:text-primary transition-colors"
              >
                Deals
              </Link>
            </li>
            <li>
              <Link 
                href="/contact" 
                className="font-medium hover:text-primary transition-colors"
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* Mobile Search (Initially Hidden) */}
        {showMobileSearch && (
          <div className="md:hidden py-3 border-t border-slate-200">
            <form className="relative" onSubmit={handleSearch}>
              <Input
                type="text"
                placeholder="Search for products..."
                className="w-full py-2 px-4 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
      
      {/* Mobile Menu */}
      <MobileMenu isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
      
      {/* Cart Sidebar */}
      <CartSidebar />
    </header>
  );
};

export default Header;
