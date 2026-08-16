import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { postRequest } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen bg-luxury-bg flex items-center justify-center px-6 relative select-none">
      {/* Decorative blurs */}
      <div className="absolute top-[20%] left-[10%] w-[35vw] h-[35vw] bg-radial from-luxury-gold/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] bg-radial from-[#351E28]/5 to-transparent blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card rounded-3xl p-8 md:p-10 text-center">
          
          <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/25 flex items-center justify-center text-luxury-gold mx-auto mb-6 shadow-md">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>

          <span className="text-[9px] tracking-[0.3em] uppercase text-luxury-gold mb-3 block font-bold">
            internal administration
          </span>
          <h2 className="font-serif text-3xl font-light tracking-wide text-[#351E28] mb-8">
            Atelier Gateway
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] tracking-wider uppercase text-left">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-left">
            <div>
              <label className="block text-[8px] tracking-[0.2em] uppercase text-[#351E28]/50 mb-2 font-semibold">
                admin email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/70 border border-luxury-gold/20 text-[#351E28] text-xs tracking-wider focus:border-luxury-gold focus:outline-hidden transition-all duration-300 font-mono"
                placeholder="admin@geetejviraasat.com"
                required
              />
            </div>

            <div>
              <label className="block text-[8px] tracking-[0.2em] uppercase text-[#351E28]/50 mb-2 font-semibold">
                password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/70 border border-luxury-gold/20 text-[#351E28] text-xs tracking-wider focus:border-luxury-gold focus:outline-hidden transition-all duration-300 font-mono"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-luxury-gold text-[#351E28] py-3 rounded-full text-[10px] tracking-[0.25em] uppercase font-bold flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#351E28]" />
              ) : (
                <>
                  Verify Gateway <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
