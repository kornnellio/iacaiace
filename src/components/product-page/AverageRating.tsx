"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { getProductReviews } from "@/lib/actions/review.actions";

interface AverageRatingProps {
  productId: string;
}

export function AverageRating({ productId }: AverageRatingProps) {
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    async function loadRating() {
      const result = await getProductReviews(productId);
      if (result.reviews && result.reviews.length > 0) {
        const average =
          result.reviews.reduce((acc, review) => acc + review.rating, 0) /
          result.reviews.length;
        setAverageRating(average);
        setTotalReviews(result.reviews.length);
      }
    }
    void loadRating();
  }, [productId]);

  if (totalReviews === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= averageRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <span className="text-gray-600">
        ({averageRating.toFixed(1)}) {totalReviews} Reviews
      </span>
    </div>
  );
}
