import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FlaggedProfileGate from "@/features/auth/components/FlaggedProfileGate";

export default function PhotoGatePage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/", { replace: true }); return; }
      const { data } = await (supabase.from("profiles").select("photo_flagged, flag_reason") as any)
        .eq("id", session.user.id).maybeSingle();
      // If not actually flagged anymore, let them through
      if (!data?.photo_flagged) { navigate("/home", { replace: true }); return; }
      setUserId(session.user.id);
      setFlagReason(data?.flag_reason ?? null);
      setChecking(false);
    });
  }, [navigate]);

  if (checking || !userId) return (
    <div style={{ position: "fixed", inset: 0, background: "#0c0c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid rgba(236,72,153,0.3)", borderTopColor: "#ec4899", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <FlaggedProfileGate
      userId={userId}
      flagReason={flagReason}
      onCleared={() => navigate("/home", { replace: true })}
    />
  );
}
