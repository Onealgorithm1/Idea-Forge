import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import SubmitIdea from "./pages/SubmitIdea";
import IdeaDetail from "./pages/IdeaDetail";
import Profile from "./pages/Profile";
import AdminUsers from "./pages/AdminUsers";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ROUTES } from "./lib/constants";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SocketProvider>
          <AuthProvider>
            <Routes>
              <Route element={<ProtectedRoute />}>
                <Route path={ROUTES.ROOT} element={<Index />} />
                <Route path={ROUTES.IDEA_BOARD} element={<Index />} />
                <Route path={ROUTES.ROADMAP} element={<Index />} />
                <Route path={ROUTES.ANALYTICS} element={<Index />} />
                <Route path={ROUTES.SUBMIT_IDEA} element={<SubmitIdea />} />
                <Route path={ROUTES.IDEA_DETAIL} element={<IdeaDetail />} />
                <Route path={ROUTES.PROFILE} element={<Profile />} />
                <Route path={ROUTES.ADMIN_USERS} element={<AdminUsers />} />
              </Route>
              <Route path={ROUTES.LOGIN} element={<AuthPage />} />
              <Route path={ROUTES.SIGNUP} element={<AuthPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </SocketProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
