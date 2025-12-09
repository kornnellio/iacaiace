import { redirect } from "next/navigation";
import { Category } from "@/lib/database/models/models";
import { connectToDatabase } from "@/lib/database";

export default async function CategoryRedirectPage({
  params: paramsPromise,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await paramsPromise;

  try {
    await connectToDatabase();

    // Find category by ID
    const category = await Category.findById(categoryId);
    if (!category) {
      redirect('/'); // Redirect to home if category not found
    }

    // Redirect to new slug-based URL
    redirect(`/${category.slug}`);
  } catch (error) {
    console.error("Error in Category Redirect Page:", error);
    redirect('/');
  }
}
