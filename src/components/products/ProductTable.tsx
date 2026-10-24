
import { Edit, Trash2, Crown, TrendingUp, Sparkles } from "lucide-react";
import Table from "../ui/Table";

import { getImageUrl } from "../../services/api";

const isVideoUrl = (url: string) => {
  if (!url) return false;
  const ext = url.split(".").pop()?.toLowerCase();
  return ["mp4", "webm", "ogg", "mov"].includes(ext || "");
};

interface ProductTableProps {
  products: any[];
  loading: boolean;
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
}

export default function ProductTable({
  products,
  loading,
  onEdit,
  onDelete
}: ProductTableProps) {

  const columns = [
    {
      header: "SKU / Item",
      className: "font-mono",
      render: (prod: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#1c1c1c] border border-white/5 flex items-center justify-center p-1 shrink-0 overflow-hidden">
            {isVideoUrl(prod.thumbnail) ? (
              <video src={getImageUrl(prod.thumbnail)} className="max-h-full max-w-full object-contain" muted playsInline />
            ) : (
              <img src={getImageUrl(prod.thumbnail)} alt={prod.name} className="max-h-full max-w-full object-contain" />
            )}
          </div>
          <div className="text-left">
            <span className="font-bold text-[#ff5a1f]">{prod.sku}</span><br />
            <span className="text-white/40 text-[8px] uppercase">{prod.gender}</span>
          </div>
        </div>
      )
    },
    {
      header: "Details",
      render: (prod: any) => (
        <div className="text-left space-y-1">
          <h3 className="font-serif text-sm text-white font-light line-clamp-1">{prod.name}</h3>
          <span className="text-[8px] uppercase tracking-widest text-white/40 block font-mono">
            Category: {prod.category?.name || "N/A"}
          </span>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {prod.isFeatured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7.5px] font-bold uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30">
                <Crown className="w-2.5 h-2.5 text-amber-300" /> Featured
              </span>
            )}
            {prod.isTrending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7.5px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-300 border border-orange-500/30">
                <TrendingUp className="w-2.5 h-2.5 text-orange-300" /> Trending
              </span>
            )}
            {prod.isBestSeller && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7.5px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-2.5 h-2.5 text-emerald-300" /> Best Seller
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      header: "Value",
      className: "font-mono",
      render: (prod: any) => {
        let priceStr = "N/A";
        if (prod.hasVariants && prod.variants && prod.variants.length > 0) {
          const prices = prod.variants.map((v: any) => v.price);
          const minPrice = Math.min(...prices);
          priceStr = `From INR ${minPrice.toLocaleString()}`;
        } else if (prod.price !== undefined && prod.price !== null) {
          priceStr = `INR ${prod.price.toLocaleString()}`;
        }
        return (
          <div className="text-left font-semibold text-[#351E28]">
            {priceStr}
          </div>
        );
      }
    },
    {
      header: "Stock",
      className: "font-mono",
      render: (prod: any) => {
        let stockVal = prod.stock;
        if (prod.hasVariants && prod.variants) {
          stockVal = prod.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
        }
        let stockLabel = "In Stock";
        let colorClass = "text-emerald-400";
        if (stockVal === 0) {
          stockLabel = "Out of Stock";
          colorClass = "text-red-400";
        } else if (stockVal <= 5) {
          stockLabel = "Low Stock";
          colorClass = "text-amber-400";
        }
        return (
          <div className="text-left">
            <span className="text-[#351E28] font-medium">{stockVal} items</span><br />
            <span className={`text-[8px] uppercase tracking-wider font-bold ${colorClass}`}>{stockLabel}</span>
          </div>
        );
      }
    },
    {
      header: "Status",
      render: (prod: any) => {
        const statusColors = {
          Draft: "bg-amber-500/10 border-amber-500/20 text-amber-500",
          Published: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
        };
        const color = statusColors[prod.status as keyof typeof statusColors] || statusColors.Draft;
        return (
          <div className="text-left">
            <span className={`px-2 py-0.5 rounded-full border text-[8px] tracking-wider uppercase font-bold ${color}`}>
              {prod.status}
            </span>
          </div>
        );
      }
    },
    {
      header: "Actions",
      className: "text-right",
      render: (prod: any) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onEdit(prod)}
            className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Edit Product"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(prod._id)}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-500 transition-colors cursor-pointer"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      data={products}
      loading={loading}
      emptyMessage="No products found matching criteria."
      minWidth="750px"
    />
  );
}
