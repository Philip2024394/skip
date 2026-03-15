import { motion } from "framer-motion";
import { X } from "lucide-react";
import { getPrimaryBadgeKey } from "@/utils/profileBadges";

interface ProfileInfoPanelProps {
  profile: any;
  onClose: () => void;
}

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value?: string }) =>
  value ? (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
      <span style={{ fontSize: 14, width: 22, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 600, minWidth: 60, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: "white", fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{value}</span>
    </div>
  ) : null;

const SectionTitle = ({ title }: { title: string }) => (
  <p style={{
    color: "rgba(255,255,255,0.85)",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    margin: "10px 0 4px 0",
    borderBottom: "1px solid rgba(255,255,255,0.3)",
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
    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 600, minWidth: 80, flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 12, color: "white", fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{value}</span>
  </div>
);

const CompatibilityBar = ({ percent }: { percent: number }) => (
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
        background: "linear-gradient(90deg, rgba(236,72,153,0.9), rgba(168,85,247,0.9))",
      }} />
    </div>
  </div>
);

const BADGE_INFO: Record<string, { icon: string; label: string; meaning: string; tip: string }> = {
  available_tonight: {
    icon: "🌙",
    label: "Free Tonight",
    meaning: "This person is free tonight and open to meeting up. They've actively set this badge to signal they're available right now.",
    tip: "Send a message soon — they're looking to connect tonight!",
  },
  is_plusone: {
    icon: "✚",
    label: "+1 Plus One",
    meaning: "Looking for a plus one to join them at an event, dinner, or social gathering. They want company for something specific.",
    tip: "Ask what event they need a plus one for — great conversation starter!",
  },
  generous_lifestyle: {
    icon: "🎁",
    label: "Generous",
    meaning: "This person enjoys treating others and has a generous approach to dating. They appreciate quality experiences together.",
    tip: "They enjoy giving — let them know what experiences you love.",
  },
  weekend_plans: {
    icon: "📅",
    label: "Weekend Plans",
    meaning: "Actively making plans for the weekend and open to including someone special. They're looking for a weekend date.",
    tip: "Suggest a weekend activity — they're planning ahead!",
  },
  late_night_chat: {
    icon: "🌙",
    label: "Late Night",
    meaning: "A night owl who's most active and social during late hours. They enjoy deep conversations when the world is quiet.",
    tip: "Send a message late evening — that's when they're most engaged.",
  },
  no_drama: {
    icon: "✨",
    label: "No Drama",
    meaning: "Values peace, honesty and straightforward communication. They're looking for a relaxed, drama-free connection.",
    tip: "Be direct and genuine — they appreciate honest conversation.",
  },
};

function computeMatchStats(profile: any) {
  const id = profile?.id || "";
  // Deterministic seed from profile id
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = ((seed << 5) - seed + id.charCodeAt(i)) | 0;
  seed = Math.abs(seed);

  const compatibility = 65 + (seed % 30); // 65-94%
  const distanceKm = 1 + (seed % 18); // 1-18 km
  const sharedInterests = 2 + (seed % 5); // 2-6

  const basicInfo = profile?.basic_info || {};
  const lifestyleInfo = profile?.lifestyle_info || {};

  const timeSlots = ["Both active mornings", "Both active evenings", "Both active afternoons", "Both night owls"];
  const activeTime = timeSlots[seed % timeSlots.length];

  const langs = basicInfo.languages || [];
  const langMatch = langs.length > 0 ? langs[0] : "English";

  return { compatibility, distanceKm, sharedInterests, activeTime, langMatch };
}

export default function ProfileInfoPanel({ profile, onClose }: ProfileInfoPanelProps) {
  const basicInfo = profile?.basic_info || {};
  const lifestyleInfo = profile?.lifestyle_info || {};
  const relationshipGoals = profile?.relationship_goals || {};
  const matchStats = computeMatchStats(profile);
  const badgeKey = getPrimaryBadgeKey(profile);
  const badgeInfo = badgeKey ? BADGE_INFO[badgeKey] : null;

  const profileName = profile?.name || profile?.full_name || profile?.first_name || "Profile";

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
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 10, right: 10, zIndex: 10,
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "rgba(255,255,255,0.7)",
        }}
        aria-label="Close"
      >
        <X size={14} />
      </button>

      {/* Header */}
      <div style={{
        padding: "12px 16px 8px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}>
        <p style={{ color: "white", fontSize: 14, fontWeight: 800, margin: 0 }}>
          About {profileName}
        </p>
      </div>

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
        <SectionHeader title="Profile" />
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
        {relationshipGoals.about_partner && (
          <div style={{
            background: "rgba(245,158,11,0.15)",
            border: "1px solid rgba(245,158,11,0.4)",
            borderRadius: 10,
            padding: "8px 12px",
            marginTop: 8,
          }}>
            <p style={{ color: "rgba(245,158,11,0.95)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Looking for in a partner</p>
            <p style={{ color: "white", fontSize: 12, lineHeight: 1.5, margin: 0, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{relationshipGoals.about_partner}</p>
          </div>
        )}

        {/* -- Match With You -- */}
        <SectionHeader title="Match With You" />
        <div style={{
          background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.12))",
          border: "1px solid rgba(236,72,153,0.4)",
          borderRadius: 12,
          padding: "14px 14px 10px",
          marginTop: 6,
        }}>
          <CompatibilityBar percent={matchStats.compatibility} />
          <div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 6 }}>
            <MatchRow icon="📍" label="Distance" value={`${matchStats.distanceKm} km away`} />
            <MatchRow icon="🎯" label="Shared Interests" value={String(matchStats.sharedInterests)} />
            <MatchRow icon="🕐" label="Active Time Match" value={matchStats.activeTime} />
            <MatchRow icon="🗣️" label="Language Match" value={matchStats.langMatch} />
          </div>
        </div>

        {/* -- Active Badge Explanation -- */}
        {badgeInfo && (
          <div style={{
            background: "rgba(0,0,0,0.8)",
            border: "1px solid rgba(250,204,21,0.6)",
            borderRadius: 12,
            padding: "14px 14px 12px",
            marginTop: 14,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: 18, width: 32, height: 32, borderRadius: "50%",
                background: "rgba(250,204,21,0.9)",
                border: "1px solid rgba(250,204,21,1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>{badgeInfo.icon}</span>
              <div>
                <p style={{ color: "rgba(250,204,21,1)", fontSize: 13, fontWeight: 800, margin: 0 }}>
                  {badgeInfo.label}
                </p>
                <p style={{ color: "rgba(250,204,21,0.8)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "1px 0 0" }}>
                  Active Badge
                </p>
              </div>
            </div>
            <p style={{ color: "rgba(250,204,21,0.95)", fontSize: 12, lineHeight: 1.6, margin: "0 0 8px", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
              {badgeInfo.meaning}
            </p>
            <div style={{
              background: "rgba(0,0,0,0.6)",
              borderRadius: 8,
              padding: "8px 10px",
              display: "flex", alignItems: "flex-start", gap: 6,
            }}>
              <span style={{ fontSize: 12, flexShrink: 0 }}>💡</span>
              <p style={{ color: "rgba(250,204,21,0.9)", fontSize: 11, fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
                {badgeInfo.tip}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
