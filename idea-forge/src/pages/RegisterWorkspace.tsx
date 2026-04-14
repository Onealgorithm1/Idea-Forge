import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Mail, Lock, User, ArrowRight, Loader2, Globe, CheckCircle2 } from "lucide-react";
import { isValidEmail } from "@/lib/utils";
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
import { toast } from "sonner";

export default function RegisterWorkspacePage() {
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();

  const handleOrgNameChange = (val: string) => {
    setOrgName(val);
    if (!orgSlug || orgSlug === orgName.toLowerCase().replace(/\s+/g, "-")) {
      setOrgSlug(val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!orgName.trim()) newErrors.orgName = "Organization name is required";
    if (!orgSlug.trim()) newErrors.orgSlug = "URL slug is required";
    if (!adminName.trim()) newErrors.adminName = "Full name is required";
    if (!adminEmail || !isValidEmail(adminEmail)) newErrors.adminEmail = "Valid email is required";
    if (!adminPhone.trim()) newErrors.adminPhone = "Mobile number is required";
    if (adminPassword.length < 6) newErrors.adminPassword = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}/register/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          orgSlug,
          adminName,
          adminEmail,
          adminPhone,
          adminPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");

      setIsSuccess(true);
      toast.success("Registration submitted successfully!");
    } catch (error: any) {
      setErrors(prev => ({ ...prev, form: error.message || "Registration failed" }));
      toast.error(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/90 to-primary/20" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[500px] z-10 text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-success/20 flex items-center justify-center border border-success/30">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white tracking-tight">Request Submitted.</h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              We've received your registration for <span className="text-white font-bold">{orgName}</span>.
              Our Super Admin will review your request and notify you once your workspace is ready.
            </p>
          </div>
          <Button
            onClick={() => navigate("/login")}
            className="h-12 px-8 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold transition-all"
          >
            Back to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 relative overflow-hidden bg-slate-950">
      {/* Background elements similar to Auth.tsx */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/90 to-primary/20" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[500px] z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex flex-col items-center gap-2 group">
            <Logo imageClassName="h-16 w-16 group-hover:scale-110 transition-transform duration-500" />
            <h1 className="text-3xl font-black tracking-tighter text-white">
              Idea<span className="text-primary tracking-[-0.08em]">Forge</span>
            </h1>
          </Link>
        </div>

        <Card className="w-full bg-white/5 backdrop-blur-2xl border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-2 pt-8 text-center">
            <CardTitle className="text-3xl font-black text-white">Create Workspace.</CardTitle>
            <CardDescription className="text-slate-400 font-medium">
              Join the platform and start fostering innovation.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 px-8">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Acme Corp"
                      value={orgName}
                      onChange={(e) => handleOrgNameChange(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Workspace URL</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="acme-corp"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      className="pl-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600 h-10"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 ml-1">Your workspace will be at: ideaforge.io/{orgSlug || "slug"}</p>
                </div>

                <div className="h-px bg-white/5 my-2" />

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Admin Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="John Doe"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      placeholder="john@acme.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Mobile Number</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 flex items-center justify-center font-bold text-[10px]">#</div>
                    <Input
                      placeholder="+1 (555) 000-0000"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Admin Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <PasswordInput
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600 h-10"
                    />
                  </div>
                </div>
              </div>

              {errors.form && (
                <p className="text-xs text-red-400 font-medium text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">
                  {errors.form}
                </p>
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
                    Submit Registration
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
              <p className="text-xs text-slate-500 font-medium text-center">
                Already have a workspace?{" "}
                <Link to="/login" className="text-primary hover:text-white font-bold ml-1 transition-colors">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
