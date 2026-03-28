import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence, PanInfo, useMotionValue, animate } from "framer-motion";
import { Heart, MapPin, Zap, LogIn, MessageCircle, SlidersHorizontal, Fingerprint, User, ChevronLeft, ChevronRight, Star, ShieldCheck } from "lucide-react";
import { AppLogo } from "@/shared/components";
import { Profile, SwipeStack, LikesLibrary } from "@/features/dating/components";
import { FloatingLikeParticles } from "@/shared/components";
import { generateIndonesianProfiles } from "@/data/indonesianProfiles";
import { toast } from "sonner";
import { getPrimaryBadgeKey } from "@/shared/utils/profileBadges";
import { Button } from "@/shared/components/button";
import { supabase } from "@/integrations/supabase/client";
import { PREMIUM_FEATURES, PremiumFeature } from "@/data/premiumFeatures";
import { FeaturePurchaseDialog } from "@/features/payments/components";
import { FilterPanel, FilterState, defaultFilters } from "@/features/dating/components";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import { isMockCurrentlyOnline } from "@/shared/utils/mockOnlineSchedule";
import { GuestAuthPrompt } from "@/features/auth/components";
import { TermsAcceptanceDialog } from "@/features/auth/components";
import { TreatOverlay, AppDialogs, DailyMatchSuggestion, shouldShowDailyMatch, markDailyMatchShown, TravelNoticePopup, shouldShowTravelNotice, markTravelNoticeShown } from "@/features/dating/components";
import type { TravelNoticeType } from "@/features/dating/components";
import { ProfileBottomSheet, ProfileInfoPanel, ProfileImagesPanel, DateIdeaDetailPanel, TreatDetailPanel } from "@/features/dating/components";
import VideoIntroPanel from "@/features/dating/components/profile-view/VideoIntroPanel";
import DistanceMapOverlay from "@/features/dating/components/profile-view/DistanceMapOverlay";
import InternationalMarriagePanel from "@/features/dating/components/profile-view/InternationalMarriagePanel";
import { useLanguage } from "@/i18n/LanguageContext";
import { LIKE_EXPIRY_MS, ROSE_RESET_DAYS, MS_PER_DAY, APP_NAME } from "@/shared/services/constants";
import { isNetworkError } from "@/shared/utils/payments";
import { hasUnlockBadges } from "@/shared/utils/unlockPrice";
import { useDevFeatures, isDevBuild } from "@/shared/hooks/useDevFeatures";
import { useSwipeActions } from "@/shared/hooks/useSwipeActions";
import { useAuthAndProfiles } from "@/shared/hooks/useAuthAndProfiles";
import { useRealtimeLikes } from "@/shared/hooks/useRealtimeLikes";
import { useProfileData } from "@/shared/hooks/useProfileData";
import { InfoChip, Section, ContainerBlock } from "@/shared/components/SwipeUIComponents";
import { TopCard } from "@/features/dating/components";
import { useVideoCall } from "@/shared/hooks/useVideoCall";
import { useCoinBalance } from "@/shared/hooks/useCoinBalance";
import CoinHub from "@/shared/components/CoinHub";
import { TokenPurchase, GiftReceiver, MatchPopup, GiftReceivePopup } from "@/features/gifts/components";
import { VideoCallScreen } from "@/features/video/components";
import { IncomingCallScreen } from "@/features/video/components";
import CoinCollectModal, { TEDDY_VIDEO } from "@/features/dating/components/CoinCollectModal";
import UnlockCollectModal, { UNLOCK_VIDEO } from "@/features/dating/components/UnlockCollectModal";
import CulturalBridgePage from "@/features/dating/pages/CulturalBridgePage";
import GlobalDatingUpsell from "@/features/dating/components/GlobalDatingUpsell";
import { useGlobalDating } from "@/shared/hooks/useGlobalDating";
import { getUserCountry } from "@/shared/hooks/useUserCurrency";
import VisitorGuidePage from "@/features/dating/pages/VisitorGuidePage";
import { RealGiftOrderFlow } from "@/features/real-gifts/RealGiftOrderFlow";
import { GiftDeliveryNotification } from "@/features/real-gifts/GiftDeliveryNotification";
import logoHeart from "@/assets/images/logo-heart.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/dialog";
import { FlaskConical, Sparkles, X } from "lucide-react";
import { useUserCurrency } from "@/shared/hooks/useUserCurrency";
import BestieRequestPopup, { BestieRequest } from "@/features/dating/components/BestieRequestPopup";
import BestieReferralPopup, { BestieReferral } from "@/features/dating/components/BestieReferralPopup";
import BestieConfirmPopup from "@/features/dating/components/BestieConfirmPopup";
import { generateAppUserId } from "@/shared/utils/userIdUtils";
import { useProfileQuestions } from "@/features/dating/hooks/useProfileQuestions";
import ProfileQuestionBlocker from "@/features/dating/components/ProfileQuestionBlocker";
import WaLockedPopup, { addWaLock, isWaLocked } from "@/features/dating/components/WaLockedPopup";
import { setProfileLock, isProfileLocked } from "@/features/dating/utils/profileLock";
import type { WaLock } from "@/features/dating/components/WaLockedPopup";
import {
  registerSession, markSwipeStart, canShowTimedPopup,
  markTimedPopupShown, canShowCommercial, markCommercialShown,
  canShowReferral, canShowTravelNotice,
} from "@/shared/hooks/usePopupQueue";
import ChatPanel from "@/features/messaging/components/ChatPanel";

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


// ── Home page package detail (shown in bottom card when unlock item selected) ──
const UNLOCK_BG_IMAGE = "https://ik.imagekit.io/7grri5v7d/match%20unlockssss.png?updatedAt=1773231173310";
const VIP_BG_IMAGE = "https://ik.imagekit.io/7grri5v7d/vip%20matches.png?updatedAt=1773414288279";
const BOOST_BG_IMAGE = "https://ik.imagekit.io/7grri5v7d/rocket%20boost.png?updatedAt=1773414413248";
const VERIFIED_BG_IMAGE = "https://ik.imagekit.io/7grri5v7d/vip%20profiles.png";
const SPOTLIGHT_BG_IMAGE = "https://ik.imagekit.io/7grri5v7d/spot%20light.png";
const INCOGNITO_BG_IMAGE = "https://ik.imagekit.io/7grri5v7d/incognito.png";

