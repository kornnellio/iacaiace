"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/control-panel/product/ProductForm";
import { getProduct } from "@/lib/actions/product.actions";
import { ProductResponse } from "@/lib/database/models/models";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const resolvedParams = use(params);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const result = await getProduct(resolvedParams.id);
        if (result.error) {
          throw new Error(result.error);
        }
        setProduct(result.product || null);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load product",
        });
        router.push("/control-panel/products");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProduct();
  }, [resolvedParams.id, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/control-panel/products")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <h1 className="text-3xl font-bold">Edit Product</h1>
      </div>

      <ProductForm
        product={product}
        onSuccess={(updatedProduct) => {
          toast({
            title: "Success",
            description: "Product updated successfully",
          });
          router.push("/control-panel/products");
        }}
      />
    </div>
  );
}
