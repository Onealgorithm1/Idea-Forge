import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";

export const ProtectedRoute = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  
  console.log(`[ProtectedRoute] Path: ${window.location.pathname}, User:`, user?.email, `Tenant:`, tenant?.slug);

  if (!user) {
    // Redirect them to the /tenantSlug/login page
    const loginPath = tenantSlug ? `/${tenantSlug}/login` : "/default/login";
    console.log(`[ProtectedRoute] No user, redirecting to ${loginPath}`);
    return <Navigate to={loginPath} replace />;
  }

  // Ensure user's tenant matches the current URL tenant
  // If user is from 'default' and visiting 'marketing', redirect to marketing login
  if (tenant && user.tenantId !== tenant.id) {
    const loginPath = tenantSlug ? `/${tenantSlug}/login` : "/default/login";
    
    // Safety check: Don't redirect if we are already at the target login path
    if (window.location.pathname !== loginPath) {
      console.warn(`[ProtectedRoute] Tenant mismatch! User belongs to ${user.tenantId}, but visiting ${tenant.id}. Redirecting to ${loginPath}.`);
      return <Navigate to={loginPath} state={{ message: "Please log in to this organization." }} replace />;
    }
  }

  return <Outlet />;
};
