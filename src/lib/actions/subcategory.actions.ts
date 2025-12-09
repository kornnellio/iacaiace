"use server";

import { connectToDatabase } from "../database";
import {
  Category,
  type ISubcategory,
  Subcategory,
} from "@/lib/database/models/models";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { generateSlug } from "../utils";

// Input type
interface SubcategoryInput {
  name: string;
  description: string;
  category: string;
  current_sale_percentage?: number;
  image_url: string;
}

// Response type
interface SubcategoryResponse {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category: string;
  current_sale_percentage: number;
  products: string[];
  order: number;
  slug: string;
}

interface SubcategoryActionReturn {
  error?: string;
  subcategory?: SubcategoryResponse;
}

interface SubcategoriesActionReturn {
  error?: string;
  subcategories?: SubcategoryResponse[];
}

// Helper function to convert ISubcategory to SubcategoryResponse
function convertToResponse(subcategory: any): SubcategoryResponse {
  return {
    id: subcategory._id.toString(),
    name: subcategory.name,
    description: subcategory.description,
    image_url: subcategory.image_url,
    category: subcategory.category.toString(),
    current_sale_percentage: subcategory.current_sale_percentage,
    products: subcategory.products.map((p: any) => p.toString()),
    order: subcategory.order,
    slug: subcategory.slug,
  };
}

// Create new subcategory
export async function createSubcategory(
  subcategoryData: {
    name: string;
    description: string;
    image_url: string;
    category: string;
    current_sale_percentage?: number;
    order?: number;
  }
): Promise<SubcategoryActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(subcategoryData.category)) {
      throw new Error("Invalid category ID");
    }

    const category = await Category.findById(subcategoryData.category);
    if (!category) {
      throw new Error("Category not found");
    }

    // Generate slug
    const baseSlug = generateSlug(subcategoryData.name);
    let slug = baseSlug;
    let counter = 1;

    // Check for duplicate slugs
    while (await Subcategory.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const subcategory = await Subcategory.create({
      ...subcategoryData,
      products: [],
      slug,
    });

    // Add subcategory to category's subcategories array
    await Category.findByIdAndUpdate(subcategoryData.category, {
      $push: { subcategories: subcategory._id },
    });

    revalidatePath("/categories");
    return { subcategory: convertToResponse(subcategory) };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create subcategory",
    };
  }
}

// Update existing subcategory
export async function updateSubcategory(
  subcategoryId: string,
  subcategoryData: {
    name: string;
    description: string;
    image_url: string;
    category: string;
    current_sale_percentage?: number;
    order?: number;
  }
): Promise<SubcategoryActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(subcategoryId)) {
      throw new Error("Invalid subcategory ID");
    }

    const currentSubcategory = await Subcategory.findById(subcategoryId);
    if (!currentSubcategory) {
      throw new Error("Subcategory not found");
    }

    // Generate new slug only if name has changed
    let slug = currentSubcategory.slug;
    if (subcategoryData.name !== currentSubcategory.name) {
      const baseSlug = generateSlug(subcategoryData.name);
      slug = baseSlug;
      let counter = 1;

      // Check for duplicate slugs (excluding current subcategory)
      while (await Subcategory.findOne({ slug, _id: { $ne: subcategoryId } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // If category is changing, update category references
    if (subcategoryData.category !== currentSubcategory.category.toString()) {
      // Remove subcategory from old category
      await Category.findByIdAndUpdate(currentSubcategory.category, {
        $pull: { subcategories: subcategoryId },
      });

      // Add subcategory to new category
      await Category.findByIdAndUpdate(subcategoryData.category, {
        $push: { subcategories: subcategoryId },
      });
    }

    const subcategory = await Subcategory.findByIdAndUpdate(
      subcategoryId,
      { ...subcategoryData, slug },
      { new: true }
    );

    if (!subcategory) {
      throw new Error("Failed to update subcategory");
    }

    revalidatePath("/categories");
    return { subcategory: convertToResponse(subcategory) };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update subcategory",
    };
  }
}

// Delete subcategory
export async function deleteSubcategory(
  subcategoryId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(subcategoryId)) {
      throw new Error("Invalid subcategory ID");
    }

    // Get the subcategory to check its category and products
    const subcategory = await Subcategory.findById(subcategoryId);
    if (!subcategory) {
      throw new Error("Subcategory not found");
    }

    if (subcategory.products.length > 0) {
      throw new Error("Cannot delete subcategory with existing products");
    }

    // Remove subcategory from category's subcategories array
    await Category.findByIdAndUpdate(subcategory.category, {
      $pull: { subcategories: subcategoryId },
    });

    // Delete the subcategory
    await Subcategory.findByIdAndDelete(subcategoryId);

    revalidatePath("/categories");

    return { success: true };
  } catch (error) {
    console.error("Delete subcategory error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete subcategory",
    };
  }
}

// Fetch all subcategories
export async function getSubcategories(): Promise<SubcategoriesActionReturn> {
  try {
    await connectToDatabase();
    const subcategories = await Subcategory.find().sort({ order: 1 });
    return {
      subcategories: subcategories.map(convertToResponse),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to fetch subcategories",
    };
  }
}

// Fetch subcategories by category
export async function getSubcategoriesByCategory(
  categoryId: string
): Promise<SubcategoriesActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(categoryId)) {
      throw new Error("Invalid category ID");
    }

    const subcategories = await Subcategory.find({ category: categoryId }).sort({
      order: 1,
    });

    return {
      subcategories: subcategories.map(convertToResponse),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to fetch subcategories",
    };
  }
}

// Fetch specific subcategory
export async function getSubcategory(
  subcategoryId: string
): Promise<SubcategoryActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(subcategoryId)) {
      throw new Error("Invalid subcategory ID");
    }

    const subcategory = await Subcategory.findById(subcategoryId);
    if (!subcategory) {
      throw new Error("Subcategory not found");
    }

    return { subcategory: convertToResponse(subcategory) };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to fetch subcategory",
    };
  }
}

// Update subcategory orders
export async function updateSubcategoryOrders(
  updates: { id: string; order: number }[]
): Promise<{ error?: string; success?: boolean }> {
  try {
    await connectToDatabase();

    // Validate all IDs first
    for (const update of updates) {
      if (!Types.ObjectId.isValid(update.id)) {
        throw new Error(`Invalid subcategory ID: ${update.id}`);
      }
    }

    // Update all subcategories
    await Promise.all(
      updates.map((update) =>
        Subcategory.findByIdAndUpdate(update.id, { order: update.order })
      )
    );

    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Update subcategory orders error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update subcategory orders",
    };
  }
}
