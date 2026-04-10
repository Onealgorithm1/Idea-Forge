import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Zap, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { cn, isValidEmail } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [tenantInfo, setTenantInfo] = useState<any>(null);

  useEffect(() => {
    if (tenantSlug) {
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/tenants/by-slug/${tenantSlug}`)
        .then(res => res.json())
        .then(data => setTenantInfo(data))
        .catch(err => console.error("Failed to fetch tenant info:", err));
    }
  }, [tenantSlug]);

  const isLogin = location.pathname.endsWith("/login");

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email || !isValidEmail(email)) newErrors.email = "Valid email is required";
    if (!password || password.length < 6) newErrors.password = "Password must be at least 6 characters";
    
    if (!isLogin) {
      if (!firstName.trim()) newErrors.firstName = "First name is required";
      if (!lastName.trim()) newErrors.lastName = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    setIsLoading(true);
    try {
        if (isLogin) {
          await login(email, password, tenantSlug);
        } else {
          const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
          await register(fullName, email, password, tenantSlug);
        }
        navigate(getTenantPath(ROUTES.IDEA_BOARD, tenantSlug));
    } catch (error: any) {
      setErrors(prev => ({ ...prev, form: error.message || "Authentication failed" }));
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden bg-slate-950">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
         <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 grayscale transition-opacity duration-1000"
          style={{ backgroundImage: 'url("/Idea Sharing Hero Image.jpg")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/90 to-primary/20" />
        
        {/* Animated Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px]" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Link to={getTenantPath(ROUTES.DASHBOARD, tenantSlug)} className="flex flex-col items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 group-hover:bg-primary/40 transition-all duration-500" />
                <Logo imageClassName="h-24 w-24 relative z-10 transition-transform duration-500 group-hover:scale-110" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-white mt-4 drop-shadow-2xl">
                Idea<span className="text-primary tracking-[-0.08em]">Forge</span>
              </h1>
            </Link>
          </motion.div>
        </div>

        <Card className="w-full bg-white/5 backdrop-blur-2xl border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-2 pt-8">
            <CardTitle className="text-3xl font-black text-center text-white tracking-tight">
              {isLogin 
                ? (tenantInfo ? `Welcome to ${tenantInfo.name}` : "Welcome back.") 
                : "Join the Forge."}
            </CardTitle>
            <CardDescription className="text-center text-slate-400 font-medium">
              {isLogin
                ? (tenantInfo?.description || "Sign in to share and collaborate on the next big thing.")
                : "Create your workspace account to start building today."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 px-8">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-4 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                          id="firstName"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className={cn(
                            "pl-10 h-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-primary/50",
                            errors.firstName && "border-red-400/50 focus:ring-red-400/20"
                          )}
                        />
                        {errors.firstName && <p className="text-[10px] text-red-400 mt-1 ml-1 font-bold animate-in fade-in slide-in-from-top-1">{errors.firstName}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className={cn(
                          "h-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600",
                          errors.lastName && "border-red-400/50"
                        )}
                      />
                      {errors.lastName && <p className="text-[10px] text-red-400 mt-1 ml-1 font-bold animate-in fade-in slide-in-from-top-1">{errors.lastName}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={cn(
                      "pl-10 h-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-primary/50",
                      errors.email && "border-red-400/50 focus:ring-red-400/20"
                    )}
                  />
                  {errors.email && <p className="text-[10px] text-red-400 mt-1 ml-1 font-bold animate-in fade-in slide-in-from-top-1">{errors.email}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500">Password</Label>
                  {isLogin && (
                    <Link 
                      to={getTenantPath(ROUTES.FORGOT_PASSWORD, tenantSlug)} 
                      className="text-[10px] font-bold text-primary uppercase tracking-tighter hover:text-primary/80 transition-colors"
                    >
                      Forgot?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={cn(
                      "pl-10 h-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600",
                      errors.password && "border-red-400/50"
                    )}
                  />
                  {errors.password && <p className="text-[10px] text-red-400 mt-1 ml-1 font-bold animate-in fade-in slide-in-from-top-1">{errors.password}</p>}
                </div>
              </div>

              {errors.form && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  className="text-xs text-red-400 font-medium text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20"
                >
                  {errors.form}
                </motion.p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-6 pb-10 px-8">
              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium">
                  {isLogin ? "New here?" : "Already member?"}{" "}
                  <Link 
                    to="/register-workspace" 
                    className="text-primary hover:text-white transition-colors font-bold ml-1"
                  >
                    {isLogin ? "Create Workspace Account" : "Sign In to Forge"}
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
