import { useState, useEffect } from "react";
import { DateIdeaDescription } from "./DateIdeaDescription";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PREMIUM_FEATURES } from "@/data/premiumFeatures";
import { toast } from "sonner";
import { MapPin, Navigation } from "lucide-react";

interface ProfileBottomSheetProps {
  // Profile data
  selectedProfile: any;
  isProfileRoute: boolean;
  // Tab state
  aboutMeTab: "new" | "sent" | "received" | "treat" | "distance";
  setAboutMeTab: (v: "new" | "sent" | "received" | "treat" | "distance") => void;
  selectedProfileSection: "basic" | "lifestyle" | "interests" | null;
  setSelectedProfileSection: (v: "basic" | "lifestyle" | "interests" | null) => void;
  selectedDatePlace: any;
  setSelectedDatePlace: (v: any) => void;
  selectedTreatItem: "massage" | "beautician" | "flowers" | "jewelry" | null;
  onSelectTreatItem?: (key: "massage" | "beautician" | "flowers" | "jewelry") => void;
  // Unlock
  selectedUnlockItemKey: string;
  setSelectedUnlockItemKey: (v: string) => void;
  onUnlockWhatsApp: () => void;
  // Library ref
  libraryRef: React.RefObject<HTMLElement | null>;
  // Tab overrides
  tabLabelOverrides: Record<string, string> | undefined;
  // Liked me
  likedMe: any[];
  heartDropProfileId: string | null;
  // Callbacks
  onTabChange: (tab: any) => void;
  onSelectProfileSection: (section: any) => void;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function DistanceTab({ profile, navigate }: { profile: any; navigate: (p: string) => void }) {
  const [distKm, setDistKm] = useState<number | null>(null);
  const [locError, setLocError] = useState(false);

  useEffect(() => {
    if (!profile?.latitude || !profile?.longitude) return;
    if (!navigator.geolocation) { setLocError(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = haversineKm(pos.coords.latitude, pos.coords.longitude, profile.latitude, profile.longitude);
        setDistKm(km);
      },
      () => setLocError(true),
      { timeout: 6000 }
    );
  }, [profile]);

  const hasCoords = !!(profile?.latitude && profile?.longitude);
  const distLabel = distKm !== null
    ? distKm < 1 ? "Less than 1 km away" : `${Math.round(distKm)} km away`
    : null;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-3 px-4">
      <div className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col items-center gap-2">
        <MapPin className="w-7 h-7 text-pink-400" />
        <p className="text-white font-bold text-base text-center">
          {profile?.city}, {profile?.country}
        </p>
        {hasCoords && distLabel && (
          <p className="text-pink-300 text-sm font-semibold">{distLabel}</p>
        )}
        {hasCoords && distKm === null && !locError && (
          <p className="text-white/40 text-xs">Calculating distance…</p>
        )}
        {(!hasCoords || locError) && (
          <p className="text-white/40 text-xs text-center">Enable location to see exact distance</p>
        )}
      </div>
      <button
        onClick={() => navigate("/map")}
        className="w-full h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all active:scale-95"
        style={{ background: "linear-gradient(135deg,#e879f9,#a855f7)" }}
      >
        <Navigation className="w-4 h-4" /> View on Map
      </button>
    </div>
  );
}

