import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { postRequest } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await postRequest("/auth/login", {
        email,
        password
      });

      if (res.success) {
        const { token, user } = res;
        if (user.role !== "admin") {
          setError("Access Denied. You are not authorized as an administrator.");
          setLoading(false);
          return;
        }

        localStorage.setItem("aurum_admin_token", token);
        localStorage.setItem("aurum_admin_user", JSON.stringify(user));
        navigate("/");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Authentication failed. Please verify credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F2EE] flex items-center justify-center px-4 sm:px-6 relative select-none overflow-hidden">
      {/* Decorative ambient blurs */}
      <div className="absolute top-[15%] left-[8%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-gradient-to-br from-[#C8A96A]/15 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[8%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-gradient-to-tl from-[#351E28]/8 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-[#C8A96A]/25 shadow-[0_20px_50px_rgba(53,30,40,0.08)] text-center transition-all">
          
          {/* Logo / Badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C8A96A]/20 to-[#C8A96A]/5 border border-[#C8A96A]/30 flex items-center justify-center text-[#9A7432] mx-auto mb-6 shadow-sm">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8A96A]/10 border border-[#C8A96A]/20 text-[10px] tracking-[0.25em] uppercase text-[#9A7432] font-bold font-mono mb-3">
            Internal Administration
          </div>
          
          <h2 className="font-serif text-3xl font-normal tracking-wide text-[#351E28] mb-2">
            Atelier Gateway
          </h2>
          <p className="text-xs text-[#351E28]/60 mb-8 font-sans">
            Enter your authorized administrative credentials to proceed.
          </p>

          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs text-left flex items-start gap-2.5 shadow-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-[#351E28]/70 mb-2 font-bold font-mono">
                Admin Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#351E28]/15 text-[#351E28] text-xs font-sans tracking-wide placeholder-[#351E28]/35 focus:outline-hidden focus:border-[#C8A96A] focus:ring-2 focus:ring-[#C8A96A]/25 transition-all shadow-xs"
                  placeholder="admin@geetejviraasat.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-[#351E28]/70 mb-2 font-bold font-mono">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-white border border-[#351E28]/15 text-[#351E28] text-xs font-sans tracking-wide placeholder-[#351E28]/35 focus:outline-hidden focus:border-[#C8A96A] focus:ring-2 focus:ring-[#C8A96A]/25 transition-all shadow-xs"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#351E28]/40 hover:text-[#351E28] transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#C8A96A] hover:bg-[#B89858] text-[#351E28] py-3.5 rounded-full text-xs tracking-[0.2em] uppercase font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#351E28]" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Atelier</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
