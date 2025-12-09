"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { getOrder } from "@/lib/actions/order.actions";
import type { OrderResponse } from "@/lib/actions/order.actions";

const STATUS_CONFIG = {
  pending_payment: {
    title: "Se procesează plata...",
    description: "Vă rugăm să nu închideți această fereastră",
    icon: Clock,
    color: "text-blue-500",
    shouldPoll: true
  },
  processing: {
    title: "Se procesează plata...",
    description: "Vă rugăm să nu închideți această fereastră",
    icon: Clock,
    color: "text-blue-500",
    shouldPoll: true
  },
  payment_confirmed: {
    title: "Plată efectuată cu succes!",
    description: "Vă mulțumim pentru comandă. O vom procesa în cel mai scurt timp.",
    icon: CheckCircle2,
    color: "text-green-500",
    shouldPoll: false
  },
  confirmed: {
    title: "Plată efectuată cu succes!",
    description: "Vă mulțumim pentru comandă. O vom procesa în cel mai scurt timp.",
    icon: CheckCircle2,
    color: "text-green-500",
    shouldPoll: false
  },
  declined: {
    title: "Plată respinsă",
    description: "Plata a fost respinsă de bancă. Vă rugăm să încercați din nou cu un alt card.",
    icon: XCircle,
    color: "text-red-500",
    shouldPoll: false
  },
  expired: {
    title: "Plată expirată",
    description: "Sesiunea de plată a expirat. Vă rugăm să încercați din nou.",
    icon: XCircle,
    color: "text-red-500",
    shouldPoll: false
  },
  error: {
    title: "Eroare la procesarea plății",
    description: "A apărut o eroare la procesarea plății. Vă rugăm să încercați din nou.",
    icon: AlertCircle,
    color: "text-red-500",
    shouldPoll: false
  },
  cancelled: {
    title: "Plată anulată",
    description: "Plata a fost anulată. Vă rugăm să încercați din nou dacă doriți să continuați comanda.",
    icon: XCircle,
    color: "text-red-500",
    shouldPoll: false
  }
};

export default function OrderConfirmation() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [result, setResult] = useState<{ order?: OrderResponse }>();

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (!orderId) {
      setStatus("error");
      setError("No order ID provided");
      return;
    }

    const checkOrderStatus = async () => {
      try {
        const result = await getOrder(orderId);
        setResult(result);
        
        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.order) {
          throw new Error("Order not found");
        }

        setOrderStatus(result.order.order_status);

        const statusInfo = STATUS_CONFIG[result.order.order_status as keyof typeof STATUS_CONFIG];
        if (!statusInfo) {
          setStatus("error");
          setError("Invalid order status");
          return;
        }

        // If we should continue polling
        if (statusInfo.shouldPoll) {
          setTimeout(checkOrderStatus, 2000);
          return;
        }

        // Set final status based on the order status
        if (result.order.order_status === "confirmed" || result.order.order_status === "payment_confirmed") {
          setStatus("success");
        } else {
          setStatus("error");
          setError(statusInfo.description);
        }
      } catch (error) {
        setStatus("error");
        setError(error instanceof Error ? error.message : "Failed to check order status");
      }
    };

    void checkOrderStatus();
  }, [searchParams]);

  const statusInfo = orderStatus ? STATUS_CONFIG[orderStatus as keyof typeof STATUS_CONFIG] : null;

  const handleRetry = async (order: OrderResponse) => {
    if (order.comments) {
      // Try to find the payment URL from the comments
      const urlMatch = order.comments.match(/URL plată: (https:\/\/[^\s]+)/);
      if (urlMatch) {
        // Open Netopia in new window
        window.open(urlMatch[1], '_blank', 'noopener,noreferrer');
        return;
      }
    }
    // If no payment URL found, redirect to checkout
    router.push("/checkout");
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Stare Comandă
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && statusInfo && (
            <div className="text-center py-8">
              <statusInfo.icon className={`h-12 w-12 ${statusInfo.color} mx-auto`} />
              <h2 className="mt-4 text-xl font-semibold">
                {statusInfo.title}
              </h2>
              <p className="mt-2 text-gray-600">
                {statusInfo.description}
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="mt-4 text-xl font-semibold">
                Plată efectuată cu succes!
              </h2>
              <p className="mt-2 text-gray-600">
                Vă mulțumim pentru comandă. O vom procesa în cel mai scurt timp.
              </p>
              <Button asChild className="mt-6">
                <Link href="/profile">
                  Vezi Comenzile Tale
                </Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              {statusInfo ? (
                <>
                  <statusInfo.icon className={`h-12 w-12 ${statusInfo.color} mx-auto`} />
                  <h2 className="mt-4 text-xl font-semibold text-red-500">
                    {statusInfo.title}
                  </h2>
                  <p className="mt-2 text-gray-600">
                    {statusInfo.description}
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                  <h2 className="mt-4 text-xl font-semibold text-red-500">
                    Eroare
                  </h2>
                  <p className="mt-2 text-gray-600">
                    {error || "A apărut o eroare la procesarea plății."}
                  </p>
                </>
              )}
              <div className="flex flex-col gap-3 mt-6">
                <Button asChild variant="outline">
                  <Link href="/profile">
                    Vezi Comenzile Tale
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 