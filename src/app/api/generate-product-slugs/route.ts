import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import { Product } from "@/lib/database/models/models";
import { generateSlug } from "@/lib/utils";

export async function GET() {
  try {
    await connectToDatabase();

    // Generate slugs for products
    const products = await Product.find();
    console.log(`Found ${products.length} products`);
    let updatedCount = 0;

    for (const product of products) {
      const baseSlug = generateSlug(product.name);
      let slug = baseSlug;
      let counter = 1;

      // Skip if product already has the same slug
      if (product.slug === slug) {
        continue;
      }

      // Check for duplicate slugs within the same category and subcategory
      while (await Product.findOne({ 
        slug,
        categoryName: product.categoryName,
        subcategoryName: product.subcategoryName,
        _id: { $ne: product._id }
      })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      await Product.findByIdAndUpdate(product._id, { slug });
      updatedCount++;
      console.log(`Generated slug "${slug}" for product "${product.name}"`);
    }

    return NextResponse.json({
      message: `Successfully generated/updated slugs for ${updatedCount} products`
    });
  } catch (error) {
    console.error('Error generating product slugs:', error);
    return NextResponse.json(
      { error: 'Failed to generate product slugs' },
      { status: 500 }
    );
  }
} 