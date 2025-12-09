"use client";

import { ProductResponse } from "@/lib/database/models/models";
import ProductCard from "@/components/shared/ProductCard";

interface ProductGridProps {
  products: ProductResponse[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}
