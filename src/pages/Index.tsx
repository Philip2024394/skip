import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence, PanInfo, useMotionValue, animate } from "framer-motion";
import { Heart, MapPin, Zap, LogIn, MessageCircle, SlidersHorizontal, Fingerprint, Home, ChevronLeft, ChevronRight, Star, ShieldCheck } from "lucide-react";
import AppLogo from "@/components/AppLogo";
import { Profile } from "@/components/SwipeCard";
import SwipeStack from "@/components/SwipeStack";
import LikesLibrary from "@/components/LikesLibrary";
import FloatingLikeParticles from "@/components/FloatingLikeParticles";
import { generateIndonesianProfiles } from "@/data/indonesianProfiles";
import { toast } from "sonner";
import { getPrimaryBadgeKey } from "@/utils/profileBadges";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PREMIUM_FEATURES, PremiumFeature } from "@/data/premiumFeatures";
import FeaturePurchaseDialog from "@/components/FeaturePurchaseDialog";
import FilterPanel, { FilterState, defaultFilters } from "@/components/FilterPanel";
import { isOnline } from "@/hooks/useOnlineStatus";
import GuestAuthPrompt from "@/components/GuestAuthPrompt";
import TermsAcceptanceDialog from "@/components/TermsAcceptanceDialog";
import TreatOverlay from "@/components/overlays/TreatOverlay";
import AppDialogs from "@/components/overlays/AppDialogs";
import DailyMatchSuggestion, { shouldShowDailyMatch, markDailyMatchShown } from "@/components/overlays/DailyMatchSuggestion";
import ProfileBottomSheet from "@/components/profile-view/ProfileBottomSheet";
import ProfileInfoPanel from "@/components/profile-view/ProfileInfoOverlay";
import ProfileImagesPanel from "@/components/profile-view/ProfileImagesPanel";
import DateIdeaDetailPanel from "@/components/profile-view/DateIdeaDetailPanel";
import TreatDetailPanel from "@/components/profile-view/TreatDetailPanel";
import { useLanguage } from "@/i18n/LanguageContext";
import { LIKE_EXPIRY_MS, ROSE_RESET_DAYS, MS_PER_DAY, APP_NAME } from "@/lib/constants";
import { isNetworkError } from "@/utils/payments";
import { hasUnlockBadges } from "@/utils/unlockPrice";
import { useDevFeatures, isDevBuild } from "@/hooks/useDevFeatures";
import { useSwipeActions } from "@/hooks/useSwipeActions";
import { useAuthAndProfiles } from "@/hooks/useAuthAndProfiles";
import { useRealtimeLikes } from "@/hooks/useRealtimeLikes";
import { useProfileData } from "@/hooks/useProfileData";
import { useDailyTarot } from "@/hooks/useDailyTarot";
import { InfoChip, Section, ContainerBlock } from "@/components/ui/SwipeUIComponents";
import { getTarotCardById } from "@/data/tarotCards";
import TopCard from "@/components/swipe/TopCard";
import { useVideoCall } from "@/hooks/useVideoCall";
import VideoCallScreen from "@/components/VideoCallScreen";
import IncomingCallScreen from "@/components/video/IncomingCallScreen";
import logoHeart from "@/assets/logo-heart.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlaskConical, Sparkles, X } from "lucide-react";

const LOCAL_LIKES_KEY = "local-liked-profiles";
const LOCAL_LIKED_ME_KEY = "local-liked-me-profiles";

