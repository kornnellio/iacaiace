"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createProduct,
  updateProduct,
  updateVariantSizeStock,
} from "@/lib/actions/product.actions";
import { getCategories } from "@/lib/actions/category.actions";
import { getSubcategoriesByCategory } from "@/lib/actions/subcategory.actions";
import {
  Card,
  Card as VariantCard,
  CardContent,
  CardContent as VariantCardContent,
  CardHeader as VariantCardHeader,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Plus, Trash2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  ProductInput,
  ProductResponse,
  ProductVariantInput,
} from "@/lib/database/models/models";
import ColorPicker from "@/components/shared/ColorPicker";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { Editor } from "@tinymce/tinymce-react";

export interface Color {
  name: string;
  hex: string;
}

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
}

interface ProductFormProps {
  product?: ProductResponse | null;
  defaultCategoryId?: string;
  defaultSubcategoryId?: string;
  onSuccess?: (product: ProductResponse) => void;
}

const emptyVariant = (): ProductVariantInput => ({
  sku: "",
  color: {
    name: "",
    hex: "#000000",
  },
  price: 0,
  current_sale_percentage: 0,
  currentStock: 0,
  sizeStock: [],
  images: [],
});

interface TechnicalSpec {
  title: string;
  description: string;
}

const ProductForm = ({
  product = null,
  defaultCategoryId = "",
  defaultSubcategoryId = "",
  onSuccess = () => {},
}: ProductFormProps) => {
  const emptyFormData: ProductInput = {
    name: "",
    description: "",
    category: defaultCategoryId,
    subcategory: defaultSubcategoryId,
    categoryName: "",
    subcategoryName: "",
    variants: [emptyVariant()],
    technicalSpecifications: [],
    shortDescription: "",
    isClothing: false,
    isPaddle: false,
    paddleConfigurator: {
      enabled: false,
      materials: [],
      shaftTypes: [],
      bladeAngles: [],
      lengths: [],
      parts: [],
    },
    sizingGuide: {
      title: "",
      headers: [
        "Size",
        "Height (cm)",
        "Bust (cm)",
        "Waist (cm)",
        "Hips (cm)",
        "Inside leg (cm)",
      ],
      rows: [],
    },
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [formData, setFormData] = useState<ProductInput>(
    product
      ? {
          name: product.name,
          description: product.description,
          category: product.category,
          subcategory: product.subcategory,
          categoryName: product.categoryName,
          subcategoryName: product.subcategoryName,
          variants: product.variants,
          technicalSpecifications: product.technicalSpecifications,
          shortDescription: product.shortDescription,
          isClothing: product.isClothing || false,
          isPaddle: product.isPaddle || false,
          paddleConfigurator: product.paddleConfigurator || {
            enabled: false,
            materials: [],
            shaftTypes: [],
            bladeAngles: [],
            lengths: [],
            parts: [],
          },
          sizingGuide: product.sizingGuide || {
            title: "",
            headers: [
              "Size",
              "Height (cm)",
              "Bust (cm)",
              "Waist (cm)",
              "Hips (cm)",
              "Inside leg (cm)",
            ],
            rows: [],
          },
        }
      : emptyFormData
  );

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      const result = await getCategories();
      if (result.categories) {
        setCategories(result.categories);
      }
    };
    void loadCategories();
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    const loadSubcategories = async () => {
      if (formData.category) {
        const result = await getSubcategoriesByCategory(formData.category);
        if (result.subcategories) {
          setSubcategories(result.subcategories);
        }
      } else {
        setSubcategories([]);
      }
    };
    void loadSubcategories();
  }, [formData.category]);

  const handleVariantChange = (
    index: number,
    field: keyof ProductVariantInput,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, i) =>
        i === index
          ? field === "color"
            ? { ...variant, color: { ...variant.color, ...value } }
            : { ...variant, [field]: value }
          : variant
      ),
    }));
  };

  const handleColorChangeAction = useCallback(
    async (index: number, newColor: Color) => {
      setFormData((prev) => ({
        ...prev,
        variants: prev.variants.map((variant, i) =>
          i === index
            ? {
                ...variant,
                color: {
                  name: newColor.name === "Custom" ? "" : newColor.name,
                  hex: newColor.hex,
                },
              }
            : variant
        ),
      }));
    },
    []
  );

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, emptyVariant()],
    }));
  };

  const removeVariant = (index: number) => {
    if (formData.variants.length === 1) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "At least one variant is required",
      });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const addTechnicalSpec = () => {
    setFormData((prev) => ({
      ...prev,
      technicalSpecifications: [
        ...prev.technicalSpecifications,
        { title: "", description: "" },
      ],
    }));
  };

  const removeTechnicalSpec = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      technicalSpecifications: prev.technicalSpecifications.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const updateTechnicalSpec = (
    index: number,
    field: keyof TechnicalSpec,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      technicalSpecifications: prev.technicalSpecifications.map((spec, i) =>
        i === index ? { ...spec, [field]: value } : spec
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = product
        ? await updateProduct(product.id, formData)
        : await createProduct(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.product) {
        throw new Error("No product data received");
      }

      toast({
        title: "Success",
        description: `Product ${product ? "updated" : "created"} successfully`,
      });

      onSuccess(result.product);

      if (!product) {
        setFormData({
          name: "",
          description: "",
          category: defaultCategoryId,
          subcategory: defaultSubcategoryId,
          categoryName: "",
          subcategoryName: "",
          variants: [emptyVariant()],
          technicalSpecifications: [],
          shortDescription: "",
          isClothing: false,
          isPaddle: false,
          paddleConfigurator: {
            enabled: false,
            materials: [],
            shaftTypes: [],
            bladeAngles: [],
            lengths: [],
            parts: [],
          },
          sizingGuide: {
            title: "",
            headers: [
              "Size",
              "Height (cm)",
              "Bust (cm)",
              "Waist (cm)",
              "Hips (cm)",
              "Inside leg (cm)",
            ],
            rows: [],
          },
        });
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add sizing guide row handler
  const addSizingGuideRow = () => {
    setFormData((prev: ProductInput) => {
      const headers = prev.sizingGuide?.headers || [];
      const currentRowCount = prev.sizingGuide?.rows?.length || 0;
      const newSize = `Size ${currentRowCount + 1}`;

      return {
        ...prev,
        variants: prev.variants.map((variant) => ({
          ...variant,
          sizeStock: [
            ...(variant.sizeStock || []),
            { size: newSize, stock: 0 },
          ],
        })),
        sizingGuide: {
          ...prev.sizingGuide!,
          rows: [
            ...(prev.sizingGuide?.rows || []),
            {
              size: newSize,
              measurements: Array(Math.max(0, headers.length - 1)).fill(""),
            },
          ],
        },
      };
    });
  };

  // Remove sizing guide row handler
  const removeSizingGuideRow = (index: number) => {
    setFormData((prev: ProductInput) => {
      const sizeToRemove = prev.sizingGuide!.rows[index].size;

      return {
        ...prev,
        variants: prev.variants.map((variant) => ({
          ...variant,
          sizeStock: (variant.sizeStock || []).filter(
            (s) => s.size !== sizeToRemove
          ),
        })),
        sizingGuide: {
          ...prev.sizingGuide!,
          rows: prev.sizingGuide!.rows.filter((_, i) => i !== index),
        },
      };
    });
  };

  // Update sizing guide row handler
  const updateSizingGuideRow = (
    rowIndex: number,
    field: string,
    value: string
  ) => {
    setFormData((prev: ProductInput) => {
      const newData = { ...prev };
      const oldSize = newData.sizingGuide!.rows[rowIndex].size;

      if (field === "size") {
        // Update size in sizing guide
        newData.sizingGuide!.rows[rowIndex].size = value;

        // Update size in all variants' sizeStock
        newData.variants = newData.variants.map((variant) => ({
          ...variant,
          sizeStock: (variant.sizeStock || []).map((s) =>
            s.size === oldSize ? { ...s, size: value } : s
          ),
        }));
      } else {
        // Handle measurements
        const measurementIndex = parseInt(field);
        newData.sizingGuide!.rows[rowIndex].measurements[measurementIndex] =
          value;
      }

      return newData;
    });
  };

  // Update sizing guide headers handler
  const updateSizingGuideHeader = (index: number, value: string) => {
    setFormData((prev: ProductInput) => ({
      ...prev,
      sizingGuide: {
        ...prev.sizingGuide!,
        headers: prev.sizingGuide!.headers.map((header, i) =>
          i === index ? value : header
        ),
      },
    }));
  };

  const handleSizeStockChange = async (
    variantIndex: number,
    size: string,
    newStock: number
  ) => {
    if (!product) {
      // For new products, just update the local state
      setFormData((prev: ProductInput) => {
        const updatedVariants = [...prev.variants];
        const variant = updatedVariants[variantIndex];

        if (!variant.sizeStock) {
          variant.sizeStock = [];
        }

        const sizeStockIndex = variant.sizeStock.findIndex(
          (s) => s.size === size
        );

        if (sizeStockIndex !== -1) {
          variant.sizeStock[sizeStockIndex].stock = newStock;
        } else {
          variant.sizeStock.push({ size, stock: newStock });
        }

        return {
          ...prev,
          variants: updatedVariants,
        };
      });
      return;
    }

    try {
      const result = await updateVariantSizeStock(
        product.id,
        product.variants[variantIndex].id,
        size,
        newStock
      );

      if (result.error) {
        throw new Error(result.error);
      }

      // Update local state
      setFormData((prev: ProductInput) => {
        const updatedVariants = [...prev.variants];
        const variant = updatedVariants[variantIndex];

        if (!variant.sizeStock) {
          variant.sizeStock = [];
        }

        const sizeStockIndex = variant.sizeStock.findIndex(
          (s) => s.size === size
        );

        if (sizeStockIndex !== -1) {
          variant.sizeStock[sizeStockIndex].stock = newStock;
        } else {
          variant.sizeStock.push({ size, stock: newStock });
        }

        return {
          ...prev,
          variants: updatedVariants,
        };
      });

      toast({
        title: "Stock updated",
        description: `Updated stock for size ${size}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update stock",
      });
    }
  };

  const handleSizingGuideRowChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      const newData = { ...prev };
      if (!newData.sizingGuide) return newData;

      if (field === "size") {
        const oldSize = newData.sizingGuide.rows[index].size;
        const newSize = value;

        // Update size in variants
        newData.variants = newData.variants.map((variant) => ({
          ...variant,
          sizeStock: variant.sizeStock?.map((stock) =>
            stock.size === oldSize ? { ...stock, size: newSize } : stock
          ),
        }));

        // Update size in sizing guide
        newData.sizingGuide.rows[index].size = value;
      } else if (field === "measurements") {
        newData.sizingGuide.rows[index].measurements = value.split(",");
      }

      return newData;
    });
  };

  const handleVariantSizeChange = (
    variantIndex: number,
    sizeIndex: number,
    newSize: string
  ) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const oldSize =
        newData.variants[variantIndex].sizeStock?.[sizeIndex].size;

      // Update size in variant
      newData.variants[variantIndex].sizeStock = newData.variants[
        variantIndex
      ].sizeStock?.map((stock, idx) =>
        idx === sizeIndex ? { ...stock, size: newSize } : stock
      );

      // Update size in sizing guide if it exists
      if (newData.sizingGuide) {
        newData.sizingGuide.rows = newData.sizingGuide.rows.map((row) =>
          row.size === oldSize ? { ...row, size: newSize } : row
        );
      }

      return newData;
    });
  };

  const handleAddSize = (variantIndex: number) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const newSize = "New Size";

      // Add size to variant
      if (!newData.variants[variantIndex].sizeStock) {
        newData.variants[variantIndex].sizeStock = [];
      }
      newData.variants[variantIndex].sizeStock?.push({
        size: newSize,
        stock: 0,
      });

      // Add size to sizing guide if it doesn't exist
      if (
        newData.sizingGuide &&
        !newData.sizingGuide.rows.some((row) => row.size === newSize)
      ) {
        newData.sizingGuide.rows.push({
          size: newSize,
          measurements: Array(newData.sizingGuide.headers.length - 1).fill(""),
        });
      }

      return newData;
    });
  };

  const handleRemoveSize = (variantIndex: number, sizeIndex: number) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const sizeToRemove =
        newData.variants[variantIndex].sizeStock?.[sizeIndex].size;

      // Remove size from variant
      newData.variants[variantIndex].sizeStock = newData.variants[
        variantIndex
      ].sizeStock?.filter((_, idx) => idx !== sizeIndex);

      // Check if size is used in other variants
      const sizeUsedInOtherVariants = newData.variants.some(
        (variant, idx) =>
          idx !== variantIndex &&
          variant.sizeStock?.some((stock) => stock.size === sizeToRemove)
      );

      // Remove size from sizing guide if it's not used in any other variant
      if (!sizeUsedInOtherVariants && newData.sizingGuide) {
        newData.sizingGuide.rows = newData.sizingGuide.rows.filter(
          (row) => row.size !== sizeToRemove
        );
      }

      return newData;
    });
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 p-6"
      >
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => {
                const selectedCategory = categories.find((c) => c.id === value);
                setFormData((prev) => ({
                  ...prev,
                  category: value,
                  categoryName: selectedCategory?.name || "",
                  subcategory: "",
                  subcategoryName: "",
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
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

          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Select
              value={formData.subcategory}
              onValueChange={(value) => {
                const selectedSubcategory = subcategories.find(
                  (s) => s.id === value
                );
                setFormData((prev) => ({
                  ...prev,
                  subcategory: value,
                  subcategoryName: selectedSubcategory?.name || "",
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a subcategory" />
              </SelectTrigger>
              <SelectContent>
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
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortDescription">Short Description</Label>
          <Editor
            id="shortDescription"
            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
            value={formData.shortDescription}
            onEditorChange={(content) =>
              setFormData((prev) => ({
                ...prev,
                shortDescription: content,
              }))
            }
            init={{
              height: 200,
              menubar: true,
              plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "code",
                "help",
                "wordcount",
              ],
              toolbar:
                "undo redo | blocks | " +
                "bold italic forecolor | alignleft aligncenter " +
                "alignright alignjustify | bullist numlist outdent indent | " +
                "removeformat | help",
              skin: "oxide",
              content_css: "default",
              resize: false,
              promotion: false,
              statusbar: false,
              relative_urls: false,
              remove_script_host: false,
              convert_urls: false,
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Full Description</Label>
          <Editor
            id="description"
            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
            value={formData.description}
            onEditorChange={(content) =>
              setFormData((prev) => ({
                ...prev,
                description: content,
              }))
            }
            init={{
              height: 500,
              menubar: true,
              plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "code",
                "help",
                "wordcount",
              ],
              toolbar:
                "undo redo | blocks | " +
                "bold italic forecolor | alignleft aligncenter " +
                "alignright alignjustify | bullist numlist outdent indent | " +
                "removeformat | help",
              skin: "oxide",
              content_css: "default",
              resize: false,
              promotion: false,
              statusbar: false,
              relative_urls: false,
              remove_script_host: false,
              convert_urls: false,
            }}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="isClothing">Is Clothing Item</Label>
          <input
            type="checkbox"
            id="isClothing"
            checked={formData.isClothing}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                isClothing: e.target.checked,
                sizingGuide: e.target.checked
                  ? prev.sizingGuide || {
                      title: "",
                      headers: [
                        "Size",
                        "Height (cm)",
                        "Bust (cm)",
                        "Waist (cm)",
                        "Hips (cm)",
                        "Inside leg (cm)",
                      ],
                      rows: [],
                    }
                  : undefined,
              }))
            }
            className="h-4 w-4"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="isPaddle">Este vasla?</Label>
          <input
            type="checkbox"
            id="isPaddle"
            checked={formData.isPaddle}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                isPaddle: e.target.checked,
              }))
            }
            className="h-4 w-4"
          />
        </div>

        {/* Paddle Configurator */}
        {formData.isPaddle && (
          <Card>
            <CardHeader>
              <CardTitle>Configurator Vasla</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Label htmlFor="configuratorEnabled">Activează configuratorul</Label>
                <input
                  type="checkbox"
                  id="configuratorEnabled"
                  checked={formData.paddleConfigurator?.enabled || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paddleConfigurator: {
                        ...prev.paddleConfigurator!,
                        enabled: e.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4"
                />
              </div>

              {formData.paddleConfigurator?.enabled && (
                <div className="space-y-6">
                  {/* Materials */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Materiale</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            paddleConfigurator: {
                              ...prev.paddleConfigurator!,
                              materials: [
                                ...prev.paddleConfigurator!.materials,
                                {
                                  id: Math.random().toString(36).substr(2, 9),
                                  name: "",
                                  description: "",
                                  priceModifier: 0,
                                },
                              ],
                            },
                          }))
                        }
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adaugă Material
                      </Button>
                    </div>
                    {formData.paddleConfigurator?.materials.map((material, index) => (
                      <div key={material.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Material {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  materials: prev.paddleConfigurator!.materials.filter(
                                    (_, i) => i !== index
                                  ),
                                },
                              }))
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Nume material"
                            value={material.name}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  materials: prev.paddleConfigurator!.materials.map((m, i) =>
                                    i === index ? { ...m, name: e.target.value } : m
                                  ),
                                },
                              }))
                            }
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Modificator preț (+/-)"
                            value={material.priceModifier}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  materials: prev.paddleConfigurator!.materials.map((m, i) =>
                                    i === index
                                      ? { ...m, priceModifier: parseFloat(e.target.value) || 0 }
                                      : m
                                  ),
                                },
                              }))
                            }
                          />
                        </div>
                        <Input
                          placeholder="Descriere (opțional)"
                          value={material.description || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              paddleConfigurator: {
                                ...prev.paddleConfigurator!,
                                materials: prev.paddleConfigurator!.materials.map((m, i) =>
                                  i === index ? { ...m, description: e.target.value } : m
                                ),
                              },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {/* Shaft Types */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Tipuri de mâner</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            paddleConfigurator: {
                              ...prev.paddleConfigurator!,
                              shaftTypes: [
                                ...prev.paddleConfigurator!.shaftTypes,
                                {
                                  id: `shaft-${Date.now()}`,
                                  name: "",
                                  description: "",
                                  priceModifier: 0,
                                },
                              ],
                            },
                          }))
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adaugă tip mâner
                      </Button>
                    </div>
                    {formData.paddleConfigurator?.shaftTypes.map((shaft, index) => (
                      <div key={shaft.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Tip mâner {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  shaftTypes: prev.paddleConfigurator!.shaftTypes.filter(
                                    (_, i) => i !== index
                                  ),
                                },
                              }))
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Nume tip mâner"
                            value={shaft.name}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  shaftTypes: prev.paddleConfigurator!.shaftTypes.map((s, i) =>
                                    i === index ? { ...s, name: e.target.value } : s
                                  ),
                                },
                              }))
                            }
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Modificator preț (+/-)"
                            value={shaft.priceModifier}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  shaftTypes: prev.paddleConfigurator!.shaftTypes.map((s, i) =>
                                    i === index
                                      ? { ...s, priceModifier: parseFloat(e.target.value) || 0 }
                                      : s
                                  ),
                                },
                              }))
                            }
                          />
                        </div>
                        <Input
                          placeholder="Descriere (opțional)"
                          value={shaft.description || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              paddleConfigurator: {
                                ...prev.paddleConfigurator!,
                                shaftTypes: prev.paddleConfigurator!.shaftTypes.map((s, i) =>
                                  i === index ? { ...s, description: e.target.value } : s
                                ),
                              },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {/* Blade Angles */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Unghiuri disponibile</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            paddleConfigurator: {
                              ...prev.paddleConfigurator!,
                              bladeAngles: [
                                ...prev.paddleConfigurator!.bladeAngles,
                                {
                                  id: `angle-${Date.now()}`,
                                  name: "",
                                  angle: 0,
                                  description: "",
                                  priceModifier: 0,
                                },
                              ],
                            },
                          }))
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adaugă unghi
                      </Button>
                    </div>
                    {formData.paddleConfigurator?.bladeAngles.map((angle, index) => (
                      <div key={angle.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Unghi {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  bladeAngles: prev.paddleConfigurator!.bladeAngles.filter(
                                    (_, i) => i !== index
                                  ),
                                },
                              }))
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            placeholder="Nume unghi"
                            value={angle.name}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  bladeAngles: prev.paddleConfigurator!.bladeAngles.map((a, i) =>
                                    i === index ? { ...a, name: e.target.value } : a
                                  ),
                                },
                              }))
                            }
                          />
                          <Input
                            type="number"
                            min="0"
                            max="90"
                            placeholder="Unghi (°)"
                            value={angle.angle}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  bladeAngles: prev.paddleConfigurator!.bladeAngles.map((a, i) =>
                                    i === index
                                      ? { ...a, angle: parseInt(e.target.value) || 0 }
                                      : a
                                  ),
                                },
                              }))
                            }
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Modificator preț"
                            value={angle.priceModifier}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  bladeAngles: prev.paddleConfigurator!.bladeAngles.map((a, i) =>
                                    i === index
                                      ? { ...a, priceModifier: parseFloat(e.target.value) || 0 }
                                      : a
                                  ),
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Lengths */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Lungimi disponibile</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            paddleConfigurator: {
                              ...prev.paddleConfigurator!,
                              lengths: [
                                ...prev.paddleConfigurator!.lengths,
                                {
                                  id: `length-${Date.now()}`,
                                  name: "",
                                  length: 0,
                                  description: "",
                                  priceModifier: 0,
                                },
                              ],
                            },
                          }))
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adaugă lungime
                      </Button>
                    </div>
                    {formData.paddleConfigurator?.lengths.map((length, index) => (
                      <div key={length.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Lungime {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  lengths: prev.paddleConfigurator!.lengths.filter(
                                    (_, i) => i !== index
                                  ),
                                },
                              }))
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            placeholder="Nume lungime"
                            value={length.name}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  lengths: prev.paddleConfigurator!.lengths.map((l, i) =>
                                    i === index ? { ...l, name: e.target.value } : l
                                  ),
                                },
                              }))
                            }
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="Lungime (cm)"
                            value={length.length}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  lengths: prev.paddleConfigurator!.lengths.map((l, i) =>
                                    i === index
                                      ? { ...l, length: parseFloat(e.target.value) || 0 }
                                      : l
                                  ),
                                },
                              }))
                            }
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Modificator preț"
                            value={length.priceModifier}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  lengths: prev.paddleConfigurator!.lengths.map((l, i) =>
                                    i === index
                                      ? { ...l, priceModifier: parseFloat(e.target.value) || 0 }
                                      : l
                                  ),
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Parts */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Numărul de bucăți</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            paddleConfigurator: {
                              ...prev.paddleConfigurator!,
                              parts: [
                                ...prev.paddleConfigurator!.parts,
                                {
                                  id: `parts-${Date.now()}`,
                                  name: "",
                                  pieces: 1,
                                  description: "",
                                  priceModifier: 0,
                                },
                              ],
                            },
                          }))
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adaugă opțiune bucăți
                      </Button>
                    </div>
                    {formData.paddleConfigurator?.parts.map((part, index) => (
                      <div key={part.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Opțiune {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  parts: prev.paddleConfigurator!.parts.filter(
                                    (_, i) => i !== index
                                  ),
                                },
                              }))
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            placeholder="Nume opțiune"
                            value={part.name}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  parts: prev.paddleConfigurator!.parts.map((p, i) =>
                                    i === index ? { ...p, name: e.target.value } : p
                                  ),
                                },
                              }))
                            }
                          />
                          <Input
                            type="number"
                            min="1"
                            placeholder="Nr. bucăți"
                            value={part.pieces}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  parts: prev.paddleConfigurator!.parts.map((p, i) =>
                                    i === index
                                      ? { ...p, pieces: parseInt(e.target.value) || 1 }
                                      : p
                                  ),
                                },
                              }))
                            }
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Modificator preț"
                            value={part.priceModifier}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                paddleConfigurator: {
                                  ...prev.paddleConfigurator!,
                                  parts: prev.paddleConfigurator!.parts.map((p, i) =>
                                    i === index
                                      ? { ...p, priceModifier: parseFloat(e.target.value) || 0 }
                                      : p
                                  ),
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sizing Guide */}
        {formData.isClothing && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Sizing Guide</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSizingGuideRow}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Size
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sizing Guide Title</Label>
                <Input
                  value={formData.sizingGuide?.title || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sizingGuide: {
                        ...prev.sizingGuide!,
                        title: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g., Men's Outerwear Sizes"
                />
              </div>

              <div className="space-y-4">
                <Label>Headers</Label>
                <div className="grid grid-cols-6 gap-2">
                  {formData.sizingGuide?.headers.map((header, index) => (
                    <div
                      key={index}
                      className="flex gap-2"
                    >
                      <Input
                        value={header}
                        onChange={(e) =>
                          updateSizingGuideHeader(index, e.target.value)
                        }
                        placeholder={`Header ${index + 1}`}
                      />
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              sizingGuide: {
                                ...prev.sizingGuide!,
                                headers: prev.sizingGuide!.headers.filter(
                                  (_, i) => i !== index
                                ),
                                rows: prev.sizingGuide!.rows.map((row) => ({
                                  ...row,
                                  measurements: row.measurements.filter(
                                    (_, i) => i !== index - 1
                                  ),
                                })),
                              },
                            }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        sizingGuide: {
                          ...prev.sizingGuide!,
                          headers: [...prev.sizingGuide!.headers, "New Column"],
                          rows: prev.sizingGuide!.rows.map((row) => ({
                            ...row,
                            measurements: [...row.measurements, ""],
                          })),
                        },
                      }));
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  {formData.sizingGuide?.rows.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={row.size}
                        onChange={(e) =>
                          updateSizingGuideRow(rowIndex, "size", e.target.value)
                        }
                        placeholder="Size name"
                        className="w-32"
                      />
                      {row.measurements.map((measurement, measurementIndex) => (
                        <Input
                          key={measurementIndex}
                          value={measurement}
                          onChange={(e) =>
                            updateSizingGuideRow(
                              rowIndex,
                              measurementIndex.toString(),
                              e.target.value
                            )
                          }
                          placeholder={
                            formData.sizingGuide?.headers[measurementIndex + 1]
                          }
                        />
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSizingGuideRow(rowIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Product Variants</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariant}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Variant
            </Button>
          </div>

          <div className="space-y-4">
            {formData.variants.map((variant, index) => (
              <VariantCard
                key={index}
                className="relative"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => removeVariant(index)}
                >
                  <X className="h-4 w-4" />
                </Button>

                <VariantCardHeader>
                  <CardTitle className="text-lg">Variant {index + 1}</CardTitle>
                </VariantCardHeader>

                <VariantCardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`sku-${index}`}>SKU</Label>
                        <Input
                          id={`sku-${index}`}
                          value={variant.sku}
                          onChange={(e) =>
                            handleVariantChange(index, "sku", e.target.value)
                          }
                          placeholder="Enter SKU"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`color-${index}`}>Color</Label>
                        <ColorPicker
                          color={{
                            name: variant.color.name,
                            hex: variant.color.hex,
                          }}
                          onChangeAction={async (newColor) => {
                            handleVariantChange(index, "color", {
                              name: newColor.name,
                              hex: newColor.hex,
                            });
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`color-hex-${index}`}>Color Hex</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`color-hex-${index}`}
                            type="color"
                            value={variant.color.hex}
                            onChange={(e) =>
                              handleVariantChange(index, "color", {
                                hex: e.target.value,
                              })
                            }
                            className="w-12"
                          />
                          <Input
                            value={variant.color.hex}
                            onChange={(e) =>
                              handleVariantChange(index, "color", {
                                hex: e.target.value,
                              })
                            }
                            placeholder="#000000"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`price-${index}`}>Price</Label>
                        <Input
                          id={`price-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) =>
                            handleVariantChange(
                              index,
                              "price",
                              parseFloat(e.target.value)
                            )
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`stock-${index}`}>Stock</Label>
                        {formData.isClothing ? (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                Stock per size:
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentSizes =
                                    variant.sizeStock?.map((s) => s.size) || [];
                                  const newSize = `Size ${
                                    currentSizes.length + 1
                                  }`;

                                  setFormData((prev) => {
                                    // Add size to sizing guide if it doesn't exist
                                    const sizeExists =
                                      prev.sizingGuide?.rows.some(
                                        (row) => row.size === newSize
                                      );
                                    const updatedSizingGuide = sizeExists
                                      ? prev.sizingGuide
                                      : {
                                          ...prev.sizingGuide!,
                                          rows: [
                                            ...(prev.sizingGuide?.rows || []),
                                            {
                                              size: newSize,
                                              measurements: Array(
                                                Math.max(
                                                  0,
                                                  prev.sizingGuide!.headers
                                                    .length - 1
                                                )
                                              ).fill(""),
                                            },
                                          ],
                                        };

                                    return {
                                      ...prev,
                                      variants: prev.variants.map((v, i) =>
                                        i === index
                                          ? {
                                              ...v,
                                              sizeStock: [
                                                ...(v.sizeStock || []),
                                                { size: newSize, stock: 0 },
                                              ],
                                            }
                                          : v
                                      ),
                                      sizingGuide: updatedSizingGuide,
                                    };
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Size
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {variant.sizeStock?.map(
                                (sizeStock, sizeIndex) => (
                                  <div
                                    key={sizeIndex}
                                    className="flex items-center gap-2"
                                  >
                                    <Input
                                      value={sizeStock.size}
                                      onChange={(e) => {
                                        const newSize = e.target.value;
                                        setFormData((prev) => {
                                          // Update size in sizing guide
                                          const updatedSizingGuide = {
                                            ...prev.sizingGuide!,
                                            rows: prev.sizingGuide!.rows.map(
                                              (row) =>
                                                row.size === sizeStock.size
                                                  ? { ...row, size: newSize }
                                                  : row
                                            ),
                                          };

                                          return {
                                            ...prev,
                                            variants: prev.variants.map(
                                              (v) => ({
                                                ...v,
                                                sizeStock: (
                                                  v.sizeStock || []
                                                ).map((s) =>
                                                  s.size === sizeStock.size
                                                    ? { ...s, size: newSize }
                                                    : s
                                                ),
                                              })
                                            ),
                                            sizingGuide: updatedSizingGuide,
                                          };
                                        });
                                      }}
                                      placeholder="Size"
                                      className="w-24"
                                    />
                                    <Input
                                      type="number"
                                      value={sizeStock.stock}
                                      onChange={(e) => {
                                        const newStock = parseInt(
                                          e.target.value
                                        );
                                        setFormData((prev) => ({
                                          ...prev,
                                          variants: prev.variants.map(
                                            (v, i) =>
                                              i === index
                                                ? {
                                                    ...v,
                                                    sizeStock:
                                                      v.sizeStock?.map(
                                                        (s, si) =>
                                                          si === sizeIndex
                                                            ? {
                                                                ...s,
                                                                stock: newStock,
                                                              }
                                                            : s
                                                      ),
                                                  }
                                                : v
                                          ),
                                        }));
                                      }}
                                      placeholder="Stock"
                                      className="w-24"
                                    />
                                    {formData.isClothing && (
                                      <Input
                                        type="number"
                                        value={sizeStock.price || variant.price}
                                        onChange={(e) => {
                                          const newPrice = parseFloat(
                                            e.target.value
                                          );
                                          setFormData((prev) => ({
                                            ...prev,
                                            variants: prev.variants.map(
                                              (v, i) =>
                                                i === index
                                                  ? {
                                                      ...v,
                                                      sizeStock:
                                                        v.sizeStock?.map(
                                                          (s, si) =>
                                                            si === sizeIndex
                                                              ? {
                                                                  ...s,
                                                                  price: newPrice,
                                                                }
                                                              : s
                                                        ),
                                                    }
                                                  : v
                                            ),
                                          }));
                                        }}
                                        placeholder="Price"
                                        className="w-24"
                                      />
                                    )}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setFormData((prev) => {
                                          // Remove size from sizing guide if no other variant uses it
                                          const sizeUsedInOtherVariants =
                                            prev.variants.some(
                                              (v, i) =>
                                                i !== index &&
                                                v.sizeStock?.some(
                                                  (s) =>
                                                    s.size === sizeStock.size
                                                )
                                            );

                                          const updatedSizingGuide =
                                            sizeUsedInOtherVariants
                                              ? prev.sizingGuide
                                              : {
                                                  ...prev.sizingGuide!,
                                                  rows: prev.sizingGuide!.rows.filter(
                                                    (row) =>
                                                      row.size !==
                                                      sizeStock.size
                                                  ),
                                                };

                                          return {
                                            ...prev,
                                            variants: prev.variants.map(
                                              (v, i) =>
                                                i === index
                                                  ? {
                                                      ...v,
                                                      sizeStock:
                                                        v.sizeStock?.filter(
                                                          (s) =>
                                                            s.size !==
                                                            sizeStock.size
                                                        ),
                                                    }
                                                  : v
                                            ),
                                            sizingGuide: updatedSizingGuide,
                                          };
                                        });
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ) : (
                          <Input
                            id={`stock-${index}`}
                            type="number"
                            value={variant.currentStock}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                "currentStock",
                                parseInt(e.target.value) || 0
                              )
                            }
                            min="0"
                            required
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`sale-${index}`}>Sale Percentage</Label>
                        <Input
                          id={`sale-${index}`}
                          type="number"
                          min="0"
                          max="100"
                          value={variant.current_sale_percentage}
                          onChange={(e) =>
                            handleVariantChange(
                              index,
                              "current_sale_percentage",
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Images</Label>
                      <ImageUpload
                        values={variant.images}
                        onChange={(newUrls) => {
                          handleVariantChange(index, "images", newUrls);
                        }}
                      />
                    </div>
                  </div>
                </VariantCardContent>
              </VariantCard>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Technical Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.technicalSpecifications.map((spec, index) => (
              <div
                key={index}
                className="flex gap-4 items-start"
              >
                <div className="flex-1 space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={spec.title}
                    onChange={(e) =>
                      updateTechnicalSpec(index, "title", e.target.value)
                    }
                    placeholder="Specification title"
                    required
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={spec.description}
                    onChange={(e) =>
                      updateTechnicalSpec(index, "description", e.target.value)
                    }
                    placeholder="Specification description"
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-8"
                  onClick={() => removeTechnicalSpec(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={addTechnicalSpec}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Specification
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
          >
            {isLoading
              ? "Processing..."
              : product
              ? "Update Product"
              : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
