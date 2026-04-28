import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { api, setUnauthorizedHandler } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, tenantSlug?: string) => Promise<void>;
  register: (name: string, email: string, password: string, tenantSlug?: string) => Promise<void>;
  logout: (message?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    // Set up global unauthorized handler
    setUnauthorizedHandler(() => {
      logout("Your session has expired. Please login again.");
    });
  }, []);

  // Inactivity timer
  useEffect(() => {
    if (!token) return;

    let timeoutId: any;
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout("You have been logged out due to inactivity. Please login again.");
      }, INACTIVITY_LIMIT);
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    
    // Initial start
    resetTimer();

    // Listen for activity
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [token]);

  const login = async (email: string, password: string, tenantSlug: string = 'default') => {
    try {
      const data = await api.post("/auth/login", { email, password, tenantSlug });
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.tenantId) {
        localStorage.setItem("tenantId", data.user.tenantId);
      }
      toast.success(`Welcome back, ${data.user.name}!`);
      // Clear cache on login to ensure clean state
      queryClient.clear();
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, tenantSlug: string = 'default') => {
    try {
      const data = await api.post("/auth/register", { name, email, password, tenantSlug });
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.tenantId) {
        localStorage.setItem("tenantId", data.user.tenantId);
      }
      toast.success(`Account created successfully!`);
      // Clear cache on register to ensure clean state
      queryClient.clear();
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const logout = (message?: string) => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tenantId");
    // Clear all cached queries on logout
    queryClient.clear();
    
    if (message) {
      toast.info(message, { duration: 5000 });
    } else {
      toast.info("You have been logged out");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
