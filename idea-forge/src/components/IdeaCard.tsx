import { ChevronUp, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { type Idea } from "@/data/mockData";

interface IdeaCardProps {
  idea: Idea;
  onVote: (id: string, direction: "up" | "down") => void;
}

const statusColors: Record<Idea["status"], string> = {
  Pending: "bg-muted text-muted-foreground",
  "Under Review": "bg-warning/15 text-warning border-warning/20",
  "In Development": "bg-info/15 text-info border-info/20",
  Shipped: "bg-success/15 text-success border-success/20",
};

const IdeaCard = ({ idea, onVote }: IdeaCardProps) => {
  return (
    <Card className="group p-0 overflow-hidden border hover:border-primary/30 transition-colors duration-200">
      <div className="flex">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-0.5 px-3 py-4 bg-secondary/50 min-w-[56px]">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onVote(idea.id, "up"); }}
            className={`p-1 rounded hover:bg-emerald-500/10 transition-colors ${
              idea.userVote === "up" ? "text-emerald-600" : "text-muted-foreground"
            }`}
          >
            <ChevronUp className={`h-5 w-5 ${idea.userVote === 'up' ? 'fill-current' : ''}`} />
          </button>
          <span className={`text-sm font-bold tabular-nums ${
            idea.votes > 0 ? "text-emerald-600" : idea.votes < 0 ? "text-rose-600" : "text-slate-700"
          }`}>
            {idea.votes}
          </span>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onVote(idea.id, "down"); }}
            className={`p-1 rounded hover:bg-rose-500/10 transition-colors ${
              idea.userVote === "down" ? "text-rose-600" : "text-muted-foreground"
            }`}
          >
            <ChevronDown className={`h-4 w-4 ${idea.userVote === 'down' ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
              {idea.title}
            </h3>
            <Badge variant="outline" className={`shrink-0 text-[11px] font-medium ${statusColors[idea.status]}`}>
              {idea.status}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {idea.description}
          </p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {idea.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                  {tag}
                </Badge>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {idea.author} · {idea.department}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default IdeaCard;