const HOME_UNLOCK_PACKAGES = [
  { key: "unlock:single", emoji: "💬", name: "1 Match Unlock", price: "$1.99", desc: "Unlock WhatsApp after you both match. Fast, simple, direct.", sub: "Requires a mutual match", btn: "Unlock Now", bgImage: UNLOCK_BG_IMAGE },
  { key: "unlock:pack3", emoji: "💬", name: "3 Unlock Pack", price: "$4.99", desc: "Perfect for a week of real connections. Save vs singles.", sub: "Best for active users", btn: "Get Pack", bgImage: UNLOCK_BG_IMAGE },
  { key: "unlock:pack10", emoji: "💬", name: "10 Unlock Pack", price: "$12.99", desc: "Best value for heavy matching. Lowest cost per unlock.", sub: "Best value · never expire", btn: "Get Pack", bgImage: UNLOCK_BG_IMAGE },
  { key: "unlock:vip", emoji: "👑", name: "VIP Monthly", price: "$10.99/mo", desc: "7 unlocks + 5 Super Likes + VIP badge. Save 54%.", sub: "Auto-renews monthly", btn: "Go VIP", bgImage: VIP_BG_IMAGE },
  { key: "unlock:superlike", emoji: "⭐", name: "Super Like", price: "$1.99", desc: "Flash in their library first! They get notified.", sub: "One-time purchase", btn: "Get", bgImage: null },
  { key: "unlock:boost", emoji: "🚀", name: "Profile Boost", price: "$1.99", desc: "Top of swipe stack for 1 hour. 5–10× more views!", sub: "Activates immediately · 1 hr", btn: "Boost Now", bgImage: BOOST_BG_IMAGE },
  { key: "unlock:verified", emoji: "✅", name: "Verified Badge", price: "$1.99", desc: "Get verified. Rank higher & build trust.", sub: "Permanent badge", btn: "Get Verified", bgImage: VERIFIED_BG_IMAGE },
  { key: "unlock:incognito", emoji: "👻", name: "Incognito Mode", price: "$2.99", desc: "Browse profiles invisibly for 24 hours.", sub: "Activates immediately · 24 hr", btn: "Go Incognito", bgImage: INCOGNITO_BG_IMAGE },
  { key: "unlock:spotlight", emoji: "🌟", name: "Spotlight", price: "$4.99", desc: "Featured at top of everyone's stack for 24 hours!", sub: "Activates immediately · 24 hr", btn: "Get Spotlight", bgImage: SPOTLIGHT_BG_IMAGE },
];

// Maps each unlock carousel key → a PremiumFeature for the payment engine.
// Unlock packs use synthetic features sharing the WhatsApp price ID.
const WHATSAPP_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_WHATSAPP ?? "price_1T8NbHBChzWuxQIpeGY4LLYQ";
const KEY_TO_FEATURE: Record<string, PremiumFeature> = {
  "unlock:single":  { id: "unlock_single",  name: "1 Match Unlock",  emoji: "💬", description: "Reveal WhatsApp after a mutual match.",           price: "$1.99",     priceCents: 199,  priceId: WHATSAPP_PRICE_ID,                                                        productId: "prod_U6amf4mWJWevjl", color: "love",    icon: "rocket", perks: ["💬 Reveals 1 WhatsApp number", "✅ Requires mutual match", "🔒 Safe & direct"] },
  "unlock:pack3":   { id: "unlock_pack3",   name: "3 Unlock Pack",   emoji: "💬", description: "3 WhatsApp unlocks — best for active users.",       price: "$4.99",     priceCents: 499,  priceId: WHATSAPP_PRICE_ID,                                                        productId: "prod_U6amf4mWJWevjl", color: "love",    icon: "rocket", perks: ["💬 Reveals 3 WhatsApp numbers", "💰 Save vs buying singles", "🔒 Credits never expire"] },
  "unlock:pack10":  { id: "unlock_pack10",  name: "10 Unlock Pack",  emoji: "💬", description: "Best value — lowest cost per unlock.",              price: "$12.99",    priceCents: 1299, priceId: WHATSAPP_PRICE_ID,                                                        productId: "prod_U6amf4mWJWevjl", color: "love",    icon: "rocket", perks: ["💬 Reveals 10 WhatsApp numbers", "💰 Best value — $1.30/unlock", "🔒 Credits never expire"] },
  "unlock:vip":     PREMIUM_FEATURES.find(f => f.id === "vip")!,
  "unlock:superlike": PREMIUM_FEATURES.find(f => f.id === "superlike")!,
  "unlock:boost":   PREMIUM_FEATURES.find(f => f.id === "boost")!,
  "unlock:verified": PREMIUM_FEATURES.find(f => f.id === "verified")!,
  "unlock:incognito": PREMIUM_FEATURES.find(f => f.id === "incognito")!,
  "unlock:spotlight": PREMIUM_FEATURES.find(f => f.id === "spotlight")!,
};

