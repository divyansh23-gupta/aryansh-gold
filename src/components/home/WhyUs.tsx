import { Gem, Wallet, Lock, Truck } from "lucide-react";
import { Reveal } from "@/components/ui-custom/Reveal";
import { SectionHeading } from "@/components/ui-custom/SectionHeading";

const features = [
  { icon: Gem, title: "Boutique Craftsmanship", text: "Meticulously finished pieces designed to look and feel exceptional." },
  { icon: Wallet, title: "Affordable Luxury", text: "Elevated, boutique-worthy design at a price that feels effortless." },
  { icon: Lock, title: "Secure Shopping", text: "Encrypted checkout and protected payments, every single time." },
  { icon: Truck, title: "Swift Delivery", text: "Thoughtfully packaged and delivered to your door with care." },
];

export function WhyUs() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
      <SectionHeading
        eyebrow="The Difference"
        title="Why Aryansh Gold"
        description="A brand built on the belief that luxury should feel personal, effortless, and within reach."
      />
      <div className="mt-16 grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 100}>
            <div className="group flex h-full flex-col items-center bg-card p-10 text-center transition-colors duration-500 hover:bg-cream">
              <span className="relative grid h-16 w-16 place-items-center rounded-full border border-primary/30 text-primary transition-all duration-500 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon size={24} strokeWidth={1.25} />
              </span>
              <h3 className="mt-7 font-serif text-xl text-foreground">{f.title}</h3>
              <span className="mt-4 gold-rule opacity-60" aria-hidden />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
