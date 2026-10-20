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
      subtitle="Action Requires Confirmation"
      maxWidthClassName="max-w-md"
      scrollable={false}
    >
      <div className="text-center pt-2 pb-2">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200/80 flex items-center justify-center text-red-500 mx-auto mb-4 shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <p className="text-[#351E28]/80 text-sm mb-7 leading-relaxed font-sans max-w-sm mx-auto">
          {message}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 rounded-full border border-[#351E28]/15 bg-white text-[#351E28] hover:bg-[#351E28]/5 text-xs tracking-wider uppercase font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full text-xs tracking-wider uppercase font-bold transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-2 justify-center"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
