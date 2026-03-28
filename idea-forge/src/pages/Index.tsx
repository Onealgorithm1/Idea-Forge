import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import CtaBanner from "@/components/CtaBanner";
import KanbanBoard from "@/components/KanbanBoard";
import RoadmapBoard from "@/components/RoadmapBoard";
import AnalyticsView from "@/components/AnalyticsView";
import BottomCards from "@/components/BottomCards";
import DeveloperBriefs from "@/components/DeveloperBriefs";
import { useEffect } from "react";
import { useLocation, useSearchParams, useParams } from "react-router-dom";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { LayoutGrid, Sparkles, Activity, Users, BarChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import StatsOverview from "@/components/StatsOverview";

const Index = () => {
  const { pathname } = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") || "All";

  // Pre-calculate tenant paths for comparison
  const tenantDashboard = getTenantPath(ROUTES.DASHBOARD, tenantSlug);
  const tenantIdeaBoard = getTenantPath(ROUTES.IDEA_BOARD, tenantSlug);
  const tenantRoadmap = getTenantPath(ROUTES.ROADMAP, tenantSlug);
  const tenantAnalytics = getTenantPath(ROUTES.ANALYTICS, tenantSlug);

  const setSelectedCategory = (category: string) => {
    if (category === "All") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", category);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col relative overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Decorative Dotted Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        {/* Larger, more vibrant mesh gradients for the periphery */}
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] rounded-full bg-primary/15 blur-[140px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-info/10 blur-[120px]" />
        <div className="absolute top-[30%] right-[-15%] w-[40%] h-[40%] rounded-full bg-success/5 blur-[100px]" />
        <div className="absolute top-[60%] left-[-5%] w-[35%] h-[35%] rounded-full bg-primary/5 blur-[90px]" />
      </div>

      <Header />

      <div className="flex flex-1 overflow-hidden relative z-10 w-full max-w-[1600px] mx-auto">
        {pathname !== tenantDashboard && (
          <SidebarNav
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        )}

        <main className={`flex-1 overflow-y-auto no-scrollbar px-6 py-8 md:px-10 ${pathname === tenantDashboard ? 'max-w-[1600px] mx-auto w-full' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${pathname}-${selectedCategory}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-10"
            >
              {pathname === tenantDashboard && (
                <div className="space-y-12">
                  {selectedCategory === "All" && (
                    <section className="animate-fade-in-up">
                      <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden shadow-premium hover:shadow-premium-hover transition-all duration-500 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        {/* Mesh background within card */}
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
                          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[80px]" />
                          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-info/5 blur-[60px]" />
                        </div>
                        
                        {/* Left Side: Text Content */}
                        <div className="relative z-10 w-full lg:w-1/2 flex-shrink-0">
                          <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1.5 font-bold text-[10px] uppercase tracking-[0.2em]">
                            Welcome Back
                          </Badge>
                          <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-black tracking-tight text-slate-900 mb-6 leading-[1.05]">
                            Where Ideas <br /> become <span className="text-primary">Impact.</span>
                          </h1>
                          <p className="text-xl md:text-2xl text-slate-500 mb-10 leading-relaxed font-medium max-w-xl">
                            Your space to capture ideas, collaborate with the community, and track the progress of every innovation.
                          </p>
                          <div className="flex flex-wrap gap-4">
                            <CtaBanner />
                          </div>
                        </div>

                        {/* Right Side: Abstract Tech Illustration */}
                        <div className="relative z-10 w-full lg:w-1/2 aspect-square md:max-h-[500px] flex items-center justify-center">
                          {/* Deep glowing backdrop */}
                          <div className="absolute inset-x-10 inset-y-10 bg-gradient-to-br from-primary/30 via-info/20 to-success/10 rounded-full blur-[100px] animate-pulse-slow mix-blend-multiply" />
                          
                          {/* Core Node */}
                          <motion.div 
                            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }} 
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            className="relative z-20 w-48 h-48 rounded-full bg-gradient-to-br from-white to-white/60 backdrop-blur-xl border border-white/80 shadow-[0_20px_60px_-15px_rgba(var(--primary),0.3)] flex items-center justify-center"
                          >
                            <div className="absolute inset-2 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center">
                              <Sparkles className="w-16 h-16 text-primary drop-shadow-md animate-pulse" />
                            </div>
                          </motion.div>

                          {/* Orbiting Rings */}
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[320px] h-[320px] rounded-full border border-dashed border-slate-300/60 z-10"
                          />
                          <motion.div 
                            animate={{ rotate: -360 }}
                            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[420px] h-[420px] rounded-full border border-slate-200/40 z-0"
                          />

                          {/* Floating Data Modules */}
                          <motion.div 
                            animate={{ y: [0, -15, 0], x: [0, 8, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute top-[10%] left-[5%] lg:left-[-10%] bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-white shadow-xl flex flex-col gap-2 z-30 w-40"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-info/15 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-info" />
                              </div>
                              <div className="text-xs font-bold text-slate-700">Live Activity</div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                animate={{ x: ["-100%", "100%", "-100%"] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="w-1/2 h-full bg-info/60 rounded-full"
                              />
                            </div>
                            <div className="h-2 w-3/4 bg-slate-100 rounded mt-1" />
                            <div className="h-2 w-1/2 bg-slate-100 rounded" />
                          </motion.div>

                          <motion.div 
                            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                            className="absolute bottom-[10%] right-[0%] lg:right-[5%] bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-white shadow-xl flex flex-col gap-3 z-30 min-w[180px]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center">
                                <Users className="w-5 h-5 text-success" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800 tracking-tight">Synergy Matrix</p>
                                <p className="text-xs text-success font-bold">+124 conn.</p>
                              </div>
                            </div>
                            <div className="flex -space-x-2 mt-1">
                              {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                                  <div className="w-full h-full bg-gradient-to-br from-primary/40 to-info/40" />
                                </div>
                              ))}
                            </div>
                          </motion.div>
                          
                          {/* Mini decorative orbs */}
                          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-[30%] right-[15%] w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)] z-20" />
                          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 5, repeat: Infinity, delay: 2 }} className="absolute bottom-[40%] left-[20%] w-3 h-3 rounded-full bg-info shadow-[0_0_10px_rgba(var(--info),0.8)] z-20" />
                          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 6, repeat: Infinity, delay: 1 }} className="absolute top-[60%] right-[25%] w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(var(--success),0.8)] z-20" />
                        </div>
                      </div>
                    </section>
                  )}

                  <StatsOverview />

                  <section>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-10 w-1 px-0 bg-primary rounded-full" />
                      <h2 className="text-2xl font-black tracking-tight text-slate-900">Explore Platform</h2>
                    </div>
                    <BottomCards />
                  </section>
                </div>
              )}

              {pathname === tenantIdeaBoard && (
                <div className="space-y-8 relative">
                  <div className="absolute inset-x-[-3rem] top-[-3rem] bottom-[-3rem] bg-gradient-to-b from-slate-100/60 via-slate-50/20 to-transparent -z-10 pointer-events-none rounded-[3rem]" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <LayoutGrid className="h-7 w-7 text-slate-600" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900">Idea Board</h2>
                        <p className="text-slate-500 font-medium mt-0.5">Browse and filter through the community's brightest ideas.</p>
                      </div>
                    </div>
                  </div>
                  <KanbanBoard category={selectedCategory} />
                </div>
              )}

              {pathname === tenantRoadmap && (
                <div className="space-y-8 relative">
                   <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <Activity className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tight text-slate-900">Project Roadmap</h2>
                      <p className="text-slate-500 font-medium">Tracking ideas from conception to delivery.</p>
                    </div>
                  </div>
                  <RoadmapBoard />
                </div>
              )}

              {pathname === tenantAnalytics && (
                <div className="space-y-8 relative">
                   <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <BarChart className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tight text-slate-900">Platform Analytics</h2>
                      <p className="text-slate-500 font-medium">Data-driven insights into your innovation pipeline.</p>
                    </div>
                  </div>
                  <AnalyticsView />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Index;
