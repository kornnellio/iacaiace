"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCategories } from "@/lib/actions/category.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

interface SearchFiltersProps {
  className?: string;
}

export default function SearchFilters({ className = "" }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") || "all"
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get("sort") || "relevance"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const { categories, error } = await getCategories();
        if (!error && categories) {
          setCategories(categories.map(cat => ({ id: cat.id, name: cat.name })));
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const applyFilters = () => {
    const query = searchParams.get("q") || "";
    const params = new URLSearchParams();
    
    if (query) params.set("q", query);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (sortBy !== "relevance") params.set("sort", sortBy);
    
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    const query = searchParams.get("q") || "";
    setSelectedCategory("all");
    setSortBy("relevance");
    
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/search");
    }
  };

  const hasActiveFilters = selectedCategory !== "all" || sortBy !== "relevance";

  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      <div className="flex-1 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categorie
            </label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toate categoriile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate categoriile</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sortează după
            </label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Relevanță" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevanță</SelectItem>
                <SelectItem value="price-low">Preț (crescător)</SelectItem>
                <SelectItem value="price-high">Preț (descrescător)</SelectItem>
                <SelectItem value="name">Nume (A-Z)</SelectItem>
                <SelectItem value="discount">Reducere</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <Button onClick={applyFilters} className="flex-1 sm:flex-none">
          <Filter className="h-4 w-4 mr-2" />
          Aplică filtre
        </Button>
        
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="flex-1 sm:flex-none">
            <X className="h-4 w-4 mr-2" />
            Resetează
          </Button>
        )}
      </div>
    </div>
  );
} 