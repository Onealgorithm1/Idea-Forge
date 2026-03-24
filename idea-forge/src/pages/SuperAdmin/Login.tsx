import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return toast.error("Valid email is required");
    if (!password || password.length < 6) return toast.error("Password must be at least 6 characters");
    
    setIsLoading(true);
    try {
      const data = await api.post("/auth/super-admin/login", { email, password });
      localStorage.setItem("super_admin_token", data.token);
      localStorage.setItem("super_admin_user", JSON.stringify(data.user));
      toast.success("Welcome back, Super Admin!");
      navigate("/super-admin/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md px-4 relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-primary/20 p-2 rounded-xl">
                <Logo imageClassName="h-12 w-12" />
              </div>
              <span className="font-black text-2xl tracking-tight">IdeaForge</span>
            </div>
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-red-400">Super Admin Access</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/60 text-xs font-bold uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ideaforge.io"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/60 rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/60 text-xs font-bold uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter super admin password"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/60 rounded-xl h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 font-bold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Access Super Admin
            </Button>
          </form>

          <p className="text-center text-white/20 text-xs mt-8">
            This portal is for authorized platform administrators only.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperAdminLogin;
