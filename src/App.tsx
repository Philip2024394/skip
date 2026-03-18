import { Toaster } from "@/shared/components/toaster";
import { Toaster as Sonner } from "@/shared/components/sonner";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { TooltipProvider } from "@/shared/components/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthPage } from "@/features/auth/pages";
import { ProtectedRoute, LoadingFallback } from "@/shared/components";

// Lazy load heavy pages to reduce initial bundle size
const DashboardPage = lazy(() => import("@/features/dating/pages/DashboardPage"));
const WhatsAppCollection = lazy(() => import("@/features/admin/pages/WhatsAppCollection"));
const WhatsAppDirectory = lazy(() => import("@/features/admin/components/WhatsAppDirectory"));
const SecurityDashboard = lazy(() => import("@/features/admin/components/SecurityDashboard"));
const UltimateSecurityDashboard = lazy(() => import("@/features/admin/components/UltimateSecurityDashboard"));
const WorldMapDashboard = lazy(() => import("@/features/admin/pages/WorldMapDashboard"));

const queryClient = new QueryClient();

const AppContent = () => {
  useEffect(() => {
    // Track ad link opens (for ad analytics)
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref?.startsWith("ad_")) {
        const k = "2dateme_adv_" + ref.slice(3);
        localStorage.setItem(k, String((parseInt(localStorage.getItem(k) || "0")) + 1));
      }
    } catch {}
    // Check if user is already logged in and redirect to auth if needed
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log("User session found, keeping on landing page");
      }
    });
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/home" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/profile/:id" element={<AuthPage />} />
        <Route path="/reset-password" element={<AuthPage />} />
        <Route path="/payment-success" element={<AuthPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense></ProtectedRoute>} />
        <Route path="/admin" element={<AuthPage />} />
        <Route path="/admin/whatsapp-collection" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><WhatsAppCollection /></Suspense></ProtectedRoute>} />
        <Route path="/admin/whatsapp-directory" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><WhatsAppDirectory /></Suspense></ProtectedRoute>} />
        <Route path="/admin/security" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><SecurityDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/admin/ultimate-security" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><UltimateSecurityDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/admin/world-map" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><WorldMapDashboard /></Suspense></ProtectedRoute>} />
        <Route path="*" element={<AuthPage />} />
      </Routes >
    </BrowserRouter >
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider >
    </LanguageProvider >
  </QueryClientProvider >
);

export default App;
