import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { 
  Film, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Loader2, 
  ExternalLink,
  Eye,
  EyeOff
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { type DbReel } from "@/lib/database.types";

export const Route = createFileRoute("/admin/reels")({
  component: AdminReels,
});

function AdminReels() {
  const { products } = useStore();
  const [reels, setReels] = useState<DbReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [productId, setProductId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reels")
        .select("*, products:product_id(id, name, image_url)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReels(data || []);
    } catch (error: any) {
      console.error("Error loading reels:", error);
      toast.error(error.message || "Failed to load reels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setTitle("");
    setVideoFile(null);
    setVideoUrl("");
    setThumbnailUrl("");
    setProductId("");
    setIsActive(true);
    setFormOpen(true);
  };

  const handleOpenEdit = (reel: DbReel) => {
    setEditingId(reel.id);
    setTitle(reel.title);
    setVideoFile(null);
    setVideoUrl(reel.video_url);
    setThumbnailUrl(reel.thumbnail_url || "");
    setProductId(reel.product_id || "");
    setIsActive(reel.is_active);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setVideoFile(null);
  };

  const handleToggleActive = async (reel: DbReel) => {
    try {
      const nextActive = !reel.is_active;
      const { error } = await supabase
        .from("reels")
        .update({ is_active: nextActive })
        .eq("id", reel.id);

      if (error) throw error;

      setReels(prev => 
        prev.map(r => r.id === reel.id ? { ...r, is_active: nextActive } : r)
      );
      toast.success(`Reel ${nextActive ? 'activated' : 'disabled'} successfully`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleDeleteReel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reel look?")) return;

    try {
      const { error } = await supabase
        .from("reels")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setReels(prev => prev.filter(r => r.id !== id));
      toast.success("Reel deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete reel");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please provide a title.");
      return;
    }
    if (!editingId && !videoFile) {
      toast.error("Please upload a video file for the reel.");
      return;
    }

    try {
      setSubmitting(true);
      let finalVideoUrl = videoUrl;

      // Handle video upload to Supabase Storage if a new file is chosen
      if (videoFile) {
        const fileExt = videoFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `reels/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("reels")
          .upload(filePath, videoFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("reels").getPublicUrl(filePath);
        finalVideoUrl = data.publicUrl;
      }

      const payload = {
        title: title.trim(),
        video_url: finalVideoUrl,
        thumbnail_url: thumbnailUrl.trim() || null,
        product_id: productId || null,
        is_active: isActive
      };

      if (editingId) {
        const { error } = await supabase
          .from("reels")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Reel updated successfully");
      } else {
        const { error } = await supabase
          .from("reels")
          .insert([payload]);

        if (error) throw error;
        toast.success("Reel added successfully");
      }

      handleCloseForm();
      fetchReels();
    } catch (error: any) {
      toast.error(error.message || "Failed to save reel");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-10 px-5 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground flex items-center gap-3">
            <Film className="text-primary h-8 w-8" />
            Manage Reels
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            Configure raw video reels dynamically featured in the 'Trending Looks' homepage section.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 bg-foreground hover:bg-primary text-background hover:text-primary-foreground px-5 py-2.5 eyebrow transition-colors rounded-sm"
        >
          <Plus size={16} />
          Add Reel Look
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm mt-4 font-serif">Loading Reels database...</p>
        </div>
      ) : reels.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-sm mt-8 bg-background">
          <Film className="mx-auto h-12 w-12 text-muted-foreground/50 stroke-[1.2]" />
          <h3 className="mt-4 font-serif text-lg text-foreground">No Reels Configured</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1.5">
            Upload your first reel video to showcase product styling on the storefront.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-6 border border-foreground hover:bg-foreground hover:text-background px-6 py-2.5 eyebrow transition-colors rounded-sm"
          >
            Add Reel Now
          </button>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden border border-border rounded-sm bg-background">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-foreground">
              <thead className="bg-muted/10 border-b border-border text-xs eyebrow tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-4">Cover / Preview</th>
                  <th scope="col" className="px-6 py-4">Title</th>
                  <th scope="col" className="px-6 py-4">Video Link</th>
                  <th scope="col" className="px-6 py-4">Associated Product</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reels.map((reel) => {
                  const linkedProduct: any = reel.products;
                  return (
                    <tr key={reel.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="h-20 w-12 rounded-sm overflow-hidden bg-muted relative border border-border flex items-center justify-center">
                          {reel.thumbnail_url ? (
                            <img
                              src={reel.thumbnail_url}
                              alt={reel.title}
                              className="h-full w-full object-cover"
                            />
                          ) : linkedProduct?.image_url ? (
                            <img
                              src={linkedProduct.image_url}
                              alt={reel.title}
                              className="h-full w-full object-cover opacity-60"
                            />
                          ) : (
                            <Film className="h-6 w-6 text-muted-foreground/30" />
                          )}
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                            <span className="text-[0.6rem] bg-foreground text-background px-1 py-0.5 rounded-sm scale-75 opacity-75 font-semibold">Video</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium max-w-xs truncate">
                        {reel.title}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs max-w-xs truncate text-muted-foreground">
                        <a
                          href={reel.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-1.5"
                        >
                          Watch Video
                          <ExternalLink size={12} />
                        </a>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {linkedProduct ? (
                          <div className="flex items-center gap-2">
                            {linkedProduct.image_url && (
                              <img
                                src={linkedProduct.image_url}
                                alt={linkedProduct.name}
                                className="h-8 w-8 rounded-sm object-cover"
                              />
                            )}
                            <span className="text-xs font-serif max-w-[150px] truncate">{linkedProduct.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs italic">— None —</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(reel)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold eyebrow transition-all ${
                            reel.is_active 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {reel.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                          {reel.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleOpenEdit(reel)}
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors hover:scale-105"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteReel(reel.id)}
                            className="p-1.5 text-muted-foreground hover:text-rose-600 transition-colors hover:scale-105"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Drawer/Modal Overlay */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-background border border-border p-6 rounded-sm shadow-xl relative">
            <button
              onClick={handleCloseForm}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="font-serif text-2xl text-foreground mb-4 flex items-center gap-2">
              <Film size={22} className="text-primary" />
              {editingId ? "Edit Reel Look" : "Add Reel Look"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs eyebrow text-muted-foreground mb-1.5">
                  Reel Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elegant Kundan Bridal Styling"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs eyebrow text-muted-foreground mb-1.5">
                  Upload Reel Video (.mp4) *
                </label>
                {videoUrl && !videoFile && (
                  <div className="mb-2 p-2 border rounded-sm bg-muted/10 text-xs flex items-center justify-between">
                    <span className="truncate max-w-[200px] font-mono text-[0.65rem] text-muted-foreground">{videoUrl}</span>
                    <span className="text-[0.62rem] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-sm border border-emerald-100 font-semibold shrink-0">Active Video</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="video/mp4"
                  required={!editingId}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setVideoFile(e.target.files[0]);
                    }
                  }}
                  className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
                <p className="text-[0.68rem] text-muted-foreground mt-1">
                  Choose a raw mp4 video file. Suggested file size &lt; 5MB to ensure fast buffering.
                </p>
              </div>

              <div>
                <label className="block text-xs eyebrow text-muted-foreground mb-1.5">
                  Custom Thumbnail Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or public image link"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
                <p className="text-[0.68rem] text-muted-foreground mt-1">
                  Provide an image URL to override the default linked product thumbnail.
                </p>
              </div>

              <div>
                <label className="block text-xs eyebrow text-muted-foreground mb-1.5">
                  Link Associated Product (Optional)
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- No Linked Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[0.68rem] text-muted-foreground mt-1">
                  Enables shop-the-look buy CTAs inside the reel modal display.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary bg-background"
                />
                <label htmlFor="isActive" className="text-xs eyebrow text-foreground cursor-pointer select-none">
                  Display active on storefront
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 border text-xs eyebrow rounded-sm hover:bg-muted/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-foreground hover:bg-primary text-background hover:text-primary-foreground px-5 py-2 eyebrow transition-colors rounded-sm inline-flex items-center gap-1.5"
                >
                  {submitting && <Loader2 size={12} className="animate-spin" />}
                  <Save size={14} />
                  Save Look
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
