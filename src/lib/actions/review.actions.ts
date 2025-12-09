"use server";

import { connectToDatabase } from "../database";
import { Review, Order } from "@/lib/database/models/models";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

interface ReviewInput {
  userId: string;
  productId: string;
  rating: number;
  title: string;
  comment: string;
}

export interface ReviewResponse {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  title: string;
  comment: string;
  createdAt: Date;
  helpful_votes: number;
  verified_purchase: boolean;
}

interface ReviewActionReturn {
  error?: string;
  review?: ReviewResponse;
  reviews?: ReviewResponse[];
}

// Helper function to convert database review to response format
function convertToResponse(review: any): ReviewResponse {
  return {
    id: review._id.toString(),
    user: {
      id: review.user._id.toString(),
      name: review.user.name || "",
    },
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    createdAt: review.createdAt,
    helpful_votes: review.helpful_votes,
    verified_purchase: review.verified_purchase,
  };
}

export async function createReview(
  reviewData: ReviewInput
): Promise<ReviewActionReturn> {
  try {
    await connectToDatabase();

    // Check if user has purchased the product
    const hasOrder = await Order.findOne({
      user: new Types.ObjectId(reviewData.userId),
      "items.product": new Types.ObjectId(reviewData.productId),
      order_status: "delivered",
    });

    const review = await Review.create({
      user: new Types.ObjectId(reviewData.userId),
      product: new Types.ObjectId(reviewData.productId),
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment,
      verified_purchase: !!hasOrder,
    });

    await review.populate("user", "name");
    revalidatePath(`/products/${reviewData.productId}`);

    return { review: convertToResponse(review) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create review",
    };
  }
}

export async function getProductReviews(
  productId: string
): Promise<ReviewActionReturn> {
  try {
    await connectToDatabase();

    const reviews = await Review.find({
      product: new Types.ObjectId(productId),
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    return {
      reviews: reviews.map((review) => convertToResponse(review)),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch reviews",
    };
  }
}
