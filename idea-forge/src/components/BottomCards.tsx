import { Map, Trophy, ArrowRight, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { ROUTES, getTenantPath } from "@/lib/constants";

const topContributors = [
  { rank: 1, name: "Sarah M.", color: "text-amber-500", bg: "bg-amber-500/10" },
  { rank: 2, name: "Mike T.", color: "text-slate-400", bg: "bg-slate-400/10" },
  { rank: 3, name: "Anna K.", color: "text-orange-400", bg: "bg-orange-400/10" },
];

const BottomCards = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Product Roadmap */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 relative overflow-hidden group border-none shadow-premium bg-gradient-to-br from-indigo-500/5 to-primary/10 backdrop-blur-sm h-full flex flex-col justify-between hover:shadow-premium-hover transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-5 -translate-y-4 translate-x-4 group-hover:scale-110 transition-transform duration-500">
            <Map className="h-32 w-32" />
          </div>
          <div className="relative z-10">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Map className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-black text-xl mb-2 tracking-tight">Product Roadmap</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">
              Explore the upcoming features and milestones planned for IdeaForge.
            </p>
          </div>
          <div className="mt-6 relative z-10">
            <Button asChild variant="default" className="rounded-full px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white font-bold">
              <Link to={getTenantPath(ROUTES.ROADMAP, tenantSlug)} className="flex items-center gap-2">
                Explore Journey <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Top Contributors */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 relative overflow-hidden group border-none shadow-premium bg-gradient-to-br from-amber-500/5 to-warning/10 backdrop-blur-sm h-full flex flex-col hover:shadow-premium-hover transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-5 -translate-y-4 translate-x-4 group-hover:scale-110 transition-transform duration-500">
            <Trophy className="h-32 w-32" />
          </div>
          <div className="relative z-10 flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="h-12 w-12 rounded-xl bg-warning/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Trophy className="h-6 w-6 text-warning" />
              </div>
              <div className="text-right">
                <h3 className="font-black text-xl tracking-tight">Top Minds</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">This Month</p>
              </div>
            </div>
            <div className="space-y-3">
              {topContributors.map((c) => (
                <div key={c.rank} className="flex items-center justify-between bg-white/40 p-2.5 rounded-xl border border-white/40 group/item hover:bg-white/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg ${c.bg} ${c.color} flex items-center justify-center font-bold text-sm shadow-sm`}>
                      {c.rank}
                    </div>
                    <span className="font-bold text-sm">{c.name}</span>
                  </div>
                  <Star className="h-4 w-4 text-warning fill-warning opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default BottomCards;
