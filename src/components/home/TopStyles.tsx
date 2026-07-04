import { useMemo, useState } from "react";
import { SectionHeading } from "@/components/ui-custom/SectionHeading";
import { ProductCard } from "@/components/ui-custom/ProductCard";
import { Reveal } from "@/components/ui-custom/Reveal";
import { cn } from "@/lib/utils";
import { products, topStyleFilters, type TopStyleFilter } from "@/data/products";

export function TopStyles() {
  const [active, setActive] = useState<TopStyleFilter>("All");

  const filtered = useMemo(() => {
    if (active === "All") return products;
    return products.filter((p) => p.category === active);
  }, [active]);

  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Bestsellers"
          title="Aryansh Top Styles"
          description="Signature pieces, refined for the modern wardrobe."
        />

        <div className="no-scrollbar mt-12 flex flex-wrap justify-center gap-x-7 gap-y-3 overflow-x-auto">
          {topStyleFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={cn(
                "relative shrink-0 pb-2 eyebrow transition-colors duration-300",
                active === f
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
              <span
                className={cn(
                  "absolute inset-x-0 -bottom-px mx-auto h-px bg-primary transition-all duration-300",
                  active === f ? "w-full opacity-100" : "w-0 opacity-0",
                )}
              />
            </button>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 md:gap-x-8 lg:grid-cols-4">
          {filtered.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 90}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
