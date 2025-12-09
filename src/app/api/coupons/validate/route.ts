import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/actions/coupon.actions";

export async function POST(request: Request) {
  try {
    const { code, cartTotal } = await request.json();

    if (!code || typeof cartTotal !== 'number') {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    const result = await validateCoupon(code, cartTotal);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      coupon: result.coupon,
      discount: result.discount,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
} 