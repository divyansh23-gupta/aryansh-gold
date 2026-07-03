import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/ui-custom/ProductCard";
import { Reveal } from "@/components/ui-custom/Reveal";
import { products } from "@/data/products";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Aryansh Gold" },
      { name: "description", content: "Shop luxury artificial jewellery — necklaces, earrings, rings, bracelets and bridal sets." },
      { property: "og:title", content: "Shop — Aryansh Gold" },
      { property: "og:description", content: "Shop luxury artificial jewellery at Aryansh Gold." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  return (
    <div className="pt-28 md:pt-32">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <p className="eyebrow text-primary">The Collection</p>
        <h1 className="mt-4 font-serif text-4xl text-foreground sm:text-5xl">Shop All</h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          Timeless jewellery crafted for every occasion.
        </p>
        <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 90}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
