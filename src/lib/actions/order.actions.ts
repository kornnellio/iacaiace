"use server";

import { connectToDatabase } from "../database";
import { Address, Order, Product, User, Coupon } from "@/lib/database/models/models";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { Resend } from "resend";
import { PaymentMethod } from "@/types/order";
const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderActionReturn {
  error?: string;
  order?: OrderResponse;
}

interface OrdersActionReturn {
  error?: string;
  orders?: OrderResponse[];
}

export interface OrderResponse {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: {
    variant: {
      id: string;
      sku: string;
      productName: string;
      color: {
        name: string;
        hex: string;
      };
      original_price: number;
      sale_percentage: number;
      size?: string;
      isPaddle?: boolean;
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
    quantity: number;
    price: number;
    size?: string;
  }[];
  address: {
    id: string;
    name: string;
    surname: string;
    county: string;
    city: string;
    address: string;
  };
  payment_method: string;
  total_price: number;
  order_placed_date: string;
  order_shipped_date: string | null;
  order_status: OrderStatus;
  tracking_number?: string;
  comments?: string;
  coupon?: {
    code: string;
    discount: number;
  };
}

interface OrderItem {
  variant: string;
  quantity: number;
  price: number;
  original_price?: number;
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
}

interface OrderInput {
  user: string;
  items: OrderItem[];
  address: string;
  payment_method: string;
  total_price: number;
  coupon?: {
    code: string;
    discount: number;
  };
}

interface PopulatedUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
}

interface PopulatedProduct {
  name: string;
}

interface PopulatedVariant {
  _id: Types.ObjectId;
  sku: string;
  parent: PopulatedProduct;
  color: {
    name: string;
    hex: string;
  };
}

interface PopulatedAddress extends Document {
  _id: Types.ObjectId;
  name: string;
  address: string;
}

interface PopulatedOrder {
  _id: Types.ObjectId;
  user: PopulatedUser;
  variant: PopulatedVariant;
  address: PopulatedAddress;
  quantity: number;
  payment_method: string;
  price: number;
  order_placed_date: Date;
  order_shipped_date: Date | null;
  order_status: string;
  tracking_number?: string;
}

interface OrderActionReturn {
  error?: string;
  order?: OrderResponse;
}

interface ProductVariant {
  _id: Types.ObjectId;
  sku: string;
  color: {
    name: string;
    hex: string;
  };
}

interface PopulatedProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  variants: ProductVariant[];
}

interface OrdersActionReturn {
  error?: string;
  orders?: OrderResponse[];
}

async function populateOrderResponse(
  order: any
): Promise<OrderResponse | undefined> {
  try {
    if (!order || !order._id) {
      return undefined;
    }

    const orderResponse: OrderResponse = {
      id: order._id.toString(),
      user: {
        id: order.userId.toString(),
        name: order.user.name,
        email: order.user.email,
      },
      items: order.items.map((item: any) => ({
        variant: {
          id: item.variantId.toString(),
          sku: item.variant.sku,
          productName: item.variant.productName,
          color: {
            name: item.variant.color.name,
            hex: item.variant.color.hex,
          },
          original_price: Number(item.variant.original_price),
          sale_percentage: Number(item.variant.sale_percentage),
          size: item.variant.size,
          isPaddle: item.variant.isPaddle,
          paddleConfiguration: item.variant.paddleConfiguration,
        },
        quantity: Number(item.quantity),
        price: Number(item.price),
        size: item.size,
      })),
      address: {
        id: "embedded",
        name: order.address.name,
        surname: order.address.surname,
        county: order.address.county,
        city: order.address.city,
        address: order.address.address,
      },
      payment_method: order.payment_method,
      total_price: Number(order.total_price),
      order_placed_date: new Date(order.order_placed_date).toISOString(),
      order_shipped_date: order.order_shipped_date 
        ? new Date(order.order_shipped_date).toISOString()
        : null,
      order_status: order.order_status,
      tracking_number: order.tracking_number,
      comments: order.comments,
      coupon: order.coupon ? {
        code: order.coupon.code,
        discount: Number(order.coupon.discount),
      } : undefined,
    };

    return orderResponse;
  } catch (error) {
    console.error("Error in populateOrderResponse:", error);
    return undefined;
  }
}

