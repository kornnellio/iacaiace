"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  HelpCircle,
  MapPin,
  Menu,
  User,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/lib/actions/category.actions";
import { getSubcategoriesByCategory } from "@/lib/actions/subcategory.actions";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSession } from "next-auth/react";
import { SignInButton } from "@/components/profile/SignInButton";
import { UserProfileCard } from "@/components/profile/UserProfileCard";
import { useCart } from "@/context/CartContext";
import Cart from "./Cart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import SearchBar from "./SearchBar";
import { stripHtml } from "./HtmlContent";

// Types for our data
interface Category {
  id: string;
  name: string;
  description: string;
  current_sale_percentage: number;
  subcategories: string[];
  order: number;
  slug: string;
}

interface Subcategory {
  id: string;
  name: string;
  description: string;
  category: string;
  current_sale_percentage: number;
  slug: string;
}

interface MenuData {
  [categoryId: string]: {
    category: Category;
    subcategories: Subcategory[];
  };
}

export default function NavigationBar() {
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<MenuData>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { totalItems } = useCart();
  const router = useRouter();

  const { data: session } = useSession();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const { categories, error: categoryError } = await getCategories();

        if (categoryError || !categories) {
          throw new Error(categoryError || "Failed to fetch categories");
        }

        const tempMenuData: MenuData = {};

        const sortedCategories = [...categories].sort(
          (a, b) => a.order - b.order
        );

        await Promise.all(
          sortedCategories.map(async (category) => {
            const { subcategories, error: subError } =
              await getSubcategoriesByCategory(category.id);

            if (!subError && subcategories) {
              tempMenuData[category.id] = {
                category,
                subcategories,
              };
            }
          })
        );

        setMenuData(tempMenuData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Add keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const groupIntoColumns = (data: MenuData) => {
    const categories = Object.values(data);
    const columnsCount = 5;
    const itemsPerColumn = Math.ceil(categories.length / columnsCount);

    return Array.from({ length: columnsCount }, (_, i) =>
      categories.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn)
    );
  };

  const LoadingSkeleton = () => (
    <div className="container mx-auto p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="space-y-3"
            >
              {[...Array(5)].map((_, j) => (
                <div
                  key={j}
                  className="h-3 bg-gray-200 rounded"
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Mobile Menu Content
  const MobileMenu = () => (
    <div className="p-4 space-y-6">
      <Accordion
        type="single"
        collapsible
        className="w-full"
      >
        {Object.values(menuData).map(({ category, subcategories }) => (
          <AccordionItem
            value={category.id}
            key={category.id}
          >
            <AccordionTrigger className="text-sm font-semibold">
              <Link
                href={`/${category.slug}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileMenuOpen(false);
                }}
                className="hover:text-blue-500"
              >
                {stripHtml(category.name)}
                {category.current_sale_percentage > 0 && (
                  <span className="ml-2 text-red-500">
                    -{category.current_sale_percentage}%
                  </span>
                )}
              </Link>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-4">
                {subcategories.map((subcategory) => (
                  <Link
                    key={subcategory.id}
                    href={`/${category.slug}/${subcategory.slug}`}
                    className="block py-2 text-sm text-gray-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {stripHtml(subcategory.name)}
                    {subcategory.current_sale_percentage > 0 && (
                      <span className="ml-2 text-red-500">
                        -{subcategory.current_sale_percentage}%
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Separate DISCOVER section */}
      <div className="border-t pt-4">
        <Link
          href="/discover"
          className="block text-lg font-semibold hover:text-blue-500"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          DISCOVER
        </Link>
      </div>
    </div>
  );

  return (
    <nav className="sticky top-[var(--announcement-height,0px)] left-0 right-0 z-50 bg-white border-b">
      <div className="container mx-auto">
        <div className="flex items-center h-26 justify-between px-0">
          <div className="flex items-center gap-1">
            {/* Mobile Menu Trigger */}
            <div className="lg:hidden">
              <Sheet
                open={isMobileMenuOpen}
                onOpenChange={setIsMobileMenuOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-transparent"
                  >
                    <Menu className="h-10 w-10" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-80 overflow-y-auto"
                >
                  <div className="flex flex-col gap-6 h-full overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    {loading ? (
                      <LoadingSkeleton />
                    ) : error ? (
                      <div className="p-4 text-red-500">{error}</div>
                    ) : (
                      <MobileMenu />
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center"
            >
              <Image
                src="/logo.png"
                alt="iaCaiace.ro Logo"
                width={260}
                height={70}
                className="h-28 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-8">
            <div
              onMouseEnter={() => setShowMegaMenu(true)}
              onMouseLeave={() => setShowMegaMenu(false)}
            >
              <Button
                variant="ghost"
                className="text-xl font-semibold hover:bg-transparent hover:text-blue-500"
              >
                PRODUSE
              </Button>

              {/* Desktop Mega Menu */}
              {showMegaMenu && (
                <>
                  <div
                    className="absolute left-0 w-full bg-white shadow-lg border-t mt-[1px] z-50"
                    onMouseLeave={() => setShowMegaMenu(false)}
                  >
                    {loading ? (
                      <LoadingSkeleton />
                    ) : error ? (
                      <div className="container mx-auto p-8 text-red-500 text-center">
                        {error}
                      </div>
                    ) : (
                      <div className="container mx-auto py-6 px-4">
                        <div className="max-w-7xl mx-auto">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-h-[calc(80vh-150px)] overflow-y-auto">
                            {groupIntoColumns(menuData).map(
                              (column, colIndex) => (
                                <div
                                  key={colIndex}
                                  className="space-y-6"
                                >
                                  {column.map(({ category, subcategories }) => (
                                    <div
                                      key={category.id}
                                      className="space-y-3"
                                    >
                                      <Link
                                        href={`/${category.slug}`}
                                        className="font-semibold text-sm uppercase tracking-wide hover:text-blue-500 relative group inline-block"
                                        onClick={() => setShowMegaMenu(false)}
                                      >
                                        <span className="relative whitespace-nowrap">
                                          {stripHtml(category.name)}
                                          {category.current_sale_percentage >
                                            0 && (
                                            <span className="ml-2 text-red-500">
                                              -
                                              {category.current_sale_percentage}
                                              %
                                            </span>
                                          )}
                                          <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gray-200 group-hover:bg-blue-500 transition-colors duration-300"></span>
                                        </span>
                                      </Link>
                                      <div className="space-y-2">
                                        {subcategories.map((subcategory) => (
                                          <Link
                                            key={subcategory.id}
                                            href={`/${category.slug}/${subcategory.slug}`}
                                            className="block text-sm text-gray-600 hover:text-blue-500 truncate"
                                            onClick={() =>
                                              setShowMegaMenu(false)
                                            }
                                          >
                                            {stripHtml(subcategory.name)}
                                            {subcategory.current_sale_percentage >
                                              0 && (
                                              <span className="ml-2 text-red-500">
                                                -
                                                {
                                                  subcategory.current_sale_percentage
                                                }
                                                %
                                              </span>
                                            )}
                                          </Link>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    className="fixed inset-0 bg-black/20 z-40"
                    style={{ top: "96px" }}
                  />
                </>
              )}
            </div>

            <Button
              variant="ghost"
              className="text-xl font-semibold hover:bg-transparent hover:text-gray-600"
            >
              DESCOPERĂ
            </Button>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-6 md:space-x-12 px-4 md:px-2">
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="hover:bg-transparent relative group"
                  style={{ height: "36px", width: "36px" }}
                >
                  <Search style={{ height: "24px", width: "24px" }} />
                  <span className="absolute hidden md:flex items-center justify-center text-xs bg-gray-100 text-gray-800 rounded px-1.5 py-0.5 -right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                    {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md p-6">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-2xl font-bold text-center">Caută produse</DialogTitle>
                </DialogHeader>
                <SearchBar 
                  className="w-full" 
                  autoFocus={true}
                  onSearch={(query) => {
                    setIsSearchOpen(false);
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                  }}
                />
              </DialogContent>
            </Dialog>
            <Link href={session ? "/profile" : "/login"}>
              <Button
                variant="ghost"
                className="hover:bg-transparent"
                style={{ height: "36px", width: "36px" }}
              >
                <User style={{ height: "24px", width: "24px" }} />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="ghost"
                className="hover:bg-transparent"
                style={{ height: "36px", width: "36px" }}
              >
                <MapPin style={{ height: "24px", width: "24px" }} />
              </Button>
            </Link>
            <Sheet
              open={isCartOpen}
              onOpenChange={setIsCartOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="hover:bg-transparent relative"
                  style={{ height: "36px", width: "36px" }}
                >
                  <ShoppingCart style={{ height: "24px", width: "24px" }} />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:w-96 p-0"
              >
                <Cart onClose={() => setIsCartOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
