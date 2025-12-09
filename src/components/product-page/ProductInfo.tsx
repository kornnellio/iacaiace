"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductResponse } from "@/lib/database/models/models";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { AverageRating } from "./AverageRating";
import HtmlContent, { stripHtml } from "@/components/shared/HtmlContent";
import PaddleConfigurator from "./PaddleConfigurator";

interface ProductVariant {
  id: string;
  sku: string;
  color: {
    name: string;
    hex: string;
  };
  price: number;
  current_sale_percentage: number;
  currentStock: number;
  sizeStock?: {
    size: string;
    stock: number;
    price?: number;
  }[];
  images: string[];
}

interface ProductInfoProps {
  product: ProductResponse;
  selectedVariant: ProductVariant;
  onVariantChange: (variant: ProductVariant) => void;
}

export default function ProductInfo({
  product,
  selectedVariant,
  onVariantChange,
}: ProductInfoProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.isClothing && product.sizingGuide?.rows[0]
      ? product.sizingGuide.rows[0].size
      : null
  );
  const [paddleConfiguration, setPaddleConfiguration] = useState<any>(null);
  const { addItem } = useCart();
  const router = useRouter();

  // Get price for the selected size or default variant price
  const getSizePrice = (size: string | null) => {
    if (!product.isClothing || !size) return selectedVariant.price;
    const sizeStock = selectedVariant.sizeStock?.find(s => s.size === size);
    return sizeStock?.price || selectedVariant.price;
  };

  const basePrice = getSizePrice(selectedSize);
  // Add paddle configuration price if applicable
  const paddleConfigPrice = paddleConfiguration?.finalPrice || 0;
  const finalBasePrice = product.isPaddle && paddleConfiguration ? paddleConfigPrice : basePrice;
  const currentPrice = finalBasePrice * (1 - selectedVariant.current_sale_percentage / 100);

  // Get available stock for the selected size
  const getStockForSize = (size: string) => {
    if (!product.isClothing) return selectedVariant.currentStock;
    const sizeStock = selectedVariant.sizeStock?.find(s => s.size === size);
    return sizeStock?.stock || 0;
  };

  // Calculate the total stock for clothing items based on sizeStock
  const getTotalStockForClothing = () => {
    if (!product.isClothing || !selectedVariant.sizeStock) return selectedVariant.currentStock;
    
    // For clothing items with sizeStock, calculate total stock from all sizes
    return selectedVariant.sizeStock.reduce((total, sizeItem) => total + sizeItem.stock, 0);
  };

  const currentStock = selectedSize
    ? getStockForSize(selectedSize)
    : product.isClothing && selectedVariant.sizeStock
      ? getTotalStockForClothing()
      : selectedVariant.currentStock;

  const handleAddToCart = () => {
    if (product.isClothing && !selectedSize) {
      toast({
        title: "Vă rugăm să selectați o mărime",
        description: "Trebuie să selectați o mărime înainte de a adăuga în coș",
        variant: "destructive",
      });
      return;
    }

    if (product.isPaddle && product.paddleConfigurator?.enabled && !paddleConfiguration) {
      toast({
        title: "Vă rugăm să configurați vasla",
        description: "Trebuie să configurați vasla înainte de a adăuga în coș",
        variant: "destructive",
      });
      return;
    }

    const sizePrice = selectedSize ? getSizePrice(selectedSize) : selectedVariant.price;
    const finalPrice = product.isPaddle && paddleConfiguration ? paddleConfiguration.finalPrice : sizePrice;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      quantity: 1,
      product,
      selectedVariant: {
        ...selectedVariant,
        price: finalPrice
      },
      size: selectedSize || undefined,
      paddleConfiguration: paddleConfiguration || undefined,
    });
    toast({
      title: "Adăugat în coș",
      description: `${product.name} a fost adăugat în coș`,
    });
  };

  const handleBuyNow = () => {
    if (product.isClothing && !selectedSize) {
      toast({
        title: "Vă rugăm să selectați o mărime",
        description: "Trebuie să selectați o mărime înainte de a continua la checkout",
        variant: "destructive",
      });
      return;
    }

    if (product.isPaddle && product.paddleConfigurator?.enabled && !paddleConfiguration) {
      toast({
        title: "Vă rugăm să configurați vasla",
        description: "Trebuie să configurați vasla înainte de a continua la checkout",
        variant: "destructive",
      });
      return;
    }

    const sizePrice = selectedSize ? getSizePrice(selectedSize) : selectedVariant.price;
    const finalPrice = product.isPaddle && paddleConfiguration ? paddleConfiguration.finalPrice : sizePrice;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      quantity: 1,
      product,
      selectedVariant: {
        ...selectedVariant,
        price: finalPrice
      },
      size: selectedSize || undefined,
      paddleConfiguration: paddleConfiguration || undefined,
    });
    router.push("/checkout");
  };

  return (
    <div className="space-y-6">
      {/* Product Title and Rating */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{stripHtml(product.name)}</h1>
        <AverageRating productId={product.id} />
      </div>

      {/* Price Display */}
      <div className="flex items-baseline gap-2 mb-6">
        {selectedVariant.current_sale_percentage > 0 ? (
          <>
            <span className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat("ro-RO", {
                style: "currency",
                currency: "RON",
              }).format(currentPrice)}
            </span>
            <span className="text-lg text-gray-500 line-through">
              {new Intl.NumberFormat("ro-RO", {
                style: "currency",
                currency: "RON",
              }).format(finalBasePrice)}
            </span>
            <span className="text-sm font-medium text-red-600 ml-2">
              (-{selectedVariant.current_sale_percentage}%)
            </span>
          </>
        ) : (
          <span className="text-2xl font-bold">
            {new Intl.NumberFormat("ro-RO", {
              style: "currency",
              currency: "RON",
            }).format(currentPrice)}
          </span>
        )}
      </div>

      {/* Short Description */}
      <HtmlContent
        html={product.shortDescription}
        className="prose"
      />

      {/* Color Selection */}
      <div>
        <h3 className="font-semibold mb-3">Culori Disponibile</h3>
        <div className="flex gap-3">
          {product.variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => onVariantChange(variant)}
              className={cn(
                "w-12 h-12 rounded-lg border-2 p-0.5 transition-colors",
                selectedVariant.id === variant.id
                  ? "border-black"
                  : "border-transparent hover:border-gray-200"
              )}
            >
              <div
                className="w-full h-full rounded"
                style={{ backgroundColor: variant.color.hex }}
                title={variant.color.name}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Size Selection for Clothing Items */}
      {product.isClothing && selectedVariant.sizeStock && (
        <div>
          <h3 className="font-semibold mb-3">Selectează Mărimea</h3>
          <div className="flex flex-wrap gap-2">
            {selectedVariant.sizeStock.map(({ size, stock }) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                disabled={false}
                className={cn(
                  "px-4 py-2 rounded-md border-2 transition-colors",
                  selectedSize === size
                    ? "border-black bg-black text-white"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {size}
                {stock === 0 && <span className="ml-2">(În stoc la producător)</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paddle Configurator */}
      {product.isPaddle && product.paddleConfigurator?.enabled && (
        <div>
          <PaddleConfigurator
            product={product}
            selectedVariant={selectedVariant}
            onConfigurationChange={setPaddleConfiguration}
          />
        </div>
      )}

      {/* Stock Status */}
      {currentStock < 10 && currentStock > 0 && (
        <div className="text-orange-500">
          Doar {currentStock} produse rămase în stoc!
        </div>
      )}

      {currentStock === 0 && (
        <div className="text-blue-600 my-2">
          În stoc la producător, livrare în 7 zile lucrătoare.
          {!product.categoryName.toLowerCase().includes('caiac') && (
            <p className="text-sm text-gray-600 mt-1">
              Cost transport: 30 EUR pentru produse care nu sunt în stoc la depozitul nostru din București.
            </p>
          )}
        </div>
      )}

      {/* Shipping Information - Hide if current stock is 0 (in stoc la producator) */}
      {currentStock > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Informații livrare</h3>
          {product.categoryName.toLowerCase().includes('caiac') ? (
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Ridicare din depozitul nostru din București</p>
              <p>• Livrare specială cu mașina iaCaiace</p>
              <p className="text-xs mt-2">* Pentru detalii suplimentare despre livrare, vă rugăm să ne contactați.</p>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Livrare prin curier Sameday</p>
              <p>• Cost livrare: 20 RON</p>
              <p>• Timp estimat de livrare: 1-3 zile lucrătoare</p>
              <p>• Pentru produsele care nu sunt în stoc la depozitul nostru: 7 zile lucrătoare + cost adițional de transport</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={handleAddToCart}
        >
          {currentStock === 0 ? "Adaugă în Coș (Livrare în 7 zile)" : "Adaugă în Coș"}
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={handleBuyNow}
        >
          Cumpără Acum
        </Button>
      </div>
    </div>
  );
}
