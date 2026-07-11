import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Twitter, Youtube } from "lucide-react";
import logoHorizontal from "@/assets/aryansh-logo-horizontal.png";

const columns = [
  {
    title: "Shop",
    links: ["Necklaces", "Earrings", "Rings", "Bracelets"],
  },
  {
    title: "Collections",
    links: ["Bridal", "Jewellery Sets", "Trending", "New Arrivals"],
  },
  {
    title: "About",
    links: ["Our Story", "Craftsmanship", "Sustainability", "Careers"],
  },
  {
    title: "Policies",
    links: ["Shipping", "Returns", "Privacy", "Terms"],
  },
];

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Link to="/" aria-label="Aryansh Gold — home" className="inline-block">
              <img
                src={logoHorizontal}
                alt="Aryansh Gold"
                width={655}
                height={200}
                className="h-12 w-auto"
              />
            </Link>
            <p className="mt-6 text-sm leading-relaxed text-background/60">
              Affordable luxury artificial jewellery for the modern woman.
              Timeless designs, boutique finish, and effortless elegance.
            </p>
            <div className="mt-6 flex gap-4">
              {[
                { Icon: Instagram, href: "https://www.instagram.com/aryansh_gold/" },
                { Icon: Facebook, href: "https://www.facebook.com/people/Aryanshgoldberasia/61560901703710/?ref=PROFILE_EDIT_xav_ig_profile_page_web" },
                { Icon: Twitter, href: "#" },
                { Icon: Youtube, href: "#" }
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  aria-label="Social link"
                  {...(href !== "#" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="text-background/70 transition-colors hover:text-primary"
                >
                  <Icon size={18} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="eyebrow text-primary">{col.title}</h4>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-background/70 transition-colors hover:text-background"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-background/15 pt-8 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-background/50">
            © {new Date().getFullYear()} Aryansh Gold. All rights reserved.
          </p>
          <p className="eyebrow text-background/50">Contact · hello@aryanshgold.com</p>
        </div>
      </div>
    </footer>
  );
}
