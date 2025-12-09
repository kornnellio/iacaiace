import { ProductVariantWrapper } from "@/components/product-page/ProductVariantWrapper";
import SimilarProducts from "@/components/product-page/SimilarProducts";
import { getProduct } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductTabs } from "@/components/product-page/ProductTabs";
import { Reviews } from "@/components/product-page/Reviews";

export default async function ProductPage({
  params: paramsPromise,
}: {
  params: Promise<{ productId: string }>;
}) {
  // Await params first as a Promise
  const { productId } = await paramsPromise;
  const { product, error } = await getProduct(productId);

  if (error || !product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4">
        <ProductVariantWrapper product={product} />

        <div className="mb-16">
          <ProductTabs
            description={product.description}
            technicalSpecifications={product.technicalSpecifications}
            isClothing={product.isClothing}
            sizingGuide={product.sizingGuide}
          />
        </div>

        <Suspense>
          <SimilarProducts
            categoryId={product.category}
            currentProductId={product.id}
          />
        </Suspense>
        <div className="mb-16">
          <Reviews productId={product.id} />
        </div>
      </div>
    </main>
  );
}
