"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { AlertCircle, Minus, Plus, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

export default function OrderSummary() {
  const { items, totalPrice, paymentMethod, appliedCoupon, applyCoupon, removeCoupon, updateQuantity, removeItem } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  
  // Separate items by delivery type
  const allKayakItems = items.filter(item => item.product.categoryName.toLowerCase().includes('caiac'));
  const regularItems = items.filter(item => !item.product.categoryName.toLowerCase().includes('caiac'));
  
  // Identify items with manufacturer stock (zero stock)
  const manufacturerStockItems = items.filter(item => {
    if (item.size) {
      const sizeStock = item.selectedVariant.sizeStock?.find(s => s.size === item.size);
      return sizeStock && sizeStock.stock <= 0;
    }
    return item.selectedVariant.currentStock <= 0;
  });
  const hasManufacturerStockItems = manufacturerStockItems.length > 0;
  
  // Filter kayak items in stock (not manufacturer stock)
  const kayakInStockItems = allKayakItems.filter(item => {
    if (item.size) {
      const sizeStock = item.selectedVariant.sizeStock?.find(s => s.size === item.size);
      return sizeStock && sizeStock.stock > 0;
    }
    return item.selectedVariant.currentStock > 0;
  });
  const hasKayak = kayakInStockItems.length > 0;
  
  // Filter regular items that are in stock (not manufacturer stock)
  const regularInStockItems = regularItems.filter(item => {
    if (item.size) {
      const sizeStock = item.selectedVariant.sizeStock?.find(s => s.size === item.size);
      return sizeStock && sizeStock.stock > 0;
    }
    return item.selectedVariant.currentStock > 0;
  });
  const hasRegularItems = regularInStockItems.length > 0;
  const hasRegularInStockItems = regularInStockItems.length > 0;
  
  // Calculate shipping costs
  // Only apply Sameday courier cost if there are regular in-stock items
  const baseShippingCost = paymentMethod === "PICKUP" ? 0 : (hasRegularInStockItems ? 20 : 0);
  // Add €30 (150 RON) additional shipping for manufacturer stock items
  const manufacturerShippingCost = hasManufacturerStockItems && paymentMethod !== "PICKUP" ? 150 : 0;
  const totalShippingCost = baseShippingCost + manufacturerShippingCost;

  // Calculate subtotal with sale prices applied
  const subtotal = items.reduce((total, item) => {
    const priceAfterSale = item.selectedVariant.current_sale_percentage > 0
      ? item.selectedVariant.price * (1 - item.selectedVariant.current_sale_percentage / 100)
      : item.selectedVariant.price;
    return total + (priceAfterSale * item.quantity);
  }, 0);

  // Reapply coupon when cart items change
  useEffect(() => {
    const reapplyCoupon = async () => {
      if (appliedCoupon) {
        const result = await applyCoupon(appliedCoupon.code, subtotal);
        if (!result.success) {
          removeCoupon();
          toast({
            title: "Cupon eliminat",
            description: "Cuponul nu mai este valid pentru noua valoare a coșului",
            variant: "destructive",
          });
        }
      }
    };

    reapplyCoupon();
  }, [items, subtotal]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    setCouponError(null);

    const result = await applyCoupon(couponCode.trim(), subtotal);

    if (!result.success) {
      setCouponError(result.error || "Failed to apply coupon");
    }

    setIsApplyingCoupon(false);
    setCouponCode("");
  };

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm sticky top-20">
      <h2 className="text-xl font-semibold mb-6">Sumar Comandă</h2>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {/* Kayak Items */}
        {hasKayak && (
          <div className="space-y-4">
            <div className="font-medium text-sm text-gray-500 pt-2">
              Produse cu livrare specială iaCaiace (în stoc)
            </div>
            {kayakInStockItems.map((item) => {
              const maxStock = item.size && item.selectedVariant.sizeStock
                ? item.selectedVariant.sizeStock.find(s => s.size === item.size)?.stock || 0
                : item.selectedVariant.currentStock;

              return (
                <div
                  key={`${item.productId}-${item.variantId}-${item.size || ''}`}
                  className="flex gap-4 items-center p-3 rounded-lg bg-gray-50 relative"
                >
                  <div className="relative w-20 h-20 bg-white rounded-md overflow-hidden flex items-center justify-center">
                    <img
                      src={item.selectedVariant.images[0] || "/images/placeholder.jpg"}
                      alt={item.product.name}
                      sizes="80px"
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Culoare: {item.selectedVariant.color.name}</p>
                      {item.size && <p>Mărime: {item.size}</p>}
                      {/* Paddle Configuration Display */}
                      {item.product.isPaddle && item.paddleConfiguration && (
                        <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="text-xs font-medium text-blue-800 mb-1">
                            Configurație Vasla:
                          </div>
                          <div className="text-xs text-blue-700 space-y-0.5">
                            <div>Material: {item.paddleConfiguration.configurationSummary.material}</div>
                            <div>Tip mâner: {item.paddleConfiguration.configurationSummary.shaftType}</div>
                            <div>Unghi: {item.paddleConfiguration.configurationSummary.bladeAngle}</div>
                            <div>Lungime: {item.paddleConfiguration.configurationSummary.length}</div>
                            <div>Bucăți: {item.paddleConfiguration.configurationSummary.parts}</div>
                          </div>
                        </div>
                      )}
                      {(item.size ? 
                        (item.selectedVariant.sizeStock?.find(s => s.size === item.size)?.stock || 0) <= 0 : 
                        item.selectedVariant.currentStock <= 0) && (
                        <p className="text-blue-600 font-medium text-xs mt-1">Disponibil la producător (7 zile livrare)</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.variantId,
                              Math.max(1, item.quantity - 1),
                              item.size
                            )
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            if (item.quantity < maxStock) {
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
                          disabled={item.quantity >= maxStock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {item.selectedVariant.current_sale_percentage > 0 ? (
                      <>
                        <p className="text-sm line-through text-gray-500">
                          {(item.selectedVariant.price * item.quantity).toFixed(2)} RON
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {(
                              item.selectedVariant.price *
                              (1 - item.selectedVariant.current_sale_percentage / 100) *
                              item.quantity
                            ).toFixed(2)} RON
                          </p>
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                            -{item.selectedVariant.current_sale_percentage}%
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="font-medium">
                        {(item.selectedVariant.price * item.quantity).toFixed(2)} RON
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-2"
                      onClick={() => removeItem(item.productId, item.variantId, item.size)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Elimină
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Regular Items */}
        {hasRegularInStockItems && (
          <div className="space-y-4">
            <div className="font-medium text-sm text-gray-500 pt-2">
              Produse cu livrare prin curier Sameday
            </div>
            {regularInStockItems.map((item) => {
              const maxStock = item.size && item.selectedVariant.sizeStock
                ? item.selectedVariant.sizeStock.find(s => s.size === item.size)?.stock || 0
                : item.selectedVariant.currentStock;

              return (
                <div
                  key={`${item.productId}-${item.variantId}-${item.size || ''}`}
                  className="flex gap-4 items-center p-3 rounded-lg bg-gray-50 relative"
                >
                  <div className="relative w-20 h-20 bg-white rounded-md overflow-hidden flex items-center justify-center">
                    <img
                      src={item.selectedVariant.images[0] || "/images/placeholder.jpg"}
                      alt={item.product.name}
                      sizes="80px"
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Culoare: {item.selectedVariant.color.name}</p>
                      {item.size && <p>Mărime: {item.size}</p>}
                      {/* Paddle Configuration Display */}
                      {item.product.isPaddle && item.paddleConfiguration && (
                        <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="text-xs font-medium text-blue-800 mb-1">
                            Configurație Vasla:
                          </div>
                          <div className="text-xs text-blue-700 space-y-0.5">
                            <div>Material: {item.paddleConfiguration.configurationSummary.material}</div>
                            <div>Tip mâner: {item.paddleConfiguration.configurationSummary.shaftType}</div>
                            <div>Unghi: {item.paddleConfiguration.configurationSummary.bladeAngle}</div>
                            <div>Lungime: {item.paddleConfiguration.configurationSummary.length}</div>
                            <div>Bucăți: {item.paddleConfiguration.configurationSummary.parts}</div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.variantId,
                              Math.max(1, item.quantity - 1),
                              item.size
                            )
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            if (item.quantity < maxStock) {
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
                          disabled={item.quantity >= maxStock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {item.selectedVariant.current_sale_percentage > 0 ? (
                      <>
                        <p className="text-sm line-through text-gray-500">
                          {(item.selectedVariant.price * item.quantity).toFixed(2)} RON
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {(
                              item.selectedVariant.price *
                              (1 - item.selectedVariant.current_sale_percentage / 100) *
                              item.quantity
                            ).toFixed(2)} RON
                          </p>
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                            -{item.selectedVariant.current_sale_percentage}%
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="font-medium">
                        {(item.selectedVariant.price * item.quantity).toFixed(2)} RON
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-2"
                      onClick={() => removeItem(item.productId, item.variantId, item.size)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Elimină
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Manufacturer Stock Items */}
        {hasManufacturerStockItems && (
          <div className="space-y-4">
            <div className="font-medium text-sm text-gray-500 pt-2">
              Produse cu livrare de la producător
            </div>
            {manufacturerStockItems.map((item) => {
              return (
                <div
                  key={`${item.productId}-${item.variantId}-${item.size || ''}`}
                  className="flex gap-4 items-center p-3 rounded-lg bg-blue-50 relative"
                >
                  <div className="relative w-20 h-20 bg-white rounded-md overflow-hidden flex items-center justify-center">
                    <img
                      src={item.selectedVariant.images[0] || "/images/placeholder.jpg"}
                      alt={item.product.name}
                      sizes="80px"
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Culoare: {item.selectedVariant.color.name}</p>
                      {item.size && <p>Mărime: {item.size}</p>}
                      {/* Paddle Configuration Display */}
                      {item.product.isPaddle && item.paddleConfiguration && (
                        <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="text-xs font-medium text-blue-800 mb-1">
                            Configurație Vasla:
                          </div>
                          <div className="text-xs text-blue-700 space-y-0.5">
                            <div>Material: {item.paddleConfiguration.configurationSummary.material}</div>
                            <div>Tip mâner: {item.paddleConfiguration.configurationSummary.shaftType}</div>
                            <div>Unghi: {item.paddleConfiguration.configurationSummary.bladeAngle}</div>
                            <div>Lungime: {item.paddleConfiguration.configurationSummary.length}</div>
                            <div>Bucăți: {item.paddleConfiguration.configurationSummary.parts}</div>
                          </div>
                        </div>
                      )}
                      {(item.size ? 
                        (item.selectedVariant.sizeStock?.find(s => s.size === item.size)?.stock || 0) <= 0 : 
                        item.selectedVariant.currentStock <= 0) && (
                        <p className="text-blue-600 font-medium text-xs mt-1">Disponibil la producător (7 zile livrare)</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.variantId,
                              Math.max(1, item.quantity - 1),
                              item.size
                            )
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            updateQuantity(
                              item.productId,
                              item.variantId,
                              item.quantity + 1,
                              item.size
                            );
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {item.selectedVariant.current_sale_percentage > 0 ? (
                      <>
                        <p className="text-sm line-through text-gray-500">
                          {(item.selectedVariant.price * item.quantity).toFixed(2)} RON
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {(
                              item.selectedVariant.price *
                              (1 - item.selectedVariant.current_sale_percentage / 100) *
                              item.quantity
                            ).toFixed(2)} RON
                          </p>
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                            -{item.selectedVariant.current_sale_percentage}%
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="font-medium">
                        {(item.selectedVariant.price * item.quantity).toFixed(2)} RON
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-2"
                      onClick={() => removeItem(item.productId, item.variantId, item.size)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Elimină
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Coupon Section */}
      <div className="mt-6 border-t pt-4">
        {appliedCoupon ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Cupon aplicat: {appliedCoupon.code}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeCoupon}
              >
                Elimină
              </Button>
            </div>
            <div className="text-sm text-green-600">
              Reducere: -{appliedCoupon.discount.toFixed(2)} RON
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Cod cupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon || !couponCode.trim()}
              >
                {isApplyingCoupon ? "..." : "Aplică"}
              </Button>
            </div>
            {couponError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{couponError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      <div className="border-t mt-6 pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{subtotal.toFixed(2)} RON</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Reducere cupon</span>
            <span>-{appliedCoupon.discount.toFixed(2)} RON</span>
          </div>
        )}
        
        {/* Shipping Information */}
        {hasKayak && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transport caiace</span>
            <span>
              {paymentMethod === "PICKUP" 
                ? "Ridicare din depozitul nostru din București"
                : "Livrare specială cu mașina iaCaiace"}
            </span>
          </div>
        )}
        {hasRegularInStockItems && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transport curier</span>
            <span>
              {paymentMethod === "PICKUP"
                ? "Ridicare din depozitul nostru din București"
                : `${baseShippingCost.toFixed(2)} RON (Curier Sameday)`}
            </span>
          </div>
        )}
        
        {/* Manufacturer Stock Shipping */}
        {hasManufacturerStockItems && paymentMethod !== "PICKUP" && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transport produse de la producător</span>
            <span className="text-orange-600">{manufacturerShippingCost.toFixed(2)} RON (30 EUR)</span>
          </div>
        )}
        
        {/* Delivery Time Information */}
        {hasManufacturerStockItems && (
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mt-2">
            <p className="font-medium">Notă: Comanda dvs. conține produse disponibile la producător</p>
            <p>Timpul de livrare pentru aceste produse este de aproximativ 7 zile lucrătoare.</p>
            <div className="mt-2 border-t border-blue-200 pt-2">
              <p className="font-medium">Produse de la producător:</p>
              <ul className="list-disc list-inside mt-1">
                {manufacturerStockItems.map((item) => (
                  <li key={`${item.productId}-${item.variantId}-${item.size || ''}`}>
                    {item.product.name} {item.size ? `- Mărime: ${item.size}` : ''} {item.selectedVariant.color ? `- Culoare: ${item.selectedVariant.color.name}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-between font-semibold text-lg pt-2 border-t">
          <span>Total</span>
          <span>
            {(totalPrice + totalShippingCost).toFixed(2)} RON
          </span>
        </div>
      </div>
    </div>
  );
}
