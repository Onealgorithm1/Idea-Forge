import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  settings_json?: any;
}

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchTenant = async () => {
      // 1. Skip if already loaded for this slug
      if (tenant && tenant.slug === tenantSlug) {
        setIsLoading(false);
        return;
      }

      // 2. Handle super-admin routes
      if (location.pathname.startsWith('/super-admin')) {
        document.title = 'Super Admin | IdeaForge';
        setIsLoading(false);
        return;
      }

      // 3. Handle landing/auth pages without slugs
      if (!tenantSlug) {
        if (['/', '/login', '/signup'].includes(location.pathname)) {
           setIsLoading(false);
           return;
        }
        setIsLoading(false);
        return;
      }

      // 4. Fetch if needed
      try {
        // Only show loading if we don't have a tenant at all or it's a different one
        if (!tenant || tenant.slug !== tenantSlug) {
          setIsLoading(true);
        }

        const data = await api.get(`/tenants/by-slug/${tenantSlug}`);
        setTenant(data);
        setError(null);
        document.title = `${data.name} | IdeaForge`;
        
        localStorage.setItem('tenantId', data.id);
        localStorage.setItem('lastTenantId', data.id);
        localStorage.setItem('lastTenantSlug', data.slug);
      } catch (err: any) {
        setError(err.message || 'Tenant not found');
        setTenant(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenant();
  }, [tenantSlug]); // Removed location.pathname to avoid re-fetching on every internal navigation

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#020817] transition-colors duration-700">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-white/40 animate-pulse">IdeaForge</p>
            <p className="text-xs font-bold text-white/20">Initializing workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // If we have a slug but tenant wasn't found, we should probably show a 404 or redirect
  if (tenantSlug && !tenant && !isLoading && !location.pathname.startsWith('/super-admin')) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#020817] p-6 text-center text-white transition-colors">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
        </div>
        
        <div className="relative z-10 max-w-md space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/5 border border-white/10 mb-4">
            <span className="text-4xl font-black text-white/20">404</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Workspace Not Found</h1>
            <p className="text-white/40 font-medium">
              We couldn't find an organization with the name <span className="text-primary font-bold">"/{tenantSlug}"</span>
            </p>
          </div>

          <div className="pt-4">
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-premium hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ tenant, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
