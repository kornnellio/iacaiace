import { Document, Model, model, models, Schema, Types } from "mongoose";

// Interfaces
export type IAddress = {
  _id: Types.ObjectId;
  user: string;
  name: string;
  surname: string;
  county: string;
  city: string;
  address: string;
} & Document;

// Category interfaces
export type ICategory = {
  _id: Types.ObjectId;
  name: string;
  description: string;
  image_url: string;
  current_sale_percentage: number;
  subcategories: Types.ObjectId[];
  order: number;
  slug: string;
} & Document;

export type ICarousel = {
  _id: Types.ObjectId;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  order: number;
  cta: {
    text: string;
    link: string;
    isEnabled: boolean;
  };
} & Document;

export type ISubcategory = {
  _id: Types.ObjectId;
  name: string;
  description: string;
  image_url: string;
  current_sale_percentage: number;
  products: string[];
  category: string;
  order: number;
  slug: string;
} & Document;

// Product color variant interface
export type IProductVariant = {
  _id: Types.ObjectId;
  sku: string;
  color: {
    name: string;
    hex: string;
  };
  price: number;
  current_sale_percentage: number;
  currentStock: number;
  sizeStock?: {
    size: string;
    stock: number;
    price?: number;
  }[];
  images: string[];
} & Document;

// Updated product interface
export type IProduct = {
  _id: Types.ObjectId;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  categoryName: string;
  subcategoryName: string;
  variants: IProductVariant[];
  technicalSpecifications: {
    title: string;
    description: string;
  }[];
  shortDescription: string;
  isClothing: boolean;
  isPaddle: boolean;
  paddleConfigurator?: {
    enabled: boolean;
    materials: {
      id: string;
      name: string;
      description?: string;
      priceModifier: number; // +/- amount to base price
      image?: string;
    }[];
    shaftTypes: {
      id: string;
      name: string;
      description?: string;
      priceModifier: number;
    }[];
    bladeAngles: {
      id: string;
      name: string;
      angle: number; // degrees
      description?: string;
      priceModifier: number;
    }[];
    lengths: {
      id: string;
      name: string;
      length: number; // cm
      description?: string;
      priceModifier: number;
    }[];
    parts: {
      id: string;
      name: string;
      pieces: number;
      description?: string;
      priceModifier: number;
    }[];
  };
  sizingGuide?: {
    title: string;
    headers: string[];
    rows: {
      size: string;
      measurements: string[];
    }[];
  };
  slug: string;
} & Document;

export type IOrder = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  user: {
    name: string;
    email: string;
  };
  items: {
    variantId: Types.ObjectId;
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
  payment_method: string;
  total_price: number;
  order_placed_date: Date;
  order_shipped_date: Date | null;
  order_status: "pending" | "pending_payment" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled" | "declined" | "expired" | "error" | "ready_for_pickup" | "picked_up";
  tracking_number?: string;
  coupon?: {
    code: string;
    discount: number;
  };
  comments?: string;
} & Document;

export type IUser = {
  _id: Types.ObjectId;
  address: string[];
  sign_up_date: Date;
  last_login_date: Date;
  surname: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  oauth_provider?: string;
  orders: string[];
  bonus_points: number;
  verificationToken: string | null;
  isVerified: boolean;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  isAdmin?: boolean;
} & Document;

export type INewsletterEmail = {
  _id: Types.ObjectId;
  email: string;
  name: string;
  surname: string;
  date_subscribed: Date;
} & Document;

export type ISearchHistory = {
  _id: Types.ObjectId;
  search_term: string;
  date_searched: Date;
} & Document;

export type ISlide = {
  _id: Types.ObjectId;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
} & Document;

export type IReview = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  product: Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  helpful_votes: number;
  verified_purchase: boolean;
} & Document;

export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  categoryName: string;
  subcategoryName: string;
  variants: {
    id: string;
    sku: string;
    color: {
      name: string;
      hex: string;
    };
    price: number;
    current_sale_percentage: number;
    currentStock: number;
    sizeStock?: {
      size: string;
      stock: number;
      price?: number;
    }[];
    images: string[];
  }[];
  technicalSpecifications: {
    title: string;
    description: string;
  }[];
  shortDescription: string;
  isClothing: boolean;
  isPaddle: boolean;
  paddleConfigurator?: {
    enabled: boolean;
    materials: {
      id: string;
      name: string;
      description?: string;
      priceModifier: number;
      image?: string;
    }[];
    shaftTypes: {
      id: string;
      name: string;
      description?: string;
      priceModifier: number;
    }[];
    bladeAngles: {
      id: string;
      name: string;
      angle: number;
      description?: string;
      priceModifier: number;
    }[];
    lengths: {
      id: string;
      name: string;
      length: number;
      description?: string;
      priceModifier: number;
    }[];
    parts: {
      id: string;
      name: string;
      pieces: number;
      description?: string;
      priceModifier: number;
    }[];
  };
  sizingGuide?: {
    title: string;
    headers: string[];
    rows: {
      size: string;
      measurements: string[];
    }[];
  };
  slug: string;
}

