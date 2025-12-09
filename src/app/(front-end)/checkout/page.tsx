import { redirect } from "next/navigation";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/checkout/OrderSummary";
import { auth } from "@/lib/auth/authOptions";

export default async function CheckoutPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="container mx-auto px-4 py-12 mt-16">
      <h1 className="text-3xl font-bold mb-8">Finalizare Comandă</h1>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        <div className="lg:col-span-7">
          <CheckoutForm userId={session.user.id} />
        </div>
        <div className="lg:col-span-5">
          <OrderSummary />
        </div>
      </div>
    </main>
  );
}
