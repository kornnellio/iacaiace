"use client";

import { useEffect, useState } from "react";
import {
  createSubcategory,
  updateSubcategory,
} from "@/lib/actions/subcategory.actions";
import { getCategories } from "@/lib/actions/category.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { ImageUpload } from "@/components/shared/ImageUpload";

interface Category {
  id: string;
  name: string;
}

interface SubcategoryData {
  id?: string;
  name: string;
  description: string;
  image_url: string;
  category: string;
  current_sale_percentage: number;
}

interface SubcategoryFormProps {
  subcategory?: SubcategoryData | null;
  defaultCategoryId?: string;
  onSuccess?: (subcategory: SubcategoryData) => void;
}

interface FormData {
  name: string;
  description: string;
  image_url: string;
  category: string;
  current_sale_percentage: number;
}

const SubcategoryForm = ({
  subcategory = null,
  defaultCategoryId = "",
  onSuccess = () => {},
}: SubcategoryFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: subcategory?.name || "",
    description: subcategory?.description || "",
    image_url: subcategory?.image_url || "",
    category: subcategory?.category || defaultCategoryId,
    current_sale_percentage: subcategory?.current_sale_percentage || 0,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(
    subcategory?.image_url || null
  );

  useEffect(() => {
    const loadCategories = async () => {
      const result = await getCategories();
      if (result.categories) {
        setCategories(result.categories);
      }
    };
    void loadCategories();
  }, []);

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

      const result = subcategory
        ? await updateSubcategory(subcategory.id!, formData)
        : await createSubcategory(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: `Subcategory ${
          subcategory ? "updated" : "created"
        } successfully`,
      });

      onSuccess(result.subcategory!);

      if (!subcategory) {
        setFormData({
          name: "",
          description: "",
          image_url: "",
          category: defaultCategoryId,
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
          {subcategory ? "Edit Subcategory" : "Create New Subcategory"}
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
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  category: value,
                }))
              }
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
            <Label htmlFor="name">Subcategory Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Enter subcategory name"
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
              placeholder="Enter subcategory description"
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
              : subcategory
              ? "Update Subcategory"
              : "Create Subcategory"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SubcategoryForm;
