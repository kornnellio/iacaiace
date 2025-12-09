"use server";

import { connectToDatabase } from "../database";
import { Coupon } from "@/lib/database/models/models";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

// Input type
interface CouponInput {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount?: number;
  start_date: Date;
  end_date: Date;
  usage_limit: number;
}

// Response type
interface CouponResponse {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount?: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  times_used: number;
  is_active: boolean;
}

interface CouponActionReturn {
  error?: string;
  coupon?: CouponResponse;
}

interface CouponsActionReturn {
  error?: string;
  coupons?: CouponResponse[];
}

// Helper function to convert Coupon to CouponResponse
function convertToResponse(coupon: any): CouponResponse {
  return {
    id: coupon._id.toString(),
    code: coupon.code,
    description: coupon.description,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    min_purchase_amount: coupon.min_purchase_amount,
    max_discount_amount: coupon.max_discount_amount,
    start_date: coupon.start_date.toISOString(),
    end_date: coupon.end_date.toISOString(),
    usage_limit: coupon.usage_limit,
    times_used: coupon.times_used,
    is_active: coupon.is_active,
  };
}

// Create new coupon
export async function createCoupon(
  couponData: CouponInput
): Promise<CouponActionReturn> {
  try {
    await connectToDatabase();
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      start_date,
      end_date,
      usage_limit,
    } = couponData;

    // Validate required fields
    if (!code || !description || !discount_type || !discount_value) {
      throw new Error("Required fields are missing");
    }

    // Validate discount value
    if (discount_type === 'percentage' && (discount_value <= 0 || discount_value > 100)) {
      throw new Error("Percentage discount must be between 0 and 100");
    }

    if (discount_type === 'fixed' && discount_value <= 0) {
      throw new Error("Fixed discount must be greater than 0");
    }

    // Validate dates
    if (new Date(end_date) <= new Date(start_date)) {
      throw new Error("End date must be after start date");
    }

    // Check for existing coupon with same code
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      throw new Error("A coupon with this code already exists");
    }

    const coupon = await Coupon.create({
      ...couponData,
      code: code.toUpperCase(),
    });

    revalidatePath("/control-panel/coupons");

    return {
      coupon: convertToResponse(coupon),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create coupon",
    };
  }
}

// Get all coupons
export async function getCoupons(): Promise<CouponsActionReturn> {
  try {
    await connectToDatabase();
    const coupons = await Coupon.find().sort({ created_at: -1 });
    return {
      coupons: coupons.map(convertToResponse),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch coupons",
    };
  }
}

// Get single coupon
export async function getCoupon(id: string): Promise<CouponActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid coupon ID");
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new Error("Coupon not found");
    }

    return {
      coupon: convertToResponse(coupon),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch coupon",
    };
  }
}

// Update coupon
export async function updateCoupon(
  id: string,
  couponData: Partial<CouponInput>
): Promise<CouponActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid coupon ID");
    }

    // If updating code, check for duplicates
    if (couponData.code) {
      const existingCoupon = await Coupon.findOne({
        code: couponData.code.toUpperCase(),
        _id: { $ne: id },
      });
      if (existingCoupon) {
        throw new Error("A coupon with this code already exists");
      }
      couponData.code = couponData.code.toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { ...couponData, updated_at: new Date() },
      { new: true }
    );

    if (!coupon) {
      throw new Error("Coupon not found");
    }

    revalidatePath("/control-panel/coupons");

    return {
      coupon: convertToResponse(coupon),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update coupon",
    };
  }
}

// Delete coupon
export async function deleteCoupon(id: string): Promise<{ error?: string }> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid coupon ID");
    }

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      throw new Error("Coupon not found");
    }

    revalidatePath("/control-panel/coupons");

    return {};
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete coupon",
    };
  }
}

// Validate and apply coupon
export async function validateCoupon(
  code: string,
  cartTotal: number
): Promise<{
  error?: string;
  discount?: number;
  coupon?: CouponResponse;
}> {
  try {
    await connectToDatabase();

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      throw new Error("Cuponul introdus nu este valid");
    }

    // Check if coupon is active
    if (!coupon.is_active) {
      throw new Error("Acest cupon nu mai este activ");
    }

    // Check dates
    const now = new Date();
    if (now < coupon.start_date || now > coupon.end_date) {
      throw new Error("Acest cupon a expirat sau nu este încă valid");
    }

    // Check usage limit
    if (coupon.times_used >= coupon.usage_limit) {
      throw new Error("Acest cupon a atins limita maximă de utilizări");
    }

    // Check minimum purchase amount
    if (cartTotal < coupon.min_purchase_amount) {
      throw new Error(`Pentru a folosi acest cupon, comanda minimă trebuie să fie de ${coupon.min_purchase_amount} RON`);
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      // Calculate percentage discount
      discount = Number((cartTotal * coupon.discount_value / 100).toFixed(2));
      // Apply maximum discount limit if set
      if (coupon.max_discount_amount) {
        discount = Number(Math.min(discount, coupon.max_discount_amount).toFixed(2));
      }
      // Ensure discount doesn't exceed cart total
      discount = Number(Math.min(discount, cartTotal).toFixed(2));
    } else {
      // For fixed discount, ensure it doesn't exceed cart total
      discount = Number(Math.min(coupon.discount_value, cartTotal).toFixed(2));
    }

    return {
      discount,
      coupon: convertToResponse(coupon),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nu s-a putut valida cuponul",
    };
  }
}

// Apply coupon usage
export async function applyCouponUsage(id: string): Promise<{ error?: string }> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid coupon ID");
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $inc: { times_used: 1 } },
      { new: true }
    );

    if (!coupon) {
      throw new Error("Coupon not found");
    }

    return {};
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to apply coupon usage",
    };
  }
} 