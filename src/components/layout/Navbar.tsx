import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navLinks } from "@/data/collections";
import logoHorizontal from "@/assets/aryansh-logo-horizontal.png.asset.json";
import logoMark from "@/assets/aryansh-logo-mark.png.asset.json";

const ANNOUNCEMENT_H = 38;

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Solid navbar unless transparent-over-hero and not yet scrolled.
  const solid = scrolled || !overHero;

  const icons = [
    { icon: Search, label: "Search" },
    { icon: User, label: "Account" },
    { icon: Heart, label: "Wishlist" },
    { icon: ShoppingBag, label: "Cart" },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 z-40 transition-colors duration-500",
        solid ? "bg-background/95 text-foreground shadow-[0_1px_0_0_var(--color-border)] backdrop-blur-sm" : "bg-transparent text-background",
      )}
      style={{ top: ANNOUNCEMENT_H }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 md:px-8 md:py-4">
        {/* Left: mobile menu + logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="md:hidden"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
          <Link to="/" aria-label="Aryansh Gold — home" className="flex items-center">
            <img
              src={logoHorizontal.url}
              alt="Aryansh Gold"
              width={655}
              height={200}
              className="hidden h-11 w-auto md:block lg:h-12"
            />
            <img
              src={logoMark.url}
              alt="Aryansh Gold"
              width={515}
              height={610}
              className="h-9 w-auto md:hidden"
            />
          </Link>
        </div>

        {/* Center: nav */}
        <ul className="hidden items-center gap-10 md:flex">
          {navLinks.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="link-underline eyebrow"
                activeProps={{ className: "text-primary" }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: icons */}
        <div className="flex items-center gap-4 md:gap-5">
          {icons.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className="transition-colors hover:text-primary"
            >
              <Icon size={19} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-charcoal/40 transition-opacity duration-500",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-72 max-w-[80%] bg-background text-foreground shadow-xl transition-transform duration-500 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <img
              src={logoHorizontal.url}
              alt="Aryansh Gold"
              width={655}
              height={200}
              className="h-9 w-auto"
            />
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>
          <ul className="flex flex-col px-5 py-2">
            {navLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="block border-b border-border/60 py-4 eyebrow"
                  activeProps={{ className: "text-primary" }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
