import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = () => {
  const { user } = useAuth();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  if (!user) {
    // Redirect them to the /tenantSlug/login page
    const loginPath = tenantSlug ? `/${tenantSlug}/login` : "/default/login";
    return <Navigate to={loginPath} replace />;
  }

  return <Outlet />;
};
