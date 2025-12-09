"use client";

import React, { useEffect, useState } from "react";
import {
  deleteProduct,
  getProducts,
  updateVariantStock,
  updateVariantSizeStock,
} from "@/lib/actions/product.actions";
import { getCategories } from "@/lib/actions/category.actions";
import { getSubcategoriesByCategory } from "@/lib/actions/subcategory.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDown,
  ArrowUp,
  Filter,
  ImageOff,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import ProductForm from "./ProductForm";
import { toast } from "@/hooks/use-toast";
import { ProductResponse } from "@/lib/database/models/models";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
}

const ProductControlPanel = () => {
  const router = useRouter();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set()
  );

  // Load initial data
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [productsResult, categoriesResult] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      if (productsResult.error) throw new Error(productsResult.error);
      if (categoriesResult.error) throw new Error(categoriesResult.error);

      setProducts(productsResult.products || []);
      setCategories(categoriesResult.categories || []);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch data";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    const loadSubcategories = async () => {
      if (selectedCategory && selectedCategory !== "all") {
        const result = await getSubcategoriesByCategory(selectedCategory);
        if (result.subcategories) {
          setSubcategories(result.subcategories);
        }
      } else {
        setSubcategories([]);
      }
    };
    void loadSubcategories();
    setSelectedSubcategory("all");
  }, [selectedCategory]);

  const handleDeleteProduct = async (productId: string) => {
    try {
      setIsDeleting(true);
      const result = await deleteProduct(productId);

      if (result.error) {
        throw new Error(result.error);
      }

      setProducts((prev) => prev.filter((product) => product.id !== productId));
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete product";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleUpdateStock = async (
    productId: string,
    variantId: string,
    currentStock: number,
    newStock: number,
    productName: string,
    variantColor: string
  ) => {
    try {
      const result = await updateVariantStock(productId, variantId, newStock);
      if (result.error) {
        throw new Error(result.error);
      }

      // Update local state
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? {
                ...product,
                variants: product.variants.map((variant) =>
                  variant.id === variantId
                    ? { ...variant, currentStock: newStock }
                    : variant
                ),
              }
            : product
        )
      );

      toast({
        title: "Stock updated",
        description: `Updated stock for ${productName} (${variantColor})`,
      });
    } catch (error) {
      // Revert the input value on error
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? {
                ...product,
                variants: product.variants.map((variant) =>
                  variant.id === variantId
                    ? { ...variant, currentStock: currentStock }
                    : variant
                ),
              }
            : product
        )
      );

      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update stock",
      });
    }
  };

  const handleUpdateSizeStock = async (
    productId: string,
    variantId: string,
    size: string,
    currentStock: number,
    newStock: number,
    productName: string,
    variantColor: string
  ) => {
    try {
      const result = await updateVariantSizeStock(
        productId,
        variantId,
        size,
        newStock
      );
      if (result.error) {
        throw new Error(result.error);
      }

      // Update local state
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? {
                ...product,
                variants: product.variants.map((variant) =>
                  variant.id === variantId
                    ? {
                        ...variant,
                        sizeStock: (variant.sizeStock || []).map((s) =>
                          s.size === size ? { ...s, stock: newStock } : s
                        ),
                      }
                    : variant
                ),
              }
            : product
        )
      );

      toast({
        title: "Stock updated",
        description: `Updated stock for ${productName} (${variantColor} - Size ${size})`,
      });
    } catch (error) {
      // Revert the input value on error
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? {
                ...product,
                variants: product.variants.map((variant) =>
                  variant.id === variantId
                    ? {
                        ...variant,
                        sizeStock: (variant.sizeStock || []).map((s) =>
                          s.size === size ? { ...s, stock: currentStock } : s
                        ),
                      }
                    : variant
                ),
              }
            : product
        )
      );

      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update stock",
      });
    }
  };

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const matchesSubcategory =
      selectedSubcategory === "all" ||
      product.subcategory === selectedSubcategory;

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "RON",
    }).format(price);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-muted-foreground">Loading products...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl">Products</CardTitle>
            <CardDescription>Manage your product catalog</CardDescription>
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => router.push("/control-panel/products/new")}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadData()}
                className="ml-2"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCategory !== "all" && (
                <Select
                  value={selectedSubcategory}
                  onValueChange={setSelectedSubcategory}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subcategories</SelectItem>
                    {subcategories.map((subcategory) => (
                      <SelectItem
                        key={subcategory.id}
                        value={subcategory.id}
                      >
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Products Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Total Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <React.Fragment key={product.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleProductExpansion(product.id)}
                      >
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>{product.categoryName}</TableCell>
                        <TableCell>{product.subcategoryName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {product.variants.length} variants
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.variants.reduce((sum, variant) => {
                              if (
                                product.isClothing &&
                                variant.sizeStock?.length
                              ) {
                                return (
                                  sum +
                                  variant.sizeStock.reduce(
                                    (sizeSum, size) => sizeSum + size.stock,
                                    0
                                  )
                                );
                              }
                              return sum + variant.currentStock;
                            }, 0)}{" "}
                            total
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/control-panel/products/${product.id}/edit`
                                );
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(product);
                                setIsDeleteDialogOpen(true);
                              }}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {expandedProducts.has(product.id) && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="p-4 space-y-6">
                              {/* Variants Table */}
                              <div>
                                <h4 className="font-semibold mb-2">Variants</h4>
                                <div className="border rounded-lg">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Color</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Sale %</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Images</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {product.variants.map((variant) => (
                                        <TableRow key={variant.id}>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <div
                                                className="w-4 h-4 rounded-full border"
                                                style={{
                                                  backgroundColor:
                                                    variant.color.hex,
                                                }}
                                              />
                                              {variant.color.name}
                                            </div>
                                          </TableCell>
                                          <TableCell>{variant.sku}</TableCell>
                                          <TableCell>
                                            {new Intl.NumberFormat("en-US", {
                                              style: "currency",
                                              currency: "RON",
                                            }).format(variant.price)}
                                          </TableCell>
                                          <TableCell>
                                            {variant.current_sale_percentage >
                                              0 && (
                                              <Badge variant="destructive">
                                                {
                                                  variant.current_sale_percentage
                                                }
                                                % OFF
                                              </Badge>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              {product.isClothing &&
                                              variant.sizeStock?.length ? (
                                                <div className="space-y-2">
                                                  {variant.sizeStock.map(
                                                    (sizeStock, idx) => (
                                                      <div
                                                        key={idx}
                                                        className="flex items-center gap-2"
                                                      >
                                                        <span className="text-sm text-gray-500 w-12">
                                                          {sizeStock.size}:
                                                        </span>
                                                        <Input
                                                          type="number"
                                                          min="0"
                                                          value={
                                                            sizeStock.stock
                                                          }
                                                          onChange={(e) => {
                                                            const newStock =
                                                              parseInt(
                                                                e.target.value
                                                              );
                                                            if (
                                                              !isNaN(newStock)
                                                            ) {
                                                              handleUpdateSizeStock(
                                                                product.id,
                                                                variant.id,
                                                                sizeStock.size,
                                                                sizeStock.stock,
                                                                newStock,
                                                                product.name,
                                                                variant.color
                                                                  .name
                                                              );
                                                            }
                                                          }}
                                                          className="w-20"
                                                        />
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              ) : (
                                                <Input
                                                  type="number"
                                                  min="0"
                                                  value={variant.currentStock}
                                                  onChange={(e) => {
                                                    const newStock = parseInt(
                                                      e.target.value
                                                    );
                                                    if (!isNaN(newStock)) {
                                                      handleUpdateStock(
                                                        product.id,
                                                        variant.id,
                                                        variant.currentStock,
                                                        newStock,
                                                        product.name,
                                                        variant.color.name
                                                      );
                                                    }
                                                  }}
                                                  className="w-20"
                                                />
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex gap-2">
                                              {variant.images
                                                .slice(0, 3)
                                                .map((image, index) => (
                                                  <img
                                                    key={index}
                                                    src={image}
                                                    alt={`${product.name} - ${
                                                      variant.color.name
                                                    } - ${index + 1}`}
                                                    className="w-8 h-8 rounded-full border border-white object-cover"
                                                    onError={(e) => {
                                                      const target =
                                                        e.target as HTMLImageElement;
                                                      target.onerror = null;
                                                      target.src =
                                                        "/placeholder.png";
                                                    }}
                                                  />
                                                ))}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8"
                    >
                      {searchTerm ||
                      selectedCategory !== "all" ||
                      selectedSubcategory !== "all"
                        ? "No matching products found"
                        : "No products yet"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product "{selectedProduct?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() =>
                selectedProduct && void handleDeleteProduct(selectedProduct.id)
              }
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ProductControlPanel;
