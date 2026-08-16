import React, { useState, useEffect } from "react";
import { Upload, Loader2 } from "lucide-react";
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

export default function ProductFormModal({
  isOpen,
  onClose,
  onSaveSuccess,
  product,
  categories
}: ProductFormModalProps) {
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

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Sync props data to form states
  useEffect(() => {
    if (isOpen) {
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

    // Limit to 50MB per file
    const maxLimit = 50 * 1024 * 1024;
    const oversized = files.filter((f) => f.size > maxLimit);
    if (oversized.length > 0) {
      setFormError("Failed to upload. Some files exceed the maximum limit of 50MB.");
      setImageUploading(false);
      return;
    }

    try {
      setUploadStatus("Compressing...");
      
      // Compress selected image files in parallel (skips videos and non-images)
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            return await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
          } catch (compressErr) {
            console.error("Client compression error for:", file.name, compressErr);
            return file; // fallback to original file if compression fails
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
      setFormError(err.response?.data?.message || "Failed to upload images to local server storage.");
    } finally {
      setImageUploading(false);
      setUploadStatus("");
    }
  };

  // Remove image from list
  const handleRemoveImage = (urlToRemove: string) => {
    const updated = images.filter((img) => img !== urlToRemove);
    setImages(updated);
    if (thumbnail === urlToRemove) {
      setThumbnail(updated[0] || "");
    }
  };

  // Reorder gallery items
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

  // Submit product creation/editing payload
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check mandatory constraints
    const isPriceRequired = !hasVariants;
    const trimmedName = name.trim();
    const trimmedSku = sku.trim();
    const trimmedShortDesc = shortDescription.trim();
    const trimmedDesc = description.trim();

    if (!trimmedName) {
      setFormError("Product Name is required.");
      return;
    }

    if (!trimmedSku) {
      setFormError("SKU Code is required.");
      return;
    }

    if (!categoryId) {
      setFormError("Category is required.");
      return;
    }

    if (!material) {
      setFormError("Material type is required.");
      return;
    }

    if (!purity) {
      setFormError("Purity is required.");
      return;
    }

    if (weight === undefined || weight === null || isNaN(weight) || weight <= 0) {
      setFormError("Product weight is required and must be greater than 0g.");
      return;
    }

    if (isPriceRequired) {
      if (price === undefined || price === null || isNaN(price) || price <= 0) {
        setFormError("Base price is required and must be greater than 0.");
        return;
      }
      if (stock === undefined || stock === null || isNaN(stock) || stock < 0) {
        setFormError("Stock quantity is required and cannot be negative.");
        return;
      }
    }

    if (hasVariants) {
      if (variants.length === 0) {
        setFormError("Please add at least one variant option if variants are enabled.");
        return;
      }
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.name || !v.name.trim()) {
          setFormError(`Variant #${i + 1} must have a name.`);
          return;
        }
        if (v.price === undefined || v.price === null || isNaN(v.price) || v.price <= 0) {
          setFormError(`Price for variant '${v.name}' must be greater than 0.`);
          return;
        }
        if (v.stock === undefined || v.stock === null || isNaN(v.stock) || v.stock < 0) {
          setFormError(`Stock for variant '${v.name}' cannot be negative.`);
          return;
        }
      }
    }

    if (!trimmedShortDesc) {
      setFormError("Short Description is required.");
      return;
    }

    if (!trimmedDesc) {
      setFormError("Long Description is required.");
      return;
    }

    if (images.length === 0) {
      setFormError("Please upload at least one gallery image or media file.");
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
      variants: hasVariants ? variants.map(v => ({
        name: v.name.trim(),
        price: v.price,
        stock: v.stock,
        sku: v.sku ? v.sku.toUpperCase().trim() : undefined
      })) : []
    };

    try {
      if (!product) {
        // Create Product
        await postRequest("/products", payload);
      } else {
        // Edit Product
        await putRequest(`/products/${product._id}`, payload);
      }
      onSaveSuccess();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to save product details.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={!product ? "Create Fine Masterpiece" : "Edit Jewelry Details"}
      subtitle="fine catalog"
      maxWidthClassName="max-w-4xl"
      scrollable={false}
    >
      {formError && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-[10px] uppercase tracking-wider font-semibold shrink-0">
          {formError}
        </div>
      )}

      {/* Form wrapping body & footer */}
      <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0">
        
        {/* Scrollable Form Body */}
        <div className="space-y-6 flex-1 overflow-y-auto pr-3 pb-4 custom-scrollbar">
          
          {/* Section 1: Core Specifications */}
          <div>
            <h3 className="font-serif text-[11px] uppercase tracking-wider text-luxury-gold border-b border-[#351E28]/10 pb-1.5 mb-4 font-bold">
              1. Core Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Item Name */}
              <div className="md:col-span-2">
                <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">Item Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
                  required
                />
              </div>
              {/* SKU Code */}
              <div>
                <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">SKU Code *</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden font-mono uppercase"
                  placeholder="SOL-EM-PND"
                  required
                />
              </div>
              {/* Category */}
              <div>
                <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              {/* Status */}
              <div>
                <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">Publish Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Valuation & Stock */}
          <div>
            <h3 className="font-serif text-[11px] uppercase tracking-wider text-luxury-gold border-b border-[#351E28]/10 pb-1.5 mb-4 font-bold">
              2. Valuation & Stock
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Base Price */}
              {!hasVariants && (
                <div>
                  <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">Base Price (INR) *</label>
                  <input
                    type="number"
                    min={0}
                    onKeyDown={(e) => { if (e.key === '-' || e.key === '+') e.preventDefault(); }}
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden font-mono"
                    required
                  />
                </div>
              )}
              {/* Stock Qty */}
              <div className={hasVariants ? "md:col-span-2" : ""}>
                <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">Stock Qty *</label>
                <input
                  type="number"
                  min={0}
                  onKeyDown={(e) => { if (e.key === '-' || e.key === '+') e.preventDefault(); }}
                  value={stock}
                  onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden font-mono"
                  required={!hasVariants}
                  disabled={hasVariants}
                />
              </div>
            </div>
            
            {/* Product Variants Section */}
            <div className="mt-6 p-4 rounded-xl border border-[#351E28]/10 bg-[#351E28]/3 space-y-4 text-left">
              <label className="flex items-center gap-2 select-none cursor-pointer font-bold text-[#351E28] font-mono text-[9px] uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
                  className="accent-luxury-gold"
                />
                Enable Product Variants (e.g. custom pricing and stock overrides)
              </label>

              {hasVariants && (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center border-b border-[#351E28]/10 pb-2">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-luxury-gold">Product Variants List</span>
                    <button
                      type="button"
                      onClick={() => {
                        setVariants([
                          ...variants,
                          { name: "Option A", price: price || 0, stock: stock || 0, sku: sku ? `${sku}-A` : "" }
                        ]);
                      }}
                      className="bg-[#351E28] hover:bg-[#351E28]/90 text-white hover:text-luxury-gold px-3 py-1 rounded-md text-[8.5px] uppercase tracking-wider font-bold transition-all cursor-pointer"
                    >
                      + Add Variant Row
                    </button>
                  </div>

                  {variants.length === 0 ? (
                    <p className="text-[9px] uppercase tracking-wider text-[#351E28]/40 italic py-2">No variants added yet. Click + Add Variant Row above.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {variants.map((v, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white/20 p-2.5 rounded-lg border border-[#351E28]/10">
                          {/* Option Name */}
                          <div className="col-span-3">
                            <label className="block text-[7px] uppercase text-[#351E28]/60 font-bold mb-1">Option Name *</label>
                            <input
                              type="text"
                              value={v.name}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[index].name = e.target.value;
                                setVariants(newVars);
                              }}
                              placeholder="e.g. Option A"
                              className="w-full px-2 py-1 rounded bg-[#F7F2EE] border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
                              required
                            />
                          </div>
                          {/* Price override */}
                          <div className="col-span-3">
                            <label className="block text-[7px] uppercase text-[#351E28]/60 font-bold mb-1">Price (INR) *</label>
                            <input
                              type="number"
                              min={0}
                              onKeyDown={(e) => { if (e.key === '-' || e.key === '+') e.preventDefault(); }}
                              value={v.price}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[index].price = Math.max(0, parseFloat(e.target.value) || 0);
                                setVariants(newVars);
                              }}
                              className="w-full px-2 py-1 rounded bg-[#F7F2EE] border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden font-mono"
                              required
                            />
                          </div>
                          {/* Stock override */}
                          <div className="col-span-2">
                            <label className="block text-[7px] uppercase text-[#351E28]/60 font-bold mb-1">Stock *</label>
                            <input
                              type="number"
                              min={0}
                              onKeyDown={(e) => { if (e.key === '-' || e.key === '+') e.preventDefault(); }}
                              value={v.stock}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[index].stock = Math.max(0, parseInt(e.target.value) || 0);
                                setVariants(newVars);
                              }}
                              className="w-full px-2 py-1 rounded bg-[#F7F2EE] border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden font-mono"
                              required
                            />
                          </div>
                          {/* SKU override */}
                          <div className="col-span-3">
                            <label className="block text-[7px] uppercase text-[#351E28]/60 font-bold mb-1">SKU Override</label>
                            <input
                              type="text"
                              value={v.sku || ""}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[index].sku = e.target.value.toUpperCase();
                                setVariants(newVars);
                              }}
                              placeholder="e.g. SKU-A"
                              className="w-full px-2 py-1 rounded bg-[#F7F2EE] border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden font-mono"
                            />
                          </div>
                          {/* Delete */}
                          <div className="col-span-1 pt-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setVariants(variants.filter((_, i) => i !== index));
                              }}
                              className="text-red-600 hover:text-red-800 text-xs font-bold cursor-pointer"
                              title="Remove Variant"
                            >
                              &times;
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Craftsmanship Specs */}
          <div>
            <h3 className="font-serif text-[11px] uppercase tracking-wider text-luxury-gold border-b border-[#351E28]/10 pb-1.5 mb-4 font-bold">
              3. Craftsmanship Specs
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Metal Type */}
              <div>
                <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">Metal Type *</label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
                  required
                >
                  {!["Gold", "Platinum", "Silver", "Rose Gold", "White Gold", "Brass"].includes(material) && material && (
                    <option value={material}>{material}</option>
                  )}
                  {["Gold", "Platinum", "Silver", "Rose Gold", "White Gold", "Brass"].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {/* Purity */}
              <div>
                <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">Purity *</label>
                <select
                  value={purity}
                  onChange={(e) => setPurity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
                  required
                >
                  {!["18K", "22K", "14K", "24K", "950 Platinum", "925 Sterling Silver"].includes(purity) && purity && (
                    <option value={purity}>{purity}</option>
                  )}
                  {["18K", "22K", "14K", "24K", "950 Platinum", "925 Sterling Silver"].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {/* Weight */}
              <div>
                <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">Weight (g) *</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  onKeyDown={(e) => { if (e.key === '-' || e.key === '+') e.preventDefault(); }}
                  value={weight}
                  onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden font-mono"
                  required
                />
              </div>
              {/* Dimensions */}
              <div>
                <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">Dimensions</label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
                  placeholder="8mm x 8mm"
                />
              </div>
              {/* Gender */}
              <div>
                <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
                >
                  <option value="Unisex">Unisex</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                </select>
              </div>
              {/* Occasion */}
              <div>
                <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">Occasion</label>
                <input
                  type="text"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
                  placeholder="Wedding, Festive"
                />
              </div>
            </div>

            {/* Marketing / Flags Checkboxes */}
            <div className="flex flex-wrap gap-6 bg-[#351E28]/3 p-3.5 rounded-xl border border-[#351E28]/8 font-mono text-[9px] uppercase tracking-wider mt-4">
              <label className="flex items-center gap-2 select-none cursor-pointer font-bold text-[#351E28]">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="accent-luxury-gold" />
                Featured Masterpiece
              </label>
              <label className="flex items-center gap-2 select-none cursor-pointer font-bold text-[#351E28]">
                <input type="checkbox" checked={isTrending} onChange={(e) => setIsTrending(e.target.checked)} className="accent-luxury-gold" />
                Trending Design
              </label>
              <label className="flex items-center gap-2 select-none cursor-pointer font-bold text-[#351E28]">
                <input type="checkbox" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} className="accent-luxury-gold" />
                Best Seller
              </label>
            </div>
          </div>

          {/* Section 4: Product Size Settings */}
          {(() => {
            const activeCategory = categories.find((cat) => cat._id === categoryId);
            const sizeConfig = activeCategory ? getSizeConfigByCategoryName(activeCategory.name) : DEFAULT_SIZE_CONFIG;
            const shouldShowSection = !sizeConfig.defaultHidden || allowCustomSize;

            if (shouldShowSection) {
              return (
                <div>
                  <h3 className="font-serif text-[11px] uppercase tracking-wider text-luxury-gold border-b border-[#351E28]/10 pb-1.5 mb-4 font-bold">
                    4. Product Size Settings ({sizeConfig.label})
                  </h3>
                  
                  <div className="space-y-4 bg-[#351E28]/3 p-4 rounded-xl border border-[#351E28]/8 text-left">
                    {sizeConfig.hasStandardSizes && (
                      <div>
                        <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-2 font-bold">
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
                                className={`px-3 py-1.5 border text-[10px] tracking-wider font-bold rounded-lg transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-luxury-gold border-luxury-gold text-black font-bold"
                                    : "border-[#351E28]/15 text-[#351E28]/80 hover:border-luxury-gold bg-white/20"
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
                        <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">
                          Add Custom Sizes / Options
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
                            placeholder="E.g. XS, 8.5, Custom Size Tag"
                            className="flex-1 px-3 py-1.5 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSizeTag()}
                            className="bg-luxury-gold hover:opacity-90 text-black px-4 py-1.5 rounded-lg text-[10px] tracking-wider uppercase font-bold transition-all cursor-pointer"
                          >
                            Add
                          </button>
                        </div>

                        {sizes.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {sizes.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1.5 bg-[#351E28]/10 border border-[#351E28]/15 text-[#351E28] px-2.5 py-1 rounded-lg text-[10px] font-bold"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSizeTag(tag)}
                                  className="text-red-600 hover:text-red-800 font-bold ml-1 text-xs"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[9px] uppercase tracking-wider text-[#351E28]/30 italic">No custom sizes defined yet.</p>
                        )}
                      </div>
                    )}

                    {sizeConfig.allowCustomSizeOption && (
                      <div className="flex items-center gap-2 select-none cursor-pointer font-bold text-[#351E28] font-mono text-[9px] uppercase tracking-wider mt-2">
                        <label className="flex items-center gap-2 select-none cursor-pointer font-bold">
                          <input
                            type="checkbox"
                            checked={allowCustomSize}
                            onChange={(e) => setAllowCustomSize(e.target.checked)}
                            className="accent-luxury-gold"
                          />
                          Allow Custom Sizes (Customers can specify their own custom sizes/lengths)
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              );
            } else {
              return (
                <div>
                  <h3 className="font-serif text-[11px] uppercase tracking-wider text-luxury-gold border-b border-[#351E28]/10 pb-1.5 mb-4 font-bold">
                    4. Product Size Settings
                  </h3>
                  <div className="bg-[#351E28]/3 p-4 rounded-xl border border-[#351E28]/8 text-left font-mono text-[9px] uppercase tracking-wider">
                    <label className="flex items-center gap-2 select-none cursor-pointer font-bold text-[#351E28]">
                      <input
                        type="checkbox"
                        checked={allowCustomSize}
                        onChange={(e) => setAllowCustomSize(e.target.checked)}
                        className="accent-luxury-gold"
                      />
                      Enable custom size selection for Earrings
                    </label>
                  </div>
                </div>
              );
            }
          })()}

          {/* Section 5: Artisan Storytelling */}
          <div>
            <h3 className="font-serif text-[11px] uppercase tracking-wider text-luxury-gold border-b border-[#351E28]/10 pb-1.5 mb-4 font-bold">
              5. Artisan Storytelling
            </h3>
            <div className="space-y-4">
              {/* Short Description */}
              <div>
                <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">Short Description *</label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
                  required
                />
              </div>
              {/* Long Description */}
              <div>
                <label className="block text-[8px] tracking-wider uppercase text-[#351E28]/70 mb-1.5 font-bold">Long Description *</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 6: Gallery Manager */}
          <div>
            <h3 className="font-serif text-[11px] uppercase tracking-wider text-luxury-gold border-b border-[#351E28]/10 pb-1.5 mb-4 font-bold">
              6. Gallery Manager
            </h3>
            
            {/* Images Manager */}
            <div className="border border-[#351E28]/10 p-4 rounded-xl space-y-4 bg-[#351E28]/3">
              <div className="flex justify-between items-center border-b border-[#351E28]/10 pb-3">
                <span className="text-[9px] tracking-wider uppercase font-mono font-bold text-[#351E28]/60">Gallery Images *</span>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="gallery-file-upload"
                  />
                  <label
                    htmlFor="gallery-file-upload"
                    className="flex items-center gap-1.5 border border-[#351E28]/15 hover:border-luxury-gold px-4 py-2 rounded-full text-[9px] uppercase tracking-wider font-bold transition-all cursor-pointer text-[#351E28] hover:bg-white/40"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Media
                  </label>
                </div>
              </div>

              {images.length === 0 && !imageUploading ? (
                <p className="text-[9.5px] uppercase tracking-wider text-[#351E28]/30 text-center py-4">No images loaded yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg border border-[#351E28]/15 bg-white/30 flex items-center justify-center p-2 group">
                      {isVideoUrl(url) ? (
                        <video src={getImageUrl(url)} className="max-h-full max-w-full object-contain" muted playsInline />
                      ) : (
                        <img src={getImageUrl(url)} alt={`Gallery ${idx}`} className="max-h-full max-w-full object-contain" />
                      )}
                      
                      {/* Overlay commands */}
                      <div className="absolute inset-0 bg-[#351E28]/90 opacity-0 group-hover:opacity-100 flex flex-col justify-between p-1.5 transition-all rounded-lg">
                        <div className="flex justify-between items-center w-full">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(url)}
                            className="text-red-300 hover:text-red-200 font-bold text-[8.5px] uppercase"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setThumbnail(url)}
                            className={`text-[8px] uppercase tracking-wider border rounded-sm px-1.5 py-0.5 ${
                              thumbnail === url ? "bg-luxury-gold border-luxury-gold text-[#351E28] font-bold" : "border-[#351E28]/20 text-white/70"
                            }`}
                          >
                            Thumb
                          </button>
                        </div>
                        <div className="flex justify-between items-center w-full mt-auto">
                          <button
                            type="button"
                            onClick={() => handleDragImage(idx, "left")}
                            disabled={idx === 0}
                            className="text-white hover:text-luxury-gold text-[10px] font-bold disabled:opacity-20"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDragImage(idx, "right")}
                            disabled={idx === images.length - 1}
                            className="text-white hover:text-luxury-gold text-[10px] font-bold disabled:opacity-20"
                          >
                            →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {imageUploading && (
                    <div className="relative aspect-square rounded-lg border border-luxury-gold/30 border-dashed bg-luxury-gold/5 flex flex-col items-center justify-center p-2">
                      <Loader2 className="w-5 h-5 animate-spin text-luxury-gold mb-1" />
                      <span className="text-[8px] uppercase tracking-wider text-luxury-gold font-bold text-center">
                        {uploadStatus || "Uploading..."}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Submit Buttons Footer (Fixed) */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#351E28]/10 mt-4 shrink-0 bg-transparent">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full border border-[#351E28]/15 hover:border-luxury-gold text-[#351E28] hover:text-[#351E28] text-[9px] tracking-wider uppercase font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formLoading || imageUploading}
            className="bg-luxury-gold hover:opacity-90 text-[#351E28] px-6 py-2.5 rounded-full text-[9px] tracking-wider uppercase font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            {formLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Masterpiece...
              </>
            ) : imageUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {uploadStatus || "Uploading..."}
              </>
            ) : (
              "Save Masterpiece"
            )}
          </button>
        </div>

      </form>
    </Modal>
  );
}
