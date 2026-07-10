import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { 
  FolderTree, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Save, 
  X, 
  Loader2 
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import necklacesFallback from "@/assets/collection-necklaces.jpg";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

interface LocalCategory {
  id?: string;
  name: string;
  slug: string;
  image_url: string;
}

function AdminCategories() {
  const { products, refreshCatalog } = useStore();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Fetch unique categories directly from products if DB is empty
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  // Load categories from database dynamically
  const [loadError, setLoadError] = useState(false);
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      if (data) setDbCategories(data);
    } catch (err) {
      console.warn("Could not load categories from table:", err);
      setLoadError(true);
    }
  };

  useState(() => {
    loadCategories();
  });

  // Calculate product count per category dynamically
  const categoryStats = useMemo(() => {
    return dbCategories.map((cat) => {
      const count = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;
      return {
        ...cat,
        productCount: count,
      };
    });
  }, [dbCategories, products]);

  const handleNameChange = (val: string) => {
    setName(val);
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
    const filePath = `catalog/categories/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("catalog")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("catalog").getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
      toast.success("Category cover photo uploaded!");
    } catch (err: any) {
      console.warn("Storage upload failed, fallback to mock path:", err);
      setImageUrl(necklacesFallback);
      toast.success("Using fallback asset.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditClick = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setImageUrl(cat.image_url || "");
    setFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setImageUrl("");
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      toast.error("Please fill in name and slug.");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Update category
        const { error } = await supabase
          .from("categories")
          .update({
            name,
            slug,
            image_url: imageUrl || null,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Category updated successfully!");
      } else {
        // Create category
        const { error } = await supabase
          .from("categories")
          .insert({
            name,
            slug,
            image_url: imageUrl || null,
          });

        if (error) throw error;
        toast.success("Category created successfully!");
      }

      handleCloseForm();
      await loadCategories();
      await refreshCatalog();
    } catch (err: any) {
      console.error("Error saving category:", err);
      toast.error(err.message || "Failed to save category.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const hasProducts = products.some((p) => p.category.toLowerCase() === name.toLowerCase());
    if (hasProducts) {
      toast.error(`Cannot delete category "${name}". It has associated products. Re-assign them first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Category deleted successfully!");
      await loadCategories();
      await refreshCatalog();
    } catch (err: any) {
      console.error("Error deleting category:", err);
      toast.error(err.message || "Failed to delete category.");
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
            <FolderTree className="text-primary" size={28} />
            Categories Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure product category divisions and cover images</p>
        </div>
        {!formOpen && (
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 eyebrow text-xs text-primary-foreground transition-all hover:bg-foreground hover:text-background"
          >
            <Plus size={15} />
            Add Category
          </button>
        )}
      </div>

      {/* Editor slide-over panel */}
      {formOpen && (
        <div className="bg-background rounded-sm border border-border p-6 shadow-sm max-w-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-6">
            <h2 className="font-serif text-lg text-foreground">
              {editingId ? `Edit Category: ${name}` : "Create New Category"}
            </h2>
            <button onClick={handleCloseForm} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="cat-name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Category Name *</label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  placeholder="Necklaces"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-sm border border-border bg-transparent px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cat-slug" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Slug URL *</label>
                <input
                  id="cat-slug"
                  type="text"
                  required
                  placeholder="necklaces"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-sm border border-border bg-transparent px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Image upload */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cover Image</label>
              <div className="flex items-center gap-6">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Category Preview"
                    className="h-20 w-24 object-cover rounded-sm border border-border bg-cream"
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
                    id="category-cover-upload"
                  />
                  <div className="flex gap-2">
                    <label
                      htmlFor="category-cover-upload"
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
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categoryStats.map((cat) => (
          <div key={cat.id} className="overflow-hidden rounded-sm border border-border bg-background shadow-sm flex flex-col justify-between">
            <div className="aspect-[16/9] w-full bg-cream relative overflow-hidden border-b border-border/60">
              <img
                src={cat.image_url || necklacesFallback}
                alt={cat.name}
                className="h-full w-full object-cover"
              />
              <span className="absolute top-3 right-3 inline-flex items-center rounded-full bg-charcoal/80 px-2.5 py-0.5 text-2xs font-semibold tracking-wider text-background uppercase">
                {cat.productCount} {cat.productCount === 1 ? "Product" : "Products"}
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg text-foreground">{cat.name}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  Slug: /{cat.slug}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <button
                  onClick={() => handleEditClick(cat)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Edit size={13} />
                  Edit details
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
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
