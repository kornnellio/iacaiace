"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import { createReview } from "@/lib/actions/review.actions";
import { toast } from "@/hooks/use-toast";

interface ReviewFormProps {
  productId: string;
  userId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, userId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Vă rugăm să selectați o notă",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createReview({
        userId,
        productId,
        rating,
        title,
        comment,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Succes",
        description: "Recenzia a fost trimisă cu succes",
      });

      setRating(0);
      setTitle("");
      setComment("");
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Eroare",
        description:
          error instanceof Error ? error.message : "Nu s-a putut trimite recenzia",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium">Notă</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((index) => (
            <button
              key={index}
              type="button"
              className="focus:outline-none"
              onMouseEnter={() => setHoverRating(index)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(index)}
            >
              <Star
                className={`h-6 w-6 ${
                  index <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Titlu</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Rezumați recenzia dumneavoastră"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Recenzie</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Scrieți recenzia dumneavoastră aici"
          required
          rows={4}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Se trimite..." : "Trimite Recenzia"}
      </Button>
    </form>
  );
}
