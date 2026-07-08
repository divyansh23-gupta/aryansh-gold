import { MapPin, Clock, Phone, ShieldCheck, Sparkles, BadgeCheck } from "lucide-react";
import { Reveal } from "@/components/ui-custom/Reveal";
import { SectionHeading } from "@/components/ui-custom/SectionHeading";
import showroomVideo from "@/assets/videos/showroom.mp4";

const info = [
  { 
    icon: MapPin, 
    label: "Location", 
    value: "Berasia, Bhopal Range Chouraha, Near Shiv Mandir, Main Road, Berasia" 
  },
  { 
    icon: Clock, 
    label: "Opening Hours", 
    value: "Mon – Sun · 9:00 AM – 8:00 PM" 
  },
  { 
    icon: Phone, 
    label: "Contact", 
    value: "+91 91791 23866" 
  },
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
            description="Visit our showroom in Berasia, Bhopal and explore our curated collection of artificial jewellery including bridal sets, necklaces, earrings, rings, bangles, bracelets and fashion accessories. Experience our products in person and receive personalized assistance from our team."
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
            <a
              href="https://www.google.com/maps/search/?api=1&query=Aryansh+Gold+Berasia+Bhopal+Range+Chouraha"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-foreground px-9 py-4 eyebrow text-background transition-colors duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              Get Directions
            </a>
            <a
              href="tel:+919179123866"
              className="border border-foreground px-9 py-4 eyebrow text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background"
            >
              Call Now
            </a>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="overflow-hidden rounded-sm shadow-card max-w-sm mx-auto w-full">
            <video
              src={showroomVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="aspect-[9/16] w-full object-cover transition-transform duration-[900ms] ease-out hover:scale-105"
            />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4 max-w-sm mx-auto w-full">
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
