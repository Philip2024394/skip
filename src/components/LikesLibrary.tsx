import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Unlock, Clock, Sparkles, MapPin, Gift, CalendarDays, MoonStar, ShieldCheck } from "lucide-react";
import { Profile } from "./SwipeCard";
import TarotDrawer from "@/components/tarot/TarotDrawer";
import { useTarotState } from "@/components/tarot/useTarotState";
import LikesCarousel from "@/components/likes-library/LikesCarousel";
import { Button } from "@/components/ui/button";
import PromoCard from "./PromoCard";
import { PREMIUM_FEATURES, PremiumFeature } from "@/data/premiumFeatures";
import { isOnline } from "@/hooks/useOnlineStatus";
import { getUnlockPriceLabel } from "@/utils/unlockPrice";

// ── How "new" a profile is (joined in last 7 days) ────────────────────────────
const isNewProfile = (p: Profile) => {
  // Use created_at if available, fall back to last_seen_at for mock profiles
  const dateStr = (p as Profile & { created_at?: string }).created_at || p.last_seen_at;
  if (!dateStr) return false;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000; // joined within the last 7 days
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface LikesLibraryProps {
  title?: string;
  tabLabelOverrides?: Partial<Record<Tab, string>>;
  profileFirstDateIdea?: string | null;
  profileDatePlaces?: Profile["first_date_places"];
  onTabChange?: (tab: Tab) => void;
  selectedProfileSection?: "basic" | "lifestyle" | "interests";
  onSelectProfileSection?: (section: "basic" | "lifestyle" | "interests") => void;
  selectedUnlockItemKey?: string;
  onSelectUnlockItem?: (key: string) => void;
  selectedTreatItem?: TreatKey | null;
  onSelectTreatItem?: (key: TreatKey) => void;
  selectedDateIdeaIndex?: number;
  onSelectDateIdea?: (index: number) => void;
  iLiked: Profile[];
  likedMe: Profile[];
  newProfiles: Profile[];       // new: all profiles from Index, pre-filtered
  filterCountry?: string;       // new: active country filter so we can label it
  receivedHighlightProfileId?: string | null;  // when set, switch to "Likes Me" and butterfly is flying to this profile
  heartDropProfileId?: string | null;          // when set, show dropped heart on this profile's card (Likes Me tab)
  superLikeGlowProfileId?: string | null;     // when set, show yellow glow on this profile's card (Likes Me tab, first in list)
  dailyTarot?: {
    cardId: number;
    cardName: string;
    cardEmoji: string;
    reading: string;
    shown: boolean;
  } | null;
  onRevealDailyTarot?: () => void;
  hidePrivateTabs?: boolean;
  onUnlock: (profile: Profile) => void;
  onSelectProfile: (profile: Profile, sourceList: Profile[]) => void;
  onPurchaseFeature: (feature: PremiumFeature) => void;
}

type Tab = "sent" | "received" | "new" | "treat";
type DisplayItem =
  | { type: "profile"; profile: Profile }
  | { type: "promo"; profile: null };

// ── Tab pill config ───────────────────────────────────────────────────────────
const TAB_LABELS: Record<Tab, (counts: Record<Tab, number>) => string> = {
  new:      () => "New",
  sent:     () => "I Liked",
  received: () => "Likes Me",
  treat:    () => "Treat",
};
const TABS: Tab[] = ["new", "sent", "received", "treat"];

const TREAT_ITEMS = [
  { key: "massage",    emoji: "💆", label: "Massage",    desc: "Relaxing full-body massage",      image: "https://ik.imagekit.io/7grri5v7d/massage%20therapsy.png?updatedAt=1773339304480" },
  { key: "beautician", emoji: "💅", label: "Beautician",  desc: "Professional beauty treatment",  image: "https://ik.imagekit.io/7grri5v7d/beauty%20woman.png?updatedAt=1773339036755" },
  { key: "flowers",    emoji: "🌸", label: "Flowers",    desc: "Fresh flower bouquet",            image: "https://ik.imagekit.io/7grri5v7d/flowers%20nice.png?updatedAt=1773339411434" },
  { key: "jewelry",   emoji: "💎", label: "Jewelry",    desc: "Sparkling gift",                  image: "https://ik.imagekit.io/7grri5v7d/jewerlysss.png?updatedAt=1773338936919" },
] as const;
type TreatKey = typeof TREAT_ITEMS[number]["key"];

// ── Component ─────────────────────────────────────────────────────────────────
const LikesLibrary = ({
  title,
  tabLabelOverrides,
  profileFirstDateIdea,
  profileDatePlaces,
  onTabChange,
  selectedProfileSection,
  onSelectProfileSection,
  selectedUnlockItemKey,
  onSelectUnlockItem,
  selectedTreatItem,
  onSelectTreatItem,
  selectedDateIdeaIndex,
  onSelectDateIdea,
  iLiked, likedMe, newProfiles, filterCountry,
  dailyTarot,
  onRevealDailyTarot,
  hidePrivateTabs,
  receivedHighlightProfileId, heartDropProfileId, superLikeGlowProfileId,
  onUnlock, onSelectProfile, onPurchaseFeature,
 }: LikesLibraryProps) => {
  const [tab, setTab] = useState<Tab>("new");
  const [activePromoIndex, setActivePromoIndex] = useState<number | null>(null);
  const [promoPosition, setPromoPosition] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tarot = useTarotState();

  const matches = iLiked.filter((p) => likedMe.some((l) => l.id === p.id));

  // Sort new profiles: most recently seen first, cap at 30
  const sortedNew = useMemo(() =>
    [...newProfiles]
      .sort((a, b) => {
        const ta = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const tb = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 50),
  [newProfiles]);

  const currentList: Profile[] =
    tab === "sent"     ? iLiked :
    tab === "received" ? likedMe :
    sortedNew;

  const counts: Record<Tab, number> = {
    sent:     iLiked.length,
    received: likedMe.length,
    new:      sortedNew.length,
    treat:    0,
  };

  // Scroll back to left whenever tab changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    onTabChange?.(tab);
  }, [onTabChange, tab]);

  // When butterfly is flying to a profile, show "Likes Me" so the user sees who liked them
  useEffect(() => {
    if (receivedHighlightProfileId) setTab("received");
  }, [receivedHighlightProfileId]);



  // ── Promo rotation ──────────────────────────────────────────────
  const pickNewPromo = useCallback(() => {
    const idx = Math.floor(Math.random() * PREMIUM_FEATURES.length);
    setActivePromoIndex(idx);
    const maxPos = Math.max(0, currentList.length);
    setPromoPosition(Math.floor(Math.random() * (maxPos + 1)));
  }, [currentList.length]);

  useEffect(() => {
    const t = setTimeout(pickNewPromo, 2000);
    return () => clearTimeout(t);
  }, [pickNewPromo]);

  useEffect(() => {
    if (activePromoIndex === null) return;
    const t = setTimeout(pickNewPromo, 5000 + Math.random() * 5000);
    return () => clearTimeout(t);
  }, [activePromoIndex, pickNewPromo]);

  // ── Build display list (with promo injected, but NOT on new tab) ─
  const displayItems = useMemo((): DisplayItem[] => {
    const items: DisplayItem[] = currentList.map((p) => ({ type: "profile" as const, profile: p }));
    if (tab !== "new" && activePromoIndex !== null) {
      const pos = Math.min(promoPosition, items.length);
      items.splice(pos, 0, { type: "promo" as const, profile: null });
    }
    return items;
  }, [currentList, activePromoIndex, promoPosition, tab]);

  const displayItemsWithTarot = useMemo(() => {
    if (!dailyTarot) return displayItems;
    if (tab !== "new") return displayItems;

    // Always show exactly 1 tarot tile in the New carousel until the user reveals it.
    // Insert it near the start so new identities see it immediately.
    const items: DisplayItem[] = [...displayItems];
    const insertAt = Math.min(1, items.length);
    items.splice(insertAt, 0, { type: "promo" as const, profile: null } as any);
    return items;
  }, [dailyTarot, displayItems, tab]);

  // ── Swipe/scroll tabs on horizontal drag — header area only ────────────────
  const dragStart = useRef<{ x: number; y: number; tab: Tab } | null>(null);
  const handleTabAreaTouchStart = (e: React.TouchEvent) => {
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tab };
  };
  const handleTabAreaTouchEnd = (e: React.TouchEvent) => {
    if (!dragStart.current) return;
    const dx = e.changedTouches[0].clientX - dragStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - dragStart.current.y);
    // Only switch tabs if horizontal swipe is dominant (not a vertical scroll attempt)
    if (dy > Math.abs(dx)) { dragStart.current = null; return; }
    const idx = TABS.indexOf(dragStart.current.tab);
    if (dx < -50 && idx < TABS.length - 1) {
      const next = TABS[idx + 1];
      setTab(next);
      onTabChange?.(next);
    }
    if (dx > 50  && idx > 0) {
      const next = TABS[idx - 1];
      setTab(next);
      onTabChange?.(next);
    }
    dragStart.current = null;
  };

  // ── Empty-state copy ────────────────────────────────────────────
  const emptyText =
    tab === "new"      ? "Loading profiles..." :
    tab === "sent"     ? "Swipe up or down to like!" :
    "No likes yet — keep swiping!";

  const isDateIdeasTab =
    tab === "sent" &&
    tabLabelOverrides?.sent === "Date Ideas";

  const isProfileInfoTab =
    tab === "new" &&
    tabLabelOverrides?.new === "Profile";

  const isUnlockTab =
    tab === "received" &&
    tabLabelOverrides?.received === "Unlock";

  const isTreatTab =
    tab === "treat" &&
    tabLabelOverrides?.treat === "Treat";

  const dateIdeas = (
    (profileDatePlaces || [])
      .filter((p): p is NonNullable<typeof p> => !!p)
      .slice(0, 3)
  ) as NonNullable<Profile["first_date_places"]>;

  return (
    <div className="h-full flex flex-col">
      {/* ── Header — tab swipe gesture lives here only ── */}
      <div
        className="flex items-center justify-between mb-2 flex-shrink-0"
        onTouchStart={handleTabAreaTouchStart}
        onTouchEnd={handleTabAreaTouchEnd}
      >
        <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-primary" fill="currentColor" />
          {title ?? "Match"}
        </h2>

        {/* 3-tab pill */}
        <div className="relative flex gap-0 p-0.5 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          {(() => {
            const visibleTabs = hidePrivateTabs ? TABS.filter((t) => t !== "received") : TABS;
            const visibleIndex = Math.max(0, visibleTabs.indexOf(tab));
            const pct = 100 / visibleTabs.length;
            return (
              <>
          {/* Sliding background */}
          <motion.div
            className="absolute top-0.5 bottom-0.5 rounded-[10px] gradient-love"
            animate={{
              left: `calc(${visibleIndex} * ${pct}% + 2px)`,
              width: `calc(${pct}% - 4px)`,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          />
          {visibleTabs.map((t) => (
            <button
              key={t}
              onClick={() => {
                onTabChange?.(t);
                requestAnimationFrame(() => setTab(t));
              }}
              className={`relative z-10 py-1 px-1.5 rounded-[10px] text-[9px] font-semibold transition-colors min-w-[44px] text-center ${tab === t ? "text-white" : "text-white/40 hover:text-white/70"}`}
            >
              {tabLabelOverrides?.[t] ?? TAB_LABELS[t](counts)}
            </button>
          ))}
              </>
            );
          })()}
        </div>
      </div>

      {/* ── New profiles label ── */}
      <AnimatePresence>
        {tab === "new" && !isProfileInfoTab && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 mb-1.5 flex-shrink-0 overflow-hidden"
          >
            <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="text-[9px] text-white/50">
              {filterCountry
                ? `Recently active in ${filterCountry}`
                : "Recently active profiles — scroll to explore"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scrollable card row — native scroll, no tab-switch interference ── */}
      <div
        ref={scrollRef}
        className={`flex-1 [&::-webkit-scrollbar]:hidden ${
          isDateIdeasTab || isProfileInfoTab || isTreatTab
            ? "overflow-y-auto overflow-x-hidden"
            : "overflow-x-auto overflow-y-hidden"
        }`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          ...(isDateIdeasTab || isProfileInfoTab || isTreatTab
            ? { overscrollBehaviorY: "contain", touchAction: "pan-y" }
            : { overscrollBehaviorX: "contain", touchAction: "pan-x" }),
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className={(isDateIdeasTab || isProfileInfoTab || isTreatTab) ? "h-full py-1" : "flex gap-2 h-full py-1"}
          >
            {isProfileInfoTab ? (
              <div className="grid grid-cols-3 gap-2 h-full pb-2">
                {(
                  [
                    { key: "basic" as const, label: "Basic Info" },
                    { key: "lifestyle" as const, label: "Lifestyle" },
                    { key: "interests" as const, label: "Interests" },
                  ]
                ).map((s, idx) => (
                  <motion.button
                    key={s.key}
                    type="button"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.12) }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectProfileSection?.(s.key);
                    }}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] bg-black/50 backdrop-blur-md border relative w-full ${selectedProfileSection === s.key ? "border-fuchsia-300/50 ring-2 ring-fuchsia-300/20" : "border-white/10"}`}
                    style={{ height: 124 }}
                    aria-label={s.label}
                  >
                    <p className="text-white text-[11px] font-bold text-center leading-tight">{s.label}</p>
                    <p className="text-white/45 text-[9px] font-semibold text-center">Tap to view</p>
                  </motion.button>
                ))}
              </div>
            ) : isTreatTab ? (
              <div className="flex gap-2 h-full pb-2">
                {TREAT_ITEMS.map((item, idx) => (
                  <motion.button
                    key={item.key}
                    type="button"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ delay: Math.min(idx * 0.06, 0.18) }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectTreatItem?.(item.key);
                    }}
                    className={`relative overflow-hidden rounded-xl cursor-pointer transition-all hover:scale-[1.02] border flex-shrink-0 ${
                      selectedTreatItem === item.key
                        ? "border-fuchsia-300/50 ring-2 ring-fuchsia-300/20"
                        : "border-white/10"
                    }`}
                    style={{
                      height: 124, width: 110,
                      backgroundImage: `url(${item.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                    aria-label={item.label}
                  >
                    {/* dark overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.1) 100%)" }} />
                    {/* content */}
                    <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", padding: "0 6px 8px" }}>
                      <p className="text-white text-[11px] font-bold text-center leading-tight">{item.label}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : isUnlockTab ? (
              <div className="pr-1">
                <div className="flex gap-2 pb-2 min-w-max items-start">
                  {(
                    [
                      { key: "unlock:single", title: "1 Unlock", price: "$1.99", sub: "Match unlock" },
                      { key: "unlock:pack3", title: "3 Pack", price: "$4.99", sub: "Popular" },
                      { key: "unlock:pack10", title: "10 Pack", price: "$12.99", sub: "Best value" },
                      { key: "unlock:vip", title: "VIP", price: "$9.99/mo", sub: "10 / month" },
                      ...PREMIUM_FEATURES.filter((f) => f.id !== "vip").map((f) => ({
                        key: `feature:${f.id}`,
                        title: `${f.emoji} ${f.name}`,
                        price: f.price,
                        sub: f.description,
                      })),
                    ]
                  ).map((p, idx) => (
                    <motion.button
                      key={p.key}
                      type="button"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.12) }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectUnlockItem?.(p.key);
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] bg-black/50 backdrop-blur-md border relative flex-shrink-0 w-[140px] ${selectedUnlockItemKey === p.key ? "border-fuchsia-300/50 ring-2 ring-fuchsia-300/20" : "border-white/10"}`}
                      style={{ height: 100 }}
                      aria-label={p.title}
                    >
                      <p className="text-white text-[10px] font-black text-center leading-tight line-clamp-2">{p.title}</p>
                      <p className="text-white/80 text-[12px] font-black">{p.price}</p>
                      <p className="text-white/45 text-[9px] font-semibold text-center">{p.sub}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : isDateIdeasTab ? (
              dateIdeas.length === 0 && !profileFirstDateIdea ? (
                <div className="flex items-center justify-center h-full px-4">
                  <p className="text-white/40 text-xs text-center">No date ideas yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 h-full">
                  {dateIdeas.map((place, idx) => (
                    <motion.button
                      key={`date-idea-${idx}`}
                      type="button"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.12) }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectDateIdea?.(idx);
                      }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer transition-all hover:scale-[1.02] bg-black/50 backdrop-blur-md border relative w-full ${selectedDateIdeaIndex === idx ? "border-fuchsia-300/50 ring-2 ring-fuchsia-300/20" : "border-white/10"}`}
                      style={{ height: 124 }}
                      aria-label={place.idea || "Date idea"}
                    >
                      <div className="relative w-full flex-1 rounded-lg overflow-hidden">
                        <img
                          src={place.image_url || "/placeholder.svg"}
                          alt={place.idea}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                      </div>

                      <p className="text-white text-[9px] font-semibold leading-tight line-clamp-2 text-center w-full">
                        {place.idea || "Date idea"}
                      </p>

                      <p className="text-white/50 text-[8px] truncate w-full text-center">
                        {place.title || (place.url ? "Open" : "")}
                      </p>
                    </motion.button>
                  ))}

                  {dateIdeas.length === 0 && profileFirstDateIdea ? (
                    <div className="col-span-3 flex items-center justify-center px-4">
                      <div className="w-full rounded-xl bg-black/50 backdrop-blur-md border border-white/10 p-3">
                        <p className="text-white/70 text-[10px] font-semibold text-center">{profileFirstDateIdea}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            ) : displayItemsWithTarot.length === 0 ? (
              <div className="flex items-center justify-center flex-1 px-4">
                <p className="text-white/40 text-xs text-center">{emptyText}</p>
              </div>
            ) : (
              <LikesCarousel
                displayItemsWithTarot={displayItemsWithTarot}
                tab={tab}
                scrollRef={scrollRef}
                onSelectProfile={onSelectProfile}
                onTarotOpen={() => tarot.setShowTarotDrawer(true)}
                onRevealDailyTarot={onRevealDailyTarot}
                heartDropProfileId={heartDropProfileId ?? null}
                superLikeGlowProfileId={superLikeGlowProfileId ?? null}
                activePromoIndex={activePromoIndex}
                onPurchaseFeature={onPurchaseFeature}
                matches={matches}
                isNewProfile={isNewProfile}
                iLiked={iLiked}
                currentList={currentList}
                dailyTarot={dailyTarot}
                onUnlock={onUnlock}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Tab dot indicators removed — swipe tabs with finger ── */}

      <TarotDrawer
        showTarotDrawer={tarot.showTarotDrawer}
        setShowTarotDrawer={tarot.setShowTarotDrawer}
        showPremiumReading={tarot.showPremiumReading}
        setShowPremiumReading={tarot.setShowPremiumReading}
        premiumReadingType={tarot.premiumReadingType}
        setPremiumReadingType={tarot.setPremiumReadingType}
        premiumReadingResult={tarot.premiumReadingResult}
        setPremiumReadingResult={tarot.setPremiumReadingResult}
        premiumReadingLoading={tarot.premiumReadingLoading}
        setPremiumReadingLoading={tarot.setPremiumReadingLoading}
        selectedCards={tarot.selectedCards}
        setSelectedCards={tarot.setSelectedCards}
        revealedCards={tarot.revealedCards}
        setRevealedCards={tarot.setRevealedCards}
        madamZofeeReward={tarot.madamZofeeReward}
        setMadamZofeeReward={tarot.setMadamZofeeReward}
        showMadamZofee={tarot.showMadamZofee}
        setShowMadamZofee={tarot.setShowMadamZofee}
        showMadamZofeeParticles={tarot.showMadamZofeeParticles}
        setShowMadamZofeeParticles={tarot.setShowMadamZofeeParticles}
        tarotReaderSrc={tarot.tarotReaderSrc}
        setTarotReaderSrc={tarot.setTarotReaderSrc}
        showDailyTarotFront={tarot.showDailyTarotFront}
        setShowDailyTarotFront={tarot.setShowDailyTarotFront}
        tarotProgressStep={tarot.tarotProgressStep}
        setTarotProgressStep={tarot.setTarotProgressStep}
        tarotHeader={tarot.tarotHeader}
        setTarotHeader={tarot.setTarotHeader}
        tarotSequenceTimeoutsRef={tarot.tarotSequenceTimeoutsRef}
        dailyTarot={dailyTarot}
        onRevealDailyTarot={() => onRevealDailyTarot?.()}
        show={tarot.showTarotDrawer}
        onClose={() => tarot.setShowTarotDrawer(false)}
      />
    </div>
  );
};

export default LikesLibrary;
