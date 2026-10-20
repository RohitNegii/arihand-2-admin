import React, { useEffect } from "react";
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
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#351E28]/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 md:p-6 transition-all animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-[#FDFBF9] rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-8 ${maxWidthClassName} w-full max-h-[92vh] flex flex-col border border-[#C8A96A]/25 relative text-left shadow-[0_20px_60px_-15px_rgba(53,30,40,0.3)]`}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close modal"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-[#351E28]/5 hover:bg-[#351E28]/12 text-[#351E28]/60 hover:text-[#351E28] transition-all flex items-center justify-center cursor-pointer hover:rotate-90 duration-200"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-[#351E28]/10 pb-4 mb-5 shrink-0 pr-8">
          {subtitle && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C8A96A]/10 border border-[#C8A96A]/20 text-[9px] tracking-[0.2em] uppercase text-[#9A7432] font-bold font-mono mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold inline-block animate-pulse" />
              {subtitle}
            </div>
          )}
          <h2 className="font-serif text-xl sm:text-2xl text-[#351E28] font-normal tracking-wide leading-tight">
            {title}
          </h2>
        </div>

        {/* Modal Body */}
        <div className={`flex-1 min-h-0 ${scrollable ? "overflow-y-auto pr-2 pb-1 custom-scrollbar" : "flex flex-col"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
