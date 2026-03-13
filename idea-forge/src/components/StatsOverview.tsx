import { Lightbulb, Users, BarChart3, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { 
    label: "Total Ideas", 
    value: "128", 
    icon: Lightbulb, 
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20"
  },
  { 
    label: "Active Contributors", 
    value: "2,450", 
    icon: Users, 
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20"
  },
  { 
    label: "Community Votes", 
    value: "15.2k", 
    icon: BarChart3, 
    color: "text-info",
    bg: "bg-info/10",
    border: "border-info/20"
  },
  { 
    label: "Implemented", 
    value: "42", 
    icon: CheckCircle2, 
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20"
  },
];

const StatsOverview = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={`p-5 rounded-2xl bg-white border ${stat.border} shadow-premium hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300 group`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <span className="text-2xl font-black tracking-tight">{stat.value}</span>
          </div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsOverview;
