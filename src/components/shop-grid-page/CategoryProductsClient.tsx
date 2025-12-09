"use client";

import { useState, useEffect, useMemo } from "react";
import ProductSort from "./ProductSort";
import ProductGrid from "./ProductGrid";
import CategorySearchBar from "./CategorySearchBar";
import { ProductResponse } from "@/lib/database/models/models";
import { stripHtml } from "@/components/shared/HtmlContent";

interface CategoryProductsClientProps {
  products: ProductResponse[];
  categoryId?: string;
  categorySlug?: string;
}

export default function CategoryProductsClient({
  products,
  categoryId,
  categorySlug
}: CategoryProductsClientProps) {
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(query) || 
      product.shortDescription.toLowerCase().includes(query) ||
      product.variants.some(variant => variant.sku.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  // Sort the filtered products
  const sortedProducts = useMemo(
    () => sortProducts(filteredProducts, sortBy),
    [filteredProducts, sortBy]
  );

  // Clean the search query for display
  const cleanSearchQuery = stripHtml(searchQuery);

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold">Produse {categorySlug}</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <CategorySearchBar 
            categoryId={categoryId} 
            categorySlug={categorySlug} 
            className="w-full sm:w-64"
            onSearch={setSearchQuery}
          />
          <ProductSort
            defaultValue="newest"
            onSort={setSortBy}
          />
        </div>
      </div>

      <div className="text-gray-600 mb-8">
        {searchQuery && filteredProducts.length > 0 ? (
          <p>S-au găsit {filteredProducts.length} produse pentru "{cleanSearchQuery}"</p>
        ) : searchQuery && filteredProducts.length === 0 ? (
          <p>Nu s-au găsit produse pentru "{cleanSearchQuery}"</p>
        ) : (
          <p>Produsele noastre {categorySlug} sunt construite să reziste activităților tale, 
          păstrându-ți în același timp cel mai bun aspect!</p>
        )}
      </div>

      <ProductGrid products={sortedProducts} />
    </section>
  );
}

// Funcție ajutătoare pentru sortarea produselor
function sortProducts(products: ProductResponse[], sortBy: string) {
  switch (sortBy) {
    case "price-low":
      return [...products].sort(
        (a, b) => a.variants[0].price - b.variants[0].price
      );
    case "price-high":
      return [...products].sort(
        (a, b) => b.variants[0].price - a.variants[0].price
      );
    case "name":
      return [...products].sort((a, b) => a.name.localeCompare(b.name));
    case "discount":
      return [...products].sort(
        (a, b) =>
          b.variants[0].current_sale_percentage -
          a.variants[0].current_sale_percentage
      );
    default: // "newest"
      return products; // Presupunem că produsele sunt deja sortate după noutate în baza de date
  }
}
