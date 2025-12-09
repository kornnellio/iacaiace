"use client";

import { useEffect, useState } from "react";
import {
  getCarouselSlides,
  deleteCarouselSlide,
} from "@/lib/actions/carousel.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import CarouselForm from "./CarouselForm";

interface CarouselSlide {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  order: number;
}

export default function CarouselControlPanel() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState<CarouselSlide | null>(
    null
  );

  const loadSlides = async () => {
    try {
      setIsLoading(true);
      const result = await getCarouselSlides();
      if (result.slides) {
        setSlides(result.slides);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load carousel slides",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSlides();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteCarouselSlide(id);
      if (result.error) throw new Error(result.error);

      await loadSlides();
      toast({
        title: "Success",
        description: "Slide deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete slide",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSlide(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading slides...</div>
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
            <CardTitle className="text-2xl">Carousel Slides</CardTitle>
            <CardDescription>
              Manage your homepage carousel slides
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Slide
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Slide</DialogTitle>
              </DialogHeader>
              <CarouselForm
                onSuccess={() => {
                  void loadSlides();
                  toast({
                    title: "Success",
                    description: "Slide created successfully",
                  });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {slides.map((slide) => (
            <Card key={slide._id}>
              <CardContent className="p-4">
                <div className="aspect-video relative mb-4 rounded-lg overflow-hidden">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">{slide.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {slide.subtitle}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Slide</DialogTitle>
                        </DialogHeader>
                        <CarouselForm
                          slide={slide}
                          onSuccess={() => {
                            void loadSlides();
                            toast({
                              title: "Success",
                              description: "Slide updated successfully",
                            });
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedSlide(slide);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              slide.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() =>
                selectedSlide && void handleDelete(selectedSlide._id)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
