import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Category } from "@shared/schema";
import { Laptop, ShoppingBag, Home, Flower, Footprints } from "lucide-react";

interface ProductFiltersProps {
  categoryId?: number;
  onCategoryChange: (categoryId?: number) => void;
  onSortChange: (sort: string) => void;
  sort?: string;
}

const ProductFilters = ({
  categoryId,
  onCategoryChange,
  onSortChange,
  sort = 'newest',
}: ProductFiltersProps) => {
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(categoryId);
  const [selectedSort, setSelectedSort] = useState<string>(sort);

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Update parent component when filters change
  useEffect(() => {
    onCategoryChange(selectedCategory);
  }, [selectedCategory, onCategoryChange]);

  useEffect(() => {
    onSortChange(selectedSort);
  }, [selectedSort, onSortChange]);

  // Function to get the icon for a category
  const getCategoryIcon = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      laptop: <Laptop className="h-4 w-4 mr-2" />,
      tshirt: <ShoppingBag className="h-4 w-4 mr-2" />,
      home: <Home className="h-4 w-4 mr-2" />,
      spa: <Flower className="h-4 w-4 mr-2" />,
      running: <Footprints className="h-4 w-4 mr-2" />,
    };
    
    return iconMap[iconName] || null;
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium mb-4">Filter Products</h3>
      <div className="flex flex-col md:flex-row md:justify-between gap-6">
        <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
          <Button
            size="lg"
            variant={!selectedCategory ? "default" : "outline"}
            onClick={() => setSelectedCategory(undefined)}
            className="border-2 font-medium"
          >
            All Products
          </Button>
          
          {categories?.map((category) => (
            <Button
              key={category.id}
              size="lg"
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className={`border-2 font-medium ${selectedCategory === category.id ? 'shadow-md' : ''}`}
            >
              {getCategoryIcon(category.icon)}
              {category.name}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center">
          <label className="mr-2 text-slate-700 font-medium">Sort by:</label>
          <Select value={selectedSort} onValueChange={setSelectedSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {selectedCategory && categories && (
        <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-200">
          <p className="text-sm text-slate-600">
            Showing products in the <span className="font-semibold">{categories.find(c => c.id === selectedCategory)?.name}</span> category. 
            <button 
              onClick={() => setSelectedCategory(undefined)}
              className="ml-2 text-primary hover:underline"
            >
              Clear filter
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
