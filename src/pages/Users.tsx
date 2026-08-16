import { useState, useEffect } from "react";
import { Search, Loader2, User, Mail, Phone, Calendar, ShieldAlert, ShieldCheck } from "lucide-react";
import { getRequest, putRequest } from "../services/api";
import { toast } from "sonner";
import Table from "../components/ui/Table";
import Modal from "../components/ui/Modal";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Block/Unblock Dialog state
  const [blockConfirmId, setBlockConfirmId] = useState<string | null>(null);
  const [blockConfirmName, setBlockConfirmName] = useState<string>("");
  const [blockConfirmAction, setBlockConfirmAction] = useState<"block" | "unblock">("block");
  const [blockLoading, setBlockLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getRequest<{ success: boolean; users: UserProfile[] }>("/auth/users");
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlockUser = async () => {
    if (!blockConfirmId) return;
    setBlockLoading(true);
    try {
      const res = await putRequest<{ success: boolean; message: string }>(`/auth/users/${blockConfirmId}/toggle-block`);
      if (res.success) {
        toast.success(res.message || `User account has been successfully ${blockConfirmAction}ed.`);
        setBlockConfirmId(null);
        setBlockConfirmName("");
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${blockConfirmAction} user.`);
    } finally {
      setBlockLoading(false);
    }
  };

  // Filter users by name or email
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.phone && u.phone.includes(query))
    );
  });

  const columns = [
    {
      header: "Moniker & Email",
      render: (item: UserProfile) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-luxury-gold/10 border border-luxury-gold/25 flex items-center justify-center text-luxury-gold font-bold text-xs uppercase font-serif shrink-0">
            {item.name ? item.name.charAt(0) : <User className="w-3.5 h-3.5" />}
          </div>
          <div className="min-w-0">
            <h4 className="font-serif text-sm font-light leading-snug">{item.name}</h4>
            <span className="text-[10.5px] text-white/50 flex items-center gap-1 font-mono mt-0.5">
              <Mail className="w-3 h-3 shrink-0" /> {item.email}
            </span>
          </div>
        </div>
      )
    },
    {
      header: "Contact Details",
      className: "font-mono",
      render: (item: UserProfile) => item.phone ? (
        <span className="flex items-center gap-1">
          <Phone className="w-3.5 h-3.5 text-white/40 shrink-0" /> {item.phone}
        </span>
      ) : (
        <span className="text-white/40 italic">No phone record</span>
      )
    },
    {
      header: "Access Privilege",
      render: (item: UserProfile) => (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono bg-white/5 text-luxury-gold border border-luxury-gold/20">
          {item.role}
        </span>
      )
    },
    {
      header: "Status",
      render: (item: UserProfile) => (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono border ${item.isBlocked
            ? "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}>
          {item.isBlocked ? "Blocked" : "Active"}
        </span>
      )
    },
    {
      header: "Date Onboarded",
      className: "font-mono",
      render: (item: UserProfile) => (
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-white/40 shrink-0" />
          {new Date(item.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (item: UserProfile) => (
        <button
          onClick={() => {
            setBlockConfirmId(item._id);
            setBlockConfirmName(item.name);
            setBlockConfirmAction(item.isBlocked ? "unblock" : "block");
          }}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${item.isBlocked
              ? "hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-500"
              : "hover:bg-red-500/10 text-white/40 hover:text-red-500"
            }`}
          title={item.isBlocked ? "Unblock user account" : "Block user account"}
        >
          {item.isBlocked ? (
            <ShieldCheck className="w-4.5 h-4.5" />
          ) : (
            <ShieldAlert className="w-4.5 h-4.5" />
          )}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8 text-left">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[8px] tracking-widest uppercase text-luxury-gold font-bold font-mono">
            users database
          </span>
          <h1 className="font-serif text-2xl text-white mt-1">Users Directory</h1>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex gap-4 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/3 border border-white/8 text-xs text-white placeholder-white/30 focus:border-luxury-gold focus:outline-hidden transition-colors"
          />
        </div>
      </div>

      {/* Patrons Directory Table */}
      <Table
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage="No user records matched the query."
      />

      {/* Block/Unblock Confirmation Popup */}
      <Modal
        isOpen={!!blockConfirmId}
        onClose={() => {
          setBlockConfirmId(null);
          setBlockConfirmName("");
        }}
        title={blockConfirmAction === "block" ? "Block User Account" : "Unblock User Account"}
        subtitle="directory security"
        maxWidthClassName="max-w-md"
        scrollable={false}
      >
        <div className="text-center pt-2">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${blockConfirmAction === "block"
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            }`}>
            {blockConfirmAction === "block" ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>

          <p className="text-[#351E28]/70 text-xs mb-6 leading-relaxed">
            {blockConfirmAction === "block"
              ? `Are you sure you want to block the account for "${blockConfirmName}"? This user will be immediately logged out and prevented from signing in.`
              : `Are you sure you want to unblock the account for "${blockConfirmName}"? This user will regain access to sign in.`
            }
          </p>

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => {
                setBlockConfirmId(null);
                setBlockConfirmName("");
              }}
              disabled={blockLoading}
              className="px-5 py-2 rounded-full border border-[#351E28]/15 text-[#351E28] hover:bg-[#351E28]/5 text-[9.5px] tracking-wider uppercase font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleToggleBlockUser}
              disabled={blockLoading}
              className={`px-5 py-2 rounded-full text-[9.5px] tracking-wider uppercase font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5 justify-center text-white ${blockConfirmAction === "block"
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-emerald-600 hover:bg-emerald-500"
                }`}
            >
              {blockLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {blockConfirmAction === "block" ? "Block User" : "Unblock User"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
