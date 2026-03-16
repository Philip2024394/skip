import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "./pages/AuthPage";
import Index from "./pages/Index";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingFallback from "./components/LoadingFallback";

// Lazy load admin components to reduce initial bundle size
const WhatsAppCollection = lazy(() => import("@/pages/admin/WhatsAppCollection"));
const WhatsAppDirectory = lazy(() => import("@/components/admin/WhatsAppDirectory"));
const SecurityDashboard = lazy(() => import("@/components/admin/SecurityDashboard"));
const UltimateSecurityDashboard = lazy(() => import("@/components/admin/UltimateSecurityDashboard"));
const AdGenerationDashboard = lazy(() => import("@/components/admin/AdGenerationDashboard"));
const EnhancedAdGenerationDashboard = lazy(() => import("@/components/admin/EnhancedAdGenerationDashboard"));
const LibraryAdGenerationDashboard = lazy(() => import("@/components/admin/LibraryAdGenerationDashboard"));
const AdPerformanceDashboard = lazy(() => import("@/components/admin/AdPerformanceDashboard"));
const WorldMapDashboard = lazy(() => import("./pages/admin/WorldMapDashboard"));

const queryClient = new QueryClient();

const AppContent = () => {
  useEffect(() => {
    // Check if user is already logged in and redirect to auth if needed
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // User is logged in, but we want to keep them on landing page for WhatsApp collection
        console.log("User session found, keeping on landing page");
      }
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/home" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/profile/:id" element={<AuthPage />} />
        <Route path="/reset-password" element={<AuthPage />} />
        <Route path="/payment-success" element={<AuthPage />} />
        <Route path="/dashboard" element={<AuthPage />} />
        <Route path="/admin" element={<AuthPage />} />
        <Route path="/admin/whatsapp-collection" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><WhatsAppCollection /></Suspense></ProtectedRoute>} />
        <Route path="/admin/whatsapp-directory" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><WhatsAppDirectory /></Suspense></ProtectedRoute>} />
        <Route path="/admin/security" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><SecurityDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/admin/ultimate-security" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><UltimateSecurityDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/admin/ad-generation" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><AdGenerationDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/admin/enhanced-ad-generation" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><EnhancedAdGenerationDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/admin/library-ad-generation" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><LibraryAdGenerationDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/admin/ad-performance" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><AdPerformanceDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/admin/world-map" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><WorldMapDashboard /></Suspense></ProtectedRoute>} />
        <Route path="*" element={<AuthPage />} />
      </Routes>
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
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
