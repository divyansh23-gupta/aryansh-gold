import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, 
  Upload, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon 
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { type VariantStatus } from "@/lib/database.types";

export const Route = createFileRoute("/admin/products/new")({
  component: AdminProductsNew,
});

interface LocalVariant {
  sku: string;
  size: string;
  color: string;
  price: string;
  comparePrice: string;
  stockQuantity: string;
  status: VariantStatus;
}

function AdminProductsNew() {
  const navigate = useNavigate();
  const { refreshCatalog } = useStore();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  // General Info States
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState("");
  const [care, setCare] = useState("");
  
  // Flags States
  const [isNew, setIsNew] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);

  // Cover Image
  const [coverUrl, setCoverUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);

  // Gallery Images
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Variants list
  const [variants, setVariants] = useState<LocalVariant[]>([
    {
      sku: "",
      size: "One Size",
      color: "Gold",
      price: "",
      comparePrice: "",
      stockQuantity: "10",
      status: "active",
    }
  ]);

  // Load categories from database
  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      if (data) {
        setCategories(data);
        if (data.length > 0) setCategoryId(data[0].id);
      }
    };
    loadCategories();
  }, []);

  // Pre-generate slug and SKU when name changes
  useEffect(() => {
    const rawSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    setSlug(rawSlug);

    // Auto-generate SKUs for variants that are empty
    setVariants((prev) =>
      prev.map((v, i) => {
        if (v.sku === "" && rawSlug !== "") {
          const skuSuffix = i === 0 ? "GLD-1" : `VAR-${i + 1}`;
          return {
            ...v,
            sku: `SKU-${rawSlug.substring(0, 6).toUpperCase()}-${skuSuffix}`,
          };
        }
        return v;
      })
    );
  }, [name]);

  const handleImageUpload = async (file: File, isCover: boolean) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `catalog/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("catalog")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("catalog").getPublicUrl(filePath);
      
      if (isCover) {
        setCoverUrl(data.publicUrl);
        toast.success("Cover image uploaded!");
      } else {
        setGalleryUrls((prev) => [...prev, data.publicUrl]);
        toast.success("Gallery image added!");
      }
    } catch (err: any) {
      console.warn("Storage upload failed, falling back to mock assets path:", err);
      // Fallback fallback path simulation
      const fallbackPath = `/src/assets/product-${Math.floor(Math.random() * 5) + 1}.jpg`;
      if (isCover) {
        setCoverUrl(fallbackPath);
      } else {
        setGalleryUrls((prev) => [...prev, fallbackPath]);
      }
      toast.success("Using fallback image asset.");
    }
  };

  const addVariant = () => {
    const slugPart = slug ? slug.substring(0, 6).toUpperCase() : "PROD";
    setVariants((prev) => [
      ...prev,
      {
        sku: `SKU-${slugPart}-VAR-${prev.length + 1}`,
        size: "One Size",
        color: "Silver",
        price: "",
        comparePrice: "",
        stockQuantity: "10",
        status: "active",
      }
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) {
      toast.error("Products must have at least one variant.");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, fields: Partial<LocalVariant>) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...fields } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !categoryId || !coverUrl) {
      toast.error("Please fill in all general parameters, including a cover image.");
      return;
    }

    const invalidVariant = variants.some((v) => !v.sku || !v.price);
    if (invalidVariant) {
      toast.error("All variants must possess a valid SKU and Price.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Insert product
      const { data: product, error: prodError } = await supabase
        .from("products")
        .insert({
          name,
          slug,
          category_id: categoryId,
          image_url: coverUrl,
          is_new: isNew,
          is_best_seller: isBestSeller,
          is_featured: isFeatured,
          is_trending: isTrending,
          description,
          materials,
          care
        })
        .select()
        .single();

      if (prodError) throw prodError;

      // 2. Insert variants
      const { error: varError } = await supabase
        .from("product_variants")
        .insert(
          variants.map((v) => ({
            product_id: product.id,
            sku: v.sku,
            size: v.size || null,
            color: v.color || null,
            price: Number(v.price),
            compare_price: v.comparePrice ? Number(v.comparePrice) : null,
            stock_quantity: Number(v.stockQuantity),
            status: v.status
          }))
        );

      if (varError) throw varError;

      // 3. Insert gallery images
      if (galleryUrls.length > 0) {
        const { error: imgError } = await supabase
          .from("product_images")
          .insert(
            galleryUrls.map((url, i) => ({
              product_id: product.id,
              image_url: url,
              display_order: i
            }))
          );
        if (imgError) throw imgError;
      }

      toast.success("Product created successfully!");
      await refreshCatalog();
      navigate({ to: "/admin/products" });
    } catch (err: any) {
      console.error("Error creating product:", err);
      toast.error(err.message || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back breadcrumb */}
      <div>
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Back to products catalog
        </Link>
        <h1 className="font-serif text-3xl text-foreground mt-3 flex items-center gap-2.5">
          <Sparkles className="text-primary" size={26} />
          Create New Product
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Add general parameters, metadata, images, and variants</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: General Specs */}
        <section className="bg-background rounded-sm border border-border p-6 shadow-sm space-y-6">
          <h2 className="font-serif text-lg text-foreground border-b border-border/60 pb-3">General Information</h2>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Product Name *</label>
              <input
                id="name"
                type="text"
                required
                placeholder="Astra Solitaire Necklace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-sm border border-border bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Slug URL *</label>
              <input
                id="slug"
                type="text"
                required
                placeholder="astra-solitaire-necklace"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-sm border border-border bg-transparent px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Category *</label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-sm border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4 pt-2">
            {[
              { label: "New Release", val: isNew, set: setIsNew },
              { label: "Bestseller", val: isBestSeller, set: setIsBestSeller },
              { label: "Featured Panel", val: isFeatured, set: setIsFeatured },
              { label: "Trending Grid", val: isTrending, set: setIsTrending },
            ].map((flag) => (
              <label key={flag.label} className="flex items-center gap-3 rounded-sm border border-border/60 bg-muted/10 p-3 cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={flag.val}
                  onChange={(e) => flag.set(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-xs font-medium text-foreground">{flag.label}</span>
              </label>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="desc" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Description</label>
              <textarea
                id="desc"
                rows={3}
                placeholder="A refined statement of quiet luxury..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-sm border border-border bg-transparent px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="materials" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Materials & Plating</label>
                <textarea
                  id="materials"
                  rows={2}
                  placeholder="Brass base with 18k gold plating..."
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  className="w-full rounded-sm border border-border bg-transparent px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="care" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Care Instructions</label>
                <textarea
                  id="care"
                  rows={2}
                  placeholder="Store in clean pouch, avoid sprays..."
                  value={care}
                  onChange={(e) => setCare(e.target.value)}
                  className="w-full rounded-sm border border-border bg-transparent px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Image Uploads */}
        <section className="bg-background rounded-sm border border-border p-6 shadow-sm space-y-6">
          <h2 className="font-serif text-lg text-foreground border-b border-border/60 pb-3">Cover & Gallery Images</h2>
          
          <div className="grid gap-8 sm:grid-cols-2">
            {/* Cover image upload */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cover Image *</label>
              
              {coverUrl ? (
                <div className="relative aspect-[4/5] w-full max-w-[240px] rounded-sm border border-border overflow-hidden group bg-cream">
                  <img src={coverUrl} alt="Cover Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverUrl("")}
                    className="absolute inset-0 m-auto h-10 w-10 grid place-items-center rounded-full bg-charcoal/80 text-background opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center aspect-[4/5] w-full max-w-[240px] rounded-sm border border-dashed border-border/80 bg-muted/5 p-4 text-center">
                  <Upload className="text-muted-foreground mb-2.5" size={24} />
                  <span className="text-xs font-medium text-foreground">Upload cover photo</span>
                  <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG, JPEG up to 5MB</p>
                  
                  {/* File input */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, true);
                    }}
                    className="hidden"
                    id="cover-upload-file"
                  />
                  <label
                    htmlFor="cover-upload-file"
                    className="mt-4 px-3 py-1.5 border border-border bg-background text-[10px] font-semibold tracking-wider uppercase text-foreground hover:bg-muted cursor-pointer"
                  >
                    Select File
                  </label>

                  {/* Manual Paste */}
                  <input
                    type="text"
                    placeholder="Or paste image URL..."
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="mt-3 w-full border border-border/60 rounded-sm bg-transparent px-2.5 py-1.5 text-[11px] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Gallery images upload */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gallery Slide Images</label>
              
              <div className="flex flex-wrap gap-4">
                {galleryUrls.map((url, index) => (
                  <div key={index} className="relative h-24 w-20 rounded-sm border border-border overflow-hidden group bg-cream">
                    <img src={url} alt="Gallery item" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setGalleryUrls((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute inset-0 m-auto h-7 w-7 grid place-items-center rounded-full bg-charcoal/80 text-background opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                <div className="flex flex-col items-center justify-center h-24 w-20 rounded-sm border border-dashed border-border/80 bg-muted/5 text-center p-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, false);
                    }}
                    className="hidden"
                    id="gallery-upload-file"
                  />
                  <label htmlFor="gallery-upload-file" className="cursor-pointer">
                    <Plus size={18} className="text-muted-foreground hover:text-foreground mx-auto" />
                  </label>
                  <input
                    type="text"
                    placeholder="Paste URL..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value;
                        if (val) {
                          setGalleryUrls((prev) => [...prev, val]);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }
                    }}
                    className="mt-2 w-full border border-border/60 rounded-sm bg-transparent px-1 py-1 text-[9px] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Variants Configuration */}
        <section className="bg-background rounded-sm border border-border p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="font-serif text-lg text-foreground">SKU Variants builder</h2>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs eyebrow text-foreground hover:bg-muted"
            >
              <Plus size={12} />
              Add Variant
            </button>
          </div>

          <div className="space-y-4">
            {variants.map((v, index) => (
              <div key={index} className="grid gap-4 sm:grid-cols-7 border border-border/60 bg-muted/5 rounded-sm p-4 items-end relative">
                {/* SKU Code */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">SKU *</label>
                  <input
                    type="text"
                    required
                    value={v.sku}
                    onChange={(e) => handleVariantChange(index, { sku: e.target.value })}
                    className="w-full border border-border rounded-sm bg-background px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                {/* Size */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Size</label>
                  <input
                    type="text"
                    value={v.size}
                    onChange={(e) => handleVariantChange(index, { size: e.target.value })}
                    className="w-full border border-border rounded-sm bg-background px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Color</label>
                  <input
                    type="text"
                    value={v.color}
                    onChange={(e) => handleVariantChange(index, { color: e.target.value })}
                    className="w-full border border-border rounded-sm bg-background px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={v.price}
                    onChange={(e) => handleVariantChange(index, { price: e.target.value })}
                    className="w-full border border-border rounded-sm bg-background px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={v.stockQuantity}
                    onChange={(e) => handleVariantChange(index, { stockQuantity: e.target.value })}
                    className="w-full border border-border rounded-sm bg-background px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                {/* Actions (Delete variant) */}
                <div className="flex justify-end pb-1.5">
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-muted-foreground hover:text-destructive p-1.5"
                    title="Remove variant"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Submit & Cancel Buttons */}
        <div className="flex justify-end items-center gap-4">
          <Link
            to="/admin/products"
            className="px-6 py-3 border border-border bg-background text-xs eyebrow text-foreground hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-primary px-8 py-3 eyebrow text-xs text-primary-foreground transition-all hover:bg-foreground hover:text-background disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving Product...
              </>
            ) : (
              <>
                <Save size={14} />
                Save Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
