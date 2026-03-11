import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PREMIUM_FEATURES } from "@/data/premiumFeatures";
import { toast } from "sonner";

interface ProfileBottomSheetProps {
  isProfileRoute: boolean;
  aboutMeTab: "new" | "sent" | "received" | "treat";
  selectedUnlockItemKey: string;
  selectedProfile: any;
  setUnlockDialog: (v: any) => void;
  selectedTreatItem: string | null;
  selectedDatePlace: any | null;
  setSelectedDatePlace: (v: any) => void;
  selectedProfileSection: "basic" | "lifestyle" | "interests" | null;
}

export default function ProfileBottomSheet(props: ProfileBottomSheetProps) {
  const navigate = useNavigate();

  return (
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
                          onClick={() => { if (!props.selectedProfile) return; props.setUnlockDialog(props.selectedProfile); }}
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
                  <div className="w-full rounded-2xl bg-black/30 border border-fuchsia-300/20 px-5 py-5 flex flex-col items-center gap-3">
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
          <div className="h-full w-full flex flex-col gap-2">
            {(() => {
              const places = (props.selectedProfile?.first_date_places || []).filter(Boolean).slice(0, 3) as any[];

              if (places.length === 0) {
                return (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>No date ideas added yet</p>
                  </div>
                );
              }

              return (
                <>
                  {/* 3 tap cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {places.map((place, idx) => {
                      const img = place.image_url || "/placeholder.svg";
                      const isSelected = props.selectedDatePlace && props.selectedDatePlace.idea === place.idea && props.selectedDatePlace.title === place.title;
                      return (
                        <button
                          key={idx}
                          onClick={() => props.setSelectedDatePlace(isSelected ? null : place)}
                          style={{
                            borderRadius: 14,
                            overflow: "hidden",
                            border: isSelected ? "2px solid #EC4899" : "1px solid rgba(255,255,255,0.1)",
                            padding: 0,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            transform: isSelected ? "scale(0.96)" : "scale(1)",
                            background: "rgba(0,0,0,0.3)",
                          }}
                        >
                          <div style={{ position: "relative", width: "100%", aspectRatio: "4/5" }}>
                            <img src={img} alt={place.idea} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)" }} />
                            <p style={{
                              position: "absolute", bottom: 6, left: 6, right: 6,
                              color: "white", fontSize: 9, fontWeight: 800,
                              lineHeight: 1.2, margin: 0,
                            }}>{place.idea}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Detail window */}
                  <div style={{
                    flex: 1,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.2)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column" as const,
                    minHeight: 0,
                  }}>
                    {!props.selectedDatePlace ? (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>👆 Tap a date idea to see details</p>
                      </div>
                    ) : (
                      <>
                        <div style={{ position: "relative", height: 90, flexShrink: 0 }}>
                          <img src={props.selectedDatePlace.image_url || "/placeholder.svg"} alt={props.selectedDatePlace.idea} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92), transparent 50%)" }} />
                          <div style={{ position: "absolute", bottom: 8, left: 12, right: 12 }}>
                            <p style={{ color: "white", fontWeight: 800, fontSize: 13, margin: 0 }}>{props.selectedDatePlace.idea}</p>
                            {props.selectedDatePlace.title && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, margin: "2px 0 0" }}>{props.selectedDatePlace.title}</p>}
                          </div>
                        </div>
                        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column" as const, gap: 6, overflowY: "auto" as const }}>
                          {(props.selectedDatePlace.instagram_url || props.selectedDatePlace.url?.includes("instagram")) && (
                            <a href={props.selectedDatePlace.instagram_url || props.selectedDatePlace.url} target="_blank" rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", borderRadius: 10, background: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", color: "white", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
                              📸 View on Instagram
                            </a>
                          )}
                          {props.selectedDatePlace.google_url && (
                            <a href={props.selectedDatePlace.google_url} target="_blank" rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", borderRadius: 10, background: "rgba(66,133,244,0.2)", border: "1px solid rgba(66,133,244,0.4)", color: "white", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
                              📍 View on Google Maps
                            </a>
                          )}
                          {(props.selectedDatePlace.other_url || (props.selectedDatePlace.url && !props.selectedDatePlace.url.includes("instagram") && !props.selectedDatePlace.url.includes("google"))) && (
                            <a href={props.selectedDatePlace.other_url || props.selectedDatePlace.url} target="_blank" rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
                              🔗 View Place
                            </a>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
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
  );
}
