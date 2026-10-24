import React from "react";
import { Loader2 } from "lucide-react";

export interface TableColumn<T> {
  header: string;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  minWidth?: string;
}

export default function Table<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No records found.",
  className = "",
  minWidth
}: TableProps<T>) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-luxury-border bg-white/60 shadow-[0_8px_32px_rgba(53,30,40,0.03)] backdrop-blur-md flex flex-col h-full min-h-0 ${className}`}>
      <div className="overflow-y-auto overflow-x-auto flex-1 custom-scrollbar min-h-0 overscroll-contain">
        <table
          className="w-full min-w-full text-xs border-collapse relative"
          style={minWidth ? { minWidth } : undefined}
        >
          <thead className="sticky top-0 z-10 bg-[#EDE5DD]">
            <tr className="bg-[#351E28]/5 border-b border-luxury-border text-[#351E28]/70 uppercase text-[9px] tracking-wider text-left">
              {columns.map((col, idx) => (
                <th key={idx} className={`p-4 font-bold tracking-widest ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-luxury-border">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-luxury-gold" />
                    <span className="text-[10px] tracking-widest text-[#351E28]/40 uppercase font-mono">Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  <span className="text-[10.5px] uppercase tracking-widest text-[#351E28]/40 font-mono">{emptyMessage}</span>
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-[#351E28]/[0.02] transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`p-4 text-[#351E28] ${col.className || ""}`}>
                      {col.render(item, rowIdx)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
