import { Reveal } from "@/components/ui-custom/Reveal";
import { SectionHeading } from "@/components/ui-custom/SectionHeading";
import { useStore } from "@/lib/store";

export function PopularCategories() {
  const { popularCategories } = useStore();

  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Browse"
          title="Popular Categories"
          description="Explore our most-loved edits, thoughtfully curated for every moment."
        />
        <div className="mt-14 grid grid-cols-3 gap-6 md:grid-cols-6 md:gap-8">
          {popularCategories.map((cat, i) => (
            <Reveal key={cat.name} delay={i * 80} className="flex flex-col items-center">
              <a href="#" className="group flex flex-col items-center text-center">
                <div className="relative overflow-hidden rounded-full ring-1 ring-border transition-all duration-500 group-hover:ring-primary">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    width={400}
                    height={400}
                    className="h-24 w-24 object-cover transition-transform duration-700 ease-out group-hover:scale-110 md:h-32 md:w-32"
                  />
                </div>
                <span className="mt-4 text-xs font-medium text-foreground md:text-sm">
                  {cat.name}
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
