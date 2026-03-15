import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import DistanceMapOverlay from "./DistanceMapOverlay";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PREMIUM_FEATURES } from "@/data/premiumFeatures";
import { toast } from "sonner";
import { getDateIdeaDescription } from "@/data/dateIdeaDescriptions";
import { getDateIdeaMetadata } from "@/data/dateIdeaMetadata";
import GiftSelector from "@/components/gifts/GiftSelector";

interface ProfileBottomSheetProps {
  // Profile data
  selectedProfile: any;
  allProfiles: any[];
  isProfileRoute: boolean;
  // Tab state
  aboutMeTab: "new" | "sent" | "received" | "treat" | "gifts";
  setAboutMeTab: (v: "new" | "sent" | "received" | "treat" | "gifts") => void;
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
  onLike?: (p: any) => void;
  onSuperLike?: (p: any) => void;
  selectedDateIdeaIndex?: number;
}



export default function ProfileBottomSheet(props: ProfileBottomSheetProps) {
  const navigate = useNavigate();
  const [showMapOverlay, setShowMapOverlay] = useState(false);

  
  return (
    <>
      <div
        className={`relative z-10 h-full w-full ${
          props.aboutMeTab === "received" && ["unlock:single", "unlock:pack3", "unlock:pack10"].includes(props.selectedUnlockItemKey)
            ? "px-0 py-0"
            : "px-2 py-2"
        }`}
      >
        <div
          className={`h-full w-full rounded-2xl bg-gradient-to-br from-fuchsia-900/25 via-black/35 to-purple-900/25 backdrop-blur-md border-2 border-fuchsia-300/25 ring-1 ring-fuchsia-300/15 shadow-[0_8px_24px_rgba(0,0,0,0.55)] flex ${
            props.aboutMeTab === "received" && ["unlock:single", "unlock:pack3", "unlock:pack10"].includes(props.selectedUnlockItemKey)
              ? "p-0 items-stretch justify-stretch rounded-none border-0 ring-0 shadow-none"
              : "px-4 py-3 items-center justify-center"
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
                        <div className="flex-1 flex flex-col items-center justify-center">
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
                      <div className="flex-1 overflow-x-auto overflow-y-hidden pt-2">
                        <div className="flex gap-2 h-full">
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
                    <div
                      className="h-full w-full overflow-y-auto scrollbar-pink"
                      style={{
                        padding: 0,
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(236,72,153,0.4) transparent",
                      }}
                    >
                      {(() => {
                        const places: Array<{ idea: string; url: string; google_url?: string; image_url: string | null; title: string | null }> =
                          (props.selectedProfile?.first_date_places && props.selectedProfile.first_date_places.length > 0)
                            ? props.selectedProfile.first_date_places.slice(0, 3)
                            : [];
                        
                        // Check if a date idea is actually selected
                        if (props.selectedDateIdeaIndex === null || props.selectedDateIdeaIndex === undefined) {
                          return (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center" }}>
                                Tap a date idea above to see details
                              </p>
                            </div>
                          );
                        }

                        const place = places[props.selectedDateIdeaIndex];

                        if (!place) return (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center" }}>
                              Date idea not found
                            </p>
                          </div>
                        );

                        const description = getDateIdeaDescription(place.idea);
                        const metadata = getDateIdeaMetadata(place.idea);
                        const mapUrl = place.google_url || place.url;

                        return (
                          <div style={{ padding: "0 4px", paddingBottom: 8, height: "100%", display: "flex", flexDirection: "column" }}>
                            {/* Title */}
                            <p style={{
                              color: "rgba(236,72,153,0.95)",
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              margin: "0 0 6px 0",
                            }}>
                              {place.idea}
                            </p>

                            {/* Description */}
                            <p style={{
                              color: "rgba(255,255,255,0.88)",
                              fontSize: 10,
                              lineHeight: 1.4,
                              margin: "0 0 8px 0",
                              fontWeight: 500,
                            }}>
                              {description}
                            </p>

                            {/* Quick Info Section */}
                            <div style={{
                              background: "rgba(236,72,153,0.08)",
                              border: "1px solid rgba(236,72,153,0.2)",
                              borderRadius: 8,
                              padding: "6px 8px",
                              marginBottom: 8,
                            }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <span style={{ fontSize: 11 }}>🏷️</span>
                                  <div>
                                    <p style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 600 }}>TYPE</p>
                                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.85)", margin: 0, fontWeight: 700 }}>{metadata.dateType}</p>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <span style={{ fontSize: 11 }}>⏱️</span>
                                  <div>
                                    <p style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 600 }}>DURATION</p>
                                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.85)", margin: 0, fontWeight: 700 }}>{metadata.duration}</p>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <span style={{ fontSize: 11 }}>💰</span>
                                  <div>
                                    <p style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 600 }}>COST</p>
                                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.85)", margin: 0, fontWeight: 700 }}>{metadata.costLevelIDR}</p>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <span style={{ fontSize: 11 }}>🌅</span>
                                  <div>
                                    <p style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 600 }}>BEST TIME</p>
                                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.85)", margin: 0, fontWeight: 700 }}>{metadata.bestTime}</p>
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(236,72,153,0.15)" }}>
                                <span style={{ fontSize: 11 }}>✨</span>
                                <div>
                                  <p style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 600 }}>VIBE</p>
                                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.85)", margin: 0, fontWeight: 700 }}>{metadata.vibe}</p>
                                </div>
                              </div>
                            </div>

                            {/* Why This Place Is Good - Show only 2 items */}
                            <div style={{ marginBottom: 8 }}>
                              <p style={{
                                fontSize: 8,
                                fontWeight: 800,
                                color: "rgba(236,72,153,0.9)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                margin: "0 0 4px 0",
                              }}>💝 Why This Date Works</p>
                              <ul style={{ margin: 0, paddingLeft: 14, listStyle: "none" }}>
                                {metadata.whyGoodDate.slice(0, 2).map((reason, idx) => (
                                  <li key={idx} style={{
                                    fontSize: 9,
                                    color: "rgba(255,255,255,0.75)",
                                    lineHeight: 1.4,
                                    marginBottom: 3,
                                    position: "relative",
                                    paddingLeft: 12,
                                  }}>
                                    <span style={{ position: "absolute", left: 0, color: "rgba(236,72,153,0.6)" }}>•</span>
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Conversation Starters - Show only 2 items */}
                            <div style={{ marginBottom: 8 }}>
                              <p style={{
                                fontSize: 8,
                                fontWeight: 800,
                                color: "rgba(236,72,153,0.9)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                margin: "0 0 4px 0",
                              }}>💬 Conversation Starters</p>
                              {metadata.conversationStarters.slice(0, 2).map((starter, idx) => (
                                <p key={idx} style={{
                                  fontSize: 9,
                                  color: "rgba(255,255,255,0.7)",
                                  lineHeight: 1.4,
                                  margin: "0 0 3px 0",
                                  fontStyle: "italic",
                                  paddingLeft: 8,
                                  borderLeft: "2px solid rgba(236,72,153,0.3)",
                                }}>
                                  "{starter}"
                                </p>
                              ))}
                            </div>

                            {/* Suggested Extras - Show only 2 items */}
                            {metadata.suggestedExtras.length > 0 && (
                              <div style={{ marginBottom: 8 }}>
                                <p style={{
                                  fontSize: 8,
                                  fontWeight: 800,
                                  color: "rgba(236,72,153,0.9)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  margin: "0 0 4px 0",
                                }}>🎁 Make It Extra Special</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  {metadata.suggestedExtras.slice(0, 2).map((extra, idx) => (
                                    <div key={idx} style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      padding: "4px 8px",
                                      background: "rgba(168,85,247,0.08)",
                                      border: "1px solid rgba(168,85,247,0.2)",
                                      borderRadius: 8,
                                    }}>
                                      <span style={{ fontSize: 12 }}>{extra.icon}</span>
                                      <p style={{
                                        fontSize: 9,
                                        color: "rgba(255,255,255,0.8)",
                                        margin: 0,
                                        fontWeight: 600,
                                        flex: 1,
                                      }}>{extra.text}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Safety Tip */}
                            <div style={{
                              background: "rgba(168,85,247,0.08)",
                              border: "1px solid rgba(168,85,247,0.2)",
                              borderRadius: 6,
                              padding: "6px 8px",
                              marginBottom: 6,
                            }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                                <span style={{ fontSize: 10, marginTop: 1 }}>🛡️</span>
                                <p style={{
                                  fontSize: 8,
                                  color: "rgba(255,255,255,0.6)",
                                  margin: 0,
                                  lineHeight: 1.4,
                                }}>
                                  <strong style={{ color: "rgba(168,85,247,0.9)" }}>Safety First:</strong> Always meet in public places for first dates. Use verified professionals from our platform for any services.
                                </p>
                              </div>
                            </div>

                            {/* Map Link */}
                            {mapUrl && (
                              <a
                                href={mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "rgba(236,72,153,0.8)",
                                  textDecoration: "none",
                                }}
                              >
                                📍 View on Maps →
                              </a>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : props.aboutMeTab === "gifts" ? (
                    <GiftSelector
                      userId={props.selectedProfile?.id || ""}
                      profileId={props.selectedProfile?.id || ""}
                      profileName={props.selectedProfile?.name || ""}
                      onGiftSent={() => {
                        // Refresh profile data or update UI
                        console.log("Gift sent to profile");
                      }}
                    />
                  ) : (
                    <div
                      className="h-full w-full overflow-y-auto scrollbar-pink"
                      style={{
                        padding: 0,
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(236,72,153,0.4) transparent",
                      }}
                    >
                      {(() => {
                        const basicInfo = (props.selectedProfile as any)?.basic_info as any || {};
                        const lifestyleInfo = (props.selectedProfile as any)?.lifestyle_info as any || {};
                        const relationshipGoals = (props.selectedProfile as any)?.relationship_goals as any || {};

                        const InfoRow = ({ icon, label, value }: { icon: string; label: string; value?: string }) =>
                          value ? (
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "4px 0",
                            }}>
                              <span style={{ fontSize: 13, width: 20, textAlign: "center", flexShrink: 0 }}>{icon}</span>
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 600, minWidth: 55, flexShrink: 0 }}>{label}</span>
                              <span style={{ fontSize: 11, color: "white", fontWeight: 600 }}>{value}</span>
                            </div>
                          ) : null;

                        const SectionTitle = ({ title }: { title: string }) => (
                          <p style={{
                            color: "rgba(255,255,255,0.3)",
                            fontSize: 8,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase" as const,
                            margin: "6px 0 2px 0",
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                            paddingBottom: 3,
                          }}>{title}</p>
                        );

                        if (!props.selectedProfileSection) {
                          return (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center" }}>
                                Select a section above to view details
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
                            <div style={{ padding: "0 2px" }}>
                              <SectionTitle title="Physical" />
                              <InfoRow icon="📏" label="Height" value={basicInfo.height} />
                              <InfoRow icon="💪" label="Body" value={basicInfo.body_type} />
                              <InfoRow icon="🌏" label="Ethnicity" value={basicInfo.ethnicity} />
                              <SectionTitle title="Background" />
                              <InfoRow icon="🎓" label="Education" value={basicInfo.education} />
                              <InfoRow icon="💼" label="Work" value={basicInfo.occupation} />
                              <InfoRow icon="💰" label="Income" value={basicInfo.income} />
                              <InfoRow icon="🏠" label="Lives with" value={basicInfo.lives_with} />
                              <InfoRow icon="👶" label="Children" value={basicInfo.children} />
                              {basicInfo.languages?.length > 0 && (
                                <>
                                  <SectionTitle title="Languages" />
                                  <InfoRow icon="🗣️" label="Speaks" value={basicInfo.languages.join(", ")} />
                                </>
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
                            <div style={{ padding: "0 2px" }}>
                              <SectionTitle title="Habits" />
                              <InfoRow icon="🚬" label="Smoking" value={lifestyleInfo.smoking} />
                              <InfoRow icon="🍷" label="Drinking" value={lifestyleInfo.drinking} />
                              <InfoRow icon="🏃" label="Exercise" value={lifestyleInfo.exercise} />
                              <InfoRow icon="🍽️" label="Diet" value={lifestyleInfo.diet} />
                              <InfoRow icon="🌙" label="Sleep" value={lifestyleInfo.sleep} />
                              <SectionTitle title="Personality" />
                              <InfoRow icon="🎭" label="Social" value={lifestyleInfo.social_style} />
                              <InfoRow icon="❤️" label="Love lang." value={lifestyleInfo.love_language} />
                              <InfoRow icon="🐾" label="Pets" value={lifestyleInfo.pets} />
                              <InfoRow icon="📱" label="Social" value={lifestyleInfo.social_media} />
                              {lifestyleInfo.hobbies?.length > 0 && (
                                <>
                                  <SectionTitle title="Hobbies" />
                                  <InfoRow icon="🎯" label="Enjoys" value={lifestyleInfo.hobbies.join(", ")} />
                                </>
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
                            <div style={{ padding: "0 2px" }}>
                              <SectionTitle title="Intention" />
                              <InfoRow icon="💍" label="Looking for" value={relationshipGoals.looking_for} />
                              <InfoRow icon="⏱️" label="Timeline" value={relationshipGoals.timeline} />
                              <InfoRow icon="🌹" label="Date type" value={relationshipGoals.date_type} />
                              <InfoRow icon="💔" label="Status" value={relationshipGoals.marital_status} />
                              <SectionTitle title="Religion & Culture" />
                              <InfoRow icon="🕌" label="Religion" value={relationshipGoals.religion} />
                              <InfoRow icon="🙏" label="Prayer" value={relationshipGoals.prayer} />
                              <InfoRow icon="👤" label="Hijab" value={relationshipGoals.hijab} />
                              <InfoRow icon="🤲" label="Partner rel." value={relationshipGoals.partner_religion} />
                              <SectionTitle title="Family & Tradition" />
                              <InfoRow icon="💛" label="Dowry" value={relationshipGoals.dowry} />
                              <InfoRow icon="👨‍👩‍👧" label="Family" value={relationshipGoals.family_involvement} />
                              <InfoRow icon="⚠️" label="Polygamy" value={relationshipGoals.polygamy} />
                              <InfoRow icon="📍" label="Relocate" value={relationshipGoals.relocate} />
                              {relationshipGoals.about_partner && (
                                <div style={{
                                  background: "rgba(245,158,11,0.08)",
                                  border: "1px solid rgba(245,158,11,0.25)",
                                  borderRadius: 10,
                                  padding: "6px 10px",
                                  marginTop: 6,
                                }}>
                                  <p style={{ color: "rgba(245,158,11,0.7)", fontSize: 8, fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 3 }}>Looking for in a partner</p>
                                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, lineHeight: 1.5, margin: 0 }}>{relationshipGoals.about_partner}</p>
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

      {/* Full-screen distance map overlay — portalled to body to escape overflow-hidden parents */}
      {showMapOverlay && createPortal(
        <AnimatePresence>
          <DistanceMapOverlay
            profile={props.selectedProfile}
            allProfiles={props.allProfiles}
            onClose={() => {
              setShowMapOverlay(false);
              props.setAboutMeTab("new");
            }}
            onLike={props.onLike ?? (() => {})}
            onSuperLike={props.onSuperLike ?? (() => {})}
          />
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
