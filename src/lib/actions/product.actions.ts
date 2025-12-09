"use server";

import { connectToDatabase } from "../database";
import {
  IProduct,
  Product,
  ProductInput,
  ProductResponse,
  Subcategory,
  SearchHistory,
} from "@/lib/database/models/models";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { generateSlug } from "../utils";

// Helper function to convert IProduct to ProductResponse
function convertToResponse(product: IProduct): ProductResponse {
  return {
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    category: product.category.toString(),
    subcategory: product.subcategory.toString(),
    categoryName: product.categoryName,
    subcategoryName: product.subcategoryName,
    variants: product.variants.map((variant) => ({
      id: variant._id.toString(),
      sku: variant.sku,
      color: {
        name: variant.color.name,
        hex: variant.color.hex,
      },
      price: Number(variant.price),
      current_sale_percentage: Number(variant.current_sale_percentage),
      currentStock: Number(variant.currentStock),
      sizeStock:
        variant.sizeStock?.map((s) => ({
          size: s.size,
          stock: Number(s.stock),
          price: s.price ? Number(s.price) : undefined,
        })) || [],
      images: [...variant.images],
    })),
    technicalSpecifications: product.technicalSpecifications.map((spec) => ({
      title: spec.title,
      description: spec.description,
    })),
    shortDescription: product.shortDescription,
    isClothing: product.isClothing || false,
    isPaddle: product.isPaddle || false,
    paddleConfigurator: product.paddleConfigurator
      ? {
          enabled: product.paddleConfigurator.enabled,
          materials: product.paddleConfigurator.materials.map((material) => ({
            id: material.id,
            name: material.name,
            description: material.description,
            priceModifier: material.priceModifier,
            image: material.image,
          })),
          shaftTypes: product.paddleConfigurator.shaftTypes.map((shaft) => ({
            id: shaft.id,
            name: shaft.name,
            description: shaft.description,
            priceModifier: shaft.priceModifier,
          })),
          bladeAngles: product.paddleConfigurator.bladeAngles.map((angle) => ({
            id: angle.id,
            name: angle.name,
            angle: angle.angle,
            description: angle.description,
            priceModifier: angle.priceModifier,
          })),
          lengths: product.paddleConfigurator.lengths.map((length) => ({
            id: length.id,
            name: length.name,
            length: length.length,
            description: length.description,
            priceModifier: length.priceModifier,
          })),
          parts: product.paddleConfigurator.parts.map((part) => ({
            id: part.id,
            name: part.name,
            pieces: part.pieces,
            description: part.description,
            priceModifier: part.priceModifier,
          })),
        }
      : undefined,
    sizingGuide: product.sizingGuide
      ? {
          title: product.sizingGuide.title,
          headers: [...product.sizingGuide.headers],
          rows: product.sizingGuide.rows.map((row) => ({
            size: row.size,
            measurements: [...row.measurements],
          })),
        }
      : undefined,
    slug: product.slug,
  };
}

interface ProductActionReturn {
  error?: string;
  product?: ProductResponse;
}

interface ProductsActionReturn {
  error?: string;
  products?: ProductResponse[];
}

