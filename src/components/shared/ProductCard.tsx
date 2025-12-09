"use client";

import { ProductResponse } from "@/lib/database/models/models";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import Link from "next/link";
import { generateSlug } from "@/lib/utils";
import { stripHtml } from "./HtmlContent";

interface ProductCardProps {
  product: ProductResponse;
}

export default function ProductCard({ product }: ProductCardProps) {
  const firstVariant = product.variants[0];
  const currentPrice =
    firstVariant.price * (1 - firstVariant.current_sale_percentage / 100);

  // Calculate actual stock for clothing items
  const calculateActualStock = () => {
    // For clothing items, calculate the total stock across all variants and sizes
    if (product.isClothing) {
      // Calculate total stock across all color variants
      return product.variants.reduce((totalStock, variant) => {
        // If variant has sizeStock, sum all sizes for this variant
        if (variant.sizeStock) {
          return totalStock + variant.sizeStock.reduce((variantTotal, sizeItem) => 
            variantTotal + sizeItem.stock, 0);
        }
        // If no sizeStock, use the variant's currentStock
        return totalStock + variant.currentStock;
      }, 0);
    }
    
    // For non-clothing items, check if ANY variant has stock
    // This prevents showing "În stoc la producător" when some color variants have stock
    const hasAnyVariantInStock = product.variants.some(variant => variant.currentStock > 0);
    
    if (!hasAnyVariantInStock) {
      // If no variants have stock, return 0 to indicate it's a manufacturer stock item
      return 0;
    }
    
    // For non-clothing items, return the sum of all variant stocks
    // or the stock of the variant with the highest stock if you want to be more conservative
    return product.variants.reduce((totalStock, variant) => totalStock + variant.currentStock, 0);
  };

  const actualStock = calculateActualStock();

  // Generate URL-friendly slugs from names
  const categorySlug = generateSlug(product.categoryName);
  const subcategorySlug = generateSlug(product.subcategoryName);
  const productSlug = generateSlug(product.name);

  return (
    <Link
      href={`/${categorySlug}/${subcategorySlug}/${productSlug}`}
      className="group"
    >
      <Card className="product-card relative h-full transition-transform duration-300 hover:scale-[1.02]">
        <CardContent className="p-4">
          <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-white">
            <img
              src={firstVariant.images[0]}
              alt={product.name}
              className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
            <button
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors z-10"
              onClick={(e) => {
                e.preventDefault();
                // Add wishlist functionality here
              }}
            >
              <Heart className="w-5 h-5" />
            </button>
            {firstVariant.current_sale_percentage > 0 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 text-sm rounded">
                -{firstVariant.current_sale_percentage}%
              </div>
            )}
          </div>

          <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors">
            {stripHtml(product.name)}
          </h3>
          <div className="text-sm text-gray-500 mb-2">
            {stripHtml(product.categoryName)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {currentPrice.toFixed(2)} lei
              </span>
              {firstVariant.current_sale_percentage > 0 && (
                <span className="text-gray-500 line-through text-sm">
                  {firstVariant.price.toFixed(2)} lei
                </span>
              )}
            </div>
            {actualStock === 0 ? (
              <span className="text-sm text-blue-600">
                În stoc la producător
              </span>
            ) : actualStock < 10 ? (
              <span className="text-sm text-orange-500">
                Doar {actualStock} în stoc
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
