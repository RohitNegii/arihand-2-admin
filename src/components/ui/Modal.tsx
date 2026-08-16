import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidthClassName?: string;
  scrollable?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClassName = "max-w-4xl",
  scrollable = true
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 md:p-6">
      <div className={`glass-card rounded-3xl p-6 md:p-8 ${maxWidthClassName} w-full max-h-[90vh] flex flex-col border border-luxury-gold/15 relative text-left shadow-2xl animate-fade-in`}>

        {/* Modal Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#351E28]/50 hover:text-[#351E28] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-[#351E28]/10 pb-4 mb-6 shrink-0">
          {subtitle && (
            <span className="text-[8px] tracking-widest uppercase text-luxury-gold font-bold font-mono block">
              {subtitle}
            </span>
          )}
          <h2 className="font-serif text-xl text-[#351E28] mt-1 font-light">
            {title}
          </h2>
        </div>

        {/* Modal Body */}
        <div className={`flex-1 min-h-0 ${scrollable ? "overflow-y-auto pr-3 pb-2 custom-scrollbar" : "flex flex-col"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
