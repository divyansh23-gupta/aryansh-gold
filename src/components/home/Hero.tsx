import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import hero4 from "@/assets/hero-4.png";


interface Slide {
  image: string;
  title: string;
  subtitle: string;
  cta: string;
}

const slides: Slide[] = [
  {
    image: hero1,
    title: "Luxury Redefined",
    subtitle: "Discover timeless jewellery crafted for every occasion.",
    cta: "Shop Collection",
  },
  {
    image: hero2,
    title: "Elegance In Every Detail",
    subtitle: "Designed to elevate your everyday style.",
    cta: "Explore Collection",
  },
  {
    image: hero3,
    title: "Crafted For Modern Women",
    subtitle: "Luxury pieces that tell your story.",
    cta: "View Collection",
  },
  {
    image: hero4,
    title: "Life's too short for the ordinary jewelry",
    subtitle: "Shop now and let your jewelry do the talking",
    cta: "SHOP NOW",
  },
];

export function Hero() {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((next: number) => {
    setIndex((next + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    timer.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [index]);

  return (
    <section className="relative h-svh min-h-[600px] w-full overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-out",
            i === index ? "opacity-100" : "opacity-0",
          )}
          aria-hidden={i !== index}
        >
          <img
            src={slide.image}
            alt={slide.title}
            width={1920}
            height={1280}
            className={cn(
              "h-full w-full object-cover",
              i === index && "animate-kenburns",
            )}
          />
          <div
            className="absolute inset-0"
            style={{ background: "var(--gradient-overlay)" }}
          />
          <div className="absolute inset-0 bg-charcoal/30" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-center px-6 text-center text-background">
        <div key={index} className="max-w-4xl">
          <div className="flex animate-fade-up items-center justify-center gap-3">
            <span className="gold-rule" aria-hidden />
            <p className="eyebrow text-primary-foreground/90">Aryansh Gold</p>
            <span className="gold-rule" aria-hidden />
          </div>
          <h1
            className="display-serif mt-7 animate-fade-up text-5xl text-background sm:text-7xl md:text-8xl"
            style={{ animationDelay: "0.1s" }}
          >
            {slides[index].title}
          </h1>
          <p
            className="mx-auto mt-7 max-w-lg animate-fade-up text-sm font-light leading-relaxed text-background/90 sm:text-base"
            style={{ animationDelay: "0.2s" }}
          >
            {slides[index].subtitle}
          </p>
          <div className="mt-10 animate-fade-up" style={{ animationDelay: "0.35s" }}>
            <Link to="/shop" className="inline-block bg-background px-10 py-4 eyebrow text-foreground transition-colors duration-300 hover:bg-primary hover:text-primary-foreground">
              {slides[index].cta}
            </Link>
          </div>
        </div>
      </div>

      {/* Arrows */}
      <button
        aria-label="Previous slide"
        onClick={() => go(index - 1)}
        className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 grid-cols-1 place-items-center border border-background/40 p-3 text-background transition-colors hover:bg-background hover:text-foreground md:grid"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        aria-label="Next slide"
        onClick={() => go(index + 1)}
        className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 grid-cols-1 place-items-center border border-background/40 p-3 text-background transition-colors hover:bg-background hover:text-foreground md:grid"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => go(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              i === index ? "w-8 bg-background" : "w-1.5 bg-background/50",
            )}
          />
        ))}
      </div>
    </section>
  );
}
