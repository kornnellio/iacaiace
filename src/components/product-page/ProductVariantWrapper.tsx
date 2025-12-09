"use client";

import { useState } from "react";
import { ProductResponse } from "@/lib/database/models/models";
import ProductImageGallery from "./ProductImageGallery";
import ProductInfo from "./ProductInfo";
import { AverageRating } from "./AverageRating";

export function ProductVariantWrapper({
  product,
}: {
  product: ProductResponse;
}) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
      <ProductImageGallery
        variants={product.variants}
        selectedVariant={selectedVariant}
        onVariantChange={setSelectedVariant}
      />

      <div>
        <ProductInfo
          product={product}
          selectedVariant={selectedVariant}
          onVariantChange={setSelectedVariant}
        />
      </div>
    </div>
  );
}
