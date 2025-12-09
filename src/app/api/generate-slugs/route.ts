import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import { Category, Product, Subcategory } from "@/lib/database/models/models";
import { generateSlug } from "@/lib/utils";

export async function GET() {
  try {
    await connectToDatabase();

    // Generate slugs for categories
    const categories = await Category.find({ slug: { $exists: false } });
    console.log(`Found ${categories.length} categories without slugs`);

    for (const category of categories) {
      const baseSlug = generateSlug(category.name);
      let slug = baseSlug;
      let counter = 1;

      // Check for duplicate slugs
      while (await Category.findOne({ slug, _id: { $ne: category._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      await Category.findByIdAndUpdate(category._id, { slug });
      console.log(`Generated slug "${slug}" for category "${category.name}"`);
    }

    // Generate slugs for subcategories
    const subcategories = await Subcategory.find({ slug: { $exists: false } });
    console.log(`Found ${subcategories.length} subcategories without slugs`);

    for (const subcategory of subcategories) {
      const baseSlug = generateSlug(subcategory.name);
      let slug = baseSlug;
      let counter = 1;

      // Check for duplicate slugs within the same category
      while (await Subcategory.findOne({ 
        slug, 
        category: subcategory.category,
        _id: { $ne: subcategory._id } 
      })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      await Subcategory.findByIdAndUpdate(subcategory._id, { slug });
      console.log(`Generated slug "${slug}" for subcategory "${subcategory.name}"`);
    }

    // Generate slugs for products
    const products = await Product.find({ slug: { $exists: false } });
    console.log(`Found ${products.length} products without slugs`);

    for (const product of products) {
      const baseSlug = generateSlug(product.name);
      let slug = baseSlug;
      let counter = 1;

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
      console.log(`Generated slug "${slug}" for product "${product.name}"`);
    }

    return NextResponse.json({
      message: 'Successfully generated slugs for all categories, subcategories, and products'
    });
  } catch (error) {
    console.error('Error generating slugs:', error);
    return NextResponse.json(
      { error: 'Failed to generate slugs' },
      { status: 500 }
    );
  }
} 