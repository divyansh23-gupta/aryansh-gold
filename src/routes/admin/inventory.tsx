import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { 
  PackageCheck, 
  Search, 
  SlidersHorizontal, 
  Save, 
  Loader2, 
  AlertTriangle,
  ArrowUpDown,
  Undo
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ringsFallback from "@/assets/collection-rings.jpg";

export const Route = createFileRoute("/admin/inventory")({
  component: AdminInventory,
});

interface MappedVariant {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string;
  categoryName: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  comparePrice: number | null;
  stockQuantity: number;
  status: string;
}

function AdminInventory() {
  const { refreshCatalog } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lists Data
  const [variants, setVariants] = useState<MappedVariant[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState<"all" | "low" | "out" | "in">("all");
  const [sortBy, setSortBy] = useState<"productName" | "sku" | "stockQuantity" | "price">("productName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Track modified cell states locally
  const [changedRows, setChangedRows] = useState<Record<string, { stockQuantity: number; price: number; comparePrice: number | null }>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: cats } = await supabase.from("categories").select("id, name").order("name");
      if (cats) setCategories(cats);

      const { data: prods } = await supabase
        .from("products")
        .select("id, name, image_url, categories(name)");
      
      const { data: vars } = await supabase
        .from("product_variants")
        .select("*")
        .order("sku");

      if (vars && prods) {
        const mapped = vars.map((v) => {
          const product = prods.find((p) => p.id === v.product_id);
          return {
            id: v.id,
            productId: v.product_id,
            productName: product?.name || "Deleted Product",
            imageUrl: product?.image_url || "",
            categoryName: (product as any)?.categories?.name || "Uncategorized",
            sku: v.sku,
            size: v.size || "",
            color: v.color || "",
            price: Number(v.price),
            comparePrice: v.compare_price ? Number(v.compare_price) : null,
            stockQuantity: Number(v.stock_quantity),
            status: v.status,
          };
        });
        setVariants(mapped);
      }
    } catch (err: any) {
      console.error("Failed to load inventory matrix:", err);
      toast.error("Failed to retrieve inventory variants lists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCellChange = (id: string, field: "stockQuantity" | "price" | "comparePrice", val: string) => {
    const original = variants.find((v) => v.id === id);
    if (!original) return;

    let numVal = val === "" ? 0 : Number(val);
    if (isNaN(numVal)) return;

    // UI boundary constraint logic: stock can never be negative
    if (field === "stockQuantity" && numVal < 0) {
      numVal = 0;
    }

    setChangedRows((prev) => {
      const existing = prev[id] || {
        stockQuantity: original.stockQuantity,
        price: original.price,
        comparePrice: original.comparePrice,
      };

      const updated = {
        ...existing,
        [field]: field === "comparePrice" && val === "" ? null : numVal,
      };

      const isSame = 
        updated.stockQuantity === original.stockQuantity &&
        updated.price === original.price &&
        updated.comparePrice === original.comparePrice;

      if (isSame) {
        const next = { ...prev };
        delete next[id];
        return next;
      }

      return {
        ...prev,
        [id]: updated,
      };
    });
  };

  const handleBulkSave = async () => {
    if (Object.keys(changedRows).length === 0) return;

    setSaving(true);
    try {
      const promises = Object.entries(changedRows).map(([id, data]) => 
        supabase
          .from("product_variants")
          .update({
            stock_quantity: data.stockQuantity,
            price: data.price,
            compare_price: data.comparePrice
          })
          .eq("id", id)
      );

      await Promise.all(promises);

      toast.success("Inventory stock levels synchronized successfully!");
      setChangedRows({});
      await loadData();
      await refreshCatalog();
    } catch (err: any) {
      console.error("Error saving inventory updates:", err);
      toast.error(err.message || "Failed to update inventory.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  // Perform search, filter, and sorting actions on the dataset
  const processedVariants = useMemo(() => {
    let list = [...variants];

    // Search query match
    if (search) {
      const term = search.toLowerCase();
      list = list.filter(
        (v) => v.sku.toLowerCase().includes(term) || v.productName.toLowerCase().includes(term)
      );
    }

    // Category match
    if (selectedCategory !== "all") {
      list = list.filter((v) => v.categoryName.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Stock level status match
    if (selectedStockStatus !== "all") {
      list = list.filter((v) => {
        const currentStock = changedRows[v.id]?.stockQuantity ?? v.stockQuantity;
        if (selectedStockStatus === "out") return currentStock === 0;
        if (selectedStockStatus === "low") return currentStock > 0 && currentStock <= 5;
        return currentStock > 5;
      });
    }

    // Sorting evaluation
    list.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      // Handle override value differences for price and stock
      if (sortBy === "stockQuantity") {
        aVal = changedRows[a.id]?.stockQuantity ?? a.stockQuantity;
        bVal = changedRows[b.id]?.stockQuantity ?? b.stockQuantity;
      } else if (sortBy === "price") {
        aVal = changedRows[a.id]?.price ?? a.price;
        bVal = changedRows[b.id]?.price ?? b.price;
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc" 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === "asc"
          ? aVal - bVal
          : bVal - aVal;
      }
    });

    return list;
  }, [variants, search, selectedCategory, selectedStockStatus, sortBy, sortDirection, changedRows]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Retrieving SKU inventory levels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div>
        <h1 className="font-serif text-3xl text-foreground flex items-center gap-2.5">
          <PackageCheck className="text-primary" size={28} />
          Inventory Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor SKU stock allocations, pricing grids, and catalog values</p>
      </div>

      {/* Query Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-background p-4 rounded-sm border border-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by SKU or parent product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-sm border border-border bg-transparent pl-9 pr-4 py-2 text-xs focus:border-primary focus:outline-none"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-muted-foreground" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-sm border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:border-primary text-foreground"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Stock status */}
        <div>
          <select
            value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value as any)}
            className="rounded-sm border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:border-primary text-foreground"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in">In Stock (&gt; 5)</option>
            <option value="low">Low Stock (1 - 5)</option>
            <option value="out">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Inventory Spreadsheet Grid */}
      <div className="overflow-hidden rounded-sm border border-border bg-background shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/20 text-2xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
              <th className="px-6 py-4">Product Variant Details</th>
              <th className="px-6 py-4 cursor-pointer" onClick={() => toggleSort("sku")}>
                <div className="flex items-center gap-1">
                  SKU Code
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-6 py-4">Size / Color</th>
              <th className="px-6 py-4 cursor-pointer" onClick={() => toggleSort("price")}>
                <div className="flex items-center gap-1">
                  Price (₹)
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-6 py-4">Compare Price (₹)</th>
              <th className="px-6 py-4 cursor-pointer" onClick={() => toggleSort("stockQuantity")}>
                <div className="flex items-center gap-1">
                  Stock Level
                  <ArrowUpDown size={11} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {processedVariants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-xs italic">
                  No matching variant records found.
                </td>
              </tr>
            ) : (
              processedVariants.map((v) => {
                const isModified = changedRows[v.id] !== undefined;
                const currentStock = changedRows[v.id]?.stockQuantity ?? v.stockQuantity;
                const currentPrice = changedRows[v.id]?.price ?? v.price;
                const currentCompare = changedRows[v.id] ? changedRows[v.id].comparePrice : v.comparePrice;

                // Alerts classes based on stock levels
                const stockBg = currentStock === 0
                  ? "bg-red-500/10 text-red-700 border-red-200"
                  : currentStock <= 5
                  ? "bg-amber-500/10 text-amber-700 border-amber-200"
                  : "bg-transparent border-border/80";

                return (
                  <tr 
                    key={v.id} 
                    className={cn(
                      "hover:bg-muted/10 transition-colors",
                      isModified && "bg-primary/5"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={v.imageUrl || ringsFallback}
                          alt={v.productName}
                          className="h-10 w-9 object-cover rounded-sm border border-border bg-cream"
                        />
                        <div>
                          <p className="font-serif text-sm text-foreground leading-tight">{v.productName}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{v.categoryName}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 font-mono text-xs text-foreground">{v.sku}</td>
                    
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {v.size || "-"} {v.color ? `/ ${v.color}` : ""}
                    </td>

                    {/* Price Input Cell */}
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        value={currentPrice}
                        onChange={(e) => handleCellChange(v.id, "price", e.target.value)}
                        className={cn(
                          "w-24 rounded-sm border border-border/80 bg-transparent px-2 py-1.5 text-xs focus:border-primary focus:outline-none",
                          isModified && changedRows[v.id].price !== v.price && "border-primary/80 font-bold"
                        )}
                      />
                    </td>

                    {/* Compare Price Input Cell */}
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        placeholder="None"
                        value={currentCompare === null ? "" : currentCompare}
                        onChange={(e) => handleCellChange(v.id, "comparePrice", e.target.value)}
                        className={cn(
                          "w-24 rounded-sm border border-border/80 bg-transparent px-2 py-1.5 text-xs focus:border-primary focus:outline-none",
                          isModified && changedRows[v.id].comparePrice !== v.comparePrice && "border-primary/80 font-bold"
                        )}
                      />
                    </td>

                    {/* Stock Input Cell */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          value={currentStock}
                          onChange={(e) => handleCellChange(v.id, "stockQuantity", e.target.value)}
                          className={cn(
                            "w-20 rounded-sm border px-2 py-1.5 text-xs focus:outline-none focus:border-primary",
                            stockBg,
                            isModified && changedRows[v.id].stockQuantity !== v.stockQuantity && "font-bold ring-1 ring-primary/40"
                          )}
                        />
                        {currentStock === 0 ? (
                          <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wider flex items-center gap-1 shrink-0">
                            <AlertTriangle size={12} />
                            Out of stock
                          </span>
                        ) : currentStock <= 5 ? (
                          <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1 shrink-0">
                            Low stock
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Save/Reset Bar */}
      {Object.keys(changedRows).length > 0 && (
        <div className="fixed bottom-6 right-6 left-6 md:left-[17.5rem] z-50 bg-charcoal text-cream border border-primary/20 rounded-sm p-4 shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wider eyebrow text-primary-foreground">
              {Object.keys(changedRows).length} unsaved SKU adjustments
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setChangedRows({})}
              className="px-4 py-2 border border-cream/20 text-2xs eyebrow uppercase font-semibold text-cream hover:bg-cream/10 flex items-center gap-1"
            >
              <Undo size={11} />
              Reset changes
            </button>
            <button
              onClick={handleBulkSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-primary px-5 py-2 text-2xs eyebrow uppercase font-bold text-primary-foreground hover:bg-cream hover:text-charcoal transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save Adjustments
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
