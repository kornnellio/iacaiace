"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { searchProducts } from "@/lib/actions/product.actions";
import { getRecentSearches } from "@/lib/actions/search.actions";
import { ProductResponse } from "@/lib/database/models/models";
import { Loader2, Clock, Search as SearchIcon, TrendingUp } from "lucide-react";
import { stripHtml } from "./HtmlContent";

interface SearchSuggestionsProps {
  query: string;
  onSelectSuggestion?: () => void;
}

export default function SearchSuggestions({
  query,
  onSelectSuggestion,
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ProductResponse[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent searches on component mount
  useEffect(() => {
    const fetchRecentSearches = async () => {
      try {
        const { recentSearches, error } = await getRecentSearches(5);
        if (!error && recentSearches) {
          setRecentSearches(recentSearches);
        }
      } catch (err) {
        console.error("Failed to fetch recent searches", err);
      }
    };

    fetchRecentSearches();
  }, []);

  // Fetch product suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query || query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { products, error } = await searchProducts(query);
        
        if (error) {
          setError(error);
          setSuggestions([]);
        } else {
          setSuggestions(products || []);
        }
      } catch (err) {
        setError("Failed to fetch suggestions");
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search to avoid too many requests
    const debounceTimer = setTimeout(fetchSuggestions, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // If query is empty and we have recent searches, show them
  if (!query || query.trim().length < 2) {
    if (recentSearches.length > 0) {
      return (
        <div className="absolute z-10 w-full bg-white shadow-lg rounded-md mt-2 border overflow-hidden">
          <div className="p-3 border-b flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Căutări recente</h3>
          </div>
          <ul className="max-h-60 overflow-y-auto divide-y divide-gray-100">
            {recentSearches.map((term, index) => (
              <li key={index}>
                <Link
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="flex items-center p-3 hover:bg-gray-50 transition-colors"
                  onClick={onSelectSuggestion}
                >
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm">{stripHtml(term)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="absolute z-10 w-full bg-white shadow-lg rounded-md mt-2 border overflow-hidden">
      {loading && (
        <div className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
          <p className="text-sm text-gray-500 mt-2">Se caută...</p>
        </div>
      )}

      {error && (
        <div className="p-4 text-center text-red-500 text-sm">{error}</div>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          <SearchIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
          <p>Nu am găsit produse pentru "{stripHtml(query)}"</p>
        </div>
      )}

      {!loading && !error && suggestions.length > 0 && (
        <>
          <div className="p-3 border-b flex items-center">
            <SearchIcon className="h-4 w-4 mr-2 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Rezultate</h3>
          </div>
          <ul className="max-h-60 overflow-y-auto divide-y divide-gray-100">
            {suggestions.slice(0, 5).map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.id}`}
                  className="block p-3 hover:bg-gray-50 transition-colors"
                  onClick={onSelectSuggestion}
                >
                  <div className="flex items-center">
                    {product.variants[0]?.images[0] && (
                      <div className="w-12 h-12 mr-3 flex-shrink-0 rounded overflow-hidden border border-gray-200">
                        <img
                          src={product.variants[0].images[0]}
                          alt={stripHtml(product.name)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{stripHtml(product.name)}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {stripHtml(product.shortDescription)}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-sm font-semibold text-blue-600">
                          {product.variants[0]?.price.toFixed(2)} RON
                        </span>
                        {product.variants[0]?.current_sale_percentage > 0 && (
                          <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                            -{product.variants[0].current_sale_percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            
            {suggestions.length > 5 && (
              <li className="p-3 text-center bg-gray-50">
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  onClick={onSelectSuggestion}
                >
                  Vezi toate rezultatele ({suggestions.length})
                </Link>
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  );
} 
