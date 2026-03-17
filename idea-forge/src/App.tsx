import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { TenantProvider } from "./contexts/TenantContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import SubmitIdea from "./pages/SubmitIdea";
import IdeaDetail from "./pages/IdeaDetail";
import Profile from "./pages/Profile";
import AdminUsers from "./pages/AdminUsers";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminLogin from "./pages/SuperAdmin/Login";
import SuperAdminDashboard from "./pages/SuperAdmin/Dashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ROUTES } from "./lib/constants";

const queryClient = new QueryClient();

const AppContent = () => (
  <Routes>
    {/* Super Admin Portal — standalone */}
    <Route path="/super-admin" element={<SuperAdminLogin />} />
    <Route path="/super-admin/login" element={<SuperAdminLogin />} />
    <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />

    {/* Root redirect: Send users to a default organization or landing page */}
    {/* For this MVP, we redirect to 'default' tenant */}
    <Route path="/" element={<Navigate to="/default" replace />} />
    <Route path="/login" element={<Navigate to="/default/login" replace />} />

    {/* Tenant specific routes: /:tenantSlug/... */}
    <Route path="/:tenantSlug/*" element={<TenantProvider>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route index element={<Index />} />
          <Route path="idea-board" element={<Index />} />
          <Route path="roadmap" element={<Index />} />
          <Route path="analytics" element={<Index />} />
          <Route path="submit-idea" element={<SubmitIdea />} />
          <Route path="ideas/:id" element={<IdeaDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/users" element={<AdminUsers />} />
        </Route>
        <Route path="login" element={<AuthPage />} />
        <Route path="signup" element={<AuthPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TenantProvider>} />

    {/* Catch-all for very deep unknown paths */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SocketProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </SocketProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