export async function sendOrderConfirmationEmail(order: OrderResponse) {
  const formattedPrice = new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
  }).format(order.total_price);

  const isPickup = order.payment_method === "PICKUP";
  const kayakItems = order.items.filter(item => item.variant.productName.toLowerCase().includes('caiac'));
  const regularItems = order.items.filter(item => !item.variant.productName.toLowerCase().includes('caiac'));
  const hasKayak = kayakItems.length > 0;
  const hasRegularItems = regularItems.length > 0;

  const formatItemsList = (items: typeof order.items) => items
    .map(
      (item) => `
        <div style="margin-bottom: 10px;">
          <div><strong>${item.variant.productName}</strong></div>
          <div>Culoare: ${item.variant.color.name}</div>
          ${item.size ? `<div>Mărime: ${item.size}</div>` : ""}
          ${item.variant.isPaddle && item.variant.paddleConfiguration ? `
            <div style="margin-top: 8px; padding: 8px; background-color: #e7f3ff; border-radius: 4px;">
              <div style="font-weight: bold; color: #0066cc; margin-bottom: 4px;">Specificații Vasla:</div>
              <div>Material: ${item.variant.paddleConfiguration.configurationSummary.material}</div>
              <div>Numărul de bucăți: ${item.variant.paddleConfiguration.configurationSummary.parts}</div>
              <div>Unghiul: ${item.variant.paddleConfiguration.configurationSummary.bladeAngle}°</div>
              <div>Lungimea: ${item.variant.paddleConfiguration.configurationSummary.length} cm</div>
              <div>Tipul mânerului: ${item.variant.paddleConfiguration.configurationSummary.shaftType === 'straight' ? 'Drept' : 'Curbat'}</div>
            </div>
          ` : ""}
          <div>Cantitate: ${item.quantity}</div>
          <div>Preț: ${new Intl.NumberFormat("ro-RO", {
            style: "currency",
            currency: "RON",
          }).format(item.price)}</div>
          ${
            item.variant.sale_percentage > 0
              ? `<div style="color: #dc3545;">Reducere: ${item.variant.sale_percentage}%</div>`
              : ""
          }
        </div>
      `
    )
    .join("");

  const kayakItemsList = hasKayak ? formatItemsList(kayakItems) : '';
  const regularItemsList = hasRegularItems ? formatItemsList(regularItems) : '';

  const subtotal = order.items.reduce((total, item) => total + item.price * item.quantity, 0);

  await resend.emails.send({
    from: "iaCaiace.ro <office@iacaiace.ro>",
    to: order.user.email,
    subject: `Confirmare Comandă - iaCaiace.ro${
      isPickup ? " (Ridicare din Magazin)" : ""
    }`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background-color: white; border-radius: 5px; }
            .order-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .item { border-bottom: 1px solid #dee2e6; padding: 10px 0; }
            .item:last-child { border-bottom: none; }
            .total { font-size: 18px; font-weight: bold; color: #28a745; margin-top: 15px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .sale-badge { background-color: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px; margin-left: 6px; }
            .original-price { text-decoration: line-through; color: #666; margin-right: 8px; }
            .pickup-info { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #ffeeba; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #28a745; margin: 0;">Confirmare Comandă</h1>
            </div>
            <div class="content">
              <p>Dragă ${order.user.name},</p>
              <p>Îți mulțumim pentru comandă! ${
                isPickup
                  ? "Comanda ta va fi pregătită pentru ridicare din magazin."
                  : "Suntem încântați să o procesăm pentru tine."
              }</p>
              
              ${
                isPickup
                  ? `
              <div class="pickup-info">
                <h3 style="margin-top: 0;">Informații Ridicare</h3>
                <p><strong>Locație:</strong> [Adresa Magazin]</p>
                <p><strong>Program:</strong> [Program Magazin]</p>
                <p><strong>Instrucțiuni:</strong> Te rugăm să ai un act de identitate la ridicarea comenzii.</p>
              </div>
              `
                  : ""
              }

              <div class="order-details">
                <h2>Detalii Comandă:</h2>
                <p><strong>ID Comandă:</strong> ${order.id}</p>
                ${hasKayak ? `
                  <div class="items">
                    <h3 style="color: #666; margin-top: 15px;">Produse cu livrare specială iaCaiace</h3>
                    ${kayakItemsList}
                  </div>
                ` : ''}
                ${hasRegularItems ? `
                  <div class="items">
                    <h3 style="color: #666; margin-top: 15px;">Produse cu livrare prin curier Sameday</h3>
                    ${regularItemsList}
                  </div>
                ` : ''}
                <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #666;">Subtotal:</span>
                    <span>${new Intl.NumberFormat("ro-RO", {
                      style: "currency",
                      currency: "RON",
                    }).format(subtotal)}</span>
                  </div>
                  ${order.coupon && order.coupon.code ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #28a745;">
                      <span>Reducere cupon (${order.coupon.code}):</span>
                      <span>-${new Intl.NumberFormat("ro-RO", {
                        style: "currency",
                        currency: "RON",
                      }).format(order.coupon.discount)}</span>
                    </div>
                  ` : ''}
                  ${hasKayak ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                      <span style="color: #666;">Transport caiace:</span>
                      <span>${isPickup 
                        ? "Ridicare din depozitul nostru din București"
                        : "Livrare specială cu mașina iaCaiace"}</span>
                    </div>
                  ` : ''}
                  ${hasRegularItems ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                      <span style="color: #666;">Transport curier:</span>
                      <span>${isPickup 
                        ? "Ridicare din depozitul nostru din București"
                        : new Intl.NumberFormat("ro-RO", {
                            style: "currency",
                            currency: "RON",
                          }).format(20) + " (Curier Sameday)"}</span>
                    </div>
                  ` : ''}
                  <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-weight: bold;">
                    <span>Total:</span>
                    <span>${new Intl.NumberFormat("ro-RO", {
                      style: "currency",
                      currency: "RON",
                    }).format(order.total_price)}</span>
                  </div>
                </div>
              </div>

              <div class="shipping-info">
                <h2>Informații Livrare:</h2>
                <p>${order.address.name} ${order.address.surname}</p>
                <p>${order.address.address}</p>
                <p>${order.address.city}, ${order.address.county}</p>
              </div>

              <p>Te vom notifica când comanda ta ${
                isPickup
                  ? "este gata pentru ridicare"
                  : "a fost expediată"
              }.</p>

              <div class="footer">
                <p>Îți mulțumim că ai ales iaCaiace.ro!</p>
                <p>Dacă ai întrebări, te rugăm să ne contactezi la office@iacaiace.ro</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export type OrderStatus =
  | "pending"
  | "pending_payment"
  | "processing"
  | "payment_confirmed"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "declined"
  | "expired"
  | "error"
  | "ready_for_pickup"
  | "picked_up";

type ValidTransitions = {
  [K in OrderStatus]: OrderStatus[];
};

async function sendOrderStatusUpdateEmail(order: OrderResponse) {
  const formattedPrice = new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
  }).format(order.total_price);

  const isPickup = order.payment_method === "PICKUP";
  const kayakItems = order.items.filter(item => item.variant.productName.toLowerCase().includes('caiac'));
  const regularItems = order.items.filter(item => !item.variant.productName.toLowerCase().includes('caiac'));
  const hasKayak = kayakItems.length > 0;
  const hasRegularItems = regularItems.length > 0;

  let statusMessage = "";
  let subject = "";

  switch (order.order_status) {
    case "pending_payment":
      subject = "Comandă în așteptare plată";
      statusMessage = "Comanda ta este în așteptare până la confirmarea plății.";
      break;
    case "processing":
      subject = "Plată în procesare";
      statusMessage = "Plata pentru comanda ta este în curs de procesare.";
      break;
    case "confirmed":
      subject = "Comandă Confirmată";
      statusMessage = isPickup
        ? "Comanda ta a fost confirmată și va fi pregătită în curând pentru ridicare."
        : "Comanda ta a fost confirmată și este în curs de procesare.";
      break;
    case "ready_for_pickup":
      subject = "Comandă Gata de Ridicare";
      statusMessage = "Comanda ta este gata pentru ridicare din magazin!";
      break;
    case "picked_up":
      subject = "Comandă Ridicată";
      statusMessage = "Comanda ta a fost ridicată. Îți mulțumim pentru cumpărătură!";
      break;
    case "shipped":
      if (!isPickup) {
        subject = "Comandă Expediată";
        statusMessage = `Comanda ta a fost expediată! Număr de urmărire: ${order.tracking_number}`;
      }
      break;
    case "delivered":
      if (!isPickup) {
        subject = "Comandă Livrată";
        statusMessage = "Comanda ta a fost livrată. Îți mulțumim pentru cumpărătură!";
      }
      break;
    case "cancelled":
      subject = "Comandă Anulată";
      statusMessage = "Comanda ta a fost anulată.";
      break;
    case "declined":
      subject = "Plată Respinsă";
      statusMessage = "Plata pentru comanda ta a fost respinsă de bancă. Te rugăm să încerci din nou cu un alt card.";
      break;
    case "expired":
      subject = "Plată Expirată";
      statusMessage = "Sesiunea de plată pentru comanda ta a expirat. Te rugăm să încerci din nou.";
      break;
    case "error":
      subject = "Eroare la Plată";
      statusMessage = "A apărut o eroare la procesarea plății pentru comanda ta. Te rugăm să încerci din nou.";
      break;
    default:
      return;
  }

  if (!statusMessage) return;

  // Add any additional comments from the order
  if (order.comments) {
    statusMessage += `\n\nDetalii suplimentare: ${order.comments}`;
  }

  await resend.emails.send({
    from: "iaCaiace.ro <office@iacaiace.ro>",
    to: order.user.email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .status-message {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .order-details {
              margin-top: 30px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${subject}</h1>
            </div>

            <div class="status-message">
              <p>${statusMessage}</p>
            </div>

            <div class="order-details">
              <h2>Detalii Comandă:</h2>
              <p><strong>ID Comandă:</strong> ${order.id}</p>
              <p><strong>Total:</strong> ${formattedPrice}</p>
            </div>

            <div class="footer">
              <p>Dacă ai întrebări despre comanda ta, ne poți contacta la office@iacaiace.ro</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

async function initiateNetopiaPayment(order: OrderResponse): Promise<{ error?: string; redirectUrl?: string }> {
  try {
    const netopiaAuthToken = process.env.NETOPIA_AUTH_TOKEN;
    const netopiaPosSignature = process.env.NETOPIA_POS_SIGNATURE;

    if (!netopiaAuthToken || !netopiaPosSignature) {
      throw new Error('Missing Netopia credentials in environment variables');
    }

    // Use sandbox or production URL based on environment variable
    const apiUrl = process.env.NETOPIA_USE_SANDBOX === 'true'
      ? process.env.NETOPIA_SANDBOX_URL
      : process.env.NETOPIA_PRODUCTION_URL;

    console.log(`Using Netopia API URL: ${apiUrl}/payment/card/start`);

    const response = await fetch(`${apiUrl}/payment/card/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': netopiaAuthToken
      },
      body: JSON.stringify({
        config: {
          emailTemplate: "confirm",
          notifyUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/log-request`,
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/order/confirmation?orderId=${order.id}`,
          language: "ro"
        },
        payment: {
          options: {
            installments: 1,
            bonus: 0
          }
        },
        order: {
          posSignature: netopiaPosSignature,
          dateTime: new Date().toISOString(),
          description: `Order ${order.id} from iaCaiace.ro`,
          orderID: order.id,
          amount: order.total_price,
          currency: "RON",
          billing: {
            email: order.user.email,
            phone: "", // We need to add phone to our order model
            firstName: order.address.name,
            lastName: order.address.surname,
            city: order.address.city,
            country: 642, // Romania country code
            countryName: "Romania",
            state: order.address.county,
            postalCode: "", // We need to add postal code to our order model
            details: order.address.address
          }
        }
      })
    });

    const data = await response.json();
    console.log('Netopia payment response:', data);

    if (!response.ok) {
      throw new Error('Failed to initiate Netopia payment');
    }

    // The actual redirect URL comes from the payment.paymentURL field in the response
    if (data.payment?.paymentURL) {
      return { redirectUrl: data.payment.paymentURL };
    }

    throw new Error('No payment URL in response');
  } catch (error) {
    console.error('Error initiating Netopia payment:', error);
    return { error: error instanceof Error ? error.message : 'Failed to initiate payment' };
  }
}

// Helper function to update stock for an order
async function updateStockForOrder(orderItems: any[]) {
  await Promise.all(
    orderItems.map(async (item) => {
      // Skip stock update for manufacturer stock items (zero stock)
      let isManufacturerStock = false;
      
      if (item.size) {
        const sizeStock = item.variant.sizeStock?.find((s: any) => s.size === item.size);
        isManufacturerStock = sizeStock && sizeStock.stock <= 0;
        
        // Only update stock if it's not a manufacturer stock item
        if (!isManufacturerStock) {
          const result = await Product.updateOne(
            {
              _id: item.product._id,
              "variants._id": item.variant._id,
              "variants.sizeStock.size": item.size,
              "variants.sizeStock.stock": { $gte: item.quantity }
            },
            {
              $inc: {
                "variants.$[variant].sizeStock.$[size].stock": -item.quantity
              }
            },
            {
              arrayFilters: [
                { "variant._id": item.variant._id },
                { "size.size": item.size }
              ]
            }
          );
          
          if (result.modifiedCount === 0) {
            throw new Error(`Failed to update stock for size ${item.size} of variant ${item.variant.sku}`);
          }
        }
      } else {
        isManufacturerStock = item.variant.currentStock <= 0;
        
        // Only update stock if it's not a manufacturer stock item
        if (!isManufacturerStock) {
          const result = await Product.updateOne(
            { 
              _id: item.product._id, 
              "variants._id": item.variant._id,
              "variants.currentStock": { $gte: item.quantity }
            },
            { $inc: { "variants.$.currentStock": -item.quantity } }
          );
          
          if (result.modifiedCount === 0) {
            throw new Error(`Failed to update stock for variant ${item.variant.sku}`);
          }
        }
      }
      
      // For manufacturer stock items, log the order but don't decrement stock
      if (isManufacturerStock) {
        console.log(`Manufacturer stock item: ${item.product.name} - ${item.variant.sku}${item.size ? ` size ${item.size}` : ''} - Not decrementing stock`);
      }
    })
  );
}

// Create new order
export async function createOrder({
  user,
  items,
  address,
  payment_method,
  total_price,
  coupon,
}: {
  user: string;
  items: OrderItem[];
  address: string;
  payment_method: PaymentMethod;
  total_price: number;
  coupon?: { code: string; discount: number } | null;
}): Promise<OrderActionReturn & { 
  paymentRedirectUrl?: string;
  orderData?: any;
}> {
  try {
    await connectToDatabase();

    // Get user data
    const userData = await User.findById(user).lean();
    if (!userData) {
      return { error: "User not found" };
    }

    // Get address data
    const addressData = await Address.findById(address).lean();
    if (!addressData) {
      return { error: "Address not found" };
    }

    // Calculate subtotal from items (before coupon)
    const subtotal = Number(items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2));

    // Validate coupon if provided
    if (coupon) {
      const couponDoc = await Coupon.findOne({ code: coupon.code }).lean();
      if (!couponDoc) {
        return { error: "Invalid coupon code" };
      }

      // Check if coupon is active
      if (!couponDoc.is_active) {
        return { error: "This coupon is no longer active" };
      }

      // Check if coupon is within valid date range
      const now = new Date();
      if (now < couponDoc.start_date || now > couponDoc.end_date) {
        return { error: "This coupon is not valid at this time" };
      }

      // Check minimum purchase amount against subtotal
      if (subtotal < couponDoc.min_purchase_amount) {
        return { error: `Minimum purchase amount for this coupon is ${couponDoc.min_purchase_amount} RON` };
      }

      // Validate that the provided discount matches what would be calculated
      let calculatedDiscount = 0;
      if (couponDoc.discount_type === 'percentage') {
        calculatedDiscount = Number((subtotal * couponDoc.discount_value / 100).toFixed(2));
        if (couponDoc.max_discount_amount) {
          calculatedDiscount = Number(Math.min(calculatedDiscount, couponDoc.max_discount_amount).toFixed(2));
        }
      } else {
        calculatedDiscount = Number(Math.min(couponDoc.discount_value, subtotal).toFixed(2));
      }

      // Allow for small floating point differences (0.01 RON)
      if (Math.abs(calculatedDiscount - coupon.discount) > 0.01) {
        console.error("Discount mismatch:", {
          calculated: calculatedDiscount,
          provided: coupon.discount,
          difference: Math.abs(calculatedDiscount - coupon.discount)
        });
        return { error: "Invalid discount amount" };
      }
    }

    // First check products and calculate shipping cost
    try {
      console.log("Looking up products for variants:", items.map(item => item.variant));
      
      const products = await Promise.all(items.map(async item => {
        const variantId = new Types.ObjectId(item.variant);
        console.log(`Looking up product for variant ID: ${variantId}`);
        console.log(`Variant ID type: ${typeof variantId}`);
        
        const product = await Product.findOne({ 
          "variants._id": variantId
        }).lean();
        
        if (!product) {
          console.log(`No product found with variant ID: ${variantId}`);
          console.log(`Attempting direct product query to check schema...`);
          
          // Try to find any product to verify schema
          const sampleProduct = await Product.findOne({}).lean();
          if (sampleProduct) {
            console.log('Sample product structure:', JSON.stringify(sampleProduct, null, 2));
          }
          
          throw new Error(`Product not found for variant: ${item.variant}`);
        }
        
        console.log(`Found product: ${product.name} for variant: ${item.variant}`);
        console.log(`Product details:`, {
          id: product._id,
          name: product.name,
          variants: product.variants.map(v => ({
            id: v._id,
            sku: v.sku
          }))
        });
        
        return product;
      }));

      // Find variants with zero stock (manufacturer stock items)
      const variantsWithItemDetails = await Promise.all(items.map(async item => {
        const product = await Product.findOne({ "variants._id": new Types.ObjectId(item.variant) });
        if (!product) return null;
        
        const variant = product.variants.find(v => v._id.toString() === item.variant);
        if (!variant) return null;
        
        return {
          variant,
          size: item.size,
          isManufacturerStock: item.size 
            ? (variant.sizeStock?.find(s => s.size === item.size)?.stock || 0) <= 0
            : variant.currentStock <= 0
        };
      }));
      
      const hasManufacturerStockItems = variantsWithItemDetails.some(item => item?.isManufacturerStock);

      const hasRegularItems = products.some(product => 
        !product.categoryName.toLowerCase().includes('caiac')
      );
      
      // Base shipping cost for regular items
      const baseShippingCost = payment_method === "PICKUP" ? 0 : (hasRegularItems ? 20 : 0);
      
      // Additional shipping cost for manufacturer stock items (€30 = 150 RON)
      const manufacturerShippingCost = hasManufacturerStockItems && payment_method !== "PICKUP" ? 150 : 0;
      
      // Total shipping cost
      const totalShippingCost = baseShippingCost + manufacturerShippingCost;
      
      // Format all numbers to 2 decimal places for consistent comparison
      const formattedSubtotal = Number(subtotal.toFixed(2));
      const formattedDiscount = Number((coupon?.discount || 0).toFixed(2));
      const formattedShippingCost = Number(totalShippingCost.toFixed(2));
      const calculatedTotal = Number((formattedSubtotal - formattedDiscount + formattedShippingCost).toFixed(2));
      const providedTotal = Number(total_price.toFixed(2));

      // Add detailed logging
      console.log("Backend price calculation:", {
        items: products.map(product => ({
          name: product.name,
          isKayak: product.categoryName.toLowerCase().includes('caiac')
        })),
        hasRegularItems,
        hasManufacturerStockItems,
        subtotal: formattedSubtotal.toFixed(2),
        discount: formattedDiscount.toFixed(2),
        baseShippingCost: baseShippingCost.toFixed(2),
        manufacturerShippingCost: manufacturerShippingCost.toFixed(2),
        totalShippingCost: formattedShippingCost.toFixed(2),
        calculatedTotal: calculatedTotal.toFixed(2),
        providedTotal: providedTotal.toFixed(2),
        payment_method
      });

      // Allow for small floating point differences (0.01 RON)
      if (Math.abs(calculatedTotal - providedTotal) > 0.01) {
        console.error("Total price mismatch:", {
          subtotal: formattedSubtotal.toFixed(2),
          discount: formattedDiscount.toFixed(2),
          shippingCost: formattedShippingCost.toFixed(2),
          calculatedTotal: calculatedTotal.toFixed(2),
          providedTotal: providedTotal.toFixed(2),
          difference: Math.abs(calculatedTotal - providedTotal).toFixed(2)
        });
        return { error: "Invalid total price" };
      }
    } catch (error) {
      console.error("Error during product lookup:", error);
      return { error: error instanceof Error ? error.message : "Failed to lookup products" };
    }

    // Now validate stock and prepare populated items
    const populatedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findOne({
          "variants._id": item.variant,
        });

        if (!product) {
          throw new Error(`Product not found for variant: ${item.variant}`);
        }

        const variant = product.variants.find(
          (v) => v._id.toString() === item.variant
        );
        if (!variant) {
          throw new Error(`Variant not found: ${item.variant}`);
        }

        // Check stock availability
        if (item.size) {
          const sizeStock = variant.sizeStock?.find(s => s.size === item.size);
          if (!sizeStock) {
            throw new Error(`Size ${item.size} not found for variant ${variant.sku}`);
          }
          // Allow zero stock (manufacturer stock) items to be ordered
          if (sizeStock.stock < item.quantity && sizeStock.stock > 0) {
            throw new Error(`Insufficient stock for size ${item.size} of variant ${variant.sku}`);
          }
        } else {
          // Allow zero stock (manufacturer stock) items to be ordered
          if (variant.currentStock < item.quantity && variant.currentStock > 0) {
            throw new Error(`Insufficient stock for variant ${variant.sku}`);
          }
        }

        return {
          product,
          variant,
          variantId: variant._id,
          variantData: {
            sku: variant.sku,
            productName: product.name,
            color: variant.color,
            original_price: variant.price,
            sale_percentage: variant.current_sale_percentage,
            size: item.size,
            isPaddle: product.isPaddle,
            paddleConfiguration: item.paddleConfiguration,
          },
          quantity: item.quantity,
          price: item.price,
          size: item.size,
        };
      })
    );

    // Create order first
    const orderData = {
      userId: user,
      user: {
        name: userData.name,
        email: userData.email,
      },
      items: populatedItems.map(item => ({
        variantId: item.variantId,
        variant: item.variantData,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
      })),
      address: {
        name: addressData.name,
        surname: addressData.surname,
        county: addressData.county,
        city: addressData.city,
        address: addressData.address,
      },
      payment_method,
      total_price,
      coupon: coupon ? {
        code: coupon.code,
        discount: coupon.discount
      } : undefined,
      order_status: payment_method === "CARD" ? "pending_payment" as OrderStatus : "pending" as OrderStatus,
    };

    const orderDoc = await Order.create(orderData);
    if (!orderDoc) {
      return { error: "Failed to create order" };
    }

    // For non-card payments, update stock immediately
    // For card payments, stock will be updated when payment is confirmed
    if (payment_method !== "CARD") {
      try {
        await updateStockForOrder(populatedItems);
        
        // Increment coupon usage if a coupon was used
        if (coupon) {
          await Coupon.updateOne(
            { code: coupon.code },
            { $inc: { times_used: 1 } }
          );
        }
      } catch (error) {
        // If stock update fails, delete the order and throw error
        await Order.findByIdAndDelete(orderDoc._id);
        throw new Error("Failed to update stock. Order cancelled.");
      }
    }

    const plainOrderDoc = orderDoc.toObject();
    const populatedOrder = await populateOrderResponse(plainOrderDoc);
    
    // For card payments, initiate Netopia payment
    if (populatedOrder && payment_method === 'CARD') {
      const paymentResult = await initiateNetopiaPayment(populatedOrder);
      if (paymentResult.error) {
        // If payment initiation fails, delete the order and return error
        await Order.findByIdAndDelete(orderDoc._id);
        return { error: paymentResult.error };
      }
      return { 
        order: populatedOrder,
        paymentRedirectUrl: paymentResult.redirectUrl
      };
    }

    // For non-card payments, send confirmation email
    if (populatedOrder) {
      await sendOrderConfirmationEmail(populatedOrder);
    }

    revalidatePath("/orders");
    return { order: populatedOrder };
  } catch (error) {
    console.error("Error in createOrder:", error);
    return { error: error instanceof Error ? error.message : "Failed to create order" };
  }
}

