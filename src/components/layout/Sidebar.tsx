import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderOpen,
  FileText,
  LogOut,
  Sparkles,
  Mail,
  Users as UsersIcon,
  HelpCircle
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Products", path: "/products", icon: ShoppingBag },
    { name: "Categories", path: "/categories", icon: FolderOpen },
    { name: "Orders", path: "/orders", icon: FileText },
    { name: "Patrons Directory", path: "/users", icon: UsersIcon },
    { name: "FAQs Manager", path: "/faqs", icon: HelpCircle },
    { name: "Contact Messages", path: "/contact", icon: Mail }
  ];

  const handleLogout = () => {
    localStorage.removeItem("aurum_admin_token");
    localStorage.removeItem("aurum_admin_user");
    navigate("/login");
  };

  const adminUser = JSON.parse(localStorage.getItem("aurum_admin_user") || "{}");

  return (
    <aside className="w-64 bg-[#0F4C3A] border-r border-luxury-gold/15 flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-luxury-gold/15 gap-2">
        <Sparkles className="w-5 h-5 text-luxury-gold animate-pulse" />
        <span className="font-serif tracking-[0.2em] font-light text-md uppercase text-white">
          AURUM ADMIN
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                isActive
                  ? "bg-luxury-gold text-[#0F4C3A] shadow-[0_4px_12px_rgba(200,169,106,0.35)] scale-[1.02]"
                  : "text-white/80 hover:text-white hover:bg-[#0B3A2C]"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Session Info & Logout */}
      <div className="p-4 border-t border-luxury-gold/15 bg-[#0B3A2C]">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-luxury-gold/15 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold font-bold text-xs uppercase">
            {adminUser.name ? adminUser.name.charAt(0) : "A"}
          </div>
          <div className="min-w-0 text-left">
            <p className="text-xs font-semibold text-white truncate leading-none mb-1">
              {adminUser.name || "Administrator"}
            </p>
            <span className="text-[7.5px] uppercase tracking-widest text-luxury-gold font-bold font-mono">
              Role: {adminUser.role || "Admin"}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors border border-red-500/20"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
