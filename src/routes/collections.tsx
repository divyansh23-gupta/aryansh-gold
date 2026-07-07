import { createFileRoute } from "@tanstack/react-router";
import { Reveal } from "@/components/ui-custom/Reveal";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/collections")({
  head: () => ({
    meta: [
      { title: "Collections — Aryansh Gold" },
      { name: "description", content: "Explore curated luxury jewellery collections — bridal, necklaces, rings and more." },
      { property: "og:title", content: "Collections — Aryansh Gold" },
      { property: "og:description", content: "Explore curated luxury jewellery collections at Aryansh Gold." },
    ],
  }),
  component: CollectionsPage,
});

function CollectionsPage() {
  const { collections } = useStore();

  return (
    <div className="pt-28 md:pt-32">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <p className="eyebrow text-primary">Curated Edits</p>
        <h1 className="mt-4 font-serif text-4xl text-foreground sm:text-5xl">Collections</h1>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {collections.map((c, i) => (
            <Reveal key={c.title} delay={i * 120} as="article">
              <a href="#" className="group block overflow-hidden">
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="mt-4">
                  <p className="eyebrow text-muted-foreground">{c.subtitle}</p>
                  <h3 className="mt-1 font-serif text-xl text-foreground">{c.title}</h3>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
