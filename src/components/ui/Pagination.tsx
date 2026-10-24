import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange?: (newLimit: number) => void;
  limits?: number[];
  itemLabel?: string;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
  limits = [10, 15, 25, 50],
  itemLabel = "items"
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * limit + 1;
  const endItem = Math.min(safePage * limit, totalItems);

  // Generate page numbers with smart ellipses
  const getPageNumbers = (): (number | string)[] => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    if (safePage <= 4) {
      return [1, 2, 3, 4, 5, "...", safeTotalPages];
    }

    if (safePage >= safeTotalPages - 3) {
      return [
        1,
        "...",
        safeTotalPages - 4,
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages
      ];
    }

    return [1, "...", safePage - 1, safePage, safePage + 1, "...", safeTotalPages];
  };

  const pages = getPageNumbers();

  return (
    <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 py-2 px-1 text-xs font-sans text-[#351E28]/70">
      {/* Left: Summary and limit selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11px] text-[#351E28]/75">
          Showing <span className="font-bold text-[#351E28]">{startItem}–{endItem}</span> of{" "}
          <span className="font-bold text-[#351E28]">{totalItems}</span> {itemLabel}
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-[#351E28]/15">
            <span className="text-[10px] uppercase tracking-wider font-mono text-[#351E28]/50">Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="py-1 px-2 rounded-lg bg-white/70 border border-[#351E28]/15 text-[#351E28] font-mono text-[11px] font-bold focus:border-luxury-gold focus:outline-hidden cursor-pointer shadow-2xs"
            >
              {limits.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safePage <= 1}
          className="p-1.5 rounded-lg border border-[#351E28]/15 bg-white/60 hover:bg-[#351E28]/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
          title="First Page"
          aria-label="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5 text-[#351E28]" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className="p-1.5 rounded-lg border border-[#351E28]/15 bg-white/60 hover:bg-[#351E28]/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
          title="Previous Page"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-[#351E28]" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 text-xs text-[#351E28]/40 select-none font-mono"
                >
                  …
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === safePage;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs ${
                  isActive
                    ? "bg-[#C8A96A] text-[#351E28] border border-[#C8A96A] shadow-xs"
                    : "bg-white/60 hover:bg-[#351E28]/5 border border-[#351E28]/15 text-[#351E28]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
          disabled={safePage >= safeTotalPages}
          className="p-1.5 rounded-lg border border-[#351E28]/15 bg-white/60 hover:bg-[#351E28]/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
          title="Next Page"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5 text-[#351E28]" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safePage >= safeTotalPages}
          className="p-1.5 rounded-lg border border-[#351E28]/15 bg-white/60 hover:bg-[#351E28]/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
          title="Last Page"
          aria-label="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5 text-[#351E28]" />
        </button>
      </div>
    </div>
  );
}
