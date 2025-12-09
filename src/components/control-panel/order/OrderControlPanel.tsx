"use client";

import {
  Ban,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Package,
  Plus,
  Search,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  cancelOrder,
  getOrders,
  updateOrderStatus,
  OrderResponse,
  OrderStatus,
} from "@/lib/actions/order.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import OrderForm from "@/components/control-panel/order/OrderForm";
import React from "react";

const OrderControlPanel = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Toggle expansion helper function
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

  // Load order
  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const result = await getOrders();

      if (result.error) {
        throw new Error(result.error);
      }

      // Ensure we have order and they're properly formatted
      if (result.orders) {
        const formattedOrders = result.orders.map((order) => ({
          ...order,
          order_placed_date: order.order_placed_date,
          order_shipped_date: order.order_shipped_date,
        }));
        setOrders(formattedOrders);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch order",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  // Handle order cancellation
  const handleCancelOrder = async (orderId: string) => {
    try {
      const result = await cancelOrder(orderId);
      if (result.error) {
        throw new Error(result.error);
      }

      await loadOrders();
      toast({
        title: "Success",
        description: "Order cancelled successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to cancel order",
      });
    } finally {
      setIsCancelDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      const result = await updateOrderStatus({
        orderId,
        status: newStatus,
        tracking_number: newStatus === "shipped" ? trackingNumber : undefined,
      });

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
        return;
      }

      if (result.order) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, order_status: newStatus } : order
          )
        );

        setIsStatusDialogOpen(false);
        setTrackingNumber("");
        setSelectedOrder(null);

        toast({
          title: "Success",
          description: "Order status updated successfully",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status",
      });
    }
  };

  // Filter order
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.variant.sku.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      order.items.some((item) =>
        item.variant.productName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || order.order_status === statusFilter;

    return matchesSearch && matchesStatus;
  });
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "RON",
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">În așteptare</Badge>;
      case "pending_payment":
        return <Badge variant="secondary">În așteptare plată</Badge>;
      case "processing":
        return <Badge variant="secondary">Procesare plată</Badge>;
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
      case "declined":
        return <Badge variant="destructive">Plată respinsă</Badge>;
      case "expired":
        return <Badge variant="destructive">Plată expirată</Badge>;
      case "error":
        return <Badge variant="destructive">Eroare plată</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNextStatus = (
    currentStatus: string,
    isPickup: boolean
  ): string[] => {
    if (isPickup) {
      switch (currentStatus) {
        case "pending":
          return ["confirmed", "cancelled"];
        case "confirmed":
          return ["ready_for_pickup", "cancelled"];
        case "ready_for_pickup":
          return ["picked_up", "cancelled"];
        default:
          return [];
      }
    } else {
      switch (currentStatus) {
        case "pending":
          return ["confirmed", "cancelled"];
        case "confirmed":
          return ["shipped", "cancelled"];
        case "shipped":
          return ["delivered"];
        default:
          return [];
      }
    }
  };

  const statusDialogContent = (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Update Order Status</h2>
      <div className="space-y-2">
        {selectedOrder &&
          getNextStatus(
            selectedOrder.order_status,
            selectedOrder.payment_method === "PICKUP"
          ).map((status) => (
            <Button
              key={status}
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                handleStatusUpdate(selectedOrder.id, status as OrderStatus)
              }
            >
              {status
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </Button>
          ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-muted-foreground">Loading orders...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl">Orders</CardTitle>
            <CardDescription>Manage customer orders</CardDescription>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
              </DialogHeader>
              <OrderForm
                onSuccess={(order: OrderResponse) => {
                  if (order.payment_method !== 'CARD') {
                    setOrders((prev: OrderResponse[]) => [...prev, order]);
                    setIsCreateDialogOpen(false);
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Details</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleOrderExpansion(order.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {expandedOrders.has(order.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {new Date(
                                  order.order_placed_date
                                ).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Package className="h-4 w-4" />
                                {order.items.length}{" "}
                                {order.items.length === 1 ? "item" : "items"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              {order.user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-start border-b last:border-0 pb-2 last:pb-0"
                              >
                                <div className="space-y-1">
                                  <p>{item.variant.productName}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor: item.variant.color.hex,
                                      }}
                                    />
                                    {item.variant.color.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    SKU: {item.variant.sku} (Qty:{" "}
                                    {item.quantity})
                                  </div>
                                  <div className="text-sm font-medium">
                                    {formatPrice(item.price * item.quantity)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  {item.variant.original_price ? (
                                    <>
                                      <p className="text-sm line-through text-gray-500">
                                        {formatPrice(
                                          item.variant.original_price
                                        )}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <p>{formatPrice(item.price)}</p>
                                      </div>
                                    </>
                                  ) : (
                                    <p>{formatPrice(item.price)}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatPrice(order.total_price)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.payment_method}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {getStatusBadge(order.order_status)}
                            {order.tracking_number && (
                              <div className="text-sm text-gray-500">
                                Tracking: {order.tracking_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsStatusDialogOpen(true);
                              }}
                            >
                              Update Status
                            </Button>
                            {(order.order_status === "pending" ||
                              order.order_status === "confirmed") && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-destructive/5"
                                  >
                                    <Ban className="h-4 w-4 text-destructive" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>Cancel Order</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to cancel this
                                      order? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex justify-end gap-2">
                                    <DialogClose asChild>
                                      <Button variant="outline">
                                        No, keep it
                                      </Button>
                                    </DialogClose>
                                    <Button
                                      variant="destructive"
                                      onClick={() => {
                                        void handleStatusUpdate(
                                          order.id,
                                          "cancelled" as OrderStatus
                                        );
                                      }}
                                    >
                                      Yes, cancel order
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedOrders.has(order.id) && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="bg-muted/50"
                          >
                            <div className="p-4 space-y-4">
                              {/* Shipping Address */}
                              <div className="space-y-2">
                                <h4 className="font-medium">
                                  Shipping Address
                                </h4>
                                <div className="text-sm">
                                  <p>{order.address.name}</p>
                                  <p className="whitespace-pre-line">
                                    {order.address.address}
                                  </p>
                                </div>
                              </div>

                              {/* Order Timeline */}
                              <div className="space-y-2">
                                <h4 className="font-medium">Order Timeline</h4>
                                <div className="space-y-1 text-sm">
                                  <p>
                                    Placed:{" "}
                                    {new Date(
                                      order.order_placed_date
                                    ).toLocaleString()}
                                  </p>
                                  {order.order_shipped_date && (
                                    <p>
                                      Shipped:{" "}
                                      {new Date(
                                        order.order_shipped_date
                                      ).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Detailed Item List */}
                              <div className="space-y-2">
                                <h4 className="font-medium">Items Detail</h4>
                                <div className="space-y-3">
                                  {order.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-start text-sm"
                                    >
                                      <div className="space-y-1">
                                        <p className="font-medium">
                                          {item.variant.productName}
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                              backgroundColor:
                                                item.variant.color.hex,
                                            }}
                                          />
                                          <span>{item.variant.color.name}</span>
                                        </div>
                                        {item.size && (
                                          <div className="text-sm text-gray-500">
                                            Size: {item.size}
                                          </div>
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
                                        <p className="text-muted-foreground">
                                          SKU: {item.variant.sku}
                                        </p>
                                        <div className="text-sm text-gray-500">
                                          Quantity: {item.quantity}
                                        </div>
                                        {item.variant.sale_percentage > 0 && (
                                          <div className="flex flex-col gap-1 mt-2">
                                            <Badge
                                              variant="destructive"
                                              className="w-fit"
                                            >
                                              {item.variant.sale_percentage}%
                                              OFF
                                            </Badge>
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm text-gray-500 line-through">
                                                {formatPrice(
                                                  item.variant.original_price
                                                )}
                                              </span>
                                              <span className="text-sm font-medium text-green-600">
                                                {formatPrice(item.price)}
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <p>
                                          {formatPrice(item.price)} ×{" "}
                                          {item.quantity}
                                        </p>
                                        <p className="font-medium">
                                          {formatPrice(
                                            item.price * item.quantity
                                          )}
                                        </p>
                                        {order.payment_method === "PICKUP" && (
                                          <Badge
                                            variant="outline"
                                            className="mt-2"
                                          >
                                            Store Pickup
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Order Summary */}
                              <div className="border-t pt-4 mt-4">
                                <div className="space-y-2">
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
                                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                                    <span>Total</span>
                                    <span>{formatPrice(order.total_price)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8"
                    >
                      {searchTerm || statusFilter !== "all"
                        ? "No matching order found"
                        : "No order yet"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      {/* Update Status Dialog */}
      <Dialog
        open={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select
                onValueChange={(value: OrderStatus) => {
                  if (selectedOrder) {
                    void handleStatusUpdate(selectedOrder.id, value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  {selectedOrder?.payment_method === "PICKUP" ? (
                    <>
                      <SelectItem value="ready_for_pickup">
                        Ready for Pickup
                      </SelectItem>
                      <SelectItem value="picked_up">Picked Up</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedOrder?.order_status !== "shipped" &&
              selectedOrder?.payment_method !== "PICKUP" && (
                <div className="space-y-2">
                  <Label>Tracking Number (required for shipping)</Label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OrderControlPanel;
