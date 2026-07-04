import { Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatPrice, type Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [wished, setWished] = useState(false);

  return (
    <article className={cn("group flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-sm bg-cream shadow-card transition-shadow duration-500 group-hover:shadow-card-hover">
        <div className="overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={1024}
            height={1024}
            className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
          />
        </div>

        {/* Floating wishlist */}
        <button
          type="button"
          aria-label="Add to wishlist"
          onClick={() => setWished((w) => !w)}
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
            className="w-full rounded-sm bg-foreground py-3.5 eyebrow text-background shadow-lg transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Add to Bag
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-[0.62rem] text-muted-foreground">{product.category}</p>
          <h3 className="mt-1.5 truncate font-serif text-[1.05rem] leading-snug text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </div>
        <p className="shrink-0 pt-4 font-serif text-sm text-foreground">
          {formatPrice(product.price)}
        </p>
      </div>
    </article>
  );
}
