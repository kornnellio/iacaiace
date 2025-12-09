"use client";

import { useEffect, useState } from "react";
import { getOrdersByUser, OrderResponse } from "@/lib/actions/order.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Package } from "lucide-react";

export function UserOrders({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const result = await getOrdersByUser(userId);
        if (result.orders) {
          setOrders(result.orders);
        }
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrders();
  }, [userId]);

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">În așteptare</Badge>;
      case "confirmed":
        return <Badge variant="default">Confirmată</Badge>;
      case "ready_for_pickup":
        return <Badge variant="secondary">Gata de ridicare</Badge>;
      case "picked_up":
        return <Badge variant="default">Ridicată</Badge>;
      case "shipped":
        return <Badge className="bg-blue-500 text-white">Expediată</Badge>;
      case "delivered":
        return <Badge className="bg-green-500 text-white">Livrată</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Anulată</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <span className="text-muted-foreground">Se încarcă comenzile...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium">Nu există comenzi</h3>
            <p className="text-muted-foreground mt-2">
              Când veți plasa comenzi, acestea vor apărea aici.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card
          key={order.id}
          className="overflow-hidden"
        >
          <div
            className="p-6 cursor-pointer hover:bg-muted/50"
            onClick={() => toggleOrderExpansion(order.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {expandedOrders.has(order.id) ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      Comandă din {new Date(order.order_placed_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "produs" : "produse"} •{" "}
                    {formatPrice(order.total_price)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(order.order_status)}
              </div>
            </div>
          </div>

          {expandedOrders.has(order.id) && (
            <div className="border-t bg-muted/50">
              <div className="p-6 space-y-6">
                {/* Order Items */}
                <div>
                  <h4 className="font-medium mb-3">Produse comandate</h4>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-start bg-background p-4 rounded-lg"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            {item.variant.productName}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: item.variant.color.hex,
                              }}
                            />
                            <span>{item.variant.color.name}</span>
                          </div>
                          {item.size && (
                            <p className="text-sm text-muted-foreground">
                              Mărime: {item.size}
                            </p>
                          )}
                          {/* Paddle Configuration Display */}
                          {item.variant.isPaddle && item.variant.paddleConfiguration && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                              <div className="text-sm font-medium text-blue-800 mb-1">
                                Configurație Vasla:
                              </div>
                              <div className="text-xs text-blue-700 space-y-0.5">
                                <div>Material: {item.variant.paddleConfiguration.configurationSummary.material}</div>
                                <div>Tip mâner: {item.variant.paddleConfiguration.configurationSummary.shaftType}</div>
                                <div>Unghi: {item.variant.paddleConfiguration.configurationSummary.bladeAngle}</div>
                                <div>Lungime: {item.variant.paddleConfiguration.configurationSummary.length}</div>
                                <div>Bucăți: {item.variant.paddleConfiguration.configurationSummary.parts}</div>
                              </div>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Cantitate: {item.quantity}
                          </p>
                          {item.variant.sale_percentage > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="destructive"
                                className="text-xs"
                              >
                                {item.variant.sale_percentage}% OFF
                              </Badge>
                              <span className="text-sm line-through text-muted-foreground">
                                {formatPrice(item.variant.original_price)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shipping Information */}
                  <div>
                    <h4 className="font-medium mb-2">Informații livrare</h4>
                    <div className="text-sm text-muted-foreground">
                      <p>{order.address.name}</p>
                      <p className="whitespace-pre-line">
                        {order.address.address}
                      </p>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div>
                    <h4 className="font-medium mb-2">Sumar comandă</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(order.items.reduce((total, item) => total + item.price * item.quantity, 0))}</span>
                      </div>
                      {order.coupon && (
                        <div className="flex justify-between text-green-600">
                          <span>Reducere cupon ({order.coupon.code})</span>
                          <span>-{formatPrice(order.coupon.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transport</span>
                        <span>
                          {order.payment_method === "PICKUP"
                            ? "Gratuit"
                            : formatPrice(20)}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium pt-2 border-t">
                        <span>Total</span>
                        <span>{formatPrice(order.total_price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
