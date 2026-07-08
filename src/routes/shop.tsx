import { useMemo, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/ui-custom/ProductCard";
import { Reveal } from "@/components/ui-custom/Reveal";
import {
  discountPercent,
  type Category,
  type Product,
} from "@/data/products";
import { useStore } from "@/lib/store";
import bannerRings from "@/assets/banner-rings.jpg";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): { category?: string; collection?: string } => {
    return {
      category: search.category as string | undefined,
      collection: search.collection as string | undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Shop All — Aryansh Gold" },
      {
        name: "description",
        content:
          "Shop the full Aryansh Gold collection — luxury artificial jewellery. Necklaces, earrings, rings, bracelets, sets and bridal, in champagne gold.",
      },
      { property: "og:title", content: "Shop All — Aryansh Gold" },
      {
        property: "og:description",
        content: "Browse affordable luxury artificial jewellery at Aryansh Gold.",
      },
    ],
  }),
  component: ShopPage,
});

type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "best-selling";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "best-selling", label: "Best Selling" },
];

const priceRanges = [
  { key: "all", label: "All Prices", test: () => true },
  { key: "u1500", label: "Under ₹1,500", test: (p: Product) => p.price < 1500 },
  { key: "1500-2500", label: "₹1,500 – ₹2,500", test: (p: Product) => p.price >= 1500 && p.price <= 2500 },
  { key: "2500-4000", label: "₹2,500 – ₹4,000", test: (p: Product) => p.price > 2500 && p.price <= 4000 },
  { key: "o4000", label: "Over ₹4,000", test: (p: Product) => p.price > 4000 },
];

const PAGE_SIZE = 8;

