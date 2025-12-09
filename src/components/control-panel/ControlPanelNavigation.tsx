"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LayoutGrid,
  Menu,
  Package,
  ShoppingCart,
  TagIcon,
  Users,
  X,
  Image,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  {
    title: "Dashboard",
    href: "/control-panel",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Categories",
    href: "/control-panel/categories",
    icon: LayoutGrid,
    exact: false,
  },
  {
    title: "Subcategories",
    href: "/control-panel/subcategories",
    icon: TagIcon,
    exact: false,
  },
  {
    title: "Products",
    href: "/control-panel/products",
    icon: Package,
    exact: false,
  },
  {
    title: "Users",
    href: "/control-panel/users",
    icon: Users,
    exact: false,
  },
  {
    title: "Orders",
    href: "/control-panel/orders",
    icon: ShoppingCart,
    exact: false,
  },
  {
    title: "Carousel",
    href: "/control-panel/carousel",
    icon: Image,
    exact: false,
  },
  {
    title: "Announcement",
    href: "/control-panel/announcement",
    icon: BellRing,
    exact: false,
  },
];

const ControlPanelNavigation = () => {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const NavItems = ({
    className,
    onClick,
  }: {
    className?: string;
    onClick?: () => void;
  }) => (
    <div className={className}>
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
          >
            <Button
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-2",
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Button>
          </Link>
        );
      })}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <Sheet
            open={open}
            onOpenChange={setOpen}
          >
            <SheetTrigger
              asChild
              className="lg:hidden"
            >
              <Button
                variant="ghost"
                size="icon"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[240px] sm:w-[300px]"
            >
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col space-y-2">
                <NavItems onClick={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop navigation */}
          <NavItems className="hidden lg:flex lg:flex-row lg:items-center lg:space-x-2" />

          {/* Optional: Add a logo or title here */}
          <div className="lg:hidden text-lg font-semibold">Control Panel</div>
        </div>
      </div>
    </nav>
  );
};

export default ControlPanelNavigation;
