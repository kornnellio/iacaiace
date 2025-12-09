import { ProductVariantWrapper } from "@/components/product-page/ProductVariantWrapper";
import SimilarProducts from "@/components/product-page/SimilarProducts";
import { getProduct } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductTabs } from "@/components/product-page/ProductTabs";
import { Reviews } from "@/components/product-page/Reviews";
import { Category, Product, Subcategory } from "@/lib/database/models/models";
import { connectToDatabase } from "@/lib/database";

export default async function ProductPage({
  params: paramsPromise,
}: {
  params: Promise<{ categorySlug: string; subcategorySlug: string; productSlug: string }>;
}) {
  const { categorySlug, subcategorySlug, productSlug } = await paramsPromise;

  await connectToDatabase();
  
  // Find category by slug
  const category = await Category.findOne({ slug: categorySlug });
  if (!category) {
    notFound();
  }

  // Find subcategory by slug and category
  const subcategory = await Subcategory.findOne({ 
    slug: subcategorySlug,
    category: category._id 
  });
  
  // Try to find the product
  let product;

  // First try to find by slug and category/subcategory names
  if (subcategory) {
    product = await Product.findOne({
      slug: productSlug,
      categoryName: category.name,
      subcategoryName: subcategory.name
    });
  }

  // If not found and we have a subcategory, try just by slug and category
  if (!product) {
    product = await Product.findOne({
      slug: productSlug,
      categoryName: category.name
    });
  }
  
  if (!product) {
    notFound();
  }

  // Get the full product data using the existing getProduct function
  const { product: fullProduct, error } = await getProduct(product._id.toString());

  if (error || !fullProduct) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4">
        <ProductVariantWrapper product={fullProduct} />

        <div className="mb-16">
          <ProductTabs
            description={fullProduct.description}
            technicalSpecifications={fullProduct.technicalSpecifications}
            isClothing={fullProduct.isClothing}
            sizingGuide={fullProduct.sizingGuide}
          />
        </div>

        <Suspense>
          <SimilarProducts
            categoryId={fullProduct.category}
            currentProductId={fullProduct.id}
          />
        </Suspense>
        <div className="mb-16">
          <Reviews productId={fullProduct.id} />
        </div>
      </div>
    </main>
  );
} 