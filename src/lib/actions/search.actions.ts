"use server";

import { connectToDatabase } from "../database";
import { SearchHistory } from "@/lib/database/models/models";

interface PopularSearch {
  term: string;
  count: number;
}

export async function getPopularSearches(limit = 10): Promise<{
  popularSearches?: PopularSearch[];
  error?: string;
}> {
  try {
    await connectToDatabase();
    
    // Aggregate to find the most popular search terms
    const popularSearches = await SearchHistory.aggregate([
      {
        $group: {
          _id: { $toLower: "$search_term" },
          count: { $sum: 1 },
          original_term: { $first: "$search_term" }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 0,
          term: "$original_term",
          count: 1
        }
      }
    ]);
    
    return { popularSearches };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch popular searches",
    };
  }
}

export async function getRecentSearches(limit = 10): Promise<{
  recentSearches?: string[];
  error?: string;
}> {
  try {
    await connectToDatabase();
    
    // Find the most recent search terms
    const recentSearches = await SearchHistory.find()
      .sort({ date_searched: -1 })
      .limit(limit)
      .distinct("search_term");
    
    return { recentSearches };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch recent searches",
    };
  }
} 