import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Laptop, ShoppingBag, Home, Flower, Footprints, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/product-card";
import { Product, Category } from "@shared/schema";
import { Input } from "@/components/ui/input";
import Layout from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const HomePage = () => {
  const [email, setEmail] = useState("");

  // Fetch featured products
  const { data: featuredProducts } = useQuery<{ products: Product[] }>({
    queryKey: ['/api/products?featured=true&limit=4'],
  });

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch new arrival products
  const { data: newProducts } = useQuery<{ products: Product[] }>({
    queryKey: ['/api/products?sort=newest&limit=8'],
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you for subscribing with: ${email}`);
    setEmail("");
  };

  // Function to get the icon for a category
  const getCategoryIcon = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      laptop: <Laptop className="h-8 w-8 text-primary mb-3 transition-transform group-hover:scale-125" />,
      tshirt: <ShoppingBag className="h-8 w-8 text-primary mb-3 transition-transform group-hover:scale-125" />,
      home: <Home className="h-8 w-8 text-primary mb-3 transition-transform group-hover:scale-125" />,
      spa: <Flower className="h-8 w-8 text-primary mb-3 transition-transform group-hover:scale-125" />,
      running: <Footprints className="h-8 w-8 text-primary mb-3 transition-transform group-hover:scale-125" />,
    };
    
    return iconMap[iconName] || <ChevronRight className="h-8 w-8 text-primary mb-3 transition-transform group-hover:scale-125" />;
  };

  return (
    <>
      <Layout />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Summer Collection 2023</h1>
                <p className="text-slate-300 text-lg mb-6">Discover the latest trends with up to 40% off. Limited time offer.</p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/products">
                    <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                      Shop Now
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:block">
                <img 
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                  alt="Summer collection showcase" 
                  className="rounded-lg shadow-lg object-cover h-96 w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Category Browse */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Shop by Category</h2>
            <p className="text-slate-600 text-center mb-8">Click a category to see only products from that category</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories?.map((category) => (
                <Link key={category.id} href={`/products?category=${category.id}`}>
                  <div className="group cursor-pointer">
                    <div className="bg-slate-100 rounded-lg p-4 aspect-square flex flex-col items-center justify-center transition-all group-hover:bg-slate-200 hover:shadow-md relative overflow-hidden">
                      <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      {getCategoryIcon(category.icon)}
                      <span className="font-medium text-center">{category.name}</span>
                    </div>
                  </div>
                </Link>
              ))}
              <Link href="/products">
                <div className="group cursor-pointer">
                  <div className="bg-slate-100 rounded-lg p-4 aspect-square flex flex-col items-center justify-center transition-all group-hover:bg-slate-200 hover:shadow-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <ChevronRight className="h-8 w-8 text-primary mb-3 transition-transform group-hover:scale-125" />
                    <span className="font-medium text-center">View All</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-12 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts?.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Link href="/products">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  View All Products
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* New Arrivals */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">New Arrivals</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newProducts?.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Promo Banner */}
        <section className="py-12 bg-gradient-to-r from-primary to-teal-900 text-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Subscribe & Get 15% Off</h2>
                <p className="mb-6">Sign up for our newsletter and receive a special discount on your first order plus exclusive deals.</p>
                <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSubscribe}>
                  <Input
                    type="email"
                    placeholder="Your email address"
                    className="flex-grow px-4 py-3 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-white"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600 px-6 whitespace-nowrap">
                    Subscribe
                  </Button>
                </form>
              </div>
              <div className="hidden md:block text-center">
                <img 
                  src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1215&q=80" 
                  alt="Special offer" 
                  className="max-w-xs mx-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default HomePage;
