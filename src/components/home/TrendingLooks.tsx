import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { mapDbProduct } from "@/lib/database.types";
import { type DbReel } from "@/lib/database.types";
import { type Product } from "@/data/products";
import { SectionHeading } from "@/components/ui-custom/SectionHeading";
import { Reveal } from "@/components/ui-custom/Reveal";
import { Link } from "@tanstack/react-router";
import { 
  Play, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Instagram, 
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ExternalLink 
} from "lucide-react";
import { toast } from "sonner";

function getInstagramEmbedUrl(url: string): string {
  if (!url) return "";
  const cleanUrl = url.split("?")[0];
  const base = cleanUrl.endsWith("/") ? cleanUrl : `${cleanUrl}/`;
  return `${base}embed/`;
}

export function TrendingLooks() {
  const [reels, setReels] = useState<DbReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReel, setSelectedReel] = useState<DbReel | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchActiveReels = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("reels")
          .select(`
            *,
            products:product_id(
              *,
              categories:category_id(*),
              product_variants(*),
              product_images(*)
            )
          `)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setReels(data || []);
      } catch (error: any) {
        console.warn("Could not load reels:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveReels();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 340; // width of card + gap
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  if (loading) {
    return (
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8 text-center">
          <SectionHeading
            eyebrow="Trending Looks"
            title="Style In Motion"
            description="Explore our jewellery styled in real life. Discover your next favorite piece."
          />
          <div className="mt-14 flex gap-6 justify-center overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-[280px] aspect-[9/16] rounded-sm bg-muted/40 animate-pulse shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reels.length === 0) {
    return null; // Don't render section if no active reels are configured
  }

  // Map database products nested under reels using mapDbProduct mapper helper
  const mappedProduct = (reel: DbReel): Product | null => {
    if (!reel.products) return null;
    try {
      return mapDbProduct(reel.products);
    } catch (e) {
      console.warn("Could not map product for reel:", e);
      return null;
    }
  };

  return (
    <section className="bg-cream py-20 md:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 md:px-8 relative">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <SectionHeading
            eyebrow="Trending Looks"
            title="Aryansh Reels & Styles"
            description="See our exquisite collections in action, styled to perfection."
            align="left"
          />
          
          {/* Carousel navigation controls */}
          <div className="flex gap-3">
            <button
              onClick={() => scroll("left")}
              className="grid h-12 w-12 place-items-center rounded-full border border-primary/30 bg-background text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none"
              aria-label="Previous looks"
            >
              <ChevronLeft size={20} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="grid h-12 w-12 place-items-center rounded-full border border-primary/30 bg-background text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none"
              aria-label="Next looks"
            >
              <ChevronRight size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Carousel container */}
        <div
          ref={scrollContainerRef}
          className="no-scrollbar mt-12 flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4"
        >
          {reels.map((reel, i) => {
            const product = mappedProduct(reel);
            const coverImage = reel.thumbnail_url || product?.image || "/src/assets/video-poster.jpg";

            return (
              <Reveal
                key={reel.id}
                delay={i * 80}
                className="snap-start shrink-0 w-[280px]"
              >
                <div
                  onClick={() => setSelectedReel(reel)}
                  className="group relative cursor-pointer overflow-hidden rounded-sm bg-background shadow-card border border-border/40"
                >
                  {/* Thumbnail / Cover */}
                  <div className="relative aspect-[9/16] overflow-hidden">
                    <img
                      src={coverImage}
                      alt={reel.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-charcoal/30 group-hover:bg-charcoal/40 transition-colors" />
                    
                    {/* Floating play icon button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-background/90 text-primary shadow-lg border border-primary/30 transition-transform duration-500 scale-95 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Play size={20} fill="currentColor" className="ml-1" />
                      </span>
                    </div>

                    {/* Reels badge indicator */}
                    <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-charcoal/70 backdrop-blur-md px-3 py-1 text-[0.68rem] text-background font-medium tracking-wide">
                      <Instagram size={12} />
                      REELS
                    </div>
                  </div>

                  {/* Reel text info footer */}
                  <div className="p-5 border-t border-border/30">
                    <h3 className="font-serif text-lg text-foreground truncate group-hover:text-primary transition-colors">
                      {reel.title}
                    </h3>
                    {product ? (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Sparkles size={12} className="text-primary/70 shrink-0" />
                        Featuring: <span className="underline truncate max-w-[170px]">{product.name}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1 italic">Signature Look</p>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Dynamic Embed Playback Modal */}
      {selectedReel && (() => {
        const product = mappedProduct(selectedReel);
        const embedUrl = getInstagramEmbedUrl(selectedReel.reel_url);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm animate-fade-in">
            {/* Click-away backdrop dismissal */}
            <div 
              onClick={() => setSelectedReel(null)} 
              className="absolute inset-0 cursor-default" 
            />

            <div className="w-full max-w-4xl bg-background border border-border rounded-sm shadow-2xl overflow-hidden grid md:grid-cols-2 relative z-10 max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible">
              
              {/* Dismiss button */}
              <button
                onClick={() => setSelectedReel(null)}
                className="absolute right-4 top-4 text-foreground/70 hover:text-foreground z-20 p-2 hover:scale-110 transition-transform bg-background/70 backdrop-blur-md rounded-full shadow-sm border border-border"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              {/* Video Frame Column (Lazy loads embed only when active) */}
              <div className="bg-charcoal/95 flex items-center justify-center h-[480px] md:h-[650px] relative border-b md:border-b-0 md:border-r border-border">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full border-0 select-none"
                    allowTransparency
                    allow="encrypted-media"
                    scrolling="no"
                    title="Instagram Reel Player"
                  />
                ) : (
                  <div className="text-center text-muted-foreground p-6">
                    <p className="font-serif">Embedded player load error</p>
                  </div>
                )}
              </div>

              {/* Look Info & Checkout Cross-sell Column */}
              <div className="p-6 md:p-10 flex flex-col justify-between h-[450px] md:h-[650px] bg-cream/30 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <span className="text-[0.7rem] eyebrow text-primary flex items-center gap-1.5 tracking-wider">
                      <Sparkles size={12} />
                      TRENDING LOOKS
                    </span>
                    <h2 className="font-serif text-2xl md:text-3xl text-foreground mt-2 leading-tight">
                      {selectedReel.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                      Discover our exquisite luxury jewelry designs, curated and styled for modern elegance. Look styled by Aryansh Gold stylists.
                    </p>
                  </div>

                  {/* Associated product look display */}
                  {product ? (
                    <div className="border border-border bg-background p-4 rounded-sm shadow-card flex gap-4 items-center">
                      <div className="h-20 w-20 shrink-0 rounded-sm overflow-hidden border border-border bg-muted">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[0.65rem] eyebrow text-muted-foreground">Featured Jewel</span>
                        <h4 className="font-serif text-base text-foreground truncate mt-0.5">{product.name}</h4>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-sm font-medium text-foreground font-serif">₹{product.price.toLocaleString("en-IN")}</span>
                          {product.originalPrice && (
                            <span className="text-xs text-muted-foreground line-through font-serif">₹{product.originalPrice.toLocaleString("en-IN")}</span>
                          )}
                        </div>
                        <Link
                          to="/product/$slug"
                          params={{ slug: product.slug }}
                          onClick={() => setSelectedReel(null)}
                          className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:text-foreground transition-colors group/link"
                        >
                          <ShoppingBag size={12} />
                          Shop This Piece
                          <ArrowRight size={10} className="translate-x-0 transition-transform group-hover/link:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-border bg-background/50 p-6 rounded-sm text-center">
                      <span className="text-xs text-muted-foreground italic">
                        This custom style combines various signature items from our catalogs.
                      </span>
                      <Link
                        to="/shop"
                        onClick={() => setSelectedReel(null)}
                        className="mt-3.5 inline-flex items-center justify-center gap-2 bg-foreground hover:bg-primary text-background hover:text-primary-foreground w-full py-2.5 eyebrow text-xs transition-colors rounded-sm"
                      >
                        Explore Curated Shop
                      </Link>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-border mt-6 space-y-3">
                  <a
                    href={selectedReel.reel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 border border-foreground hover:bg-foreground hover:text-background w-full py-3.5 eyebrow text-xs transition-all rounded-sm shadow-sm"
                  >
                    <Instagram size={14} />
                    Watch on Instagram
                    <ExternalLink size={12} />
                  </a>
                  <p className="text-[0.62rem] text-center text-muted-foreground">
                    * Instagram player capabilities, sound controls and login requirements are governed by Meta platform policies.
                  </p>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </section>
  );
}
