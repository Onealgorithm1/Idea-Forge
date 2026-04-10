import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Mail, ArrowRight, Loader2, CheckCircle2, ChevronLeft } from "lucide-react";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { isValidEmail } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email, tenantSlug });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to process request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden bg-slate-950">
      {/* Background stays consistent with Auth page */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/90 to-primary/20" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <Link to={getTenantPath(ROUTES.LOGIN, tenantSlug)} className="flex flex-col items-center gap-2 group">
             <Logo imageClassName="h-16 w-16 relative z-10 transition-transform duration-500 group-hover:scale-110" />
             <h1 className="text-2xl font-black tracking-tighter text-white mt-2 drop-shadow-2xl">
               Idea<span className="text-primary">Forge</span>
             </h1>
          </Link>
        </div>

        <Card className="w-full bg-white/5 backdrop-blur-2xl border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-2 pt-8">
            <CardTitle className="text-2xl font-black text-center text-white tracking-tight">
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-center text-slate-400">
              {isSuccess 
                ? "Check your inbox for your new temporary password."
                : "Enter your email address and we'll send you your password."}
            </CardDescription>
          </CardHeader>
          
          {!isSuccess ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5 px-8">
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
                      className="pl-10 h-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-primary/50"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-400 font-medium text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">
                    {error}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pb-10 px-8">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.02]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Send Password
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
                <Link 
                  to={getTenantPath(ROUTES.LOGIN, tenantSlug)} 
                  className="text-xs text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-1 font-medium"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Back to Sign In
                </Link>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="px-8 pb-10 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </motion.div>
              <p className="text-center text-white font-medium mb-8">
                Email has been sent with your password. Please check your inbox (including spam).
              </p>
              <Button asChild className="w-full h-12 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl">
                <Link to={getTenantPath(ROUTES.LOGIN, tenantSlug)}>
                  Return to Login
                </Link>
              </Button>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
