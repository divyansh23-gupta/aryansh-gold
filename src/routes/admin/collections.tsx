import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Save, 
  X, 
  Loader2,
  CheckSquare,
  Square
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import bridalFallback from "@/assets/collection-bridal.jpg";

export const Route = createFileRoute("/admin/collections")({
  component: AdminCollections,
});

function AdminCollections() {
  const { products, refreshCatalog } = useStore();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Product assignments states
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [originalProductIds, setOriginalProductIds] = useState<string[]>([]);

  // Collections list loaded from Supabase
  const [dbCollections, setDbCollections] = useState<any[]>([]);

  const loadCollections = async () => {
    try {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("title");
      if (error) throw error;
      if (data) setDbCollections(data);
    } catch (err) {
      console.warn("Could not load collections from table:", err);
    }
  };

  useState(() => {
    loadCollections();
  });

  // Calculate dynamic product counts per collection based on current store products
  const collectionStats = useMemo(() => {
    return dbCollections.map((col) => {
      // Find count from products loaded in memory that have this collection ID in their mapped list
      const count = products.filter((p) => 
        p.collections?.some((c) => c.id === col.id)
      ).length;
      return {
        ...col,
        productCount: count,
      };
    });
  }, [dbCollections, products]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const rawSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(rawSlug);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `catalog/collections/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("catalog")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("catalog").getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
      toast.success("Collection cover photo uploaded!");
    } catch (err: any) {
      console.warn("Storage upload failed, fallback to mock asset:", err);
      setImageUrl(bridalFallback);
      toast.success("Using fallback asset.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditClick = async (col: any) => {
    setEditingId(col.id);
    setTitle(col.title);
    setSlug(col.slug);
    setSubtitle(col.subtitle || "");
    setImageUrl(col.image_url || "");
    
    // Fetch product mappings for this collection
    try {
      const { data } = await supabase
        .from("product_collections")
        .select("product_id")
        .eq("collection_id", col.id);
      
      if (data) {
        const ids = data.map((pc) => pc.product_id);
        setSelectedProductIds(ids);
        setOriginalProductIds(ids);
      } else {
        setSelectedProductIds([]);
        setOriginalProductIds([]);
      }
    } catch (err) {
      console.error("Failed to load collection products mappings:", err);
    }
    
    setFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setSubtitle("");
    setImageUrl("");
    setSelectedProductIds([]);
    setOriginalProductIds([]);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) {
      toast.error("Please fill in title and slug.");
      return;
    }

    setLoading(true);
    try {
      let collectionId = editingId;

      if (editingId) {
        // 1. Update collection row
        const { error } = await supabase
          .from("collections")
          .update({
            title,
            slug,
            subtitle: subtitle || null,
            image_url: imageUrl || null,
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        // 2. Create new collection
        const { data, error } = await supabase
          .from("collections")
          .insert({
            title,
            slug,
            subtitle: subtitle || null,
            image_url: imageUrl || null,
          })
          .select()
          .single();

        if (error) throw error;
        collectionId = data.id;
      }

      // 3. Synchronize product assignments (diff calculation)
      if (collectionId) {
        const pToDelete = originalProductIds.filter((id) => !selectedProductIds.includes(id));
        const pToInsert = selectedProductIds.filter((id) => !originalProductIds.includes(id));

        if (pToDelete.length > 0) {
          const { error } = await supabase
            .from("product_collections")
            .delete()
            .eq("collection_id", collectionId)
            .in("product_id", pToDelete);
          if (error) throw error;
        }

        if (pToInsert.length > 0) {
          const { error } = await supabase
            .from("product_collections")
            .insert(
              pToInsert.map((pid) => ({
                collection_id: collectionId!,
                product_id: pid,
              }))
            );
          if (error) throw error;
        }
      }

      toast.success("Collection saved successfully!");
      handleCloseForm();
      await loadCollections();
      await refreshCatalog();
    } catch (err: any) {
      console.error("Error saving collection:", err);
      toast.error(err.message || "Failed to save collection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, titleName: string) => {
    if (!confirm(`Are you sure you want to delete collection "${titleName}"? This will clear all product associations.`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Collection deleted successfully!");
      await loadCollections();
      await refreshCatalog();
    } catch (err: any) {
      console.error("Error deleting collection:", err);
      toast.error(err.message || "Failed to delete collection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground flex items-center gap-2.5">
            <Settings className="text-primary" size={28} />
            Collections Curations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure seasonal edits, banners, and curated groupings</p>
        </div>
        {!formOpen && (
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 eyebrow text-xs text-primary-foreground transition-all hover:bg-foreground hover:text-background"
          >
            <Plus size={15} />
            Add Collection
          </button>
        )}
      </div>

      {/* Editor drawer form */}
      {formOpen && (
        <div className="bg-background rounded-sm border border-border p-6 shadow-sm max-w-4xl animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-6">
            <h2 className="font-serif text-lg text-foreground">
              {editingId ? `Edit Collection: ${title}` : "Create New Collection"}
            </h2>
            <button onClick={handleCloseForm} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Row 1 details */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="col-title" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Collection Title *</label>
                <input
                  id="col-title"
                  type="text"
                  required
                  placeholder="Bridal Edit"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full rounded-sm border border-border bg-transparent px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="col-slug" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Slug URL *</label>
                <input
                  id="col-slug"
                  type="text"
                  required
                  placeholder="bridal-edit"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-sm border border-border bg-transparent px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="col-sub" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Subtitle / Punchline</label>
              <input
                id="col-sub"
                type="text"
                placeholder="Handcrafted statement designs for your special day"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full rounded-sm border border-border bg-transparent px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Banner photo */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Banner Image</label>
              <div className="flex items-center gap-6">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Collection Preview"
                    className="h-20 w-32 object-cover rounded-sm border border-border bg-cream"
                  />
                )}
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                    id="collection-banner-upload"
                  />
                  <div className="flex gap-2">
                    <label
                      htmlFor="collection-banner-upload"
                      className="px-4 py-2.5 border border-border bg-background text-2xs font-semibold tracking-wider uppercase text-foreground hover:bg-muted cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload size={13} />
                      Upload Photo
                    </label>
                    <input
                      type="text"
                      placeholder="Or paste URL..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="border border-border/80 rounded-sm bg-transparent px-3 py-2 text-xs focus:outline-none w-64"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Products mappings curation section */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2">
                Curated Products Checklist ({selectedProductIds.length} items selected)
              </label>
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-60 overflow-y-auto border border-border bg-muted/5 rounded-sm p-4">
                {products.map((prod) => {
                  const isChecked = selectedProductIds.includes(prod.id);
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => toggleProductSelection(prod.id)}
                      className={cn(
                        "flex items-center gap-3 p-2.5 border rounded-sm transition-all text-left bg-background",
                        isChecked 
                          ? "border-primary/60 bg-primary/5 text-primary" 
                          : "border-border/60 hover:bg-muted/30"
                      )}
                    >
                      {isChecked ? (
                        <CheckSquare size={16} className="text-primary shrink-0" />
                      ) : (
                        <Square size={16} className="text-muted-foreground shrink-0" />
                      )}
                      
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="h-8 w-7 object-cover rounded-sm border border-border bg-cream shrink-0"
                      />
                      <div className="truncate flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{prod.name}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{prod.category}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 border-t border-border/60 pt-4">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-5 py-2.5 border border-border bg-background text-xs eyebrow text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-primary px-6 py-2.5 eyebrow text-xs text-primary-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Save Collection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collectionStats.map((col) => (
          <div key={col.id} className="overflow-hidden rounded-sm border border-border bg-background shadow-sm flex flex-col justify-between">
            <div className="aspect-[16/9] w-full bg-cream relative overflow-hidden border-b border-border/60">
              <img
                src={col.image_url || bridalFallback}
                alt={col.title}
                className="h-full w-full object-cover"
              />
              <span className="absolute top-3 right-3 inline-flex items-center rounded-full bg-charcoal/80 px-2.5 py-0.5 text-2xs font-semibold tracking-wider text-background uppercase">
                {col.productCount} {col.productCount === 1 ? "Product" : "Products"}
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg text-foreground">{col.title}</h3>
                {col.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{col.subtitle}</p>
                )}
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">
                  Slug: /collections/{col.slug}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <button
                  onClick={() => handleEditClick(col)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Edit size={13} />
                  Edit details
                </button>
                <button
                  onClick={() => handleDelete(col.id, col.title)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
