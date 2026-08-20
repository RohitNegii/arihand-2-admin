import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2, AlertTriangle, X } from "lucide-react";
import { getRequest, postRequest, putRequest, deleteRequest } from "../services/api";
import Table from "../components/ui/Table";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal";

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [allowCustomSize, setAllowCustomSize] = useState(false);
  const [newSizeTag, setNewSizeTag] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAddSizeTag = () => {
    const cleanTag = newSizeTag.trim();
    if (!cleanTag) return;
    if (sizes.map(s => s.toLowerCase()).includes(cleanTag.toLowerCase())) {
      setFormError(`Size tag "${cleanTag}" is already added.`);
      return;
    }
    if (cleanTag.length > 30) {
      setFormError("Size tag must be 30 characters or less.");
      return;
    }
    setFormError("");
    setSizes([...sizes, cleanTag]);
    setNewSizeTag("");
  };

  const handleRemoveSizeTag = (tag: string) => {
    setSizes(sizes.filter((s) => s !== tag));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getRequest("/categories");
      if (res.success) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setName("");
    setDescription("");
    setImage("");
    setSizes([]);
    setAllowCustomSize(false);
    setNewSizeTag("");
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (cat: any) => {
    setModalMode("edit");
    setEditingId(cat._id);
    setName(cat.name);
    setDescription(cat.description || "");
    setImage(cat.image || "");
    setSizes(cat.sizes || []);
    setAllowCustomSize(!!cat.allowCustomSize);
    setNewSizeTag("");
    setFormError("");
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const trimmedImage = image.trim();

    if (!trimmedName) {
      setFormError("Category name is required.");
      return;
    }

    if (trimmedImage && !trimmedImage.match(/^(https?:\/\/|\/|.\/)/)) {
      setFormError("Image URL must start with http://, https://, or a relative path.");
      return;
    }

    let finalSizes = [...sizes];
    const cleanTag = newSizeTag.trim();
    if (cleanTag) {
      if (sizes.map(s => s.toLowerCase()).includes(cleanTag.toLowerCase())) {
        setFormError(`Size tag "${cleanTag}" is already added.`);
        return;
      }
      if (cleanTag.length > 30) {
        setFormError("Size tag must be 30 characters or less.");
        return;
      }
      finalSizes.push(cleanTag);
    }

    setFormLoading(true);
    setFormError("");

    const payload = {
      name: trimmedName,
      description: trimmedDesc,
      image: trimmedImage,
      sizes: finalSizes,
      allowCustomSize
    };

    try {
      if (modalMode === "create") {
        await postRequest("/categories", payload);
      } else {
        await putRequest(`/categories/${editingId}`, payload);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to save category.");
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    try {
      await deleteRequest(`/categories/${deleteConfirmId}`);
      setDeleteConfirmId(null);
      fetchCategories();
    } catch (err) {
      console.error("Failed to delete category", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: "Name",
      render: (cat: any) => (
        <span className="font-serif text-sm font-light text-left text-[#351E28] block">
          {cat.name}
        </span>
      )
    },
    {
      header: "Slug Identifier",
      className: "font-mono text-left text-white/60",
      render: (cat: any) => <span>{cat.slug}</span>
    },
    {
      header: "Description",
      render: (cat: any) => (
        <div className="text-left font-sans text-xs text-white/70 max-w-sm">
          <div className="truncate">{cat.description || "—"}</div>
          {cat.sizes && cat.sizes.length > 0 && (
            <div className="text-luxury-gold text-[8.5px] uppercase font-bold tracking-wider mt-1">
              Sizes: {cat.sizes.join(", ")} {cat.allowCustomSize && "(+ Custom)"}
            </div>
          )}
        </div>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (cat: any) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEditModal(cat)}
            className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirmId(cat._id)}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full space-y-6 text-left min-h-0 overflow-hidden">

      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[8px] tracking-widest uppercase text-luxury-gold font-bold font-mono">system schema</span>
          <h1 className="font-serif text-2xl text-white mt-1">Categories Directory</h1>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 bg-luxury-gold hover:opacity-90 text-black px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* List Table */}
      <div className="flex-1 min-h-0">
        <Table
          columns={columns}
          data={categories}
          loading={loading}
          emptyMessage="No categories registered."
        />
      </div>

      {/* CRUD Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="glass-card rounded-3xl p-6 md:p-8 max-w-md w-full border border-white/10 relative text-left">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-lg text-white mb-6">
              {modalMode === "create" ? "Add Category Folder" : "Edit Category Folder"}
            </h2>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-[9px] uppercase tracking-wider">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div>
                <label className="block text-[8.5px] tracking-wider uppercase text-white/50 mb-1.5 font-semibold">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-white/8 text-xs text-white focus:border-luxury-gold focus:outline-hidden"
                  placeholder="Rings, Necklaces"
                  required
                />
              </div>

              <div>
                <label className="block text-[8.5px] tracking-wider uppercase text-white/50 mb-1.5 font-semibold">Image URL (Optional)</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-white/8 text-xs text-white focus:border-luxury-gold focus:outline-hidden font-mono"
                  placeholder="https://cloudinary.com/..."
                />
              </div>

              <div>
                <label className="block text-[8.5px] tracking-wider uppercase text-white/50 mb-1.5 font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-white/8 text-xs text-white focus:border-luxury-gold focus:outline-hidden"
                  placeholder="Artisan description..."
                />
              </div>

              <div>
                <label className="block text-[8.5px] tracking-wider uppercase text-white/50 mb-1.5 font-semibold">Available Sizes (Tags)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSizeTag}
                    onChange={(e) => setNewSizeTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSizeTag();
                      }
                    }}
                    placeholder="E.g. XS, S, M, L, or 5, 6, 7"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/3 border border-white/8 text-xs text-white focus:border-luxury-gold focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddSizeTag}
                    className="bg-luxury-gold hover:opacity-90 text-black px-4 py-2 rounded-lg text-[9px] uppercase font-bold tracking-wider font-sans cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {sizes.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-white/5 bg-white/2 max-h-36 overflow-y-auto">
                    {sizes.map((sz) => (
                      <span key={sz} className="inline-flex items-center gap-1 bg-white/5 border border-white/10 text-white/80 px-2 py-0.5 rounded-sm text-[9px] font-mono">
                        {sz}
                        <button
                          type="button"
                          onClick={() => handleRemoveSizeTag(sz)}
                          className="text-red-400 hover:text-red-600 font-bold ml-0.5"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-white/30 italic">No default sizes configured.</p>
                )}
              </div>

              <div className="flex items-center gap-2 select-none cursor-pointer text-white/80 font-mono text-[9px] uppercase tracking-wider py-1">
                <label className="flex items-center gap-2 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCustomSize}
                    onChange={(e) => setAllowCustomSize(e.target.checked)}
                    className="accent-luxury-gold"
                  />
                  Allow Custom Sizes for this Category
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-full border border-white/10 text-white text-[9px] tracking-wider uppercase font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-luxury-gold hover:opacity-90 text-black px-5 py-2 rounded-full text-[9px] tracking-wider uppercase font-bold flex items-center justify-center gap-1 shadow-md"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Popup */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteCategory}
        loading={deleteLoading}
        title="Retire Category Folder"
        message="Are you sure you want to delete this category? Products mapped to this will lose their reference."
      />
    </div>
  );
}
