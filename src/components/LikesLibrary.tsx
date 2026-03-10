import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Unlock, Clock, Sparkles, MapPin, Gift, CalendarDays, MoonStar, ShieldCheck } from "lucide-react";
import { Profile } from "./SwipeCard";
import { Button } from "@/components/ui/button";
import PromoCard from "./PromoCard";
import { PREMIUM_FEATURES, PremiumFeature } from "@/data/premiumFeatures";
import { isOnline } from "@/hooks/useOnlineStatus";
import { getUnlockPriceLabel } from "@/utils/unlockPrice";

const TAROT_CARD_BACK_URL = "https://ik.imagekit.io/7grri5v7d/tarot_cards-removebg-preview.png";
const TAROT_DRAWER_CARD_URL = "https://ik.imagekit.io/7grri5v7d/tarot_cards_new-removebg-preview.png";
const TAROT_READER_IMAGE_URL = "https://ik.imagekit.io/7grri5v7d/old_woman-removebg-preview.png";
const TAROT_READER_SEQUENCE: Array<{ src: string; durationMs: number }> = [
  { src: "https://ik.imagekit.io/7grri5v7d/old_woman-removebg-preview.png?updatedAt=1773149993777", durationMs: 4000 },
  { src: "https://ik.imagekit.io/7grri5v7d/tarot_card_woman_2-removebg-preview.png", durationMs: 3000 },
  { src: "https://ik.imagekit.io/7grri5v7d/tarot_card_woman_4-removebg-preview.png", durationMs: 2000 },
  { src: "https://ik.imagekit.io/7grri5v7d/tarot_card_woman_5-removebg-preview.png", durationMs: 2000 },
  { src: "https://ik.imagekit.io/7grri5v7d/tarot_card_woman_6-removebg-preview.png", durationMs: 2000 },
  { src: "https://ik.imagekit.io/7grri5v7d/tarot_card_woman_7-removebg-preview.png", durationMs: 2000 },
];
const TAROT_CARD_FRONT_IMAGES: Record<number, string> = {
  1: "https://ik.imagekit.io/7grri5v7d/T_1-removebg-preview.png",
  2: "https://ik.imagekit.io/7grri5v7d/Tha_magician-removebg-preview.png",
  3: "https://ik.imagekit.io/7grri5v7d/higher-removebg-preview.png",
  4: "https://ik.imagekit.io/7grri5v7d/empressd-removebg-preview.png",
  5: "https://ik.imagekit.io/7grri5v7d/emperor-removebg-preview.png",
  6: "https://ik.imagekit.io/7grri5v7d/higherfdsdfsdf-removebg-preview.png",
  7: "https://ik.imagekit.io/7grri5v7d/higherfdsdfsdfsss-removebg-preview.png",
  8: "https://ik.imagekit.io/7grri5v7d/higherfdsdfsdfssstertert-removebg-preview.png",
  9: "https://ik.imagekit.io/7grri5v7d/higherfdsdfsdfssstertertddd-removebg-preview.png",
};

// ── Countdown hook ────────────────────────────────────────────────────────────
const useCountdown = (expiresAt: string | null | undefined) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) { setTimeLeft(""); return; }
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setIsExpired(true); setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
      setIsExpired(false);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return { timeLeft, isExpired };
};

const CountdownBadge = ({ expiresAt }: { expiresAt: string | null | undefined }) => {
  const { timeLeft, isExpired } = useCountdown(expiresAt);
  if (!timeLeft) return null;
  return (
    <span className={`flex items-center gap-0.5 text-[8px] font-medium ${isExpired ? "text-destructive" : "text-accent"}`}>
      <Clock className="w-2.5 h-2.5" /> {timeLeft}
    </span>
  );
};

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
  onUnlock: (profile: Profile) => void;
  onSelectProfile: (profile: Profile, sourceList: Profile[]) => void;
  onPurchaseFeature: (feature: PremiumFeature) => void;
}

type Tab = "sent" | "received" | "new";
type DisplayItem =
  | { type: "profile"; profile: Profile }
  | { type: "promo"; profile: null };

