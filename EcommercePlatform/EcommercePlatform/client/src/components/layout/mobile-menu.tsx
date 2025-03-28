import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const [location] = useLocation();
  const [showCategorySubmenu, setShowCategorySubmenu] = useState(false);

  const toggleCategorySubmenu = () => {
    setShowCategorySubmenu(!showCategorySubmenu);
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-white border-t border-slate-200">
      <div className="container mx-auto px-4">
        <ul className="py-3">
          <li className="py-2 border-b border-slate-100">
            <Link 
              href="/" 
              className={`font-medium ${location === "/" ? "text-primary" : ""}`}
              onClick={onClose}
            >
              Home
            </Link>
          </li>
          <li className="py-2 border-b border-slate-100">
            <button 
              className="flex items-center justify-between w-full font-medium"
              onClick={toggleCategorySubmenu}
            >
              Categories
              {showCategorySubmenu ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showCategorySubmenu && (
              <div className="pl-4 mt-2 space-y-2">
                <Link 
                  href="/products?category=1" 
                  className="block py-1 hover:text-primary"
                  onClick={onClose}
                >
                  Electronics
                </Link>
                <Link 
                  href="/products?category=2" 
                  className="block py-1 hover:text-primary"
                  onClick={onClose}
                >
                  Clothing
                </Link>
                <Link 
                  href="/products?category=3" 
                  className="block py-1 hover:text-primary"
                  onClick={onClose}
                >
                  Home & Kitchen
                </Link>
                <Link 
                  href="/products?category=4" 
                  className="block py-1 hover:text-primary"
                  onClick={onClose}
                >
                  Beauty
                </Link>
                <Link 
                  href="/products?category=5" 
                  className="block py-1 hover:text-primary"
                  onClick={onClose}
                >
                  Sports
                </Link>
              </div>
            )}
          </li>
          <li className="py-2 border-b border-slate-100">
            <Link 
              href="/products?new=true" 
              className="font-medium hover:text-primary"
              onClick={onClose}
            >
              New Arrivals
            </Link>
          </li>
          <li className="py-2 border-b border-slate-100">
            <Link 
              href="/products?sale=true" 
              className="font-medium hover:text-primary"
              onClick={onClose}
            >
              Deals
            </Link>
          </li>
          <li className="py-2">
            <Link 
              href="/contact" 
              className="font-medium hover:text-primary"
              onClick={onClose}
            >
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MobileMenu;
