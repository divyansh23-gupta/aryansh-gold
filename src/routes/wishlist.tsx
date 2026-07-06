import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, X, ShoppingBag } from "lucide-react";
import { useStore } from "@/lib/store";
import { products, formatPrice, discountPercent, type Product } from "@/data/products";
import { Reveal } from "@/components/ui-custom/Reveal";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — Aryansh Gold" },
      { name: "description", content: "Your curated collection of Aryansh Gold pieces." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist, removeFromWishlist, addToCart } = useStore();

  const items = useMemo(
    () =>
      wishlist
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [wishlist],
  );

  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-28 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full border border-border">
          <Heart size={28} strokeWidth={1.1} className="text-primary" />
        </span>
        <p className="eyebrow mt-8 text-primary">Wishlist</p>
        <h1 className="display-serif mt-4 text-3xl text-foreground sm:text-4xl">
          Your curated collection is waiting.
        </h1>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          Save the pieces you love and return to them whenever inspiration strikes.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-flex items-center bg-foreground px-9 py-3.5 eyebrow text-background transition-colors hover:bg-primary"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 md:pt-28">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
        <p className="eyebrow text-primary">Saved Pieces</p>
        <h1 className="display-serif mt-3 text-3xl text-foreground sm:text-4xl">
          Your Wishlist
        </h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "piece" : "pieces"} you've curated.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 md:gap-x-8 lg:grid-cols-4">
          {items.map((p, i) => {
            const discount = discountPercent(p);
            return (
              <Reveal key={p.id} delay={(i % 4) * 80}>
                <article className="group flex flex-col">
                  <div className="relative overflow-hidden rounded-sm bg-cream shadow-card transition-shadow duration-500 group-hover:shadow-card-hover">
                    <Link
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      className="block overflow-hidden"
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                      />
                    </Link>
                    {discount > 0 && (
                      <span className="absolute left-3.5 top-3.5 rounded-sm bg-primary px-2.5 py-1 eyebrow text-[0.55rem] text-primary-foreground">
                        −{discount}%
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label="Remove from wishlist"
                      onClick={() => removeFromWishlist(p.id)}
                      className="absolute right-3.5 top-3.5 grid h-9 w-9 place-items-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-105 hover:text-destructive"
                    >
                      <X size={15} strokeWidth={1.75} />
                    </button>
                  </div>

                  <div className="mt-5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="eyebrow text-[0.62rem] text-muted-foreground">
                        {p.category}
                      </p>
                      <Link
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        className="mt-1.5 block truncate font-serif text-[1.05rem] leading-snug text-foreground transition-colors hover:text-primary"
                      >
                        {p.name}
                      </Link>
                    </div>
                    <p className="shrink-0 pt-4 font-serif text-sm text-foreground">
                      {formatPrice(p.price)}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!p.inStock}
                    onClick={() => {
                      addToCart(p.id);
                      removeFromWishlist(p.id);
                    }}
                    className="mt-4 flex items-center justify-center gap-2 border border-foreground bg-background py-3 eyebrow text-[0.62rem] text-foreground transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingBag size={14} strokeWidth={1.5} />
                    {p.inStock ? "Move to Bag" : "Sold Out"}
                  </button>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
