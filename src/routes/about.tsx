import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Reveal } from "@/components/ui-custom/Reveal";
import { SectionHeading } from "@/components/ui-custom/SectionHeading";
import { Sparkles, MapPin, ShieldCheck } from "lucide-react";

// Import authentic storefront and showroom images
import storefront from "@/assets/storefront.jpg";
import showroomArches from "@/assets/showroom-arches.jpg";
import showroomWall from "@/assets/showroom-wall.jpg";
import showroomNecklace from "@/assets/showroom-necklace.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Aryansh Gold" },
      { name: "description", content: "Aryansh Gold — the story behind our modern luxury jewellery house." },
      { property: "og:title", content: "About — Aryansh Gold" },
      { property: "og:description", content: "The story behind Aryansh Gold, a modern luxury jewellery house." },
    ],
  }),
  component: AboutPage,
});

const slideshowImages = [
  { src: storefront, alt: "Aryansh Gold storefront grand opening with floral decoration" },
  { src: showroomArches, alt: "Premium arched niches presenting gold necklace collections" },
  { src: showroomWall, alt: "Blue marble feature wall with gold circular display cases" },
  { src: showroomNecklace, alt: "Close-up of a detailed gold bridal necklace set" },
];

function AboutPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-play interval that resets whenever the active index changes (e.g. on manual selection)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeIndex]);

  return (
    <div className="pt-28 md:pt-32 bg-background">
      {/* Editorial Split Hero Section */}
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          
          {/* Story Content - Left Side on Desktop, Order 2 on Mobile */}
          <div className="lg:col-span-7 space-y-8 order-2 lg:order-1">
            <Reveal>
              <div>
                <p className="eyebrow text-primary">Our Story</p>
                <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
                  Luxury, Reimagined For The Modern Woman
                </h1>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="space-y-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
                <p>
                  Aryansh Gold was founded on a simple belief — that fine, editorial luxury
                  should be accessible without compromise. Each piece is designed in-house
                  and crafted with obsessive attention to detail, so you can wear something
                  extraordinary every single day.
                </p>
                <p>
                  Our flagship showroom in Berasia, Bhopal, stands as a physical manifestation
                  of this vision. It is designed to be an intimate sanctuary of craftsmanship,
                  where you can experience the weight, luster, and artistry of our jewellery in person. 
                  We believe that choosing jewellery should be an experience as memorable as the 
                  milestones they celebrate.
                </p>
              </div>
            </Reveal>

            {/* Highlights Grid */}
            <div className="pt-6 border-t border-border grid gap-6 sm:grid-cols-3">
              {[
                { icon: Sparkles, title: "Original Design", desc: "Designed in-house with a modern editorial edge." },
                { icon: ShieldCheck, title: "Uncompromising Quality", desc: "Crafted with premium materials to ensure durability." },
                { icon: MapPin, title: "Flagship Showroom", desc: "Experience personal consulting in Berasia, Bhopal." }
              ].map((item, idx) => (
                <Reveal key={item.title} delay={150 + idx * 50}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <item.icon size={18} strokeWidth={1.5} />
                      <h4 className="font-serif text-sm font-semibold tracking-wider uppercase text-foreground">{item.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Storefront Image Slideshow - Right Side on Desktop, Order 1 on Mobile */}
          <div className="lg:col-span-5 flex flex-col justify-center order-1 lg:order-2">
            <Reveal className="w-full max-w-[340px] md:max-w-[380px] lg:max-w-[400px] mx-auto" delay={120}>
              {/* Luxury Frame Container */}
              <div className="relative p-2 md:p-3 bg-card border border-border/80 shadow-card aspect-[529/1024] w-full isolate">
                
                {/* Behind frame effect */}
                <div className="absolute -inset-2 border border-primary/20 pointer-events-none -z-10 translate-x-3 translate-y-3" />
                
                {/* Image Container with native aspect ratio (approx 9:16) */}
                <div className="relative w-full h-full overflow-hidden bg-muted/20">
                  {slideshowImages.map((img, index) => {
                    const isActive = index === activeIndex;
                    return (
                      <img
                        key={img.src}
                        src={img.src}
                        alt={img.alt}
                        loading={index === 0 ? "eager" : "lazy"}
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1200ms] ease-in-out ${
                          isActive 
                            ? "opacity-100 scale-100 z-10" 
                            : "opacity-0 scale-105 z-0"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Minimalist Progress Indicators */}
              <div className="mt-8 flex justify-center gap-2.5">
                {slideshowImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`h-[2px] transition-all duration-500 ease-in-out cursor-pointer ${
                      index === activeIndex 
                        ? "w-8 bg-primary" 
                        : "w-3 bg-primary/20 hover:bg-primary/40"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </Reveal>
          </div>

        </div>
      </div>

      {/* Brand Guides Section */}
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28 border-t border-border/60">
        <SectionHeading
          eyebrow="What Guides Us"
          title="Craft, Care & Conscience"
          description="Three principles shape everything we make."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { t: "Designed In-House", d: "Every collection begins on our own sketchpad, never borrowed." },
            { t: "Crafted To Last", d: "Premium materials and finishing that hold their shine." },
            { t: "Honestly Priced", d: "Luxury aesthetics, transparent and fair pricing." },
          ].map((v, i) => (
            <Reveal key={v.t} delay={i * 100}>
              <div className="border border-border bg-card p-8 transition-all duration-300 hover:shadow-card hover:border-primary/20">
                <h3 className="font-serif text-lg text-foreground">{v.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}


