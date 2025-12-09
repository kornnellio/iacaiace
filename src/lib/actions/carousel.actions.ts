"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../database";
import { Carousel } from "../database/models/models";

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any) => {
  const plainObj = {
    _id: doc._id.toString(), // Convert ObjectId to string
    title: doc.title,
    subtitle: doc.subtitle,
    description: doc.description,
    image: doc.image,
    order: doc.order,
    cta: doc.cta
      ? {
          text: doc.cta.text,
          link: doc.cta.link,
          isEnabled: doc.cta.isEnabled,
        }
      : undefined,
  };
  return plainObj;
};

export async function getCarouselSlides() {
  try {
    await connectToDatabase();
    const slides = await Carousel.find().sort({ order: 1 });
    return { slides: slides.map(toPlainObject) };
  } catch (error) {
    return { error: "Failed to fetch carousel slides" };
  }
}

export async function createCarouselSlide(data: {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  order?: number;
  cta?: {
    text: string;
    link: string;
    isEnabled: boolean;
  };
}) {
  try {
    await connectToDatabase();
    const slide = await Carousel.create(data);
    revalidatePath("/");
    return { slide: toPlainObject(slide) };
  } catch (error) {
    return { error: "Failed to create carousel slide" };
  }
}

export async function updateCarouselSlide(
  id: string,
  data: {
    title?: string;
    subtitle?: string;
    description?: string;
    image?: string;
    order?: number;
    cta?: {
      text: string;
      link: string;
      isEnabled: boolean;
    };
  }
) {
  try {
    await connectToDatabase();
    const slide = await Carousel.findByIdAndUpdate(id, data, { new: true });
    revalidatePath("/");
    return { slide: slide ? toPlainObject(slide) : null };
  } catch (error) {
    return { error: "Failed to update carousel slide" };
  }
}

export async function deleteCarouselSlide(id: string) {
  try {
    await connectToDatabase();
    await Carousel.findByIdAndDelete(id);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete carousel slide" };
  }
}
