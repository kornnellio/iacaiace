"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { stripHtml } from "@/components/shared/HtmlContent";
import { stripHtmlServer } from "@/lib/utils";

interface CategorySearchBarProps {
  categoryId?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  className?: string;
  onSearch: (query: string) => void;
}

export default function CategorySearchBar({
  categoryId,
  categorySlug,
  subcategorySlug,
  className = "",
  onSearch
}: CategorySearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Clean category and subcategory slugs from any HTML
  // Use client-side stripHtml for client components
  const cleanCategorySlug = categorySlug ? stripHtml(categorySlug) : "";
  const cleanSubcategorySlug = subcategorySlug ? stripHtml(subcategorySlug) : "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery.trim());
  };

  // Call onSearch as user types (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  return (
    <div className={`${className}`}>
      <form onSubmit={handleSearch} className="flex items-center space-x-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <Input
            type="text"
            placeholder={cleanSubcategorySlug 
              ? `Caută în ${cleanSubcategorySlug}...` 
              : cleanCategorySlug 
                ? `Caută în ${cleanCategorySlug}...` 
                : "Caută produse..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 w-full bg-gray-50 border-gray-200 focus:bg-white transition-colors rounded-full"
          />
        </div>
        <Button 
          type="submit" 
          className="rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Caută
        </Button>
      </form>
    </div>
  );
} 
