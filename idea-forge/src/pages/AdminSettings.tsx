import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import {
  Settings,
  ShieldCheck,
  Tag,
  FolderOpen,
  Plus,
  Trash2,
  Loader2,
  Building,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTenant } from "@/contexts/TenantContext";

const AdminSettings = () => {
  const { token } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  // Categories
  const [newCategory, setNewCategory] = useState("");
  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get("/admin/categories", token!),
    enabled: !!token,
  });
  const createCatMutation = useMutation({
    mutationFn: (name: string) => {
      if (!name || name.trim().length < 2) throw new Error("Category name must be at least 2 characters");
      return api.post("/admin/categories", { name }, token!);
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); 
      setNewCategory(""); 
      toast.success("Category created"); 
    },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteCatMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/categories/${id}`, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
    onError: (e: any) => toast.error(e.message),
  });

  // Idea Spaces
  const [newSpace, setNewSpace] = useState("");
  const { data: spaces = [], isLoading: spacesLoading } = useQuery({
    queryKey: ["admin-spaces"],
    queryFn: () => api.get("/admin/spaces", token!),
    enabled: !!token,
  });
  const createSpaceMutation = useMutation({
    mutationFn: (name: string) => {
      if (!name || name.trim().length < 2) throw new Error("Space name must be at least 2 characters");
      return api.post("/admin/spaces", { name }, token!);
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["admin-spaces"] }); 
      setNewSpace(""); 
      toast.success("Space created"); 
    },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteSpaceMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/spaces/${id}`, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-spaces"] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col relative overflow-hidden text-slate-900">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-success/10 blur-[100px]" />
      </div>

      <Header />
      <div className="flex flex-1 overflow-hidden relative z-10 w-full max-w-[1600px] mx-auto">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto space-y-10">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Building className="h-5 w-5" />
                </div>
                <h1 className="text-3xl font-black tracking-tight">{tenant?.name || "Organization"} Settings</h1>
              </div>
              <p className="text-slate-500 text-lg font-medium">
                Configure your organization's idea spaces, categories, and governance.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Idea Spaces Management */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                <Card className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2rem] space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                        <Layers className="h-5 w-5" />
                      </div>
                      <h2 className="text-xl font-black tracking-tight">Idea Spaces</h2>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-500">
                    Define separate areas for different types of innovation (e.g., Public, Internal, R&D).
                  </p>

                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. R&D Lab"
                      value={newSpace}
                      onChange={(e) => setNewSpace(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && newSpace.trim()) createSpaceMutation.mutate(newSpace.trim()); }}
                      className="rounded-xl h-11"
                    />
                    <Button
                      onClick={() => { if (newSpace.trim()) createSpaceMutation.mutate(newSpace.trim()); }}
                      disabled={createSpaceMutation.isPending}
                      className="rounded-xl h-11 px-5"
                    >
                      {createSpaceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Space"}
                    </Button>
                  </div>

                  <div className="space-y-2 pt-2">
                    <AnimatePresence mode="popLayout">
                      {spacesLoading ? (
                        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
                      ) : spaces.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <p className="text-sm text-slate-400 italic">No spaces defined yet.</p>
                        </div>
                      ) : (
                        spaces.map((sp: any) => (
                          <motion.div 
                            key={sp.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-blue-200 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-blue-400" />
                              <span className="font-bold text-slate-700">{sp.name}</span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              onClick={() => { if (confirm("Delete this space?")) deleteSpaceMutation.mutate(sp.id); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>

              {/* Categories Management */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <Card className="p-8 border-none shadow-premium bg-white/80 backdrop-blur-md rounded-[2rem] space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                      <Tag className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight">Idea Categories</h2>
                  </div>

                  <p className="text-sm text-slate-500">
                    Group ideas into themes for easier discovery and filtering.
                  </p>

                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Product"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && newCategory.trim()) createCatMutation.mutate(newCategory.trim()); }}
                      className="rounded-xl h-11"
                    />
                    <Button
                      onClick={() => { if (newCategory.trim()) createCatMutation.mutate(newCategory.trim()); }}
                      disabled={createCatMutation.isPending}
                      className="rounded-xl h-11 px-5 bg-amber-600 hover:bg-amber-700"
                    >
                      {createCatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Category"}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <AnimatePresence mode="popLayout">
                      {catsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-lg" />)
                      ) : categories.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No categories.</p>
                      ) : (
                        categories.map((cat: any) => (
                          <motion.div 
                            key={cat.id} 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`hover:bg-amber-50 border px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 group transition-all ${cat.is_default ? 'bg-amber-50/50 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-amber-200'}`}
                          >
                            {cat.name}
                            {cat.is_default && (
                              <Badge variant="outline" className="h-4 px-1 text-[8px] bg-amber-100 text-amber-700 border-amber-200 uppercase">Default</Badge>
                            )}
                            {!cat.is_default && (
                              <button 
                                onClick={() => { if (confirm("Delete this category?")) deleteCatMutation.mutate(cat.id); }}
                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Plus className="h-3 w-3 rotate-45" />
                              </button>
                            )}
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
                
                <Card className="p-8 border-none shadow-premium bg-slate-900 text-white rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h3 className="font-bold">Governance Settings</h3>
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Advanced governance controls, including workflow customization and role-specific permissions, are part of the Enterprise plan.
                  </p>
                  <Button variant="outline" className="w-full rounded-xl border-white/20 bg-white/5 hover:bg-white/10 text-white border-dashed font-bold mt-2">
                    Request Enterprise Access
                  </Button>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSettings;
