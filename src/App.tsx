import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import MapPage from "./pages/MapPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import FaqPage from "./pages/FaqPage";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useServiceWorkerUpdate } from "./hooks/useServiceWorkerUpdate";
import AddToHomeScreen from "./components/AddToHomeScreen";
import { supabase } from "@/integrations/supabase/client";
import AppLogo from "@/components/AppLogo";

const queryClient = new QueryClient();

/** Handle Android hardware back button */
const AndroidBackHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removeListener: (() => void) | undefined;

    const setup = async () => {
      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack && location.pathname !== "/") {
          navigate(-1);
        } else {
          // On home screen — show exit confirmation
          if (window.confirm("Exit 2DateMe?")) {
            App.exitApp();
          }
        }
      });
      removeListener = () => handle.remove();
    };

    setup();
    return () => { removeListener?.(); };
  }, [navigate, location]);

  return null;
};

const RootRoute = () => {
  const [loading, setLoading] = useState(true);
  const [showIndex, setShowIndex] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session) {
          setShowIndex(true);
          setLoading(false);
          return;
        }

        // If user already entered WhatsApp on landing previously, allow direct entry.
        const saved = typeof localStorage !== "undefined" ? localStorage.getItem("landing_whatsapp_e164") : null;
        setShowIndex(!!saved);
      } catch {
        // If anything fails, default to landing.
        setShowIndex(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    check();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
        <AppLogo className="w-20 h-20 object-contain" style={{ filter: "drop-shadow(0 0 20px rgba(220,80,150,0.6))" }} />
        <p className="mt-4 text-white text-lg font-bold tracking-widest">2DateMe</p>
        <div className="mt-6 flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return showIndex ? <Index /> : <AuthPage />;
};

const AppContent = () => {
  useOnlineStatus();
  useServiceWorkerUpdate();
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AndroidBackHandler />
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/profile/:id" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
        <AddToHomeScreen />
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);


export default App;
