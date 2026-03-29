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
const HomePage = lazy(() => import("@/features/dating/pages/HomePage"));
const DashboardPage = lazy(() => import("@/features/dating/pages/DashboardPage"));
const FaqPage = lazy(() => import("@/features/dating/pages/FaqPage"));
const TermsPage = lazy(() => import("@/features/dating/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/features/dating/pages/PrivacyPage"));
const MapPage = lazy(() => import("@/features/dating/pages/MapPage"));
const AdminPage = lazy(() => import("@/features/admin/pages/AdminPage"));
const WhatsAppCollection = lazy(() => import("@/features/admin/pages/WhatsAppCollection"));
const WhatsAppDirectory = lazy(() => import("@/features/admin/components/WhatsAppDirectory"));
const SecurityDashboard = lazy(() => import("@/features/admin/components/SecurityDashboard"));
const UltimateSecurityDashboard = lazy(() => import("@/features/admin/components/UltimateSecurityDashboard"));
const WorldMapDashboard = lazy(() => import("@/features/admin/pages/WorldMapDashboard"));
const GhostModePage = lazy(() => import("@/features/ghost/pages/GhostModePage"));
const GhostSetupPage = lazy(() => import("@/features/ghost/pages/GhostSetupPage"));
const GhostAuthPage = lazy(() => import("@/features/ghost/pages/GhostAuthPage"));
const GhostPricingPage = lazy(() => import("@/features/ghost/pages/GhostPricingPage"));
const GhostGatewayPage = lazy(() => import("@/features/ghost/pages/GhostGatewayPage"));
const GhostBlockPage = lazy(() => import("@/features/ghost/pages/GhostBlockPage"));
const GhostRoomPage = lazy(() => import("@/features/ghost/pages/GhostRoomPage"));
const TeddyRoomPage = lazy(() => import("@/features/teddy/pages/TeddyRoomPage"));
const WelcomePage = lazy(() => import("@/features/onboarding/pages/WelcomePage"));

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
        <Route path="/home" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><HomePage /></Suspense></ProtectedRoute>} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/profile/:id" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><HomePage /></Suspense></ProtectedRoute>} />
        <Route path="/reset-password" element={<AuthPage />} />
        <Route path="/payment-success" element={<AuthPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense></ProtectedRoute>} />
        <Route path="/faq" element={<Suspense fallback={<LoadingFallback />}><FaqPage /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<LoadingFallback />}><TermsPage /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<LoadingFallback />}><PrivacyPage /></Suspense>} />
        <Route path="/map" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><MapPage /></Suspense></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><AdminPage /></Suspense></ProtectedRoute>} />
        <Route path="/admin/whatsapp-leads" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><WhatsAppCollection /></Suspense></ProtectedRoute>} />
        <Route path="/admin/whatsapp-collection" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><WhatsAppCollection /></Suspense></ProtectedRoute>} />
        <Route path="/admin/whatsapp-directory" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><WhatsAppDirectory /></Suspense></ProtectedRoute>} />
        <Route path="/admin/security" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><SecurityDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/admin/ultimate-security" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><UltimateSecurityDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/admin/world-map" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><WorldMapDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/ghost" element={<Suspense fallback={<LoadingFallback />}><GhostModePage /></Suspense>} />
        <Route path="/ghost/setup" element={<Suspense fallback={<LoadingFallback />}><GhostSetupPage /></Suspense>} />
        <Route path="/ghost/auth" element={<Suspense fallback={<LoadingFallback />}><GhostAuthPage /></Suspense>} />
        <Route path="/ghost/pricing" element={<Suspense fallback={<LoadingFallback />}><GhostPricingPage /></Suspense>} />
        <Route path="/ghost/mock" element={<Suspense fallback={<LoadingFallback />}><GhostGatewayPage /></Suspense>} />
        <Route path="/ghost/block" element={<Suspense fallback={<LoadingFallback />}><GhostBlockPage /></Suspense>} />
        <Route path="/ghost/room" element={<Suspense fallback={<LoadingFallback />}><GhostRoomPage /></Suspense>} />
        <Route path="/teddy" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><TeddyRoomPage /></Suspense></ProtectedRoute>} />
        <Route path="/welcome" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><WelcomePage /></Suspense></ProtectedRoute>} />
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
