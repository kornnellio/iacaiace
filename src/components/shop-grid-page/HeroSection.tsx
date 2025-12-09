"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface HeroSectionProps {
  title: string;
  description: string;
  imageUrl: string;
}

export default function HeroSection({
  title,
  description,
  imageUrl,
}: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(heroRef.current, {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power3.out",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={heroRef}
      className="relative w-full  min-h-[300px] flex items-center "
    >
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative container mx-auto px-4 z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            {title}
          </h1>
          <p className="text-base md:text-lg lg:text-xl max-w-2xl mx-auto opacity-90">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