// ── Tab pill config ───────────────────────────────────────────────────────────
const TAB_LABELS: Record<Tab, (counts: Record<Tab, number>) => string> = {
  new:      (c) => `New${c.new > 0 ? ` · ${c.new}` : ""}`,
  sent:     (c) => `I Liked${c.sent > 0 ? ` · ${c.sent}` : ""}`,
  received: (c) => `Likes Me${c.received > 0 ? ` · ${c.received}` : ""}`,
};
const TABS: Tab[] = ["new", "sent", "received"];

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
  selectedDateIdeaIndex,
  onSelectDateIdea,
  iLiked, likedMe, newProfiles, filterCountry,
  dailyTarot,
  onRevealDailyTarot,
  receivedHighlightProfileId, heartDropProfileId, superLikeGlowProfileId,
  onUnlock, onSelectProfile, onPurchaseFeature,
}: LikesLibraryProps) => {
  const [tab, setTab] = useState<Tab>("new");
  const [activePromoIndex, setActivePromoIndex] = useState<number | null>(null);
  const [promoPosition, setPromoPosition] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTarotDrawer, setShowTarotDrawer] = useState(false);
  const [showPremiumReading, setShowPremiumReading] = useState(false);
  const [premiumReadingType, setPremiumReadingType] = useState<string | null>(null);
  const [premiumReadingResult, setPremiumReadingResult] = useState<any | null>(null);
  const [premiumReadingLoading, setPremiumReadingLoading] = useState(false);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [tarotReaderSrc, setTarotReaderSrc] = useState(TAROT_READER_IMAGE_URL);
  const [showDailyTarotFront, setShowDailyTarotFront] = useState(false);
  const tarotSequenceTimeoutsRef = useRef<number[]>([]);

  const generateMadamZofeeReward = () => {
    const roll = Math.random();
    if (roll < 0.40) return {
      type: "superlike",
      amount: 1,
      claimed: false,
      message: "The stars have looked upon thy journey with great favour this day, dear seeker. As thy cards speak of patience and an open heart — so too shall the cosmos reward thy faith. Madam Zofee grants thee ONE Super Like from the ancient vault of love. Use it not in haste, but with intention deep as the ocean floor. For the soul who receives this blessing... may already feel thy presence drawing near. Go forth, brave heart. The universe conspires in thy favour.",
    };
    if (roll < 0.60) return {
      type: "superlike",
      amount: 3,
      claimed: false,
      message: "Rare indeed is the seeker who draws such fortune from the cosmic well. The ancient ones have whispered thy name three times this evening — and three times the stars answered. Madam Zofee bestows upon thee THREE Super Likes, drawn from the celestial reserve kept only for those whose hearts are pure of intention. Wield these blessings as an archer wields arrows — with patience, with stillness, with certainty. One who is worthy of thy heart already walks this earth. These gifts shall help thy paths align.",
    };
    if (roll < 0.75) return {
      type: "boost",
      amount: 1,
      claimed: false,
      message: "The veil between worlds grows thin this hour, dear seeker, and through it Madam Zofee sees thy light — a light that others have yet to fully witness. Today the ancient ones lift this light higher. Thy presence shall shine with greater radiance upon those who seek what only thou can offer. A Boost has been granted unto thee — thy profile shall rise like the morning star above the horizon. Go. Be seen. For the one who is meant for thee needs only to lay eyes upon thy face.",
    };
    if (roll < 0.90) return {
      type: "discount",
      amount: 50,
      claimed: false,
      message: "The cosmos rewards the faithful seeker not only with wisdom but with earthly gifts. Madam Zofee has consulted the ancient scrolls and finds thy name written among those deserving of favour. A sacred discount of fifty parts in a hundred has been inscribed in thy name. Present this blessing upon thy next reading or premium offering — for the path of love is long and the wise traveller accepts provisions wherever they are offered. Thou art not alone on this journey, dear soul.",
    };
    return {
      type: "wisdom",
      amount: 0,
      claimed: false,
      message: "Not all gifts arrive as gold or stars, dear seeker. Some arrive as knowing. Today Madam Zofee offers thee the rarest gift of all — clarity. The cards have spoken with unusual precision about thy love path. Carry their words not merely in thy mind but in the marrow of thy bones. Thy reward today is not a thing that can be held — it is a truth that shall guide every choice thy heart makes from this moment forward. The greatest treasure was always the wisdom. Go. Love fearlessly.",
    };
  };

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

  useEffect(() => {
    tarotSequenceTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    tarotSequenceTimeoutsRef.current = [];

    if (!showTarotDrawer) {
      setTarotReaderSrc(TAROT_READER_IMAGE_URL);
      setShowDailyTarotFront(false);
      return;
    }

    // Preload woman sequence frames so swaps don't flash blank while images load.
    TAROT_READER_SEQUENCE.forEach((step) => {
      const img = new Image();
      img.decoding = "async";
      img.src = step.src;
    });

    setShowDailyTarotFront(false);
    setTarotReaderSrc(TAROT_READER_SEQUENCE[0]?.src || TAROT_READER_IMAGE_URL);

    let cumulative = 0;
    TAROT_READER_SEQUENCE.forEach((step, idx) => {
      const timeoutId = window.setTimeout(() => {
        setTarotReaderSrc(step.src);
        if (idx === TAROT_READER_SEQUENCE.length - 1) {
          const revealId = window.setTimeout(() => setShowDailyTarotFront(true), step.durationMs);
          tarotSequenceTimeoutsRef.current.push(revealId);
        }
      }, cumulative);
      tarotSequenceTimeoutsRef.current.push(timeoutId);
      cumulative += step.durationMs;
    });

    return () => {
      tarotSequenceTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      tarotSequenceTimeoutsRef.current = [];
    };
  }, [showTarotDrawer]);

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
    if (dailyTarot.shown) return displayItems;
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
          {/* Sliding background */}
          <motion.div
            className="absolute top-0.5 bottom-0.5 rounded-[10px] gradient-love"
            animate={{ left: `calc(${TABS.indexOf(tab)} * 33.33% + 2px)`, width: "calc(33.33% - 4px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          />
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                onTabChange?.(t);
                requestAnimationFrame(() => setTab(t));
              }}
              className={`relative z-10 py-1 px-1.5 rounded-[10px] text-[9px] font-semibold transition-colors min-w-[56px] text-center ${
                tab === t ? "text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {tabLabelOverrides?.[t] ?? TAB_LABELS[t](counts)}
            </button>
          ))}
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
          isDateIdeasTab || isProfileInfoTab
            ? "overflow-y-auto overflow-x-hidden"
            : "overflow-x-auto overflow-y-hidden"
        }`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          ...(isDateIdeasTab || isProfileInfoTab
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
            className={(isDateIdeasTab || isProfileInfoTab) ? "h-full py-1" : "flex gap-2 h-full py-1"}
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
            ) : isUnlockTab ? (
              <div className="h-full pr-1">
                <div className="flex gap-2 pb-2 min-w-max">
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
              displayItemsWithTarot.map((item, idx) => {
                // ── Tarot card injection (uses the promo slot shape) ──
                if (dailyTarot && tab === "new" && item.type === "promo") {
                  return (
                    <motion.button
                      key={`tarot-${dailyTarot.cardId}-${dailyTarot.shown ? "shown" : "new"}-${idx}`}
                      type="button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowTarotDrawer(true);
                        window.setTimeout(() => onRevealDailyTarot?.(), 0);
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
                if (item.type === "promo" && activePromoIndex !== null) {
                  return (
                    <PromoCard
                      key={`promo-${activePromoIndex}`}
                      feature={PREMIUM_FEATURES[activePromoIndex]}
                      onPurchase={onPurchaseFeature}
                    />
                  );
                }

                const profile = item.profile;
                if (!profile) return null;
                const isMatch = matches.some((m) => m.id === profile.id);
                const fresh   = tab === "new" && isNewProfile(profile);
                const iLikedThis = iLiked.some((p) => p.id === profile.id);

                return (
                  <motion.div
                    key={`${tab}-${profile.id}`}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                    onClick={() => onSelectProfile(profile, currentList)}
                    data-likes-library-profile-id={profile.id}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer transition-all hover:scale-105 bg-black/50 backdrop-blur-md border relative ${tab === "received" && superLikeGlowProfileId === profile.id ? "border-amber-400/60 shadow-[0_0_16px_rgba(251,191,36,0.4)] ring-2 ring-amber-400/30" : "border-white/10"}`}
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
                      {tab === "received" && heartDropProfileId === profile.id && (
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
                      {profile.is_rose && tab !== "new" && (
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
                        <span className="absolute -top-1 -left-1 bg-black border border-teal-400/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(45,212,191,0.5)]">
                          <ShieldCheck className="w-2.5 h-2.5 text-teal-300" />
                        </span>
                      ) : tab === "new" && profile.available_tonight ? (
                        <span className="absolute -bottom-1 -right-1 text-[10px] bg-black border border-yellow-400/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(250,204,21,0.5)]">🌙</span>
                      ) : null}
                      {/* Green heartbeat dot — avoid overlap with moon badge */}
                      {isOnline(profile.last_seen_at) && !(profile.is_plusone) && !(profile.generous_lifestyle) && !(profile.weekend_plans) && !(profile.late_night_chat) && !(profile.no_drama) && !(tab === "new" && profile.available_tonight) && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-black shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
                        </span>
                      )}
                      {/* online dot when free tonight badge is showing — move to left */}
                      {isOnline(profile.last_seen_at) && !(profile.is_plusone) && tab === "new" && profile.available_tonight && (
                        <span className="absolute -bottom-0.5 -left-0.5 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-black shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
                        </span>
                      )}
                      {/* online dot when +1 / generous / weekend / late / no-drama badge is showing — move to bottom-right */}
                      {isOnline(profile.last_seen_at) && (profile.is_plusone || profile.generous_lifestyle || profile.weekend_plans || profile.late_night_chat || profile.no_drama) && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-black shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
                        </span>
                      )}
                    </div>

                    <p className="text-white text-[10px] font-semibold truncate w-full text-center">
                      {profile.name}, {profile.age}
                    </p>

                    {tab === "new" ? (
                      <p className="text-white/50 text-[8px] truncate w-full text-center flex items-center justify-center gap-0.5">
                        <MapPin className="w-2 h-2 flex-shrink-0" />
                        {profile.city || profile.country}
                      </p>
                    ) : (
                      <p className="text-white/50 text-[9px] truncate w-full text-center">
                        {profile.country}
                      </p>
                    )}

                    {tab !== "new" && <CountdownBadge expiresAt={profile.expires_at} />}

                    {isMatch && tab !== "new" && (
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onUnlock(profile); }}
                        className="gradient-love text-primary-foreground border-0 text-[8px] h-5 px-1.5 mt-0.5 w-full"
                        aria-label={`Unlock WhatsApp with ${profile.name}`}
                      >
                        <Unlock className="w-2.5 h-2.5 mr-0.5" /> {getUnlockPriceLabel(profile)}
                      </Button>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Tab dot indicators removed — swipe tabs with finger ── */}

      {showTarotDrawer && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowTarotDrawer(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              zIndex: 99990,
            }}
          />

          {/* Bottom Sheet */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 99999,
              borderRadius: "20px 20px 0 0",
              overflow: "hidden",
              maxHeight: "88vh",
              borderTop: "2px solid rgba(255,105,180,0.55)",
              boxShadow: "0 -4px 40px rgba(255,105,180,0.35)",
            }}
          >
            {/* Background image layer */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "url('https://ik.imagekit.io/7grri5v7d/grave%20yard.png')",
                backgroundSize: "cover",
                backgroundPosition: "center top",
                zIndex: 0,
              }}
            />

            {/* Dark gradient overlay — fades image into dark at bottom */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, rgba(10,0,20,0.55) 0%, rgba(10,0,20,0.75) 50%, rgba(10,0,20,0.95) 100%)",
                zIndex: 1,
              }}
            />

            {/* Right side vertical buttons */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: 44,
                zIndex: 99999,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "60px 0 24px",
                background: "linear-gradient(to left, rgba(10,0,20,0.8), transparent)",
              }}
            >
              {/* WhatsApp Share */}
              <button
                onClick={() => {
                  const text = `🔮 My Daily Love Reading:\n\n"${dailyTarot?.reading}"\n\n✨ Get your free reading at 2dateme.com`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(37,211,102,0.2)",
                  border: "1px solid rgba(37,211,102,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 18,
                }}
                title="Share on WhatsApp"
              >
                💚
              </button>

              {/* Close */}
              <button
                onClick={() => setShowTarotDrawer(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(180,80,180,0.2)",
                  border: "1px solid rgba(180,80,180,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "white",
                }}
              >
                ✕
              </button>

              {/* Premium Reading */}
              <button
                onClick={() => setShowPremiumReading(true)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,215,0,0.15)",
                  border: "1px solid rgba(255,215,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 18,
                }}
                title="Premium Reading"
              >
                🔮
              </button>
            </div>

            {/* Close button — small circle top right */}
            <button
              onClick={() => setShowTarotDrawer(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 99999,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(255,105,180,0.65)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
              }}
            >
              ✕
            </button>

            {/* Content */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "16px 20px 28px",
                overflowY: "auto",
                maxHeight: "88vh",
              }}
            >
              {/* Tarot woman — blends into background via mask */}
              <div
                style={{
                  position: "relative",
                  width: 160,
                  height: 160,
                  marginBottom: -8,
                  WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                  maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={tarotReaderSrc}
                    src={tarotReaderSrc}
                    alt="Tarot reader"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      objectPosition: "bottom",
                    }}
                    loading="lazy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                </AnimatePresence>
              </div>

              {/* Title */}
              <p
                style={{
                  color: "#FFD700",
                  fontSize: 13,
                  fontWeight: "bold",
                  letterSpacing: "0.1em",
                  marginBottom: 12,
                  textShadow: "0 0 12px rgba(255,215,0,0.5)",
                }}
              >
                ✨ Daily Love Reading
              </p>

              {/* Tarot card — face down until reveal */}
              {dailyTarot && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                  <AnimatePresence mode="wait">
                    {!showDailyTarotFront ? (
                      <motion.div
                        key="card-back"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, scale: [1, 1.03, 1] }}
                        exit={{ opacity: 0, rotateY: 90 }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                        style={{ position: "relative" }}
                      >
                        {/* Gold glow behind card */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            filter: "blur(20px)",
                            opacity: 0.6,
                            background:
                              "radial-gradient(circle at 50% 70%, rgba(250,204,21,0.65), transparent 70%)",
                            zIndex: -1,
                          }}
                        />
                        <img
                          src={TAROT_DRAWER_CARD_URL}
                          alt="Card back"
                          style={{ width: 140, height: 185, objectFit: "contain" }}
                          decoding="async"
                          loading="lazy"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="card-front"
                        initial={{ opacity: 0, rotateY: -90 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        {TAROT_CARD_FRONT_IMAGES[1] ? (
                          <img
                            src={TAROT_CARD_FRONT_IMAGES[1]}
                            alt="The Fool"
                            style={{ width: 140, height: 185, objectFit: "contain" }}
                            decoding="async"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            style={{
                              width: 140,
                              height: 185,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 64,
                            }}
                          >
                            {dailyTarot.cardEmoji}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Card info — only shows after card flips */}
                  <AnimatePresence>
                    {showDailyTarotFront && (
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        style={{
                          marginTop: 16,
                          width: "100%",
                          borderRadius: 16,
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          backdropFilter: "blur(12px)",
                          padding: "14px 16px",
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            color: "#FFD700",
                            fontWeight: "bold",
                            fontSize: 13,
                            marginBottom: 8,
                            textShadow: "0 0 8px rgba(255,215,0,0.4)",
                          }}
                        >
                          {dailyTarot.cardName}
                        </p>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.88)",
                            fontSize: 13,
                            lineHeight: 1.7,
                          }}
                        >
                          {dailyTarot.reading}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LikesLibrary;
