import React from "react";
import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import KanbanBoard from "@/components/KanbanBoard";
import RoadmapBoard from "@/components/RoadmapBoard";
import AnalyticsView from "@/components/AnalyticsView";
import MyIdeasView from "@/components/MyIdeasView";
import SavedIdeasView from "@/components/SavedIdeasView";
import { useLocation, useSearchParams, useParams } from "react-router-dom";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { LayoutGrid, Activity, BarChart, ChevronRight, FolderTree } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const Index = () => {
  const { pathname } = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") || "All";
  const selectedSpace = searchParams.get("space") || null;
  const searchQuery = searchParams.get("search") || "";

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

  const setSearchQuery = (query: string) => {
    if (!query) {
      searchParams.delete("search");
    } else {
      searchParams.set("search", query);
    }
    setSearchParams(searchParams);
  };

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["categories", tenantSlug],
    queryFn: () => api.get("/ideas/categories"),
  });

  const { data: ideaSpaces = [] } = useQuery({
    queryKey: ["idea-spaces", tenantSlug],
    queryFn: () => api.get("/ideas/spaces"),
  });

  const activeSpace = ideaSpaces.find((s: any) => s.id === selectedSpace);
  const activeCategory = dbCategories.find((c: any) => c.name === selectedCategory);
  
  // Build breadcrumb path for category
  const categoryPath = [];
  if (activeCategory) {
    let current = activeCategory;
    categoryPath.unshift(current);
    while (current.parent_id) {
      const parent = dbCategories.find((c: any) => c.id === current.parent_id);
      if (parent) {
        categoryPath.unshift(parent);
        current = parent;
      } else break;
    }
  }

  const subCategories = dbCategories.filter((c: any) => c.parent_id === activeCategory?.id);

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Decorative Dotted Grid */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        {/* Top Premium Glow (The "Parabola" alternative) */}
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[120%] h-[400px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent rounded-[100%] blur-[120px] opacity-60 dark:opacity-40" />

        {/* Larger, more vibrant mesh gradients for the periphery */}
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-primary/20 dark:bg-primary/15 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-info/15 blur-[100px]" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-success/10 blur-[80px]" />
        <div className="absolute top-[50%] left-[-5%] w-[30%] h-[30%] rounded-full bg-primary/10 blur-[80px]" />
      </div>

      <Header />

      <div className="flex flex-1 overflow-hidden relative z-10 w-full max-w-[1600px] mx-auto">
        <SidebarNav
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />

        <main className={`flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 md:px-10 md:py-8 pb-safe-nav`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${pathname}-${selectedCategory}-${searchQuery}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-10"
            >


              {pathname === tenantIdeaBoard && (
                <div className="space-y-8 relative">
                  <div className="flex flex-col gap-6">
                    {/* Dynamic Breadcrumbs */}
                    <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem>
                          <BreadcrumbLink 
                            className="text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                            onClick={() => {
                              searchParams.delete("space");
                              searchParams.delete("category");
                              searchParams.delete("search");
                              setSearchParams(searchParams);
                            }}
                          >
                            Board
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        {(activeSpace || categoryPath.length > 0) && <BreadcrumbSeparator />}
                        
                        {activeSpace && (
                          <>
                            <BreadcrumbItem>
                              <BreadcrumbLink 
                                className="text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-primary"
                                onClick={() => {
                                  searchParams.delete("category");
                                  setSearchParams(searchParams);
                                }}
                              >
                                {activeSpace.name}
                              </BreadcrumbLink>
                            </BreadcrumbItem>
                            {categoryPath.length > 0 && <BreadcrumbSeparator />}
                          </>
                        )}

                        {categoryPath.map((cat, idx) => (
                          <React.Fragment key={cat.id}>
                            <BreadcrumbItem>
                              {idx === categoryPath.length - 1 ? (
                                <BreadcrumbPage className="text-xs font-bold uppercase tracking-wider text-primary">
                                  {cat.name}
                                </BreadcrumbPage>
                              ) : (
                                <BreadcrumbLink 
                                  className="text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-primary"
                                  onClick={() => setSelectedCategory(cat.name)}
                                >
                                  {cat.name}
                                </BreadcrumbLink>
                              )}
                            </BreadcrumbItem>
                            {idx < categoryPath.length - 1 && <BreadcrumbSeparator />}
                          </React.Fragment>
                        ))}
                      </BreadcrumbList>
                    </Breadcrumb>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-card rounded-2xl border border-border shadow-sm ring-1 ring-border/50">
                          <LayoutGrid className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black tracking-tight text-foreground transition-colors">
                            {activeCategory?.name || activeSpace?.name || "Idea Board"}
                          </h2>
                          <p className="text-muted-foreground font-medium mt-0.5">
                            {activeCategory?.description || "Browse and filter through the community's brightest ideas."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sub-categories View */}
                  {subCategories.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                      {subCategories.map((sub: any) => (
                        <button
                          key={sub.id}
                          onClick={() => setSelectedCategory(sub.name)}
                          className="group p-4 bg-card/50 hover:bg-card border border-border/5 hover:border-primary/20 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-1 text-left flex flex-col gap-2"
                        >
                          <div className="p-2 bg-primary/10 rounded-xl w-fit group-hover:bg-primary transition-colors">
                            <FolderTree className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
                          </div>
                          <span className="font-black text-sm text-foreground truncate">{sub.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <KanbanBoard category={selectedCategory} spaceId={selectedSpace} search={searchQuery} />
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
