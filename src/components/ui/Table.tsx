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
}

export default function Table<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No records found."
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[#0f0f0f] border-b border-white/5 text-white/40 uppercase text-[9px] tracking-wider text-left">
            {columns.map((col, idx) => (
              <th key={idx} className={`p-4 font-semibold ${col.className || ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-20 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
                  <span className="text-[10px] tracking-widest text-white/40 uppercase">Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-20 text-center">
                <span className="text-[10.5px] uppercase tracking-widest text-white/40">{emptyMessage}</span>
              </td>
            </tr>
          ) : (
            data.map((item, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-white/5 hover:bg-white/2 transition-colors"
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`p-4 ${col.className || ""}`}>
                    {col.render(item, rowIdx)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
