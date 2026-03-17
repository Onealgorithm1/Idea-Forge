import { useLocation, Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-9xl font-black text-slate-200">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Oops! Page not found</h2>
          <p className="text-slate-500">
            We couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
        </div>
        <Button asChild className="px-8 py-6 text-lg font-bold rounded-2xl shadow-premium">
          <Link to={getTenantPath(ROUTES.ROOT, tenantSlug)}>
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
