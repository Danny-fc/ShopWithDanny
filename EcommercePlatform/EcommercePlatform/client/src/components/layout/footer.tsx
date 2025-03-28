import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Camera } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">ShopWithDanny</h3>
            <p className="mb-4">Your one-stop destination for quality products at affordable prices.</p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white">
                <Camera className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Shop */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products?new=true" className="hover:text-white">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/products?bestseller=true" className="hover:text-white">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link href="/products?sale=true" className="hover:text-white">
                  Sale
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white">
                  All Products
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          {/* My Account */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">My Account</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/auth" className="hover:text-white">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-white">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white">
                  Order History
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white">
                  Wish List
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="bg-slate-950 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} ShopWithDanny. All rights reserved.</p>
            <div className="mt-4 md:mt-0">
              <div className="flex space-x-4">
                <Link href="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-white">
                  Terms of Service
                </Link>
                <Link href="/cookies" className="hover:text-white">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
