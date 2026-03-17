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
      // Skip tenant fetching for super-admin routes
      if (location.pathname.startsWith('/super-admin')) {
        setIsLoading(false);
        return;
      }

      if (!tenantSlug) {
        // If no slug, we might be at root. 
        // We could redirect to a default tenant or show a landing page.
        // For now, let's assume we need a slug for the app to function.
        if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup') {
           // Maybe fallback to 'default' if nothing else
           // setTenant({ id: '00000000-0000-0000-0000-000000000001', name: 'Default Organization', slug: 'default', status: 'active' });
           setIsLoading(false);
           return;
        }
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log(`[TenantContext] Fetching tenant for slug: ${tenantSlug}`);
        const data = await api.get(`/tenants/by-slug/${tenantSlug}`);
        console.log(`[TenantContext] Tenant data received:`, data);
        setTenant(data);
        setError(null);
        
        // Store in localStorage for api.ts to pick up
        localStorage.setItem('tenantId', data.id);
        localStorage.setItem('lastTenantId', data.id);
        localStorage.setItem('lastTenantSlug', data.slug);
      } catch (err: any) {
        console.error('[TenantContext] Failed to fetch tenant:', err);
        setError(err.message || 'Tenant not found');
        setTenant(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenant();
  }, [tenantSlug, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-slate-500">Loading experience...</p>
        </div>
      </div>
    );
  }

  // If we have a slug but tenant wasn't found, we should probably show a 404 or redirect
  if (tenantSlug && !tenant && !isLoading && !location.pathname.startsWith('/super-admin')) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-2">404</h1>
        <p className="text-xl font-bold text-slate-800 mb-4">Organization Not Found</p>
        <p className="text-slate-500 mb-8 max-w-md">
          We couldn't find an organization with the name <span className="font-mono font-bold text-primary">"/{tenantSlug}"</span>. 
          Please check the URL or contact your administrator.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-premium hover:opacity-90 transition-all"
        >
          Go Back Home
        </button>
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
