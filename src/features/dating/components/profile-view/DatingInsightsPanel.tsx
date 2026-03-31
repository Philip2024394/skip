import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const COST = 40;

interface Insight {
  icon: string;
  label: string;
  sub: string;
}

function computeInsights(profile: any): Insight[] {
  const insights: Insight[] = [];

  // 1. Activity / reply pattern — derived from last_active
  const lastActive = profile?.last_active || profile?.updated_at;
  if (lastActive) {
    const daysSince = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 1) {
      insights.push({ icon: "💬", label: "Replies often", sub: "Usually responds within hours" });
    } else if (daysSince < 4) {
      insights.push({ icon: "💬", label: "Active replier", sub: "Responds within a few days" });
    } else {
      insights.push({ icon: "💬", label: "Takes time to reply", sub: "May take several days to respond" });
    }
  }

  // 2. Dating intention from relationship_goals
  const intent = (profile?.relationship_goals?.looking_for || "").toLowerCase();
  if (intent.includes("serious") || intent.includes("long") || intent.includes("marriage") || intent.includes("commit")) {
    insights.push({ icon: "❤️", label: "Serious dater", sub: "Looking for something real and lasting" });
  } else if (intent.includes("casual") || intent.includes("fun") || intent.includes("friend")) {
    insights.push({ icon: "🌿", label: "Casual dating", sub: "Keeping things light and fun" });
  } else if (intent) {
    insights.push({ icon: "✨", label: "Open minded", sub: "Seeing where connections naturally lead" });
  }

  // 3. Profile depth
  const depthScore = [
    profile?.bio,
    profile?.basic_info?.occupation,
    profile?.lifestyle_info?.hobbies,
    (profile?.images || profile?.photos || []).length > 1,
    profile?.relationship_goals?.about_partner,
    profile?.first_date_idea,
  ].filter(Boolean).length;

  if (depthScore >= 4) {
    insights.push({ icon: "✍️", label: "Detailed profile", sub: "Invested in sharing who they are" });
  } else if (depthScore >= 2) {
    insights.push({ icon: "📝", label: "Solid profile", sub: "Shared the essentials" });
  }

  // 4. Time on app
  const createdAt = profile?.created_at;
  if (createdAt) {
    const monthsOn = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsOn >= 3) {
      insights.push({ icon: "🏅", label: "Established member", sub: `${Math.floor(monthsOn)}+ months on 2DateMe` });
    } else if (monthsOn < 0.5) {
      insights.push({ icon: "🌟", label: "New to 2DateMe", sub: "Recently joined the community" });
    }
  }

  // 5. Verified
  if (profile?.is_verified) {
    insights.push({ icon: "✅", label: "Verified member", sub: "Identity confirmed by 2DateMe" });
  }

  // 6. Active this week (only if not already added as "Replies often")
  if (lastActive && !insights.find(i => i.label === "Replies often")) {
    const daysSince = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) {
      insights.push({ icon: "🟢", label: "Active this week", sub: "Recently seen on the app" });
    }
  }

  return insights.slice(0, 5);
}

interface DatingInsightsPanelProps {
  profile: any;
  currentUserId: string;
  coinBalance: number;
  deductCoins: (amount: number, reason: string) => Promise<boolean>;
  isConnected?: boolean;
}

type Status = "idle" | "loading" | "unlocked" | "mutual_free";

