"use server";

import { connectToDatabase } from "../database";
import { Category, ICategory } from "@/lib/database/models/models";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { generateSlug } from "../utils";

// Input type
interface CategoryInput {
  name: string;
  description: string;
  image_url: string;
  current_sale_percentage?: number;
}

// Response type (what we send back to the client)
interface CategoryResponse {
  id: string;
  name: string;
  description: string;
  image_url: string;
  current_sale_percentage: number;
  subcategories: string[];
  order: number;
  slug: string;
}

interface CategoryActionReturn {
  error?: string;
  category?: CategoryResponse;
}

interface CategoriesActionReturn {
  error?: string;
  categories?: CategoryResponse[];
}

// Helper function to convert ICategory to CategoryResponse
function convertToResponse(category: any): CategoryResponse {
  return {
    id: category._id.toString(),
    name: category.name,
    description: category.description,
    image_url: category.image_url,
    current_sale_percentage: category.current_sale_percentage,
    subcategories: category.subcategories.map((s: any) => s.toString()),
    order: category.order,
    slug: category.slug,
  };
}

// Create new category
export async function createCategory(categoryData: {
  name: string;
  description: string;
  image_url: string;
  current_sale_percentage?: number;
  order?: number;
}): Promise<CategoryActionReturn> {
  try {
    await connectToDatabase();

    // Generate slug
    const baseSlug = generateSlug(categoryData.name);
    let slug = baseSlug;
    let counter = 1;

    // Check for duplicate slugs
    while (await Category.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const category = await Category.create({
      ...categoryData,
      subcategories: [],
      slug,
    });

    revalidatePath("/categories");
    return { category: convertToResponse(category) };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create category",
    };
  }
}

// Update existing category
export async function updateCategory(
  categoryId: string,
  categoryData: {
    name: string;
    description: string;
    image_url: string;
    current_sale_percentage?: number;
    order?: number;
  }
): Promise<CategoryActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(categoryId)) {
      throw new Error("Invalid category ID");
    }

    const currentCategory = await Category.findById(categoryId);
    if (!currentCategory) {
      throw new Error("Category not found");
    }

    // Generate new slug only if name has changed
    let slug = currentCategory.slug;
    if (categoryData.name !== currentCategory.name) {
      const baseSlug = generateSlug(categoryData.name);
      slug = baseSlug;
      let counter = 1;

      // Check for duplicate slugs (excluding current category)
      while (await Category.findOne({ slug, _id: { $ne: categoryId } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const category = await Category.findByIdAndUpdate(
      categoryId,
      { ...categoryData, slug },
      { new: true }
    );

    if (!category) {
      throw new Error("Failed to update category");
    }

    revalidatePath("/categories");
    revalidatePath("/");

    return {
      category: convertToResponse(category),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update category",
    };
  }
}

// Delete category
export async function deleteCategory(
  categoryId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(categoryId)) {
      throw new Error("Invalid category ID");
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check for subcategories
    if (category.subcategories.length > 0) {
      throw new Error("Cannot delete category with existing subcategories");
    }

    // Delete the category
    const result = await Category.findByIdAndDelete(categoryId);
    if (!result) {
      throw new Error("Failed to delete category");
    }

    // Revalidate the categories page
    revalidatePath("/categories");

    return { success: true };
  } catch (error) {
    console.error("Delete category error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}

// Fetch all categories
export async function getCategories(): Promise<CategoriesActionReturn> {
  try {
    await connectToDatabase();
    const categories = await Category.find().sort({ order: 1 });
    return {
      categories: categories.map(convertToResponse),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to fetch categories",
    };
  }
}

// Fetch specific category
export async function getCategory(
  categoryId: string
): Promise<CategoryActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(categoryId)) {
      throw new Error("Invalid category ID");
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    return { category: convertToResponse(category) };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to fetch category",
    };
  }
}

// Update category order
export async function updateCategoryOrder(
  categoryId: string,
  newOrder: number
): Promise<CategoryActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(categoryId)) {
      throw new Error("Invalid category ID");
    }

    const category = await Category.findByIdAndUpdate(
      categoryId,
      { order: newOrder },
      { new: true }
    );

    if (!category) {
      throw new Error("Category not found");
    }

    revalidatePath("/categories");
    revalidatePath("/");

    return {
      category: convertToResponse(category),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update category order",
    };
  }
}

// Update multiple category orders
export async function updateCategoryOrders(
  updates: { id: string; order: number }[]
): Promise<{ error?: string }> {
  try {
    await connectToDatabase();

    await Promise.all(
      updates.map(({ id, order }) => Category.findByIdAndUpdate(id, { order }))
    );

    revalidatePath("/categories");
    revalidatePath("/");

    return {};
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update category orders",
    };
  }
}
