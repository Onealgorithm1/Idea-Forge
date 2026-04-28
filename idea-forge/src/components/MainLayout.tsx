import React from "react";
import SidebarNav from "./SidebarNav";
import Header from "./Header";
import { useLocation, useParams } from "react-router-dom";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { pathname } = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  return (
    <div className="h-[100dvh] bg-background flex relative overflow-hidden transition-colors duration-300 w-full">
      {/* Unified Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Decorative Dotted Grid */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Top Premium Glow */}
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[120%] h-[400px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent rounded-[100%] blur-[120px] opacity-60 dark:opacity-40" />

        {/* Dynamic mesh gradients for atmosphere */}
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-primary/20 dark:bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-emerald-500/10 blur-[80px]" />
      </div>

      <SidebarNav />

      <div className="flex flex-col flex-1 overflow-hidden relative z-10 w-full">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-safe-nav flex flex-col w-full relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
