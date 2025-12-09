"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewForm } from "./ReviewForm";
import {
  getProductReviews,
  type ReviewResponse,
} from "@/lib/actions/review.actions";
import { useSession } from "next-auth/react";

interface ReviewsProps {
  productId: string;
}

export function Reviews({ productId }: ReviewsProps) {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  const loadReviews = async () => {
    setIsLoading(true);
    const result = await getProductReviews(productId);
    if (result.reviews) {
      setReviews(result.reviews);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void loadReviews();
  }, [productId]);

  if (isLoading) {
    return <div className="text-center py-8">Se încarcă recenziile...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Recenziile Clienților</h2>

      {session?.user && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Scrie o Recenzie</h3>
            <ReviewForm
              productId={productId}
              userId={session.user.id}
              onSuccess={loadReviews}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    {review.verified_purchase && (
                      <Badge variant="secondary">Achiziție Verificată</Badge>
                    )}
                  </div>
                  <h4 className="font-semibold">{review.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    De {review.user.name} pe{" "}
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm">{review.comment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
