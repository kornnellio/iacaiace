import { searchProducts } from "@/lib/actions/product.actions";
import { getPopularSearches } from "@/lib/actions/search.actions";
import ProductGrid from "@/components/shop-grid-page/ProductGrid";
import { Suspense } from "react";
import { ProductResponse } from "@/lib/database/models/models";
import SearchBar from "@/components/shared/SearchBar";
import SearchFilters from "@/components/shared/SearchFilters";
import Link from "next/link";
import { TrendingUp, Search as SearchIcon } from "lucide-react";
import { stripHtmlServer } from "@/lib/utils";

export default async function SearchPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ 
    q?: string;
    category?: string;
    sort?: 'relevance' | 'price-low' | 'price-high' | 'name' | 'discount';
  }>;
}) {
  // Await searchParams first as a Promise
  const searchParams = await searchParamsPromise;
  
  const query = searchParams.q || "";
  const categoryId = searchParams.category;
  const sortBy = searchParams.sort as 'relevance' | 'price-low' | 'price-high' | 'name' | 'discount' | undefined;
  
  // If there's a query, search for products
  const { products, error } = query 
    ? await searchProducts(query, { categoryId, sortBy }) 
    : { products: [], error: undefined };
  
  // If there's no query, get popular searches
  const { popularSearches } = !query ? await getPopularSearches(10) : { popularSearches: [] };

  // Clean the query from HTML for display
  const cleanQuery = stripHtmlServer(query);

  return (
    <main className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6 flex items-center">
            {query ? (
              <>
                <SearchIcon className="h-8 w-8 mr-3 text-blue-600" />
                Rezultate pentru "{cleanQuery}"
              </>
            ) : (
              <>
                <SearchIcon className="h-8 w-8 mr-3 text-blue-600" />
                Caută produse
              </>
            )}
          </h1>
          
          <div className="mb-8 max-w-2xl">
            <SearchBar initialQuery={query} className="w-full" />
          </div>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 shadow-sm">
              {error}
            </div>
          )}
          
          {!query && popularSearches && popularSearches.length > 0 && (
            <div className="mb-12 bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Căutări populare
              </h2>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search, index) => (
                  <Link 
                    key={index} 
                    href={`/search?q=${encodeURIComponent(search.term)}`}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-sm transition-colors flex items-center"
                  >
                    <SearchIcon className="h-3 w-3 mr-1.5 text-gray-500" />
                    {stripHtmlServer(search.term)}
                    <span className="ml-1.5 text-xs text-gray-500">({search.count})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {query && !error && (
            <div className="mb-8">
              {products && products.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                  <SearchIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h2 className="text-xl font-semibold mb-2">Nu am găsit produse</h2>
                  <p className="text-gray-600 mb-6">
                    Nu am găsit produse pentru "{cleanQuery}". Încearcă alte cuvinte cheie.
                  </p>
                  <div className="flex justify-center">
                    <Link 
                      href="/"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Înapoi la pagina principală
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-gray-600 mb-6 flex items-center">
                    <span className="bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded-full text-sm mr-2">
                      {products?.length}
                    </span>
                    produse găsite pentru "{cleanQuery}"
                  </div>
                  
                  <div className="mb-8">
                    <SearchFilters className="bg-white p-6 rounded-lg border shadow-sm" />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <Suspense fallback={
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse space-y-8 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/4 mt-2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }>
          {products && products.length > 0 && <ProductGrid products={products} />}
        </Suspense>
      </div>
    </main>
  );
} 
