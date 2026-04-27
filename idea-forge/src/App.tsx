import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { ThemeProvider } from "next-themes";
import { TenantProvider } from "./contexts/TenantContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import SubmitIdea from "./pages/SubmitIdea";
import IdeaDetail from "./pages/IdeaDetail";
import EventDetail from "./pages/EventDetail";
import Profile from "./pages/Profile";
import AdminUsers from "./pages/AdminUsers";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/AdminSettings";
import AdminCategories from "./pages/AdminCategories";
import SuperAdminLogin from "./pages/SuperAdmin/Login";
import SuperAdminDashboard from "./pages/SuperAdmin/Dashboard";
import TenantDetail from "./pages/SuperAdmin/TenantDetail";
import RegisterWorkspace from "./pages/RegisterWorkspace";
import ForgotPassword from "./pages/ForgotPassword";
import Activity from "./pages/Activity";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ROUTES } from "./lib/constants";
import FloatingSubmitIdea from "./components/FloatingSubmitIdea";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const AppContent = () => (
  <>
    <Routes>
    {/* Super Admin Portal — standalone */}
    <Route path="/super-admin" element={<SuperAdminLogin />} />
    <Route path="/super-admin/login" element={<SuperAdminLogin />} />
    <Route path="/register-workspace" element={<RegisterWorkspace />} />
    <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
    <Route path="/super-admin/tenants/:id" element={<TenantDetail />} />

    {/* Root redirect: Send users to a default organization or landing page */}
    {/* For this MVP, we redirect to 'default' tenant */}
    <Route path="/" element={<Navigate to="/default/idea-board" replace />} />
    <Route path="/login" element={<Navigate to="/default/login" replace />} />
    {/* <Route path="/signup" element={<Navigate to="/default/signup" replace />} /> */}
    <Route path="/idea-board" element={<Navigate to="/default/idea-board" replace />} />
    <Route path="/roadmap" element={<Navigate to="/default/roadmap" replace />} />
    <Route path="/analytics" element={<Navigate to="/default/analytics" replace />} />
    <Route path="/my-ideas" element={<Navigate to="/default/my-ideas" replace />} />
    <Route path="/saved-ideas" element={<Navigate to="/default/saved-ideas" replace />} />
    <Route path="/submit-idea" element={<Navigate to="/default/submit-idea" replace />} />
    <Route path="/profile" element={<Navigate to="/default/profile" replace />} />
    <Route path="/activity" element={<Navigate to="/default/activity" replace />} />
    <Route path="/admin/*" element={<Navigate to="/default/admin/dashboard" replace />} />

    {/* Tenant specific routes: /:tenantSlug/... */}
    <Route path="/:tenantSlug/*" element={<TenantProvider>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route index element={<Navigate to="idea-board" replace />} />
          <Route path="idea-board" element={<Index />} />
          <Route path="roadmap" element={<Index />} />
          <Route path="analytics" element={<Index />} />
          <Route path="my-ideas" element={<Index />} />
          <Route path="saved-ideas" element={<Index />} />
          <Route path="submit-idea" element={<SubmitIdea />} />
          <Route path="ideas/:id" element={<IdeaDetail />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="activity" element={<Activity />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/settings" element={<AdminSettings />} />
          <Route path="admin/categories" element={<AdminCategories />} />
        </Route>
        <Route path="login" element={<AuthPage />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        {/* <Route path="signup" element={<AuthPage />} /> */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <FloatingSubmitIdea />
      <BottomNav />
    </TenantProvider>} />

    {/* Catch-all for very deep unknown paths */}
    <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
