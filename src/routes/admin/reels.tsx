import { createFileRoute } from "@tanstack/react-router";
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
  EyeOff,
  Upload
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { type DbReel } from "@/lib/database.types";

export const Route = createFileRoute("/admin/reels")({
  component: AdminReels,
});

function AdminReels() {
  const [reels, setReels] = useState<DbReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reels")
        .select("*")
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
    setThumbnailUrl("");
    setInstagramUrl("");
    setIsActive(true);
    setFormOpen(true);
  };

  const handleOpenEdit = (reel: DbReel) => {
    setEditingId(reel.id);
    setTitle(reel.title);
    setThumbnailUrl(reel.thumbnail_url);
    setInstagramUrl(reel.instagram_url);
    setIsActive(reel.is_active);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setUploadingImage(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `reels/covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("catalog")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("catalog").getPublicUrl(filePath);
      setThumbnailUrl(data.publicUrl);
      toast.success("Cover image uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
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
      toast.success(`Reel look ${nextActive ? 'activated' : 'disabled'} successfully`);
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
      toast.success("Reel look deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete reel");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !instagramUrl.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!thumbnailUrl.trim()) {
      toast.error("Please upload or provide a cover thumbnail image.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        thumbnail_url: thumbnailUrl.trim(),
        instagram_url: instagramUrl.trim(),
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
    <div className="py-10 px-5 md:px-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground flex items-center gap-3">
            <Film className="text-primary h-8 w-8" />
            Manage Reels
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 font-sans">
            Configure beautiful visual gateway shortcuts linking to Instagram Reels on the storefront.
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
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1.5 font-sans">
            Create your first visual reel look mapping to showcase product curation and redirect traffic to your reels.
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
                  <th scope="col" className="px-6 py-4">Thumbnail Cover</th>
                  <th scope="col" className="px-6 py-4">Title</th>
                  <th scope="col" className="px-6 py-4">Instagram Target</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reels.map((reel) => (
                  <tr key={reel.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-24 w-14 rounded-sm overflow-hidden bg-muted relative border border-border flex items-center justify-center">
                        {reel.thumbnail_url ? (
                          <img
                            src={reel.thumbnail_url}
                            alt={reel.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Film className="h-6 w-6 text-muted-foreground/30" />
                        )}
                        <div className="absolute inset-0 bg-black/5" />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-serif text-base text-foreground max-w-xs truncate">
                      {reel.title}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs max-w-sm truncate text-muted-foreground">
                      <a
                        href={reel.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary flex items-center gap-1.5 font-sans"
                      >
                        {reel.instagram_url}
                        <ExternalLink size={12} className="shrink-0" />
                      </a>
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
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleOpenEdit(reel)}
                          className="p-1.5 hover:text-foreground transition-colors hover:scale-105"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteReel(reel.id)}
                          className="p-1.5 hover:text-rose-600 transition-colors hover:scale-105"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Drawer / Popup Overlay */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-md bg-background border border-border p-6 rounded-sm shadow-xl relative">
            <button
              onClick={handleCloseForm}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="font-serif text-2xl text-foreground mb-5 flex items-center gap-2">
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
                  placeholder="e.g. Traditional Gold Choker Styling"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                />
              </div>

              <div>
                <label className="block text-xs eyebrow text-muted-foreground mb-1.5">
                  Instagram Reel URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.instagram.com/reel/C8a123bcdef/"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="w-full rounded-sm border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                />
                <p className="text-[0.68rem] text-muted-foreground mt-1 font-sans">
                  The destination Reel URL opened immediately when users click the thumbnail.
                </p>
              </div>

              <div>
                <label className="block text-xs eyebrow text-muted-foreground mb-1.5">
                  Thumbnail Cover Image *
                </label>
                <div className="mt-1 flex items-center gap-4">
                  <div className="h-28 w-16 bg-muted border rounded-sm overflow-hidden flex items-center justify-center relative shrink-0">
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt="Thumbnail preview" className="h-full w-full object-cover" />
                    ) : (
                      <Film className="h-6 w-6 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="inline-flex items-center gap-1.5 bg-background border border-foreground hover:bg-muted/10 text-foreground cursor-pointer px-4 py-2 eyebrow text-xs rounded-sm transition-all shadow-sm">
                      {uploadingImage ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-primary" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={12} />
                          Upload Photo
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[0.68rem] text-muted-foreground mt-1.5 font-sans leading-normal">
                      Provide a high-quality vertical portrait cover image (9:16 aspect ratio).
                    </p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="block text-[0.68rem] eyebrow text-muted-foreground/80 mb-1">
                    Or paste Image URL directly
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or public URL"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="w-full rounded-sm border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
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
                  disabled={submitting || uploadingImage}
                  className="bg-foreground hover:bg-primary text-background hover:text-primary-foreground px-5 py-2 eyebrow transition-colors rounded-sm inline-flex items-center gap-1.5 shadow-sm"
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
