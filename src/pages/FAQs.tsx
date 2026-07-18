import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2, AlertTriangle, X } from "lucide-react";
import { getRequest, postRequest, putRequest, deleteRequest } from "../services/api";
import { toast } from "sonner";

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

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await deleteRequest<{ success: boolean }>(`/faqs/${id}`);
      if (res.success) {
        toast.success("FAQ deleted successfully.");
        fetchFaqs();
      }
    } catch (err: any) {
      toast.error("Failed to delete FAQ.");
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[8px] tracking-widest uppercase text-luxury-gold font-bold font-mono">
            website help resources
          </span>
          <h1 className="font-serif text-2xl text-white mt-1">Frequently Asked Questions</h1>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 bg-luxury-gold hover:opacity-90 text-black px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add FAQ Item
        </button>
      </div>

      {/* FAQs List Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
            <span className="text-[10px] tracking-widest text-white/40 uppercase font-mono">
              Loading FAQs...
            </span>
          </div>
        ) : faqs.length === 0 ? (
          <div className="py-20 text-center">
            <AlertTriangle className="w-8 h-8 text-white/20 mx-auto mb-4" />
            <p className="text-[10.5px] uppercase tracking-widest text-white/40">
              No FAQs defined.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#0f0f0f] border-b border-white/5 text-white/40 uppercase text-[9px] tracking-wider text-left">
                  <th className="p-4 font-semibold w-16 text-center">Sort Order</th>
                  <th className="p-4 font-semibold">Question</th>
                  <th className="p-4 font-semibold">Answer Explanation</th>
                  <th className="p-4 font-semibold text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map((item) => (
                  <tr key={item._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="p-4 text-center font-mono text-white/60">{item.order}</td>
                    <td className="p-4 text-white font-serif text-sm font-light text-left max-w-xs leading-relaxed">
                      {item.question}
                    </td>
                    <td className="p-4 text-white/70 max-w-md text-left font-sans leading-relaxed">
                      {item.answer}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer"
                          title="Edit FAQ"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFaq(item._id)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRUD FAQ Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="glass-card rounded-3xl p-6 md:p-8 max-w-lg w-full border border-white/10 relative text-left">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-lg text-white mb-6">
              {modalMode === "create" ? "Add FAQ Resource" : "Edit FAQ Resource"}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div>
                <label className="block text-[8.5px] tracking-wider uppercase text-white/50 mb-1.5 font-semibold">
                  Question *
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-white/8 text-xs text-white focus:border-luxury-gold focus:outline-hidden"
                  placeholder="How do I care for my Verdant Jewelry?"
                  required
                />
              </div>

              <div>
                <label className="block text-[8.5px] tracking-wider uppercase text-white/50 mb-1.5 font-semibold">
                  Answer *
                </label>
                <textarea
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/3 border border-white/8 text-xs text-white focus:border-luxury-gold focus:outline-hidden leading-relaxed"
                  placeholder="Provide care instructions..."
                  required
                />
              </div>

              <div>
                <label className="block text-[8.5px] tracking-wider uppercase text-white/50 mb-1.5 font-semibold">
                  Sort Order Number (optional)
                </label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="w-full max-w-xs px-3 py-2 rounded-lg bg-white/3 border border-white/8 text-xs text-white focus:border-luxury-gold focus:outline-hidden font-mono"
                  placeholder="0, 1, 2"
                />
                <span className="block text-[8px] text-white/30 font-mono mt-1 uppercase">
                  Lower numbers display first in listings.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-full border border-white/10 text-white text-[9px] tracking-wider uppercase font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-luxury-gold hover:opacity-90 text-black px-5 py-2 rounded-full text-[9px] tracking-wider uppercase font-bold flex items-center justify-center gap-1 shadow-md"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
