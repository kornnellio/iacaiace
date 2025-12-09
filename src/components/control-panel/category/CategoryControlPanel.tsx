"use client";

import { useEffect, useState } from "react";
import {
  deleteCategory,
  getCategories,
  updateCategoryOrders,
} from "@/lib/actions/category.actions";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Search, Trash2, GripVertical } from "lucide-react";
import CategoryForm from "./CategoryForm";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

interface FormCategory {
  id: string;
  name: string;
  description: string;
  image_url: string;
  current_sale_percentage: number;
  subcategories: string[];
}

interface Category extends FormCategory {
  order: number;
}

// Helper function to convert form category to full category
const convertFormCategory = (
  category: FormCategory,
  order: number = 0
): Category => ({
  ...category,
  order,
});

// Sortable table row component
const SortableTableRow = ({
  category,
  onEdit,
  onDelete,
  onUpdateCategory,
}: {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onUpdateCategory: (updatedCategory: Category) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "move",
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
    >
      <TableCell
        className="w-[50px] font-medium"
        {...attributes}
        {...listeners}
      >
        <div className="cursor-move flex items-center gap-2">
          <GripVertical className="h-4 w-4" />
          {category.order + 1}
        </div>
      </TableCell>
      <TableCell>
        <div className="relative w-16 h-16 rounded-md overflow-hidden">
          <img
            src={category.image_url}
            alt={category.name}
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.png";
            }}
          />
        </div>
      </TableCell>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell>{category.description}</TableCell>
      <TableCell>
        <Badge variant="secondary">
          {category.subcategories?.length || 0} subcategories
        </Badge>
      </TableCell>
      <TableCell>
        {category.current_sale_percentage > 0 && (
          <Badge variant="destructive">
            {category.current_sale_percentage}% OFF
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(category);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Category</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto">
                  <CategoryForm
                    category={category}
                    onSuccess={async (formCategory: FormCategory) => {
                      const updatedCategory = convertFormCategory(
                        formCategory,
                        category.order
                      );
                      onUpdateCategory(updatedCategory);
                      toast({
                        title: "Success",
                        description: "Category updated successfully",
                      });
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(category);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <Card className="w-full">
    <CardContent className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const CategoryControlPanel = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getCategories();

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.categories) {
        throw new Error("No categories data received");
      }

      setCategories(result.categories);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch categories";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        // Create new array with updated orders
        const newItems = arrayMove(items, oldIndex, newIndex).map(
          (item, index) => ({
            ...item,
            order: index,
          })
        );

        // Update orders in the database without waiting for response
        void updateCategoryOrders(
          newItems.map((item) => ({
            id: item.id,
            order: item.order,
          }))
        ).catch((error) => {
          // If the database update fails, show error and revert to original order
          toast({
            variant: "destructive",
            title: "Error updating order",
            description: "The changes couldn't be saved. Please try again.",
          });
          void loadCategories(); // Reload original order from server
        });

        return newItems;
      });
    }
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateCategory = (updatedCategory: Category) => {
    setCategories((prev: Category[]) =>
      prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
    );
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl">Categories</CardTitle>
            <CardDescription>
              Manage your product categories. Drag and drop to reorder them.
            </CardDescription>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto">
                <CategoryForm
                  onSuccess={async (formCategory: FormCategory) => {
                    const nextOrder =
                      Math.max(...categories.map((c) => c.order), -1) + 1;
                    const category = convertFormCategory(
                      formCategory,
                      nextOrder
                    );
                    setCategories((prev) => [...prev, category]);
                    setIsDialogOpen(false);
                    toast({
                      title: "Success",
                      description: "Category created successfully",
                    });
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadCategories()}
                className="ml-2"
              >
                Retry
              </Button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="border rounded-lg">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Subcategories</TableHead>
                    <TableHead>Sale</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={filteredCategories}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredCategories.map((category) => (
                      <SortableTableRow
                        key={category.id}
                        category={category}
                        onEdit={handleEditCategory}
                        onDelete={handleDeleteCategory}
                        onUpdateCategory={handleUpdateCategory}
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          </div>

          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  category and all its associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (selectedCategory) {
                      setIsDeleting(true);
                      const { error } = await deleteCategory(
                        selectedCategory.id
                      );
                      if (error) {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: error,
                        });
                      } else {
                        setCategories((prev) =>
                          prev.filter((c) => c.id !== selectedCategory.id)
                        );
                        toast({
                          title: "Success",
                          description: "Category deleted successfully",
                        });
                      }
                      setIsDeleting(false);
                      setIsDeleteDialogOpen(false);
                    }
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryControlPanel;
