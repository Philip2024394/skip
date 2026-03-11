import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DateIdeaDescription } from "./DateIdeaDescription";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PREMIUM_FEATURES } from "@/data/premiumFeatures";
import { toast } from "sonner";
import MassageDrawer from "@/components/overlays/MassageDrawer";

interface ProfileBottomSheetProps {
  // Profile data
  selectedProfile: any;
  isProfileRoute: boolean;
  // Tab state
  aboutMeTab: "new" | "sent" | "received" | "treat";
  setAboutMeTab: (v: "new" | "sent" | "received" | "treat") => void;
  selectedProfileSection: "basic" | "lifestyle" | "interests" | null;
  setSelectedProfileSection: (v: "basic" | "lifestyle" | "interests" | null) => void;
  selectedDatePlace: any;
  setSelectedDatePlace: (v: any) => void;
  selectedTreatItem: "massage" | "beautician" | "flowers" | "jewelry" | null;
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

export default function ProfileBottomSheet(props: ProfileBottomSheetProps) {
  const navigate = useNavigate();
  const [selectedDateIdea, setSelectedDateIdea] = useState<string | null>(null);
  const [isMassageDrawerOpen, setIsMassageDrawerOpen] = useState(false);

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
                      <p className="text-white/80 text-xs font-semibold text-center pb-3 border-b border-white/10">Treat</p>
                      <div className="flex-1 flex flex-col items-center justify-center px-1 pt-3">
                        {(() => {
                          const treats = [
                            { key: "massage",    emoji: "💆", label: "Massage",    detail: "A soothing full-body massage to help her unwind and feel pampered.", btn: "Gift Massage" },
                            { key: "beautician", emoji: "💅", label: "Beautician",  detail: "Professional nail, facial or hair treatment at a top salon.", btn: "Gift Beauty" },
                            { key: "flowers",    emoji: "🌸", label: "Flowers",    detail: "A beautiful hand-picked bouquet delivered fresh to her door.", btn: "Send Flowers" },
                            { key: "jewelry",    emoji: "💎", label: "Jewelry",    detail: "A sparkling piece of jewellery to make her feel truly special.", btn: "Gift Jewelry" },
                          ];
                          const item = treats.find((t) => t.key === props.selectedTreatItem) ?? treats[0];
                          return (
                            <div 
                              className={`w-full rounded-2xl bg-black/30 border border-fuchsia-300/20 px-5 py-5 flex flex-col items-center gap-3 ${item.key === 'massage' ? 'cursor-pointer hover:bg-black/40 transition-colors' : ''}`}
                              onClick={() => {
                                if (item.key === 'massage') {
                                  setIsMassageDrawerOpen(true);
                                }
                              }}
                            >
                              <span style={{ fontSize: 44 }}>{item.emoji}</span>
                              <p className="text-white font-black text-base text-center">{item.label}</p>
                              <p className="text-white/60 text-xs text-center leading-relaxed">{item.detail}</p>
                              <button
                                className="mt-1 w-full h-10 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white text-sm font-bold shadow-[0_0_14px_rgba(255,105,180,0.4)] hover:opacity-90 transition-opacity"
                                onClick={() => {}}
                              >
                                🎁 {item.btn}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : props.aboutMeTab === "sent" ? (
                    <div className="h-full w-full overflow-y-auto">
                      <DateIdeaDescription 
                        selectedDateIdea={selectedDateIdea}
                        className="px-4 py-4"
                      />
                      
                      {/* Date ideas selection area */}
                      <div className="px-4 py-4">
                        {/* Show user's selected date ideas if available, otherwise show default date ideas */}
                        {(props.selectedProfile?.selected_date_ideas && 
                         Array.isArray(props.selectedProfile.selected_date_ideas) && 
                         props.selectedProfile.selected_date_ideas.length > 0) ? (
                          <div className="space-y-3">
                            <h4 className="text-white/80 font-medium text-sm">
                              Your Selected Date Ideas:
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {props.selectedProfile.selected_date_ideas.map((idea: string, index: number) => (
                                <button
                                  key={index}
                                  onClick={() => setSelectedDateIdea(idea)}
                                  className={`text-left p-3 rounded-lg border transition-all ${
                                    selectedDateIdea === idea
                                      ? "bg-pink-500/20 border-pink-500/50 text-pink-300"
                                      : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                                  }`}
                                >
                                  <p className="text-sm font-medium">{idea}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <h4 className="text-white/80 font-medium text-sm">
                              Popular Date Ideas:
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {[
                                "Coffee At A Cozy Café ☕",
                                "Dinner At A Nice Restaurant 🍝",
                                "Walk In The Park 🌳",
                                "Night At The Cinema 🎬",
                                "Bowling Night Together 🎳",
                                "Watching The Stars Together ⭐"
                              ].map((idea, index) => (
                                <button
                                  key={index}
                                  onClick={() => setSelectedDateIdea(idea)}
                                  className={`text-left p-3 rounded-lg border transition-all ${
                                    selectedDateIdea === idea
                                      ? "bg-pink-500/20 border-pink-500/50 text-pink-300"
                                      : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                                  }`}
                                >
                                  <p className="text-sm font-medium">{idea}</p>
                                </button>
                              ))}
                            </div>
                            <div className="text-center pt-2">
                              <p className="text-white/40 text-xs">
                                This user hasn't selected their date ideas yet
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
      
      {/* Massage Drawer */}
      <MassageDrawer 
        isOpen={isMassageDrawerOpen} 
        onClose={() => setIsMassageDrawerOpen(false)} 
      />
    </>
  );
}
