import { useState, useEffect } from "react";
import { KeyRound, ShieldCheck, Eye, EyeOff, Lock, MessageCircle, Phone, Check, AlertCircle } from "lucide-react";
import { getRequest, postRequest, putRequest } from "../services/api";
import { toast } from "sonner";

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);

  // WhatsApp Configuration State
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [whatsappLoading, setWhatsappLoading] = useState<boolean>(false);
  const [fetchingWhatsapp, setFetchingWhatsapp] = useState<boolean>(true);

  useEffect(() => {
    const fetchWhatsappSettings = async () => {
      try {
        const res = await getRequest("/settings/whatsapp");
        if (res.success && res.whatsapp) {
          setWhatsappNumber(res.whatsapp.number || "");
        }
      } catch (err: any) {
        console.error("Failed to load whatsapp settings", err);
      } finally {
        setFetchingWhatsapp(false);
      }
    };

    fetchWhatsappSettings();
  }, []);

  const handleWhatsappSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappNumber.trim()) {
      toast.error("Please enter a valid WhatsApp phone number.");
      return;
    }

    setWhatsappLoading(true);
    try {
      const res = await putRequest("/settings/whatsapp", {
        number: whatsappNumber.trim()
      });
      if (res.success) {
        toast.success("Business WhatsApp number updated successfully!");
        if (res.whatsapp) {
          setWhatsappNumber(res.whatsapp.number);
        }
      } else {
        toast.error(res.message || "Failed to update WhatsApp settings.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error updating WhatsApp settings.");
    } finally {
      setWhatsappLoading(false);
    }
  };

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

  const cleanWaNumber = whatsappNumber.replace(/[^0-9]/g, "");

  return (
    <div className="h-full overflow-y-auto space-y-8 text-left max-w-3xl mx-auto custom-scrollbar pr-2 min-h-0 pb-12">
      {/* Breadcrumbs & Header */}
      <div>
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] font-mono text-[#351E28]/50 font-bold mb-2">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-[#351E28]/25">/</span>}
              <span className={i === breadcrumbs.length - 1 ? "text-luxury-gold" : ""}>{b.label}</span>
            </span>
          ))}
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-[#351E28] font-normal tracking-wide">
          Account & Store Settings
        </h1>
        <p className="text-[#351E28]/60 text-xs md:text-sm font-normal tracking-wide mt-1 leading-relaxed">
          Manage administrative credentials, site-wide promotions, and patron communication preferences.
        </p>
      </div>

      {/* 1. Change Password Card */}
      <div className="bg-white/80 backdrop-blur-md border border-[#351E28]/10 rounded-3xl p-6 sm:p-8 shadow-[0_10px_35px_rgba(53,30,40,0.03)] transition-all">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#351E28]/10">
          <div className="w-10 h-10 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/25 flex items-center justify-center text-[#9A7432] shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-normal text-[#351E28]">
              Change Administrative Password
            </h2>
            <p className="text-[11px] text-[#351E28]/50">
              Ensure your internal gateway account uses a strong, private passphrase.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-[#351E28]/70 font-bold font-mono mb-1.5">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#F7F2EE]/50 border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 focus:bg-white transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#351E28]/40 hover:text-[#351E28] cursor-pointer transition-colors"
                aria-label={showCurrent ? "Hide current password" : "Show current password"}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New Password */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#351E28]/70 font-bold font-mono mb-1.5">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#F7F2EE]/50 border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 focus:bg-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#351E28]/40 hover:text-[#351E28] cursor-pointer transition-colors"
                  aria-label={showNew ? "Hide new password" : "Show new password"}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#351E28]/70 font-bold font-mono mb-1.5">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#F7F2EE]/50 border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 focus:bg-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#351E28]/40 hover:text-[#351E28] cursor-pointer transition-colors"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Validation cues */}
          {newPassword && confirmPassword && (
            <div className={`text-xs flex items-center gap-1.5 p-2 rounded-xl font-medium ${
              newPassword === confirmPassword ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}>
              {newPassword === confirmPassword ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Passwords match!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>Passwords do not match yet.</span>
                </>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="bg-[#351E28] hover:bg-[#2A161F] text-white hover:text-luxury-gold text-xs tracking-wider uppercase font-bold py-3 px-7 rounded-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4 text-luxury-gold" />
              <span>{loading ? "Updating Credentials..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* WhatsApp Business Configuration Card */}
      <div className="bg-white/80 backdrop-blur-md border border-[#351E28]/10 rounded-3xl p-6 sm:p-8 shadow-[0_10px_35px_rgba(53,30,40,0.03)] transition-all">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#351E28]/10">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-normal text-[#351E28]">
              WhatsApp Concierge Ordering
            </h2>
            <p className="text-[11px] text-[#351E28]/50">
              Direct checkout link where customers send one-click order confirmation messages.
            </p>
          </div>
        </div>

        {fetchingWhatsapp ? (
          <div className="py-8 text-center text-xs font-mono text-[#351E28]/60 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-luxury-gold animate-ping" />
            Loading WhatsApp configuration...
          </div>
        ) : (
          <form onSubmit={handleWhatsappSubmit} className="space-y-5">
            {/* WhatsApp Number Input */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#351E28]/70 font-bold font-mono mb-1.5">
                Concierge WhatsApp Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +91 98765 43210 or 919876543210"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7F2EE]/50 border border-[#351E28]/15 text-xs text-[#351E28] placeholder-[#351E28]/35 focus:outline-hidden focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/25 focus:bg-white transition-all font-mono"
                />
              </div>
              <p className="text-[11px] text-[#351E28]/55 font-sans mt-1.5 leading-relaxed">
                Include country code (e.g. <span className="font-mono font-bold text-[#351E28]">91</span> for India). Customers will automatically be routed with their cart details pre-filled.
              </p>
            </div>

            {/* Live WhatsApp Link Preview */}
            {cleanWaNumber && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-xs flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-emerald-800 font-bold block text-[11px]">Live Customer Gateway URL:</span>
                  <span className="font-mono text-emerald-700 truncate block text-[10.5px]">
                    https://wa.me/{cleanWaNumber}
                  </span>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={whatsappLoading}
                className="bg-[#351E28] hover:bg-[#2A161F] text-white hover:text-luxury-gold text-xs tracking-wider uppercase font-bold py-3 px-7 rounded-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-40"
              >
                <ShieldCheck className="w-4 h-4 text-luxury-gold" />
                <span>{whatsappLoading ? "Saving WhatsApp..." : "Save WhatsApp Number"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
