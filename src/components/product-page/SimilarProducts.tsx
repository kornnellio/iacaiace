import { getProducts } from "@/lib/actions/product.actions";
import ProductGrid from "@/components/shop-grid-page/ProductGrid";

export default async function SimilarProducts({
  categoryId,
  currentProductId,
}: {
  categoryId: string;
  currentProductId: string;
}) {
  const { products = [] } = await getProducts();

  const similarProducts = products
    .filter(
      (product) =>
        product.category === categoryId && product.id !== currentProductId
    )
    .slice(0, 4);

  if (similarProducts.length === 0) return null;

  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold mb-8">Similar Products</h2>
      <ProductGrid products={similarProducts} />
    </section>
  );
}
