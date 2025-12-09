/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import Link from "next/link";

interface Slide {
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

interface HeroCarouselProps {
  slides: Slide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const slideContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {}, slideContainerRef);
    return () => ctx.revert();
  }, []);

  const animateSlide = (nextIndex: number, direction: number) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const currentContent = contentRefs.current[currentSlide];
    const nextContent = contentRefs.current[nextIndex];

    if (!currentContent || !nextContent) return;

    const xOffset = direction > 0 ? 100 : -100;

    // Hide current slide content
    gsap.to(currentContent.children, {
      y: -30,
      opacity: 0,
      duration: 0.4,
      stagger: -0.1,
      ease: "power2.in",
    });

    // Animate slides
    const currentSlideRef = slideRefs.current[currentSlide];
    const nextSlideRef = slideRefs.current[nextIndex];

    if (currentSlideRef && nextSlideRef) {
      gsap.to(currentSlideRef, {
        xPercent: -xOffset,
        opacity: 0,
        duration: 1,
        ease: "power2.inOut",
      });

      gsap.fromTo(
        nextSlideRef,
        {
          xPercent: xOffset,
          opacity: 0,
        },
        {
          xPercent: 0,
          opacity: 1,
          duration: 1,
          ease: "power2.inOut",
        }
      );
    }

    // Animate next slide content
    gsap.fromTo(
      nextContent.children,
      {
        y: 30,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.4,
        ease: "power2.out",
        onComplete: () => setIsAnimating(false),
      }
    );

    setCurrentSlide(nextIndex);
  };

  const nextSlide = () => {
    const nextIndex = (currentSlide + 1) % slides.length;
    animateSlide(nextIndex, 1);
  };

  const prevSlide = () => {
    const nextIndex = (currentSlide - 1 + slides.length) % slides.length;
    animateSlide(nextIndex, -1);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide, slides.length]);

  return (
    <div
      ref={slideContainerRef}
      className="relative w-full"
      style={{ height: "calc(100vh - 130px)" }}
    >
      {slides.map((slide, index) => (
        <div
          key={slide._id}
          ref={(el) => {
            slideRefs.current[index] = el;
          }}
          className={`absolute inset-0 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${slide.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            ref={(el) => {
              contentRefs.current[index] = el;
            }}
            className="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-4 max-w-4xl mx-auto"
          >
            <h2 className="text-5xl font-bold mb-4 tracking-tight drop-shadow-md">
              {slide.title}
            </h2>
            <h3 className="text-3xl mb-6 font-medium tracking-wide drop-shadow-md">
              {slide.subtitle}
            </h3>
            <p className="text-xl mb-10 font-body leading-relaxed max-w-2xl drop-shadow-md">
              {slide.description}
            </p>
            {slide.cta?.isEnabled && (
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-white/90 font-semibold px-8 py-6 text-lg rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Link href={slide.cta.link}>{slide.cta.text}</Link>
              </Button>
            )}
          </div>
        </div>
      ))}

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        onClick={prevSlide}
        disabled={isAnimating}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        onClick={nextSlide}
        disabled={isAnimating}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-2 w-2 rounded-full transition-all ${
              index === currentSlide ? "bg-white w-8" : "bg-white/50"
            }`}
            onClick={() => {
              if (!isAnimating) {
                animateSlide(index, index > currentSlide ? 1 : -1);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
