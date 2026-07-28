import { useState } from "react";
import { KeyRound, ShieldCheck, Eye, EyeOff, Lock } from "lucide-react";
import { postRequest } from "../services/api";
import { toast } from "sonner";

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await postRequest("/auth/change-password", {
        currentPassword,
        newPassword
      });

      if (res.success) {
        toast.success("Admin password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.message || "Failed to change password.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error changing password.");
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Security & Settings" }
  ];

  return (
    <div className="space-y-6 text-left max-w-2xl mx-auto">
      {/* Breadcrumbs & Header */}
      <div>
        <div className="flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.25em] font-mono text-[#0F4C3A]/50 font-bold mb-2">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              <span>{b.label}</span>
            </span>
          ))}
        </div>
        <h1 className="font-serif text-3xl text-[#0F4C3A] font-light tracking-wide">
          Account Settings
        </h1>
        <p className="text-[#0F4C3A]/60 text-xs font-light tracking-wide mt-1">
          Manage your credentials and security settings for the admin panel.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="glass-card bg-white/40 border border-[#0F4C3A]/10 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(15,76,58,0.02)] backdrop-blur-md">
        <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#0F4C3A]/10">
          <KeyRound className="w-5 h-5 text-luxury-gold" />
          <h2 className="font-serif text-lg font-light text-[#0F4C3A]">
            Change Password
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div className="space-y-2">
            <label className="block text-[9px] uppercase tracking-widest text-[#0F4C3A]/70 font-bold">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full text-xs text-[#0F4C3A] bg-[#faf7f2]/80 border border-[#0F4C3A]/15 rounded-xl pl-10 pr-10 py-3.5 focus:outline-hidden focus:border-luxury-gold focus:bg-white placeholder-[#0F4C3A]/30 transition-colors font-mono font-bold tracking-widest text-center"
              />
              <Lock className="w-4 h-4 text-[#0F4C3A]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0F4C3A]/40 hover:text-[#0F4C3A] cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label className="block text-[9px] uppercase tracking-widest text-[#0F4C3A]/70 font-bold">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                className="w-full text-xs text-[#0F4C3A] bg-[#faf7f2]/80 border border-[#0F4C3A]/15 rounded-xl pl-10 pr-10 py-3.5 focus:outline-hidden focus:border-luxury-gold focus:bg-white placeholder-[#0F4C3A]/30 transition-colors font-mono font-bold tracking-widest text-center"
              />
              <Lock className="w-4 h-4 text-[#0F4C3A]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0F4C3A]/40 hover:text-[#0F4C3A] cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <label className="block text-[9px] uppercase tracking-widest text-[#0F4C3A]/70 font-bold">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full text-xs text-[#0F4C3A] bg-[#faf7f2]/80 border border-[#0F4C3A]/15 rounded-xl pl-10 pr-10 py-3.5 focus:outline-hidden focus:border-luxury-gold focus:bg-white placeholder-[#0F4C3A]/30 transition-colors font-mono font-bold tracking-widest text-center"
              />
              <Lock className="w-4 h-4 text-[#0F4C3A]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0F4C3A]/40 hover:text-[#0F4C3A] cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[10px] text-red-600 font-bold font-mono uppercase tracking-wide mt-1">
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="bg-[#0F4C3A] text-white hover:text-luxury-gold hover:scale-102 active:scale-98 text-[9px] tracking-widest uppercase font-bold py-3.5 px-6 rounded-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 w-full md:w-auto cursor-pointer disabled:opacity-50 disabled:no-underline font-mono mt-4 ml-auto"
          >
            {loading ? "Updating Credentials..." : "Update Password"}
            <ShieldCheck className="w-4.5 h-4.5 text-luxury-gold" />
          </button>
        </form>
      </div>
    </div>
  );
}
