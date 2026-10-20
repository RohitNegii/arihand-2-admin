import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  ImageOff,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import {
  getRequest,
  postRequest,
  putRequest,
  patchRequest,
  deleteRequest,
  resolveSiteMedia,
  SITE_URL
} from "../services/api";
import Modal from "../components/ui/Modal";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal";
import { compressImage } from "../utils/imageCompressor";

interface Slot {
  key: string;
  label: string;
  chapterNumber: string;
  chapter: string;
  placement: string;
  guidance: string;
  aspect: string;
  multiple: boolean;
  recommended: string;
  maxUsed: number | null;
}

interface MediaItem {
  _id: string;
  slot: string;
  url: string;
  title: string;
  alt: string;
  order: number;
  isActive: boolean;
}

const titleFromFilename = (name: string) => {
  const base = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return base.replace(/\b\w/g, (c) => c.toUpperCase()) || "Untitled photo";
};

export default function HomepageMedia() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [slotsRes, itemsRes] = await Promise.all([
        getRequest("/home-media/slots"),
        getRequest("/home-media/admin")
      ]);
      if (slotsRes.success) setSlots(slotsRes.slots);
      if (itemsRes.success) setItems(itemsRes.items);
    } catch {
      toast.error("Failed to load homepage media.");
    } finally {
      setLoading(false);
    }
  };

  const orderedSlots = [...slots].sort(
    (a, b) => Number(a.chapterNumber) - Number(b.chapterNumber)
  );

  const itemsForSlot = (slotKey: string) =>
    items.filter((item) => item.slot === slotKey).sort((a, b) => a.order - b.order);

  const handleUpload = async (slot: Slot, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    setUploadingSlot(slot.key);
    try {
      const processed = await Promise.all(
        files.map(async (file) => {
          try {
            return await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 });
          } catch {
            return file;
          }
        })
      );

      const formData = new FormData();
      processed.forEach((file) => formData.append("images", file));

      const uploadRes = await postRequest("/home-media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (!uploadRes.success) throw new Error("Upload failed");

      const created: MediaItem[] = [];
      for (let i = 0; i < uploadRes.urls.length; i++) {
        const res = await postRequest("/home-media", {
          slot: slot.key,
          url: uploadRes.urls[i],
          title: titleFromFilename(files[i]?.name || "photo"),
          alt: ""
        });
        if (res.success) created.push(res.item);
      }

      setItems((prev) => [...prev, ...created]);
      toast.success(
        created.length === 1
          ? `Photo added to ${slot.label}.`
          : `${created.length} photos added to ${slot.label}.`
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload photos.");
    } finally {
      setUploadingSlot(null);
      const input = fileInputs.current[slot.key];
      if (input) input.value = "";
    }
  };

  const handleToggle = async (item: MediaItem) => {
    setBusyId(item._id);
    const next = !item.isActive;
    setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, isActive: next } : i)));
    try {
      await patchRequest(`/home-media/${item._id}/toggle`);
      toast.success(next ? `"${item.title}" is now live.` : `"${item.title}" hidden from the site.`);
    } catch {
      setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, isActive: !next } : i)));
      toast.error("Could not change visibility.");
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (slotKey: string, index: number, direction: -1 | 1) => {
    const list = itemsForSlot(slotKey);
    const target = index + direction;
    if (target < 0 || target >= list.length) return;

    const reordered = [...list];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const payload = reordered.map((item, i) => ({ id: item._id, order: i }));

    setItems((prev) =>
      prev.map((item) => {
        const match = payload.find((p) => p.id === item._id);
        return match ? { ...item, order: match.order } : item;
      })
    );

    try {
      await putRequest("/home-media/reorder", { items: payload });
    } catch {
      toast.error("Could not save the new order.");
      loadAll();
    }
  };

  const openEdit = (item: MediaItem) => {
    setEditing(item);
    setEditTitle(item.title);
    setEditAlt(item.alt || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const title = editTitle.trim();
    if (!title) {
      toast.error("A name is required.");
      return;
    }

    setSavingEdit(true);
    try {
      const res = await putRequest(`/home-media/${editing._id}`, { title, alt: editAlt.trim() });
      if (res.success) {
        setItems((prev) => prev.map((i) => (i._id === editing._id ? res.item : i)));
        setEditing(null);
        toast.success("Photo details updated.");
      }
    } catch {
      toast.error("Failed to save changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteRequest(`/home-media/${deleteId}`);
      setItems((prev) => prev.filter((i) => i._id !== deleteId));
      setDeleteId(null);
      toast.success("Photo removed.");
    } catch {
      toast.error("Failed to remove the photo.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] flex-col gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
        <span className="text-[10px] uppercase tracking-widest text-[#351E28]/40 font-mono">
          Loading homepage media...
        </span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6 text-left custom-scrollbar pr-2 min-h-0">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[8px] tracking-widest uppercase text-luxury-gold font-bold font-mono">
            storefront journey
          </span>
          <h1 className="font-serif text-2xl text-[#351E28] mt-1">Homepage Media</h1>
          <p className="text-[11px] text-[#351E28]/55 mt-1.5 max-w-2xl leading-relaxed">
            The photographs shown inside the 3D showroom on the website homepage. Each group below
            says exactly where its photos appear as a visitor scrolls through the journey.
          </p>
        </div>

        <a
          href={SITE_URL}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 flex items-center gap-1.5 border border-[#351E28]/15 hover:border-luxury-gold text-[#351E28] px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" /> View homepage
        </a>
      </div>

      {orderedSlots.map((slot) => {
        const slotItems = itemsForSlot(slot.key);
        const activeItems = slotItems.filter((i) => i.isActive);
        const isUploading = uploadingSlot === slot.key;

        return (
          <section
            key={slot.key}
            className="rounded-2xl border border-luxury-border bg-white/60 backdrop-blur-md shadow-[0_8px_32px_rgba(53,30,40,0.03)] overflow-hidden"
          >
            <div className="p-5 border-b border-luxury-border flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="min-w-0 flex gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-luxury-gold/12 border border-luxury-gold/35 flex flex-col items-center justify-center leading-none">
                  <span className="text-[6.5px] uppercase tracking-widest font-bold font-mono text-luxury-gold/70">
                    Ch
                  </span>
                  <span className="font-serif text-base text-luxury-gold">{slot.chapterNumber}</span>
                </div>

                <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h2 className="font-serif text-lg text-[#351E28] leading-none">{slot.label}</h2>
                  <span className="text-[8px] uppercase tracking-widest font-bold font-mono text-luxury-gold border border-luxury-gold/40 bg-luxury-gold/10 rounded-full px-2 py-0.5">
                    {slot.chapter}
                  </span>
                </div>
                <p className="text-[11px] text-[#351E28]/70 leading-relaxed max-w-3xl">
                  {slot.placement}
                </p>
                <p className="text-[10.5px] text-[#351E28]/50 leading-relaxed max-w-3xl mt-1.5">
                  {slot.guidance} {slot.aspect}
                </p>
                <div className="flex flex-wrap gap-3 mt-2.5 text-[8.5px] uppercase tracking-widest font-bold font-mono text-[#351E28]/45">
                  <span>Recommended: {slot.recommended}</span>
                  <span>
                    Live now: {activeItems.length}
                    {slot.maxUsed && activeItems.length > slot.maxUsed
                      ? ` (only the first ${slot.maxUsed} are shown)`
                      : ""}
                  </span>
                </div>
                </div>
              </div>

              <div className="shrink-0">
                <input
                  ref={(el) => {
                    fileInputs.current[slot.key] = el;
                  }}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(slot, e.target.files)}
                />
                <button
                  onClick={() => fileInputs.current[slot.key]?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 bg-luxury-gold hover:opacity-90 disabled:opacity-60 text-black px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Add photos
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-5">
              {slotItems.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 text-[#351E28]/35">
                  <ImageOff className="w-6 h-6" />
                  <span className="text-[10px] uppercase tracking-widest font-mono text-center">
                    No photos yet — the site falls back to its built-in defaults
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                  {slotItems.map((item, index) => {
                    const shown =
                      item.isActive &&
                      (!slot.maxUsed || activeItems.indexOf(item) < slot.maxUsed);

                    return (
                      <div
                        key={item._id}
                        className={`rounded-xl border overflow-hidden bg-white transition-all ${
                          item.isActive
                            ? "border-luxury-gold/40 shadow-sm"
                            : "border-[#351E28]/10 opacity-55"
                        }`}
                      >
                        <div className="relative aspect-4/5 bg-[#351E28]/5">
                          <img
                            src={resolveSiteMedia(item.url)}
                            alt={item.alt || item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute top-1.5 left-1.5 text-[8px] font-bold font-mono bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center">
                            {index + 1}
                          </span>
                          {item.isActive && !shown && (
                            <span className="absolute top-1.5 right-1.5 text-[7.5px] font-bold uppercase tracking-wider bg-black/70 text-white/90 rounded-full px-2 py-0.5">
                              Spare
                            </span>
                          )}
                        </div>

                        <div className="p-2.5 space-y-2">
                          <p
                            className="text-[10.5px] font-semibold text-[#351E28] truncate"
                            title={item.title}
                          >
                            {item.title}
                          </p>

                          <button
                            onClick={() => handleToggle(item)}
                            disabled={busyId === item._id}
                            className={`w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[8.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              item.isActive
                                ? "bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/20"
                                : "bg-[#351E28]/8 text-[#351E28]/50 hover:bg-[#351E28]/15"
                            }`}
                          >
                            {item.isActive ? (
                              <>
                                <Eye className="w-3 h-3" /> Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" /> Inactive
                              </>
                            )}
                          </button>

                          <div className="flex items-center justify-between gap-1">
                            <div className="flex gap-0.5">
                              <button
                                onClick={() => handleMove(slot.key, index, -1)}
                                disabled={index === 0}
                                className="p-1.5 rounded-md text-[#351E28]/50 hover:text-[#351E28] hover:bg-[#351E28]/5 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                                title="Move earlier"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMove(slot.key, index, 1)}
                                disabled={index === slotItems.length - 1}
                                className="p-1.5 rounded-md text-[#351E28]/50 hover:text-[#351E28] hover:bg-[#351E28]/5 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                                title="Move later"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex gap-0.5">
                              <button
                                onClick={() => openEdit(item)}
                                className="p-1.5 rounded-md text-[#351E28]/50 hover:text-[#351E28] hover:bg-[#351E28]/5 cursor-pointer"
                                title="Rename"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteId(item._id)}
                                className="p-1.5 rounded-md text-[#351E28]/40 hover:text-red-500 hover:bg-red-500/5 cursor-pointer"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })}

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title="Photo Details"
        subtitle="Homepage Media Slot"
        maxWidthClassName="max-w-md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-5">
          {/* Visual preview of the media item being edited */}
          {editing && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#351E28]/5 border border-[#351E28]/10">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-[#351E28]/10 shrink-0 flex items-center justify-center">
                <img
                  src={resolveSiteMedia(editing.url)}
                  alt={editing.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-mono tracking-wider text-luxury-gold font-bold block">
                  Slot: {editing.slot}
                </span>
                <span className="text-xs font-serif font-semibold text-[#351E28] truncate block">
                  {editing.title || "Untitled"}
                </span>
                <span className="text-[10px] text-[#351E28]/50 block font-mono">
                  Display Order: #{editing.order + 1}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-[#351E28]/70 mb-1.5 font-bold font-mono">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 transition-all font-sans"
              placeholder="e.g. Royal Peacock Drops"
              required
            />
            <p className="text-[10px] text-[#351E28]/45 mt-1">
              Internal label shown here in the admin catalog to identify this asset.
            </p>
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-[#351E28]/70 mb-1.5 font-bold font-mono">
              Alt Text / Accessibility Caption
            </label>
            <textarea
              rows={3}
              value={editAlt}
              onChange={(e) => setEditAlt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 transition-all leading-relaxed"
              placeholder="e.g. Handcrafted 22K gold necklace with fine uncut diamonds and pearls"
            />
            <p className="text-[10px] text-[#351E28]/45 mt-1">
              Helps with storefront screen readers and SEO rankings.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#351E28]/10">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-6 py-2.5 rounded-full border border-[#351E28]/15 bg-white text-[#351E28] hover:bg-[#351E28]/5 text-xs tracking-wider uppercase font-semibold transition-all cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="bg-[#C8A96A] hover:bg-[#B89858] text-[#351E28] px-6 py-2.5 rounded-full text-xs tracking-wider uppercase font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove Photo"
        message="This removes the photo from the homepage and deletes the uploaded file. This cannot be undone."
      />
    </div>
  );
}
