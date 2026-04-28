import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTenant } from "@/contexts/TenantContext";

const AdminSettings = () => {
  const { token, user: currentUser } = useAuth();
  const { tenant } = useTenant();
  const isTenantAdmin = currentUser?.role === 'tenant_admin' || currentUser?.role === 'super_admin';
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

  // Events
  const [newEventName, setNewEventName] = useState("");
  const [newEventType, setNewEventType] = useState("poll");
  const handleCreateEvent = () => {
    if (!newEventName.trim()) {
      toast.error("Event name is required");
      return;
    }
    
    const newEvent = {
      id: Date.now().toString(),
      name: newEventName.trim(),
      type: newEventType,
      date: 'Just Created',
      description: 'A new event created from settings.',
      participants: 0,
      status: 'active'
    };
    
    const existing = JSON.parse(localStorage.getItem("platformEvents") || "[]");
    if (existing.length === 0) {
      existing.push(
        {
          id: '1',
          name: 'Q3 Innovation Hackathon',
          type: 'hackathon',
          date: 'Coming up in 2 weeks',
          description: 'Join our company-wide hackathon to build the next big feature.',
          participants: 24,
          status: 'upcoming'
        },
        {
          id: '2',
          name: 'New Roadmap Poll',
          type: 'poll',
          date: 'Active',
          description: 'Vote on which feature we should tackle next quarter.',
          participants: 156,
          status: 'active'
        }
      );
    }
    localStorage.setItem("platformEvents", JSON.stringify([newEvent, ...existing]));
    localStorage.setItem("activeEvent", newEvent.id);
    localStorage.removeItem("eventPopupShown"); // reset popup state so it shows on next render
    
    setNewEventName("");
    toast.success("Event created! Users will see a popup on their next visit.", { icon: "🎉" });
  };

  return (
    <div className="h-screen bg-background flex flex-col relative overflow-hidden text-foreground transition-colors duration-300">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-success/10 blur-[100px]" />
      </div>

      
      <div className="flex flex-1 overflow-hidden relative z-10 w-full max-w-[1600px] mx-auto">
        
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
                <h1 className="text-3xl font-black tracking-tight text-foreground">{tenant?.name || "Organization"} Settings</h1>
                {!isTenantAdmin && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">
                    Read-Only Access
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-lg font-medium">
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
                <Card className="p-8 border-none shadow-premium bg-card/80 backdrop-blur-md rounded-[2rem] space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <Layers className="h-5 w-5" />
                      </div>
                      <h2 className="text-xl font-black tracking-tight text-foreground">Idea Spaces</h2>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Define separate areas for different types of innovation (e.g., Public, Internal, R&D).
                  </p>

                  {isTenantAdmin ? (
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
                  ) : (
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Notice</p>
                      <p className="text-sm text-primary/70 font-medium leading-tight">
                        Only Tenant Admins can create or manage idea spaces.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <AnimatePresence mode="popLayout">
                      {spacesLoading ? (
                        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
                      ) : spaces.length === 0 ? (
                        <div className="p-8 text-center bg-muted/50 rounded-2xl border border-dashed border-border">
                          <p className="text-sm text-muted-foreground italic">No spaces defined yet.</p>
                        </div>
                      ) : (
                        spaces.map((sp: any) => (
                          <motion.div 
                            key={sp.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-2xl group hover:border-primary/20 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <span className="font-bold text-foreground">{sp.name}</span>
                            </div>
                            {isTenantAdmin && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                onClick={() => { if (confirm("Delete this space?")) deleteSpaceMutation.mutate(sp.id); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
                <Card className="p-8 border-none shadow-premium bg-card/80 backdrop-blur-md rounded-[2rem] space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning/10 rounded-xl text-warning">
                      <Tag className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-foreground">Idea Categories</h2>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Group ideas into themes for easier discovery and filtering.
                  </p>

                  {isTenantAdmin ? (
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
                        className="rounded-xl h-11 px-5 bg-warning hover:bg-warning/90 text-warning-foreground"
                      >
                        {createCatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Category"}
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 bg-warning/5 rounded-2xl border border-warning/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-warning mb-1">Notice</p>
                      <p className="text-sm text-warning/70 font-medium leading-tight">
                        Global category management is restricted to Tenant Admins. Use the <a href="/admin/categories" className="underline font-bold">Categories page</a> to manage your assigned branches.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <AnimatePresence mode="popLayout">
                      {catsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-lg" />)
                      ) : categories.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No categories.</p>
                      ) : (
                        categories.map((cat: any) => (
                           <motion.div 
                            key={cat.id} 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`hover:bg-warning/5 border px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 group transition-all ${cat.is_default ? 'bg-warning/10 border-warning/20 text-warning' : 'bg-muted border-border text-muted-foreground hover:border-warning/20 hover:text-warning'}`}
                          >
                            {cat.name}
                            {cat.is_default && (
                              <Badge variant="outline" className="h-4 px-1 text-[8px] bg-warning text-warning border-warning/20 uppercase">Default</Badge>
                            )}
                            {isTenantAdmin && !cat.is_default && (
                              <button 
                                onClick={() => { if (confirm("Delete this category?")) deleteCatMutation.mutate(cat.id); }}
                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all font-bold"
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
                
                {/* Events Management */}
                <Card className="p-8 border-none shadow-[0_0_40px_rgba(168,85,247,0.15)] bg-card/80 backdrop-blur-md rounded-[2rem] space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-[30px]" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl text-purple-500 border border-purple-500/30">
                      <Sparkles className="h-5 w-5 animate-pulse" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">Events & Polls</h2>
                  </div>

                  <p className="text-sm text-muted-foreground relative z-10">
                    Create a new platform-wide event. A celebratory popup will be shown to all users!
                  </p>

                  <div className="space-y-4 relative z-10">
                    <div className="flex flex-col gap-3">
                      <Input
                        placeholder="Event Name (e.g., Summer Hackathon)"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        className="rounded-xl h-11 border-purple-500/20 focus-visible:ring-purple-500"
                      />
                      <div className="flex gap-2">
                        <select 
                          className="flex h-11 w-full items-center justify-between rounded-xl border border-purple-500/20 bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEventType}
                          onChange={(e) => setNewEventType(e.target.value)}
                        >
                          <option value="poll">Poll</option>
                          <option value="hackathon">Hackathon</option>
                          <option value="ama">AMA Session</option>
                        </select>
                        <Button
                          onClick={handleCreateEvent}
                          className="rounded-xl h-11 px-8 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white font-bold whitespace-nowrap shadow-lg shadow-purple-500/25 border-0"
                        >
                          Create Event 🎉
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-8 border-none shadow-premium bg-slate-900 text-white rounded-[2rem] space-y-4 dark:bg-slate-900/50 dark:border dark:border-white/5">
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
