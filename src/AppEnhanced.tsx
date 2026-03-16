import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import WhatsAppDirectory from "@/components/admin/WhatsAppDirectory";
import SecurityDashboard from "@/components/admin/SecurityDashboard";
import UltimateSecurityDashboard from "@/components/admin/UltimateSecurityDashboard";
import WorldMapDashboard from "./pages/admin/WorldMapDashboard";
import DevelopmentErrorBoundary from "./components/DevelopmentErrorBoundary";

// Lazy load heavy admin dashboards to prevent dev startup issues
const AdGenerationDashboard = lazy(() => 
  import("./components/admin/AdGenerationDashboard").catch(err => {
    console.warn('⚠️ Failed to load AdGenerationDashboard:', err);
    return { default: () => React.createElement('div', null, 'Ad Generation Dashboard unavailable') };
  })
);

const EnhancedAdGenerationDashboard = lazy(() => 
  import("./components/admin/EnhancedAdGenerationDashboard").catch(err => {
    console.warn('⚠️ Failed to load EnhancedAdGenerationDashboard:', err);
    return { default: () => React.createElement('div', null, 'Enhanced Ad Generation Dashboard unavailable') };
  })
);

const LibraryAdGenerationDashboard = lazy(() => 
  import("./components/admin/LibraryAdGenerationDashboard").catch(err => {
    console.warn('⚠️ Failed to load LibraryAdGenerationDashboard:', err);
    return { default: () => React.createElement('div', null, 'Library Ad Generation Dashboard unavailable') };
  })
);

const AdPerformanceDashboard = lazy(() => 
  import("./components/admin/AdPerformanceDashboard").catch(err => {
    console.warn('⚠️ Failed to load AdPerformanceDashboard:', err);
    return { default: () => React.createElement('div', null, 'Ad Performance Dashboard unavailable') };
  })
);

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
      <div className="text-white/70">Loading dashboard...</div>
    </div>
  </div>
);

// Error fallback component
const ErrorFallback = ({ error, resetError }) => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
    <div className="max-w-md w-full bg-red-900/20 border border-red-500/30 rounded-lg p-6">
      <h2 className="text-xl font-bold text-red-400 mb-4">🚨 Dashboard Loading Error</h2>
      <details className="mb-4">
        <summary className="cursor-pointer text-white/70">Error Details</summary>
        <pre className="mt-2 text-xs text-red-300 overflow-auto">
          {error?.message || 'Unknown error'}
        </pre>
      </details>
      <button 
        onClick={resetError}
        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  useEffect(() => {
    // Check if user is already logged in and redirect to auth if needed
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // User is logged in, but we want to keep them on landing page for WhatsApp collection
        console.log("User session found, keeping on landing page");
      }
    });

    // Setup global error handling
    const handleError = (event) => {
      console.error('🚨 Global error caught:', event.error);
      
      // Log to development logs if available
      if (typeof window !== 'undefined' && window.devLogger) {
        window.devLogger.log('ERROR', 'Global error caught', event.error);
      }
    };

    const handleUnhandledRejection = (event) => {
      console.error('🚨 Unhandled promise rejection:', event.reason);
      
      if (typeof window !== 'undefined' && window.devLogger) {
        window.devLogger.log('ERROR', 'Unhandled promise rejection', event.reason);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
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
        
        {/* Light admin dashboards - loaded normally */}
        <Route path="/admin/whatsapp-directory" element={<ProtectedRoute><WhatsAppDirectory /></ProtectedRoute>} />
        <Route path="/admin/security" element={<ProtectedRoute><SecurityDashboard /></ProtectedRoute>} />
        <Route path="/admin/ultimate-security" element={<ProtectedRoute><UltimateSecurityDashboard /></ProtectedRoute>} />
        <Route path="/admin/world-map" element={<ProtectedRoute><WorldMapDashboard /></ProtectedRoute>} />
        
        {/* Heavy admin dashboards - lazy loaded with error boundaries */}
        <Route 
          path="/admin/ad-generation" 
          element={
            <ProtectedRoute>
              <DevelopmentErrorBoundary fallback={<ErrorFallback />}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdGenerationDashboard />
                </Suspense>
              </DevelopmentErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/enhanced-ad-generation" 
          element={
            <ProtectedRoute>
              <DevelopmentErrorBoundary fallback={<ErrorFallback />}>
                <Suspense fallback={<LoadingFallback />}>
                  <EnhancedAdGenerationDashboard />
                </Suspense>
              </DevelopmentErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/library-ad-generation" 
          element={
            <ProtectedRoute>
              <DevelopmentErrorBoundary fallback={<ErrorFallback />}>
                <Suspense fallback={<LoadingFallback />}>
                  <LibraryAdGenerationDashboard />
                </Suspense>
              </DevelopmentErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/ad-performance" 
          element={
            <ProtectedRoute>
              <DevelopmentErrorBoundary fallback={<ErrorFallback />}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdPerformanceDashboard />
                </Suspense>
              </DevelopmentErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <DevelopmentErrorBoundary fallback={
          <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-red-900/20 border border-red-500/30 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-400 mb-4">🚨 Application Error</h2>
              <p className="text-white/70 mb-4">The application encountered an error. Please refresh the page.</p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        }>
          <AppContent />
        </DevelopmentErrorBoundary>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
