import React, { useState, useEffect } from "react";
import {
  Upload,
  Loader2,
  Sparkles,
  Gem,
  Ruler,
  FileText,
  Image as ImageIcon,
  Star,
  Flame,
  Trophy,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Layers,
  IndianRupee,
  AlertCircle,
  Video
} from "lucide-react";
import Modal from "../ui/Modal";
import { postRequest, putRequest, getImageUrl } from "../../services/api";
import { getSizeConfigByCategoryName, DEFAULT_SIZE_CONFIG } from "../../config/sizeConfig";
import { compressImage } from "../../utils/imageCompressor";

const isVideoUrl = (url: string) => {
  if (!url) return false;
  const ext = url.split(".").pop()?.toLowerCase();
  return ["mp4", "webm", "ogg", "mov"].includes(ext || "");
};

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  product: any | null;
  categories: any[];
}

type FormTab = "core" | "pricing" | "craft" | "sizing" | "story" | "gallery";

export default function ProductFormModal({
  isOpen,
  onClose,
  onSaveSuccess,
  product,
  categories
}: ProductFormModalProps) {
  // Active Tab
  const [activeTab, setActiveTab] = useState<FormTab>("core");

  // Form Internal States
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [material, setMaterial] = useState("Gold");
  const [purity, setPurity] = useState("18K");
  const [weight, setWeight] = useState(0);
  const [dimensions, setDimensions] = useState("");
  const [gender, setGender] = useState<"Men" | "Women" | "Unisex">("Unisex");
  const [occasion, setOccasion] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [status, setStatus] = useState<"Draft" | "Published">("Draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [allowCustomSize, setAllowCustomSize] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);
  const [newSizeTag, setNewSizeTag] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [variantUploadingIndex, setVariantUploadingIndex] = useState<number | null>(null);

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    const cat = categories.find((c) => c._id === newCatId);
    if (cat) {
      setSizes(cat.sizes || []);
      setAllowCustomSize(!!cat.allowCustomSize);
    }
  };

  const handleToggleStandardSize = (size: string) => {
    if (sizes.includes(size)) {
      setSizes(sizes.filter((s) => s !== size));
    } else {
      setSizes([...sizes, size]);
    }
  };

  const handleAddSizeTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTag = newSizeTag.trim();
    if (!cleanTag) return;
    if (sizes.map((s) => s.toLowerCase()).includes(cleanTag.toLowerCase())) {
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

  // Sync props data to form states
  useEffect(() => {
    if (isOpen) {
      setActiveTab("core");
      if (product) {
        setName(product.name || "");
        setSku(product.sku || "");
        setDescription(product.description || "");
        setShortDescription(product.shortDescription || "");
        setCategoryId(product.category?._id || product.category || categories[0]?._id || "");
        setMaterial(product.material || "Gold");
        setPurity(product.purity || "18K");
        setWeight(product.weight || 0);
        setDimensions(product.dimensions || "");
        setGender(product.gender || "Unisex");
        setOccasion(product.occasion || "");
        setPrice(product.price || 0);
        setStock(product.stock || 0);
        setStatus(product.status || "Draft");
        setIsFeatured(!!product.isFeatured);
        setIsTrending(!!product.isTrending);
        setIsBestSeller(!!product.isBestSeller);
        setImages(product.images || []);
        setThumbnail(product.thumbnail || "");
        setSizes(product.sizes || []);
        setAllowCustomSize(!!product.allowCustomSize);
        setHasVariants(!!product.hasVariants);
        setVariants(product.variants || []);
      } else {
        setName("");
        setSku("");
        setDescription("");
        setShortDescription("");
        setCategoryId(categories[0]?._id || categories[0] || "");
        setMaterial("Gold");
        setPurity("18K");
        setWeight(0);
        setDimensions("");
        setGender("Unisex");
        setOccasion("");
        setPrice(0);
        setStock(0);
        setStatus("Draft");
        setIsFeatured(false);
        setIsTrending(false);
        setIsBestSeller(false);
        setImages([]);
        setThumbnail("");
        setSizes([]);
        setAllowCustomSize(false);
        setHasVariants(false);
        setVariants([]);
      }
      setNewSizeTag("");
      setFormError("");
    }
  }, [product, categories, isOpen]);

  // Image/Media Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setImageUploading(true);
    setFormError("");
    const files = Array.from(e.target.files);

    const maxLimit = 50 * 1024 * 1024;
    const oversized = files.filter((f) => f.size > maxLimit);
    if (oversized.length > 0) {
      setFormError("Failed to upload. Some files exceed the maximum limit of 50MB.");
      setImageUploading(false);
      return;
    }

    try {
      setUploadStatus("Compressing...");
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            return await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
          } catch (compressErr) {
            console.error("Client compression error for:", file.name, compressErr);
            return file;
          }
        })
      );

      setUploadStatus("Uploading...");
      const formData = new FormData();
      processedFiles.forEach((file) => formData.append("images", file));

      const res = await postRequest("/products/upload-images", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.success) {
        const uploadedUrls = res.urls;
        setImages((prev) => {
          const updated = [...prev, ...uploadedUrls];
          if (!thumbnail && updated.length > 0) {
            setThumbnail(updated[0]);
          }
          return updated;
        });
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to upload images.");
    } finally {
      setImageUploading(false);
      setUploadStatus("");
    }
  };

  const handleRemoveImage = (urlToRemove: string) => {
    const updated = images.filter((img) => img !== urlToRemove);
    setImages(updated);
    if (thumbnail === urlToRemove) {
      setThumbnail(updated[0] || "");
    }
  };

  const handleDragImage = (index: number, direction: "left" | "right") => {
    if (direction === "left" && index === 0) return;
    if (direction === "right" && index === images.length - 1) return;

    const targetIndex = direction === "left" ? index - 1 : index + 1;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setImages(updated);
  };

  const handleVariantImageUpload = async (variantIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setVariantUploadingIndex(variantIdx);
    setFormError("");
    const files = Array.from(e.target.files);

    const maxLimit = 50 * 1024 * 1024;
    const oversized = files.filter((f) => f.size > maxLimit);
    if (oversized.length > 0) {
      setFormError("Failed to upload. Some files exceed the maximum limit of 50MB.");
      setVariantUploadingIndex(null);
      return;
    }

    try {
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            return await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
          } catch (compressErr) {
            return file;
          }
        })
      );

      const formData = new FormData();
      processedFiles.forEach((file) => formData.append("images", file));

      const res = await postRequest("/products/upload-images", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.success) {
        const uploadedUrls = res.urls;
        setVariants((prev) => {
          const updated = [...prev];
          const currentImages = updated[variantIdx]?.images || [];
          updated[variantIdx] = {
            ...updated[variantIdx],
            images: [...currentImages, ...uploadedUrls]
          };
          return updated;
        });
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to upload variant media.");
    } finally {
      setVariantUploadingIndex(null);
    }
  };

  const handleRemoveVariantImage = (variantIdx: number, urlToRemove: string) => {
    setVariants((prev) => {
      const updated = [...prev];
      const currentImages = updated[variantIdx]?.images || [];
      updated[variantIdx] = {
        ...updated[variantIdx],
        images: currentImages.filter((img: string) => img !== urlToRemove)
      };
      return updated;
    });
  };

  // Submit product creation/editing payload
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isPriceRequired = !hasVariants;
    const trimmedName = name.trim();
    const trimmedSku = sku.trim();
    const trimmedShortDesc = shortDescription.trim();
    const trimmedDesc = description.trim();

    if (!trimmedName) {
      setFormError("Product Name is required.");
      setActiveTab("core");
      return;
    }

    if (!trimmedSku) {
      setFormError("SKU Code is required.");
      setActiveTab("core");
      return;
    }

    if (!categoryId) {
      setFormError("Category is required.");
      setActiveTab("core");
      return;
    }

    if (!material) {
      setFormError("Material type is required.");
      setActiveTab("craft");
      return;
    }

    if (!purity) {
      setFormError("Purity is required.");
      setActiveTab("craft");
      return;
    }

    if (weight === undefined || weight === null || isNaN(weight) || weight <= 0) {
      setFormError("Product weight is required and must be greater than 0g.");
      setActiveTab("craft");
      return;
    }

    if (isPriceRequired) {
      if (price === undefined || price === null || isNaN(price) || price <= 0) {
        setFormError("Base price is required and must be greater than 0.");
        setActiveTab("pricing");
        return;
      }
      if (stock === undefined || stock === null || isNaN(stock) || stock < 0) {
        setFormError("Stock quantity is required and cannot be negative.");
        setActiveTab("pricing");
        return;
      }
    }

    if (hasVariants) {
      if (variants.length === 0) {
        setFormError("Please add at least one variant option if variants are enabled.");
        setActiveTab("pricing");
        return;
      }
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.name || !v.name.trim()) {
          setFormError(`Variant #${i + 1} must have a name.`);
          setActiveTab("pricing");
          return;
        }
        if (v.price === undefined || v.price === null || isNaN(v.price) || v.price <= 0) {
          setFormError(`Price for variant '${v.name}' must be greater than 0.`);
          setActiveTab("pricing");
          return;
        }
        if (v.stock === undefined || v.stock === null || isNaN(v.stock) || v.stock < 0) {
          setFormError(`Stock for variant '${v.name}' cannot be negative.`);
          setActiveTab("pricing");
          return;
        }
      }
    }

    if (!trimmedShortDesc) {
      setFormError("Short Description is required.");
      setActiveTab("story");
      return;
    }

    if (!trimmedDesc) {
      setFormError("Long Description is required.");
      setActiveTab("story");
      return;
    }

    if (images.length === 0) {
      setFormError("Please upload at least one gallery image or media file.");
      setActiveTab("gallery");
      return;
    }

    let finalSizes = [...sizes];
    const cleanTag = newSizeTag.trim();
    if (cleanTag) {
      if (sizes.map((s) => s.toLowerCase()).includes(cleanTag.toLowerCase())) {
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
      sku: trimmedSku.toUpperCase(),
      description: trimmedDesc,
      shortDescription: trimmedShortDesc,
      categoryId,
      material: material.trim(),
      purity: purity.trim(),
      weight,
      dimensions: dimensions.trim(),
      gender,
      occasion: occasion.trim(),
      price: hasVariants ? undefined : price,
      stock: hasVariants ? 0 : stock,
      status,
      isFeatured,
      isTrending,
      isBestSeller,
      images,
      thumbnail,
      sizes: finalSizes,
      allowCustomSize,
      hasVariants,
      variants: hasVariants
        ? variants.map((v) => ({
            name: v.name.trim(),
            price: v.price,
            stock: v.stock,
            sku: v.sku ? v.sku.toUpperCase().trim() : undefined,
            images: Array.isArray(v.images) ? v.images : [],
            video: v.video ? v.video.trim() : undefined
          }))
        : []
    };

    try {
      if (!product) {
        await postRequest("/products", payload);
      } else {
        await putRequest(`/products/${product._id}`, payload);
      }
      onSaveSuccess();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to save product details.");
    } finally {
      setFormLoading(false);
    }
  };

  const tabs: { id: FormTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "core", label: "Core Specs", icon: Sparkles },
    { id: "pricing", label: "Pricing & Stock", icon: IndianRupee },
    { id: "craft", label: "Craftsmanship", icon: Gem },
    { id: "sizing", label: "Size Settings", icon: Ruler },
    { id: "story", label: "Storytelling", icon: FileText },
    { id: "gallery", label: `Gallery (${images.length})`, icon: ImageIcon }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={!product ? "Create Fine Masterpiece" : `Edit Jewelry: ${product.name || "Masterpiece"}`}
      subtitle="Fine Catalog Editor"
      maxWidthClassName="max-w-4xl"
      scrollable={false}
    >
      {formError && (
        <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 shrink-0 animate-shake shadow-2xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span className="flex-1">{formError}</span>
        </div>
      )}

      {/* Segmented Navigation Tab Bar */}
      <div className="shrink-0 flex items-center gap-1.5 p-1 rounded-2xl bg-[#351E28]/5 border border-[#351E28]/10 mb-5 overflow-x-auto custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-white text-[#351E28] shadow-xs border border-[#C8A96A]/30 text-luxury-gold"
                  : "text-[#351E28]/60 hover:text-[#351E28] hover:bg-white/40"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#C8A96A]" : "text-[#351E28]/50"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form wrapping body & footer */}
      <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0">
        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto pr-2 pb-2 custom-scrollbar space-y-6">
          
          {/* TAB 1: Core Specifications */}
          {activeTab === "core" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-2 border-b border-[#351E28]/10">
                <Sparkles className="w-4 h-4 text-luxury-gold" />
                <h3 className="font-serif text-base text-[#351E28] font-semibold">
                  1. Core Product Specifications
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item Name */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-1.5">
                    Masterpiece Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 font-sans"
                    placeholder="e.g. Royal Nizam Emerald & Polki Choker"
                    required
                  />
                </div>

                {/* SKU Code */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-1.5">
                    SKU Code Identifier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 font-mono uppercase"
                    placeholder="e.g. SOL-EM-PND-01"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-1.5">
                    Catalog Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] font-sans focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 cursor-pointer"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-1.5">
                    Publishing Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] font-sans focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 cursor-pointer font-medium"
                  >
                    <option value="Draft">Draft (Internal Only)</option>
                    <option value="Published">Published (Public Catalog)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Valuation & Stock */}
          {activeTab === "pricing" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-2 border-b border-[#351E28]/10">
                <IndianRupee className="w-4 h-4 text-luxury-gold" />
                <h3 className="font-serif text-base text-[#351E28] font-semibold">
                  2. Pricing, Inventory & Variants
                </h3>
              </div>

              {/* Standard Price & Stock fields (if variants disabled) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!hasVariants && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-1.5">
                      Base Retail Price (INR) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#351E28]/40 font-mono font-bold text-xs pointer-events-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={0}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "+") e.preventDefault();
                        }}
                        value={price}
                        onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 font-mono"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className={hasVariants ? "md:col-span-2" : ""}>
                  <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-1.5">
                    Stock Quantity {hasVariants ? "(Aggregated by Variants)" : "*"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "+") e.preventDefault();
                    }}
                    value={stock}
                    onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-[#351E28]/15 text-xs text-[#351E28] font-mono focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 ${
                      hasVariants ? "bg-[#351E28]/5 opacity-60 cursor-not-allowed" : "bg-white"
                    }`}
                    placeholder="0"
                    required={!hasVariants}
                    disabled={hasVariants}
                  />
                  {hasVariants && (
                    <p className="text-[10px] text-[#351E28]/50 mt-1">
                      Individual stocks are controlled per variant option below.
                    </p>
                  )}
                </div>
              </div>

              {/* Product Variants Toggle Card */}
              <div className="p-5 rounded-2xl border border-[#351E28]/10 bg-[#351E28]/3 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#351E28] block font-sans">
                      Enable Multi-Option Product Variants
                    </span>
                    <span className="text-[10.5px] text-[#351E28]/60 block font-sans">
                      Create specific variations with unique pricing, stock overrides, SKUs, and media sets.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 ml-4">
                    <input
                      type="checkbox"
                      checked={hasVariants}
                      onChange={(e) => setHasVariants(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#351E28]/20 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#351E28]"></div>
                  </label>
                </div>

                {hasVariants && (
                  <div className="space-y-4 pt-2 border-t border-[#351E28]/10">
                    <div className="flex justify-between items-center">
                      <span className="text-xs uppercase tracking-wider font-bold text-[#9A7432] font-mono">
                        Configured Variant Options ({variants.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setVariants([
                            ...variants,
                            {
                              name: `Option ${String.fromCharCode(65 + variants.length)}`,
                              price: price || 0,
                              stock: stock || 0,
                              sku: sku ? `${sku}-${String.fromCharCode(65 + variants.length)}` : ""
                            }
                          ]);
                        }}
                        className="bg-[#351E28] hover:bg-[#2A161F] text-white hover:text-luxury-gold px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Variant Option
                      </button>
                    </div>

                    {variants.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-[#351E28]/20 rounded-2xl bg-white/40">
                        <Layers className="w-8 h-8 text-[#351E28]/30 mx-auto mb-2" />
                        <p className="text-xs text-[#351E28]/60">
                          No variants defined yet. Click &ldquo;+ Add Variant Option&rdquo; above.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                        {variants.map((v, index) => (
                          <div
                            key={index}
                            className="bg-white p-4 rounded-2xl border border-[#351E28]/12 space-y-3 shadow-2xs"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                              {/* Option Name */}
                              <div className="sm:col-span-4">
                                <label className="block text-[9px] uppercase text-[#351E28]/70 font-bold font-mono mb-1">
                                  Option Name *
                                </label>
                                <input
                                  type="text"
                                  value={v.name}
                                  onChange={(e) => {
                                    const newVars = [...variants];
                                    newVars[index].name = e.target.value;
                                    setVariants(newVars);
                                  }}
                                  placeholder="e.g. 18K Yellow Gold / Size 7"
                                  className="w-full px-3 py-2 rounded-xl bg-[#F7F2EE]/50 border border-[#351E28]/15 text-xs text-[#351E28] focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 font-sans"
                                  required
                                />
                              </div>

                              {/* Price override */}
                              <div className="sm:col-span-3">
                                <label className="block text-[9px] uppercase text-[#351E28]/70 font-bold font-mono mb-1">
                                  Price (INR) *
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#351E28]/40 font-mono text-xs">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    onKeyDown={(e) => {
                                      if (e.key === "-" || e.key === "+") e.preventDefault();
                                    }}
                                    value={v.price}
                                    onChange={(e) => {
                                      const newVars = [...variants];
                                      newVars[index].price = Math.max(0, parseFloat(e.target.value) || 0);
                                      setVariants(newVars);
                                    }}
                                    className="w-full pl-6 pr-2.5 py-2 rounded-xl bg-[#F7F2EE]/50 border border-[#351E28]/15 text-xs text-[#351E28] focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 font-mono"
                                    required
                                  />
                                </div>
                              </div>

                              {/* Stock override */}
                              <div className="sm:col-span-2">
                                <label className="block text-[9px] uppercase text-[#351E28]/70 font-bold font-mono mb-1">
                                  Stock *
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  onKeyDown={(e) => {
                                    if (e.key === "-" || e.key === "+") e.preventDefault();
                                  }}
                                  value={v.stock}
                                  onChange={(e) => {
                                    const newVars = [...variants];
                                    newVars[index].stock = Math.max(0, parseInt(e.target.value) || 0);
                                    setVariants(newVars);
                                  }}
                                  className="w-full px-2.5 py-2 rounded-xl bg-[#F7F2EE]/50 border border-[#351E28]/15 text-xs text-[#351E28] focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 font-mono"
                                  required
                                />
                              </div>

                              {/* SKU override */}
                              <div className="sm:col-span-2">
                                <label className="block text-[9px] uppercase text-[#351E28]/70 font-bold font-mono mb-1">
                                  SKU Override
                                </label>
                                <input
                                  type="text"
                                  value={v.sku || ""}
                                  onChange={(e) => {
                                    const newVars = [...variants];
                                    newVars[index].sku = e.target.value.toUpperCase();
                                    setVariants(newVars);
                                  }}
                                  placeholder="SKU-VAR"
                                  className="w-full px-2.5 py-2 rounded-xl bg-[#F7F2EE]/50 border border-[#351E28]/15 text-xs text-[#351E28] focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 font-mono uppercase"
                                />
                              </div>

                              {/* Delete Variant */}
                              <div className="sm:col-span-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVariants(variants.filter((_, i) => i !== index));
                                  }}
                                  className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                  title="Remove Variant"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Variant Specific Media Uploader */}
                            <div className="border-t border-[#351E28]/10 pt-2.5 flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-[#351E28]/70 font-mono">
                                  Variant Media ({v.images ? v.images.length : 0} items)
                                </span>
                                <div className="relative">
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={(e) => handleVariantImageUpload(index, e)}
                                    className="hidden"
                                    id={`variant-media-upload-${index}`}
                                  />
                                  <label
                                    htmlFor={`variant-media-upload-${index}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#351E28]/15 hover:border-luxury-gold hover:bg-[#351E28]/5 text-[10px] uppercase font-bold text-[#351E28] cursor-pointer transition-colors shadow-2xs"
                                  >
                                    <Upload className="w-3 h-3 text-luxury-gold" />
                                    <span className="text-[#351E28]">Upload Media</span>
                                  </label>
                                </div>
                              </div>

                              {variantUploadingIndex === index && (
                                <div className="flex items-center gap-2 text-xs text-luxury-gold font-bold py-1">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading variant files...
                                </div>
                              )}

                              {v.images && v.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {v.images.map((imgUrl: string, imgIdx: number) => (
                                    <div
                                      key={imgIdx}
                                      className="relative w-14 h-14 rounded-xl border border-[#351E28]/15 bg-[#F7F2EE]/50 flex items-center justify-center p-1 group overflow-hidden shadow-2xs"
                                    >
                                      {isVideoUrl(imgUrl) ? (
                                        <video
                                          src={getImageUrl(imgUrl)}
                                          className="max-h-full max-w-full object-contain"
                                          muted
                                          playsInline
                                        />
                                      ) : (
                                        <img
                                          src={getImageUrl(imgUrl)}
                                          alt={`Variant ${v.name} ${imgIdx}`}
                                          className="max-h-full max-w-full object-contain"
                                        />
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveVariantImage(index, imgUrl)}
                                        className="absolute inset-0 bg-red-900/80 text-white font-bold text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        title="Remove media from variant"
                                      >
                                        <Trash2 className="w-4 h-4 text-white" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Craftsmanship Specs */}
          {activeTab === "craft" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-2 border-b border-[#351E28]/10">
                <Gem className="w-4 h-4 text-luxury-gold" />
                <h3 className="font-serif text-base text-[#351E28] font-semibold">
                  3. Craftsmanship & Metal Attributes
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Metal Type */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-1.5">
                    Metal Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] font-sans focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 cursor-pointer"
                    required
                  >
                    {!["Gold", "Platinum", "Silver", "Rose Gold", "White Gold", "Brass"].includes(material) &&
                      material && <option value={material}>{material}</option>}
                    {["Gold", "Platinum", "Silver", "Rose Gold", "White Gold", "Brass"].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Purity */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-1.5">
                    Purity Stamp <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={purity}
                    onChange={(e) => setPurity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] font-sans focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 cursor-pointer"
                    required
                  >
                    {![
                      "18K",
                      "22K",
                      "14K",
                      "24K",
                      "950 Platinum",
                      "925 Sterling Silver"
                    ].includes(purity) &&
                      purity && <option value={purity}>{purity}</option>}
                    {["18K", "22K", "14K", "24K", "950 Platinum", "925 Sterling Silver"].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-1.5">
                    Weight (grams) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "+") e.preventDefault();
                    }}
                    value={weight}
                    onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 font-mono"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Dimensions */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-1.5">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25"
                    placeholder="e.g. 18mm x 22mm"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-1.5">
                    Target Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] font-sans focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 cursor-pointer"
                  >
                    <option value="Unisex">Unisex Collection</option>
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                  </select>
                </div>

                {/* Occasion */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-1.5">
                    Occasion / Theme
                  </label>
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25"
                    placeholder="e.g. Bridal, Festive, Heirloom"
                  />
                </div>
              </div>

              {/* Marketing / Flags Badges */}
              <div className="pt-2">
                <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-2">
                  Storefront Badges & Prominence
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Featured */}
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isFeatured
                        ? "bg-[#C8A96A]/15 border-[#C8A96A] shadow-xs"
                        : "bg-white border-[#351E28]/12 hover:border-[#351E28]/25"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isFeatured ? "bg-luxury-gold text-white" : "bg-[#351E28]/5 text-[#351E28]/40"
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[#351E28]">Featured</span>
                      <span className="block text-[9.5px] text-[#351E28]/50">Show on homepage</span>
                    </div>
                  </label>

                  {/* Trending */}
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isTrending
                        ? "bg-[#C8A96A]/15 border-[#C8A96A] shadow-xs"
                        : "bg-white border-[#351E28]/12 hover:border-[#351E28]/25"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isTrending}
                      onChange={(e) => setIsTrending(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isTrending ? "bg-amber-500 text-white" : "bg-[#351E28]/5 text-[#351E28]/40"
                      }`}
                    >
                      <Flame className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[#351E28]">Trending</span>
                      <span className="block text-[9.5px] text-[#351E28]/50">Trending ribbon</span>
                    </div>
                  </label>

                  {/* Best Seller */}
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isBestSeller
                        ? "bg-[#C8A96A]/15 border-[#C8A96A] shadow-xs"
                        : "bg-white border-[#351E28]/12 hover:border-[#351E28]/25"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isBestSeller ? "bg-emerald-600 text-white" : "bg-[#351E28]/5 text-[#351E28]/40"
                      }`}
                    >
                      <Trophy className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[#351E28]">Best Seller</span>
                      <span className="block text-[9.5px] text-[#351E28]/50">Award top badge</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Sizing & Custom Options */}
          {activeTab === "sizing" && (
            <div className="space-y-5 animate-fade-in">
              {(() => {
                const activeCategory = categories.find((cat) => cat._id === categoryId);
                const sizeConfig = activeCategory
                  ? getSizeConfigByCategoryName(activeCategory.name)
                  : DEFAULT_SIZE_CONFIG;
                const shouldShowSection = !sizeConfig.defaultHidden || allowCustomSize;

                return (
                  <div>
                    <div className="flex items-center gap-2 pb-2 border-b border-[#351E28]/10 mb-4">
                      <Ruler className="w-4 h-4 text-luxury-gold" />
                      <h3 className="font-serif text-base text-[#351E28] font-semibold">
                        4. Product Sizing Settings ({sizeConfig.label})
                      </h3>
                    </div>

                    {shouldShowSection ? (
                      <div className="space-y-4 bg-[#351E28]/3 p-5 rounded-2xl border border-[#351E28]/10 text-left">
                        {sizeConfig.hasStandardSizes && (
                          <div>
                            <label className="block text-[10px] tracking-wider uppercase text-[#351E28]/70 mb-2 font-bold font-mono">
                              Select Available Standard Sizes
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {sizeConfig.standardSizes.map((size) => {
                                const isSelected = sizes.includes(size);
                                return (
                                  <button
                                    type="button"
                                    key={size}
                                    onClick={() => handleToggleStandardSize(size)}
                                    className={`px-4 py-2 border text-xs tracking-wider font-mono font-bold rounded-xl transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-luxury-gold border-luxury-gold text-black shadow-xs font-bold scale-102"
                                        : "border-[#351E28]/15 text-[#351E28]/80 hover:border-luxury-gold bg-white"
                                    }`}
                                  >
                                    {size}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {sizeConfig.customSizesAsTags && (
                          <div>
                            <label className="block text-[10px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold font-mono">
                              Add Custom Sizes / Measurement Tags
                            </label>
                            <div className="flex gap-2 mb-3">
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
                                placeholder="e.g. XS, 8.5, Custom Tag"
                                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddSizeTag()}
                                className="bg-[#351E28] hover:bg-[#2A161F] text-white hover:text-luxury-gold px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                              >
                                + Add Size
                              </button>
                            </div>

                            {sizes.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {sizes.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1.5 bg-white border border-[#351E28]/15 text-[#351E28] px-3 py-1.5 rounded-xl text-xs font-mono font-bold shadow-2xs"
                                  >
                                    <span>{tag}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSizeTag(tag)}
                                      className="text-[#351E28]/40 hover:text-red-600 font-bold ml-1 text-sm leading-none cursor-pointer"
                                    >
                                      &times;
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-[#351E28]/40 italic">No custom sizes defined yet.</p>
                            )}
                          </div>
                        )}

                        {sizeConfig.allowCustomSizeOption && (
                          <div className="pt-2 border-t border-[#351E28]/10">
                            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#351E28]/10 cursor-pointer hover:border-luxury-gold/40 transition-colors">
                              <input
                                type="checkbox"
                                checked={allowCustomSize}
                                onChange={(e) => setAllowCustomSize(e.target.checked)}
                                className="w-4 h-4 rounded text-luxury-gold accent-luxury-gold cursor-pointer"
                              />
                              <div className="text-left select-none">
                                <span className="block text-xs font-bold text-[#351E28]">
                                  Allow Custom Sizes for Patrons
                                </span>
                                <span className="block text-[10.5px] text-[#351E28]/50">
                                  Customers can specify their own bespoke lengths or ring diameters during ordering.
                                </span>
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-[#351E28]/3 p-5 rounded-2xl border border-[#351E28]/10 text-left">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={allowCustomSize}
                            onChange={(e) => setAllowCustomSize(e.target.checked)}
                            className="w-4 h-4 rounded text-luxury-gold accent-luxury-gold cursor-pointer"
                          />
                          <span className="text-xs font-bold text-[#351E28]">
                            Enable custom size selection for {activeCategory?.name || "this category"}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 5: Artisan Storytelling */}
          {activeTab === "story" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-2 border-b border-[#351E28]/10">
                <FileText className="w-4 h-4 text-luxury-gold" />
                <h3 className="font-serif text-base text-[#351E28] font-semibold">
                  5. Artisan Storytelling & Narratives
                </h3>
              </div>

              <div className="space-y-4">
                {/* Short Description */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-1.5">
                    Catalog Summary / Short Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 font-sans"
                    placeholder="Brief 1-line summary displayed under the title in lists..."
                    required
                  />
                </div>

                {/* Long Description */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono mb-1.5">
                    Artisan Craftsmanship Narrative & Care Instructions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 leading-relaxed font-sans"
                    placeholder="Describe the heirloom inspirations, hand-cut stone placements, certification hallmarks, and delicate care guidance..."
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Gallery Manager */}
          {activeTab === "gallery" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-2 border-b border-[#351E28]/10">
                <ImageIcon className="w-4 h-4 text-luxury-gold" />
                <h3 className="font-serif text-base text-[#351E28] font-semibold">
                  6. High-Definition Media Gallery
                </h3>
              </div>

              {/* Upload Dropzone Card */}
              <div className="border-2 border-dashed border-[#C8A96A]/40 rounded-2xl p-6 bg-[#C8A96A]/5 hover:bg-[#C8A96A]/10 transition-colors text-center">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#C8A96A]/30 text-luxury-gold flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-sm font-semibold text-[#351E28] mb-1">
                  Upload Jewelry Imagery or Video Clips
                </h4>
                <p className="text-[11px] text-[#351E28]/60 mb-4 max-w-md mx-auto">
                  Supports JPEG, PNG, WEBP, and MP4 formats up to 50MB. Images will be automatically optimized.
                </p>

                <div className="relative inline-block">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="gallery-file-upload-main"
                  />
                  <label
                    htmlFor="gallery-file-upload-main"
                    className="group inline-flex items-center gap-2 bg-[#351E28] hover:bg-[#2A161F] !text-white hover:!text-luxury-gold px-6 py-2.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all shadow-md hover:shadow-lg select-none"
                    style={{ color: "#FFFFFF" }}
                  >
                    <Upload className="w-4 h-4 text-luxury-gold transition-transform group-hover:scale-110" />
                    <span className="!text-white group-hover:!text-luxury-gold transition-colors">
                      Upload Jewelry Media
                    </span>
                  </label>
                </div>

                {imageUploading && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-luxury-gold font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{uploadStatus || "Processing media files..."}</span>
                  </div>
                )}
              </div>

              {/* Gallery Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] uppercase tracking-wider text-[#351E28]/70 font-bold font-mono">
                    Loaded Catalog Images ({images.length})
                  </label>
                  <span className="text-[10px] text-[#351E28]/45">
                    Click &ldquo;Thumb&rdquo; to set primary listing photo
                  </span>
                </div>

                {images.length === 0 && !imageUploading ? (
                  <div className="py-8 text-center border border-dashed border-[#351E28]/15 rounded-2xl text-xs text-[#351E28]/40">
                    No images loaded yet. Upload your first photo above.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {images.map((url, idx) => {
                      const isPrimary = thumbnail === url;
                      const isVid = isVideoUrl(url);
                      return (
                        <div
                          key={idx}
                          className={`relative aspect-square rounded-2xl border overflow-hidden bg-white shadow-2xs group transition-all ${
                            isPrimary ? "ring-2 ring-luxury-gold border-luxury-gold" : "border-[#351E28]/12"
                          }`}
                        >
                          {isVid ? (
                            <div className="w-full h-full flex items-center justify-center bg-black/5">
                              <video
                                src={getImageUrl(url)}
                                className="max-h-full max-w-full object-contain"
                                muted
                                playsInline
                              />
                              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-mono flex items-center gap-1">
                                <Video className="w-3 h-3" /> Video
                              </div>
                            </div>
                          ) : (
                            <img
                              src={getImageUrl(url)}
                              alt={`Gallery ${idx}`}
                              className="w-full h-full object-cover"
                            />
                          )}

                          {/* Primary badge */}
                          {isPrimary && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-luxury-gold text-white text-[9px] uppercase tracking-wider font-bold font-mono shadow-xs flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-current" /> Primary
                            </div>
                          )}

                          {/* Action Overlay */}
                          <div className="absolute inset-0 bg-[#351E28]/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
                            <div className="flex justify-between items-center w-full">
                              <button
                                type="button"
                                onClick={() => setThumbnail(url)}
                                className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-md transition-colors ${
                                  isPrimary
                                    ? "bg-luxury-gold text-black"
                                    : "bg-white/20 hover:bg-white/40 text-white"
                                }`}
                              >
                                {isPrimary ? "★ Primary" : "Set Primary"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveImage(url)}
                                className="p-1 rounded-md bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                                title="Delete image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Reorder arrows */}
                            <div className="flex justify-between items-center w-full mt-auto pt-2 border-t border-white/20">
                              <button
                                type="button"
                                onClick={() => handleDragImage(idx, "left")}
                                disabled={idx === 0}
                                className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white disabled:opacity-20 cursor-pointer"
                                title="Move Left"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-[10px] font-mono text-white/70">
                                #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDragImage(idx, "right")}
                                disabled={idx === images.length - 1}
                                className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white disabled:opacity-20 cursor-pointer"
                                title="Move Right"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons Footer (Fixed) */}
        <div className="flex items-center justify-between pt-4 border-t border-[#351E28]/10 mt-4 shrink-0 bg-transparent">
          {/* Step Back / Next Helpers */}
          <div className="flex items-center gap-2">
            {activeTab !== "core" && (
              <button
                type="button"
                onClick={() => {
                  const idx = tabs.findIndex((t) => t.id === activeTab);
                  if (idx > 0) setActiveTab(tabs[idx - 1].id);
                }}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-[#351E28]/15 bg-white text-[#351E28] hover:bg-[#351E28]/5 text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
            )}

            {activeTab !== "gallery" && (
              <button
                type="button"
                onClick={() => {
                  const idx = tabs.findIndex((t) => t.id === activeTab);
                  if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
                }}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-[#351E28]/15 bg-white text-[#351E28] hover:bg-[#351E28]/5 text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-full border border-[#351E28]/15 bg-white text-[#351E28] hover:bg-[#351E28]/5 text-xs tracking-wider uppercase font-semibold transition-all cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading || imageUploading}
              className="bg-[#C8A96A] hover:bg-[#B89858] text-[#351E28] px-7 py-2.5 rounded-full text-xs tracking-wider uppercase font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {formLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Masterpiece...</span>
                </>
              ) : imageUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadStatus || "Uploading..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Masterpiece</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
