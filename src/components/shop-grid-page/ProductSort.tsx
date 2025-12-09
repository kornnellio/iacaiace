"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductSortProps {
  onSort: (sortBy: string) => void;
  defaultValue?: string;
}

export default function ProductSort({
  onSort,
  defaultValue = "newest",
}: ProductSortProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onSort(newValue);
  };

  return (
    <Select
      value={value}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest Arrivals</SelectItem>
        <SelectItem value="price-low">Price: Low to High</SelectItem>
        <SelectItem value="price-high">Price: High to Low</SelectItem>
        <SelectItem value="discount">Biggest Discount</SelectItem>
        <SelectItem value="name">Name A-Z</SelectItem>
      </SelectContent>
    </Select>
  );
}
