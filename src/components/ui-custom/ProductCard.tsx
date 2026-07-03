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
      <div className="relative overflow-hidden bg-cream">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1024}
          className="aspect-square w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <button
          type="button"
          aria-label="Add to wishlist"
          onClick={() => setWished((w) => !w)}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
        >
          <Heart
            size={16}
            className={cn(wished && "fill-primary text-primary")}
          />
        </button>
        <div className="absolute inset-x-0 bottom-0 translate-y-full p-3 transition-transform duration-500 ease-out group-hover:translate-y-0">
          <button
            type="button"
            className="w-full bg-foreground py-3 eyebrow text-background transition-colors hover:bg-primary"
          >
            Add to Bag
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-muted-foreground">{product.category}</p>
          <h3 className="mt-1 truncate font-serif text-base text-foreground">
            {product.name}
          </h3>
        </div>
        <p className="shrink-0 pt-4 text-sm text-foreground">
          {formatPrice(product.price)}
        </p>
      </div>
    </article>
  );
}
