"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";
import type { CartItem } from "@/context/CartContext";

export default function Cart({ onClose }: { onClose: () => void }) {
  const { items, removeItem, updateQuantity } = useCart();

  const calculateItemPrice = (item: CartItem) => {
    let basePrice = item.selectedVariant.price;
    
    // If it's a clothing item with a size and has a specific price for that size
    if (item.size && item.selectedVariant.sizeStock) {
      const sizeStock = item.selectedVariant.sizeStock.find(s => s.size === item.size);
      if (sizeStock?.price) {
        basePrice = sizeStock.price;
      }
    }
    
    return basePrice * (1 - item.selectedVariant.current_sale_percentage / 100) * item.quantity;
  };

  const cartTotalPrice = items.reduce((total, item) => total + calculateItemPrice(item), 0);

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="cart-sheet-content">
        <div className="flex flex-col h-[100dvh]">
          <SheetHeader>
            <SheetTitle>Coș de cumpărături</SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Coșul tău este gol</p>
                <p className="text-gray-500">
                  Adaugă produse în coș pentru a continua cumpărăturile
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y pb-32">
                  {items.map((item) => {
                    const itemPrice = calculateItemPrice(item);
                    const sizeStock = item.size && item.selectedVariant.sizeStock 
                      ? item.selectedVariant.sizeStock.find(s => s.size === item.size)
                      : undefined;
                    const basePrice = sizeStock?.price || item.selectedVariant.price;
                    
                    // Calculate maxStock properly considering sizeStock for clothing items
                    let maxStock;
                    if (item.size && item.selectedVariant.sizeStock) {
                      // If it's a clothing item with size selected, use that size's stock
                      maxStock = sizeStock?.stock || 0;
                    } else if (item.product.isClothing && item.selectedVariant.sizeStock && !item.size) {
                      // If it's a clothing item with sizeStock but no size selected (shouldn't happen normally), 
                      // use the total from all sizes
                      maxStock = item.selectedVariant.sizeStock.reduce((total, sizeItem) => total + sizeItem.stock, 0);
                    } else {
                      // For non-clothing items, use currentStock
                      maxStock = item.selectedVariant.currentStock;
                    }
                    
                    // For items with manufacturer stock (0 stock), allow any quantity
                    const isManufacturerStock = maxStock === 0;

                    return (
                      <div
                        key={`${item.productId}-${item.variantId}-${item.size || ''}`}
                        className="flex gap-4 p-4 border-b min-w-0"
                      >
                        <div className="w-20 h-20 flex-shrink-0">
                          <img
                            src={item.selectedVariant.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-contain rounded"
                          />
                        </div>

                        <div className="flex flex-col justify-between flex-1 min-w-0 gap-2">
                          <div>
                            <h3 className="font-medium truncate">{item.product.name}</h3>
                            <p className="text-sm text-gray-500">
                              Culoare: {item.selectedVariant.color.name}
                            </p>
                            {item.size && (
                              <p className="text-sm text-gray-500">
                                Mărime: {item.size}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.selectedVariant.current_sale_percentage > 0 ? (
                                <>
                                  <span className="text-sm line-through text-gray-500 whitespace-nowrap">
                                    {(basePrice * item.quantity).toFixed(2)} RON
                                  </span>
                                  <span className="font-medium whitespace-nowrap">
                                    {itemPrice.toFixed(2)} RON
                                  </span>
                                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded whitespace-nowrap">
                                    -{item.selectedVariant.current_sale_percentage}%
                                  </span>
                                </>
                              ) : (
                                <span className="font-medium whitespace-nowrap">
                                  {itemPrice.toFixed(2)} RON
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 relative z-10">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 relative cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(
                                    item.productId,
                                    item.variantId,
                                    Math.max(1, item.quantity - 1),
                                    item.size
                                  );
                                }}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-4 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 relative cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isManufacturerStock || item.quantity < maxStock) {
                                    updateQuantity(
                                      item.productId,
                                      item.variantId,
                                      item.quantity + 1,
                                      item.size
                                    );
                                  } else {
                                    toast({
                                      title: "Stoc maxim atins",
                                      description: "Nu poți adăuga mai multe produse decât sunt disponibile în stoc",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end flex-shrink-0">
                          <button
                            onClick={() =>
                              removeItem(item.productId, item.variantId, item.size)
                            }
                            className="text-red-500 text-sm"
                          >
                            Elimină
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {items.length > 0 && (
                <div className="border-t bg-white sticky bottom-0 p-6">
                  <div className="flex justify-between mb-4">
                    <span className="font-semibold">Total:</span>
                    <span className="font-semibold">{cartTotalPrice.toFixed(2)} RON</span>
                  </div>
                  <Link href="/checkout" className="block">
                    <Button className="w-full" size="lg">
                      Finalizează Comanda
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>

      <style jsx global>{`
        :root {
          --cart-bottom-height: 120px;
          --sheet-margin: 24px;
        }
        
        /* Fix for button clickability */
        .cart-sheet-content button {
          pointer-events: auto !important; 
        }
        
        /* Ensure no overlap is blocking buttons */
        .cart-sheet-content .flex .items-center button {
          position: relative;
          z-index: 5;
        }
        
        /* Make the entire button area clickable */
        .cart-sheet-content .flex .items-center {
          position: relative;
          z-index: 10;
        }
      `}</style>
    </Sheet>
  );
}
