import { getProducts } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";
import HeroSection from "@/components/shop-grid-page/HeroSection";
import CategoryProductsClient from "@/components/shop-grid-page/CategoryProductsClient";
import { Category, Product } from "@/lib/database/models/models";
import { connectToDatabase } from "@/lib/database";
import { stripHtmlServer } from "@/lib/utils";

export default async function CategoryPage({
  params: paramsPromise,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  try {
    // Await params first as a Promise
    const { categorySlug } = await paramsPromise;
    
    await connectToDatabase();

    // Find category by slug
    const category = await Category.findOne({ slug: categorySlug }).lean();
    
    if (!category) {
      notFound();
    }

    // Find products directly using mongoose
    const products = await Product.find({
      categoryName: category.name
    }).lean();

    return (
      <main className="min-h-screen bg-gray-50">
        <HeroSection
          title={stripHtmlServer(category.name)}
          description={stripHtmlServer(category.description)}
          imageUrl={category.image_url}
        />

        <Suspense fallback={<Loading />}>
          <CategoryProductsClient 
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
          />
        </Suspense>
      </main>
    );
  } catch (error) {
    console.error("Error in CategoryPage:", error);
    notFound();
  }
} 