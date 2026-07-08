import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { type DbReel } from "@/lib/database.types";
import { SectionHeading } from "@/components/ui-custom/SectionHeading";
import { Reveal } from "@/components/ui-custom/Reveal";
import { 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  Instagram, 
  ExternalLink,
  Film
} from "lucide-react";

const MOCK_REELS: DbReel[] = [
  {
    id: "mock-reel-1",
    title: "Signature Bridal Styling",
    instagram_url: "https://www.instagram.com/reel/DaMY5vasd_9/",
    thumbnail_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "mock-reel-2",
    title: "Heritage Gold Jhumkas Curation",
    instagram_url: "https://www.instagram.com/reel/DaMY5vasd_9/",
    thumbnail_url: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&auto=format&fit=crop",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "mock-reel-3",
    title: "Traditional Bridal Bangles Setup",
    instagram_url: "https://www.instagram.com/reel/DaMY5vasd_9/",
    thumbnail_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "mock-reel-4",
    title: "Elegant Kundan Choker Presentation",
    instagram_url: "https://www.instagram.com/reel/DaMY5vasd_9/",
    thumbnail_url: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&auto=format&fit=crop",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "mock-reel-5",
    title: "Aesthetic Antique Styling",
    instagram_url: "https://www.instagram.com/reel/DaMY5vasd_9/",
    thumbnail_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function TrendingLooks() {
  const [reels, setReels] = useState<DbReel[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchActiveReels = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("reels")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setReels(data && data.length > 0 ? data : MOCK_REELS);
      } catch (error: any) {
        console.warn("Could not load reels from db, using mocks:", error.message);
        setReels(MOCK_REELS);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveReels();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 300; // width of card + gaps
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  if (loading) {
    return (
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8 text-center">
          <SectionHeading
            eyebrow="Trending Looks"
            title="Styled by Aryansh Gold"
            description="Discover how our collections come alive through styling, celebrations, and everyday elegance."
          />
          <div className="mt-12 flex gap-6 justify-center overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-[230px] aspect-[9/16] rounded-sm bg-muted/40 animate-pulse shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reels.length === 0) {
    return null; 
  }

  return (
    <section className="bg-cream py-16 md:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 md:px-8 relative">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-primary/10 pb-6">
          <SectionHeading
            eyebrow="Styled by Aryansh Gold"
            title="Trending Looks"
            description="Discover how our collections come alive through styling, celebrations, and everyday elegance."
            align="left"
          />
          
          {/* Controls */}
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => scroll("left")}
              className="grid h-10 w-10 place-items-center rounded-full border border-primary/20 bg-background text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none shadow-sm"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="grid h-10 w-10 place-items-center rounded-full border border-primary/20 bg-background text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none shadow-sm"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Carousel Grid */}
        <div
          ref={scrollContainerRef}
          className="no-scrollbar mt-10 flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4"
        >
          {reels.map((reel, i) => (
            <Reveal
              key={reel.id}
              delay={i * 70}
              className="snap-start shrink-0 w-[78vw] sm:w-[42vw] md:w-[28vw] lg:w-[220px] xl:w-[236px]"
            >
              <a
                href={reel.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block relative cursor-pointer overflow-hidden rounded-sm bg-background shadow-card border border-border/40 hover:shadow-card-hover hover:border-primary/30 transition-all duration-500"
              >
                {/* Visual Image container */}
                <div className="relative aspect-[9/16] overflow-hidden bg-charcoal">
                  <img
                    src={reel.thumbnail_url}
                    alt={reel.title || "Styled by Aryansh"}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  {/* Subtle luxury vignette gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent opacity-85" />
                  
                  {/* Floating luxury Gold-trimmed play icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-background/95 text-primary shadow-lg border border-primary/30 transition-all duration-500 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    </span>
                  </div>

                  {/* Looks badge indicator */}
                  <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-charcoal/75 backdrop-blur-sm px-2.5 py-0.5 text-[0.62rem] text-background font-medium tracking-widest border border-background/10">
                    <Instagram size={10} className="text-primary" />
                    REEL
                  </div>

                  {/* Card Editorial Footer */}
                  <div className="absolute inset-x-0 bottom-0 p-5 text-left flex flex-col justify-end">
                    <span className="text-[0.62rem] eyebrow text-primary tracking-widest">STYLED BY ARYANSH</span>
                    <h3 className="font-serif text-base text-background mt-1 truncate group-hover:text-primary transition-colors leading-snug">
                      {reel.title || "Styled by Aryansh"}
                    </h3>
                    <span className="h-[1px] w-6 bg-primary mt-2 transition-all duration-500 group-hover:w-12" />
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
