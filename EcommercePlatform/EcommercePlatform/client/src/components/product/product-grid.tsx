import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Product } from "@shared/schema";

interface ProductGridProps {
  categoryId?: number;
  featured?: boolean;
  search?: string;
  sort?: string;
  page?: number;
  onPageChange?: (page: number) => void;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ProductGrid = ({ 
  categoryId, 
  featured,
  search,
  sort,
  page = 1,
  onPageChange
}: ProductGridProps) => {
  // Build query string
  let queryString = '';
  if (categoryId) queryString += `&category=${categoryId}`;
  if (featured) queryString += `&featured=true`;
  if (search) queryString += `&search=${encodeURIComponent(search)}`;
  if (sort) queryString += `&sort=${sort}`;
  
  // Fetch products
  const { data, isLoading, error } = useQuery<ProductsResponse>({
    queryKey: [`/api/products?page=${page}&limit=12${queryString}`],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative my-4">
        <p>Error loading products: {error.message}</p>
      </div>
    );
  }

  if (!data || data.products.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-medium mb-2">No products found</h3>
        <p className="text-gray-500">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex rounded-md shadow">
            <Button
              variant="outline"
              size="icon"
              className="rounded-l-md"
              onClick={() => onPageChange && onPageChange(data.pagination.page - 1)}
              disabled={data.pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {[...Array(data.pagination.totalPages)].map((_, i) => {
              const pageNum = i + 1;
              // Show only current page, first/last page, and 1 page on either side of current
              if (
                pageNum === 1 || 
                pageNum === data.pagination.totalPages ||
                Math.abs(pageNum - data.pagination.page) <= 1
              ) {
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === data.pagination.page ? "default" : "outline"}
                    className="px-3 py-2"
                    onClick={() => onPageChange && onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              } else if (
                (pageNum === 2 && data.pagination.page > 3) ||
                (pageNum === data.pagination.totalPages - 1 && data.pagination.page < data.pagination.totalPages - 2)
              ) {
                // Show ellipsis
                return (
                  <Button key={`ellipsis-${pageNum}`} variant="outline" className="px-3 py-2" disabled>
                    ...
                  </Button>
                );
              }
              return null;
            })}
            
            <Button
              variant="outline"
              size="icon"
              className="rounded-r-md"
              onClick={() => onPageChange && onPageChange(data.pagination.page + 1)}
              disabled={data.pagination.page === data.pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