export async function updateOrderStatus({
  orderId,
  status,
  tracking_number,
  comments,
}: {
  orderId: string;
  status: OrderStatus;
  tracking_number?: string;
  comments?: string;
}): Promise<OrderActionReturn> {
  try {
    await connectToDatabase();

    const order = await Order.findById(orderId);
    if (!order) {
      return { error: "Order not found" };
    }

    // Update order with new status and tracking number if provided
    const updates: any = { order_status: status };
    if (tracking_number) {
      updates.tracking_number = tracking_number;
    }
    if (comments) {
      updates.comments = comments;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updates,
      { new: true }
    ).populate("user");

    if (!updatedOrder) {
      return { error: "Failed to update order" };
    }

    // Send email notification about status update
    const populatedOrder = await populateOrderResponse(updatedOrder);
    if (populatedOrder) {
      // Send detailed order confirmation email when status is confirmed
      if (status === "confirmed") {
        await sendOrderConfirmationEmail(populatedOrder);
      } else {
        await sendOrderStatusUpdateEmail(populatedOrder);
      }
    }

    return { order: populatedOrder };
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    return {
      error: "An error occurred while updating the order status",
    };
  }
}

export async function cancelOrder(orderId: string): Promise<OrderActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(orderId)) {
      throw new Error("Invalid order ID");
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (
      order.order_status !== "pending" &&
      order.order_status !== "confirmed"
    ) {
      throw new Error("Cannot cancel order that has been shipped or delivered");
    }

    // Restore stock for each item
    for (const item of order.items) {
      const product = await Product.findOne({
        "variants._id": item.variantId,
      });
      if (!product) continue;

      const variant = product.variants.find(
        (v) => v._id.toString() === item.variantId.toString()
      );
      if (!variant) continue;

      if (product.isClothing && item.variant.size) {
        // Restore size-specific stock
        await Product.updateOne(
          {
            _id: product._id,
            "variants._id": item.variantId,
          },
          {
            $inc: {
              "variants.$[variant].sizeStock.$[size].stock": item.quantity
            }
          },
          {
            arrayFilters: [
              { "variant._id": item.variantId },
              { "size.size": item.variant.size }
            ]
          }
        );
      } else {
        // Restore regular stock
        await Product.updateOne(
          { _id: product._id, "variants._id": item.variantId },
          { $inc: { "variants.$.currentStock": item.quantity } }
        );
      }
    }

    // Update order status
    order.order_status = "cancelled";
    await order.save();

    revalidatePath("/order");

    const populatedOrder = await populateOrderResponse(order);
    if (populatedOrder) {
      await sendOrderStatusUpdateEmail(populatedOrder);
    }

    return {
      order: await populateOrderResponse(order),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to cancel order",
    };
  }
}