function HomePackageDetail({ packageKey, onPurchase }: { packageKey: string; onClose: () => void; onPurchase: (f: PremiumFeature) => void }) {
  const { fmt } = useUserCurrency();
  const pkg = HOME_UNLOCK_PACKAGES.find((p) => p.key === packageKey);
  if (!pkg) return null;
  const feature = KEY_TO_FEATURE[packageKey];
  const priceSuffix = pkg.price.includes("/mo") ? "/mo" : "";
  const displayPrice = feature ? fmt(feature.priceCents, priceSuffix) : pkg.price;

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

        {/* content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-end px-5 pb-4 text-center gap-2">
          {pkg.emoji === "💬" ? (
            <img src="https://ik.imagekit.io/7grri5v7d/logo_unlock-removebg-preview.png?updatedAt=1773430238745" alt="unlock" style={{ width: bgImage ? 44 : 50, height: bgImage ? 44 : 50, objectFit: "contain" }} />
          ) : pkg.key === "unlock:vip" ? (
            <img src="https://ik.imagekit.io/7grri5v7d/VIP%20heart%20with%20golden%20accents.png" alt="VIP" style={{ width: bgImage ? 44 : 50, height: bgImage ? 44 : 50, objectFit: "contain" }} />
          ) : (
            <span style={{ fontSize: bgImage ? 36 : 40 }}>{pkg.emoji}</span>
          )}
          <p className="text-white font-black leading-tight" style={{ fontSize: 17, margin: 0 }}>{pkg.name}</p>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, lineHeight: 1.5, margin: 0, maxWidth: 260 }}>{pkg.desc}</p>

          {/* price + buy */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 280, marginTop: 4 }}>
            <p style={{ color: "#fff", fontWeight: 900, fontSize: 22, margin: 0 }}>{displayPrice}</p>
            <button
              onClick={() => feature && onPurchase(feature)}
              style={{ padding: "8px 18px", borderRadius: 22, fontWeight: 900, fontSize: 12, color: "#fff", border: "none", cursor: "pointer", background: "linear-gradient(135deg, rgba(232,72,199,0.95), rgba(195,60,255,0.95))", boxShadow: "0 4px 18px rgba(195,60,255,0.4)" }}
            >
              {pkg.btn}
            </button>
          </div>

          {/* sub label */}
          <p style={{ color: "rgba(255,255,255,0.42)", fontSize: 9.5, fontWeight: 600, margin: 0, width: "100%", maxWidth: 280 }}>{pkg.sub}</p>
        </div>
      </div>
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

  // Check for admin session in localStorage (set by AuthPage when 12345 is entered)
  const getAdminUser = () => {
    if (typeof localStorage !== 'undefined') {
      try {
        const adminSessionStr = localStorage.getItem('supabase.auth.token');
        if (adminSessionStr) {
          const session = JSON.parse(adminSessionStr);
          if (session.user?.id === 'admin-12345') {
            return session.user;
          }
        }
      } catch (error) {
        console.error('Error parsing admin session from localStorage:', error);
      }
    }
    return null;
  };

  const [user, setUser] = useState<any>(() => {
    // Always provide a mock user for guest access
    const guestUser = {
      id: "guest-user",
      email: "guest@2dateme.demo",
      user_metadata: {
        name: "Guest User"
      }
    };

    if (import.meta.env.DEV) return DEV_MOCK_USER;
    const adminUser = getAdminUser();
    return adminUser || guestUser;
  });
  const coinBalance = useCoinBalance(user?.id);
  const profileQuestions = useProfileQuestions(user?.id || "guest");
  const { isGlobalDater } = useGlobalDating(user?.id);
  const [globalDatingUpsell, setGlobalDatingUpsell] = useState<any>(null);
  const [waLockPopup, setWaLockPopup] = useState<WaLock | null>(null);
  const [showCoinRefuel, setShowCoinRefuel] = useState(false);
  const [userGender, setUserGender] = useState<string | null>(null);
  const [userLookingFor, setUserLookingFor] = useState<string | null>(null);
  const [chatProfile, setChatProfile] = useState<any>(null);

  // Register this as a new browsing session (increments counter for popup gating)
  useEffect(() => { registerSession(); }, []);
  const [loading, setLoading] = useState(() => {
    // Always false for immediate content display
    return false;
  });
  const [dbProfiles, setDbProfiles] = useState<Profile[]>(() => {
    try {
      const cached = sessionStorage.getItem("2dateme_profiles_cache");
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => defaultFilters);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  // Load blocked user IDs so they are filtered from the feed
  useEffect(() => {
    if (!user) return;
    supabase
      .from("blocked_users")
      .select("blocked_id")
      .eq("blocker_id", user.id)
      .then(({ data }) => {
        if (data) setBlockedIds(new Set(data.map((r: any) => r.blocked_id)));
      });
  }, [user]);

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

  // Mock profiles scale back 1-for-1 as real users join
  // 50 mocks when 0 real users → 0 mocks when ≥50 real users
  const mockProfiles = useMemo(() => generateIndonesianProfiles(50), []);
  const allProfiles = useMemo(() => {
    const mockCount = Math.max(0, 50 - dbProfiles.length);
    return [...mockProfiles.slice(0, mockCount), ...dbProfiles];
  }, [mockProfiles, dbProfiles]);

  // Apply filters
  const filteredProfiles = useMemo(() => {
    return allProfiles.filter((p) => {
      // Blocked users
      if (blockedIds.has(p.id)) return false;
      // Auto-filter by user's looking_for preference
      if (userLookingFor && userLookingFor !== "Everyone") {
        const profileGender = (p.gender || "").toLowerCase();
        if (userLookingFor === "Women" && profileGender !== "female") return false;
        if (userLookingFor === "Men" && profileGender !== "male") return false;
      }
      // Location
      if (filters.country && p.country?.toLowerCase() !== filters.country.toLowerCase()) return false;
      if (filters.city && !p.city?.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.isVisiting && !(p as any).is_visiting) return false;
      if (filters.openToTravel && !(p as any).open_to_travel) return false;
      // Who
      if (filters.gender && p.gender?.toLowerCase() !== filters.gender.toLowerCase()) return false;
      if (filters.orientation && p.orientation?.toLowerCase() !== filters.orientation.toLowerCase()) return false;
      // Age & Height
      if (p.age < filters.ageRange[0] || p.age > filters.ageRange[1]) return false;
      if (filters.heightRange[0] !== 145 || filters.heightRange[1] !== 200) {
        const heightStr: string = (p as any).basic_info?.height || "";
        const heightNum = parseInt(heightStr);
        if (heightNum && (heightNum < filters.heightRange[0] || heightNum > filters.heightRange[1])) return false;
      }
      // Intention — partial match so "Marriage" matches "Looking for Marriage" etc.
      if (filters.lookingFor) {
        const lf = (p.looking_for || (p as any).relationship_goals?.looking_for || "").toLowerCase();
        if (!lf.includes(filters.lookingFor.toLowerCase())) return false;
      }
      // Lifestyle & Values
      if (filters.religion) {
        const rel = ((p as any).relationship_goals?.religion || "").toLowerCase();
        if (!rel.includes(filters.religion.toLowerCase())) return false;
      }
      if (filters.education) {
        const edu = ((p as any).basic_info?.education || "").toLowerCase();
        if (!edu.includes(filters.education.split(" / ")[0].toLowerCase())) return false;
      }
      if (filters.children) {
        const ch = ((p as any).basic_info?.children || "").toLowerCase();
        const wantsCh = ((p as any).relationship_goals?.values_children || "").toLowerCase();
        if (filters.children === "none" && ch.includes("has")) return false;
        if (filters.children === "has" && !ch.includes("has")) return false;
        if (filters.children === "wants" && !wantsCh.includes("yes")) return false;
      }
      // Quality
      if (filters.verifiedOnly && !(p as any).is_verified) return false;
      if (filters.withPhotoOnly && !(p.avatar_url || (p as any).image)) return false;
      // Activity badges
      if (filters.availableTonight && !p.available_tonight) return false;
      if (filters.onlineNow) {
        const pm = p as any;
        const useMockSchedule = pm.is_mock && pm.mock_online_hours > 0;
        const currentlyOnline = useMockSchedule
          ? isMockCurrentlyOnline(p.id, p.country ?? "Indonesia", pm.mock_online_hours, pm.mock_offline_days)
          : isOnline(p.last_seen_at);
        if (!currentlyOnline) return false;
      }
      if (filters.plusOne && !(p as { is_plusone?: boolean }).is_plusone) return false;
      if (filters.generousLifestyle && !(p as { generous_lifestyle?: boolean }).generous_lifestyle) return false;
      if (filters.weekendPlans && !(p as { weekend_plans?: boolean }).weekend_plans) return false;
      if (filters.lateNightChat && !(p as { late_night_chat?: boolean }).late_night_chat) return false;
      if (filters.noDrama && !(p as { no_drama?: boolean }).no_drama) return false;
      return true;
    });
  }, [allProfiles, filters, blockedIds, userLookingFor]);

  // ── Stable randomised queue ──────────────────────────────────────────────
  // Shuffled ONCE per session. Persists across dashboard/map navigation via
  // sessionStorage so the same order isn't replayed on remount.
  // seenIds tracks which profiles have already been shown; they cycle back
  // only when every profile has been seen (endless loop feel).
  const shuffledQueueRef = useRef<Profile[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  // Independent queues for top and bottom stacks
  const topShuffledQueueRef = useRef<Profile[]>([]);
  const topSeenIdsRef = useRef<Set<string>>(new Set());
  const bottomShuffledQueueRef = useRef<Profile[]>([]);
  const bottomSeenIdsRef = useRef<Set<string>>(new Set());
  // Increment to force topProfiles/bottomProfiles to recompute after queue changes
  const [queueTick, setQueueTick] = useState(0);
  const [coinCardCollectedToday, setCoinCardCollectedToday] = useState(() => {
    try { return sessionStorage.getItem("coin_card_date") === new Date().toDateString(); } catch { return false; }
  });
  const [showUnlockCard, setShowUnlockCard] = useState(false);
  const [unlockCardCollected, setUnlockCardCollected] = useState(false);

  const fisherYates = (arr: Profile[]): Profile[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Build/restore independent queues for top and bottom whenever filteredProfiles changes
  useEffect(() => {
    if (filteredProfiles.length === 0) return;

    // Initialize independent queues for top and bottom
    const topStored = sessionStorage.getItem("top_swipe_queue_ids");
    const topSeenStored = sessionStorage.getItem("top_swipe_seen_ids");
    if (topStored) topShuffledQueueRef.current = filteredProfiles.filter(p => JSON.parse(topStored).includes(p.id));
    if (topSeenStored) topSeenIdsRef.current = new Set(JSON.parse(topSeenStored));

    const bottomStored = sessionStorage.getItem("bottom_swipe_queue_ids");
    const bottomSeenStored = sessionStorage.getItem("bottom_swipe_seen_ids");
    if (bottomStored) bottomShuffledQueueRef.current = filteredProfiles.filter(p => JSON.parse(bottomStored).includes(p.id));
    if (bottomSeenStored) bottomSeenIdsRef.current = new Set(JSON.parse(bottomSeenStored));

    // If no stored queues, create fresh independent shuffles with NO overlapping profiles
    if (topShuffledQueueRef.current.length === 0 || bottomShuffledQueueRef.current.length === 0) {
      const shuffled = fisherYates(filteredProfiles);
      const midPoint = Math.floor(shuffled.length / 2);

      // Split the shuffled array into two non-overlapping halves
      topShuffledQueueRef.current = shuffled.slice(0, midPoint);
      bottomShuffledQueueRef.current = shuffled.slice(midPoint);

      // Ensure both queues have at least some profiles
      if (topShuffledQueueRef.current.length === 0 && filteredProfiles.length > 0) {
        topShuffledQueueRef.current = [filteredProfiles[0]];
      }
      if (bottomShuffledQueueRef.current.length === 0 && filteredProfiles.length > 1) {
        bottomShuffledQueueRef.current = [filteredProfiles[1]];
      }

      sessionStorage.setItem("top_swipe_queue_ids", JSON.stringify(topShuffledQueueRef.current.map(p => p.id)));
      sessionStorage.setItem("bottom_swipe_queue_ids", JSON.stringify(bottomShuffledQueueRef.current.map(p => p.id)));
    }

    // Trigger recompute of topProfiles/bottomProfiles
    setQueueTick(t => t + 1);
  }, [filteredProfiles]);

  // Advance the top queue — called by SwipeStack on each pass/like
  const advanceTopQueue = useCallback((profileId: string) => {
    topSeenIdsRef.current.add(profileId);
    // Persist seen ids
    sessionStorage.setItem("top_swipe_seen_ids", JSON.stringify([...topSeenIdsRef.current]));

    // If all profiles seen in top queue, reshuffle BOTH containers
    if (topSeenIdsRef.current.size >= topShuffledQueueRef.current.length) {
      // Reset seen lists for both queues
      topSeenIdsRef.current = new Set();
      bottomSeenIdsRef.current = new Set();
      sessionStorage.removeItem("top_swipe_seen_ids");
      sessionStorage.removeItem("bottom_swipe_seen_ids");

      // Reshuffle both queues with new non-overlapping profiles
      const shuffled = fisherYates(filteredProfiles);
      const midPoint = Math.floor(shuffled.length / 2);

      topShuffledQueueRef.current = shuffled.slice(0, midPoint);
      bottomShuffledQueueRef.current = shuffled.slice(midPoint);

      // Ensure both queues have profiles
      if (topShuffledQueueRef.current.length === 0 && filteredProfiles.length > 0) {
        topShuffledQueueRef.current = [filteredProfiles[0]];
      }
      if (bottomShuffledQueueRef.current.length === 0 && filteredProfiles.length > 0) {
        bottomShuffledQueueRef.current = [filteredProfiles[Math.min(1, filteredProfiles.length - 1)]];
      }

      sessionStorage.setItem("top_swipe_queue_ids", JSON.stringify(topShuffledQueueRef.current.map(p => p.id)));
      sessionStorage.setItem("bottom_swipe_queue_ids", JSON.stringify(bottomShuffledQueueRef.current.map(p => p.id)));
    }
    // Trigger re-render so topProfiles/bottomProfiles recompute
    setQueueTick(t => t + 1);
  }, [filteredProfiles]);

  // Advance the bottom queue — called by SwipeStack on each pass/like
  const advanceBottomQueue = useCallback((profileId: string) => {
    bottomSeenIdsRef.current.add(profileId);
    // Persist seen ids
    sessionStorage.setItem("bottom_swipe_seen_ids", JSON.stringify([...bottomSeenIdsRef.current]));

    // If all profiles seen in bottom queue, reshuffle BOTH containers
    if (bottomSeenIdsRef.current.size >= bottomShuffledQueueRef.current.length) {
      // Reset seen lists for both queues
      topSeenIdsRef.current = new Set();
      bottomSeenIdsRef.current = new Set();
      sessionStorage.removeItem("top_swipe_seen_ids");
      sessionStorage.removeItem("bottom_swipe_seen_ids");

      // Reshuffle both queues with new non-overlapping profiles
      const shuffled = fisherYates(filteredProfiles);
      const midPoint = Math.floor(shuffled.length / 2);

      topShuffledQueueRef.current = shuffled.slice(0, midPoint);
      bottomShuffledQueueRef.current = shuffled.slice(midPoint);

      // Ensure both queues have profiles
      if (topShuffledQueueRef.current.length === 0 && filteredProfiles.length > 0) {
        topShuffledQueueRef.current = [filteredProfiles[0]];
      }
      if (bottomShuffledQueueRef.current.length === 0 && filteredProfiles.length > 0) {
        bottomShuffledQueueRef.current = [filteredProfiles[Math.min(1, filteredProfiles.length - 1)]];
      }

      sessionStorage.setItem("top_swipe_queue_ids", JSON.stringify(topShuffledQueueRef.current.map(p => p.id)));
      sessionStorage.setItem("bottom_swipe_queue_ids", JSON.stringify(bottomShuffledQueueRef.current.map(p => p.id)));
    }
    // Trigger re-render so bottomProfiles recompute
    setQueueTick(t => t + 1);
  }, [filteredProfiles]);

  // Legacy advanceQueue for compatibility
  const advanceQueue = useCallback((profileId: string) => {
    // This is no longer used since we have independent queues
  }, []);

  // Derive ordered top/bottom from independent queues, ensuring no overlap
  const { topProfiles, bottomProfiles } = useMemo(() => {
    // Use filteredProfiles as immediate fallback before queues are built (first render)
    const topQueue = topShuffledQueueRef.current.length > 0 ? topShuffledQueueRef.current : filteredProfiles;
    const bottomQueue = bottomShuffledQueueRef.current.length > 0 ? bottomShuffledQueueRef.current : filteredProfiles;

    const topUnseen = topQueue.filter(p => !topSeenIdsRef.current.has(p.id));
    const bottomUnseen = bottomQueue.filter(p => !bottomSeenIdsRef.current.has(p.id));

    // If all seen (race condition), use full queues
    const topPool = topUnseen.length > 0 ? topUnseen : topQueue;
    const bottomPool = bottomUnseen.length > 0 ? bottomUnseen : bottomQueue;

    // CRITICAL: Ensure no overlapping profiles between top and bottom
    const topProfileIds = new Set(topPool.map(p => p.id));
    const filteredBottomPool = bottomPool.filter(p => !topProfileIds.has(p.id));

    // If filtering removes all bottom profiles, use bottomPool as fallback
    const safeBottom = filteredBottomPool.length > 0 ? filteredBottomPool : bottomPool;

    // Final safety: ensure neither stack is empty
    const safeTop = topPool.length > 0 ? topPool : (safeBottom.length > 0 ? safeBottom.slice().reverse() : filteredProfiles.slice(0, 1));
    const finalBottom = safeBottom.length > 0 ? safeBottom : (safeTop.length > 1 ? safeTop.slice(1).reverse() : filteredProfiles.slice(1, 2));

    // Inject coin card at position 7 if not collected today
    const COIN_CARD: any = {
      id: "__coin_card__",
      name: "Daily Gift",
      age: 0,
      city: "",
      country: "",
      bio: "",
      image: "https://ik.imagekit.io/7grri5v7d/UntitledfsdfsdfsdfsdfDSFSDFSdssdfdasdasdfgsdfgdfssdfs.png",
      images: [],
      gender: "",
      _coinCard: true,
    };
    const UNLOCK_CARD: any = {
      id: "__unlock_card__",
      name: "Welcome Gift",
      age: 0, city: "", country: "", bio: "",
      image: "https://ik.imagekit.io/7grri5v7d/UntitledfsdfsdfsdfsdfDSFSDFSdssdfdasdasdfgsdfgdfssdfssasdasd.png",
      images: [], gender: "",
      _unlockCard: true,
    };

    let topWithCard = safeTop;
    try {
      // Inject unlock card at position 4 (welcome bonus — shown early)
      const unlockCollected = localStorage.getItem(`unlock_welcome_${user?.id || "guest"}`) === "1";
      if (!unlockCollected && safeTop.length >= 2) {
        topWithCard = [...safeTop];
        topWithCard.splice(Math.min(4, topWithCard.length), 0, UNLOCK_CARD);
      }
    } catch { /* ignore */ }

    const COIN_CARD_POSITION = 7;
    try {
      const collectedToday = sessionStorage.getItem("coin_card_date") === new Date().toDateString();
      if (!collectedToday && topWithCard.length >= 2) {
        topWithCard = [...topWithCard];
        topWithCard.splice(Math.min(COIN_CARD_POSITION + 1, topWithCard.length), 0, COIN_CARD);
      }
    } catch { /* ignore */ }

    return { topProfiles: topWithCard, bottomProfiles: finalBottom };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProfiles, queueTick, coinCardCollectedToday]);

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
  const [showCoinCard, setShowCoinCard] = useState(false);

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

  const [mapProfile, setMapProfile] = useState<any>(null);

  const [devFeaturesEnabled, setDevFeaturesEnabled] = useDevFeatures();
  const [devPanelOpen, setDevPanelOpen] = useState(false);

  // Preload reward videos as soon as page mounts so they're ready when cards appear
  useEffect(() => {
    [TEDDY_VIDEO, UNLOCK_VIDEO].forEach(src => {
      try {
        const vid = document.createElement("video");
        vid.src = src;
        vid.preload = "auto";
        vid.load();
      } catch { /* ignore */ }
    });
  }, []);

  // Check if this user already collected welcome unlocks
  useEffect(() => {
    if (!user?.id) return;
    try {
      setUnlockCardCollected(localStorage.getItem(`unlock_welcome_${user.id}`) === "1");
    } catch { /* ignore */ }
  }, [user?.id]);

  // Video call system
  const videoCall = useVideoCall(user?.id || null);

  // Daily match suggestion
  const [dailyMatchProfile, setDailyMatchProfile] = useState<any | null>(null);

  // Travel notice popup
  const [travelNoticeProfile, setTravelNoticeProfile] = useState<any | null>(null);
  const [travelNoticeType, setTravelNoticeType] = useState<TravelNoticeType>("open_to_travel");

  const POST_LOGIN_LANDING_KEY = "post_login_landing_dismissed";
  const [showPostLoginLanding, setShowPostLoginLanding] = useState(false);

  const REFERRAL_POPUP_SHOWN_KEY = "referralPopupShown";
  const SUPER_LIKES_BALANCE_KEY = "superLikesBalanceLast";

  const [aboutMeTab, setAboutMeTab] = useState<"new" | "sent" | "received" | "treat" | "gifts" | "unlock" | "distance" | "video">("new");
  const [homeUnlockKey, setHomeUnlockKey] = useState<string>("unlock:single");
  const [selectedTreatItem, setSelectedTreatItem] = useState<"massage" | "beautician" | "flowers" | "jewelry" | null>("massage");
  const [openTreatItem, setOpenTreatItem] = useState<"massage" | "beautician" | "flowers" | "jewelry" | null>(null);
  const [selectedDateIdeaIndex, setSelectedDateIdeaIndex] = useState<number | null>(null);
  const [selectedProfileSection, setSelectedProfileSection] = useState<"basic" | "lifestyle" | "interests" | "images" | null>(null);
  const [profileImageViewIndex, setProfileImageViewIndex] = useState(0);
  const [selectedDatePlace, setSelectedDatePlace] = useState<any | null>(null);
  const [selectedUnlockItemKey, setSelectedUnlockItemKey] = useState<string>("unlock:single");

  // Cultural Bridge Guide overlay
  const [showCulturalGuide, setShowCulturalGuide] = useState(false);
  // Visitor Guide overlay
  const [showVisitorGuide, setShowVisitorGuide] = useState(false);
  // Real Gift flow
  const [showRealGiftFlow, setShowRealGiftFlow] = useState(false);
  const [realGiftTarget, setRealGiftTarget] = useState<any>(null);

  // Diamond Gift Match state
  const [matchData, setMatchData] = useState<{ name: string; id: string; avatar?: string } | null>(null);
  const [testGiftOpen, setTestGiftOpen] = useState(false);

  // Bestie system
  const [pendingBestieRequest, setPendingBestieRequest] = useState<BestieRequest | null>(null);
  const [bestieConfirmProfile, setBestieConfirmProfile] = useState<any | null>(null);
  const [sentBestieIds, setSentBestieIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("bestie_sent_ids") || "[]"); } catch { return []; }
  });
  const [confirmedBestieIds, setConfirmedBestieIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("bestie_confirmed_ids") || "[]"); } catch { return []; }
  });

  // Step 1: show confirmation popup with profile details
  const handleBestieRequest = (targetProfile: any) => {
    if (!user) { showGuestPrompt("generic"); return; }
    const targetId = targetProfile?.id;
    if (!targetId || confirmedBestieIds.includes(targetId) || sentBestieIds.includes(targetId)) return;
    setBestieConfirmProfile(targetProfile);
  };

  // Step 2: user confirmed — actually send the request
  const handleBestieConfirmed = (targetProfile: any) => {
    setBestieConfirmProfile(null);
    const targetId = targetProfile?.id;
    if (!targetId) return;
    const updated = [...sentBestieIds, targetId];
    setSentBestieIds(updated);
    try { localStorage.setItem("bestie_sent_ids", JSON.stringify(updated)); } catch { /* ignore */ }
    toast.success(`Bestie request sent to ${targetProfile.name}! 💕`);

    // Simulate the target accepting after 3 seconds (mock — no real backend yet)
    setTimeout(() => {
      const req: BestieRequest = {
        fromId: targetId,
        fromName: targetProfile.name,
        fromAvatar: targetProfile.avatar_url || targetProfile.image || "/placeholder.svg",
        fromAppUserId: targetProfile.app_user_id || generateAppUserId(targetId),
        toId: user?.id || "guest",
        toName: user?.user_metadata?.name || "You",
      };
      setPendingBestieRequest(req);
    }, 3000);
  };

  const handleBestieAccept = (req: BestieRequest) => {
    const updated = [...confirmedBestieIds, req.fromId];
    setConfirmedBestieIds(updated);
    try { localStorage.setItem("bestie_confirmed_ids", JSON.stringify(updated)); } catch { /* ignore */ }
    setPendingBestieRequest(null);
    setSuperLikesCount(prev => prev + 1);
    toast.success(`${req.fromName} accepted! You earned a free Super Like ⭐`);
  };

  const handleBestieDecline = (_req: BestieRequest) => {
    setPendingBestieRequest(null);
  };

  // Bestie referral — shown to User A when User B suggests a bestie instead
  const [bestieReferral, setBestieReferral] = useState<BestieReferral | null>(null);

  const handleBestieReferred = (bestieAppId: string, fromName: string, _fromId: string) => {
    // Look up the referred profile by app_user_id
    const bestieProfile = allProfiles.find((p: Profile) => p.app_user_id === bestieAppId);
    setBestieReferral({
      fromName,
      bestieAppId,
      bestieName: bestieProfile?.name,
      bestieAvatar: bestieProfile?.avatar_url || bestieProfile?.image,
      bestieProfileId: bestieProfile?.id,
    });
  };

  const persistSessionBehavior = useCallback(() => {
    try {
      const key = `session_behavior_${user?.id || "guest"}`;
      sessionStorage.setItem(
        key,
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
  }, [daysSinceLastActive, iLiked, likedMe, user?.id]);


  // Reset tab state whenever the viewed profile changes so Video panel never auto-shows
  useEffect(() => {
    setAboutMeTab("new");
    setSelectedProfileSection(null);
    setSelectedDateIdeaIndex(null);
  }, [profileRouteId]);

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


  // Show daily match suggestion once per day — only after 3 min of swiping
  useEffect(() => {
    if (filteredProfiles.length === 0) return;
    if (!shouldShowDailyMatch()) return;
    const unseen = filteredProfiles.filter(p => !seenIdsRef.current.has(p.id));
    const pool = unseen.length > 0 ? unseen : filteredProfiles;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    // Check every 30s whether the 3-min swipe threshold has been reached
    const t = setInterval(() => {
      if (canShowTimedPopup()) {
        clearInterval(t);
        markTimedPopupShown();
        setDailyMatchProfile(pick);
      }
    }, 30_000);
    return () => clearInterval(t);
  }, [filteredProfiles]);

  // Show travel notice — session 4+ only, after 3 min of swiping (major-player standard)
  useEffect(() => {
    if (filteredProfiles.length === 0) return;
    if (!shouldShowTravelNotice()) return;
    if (!canShowTravelNotice()) return; // session 4+ gate
    const genderVal = (user as any)?.user_metadata?.gender || "male";
    const opposite = genderVal === "male" ? "female" : "male";
    const travelPool = filteredProfiles.filter(p =>
      ((p as any).gender === opposite || (p as any).gender === "female") &&
      ((p as any).open_to_travel || (p as any).is_visiting)
    );
    if (travelPool.length === 0) return;
    const pick = travelPool[Math.floor(Math.random() * travelPool.length)];
    const type: TravelNoticeType = (pick as any).is_visiting ? "coming_to_city" : "open_to_travel";
    // Only fire once the 3-min swipe threshold is already confirmed
    const t = setInterval(() => {
      if (canShowTravelNotice()) {
        clearInterval(t);
        markTimedPopupShown();
        setTravelNoticeProfile(pick);
        setTravelNoticeType(type);
      }
    }, 30_000);
    return () => clearInterval(t);
  }, [filteredProfiles, user]);

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
    setUserLookingFor,
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
    handleRose: handleRoseRaw,
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
    userCountry: getUserCountry(),
    isGlobalDater,
    setGlobalDatingUpsell: (profile: any) => {
      if (!canShowCommercial()) return; // respect 24h commercial cooldown
      markCommercialShown();
      setGlobalDatingUpsell(profile);
    },
  });


  // Intercept swipe-up (rose) to show WA lock popup if profile is locked
  const handleRose = useCallback((profile: any) => {
    if (isProfileLocked(profile.id, profile.is_mock)) {
      // Build popup data from WaLock store or fall back to profile fields
      const waLock = isWaLocked(profile.id) || {
        profileId: profile.id,
        profileName: profile.name,
        profileImage: profile.avatar_url || profile.images?.[0] || profile.image,
        lockUntil: Date.now() + 72 * 60 * 60 * 1000,
      };
      setWaLockPopup(waLock);
      return;
    }
    handleRoseRaw(profile);
  }, [handleRoseRaw, setWaLockPopup]);

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
      <p className="mt-5 text-white text-xl font-bold tracking-widest" style={{ fontFamily: "inherit" }}>Date2me.com</p>
      <p className="mt-1 text-white/40 text-xs tracking-wider">Connect Instantly</p>
      <div className="mt-8 flex gap-1.5">
        {[0, 1, 2].map(i => (
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
              onClick={() => navigate("/")}
              aria-label="Back to profiles"
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              title="Back to profiles"
            >
              <User className="w-4.5 h-4.5" />
            </button>
          ) : (
            <>
              {user ? (
                <>
                  <CoinHub
                    balance={coinBalance.balance}
                    loading={coinBalance.loading}
                    onClick={() => setShowCoinRefuel(true)}
                  />
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
      {(() => {
        // Compute which full-panel overlay is active (if any)
        const dateIdeaPlace = isProfileRoute && aboutMeTab === "sent" && selectedDateIdeaIndex !== null
          ? (selectedProfile?.first_date_places || [])[selectedDateIdeaIndex]
          : null;
        const showDateIdeaPanel = !!dateIdeaPlace;
        const showProfilePanel = isProfileRoute && aboutMeTab === "new" && selectedProfileSection !== null;
        const showVideoPanel = isProfileRoute && aboutMeTab === "video";
        const showFullPanel = showDateIdeaPanel || showProfilePanel || showVideoPanel;

        return (
          <div className="flex-1 grid gap-2 p-2 min-h-0 pb-safe" style={{ paddingBottom: `max(0.5rem, env(safe-area-inset-bottom, 0px))`, gridTemplateRows: isProfileRoute ? (showFullPanel ? "1fr" : "1fr auto") : "1fr 12rem 1fr" }}>
            {showDateIdeaPanel ? (
              <DateIdeaDetailPanel
                dateIdea={dateIdeaPlace.idea}
                imageUrl={dateIdeaPlace.image_url || undefined}
                onClose={() => setSelectedDateIdeaIndex(null)}
              />
            ) : showVideoPanel && selectedProfile ? (
              <VideoIntroPanel
                profile={selectedProfile}
                currentUserId={user?.id}
                currentUserName={userName}
                onClose={() => setAboutMeTab("new")}
                onMatch={(name, id) => setMatchData({ name, id })}
              />
            ) : showProfilePanel ? (
              selectedProfileSection === "images" ? (
                <ProfileImagesPanel
                  profile={selectedProfile}
                  imageIndex={profileImageViewIndex}
                  setImageIndex={setProfileImageViewIndex}
                  onClose={() => setSelectedProfileSection(null)}
                  iLiked={iLiked}
                  handleLike={handleLike}
                  likedMe={likedMe}
                  onOpenMap={(p) => setMapProfile(p)}
                  onBestieRequest={handleBestieRequest}
                  isBestie={confirmedBestieIds.includes(selectedProfile?.id)}
                  isBestiePending={sentBestieIds.includes(selectedProfile?.id)}
                />
              ) : (
                <ProfileInfoPanel
                  profile={selectedProfile}
                  onClose={() => setSelectedProfileSection(null)}
                  allProfiles={allProfiles}
                  onBestieRequest={handleBestieRequest}
                  isBestie={confirmedBestieIds.includes(selectedProfile?.id)}
                  isBestiePending={sentBestieIds.includes(selectedProfile?.id)}
                  onSendRealGift={() => { setRealGiftTarget(selectedProfile); setShowRealGiftFlow(true); }}
                  coinBalance={coinBalance.balance}
                  onAskQuestion={(template) => {
                    if (coinBalance.balance < template.coinCost) {
                      toast.error(`Not enough coins — need ${template.coinCost} 💰`);
                      return;
                    }
                    const ok = profileQuestions.askQuestion(template, selectedProfile?.id ?? "");
                    if (ok) {
                      coinBalance.addCoins(-template.coinCost);
                      toast.success(`Question sent to ${selectedProfile?.name?.split(" ")[0] || "her"} 💌`);
                    } else {
                      toast.info("Already asked this question");
                    }
                  }}
                  askedStates={Object.fromEntries(
                    profileQuestions.asked
                      .filter(q => q.toProfileId === selectedProfile?.id)
                      .map(q => [q.templateId, q.status])
                  )}
                  answeredValues={Object.fromEntries(
                    profileQuestions.asked
                      .filter(q => q.toProfileId === selectedProfile?.id && q.status === "answered" && q.answer)
                      .map(q => [q.templateId, q.answer!])
                  )}
                  onBlock={() => {
                    if (selectedProfile?.id) {
                      setBlockedIds(prev => new Set([...prev, selectedProfile.id]));
                    }
                    setSelectedList([]);
                    setSelectedIndex(0);
                  }}
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
                  onOpenMap={(p) => setMapProfile(p)}
                  handleLibraryCardDrag={handleLibraryCardDrag}
                  advanceQueue={advanceTopQueue}
                  navigate={navigate}
                  sessionStatsRef={sessionStatsRef}
                  setSessionTick={setSessionTick}
                  persistSessionBehavior={persistSessionBehavior}
                  onCoinCard={() => setShowCoinCard(true)}
                  onUnlockCard={() => setShowUnlockCard(true)}
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
                            video: "Video",
                          }
                          : undefined
                      }
                      onTabChange={(t) => {
                        // Video tab — clear other panel state
                        if (t === "video") {
                          setSelectedProfileSection(null);
                          setSelectedDateIdeaIndex(null);
                          setAboutMeTab(t);
                          return;
                        }
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
                      // Gifts tab props
                      selectedProfile={isProfileRoute ? selectedProfile : null}
                      allProfiles={allProfiles}
                      onGiftSent={() => {
                        console.log("Gift sent in Index");
                      }}
                      iLiked={iLiked}
                      likedMe={likedMe}
                      newProfiles={libraryNewProfiles}
                      filterCountry={filters.country}
                      hidePrivateTabs={!isProfileRoute && !user}
                      currentUserId={user?.id}
                      receivedHighlightProfileId={null}
                      heartDropProfileId={null}
                      superLikeGlowProfileId={superLikeGlowProfileId}
                      onUnlock={handleUnlock}
                      onChat={(profile) => setChatProfile(profile)}
                      onSelectProfile={(profile, sourceList) => {
                        handleSelectProfile(profile, sourceList);
                      }}
                      onPurchaseFeature={handlePurchaseFeature}
                      onCulturalGuide={() => setShowCulturalGuide(true)}
                      onVisitorGuide={() => setShowVisitorGuide(true)}
                      onGhostMode={() => navigate("/ghost")}
                    />
                  </div>
                </motion.div>

                {/* Bottom Card — home page: swipe stack / package detail */}
                {!isProfileRoute && (
                  <div className="relative rounded-2xl overflow-hidden min-h-0 bg-gradient-to-br from-fuchsia-900/30 via-black/30 to-purple-900/30 backdrop-blur-xl border-2 border-fuchsia-400/25 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-fuchsia-300/15 isolate" style={{ contain: "layout" }}>
                    {aboutMeTab === "unlock" ? (
                      <HomePackageDetail packageKey={homeUnlockKey || "unlock:single"} onClose={() => { setHomeUnlockKey(""); setAboutMeTab("new"); }} onPurchase={handlePurchaseFeature} />
                    ) : (
                      <SwipeStack
                        key="bottom-stack"
                        profiles={bottomProfiles}
                        direction="down"
                        roseAvailable={roseAvailable}
                        onRose={handleRose}
                        onLike={(p) => {
                          handleLike(p);
                          advanceBottomQueue(p.id);
                          if (user) navigate(`/profile/${p.id}`);
                        }}
                        onPass={(p) => {
                          sessionStatsRef.current.passed += 1;
                          setSessionTick((v) => v + 1);
                          advanceBottomQueue(p.id);
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Bottom Card — profile page (female only): International Marriage Services */}
                {isProfileRoute && selectedProfile?.gender?.toLowerCase() === "female" && (
                  <div className="relative rounded-2xl overflow-hidden min-h-0 bg-gradient-to-br from-[#0a1428]/80 via-black/60 to-[#0d1f3c]/80 backdrop-blur-xl border border-[#c9a227]/30 shadow-[0_4px_20px_rgba(201,162,39,0.12)] ring-1 ring-[#c9a227]/10" style={{ contain: "layout" }}>
                    <InternationalMarriagePanel
                      profile={selectedProfile}
                      onConsult={handlePurchaseFeature}
                    />
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
                      <button
                        type="button"
                        onClick={() => setTestGiftOpen(true)}
                        className="w-full flex items-center gap-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        🎁 Test Gift Popup
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const p = topProfiles[0] || filteredProfiles[0];
                          if (!p) return;
                          // Write to both lock systems so the badge shows AND the popup shows
                          setProfileLock(p.id, true); // immediate — badge shows in carousel now
                          const lock = { profileId: p.id, profileName: p.name, profileImage: p.avatar_url || p.images?.[0] || p.image, lockUntil: Date.now() + 72 * 60 * 60 * 1000 };
                          addWaLock(lock);
                          setWaLockPopup(lock);
                        }}
                        className="w-full flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        🔒 Test WA Lock Popup
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* Profile page is now routed to /profile/:id and clones Home layout */}

      <AppDialogs
        showReferralPopup={showReferralPopup}
        setShowReferralPopup={setShowReferralPopup}
        referralCode={myReferralCode}
        user={user}
        REFERRAL_POPUP_SHOWN_KEY={REFERRAL_POPUP_SHOWN_KEY}
        matchedProfile={matchDialog}
        setMatchedProfile={setMatchDialog}
        iLiked={iLiked}
        likedMe={likedMe}
        handleUnlock={handleUnlock}
        onChatWithMatch={(profile) => setChatProfile(profile)}
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

      {/* Travel Notice Popup */}
      {travelNoticeProfile && (
        <TravelNoticePopup
          profile={travelNoticeProfile}
          type={travelNoticeType}
          yourCity={(user as any)?.user_metadata?.city || "your city"}
          onLike={(p) => {
            markTravelNoticeShown();
            setTravelNoticeProfile(null);
            handleLike(p);
          }}
          onDismiss={() => {
            markTravelNoticeShown();
            setTravelNoticeProfile(null);
          }}
        />
      )}

      {/* ── Cultural Bridge Guide overlay ────────────────────────────── */}
      <AnimatePresence>
        {showCulturalGuide && (
          <CulturalBridgePage
            onClose={() => setShowCulturalGuide(false)}
            coinBalance={coinBalance.balance}
            onSpendCoins={(amount) => coinBalance.addCoins(-amount)}
            profile={selectedProfile}
          />
        )}
      </AnimatePresence>

      {/* ── Visitor Guide overlay ─────────────────────────────────── */}
      <AnimatePresence>
        {showVisitorGuide && (
          <VisitorGuidePage onClose={() => setShowVisitorGuide(false)} profile={selectedProfile} />
        )}
      </AnimatePresence>

      {/* ── Real Gift Order Flow ──────────────────────────────────── */}
      <AnimatePresence>
        {showRealGiftFlow && (
          <RealGiftOrderFlow
            onClose={() => { setShowRealGiftFlow(false); setRealGiftTarget(null); }}
            currentUserId={user?.id || "guest"}
            currentUserName={currentUser}
          />
        )}
      </AnimatePresence>

      {/* ── Gift Delivery Notification (for recipient) ────────────── */}
      {user?.id && (
        <GiftDeliveryNotification
          userId={user.id}
          onDismiss={() => {}}
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

      {showCoinRefuel && (
        <TokenPurchase
          onClose={() => setShowCoinRefuel(false)}
          onPurchaseSuccess={() => {
            setShowCoinRefuel(false);
            coinBalance.addCoins(50);
          }}
        />
      )}

      {/* Dev: test gift receive popup */}
      {testGiftOpen && (
        <GiftReceivePopup
          gift={{
            id: "test-gift-001",
            sender_id: "test-sender",
            sender_name: filteredProfiles[0]?.name || "Jessica",
            gift_id: "g11",
            gift_name: "Flower Bouquet",
            gift_image_url: "https://ik.imagekit.io/7grri5v7d/flower-bouquet-removebg-preview.png",
            gift_emoji: "💐",
            message: "Thinking of you — hope this brightens your day! 🌸",
            status: "pending",
            created_at: new Date().toISOString(),
          }}
          onClose={() => setTestGiftOpen(false)}
          onGiftAccepted={() => setTestGiftOpen(false)}
          onGiftRefused={() => setTestGiftOpen(false)}
          onMatch={(name, id) => { setTestGiftOpen(false); setMatchData({ name, id }); }}
          onBestieReferred={(bid, fromName, fromId) => { setTestGiftOpen(false); handleBestieReferred(bid, fromName, fromId); }}
        />
      )}

      {/* Gift Receiver — listens for incoming gifts for the current user */}
      <GiftReceiver
        currentUserId={user?.id}
        onMatch={(senderName, senderId) =>
          setMatchData({ name: senderName, id: senderId })
        }
      />

      {/* Match Popup — shown when a mutual like is detected after gift acceptance */}
      <AnimatePresence>
        {matchData && (
          <MatchPopup
            matchedProfileId={matchData.id}
            matchedProfileName={matchData.name}
            matchedProfileAvatar={matchData.avatar}
            currentUserName={userName}
            onClose={() => setMatchData(null)}
          />
        )}
      </AnimatePresence>

      {/* Bestie Referral Popup — shown to User A when User B suggests their bestie */}
      <BestieReferralPopup
        referral={bestieReferral}
        onViewProfile={(profileId) => navigate(`/profile/${profileId}`)}
        onClose={() => setBestieReferral(null)}
      />

      {/* Bestie Confirm Popup — shown before sending the request */}
      <BestieConfirmPopup
        profile={bestieConfirmProfile}
        onConfirm={handleBestieConfirmed}
        onCancel={() => setBestieConfirmProfile(null)}
      />

      {/* Bestie Request Popup — shown when target accepts (simulated) */}
      <BestieRequestPopup
        request={pendingBestieRequest}
        onAccept={handleBestieAccept}
        onDecline={handleBestieDecline}
      />

      {/* Distance Map Overlay — opens when map badge tapped on a profile */}
      <AnimatePresence>
        {mapProfile && (
          <DistanceMapOverlay
            profile={mapProfile}
            allProfiles={allProfiles}
            onClose={() => setMapProfile(null)}
            onLike={(p) => { handleLike(p); setMapProfile(null); }}
            onSuperLike={(p) => { handleRose(p); setMapProfile(null); }}
          />
        )}
      </AnimatePresence>

      {/* Profile Question Blocker — shown when a pending question requires an answer */}
      <AnimatePresence>
        {profileQuestions.pendingReceived.length > 0 && (
          <ProfileQuestionBlocker
            question={profileQuestions.pendingReceived[0]}
            onAnswer={profileQuestions.answerReceived}
          />
        )}
      </AnimatePresence>

      {/* WA Lock Popup — shown when swiping up on a locked profile */}
      <AnimatePresence>
        {waLockPopup && (
          <WaLockedPopup
            profileName={waLockPopup.profileName}
            profileImage={waLockPopup.profileImage}
            lockUntil={waLockPopup.lockUntil}
            onClose={() => setWaLockPopup(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Unlock Card Modal ────────────────────────────────────── */}
      <UnlockCollectModal
        open={showUnlockCard}
        onCollect={() => {
          // Store 2 free unlocks in profile
          if (user?.id) {
            (supabase as any)
              .from("profiles")
              .update({ free_unlocks_remaining: 2 })
              .eq("id", user.id)
              .then(() => {});
            try { localStorage.setItem(`unlock_welcome_${user.id}`, "1"); } catch { /* ignore */ }
          }
          setUnlockCardCollected(true);
          setShowUnlockCard(false);
          toast.success("🔓 2 free unlocks added! Go find your match.");
        }}
        onDismiss={() => setShowUnlockCard(false)}
      />

      {/* ── Coin Card Collect Modal ───────────────────────────────── */}
      <CoinCollectModal
        open={showCoinCard}
        amount={10}
        onCollect={() => {
          // Add coins to balance
          coinBalance.addCoins(10);
          // Persist to Supabase wallet
          if (user?.id) {
            (supabase as any)
              .from("user_wallets")
              .upsert({ user_id: user.id, current_balance: coinBalance.balance + 10 }, { onConflict: "user_id" })
              .then(() => {});
          }
          // Mark collected today
          try { sessionStorage.setItem("coin_card_date", new Date().toDateString()); } catch { /* ignore */ }
          setCoinCardCollectedToday(true);
          setShowCoinCard(false);
          toast.success("🪙 10 coins added to your balance!");
        }}
        onDismiss={() => setShowCoinCard(false)}
      />

      {/* ── Global Dating Upsell ─────────────────────────────────── */}
      <GlobalDatingUpsell
        open={!!globalDatingUpsell}
        targetName={globalDatingUpsell?.name}
        targetCountry={globalDatingUpsell?.country}
        onClose={() => setGlobalDatingUpsell(null)}
      />

      {/* ── In-App Chat ───────────────────────────────────────────── */}
      <AnimatePresence>
        {chatProfile && user?.id && (
          <ChatPanel
            currentUserId={user.id}
            otherUser={{
              id: chatProfile.id,
              name: chatProfile.name,
              avatar_url: chatProfile.avatar_url ?? chatProfile.images?.[0] ?? null,
              last_seen_at: chatProfile.last_seen_at ?? null,
              age: chatProfile.age,
            }}
            onClose={() => setChatProfile(null)}
            onUnlock={() => {
              setChatProfile(null);
              handleUnlock(chatProfile);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default Index;
