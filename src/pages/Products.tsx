import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import ProductFormModal from "../components/products/ProductFormModal";
import ProductTable from "../components/products/ProductTable";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal";
import { getRequest, deleteRequest } from "../services/api";

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedStockStatus, setSelectedStockStatus] = useState("");

  // Custom Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load filters once on mount
  useEffect(() => {
    fetchFilters();
  }, []);

  // Debounced load products on search or filter updates
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedCategory, selectedStatus, selectedStockStatus]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedStockStatus) params.stockStatus = selectedStockStatus;

      const res = await getRequest("/products/admin", { params });
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const catRes = await getRequest("/categories");
      if (catRes.success) setCategories(catRes.categories);
    } catch (err) {
      console.error("Failed to load filter fields", err);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const openEditModal = (prod: any) => {
    setEditingProduct(prod);
    setShowModal(true);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteRequest(`/products/${deleteConfirmId}`);
      setDeleteConfirmId(null);
      fetchProducts();
    } catch (err) {
      console.error("Failed to delete product", err);
    }
  };



  return (
    <div className="flex flex-col h-full space-y-6 text-left min-h-0 overflow-hidden">

      {/* Page header */}
      <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[8px] tracking-widest uppercase text-luxury-gold font-bold font-mono">fine jewelry</span>
          <h1 className="font-serif text-2xl text-white mt-1">Product Inventory</h1>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 bg-luxury-gold hover:opacity-90 text-black px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Product
        </button>
      </div>

      {/* Search and inventory summary section */}

      {/* Search & Filter Bar */}
      <div className="shrink-0 glass-card rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/3 relative">
          <input
            type="text"
            placeholder="Search SKU, Name, Metal, Stone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-10 py-2 rounded-xl bg-white/3 border border-white/8 text-xs text-white focus:border-luxury-gold focus:outline-hidden placeholder-white/30"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-white/40 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="w-full md:w-auto flex flex-wrap md:flex-nowrap gap-3 items-center">
          {/* Category Filter */}
          <div className="flex-1 md:flex-initial">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full min-w-[140px] px-3 py-2 rounded-xl bg-white/8 border border-white/8 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1 md:flex-initial">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full min-w-[120px] px-3 py-2 rounded-xl bg-white/8 border border-white/8 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex-1 md:flex-initial">
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="w-full min-w-[120px] px-3 py-2 rounded-xl bg-white/8 border border-white/8 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden"
            >
              <option value="">Stock Level</option>
              <option value="in-stock">In Stock (&gt;0)</option>
              <option value="out-of-stock">Out of Stock (0)</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(searchTerm || selectedCategory || selectedStatus || selectedStockStatus) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
                setSelectedStatus("");
                setSelectedStockStatus("");
              }}
              className="px-4 py-2 text-[10px] tracking-wider uppercase font-bold text-luxury-gold hover:text-white transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Products table */}
      <div className="flex-1 min-h-0">
        <ProductTable
          products={products}
          loading={loading}
          onEdit={openEditModal}
          onDelete={(id) => setDeleteConfirmId(id)}
        />
      </div>

      {/* CRUD Product Modal */}
      <ProductFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSaveSuccess={() => {
          setShowModal(false);
          fetchProducts();
        }}
        product={editingProduct}
        categories={categories}
      />

      {/* Delete Confirmation Popup */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteProduct}
        title="Retire Fine Masterpiece"
        message="Are you sure you want to permanently retire this fine jewelry design? This will remove the listing and delete all associated image files from local server storage."
      />

    </div>
  );
}