export async function getOrders(): Promise<OrdersActionReturn> {
  try {
    await connectToDatabase();
    const orders = await Order.find().sort({ order_placed_date: -1 }).lean();

    // Wait for all populateOrderResponse promises to resolve
    const populatedOrders = await Promise.all(
      orders.map((order) => populateOrderResponse(order))
    );

    // Filter out undefined values
    const validOrders = populatedOrders.filter(
      (order): order is OrderResponse => order !== undefined
    );

    return {
      orders: validOrders,
    };
  } catch (error) {
    console.error("Error in getOrders:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to fetch orders",
    };
  }
}

export async function getOrder(orderId: string): Promise<OrderActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(orderId)) {
      throw new Error("Invalid order ID");
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      throw new Error("Order not found");
    }

    const populatedOrder = await populateOrderResponse(order);

    return {
      order: populatedOrder,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch order",
    };
  }
}

export async function getOrdersByUser(
  userId: string
): Promise<OrdersActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const orders = await Order.find({ userId })
      .sort({ order_placed_date: -1 })
      .lean();

    // Wait for all populateOrderResponse promises to resolve
    const populatedOrders = await Promise.all(
      orders.map((order) => populateOrderResponse(order))
    );

    // Filter out undefined values
    const validOrders = populatedOrders.filter(
      (order): order is OrderResponse => order !== undefined
    );

    return {
      orders: validOrders,
    };
  } catch (error) {
    console.error("Error in getOrdersByUser:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to fetch user orders",
    };
  }
}

export async function sendPaymentConfirmationEmail(order: OrderResponse) {
  await resend.emails.send({
    from: "iaCaiace.ro <office@iacaiace.ro>",
    to: order.user.email,
    subject: "Confirmare Plată - iaCaiace.ro",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background-color: white; border-radius: 5px; }
            .success-icon { color: #28a745; font-size: 48px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #28a745; margin: 0;">Plată Confirmată</h1>
            </div>
            <div class="content">
              <p>Dragă ${order.user.name},</p>
              <p>Plata pentru comanda #${order.id} a fost procesată cu succes!</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Detalii comandă:</strong></p>
                <p>Suma plătită: ${new Intl.NumberFormat("ro-RO", {
                  style: "currency",
                  currency: "RON",
                }).format(order.total_price)}</p>
                <p>Data plății: ${new Date().toLocaleDateString('ro-RO')}</p>
              </div>

              <p>Comanda ta este acum în procesare. Vei primi în curând un email de confirmare cu toate detaliile comenzii tale.</p>

              <div class="footer">
                <p>Îți mulțumim că ai ales iaCaiace.ro!</p>
                <p>Dacă ai întrebări, te rugăm să ne contactezi la office@iacaiace.ro</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
