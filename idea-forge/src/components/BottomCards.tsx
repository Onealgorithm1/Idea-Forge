import { Map, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const topContributors = [
  { rank: 1, name: "Sarah M.", color: "bg-warning" },
  { rank: 2, name: "Mike T.", color: "bg-muted-foreground/40" },
  { rank: 3, name: "Anna K.", color: "bg-warning/60" },
];

const BottomCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Product Roadmap */}
      <Card className="p-5 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-bold text-base">Product Roadmap</h3>
          <p className="text-sm text-muted-foreground">Plan the next steps</p>
          <Button size="sm" variant="default" className="mt-1">
            View Roadmap
          </Button>
        </div>
        <div className="h-20 w-20 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Map className="h-10 w-10 text-primary/60" />
        </div>
      </Card>

      {/* Top Contributors */}
      <Card className="p-5 flex items-center justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div>
            <h3 className="font-bold text-base">Top Contributors</h3>
            <p className="text-sm text-muted-foreground">Leaderboard of top users</p>
          </div>
          <div className="space-y-2">
            {topContributors.map((c) => (
              <div key={c.rank} className="flex items-center gap-2.5">
                <div className={`h-5 w-5 rounded-full ${c.color} flex items-center justify-center`}>
                  <span className="text-[10px] font-bold text-card">{c.rank}</span>
                </div>
                <span className="text-sm font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="h-20 w-20 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Trophy className="h-10 w-10 text-warning" />
        </div>
      </Card>
    </div>
  );
};

export default BottomCards;
