import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import AdminConfig from "@/pages/AdminConfig";
import Scanner from "@/pages/Scanner";
import Premium from "@/pages/Premium";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <Login />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/scanner" component={Scanner} />
      <Route path="/premium" component={Premium} />
      <Route path="/admin" component={AdminConfig} />
      <Route component={NotFound} />
    </Switch>
  );
}

function useScreenshotProtection() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      const root = document.getElementById("root");
      if (!root) return;
      if (document.hidden) {
        root.style.filter = "blur(20px)";
        root.style.transition = "filter 0.1s";
      } else {
        root.style.filter = "";
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
}

function App() {
  useScreenshotProtection();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <I18nProvider>
          <AuthProvider>
            <AuthGate>
              <AppRoutes />
            </AuthGate>
          </AuthProvider>
        </I18nProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
