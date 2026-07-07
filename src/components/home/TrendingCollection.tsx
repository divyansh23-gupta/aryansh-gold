import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeading } from "@/components/ui-custom/SectionHeading";
import { ProductCard } from "@/components/ui-custom/ProductCard";
import { useStore } from "@/lib/store";

export function TrendingCollection() {
  const scroller = useRef<HTMLDivElement | null>(null);
  const { products } = useStore();
  const trendingProducts = products.slice(0, 8);

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading
          eyebrow="Handpicked"
          title="Trending Collection"
          description="The pieces everyone is reaching for this season."
          align="left"
        />
        <div className="flex gap-3">
          <button
            aria-label="Scroll left"
            onClick={() => scroll(-1)}
            className="grid h-11 w-11 place-items-center border border-border text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Scroll right"
            onClick={() => scroll(1)}
            className="grid h-11 w-11 place-items-center border border-border text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2"
      >
        {trendingProducts.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            className="w-[70%] shrink-0 snap-start sm:w-[45%] md:w-[31%] lg:w-[23.5%]"
          />
        ))}
      </div>
    </section>
  );
}
