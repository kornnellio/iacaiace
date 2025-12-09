"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SearchSuggestions from "./SearchSuggestions";
import { stripHtml } from "./HtmlContent";

interface SearchBarProps {
  initialQuery?: string;
  className?: string;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
}

export default function SearchBar({ 
  initialQuery = "", 
  className = "",
  onSearch,
  autoFocus = false
}: SearchBarProps) {
  // Clean initial query from any HTML
  const cleanInitialQuery = stripHtml(initialQuery);
  const [searchQuery, setSearchQuery] = useState(cleanInitialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
      setShowSuggestions(false);
      // Blur the input to hide mobile keyboard
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Auto focus if needed
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div ref={searchContainerRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="flex items-center space-x-2">
        <div className="relative flex-1 group">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          
          <Input
            ref={inputRef}
            type="text"
            placeholder="Caută produse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(stripHtml(e.target.value))}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-10 w-full bg-gray-50 border-gray-200 focus:bg-white transition-colors rounded-full"
          />
          
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button 
          type="submit" 
          className="rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Caută
        </Button>
      </form>
      
      {showSuggestions && (
        <SearchSuggestions 
          query={searchQuery} 
          onSelectSuggestion={() => {
            setShowSuggestions(false);
            // Blur the input to hide mobile keyboard
            if (inputRef.current) {
              inputRef.current.blur();
            }
          }} 
        />
      )}
    </div>
  );
} 
