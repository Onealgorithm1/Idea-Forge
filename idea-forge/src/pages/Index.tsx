import Header from "@/components/Header";
import SidebarNav from "@/components/SidebarNav";
import CtaBanner from "@/components/CtaBanner";
import KanbanBoard from "@/components/KanbanBoard";
import BottomCards from "@/components/BottomCards";
import DeveloperBriefs from "@/components/DeveloperBriefs";
import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") || "All";

  const setSelectedCategory = (category: string) => {
    if (category === "All") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", category);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <SidebarNav 
          selectedCategory={selectedCategory} 
          onCategorySelect={setSelectedCategory} 
        />

        <main className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${pathname}-${selectedCategory}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {pathname === ROUTES.ROOT && (
                <>
                  <CtaBanner />
                  <KanbanBoard category={selectedCategory} />
                  <BottomCards />
                </>
              )}

              {pathname === ROUTES.IDEA_BOARD && (
                <>
                   <div className="flex items-center gap-2 mb-2">
                     <LayoutGrid className="h-5 w-5 text-primary" />
                     <h2 className="text-xl font-bold tracking-tight">Idea Board</h2>
                   </div>
                   <KanbanBoard category={selectedCategory} />
                </>
              )}

              {pathname === ROUTES.ROADMAP && <DeveloperBriefs />}

              {pathname === ROUTES.ANALYTICS && (
                <div className="text-center py-16 text-muted-foreground font-medium">
                  <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="h-8 w-8 border-4 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  </div>
                  Analytics coming soon
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