export default function ProfileBottomSheet(props: ProfileBottomSheetProps) {
  const navigate = useNavigate();
  const [selectedDateIdea, setSelectedDateIdea] = useState<string | null>(null);

  return (
    <>
      <div
        className={`relative z-10 h-full w-full ${
          props.aboutMeTab === "received" && ["unlock:single", "unlock:pack3", "unlock:pack10"].includes(props.selectedUnlockItemKey)
            ? "px-0 py-0"
            : "px-6 py-6"
        }`}
      >
        <div
          className={`h-full w-full rounded-2xl bg-gradient-to-br from-fuchsia-900/25 via-black/35 to-purple-900/25 backdrop-blur-md border-2 border-fuchsia-300/25 ring-1 ring-fuchsia-300/15 shadow-[0_8px_24px_rgba(0,0,0,0.55)] flex ${
            props.aboutMeTab === "received" && ["unlock:single", "unlock:pack3", "unlock:pack10"].includes(props.selectedUnlockItemKey)
              ? "p-0 items-stretch justify-stretch rounded-none border-0 ring-0 shadow-none"
              : "px-5 py-4 items-center justify-center"
          }`}
        >
                  {props.aboutMeTab === "received" ? (
                    <div className="h-full w-full flex flex-col">
                      {!["unlock:single", "unlock:pack3", "unlock:pack10"].includes(props.selectedUnlockItemKey) && (
                        <p className="text-white/80 text-xs font-semibold text-center pb-3 border-b border-white/10">Unlock</p>
                      )}

                      {["unlock:single", "unlock:pack3", "unlock:pack10"].includes(props.selectedUnlockItemKey) ? (
                        <div className="flex-1 w-full relative overflow-hidden rounded-none border-0">
                          <img
                            src="https://ik.imagekit.io/7grri5v7d/match%20unlockssss.png"
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                            draggable={false}
                            loading="eager"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75" />

                          <div className="relative z-10 h-full w-full p-4 flex flex-col items-center justify-center text-center">
                            {props.selectedUnlockItemKey === "unlock:single" ? (
                              <>
                                <p className="text-white text-base font-black">1 Match Unlock</p>
                                <p className="text-white/85 text-xs mt-1 max-w-sm">Unlock WhatsApp after you both match. Fast, simple, direct.</p>
                                <div className="mt-5 w-full max-w-sm flex items-center justify-between">
                                  <p className="text-white/95 font-black text-2xl">$1.99</p>
                                  <Button
                                    onClick={() => { if (!props.selectedProfile) return; props.onUnlockWhatsApp(); }}
                                    className="gradient-love text-primary-foreground border-0 h-11 rounded-xl font-black"
                                  >
                                    Unlock now
                                  </Button>
                                </div>
                                <div className="mt-4 w-full max-w-sm rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                                  <p className="text-white/70 text-[11px] font-semibold">Requires a mutual match ✅</p>
                                </div>
                              </>
                            ) : props.selectedUnlockItemKey === "unlock:pack3" ? (
                              <>
                                <p className="text-white text-base font-black">3 Unlock Pack</p>
                                <p className="text-white/85 text-xs mt-1 max-w-sm">Perfect for a week of real connections. Save vs singles.</p>
                                <div className="mt-5 w-full max-w-sm flex items-center justify-between">
                                  <p className="text-white/95 font-black text-2xl">$4.99</p>
                                  <Button
                                    onClick={() => toast.info("3-pack checkout coming next")}
                                    className="gradient-love text-primary-foreground border-0 h-11 rounded-xl font-black"
                                  >
                                    Choose pack
                                  </Button>
                                </div>
                                <div className="mt-4 w-full max-w-sm rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                                  <p className="text-white/70 text-[11px] font-semibold">Best for casual + active users.</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-white text-base font-black">10 Unlock Pack</p>
                                <p className="text-white/85 text-xs mt-1 max-w-sm">Best value for heavy matching. Lowest cost per unlock.</p>
                                <div className="mt-5 w-full max-w-sm flex items-center justify-between">
                                  <p className="text-white/95 font-black text-2xl">$12.99</p>
                                  <Button
                                    onClick={() => toast.info("10-pack checkout coming next")}
                                    className="gradient-love text-primary-foreground border-0 h-11 rounded-xl font-black"
                                  >
                                    Choose pack
                                  </Button>
                                </div>
                                <div className="mt-4 w-full max-w-sm rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                                  <p className="text-white/70 text-[11px] font-semibold">Best value package.</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center px-1">
                          <div className="w-full max-w-md rounded-2xl bg-black/30 border border-white/10 px-4 py-4">
                            {props.selectedUnlockItemKey === "unlock:pack3" ? (
                            <></>
                          ) : props.selectedUnlockItemKey === "unlock:pack10" ? (
                            <></>
                          ) : props.selectedUnlockItemKey === "unlock:vip" ? (
                            <>
                              <p className="text-white text-sm font-black text-center">VIP Monthly</p>
                              <p className="text-white/70 text-xs mt-1 text-center">10 Match Unlocks / month + VIP badge + priority.</p>
                              <div className="mt-3 flex items-center justify-between">
                                <p className="text-white/90 font-black text-xl">$9.99/mo</p>
                                <Button
                                  onClick={() => navigate("/dashboard?purchase=vip")}
                                  className="gradient-gold text-white border-0 h-10 rounded-xl font-black"
                                >
                                  Go VIP
                                </Button>
                              </div>
                              <p className="text-white/45 text-[10px] mt-2 text-center">Includes 10 unlocks every month.</p>
                            </>
                          ) : props.selectedUnlockItemKey.startsWith("feature:") ? (
                            (() => {
                              const featureId = props.selectedUnlockItemKey.replace("feature:", "");
                              const feature = PREMIUM_FEATURES.find((f) => f.id === featureId);
                              if (!feature) return <p className="text-white/60 text-xs">Select a feature above</p>;
                              return (
                                <>
                                  <p className="text-white text-sm font-black text-center">{feature.emoji} {feature.name}</p>
                                  <p className="text-white/70 text-xs mt-1 text-center">{feature.description}</p>
                                  <div className="mt-3 flex items-center justify-between">
                                    <p className="text-white/90 font-black text-xl">{feature.price}</p>
                                    <Button
                                      onClick={() => navigate(`/dashboard?purchase=${feature.id}`)}
                                      className="gradient-gold text-white border-0 h-10 rounded-xl font-black"
                                    >
                                      Get
                                    </Button>
                                  </div>
                                </>
                              );
                            })()
                          ) : (
                            <p className="text-white/60 text-xs">Select a package above</p>
                          )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : props.aboutMeTab === "treat" ? (
                    <div className="h-full w-full flex flex-col">
                      <p className="text-white/90 text-sm font-bold text-center pb-3 border-b border-white/10">Treat That Special Person</p>
                      <div className="flex-1 overflow-x-auto overflow-y-hidden px-1 pt-3">
                        <div className="flex gap-2 pb-2 h-full">
                          {([
                            { key: "massage",    label: "Massage",    image: "https://ik.imagekit.io/7grri5v7d/massage%20therapsy.png?updatedAt=1773339304480" },
                            { key: "beautician", label: "Beautician", image: "https://ik.imagekit.io/7grri5v7d/beauty%20woman.png?updatedAt=1773339036755" },
                            { key: "flowers",    label: "Flowers",    image: "https://ik.imagekit.io/7grri5v7d/flowers%20nice.png?updatedAt=1773339411434" },
                            { key: "jewelry",    label: "Jewelry",    image: "https://ik.imagekit.io/7grri5v7d/jewerlysss.png?updatedAt=1773338936919" },
                          ] as const).map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => props.onSelectTreatItem?.(item.key)}
                              className="relative overflow-hidden rounded-xl cursor-pointer flex-shrink-0 hover:scale-[1.03] transition-transform"
                              style={{
                                height: 124, width: 80,
                                backgroundImage: `url(${item.image})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                border: props.selectedTreatItem === item.key
                                  ? "1.5px solid rgba(232,72,199,0.7)"
                                  : "1.5px solid rgba(232,72,199,0.35)",
                              }}
                              aria-label={item.label}
                            >
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.05) 100%)" }} />
                              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", padding: "0 4px 6px" }}>
                                <p className="text-white text-[10px] font-bold text-center leading-tight mb-1">{item.label}</p>
                                <span style={{ background: "linear-gradient(135deg, hsl(320,50%,50%), hsl(315,40%,55%))", color: "#fff", fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 20, whiteSpace: "nowrap" }}>View</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : props.aboutMeTab === "sent" ? (
                    <div className="h-full w-full flex flex-col gap-2 overflow-hidden">
                      {/* Description box — no scroll, fixed at top */}
                      <DateIdeaDescription selectedDateIdea={selectedDateIdea} className="flex-shrink-0 px-1 pt-1" />

                      {/* 3 equal-height date idea image cards */}
                      <div className="flex-1 overflow-hidden flex flex-row gap-2 px-1 pb-1">
                        {(() => {
                          const places: Array<{ idea: string; url: string; google_url?: string; image_url: string | null; title: string | null }> =
                            (props.selectedProfile?.first_date_places && props.selectedProfile.first_date_places.length > 0)
                              ? props.selectedProfile.first_date_places.slice(0, 3)
                              : [];
                          if (places.length === 0) return (
                            <p className="text-white/30 text-xs self-center mx-auto">No date ideas listed</p>
                          );
                          return places.map((place, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedDateIdea(place.idea === selectedDateIdea ? null : place.idea)}
                              style={{
                                flex: 1,
                                position: "relative",
                                borderRadius: 14,
                                overflow: "hidden",
                                border: selectedDateIdea === place.idea
                                  ? "2px solid rgba(236,72,153,0.85)"
                                  : "1.5px solid rgba(255,255,255,0.12)",
                                background: "#0a0018",
                                cursor: "pointer",
                                padding: 0,
                                transition: "border-color 0.15s",
                              }}
                            >
                              {/* Image */}
                              {place.image_url && (
                                <img
                                  src={place.image_url}
                                  alt={place.idea}
                                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              )}
                              {/* Gradient overlay */}
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.08) 100%)" }} />
                              {/* Selected highlight */}
                              {selectedDateIdea === place.idea && (
                                <div style={{ position: "absolute", inset: 0, background: "rgba(236,72,153,0.18)" }} />
                              )}
                              {/* Label */}
                              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 6px 7px", textAlign: "center" }}>
                                <p style={{ color: "#fff", fontSize: 9, fontWeight: 800, lineHeight: 1.3, margin: 0, textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
                                  {place.idea}
                                </p>
                              </div>
                              {/* Maps link */}
                              {(place.google_url || place.url) && (
                                <a
                                  href={place.google_url || place.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    position: "absolute", top: 6, right: 6,
                                    background: "rgba(0,0,0,0.6)",
                                    borderRadius: 8, padding: "3px 5px",
                                    fontSize: 8, color: "rgba(255,255,255,0.75)",
                                    fontWeight: 700, textDecoration: "none",
                                    backdropFilter: "blur(4px)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                  }}
                                >
                                  📍
                                </a>
                              )}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  ) : props.aboutMeTab === "distance" ? (
                    <DistanceTab profile={props.selectedProfile} navigate={navigate} />
                  ) : (
                    <div className="h-full w-full overflow-y-auto" style={{ padding: "4px 0" }}>
                      {(() => {
                        const basicInfo = (props.selectedProfile as any)?.basic_info as any || {};
                        const lifestyleInfo = (props.selectedProfile as any)?.lifestyle_info as any || {};
                        const relationshipGoals = (props.selectedProfile as any)?.relationship_goals as any || {};

                        const InfoChip = ({ label, value }: { label: string; value?: string }) =>
                          value ? (
                            <div style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "5px 10px",
                              borderRadius: 999,
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid rgba(255,255,255,0.14)",
                              marginBottom: 4,
                            }}>
                              <span style={{ fontSize: 13 }}>{label}</span>
                              <span style={{ fontSize: 11, color: "white", fontWeight: 600 }}>{value}</span>
                            </div>
                          ) : null;

                        const SectionBlock = ({ title, chips }: { title: string; chips: React.ReactNode }) => (
                          <div style={{ marginBottom: 14 }}>
                            <p style={{
                              color: "rgba(255,255,255,0.35)",
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase" as const,
                              marginBottom: 8,
                              margin: "0 0 8px 0",
                            }}>{title}</p>
                            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                              {chips}
                            </div>
                          </div>
                        );

                        if (!props.selectedProfileSection) {
                          return (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center" }}>
                                👆 Select a section above to view details
                              </p>
                            </div>
                          );
                        }

                        if (props.selectedProfileSection === "basic") {
                          const hasAny = basicInfo.height || basicInfo.body_type || basicInfo.ethnicity ||
                            basicInfo.education || basicInfo.occupation || basicInfo.income ||
                            basicInfo.lives_with || basicInfo.children || basicInfo.languages?.length;
                          if (!hasAny) return (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>No basic info added yet</p>
                            </div>
                          );
                          return (
                            <div style={{ padding: "0 4px" }}>
                              <SectionBlock title="Physical" chips={<>
                                <InfoChip label="📏" value={basicInfo.height} />
                                <InfoChip label="💪" value={basicInfo.body_type} />
                                <InfoChip label="🌏" value={basicInfo.ethnicity} />
                              </>} />
                              <SectionBlock title="Background" chips={<>
                                <InfoChip label="🎓" value={basicInfo.education} />
                                <InfoChip label="💼" value={basicInfo.occupation} />
                                <InfoChip label="💰" value={basicInfo.income} />
                                <InfoChip label="🏠" value={basicInfo.lives_with} />
                                <InfoChip label="👶" value={basicInfo.children} />
                              </>} />
                              {basicInfo.languages?.length > 0 && (
                                <SectionBlock title="Languages" chips={
                                  basicInfo.languages.map((l: string) => <InfoChip key={l} label="🗣️" value={l} />)
                                } />
                              )}
                            </div>
                          );
                        }

                        if (props.selectedProfileSection === "lifestyle") {
                          const hasAny = lifestyleInfo.smoking || lifestyleInfo.drinking || lifestyleInfo.exercise ||
                            lifestyleInfo.diet || lifestyleInfo.sleep || lifestyleInfo.social_style ||
                            lifestyleInfo.love_language || lifestyleInfo.pets || lifestyleInfo.hobbies?.length;
                          if (!hasAny) return (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>No lifestyle info added yet</p>
                            </div>
                          );
                          return (
                            <div style={{ padding: "0 4px" }}>
                              <SectionBlock title="Habits" chips={<>
                                <InfoChip label="🚬" value={lifestyleInfo.smoking} />
                                <InfoChip label="🍷" value={lifestyleInfo.drinking} />
                                <InfoChip label="🏃" value={lifestyleInfo.exercise} />
                                <InfoChip label="🍽️" value={lifestyleInfo.diet} />
                                <InfoChip label="🌙" value={lifestyleInfo.sleep} />
                              </>} />
                              <SectionBlock title="Personality" chips={<>
                                <InfoChip label="🎭" value={lifestyleInfo.social_style} />
                                <InfoChip label="❤️" value={lifestyleInfo.love_language} />
                                <InfoChip label="🐾" value={lifestyleInfo.pets} />
                                <InfoChip label="📱" value={lifestyleInfo.social_media} />
                              </>} />
                              {lifestyleInfo.hobbies?.length > 0 && (
                                <SectionBlock title="Hobbies" chips={
                                  lifestyleInfo.hobbies.map((h: string) => (
                                    <div key={h} style={{
                                      padding: "5px 12px",
                                      borderRadius: 999,
                                      background: "rgba(139,92,246,0.2)",
                                      border: "1px solid rgba(139,92,246,0.35)",
                                      fontSize: 11,
                                      color: "rgba(255,255,255,0.9)",
                                      fontWeight: 600,
                                    }}>{h}</div>
                                  ))
                                } />
                              )}
                            </div>
                          );
                        }

                        if (props.selectedProfileSection === "interests") {
                          const hasAny = relationshipGoals.looking_for || relationshipGoals.religion ||
                            relationshipGoals.dowry || relationshipGoals.date_type || relationshipGoals.about_partner;
                          if (!hasAny) return (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>No relationship goals added yet</p>
                            </div>
                          );
                          return (
                            <div style={{ padding: "0 4px" }}>
                              <SectionBlock title="Intention" chips={<>
                                <InfoChip label="💍" value={relationshipGoals.looking_for} />
                                <InfoChip label="⏱️" value={relationshipGoals.timeline} />
                                <InfoChip label="🌹" value={relationshipGoals.date_type} />
                                <InfoChip label="💔" value={relationshipGoals.marital_status} />
                              </>} />
                              <SectionBlock title="Religion & Culture" chips={<>
                                <InfoChip label="🕌" value={relationshipGoals.religion} />
                                <InfoChip label="🙏" value={relationshipGoals.prayer} />
                                <InfoChip label="👤" value={relationshipGoals.hijab} />
                                <InfoChip label="🤲" value={relationshipGoals.partner_religion} />
                              </>} />
                              <SectionBlock title="Family & Tradition" chips={<>
                                <InfoChip label="💛" value={relationshipGoals.dowry} />
                                <InfoChip label="👨‍👩‍👧" value={relationshipGoals.family_involvement} />
                                <InfoChip label="⚠️" value={relationshipGoals.polygamy} />
                                <InfoChip label="📍" value={relationshipGoals.relocate} />
                              </>} />
                              {relationshipGoals.about_partner && (
                                <div style={{
                                  background: "rgba(245,158,11,0.08)",
                                  border: "1px solid rgba(245,158,11,0.25)",
                                  borderRadius: 12,
                                  padding: "10px 12px",
                                  marginTop: 4,
                                }}>
                                  <p style={{ color: "rgba(245,158,11,0.7)", fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 6 }}>Looking for in a partner</p>
                                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{relationshipGoals.about_partner}</p>
                                </div>
                              )}
                            </div>
                          );
                        }

                        return null;
                      })()}
                    </div>
                  )}
                </div>
      </div>
      
    </>
  );
}
