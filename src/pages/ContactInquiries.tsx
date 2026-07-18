import { useState, useEffect } from "react";
import { Trash2, Loader2, MailOpen, Calendar } from "lucide-react";
import { getRequest, deleteRequest } from "../services/api";
import { toast } from "sonner";

export default function ContactInquiries() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await deleteRequest(`/admin/contact/${id}`);
      if (res.success) {
        toast.success("Message deleted successfully.");
        fetchInquiries();
      }
    } catch (err: any) {
      console.error("Failed to delete inquiry:", err);
      const errMsg = err.response?.data?.message || "Failed to delete message. Please try again.";
      toast.error(errMsg);
    }
  };

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
      <div className="bg-white/60 backdrop-blur-md border border-[#C8A96A]/10 rounded-3xl overflow-hidden shadow-sm">
        
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-luxury-gold animate-spin" />
            <p className="text-xs text-verdant-emerald/40 tracking-widest uppercase font-bold font-mono">Loading messages...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="py-24 text-center">
            <MailOpen className="w-12 h-12 text-[#C8A96A]/30 mx-auto mb-4" />
            <h3 className="font-serif text-lg font-light text-verdant-emerald">No Inquiries Found</h3>
            <p className="text-xs text-verdant-emerald/60 max-w-sm mx-auto mt-1 leading-relaxed">
              There are no messages logged in the database.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#C8A96A]/10 bg-verdant-emerald/[0.02] text-[10px] tracking-wider font-mono uppercase text-verdant-emerald/55">
                  <th className="py-4 px-6 font-semibold">Name</th>
                  <th className="py-4 px-6 font-semibold">Email</th>
                  <th className="py-4 px-6 font-semibold">Phone</th>
                  <th className="py-4 px-6 font-semibold">Subject</th>
                  <th className="py-4 px-6 font-semibold">Message</th>
                  <th className="py-4 px-6 font-semibold">Submitted</th>
                  <th className="py-4 px-6 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C8A96A]/5 font-sans text-xs">
                {inquiries.map((inquiry) => (
                  <tr key={inquiry._id} className="hover:bg-verdant-emerald/[0.01] transition-colors">
                    
                    {/* Name */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-bold text-[#0F4C3A] font-serif tracking-wide block">
                        {inquiry.name}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6 font-mono text-[11px] text-verdant-emerald/85">
                      <a href={`mailto:${inquiry.email}`} className="hover:text-luxury-gold transition-colors">
                        {inquiry.email}
                      </a>
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-6 font-mono text-[11px] text-verdant-emerald/75 whitespace-nowrap">
                      {inquiry.phone ? (
                        <a href={`tel:${inquiry.phone}`} className="hover:text-luxury-gold transition-colors">
                          {inquiry.phone}
                        </a>
                      ) : (
                        <span className="text-verdant-emerald/30 italic">N/A</span>
                      )}
                    </td>

                    {/* Subject */}
                    <td className="py-4 px-6 text-verdant-emerald/85 font-semibold">
                      {inquiry.subject}
                    </td>

                    {/* Message Body */}
                    <td className="py-4 px-6 text-verdant-emerald/70 min-w-[250px] max-w-sm whitespace-pre-wrap select-text">
                      {inquiry.message}
                    </td>

                    {/* Date Submitted */}
                    <td className="py-4 px-6 font-mono text-[10px] text-verdant-emerald/50 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-luxury-gold/75" />
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Delete Action */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(inquiry._id)}
                        className="p-2 rounded-lg border border-red-500/10 hover:border-red-500 hover:text-red-600 hover:bg-red-500/5 text-red-500/80 bg-white/40 cursor-pointer transition-colors"
                        title="Delete Message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
