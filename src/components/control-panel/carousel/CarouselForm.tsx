"use client";

import { useState } from "react";
import {
  createCarouselSlide,
  updateCarouselSlide,
} from "@/lib/actions/carousel.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { ImageUpload } from "@/components/shared/ImageUpload";

interface CarouselSlide {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  order: number;
  cta?: {
    text: string;
    link: string;
    isEnabled: boolean;
  };
}

interface CarouselFormProps {
  slide?: CarouselSlide;
  onSuccess?: (slide: CarouselSlide) => void;
}

export default function CarouselForm({ slide, onSuccess }: CarouselFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: slide?.title || "",
    subtitle: slide?.subtitle || "",
    description: slide?.description || "",
    image: slide?.image || "",
    order: slide?.order || 0,
    cta: {
      text: slide?.cta?.text || "Learn More",
      link: slide?.cta?.link || "#",
      isEnabled: slide?.cta?.isEnabled ?? true,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = slide
        ? await updateCarouselSlide(slide._id, formData)
        : await createCarouselSlide(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.slide && onSuccess) {
        onSuccess(result.slide);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto px-4">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-2xl mx-auto py-6"
      >
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={formData.subtitle}
            onChange={(e) =>
              setFormData({ ...formData, subtitle: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Image</Label>
          <ImageUpload
            values={formData.image ? [formData.image] : []}
            onChange={(urls) =>
              setFormData({ ...formData, image: urls[0] || "" })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="order">Order</Label>
          <Input
            id="order"
            type="number"
            value={formData.order}
            onChange={(e) =>
              setFormData({ ...formData, order: parseInt(e.target.value) })
            }
            required
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Call to Action Button</h3>
          <div className="space-y-2">
            <Label htmlFor="cta-text">Button Text</Label>
            <Input
              id="cta-text"
              value={formData.cta.text}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cta: { ...formData.cta, text: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta-link">Button Link</Label>
            <Input
              id="cta-link"
              value={formData.cta.link}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cta: { ...formData.cta, link: e.target.value },
                })
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="cta-enabled"
              checked={formData.cta.isEnabled}
              onCheckedChange={(checked: boolean) =>
                setFormData({
                  ...formData,
                  cta: { ...formData.cta, isEnabled: checked },
                })
              }
            />
            <Label htmlFor="cta-enabled">Enable CTA Button</Label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : slide ? "Update Slide" : "Create Slide"}
        </Button>
      </form>
    </div>
  );
}