export async function createProduct(
  productData: ProductInput
): Promise<ProductActionReturn> {
  try {
    await connectToDatabase();
    const {
      name,
      description,
      category,
      subcategory,
      categoryName,
      subcategoryName,
      variants,
      technicalSpecifications,
      shortDescription,
      isClothing,
      isPaddle,
      paddleConfigurator,
      sizingGuide,
    } = productData;

    if (
      !Types.ObjectId.isValid(category) ||
      !Types.ObjectId.isValid(subcategory)
    ) {
      throw new Error("Invalid category or subcategory ID");
    }

    // Verify category and subcategory exist and are related
    const subcategoryDoc = await Subcategory.findOne({
      _id: subcategory,
      category: category,
    });

    if (!subcategoryDoc) {
      throw new Error("Invalid category/subcategory combination");
    }

    // Validate variants
    if (!variants?.length) {
      throw new Error("At least one variant is required");
    }

    // Check for duplicate SKUs
    const skus = variants.map((v) => v.sku);
    if (new Set(skus).size !== skus.length) {
      throw new Error("Duplicate SKUs found");
    }

    // Add validation for technicalSpecifications
    if (!technicalSpecifications) {
      throw new Error("Technical specifications are required");
    }

    // Validate shortDescription
    if (!shortDescription) {
      throw new Error("Short description is required");
    }

    // Validate paddle configurator if isPaddle is true
    if (isPaddle && paddleConfigurator) {
      if (!paddleConfigurator.enabled) {
        throw new Error("Paddle configurator must be enabled");
      }
      if (!paddleConfigurator.materials || paddleConfigurator.materials.length === 0) {
        throw new Error("Paddle configurator must have at least one material");
      }
      if (!paddleConfigurator.shaftTypes || paddleConfigurator.shaftTypes.length === 0) {
        throw new Error("Paddle configurator must have at least one shaft type");
      }
      if (!paddleConfigurator.bladeAngles || paddleConfigurator.bladeAngles.length === 0) {
        throw new Error("Paddle configurator must have at least one blade angle");
      }
      if (!paddleConfigurator.lengths || paddleConfigurator.lengths.length === 0) {
        throw new Error("Paddle configurator must have at least one length");
      }
      if (!paddleConfigurator.parts || paddleConfigurator.parts.length === 0) {
        throw new Error("Paddle configurator must have at least one part");
      }
    }

    // Generate slug
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Check for duplicate slugs
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create product with variants and technical specifications
    const product = await Product.create({
      name,
      description,
      category,
      subcategory,
      categoryName,
      subcategoryName,
      variants,
      technicalSpecifications,
      shortDescription,
      isClothing,
      isPaddle,
      paddleConfigurator,
      sizingGuide,
      slug,
    });

    // Add product to subcategory's products array
    await Subcategory.findByIdAndUpdate(subcategory, {
      $push: { products: product._id },
    });

    revalidatePath("/products");
    return { product: convertToResponse(product) };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function updateProduct(
  productId: string,
  productData: ProductInput
): Promise<ProductActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    const currentProduct = await Product.findById(productId);
    if (!currentProduct) {
      throw new Error("Product not found");
    }

    // Check for duplicate SKUs
    const skus = productData.variants.map((v) => v.sku);
    if (new Set(skus).size !== skus.length) {
      throw new Error("Duplicate SKUs found");
    }

    // Generate new slug only if name has changed
    let slug = currentProduct.slug;
    if (productData.name !== currentProduct.name) {
      const baseSlug = generateSlug(productData.name);
      slug = baseSlug;
      let counter = 1;

      // Check for duplicate slugs (excluding current product)
      while (await Product.findOne({ slug, _id: { $ne: productId } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // If subcategory is changing, update subcategories' products arrays
    if (currentProduct.subcategory.toString() !== productData.subcategory) {
      await Subcategory.findByIdAndUpdate(currentProduct.subcategory, {
        $pull: { products: productId },
      });

      await Subcategory.findByIdAndUpdate(productData.subcategory, {
        $push: { products: productId },
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { ...productData, slug },
      { new: true }
    );

    if (!updatedProduct) {
      throw new Error("Failed to update product");
    }

    revalidatePath("/products");
    return { product: convertToResponse(updatedProduct) };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

export async function updateVariantStock(
  productId: string,
  variantId: string,
  newStock: number
): Promise<{ error?: string; success?: boolean }> {
  try {
    await connectToDatabase();

    if (
      !Types.ObjectId.isValid(productId) ||
      !Types.ObjectId.isValid(variantId)
    ) {
      throw new Error("Invalid product or variant ID");
    }

    if (newStock < 0) {
      throw new Error("Stock cannot be negative");
    }

    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        "variants._id": variantId,
      },
      {
        $set: { "variants.$.currentStock": newStock },
      },
      { new: true }
    );

    if (!updatedProduct) {
      throw new Error("Product or variant not found");
    }

    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update stock",
    };
  }
}

export async function deleteProduct(
  productId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Remove product from subcategory's products array
    await Subcategory.findByIdAndUpdate(product.subcategory, {
      $pull: { products: productId },
    });

    // Delete the product and all its variants
    await Product.findByIdAndDelete(productId);

    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}

export async function getProducts(): Promise<ProductsActionReturn> {
  try {
    await connectToDatabase();
    const products = await Product.find().sort({ name: 1 });
    return {
      products: products.map(convertToResponse),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to fetch products",
    };
  }
}

export async function getProductsBySubcategory(
  subcategoryId: string
): Promise<ProductsActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(subcategoryId)) {
      throw new Error("Invalid subcategory ID");
    }

    const products = await Product.find({ subcategory: subcategoryId }).sort({
      name: 1,
    });
    return {
      products: products.map(convertToResponse),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to fetch products",
    };
  }
}

export async function getProduct(
  productId: string
): Promise<ProductActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    return { product: convertToResponse(product) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch product",
    };
  }
}

