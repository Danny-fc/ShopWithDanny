import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Star, StarHalf, Heart, Minus, Plus, ArrowLeft } from "lucide-react";
import { Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import ProductGrid from "@/components/product/product-grid";

const ProductDetailPage = () => {
  const { id } = useParams();
  const productId = parseInt(id, 10);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch product details
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
  });

  const handleAddToCart = async () => {
    try {
      await addToCart(productId, quantity);
      toast({
        title: "Added to cart",
        description: `${product?.name} has been added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Failed to add to cart",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: `${product?.name} has been ${isFavorite ? "removed from" : "added to"} your favorites`,
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
          <Star key={`full-${i}`} className="h-5 w-5 fill-current" />
        ))}
        {hasHalfStar && <StarHalf className="h-5 w-5 fill-current" />}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-slate-200 h-96 rounded-lg"></div>
              <div>
                <div className="h-8 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-6"></div>
                <div className="h-24 bg-slate-200 rounded mb-6"></div>
                <div className="h-12 bg-slate-200 rounded mb-6"></div>
                <div className="h-10 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-12 bg-slate-200 rounded mb-6"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Error loading product</h2>
            <p>{error instanceof Error ? error.message : "Product not found"}</p>
            <Link href="/products">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/products">
            <Button variant="ghost" className="pl-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div>
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-96 object-contain p-4"
              />
            </div>
          </div>
          
          {/* Product Details */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            
            <div className="flex items-center mb-4">
              {renderRatingStars(product.rating.toString())}
              <span className="ml-2 text-gray-600">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>
            
            <div className="text-2xl font-bold mb-4">
              ${Number(product.price).toFixed(2)}
              {product.oldPrice && (
                <span className="ml-3 text-lg text-gray-500 line-through">
                  ${Number(product.oldPrice).toFixed(2)}
                </span>
              )}
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">{product.description}</p>
            </div>
            
            {product.inStock ? (
              <div className="flex items-center mb-4 text-green-600">
                <span className="h-3 w-3 bg-green-600 rounded-full inline-block mr-2"></span>
                In Stock
              </div>
            ) : (
              <div className="flex items-center mb-4 text-red-600">
                <span className="h-3 w-3 bg-red-600 rounded-full inline-block mr-2"></span>
                Out of Stock
              </div>
            )}
            
            {product.inStock && (
              <>
                <div className="flex items-center mb-6">
                  <span className="mr-3">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center">{quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10"
                      onClick={() => handleQuantityChange(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Button 
                    className="flex-1" 
                    size="lg"
                    onClick={handleAddToCart}
                  >
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className={isFavorite ? "text-red-500 border-red-500" : ""}
                    onClick={toggleFavorite}
                  >
                    <Heart className={`h-5 w-5 mr-2 ${isFavorite ? "fill-current" : ""}`} />
                    {isFavorite ? "Saved" : "Save"}
                  </Button>
                </div>
              </>
            )}
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold mb-2">Product Details:</h3>
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                <li>High-quality materials</li>
                <li>Durable construction</li>
                <li>30-day money-back guarantee</li>
                <li>1-year warranty</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
          <ProductGrid categoryId={product.categoryId} limit={4} />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetailPage;