export default function DatingInsightsPanel({
  profile,
  currentUserId,
  coinBalance,
  deductCoins,
  isConnected = true,
}: DatingInsightsPanelProps) {
  const [status, setStatus] = useState<Status>("idle");
  const subjectId = profile?.id;

  // On mount: check supabase for existing unlock or mutual unlock
  useEffect(() => {
    if (!currentUserId || !subjectId || currentUserId === subjectId) return;

    (async () => {
      // A already paid for B's insights?
      const { data: bought } = await (supabase as any)
        .from("insight_unlocks")
        .select("id")
        .eq("buyer_id", currentUserId)
        .eq("subject_id", subjectId)
        .maybeSingle();

      if (bought) { setStatus("unlocked"); return; }

      // B already paid for A's insights? (mutual — A gets B's for free)
      const { data: mutual } = await (supabase as any)
        .from("insight_unlocks")
        .select("id")
        .eq("buyer_id", subjectId)
        .eq("subject_id", currentUserId)
        .maybeSingle();

      if (mutual) { setStatus("mutual_free"); }
    })();
  }, [currentUserId, subjectId]);

  if (!isConnected || !subjectId || currentUserId === subjectId) return null;

  const insights = computeInsights(profile);
  const isUnlocked = status === "unlocked" || status === "mutual_free";
  const firstName = profile?.name?.split(" ")[0] || profile?.first_name || "them";

  const handleUnlock = async () => {
    if (status === "loading" || coinBalance < COST) return;
    setStatus("loading");

    const ok = await deductCoins(COST, "dating_insights");
    if (!ok) { setStatus("idle"); return; }

    // Record the unlock
    await (supabase as any)
      .from("insight_unlocks")
      .upsert(
        { buyer_id: currentUserId, subject_id: subjectId },
        { onConflict: "buyer_id,subject_id" }
      );

    // Notify subject B — they now get A's insights for free (non-blocking)
    (supabase as any)
      .from("notifications")
      .insert({
        user_id: subjectId,
        type: "insights_unlocked",
        title: "Someone unlocked your Dating Insights 🔍",
        body: "View their profile to see their insights — it's free for you.",
        data: { from_user_id: currentUserId },
      })
      .then(() => {});

    setStatus("unlocked");
  };

  const pillStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    background: "rgba(236,72,153,0.12)",
    border: "1px solid rgba(236,72,153,0.25)",
    borderRadius: 20,
    padding: "4px 10px",
    color: "rgba(255,255,255,0.7)",
    whiteSpace: "nowrap" as const,
  };

  return (
    <div style={{ marginTop: 8 }}>
      {/* Section header */}
      <div style={{
        margin: "6px 0 10px",
        paddingBottom: 6,
        borderBottom: "1.5px solid rgba(236,72,153,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13 }}>🔍</span>
          <p style={{
            color: "rgba(236,72,153,1)",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            margin: 0,
          }}>Dating Insights</p>
        </div>
        {status === "mutual_free" && (
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            color: "rgba(236,72,153,0.9)",
            background: "rgba(236,72,153,0.12)",
            border: "1px solid rgba(236,72,153,0.3)",
            borderRadius: 8,
            padding: "3px 8px",
            letterSpacing: "0.04em",
          }}>🎁 Free for you</span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          /* ── LOCKED ── */
          <motion.div
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1.5px solid rgba(236,72,153,0.18)",
              borderRadius: 14,
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
            <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>
              Unlock {firstName}'s Dating Insights
            </p>
            <p style={{ color: "rgba(255,255,255,0.42)", fontSize: 11, margin: "0 0 14px", lineHeight: 1.5 }}>
              See how {firstName} behaves on 2DateMe — reply style, dating intentions,
              activity level & more.
            </p>

            {/* Blurred preview pills */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              justifyContent: "center",
              marginBottom: 16,
              filter: "blur(4px)",
              opacity: 0.45,
              pointerEvents: "none",
              userSelect: "none",
            }}>
              {["💬 Replies often", "❤️ Serious dater", "✍️ Detailed profile", "🟢 Active this week"].map(l => (
                <span key={l} style={pillStyle}>{l}</span>
              ))}
            </div>

            <button
              onClick={handleUnlock}
              disabled={status === "loading" || coinBalance < COST}
              style={{
                background: status === "loading"
                  ? "rgba(255,255,255,0.1)"
                  : coinBalance >= COST
                  ? "linear-gradient(135deg, rgba(236,72,153,0.9) 0%, rgba(168,85,247,0.85) 100%)"
                  : "rgba(255,255,255,0.07)",
                border: "none",
                borderRadius: 22,
                padding: "10px 26px",
                color: coinBalance >= COST ? "white" : "rgba(255,255,255,0.28)",
                fontSize: 13,
                fontWeight: 700,
                cursor: status === "loading" || coinBalance < COST ? "not-allowed" : "pointer",
                letterSpacing: "0.02em",
                transition: "opacity 0.2s",
                boxShadow: coinBalance >= COST ? "0 4px 16px rgba(236,72,153,0.3)" : "none",
              }}
            >
              {status === "loading"
                ? "Unlocking…"
                : coinBalance >= COST
                ? `🔓 Unlock for ${COST} coins`
                : `Not enough coins — need ${COST}`}
            </button>

            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, marginTop: 10, lineHeight: 1.5 }}>
              When you unlock, {firstName} can view your insights for free ✨
            </p>
          </motion.div>
        ) : (
          /* ── UNLOCKED ── */
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {status === "mutual_free" && (
              <p style={{
                color: "rgba(255,255,255,0.38)",
                fontSize: 10,
                marginBottom: 10,
                fontStyle: "italic",
                lineHeight: 1.5,
              }}>
                {firstName} unlocked your insights — you're seeing theirs for free ✨
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {insights.map((insight, i) => (
                <motion.div
                  key={insight.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.28 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(236,72,153,0.07)",
                    border: "1px solid rgba(236,72,153,0.18)",
                    borderRadius: 12,
                    padding: "9px 12px",
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{insight.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                      {insight.label}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.42)", marginTop: 1 }}>
                      {insight.sub}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