// Input types for creating/updating products
export interface ProductVariantInput {
  sku: string;
  color: {
    name: string;
    hex: string;
  };
  price: number;
  current_sale_percentage?: number;
  currentStock: number;
  sizeStock?: {
    size: string;
    stock: number;
    price?: number;
  }[];
  images: string[];
}

export interface ProductInput {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  categoryName: string;
  subcategoryName: string;
  variants: ProductVariantInput[];
  technicalSpecifications: {
    title: string;
    description: string;
  }[];
  shortDescription: string;
  isClothing: boolean;
  isPaddle: boolean;
  paddleConfigurator?: {
    enabled: boolean;
    materials: {
      id: string;
      name: string;
      description?: string;
      priceModifier: number;
      image?: string;
    }[];
    shaftTypes: {
      id: string;
      name: string;
      description?: string;
      priceModifier: number;
    }[];
    bladeAngles: {
      id: string;
      name: string;
      angle: number;
      description?: string;
      priceModifier: number;
    }[];
    lengths: {
      id: string;
      name: string;
      length: number;
      description?: string;
      priceModifier: number;
    }[];
    parts: {
      id: string;
      name: string;
      pieces: number;
      description?: string;
      priceModifier: number;
    }[];
  };
  sizingGuide?: {
    title: string;
    headers: string[];
    rows: {
      size: string;
      measurements: string[];
    }[];
  };
}

// Coupon interfaces
export type ICoupon = {
  _id: Types.ObjectId;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount?: number;
  start_date: Date;
  end_date: Date;
  usage_limit: number;
  times_used: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
} & Document;

export type IAnnouncementBar = {
  _id: Types.ObjectId;
  text: string;
  backgroundColor: string;
  textColor: string;
  isEnabled: boolean;
} & Document;

// Schemas
const AddressSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  county: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
});

const CategorySchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image_url: { type: String, required: true },
  current_sale_percentage: { type: Number, default: 0 },
  subcategories: [{ type: Schema.Types.ObjectId, ref: "Subcategory" }],
  order: { type: Number, default: 0 },
  slug: { type: String, required: true, unique: true },
});

const SubcategorySchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image_url: { type: String, required: true },
  current_sale_percentage: { type: Number, default: 0 },
  products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  order: { type: Number, default: 0 },
  slug: { type: String, required: true, unique: true },
});

const ProductVariantSchema = new Schema(
  {
    sku: { type: String, required: true },
    color: {
      name: { type: String, required: true },
      hex: { type: String, required: true },
    },
    price: { type: Number, required: true },
    current_sale_percentage: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    sizeStock: [
      {
        size: { type: String, required: true },
        stock: { type: Number, required: true, default: 0 },
        price: { type: Number },
      },
    ],
    images: [{ type: String, required: true }],
  },
  { _id: true }
);

const ProductSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  subcategory: {
    type: Schema.Types.ObjectId,
    ref: "Subcategory",
    required: true,
  },
  categoryName: { type: String, required: true },
  subcategoryName: { type: String, required: true },
  variants: [ProductVariantSchema],
  technicalSpecifications: [
    {
      title: { type: String, required: true },
      description: { type: String, required: true },
    },
  ],
  shortDescription: { type: String, required: true },
  isClothing: { type: Boolean, default: false },
  isPaddle: { type: Boolean, default: false },
  paddleConfigurator: {
    enabled: { type: Boolean },
    materials: [
      {
        id: { type: String },
        name: { type: String },
        description: { type: String },
        priceModifier: { type: Number },
        image: { type: String },
      },
    ],
    shaftTypes: [
      {
        id: { type: String },
        name: { type: String },
        description: { type: String },
        priceModifier: { type: Number },
      },
    ],
    bladeAngles: [
      {
        id: { type: String },
        name: { type: String },
        angle: { type: Number },
        description: { type: String },
        priceModifier: { type: Number },
      },
    ],
    lengths: [
      {
        id: { type: String },
        name: { type: String },
        length: { type: Number },
        description: { type: String },
        priceModifier: { type: Number },
      },
    ],
    parts: [
      {
        id: { type: String },
        name: { type: String },
        pieces: { type: Number },
        description: { type: String },
        priceModifier: { type: Number },
      },
    ],
  },
  sizingGuide: {
    title: { type: String },
    headers: [{ type: String }],
    rows: [
      {
        size: { type: String },
        measurements: [{ type: String }],
      },
    ],
  },
  slug: { type: String, required: true, unique: true },
});

