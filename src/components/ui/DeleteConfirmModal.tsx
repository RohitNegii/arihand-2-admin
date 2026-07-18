
import { AlertTriangle, Loader2 } from "lucide-react";
import Modal from "./Modal";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm Delete",
  cancelText = "Cancel",
  loading = false
}: DeleteConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="catalog protection"
      maxWidthClassName="max-w-md"
      scrollable={false}
    >
      <div className="text-center pt-2">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <p className="text-[#0F4C3A]/70 text-xs mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-full border border-[#0F4C3A]/15 text-[#0F4C3A] hover:bg-[#0F4C3A]/5 text-[9.5px] tracking-wider uppercase font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-full text-[9.5px] tracking-wider uppercase font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5 justify-center"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
