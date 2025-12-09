"use client";

import { useEffect, useState, useMemo } from "react";
import {
  deleteSubcategory,
  getSubcategories,
  updateSubcategoryOrders,
} from "@/lib/actions/subcategory.actions";
import { getCategories } from "@/lib/actions/category.actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  GripVertical,
} from "lucide-react";
import SubcategoryForm from "./SubcategoryForm";
import { toast } from "@/hooks/use-toast";

// Define types for category and subcategory
interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  current_sale_percentage: number;
  products: string[];
  order: number;
}

interface GroupedSubcategories {
  [categoryId: string]: Subcategory[];
}

// Sortable table row component
interface SortableTableRowProps {
  subcategory: Subcategory;
  allSubcategories: Subcategory[];
  onEdit: () => void;
  onDelete: () => void;
  categoryMap: Map<string, string>;
  onSuccess: () => Promise<void>;
}

const SortableTableRow = ({
  subcategory,
  allSubcategories,
  onEdit,
  onDelete,
  categoryMap,
  onSuccess,
}: SortableTableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subcategory.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Calculate category-specific order
  const categorySubcategories = allSubcategories.filter(
    (s: Subcategory) => s.category === subcategory.category
  );
  const categoryOrder = categorySubcategories.findIndex(
    (s: Subcategory) => s.id === subcategory.id
  );

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
          {categoryOrder + 1}
        </div>
      </TableCell>
      <TableCell>
        <div className="relative w-16 h-16 rounded-md overflow-hidden">
          <img
            src={subcategory.image_url}
            alt={subcategory.name}
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.png";
            }}
          />
        </div>
      </TableCell>
      <TableCell className="font-medium">{subcategory.name}</TableCell>
      <TableCell>
        {categoryMap.get(subcategory.category) || "Unknown"}
      </TableCell>
      <TableCell>{subcategory.description}</TableCell>
      <TableCell>
        <Badge variant="secondary">
          {subcategory.products.length} products
        </Badge>
      </TableCell>
      <TableCell>
        {subcategory.current_sale_percentage > 0 && (
          <Badge variant="destructive">
            {subcategory.current_sale_percentage}% OFF
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
                    onEdit();
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Subcategory</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto">
                  <SubcategoryForm
                    subcategory={subcategory}
                    onSuccess={async () => {
                      await onSuccess();
                      toast({
                        title: "Success",
                        description: "Subcategory updated successfully",
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
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

const SubcategoryControlPanel = () => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [groupedSubcategories, setGroupedSubcategories] =
    useState<GroupedSubcategories>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(
    new Map()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<Subcategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadSubcategories = async () => {
    try {
      setIsLoading(true);
      const [categoriesResult, subcategoriesResult] = await Promise.all([
        getCategories(),
        getSubcategories(),
      ]);

      // Handle categories
      if (categoriesResult.categories) {
        const formattedCategories = categoriesResult.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
        }));
        setCategories(formattedCategories);

        // Create category name map
        const newCategoryMap = new Map<string, string>();
        formattedCategories.forEach((cat) => {
          newCategoryMap.set(cat.id, cat.name);
        });
        setCategoryMap(newCategoryMap);
      }

      // Handle subcategories
      if (subcategoriesResult.subcategories) {
        // Group subcategories by category and sort by order within each group
        const grouped: GroupedSubcategories = {};
        const formattedSubcategories: Subcategory[] =
          subcategoriesResult.subcategories.map((sub, index) => ({
            ...sub,
            order: index, // Use index as default order if not provided
          }));

        formattedSubcategories.forEach((sub) => {
          if (!grouped[sub.category]) {
            grouped[sub.category] = [];
          }
          grouped[sub.category].push(sub);
        });

        // Sort subcategories within each category
        Object.keys(grouped).forEach((categoryId) => {
          grouped[categoryId].sort((a, b) => a.order - b.order);
        });

        setGroupedSubcategories(grouped);
        setSubcategories(formattedSubcategories);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    try {
      const result = await deleteSubcategory(subcategoryId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Subcategory deleted successfully",
        });
        await loadSubcategories();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to delete subcategory",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete subcategory",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  useEffect(() => {
    void loadSubcategories();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = subcategories.findIndex((item) => item.id === active.id);
    const newIndex = subcategories.findIndex((item) => item.id === over.id);
    const movedSubcategory = subcategories[oldIndex];
    const targetSubcategory = subcategories[newIndex];

    // Only allow reordering within the same category
    if (movedSubcategory.category !== targetSubcategory.category) {
      return;
    }

    // Get all subcategories in the same category
    const categorySubcategories = subcategories.filter(
      (s) => s.category === movedSubcategory.category
    );

    // Find the indices within the category
    const oldCategoryIndex = categorySubcategories.findIndex(
      (s) => s.id === active.id
    );
    const newCategoryIndex = categorySubcategories.findIndex(
      (s) => s.id === over.id
    );

    // Reorder the category's subcategories
    const reorderedCategorySubcategories = arrayMove(
      categorySubcategories,
      oldCategoryIndex,
      newCategoryIndex
    );

    // Create a new array with updated subcategories
    const updatedSubcategories = subcategories.map((sub) => {
      if (sub.category !== movedSubcategory.category) {
        return sub;
      }
      const newPosition = reorderedCategorySubcategories.findIndex(
        (s) => s.id === sub.id
      );
      return {
        ...sub,
        order: newPosition,
      };
    });

    // Sort the updated subcategories
    const sortedSubcategories = [...updatedSubcategories].sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.order - b.order;
    });

    // Update state with sorted subcategories
    setSubcategories(sortedSubcategories);

    // Prepare updates for the database
    const categoryUpdates = reorderedCategorySubcategories.map(
      (sub, index) => ({
        id: sub.id,
        order: index,
      })
    );

    // Update orders in the database
    const result = await updateSubcategoryOrders(categoryUpdates);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
      await loadSubcategories();
      return;
    }
  };

  // Update the filtered subcategories logic
  const filteredSubcategories = useMemo(() => {
    let filtered = [...subcategories];

    if (searchTerm) {
      filtered = filtered.filter(
        (subcategory) =>
          subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subcategory.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (subcategory) => subcategory.category === selectedCategory
      );
    }

    // Sort first by category, then by order within each category
    return filtered.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.order - b.order;
    });
  }, [subcategories, searchTerm, selectedCategory]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-muted-foreground">
              Loading subcategories...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl">Subcategories</CardTitle>
            <CardDescription>Manage your product subcategories</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Subcategory
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Subcategory</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto">
                <SubcategoryForm
                  defaultCategoryId={selectedCategory}
                  onSuccess={async () => {
                    await loadSubcategories();
                    toast({
                      title: "Success",
                      description: "Subcategory created successfully",
                    });
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Search and filter controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search subcategories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategories Tables - One per category */}
          <div className="space-y-6">
            {selectedCategory === "all" ? (
              // Show all categories
              categories.map((category) => {
                // Filter subcategories for this category
                const categorySubcategories = filteredSubcategories.filter(
                  (sub) => sub.category === category.id
                );

                return (
                  categorySubcategories.length > 0 && (
                    <div
                      key={category.id}
                      className="space-y-4"
                    >
                      <h3 className="text-lg font-semibold">{category.name}</h3>
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
                                <TableHead>Products</TableHead>
                                <TableHead>Sale</TableHead>
                                <TableHead className="text-right">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <SortableContext
                                items={categorySubcategories.map((s) => s.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                {categorySubcategories.map((subcategory) => (
                                  <SortableTableRow
                                    key={subcategory.id}
                                    subcategory={subcategory}
                                    allSubcategories={categorySubcategories}
                                    onEdit={() =>
                                      setSelectedSubcategory(subcategory)
                                    }
                                    onDelete={() => {
                                      setSelectedSubcategory(subcategory);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    categoryMap={categoryMap}
                                    onSuccess={loadSubcategories}
                                  />
                                ))}
                              </SortableContext>
                            </TableBody>
                          </Table>
                        </DndContext>
                      </div>
                    </div>
                  )
                );
              })
            ) : (
              // Show only selected category
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
                        <TableHead>Products</TableHead>
                        <TableHead>Sale</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <SortableContext
                        items={filteredSubcategories.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {filteredSubcategories.map((subcategory) => (
                          <SortableTableRow
                            key={subcategory.id}
                            subcategory={subcategory}
                            allSubcategories={filteredSubcategories}
                            onEdit={() => setSelectedSubcategory(subcategory)}
                            onDelete={() => {
                              setSelectedSubcategory(subcategory);
                              setIsDeleteDialogOpen(true);
                            }}
                            categoryMap={categoryMap}
                            onSuccess={loadSubcategories}
                          />
                        ))}
                      </SortableContext>
                    </TableBody>
                  </Table>
                </DndContext>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              subcategory "{selectedSubcategory?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() =>
                selectedSubcategory &&
                handleDeleteSubcategory(selectedSubcategory.id)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default SubcategoryControlPanel;
