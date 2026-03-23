import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES, getTenantPath } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const isLogin = location.pathname.endsWith("/login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (isLogin) {
          await login(email, password, tenantSlug);
        } else {
          const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
          await register(fullName, email, password, tenantSlug);
        }
        navigate(getTenantPath(ROUTES.IDEA_BOARD, tenantSlug));
    } catch (error) {
      // Error is handled in context/toast
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 relative"
    >
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: 'url("/Idea Sharing Hero Image.jpg")' }}
      >
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px]"></div>
      </div>

      <div className="w-full max-w-[400px] z-10">
        <div className="flex justify-center mb-12">
          <Link to={getTenantPath(ROUTES.ROOT, tenantSlug)} className="flex items-center gap-6 text-7xl font-black tracking-tighter text-foreground drop-shadow-md">
            <Logo imageClassName="h-28 w-28 transition-all duration-500 hover:rotate-12 hover:scale-110" />
            <span>IdeaForge</span>
          </Link>
        </div>

        <Card className="w-full bg-card/80 backdrop-blur-md border-primary/10 shadow-2xl mt-4">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin
                ? "Enter your email and password to log in"
                : "Enter your details below to create your account"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {isLogin && (
                    <Link
                      to="#"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full">
                {isLogin ? "Log in" : "Sign up"}
              </Button>
              <div className="text-center text-sm">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Link
                  to={isLogin ? getTenantPath(ROUTES.SIGNUP, tenantSlug) : getTenantPath(ROUTES.LOGIN, tenantSlug)}
                  className="font-medium text-primary hover:underline hover:text-primary/90"
                >
                  {isLogin ? "Sign up" : "Log in"}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
