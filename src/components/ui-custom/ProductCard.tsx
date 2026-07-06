import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, discountPercent, type Product } from "@/data/products";
import { useStore } from "@/lib/store";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { toggleWishlist, isWished, addToCart } = useStore();
  const wished = isWished(product.id);
  const discount = discountPercent(product);

  return (
    <article className={cn("group flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-sm bg-cream shadow-card transition-shadow duration-500 group-hover:shadow-card-hover">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          aria-label={product.name}
          className="block overflow-hidden"
        >
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={1024}
            height={1024}
            className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
          />
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3.5 top-3.5 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="rounded-sm bg-background/90 px-2.5 py-1 eyebrow text-[0.55rem] text-foreground backdrop-blur-md">
              New
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-sm bg-primary px-2.5 py-1 eyebrow text-[0.55rem] text-primary-foreground">
              −{discount}%
            </span>
          )}
          {!product.inStock && (
            <span className="rounded-sm bg-charcoal/85 px-2.5 py-1 eyebrow text-[0.55rem] text-background">
              Sold Out
            </span>
          )}
        </div>

        {/* Floating wishlist */}
        <button
          type="button"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => toggleWishlist(product.id)}
          className={cn(
            "absolute right-3.5 top-3.5 grid h-10 w-10 place-items-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-background",
            "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0",
            wished && "opacity-100 translate-y-0",
          )}
        >
          <Heart
            size={16}
            strokeWidth={1.75}
            className={cn("transition-colors", wished && "fill-primary text-primary")}
          />
        </button>

        {/* Add to bag on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full p-3.5 transition-transform duration-500 ease-out group-hover:translate-y-0">
          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => addToCart(product.id)}
            className="w-full rounded-sm bg-foreground py-3.5 eyebrow text-background shadow-lg transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {product.inStock ? "Add to Bag" : "Sold Out"}
          </button>
        </div>
      </div>

      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="mt-5 flex items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <p className="eyebrow text-[0.62rem] text-muted-foreground">{product.category}</p>
          <h3 className="mt-1.5 truncate font-serif text-[1.05rem] leading-snug text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </div>
        <div className="shrink-0 pt-4 text-right">
          <p className="font-serif text-sm text-foreground">{formatPrice(product.price)}</p>
          {product.originalPrice && (
            <p className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
