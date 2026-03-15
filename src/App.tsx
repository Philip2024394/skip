import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import WhatsAppLeadsPage from "./pages/admin/WhatsAppLeadsPage";
import WorldMapDashboard from "./pages/admin/WorldMapDashboard";
import MapPage from "./pages/MapPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import FaqPage from "./pages/FaqPage";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useServiceWorkerUpdate } from "./hooks/useServiceWorkerUpdate";
// import GiftSenderProvider from "@/components/gifts/GiftSenderProvider";

const queryClient = new QueryClient();

/**
 * LandingGuard: unauthenticated users who haven't submitted a WhatsApp number
 * are sent to /auth (the landing / sign-in page) first.
 * Once they have a session OR have already entered their WhatsApp number they
 * see the main app as normal.
 */
const LandingGuard = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    const hasWA = !!localStorage.getItem("landing_whatsapp_e164");
    if (hasWA) { setReady(true); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setRedirect(true);
      setReady(true);
    });
  }, []);

  if (!ready) return null;
  if (redirect) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

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

const AppContent = () => {
  useOnlineStatus();
  useServiceWorkerUpdate();
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AndroidBackHandler />
        <Routes>
          <Route path="/" element={<LandingGuard><Index /></LandingGuard>} />
          <Route path="/home" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile/:id" element={<Index />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="/admin/whatsapp-leads" element={<ProtectedRoute><WhatsAppLeadsPage /></ProtectedRoute>} />
          <Route path="/admin/world-map" element={<ProtectedRoute><WorldMapDashboard /></ProtectedRoute>} />
          <Route path="/2dtm-control-panel" element={<AdminPage />} />
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
        {/* <GiftSenderProvider> */}
          <Toaster />
          <Sonner />
          <AppContent />
        {/* </GiftSenderProvider> */}
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);


export default App;
