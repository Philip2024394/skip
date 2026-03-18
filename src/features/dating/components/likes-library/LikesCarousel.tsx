import React from "react";
import { motion } from "framer-motion";
import { CalendarDays, Gift, Heart, MapPin, MoonStar, ShieldCheck, Unlock } from "lucide-react";
import { isProfileLocked } from "@/features/dating/utils/profileLock";
import { Button } from "@/shared/components/button";
import PromoCard from "@/shared/components/PromoCard";
import { PREMIUM_FEATURES, PremiumFeature } from "@/data/premiumFeatures";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import { getUnlockPriceLabel } from "@/shared/utils/unlockPrice";
import { firstName } from "@/shared/utils";
import { CountdownBadge } from "@/features/dating/components/likes-library/CountdownBadge";

type Tab = "sent" | "received" | "new" | "treat" | "unlock" | "distance" | "gifts" | "video";

interface LikesCarouselProps {
  displayItemsWithTarot: any[];
  tab: Tab;
  scrollRef: React.RefObject<HTMLDivElement>;
  onSelectProfile: (profile: any, sourceList: any[]) => void;
  onTarotOpen: () => void;
  onRevealDailyTarot?: () => void;
  heartDropProfileId: string | null;
  superLikeGlowProfileId: string | null;
  activePromoIndex: number | null;
  onPurchaseFeature: (feature: PremiumFeature) => void;
  matches: any[];
  isNewProfile: (p: any) => boolean;
  iLiked: any[];
  currentList: any[];
  dailyTarot: any;
  onUnlock: (profile: any) => void;
}