const OrderItemSchema = new Schema({
  variantId: {
    type: Schema.Types.ObjectId,
    ref: "ProductVariant",
    required: true,
  },
  variant: {
    sku: { type: String, required: true },
    productName: { type: String, required: true },
    color: {
      name: { type: String, required: true },
      hex: { type: String, required: true },
    },
    original_price: { type: Number, required: true },
    sale_percentage: { type: Number, required: true },
    size: { type: String },
    isPaddle: { type: Boolean, default: false },
    paddleConfiguration: {
      materialId: { type: String },
      shaftTypeId: { type: String },
      bladeAngleId: { type: String },
      lengthId: { type: String },
      partsId: { type: String },
      finalPrice: { type: Number },
      configurationSummary: {
        material: { type: String },
        shaftType: { type: String },
        bladeAngle: { type: String },
        length: { type: String },
        parts: { type: String },
      },
    },
  },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  size: { type: String },
});

const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  user: {
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  items: [OrderItemSchema],
  address: {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    county: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
  },
  payment_method: { type: String, required: true },
  total_price: { type: Number, required: true },
  order_placed_date: { type: Date, default: Date.now },
  order_shipped_date: { type: Date, default: null },
  order_status: { type: String, default: "pending" },
  tracking_number: { type: String },
  comments: { type: String },
  coupon: {
    code: { type: String },
    discount: { type: Number },
  },
});

const UserSchema = new Schema({
  address: [{ type: Schema.Types.ObjectId, ref: "Address" }],
  sign_up_date: { type: Date, default: Date.now },
  last_login_date: { type: Date },
  surname: { type: String, required: true },
  name: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function (this: IUser) {
      return !this.oauth_provider;
    },
  },
  oauth_provider: {
    type: String,
    enum: ["google", null],
    default: null,
  },
  orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
  bonus_points: { type: Number, default: 0 },
  verificationToken: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  isAdmin: { type: Boolean, default: false },
});

const SearchHistorySchema = new Schema<ISearchHistory>({
  search_term: { type: String, required: true },
  date_searched: { type: Date, default: Date.now },
});

const ReviewSchema = new Schema<IReview>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  helpful_votes: { type: Number, default: 0 },
  verified_purchase: { type: Boolean, default: false },
});

const NewsletterEmailSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  date_subscribed: { type: Date, default: Date.now },
});

const CarouselSchema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  order: { type: Number, default: 0 },
  cta: {
    text: { type: String, default: "Learn More" },
    link: { type: String, default: "#" },
    isEnabled: { type: Boolean, default: true },
  },
});

const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  description: { type: String, required: true },
  discount_type: { type: String, enum: ['percentage', 'fixed'], required: true },
  discount_value: { type: Number, required: true },
  min_purchase_amount: { type: Number, required: true, default: 0 },
  max_discount_amount: { type: Number },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  usage_limit: { type: Number, required: true },
  times_used: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const AnnouncementBarSchema = new Schema({
  text: { type: String, required: true },
  backgroundColor: { type: String, required: true },
  textColor: { type: String, required: true },
  isEnabled: { type: Boolean, default: false },
});

// Models
export const Address: Model<IAddress> =
  models.Address || model<IAddress>("Address", AddressSchema);
export const Category: Model<ICategory> =
  models.Category || model<ICategory>("Category", CategorySchema);
export const Subcategory: Model<ISubcategory> =
  models.Subcategory || model<ISubcategory>("Subcategory", SubcategorySchema);
export const Product: Model<IProduct> =
  models.Product || model<IProduct>("Product", ProductSchema);
export const Order: Model<IOrder> =
  models.Order || model<IOrder>("Order", OrderSchema);
export const User: Model<IUser> =
  models.User || model<IUser>("User", UserSchema);
export const SearchHistory: Model<ISearchHistory> =
  models.SearchHistory ||
  model<ISearchHistory>("SearchHistory", SearchHistorySchema);

export const Review: Model<IReview> =
  models.Review || model<IReview>("Review", ReviewSchema);
export const NewsletterEmail: Model<INewsletterEmail> =
  models.NewsletterEmail ||
  model<INewsletterEmail>("NewsletterEmail", NewsletterEmailSchema);
export const Carousel: Model<ICarousel> =
  models.Carousel || model<ICarousel>("Carousel", CarouselSchema);
export const Coupon: Model<ICoupon> = models.Coupon || model<ICoupon>("Coupon", CouponSchema);
export const AnnouncementBar: Model<IAnnouncementBar> = 
  models.AnnouncementBar || model<IAnnouncementBar>("AnnouncementBar", AnnouncementBarSchema);

// Export models object if needed
export const Models = {
  Address,
  Category,
  Subcategory,
  Product,
  Order,
  User,
  SearchHistory,
  Review,
  NewsletterEmail,
  Carousel,
  Coupon,
  AnnouncementBar,
};

export default Models;
