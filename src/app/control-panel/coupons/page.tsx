import { Metadata } from "next";
import CouponControlPanel from "@/components/control-panel/coupon/CouponControlPanel";

export const metadata: Metadata = {
  title: "Coupon Management - Control Panel",
  description: "Manage discount coupons for your store",
};

export default function CouponsPage() {
  return (
    <div className="container mx-auto py-10">
      <CouponControlPanel />
    </div>
  );
} 