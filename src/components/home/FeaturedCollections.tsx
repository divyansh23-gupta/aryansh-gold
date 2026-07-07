import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui-custom/Reveal";
import { useStore } from "@/lib/store";

export function FeaturedCollections() {
  const { collections } = useStore();

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <div className="grid gap-6 md:grid-cols-3">
        {collections.map((c, i) => (
          <Reveal key={c.title} delay={i * 120} as="article">
            <a href="#" className="group block">
              <div className="relative overflow-hidden">
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-background">
                  <p className="eyebrow text-background/80">{c.subtitle}</p>
                  <h3 className="mt-2 flex items-center gap-2 font-serif text-2xl">
                    {c.title}
                    <ArrowRight
                      size={18}
                      className="translate-x-0 opacity-0 transition-all duration-500 group-hover:translate-x-1 group-hover:opacity-100"
                    />
                  </h3>
                </div>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
