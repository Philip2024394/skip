// APP.TSX UPDATES - Add missing world map route
// Copy and paste these updates to your App.tsx file

// STEP 1: Add WorldMapDashboard import at the top

// STEP 2: Add world map route in the Routes section
// Add this line inside the <Routes> section, around line 50:
<Route path="/admin/world-map" element={<ProtectedRoute><WorldMapDashboard /></ProtectedRoute>} />

// COMPLETE UPDATED APP.TSX SECTIONS:

// Imports section (add this import):
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import WhatsAppDirectory from "@/components/admin/WhatsAppDirectory";
import SecurityDashboard from "@/components/admin/SecurityDashboard";
import UltimateSecurityDashboard from "@/components/admin/UltimateSecurityDashboard";
import AdGenerationDashboard from "@/components/admin/AdGenerationDashboard";
import EnhancedAdGenerationDashboard from "@/components/admin/EnhancedAdGenerationDashboard";
import LibraryAdGenerationDashboard from "@/components/admin/LibraryAdGenerationDashboard";
import AdPerformanceDashboard from "@/components/admin/AdPerformanceDashboard";

// Routes section (add this route):
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
  <Route path="/admin/ad-performance" element={<ProtectedRoute><AdPerformanceDashboard /></ProtectedRoute>} />
  <Route path="/admin/world-map" element={<ProtectedRoute><WorldMapDashboard /></ProtectedRoute>} />  // ADD THIS LINE
  <Route path="*" element={<AuthPage />} />
</Routes>
