"use client";

import { useState } from "react";
import { createCategory, updateCategory } from "@/lib/actions/category.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { ImageUpload } from "@/components/shared/ImageUpload";

// Define interfaces
interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  current_sale_percentage: number;
  subcategories: string[];
}

interface CategoryFormProps {
  category?: Category | null;
  onSuccess?: (category: Category) => void;
}

interface FormData {
  name: string;
  description: string;
  image_url: string;
  current_sale_percentage: number;
}

const CategoryForm = ({
  category = null,
  onSuccess = () => {},
}: CategoryFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    name: category?.name || "",
    description: category?.description || "",
    image_url: category?.image_url || "",
    current_sale_percentage: category?.current_sale_percentage || 0,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(
    category?.image_url || null
  );

  const handleImagePreview = (url: string) => {
    setImagePreview(url);
    setFormData((prev) => ({ ...prev, image_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!formData.image_url) {
        throw new Error("Header image is required");
      }

      const result = category
        ? await updateCategory(category.id, formData)
        : await createCategory(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: `Category ${
          category ? "updated" : "created"
        } successfully`,
      });

      onSuccess(result.category!);

      if (!category) {
        setFormData({
          name: "",
          description: "",
          image_url: "",
          current_sale_percentage: 0,
        });
        setImagePreview(null);
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

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          {category ? "Edit Category" : "Create New Category"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Enter category name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter category description"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image</Label>
            <ImageUpload
              values={formData.image_url ? [formData.image_url] : []}
              onChange={(urls) =>
                setFormData({ ...formData, image_url: urls[0] || "" })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale">Sale Percentage</Label>
            <Input
              id="sale"
              type="number"
              min="0"
              max="100"
              value={formData.current_sale_percentage}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  current_sale_percentage: Number(e.target.value),
                }))
              }
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading
              ? "Processing..."
              : category
              ? "Update Category"
              : "Create Category"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CategoryForm;
