import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2, HelpCircle, ArrowUpDown, Sparkles } from "lucide-react";
import { getRequest, postRequest, putRequest, deleteRequest } from "../services/api";
import { toast } from "sonner";
import Table from "../components/ui/Table";
import Modal from "../components/ui/Modal";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal";

interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  order: number;
}

export default function FAQs() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await getRequest<{ success: boolean; faqs: FAQItem[] }>("/faqs");
      if (res.success) {
        setFaqs(res.faqs);
      }
    } catch (err: any) {
      toast.error("Failed to load FAQs.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setQuestion("");
    setAnswer("");
    setOrder(faqs.length); // Default to placing at the end
    setShowModal(true);
  };

  const openEditModal = (item: FAQItem) => {
    setModalMode("edit");
    setEditingId(item._id);
    setQuestion(item.question);
    setAnswer(item.answer);
    setOrder(item.order);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !answer) {
      toast.error("Please enter a question and an answer.");
      return;
    }

    setFormLoading(true);
    const payload = { question, answer, order: Number(order) };

    try {
      if (modalMode === "create") {
        const res = await postRequest<{ success: boolean }>("/faqs", payload);
        if (res.success) {
          toast.success("FAQ added successfully.");
        }
      } else {
        const res = await putRequest<{ success: boolean }>(`/faqs/${editingId}`, payload);
        if (res.success) {
          toast.success("FAQ updated successfully.");
        }
      }
      setShowModal(false);
      fetchFaqs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save FAQ.");
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDeleteFaq = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    try {
      const res = await deleteRequest<{ success: boolean }>(`/faqs/${deleteConfirmId}`);
      if (res.success) {
        toast.success("FAQ deleted successfully.");
        setDeleteConfirmId(null);
        fetchFaqs();
      }
    } catch (err: any) {
      toast.error("Failed to delete FAQ.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: "Sort Order",
      className: "w-20 text-center font-mono text-[#351E28]/60",
      render: (item: FAQItem) => (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-[#351E28]/5 font-bold text-xs">
          {item.order}
        </span>
      )
    },
    {
      header: "Question",
      className: "font-serif text-sm font-semibold text-left max-w-xs leading-relaxed text-[#351E28]",
      render: (item: FAQItem) => <span>{item.question}</span>
    },
    {
      header: "Answer Explanation",
      className: "text-left font-sans text-xs leading-relaxed text-[#351E28]/70 max-w-md",
      render: (item: FAQItem) => <span>{item.answer}</span>
    },
    {
      header: "Actions",
      className: "text-right w-24",
      render: (item: FAQItem) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => openEditModal(item)}
            className="p-2 rounded-xl hover:bg-[#351E28]/5 text-[#351E28]/70 hover:text-luxury-gold transition-colors cursor-pointer"
            title="Edit FAQ"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirmId(item._id)}
            className="p-2 rounded-xl hover:bg-red-50 text-[#351E28]/50 hover:text-red-600 transition-colors cursor-pointer"
            title="Delete FAQ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full space-y-6 text-left min-h-0 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[9px] tracking-[0.25em] uppercase text-luxury-gold font-bold font-mono">
            Website Help Resources
          </span>
          <h1 className="font-serif text-2xl md:text-3xl text-[#351E28] font-normal mt-1">
            Frequently Asked Questions
          </h1>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#C8A96A] hover:bg-[#B89858] text-[#351E28] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer hover:scale-102 active:scale-98"
        >
          <Plus className="w-4 h-4" /> Add FAQ Item
        </button>
      </div>

      {/* FAQs List Table */}
      <div className="flex-1 min-h-0">
        <Table
          columns={columns}
          data={faqs}
          loading={loading}
          emptyMessage="No FAQs defined."
        />
      </div>

      {/* CRUD FAQ Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === "create" ? "Add FAQ Resource" : "Edit FAQ Resource"}
        subtitle="Customer Helpdesk"
        maxWidthClassName="max-w-lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* Question */}
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-[#351E28]/70 mb-1.5 font-bold font-mono">
              Question <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <HelpCircle className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 transition-all font-sans"
                placeholder="e.g. How do I care for my Viraasat jewelry?"
                required
              />
            </div>
          </div>

          {/* Answer */}
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-[#351E28]/70 mb-1.5 font-bold font-mono">
              Answer Explanation <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                rows={4}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 transition-all leading-relaxed"
                placeholder="Provide detailed, helpful answers and care instructions for patrons..."
                required
              />
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-[#351E28]/70 mb-1.5 font-bold font-mono">
              Display Sequence Order <span className="text-[9px] text-[#351E28]/40 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative max-w-xs">
              <ArrowUpDown className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#351E28]/15 text-xs text-[#351E28] focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 transition-all font-mono"
                placeholder="0, 1, 2..."
              />
            </div>
            <p className="text-[10px] text-[#351E28]/50 mt-1 font-sans">
              Lower order numbers are placed higher up in the public FAQ accordion.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#351E28]/10">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-2.5 rounded-full border border-[#351E28]/15 bg-white text-[#351E28] hover:bg-[#351E28]/5 text-xs tracking-wider uppercase font-semibold transition-all cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="bg-[#C8A96A] hover:bg-[#B89858] text-[#351E28] px-6 py-2.5 rounded-full text-xs tracking-wider uppercase font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {formLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save FAQ Item</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Popup */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteFaq}
        loading={deleteLoading}
        title="Retire FAQ Item"
        message="Are you sure you want to permanently delete this Frequently Asked Question (FAQ) from user reference tables?"
      />
    </div>
  );
}
