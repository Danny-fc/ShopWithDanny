import { useState } from "react";
import { Link } from "wouter";
import { Heart, ShoppingCart, Star, StarHalf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "@/components/ui/badge";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the cart button
    e.stopPropagation();
    
    setIsAddingToCart(true);
    addToCart(product.id)
      .then(() => {
        toast({
          title: "Added to cart",
          description: `${product.name} has been added to your cart`,
        });
      })
      .catch((error) => {
        toast({
          title: "Failed to add to cart",
          description: error.message,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsAddingToCart(false);
      });
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: `${product.name} has been ${isFavorite ? "removed from" : "added to"} your favorites`,
    });
  };

  // Generate star rating display
  const renderRatingStars = (rating: string) => {
    const ratingValue = parseFloat(rating);
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;
    
    return (
      <div className="flex text-yellow-400">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-current" />
        ))}
        {hasHalfStar && <StarHalf className="h-4 w-4 fill-current" />}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
      </div>
    );
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-200 h-full">
        <div className="relative">
          <img 
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
          {product.isNew && (
            <Badge className="absolute top-2 left-2 bg-orange-500">NEW</Badge>
          )}
          {product.isSale && (
            <Badge className="absolute top-2 left-2 bg-orange-500">SALE</Badge>
          )}
          {product.isPopular && (
            <Badge className="absolute top-2 left-2 bg-orange-500">POPULAR</Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-2 right-2 bg-white rounded-full p-1.5 ${
              isFavorite ? "text-red-500" : "text-slate-600 hover:text-primary"
            }`}
            onClick={toggleFavorite}
          >
            <Heart className={isFavorite ? "fill-current" : ""} size={16} />
          </Button>
        </div>
        <div className="p-4">
          <div className="flex items-center mb-2">
            {renderRatingStars(product.rating.toString())}
            <span className="text-sm text-slate-500 ml-2">
              {product.rating} ({product.reviews})
            </span>
          </div>
          <h3 className="font-semibold mb-1">{product.name}</h3>
          <p className="text-slate-600 text-sm mb-3">{product.description}</p>
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold text-lg">${Number(product.price).toFixed(2)}</span>
              {product.oldPrice && (
                <span className="text-slate-500 text-sm line-through ml-2">
                  ${Number(product.oldPrice).toFixed(2)}
                </span>
              )}
            </div>
            <Button
              size="icon"
              className="bg-primary hover:bg-teal-800 text-white" 
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
