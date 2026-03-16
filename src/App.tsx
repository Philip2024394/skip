import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import WhatsAppDirectory from "@/components/admin/WhatsAppDirectory";
import SecurityDashboard from "@/components/admin/SecurityDashboard";
import UltimateSecurityDashboard from "@/components/admin/UltimateSecurityDashboard";
import AdGenerationDashboard from "@/components/admin/AdGenerationDashboard";
import EnhancedAdGenerationDashboard from "@/components/admin/EnhancedAdGenerationDashboard";
import LibraryAdGenerationDashboard from "@/components/admin/LibraryAdGenerationDashboard";

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
        <Route path="/admin/whatsapp-directory" element={<ProtectedRoute><WhatsAppDirectory /></ProtectedRoute>} />
        <Route path="/admin/security" element={<ProtectedRoute><SecurityDashboard /></ProtectedRoute>} />
        <Route path="/admin/ultimate-security" element={<ProtectedRoute><UltimateSecurityDashboard /></ProtectedRoute>} />
        <Route path="/admin/ad-generation" element={<ProtectedRoute><AdGenerationDashboard /></ProtectedRoute>} />
        <Route path="/admin/enhanced-ad-generation" element={<ProtectedRoute><EnhancedAdGenerationDashboard /></ProtectedRoute>} />
        <Route path="/admin/library-ad-generation" element={<ProtectedRoute><LibraryAdGenerationDashboard /></ProtectedRoute>} />
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
