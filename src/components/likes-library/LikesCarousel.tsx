import React from "react";
import { motion } from "framer-motion";
import { CalendarDays, Gift, Heart, MapPin, MoonStar, ShieldCheck, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import PromoCard from "../PromoCard";
import { PREMIUM_FEATURES, PremiumFeature } from "@/data/premiumFeatures";
import { isOnline } from "@/hooks/useOnlineStatus";
import { getUnlockPriceLabel } from "@/utils/unlockPrice";
import { CountdownBadge } from "@/components/likes-library/CountdownBadge";

type Tab = "sent" | "received" | "new" | "treat";

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
            <motion.button
              key={`tarot-${props.dailyTarot.cardId}-${props.dailyTarot.shown ? "shown" : "new"}-${idx}`}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: Math.min(idx * 0.04, 0.3) }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.onTarotOpen();
                window.setTimeout(() => props.onRevealDailyTarot?.(), 0);
              }}
              className="flex-shrink-0 cursor-pointer transition-all hover:scale-105 relative overflow-visible bg-transparent border-0"
              style={{ width: 80, height: 104 }}
              aria-label="Open your Daily Love Reading"
            >
              <div className="absolute inset-0 -z-10 blur-xl opacity-70">
                <div className="w-full h-full rounded-[18px] bg-[radial-gradient(circle_at_50%_70%,rgba(250,204,21,0.55),rgba(250,204,21,0.10),rgba(0,0,0,0)_70%)]" />
              </div>
              <motion.img
                src="https://ik.imagekit.io/7grri5v7d/T_1ddrrr-removebg-preview.png"
                alt="Tarot card"
                className="absolute inset-0 w-full h-full object-contain"
                decoding="async"
                loading="lazy"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.button>
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

        return (
          <motion.div
            key={`${props.tab}-${profile.id}`}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ delay: Math.min(idx * 0.04, 0.3) }}
            onClick={() => props.onSelectProfile(profile, props.currentList)}
            data-likes-library-profile-id={profile.id}
            className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer transition-all hover:scale-105 bg-black/50 backdrop-blur-md border relative ${props.tab === "received" && props.superLikeGlowProfileId === profile.id ? "border-amber-400/60 shadow-[0_0_16px_rgba(251,191,36,0.4)] ring-2 ring-amber-400/30" : "border-white/10"}`}
            style={{ width: 80 }}
          >
            {/* NEW badge */}
            {fresh && (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-amber-400 text-black text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-wide shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                  NEW
                </span>
              </div>
            )}

            {/* Available tonight glow — shown as moon badge only, no ring */}

            <div className="relative mt-1">
              {/* Dropped heart from butterfly — behind the profile who liked you */}
              {props.tab === "received" && props.heartDropProfileId === profile.id && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                  initial={{ y: -24, opacity: 1, scale: 1.2 }}
                  animate={{ y: 4, opacity: 0.85, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <Heart className="w-8 h-8 text-primary drop-shadow-lg" fill="currentColor" strokeWidth={1.5} />
                </motion.div>
              )}
              <img
                src={profile.avatar_url || profile.image}
                alt={profile.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/10 relative z-10"
              />
              {/* Heart when I liked this profile */}
              {iLikedThis && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 pointer-events-none">
                  <Heart className="w-6 h-6 text-primary drop-shadow-lg" fill="currentColor" />
                </div>
              )}
              {profile.is_rose && props.tab !== "new" && (
                <span className="absolute -top-1 -right-1 text-sm">❤️</span>
              )}
              {/* Plus-One badge — top-left corner, always visible */}
              {/* Single status badge — +1 beats Free Tonight */}
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
              {/* Single online dot - positioned based on badge presence */}
              {isOnline(profile.last_seen_at) && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-black shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
                </span>
              )}
            </div>

            <p className="text-white text-[10px] font-semibold truncate w-full text-center">
              {profile.name}, {profile.age}
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
