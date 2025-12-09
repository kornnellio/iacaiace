"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Bell,
  LayoutGrid,
  Package,
  ShoppingCart,
  TagIcon,
  Users,
  Image,
  Ticket,
  BellRing,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategories } from "@/lib/actions/category.actions";
import { getSubcategories } from "@/lib/actions/subcategory.actions";
import { getProducts } from "@/lib/actions/product.actions";
import { getUsers } from "@/lib/actions/user.actions";

const ControlPanelDashboard = () => {
  const [stats, setStats] = useState({
    categories: 0,
    subcategories: 0,
    products: 0,
    users: 0, // Add users count
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [categoriesRes, subcategoriesRes, productsRes, usersRes] =
          await Promise.all([
            getCategories(),
            getSubcategories(),
            getProducts(),
            getUsers(),
          ]);

        setStats({
          categories: categoriesRes.categories?.length || 0,
          subcategories: subcategoriesRes.subcategories?.length || 0,
          products: productsRes.products?.length || 0,
          users: usersRes.users?.length || 0, // Add users count
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadStats();
  }, []);

  const sections = [
    {
      title: "Catalog Management",
      description: "Manage your product catalog structure",
      items: [
        {
          title: "Categories",
          description: "Manage main product categories",
          icon: LayoutGrid,
          href: "/control-panel/categories",
          count: stats.categories,
        },
        {
          title: "Subcategories",
          description: "Manage product subcategories",
          icon: TagIcon,
          href: "/control-panel/subcategories",
          count: stats.subcategories,
        },
        {
          title: "Products",
          description: "Manage your product inventory",
          icon: Package,
          href: "/control-panel/products",
          count: stats.products,
        },
      ],
    },
    {
      title: "User Management",
      description: "Manage your users and orders",
      items: [
        {
          title: "Users",
          description: "Manage user accounts and permissions",
          icon: Users,
          href: "/control-panel/users",
        },
        {
          title: "Orders",
          description: "View and manage customer orders",
          icon: ShoppingCart,
          href: "/control-panel/orders",
        },
      ],
    },
    {
      title: "Marketing & Communication",
      description: "Manage marketing, promotions and site-wide announcements",
      items: [
        {
          title: "Coupons",
          description: "Manage discount coupons",
          icon: Ticket,
          href: "/control-panel/coupons",
        },
        {
          title: "Carousel",
          description: "Manage homepage carousel slides",
          icon: Image,
          href: "/control-panel/carousel",
        },
        {
          title: "Announcement Bar",
          description: "Manage the site-wide announcement bar",
          icon: BellRing,
          href: "/control-panel/announcement",
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Control Panel</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your control panel. Manage your store from here.
        </p>
      </div>

      {sections.map((section, index) => (
        <div
          key={index}
          className="space-y-4"
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {section.title}
            </h2>
            <p className="text-muted-foreground">{section.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item, itemIndex) => (
              <Card
                key={itemIndex}
                className="hover:bg-muted/50 transition-colors"
              >
                <Link href={item.href}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <item.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {item.title}
                          </CardTitle>
                          <CardDescription>{item.description}</CardDescription>
                        </div>
                      </div>
                      {"count" in item ? (
                        <Badge
                          variant="secondary"
                          className="h-6"
                        >
                          {item.count}
                        </Badge>
                      ) : "badge" in item ? (
                        <Badge
                          variant="outline"
                          className="bg-primary/5"
                        >
                          {item.badge as React.ReactNode}
                        </Badge>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="ghost"
                      className="w-full justify-between group"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ControlPanelDashboard;
