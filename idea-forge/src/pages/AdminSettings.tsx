import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Globe, FileText, Briefcase, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const AdminSettings = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    website: "",
    description: "",
    industry: "",
    logo_url: ""
  });

  const { data: orgData, isLoading } = useQuery({
    queryKey: ["org-details"],
    queryFn: () => api.get("/org/details", token!)
  });

  useEffect(() => {
    if (orgData) {
      setForm({
        name: orgData.name || "",
        slug: orgData.slug || "",
        website: orgData.website || "",
        description: orgData.description || "",
        industry: orgData.industry || "",
        logo_url: orgData.logo_url || ""
      });
    }
  }, [orgData]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => api.patch("/org/details", data, token!),
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ["org-details"] });
      toast.success("Organization details updated successfully");
      
      // If slug changed, we need to redirect to the new URL
      if (variables.slug && variables.slug !== orgData?.slug) {
        toast.info("Organization URL changed. Redirecting...");
        setTimeout(() => {
          window.location.href = `/${variables.slug}/admin/settings`;
        }, 1500);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update details");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.slug && !/^[a-z0-9-]+$/.test(form.slug)) {
      return toast.error("Slug can only contain lowercase letters, numbers, and hyphens");
    }
    updateMutation.mutate(form);
  };

  if (isLoading) return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col relative overflow-hidden text-slate-900">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-info/10 blur-[100px]" />
      </div>

      <Header />
      
      <div className="flex flex-1 overflow-hidden relative z-10 w-full max-w-[1600px] mx-auto">
        <SidebarNav />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">Organization <span className="text-primary">Settings.</span></h1>
              <p className="text-muted-foreground">Manage your organization's public profile and branding.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="border-primary/10 bg-card/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" /> Basic Information
                  </CardTitle>
                  <CardDescription>These details are visible on your login page and across the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="name" 
                          value={form.name} 
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          className="pl-10 h-10" 
                          placeholder="Acme Corp"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Organization URL Slug</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-mono">/</span>
                        <Input 
                          id="slug" 
                          value={form.slug} 
                          onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                          className="pl-7 h-10 font-mono text-sm" 
                          placeholder="acme-corp"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">Caution: Changing this will change your platform's URL.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="website" 
                          value={form.website} 
                          onChange={e => setForm({ ...form, website: e.target.value })}
                          className="pl-10 h-10" 
                          placeholder="https://acme.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="industry" 
                        value={form.industry} 
                        onChange={e => setForm({ ...form, industry: e.target.value })}
                        className="pl-10 h-10" 
                        placeholder="Technology, Healthcare, etc."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Tagline)</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea 
                        id="description" 
                        value={form.description} 
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        className="pl-10 min-h-[100px] resize-none" 
                        placeholder="Tell your members what this space is about..."
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">Displayed on the login page as a welcome message.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/10 bg-card/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" /> Branding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="space-y-2">
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <Input 
                        id="logo_url" 
                        value={form.logo_url} 
                        onChange={e => setForm({ ...form, logo_url: e.target.value })}
                        placeholder="https://example.com/logo.png"
                      />
                      {form.logo_url && (
                        <div className="mt-4 p-4 border border-dashed rounded-xl flex items-center justify-center bg-muted/30">
                          <img src={form.logo_url} alt="Logo Preview" className="h-12 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        </div>
                      )}
                   </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="px-8 font-bold shadow-lg shadow-primary/20"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSettings;
