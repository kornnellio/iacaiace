"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ProductResponse } from "@/lib/database/models/models";

export type CartItem = {
  productId: string;
  variantId: string;
  product: ProductResponse;
  selectedVariant: {
    sku: string;
    color: {
      name: string;
      hex: string;
    };
    price: number;
    current_sale_percentage: number;
    currentStock: number;
    images: string[];
    sizeStock?: {
      size: string;
      stock: number;
      price?: number;
    }[];
  };
  quantity: number;
  size?: string;
  paddleConfiguration?: {
    materialId: string;
    shaftTypeId: string;
    bladeAngleId: string;
    lengthId: string;
    partsId: string;
    finalPrice: number;
    configurationSummary: {
      material: string;
      shaftType: string;
      bladeAngle: string;
      length: string;
      parts: string;
    };
  };
};

type PaymentMethod = "CARD" | "CASH" | "PICKUP";

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string, size?: string, paddleConfigId?: string) => void;
  updateQuantity: (
    productId: string,
    variantId: string,
    quantity: number,
    size?: string,
    paddleConfigId?: string
  ) => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  appliedCoupon: {
    code: string;
    discount: number;
  } | null;
  applyCoupon: (code: string, cartTotal: number) => Promise<{
    success: boolean;
    error?: string;
  }>;
  removeCoupon: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    const savedPaymentMethod = localStorage.getItem("paymentMethod");
    const savedCoupon = localStorage.getItem("appliedCoupon");

    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
    if (savedPaymentMethod) {
      setPaymentMethod(savedPaymentMethod as PaymentMethod);
    }
    if (savedCoupon) {
      setAppliedCoupon(JSON.parse(savedCoupon));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("paymentMethod", paymentMethod);
  }, [paymentMethod]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem("appliedCoupon");
    }
  }, [appliedCoupon]);

  const addItem = (newItem: CartItem) => {
    setItems((currentItems) => {
      const existingItemIndex = currentItems.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.variantId === newItem.variantId &&
          item.size === newItem.size &&
          // Check paddle configuration match for paddle items
          ((!item.paddleConfiguration && !newItem.paddleConfiguration) ||
           (item.paddleConfiguration && newItem.paddleConfiguration &&
            item.paddleConfiguration.materialId === newItem.paddleConfiguration.materialId &&
            item.paddleConfiguration.shaftTypeId === newItem.paddleConfiguration.shaftTypeId &&
            item.paddleConfiguration.bladeAngleId === newItem.paddleConfiguration.bladeAngleId &&
            item.paddleConfiguration.lengthId === newItem.paddleConfiguration.lengthId &&
            item.paddleConfiguration.partsId === newItem.paddleConfiguration.partsId))
      );

      // For manufacturer stock items (zero stock), we allow adding them
      // For items with positive stock, we need to check if we have enough
      const isManufacturerStockItem = 
        newItem.size 
          ? (newItem.selectedVariant.sizeStock?.find(s => s.size === newItem.size)?.stock || 0) <= 0 
          : newItem.selectedVariant.currentStock <= 0;

      if (existingItemIndex > -1) {
        return currentItems.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.quantity + newItem.quantity;
            
            // If it's a manufacturer stock item, allow any quantity
            if (isManufacturerStockItem) {
              return { ...item, quantity: newQuantity };
            }
            
            // Otherwise check against available stock
            const availableStock = item.size
              ? (item.selectedVariant.sizeStock?.find(s => s.size === item.size)?.stock || 0)
              : item.selectedVariant.currentStock;
              
            return {
              ...item,
              quantity: Math.min(newQuantity, availableStock),
            };
          }
          return item;
        });
      }

      return [...currentItems, newItem];
    });
  };

  const removeItem = (productId: string, variantId: string, size?: string, paddleConfigId?: string) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.variantId === variantId &&
            item.size === size &&
            // For paddle items, also check configuration
            (!paddleConfigId || (item.paddleConfiguration?.materialId === paddleConfigId))
          )
      )
    );
  };

  const updateQuantity = (
    productId: string,
    variantId: string,
    quantity: number,
    size?: string,
    paddleConfigId?: string
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (
          item.productId === productId &&
          item.variantId === variantId &&
          item.size === size &&
          // For paddle items, also check configuration
          (!paddleConfigId || (item.paddleConfiguration?.materialId === paddleConfigId))
        ) {
          // For manufacturer stock items (zero stock), we allow any quantity
          const isManufacturerStockItem = 
            size 
              ? (item.selectedVariant.sizeStock?.find(s => s.size === size)?.stock || 0) <= 0
              : item.selectedVariant.currentStock <= 0;
              
          if (isManufacturerStockItem) {
            return { ...item, quantity };
          }
          
          // Otherwise check against available stock
          const availableStock = size
            ? (item.selectedVariant.sizeStock?.find(s => s.size === size)?.stock || 0)
            : item.selectedVariant.currentStock;
            
          return {
            ...item,
            quantity: Math.min(quantity, availableStock),
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      const basePrice = item.selectedVariant.price;
      const salePercentage = item.selectedVariant.current_sale_percentage;
      const discountedPrice = salePercentage > 0
        ? basePrice * (1 - salePercentage / 100)
        : basePrice;
      return total + (discountedPrice * item.quantity);
    }, 0);
  };

  const subtotal = Number(calculateSubtotal().toFixed(2));
  const discountAmount = appliedCoupon?.discount || 0;
  const totalPrice = Number(Math.max(0, subtotal - discountAmount).toFixed(2));

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const applyCoupon = async (code: string, cartTotal: number) => {
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, cartTotal }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nu s-a putut aplica cuponul");
      }

      // Check if the coupon is valid and has available uses
      if (data.error) {
        throw new Error(data.error);
      }

      setAppliedCoupon({
        code: data.coupon.code,
        discount: data.discount,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Nu s-a putut aplica cuponul",
      };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalPrice,
        totalItems,
        paymentMethod,
        setPaymentMethod,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
