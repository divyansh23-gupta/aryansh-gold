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
            <a
              href="#"
              className="group relative block overflow-hidden rounded-sm shadow-card transition-shadow duration-500 hover:shadow-card-hover"
            >
              <img
                src={b.image}
                alt={b.title}
                loading="lazy"
                width={1600}
                height={1280}
                className="aspect-[5/4] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
              />
              <div
                className="absolute inset-0"
                style={{ background: "var(--gradient-overlay)" }}
              />
              <div className="absolute inset-0 bg-charcoal/15" />
              <div
                className={
                  "absolute inset-0 flex flex-col justify-end p-8 text-background md:p-12 " +
                  (b.align === "right" ? "items-end text-right" : "items-start text-left")
                }
              >
                <p className="eyebrow text-primary-foreground/90">{b.eyebrow}</p>
                <h3 className="display-serif mt-3 text-3xl sm:text-4xl md:text-5xl">
                  {b.title}
                </h3>
                <span className="mt-6 inline-block border-b border-background/80 pb-1.5 eyebrow transition-colors duration-300 group-hover:border-primary group-hover:text-primary">
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
