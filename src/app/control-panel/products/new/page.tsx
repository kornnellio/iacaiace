"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/components/control-panel/product/ProductForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function NewProductPage() {
  const router = useRouter();

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
        <h1 className="text-3xl font-bold">Create New Product</h1>
      </div>

      <ProductForm
        onSuccess={(product) => {
          toast({
            title: "Success",
            description: "Product created successfully",
          });
          router.push("/control-panel/products");
        }}
      />
    </div>
  );
}
