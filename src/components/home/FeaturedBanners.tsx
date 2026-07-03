import { Reveal } from "@/components/ui-custom/Reveal";
import bannerBridal from "@/assets/banner-bridal.jpg";
import bannerRings from "@/assets/banner-rings.jpg";

const banners = [
  {
    image: bannerBridal,
    eyebrow: "The Wedding Edit",
    title: "Bridal Elegance",
    cta: "Discover Bridal",
    align: "left" as const,
  },
  {
    image: bannerRings,
    eyebrow: "Everyday Icons",
    title: "Signature Rings",
    cta: "Shop Rings",
    align: "right" as const,
  },
];

export function FeaturedBanners() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <div className="grid gap-6 md:grid-cols-2">
        {banners.map((b, i) => (
          <Reveal key={b.title} delay={i * 140} as="article">
            <a href="#" className="group relative block overflow-hidden">
              <img
                src={b.image}
                alt={b.title}
                loading="lazy"
                width={1600}
                height={1280}
                className="aspect-[5/4] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-charcoal/25" />
              <div
                className={
                  "absolute inset-0 flex flex-col justify-center p-8 text-background md:p-12 " +
                  (b.align === "right" ? "items-end text-right" : "items-start text-left")
                }
              >
                <p className="eyebrow text-background/85">{b.eyebrow}</p>
                <h3 className="mt-3 font-serif text-3xl sm:text-4xl">{b.title}</h3>
                <span className="mt-6 border-b border-background pb-1 eyebrow transition-colors group-hover:text-primary group-hover:border-primary">
                  {b.cta}
                </span>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
