import { NextResponse } from "next/server";
import { applyCouponUsage } from "@/lib/actions/coupon.actions";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    const result = await applyCouponUsage(code);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error applying coupon usage:", error);
    return NextResponse.json(
      { error: "Failed to apply coupon usage" },
      { status: 500 }
    );
  }
}