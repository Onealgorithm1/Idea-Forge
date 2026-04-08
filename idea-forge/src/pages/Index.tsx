import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import KanbanBoard from "@/components/KanbanBoard";
import RoadmapBoard from "@/components/RoadmapBoard";
import AnalyticsView from "@/components/AnalyticsView";
import MyIdeasView from "@/components/MyIdeasView";
import SavedIdeasView from "@/components/SavedIdeasView";
import { useLocation, useSearchParams, useParams } from "react-router-dom";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { LayoutGrid, Activity, BarChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const { pathname } = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") || "All";
  const selectedSpace = searchParams.get("space") || null;

  // Pre-calculate tenant paths for comparison
  const tenantIdeaBoard = getTenantPath(ROUTES.IDEA_BOARD, tenantSlug);
  const tenantRoadmap = getTenantPath(ROUTES.ROADMAP, tenantSlug);
  const tenantAnalytics = getTenantPath(ROUTES.ANALYTICS, tenantSlug);
  const tenantMyIdeas = getTenantPath(ROUTES.MY_IDEAS, tenantSlug);
  const tenantSavedIdeas = getTenantPath(ROUTES.SAVED_IDEAS, tenantSlug);

  const setSelectedCategory = (category: string) => {
    if (category === "All") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", category);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Decorative Dotted Grid */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        {/* Larger, more vibrant mesh gradients for the periphery */}
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] rounded-full bg-primary/15 dark:bg-primary/10 blur-[140px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-info/10 blur-[120px]" />
        <div className="absolute top-[30%] right-[-15%] w-[40%] h-[40%] rounded-full bg-success/5 blur-[100px]" />
        <div className="absolute top-[60%] left-[-5%] w-[35%] h-[35%] rounded-full bg-primary/5 blur-[90px]" />
      </div>

      <Header />

      <div className="flex flex-1 overflow-hidden relative z-10 w-full max-w-[1600px] mx-auto">
        <SidebarNav
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        <main className={`flex-1 overflow-y-auto no-scrollbar px-6 py-8 md:px-10`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${pathname}-${selectedCategory}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-10"
            >


              {pathname === tenantIdeaBoard && (
                <div className="space-y-8 relative">
                  <div className="absolute inset-x-[-3rem] top-[-3rem] bottom-[-3rem] bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10 pointer-events-none rounded-[3rem]" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
                        <LayoutGrid className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black tracking-tight text-foreground transition-colors">Idea Board</h2>
                        <p className="text-muted-foreground font-medium mt-0.5">Browse and filter through the community's brightest ideas.</p>
                      </div>
                    </div>
                  </div>
                  <KanbanBoard category={selectedCategory} spaceId={selectedSpace} />
                </div>
              )}

              {pathname === tenantRoadmap && (
                <div className="space-y-8 relative">
                   <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
                      <Activity className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tight text-foreground transition-colors">Project Roadmap</h2>
                      <p className="text-muted-foreground font-medium">Tracking ideas from conception to delivery.</p>
                    </div>
                  </div>
                  <RoadmapBoard spaceId={selectedSpace} />
                </div>
              )}

              {pathname === tenantAnalytics && (
                <div className="space-y-8 relative">
                   <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
                      <BarChart className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tight text-foreground transition-colors">Platform Analytics</h2>
                      <p className="text-muted-foreground font-medium">Data-driven insights into your innovation pipeline.</p>
                    </div>
                  </div>
                  <AnalyticsView />
                </div>
              )}

              {pathname === tenantMyIdeas && (
                <div className="space-y-8 relative">
                  <MyIdeasView />
                </div>
              )}

              {pathname === tenantSavedIdeas && (
                <div className="space-y-8 relative">
                  <SavedIdeasView />
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
