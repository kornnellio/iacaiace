import { HeroCarousel } from "@/components/landing-page/HeroCarousel";
import { getCarouselSlides } from "@/lib/actions/carousel.actions";

export default async function LandingPage() {
  const { slides = [] } = await getCarouselSlides();

  return (
    <div>
      <HeroCarousel slides={slides} />
    </div>
  );
}
