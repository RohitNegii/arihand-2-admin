import { useState, useEffect } from "react";
import { Search, Loader2, User, Mail, Phone, Calendar, Trash2, ShieldAlert } from "lucide-react";
import { getRequest, deleteRequest } from "../services/api";
import { toast } from "sonner";
import Table from "../components/ui/Table";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      toast.error(err.response?.data?.message || "Failed to load patrons.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    try {
      const res = await deleteRequest<{ success: boolean; message: string }>(`/auth/users/${deleteConfirmId}`);
      if (res.success) {
        toast.success(res.message || "Patron removed successfully.");
        setDeleteConfirmId(null);
        setDeleteConfirmName("");
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete patron.");
    } finally {
      setDeleteLoading(false);
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
            setDeleteConfirmId(item._id);
            setDeleteConfirmName(item.name);
          }}
          className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-500 transition-colors cursor-pointer"
          title="Delete patron record"
        >
          <Trash2 className="w-4 h-4" />
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
            patrons database
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
        emptyMessage="No patron records matched the query."
      />

      {/* Delete Confirmation Popup */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => {
          setDeleteConfirmId(null);
          setDeleteConfirmName("");
        }}
        onConfirm={confirmDeleteUser}
        loading={deleteLoading}
        title="Retire Patron Account"
        message={`Are you sure you want to permanently delete the patron account for "${deleteConfirmName}"? This action is irreversible.`}
      />
    </div>
  );
}
