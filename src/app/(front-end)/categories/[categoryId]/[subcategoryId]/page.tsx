import { redirect } from "next/navigation";
import { Category, Subcategory } from "@/lib/database/models/models";
import { connectToDatabase } from "@/lib/database";

export default async function SubcategoryRedirectPage({
  params: paramsPromise,
}: {
  params: Promise<{ categoryId: string; subcategoryId: string }>;
}) {
  const { categoryId, subcategoryId } = await paramsPromise;

  try {
    await connectToDatabase();

    // Find category and subcategory by ID
    const [category, subcategory] = await Promise.all([
      Category.findById(categoryId),
      Subcategory.findById(subcategoryId)
    ]);

    if (!category || !subcategory) {
      redirect('/'); // Redirect to home if category or subcategory not found
    }

    // Redirect to new slug-based URL
    redirect(`/${category.slug}/${subcategory.slug}`);
  } catch (error) {
    console.error("Error in Subcategory Redirect Page:", error);
    redirect('/');
  }
}
