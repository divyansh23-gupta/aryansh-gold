import { MapPin, Clock, Phone, ShieldCheck, Sparkles, BadgeCheck } from "lucide-react";
import { Reveal } from "@/components/ui-custom/Reveal";
import { SectionHeading } from "@/components/ui-custom/SectionHeading";
import showroom from "@/assets/showroom.jpg";

const info = [
  { icon: MapPin, label: "Location", value: "12 Marine Drive, Mumbai 400020" },
  { icon: Clock, label: "Opening Hours", value: "Mon – Sun · 10:00 AM – 9:00 PM" },
  { icon: Phone, label: "Contact", value: "+91 98765 43210" },
];

const perks = [
  { icon: BadgeCheck, label: "Premium Quality" },
  { icon: Sparkles, label: "Assisted Shopping" },
  { icon: ShieldCheck, label: "Authentic Products" },
];

export function VisitStore() {
  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 md:grid-cols-2 md:px-8 lg:gap-20">
        <Reveal>
          <SectionHeading
            eyebrow="Visit Us"
            title="Experience Aryansh Gold In Person"
            description="Step into our flagship boutique for an intimate, unhurried experience. Explore the full collection, try on signature pieces, and let our stylists help you find something truly yours."
            align="left"
          />
          <ul className="mt-10 space-y-6">
            {info.map((item) => (
              <li key={item.label} className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-primary/30 bg-background text-primary">
                  <item.icon size={18} strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <p className="eyebrow text-muted-foreground">{item.label}</p>
                  <p className="mt-1.5 font-serif text-base text-foreground">{item.value}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-4">
            <button className="bg-foreground px-9 py-4 eyebrow text-background transition-colors duration-300 hover:bg-primary hover:text-primary-foreground">
              Get Directions
            </button>
            <button className="border border-foreground px-9 py-4 eyebrow text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background">
              Call Now
            </button>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="overflow-hidden rounded-sm shadow-card">
            <img
              src={showroom}
              alt="Aryansh Gold boutique"
              loading="lazy"
              width={1280}
              height={1280}
              className="aspect-[4/3] w-full object-cover transition-transform duration-[900ms] ease-out hover:scale-105"
            />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4">
            {perks.map((p) => (
              <div
                key={p.label}
                className="flex flex-col items-center gap-2.5 rounded-sm border border-border bg-background px-3 py-6 text-center"
              >
                <p.icon size={22} className="text-primary" strokeWidth={1.5} />
                <span className="text-[0.72rem] font-medium leading-tight text-foreground">
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
