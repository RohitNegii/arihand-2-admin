import { useState, useEffect } from "react";
import { KeyRound, ShieldCheck, Eye, EyeOff, Lock, Percent, Tag } from "lucide-react";
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

  // Global Discount Configuration State
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [discountEnabled, setDiscountEnabled] = useState<boolean>(false);
  const [discountLoading, setDiscountLoading] = useState<boolean>(false);
  const [fetchingDiscount, setFetchingDiscount] = useState<boolean>(true);

  useEffect(() => {
    const fetchDiscountSettings = async () => {
      try {
        const res = await getRequest("/settings/discount");
        if (res.success && res.discount) {
          setDiscountPercentage(res.discount.percentage || 0);
          setDiscountEnabled(res.discount.enabled || false);
        }
      } catch (err: any) {
        console.error("Failed to load discount settings", err);
      } finally {
        setFetchingDiscount(false);
      }
    };
    fetchDiscountSettings();
  }, []);

  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (discountPercentage < 0 || discountPercentage > 100) {
      toast.error("Discount percentage must be between 0 and 100.");
      return;
    }

    setDiscountLoading(true);

    try {
      const res = await putRequest("/settings/discount", {
        percentage: discountPercentage,
        enabled: discountEnabled
      });

      if (res.success) {
        toast.success("Global discount settings updated successfully!");
        if (res.discount) {
          setDiscountPercentage(res.discount.percentage);
          setDiscountEnabled(res.discount.enabled);
        }
      } else {
        toast.error(res.message || "Failed to update discount settings.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error updating discount settings.");
    } finally {
      setDiscountLoading(false);
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

  return (
    <div className="space-y-6 text-left max-w-2xl mx-auto">
      {/* Breadcrumbs & Header */}
      <div>
        <div className="flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.25em] font-mono text-[#351E28]/50 font-bold mb-2">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              <span>{b.label}</span>
            </span>
          ))}
        </div>
        <h1 className="font-serif text-3xl text-[#351E28] font-light tracking-wide">
          Account Settings
        </h1>
        <p className="text-[#351E28]/60 text-xs font-light tracking-wide mt-1">
          Manage your credentials and security settings for the admin panel.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="glass-card bg-white/40 border border-[#351E28]/10 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(53,30,40,0.02)] backdrop-blur-md">
        <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#351E28]/10">
          <KeyRound className="w-5 h-5 text-luxury-gold" />
          <h2 className="font-serif text-lg font-light text-[#351E28]">
            Change Password
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div className="space-y-2">
            <label className="block text-[9px] uppercase tracking-widest text-[#351E28]/70 font-bold">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full text-xs text-[#351E28] bg-[#F7F2EE]/80 border border-[#351E28]/15 rounded-xl pl-10 pr-10 py-3.5 focus:outline-hidden focus:border-luxury-gold focus:bg-white placeholder-[#351E28]/30 transition-colors font-mono font-bold tracking-widest text-center"
              />
              <Lock className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#351E28]/40 hover:text-[#351E28] cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label className="block text-[9px] uppercase tracking-widest text-[#351E28]/70 font-bold">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                className="w-full text-xs text-[#351E28] bg-[#F7F2EE]/80 border border-[#351E28]/15 rounded-xl pl-10 pr-10 py-3.5 focus:outline-hidden focus:border-luxury-gold focus:bg-white placeholder-[#351E28]/30 transition-colors font-mono font-bold tracking-widest text-center"
              />
              <Lock className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#351E28]/40 hover:text-[#351E28] cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <label className="block text-[9px] uppercase tracking-widest text-[#351E28]/70 font-bold">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full text-xs text-[#351E28] bg-[#F7F2EE]/80 border border-[#351E28]/15 rounded-xl pl-10 pr-10 py-3.5 focus:outline-hidden focus:border-luxury-gold focus:bg-white placeholder-[#351E28]/30 transition-colors font-mono font-bold tracking-widest text-center"
              />
              <Lock className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#351E28]/40 hover:text-[#351E28] cursor-pointer"
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
            className="bg-[#351E28] !text-white hover:!text-luxury-gold hover:scale-102 active:scale-98 text-[10px] tracking-widest uppercase font-bold py-3.5 px-8 rounded-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 w-full md:w-auto cursor-pointer disabled:opacity-50 disabled:no-underline font-mono mt-4 ml-auto"
          >
            <span>{loading ? "Updating Credentials..." : "Update Password"}</span>
            <ShieldCheck className="w-4.5 h-4.5 text-luxury-gold" />
          </button>
        </form>
      </div>

      {/* Global Discount Settings Card */}
      <div className="glass-card bg-white/40 border border-[#351E28]/10 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(53,30,40,0.02)] backdrop-blur-md">
        <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#351E28]/10">
          <Tag className="w-5 h-5 text-luxury-gold" />
          <h2 className="font-serif text-lg font-light text-[#351E28]">
            Global Discount Settings
          </h2>
        </div>

        {fetchingDiscount ? (
          <div className="py-6 text-center text-xs font-mono text-[#351E28]/60">
            Loading discount settings...
          </div>
        ) : (
          <form onSubmit={handleDiscountSubmit} className="space-y-5">
            {/* Status (Toggle Enabled/Disabled) */}
            <div className="flex items-center justify-between py-2 border-b border-[#351E28]/5">
              <div className="space-y-0.5">
                <span className="block text-[9px] uppercase tracking-widest text-[#351E28]/70 font-bold">
                  Discount Status
                </span>
                <span className="text-[10px] text-[#351E28]/50 font-light">
                  Toggle to enable or disable discount store-wide
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={discountEnabled}
                  onChange={(e) => setDiscountEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#351E28]/10 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#351E28]/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#351E28]"></div>
              </label>
            </div>

            {/* Discount Percentage */}
            <div className="space-y-2">
              <label className="block text-[9px] uppercase tracking-widest text-[#351E28]/70 font-bold">
                Discount Percentage *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  placeholder="Enter discount percentage"
                  required
                  disabled={!discountEnabled}
                  className="w-full text-xs text-[#351E28] bg-[#F7F2EE]/80 border border-[#351E28]/15 rounded-xl pl-10 pr-10 py-3.5 focus:outline-hidden focus:border-luxury-gold focus:bg-white placeholder-[#351E28]/30 transition-colors font-mono font-bold tracking-widest text-center disabled:opacity-50"
                />
                <Percent className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={discountLoading}
              className="bg-[#351E28] !text-white hover:!text-luxury-gold hover:scale-102 active:scale-98 text-[10px] tracking-widest uppercase font-bold py-3.5 px-8 rounded-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 w-full md:w-auto cursor-pointer disabled:opacity-50 disabled:no-underline font-mono mt-4 ml-auto"
            >
              <span>{discountLoading ? "Saving Settings..." : "Save Discount"}</span>
              <ShieldCheck className="w-4.5 h-4.5 text-luxury-gold" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
