import { useState, useEffect } from "react";
import { Search, Loader2, User, Mail, Phone, Calendar, Trash2, ShieldAlert } from "lucide-react";
import { getRequest, deleteRequest } from "../services/api";
import { toast } from "sonner";

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

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete patron "${name}"? This action is irreversible.`)) {
      return;
    }
    try {
      const res = await deleteRequest<{ success: boolean; message: string }>(`/auth/users/${id}`);
      if (res.success) {
        toast.success(res.message || "Patron removed successfully.");
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete patron.");
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
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
            <span className="text-[10px] tracking-widest text-white/40 uppercase font-mono">
              Fetching records...
            </span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center">
            <ShieldAlert className="w-8 h-8 text-white/20 mx-auto mb-4" />
            <p className="text-[10.5px] uppercase tracking-widest text-white/40">
              No patron records matched the query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#0f0f0f] border-b border-white/5 text-white/40 uppercase text-[9px] tracking-wider text-left">
                  <th className="p-4 font-semibold">Moniker & Email</th>
                  <th className="p-4 font-semibold">Contact Details</th>
                  <th className="p-4 font-semibold">Access Privilege</th>
                  <th className="p-4 font-semibold">Date Onboarded</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item) => (
                  <tr key={item._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="p-4 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-luxury-gold/10 border border-luxury-gold/25 flex items-center justify-center text-luxury-gold font-bold text-xs uppercase font-serif shrink-0">
                          {item.name ? item.name.charAt(0) : <User className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-serif text-sm font-light text-white leading-snug">{item.name}</h4>
                          <span className="text-[10.5px] text-white/50 flex items-center gap-1 font-mono mt-0.5">
                            <Mail className="w-3 h-3 shrink-0" /> {item.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-left text-white/70 font-mono">
                      {item.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-white/40 shrink-0" /> {item.phone}
                        </span>
                      ) : (
                        <span className="text-white/30 italic">No phone record</span>
                      )}
                    </td>
                    <td className="p-4 text-left">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono bg-white/5 text-luxury-gold border border-luxury-gold/20">
                        {item.role}
                      </span>
                    </td>
                    <td className="p-4 text-left text-white/60 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-white/30 shrink-0" />
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(item._id, item.name)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete patron record"
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
