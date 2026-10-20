import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2, FolderTree, Image as ImageIcon, Tag, Sparkles } from "lucide-react";
import { getRequest, postRequest, putRequest, deleteRequest } from "../services/api";
import Table from "../components/ui/Table";
import Modal from "../components/ui/Modal";
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
      header: "Category",
      render: (cat: any) => (
        <div className="flex items-center gap-3">
          {cat.image ? (
            <img
              src={cat.image}
              alt={cat.name}
              className="w-9 h-9 rounded-xl object-cover border border-[#351E28]/10 bg-white shadow-xs shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-luxury-gold/10 border border-luxury-gold/25 flex items-center justify-center text-luxury-gold shrink-0">
              <FolderTree className="w-4 h-4" />
            </div>
          )}
          <div>
            <span className="font-serif text-sm font-semibold text-[#351E28] block">
              {cat.name}
            </span>
            <span className="font-mono text-[10px] text-[#351E28]/50 block">
              /{cat.slug}
            </span>
          </div>
        </div>
      )
    },
    {
      header: "Description & Sizes",
      render: (cat: any) => (
        <div className="text-left font-sans text-xs text-[#351E28]/70 max-w-sm">
          <div className="truncate">{cat.description || "—"}</div>
          {cat.sizes && cat.sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {cat.sizes.slice(0, 5).map((s: string) => (
                <span key={s} className="px-1.5 py-0.5 rounded-md bg-[#351E28]/5 text-[#351E28]/80 font-mono text-[9px]">
                  {s}
                </span>
              ))}
              {cat.sizes.length > 5 && (
                <span className="text-[9px] text-[#351E28]/50 font-mono self-center">
                  +{cat.sizes.length - 5} more
                </span>
              )}
              {cat.allowCustomSize && (
                <span className="px-1.5 py-0.5 rounded-md bg-luxury-gold/15 text-[#9A7432] font-mono text-[9px] font-bold">
                  + Custom
                </span>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (cat: any) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => openEditModal(cat)}
            className="p-2 rounded-xl hover:bg-[#351E28]/5 text-[#351E28]/70 hover:text-luxury-gold transition-colors cursor-pointer"
            title="Edit Category"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirmId(cat._id)}
            className="p-2 rounded-xl hover:bg-red-50 text-[#351E28]/50 hover:text-red-600 transition-colors cursor-pointer"
            title="Delete Category"
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
          <span className="text-[9px] tracking-[0.25em] uppercase text-luxury-gold font-bold font-mono">
            System Taxonomy
          </span>
          <h1 className="font-serif text-2xl md:text-3xl text-[#351E28] font-normal mt-1">
            Categories Directory
          </h1>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#C8A96A] hover:bg-[#B89858] text-[#351E28] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer hover:scale-102 active:scale-98"
        >
          <Plus className="w-4 h-4" /> Add Category Folder
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
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === "create" ? "Add Category Folder" : "Edit Category Folder"}
        subtitle="Catalog Taxonomy"
        maxWidthClassName="max-w-lg"
      >
        {formError && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* Category Name */}
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-[#351E28]/70 mb-1.5 font-bold font-mono">
              Category Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FolderTree className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 transition-all"
                placeholder="e.g. Rings, Necklaces, Bracelets"
                required
              />
            </div>
          </div>

          {/* Category Image URL */}
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-[#351E28]/70 mb-1.5 font-bold font-mono">
              Image URL <span className="text-[9px] text-[#351E28]/40 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 transition-all font-mono"
                placeholder="https://images.unsplash.com/... or /uploads/..."
              />
            </div>
            {/* Live image preview if filled */}
            {image && (
              <div className="mt-2.5 flex items-center gap-3 p-2 rounded-xl bg-[#351E28]/3 border border-[#351E28]/10">
                <img
                  src={image}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-[#351E28]/10 bg-white shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.opacity = "0.3";
                  }}
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-[#351E28] block">Live Image Preview</span>
                  <span className="text-[9px] text-[#351E28]/50 truncate block max-w-xs font-mono">{image}</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-[#351E28]/70 mb-1.5 font-bold font-mono">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 transition-all leading-relaxed"
              placeholder="Artisan category description for catalog presentation..."
            />
          </div>

          {/* Available Sizes Tags */}
          <div className="p-4 rounded-2xl bg-[#351E28]/3 border border-[#351E28]/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] tracking-[0.15em] uppercase text-[#351E28]/70 font-bold font-mono">
                Standard Sizes (Tags)
              </label>
              <span className="text-[9px] text-[#351E28]/40 font-mono">
                {sizes.length} tags added
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-[#351E28]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  placeholder="e.g. 5, 6, 7, Small, Medium, 18-inch"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleAddSizeTag}
                className="bg-[#351E28] hover:bg-[#351E28]/90 text-white hover:text-luxury-gold px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shrink-0"
              >
                + Add Tag
              </button>
            </div>

            {sizes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sizes.map((sz) => (
                  <span
                    key={sz}
                    className="inline-flex items-center gap-1.5 bg-white border border-[#351E28]/12 text-[#351E28] px-2.5 py-1 rounded-lg text-xs font-mono shadow-2xs"
                  >
                    <span>{sz}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSizeTag(sz)}
                      className="text-[#351E28]/40 hover:text-red-500 font-bold text-sm leading-none transition-colors cursor-pointer"
                      title="Remove size"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-[#351E28]/40 italic">
                No preset sizes specified yet. Products in this category will default to their own sizes.
              </p>
            )}
          </div>

          {/* Custom Size Checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#351E28]/10 cursor-pointer hover:border-luxury-gold/40 transition-colors">
            <input
              type="checkbox"
              checked={allowCustomSize}
              onChange={(e) => setAllowCustomSize(e.target.checked)}
              className="w-4 h-4 rounded text-luxury-gold accent-luxury-gold cursor-pointer"
            />
            <div className="text-left select-none">
              <span className="block text-xs font-bold text-[#351E28]">
                Allow Custom Sizes for this Category
              </span>
              <span className="block text-[10px] text-[#351E28]/50">
                Customers can request bespoke measurements when ordering products in this category.
              </span>
            </div>
          </label>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#351E28]/10">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-2.5 rounded-full border border-[#351E28]/15 bg-white text-[#351E28] hover:bg-[#351E28]/5 text-xs tracking-wider uppercase font-semibold transition-all cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="bg-[#C8A96A] hover:bg-[#B89858] text-[#351E28] px-6 py-2.5 rounded-full text-xs tracking-wider uppercase font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {formLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Popup */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteCategory}
        loading={deleteLoading}
        title="Retire Category Folder"
        message="Are you sure you want to delete this category? Products mapped to this folder will lose their category association."
      />
    </div>
  );
}
