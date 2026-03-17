import { Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams, Link } from "react-router-dom";
import { ROUTES, getTenantPath } from "@/lib/constants";

const CtaBanner = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  
  return (
    <div className="bg-card rounded-lg border p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-warning/15 flex items-center justify-center shrink-0">
          <Lightbulb className="h-5 w-5 text-warning" />
        </div>
        <p className="text-sm font-medium">
          Got a new idea?{" "}
          <span className="text-muted-foreground">Share it & collaborate!</span>
        </p>
      </div>
      <Link to={getTenantPath(ROUTES.SUBMIT_IDEA, tenantSlug)}>
        <Button size="sm" className="gap-1.5 shrink-0">
          Submit Idea
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
};

export default CtaBanner;