function ShopPage() {
  const { products, categories, catalogLoading } = useStore();
  const { category, collection } = Route.useSearch();
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [priceRange, setPriceRange] = useState("all");
  const [newArrivals, setNewArrivals] = useState(false);
  const [bestSellers, setBestSellers] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("featured");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sync category search param to selectedCategories state
  useEffect(() => {
    if (category) {
      setSelectedCategories([category as Category]);
    } else {
      setSelectedCategories([]);
    }
  }, [category]);

  const toggleCategory = (c: Category) => {
    setPage(1);
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setPriceRange("all");
    setNewArrivals(false);
    setBestSellers(false);
    setInStockOnly(false);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const range = priceRanges.find((r) => r.key === priceRange)!;
    const list = products.filter((p) => {
      if (selectedCategories.length && !selectedCategories.includes(p.category))
        return false;
      if (collection && !p.collections?.some((c) => c.title.toLowerCase() === collection.toLowerCase()))
        return false;
      if (!range.test(p)) return false;
      if (newArrivals && !p.isNew) return false;
      if (bestSellers && !p.isBestSeller) return false;
      if (inStockOnly && !p.inStock) return false;
      return true;
    });

    const sorted = [...list];
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew));
        break;
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "best-selling":
        sorted.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller));
        break;
      default:
        sorted.sort((a, b) => discountPercent(b) - discountPercent(a));
    }
    return sorted;
  }, [products, selectedCategories, priceRange, newArrivals, bestSellers, inStockOnly, sort, collection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const paged = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const activeCount =
    selectedCategories.length +
    (priceRange !== "all" ? 1 : 0) +
    (newArrivals ? 1 : 0) +
    (bestSellers ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const Filters = (
    <div className="space-y-9">
      <FilterGroup title="Categories">
        <div className="space-y-2.5">
          {(categories as Category[]).map((c) => (
            <CheckRow
              key={c}
              label={c}
              checked={selectedCategories.includes(c)}
              onChange={() => toggleCategory(c)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price Range">
        <div className="space-y-2.5">
          {priceRanges.map((r) => (
            <RadioRow
              key={r.key}
              label={r.label}
              checked={priceRange === r.key}
              onChange={() => {
                setPriceRange(r.key);
                setPage(1);
              }}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Discover">
        <div className="space-y-2.5">
          <CheckRow label="New Arrivals" checked={newArrivals} onChange={() => { setNewArrivals((v) => !v); setPage(1); }} />
          <CheckRow label="Best Sellers" checked={bestSellers} onChange={() => { setBestSellers((v) => !v); setPage(1); }} />
          <CheckRow label="In Stock Only" checked={inStockOnly} onChange={() => { setInStockOnly((v) => !v); setPage(1); }} />
        </div>
      </FilterGroup>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-muted-foreground link-underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="pt-24 md:pt-28">
      {/* Collection header banner */}
      <section className="relative overflow-hidden">
        <img
          src={bannerRings}
          alt=""
          className="h-64 w-full object-cover md:h-80"
        />
        <div className="absolute inset-0 bg-charcoal/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center text-background">
          <p className="eyebrow text-background/80">The Collection</p>
          <h1 className="display-serif mt-4 text-4xl sm:text-5xl md:text-6xl">Shop All</h1>
          <p className="mt-4 max-w-xl text-sm text-background/85 sm:text-base">
            Affordable luxury artificial jewellery, crafted for the modern woman —
            timeless pieces for every occasion.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
        <div className="flex gap-12">
          {/* Desktop sidebar */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-28">{Filters}</div>
          </aside>

          {/* Main */}
          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-2 eyebrow text-foreground lg:hidden"
              >
                <SlidersHorizontal size={16} strokeWidth={1.5} />
                Filters {activeCount > 0 && `(${activeCount})`}
              </button>
              <p className="hidden text-sm text-muted-foreground lg:block">
                {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
              </p>
              <SortSelect value={sort} onChange={(v) => { setSort(v); setPage(1); }} />
            </div>

            {catalogLoading ? (
              <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 md:gap-x-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-4">
                    <div className="aspect-[4/5] bg-muted/60 rounded-sm" />
                    <div className="space-y-2">
                      <div className="h-4 bg-muted/60 rounded w-2/3" />
                      <div className="h-3 bg-muted/60 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paged.length === 0 ? (
              <div className="py-24 text-center">
                <p className="font-serif text-xl text-foreground">No pieces found</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your filters.
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-6 inline-flex items-center bg-foreground px-6 py-3 eyebrow text-background transition-colors hover:bg-primary"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 md:gap-x-8">
                {paged.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 3) * 80}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination
                current={current}
                total={totalPages}
                onChange={(pg) => {
                  setPage(pg);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          className={cn(
            "absolute inset-0 bg-charcoal/45 transition-opacity duration-500",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-80 max-w-[85%] flex-col bg-background shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <h2 className="font-serif text-lg text-foreground">Filters</h2>
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setDrawerOpen(false)}
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">{Filters}</div>
          <div className="border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="w-full bg-foreground py-3.5 eyebrow text-background transition-colors hover:bg-primary"
            >
              Show {filtered.length} Results
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="eyebrow text-[0.68rem] text-foreground">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="group flex w-full items-center gap-3 text-left"
    >
      <span
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center border transition-colors",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </span>
      <span
        className={cn(
          "text-sm transition-colors",
          checked ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
}

function RadioRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="group flex w-full items-center gap-3 text-left"
    >
      <span
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors",
          checked ? "border-primary" : "border-border",
        )}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span
        className={cn(
          "text-sm transition-colors",
          checked ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = sortOptions.find((o) => o.key === value)!;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-2 border border-border px-4 py-2.5 eyebrow text-[0.62rem] text-foreground transition-colors hover:border-primary"
      >
        <span className="hidden sm:inline text-muted-foreground">Sort:</span>
        {active.label}
        <ChevronDown
          size={14}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 border border-border bg-popover shadow-card">
          {sortOptions.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                onChange(o.key);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                o.key === value ? "text-primary" : "text-foreground",
              )}
            >
              {o.label}
              {o.key === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="mt-16 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={current === 1}
        onClick={() => onChange(current - 1)}
        className="px-4 py-2 eyebrow text-[0.6rem] text-foreground transition-colors hover:text-primary disabled:opacity-30"
      >
        Prev
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map((pg) => (
        <button
          key={pg}
          type="button"
          onClick={() => onChange(pg)}
          className={cn(
            "grid h-10 w-10 place-items-center border text-sm transition-colors",
            pg === current
              ? "border-foreground bg-foreground text-background"
              : "border-border text-foreground hover:border-primary hover:text-primary",
          )}
        >
          {pg}
        </button>
      ))}
      <button
        type="button"
        disabled={current === total}
        onClick={() => onChange(current + 1)}
        className="px-4 py-2 eyebrow text-[0.6rem] text-foreground transition-colors hover:text-primary disabled:opacity-30"
      >
        Next
      </button>
    </div>
  );
}