export default function LikesCarousel(props: LikesCarouselProps) {
  return (
    <>
      {props.displayItemsWithTarot.map((item, idx) => {
        // ── Tarot card injection (uses the promo slot shape) ──
        if (props.dailyTarot && props.tab === "new" && item.type === "promo") {
          return (
            <motion.div
              key={`tarot-${props.dailyTarot.cardId}-${idx}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.onTarotOpen();
                window.setTimeout(() => props.onRevealDailyTarot?.(), 0);
              }}
              className="flex-shrink-0 cursor-pointer"
              style={{ width: 68 }}
              aria-label="Open your Daily Love Reading"
            >
              {/* Card image with subtle heartbeat glow — no container */}
              <motion.img
                src="https://ik.imagekit.io/7grri5v7d/tarot%20card%20backy.png?updatedAt=1773488446618"
                alt="Daily Tarot"
                className="w-full rounded-lg"
                style={{ filter: "drop-shadow(0 0 8px rgba(255,105,180,0.5))" }}
                animate={{
                  filter: [
                    "drop-shadow(0 0 6px rgba(255,105,180,0.4))",
                    "drop-shadow(0 0 14px rgba(255,105,180,0.7))",
                    "drop-shadow(0 0 6px rgba(255,105,180,0.4))",
                  ],
                  scale: [1, 1.04, 1],
                }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                decoding="async"
                loading="eager"
              />
            </motion.div>
          );
        }

        // ── Promo card ──
        if (item.type === "promo" && props.activePromoIndex !== null) {
          return (
            <PromoCard
              key={`promo-${props.activePromoIndex}`}
              feature={PREMIUM_FEATURES[props.activePromoIndex]}
              onPurchase={props.onPurchaseFeature}
            />
          );
        }

        const profile = item.profile;
        if (!profile) return null;

        const isMatch = props.matches.some((m) => m.id === profile.id);
        const fresh = props.tab === "new" && props.isNewProfile(profile);
        const iLikedThis = props.iLiked.some((p) => p.id === profile.id);
        const isSuperGlow = props.tab === "received" && props.superLikeGlowProfileId === profile.id;
        const locked = isProfileLocked(profile.id, profile.is_mock);

        // Red glow when ≤ 60 min remaining — computed synchronously, no hook needed
        const msLeft = profile.expires_at
          ? Math.max(0, new Date(profile.expires_at).getTime() - Date.now())
          : Infinity;
        const isUrgent = props.tab !== "new" && msLeft <= 3_600_000;

        return (
          <motion.div
            key={`${props.tab}-${profile.id}`}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ delay: Math.min(idx * 0.04, 0.3) }}
            onClick={locked ? undefined : () => props.onSelectProfile(profile, props.currentList)}
            data-likes-library-profile-id={profile.id}
            className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl transition-all bg-black/50 backdrop-blur-md border relative ${locked ? "cursor-default opacity-75" : "cursor-pointer hover:scale-105"} ${isSuperGlow ? "border-amber-400/60 super-like-heartbeat" : isUrgent ? "border-red-500/60" : locked ? "border-rose-900/60" : "border-white/10"}`}
            style={{
              width: 80,
              boxShadow: locked
                ? "0 0 10px 2px rgba(180,20,40,0.35), 0 0 0 1px rgba(180,20,40,0.2)"
                : isUrgent ? "0 0 10px 2px rgba(239,68,68,0.5), 0 0 0 1px rgba(239,68,68,0.3)" : undefined,
            }}
          >
            {/* NEW badge */}
            {fresh && (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-amber-400 text-black text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-wide shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                  NEW
                </span>
              </div>
            )}

            <div className="relative mt-1">
              <img
                src={profile.avatar_url || profile.image || "/placeholder.svg"}
                alt={profile.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/10 relative z-10"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.src !== window.location.origin + "/placeholder.svg") img.src = "/placeholder.svg";
                }}
              />
              {/* Lock badge — replaces heart when profile is in active WhatsApp lock */}
              {locked ? (
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-20"
                  style={{ background: "rgba(0,0,0,0.55)" }}>
                  <img
                    src="https://ik.imagekit.io/7grri5v7d/tr:bg-remove/profile%20locked.png"
                    alt="Locked"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      mixBlendMode: "screen",
                    }}
                    onError={(e) => {
                      // Fallback: show a lock emoji if image fails
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        (e.target as HTMLImageElement).style.display = "none";
                        parent.innerHTML += '<span style="font-size:22px;display:flex;align-items:center;justify-content:center;width:100%;height:100%">🔒</span>';
                      }
                    }}
                  />
                </div>
              ) : (
                /* Heart when I liked this profile */
                iLikedThis && (
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 pointer-events-none">
                    <Heart className="w-6 h-6 text-primary drop-shadow-lg" fill="currentColor" />
                  </div>
                )
              )}
              {profile.is_rose && props.tab !== "new" && (
                <span className="absolute -top-1 -right-1 text-sm">❤️</span>
              )}
              {/* Plus-One badge — top-left corner, always visible */}
              {profile.is_plusone ? (
                <span className="absolute -top-1 -left-1 bg-black border border-yellow-400/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(250,204,21,0.5)]">
                  <span className="text-yellow-300 font-black text-[7px] leading-none">+1</span>
                </span>
              ) : profile.generous_lifestyle ? (
                <span className="absolute -top-1 -left-1 bg-black border border-amber-400/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(245,158,11,0.5)]">
                  <Gift className="w-2.5 h-2.5 text-amber-300" />
                </span>
              ) : profile.weekend_plans ? (
                <span className="absolute -top-1 -left-1 bg-black border border-primary/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(180,80,150,0.5)]">
                  <CalendarDays className="w-2.5 h-2.5 text-primary" />
                </span>
              ) : profile.late_night_chat ? (
                <span className="absolute -top-1 -left-1 bg-black border border-indigo-400/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(99,102,241,0.5)]">
                  <MoonStar className="w-2.5 h-2.5 text-indigo-300" />
                </span>
              ) : profile.no_drama ? (
                <span className="absolute -top-1 -left-1 bg-black border border-yellow-400/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(250,204,21,0.5)]">
                  <ShieldCheck className="w-2.5 h-2.5 text-yellow-300" />
                </span>
              ) : props.tab === "new" && profile.available_tonight ? (
                <span className="absolute -top-1 -left-1 bg-black border border-yellow-400/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(250,204,21,0.5)]">🌙</span>
              ) : null}
              {/* Online dot */}
              {isOnline(profile.last_seen_at) && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-black shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
                </span>
              )}
            </div>

            <p className="text-white text-[10px] font-semibold truncate w-full text-center">
              {firstName(profile.name)}, {profile.age}
            </p>

            {props.tab === "new" ? (
              <p className="text-white/50 text-[8px] truncate w-full text-center flex items-center justify-center gap-0.5">
                <MapPin className="w-2 h-2 flex-shrink-0" />
                {profile.city || profile.country}
              </p>
            ) : (
              <p className="text-white/50 text-[9px] truncate w-full text-center">
                {profile.country}
              </p>
            )}

            {props.tab !== "new" && <CountdownBadge expiresAt={profile.expires_at} />}

            {isMatch && props.tab !== "new" && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onUnlock(profile);
                }}
                className="gradient-love text-primary-foreground border-0 text-[8px] h-5 px-1.5 mt-0.5 w-full"
                aria-label={`Unlock WhatsApp with ${profile.name}`}
              >
                <Unlock className="w-2.5 h-2.5 mr-0.5" /> {getUnlockPriceLabel(profile)}
              </Button>
            )}
          </motion.div>
        );
      })}
    </>
  );
}
