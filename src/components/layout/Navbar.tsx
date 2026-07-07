import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navLinks } from "@/data/collections";
import { useStore } from "@/lib/store";
import logoHorizontal from "@/assets/aryansh-logo-horizontal.png";
import logoMark from "@/assets/aryansh-logo-mark.png";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const ANNOUNCEMENT_H = 38;

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { cartCount, wishlist, setCartOpen } = useStore();
  const { user, profile, logout } = useAuth();

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
              src={logoHorizontal}
              alt="Aryansh Gold"
              width={655}
              height={200}
              className="hidden h-11 w-auto md:block lg:h-12"
            />
            <img
              src={logoMark}
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
          <button
            type="button"
            aria-label="Search"
            className="transition-colors hover:text-primary"
          >
            <Search size={19} strokeWidth={1.5} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account"
                className="hidden transition-colors hover:text-primary sm:block cursor-pointer outline-none"
              >
                <User size={19} strokeWidth={1.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border border-border bg-background shadow-md rounded-sm mt-1 p-1">
              {user ? (
                <>
                  <div className="px-3 py-2 text-left">
                    <p className="eyebrow text-primary text-[0.55rem] tracking-wider">Signed in as</p>
                    <p className="font-serif text-sm font-semibold truncate text-foreground mt-0.5">{profile?.full_name || "Guest"}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-border/60" />
                  <DropdownMenuItem asChild className="focus:bg-muted focus:text-foreground cursor-pointer py-2 px-3">
                    <Link to="/account" className="eyebrow text-[0.62rem] w-full block">My Account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-muted focus:text-foreground cursor-pointer py-2 px-3">
                    <Link to="/account" search={{ tab: "orders" }} className="eyebrow text-[0.62rem] w-full block">Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-muted focus:text-foreground cursor-pointer py-2 px-3">
                    <Link to="/account" search={{ tab: "addresses" }} className="eyebrow text-[0.62rem] w-full block">Addresses</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-muted focus:text-foreground cursor-pointer py-2 px-3">
                    <Link to="/wishlist" className="eyebrow text-[0.62rem] w-full block">Wishlist</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/60" />
                  <DropdownMenuItem 
                    onClick={() => logout()}
                    className="focus:bg-destructive/10 focus:text-destructive text-destructive cursor-pointer py-2 px-3 eyebrow text-[0.62rem]"
                  >
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild className="focus:bg-muted focus:text-foreground cursor-pointer py-2 px-3">
                    <Link to="/login" className="eyebrow text-[0.62rem] w-full block">Log In</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-muted focus:text-foreground cursor-pointer py-2 px-3">
                    <Link to="/register" className="eyebrow text-[0.62rem] w-full block">Sign Up</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative transition-colors hover:text-primary"
          >
            <Heart size={19} strokeWidth={1.5} />
            {wishlist.length > 0 && (
              <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] font-medium text-primary-foreground">
                {wishlist.length}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label="Cart"
            onClick={() => setCartOpen(true)}
            className="relative transition-colors hover:text-primary"
          >
            <ShoppingBag size={19} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] font-medium text-primary-foreground">
                {cartCount}
              </span>
            )}
          </button>
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
            "absolute left-0 top-0 h-full w-72 max-w-[80%] bg-background text-foreground shadow-xl transition-transform duration-500 ease-out flex flex-col",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
            <img
              src={logoHorizontal}
              alt="Aryansh Gold"
              width={655}
              height={200}
              className="h-9 w-auto"
            />
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>
          <ul className="flex flex-col px-5 py-2 overflow-y-auto flex-1">
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
          
          <div className="mt-auto border-t border-border/80 p-5 bg-cream/10 shrink-0">
            {user ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-0.5">
                  <p className="eyebrow text-primary text-[0.62rem] tracking-wider">Welcome back</p>
                  <p className="font-serif text-sm font-semibold truncate text-foreground mt-0.5">{profile?.full_name || "Guest"}</p>
                  <p className="text-[0.68rem] text-muted-foreground truncate">{profile?.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    to="/account"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center border border-border bg-background py-2.5 eyebrow text-[0.62rem] text-foreground hover:bg-muted"
                  >
                    My Account
                  </Link>
                  <Link
                    to="/account"
                    search={{ tab: "orders" }}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center border border-border bg-background py-2.5 eyebrow text-[0.62rem] text-foreground hover:bg-muted"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/account"
                    search={{ tab: "addresses" }}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center border border-border bg-background py-2.5 eyebrow text-[0.62rem] text-foreground hover:bg-muted"
                  >
                    Addresses
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center border border-border bg-background py-2.5 eyebrow text-[0.62rem] text-foreground hover:bg-muted"
                  >
                    Wishlist
                  </Link>
                </div>
                <button
                  onClick={async () => {
                    setOpen(false);
                    await logout();
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-2 border border-destructive/20 bg-destructive/5 text-destructive py-2.5 eyebrow text-[0.62rem] hover:bg-destructive/10 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[0.68rem] text-muted-foreground text-center">Log in to track orders and save favorites.</p>
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 flex items-center justify-center bg-foreground text-background py-3 eyebrow text-[0.62rem] hover:bg-primary hover:text-primary-foreground"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="flex-1 flex items-center justify-center border border-foreground bg-background text-foreground py-3 eyebrow text-[0.62rem] hover:bg-muted"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