export async function updateVariantSizeStock(
  productId: string,
  variantId: string,
  size: string,
  newStock: number
): Promise<{ error?: string; success?: boolean }> {
  try {
    await connectToDatabase();

    if (
      !Types.ObjectId.isValid(productId) ||
      !Types.ObjectId.isValid(variantId)
    ) {
      throw new Error("Invalid product or variant ID");
    }

    if (newStock < 0) {
      throw new Error("Stock cannot be negative");
    }

    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        "variants._id": variantId,
        "variants.sizeStock.size": size,
      },
      {
        $set: { "variants.$[variant].sizeStock.$[sizeElem].stock": newStock },
      },
      {
        arrayFilters: [{ "variant._id": variantId }, { "sizeElem.size": size }],
        new: true,
      }
    );

    if (!updatedProduct) {
      // If no document was updated, it might be because the size doesn't exist yet
      // Try to add the size to the sizeStock array
      const productWithNewSize = await Product.findOneAndUpdate(
        {
          _id: productId,
          "variants._id": variantId,
        },
        {
          $push: { "variants.$.sizeStock": { size, stock: newStock } },
        },
        { new: true }
      );

      if (!productWithNewSize) {
        throw new Error("Product or variant not found");
      }
    }

    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update size stock",
    };
  }
}

export async function searchProducts(
  searchTerm: string,
  options?: {
    categoryId?: string;
    sortBy?: 'relevance' | 'price-low' | 'price-high' | 'name' | 'discount';
  }
): Promise<ProductsActionReturn> {
  try {
    await connectToDatabase();
    
    if (!searchTerm || searchTerm.trim() === '') {
      return { products: [] };
    }
    
    // Log the search term
    await SearchHistory.create({
      search_term: searchTerm.trim(),
      date_searched: new Date(),
    });
    
    // Create a case-insensitive regex for the search term
    const searchRegex = new RegExp(searchTerm, 'i');
    
    // Build the query
    let query: any = {
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { 'variants.sku': searchRegex },
        { categoryName: searchRegex },
        { subcategoryName: searchRegex }
      ]
    };
    
    // Add category filter if provided
    if (options?.categoryId && Types.ObjectId.isValid(options.categoryId)) {
      query.category = options.categoryId;
    }
    
    // Execute the query
    let products = await Product.find(query);
    
    // Convert to response format
    let productResponses = products.map(convertToResponse);
    
    // Apply sorting
    if (options?.sortBy) {
      switch (options.sortBy) {
        case 'price-low':
          productResponses.sort((a, b) => {
            const aPrice = a.variants[0]?.price || 0;
            const bPrice = b.variants[0]?.price || 0;
            return aPrice - bPrice;
          });
          break;
        case 'price-high':
          productResponses.sort((a, b) => {
            const aPrice = a.variants[0]?.price || 0;
            const bPrice = b.variants[0]?.price || 0;
            return bPrice - aPrice;
          });
          break;
        case 'name':
          productResponses.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'discount':
          productResponses.sort((a, b) => {
            const aDiscount = a.variants[0]?.current_sale_percentage || 0;
            const bDiscount = b.variants[0]?.current_sale_percentage || 0;
            return bDiscount - aDiscount;
          });
          break;
        // For 'relevance', we keep the order as is
      }
    }
    
    return {
      products: productResponses,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to search products",
    };
  }
}
