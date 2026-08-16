import { useState, useEffect } from "react";
import { Trash2, Loader2, MailOpen, Calendar } from "lucide-react";
import { getRequest, deleteRequest } from "../services/api";
import { toast } from "sonner";
import Table from "../components/ui/Table";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal";

export default function ContactInquiries() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await getRequest("/admin/contact");
      if (res.success) {
        setInquiries(res.inquiries || []);
      }
    } catch (err) {
      console.error("Failed to load contact inquiries:", err);
      toast.error("Failed to load contact inquiries.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    try {
      const res = await deleteRequest(`/admin/contact/${deleteConfirmId}`);
      if (res.success) {
        toast.success("Message deleted successfully.");
        setDeleteConfirmId(null);
        fetchInquiries();
      }
    } catch (err: any) {
      console.error("Failed to delete inquiry:", err);
      const errMsg = err.response?.data?.message || "Failed to delete message. Please try again.";
      toast.error(errMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: "Name",
      render: (inquiry: any) => (
        <span className="font-bold text-[#351E28] font-serif tracking-wide block">
          {inquiry.name}
        </span>
      )
    },
    {
      header: "Email",
      className: "font-mono text-[11px] text-verdant-emerald/85",
      render: (inquiry: any) => (
        <a href={`mailto:${inquiry.email}`} className="hover:text-luxury-gold transition-colors">
          {inquiry.email}
        </a>
      )
    },
    {
      header: "Phone",
      className: "font-mono text-[11px] text-verdant-emerald/75 whitespace-nowrap",
      render: (inquiry: any) => inquiry.phone ? (
        <a href={`tel:${inquiry.phone}`} className="hover:text-luxury-gold transition-colors">
          {inquiry.phone}
        </a>
      ) : (
        <span className="text-verdant-emerald/30 italic">N/A</span>
      )
    },
    {
      header: "Subject",
      className: "text-verdant-emerald/85 font-semibold",
      render: (inquiry: any) => <span>{inquiry.subject}</span>
    },
    {
      header: "Message",
      className: "text-verdant-emerald/70 min-w-[250px] max-w-sm whitespace-pre-wrap select-text",
      render: (inquiry: any) => <span>{inquiry.message}</span>
    },
    {
      header: "Submitted",
      className: "font-mono text-[10px] text-verdant-emerald/50 whitespace-nowrap",
      render: (inquiry: any) => (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-luxury-gold/75" />
          {new Date(inquiry.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      header: "Action",
      className: "text-right",
      render: (inquiry: any) => (
        <button
          onClick={() => setDeleteConfirmId(inquiry._id)}
          className="p-2 rounded-lg border border-red-500/10 hover:border-red-500 hover:text-red-600 hover:bg-red-500/5 text-red-500/80 bg-white/40 cursor-pointer transition-colors"
          title="Delete Message"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8 text-left text-verdant-emerald select-none">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-light tracking-wide text-verdant-emerald">
          Contact Messages
        </h1>
        <p className="text-xs text-verdant-emerald/60 mt-1">
          Review and manage user inquiries and feedback submissions.
        </p>
      </div>

      {/* INQUIRIES LIST / DATA TABLE */}
      <Table
        columns={columns}
        data={inquiries}
        loading={loading}
        emptyMessage="No Inquiries Found"
      />

      {/* Delete Confirmation Popup */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Discard Contact Inquiry"
        message="Are you sure you want to permanently delete this customer contact inquiry message from backend database registers?"
      />
    </div>
  );
}
