import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/data/products";
import { ShoppingBag, Plus, Edit, Trash2, Search, ArrowRight, Eye } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products/")({
  component: AdminProductsList,
});

function AdminProductsList() {
  const { products, refreshCatalog } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast.success("Product deleted successfully!");
      await refreshCatalog();
    } catch (err: any) {
      console.error("Error deleting product:", err);
      toast.error(err.message || "Failed to delete product.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground flex items-center gap-2.5">
            <ShoppingBag className="text-primary" size={28} />
            Products Catalog
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Directory of products, variants, and pricing details</p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 eyebrow text-xs text-primary-foreground transition-all hover:bg-foreground hover:text-background"
        >
          <Plus size={15} />
          Add Product
        </Link>
      </div>

      {/* Catalog Search */}
      <div className="flex items-center gap-3 rounded-sm border border-border bg-background px-4 py-3 max-w-md shadow-sm">
        <Search size={18} className="text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, category, SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-sm border border-border bg-background shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Cheapest SKU</th>
                <th className="px-6 py-4">Availability</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No products found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const totalVariants = p.variants?.length || 0;
                  return (
                    <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                      {/* Item info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-12 w-10 object-cover rounded-sm border border-border/60 bg-cream shrink-0"
                          />
                          <div>
                            <p className="font-serif font-medium text-foreground">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                              {totalVariants} {totalVariants === 1 ? "variant" : "variants"} configured
                            </p>
                            {p.collections && p.collections.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {p.collections.map((c) => (
                                  <span key={c.id} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm font-medium">
                                    {c.title}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 align-middle">
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {p.category}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="px-6 py-4 align-middle font-serif text-foreground">
                        {formatPrice(p.price)}
                      </td>

                      {/* Stock Status */}
                      <td className="px-6 py-4 align-middle">
                        <span className="flex items-center gap-1.5 text-xs">
                          <span
                            className={p.inStock ? "h-2.5 w-2.5 rounded-full bg-emerald-500" : "h-2.5 w-2.5 rounded-full bg-destructive"}
                          />
                          {p.inStock ? "In Stock" : "Sold Out"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 align-middle text-right">
                        <div className="flex justify-end items-center gap-3">
                          <Link
                            to="/product/$slug"
                            params={{ slug: p.slug }}
                            target="_blank"
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                            title="View store product"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            to="/admin/products/$id/edit"
                            params={{ id: p.id }}
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                            title="Edit product"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            type="button"
                            disabled={isDeleting === p.id}
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${p.name}? This will remove all related SKUs and gallery items.`)) {
                                  handleDelete(p.id);
                              }
                            }}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
