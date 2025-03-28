import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ProductGrid from "@/components/product/product-grid";
import ProductFilters from "@/components/product/product-filters";
import { Category } from "@shared/schema";

const ProductsPage = () => {
  const [location] = useLocation();
  const [searchParams, setSearchParams] = useState<URLSearchParams>();
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [sort, setSort] = useState<string>("newest");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState<string | undefined>();
  
  // Fetch categories for the category name
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Function to get category name from categoryId
  const getCategoryName = (id: number): string => {
    const category = categories?.find(cat => cat.id === id);
    return category?.name || "Category";
  };

  // Parse URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    setSearchParams(params);
    
    const category = params.get("category");
    if (category) setCategoryId(parseInt(category, 10));
    
    const sortParam = params.get("sort");
    if (sortParam) setSort(sortParam);
    
    const pageParam = params.get("page");
    if (pageParam) setPage(parseInt(pageParam, 10));
    
    const searchParam = params.get("search");
    if (searchParam) setSearch(searchParam);
  }, [location]);

  // Update URL when filters change
  const updateUrl = () => {
    const params = new URLSearchParams();
    if (categoryId) params.set("category", categoryId.toString());
    if (sort) params.set("sort", sort);
    if (page > 1) params.set("page", page.toString());
    if (search) params.set("search", search);
    
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  };

  useEffect(() => {
    updateUrl();
  }, [categoryId, sort, page, search]);

  const handleCategoryChange = (newCategoryId?: number) => {
    setCategoryId(newCategoryId);
    // Reset to page 1 when changing category
    setPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    // Reset to page 1 when changing sort
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top when changing page
    window.scrollTo(0, 0);
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col mb-6">
          {search && (
            <h1 className="text-3xl font-bold">
              Search Results for "{search}"
            </h1>
          )}
          {!search && (
            <h1 className="text-3xl font-bold">
              {categoryId 
                ? search ? `Search Results in ${getCategoryName(categoryId)}` : `${getCategoryName(categoryId)} Products`
                : "All Products"}
            </h1>
          )}
          {categoryId && (
            <p className="text-slate-600 mt-2">Browse our collection of products in this category</p>
          )}
        </div>
        
        <ProductFilters
          categoryId={categoryId}
          onCategoryChange={handleCategoryChange}
          onSortChange={handleSortChange}
          sort={sort}
        />
        
        <ProductGrid
          categoryId={categoryId}
          search={search}
          sort={sort}
          page={page}
          onPageChange={handlePageChange}
        />
      </main>
      <Footer />
    </>
  );
};

export default ProductsPage;
