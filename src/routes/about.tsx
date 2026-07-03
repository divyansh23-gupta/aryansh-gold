import { createFileRoute } from "@tanstack/react-router";
import { Reveal } from "@/components/ui-custom/Reveal";
import { SectionHeading } from "@/components/ui-custom/SectionHeading";
import showroom from "@/assets/showroom.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Aryansh Gold" },
      { name: "description", content: "Aryansh Gold — the story behind our modern luxury jewellery house." },
      { property: "og:title", content: "About — Aryansh Gold" },
      { property: "og:description", content: "The story behind Aryansh Gold, a modern luxury jewellery house." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="pt-28 md:pt-32">
      <div className="mx-auto max-w-4xl px-5 py-14 text-center md:px-8">
        <p className="eyebrow text-primary">Our Story</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
          Luxury, Reimagined For The Modern Woman
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Aryansh Gold was founded on a simple belief — that fine, editorial luxury
          should be accessible without compromise. Each piece is designed in-house
          and crafted with obsessive attention to detail, so you can wear something
          extraordinary every single day.
        </p>
      </div>
      <Reveal className="mx-auto max-w-6xl px-5 md:px-8">
        <img
          src={showroom}
          alt="Aryansh Gold atelier"
          loading="lazy"
          width={1280}
          height={1280}
          className="aspect-[16/9] w-full object-cover"
        />
      </Reveal>
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <SectionHeading
          eyebrow="What Guides Us"
          title="Craft, Care & Conscience"
          description="Three principles shape everything we make."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { t: "Designed In-House", d: "Every collection begins on our own sketchpad, never borrowed." },
            { t: "Crafted To Last", d: "Premium materials and finishing that hold their shine." },
            { t: "Honestly Priced", d: "Luxury aesthetics, transparent and fair pricing." },
          ].map((v, i) => (
            <Reveal key={v.t} delay={i * 100}>
              <div className="border border-border bg-card p-8">
                <h3 className="font-serif text-lg text-foreground">{v.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