const getLocalLikedProfiles = (): Profile[] => {
  try {
    const raw = localStorage.getItem(LOCAL_LIKES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Profile[];
    const now = Date.now();
    return parsed.filter((p) => !p.expires_at || new Date(p.expires_at).getTime() > now);
  } catch {
    return [];
  }
};

const getLocalLikedMeProfiles = (): Profile[] => {
  try {
    const raw = localStorage.getItem(LOCAL_LIKED_ME_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Profile[];
    const now = Date.now();
    return parsed.filter((p) => !p.expires_at || new Date(p.expires_at).getTime() > now);
  } catch {
    return [];
  }
};

const upsertLocalLikedProfile = (profile: Profile) => {
  try {
    const localLikes = getLocalLikedProfiles();
    const merged = [profile, ...localLikes.filter((p) => p.id !== profile.id)].slice(0, 100);
    localStorage.setItem(LOCAL_LIKES_KEY, JSON.stringify(merged));
  } catch {
    // no-op
  }
};

const saveLocalLikedMeProfiles = (profiles: Profile[]) => {
  try {
    localStorage.setItem(LOCAL_LIKED_ME_KEY, JSON.stringify(profiles.slice(0, 100)));
  } catch {
    // no-op
  }
};


import PackageTermsOverlay from "@/components/overlays/PackageTermsOverlay";

// ── Home page package detail (shown in bottom card when unlock item selected) ──
const UNLOCK_BG_IMAGE    = "https://ik.imagekit.io/7grri5v7d/match%20unlockssss.png?updatedAt=1773231173310";
const VIP_BG_IMAGE       = "https://ik.imagekit.io/7grri5v7d/vip%20matches.png?updatedAt=1773414288279";
const BOOST_BG_IMAGE     = "https://ik.imagekit.io/7grri5v7d/rocket%20boost.png?updatedAt=1773414413248";
const VERIFIED_BG_IMAGE  = "https://ik.imagekit.io/7grri5v7d/vip%20profiles.png";
const SPOTLIGHT_BG_IMAGE = "https://ik.imagekit.io/7grri5v7d/spot%20light.png";
const INCOGNITO_BG_IMAGE = "https://ik.imagekit.io/7grri5v7d/incognito.png";

const HOME_UNLOCK_PACKAGES = [
  { key: "unlock:single",   emoji: "💬", name: "1 Match Unlock",  price: "$1.99",     desc: "Unlock WhatsApp after you both match. Fast, simple, direct.",       sub: "Requires a mutual match",      btn: "Unlock Now",   bgImage: UNLOCK_BG_IMAGE },
  { key: "unlock:pack3",    emoji: "💬", name: "3 Unlock Pack",    price: "$4.99",     desc: "Perfect for a week of real connections. Save vs singles.",           sub: "Best for active users",        btn: "Get Pack",     bgImage: UNLOCK_BG_IMAGE },
  { key: "unlock:pack10",   emoji: "💬", name: "10 Unlock Pack",   price: "$12.99",    desc: "Best value for heavy matching. Lowest cost per unlock.",             sub: "Best value · never expire",    btn: "Get Pack",     bgImage: UNLOCK_BG_IMAGE },
  { key: "unlock:vip",      emoji: "👑", name: "VIP Monthly",      price: "$10.99/mo", desc: "7 unlocks + 5 Super Likes + VIP badge. Save 54%.",                  sub: "Auto-renews monthly",          btn: "Go VIP",       bgImage: VIP_BG_IMAGE },
  { key: "unlock:superlike",emoji: "⭐", name: "Super Like",       price: "$1.99",     desc: "Flash in their library first! They get notified.",                  sub: "One-time purchase",            btn: "Get",          bgImage: null },
  { key: "unlock:boost",    emoji: "🚀", name: "Profile Boost",    price: "$1.99",     desc: "Top of swipe stack for 1 hour. 5–10× more views!",                  sub: "Activates immediately · 1 hr", btn: "Boost Now",    bgImage: BOOST_BG_IMAGE },
  { key: "unlock:verified", emoji: "✅", name: "Verified Badge",   price: "$1.99",     desc: "Get verified. Rank higher & build trust.",                          sub: "Permanent badge",              btn: "Get Verified", bgImage: VERIFIED_BG_IMAGE },
  { key: "unlock:incognito",emoji: "👻", name: "Incognito Mode",   price: "$2.99",     desc: "Browse profiles invisibly for 24 hours.",                           sub: "Activates immediately · 24 hr",btn: "Go Incognito", bgImage: INCOGNITO_BG_IMAGE },
  { key: "unlock:spotlight",emoji: "🌟", name: "Spotlight",        price: "$4.99",     desc: "Featured at top of everyone's stack for 24 hours!",                 sub: "Activates immediately · 24 hr",btn: "Get Spotlight",bgImage: SPOTLIGHT_BG_IMAGE },
];

function HomePackageDetail({ packageKey, onClose }: { packageKey: string; onClose: () => void }) {
  const [showTerms, setShowTerms] = useState(false);
  const pkg = HOME_UNLOCK_PACKAGES.find((p) => p.key === packageKey);
  if (!pkg) return null;

  const bgImage = pkg.bgImage;

  return (
    <>
      <div
        className="h-full w-full flex flex-col relative overflow-hidden"
        style={bgImage
          ? { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
          : { background: "linear-gradient(160deg, #0a0014 0%, #1a0030 50%, #050008 100%)" }
        }
      >
        {/* glow orb for non-image packages */}
        {!bgImage && (
          <div style={{ position: "absolute", top: 40, left: "50%", transform: "translateX(-50%)", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,72,199,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
        )}

        {/* dark overlay for readability on image */}
        {bgImage && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0.1) 100%)", pointerEvents: "none" }} />
        )}

        {/* close */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/70 text-xs font-black" style={{ backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>✕</button>

        {/* content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-end px-5 pb-4 text-center gap-2">
          <span style={{ fontSize: bgImage ? 36 : 40 }}>{pkg.emoji}</span>
          <p className="text-white font-black leading-tight" style={{ fontSize: 17, margin: 0 }}>{pkg.name}</p>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, lineHeight: 1.5, margin: 0, maxWidth: 260 }}>{pkg.desc}</p>

          {/* price + buy */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 280, marginTop: 4 }}>
            <p style={{ color: "#fff", fontWeight: 900, fontSize: 22, margin: 0 }}>{pkg.price}</p>
            <button
              style={{ padding: "8px 18px", borderRadius: 22, fontWeight: 900, fontSize: 12, color: "#fff", border: "none", cursor: "pointer", background: "linear-gradient(135deg, rgba(232,72,199,0.95), rgba(195,60,255,0.95))", boxShadow: "0 4px 18px rgba(195,60,255,0.4)" }}
            >
              {pkg.btn}
            </button>
          </div>

          {/* sub label + T&C */}
          <div style={{ width: "100%", maxWidth: 280, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <p style={{ color: "rgba(255,255,255,0.42)", fontSize: 9.5, fontWeight: 600, margin: 0 }}>{pkg.sub}</p>
            <button onClick={() => setShowTerms(true)}
              style={{ color: "rgba(232,72,199,0.75)", fontSize: 9, fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", whiteSpace: "nowrap", padding: 0 }}>
              Terms &amp; Conditions
            </button>
          </div>
        </div>
      </div>

      {/* T&C overlay */}
      <PackageTermsOverlay show={showTerms} onClose={() => setShowTerms(false)} highlightPackage={packageKey} />
    </>
  );
}

const Index = () => {
  const { t, toggleLocale, locale } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const isProfileRoute = location.pathname.startsWith("/profile/");
  const profileRouteId = isProfileRoute ? (params as any).id : undefined;
  const DEV_MOCK_USER = import.meta.env.DEV
    ? { id: "dev-user-001", email: "admin@2dateme.com", user_metadata: { name: "Dev Admin" } }
    : null;
  const [user, setUser] = useState<any>(() => import.meta.env.DEV ? DEV_MOCK_USER : null);
  const [userGender, setUserGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => {
    if (import.meta.env.DEV) return false;
    try {
      return !sessionStorage.getItem("2dateme_profiles_cache");
    } catch { return true; }
  });
  const [dbProfiles, setDbProfiles] = useState<Profile[]>(() => {
    try {
      const cached = sessionStorage.getItem("2dateme_profiles_cache");
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => defaultFilters);

  // Handle signin/register URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signin") === "1") {
      showGuestPrompt("generic");
      // Clean up the URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("register") === "1") {
      showGuestPrompt("generic");
      // Clean up the URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Fallback mock profiles if no real DB profiles with images exist
  const mockProfiles = useMemo(() => generateIndonesianProfiles(50), []);
  // In production (VITE_USE_MOCK_PROFILES !== "true"), only show real DB profiles
  const useMocks = import.meta.env.VITE_USE_MOCK_PROFILES === "true" || import.meta.env.DEV;
  const allProfiles = dbProfiles.length > 0 ? dbProfiles : (useMocks ? mockProfiles : []);

  // Apply filters
  const filteredProfiles = useMemo(() => {
    return allProfiles.filter((p) => {
      if (filters.country && p.country?.toLowerCase() !== filters.country.toLowerCase()) return false;
      if (filters.city && !p.city?.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (p.age < filters.ageRange[0] || p.age > filters.ageRange[1]) return false;
      if (filters.gender && p.gender?.toLowerCase() !== filters.gender.toLowerCase()) return false;
      if (filters.lookingFor && p.looking_for?.toLowerCase() !== filters.lookingFor.toLowerCase()) return false;
      if (filters.orientation && p.orientation?.toLowerCase() !== filters.orientation.toLowerCase()) return false;
      if (filters.availableTonight && !p.available_tonight) return false;
      if (filters.onlineNow && !isOnline(p.last_seen_at)) return false;
      if (filters.plusOne && !(p as { is_plusone?: boolean }).is_plusone) return false;
      if (filters.generousLifestyle && !(p as { generous_lifestyle?: boolean }).generous_lifestyle) return false;
      if (filters.weekendPlans && !(p as { weekend_plans?: boolean }).weekend_plans) return false;
      if (filters.lateNightChat && !(p as { late_night_chat?: boolean }).late_night_chat) return false;
      if (filters.noDrama && !(p as { no_drama?: boolean }).no_drama) return false;
      return true;
    });
  }, [allProfiles, filters]);

  // ── Stable randomised queue ──────────────────────────────────────────────
  // Shuffled ONCE per session. Persists across dashboard/map navigation via
  // sessionStorage so the same order isn't replayed on remount.
  // seenIds tracks which profiles have already been shown; they cycle back
  // only when every profile has been seen (endless loop feel).
  const shuffledQueueRef = useRef<Profile[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  // Increment to force topProfiles/bottomProfiles to recompute after queue changes
  const [queueTick, setQueueTick] = useState(0);

  const fisherYates = (arr: Profile[]): Profile[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Build/restore the queue whenever filteredProfiles changes
  useEffect(() => {
    if (filteredProfiles.length === 0) return;
    const storageKey = "swipe_queue_ids";
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      // Restore order from session, mapping ids back to current profiles
      const ids: string[] = JSON.parse(stored);
      const profileMap = new Map(filteredProfiles.map(p => [p.id, p]));
      const restored = ids.map(id => profileMap.get(id)).filter(Boolean) as Profile[];
      // Add any new profiles not in the stored queue at random positions
      const newProfiles = filteredProfiles.filter(p => !ids.includes(p.id));
      const combined = [...restored, ...fisherYates(newProfiles)];
      shuffledQueueRef.current = combined;
    } else {
      // First visit this session — shuffle fresh
      shuffledQueueRef.current = fisherYates(filteredProfiles);
      sessionStorage.setItem(storageKey, JSON.stringify(shuffledQueueRef.current.map(p => p.id)));
    }

    // Restore seen ids from sessionStorage
    const seenStored = sessionStorage.getItem("swipe_seen_ids");
    if (seenStored) seenIdsRef.current = new Set(JSON.parse(seenStored));

    // Trigger recompute of topProfiles/bottomProfiles
    setQueueTick(t => t + 1);
  }, [filteredProfiles]);

  // Advance the queue — called by SwipeStack on each pass/like
  const advanceQueue = useCallback((profileId: string) => {
    seenIdsRef.current.add(profileId);
    // Persist seen ids
    sessionStorage.setItem("swipe_seen_ids", JSON.stringify([...seenIdsRef.current]));
    // If all profiles seen, reset seen list and re-shuffle for a fresh loop
    if (seenIdsRef.current.size >= shuffledQueueRef.current.length) {
      seenIdsRef.current = new Set();
      sessionStorage.removeItem("swipe_seen_ids");
      shuffledQueueRef.current = fisherYates(filteredProfiles);
      sessionStorage.setItem("swipe_queue_ids", JSON.stringify(shuffledQueueRef.current.map(p => p.id)));
    }
    // Trigger re-render so topProfiles/bottomProfiles recompute
    setQueueTick(t => t + 1);
  }, [filteredProfiles]);

  // Derive ordered top/bottom from the stable queue, skipping seen profiles
  const { topProfiles, bottomProfiles } = useMemo(() => {
    // Use filteredProfiles as immediate fallback before queue is built (first render)
    const queue = shuffledQueueRef.current.length > 0 ? shuffledQueueRef.current : filteredProfiles;
    const unseen = queue.filter(p => !seenIdsRef.current.has(p.id));
    // If all seen (race condition), use full queue
    const pool = unseen.length > 0 ? unseen : queue;
    const top: Profile[] = [];
    const bottom: Profile[] = [];
    pool.forEach((p, i) => {
      if (i % 2 === 0) top.push(p);
      else bottom.push(p);
    });
    // Guarantee neither stack is ever blank — fall back to the other (reversed) if empty
    const safeTop    = top.length > 0    ? top    : bottom.slice().reverse();
    const safeBottom = bottom.length > 0 ? bottom : top.slice().reverse();
    return { topProfiles: safeTop, bottomProfiles: safeBottom };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProfiles, queueTick]);

  // topIndex/bottomIndex removed — managed inside SwipeStack
  const [iLiked, setILiked] = useState<Profile[]>([]);
  const [likedMe, setLikedMe] = useState<Profile[]>([]);
  const [matchDialog, setMatchDialog] = useState<Profile | null>(null);
  const [unlockDialog, setUnlockDialog] = useState<Profile | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [roseAvailable, setRoseAvailable] = useState(true);
  const [featureDialog, setFeatureDialog] = useState<PremiumFeature | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [lastRoseAt, setLastRoseAt] = useState<string | null>(null);
  const [superLikesCount, setSuperLikesCount] = useState<number>(0);
  const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
  const [showReferralPopup, setShowReferralPopup] = useState(false);

  const DAILY_CARD_KEY_BASE = "dailyTarotCard";
  
  const sessionStatsRef = useRef({
    viewed: 0,
    liked: 0,
    passed: 0,
    viewCountsById: {} as Record<string, number>,
    focusedOnOne: false,
    lastViewedId: null as string | null,
    sessionStartAt: Date.now(),
  });
  const [sessionTick, setSessionTick] = useState(0);
  const [daysSinceLastActive, setDaysSinceLastActive] = useState<number>(0);
  const [selectedList, setSelectedList] = useState<Profile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const topCardX = useMotionValue(0);
  const isAnimatingTopCardRef = useRef(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const welcomeBackName = useRef<string>("");

  const libraryRef = useRef<HTMLDivElement>(null);
  const prevLikedMeIdsRef = useRef<Set<string>>(new Set());
  const [likeParticlesActive, setLikeParticlesActive] = useState(false);
  const [superLikeParticlesActive, setSuperLikeParticlesActive] = useState(false);
  const [superLikeRevealProfile, setSuperLikeRevealProfile] = useState<Profile | null>(null);
  const [superLikeGlowProfileId, setSuperLikeGlowProfileId] = useState<string | null>(null);

  const [devFeaturesEnabled, setDevFeaturesEnabled] = useDevFeatures();
  const [devPanelOpen, setDevPanelOpen] = useState(false);

  // Video call system
  const videoCall = useVideoCall(user?.id || null);

  // Daily match suggestion
  const [dailyMatchProfile, setDailyMatchProfile] = useState<any | null>(null);

  const POST_LOGIN_LANDING_KEY = "post_login_landing_dismissed";
  const [showPostLoginLanding, setShowPostLoginLanding] = useState(false);

  const REFERRAL_POPUP_SHOWN_KEY = "referralPopupShown";
  const SUPER_LIKES_BALANCE_KEY = "superLikesBalanceLast";

  const [aboutMeTab, setAboutMeTab] = useState<"new" | "sent" | "received" | "treat" | "unlock" | "distance">("new");
  const [homeUnlockKey, setHomeUnlockKey] = useState<string>("");
  const [selectedTreatItem, setSelectedTreatItem] = useState<"massage" | "beautician" | "flowers" | "jewelry" | null>("massage");
  const [openTreatItem, setOpenTreatItem] = useState<"massage" | "beautician" | "flowers" | "jewelry" | null>(null);
  const [selectedDateIdeaIndex, setSelectedDateIdeaIndex] = useState<number | null>(null);
  const [selectedProfileSection, setSelectedProfileSection] = useState<"basic" | "lifestyle" | "interests" | "images" | null>(null);
  const [profileImageViewIndex, setProfileImageViewIndex] = useState(0);
  const [selectedDatePlace, setSelectedDatePlace] = useState<any | null>(null);
  const [selectedUnlockItemKey, setSelectedUnlockItemKey] = useState<string>("unlock:single");

  const {
    dailyTarot,
    showTarotPopup,
    setShowTarotPopup,
    tarotPhase,
    setTarotPhase,
    loadOrCreateDailyCard,
    markDailyCardShown,
    exportTarotShareImage,
    getBehaviorStorageKey,
  } = useDailyTarot({
    user,
    iLiked,
    likedMe,
    daysSinceLastActive,
    locale,
    sessionStatsRef,
  });
  
  // Restore persisted session behavior
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(getBehaviorStorageKey());
      if (!raw) return;
      const parsed = JSON.parse(raw) as any;
      if (typeof parsed?.liked === "number") sessionStatsRef.current.liked = parsed.liked;
      if (typeof parsed?.passed === "number") sessionStatsRef.current.passed = parsed.passed;
      if (typeof parsed?.viewed === "number") sessionStatsRef.current.viewed = parsed.viewed;
      if (parsed?.viewCountsById && typeof parsed.viewCountsById === "object") {
        sessionStatsRef.current.viewCountsById = parsed.viewCountsById;
      }
      if (typeof parsed?.focusedOnOne === "boolean") sessionStatsRef.current.focusedOnOne = parsed.focusedOnOne;
    } catch {
      // ignore
    }
  }, [getBehaviorStorageKey]);

  const persistSessionBehavior = useCallback(() => {
    try {
      sessionStorage.setItem(
        getBehaviorStorageKey(),
        JSON.stringify({
          liked: sessionStatsRef.current.liked,
          passed: sessionStatsRef.current.passed,
          viewed: sessionStatsRef.current.viewed,
          viewCountsById: sessionStatsRef.current.viewCountsById,
          focusedOnOne: sessionStatsRef.current.focusedOnOne,
          daysSinceLastActive,
          hasMutual: iLiked.some((p) => likedMe.some((l) => l.id === p.id)),
        })
      );
    } catch {
      // ignore
    }
  }, [daysSinceLastActive, getBehaviorStorageKey, iLiked, likedMe]);

  
  // Track profile views + repeated views in-session
  useEffect(() => {
    const currentProfileId = isProfileRoute ? profileRouteId : topProfiles[0]?.id;
    if (!currentProfileId) return;
    const s = sessionStatsRef.current;
    s.viewed += 1;
    s.lastViewedId = currentProfileId;
    s.viewCountsById[currentProfileId] = (s.viewCountsById[currentProfileId] || 0) + 1;
    if (s.viewCountsById[currentProfileId] >= 2) s.focusedOnOne = true;
    setSessionTick((v) => v + 1);
    persistSessionBehavior();
  }, [isProfileRoute, profileRouteId, topProfiles]);

  
  // Show daily match suggestion once per day — only picks someone not yet swiped on
  useEffect(() => {
    if (filteredProfiles.length === 0) return;
    if (!shouldShowDailyMatch()) return;
    const unseen = filteredProfiles.filter(p => !seenIdsRef.current.has(p.id));
    const pool = unseen.length > 0 ? unseen : filteredProfiles;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const t = setTimeout(() => setDailyMatchProfile(pick), 1800);
    return () => clearTimeout(t);
  }, [filteredProfiles]);

  // Guest auth prompt
  const [guestPrompt, setGuestPrompt] = useState<{ open: boolean; trigger: "like" | "superlike" | "profile" | "map" | "match" | "filter" | "purchase" | "generic" }>({ open: false, trigger: "generic" });
  const showGuestPrompt = (trigger: typeof guestPrompt["trigger"]) => setGuestPrompt({ open: true, trigger });

  // ── Add to Home Screen (PWA) ──────────────────────────────────────────
  const a2hsPromptRef = useRef<any>(null);
  const [showA2HS, setShowA2HS] = useState(false);

  // Capture the prompt on mount — fires once at page load before user logs in
  useEffect(() => {
    try { if (localStorage.getItem("a2hs_dismissed")) return; } catch { return; }
    const handler = (e: Event) => {
      e.preventDefault();
      a2hsPromptRef.current = e;
      // Only show immediately if already logged in
      if (user) setShowA2HS(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once user logs in, show banner if prompt was already captured
  useEffect(() => {
    if (!user) return;
    try { if (localStorage.getItem("a2hs_dismissed")) return; } catch { return; }
    if (a2hsPromptRef.current) setShowA2HS(true);
  }, [user]);

  const handleA2HSAdd = async () => {
    if (a2hsPromptRef.current) {
      a2hsPromptRef.current.prompt();
      await a2hsPromptRef.current.userChoice;
    }
    try { localStorage.setItem("a2hs_dismissed", "1"); } catch { /* ignore */ }
    setShowA2HS(false);
  };

  const handleA2HSDismiss = () => {
    try { localStorage.setItem("a2hs_dismissed", "1"); } catch { /* ignore */ }
    setShowA2HS(false);
  };
  // ────────────────────────────────────────────────────────────────────────

  const PROFILE_THIRD_TAB_MODE: "unlock" | "reviews" = "unlock";

  const getDateIdeaDescription = useCallback((idea?: string, title?: string) => {
    const text = `${idea || ""} ${title || ""}`.toLowerCase();

    if (text.includes("coffee") || text.includes("café") || text.includes("cafe")) {
      return "A cozy café vibe with great drinks, comfy seating, and an easy conversation flow — perfect for a first meet.";
    }
    if (text.includes("dinner") || text.includes("restaurant") || text.includes("pasta") || text.includes("food")) {
      return "A relaxed dinner setting with good service and a warm atmosphere — ideal for getting to know each other without rushing.";
    }
    if (text.includes("park") || text.includes("walk") || text.includes("sunset") || text.includes("nature")) {
      return "A calm outdoor walk with fresh air and space to talk — simple, romantic, and naturally fun.";
    }
    if (text.includes("rooftop") || text.includes("drinks") || text.includes("bar") || text.includes("cocktail")) {
      return "A stylish rooftop/drinks spot with a great view and music — a confident, fun vibe for flirting and laughs.";
    }
    if (text.includes("dessert") || text.includes("ice") || text.includes("cake") || text.includes("sweet")) {
      return "A sweet dessert stop with cute photo moments and a light vibe — perfect for ending the night on a high note.";
    }
    if (text.includes("instagram") || text.includes("tag")) {
      return "A trending local idea with lots of options — you can pick the best spot together based on the vibe you both like.";
    }

    return "A fun, low-pressure date idea with a good atmosphere — great for conversation, comfort, and a positive first impression.";
  }, []);

  const selectedProfile = useMemo(() => {
    if (isProfileRoute && profileRouteId) {
      return allProfiles.find((p) => p.id === profileRouteId) ?? null;
    }
    return selectedList[selectedIndex] ?? null;
  }, [allProfiles, isProfileRoute, profileRouteId, selectedList, selectedIndex]);

  // New profiles for the library
  const libraryNewProfiles = useMemo(() => {
    return allProfiles
      .filter(p => !filters.country || p.country?.toLowerCase() === filters.country.toLowerCase())
      .sort((a, b) => {
        const ta = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const tb = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return tb - ta;
      });
  }, [allProfiles, filters.country]);

  useAuthAndProfiles({
    setUser,
    setILiked,
    setLikedMe,
    setLoading,
    setDbProfiles,
    setRoseAvailable,
    setLastRoseAt,
    setSuperLikesCount,
    setMyReferralCode,
    setDaysSinceLastActive,
    setShowTerms,
    setUserGender,
    setShowWelcomeBack,
    welcomeBackName,
    setShowReferralPopup,
    toast,
    getLocalLikedProfiles,
    getLocalLikedMeProfiles,
    upsertLocalLikedProfile,
    saveLocalLikedMeProfiles,
  });

  useRealtimeLikes({
    user,
    likedMe,
    setLikedMe,
    setLikeParticlesActive,
    setSuperLikeParticlesActive,
    setSuperLikeGlowProfileId,
    setSuperLikeRevealProfile,
    getLocalLikedMeProfiles,
    saveLocalLikedMeProfiles,
  });

  const {
    profileReviews,
    profileReviewsLoading,
    activeReviewIndex,
    setActiveReviewIndex,
    reviewerAvatarById,
    profileImageIndex,
    setProfileImageIndex,
    profileImageDirection,
    setProfileImageDirection,
  } = useProfileData({
    selectedProfile,
    user,
    aboutMeTab,
    isProfileRoute,
    setSelectedDateIdeaIndex,
    setSelectedProfileSection,
    setSelectedUnlockItemKey,
    topCardX,
    selectedIndex,
    selectedList,
    loading,
    setShowPostLoginLanding,
    POST_LOGIN_LANDING_KEY,
    allProfiles,
    filters,
  });

  // ────────────────────────────────────────────────────────────────────────

  const handleSelectProfile = useCallback((profile: Profile, list: Profile[]) => {
    const idx = list.findIndex((p) => p.id === profile.id);
    setSelectedList(list);
    setSelectedIndex(idx >= 0 ? idx : 0);
  }, []);

  
  const {
    handleLike,
    handleRose,
    handleUnlock,
    confirmUnlock,
    handlePurchaseFeature,
    handleConfirmPurchase,
    handleAcceptTerms,
    handleLogout,
  } = useSwipeActions({
    user,
    iLiked,
    likedMe,
    setILiked,
    setMatchDialog,
    setUnlockDialog,
    setFeatureDialog,
    setShowTerms,
    setGuestPrompt,
    setPaymentLoading,
    setFeatureLoading,
    setRoseAvailable,
    setLastRoseAt,
    setSuperLikesCount,
    sessionStatsRef,
    setSessionTick,
    unlockDialog,
    roseAvailable,
    superLikesCount,
    showGuestPrompt,
    upsertLocalLikedProfile,
    toast,
    t,
    navigate,
  });

  
  const handleLibraryCardDrag = (_: any, info: PanInfo) => {
    const { offset } = info;
    if (offset.y < -80) {
      if (selectedProfile) navigate(`/profile/${selectedProfile.id}`);
    } else if (offset.x > 100) {
      topCardX.set(0);
      setSelectedIndex((i) => (i + 1) % selectedList.length);
    } else if (offset.x < -100) {
      topCardX.set(0);
      setSelectedIndex((i) => (i - 1 + selectedList.length) % selectedList.length);
    }
  };

  const clearSelection = () => {
    setSelectedList([]);
    setSelectedIndex(0);
  };

  const handleMapSelectUser = (userId: string) => {
    const profile = allProfiles.find((p) => p.id === userId);
    if (profile) {
      navigate(`/profile/${profile.id}`);
    }
  };

  // Post-login landing — show once when user lands on / after login
  if (showPostLoginLanding && user) {
    const landingName = user?.user_metadata?.name || user?.email?.split("@")[0] || "there";
    return (
      <div className="h-screen-safe relative overflow-hidden" style={{ backgroundImage: "url('/images/app-background.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6"
        >
          <AppLogo className="w-44 h-44 object-contain drop-shadow-xl mb-2" />
          <h1 className="text-2xl font-display font-bold text-white drop-shadow-lg text-center">
            {t("popup.welcomeBack")}{landingName !== "there" ? `, ${landingName}` : ""}!
          </h1>
          <p className="text-white/70 text-sm drop-shadow-md text-center">{t("popup.connectInstantly")}</p>
          <div className="mt-8 w-full flex flex-col items-center gap-3">
            <Button
              onClick={() => {
                try {
                  sessionStorage.setItem(POST_LOGIN_LANDING_KEY, "1");
                } catch {
                  // ignore
                }
                setShowPostLoginLanding(false);
              }}
              className="w-full max-w-sm h-14 text-base font-bold gradient-love text-primary-foreground border-0 rounded-2xl shadow-glow"
            >
              <MessageCircle className="w-5 h-5 mr-2" /> {t("popup.enterApp")}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <AppLogo
        className="w-32 h-32 object-contain drop-shadow-[0_0_24px_rgba(220,80,150,0.6)]"
        style={{ imageRendering: "auto" }}
      />
      <p className="mt-5 text-white text-xl font-bold tracking-widest" style={{ fontFamily: "inherit" }}>2DateMe</p>
      <p className="mt-1 text-white/40 text-xs tracking-wider">Connect Instantly</p>
      <div className="mt-8 flex gap-1.5">
        {[0,1,2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary"
            style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );

  // Image preloading now handled inside SwipeStack

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Guest";
  const currentUser = userName;

  return (
    <div className="h-screen-safe flex flex-col overflow-hidden relative" style={{ backgroundImage: "url('/images/app-background.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      {/* Image preloading handled inside SwipeStack */}
      {/* Header — padded for status bar safe area */}
      <header className="flex items-center justify-between px-4 py-2.5 relative z-10 pt-safe" style={{ paddingTop: `max(0.625rem, env(safe-area-inset-top, 0px))` }}>
        <div className="flex items-center gap-2">
          <AppLogo alt={APP_NAME} className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(220,80,150,0.5)]" />
          <span className="font-display font-bold text-white text-xl tracking-tight leading-none">{APP_NAME}</span>
        </div>

        <div className="flex items-center gap-2">
          {isProfileRoute ? (
            <button
              type="button"
              onClick={() => navigate("/home")}
              aria-label="Home"
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              title="Home"
            >
              <Home className="w-4.5 h-4.5" />
            </button>
          ) : (
            <>
              <button onClick={toggleLocale} className="px-2 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/70 hover:text-white transition-colors text-[10px] font-medium">
                {locale === "en" ? "🇮🇩 ID" : "🇬🇧 EN"}
              </button>
              {user ? (
                <>
                  <button onClick={() => { if (!user) { showGuestPrompt("filter"); return; } setShowFilters(true); }} aria-label={t("nav.filters")} className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors" title={t("nav.filters")}>
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigate("/dashboard")} aria-label={t("nav.powerups")} className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors" title={t("nav.powerups")}>
                    <Zap className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button onClick={() => navigate("/auth?signin=1")} className="bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 text-white/80 hover:text-white transition-colors flex items-center gap-1" title={t("nav.signIn")}>
                  <LogIn className="w-4 h-4" />
                  <span className="text-xs font-medium">{t("nav.signIn")}</span>
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main 3-container layout */}
      <div className="flex-1 grid gap-2 p-2 min-h-0 pb-safe" style={{ paddingBottom: `max(0.5rem, env(safe-area-inset-bottom, 0px))`, gridTemplateRows: isProfileRoute ? ((aboutMeTab === "new" && selectedProfileSection !== null) ? "1fr" : "1fr auto") : "1fr auto 1fr" }}>
        {/* When profile info/images is active, replace all 3 panels with 1 single container */}
        {isProfileRoute && aboutMeTab === "new" && selectedProfileSection !== null ? (
          selectedProfileSection === "images" ? (
            <ProfileImagesPanel
              profile={selectedProfile}
              imageIndex={profileImageViewIndex}
              setImageIndex={setProfileImageViewIndex}
              onClose={() => setSelectedProfileSection(null)}
              iLiked={iLiked}
              handleLike={handleLike}
            />
          ) : (
            <ProfileInfoPanel
              profile={selectedProfile}
              onClose={() => setSelectedProfileSection(null)}
            />
          )
        ) : (
          <>
            <TopCard
              key="top-card"
              selectedProfile={selectedProfile}
              isProfileRoute={isProfileRoute}
              topProfiles={topProfiles}
              topCardX={topCardX}
              profileImageIndex={profileImageIndex}
              profileImageDirection={profileImageDirection}
              iLiked={iLiked}
              roseAvailable={roseAvailable}
              user={user}
              t={t}
              isAnimatingTopCardRef={isAnimatingTopCardRef}
              selectedList={selectedList}
              selectedProfileSection={isProfileRoute ? selectedProfileSection : null}
              setSelectedIndex={setSelectedIndex}
              setProfileImageIndex={setProfileImageIndex}
              setProfileImageDirection={setProfileImageDirection}
              handleLike={handleLike}
              handleRose={handleRose}
              handleLibraryCardDrag={handleLibraryCardDrag}
              advanceQueue={advanceQueue}
              navigate={navigate}
              sessionStatsRef={sessionStatsRef}
              setSessionTick={setSessionTick}
              persistSessionBehavior={persistSessionBehavior}
            />

            {/* Center - Likes Library */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-3 h-48 overflow-hidden relative border-2 border-white/20"
            >
              {/* Solid edge background */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-2xl pointer-events-none" />
              {/* Floating red hearts animation */}
              {[...Array(6)].map((_, i) => (
                <motion.span
                  key={`heart-${i}`}
                  className="absolute pointer-events-none select-none"
                  style={{ left: `${10 + i * 15}%`, bottom: 0, fontSize: `${10 + (i % 3) * 4}px`, color: 'hsl(320, 50%, 50%)' }}
                  animate={{ y: [0, -160], opacity: [0.7, 0] }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.8,
                    ease: "easeOut",
                  }}
                >
                  ♥
                </motion.span>
              ))}
              <div className="relative z-10 h-full" ref={libraryRef}>
                <LikesLibrary
                  title={isProfileRoute ? "About Me" : undefined}
                  tabLabelOverrides={
                    isProfileRoute
                      ? {
                          new: "Profile",
                          sent: "Date Ideas",
                          treat: "Treat",
                          distance: "Distance",
                        }
                      : undefined
                  }
                  onTabChange={(t) => {
                    // Allow treat tab on both home and profile pages
                    if (t === "treat") {
                      setAboutMeTab(t);
                      setSelectedTreatItem("massage");
                      return;
                    }
                    // On home page: switching away from unlock tab clears the package detail
                    if (!isProfileRoute) {
                      setAboutMeTab(t);
                      if (t !== "unlock") setHomeUnlockKey("");
                      return;
                    }
                    // Only reset selections when actually switching tabs (not on re-render)
                    if (t !== aboutMeTab) {
                      setSelectedProfileSection(null);
                      setSelectedDatePlace(null);
                      setSelectedDateIdeaIndex(null);
                      if (isProfileRoute) setSelectedTreatItem(null);
                    }
                    setAboutMeTab(t);
                  }}
                  selectedProfileSection={isProfileRoute ? selectedProfileSection : undefined}
                  onSelectProfileSection={(s) => {
                    if (!isProfileRoute) return;
                    setSelectedProfileSection(s as any);
                  }}
                  selectedUnlockItemKey={isProfileRoute ? selectedUnlockItemKey : homeUnlockKey}
                  onSelectUnlockItem={(key) => {
                    if (isProfileRoute) {
                      setSelectedUnlockItemKey(key);
                    } else {
                      setHomeUnlockKey(key);
                      setAboutMeTab("unlock");
                    }
                  }}
                  selectedTreatItem={selectedTreatItem}
                  onSelectTreatItem={(key) => {
                    setSelectedTreatItem(key);
                    setOpenTreatItem(key);
                  }}
                  selectedDateIdeaIndex={isProfileRoute ? (selectedDateIdeaIndex ?? undefined) : undefined}
                  onSelectDateIdea={(idx) => {
                    if (!isProfileRoute) return;
                    setSelectedDateIdeaIndex(idx);
                  }}
                  profileFirstDateIdea={isProfileRoute ? selectedProfile?.first_date_idea ?? null : undefined}
                  profileDatePlaces={isProfileRoute ? selectedProfile?.first_date_places ?? [] : undefined}
                  iLiked={iLiked}
                  likedMe={likedMe}
                  newProfiles={libraryNewProfiles}
                  filterCountry={filters.country}
                  dailyTarot={
                    dailyTarot
                      ? {
                          cardId: dailyTarot.card.id,
                          cardName: dailyTarot.card.name,
                          cardEmoji: dailyTarot.card.emoji,
                          reading: dailyTarot.reading,
                          shown: dailyTarot.shown,
                        }
                      : null
                  }
                  hidePrivateTabs={!isProfileRoute && !user}
                  onRevealDailyTarot={() => {
                    markDailyCardShown();
                  }}
                  receivedHighlightProfileId={null}
                  heartDropProfileId={null}
                  superLikeGlowProfileId={superLikeGlowProfileId}
                  onUnlock={handleUnlock}
                  onSelectProfile={(profile, sourceList) => {
                    handleSelectProfile(profile, sourceList);
                  }}
                  onPurchaseFeature={handlePurchaseFeature}
                />
              </div>
            </motion.div>

            {/* Bottom Card — only on home page, not profile page */}
            {!isProfileRoute && (
              <div className="relative rounded-2xl overflow-hidden min-h-0 bg-gradient-to-br from-fuchsia-900/30 via-black/30 to-purple-900/30 backdrop-blur-xl border-2 border-fuchsia-400/25 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-fuchsia-300/15 isolate" style={{ contain: "layout" }}>
                {aboutMeTab === "unlock" ? (
                  <HomePackageDetail packageKey={homeUnlockKey || "unlock:single"} onClose={() => { setHomeUnlockKey(""); setAboutMeTab("new"); }} />
                ) : (
                  <SwipeStack
                    key="bottom-stack"
                    profiles={bottomProfiles}
                    direction="down"
                    roseAvailable={roseAvailable}
                    onRose={handleRose}
                    onLike={(p) => {
                      handleLike(p);
                      advanceQueue(p.id);
                      if (user) navigate(`/profile/${p.id}`);
                    }}
                    onPass={(p) => {
                      sessionStatsRef.current.passed += 1;
                      setSessionTick((v) => v + 1);
                      advanceQueue(p.id);
                    }}
                  />
                )}
              </div>
            )}
          </>
        )}

        <FloatingLikeParticles
          active={likeParticlesActive}
          superLike={false}
          onComplete={() => setLikeParticlesActive(false)}
        />
        <FloatingLikeParticles
          active={superLikeParticlesActive}
          superLike={true}
          onComplete={() => setSuperLikeParticlesActive(false)}
        />

        {/* Development: toggle and simulate butterfly / super like — only in dev build */}
        {isDevBuild() && (
          <>
            <button
              type="button"
              onClick={() => setDevPanelOpen((o) => !o)}
              className="fixed bottom-24 left-3 z-[75] w-10 h-10 rounded-full bg-amber-500/90 hover:bg-amber-500 text-black flex items-center justify-center shadow-lg border border-amber-600/50"
              aria-label="Development panel"
              title="Development features"
            >
              <FlaskConical className="w-5 h-5" />
            </button>
            {devPanelOpen && (
              <div className="fixed bottom-24 left-3 z-[76] w-56 rounded-xl bg-black/95 backdrop-blur-xl border border-amber-500/40 shadow-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 text-xs font-semibold">Development features</span>
                  <button
                    type="button"
                    onClick={() => setDevPanelOpen(false)}
                    className="text-white/50 hover:text-white p-0.5"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={devFeaturesEnabled}
                    onChange={(e) => setDevFeaturesEnabled(e.target.checked)}
                    className="rounded border-amber-500/50 bg-black/50 text-amber-500"
                  />
                  <span className="text-white/80 text-xs">On — animations & triggers live</span>
                </label>
                <p className="text-white/40 text-[10px]">
                  Off = same as production: only real events trigger like particles.
                </p>

                {/* Animation Trigger Buttons */}
                <div className="space-y-2 pt-2 border-t border-amber-500/30">
                  <button
                    type="button"
                    onClick={() => setLikeParticlesActive(true)}
                    className="w-full flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    ❤️ Trigger Like Hearts
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuperLikeParticlesActive(true)}
                    className="w-full flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    ⭐ Trigger Super Like
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const mock = filteredProfiles[0] || { id: "mock-match", name: "Jessica", avatar_url: "https://i.pravatar.cc/150?img=47", age: 24, city: "Yogyakarta" };
                      setMatchDialog(mock);
                    }}
                    className="w-full flex items-center gap-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    💞 Test Match Popup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const mock = filteredProfiles[Math.floor(Math.random() * Math.max(1, filteredProfiles.length))] || { id: "mock-daily", name: "Sari", avatar_url: "https://i.pravatar.cc/150?img=32", age: 22, city: "Yogyakarta", bio: "Love coffee, sunsets and genuine connections ☕" };
                      setDailyMatchProfile(mock);
                    }}
                    className="w-full flex items-center gap-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    ✨ Test Daily Match
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Profile page is now routed to /profile/:id and clones Home layout */}

      <AppDialogs
        showReferralPopup={showReferralPopup}
        setShowReferralPopup={setShowReferralPopup}
        referralCode={myReferralCode}
        user={user}
        REFERRAL_POPUP_SHOWN_KEY={REFERRAL_POPUP_SHOWN_KEY}
        showTarotPopup={showTarotPopup}
        setShowTarotPopup={setShowTarotPopup}
        dailyTarot={dailyTarot}
        tarotPhase={tarotPhase}
        markDailyCardShown={markDailyCardShown}
        exportTarotShareImage={exportTarotShareImage}
        matchedProfile={matchDialog}
        setMatchedProfile={setMatchDialog}
        iLiked={iLiked}
        likedMe={likedMe}
        handleUnlock={handleUnlock}
        confirmUnlock={confirmUnlock}
        showUnlockDialog={!!unlockDialog}
        setShowUnlockDialog={(v) => setUnlockDialog(v ? unlockDialog : null)}
        unlockProfile={unlockDialog}
        paymentLoading={paymentLoading}
        featurePurchaseItem={featureDialog}
        setFeaturePurchaseItem={setFeatureDialog}
        handleConfirmPurchase={handleConfirmPurchase}
        featureLoading={featureLoading}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filters={filters}
        setFilters={setFilters}
        seenIdsRef={seenIdsRef}
        shuffledQueueRef={shuffledQueueRef}
        showTerms={showTerms}
        handleAcceptTerms={handleAcceptTerms}
        guestPrompt={guestPrompt}
        setGuestPrompt={setGuestPrompt}
        showWelcomeBack={showWelcomeBack}
        setShowWelcomeBack={setShowWelcomeBack}
        welcomeBackName={welcomeBackName}
        showA2HS={showA2HS}
        handleA2HSAdd={handleA2HSAdd}
        handleA2HSDismiss={handleA2HSDismiss}
      />

      <TreatOverlay
        showTreatPage={openTreatItem}
        onClose={() => setOpenTreatItem(null)}
        currentUser={currentUser}
      />

      {/* Daily Match Suggestion — once per day */}
      {dailyMatchProfile && (
        <DailyMatchSuggestion
          profile={dailyMatchProfile}
          onDismiss={() => {
            markDailyMatchShown();
            setDailyMatchProfile(null);
          }}
          onConnect={(p) => {
            markDailyMatchShown();
            setDailyMatchProfile(null);
            // Unlock only available when both users have liked each other
            const userLikedThem = iLiked.some(l => l.id === p.id);
            const theyLikedUser = likedMe.some(l => l.id === p.id);
            if (userLikedThem && theyLikedUser) {
              setUnlockDialog(p);
            } else {
              // Trigger like so the user's intent is recorded; unlock will appear via normal match flow
              handleLike(p);
            }
          }}
        />
      )}

      {/* ── Video Call Overlays ────────────────────────────────────── */}
      <AnimatePresence>
        {videoCall.incomingCall && !videoCall.activeCall && (
          <IncomingCallScreen
            callerName={videoCall.incomingCall.callerName}
            callerPhoto={videoCall.incomingCall.callerPhoto}
            onAccept={videoCall.acceptCall}
            onDecline={videoCall.declineCall}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {videoCall.activeCall && (
          <VideoCallScreen
            matchId={videoCall.activeCall.matchId}
            callId={videoCall.activeCall.callId}
            partnerName={videoCall.activeCall.partnerName}
            partnerId={videoCall.activeCall.partnerId}
            isCaller={videoCall.activeCall.isCaller}
            onEnd={videoCall.endCall}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default Index;
