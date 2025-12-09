import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus, sendOrderConfirmationEmail, sendPaymentConfirmationEmail } from "@/lib/actions/order.actions";
import { Order, Product, Coupon } from "@/lib/database/models/models";

interface NetopiaPaymentResponse {
  order: {
    orderID: string;
  };
  payment: {
    amount: number;
    binding: {
      expireMonth: number;
      expireYear: number;
    };
    code: string;
    currency: string;
    data: {
      AuthCode: string;
      RRN: string;
    };
    instrument: {
      country: number;
      panMasked: string;
    };
    message: string;
    ntpID: string;
    status: number;
  };
}

const PAYMENT_STATUS_MAP = {
  1: { status: "pending_payment", message: "Plata în așteptare" },
  2: { status: "processing", message: "Plata în curs de procesare" },
  3: { status: "payment_confirmed", message: "Plata confirmată, în așteptarea verificării comenzii" },
  4: { status: "cancelled", message: "Plata anulată de client" },
  5: { status: "declined", message: "Plata respinsă de bancă" },
  7: { status: "expired", message: "Plata expirată" },
  8: { status: "error", message: "Eroare la procesarea plății" },
  9: { status: "error", message: "Eroare la procesarea plății" },
  10: { status: "error", message: "Eroare la procesarea plății" },
  12: { status: "declined", message: "Card expirat" },
  16: { status: "declined", message: "Plată respinsă. Cardul prezintă un risc" },
  17: { status: "declined", message: "Număr de card invalid" },
  18: { status: "declined", message: "Card închis" },
  19: { status: "declined", message: "Card expirat" },
  20: { status: "declined", message: "Fonduri insuficiente" },
  21: { status: "declined", message: "Cod CVV invalid" },
  22: { status: "declined", message: "Eroare la banca emitentă" },
  23: { status: "expired", message: "Sesiunea de plată a expirat" },
  26: { status: "declined", message: "Limită card depășită" },
  34: { status: "declined", message: "Tranzacție nepermisă pentru acest card" },
  35: { status: "declined", message: "Tranzacție respinsă de bancă" },
  36: { status: "declined", message: "Tranzacție respinsă de sistemul antifraudă" },
  39: { status: "declined", message: "Autentificare 3DSecure eșuată" },
  99: { status: "error", message: "Eroare generală la procesarea plății" }
} as const;

// Helper function to update stock for an order
async function updateStockForOrder(order: any) {
  await Promise.all(
    order.items.map(async (item: any) => {
      if (item.variant.size) {
        const result = await Product.updateOne(
          {
            "variants._id": item.variantId,
            "variants.sizeStock.size": item.variant.size,
            "variants.sizeStock.stock": { $gte: item.quantity }
          },
          {
            $inc: {
              "variants.$[variant].sizeStock.$[size].stock": -item.quantity
            }
          },
          {
            arrayFilters: [
              { "variant._id": item.variantId },
              { "size.size": item.variant.size }
            ]
          }
        );
        
        if (result.modifiedCount === 0) {
          throw new Error(`Failed to update stock for size ${item.variant.size} of variant ${item.variant.sku}`);
        }
      } else {
        const result = await Product.updateOne(
          { 
            "variants._id": item.variantId,
            "variants.currentStock": { $gte: item.quantity }
          },
          { $inc: { "variants.$.currentStock": -item.quantity } }
        );
        
        if (result.modifiedCount === 0) {
          throw new Error(`Failed to update stock for variant ${item.variant.sku}`);
        }
      }
    })
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NetopiaPaymentResponse;
    console.log("Received Netopia webhook with body:", body);

    const paymentStatus = body.payment?.status;
    const paymentCode = body.payment?.code;
    const orderId = body.order?.orderID;
    const paymentMessage = body.payment?.message;

    if (!paymentStatus || !orderId) {
      console.error("Missing required payment data:", { paymentStatus, orderId });
      return NextResponse.json(
        { error: "Missing required payment data" },
        { status: 400 }
      );
    }

    const statusInfo = PAYMENT_STATUS_MAP[paymentStatus as keyof typeof PAYMENT_STATUS_MAP];
    if (!statusInfo) {
      console.error("Unknown payment status:", paymentStatus);
      return NextResponse.json(
        { error: "Unknown payment status" },
        { status: 400 }
      );
    }

    // For successful payments, also verify the payment code
    if (paymentStatus === 3 && paymentCode !== "00") {
      console.error("Invalid payment code for successful payment:", paymentCode);
      return NextResponse.json(
        { error: "Invalid payment code" },
        { status: 400 }
      );
    }

    // Get the original payment URL for retry purposes
    const originalPaymentUrl = await getOriginalPaymentUrl(orderId);
    
    // Get the order before updating status to check previous status
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    const previousStatus = order.order_status;
    
    // Update order status in database with any additional payment details
    const result = await updateOrderStatus({
      orderId,
      status: statusInfo.status,
      comments: `${statusInfo.message}${paymentMessage ? `\nMesaj de la procesator: ${paymentMessage}` : ''}${originalPaymentUrl ? `\nURL plată: ${originalPaymentUrl}` : ''}`
    });

    if (result.error) {
      console.error("Failed to update order status:", result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // If payment is confirmed, update stock and increment coupon usage
    if (paymentStatus === 3) {
      try {
        // Refresh order data after status update
        const updatedOrder = await Order.findById(orderId);
        if (!updatedOrder) {
          throw new Error("Order not found");
        }

        await updateStockForOrder(updatedOrder);

        // If order had a coupon, increment its usage
        if (updatedOrder.coupon?.code) {
          await Coupon.updateOne(
            { code: updatedOrder.coupon.code },
            { $inc: { times_used: 1 } }
          );
        }

        // Send payment confirmation email
        if (result.order) {
          await sendPaymentConfirmationEmail(result.order);
        }
      } catch (error) {
        console.error("Error updating stock:", error);
        // Don't return error here, as payment was still successful
        // Just log the error and continue
      }
    }

    return NextResponse.json({
      success: true,
      message: statusInfo.message,
      status: statusInfo.status
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Helper function to get the original payment URL from the order comments
async function getOriginalPaymentUrl(orderId: string): Promise<string | undefined> {
  try {
    const order = await Order.findById(orderId);
    if (!order?.comments) return undefined;
    
    // Try to extract the payment URL from previous comments
    const match = order.comments.match(/URL plată: (https:\/\/[^\s]+)/);
    return match ? match[1] : undefined;
  } catch (error) {
    console.error("Error getting original payment URL:", error);
    return undefined;
  }
} 