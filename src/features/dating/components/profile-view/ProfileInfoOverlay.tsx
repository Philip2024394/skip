import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getPrimaryBadgeKey } from "@/shared/utils/profileBadges";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import { useBlockUser } from "@/shared/hooks/useBlockUser";

import { calcValuesMatch } from "@/shared/utils/valuesQuiz";
import { QUESTION_TEMPLATES } from "@/features/dating/data/profileQuestions";
import type { QuestionTemplate } from "@/features/dating/data/profileQuestions";
// import VirtualGiftsDisplay from "@/components/gifts/VirtualGiftsDisplay";

interface ProfileInfoPanelProps {
  profile: any;
  onClose: () => void;
  currentUserQuiz?: Record<string, unknown> | null;
  allProfiles?: any[];
  onBestieRequest?: (profile: any) => void;
  isBestie?: boolean;
  isBestiePending?: boolean;
  onSendRealGift?: () => void;
  onAskQuestion?: (template: QuestionTemplate) => void;
  askedStates?: Record<string, "pending" | "answered">;
  answeredValues?: Record<string, string>;
  coinBalance?: number;
  onBlock?: () => void;
}

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value?: string }) =>
  value ? (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
      <span style={{ fontSize: 14, width: 22, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 11, color: "rgba(236,72,153,0.9)", fontWeight: 600, minWidth: 60, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "white", fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{value.replace(/🧑‍🍳/g, '').replace(/🎨/g, '').replace(/🐱/g, '').replace(/🦉/g, '').trim()}</span>
    </div>
  ) : null;

const SectionTitle = ({ title }: { title: string }) => (
  <p style={{
    color: "rgba(236,72,153,0.9)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    margin: "10px 0 4px 0",
    borderBottom: "1px solid rgba(236,72,153,0.4)",
    paddingBottom: 4,
  }}>{title}</p>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div style={{
    margin: "14px 0 6px 0",
    paddingBottom: 6,
    borderBottom: "1.5px solid rgba(236,72,153,0.6)",
  }}>
    <p style={{
      color: "rgba(236,72,153,1)",
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      margin: 0,
    }}>{title}</p>
  </div>
);

const MatchRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
    <span style={{ fontSize: 16, width: 28, textAlign: "center", flexShrink: 0 }}>{icon}</span>
    <span style={{ fontSize: 11, color: "rgba(236,72,153,0.9)", fontWeight: 600, minWidth: 80, flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 13, color: "white", fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{value}</span>
  </div>
);

const CompatibilityBar = ({ percent, insight }: { percent: number; insight: string }) => (
  <div style={{ marginTop: 4 }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 28, fontWeight: 900, color: "white", lineHeight: 1 }}>{percent}%</span>
      <span style={{ fontSize: 10, color: "rgba(236,72,153,0.8)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Compatible</span>
    </div>
    <div style={{
      width: "100%", height: 6, borderRadius: 3,
      background: "rgba(255,255,255,0.08)",
      overflow: "hidden",
    }}>
      <div style={{
        width: `${percent}%`, height: "100%", borderRadius: 3,
        background: "linear-gradient(90deg, rgba(236,72,153,0.9), rgba(255,182,193,0.8), rgba(255,105,180,0.9))",
      }} />
    </div>
    <p style={{
      fontSize: 10,
      color: "rgba(236,72,153,0.7)",
      fontWeight: 600,
      fontStyle: "italic",
      margin: "4px 0 0 0",
      textAlign: "center"
    }}>
      {insight}
    </p>
  </div>
);

const BADGE_INFO: Record<string, { icon: string; label: string; meaning: string; tip: string }> = {
  is_visiting: {
    icon: "✈️",
    label: "Travel Badge",
    meaning: "This person is visiting your city and set this badge so locals know they're here. They could be passing through, just arrived, or staying for a short time. A great chance to connect with someone new in town.",
    tip: "Offer to show them around — perfect ice breaker!",
  },
  available_tonight: {
    icon: "🌙",
    label: "Free Tonight",
    meaning: "This person has nothing planned tonight and is actively open to meeting up. They set this badge to signal they are available right now — not tomorrow, tonight. The badge auto-clears at midnight.",
    tip: "Message now — they're actively free tonight.",
  },
  is_plusone: {
    icon: "✚",
    label: "+1 Plus One",
    meaning: "This person is looking for someone to come with them as a plus one. It could be a dinner, event, gathering, or outing. They are open to freely accommodating you as a close friend — no strings attached, just good company.",
    tip: "Ask what the event is — easy conversation starter!",
  },
  generous_lifestyle: {
    icon: "🎁",
    label: "Generous",
    meaning: "This person has a generous approach and genuinely enjoys treating others. They appreciate quality experiences and like going the extra mile to make someone feel special. They value giving as much as connection.",
    tip: "Share what experiences you enjoy most.",
  },
  weekend_plans: {
    icon: "📅",
    label: "Weekend Plans",
    meaning: "This person is actively planning something for the weekend and is open to having someone join. They are not waiting around — they want to make plans now and include the right person in their weekend.",
    tip: "Suggest a weekend activity — they're ready to go!",
  },
  late_night_chat: {
    icon: "🌙",
    label: "Late Night",
    meaning: "This person is a night owl and comes alive after dark. They are most active, social and engaged during late hours. If you enjoy deep late-night conversations or spontaneous night plans, this is your match.",
    tip: "Message late evening for the best response.",
  },
  no_drama: {
    icon: "✨",
    label: "No Drama",
    meaning: "This person values peace, honesty and straightforward communication. They are not interested in games or complications — just a real, calm and genuine connection with someone who means what they say.",
    tip: "Be direct and genuine — they'll appreciate it.",
  },
};

const RELATIONSHIP_INSIGHTS = [
  "Similar Energy Matters",
  "Opposites Can Attract",
  "Common Ground Wins",
  "Shared Values First",
  "Chemistry Beats Math",
  "Timing Is Everything",
  "Small Things Matter",
  "Balance Feels Right",
  "Kindness Over Perfection",
  "Vibes Tell The Truth",
  "Effort Speaks Loud",
  "Curiosity Is Attractive",
  "Humor Helps A Lot",
  "Respect Is Essential",
  "Honesty Feels Safe",
  "Growth Beats Comfort",
  "Passion Sparks Magic",
  "Listening Builds Bonds",
  "Trust Builds Slowly",
  "Playfulness Is Powerful",
  "Depth Over Surface",
  "Calm Over Chaos",
  "Loyalty Feels Rare",
  "Adventure Is Welcome",
  "Patience Shows Care",
  "Simplicity Feels Good",
  "Confidence Is Magnetic",
  "Warmth Feels Home",
  "Friendship Comes First",
  "Understanding Matters Most",
  "Communication Changes Everything",
  "Effort Creates Connection",
  "Similar Dreams Help",
  "Differences Teach Us",
  "Support Feels Powerful",
  "Presence Beats Promises",
  "Real Beats Perfect",
  "Energy Must Match",
  "Curiosity Keeps Interest",
  "Time Reveals Truth",
  "Authenticity Wins Always",
  "Actions Show Intent",
  "Hearts Need Safety",
  "Attraction Needs Depth",
  "Good Talks Matter",
  "Shared Laughs Connect",
  "Comfort Builds Love",
  "Values Shape Futures",
  "Honesty Builds Trust",
  "Genuine Feels Right"
];

function computeMatchStats(profile: any, currentUserQuiz?: Record<string, unknown> | null) {
  const id = profile?.id || "";
  // Deterministic seed from profile id
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = ((seed << 5) - seed + id.charCodeAt(i)) | 0;
  seed = Math.abs(seed);

  // Use real values quiz score if both sides answered
  const quizScore = calcValuesMatch(currentUserQuiz as any, profile?.relationship_goals);
  const compatibility = quizScore !== null ? quizScore : 65 + (seed % 30); // real or 65-94%
  const hasRealQuiz = quizScore !== null;
  const distanceKm = 1 + (seed % 18); // 1-18 km
  const sharedInterests = 2 + (seed % 5); // 2-6

  const basicInfo = profile?.basic_info || {};

  const timeSlots = ["Both active mornings", "Both active evenings", "Both active afternoons", "Both night owls"];
  const activeTime = timeSlots[seed % timeSlots.length];

  const langs = basicInfo.languages || [];
  const langMatch = langs.length > 0 ? langs[0] : "English";

  const insight = RELATIONSHIP_INSIGHTS[seed % RELATIONSHIP_INSIGHTS.length];

  return { compatibility, distanceKm, sharedInterests, activeTime, langMatch, insight, hasRealQuiz };
}

// ── Shy fields section ────────────────────────────────────────────────────────
function ShyFieldsSection({
  profile,
  onAskQuestion,
  askedStates,
  answeredValues,
  coinBalance,
}: {
  profile: any;
  onAskQuestion?: (t: QuestionTemplate) => void;
  askedStates: Record<string, "pending" | "answered">;
  answeredValues: Record<string, string>;
  coinBalance: number;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);

  const emptyTemplates = QUESTION_TEMPLATES.filter(t => !t.getValue(profile));
  if (emptyTemplates.length === 0) return null;

  const firstName = profile?.name ? profile.name.split(" ")[0] : "her";

  return (
    <>
      <div style={{
        margin: "14px 0 6px",
        paddingBottom: 6,
        borderBottom: "1.5px solid rgba(236,72,153,0.6)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <p style={{
          color: "rgba(236,72,153,1)",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          margin: 0,
        }}>Unlock {firstName}'s Story</p>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>• {emptyTemplates.length} questions available</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 6 }}>
        {emptyTemplates.map((t) => {
          const state = askedStates[t.id];
          const answer = answeredValues[t.id];
          const isConfirming = confirming === t.id;

          return (
            <div
              key={t.id}
              style={{
                background: state === "answered"
                  ? "rgba(168,85,247,0.08)"
                  : "rgba(236,72,153,0.06)",
                border: `1px solid ${state === "answered" ? "rgba(168,85,247,0.25)" : "rgba(236,72,153,0.15)"}`,
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: state === "answered" ? 6 : 4 }}>
                <span style={{ fontSize: 16 }}>{t.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{t.fieldLabel}</span>
                {state === "pending" && (
                  <span style={{
                    marginLeft: "auto",
                    fontSize: 9,
                    fontWeight: 700,
                    color: "rgba(236,72,153,0.7)",
                    background: "rgba(236,72,153,0.1)",
                    border: "1px solid rgba(236,72,153,0.2)",
                    borderRadius: 6,
                    padding: "2px 6px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}>Waiting...</span>
                )}
              </div>

              {state === "answered" && answer ? (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: 600,
                    padding: "6px 0 2px",
                    borderTop: "1px solid rgba(168,85,247,0.15)",
                  }}
                >
                  {answer}
                </motion.div>
              ) : state === "pending" ? (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, fontStyle: "italic" }}>
                  Waiting for {firstName}'s answer 💭
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 8px", fontStyle: "italic" }}>
                    {t.shyMessage} 🌸
                  </p>
                  {isConfirming ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => {
                          setConfirming(null);
                          onAskQuestion?.(t);
                        }}
                        disabled={coinBalance < t.coinCost}
                        style={{
                          flex: 1,
                          padding: "7px 0",
                          borderRadius: 8,
                          border: "none",
                          cursor: coinBalance >= t.coinCost ? "pointer" : "not-allowed",
                          background: coinBalance >= t.coinCost
                            ? "linear-gradient(135deg, #ec4899, #a855f7)"
                            : "rgba(255,255,255,0.08)",
                          color: coinBalance >= t.coinCost ? "white" : "rgba(255,255,255,0.3)",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {coinBalance >= t.coinCost ? `Spend ${t.coinCost} coins ✓` : "Not enough coins"}
                      </button>
                      <button
                        onClick={() => setConfirming(null)}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "transparent",
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirming(t.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(236,72,153,0.3)",
                        background: "rgba(236,72,153,0.1)",
                        color: "rgba(244,114,182,0.9)",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <span>💰</span>
                      <span>Ask for {t.coinCost} coins</span>
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileInfoPanel({ profile, onClose: _onClose, currentUserQuiz, allProfiles = [], onBestieRequest, isBestie = false, isBestiePending = false, onSendRealGift, onAskQuestion, askedStates = {}, answeredValues = {}, coinBalance = 0, onBlock }: ProfileInfoPanelProps) {
  const navigate = useNavigate();
  const basicInfo = profile?.basic_info || {};
  const lifestyleInfo = profile?.lifestyle_info || {};
  const relationshipGoals = profile?.relationship_goals || {};
  const matchStats = computeMatchStats(profile, currentUserQuiz);
  const badgeKey = getPrimaryBadgeKey(profile);
  const badgeInfo = badgeKey ? BADGE_INFO[badgeKey] : null;

  const profileName = profile?.name || profile?.full_name || profile?.first_name || "Profile";

  // Bestie review state
  const lsReviewKey = `bestie_review_written_for_${profile?.id}`;
  const [reviewDraft, setReviewDraft] = useState<string>(() => {
    try { return localStorage.getItem(lsReviewKey) || ""; } catch { return ""; }
  });
  const [reviewEditing, setReviewEditing] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const validateReview = (text: string): string => {
    if (!text.trim()) return "Review cannot be empty";
    if (text.length > 350) return `Too long — ${text.length}/350 characters`;
    if (/[0-9]/.test(text)) return "No numbers or digits allowed";
    if (/https?:\/\/|www\.|@\w+|\.(com|net|org|io|co)\b/i.test(text)) return "No social links or handles allowed";
    return "";
  };

  const saveReview = () => {
    const err = validateReview(reviewDraft);
    if (err) { setReviewError(err); return; }
    try { localStorage.setItem(lsReviewKey, reviewDraft.trim()); } catch {}
    setReviewEditing(false);
    setReviewError("");
  };

  const { blockUser, blocking } = useBlockUser();
  const [confirmBlock, setConfirmBlock] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-2xl overflow-hidden min-h-0 flex flex-col bg-black/70 backdrop-blur-xl border-2 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-white/5"
      style={{
        backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/vip%20jhh33.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "rgba(236,72,153,0.7)"
      }}
    >
      {/* Virtual Gifts Display */}
      {/* <VirtualGiftsDisplay userId={profile?.id} /> */}

      {/* Header */}
      <div style={{
        padding: "12px 16px 8px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        {/* Round profile image — always shown */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            overflow: "hidden",
            border: "2.5px solid rgba(236,72,153,0.7)",
            boxShadow: "0 0 12px rgba(236,72,153,0.35)",
          }}>
            <img
              src={profile?.avatar_url || profile?.image || "/placeholder.svg"}
              alt={profileName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
          </div>
          {isOnline(profile?.last_seen_at) && (
            <span style={{
              position: "absolute", bottom: 1, right: 1,
              width: 11, height: 11, borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 6px rgba(34,197,94,0.8)",
              animation: "heartbeat 1.4s ease-in-out infinite",
            }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "white", fontSize: 16, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {profileName}, {profile?.age}
            {profile?.video_verified && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: "rgba(125,211,252,1)",
                background: "rgba(14,165,233,0.2)", border: "1px solid rgba(14,165,233,0.35)",
                borderRadius: 20, padding: "2px 6px", letterSpacing: "0.04em", lineHeight: 1.4,
              }}>🎥 Verified</span>
            )}
          </p>
          <p style={{ color: "rgba(236,72,153,0.8)", fontSize: 12, fontWeight: 600, margin: "2px 0 0 0" }}>
            {profile?.city ? `${profile.city}, ` : ""}{profile?.country || "Indonesia"}
          </p>
        </div>
        {/* Bestie button — top-right of header */}
        {onBestieRequest && !isBestie && (
          isBestiePending ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
              <img
                src="https://ik.imagekit.io/7grri5v7d/bestiii-removebg-preview-removebg-preview.png"
                alt="Bestie"
                style={{ width: 52, height: 52, objectFit: "contain", opacity: 0.35 }}
              />
              <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>Sent</span>
            </div>
          ) : (
            <button
              onClick={() => onBestieRequest(profile)}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}
            >
              <img
                src="https://ik.imagekit.io/7grri5v7d/bestiii-removebg-preview-removebg-preview.png"
                alt="Add Bestie"
                style={{
                  width: 52, height: 52, objectFit: "contain",
                  filter: "drop-shadow(0 0 6px rgba(232,72,199,0.85)) drop-shadow(0 0 12px rgba(232,72,199,0.5))",
                  animation: "bestieGlow 1.6s ease-in-out infinite",
                }}
              />
              <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(232,72,199,0.85)", letterSpacing: "0.04em" }}>
                Add Bestie
              </span>
            </button>
          )
        )}
        {isBestie && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
            <img
              src="https://ik.imagekit.io/7grri5v7d/bestiii-removebg-preview-removebg-preview.png"
              alt="Bestie"
              style={{
                width: 52, height: 52, objectFit: "contain",
                filter: "drop-shadow(0 0 8px rgba(232,72,199,1)) drop-shadow(0 0 16px rgba(232,72,199,0.6))",
                animation: "bestieGlow 1.6s ease-in-out infinite",
              }}
            />
            <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(232,72,199,0.9)", letterSpacing: "0.04em" }}>💕 Besties</span>
          </div>
        )}
      </div>

      {/* Badge explanation — shown only when a badge is active */}
      {badgeInfo && (
        <div style={{ margin: "8px 16px 0", flexShrink: 0 }}>
          <p style={{ color: "rgba(236,72,153,0.95)", fontSize: 12, fontWeight: 800, margin: "0 0 3px", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 15 }}>{badgeInfo.icon}</span> {badgeInfo.label}
          </p>
          <p style={{ color: "white", fontSize: 11, fontWeight: 500, lineHeight: 1.55, margin: "0 0 4px", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
            {badgeInfo.meaning}
          </p>
          <p style={{ color: "rgba(236,72,153,0.65)", fontSize: 10, fontStyle: "italic", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            💡 {badgeInfo.tip}
          </p>
        </div>
      )}

      {/* Scrollable content — all 3 sections */}
      <div
        className="scrollbar-pink"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 16px 16px",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(236,72,153,0.4) transparent",
        }}
      >
        {/* -- Profile / Basic Info -- */}
        <div style={{
          margin: "14px 0 6px 0",
          paddingBottom: 6,
          borderBottom: "1.5px solid rgba(236,72,153,0.6)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <p style={{ color: "rgba(236,72,153,1)", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
            Profile
          </p>
          {profile?.app_user_id && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(236,72,153,1)", letterSpacing: "0.04em" }}>
              #{profile.app_user_id}
            </span>
          )}
        </div>
        {(basicInfo.height || basicInfo.body_type || basicInfo.ethnicity) && (
          <>
            <SectionTitle title="Physical" />
            <InfoRow icon="📏" label="Height" value={basicInfo.height} />
            <InfoRow icon="💪" label="Body" value={basicInfo.body_type} />
            <InfoRow icon="🌏" label="Ethnicity" value={basicInfo.ethnicity} />
          </>
        )}
        {(basicInfo.education || basicInfo.occupation || basicInfo.income || basicInfo.lives_with || basicInfo.children) && (
          <>
            <SectionTitle title="Background" />
            <InfoRow icon="🎓" label="Education" value={basicInfo.education} />
            <InfoRow icon="💼" label="Work" value={basicInfo.occupation} />
            <InfoRow icon="💰" label="Income" value={basicInfo.income} />
            <InfoRow icon="🏠" label="Lives with" value={basicInfo.lives_with} />
            <InfoRow icon="👶" label="Children" value={basicInfo.children} />
          </>
        )}
        {basicInfo.languages?.length > 0 && (
          <>
            <SectionTitle title="Languages" />
            <InfoRow icon="🗣️" label="Speaks" value={basicInfo.languages.join(", ")} />
          </>
        )}

        {/* -- Date Reputation -- */}
        {(profile?.date_total_reviews ?? 0) > 0 && (
          <>
            <SectionTitle title="Date Reputation" />
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", flexWrap: "wrap" }}>
              {(profile?.date_show_up_count ?? 0) > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)", fontSize: 11, color: "#4ade80", fontWeight: 700 }}>
                  ✓ Shows Up · {profile!.date_show_up_count}/{profile!.date_total_reviews} dates
                </span>
              )}
              {profile?.date_avg_rating != null && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>
                  ★ {Number(profile!.date_avg_rating).toFixed(1)} avg rating
                </span>
              )}
            </div>
          </>
        )}

        {/* -- Social proof -- */}
        {profile?.social_platform && profile?.social_followers && (
          <>
            <SectionTitle title="Social Proof" />
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
              <span style={{ fontSize: 16 }}>
                {profile.social_platform === "instagram" ? "📸" : profile.social_platform === "tiktok" ? "🎵" : profile.social_platform === "facebook" ? "👥" : profile.social_platform === "youtube" ? "▶️" : "✖️"}
              </span>
              <span style={{ fontSize: 13, color: "white", fontWeight: 700 }}>
                {profile.social_followers >= 1_000_000
                  ? `${(profile.social_followers / 1_000_000).toFixed(1)}M`
                  : profile.social_followers >= 1_000
                  ? `${(profile.social_followers / 1_000).toFixed(profile.social_followers >= 10_000 ? 0 : 1)}K`
                  : profile.social_followers} followers
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "capitalize" }}>
                on {profile.social_platform}
              </span>
            </div>
          </>
        )}

        {/* -- Lifestyle -- */}
        <SectionHeader title="Lifestyle" />
        {(lifestyleInfo.smoking || lifestyleInfo.drinking || lifestyleInfo.exercise || lifestyleInfo.diet || lifestyleInfo.sleep) && (
          <>
            <SectionTitle title="Habits" />
            <InfoRow icon="🚬" label="Smoking" value={lifestyleInfo.smoking} />
            <InfoRow icon="🍷" label="Drinking" value={lifestyleInfo.drinking} />
            <InfoRow icon="🏃" label="Exercise" value={lifestyleInfo.exercise} />
            <InfoRow icon="🍽️" label="Diet" value={lifestyleInfo.diet} />
            <InfoRow icon="🌙" label="Sleep" value={lifestyleInfo.sleep} />
          </>
        )}
        {(lifestyleInfo.social_style || lifestyleInfo.love_language || lifestyleInfo.pets || lifestyleInfo.social_media) && (
          <>
            <SectionTitle title="Personality" />
            <InfoRow icon="🎭" label="Social" value={lifestyleInfo.social_style} />
            <InfoRow icon="❤️" label="Love lang." value={lifestyleInfo.love_language} />
            <InfoRow icon="🐾" label="Pets" value={lifestyleInfo.pets} />
            <InfoRow icon="📱" label="Social" value={lifestyleInfo.social_media} />
          </>
        )}
        {lifestyleInfo.hobbies?.length > 0 && (
          <>
            <SectionTitle title="Hobbies" />
            <InfoRow icon="🎯" label="Enjoys" value={lifestyleInfo.hobbies.join(", ")} />
          </>
        )}

        {/* -- Travel -- */}
        {(profile?.visited_countries?.length > 0 || profile?.residing_country !== profile?.country) && (
          <>
            <SectionHeader title="Travel" />
            {profile?.residing_country && profile?.residing_country !== profile?.country && (
              <InfoRow icon="🏠" label="Residing in" value={profile.residing_country} />
            )}
            {profile?.visited_countries?.length > 0 && (
              <InfoRow icon="✈️" label="Visited" value={profile.visited_countries.join(", ")} />
            )}
          </>
        )}

        {/* -- Interests / Relationship Goals -- */}
        <SectionHeader title="Interests" />
        {(relationshipGoals.looking_for || relationshipGoals.timeline || relationshipGoals.date_type || relationshipGoals.marital_status) && (
          <>
            <SectionTitle title="Intention" />
            <InfoRow icon="💍" label="Looking for" value={relationshipGoals.looking_for} />
            <InfoRow icon="⏱️" label="Timeline" value={relationshipGoals.timeline} />
            <InfoRow icon="🌹" label="Date type" value={relationshipGoals.date_type} />
            <InfoRow icon="💔" label="Status" value={relationshipGoals.marital_status} />
          </>
        )}
        {(relationshipGoals.last_relationship_type || relationshipGoals.relationship_length || relationshipGoals.single_for || relationshipGoals.marriage_count || relationshipGoals.marriage_registration) && (
          <>
            <SectionTitle title="Relationship History" />
            <InfoRow icon="💑" label="Last relationship" value={relationshipGoals.last_relationship_type} />
            <InfoRow icon="⏳" label="It lasted" value={relationshipGoals.relationship_length} />
            <InfoRow icon="🌱" label="Single for" value={relationshipGoals.single_for} />
            <InfoRow icon="💍" label="Times married" value={relationshipGoals.marriage_count} />
            <InfoRow icon="📋" label="Registration" value={relationshipGoals.marriage_registration} />
          </>
        )}
        {relationshipGoals.parent_financial_support && (
          <>
            <SectionTitle title="Family Financial Responsibility" />
            <InfoRow icon="🏠" label="Parent support" value={relationshipGoals.parent_financial_support} />
          </>
        )}
        {(relationshipGoals.religion || relationshipGoals.prayer || relationshipGoals.hijab || relationshipGoals.partner_religion) && (
          <>
            <SectionTitle title="Religion & Culture" />
            <InfoRow icon="🕌" label="Religion" value={relationshipGoals.religion} />
            <InfoRow icon="🙏" label="Prayer" value={relationshipGoals.prayer} />
            <InfoRow icon="👤" label="Hijab" value={relationshipGoals.hijab} />
            <InfoRow icon="🤲" label="Partner rel." value={relationshipGoals.partner_religion} />
          </>
        )}
        {(relationshipGoals.dowry || relationshipGoals.family_involvement || relationshipGoals.polygamy || relationshipGoals.relocate) && (
          <>
            <SectionTitle title="Family & Tradition" />
            <InfoRow icon="💛" label="Dowry" value={relationshipGoals.dowry} />
            <InfoRow icon="👨‍👩‍👧" label="Family" value={relationshipGoals.family_involvement} />
            <InfoRow icon="⚠️" label="Polygamy" value={relationshipGoals.polygamy} />
            <InfoRow icon="📍" label="Relocate" value={relationshipGoals.relocate} />
          </>
        )}

        {/* -- Shy / Unlock Questions -- */}
        <ShyFieldsSection
          profile={profile}
          onAskQuestion={onAskQuestion}
          askedStates={askedStates}
          answeredValues={answeredValues}
          coinBalance={coinBalance}
        />

        {/* -- Match With You -- */}
        <SectionHeader title="Match With You" />
        <div style={{
          background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.12))",
          border: "1px solid rgba(236,72,153,0.4)",
          borderRadius: 12,
          padding: "14px 14px 10px",
          marginTop: 6,
        }}>
          <CompatibilityBar percent={matchStats.compatibility} insight={matchStats.insight} />
          {matchStats.hasRealQuiz && (
            <p style={{ color: "rgba(168,85,247,0.7)", fontSize: 9, textAlign: "center", margin: "4px 0 0", fontStyle: "italic" }}>
              Based on your values quiz answers
            </p>
          )}
          <div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 6 }}>
            <MatchRow icon="📍" label="Distance" value={`${matchStats.distanceKm} km away`} />
            <MatchRow icon="🎯" label="Shared Interests" value={String(matchStats.sharedInterests)} />
            <MatchRow icon="🕐" label="Active Time Match" value={matchStats.activeTime} />
            <MatchRow icon="🗣️" label="Language Match" value={matchStats.langMatch} />
          </div>
        </div>

        {/* ── Looking for in a partner ── */}
        {(relationshipGoals.looking_for || relationshipGoals.about_partner) && (() => {
          const isMarriage = relationshipGoals.looking_for === "Looking for Marriage";
          return (
          <div style={{
            position: "relative",
            overflow: "hidden",
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: isMarriage ? "1.5px solid rgba(255,215,0,0.85)" : "1.5px solid rgba(201,162,39,0.7)",
            borderRadius: 14,
            padding: "10px 14px 12px",
            marginTop: 4,
            boxShadow: isMarriage
              ? "0 0 18px rgba(255,215,0,0.35), 0 0 6px rgba(255,215,0,0.2), inset 0 1px 0 rgba(255,215,0,0.12)"
              : "0 0 12px rgba(201,162,39,0.15), inset 0 1px 0 rgba(201,162,39,0.1)",
          }}>
            {/* Floating mini hearts */}
            {[
              { left: 8,  delay: 0,    dur: 3.2, size: 9  },
              { left: 25, delay: 1.1,  dur: 2.8, size: 7  },
              { left: 55, delay: 0.4,  dur: 3.6, size: 8  },
              { left: 75, delay: 1.8,  dur: 2.5, size: 6  },
              { left: 90, delay: 0.9,  dur: 3.0, size: 7  },
            ].map((h, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 0.55, 0], y: -52 }}
                transition={{ duration: h.dur, delay: h.delay, repeat: Infinity, repeatDelay: 1.5 + i * 0.4, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  left: `${h.left}%`,
                  bottom: 6,
                  fontSize: h.size,
                  color: "#e8a820",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              >
                ♥
              </motion.span>
            ))}

            {/* Section label */}
            <p style={{
              position: "relative", zIndex: 1,
              color: "rgba(201,162,39,0.8)",
              fontSize: 9, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: "0.12em",
              margin: "0 0 7px",
              textShadow: "0 0 8px rgba(201,162,39,0.3)",
            }}>
              ✦ Looking for in a partner
            </p>

            {/* looking_for — icon + text, no badge */}
            {relationshipGoals.looking_for && (
              <div style={{
                position: "relative", zIndex: 1,
                display: "flex", alignItems: "center", gap: 7,
                marginBottom: relationshipGoals.about_partner ? 8 : 0,
              }}>
                <span style={{ fontSize: 16 }}>💍</span>
                <span style={{
                  fontSize: 13, fontWeight: 800,
                  color: "rgba(255,220,100,1)",
                  textShadow: "0 0 12px rgba(201,162,39,0.6)",
                  letterSpacing: "0.01em",
                }}>
                  {relationshipGoals.looking_for}
                </span>
              </div>
            )}

            {/* About partner free text */}
            {relationshipGoals.about_partner && (
              <p style={{ position: "relative", zIndex: 1, color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.6, margin: 0, textShadow: "0 1px 2px rgba(0,0,0,0.9)", fontStyle: "italic" }}>
                "{relationshipGoals.about_partner}"
              </p>
            )}
          </div>
          );
        })()}

        {/* ── My Bestie's section ── */}
        {(() => {
          const bestieIds: string[] = profile?.bestie_ids || [];
          const bestieProfiles = bestieIds
            .map((bid: string) => allProfiles.find((p: any) => p.id === bid))
            .filter(Boolean);

          if (bestieProfiles.length === 0 && !onBestieRequest) return null;

          const profileReviews: Record<string, string> = profile?.bestie_reviews || {};
          const myWrittenReview = (() => { try { return localStorage.getItem(lsReviewKey) || ""; } catch { return ""; } })();

          return (
            <div style={{ marginTop: 8 }}>
              {/* Section header */}
              <div style={{
                margin: "6px 0 10px",
                paddingBottom: 6,
                borderBottom: "1.5px solid rgba(236,72,153,0.6)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13 }}>👯</span>
                  <p style={{
                    color: "rgba(236,72,153,1)", fontSize: 11, fontWeight: 800,
                    letterSpacing: "0.1em", textTransform: "uppercase", margin: 0,
                  }}>My Bestie's</p>
                </div>
                {isBestie && (
                  <button
                    onClick={() => { setReviewEditing(e => !e); setReviewError(""); }}
                    style={{
                      fontSize: 9, fontWeight: 700, color: "rgba(236,72,153,0.9)",
                      background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.3)",
                      borderRadius: 8, padding: "3px 8px", cursor: "pointer", letterSpacing: "0.04em",
                    }}
                  >
                    {reviewEditing ? "✕ Cancel" : myWrittenReview ? "✏️ Edit Review" : "✍️ Write Review"}
                  </button>
                )}
              </div>

              {/* Bestie avatars */}
              {bestieProfiles.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {bestieProfiles.map((bp: any) => (
                    <button
                      key={bp.id}
                      onClick={() => navigate(`/profile/${bp.id}`)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                    >
                      <img
                        src={bp.avatar_url || bp.image || "/placeholder.svg"}
                        alt={bp.name}
                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                        style={{
                          width: 42, height: 42, borderRadius: "50%", objectFit: "cover",
                          border: "2px solid rgba(232,72,199,0.5)",
                          boxShadow: "0 0 8px rgba(232,72,199,0.2)",
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLImageElement).style.transform = "scale(1.08)";
                          (e.currentTarget as HTMLImageElement).style.boxShadow = "0 0 14px rgba(232,72,199,0.55)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLImageElement).style.transform = "scale(1)";
                          (e.currentTarget as HTMLImageElement).style.boxShadow = "0 0 8px rgba(232,72,199,0.2)";
                        }}
                      />
                      <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>
                        {bp.app_user_id || bp.id.slice(0, 8)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, margin: "8px 0 0", fontStyle: "italic" }}>
                  No bestie's yet
                </p>
              )}

              {/* Bestie reviews */}
              {(Object.keys(profileReviews).length > 0 || myWrittenReview) && !reviewEditing && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  {bestieProfiles.map((bp: any) => {
                    const review = profileReviews[bp.id];
                    if (!review) return null;
                    return (
                      <div key={bp.id} style={{
                        background: "rgba(236,72,153,0.07)",
                        border: "1px solid rgba(236,72,153,0.2)",
                        borderRadius: 10,
                        padding: "9px 11px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                          <img
                            src={bp.avatar_url || bp.image || "/placeholder.svg"}
                            alt={bp.name}
                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                            style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(236,72,153,0.4)", flexShrink: 0 }}
                          />
                          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(236,72,153,0.9)" }}>{bp.name?.split(" ")[0]}</span>
                          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{bp.app_user_id || bp.id.slice(0, 8)}</span>
                        </div>
                        <p style={{
                          fontSize: 11, color: "rgba(255,255,255,0.82)", lineHeight: 1.6,
                          fontStyle: "italic", margin: 0,
                        }}>
                          <span style={{ color: "rgba(236,72,153,0.7)", fontSize: 14, lineHeight: 0, verticalAlign: "-3px", marginRight: 3 }}>"</span>
                          {review}
                          <span style={{ color: "rgba(236,72,153,0.7)", fontSize: 14, lineHeight: 0, verticalAlign: "-3px", marginLeft: 3 }}>"</span>
                        </p>
                      </div>
                    );
                  })}
                  {myWrittenReview && (
                    <div style={{
                      background: "rgba(236,72,153,0.1)",
                      border: "1px solid rgba(236,72,153,0.35)",
                      borderRadius: 10,
                      padding: "9px 11px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 12 }}>💕</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(236,72,153,1)" }}>Your Review</span>
                      </div>
                      <p style={{
                        fontSize: 11, color: "rgba(255,255,255,0.82)", lineHeight: 1.6,
                        fontStyle: "italic", margin: 0,
                      }}>
                        <span style={{ color: "rgba(236,72,153,0.7)", fontSize: 14, lineHeight: 0, verticalAlign: "-3px", marginRight: 3 }}>"</span>
                        {myWrittenReview}
                        <span style={{ color: "rgba(236,72,153,0.7)", fontSize: 14, lineHeight: 0, verticalAlign: "-3px", marginLeft: 3 }}>"</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Write / edit review form */}
              {isBestie && reviewEditing && (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    value={reviewDraft}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReviewDraft(val);
                      if (reviewError) setReviewError(validateReview(val));
                    }}
                    placeholder={`Tell the world what makes ${profileName.split(" ")[0]} special... (max 350 characters, no numbers or links)`}
                    maxLength={400}
                    rows={4}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(0,0,0,0.45)", border: "1.5px solid rgba(236,72,153,0.35)",
                      borderRadius: 10, color: "white", fontSize: 12, lineHeight: 1.6,
                      padding: "9px 11px", resize: "none", outline: "none",
                      fontFamily: "inherit", fontStyle: "italic",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(236,72,153,0.7)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(236,72,153,0.35)"; }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      color: reviewDraft.length > 350 ? "rgba(255,80,80,0.9)" : "rgba(255,255,255,0.35)",
                    }}>
                      {reviewDraft.length}/350
                    </span>
                    {reviewError && (
                      <span style={{ fontSize: 10, color: "rgba(255,80,80,0.9)", fontWeight: 600 }}>{reviewError}</span>
                    )}
                    <button
                      onClick={saveReview}
                      style={{
                        fontSize: 11, fontWeight: 700, color: "white",
                        background: "linear-gradient(135deg, rgba(236,72,153,0.85), rgba(190,50,120,0.85))",
                        border: "none", borderRadius: 8, padding: "5px 14px", cursor: "pointer",
                      }}
                    >
                      Save Review 💕
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Send Real Gift ── */}
        {onSendRealGift && (
          <div style={{ marginTop: 20, padding: "0 2px 8px" }}>
            <button
              onClick={onSendRealGift}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 16,
                background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.15))",
                border: "1px solid rgba(245,158,11,0.35)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 28, flexShrink: 0 }}>🎁</span>
              <div>
                <p style={{ color: "#fde68a", fontWeight: 700, fontSize: 13, margin: 0 }}>
                  Send a Real Gift
                </p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "2px 0 0" }}>
                  Flowers, jewellery, spa & more — her address stays private
                </p>
              </div>
              <span style={{ color: "rgba(245,158,11,0.6)", fontSize: 18, marginLeft: "auto", flexShrink: 0 }}>→</span>
            </button>
          </div>
        )}

        {/* ── Block User ── */}
        {profile?.id && (
          <div style={{ marginTop: 12, padding: "0 2px 16px" }}>
            {!confirmBlock ? (
              <button
                onClick={() => setConfirmBlock(true)}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  color: "rgba(239,68,68,0.7)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <span style={{ fontSize: 14 }}>🚫</span> Block {profileName.split(" ")[0]}
              </button>
            ) : (
              <div style={{
                borderRadius: 12,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.35)",
                padding: "12px 14px",
              }}>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, margin: "0 0 10px", textAlign: "center" }}>
                  Block {profileName.split(" ")[0]}? They will be permanently removed from your feed and all connections deleted.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setConfirmBlock(false)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8,
                      background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={blocking}
                    onClick={() => blockUser(profile.id, profileName.split(" ")[0], onBlock)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8,
                      background: "rgba(239,68,68,0.75)", border: "none",
                      color: "white", fontSize: 12, fontWeight: 700, cursor: blocking ? "not-allowed" : "pointer",
                      opacity: blocking ? 0.6 : 1,
                    }}
                  >
                    {blocking ? "Blocking…" : "Yes, Block"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
