import { Gem, Wallet, Lock, Truck } from "lucide-react";
import { Reveal } from "@/components/ui-custom/Reveal";
import { SectionHeading } from "@/components/ui-custom/SectionHeading";

const features = [
  { icon: Gem, title: "Premium Quality", text: "Meticulously crafted pieces built to last, finished to perfection." },
  { icon: Wallet, title: "Affordable Luxury", text: "Fine-jewellery aesthetics at a fraction of the price." },
  { icon: Lock, title: "Secure Shopping", text: "Encrypted checkout and protected payments, every time." },
  { icon: Truck, title: "Fast Delivery", text: "Carefully packaged and swiftly delivered to your door." },
];

export function WhyUs() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <SectionHeading eyebrow="The Difference" title="Why Aryansh Gold" />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 100}>
            <div className="group h-full border border-border bg-card p-8 text-center transition-colors hover:border-primary">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cream text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon size={22} strokeWidth={1.5} />
              </span>
              <h3 className="mt-6 font-serif text-lg text-foreground">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
