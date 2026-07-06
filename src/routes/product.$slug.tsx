import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  Heart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Gem,
  Headset,

} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getProductBySlug,
  relatedProducts,
  discountPercent,
  formatPrice,
  products,
  type Product,
} from "@/data/products";
import { useStore } from "@/lib/store";
import { QuantityStepper } from "@/components/ui-custom/QuantityStepper";
import { ProductCard } from "@/components/ui-custom/ProductCard";
import { Reveal } from "@/components/ui-custom/Reveal";
import { SectionHeading } from "@/components/ui-custom/SectionHeading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Product — Aryansh Gold" }, { name: "robots", content: "noindex" }] };
    const { product } = loaderData;
    const title = `${product.name} — Aryansh Gold`;
    const desc = `${product.name} — ${product.category} in champagne gold. ${formatPrice(product.price)}. Affordable luxury artificial jewellery by Aryansh Gold.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
      ],
    };
  },
  notFoundComponent: ProductNotFound,
  errorComponent: () => (
    <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
      <p className="text-sm text-muted-foreground">This piece couldn't be loaded.</p>
    </div>
  ),
  component: ProductPage,
});

function ProductNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 pt-32 text-center">
      <p className="eyebrow text-primary">Aryansh Gold</p>
      <h1 className="mt-4 font-serif text-3xl text-foreground">Piece not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This item may have been retired from the collection.
      </p>
      <Link
        to="/shop"
        className="mt-8 inline-flex items-center bg-foreground px-8 py-3 eyebrow text-background transition-colors hover:bg-primary"
      >
        Explore Collection
      </Link>
    </div>
  );
}

const trustItems = [
  { icon: Gem, label: "Premium Quality", note: "Jeweller-grade finish" },
  { icon: ShieldCheck, label: "Secure Checkout", note: "Encrypted payments" },
  { icon: Truck, label: "Fast Delivery", note: "Dispatch in 24–48h" },
  { icon: Headset, label: "Customer Support", note: "Here to help, always" },
];

function ProductPage() {
  const { product } = Route.useLoaderData();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isWished, markViewed, recentlyViewed } = useStore();

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const wished = isWished(product.id);
  const discount = discountPercent(product);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
    markViewed(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const related = useMemo(() => relatedProducts(product, 4), [product]);
  const recent = useMemo(
    () =>
      recentlyViewed
        .filter((id) => id !== product.id)
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p))
        .slice(0, 6),
    [recentlyViewed, product.id],
  );

  const handleBuyNow = () => {
    addToCart(product.id, quantity);
    navigate({ to: "/cart" });
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  return (
    <div className="pt-24 md:pt-28">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="link-underline">Home</Link>
          <span>/</span>
          <Link to="/shop" className="link-underline">Shop</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div className="flex flex-col-reverse gap-4 md:flex-row">
            <div className="no-scrollbar flex gap-3 overflow-x-auto md:w-20 md:flex-col">
              {product.gallery.map((img: string, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-sm border transition-colors md:w-full",
                    activeImage === i
                      ? "border-primary"
                      : "border-border hover:border-primary/50",
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            <div
              className="relative flex-1 overflow-hidden rounded-sm bg-cream"
              onMouseMove={onMove}
              onMouseLeave={() => setZoom(null)}
            >
              {discount > 0 && (
                <span className="absolute left-4 top-4 z-10 rounded-sm bg-primary px-3 py-1 eyebrow text-[0.6rem] text-primary-foreground">
                  −{discount}% Off
                </span>
              )}
              <img
                src={product.gallery[activeImage]}
                alt={product.name}
                className="aspect-[4/5] w-full object-cover transition-transform duration-300"
                style={
                  zoom
                    ? {
                        transform: "scale(1.8)",
                        transformOrigin: `${zoom.x}% ${zoom.y}%`,
                      }
                    : undefined
                }
              />
            </div>
          </div>

          {/* Info */}
          <div className="lg:pt-4">
            <p className="eyebrow text-primary">{product.category}</p>
            <h1 className="display-serif mt-3 text-3xl text-foreground sm:text-4xl md:text-[2.75rem]">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-end gap-3">
              <span className="font-serif text-2xl text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="pb-0.5 text-base text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {discount > 0 && (
                <span className="pb-1 eyebrow text-[0.62rem] text-primary">
                  Save {formatPrice((product.originalPrice ?? 0) - product.price)}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">Inclusive of all taxes</p>

            <div className="mt-5 flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  product.inStock ? "bg-primary" : "bg-destructive",
                )}
              />
              <span className={product.inStock ? "text-foreground" : "text-destructive"}>
                {product.inStock ? "In Stock — ready to ship" : "Currently Sold Out"}
              </span>
            </div>

            <span className="mt-7 block h-px w-full bg-border" />

            <p className="mt-7 max-w-md text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {/* Purchase actions */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div>
                <p className="mb-2 eyebrow text-[0.6rem] text-muted-foreground">Quantity</p>
                <QuantityStepper value={quantity} onChange={setQuantity} />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={!product.inStock}
                onClick={() => addToCart(product.id, quantity)}
                className="flex flex-1 items-center justify-center gap-2 border border-foreground bg-background py-4 eyebrow text-foreground transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag size={16} strokeWidth={1.5} />
                Add to Bag
              </button>
              <button
                type="button"
                disabled={!product.inStock}
                onClick={handleBuyNow}
                className="flex flex-1 items-center justify-center gap-2 bg-primary py-4 eyebrow text-primary-foreground transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                Buy Now
              </button>
              <button
                type="button"
                aria-label="Add to wishlist"
                onClick={() => toggleWishlist(product.id)}
                className="grid h-[54px] w-[54px] shrink-0 place-items-center border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Heart
                  size={18}
                  strokeWidth={1.5}
                  className={cn(wished && "fill-primary text-primary")}
                />
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border py-6 sm:grid-cols-4">
              {trustItems.map((t) => (
                <div key={t.label} className="flex flex-col items-center text-center">
                  <t.icon size={22} strokeWidth={1.25} className="text-primary" />
                  <p className="mt-2 text-xs font-medium text-foreground">{t.label}</p>
                  <p className="mt-0.5 text-[0.68rem] text-muted-foreground">{t.note}</p>
                </div>
              ))}
            </div>

            {/* Accordions */}
            <Accordion type="single" collapsible defaultValue="desc" className="mt-8">
              <AccordionItem value="desc">
                <AccordionTrigger className="eyebrow text-[0.7rem]">
                  Product Description
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {product.description} Presented in signature Aryansh Gold packaging,
                  ready for gifting.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="materials">
                <AccordionTrigger className="eyebrow text-[0.7rem]">Materials</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {product.materials}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="care">
                <AccordionTrigger className="eyebrow text-[0.7rem]">
                  Care Instructions
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {product.care}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping">
                <AccordionTrigger className="eyebrow text-[0.7rem]">
                  Shipping Information
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  Complimentary shipping on orders above ₹2,999. Orders are dispatched
                  within 24–48 hours and typically arrive in 3–6 business days.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="returns">
                <AccordionTrigger className="eyebrow text-[0.7rem]">
                  Returns & Exchanges
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  Easy 7-day returns and exchanges on unused pieces in original
                  packaging. Refunds are processed within 5–7 business days.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Related products */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeading
            eyebrow="You May Also Love"
            title="Complete the Look"
            align="left"
          />
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 md:gap-x-8">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 90}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Recently viewed */}
      {recent.length > 0 && <RecentlyViewed items={recent} />}
    </div>
  );
}

function RecentlyViewed({ items }: { items: Product[] }) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
      <div className="flex items-end justify-between gap-6">
        <SectionHeading eyebrow="Your Journey" title="Recently Viewed" align="left" />
        <div className="hidden gap-3 sm:flex">
          <button
            aria-label="Scroll left"
            onClick={() => scroll(-1)}
            className="grid h-11 w-11 place-items-center border border-border text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Scroll right"
            onClick={() => scroll(1)}
            className="grid h-11 w-11 place-items-center border border-border text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2"
      >
        {items.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            className="w-[62%] shrink-0 snap-start sm:w-[45%] md:w-[31%] lg:w-[23.5%]"
          />
        ))}
      </div>
    </section>
  );
}
