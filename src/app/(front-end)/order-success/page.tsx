import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function OrderSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center space-y-6">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
        <h1 className="text-2xl font-bold">Order Placed Successfully!</h1>
        <p className="text-gray-600">
          Thank you for your purchase. You will receive an email confirmation
          shortly.
        </p>
        <div className="space-y-4">
          <Button
            asChild
            className="w-full"
          >
            <Link href="/profile">View Orders</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full"
          >
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
