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

        <div className="no-scrollbar mt-10 flex flex-wrap justify-center gap-2 overflow-x-auto md:gap-3">
          {topStyleFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={cn(
                "shrink-0 border px-5 py-2.5 eyebrow transition-colors",
                active === f
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
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
