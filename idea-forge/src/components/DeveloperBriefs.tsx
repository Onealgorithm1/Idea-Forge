import { Bot, CheckCircle2, User, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockBriefs, type DeveloperBrief } from "@/data/mockData";
import { getInitials } from "@/lib/utils";

const stageColors: Record<DeveloperBrief["stage"], string> = {
  Backlog: "bg-muted text-muted-foreground",
  "In Progress": "bg-info/15 text-info border-info/20",
  QA: "bg-warning/15 text-warning border-warning/20",
  Done: "bg-success/15 text-success border-success/20",
};

const stageHeaderColors: Record<DeveloperBrief["stage"], string> = {
  Backlog: "",
  "In Progress": "bg-primary/5 border-b-primary/30",
  QA: "",
  Done: "",
};

const stages: DeveloperBrief["stage"][] = ["Backlog", "In Progress", "QA", "Done"];

const DeveloperBriefs = () => {
  const grouped = stages.map((stage) => ({
    stage,
    briefs: mockBriefs.filter((b) => b.stage === stage),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {grouped.map(({ stage, briefs }) => (
        <Card key={stage} className="p-0 overflow-hidden">
          <div className={`flex items-center justify-between px-4 py-3 border-b ${stageHeaderColors[stage]}`}>
            <h3 className={`font-semibold text-sm ${stage === "In Progress" ? "text-primary" : ""}`}>
              {stage}
            </h3>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-3 space-y-2">
            {briefs.map((brief) => (
              <BriefCard key={brief.id} brief={brief} />
            ))}
            {briefs.length === 0 && (
              <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                No briefs yet
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

const BriefCard = ({ brief }: { brief: DeveloperBrief }) => (
  <div className="bg-background rounded-md border p-3 space-y-2.5 hover:border-primary/30 transition-colors cursor-pointer">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarFallback className="text-[9px] bg-accent text-accent-foreground">
            {getInitials(brief.title)}
          </AvatarFallback>
        </Avatar>
        <h4 className="font-medium text-sm leading-snug">{brief.title}</h4>
      </div>
      <Badge variant="outline" className="shrink-0 text-[10px] gap-1 font-medium bg-accent text-accent-foreground border-primary/20">
        <Bot className="h-3 w-3" />
        AI Brief
      </Badge>
    </div>

    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{brief.summary}</p>

    <div className="space-y-1">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        Acceptance Criteria
      </span>
      {brief.acceptanceCriteria.slice(0, 2).map((ac, i) => (
        <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-success shrink-0" />
          <span className="line-clamp-1">{ac}</span>
        </div>
      ))}
      {brief.acceptanceCriteria.length > 2 && (
        <span className="text-[10px] text-muted-foreground">
          +{brief.acceptanceCriteria.length - 2} more
        </span>
      )}
    </div>

    <div className="flex items-center justify-between pt-1.5 border-t">
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <User className="h-3 w-3" />
        {brief.originalAuthor}, {brief.originalDepartment}
      </div>
      <div className="flex -space-x-1.5">
        {brief.assignedDevs.map((dev) => (
          <Avatar key={dev.initials} className="h-5 w-5 border-2 border-card">
            <AvatarFallback className="text-[8px] font-medium bg-primary/10 text-primary">
              {dev.initials}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
    </div>
  </div>
);

export default DeveloperBriefs;
