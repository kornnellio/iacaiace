"use client";

import React, { useEffect, useState } from "react";
import { createOrder, OrderResponse } from "@/lib/actions/order.actions";
import { getUsers } from "@/lib/actions/user.actions";
import { getProducts } from "@/lib/actions/product.actions";
import { getAddressesByUser } from "@/lib/actions/address.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PaymentMethod } from "@/types/order";

interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
}

interface Address {
  id: string;
  name: string;
  surname: string;
  county: string;
  city: string;
  address: string;
}

interface ProductVariant {
  id: string;
  sku: string;
  color: {
    name: string;
    hex: string;
  };
  price: number;
  currentStock: number;
  current_sale_percentage: number;
  sizeStock?: {
    size: string;
    stock: number;
  }[];
}

interface Product {
  id: string;
  name: string;
  variants: ProductVariant[];
}

interface OrderItem {
  variant: string;
  variantData: ProductVariant;
  quantity: number;
  price: number;
  size?: string;
}

interface FormData {
  user: string;
  address: string;
  items: {
    variant: string;
    quantity: number;
    price: number;
    size?: string;
  }[];
  payment_method: PaymentMethod;
  total_price: number;
}

interface OrderFormProps {
  onSuccess: (order: OrderResponse) => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSuccess }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    user: "",
    address: "",
    items: [],
    payment_method: "CARD",
    total_price: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersResult, productsResult] = await Promise.all([
          getUsers(),
          getProducts(),
        ]);

        if (usersResult.users) {
          setUsers(usersResult.users);
        }

        if (productsResult.products) {
          setProducts(productsResult.products);
        }
      } catch (error) {
        setError("Failed to load data");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load users and products",
        });
      }
    };

    void loadData();
  }, []);

  const loadUserAddresses = async (userId: string) => {
    try {
      const result = await getAddressesByUser(userId);
      if (result.error) {
        throw new Error(result.error);
      }
      setAddresses(result.addresses || []);
      return result.addresses || [];
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load user addresses",
      });
      return [];
    }
  };

  const handleUserChange = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setSelectedUser(user.id);
      setFormData((prev) => ({
        ...prev,
        user: userId,
        address: "", // Reset address when user changes
      }));

      // Load user addresses
      const addresses = await loadUserAddresses(userId);
      if (addresses.length > 0) {
        setFormData((prev) => ({
          ...prev,
          address: addresses[0].id,
        }));
      }
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product.id);
      setSelectedVariant("");
    }
  };

  const handleVariantChange = (variantId: string) => {
    if (!selectedProduct) return;

    const variant = products
      .flatMap((p) => p.variants)
      .find((v) => v.id === variantId);
    if (variant) {
      setSelectedVariant(variant.id);
    }
  };

  const handleQuantityChange = (value: string) => {
    const product = products.find((p) => p.id === selectedProduct);
    const variant = product?.variants.find(
      (v: any) => v.id === selectedVariant
    );

    if (!variant) return;

    const newQuantity = parseInt(value) || 1;
    const maxStock =
      selectedSize && variant.sizeStock
        ? variant.sizeStock.find(
            (s: { size: string; stock: number }) => s.size === selectedSize
          )?.stock || 0
        : variant.currentStock;

    setQuantity(Math.min(Math.max(1, newQuantity), maxStock));
  };

  const handleAddItem = () => {
    const product = products.find((p) => p.id === selectedProduct);
    const variant = product?.variants.find(
      (v: any) => v.id === selectedVariant
    );

    if (!variant) {
      setError("Please select a product variant");
      return;
    }

    if (variant.sizeStock && variant.sizeStock.length > 0 && !selectedSize) {
      setError("Please select a size");
      return;
    }

    const price =
      variant.current_sale_percentage > 0
        ? variant.price * (1 - variant.current_sale_percentage / 100)
        : variant.price;

    const newItem: OrderItem = {
      variant: variant.id,
      variantData: variant,
      quantity,
      price,
      size: selectedSize || undefined,
    };

    setOrderItems([...orderItems, newItem]);
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          variant: variant.id,
          quantity,
          price,
          size: selectedSize || undefined,
        },
      ],
      total_price: prev.total_price + price * quantity,
    }));

    setSelectedProduct("");
    setSelectedVariant("");
    setSelectedSize("");
    setQuantity(1);
    setError("");
  };

  const removeOrderItem = (index: number) => {
    const itemPrice = orderItems[index].price * orderItems[index].quantity;
    setOrderItems((items) => items.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      total_price: prev.total_price - itemPrice,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    try {
      setIsLoading(true);
      setError("");

      if (!selectedUser) {
        setError("Please select a user");
        return;
      }

      if (!selectedAddress) {
        setError("Please select an address");
        return;
      }

      if (orderItems.length === 0) {
        setError("Please add at least one item to the order");
        return;
      }

      const orderInput = {
        user: formData.user,
        items: formData.items,
        address: formData.address,
        payment_method: formData.payment_method,
        total_price: formData.total_price
      };

      const result = await createOrder(orderInput);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.order) {
        // For card payments, redirect to Netopia and don't trigger success yet
        if (formData.payment_method === 'CARD') {
          if (result.paymentRedirectUrl) {
            setIsRedirecting(true);
            window.location.href = result.paymentRedirectUrl;
          } else {
            throw new Error("No payment URL received");
          }
          return;
        }
        
        // For non-card payments, trigger success immediately
        onSuccess(result.order);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create order"
      );
    } finally {
      if (!isRedirecting) {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Create New Order</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Customer</Label>
            <Select
              value={formData.user}
              onValueChange={handleUserChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem
                    key={user.id}
                    value={user.id}
                  >
                    {user.name} {user.surname} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <div className="space-y-2">
              <Label>Delivery Address</Label>
              <Select
                value={formData.address}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, address: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a delivery address" />
                </SelectTrigger>
                <SelectContent>
                  {addresses.map((address) => (
                    <SelectItem
                      key={address.id}
                      value={address.id}
                    >
                      {address.name} {address.surname} - {address.county},{" "}
                      {address.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {addresses.length === 0 && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This user has no saved addresses
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Product</Label>
            <Select
              value={selectedProduct}
              onValueChange={handleProductChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem
                    key={product.id}
                    value={product.id}
                  >
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="space-y-2">
              <Label>Variant</Label>
              <Select
                value={selectedVariant}
                onValueChange={handleVariantChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a variant" />
                </SelectTrigger>
                <SelectContent>
                  {products
                    .flatMap((p) => p.variants)
                    .map((variant) => (
                      <SelectItem
                        key={variant.id}
                        value={variant.id}
                      >
                        {variant.color.name} - {variant.sku} (
                        {variant.currentStock > 0 
                          ? `${variant.currentStock} în stoc` 
                          : "În stoc la producător"})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedVariant && (
            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max={(() => {
                    const product = products.find(
                      (p) => p.id === selectedProduct
                    );
                    const variant = product?.variants.find(
                      (v: any) => v.id === selectedVariant
                    );
                    if (!variant) return "1";

                    return selectedSize && variant.sizeStock
                      ? variant.sizeStock.find(
                          (s: { size: string; stock: number }) =>
                            s.size === selectedSize
                        )?.stock.toString() || "0"
                      : variant.currentStock.toString();
                  })()}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                />
                <span className="text-sm text-gray-500">
                  {(() => {
                    const product = products.find(
                      (p) => p.id === selectedProduct
                    );
                    const variant = product?.variants.find(
                      (v: any) => v.id === selectedVariant
                    );
                    if (!variant) return "";

                    const maxStock =
                      selectedSize && variant.sizeStock
                        ? variant.sizeStock.find(
                            (s: { size: string; stock: number }) =>
                              s.size === selectedSize
                          )?.stock || 0
                        : variant.currentStock;

                    return `Available: ${maxStock}`;
                  })()}
                </span>
              </div>
            </div>
          )}

          {orderItems.length > 0 && (
            <div className="mt-4 space-y-2">
              <Label>Order Items</Label>
              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 border rounded"
                  >
                    <div>
                      <div className="font-medium">{item.variantData.sku}</div>
                      <div className="text-sm text-gray-500">
                        Color: {item.variantData.color.name}
                      </div>
                      {item.size && (
                        <div className="text-sm text-gray-500">
                          Size: {item.size}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </div>
                      <div className="text-sm font-medium">
                        {new Intl.NumberFormat("ro-RO", {
                          style: "currency",
                          currency: "RON",
                        }).format(item.price * item.quantity)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOrderItem(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value: PaymentMethod) =>
                setFormData((prev) => ({ ...prev, payment_method: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CARD">Card Payment</SelectItem>
                <SelectItem value="CASH">Cash on Delivery</SelectItem>
                <SelectItem value="PICKUP">Store Pickup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Price:</span>
              <span className="text-lg">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "RON",
                }).format(formData.total_price)}
              </span>
            </div>
          </div>

          <Button
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as React.FormEvent);
            }}
            type="button"
            className="w-full"
            disabled={
              isLoading ||
              isRedirecting ||
              !formData.user ||
              formData.items.length === 0 ||
              !formData.address
            }
          >
            {isRedirecting 
              ? "Redirecting to payment..."
              : isLoading 
                ? "Creating..." 
                : "Create Order"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderForm;
