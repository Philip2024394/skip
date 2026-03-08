import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
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
import AddToHomeScreen from "./components/AddToHomeScreen";

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

const AppContent = () => {
  useOnlineStatus();
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AndroidBackHandler />
        <Routes>
          <Route path="/" element={<Index />} />
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
