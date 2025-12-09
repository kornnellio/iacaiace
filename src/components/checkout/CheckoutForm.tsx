"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createOrder } from "@/lib/actions/order.actions";
import {
  getAddressesByUser,
  createAddress,
} from "@/lib/actions/address.actions";
import { useRouter } from "next/navigation";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface Address {
  id: string;
  name: string;
  surname: string;
  county: string;
  city: string;
  address: string;
}

interface PaymentMethod {
  id: "CARD" | "CASH" | "PICKUP";
  label: string;
  icon: string;
  description: string;
}

export default function CheckoutForm({ userId }: { userId: string }) {
  const router = useRouter();
  const {
    items,
    totalPrice,
    clearCart,
    paymentMethod,
    setPaymentMethod,
    appliedCoupon,
  } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddressData, setNewAddressData] = useState({
    name: "",
    surname: "",
    county: "",
    city: "",
    address: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    {
      id: "CARD",
      label: "Card Credit/Debit",
      icon: "💳",
      description: "Plătește în siguranță cu Netopia",
    },
    {
      id: "CASH",
      label: "Plata la livrare",
      icon: "💵",
      description: "Plătește când primești comanda",
    },
    {
      id: "PICKUP",
      label: "Ridicare din magazin",
      icon: "🏪",
      description: "Ridică și plătește în magazinul nostru",
    },
  ];

  useEffect(() => {
    const loadAddresses = async () => {
      const response = await getAddressesByUser(userId);
      if (response.addresses) {
        setAddresses(response.addresses);
        if (response.addresses.length > 0) {
          setSelectedAddressId(response.addresses[0].id);
        } else {
          setShowNewAddressForm(true);
        }
      }
    };
    loadAddresses();
  }, [userId]);

  const handleNewAddressSubmit = async () => {
    const response = await createAddress({
      ...newAddressData,
      user: userId,
    });

    if (response.address) {
      setAddresses([...addresses, response.address]);
      setSelectedAddressId(response.address.id);
      setShowNewAddressForm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddressId) return;

    try {
      setIsProcessingPayment(true);
      // Log initial cart state
      console.log("Initial cart state:", {
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          product: {
            name: item.product.name,
            categoryName: item.product.categoryName
          }
        })),
        totalPrice,
        appliedCoupon
      });

      const orderItems = items.map((item) => {
        // Calculate the discounted price for each item
        const basePrice = item.selectedVariant.price;
        const salePercentage = item.selectedVariant.current_sale_percentage;
        const discountedPrice = salePercentage > 0
          ? basePrice * (1 - salePercentage / 100)
          : basePrice;

        console.log(`Item price calculation for ${item.product.name}:`, {
          basePrice,
          salePercentage,
          discountedPrice,
          quantity: item.quantity,
          variantId: item.variantId
        });

        return {
          variant: item.variantId,
          quantity: item.quantity,
          price: discountedPrice,
          size: item.size,
          paddleConfiguration: item.paddleConfiguration,
        };
      });

      // Calculate subtotal from items (before coupon)
      const subtotal = orderItems.reduce((total, item) => {
        const itemTotal = item.price * item.quantity;
        console.log(`Item total for variant ${item.variant}:`, {
          price: item.price,
          quantity: item.quantity,
          itemTotal
        });
        return total + itemTotal;
      }, 0);
      
      // Apply coupon discount if any
      const discountAmount = appliedCoupon?.discount || 0;
      const afterDiscount = Math.max(0, subtotal - discountAmount);
      
      // Identify items with manufacturer stock (zero stock)
      const manufacturerStockItems = items.filter(item => {
        if (item.size) {
          const sizeStock = item.selectedVariant.sizeStock?.find(s => s.size === item.size);
          return sizeStock && sizeStock.stock <= 0;
        }
        return item.selectedVariant.currentStock <= 0;
      });
      const hasManufacturerStockItems = manufacturerStockItems.length > 0;
      
      // Add shipping cost - only for non-kayak items
      const kayakItems = items.filter(item => item.product.categoryName.toLowerCase().includes('caiac'));
      const regularItems = items.filter(item => !item.product.categoryName.toLowerCase().includes('caiac'));
      const hasRegularItems = regularItems.length > 0;
      const baseShippingCost = paymentMethod === "PICKUP" ? 0 : (hasRegularItems ? 20 : 0);
      // Add €30 (150 RON) additional shipping for manufacturer stock items
      const manufacturerShippingCost = hasManufacturerStockItems && paymentMethod !== "PICKUP" ? 150 : 0;
      const totalShippingCost = baseShippingCost + manufacturerShippingCost;
      const finalTotalPrice = Number((afterDiscount + totalShippingCost).toFixed(2));

      console.log("Final price calculation:", {
        subtotal: subtotal.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        afterDiscount: afterDiscount.toFixed(2),
        hasKayakItems: kayakItems.length > 0,
        hasRegularItems,
        hasManufacturerStockItems,
        baseShippingCost: baseShippingCost.toFixed(2),
        manufacturerShippingCost: manufacturerShippingCost.toFixed(2),
        totalShippingCost: totalShippingCost.toFixed(2),
        finalTotalPrice: finalTotalPrice.toFixed(2)
      });

      const result = await createOrder({
        user: userId,
        items: orderItems,
        address: selectedAddressId,
        payment_method: paymentMethod,
        total_price: finalTotalPrice,
        coupon: appliedCoupon,
      });

      if (result.error) {
        console.error("Order creation failed:", result.error);
        throw new Error(result.error);
      }

      // If order was created successfully and had a coupon, increment its usage
      if (result.order && appliedCoupon) {
        await fetch("/api/coupons/apply-usage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: appliedCoupon.code }),
        });
      }

      clearCart();

      // For card payments, open Netopia in new window and redirect to confirmation page
      if (paymentMethod === 'CARD') {
        if (result.paymentRedirectUrl && result.order) {
          setIsRedirecting(true);
          // Open Netopia in new window
          window.open(result.paymentRedirectUrl, '_blank', 'noopener,noreferrer');
          // Redirect to confirmation page to wait for payment status
          router.push(`/order/confirmation?orderId=${result.order.id}`);
          return;
        } else {
          throw new Error("No payment URL or order ID received");
        }
      }

      // For non-card payments, go to success page
      router.push("/order-success");
    } catch (error) {
      console.error("Error creating order:", error);
      setIsProcessingPayment(false);
      setIsRedirecting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Adresa de livrare</h2>

        {addresses.length > 0 && (
          <RadioGroup
            value={selectedAddressId}
            onValueChange={setSelectedAddressId}
            className="space-y-4"
          >
            {addresses.map((address) => (
              <div
                key={address.id}
                className="flex items-center space-x-3"
              >
                <RadioGroupItem
                  value={address.id}
                  id={address.id}
                />
                <Label
                  htmlFor={address.id}
                  className="flex-1"
                >
                  <div className="font-medium">
                    {address.name} {address.surname}
                  </div>
                  <div className="text-sm text-gray-500">
                    {address.address}, {address.city}, {address.county}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => setShowNewAddressForm(!showNewAddressForm)}
        >
          {showNewAddressForm ? "Anulează" : "Adaugă adresă nouă"}
        </Button>

        {showNewAddressForm && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Prenume"
                value={newAddressData.name}
                onChange={(e) =>
                  setNewAddressData({ ...newAddressData, name: e.target.value })
                }
              />
              <Input
                placeholder="Nume"
                value={newAddressData.surname}
                onChange={(e) =>
                  setNewAddressData({
                    ...newAddressData,
                    surname: e.target.value,
                  })
                }
              />
            </div>
            <Input
              placeholder="Adresă"
              value={newAddressData.address}
              onChange={(e) =>
                setNewAddressData({
                  ...newAddressData,
                  address: e.target.value,
                })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Oraș"
                value={newAddressData.city}
                onChange={(e) =>
                  setNewAddressData({ ...newAddressData, city: e.target.value })
                }
              />
              <Input
                placeholder="Județ"
                value={newAddressData.county}
                onChange={(e) =>
                  setNewAddressData({
                    ...newAddressData,
                    county: e.target.value,
                  })
                }
              />
            </div>
            <Button
              type="button"
              onClick={handleNewAddressSubmit}
              className="w-full"
            >
              Salvează adresa
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Metodă de plată</h2>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value: PaymentMethod["id"]) =>
            setPaymentMethod(value)
          }
          className="space-y-4"
        >
          {paymentMethods.map((method) => (
            <Label
              key={method.id}
              className={`relative flex items-center rounded-lg border p-4 cursor-pointer transition-colors
                ${
                  paymentMethod === method.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
            >
              <RadioGroupItem
                value={method.id}
                id={method.id}
                className="absolute left-4"
              />
              <div className="flex items-center space-x-4 ml-12">
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <div className="font-medium">{method.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {method.description}
                  </div>
                </div>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <div className="flex items-start space-x-3 mb-4">
        <input
          type="checkbox"
          id="terms"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none cursor-pointer"
          >
            Accept termenii și condițiile
          </label>
          <p className="text-sm text-muted-foreground">
            Bifând această casetă, ești de acord cu{" "}
            <Link
              href="/terms"
              className="text-primary hover:underline"
            >
              Termenii și Condițiile
            </Link>{" "}
            și{" "}
            <Link
              href="/privacy"
              className="text-primary hover:underline"
            >
              Politica de Confidențialitate
            </Link>
            .
          </p>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full text-lg py-6"
        disabled={!selectedAddressId || !acceptedTerms || isProcessingPayment}
      >
        {isProcessingPayment ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {isRedirecting ? "Așteptați confirmarea plății..." : "Se procesează..."}
          </div>
        ) : paymentMethod === "CARD" ? (
          "Plătește acum"
        ) : paymentMethod === "CASH" ? (
          "Plasează comanda"
        ) : (
          "Confirmă ridicarea"
        )}
      </Button>

      {isProcessingPayment && paymentMethod === "CARD" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h3 className="text-xl font-semibold">Procesare plată</h3>
            <p className="text-gray-600">
              Am deschis o fereastră nouă pentru plată. Vă rugăm să completați detaliile cardului pentru a finaliza comanda.
            </p>
            <p className="text-sm text-gray-500">
              Nu închideți această pagină până la confirmarea plății.
            </p>
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground flex items-center justify-center gap-2 bg-primary/5 p-3 rounded-lg">
        <span className="text-green-600">✓</span>
        Plată securizată prin Netopia
      </div>
    </div>
  );
}
