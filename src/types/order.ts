export type PaymentMethod = "CARD" | "CASH" | "PICKUP";

export interface OrderItem {
  variant: string;
  quantity: number;
  price: number;
  size?: string;
}

export interface OrderResponse {
  id: string;
  user: {
    name: string;
    email: string;
  };
  items: {
    variantId: string;
    variant: {
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
    name: string;
    surname: string;
    county: string;
    city: string;
    address: string;
  };
  payment_method: PaymentMethod;
  total_price: number;
  order_status: string;
  order_placed_date: Date;
  tracking_number?: string;
  comments?: string;
  coupon?: {
    code: string;
    discount: number;
  };
}