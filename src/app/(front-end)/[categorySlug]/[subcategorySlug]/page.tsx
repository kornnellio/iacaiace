import { getProductsBySubcategory } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Loading from "../loading";
import HeroSection from "@/components/shop-grid-page/HeroSection";
import SubcategoryProductsClient from "@/components/shop-grid-page/SubcategoryProductsClient";
import { Category, Product, Subcategory } from "@/lib/database/models/models";
import { connectToDatabase } from "@/lib/database";
import { stripHtmlServer } from "@/lib/utils";

// Define the page component
export default async function SubcategoryPage({
  params: paramsPromise,
}: {
  params: Promise<{ categorySlug: string; subcategorySlug: string }>;
}) {
  // Await params first as a Promise
  const { categorySlug, subcategorySlug } = await paramsPromise;

  await connectToDatabase();

  // Find category and subcategory by slug
  const category = await Category.findOne({ slug: categorySlug });
  if (!category) {
    notFound();
  }

  const subcategory = await Subcategory.findOne({ 
    slug: subcategorySlug,
    category: category._id 
  });
  
  if (!subcategory) {
    notFound();
  }

  // Find products by subcategory ID instead of names
  // This is more reliable as it uses the direct relationship
  const products = await Product.find({
    subcategory: subcategory._id
  }).lean(); // Use lean() to get plain JavaScript objects

  // Log for debugging
  console.log(`Found ${products.length} products for subcategory ${subcategory.name} (ID: ${subcategory._id})`);

  return (
    <main className="min-h-screen bg-gray-50">
      <HeroSection
        title={stripHtmlServer(subcategory.name)}
        description={stripHtmlServer(subcategory.description)}
        imageUrl={subcategory.image_url}
      />

      <Suspense fallback={<Loading />}>
        <SubcategoryProductsClient 
          products={products.map(p => ({
            id: p._id.toString(),
            name: stripHtmlServer(p.name),
            description: stripHtmlServer(p.description),
            category: p.category.toString(),
            subcategory: p.subcategory.toString(),
            categoryName: stripHtmlServer(p.categoryName),
            subcategoryName: stripHtmlServer(p.subcategoryName),
            variants: p.variants.map(v => ({
              id: v._id.toString(),
              sku: v.sku,
              color: {
                name: stripHtmlServer(v.color.name),
                hex: v.color.hex
              },
              price: Number(v.price),
              current_sale_percentage: Number(v.current_sale_percentage),
              currentStock: Number(v.currentStock),
              sizeStock: v.sizeStock?.map(s => ({
                size: stripHtmlServer(s.size),
                stock: Number(s.stock),
                price: s.price ? Number(s.price) : undefined
              })) || [],
              images: [...v.images]
            })),
            technicalSpecifications: p.technicalSpecifications.map(spec => ({
              title: stripHtmlServer(spec.title),
              description: stripHtmlServer(spec.description)
            })),
            shortDescription: p.shortDescription,
            isClothing: Boolean(p.isClothing),
            isPaddle: Boolean(p.isPaddle),
            sizingGuide: p.sizingGuide ? {
              title: stripHtmlServer(p.sizingGuide.title),
              headers: p.sizingGuide.headers.map(h => stripHtmlServer(h)),
              rows: p.sizingGuide.rows.map(row => ({
                size: stripHtmlServer(row.size),
                measurements: row.measurements.map(m => stripHtmlServer(m))
              }))
            } : undefined,
            slug: p.slug || ''
          }))}
          categoryId={category._id.toString()}
          categorySlug={categorySlug}
          subcategorySlug={subcategorySlug}
        />
      </Suspense>
    </main>
  );
} 