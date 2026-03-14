import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLogo from "./AppLogo";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // In dev mode, bypass auth check so dashboard/admin work with placeholder credentials
    if (import.meta.env.DEV) {
      setAuthenticated(true);
      setLoading(false);
      return;
    }
    // Check existing session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
      setLoading(false);
    });

    // Keep in sync if the session changes (e.g. sign-in completes mid-render)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <AppLogo
        className="w-20 h-20 object-contain"
        style={{ filter: "drop-shadow(0 0 20px rgba(220,80,150,0.6))" }}
      />
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

  if (!authenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
