import React, { useEffect, useState, useRef } from "react";
import { ProductResponse } from "@/lib/database/models/models";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  variants: ProductResponse["variants"];
  selectedVariant: ProductResponse["variants"][0];
  onVariantChange: (variant: ProductResponse["variants"][0]) => void;
}

const PLACEHOLDER_IMAGE = "/placeholder.png";

export default function ProductImageGallery({
  variants,
  selectedVariant,
  onVariantChange,
}: ProductImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const currentImages = selectedVariant.images;
  const maxVisibleThumbnails = 4;

  useEffect(() => {
    setCurrentImageIndex(0);
    setThumbnailStartIndex(0);
    setFailedImages(new Set());
  }, [selectedVariant.id]);

  const handleImageError = (imageSrc: string) => {
    setFailedImages((prev) => new Set(prev).add(imageSrc));
  };

  const getImageSrc = (imageSrc: string) => {
    return failedImages.has(imageSrc) ? PLACEHOLDER_IMAGE : imageSrc;
  };

  const navigateImage = (direction: "prev" | "next") => {
    setCurrentImageIndex((current) => {
      if (direction === "next") {
        return current === currentImages.length - 1 ? 0 : current + 1;
      }
      return current === 0 ? currentImages.length - 1 : current - 1;
    });
  };

  const navigateThumbnails = (direction: "up" | "down") => {
    setThumbnailStartIndex((current) => {
      if (direction === "down") {
        return Math.min(
          current + 1,
          currentImages.length - maxVisibleThumbnails
        );
      }
      return Math.max(current - 1, 0);
    });
  };

  const visibleThumbnails = currentImages.slice(
    thumbnailStartIndex,
    thumbnailStartIndex + maxVisibleThumbnails + 1
  );

  return (
    <>
      <div className="flex gap-4">
        {/* Vertical Thumbnails */}
        <div className="flex flex-col w-24 h-[calc(100%-2px)]">
          {/* Up Arrow */}
          {thumbnailStartIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-6 hover:bg-gray-100 flex-shrink-0"
              onClick={() => navigateThumbnails("up")}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}

          {/* Thumbnails Container with Overflow */}
          <div className="relative flex-1 min-h-0">
            <div
              className={cn(
                "flex flex-col gap-2 h-full",
                thumbnailStartIndex > 0 && "pt-2",
                thumbnailStartIndex <
                  currentImages.length - maxVisibleThumbnails && "pb-2"
              )}
            >
              <div className="space-y-2 h-full flex flex-col">
                {/* Full-size thumbnails */}
                {visibleThumbnails
                  .slice(0, maxVisibleThumbnails)
                  .map((image, index) => {
                    const actualIndex = thumbnailStartIndex + index;
                    return (
                      <button
                        key={actualIndex}
                        onClick={() => setCurrentImageIndex(actualIndex)}
                        className={cn(
                          "aspect-square rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 w-full",
                          currentImageIndex === actualIndex
                            ? "border-black"
                            : "border-transparent hover:border-gray-200"
                        )}
                      >
                        <img
                          src={getImageSrc(image)}
                          alt={`Product view ${actualIndex + 1}`}
                          className="w-full h-full object-contain"
                          onError={() => handleImageError(image)}
                        />
                      </button>
                    );
                  })}

                {/* Partial thumbnail */}
                {visibleThumbnails.length > maxVisibleThumbnails && (
                  <div className="h-[48px] overflow-hidden rounded-lg flex-shrink-0 mt-auto">
                    <button
                      onClick={() => navigateThumbnails("down")}
                      className="w-full h-[96px] -translate-y-6 opacity-60 hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={getImageSrc(
                          visibleThumbnails[maxVisibleThumbnails]
                        )}
                        alt={`Product view ${
                          thumbnailStartIndex + maxVisibleThumbnails + 1
                        }`}
                        className="w-full h-full object-contain"
                        onError={() =>
                          handleImageError(
                            visibleThumbnails[maxVisibleThumbnails]
                          )
                        }
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Gradient Overlays */}
            {thumbnailStartIndex > 0 && (
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent pointer-events-none" />
            )}
            {thumbnailStartIndex <
              currentImages.length - maxVisibleThumbnails && (
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            )}
          </div>

          {/* Down Arrow */}
          {thumbnailStartIndex <
            currentImages.length - maxVisibleThumbnails && (
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-6 hover:bg-gray-100 flex-shrink-0"
              onClick={() => navigateThumbnails("down")}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Main Image */}
        <div className="flex-1">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-white">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="w-full h-full group cursor-zoom-in"
            >
              <img
                src={getImageSrc(currentImages[currentImageIndex])}
                alt="Product main view"
                className="w-full h-full object-contain"
                onError={() =>
                  handleImageError(currentImages[currentImageIndex])
                }
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </button>

            {/* Navigation Arrows */}
            <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white/80 hover:bg-white pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage("prev");
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white/80 hover:bg-white pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage("next");
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal/Lightbox */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            <img
              src={getImageSrc(currentImages[currentImageIndex])}
              alt="Enlarged product view"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
              onError={() => handleImageError(currentImages[currentImageIndex])}
            />

            {/* Modal Navigation Arrows */}
            <div className="absolute inset-0 flex items-center justify-between p-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage("prev");
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage("next");
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
