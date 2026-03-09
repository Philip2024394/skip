import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence, PanInfo, useMotionValue, animate } from "framer-motion";
import { Heart, MapPin, Zap, LogIn, MessageCircle, SlidersHorizontal, Fingerprint, Home, ChevronLeft, ChevronRight, Star } from "lucide-react";
import AppLogo from "@/components/AppLogo";
import { Profile } from "@/components/SwipeCard";
import SwipeStack from "@/components/SwipeStack";
import LikesLibrary from "@/components/LikesLibrary";
import ButterflyLikeAnimation from "@/components/ButterflyLikeAnimation";
import SuperLikeRevealModal from "@/components/SuperLikeRevealModal";
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
import { useLanguage } from "@/i18n/LanguageContext";
import { LIKE_EXPIRY_MS, ROSE_RESET_DAYS, MS_PER_DAY, APP_NAME } from "@/lib/constants";
import { isNetworkError } from "@/utils/payments";
import { hasUnlockBadges } from "@/utils/unlockPrice";
import { useDevFeatures, isDevBuild } from "@/hooks/useDevFeatures";
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

const Index = () => {
  const { t, toggleLocale, locale } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const isProfileRoute = location.pathname.startsWith("/profile/");
  const profileRouteId = isProfileRoute ? (params as any).id : undefined;
  const [user, setUser] = useState<any>(null);
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
    const unseen = shuffledQueueRef.current.filter(p => !seenIdsRef.current.has(p.id));
    // If all seen (race condition before advanceQueue fires), use full queue
    const pool = unseen.length > 0 ? unseen : shuffledQueueRef.current;
    const top: Profile[] = [];
    const bottom: Profile[] = [];
    pool.forEach((p, i) => {
      if (i % 2 === 0) top.push(p);
      else bottom.push(p);
    });
    return { topProfiles: top, bottomProfiles: bottom };
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
  const [selectedList, setSelectedList] = useState<Profile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [profileImageIndex, setProfileImageIndex] = useState(0);
  const [profileImageDirection, setProfileImageDirection] = useState<1 | -1>(1);
  const topCardX = useMotionValue(0);
  const isAnimatingTopCardRef = useRef(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const welcomeBackName = useRef<string>("");

  // Butterfly: when a new like appears, fly to library and drop heart on that profile's card
  const libraryRef = useRef<HTMLDivElement>(null);
  const prevLikedMeIdsRef = useRef<Set<string>>(new Set());
  const [butterflyTarget, setButterflyTarget] = useState<string | null>(null);
  const [heartDropProfileId, setHeartDropProfileId] = useState<string | null>(null);
  const [superLikeRevealProfile, setSuperLikeRevealProfile] = useState<Profile | null>(null);
  const [superLikeGlowProfileId, setSuperLikeGlowProfileId] = useState<string | null>(null);

  const [devFeaturesEnabled, setDevFeaturesEnabled] = useDevFeatures();
  const [devPanelOpen, setDevPanelOpen] = useState(false);

  const POST_LOGIN_LANDING_KEY = "post_login_landing_dismissed";
  const [showPostLoginLanding, setShowPostLoginLanding] = useState(false);

  // Guest auth prompt
  const [guestPrompt, setGuestPrompt] = useState<{ open: boolean; trigger: "like" | "superlike" | "profile" | "map" | "match" | "filter" | "purchase" | "generic" }>({ open: false, trigger: "generic" });
  const showGuestPrompt = (trigger: typeof guestPrompt["trigger"]) => setGuestPrompt({ open: true, trigger });

  const [aboutMeTab, setAboutMeTab] = useState<"new" | "sent" | "received">("new");
  const [profileReviews, setProfileReviews] = useState<Array<{ id: string; text: string; created_at: string; reviewer_id: string }> | null>(null);
  const [profileReviewsLoading, setProfileReviewsLoading] = useState(false);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [reviewerAvatarById, setReviewerAvatarById] = useState<Record<string, string>>({});
  const [selectedDateIdeaIndex, setSelectedDateIdeaIndex] = useState(0);
  const [selectedProfileSection, setSelectedProfileSection] = useState<"basic" | "lifestyle" | "interests">("basic");
  const [selectedUnlockItemKey, setSelectedUnlockItemKey] = useState<string>("unlock:single");

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

  useEffect(() => {
    if (!isProfileRoute) return;
    setAboutMeTab("new");
    setSelectedDateIdeaIndex(0);
    setSelectedProfileSection("basic");
    setSelectedUnlockItemKey("unlock:single");
  }, [isProfileRoute, selectedProfile?.id]);

  useEffect(() => {
    if (!isProfileRoute) return;
    if (aboutMeTab !== "sent") return;
    setSelectedDateIdeaIndex(0);
  }, [aboutMeTab, isProfileRoute, selectedProfile?.id]);

  useEffect(() => {
    if (!isProfileRoute) return;
    if (aboutMeTab !== "received") return;
    if (!selectedProfile?.id) return;

    if (!user) {
      setProfileReviews(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setProfileReviewsLoading(true);
      try {
        const { data, error } = await supabase
          .from("personality_reviews")
          .select("id, text, created_at, reviewer_id")
          .eq("profile_id", selectedProfile.id)
          .order("created_at", { ascending: false })
          .limit(30);

        if (cancelled) return;

        if (error) {
          setProfileReviews([]);
          return;
        }
        setProfileReviews((data as any) ?? []);
      } finally {
        if (!cancelled) setProfileReviewsLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [aboutMeTab, isProfileRoute, selectedProfile?.id, user]);

  useEffect(() => {
    setActiveReviewIndex(0);
  }, [selectedProfile?.id, aboutMeTab]);

  useEffect(() => {
    if (!isProfileRoute) return;
    if (aboutMeTab !== "received") return;
    if (!user) return;

    const len = profileReviews?.length ?? 0;
    if (len <= 1) return;

    const id = window.setInterval(() => {
      setActiveReviewIndex((i) => (i + 1) % len);
    }, 5000);

    return () => window.clearInterval(id);
  }, [aboutMeTab, isProfileRoute, profileReviews?.length, user]);

  useEffect(() => {
    if (!isProfileRoute) return;
    if (aboutMeTab !== "received") return;
    if (!user) return;

    const reviewerIds = Array.from(new Set((profileReviews || []).map((r) => r.reviewer_id).filter(Boolean)));
    const missing = reviewerIds.filter((id) => !reviewerAvatarById[id]);
    if (missing.length === 0) return;

    supabase
      .from("profiles_public")
      .select("id, avatar_url")
      .in("id", missing)
      .then(({ data, error }) => {
        if (error || !data) return;
        const next: Record<string, string> = {};
        for (const row of data as any[]) {
          if (row?.id && row?.avatar_url) next[row.id] = row.avatar_url;
        }
        if (Object.keys(next).length === 0) return;
        setReviewerAvatarById((prev) => ({ ...prev, ...next }));
      });
  }, [aboutMeTab, isProfileRoute, profileReviews, reviewerAvatarById, user]);

  useEffect(() => {
    if (!isProfileRoute) return;
    setProfileImageIndex(0);
    setProfileImageDirection(1);
  }, [isProfileRoute, selectedProfile?.id]);

  useEffect(() => {
    topCardX.set(0);
  }, [selectedIndex, selectedList.length, topCardX]);

  // Show post-login landing once per session when user lands on /
  useEffect(() => {
    if (!loading && user && typeof sessionStorage !== "undefined" && !sessionStorage.getItem(POST_LOGIN_LANDING_KEY)) {
      setShowPostLoginLanding(true);
    }
  }, [loading, user]);

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

  useEffect(() => {
    const checkAuth = async () => {
      // Load locally persisted likes immediately
      const localLikes = getLocalLikedProfiles();
      if (localLikes.length > 0) {
        setILiked(localLikes);
      }
      const localLikedMe = getLocalLikedMeProfiles();
      if (localLikedMe.length > 0) {
        setLikedMe(localLikedMe);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);

        // Check rose availability, terms acceptance, and gender
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("last_rose_at, terms_accepted_at, gender, is_active, name")
          .eq("id", session.user.id)
          .single();
        if (myProfile) {
          if (myProfile.last_rose_at) {
            const daysSince = (Date.now() - new Date(myProfile.last_rose_at).getTime()) / MS_PER_DAY;
            setRoseAvailable(daysSince >= ROSE_RESET_DAYS);
            setLastRoseAt(myProfile.last_rose_at);
          }
          if (!(myProfile as any).terms_accepted_at) {
            setShowTerms(true);
          }
          if ((myProfile as any).gender) {
            setUserGender((myProfile as any).gender);
          }

          // Re-activate a previously deactivated account on login
          if ((myProfile as any).is_active === false) {
            await supabase
              .from("profiles")
              .update({ is_active: true, hidden_until: null } as any)
              .eq("id", session.user.id);
            const name = (myProfile as any).name || "friend";
            welcomeBackName.current = name;
            setShowWelcomeBack(true);
          }
        }
      }
      setLoading(false);

      // Fetch real profiles from DB
      try {
        const query = supabase
          .from("profiles_public")
          .select("*")
          .eq("is_active", true)
          .eq("is_banned", false);
        if (session) query.neq("id", session.user.id);
        const { data: profiles } = await query;

        if (profiles && profiles.length > 0) {
          // Fetch extra fields from profiles table (spotlight, image positions, date ideas)
          const { data: extraData } = await supabase
            .from("profiles")
            .select("id, is_spotlight, spotlight_until, main_image_pos, image_positions, first_date_idea, first_date_places");

          const spotlightIds = new Set(
            (extraData || [])
              .filter((s: any) => s.is_spotlight && s.spotlight_until && new Date(s.spotlight_until) > new Date())
              .map((s: any) => s.id)
          );
          const posMap = new Map((extraData || []).map((s: any) => [s.id, s.main_image_pos]));
          const zoomMap = new Map((extraData || []).map((s: any) => {
            const positions = s.image_positions || [];
            const mainPos = positions[0];
            return [s.id, mainPos?.zoom || 100];
          }));
          const dateIdeaMap = new Map((extraData || []).map((s: any) => [s.id, s.first_date_idea]));
          const datePlacesMap = new Map((extraData || []).map((s: any) => [s.id, s.first_date_places || []]));

          const mapped: Profile[] = (profiles as any[])
            .filter((p) => p.avatar_url || (p.images && p.images.length > 0))
            .map((p) => ({
              id: p.id,
              name: p.name,
              age: p.age,
              city: p.city || "",
              country: p.country || "",
              bio: p.bio || "",
              image: p.avatar_url || p.images[0],
              images: p.images && p.images.length > 0 ? p.images : (p.avatar_url ? [p.avatar_url] : []),
              gender: p.gender,
              avatar_url: p.avatar_url,
              latitude: p.latitude,
              longitude: p.longitude,
              available_tonight: p.available_tonight,
              voice_intro_url: p.voice_intro_url,
              last_seen_at: p.last_seen_at,
              looking_for: p.looking_for,
              main_image_pos: posMap.get(p.id) || "50% 50%",
              main_image_zoom: zoomMap.get(p.id) || 100,
              first_date_idea: dateIdeaMap.get(p.id) || (p as any).first_date_idea || null,
              first_date_places: datePlacesMap.get(p.id) || [],
              is_plusone: (p as any).is_plusone || false,
              generous_lifestyle: (p as any).generous_lifestyle || false,
              weekend_plans: (p as any).weekend_plans || false,
              late_night_chat: (p as any).late_night_chat || false,
              no_drama: (p as any).no_drama || false,
              whatsapp_connections_count: (p as any).whatsapp_connections_count ?? 0,
              date_canceled_count: (p as any).date_canceled_count ?? 0,
              height_cm: (p as any).height_cm ?? null,
              drinking: (p as any).drinking ?? null,
              smoking: (p as any).smoking ?? null,
              fitness: (p as any).fitness ?? null,
              pets: (p as any).pets ?? null,
              interests: (p as any).interests ?? null,
            }));
          // Sort spotlight profiles to front
          mapped.sort((a, b) => (spotlightIds.has(b.id) ? 1 : 0) - (spotlightIds.has(a.id) ? 1 : 0));
          setDbProfiles(mapped);
          try { sessionStorage.setItem("2dateme_profiles_cache", JSON.stringify(mapped)); } catch { /* quota */ }

          // Fetch likes only if logged in
          if (session) {
            const { data: myLikes } = await supabase
              .from("likes")
              .select("liked_id, expires_at, is_rose")
              .eq("liker_id", session.user.id)
              .gte("expires_at", new Date().toISOString());

            if (myLikes && myLikes.length > 0) {
              const likedMap = new Map(myLikes.map((l: any) => [l.liked_id, { expires_at: l.expires_at, is_rose: l.is_rose }]));
              const sentLikeProfiles = (profiles as any[])
                .filter((p) => likedMap.has(p.id))
                .map((p) => ({
                  id: p.id, name: p.name, age: p.age,
                  city: p.city || "", country: p.country || "",
                  bio: p.bio || "", gender: p.gender,
                  image: p.avatar_url || (p.images && p.images[0]) || "/placeholder.svg",
                  images: p.images && p.images.length > 0 ? p.images : (p.avatar_url ? [p.avatar_url] : []),
                  avatar_url: p.avatar_url,
                  latitude: p.latitude, longitude: p.longitude,
                  available_tonight: p.available_tonight,
                  voice_intro_url: p.voice_intro_url,
                  expires_at: likedMap.get(p.id)!.expires_at,
                  is_rose: likedMap.get(p.id)!.is_rose,
                  is_plusone: (p as any).is_plusone || false,
                  generous_lifestyle: (p as any).generous_lifestyle || false,
                  weekend_plans: (p as any).weekend_plans || false,
                  late_night_chat: (p as any).late_night_chat || false,
                  no_drama: (p as any).no_drama || false,
                }));
              const mergedLikes = [
                ...sentLikeProfiles,
                ...localLikes.filter((p) => !sentLikeProfiles.some((dbLike) => dbLike.id === p.id)),
              ];
              setILiked(mergedLikes);
              mergedLikes.forEach((p) => upsertLocalLikedProfile(p));
            }

            const { data: likesReceived } = await supabase
              .from("likes")
              .select("liker_id, expires_at")
              .eq("liked_id", session.user.id)
              .gte("expires_at", new Date().toISOString());

            if (likesReceived && likesReceived.length > 0) {
              const likerMap = new Map(likesReceived.map((l: any) => [l.liker_id, l.expires_at]));
              const likedProfiles = (profiles as any[])
                .filter((p) => likerMap.has(p.id))
                .map((p) => ({
                  id: p.id, name: p.name, age: p.age,
                  city: p.city || "", country: p.country || "",
                  bio: p.bio || "",
                  image: p.avatar_url || (p.images && p.images[0]) || "/placeholder.svg",
                  images: p.images && p.images.length > 0 ? p.images : (p.avatar_url ? [p.avatar_url] : []),
                  gender: p.gender, avatar_url: p.avatar_url,
                  latitude: p.latitude, longitude: p.longitude,
                  available_tonight: p.available_tonight,
                  voice_intro_url: p.voice_intro_url,
                  expires_at: likerMap.get(p.id),
                  is_plusone: (p as any).is_plusone || false,
                  generous_lifestyle: (p as any).generous_lifestyle || false,
                  weekend_plans: (p as any).weekend_plans || false,
                  late_night_chat: (p as any).late_night_chat || false,
                  no_drama: (p as any).no_drama || false,
                }));
              setLikedMe(likedProfiles);
              saveLocalLikedMeProfiles(likedProfiles);
            }
          }
        }
      } catch {
        // Profile fetch failed silently — app still renders
      }

      // No mock "liked me" — only real likes from DB
    };
    checkAuth();

    // Refresh liked profiles when map page writes a like to localStorage
    const handleStorage = () => {
      const updated = getLocalLikedProfiles();
      if (updated.length > 0) setILiked(updated);
    };
    window.addEventListener("storage", handleStorage);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) setUser(null);
      else setUser(session.user);
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, [navigate]);

  // Detect new like: when likedMe gains an id we didn't have before (and we had a previous set), trigger butterfly (not for super likes — those use the dynamite modal)
  useEffect(() => {
    const currentIds = new Set(likedMe.map((p) => p.id));
    const prev = prevLikedMeIdsRef.current;
    const newProfiles = likedMe.filter((p) => !prev.has(p.id));
    const newRegular = newProfiles.find((p) => !p.is_rose);
    if (prev.size > 0 && newRegular) {
      setButterflyTarget(newRegular.id);
    }
    prevLikedMeIdsRef.current = currentIds;
  }, [likedMe]);

  // Realtime: when someone likes the current user, add them to likedMe (then butterfly effect will trigger)
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("likes-received")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "likes",
          filter: `liked_id=eq.${user.id}`,
        },
        async (payload: { new?: { liker_id: string; expires_at?: string; is_rose?: boolean } }) => {
          const likerId = payload.new?.liker_id;
          if (!likerId) return;
          const { data: rows } = await supabase
            .from("profiles_public")
            .select("*")
            .eq("id", likerId)
            .eq("is_active", true)
            .limit(1);
          const p = rows?.[0] as any;
          if (!p || !(p.avatar_url || (p.images && p.images.length > 0))) return;
          const expiresAt = payload.new?.expires_at ?? new Date(Date.now() + LIKE_EXPIRY_MS).toISOString();
          const isRose = payload.new?.is_rose ?? false;
          const profile: Profile = {
            id: p.id,
            name: p.name,
            age: p.age,
            city: p.city || "",
            country: p.country || "",
            bio: p.bio || "",
            image: p.avatar_url || p.images?.[0] || "/placeholder.svg",
            images: p.images?.length ? p.images : (p.avatar_url ? [p.avatar_url] : []),
            gender: p.gender,
            avatar_url: p.avatar_url,
            latitude: p.latitude,
            longitude: p.longitude,
            available_tonight: p.available_tonight,
            voice_intro_url: p.voice_intro_url,
            last_seen_at: p.last_seen_at,
            expires_at: expiresAt,
            is_plusone: p.is_plusone || false,
            generous_lifestyle: p.generous_lifestyle || false,
            weekend_plans: p.weekend_plans || false,
            late_night_chat: p.late_night_chat || false,
            no_drama: p.no_drama || false,
            is_rose: isRose,
          };
          if (isRose) {
            setLikedMe((prev) => [profile, ...prev.filter((x) => x.id !== profile.id)]);
            setSuperLikeRevealProfile(profile);
            saveLocalLikedMeProfiles([profile, ...getLocalLikedMeProfiles().filter((x) => x.id !== profile.id)].slice(0, 100));
          } else {
            setLikedMe((prev) => (prev.some((x) => x.id === profile.id) ? prev : [...prev, profile]));
            saveLocalLikedMeProfiles([...getLocalLikedMeProfiles().filter((x) => x.id !== profile.id), profile].slice(0, 100));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleSelectProfile = useCallback((profile: Profile, list: Profile[]) => {
    const idx = list.findIndex((p) => p.id === profile.id);
    setSelectedList(list);
    setSelectedIndex(idx >= 0 ? idx : 0);
  }, []);

  const createDevProfile = useCallback(
    (idPrefix: string, isRose: boolean): Profile => {
      const base = allProfiles[0];
      const id = `${idPrefix}-${Date.now()}`;
      const expiresAt = new Date(Date.now() + LIKE_EXPIRY_MS).toISOString();
      if (base) {
        return { ...base, id, expires_at: expiresAt, is_rose: isRose };
      }
      return {
        id,
        name: "Dev User",
        age: 25,
        city: "Test",
        country: "Test",
        bio: "",
        image: "/placeholder.svg",
        images: ["/placeholder.svg"],
        gender: "Other",
        expires_at: expiresAt,
        is_rose: isRose,
      };
    },
    [allProfiles]
  );

  const simulateLike = useCallback(() => {
    const profile = createDevProfile("dev-like", false);
    setLikedMe((prev) => [...prev, profile]);
    setButterflyTarget(profile.id);
    setDevPanelOpen(false);
    toast("Development: Simulated like — butterfly should fly to library.");
  }, [createDevProfile]);

  const simulateSuperLike = useCallback(() => {
    const profile = createDevProfile("dev-super", true);
    setLikedMe((prev) => [profile, ...prev.filter((p) => p.id !== profile.id)]);
    setSuperLikeRevealProfile(profile);
    setDevPanelOpen(false);
    toast("Development: Simulated super like — dynamite + glitter modal.");
  }, [createDevProfile]);

  const handleLike = async (profile: Profile) => {
    if (!user) {
      showGuestPrompt("like");
      return;
    }
    if (iLiked.some((p) => p.id === profile.id)) return;
    const likedProfile = { ...profile, expires_at: new Date(Date.now() + LIKE_EXPIRY_MS).toISOString() };
    setILiked((prev) => [...prev, likedProfile]);
    upsertLocalLikedProfile(likedProfile);

    // Only insert into DB if this is a real profile (not mock)
    const isMockProfile = profile.id.startsWith("indo-") || profile.id.startsWith("profile-");
    if (user && !isMockProfile) {
      await supabase.from("likes").insert({
        liker_id: user.id,
        liked_id: profile.id,
      });
    }

    const isMatch = likedMe.some((p) => p.id === profile.id);
    if (isMatch) {
      setMatchDialog(profile);
    } else {
      toast("💗 " + t("swipe.liked"), { description: `${t("swipe.youLiked")} ${profile.name}` });
    }
  };

  const handleRose = async (profile: Profile) => {
    if (!user) {
      showGuestPrompt("superlike");
      return;
    }
    if (!roseAvailable) {
      toast.error("🌹 " + t("popup.roseUsed"), { description: t("popup.roseReset") });
      return;
    }
    setRoseAvailable(false);
    setLastRoseAt(new Date().toISOString());
    const roseProfile = { ...profile, expires_at: new Date(Date.now() + LIKE_EXPIRY_MS).toISOString(), is_rose: true };
    setILiked((prev) => [...prev, roseProfile]);
    upsertLocalLikedProfile(roseProfile);

    const isMockProfile = profile.id.startsWith("indo-") || profile.id.startsWith("profile-");
    if (user && !isMockProfile) {
      await supabase.from("likes").insert({
        liker_id: user.id,
        liked_id: profile.id,
        is_rose: true,
      });
      await (supabase.from("profiles").update as any)({ last_rose_at: new Date().toISOString() }).eq("id", user.id);
    }

    const isMatch = likedMe.some((p) => p.id === profile.id);
    if (isMatch) {
      setMatchDialog(profile);
    } else {
      toast("❤️ " + t("swipe.roseSent"), { description: `${t("swipe.roseSentTo")} ${profile.name}` });
    }
  };

  const handleUnlock = (profile: Profile) => setUnlockDialog(profile);

  const confirmUnlock = async () => {
    if (!unlockDialog) return;
    const hasMutualMatch = iLiked.some((p) => p.id === unlockDialog.id) && likedMe.some((p) => p.id === unlockDialog.id);
    if (!hasMutualMatch) {
      toast.error("WhatsApp unlock requires a mutual match");
      setUnlockDialog(null);
      return;
    }
    setPaymentLoading(true);
    const invokeCreatePayment = async () =>
      supabase.functions.invoke("create-payment", {
        body: {
          targetUserId: unlockDialog!.id,
          targetHasBadges: hasUnlockBadges(unlockDialog),
        },
      });
    try {
      let result = await invokeCreatePayment();
      if (result.error && isNetworkError(result.error)) {
        await new Promise((r) => setTimeout(r, 1200));
        result = await invokeCreatePayment();
      }
      const { data, error } = result;
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success(t("popup.checkoutOpen"));
      } else {
        toast.error(t("popup.checkoutError"));
      }
    } catch (err: any) {
      const msg = err?.message || "Payment failed";
      if (msg.toLowerCase().includes("not authenticated") || msg.toLowerCase().includes("not logged in")) {
        setGuestPrompt({ open: true, trigger: "purchase" });
        toast.info(t("popup.signInToPurchase"));
      } else if (isNetworkError(err)) {
        toast.error(t("popup.connectionError"));
      } else {
        toast.error(msg);
      }
    } finally {
      setPaymentLoading(false);
      setUnlockDialog(null);
    }
  };

  const handlePurchaseFeature = (feature: PremiumFeature) => {
    if (!user) {
      setGuestPrompt({ open: true, trigger: "purchase" });
      return;
    }
    setFeatureDialog(feature);
  };

  const handleConfirmPurchase = async (feature: PremiumFeature) => {
    setFeatureLoading(true);
    const invokePurchase = async (): Promise<{ data: any; error: any }> => {
      return supabase.functions.invoke("purchase-feature", {
        body: { priceId: feature.priceId, featureId: feature.id },
      });
    };
    try {
      let result = await invokePurchase();
      if (result.error && isNetworkError(result.error)) {
        await new Promise((r) => setTimeout(r, 1200));
        result = await invokePurchase();
      }
      const { data, error } = result;
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success(t("popup.checkoutOpen"));
        setFeatureDialog(null);
      } else {
        toast.error(t("popup.checkoutError"));
      }
    } catch (err: any) {
      const msg = err?.message || "Purchase failed";
      if (msg.toLowerCase().includes("not authenticated") || msg.toLowerCase().includes("not logged in")) {
        setFeatureDialog(null);
        setGuestPrompt({ open: true, trigger: "purchase" });
        toast.info(t("popup.signInToPurchase"));
      } else if (isNetworkError(err)) {
        toast.error(t("popup.connectionError"));
      } else {
        toast.error(msg);
      }
    } finally {
      setFeatureLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    if (user) {
      await (supabase.from("profiles").update as any)({
        terms_accepted_at: new Date().toISOString(),
      }).eq("id", user.id);
    }
    setShowTerms(false);
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem(POST_LOGIN_LANDING_KEY);
    } catch {
      // ignore
    }
    await supabase.auth.signOut();
    navigate("/auth");
  };

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
      <div className="flex-1 grid grid-rows-[1fr_auto_1fr] gap-2 p-2 min-h-0 pb-safe" style={{ paddingBottom: `max(0.5rem, env(safe-area-inset-bottom, 0px))` }}>
        {/* Top Card — isolation so transform and touch don't affect bottom stack; 100% independent */}
        <div className="relative rounded-2xl overflow-hidden min-h-0 bg-black/40 backdrop-blur-xl border-2 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-white/5 isolate" style={{ contain: "layout" }}>
          {selectedProfile ? (
            <motion.div
              key={`lib-${selectedProfile.id}`}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.9}
              onDragEnd={handleLibraryCardDrag}
              style={{ x: topCardX }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <img
                src={(() => {
                  if (!isProfileRoute) return selectedProfile.image;
                  const imgs = (
                    (Array.isArray((selectedProfile as any).images) ? (selectedProfile as any).images : []) as string[]
                  )
                    .filter(Boolean)
                    .slice(0, 5);
                  const fallback = selectedProfile.avatar_url ? [selectedProfile.avatar_url] : [selectedProfile.image];
                  const list = imgs.length > 0 ? imgs : fallback;
                  const idx = ((profileImageIndex % list.length) + list.length) % list.length;
                  return list[idx];
                })()}
                alt={selectedProfile.name}
                className="w-full h-full object-cover"
                style={{
                  objectPosition: selectedProfile.main_image_pos || "50% 50%",
                  transform: selectedProfile.main_image_zoom ? `scale(${selectedProfile.main_image_zoom / 100})` : undefined,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

              {/* ── Single badge display ─────────────────────────── */}
              {(() => {
                const key = getPrimaryBadgeKey(selectedProfile as any);
                if (!key) return null;

                if (key === "available_tonight") {
                  return (
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-yellow-400/70 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.45)]">
                      <span className="text-yellow-400">🌙</span>
                      {t("popup.freeTonight")}
                    </div>
                  );
                }

                if (key === "is_plusone") {
                  return (
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-yellow-400/70 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.45)]">
                      <span className="text-yellow-300 font-black">+1</span>
                      Plus One
                    </div>
                  );
                }

                if (key === "generous_lifestyle") {
                  return (
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-amber-400/70 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.45)]">
                      <span className="text-amber-400">🎁</span> Generous
                    </div>
                  );
                }

                if (key === "weekend_plans") {
                  return (
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-primary/60 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      <span className="text-primary">📅</span> Weekend
                    </div>
                  );
                }

                if (key === "late_night_chat") {
                  return (
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-indigo-400/60 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      <span className="text-indigo-400">🌙</span> Late Night
                    </div>
                  );
                }

                if (key === "no_drama") {
                  return (
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-teal-400/60 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      <span className="text-teal-400">✨</span> No Drama
                    </div>
                  );
                }

                return null;
              })()}

              {!isProfileRoute ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (isAnimatingTopCardRef.current || selectedList.length === 0) return;
                    isAnimatingTopCardRef.current = true;
                    animate(topCardX, 700, { duration: 0.22, ease: "easeOut" }).then(() => {
                      setSelectedIndex((i) => (i + 1) % selectedList.length);
                      topCardX.set(0);
                      isAnimatingTopCardRef.current = false;
                    });
                  }}
                  aria-label="Next profile"
                  className="absolute z-20 w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 hover:scale-110 transition-transform bottom-3 right-3 shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                  style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                  title="Next profile"
                >
                  <Fingerprint className="w-7 h-7 text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                </button>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const imgs = (
                        (Array.isArray((selectedProfile as any).images) ? (selectedProfile as any).images : []) as string[]
                      )
                        .filter(Boolean)
                        .slice(0, 5);
                      const fallback = selectedProfile.avatar_url ? [selectedProfile.avatar_url] : [selectedProfile.image];
                      const list = imgs.length > 0 ? imgs : fallback;
                      if (list.length <= 1) return;

                      setProfileImageIndex((v) => {
                        const last = list.length - 1;
                        if (profileImageDirection === 1) {
                          if (v >= last) {
                            setProfileImageDirection(-1);
                            return Math.max(0, last - 1);
                          }
                          return v + 1;
                        }

                        if (v <= 0) {
                          setProfileImageDirection(1);
                          return Math.min(last, 1);
                        }
                        return v - 1;
                      });
                    }}
                    aria-label={profileImageDirection === 1 ? "Next image" : "Previous image"}
                    className="absolute z-20 w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 hover:scale-110 transition-transform bottom-3 right-3 shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                    style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                    title={profileImageDirection === 1 ? "Next image" : "Previous image"}
                  >
                    {profileImageDirection === 1 ? (
                      <ChevronRight className="w-8 h-8 text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                    ) : (
                      <ChevronLeft className="w-8 h-8 text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                    )}
                  </button>
                </>
              )}

              {/* Like button — pink heart circle, top-right */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(selectedProfile);
                }}
                aria-label={`Like ${selectedProfile.name}`}
                className={`absolute z-20 w-10 h-10 rounded-full flex items-center justify-center active:scale-95 hover:scale-110 transition-all top-3 right-3 ${
                  iLiked.some(p => p.id === selectedProfile.id)
                    ? "bg-pink-500/40 border border-pink-400/60 shadow-[0_0_14px_rgba(180,80,150,0.5)]"
                    : "gradient-love border-0 shadow-[0_0_14px_rgba(180,80,150,0.4)]"
                }`}
                style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
              >
                <Heart className="w-5 h-5 text-white" fill="white" />
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                  {(selectedProfile as any).is_plusone && (
                    <span className="flex items-center gap-0.5 bg-black/60 backdrop-blur-sm border border-yellow-400/50 rounded-md px-1.5 py-0.5 text-yellow-300 font-black text-[10px] leading-none">+1</span>
                  )}
                  {selectedProfile.name}, {selectedProfile.age}
                  {isOnline(selectedProfile.last_seen_at) && (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                    </span>
                  )}
                </h3>
                <p className="text-white/60 text-sm flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {selectedProfile.city}, {selectedProfile.country}
                </p>
              </div>
            </motion.div>
          ) : topProfiles.length > 0 ? (
            <SwipeStack
              profiles={topProfiles}
              direction="up"
              roseAvailable={roseAvailable}
              onRose={handleRose}
              onLike={(p) => {
                handleLike(p);
                advanceQueue(p.id);
                if (user) navigate(`/profile/${p.id}`);
              }}
              onPass={(p) => advanceQueue(p.id)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/50 text-sm">{t("swipe.noMore")}</p>
            </div>
          )}
        </div>

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
                      received: "Unlock",
                    }
                  : undefined
              }
              onTabChange={(t) => {
                if (!isProfileRoute) return;
                setAboutMeTab(t);
                if (t === "new") setSelectedProfileSection("basic");
                if (t === "received") setSelectedUnlockItemKey("unlock:single");
              }}
              selectedProfileSection={isProfileRoute ? selectedProfileSection : undefined}
              onSelectProfileSection={(s) => {
                if (!isProfileRoute) return;
                setSelectedProfileSection(s);
              }}
              selectedUnlockItemKey={isProfileRoute ? selectedUnlockItemKey : undefined}
              onSelectUnlockItem={(key) => {
                if (!isProfileRoute) return;
                setSelectedUnlockItemKey(key);
              }}
              selectedDateIdeaIndex={isProfileRoute ? selectedDateIdeaIndex : undefined}
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
              receivedHighlightProfileId={(butterflyTarget || superLikeRevealProfile?.id) ?? null}
              heartDropProfileId={heartDropProfileId}
              superLikeGlowProfileId={superLikeGlowProfileId}
              onUnlock={handleUnlock}
              onSelectProfile={(profile, sourceList) => {
                handleSelectProfile(profile, sourceList);
              }}
              onPurchaseFeature={handlePurchaseFeature}
            />
          </div>
        </motion.div>

        {butterflyTarget && (
          <ButterflyLikeAnimation
            libraryRef={libraryRef}
            targetProfileId={butterflyTarget}
            onReachLibrary={() => setHeartDropProfileId(butterflyTarget)}
            onComplete={() => {
              setButterflyTarget(null);
              setHeartDropProfileId(null);
            }}
          />
        )}

        {superLikeRevealProfile && (
          <SuperLikeRevealModal
            profile={superLikeRevealProfile}
            onComplete={() => {
              const id = superLikeRevealProfile.id;
              setSuperLikeRevealProfile(null);
              setSuperLikeGlowProfileId(id);
              setTimeout(() => setSuperLikeGlowProfileId(null), 5000);
            }}
          />
        )}

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
                  Off = same as production: only real events trigger butterfly & super like.
                </p>
                <div className="flex flex-col gap-1.5 pt-1 border-t border-white/10">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!devFeaturesEnabled}
                    onClick={simulateLike}
                    className="bg-primary/80 hover:bg-primary text-white border-0 text-xs h-8"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Simulate Like (butterfly)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!devFeaturesEnabled}
                    onClick={simulateSuperLike}
                    className="bg-amber-500/80 hover:bg-amber-500 text-black border-0 text-xs h-8"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Simulate Super Like
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Bottom Card — isolation so top transform cannot affect this; 100% independent from top stack */}
        <div className="relative rounded-2xl overflow-hidden min-h-0 bg-gradient-to-br from-fuchsia-900/30 via-black/30 to-purple-900/30 backdrop-blur-xl border-2 border-fuchsia-400/25 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-fuchsia-300/15 isolate" style={{ contain: "layout" }}>
          {isProfileRoute ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-950/70 via-black/70 to-purple-950/70" />
              <div className="relative z-10 h-full w-full px-6 py-6">
                <div className="h-full w-full rounded-2xl bg-gradient-to-br from-fuchsia-900/25 via-black/35 to-purple-900/25 backdrop-blur-md border-2 border-fuchsia-300/25 ring-1 ring-fuchsia-300/15 shadow-[0_8px_24px_rgba(0,0,0,0.55)] px-5 py-4 flex items-center justify-center">
                  {aboutMeTab === "received" ? (
                    <div className="h-full w-full flex flex-col">
                      <p className="text-white/80 text-xs font-semibold text-center pb-3 border-b border-white/10">Unlock</p>

                      <div className="flex-1 flex flex-col items-center justify-center px-1">
                        <div className="w-full max-w-md rounded-2xl bg-black/30 border border-white/10 px-4 py-4">
                          {selectedUnlockItemKey === "unlock:single" ? (
                            <>
                              <div className="relative overflow-hidden rounded-2xl border border-white/10">
                                <img
                                  src="https://ik.imagekit.io/7grri5v7d/match%20unlock.png?v=1"
                                  alt=""
                                  className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                                  draggable={false}
                                  loading="eager"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75" />

                                <div className="relative z-10 px-4 py-4 flex flex-col items-center justify-center text-center">
                                  <p className="text-white text-sm font-black">1 Match Unlock</p>
                                  <p className="text-white/80 text-xs mt-1">Unlock WhatsApp after you both match. Fast, simple, direct.</p>

                                  <div className="mt-4 w-full flex items-center justify-between">
                                    <p className="text-white/95 font-black text-xl">$1.99</p>
                                    <Button
                                      onClick={() => {
                                        if (!selectedProfile) return;
                                        setUnlockDialog(selectedProfile);
                                      }}
                                      className="gradient-love text-primary-foreground border-0 h-10 rounded-xl font-black"
                                    >
                                      Unlock now
                                    </Button>
                                  </div>

                                  <div className="mt-3 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                                    <p className="text-white/70 text-[11px] font-semibold">Requires a mutual match ✅</p>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : selectedUnlockItemKey === "unlock:pack3" ? (
                            <>
                              <p className="text-white text-sm font-black text-center">3 Unlock Pack</p>
                              <p className="text-white/70 text-xs mt-1 text-center">Perfect for a week of real connections. Save vs singles.</p>
                              <div className="mt-3 flex items-center justify-between">
                                <p className="text-white/90 font-black text-xl">$4.99</p>
                                <Button
                                  onClick={() => toast.info("3-pack checkout coming next")}
                                  className="gradient-love text-primary-foreground border-0 h-10 rounded-xl font-black"
                                >
                                  Choose pack
                                </Button>
                              </div>
                              <p className="text-white/45 text-[10px] mt-2 text-center">Best for casual + active users.</p>
                            </>
                          ) : selectedUnlockItemKey === "unlock:pack10" ? (
                            <>
                              <p className="text-white text-sm font-black text-center">10 Unlock Pack</p>
                              <p className="text-white/70 text-xs mt-1 text-center">Best value for heavy matching. Lowest cost per unlock.</p>
                              <div className="mt-3 flex items-center justify-between">
                                <p className="text-white/90 font-black text-xl">$12.99</p>
                                <Button
                                  onClick={() => toast.info("10-pack checkout coming next")}
                                  className="gradient-love text-primary-foreground border-0 h-10 rounded-xl font-black"
                                >
                                  Choose pack
                                </Button>
                              </div>
                              <p className="text-white/45 text-[10px] mt-2 text-center">Best value package.</p>
                            </>
                          ) : selectedUnlockItemKey === "unlock:vip" ? (
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
                          ) : selectedUnlockItemKey.startsWith("feature:") ? (
                            (() => {
                              const featureId = selectedUnlockItemKey.replace("feature:", "");
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
                    </div>
                  ) : aboutMeTab === "sent" ? (
                    <div className="h-full w-full flex flex-col">
                      <p className="text-white/80 text-xs font-semibold text-center pb-3 border-b border-white/10">Date Ideas</p>
                      {(() => {
                        const places = selectedProfile?.first_date_places || [];
                        const place = places[selectedDateIdeaIndex];
                        if (!place) {
                          return (
                            <div className="flex-1 flex items-center justify-center">
                              <p className="text-white/50 text-xs">Select a date idea above</p>
                            </div>
                          );
                        }

                        const title = place.title || place.idea || "Date idea";
                        const desc = getDateIdeaDescription(place.idea, place.title);
                        const url = place.url || "";

                        return (
                          <div className="flex-1 flex flex-col items-center justify-center px-1">
                            <div className="w-full max-w-md rounded-2xl bg-black/30 border border-white/10 px-4 py-4">
                              <p className="text-white/85 text-sm font-semibold text-center">{title}</p>
                              <p className="mt-3 text-white/65 text-xs leading-relaxed text-center">{desc}</p>

                              <div className="mt-4 flex items-center justify-center">
                                <Button
                                  type="button"
                                  onClick={() => {
                                    if (!url) return;
                                    window.open(url, "_blank", "noopener,noreferrer");
                                  }}
                                  className="bg-fuchsia-500/80 hover:bg-fuchsia-500 text-white"
                                >
                                  View place
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="h-full w-full flex flex-col">
                      <p className="text-white/80 text-xs font-semibold text-center pb-3 border-b border-white/10">
                        {selectedProfileSection === "basic" ? "Basic Info" : selectedProfileSection === "lifestyle" ? "Lifestyle" : "Interests"}
                      </p>

                      {selectedProfileSection === "basic" ? (
                        <div className="flex-1 flex flex-col items-center justify-center px-1">
                          <div className="w-full max-w-md rounded-2xl bg-black/30 border border-white/10 px-4 py-4">
                            <p className="text-white/70 text-xs leading-relaxed">
                              Age: {selectedProfile?.age ?? ""}
                            </p>
                            <p className="text-white/70 text-xs leading-relaxed">
                              Location: {selectedProfile?.city || selectedProfile?.country || ""}
                            </p>
                            <p className="text-white/70 text-xs leading-relaxed">
                              Height: {(selectedProfile as any)?.height_cm ? `${(selectedProfile as any).height_cm} cm` : "Not specified"}
                            </p>
                            <p className="text-white/70 text-xs leading-relaxed">
                              Gender: {(selectedProfile as any)?.gender || ""}
                            </p>
                            <p className="text-white/70 text-xs leading-relaxed">
                              Looking for: {(selectedProfile as any)?.looking_for || ""}
                            </p>
                          </div>
                        </div>
                      ) : selectedProfileSection === "lifestyle" ? (
                        <div className="flex-1 flex flex-col items-center justify-center px-1">
                          <div className="w-full max-w-md rounded-2xl bg-black/30 border border-white/10 px-4 py-4">
                            <p className="text-white/70 text-xs leading-relaxed">
                              Drinking: {(selectedProfile as any)?.drinking || "Not specified"}
                            </p>
                            <p className="text-white/70 text-xs leading-relaxed">
                              Smoking: {(selectedProfile as any)?.smoking || "Not specified"}
                            </p>
                            <p className="text-white/70 text-xs leading-relaxed">
                              Fitness: {(selectedProfile as any)?.fitness || "Not specified"}
                            </p>
                            <p className="text-white/70 text-xs leading-relaxed">
                              Pets: {(selectedProfile as any)?.pets || "Not specified"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center px-1">
                          <div className="w-full max-w-md rounded-2xl bg-black/30 border border-white/10 px-4 py-4">
                            <div className="flex flex-wrap gap-2 justify-center">
                              {(((selectedProfile as any)?.interests as string[] | null) || (selectedProfile?.languages || []) || [])
                                .slice(0, 8)
                                .map((t: string, idx: number) => (
                                  <span key={`${t}-${idx}`} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-[11px] font-semibold">
                                    {t}
                                  </span>
                                ))}
                              {((((selectedProfile as any)?.interests as string[] | null) || (selectedProfile?.languages || []) || []).length === 0) ? (
                                <p className="text-white/50 text-xs">No interests yet</p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : bottomProfiles.length > 0 ? (
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
              onPass={(p) => advanceQueue(p.id)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/50 text-sm">{t("swipe.noMore")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile page is now routed to /profile/:id and clones Home layout */}

      {/* Match Dialog */}
      <Dialog open={!!matchDialog} onOpenChange={() => setMatchDialog(null)}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/10 text-white max-w-xs mx-auto rounded-3xl overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -inset-24 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.35),rgba(0,0,0,0)_55%)]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0.4 }}
              animate={{ scale: 1.05, opacity: 0.8 }}
              transition={{ repeat: Infinity, repeatType: "mirror", duration: 1.6, ease: "easeInOut" }}
              className="absolute -inset-10 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25),rgba(0,0,0,0)_60%)]"
            />
          </div>
          <DialogHeader>
            <DialogTitle className="font-display text-center text-white">
              <motion.span
                initial={{ scale: 0.8, rotate: -8, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
                className="block text-3xl"
              >
                🔥
              </motion.span>
              <motion.span
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.08, duration: 0.25 }}
                className="block"
              >
                {t("match.title")}
              </motion.span>
            </DialogTitle>
            <DialogDescription className="text-center text-white/60">
              <span className="text-primary font-semibold">{matchDialog?.name}</span> {t("match.desc")}
            </DialogDescription>
          </DialogHeader>

          {matchDialog ? (
            <div className="mt-3 flex items-center justify-center gap-4">
              <motion.img
                key={`me-${user?.id || "guest"}`}
                src={user?.user_metadata?.avatar_url || "/placeholder.svg"}
                alt="You"
                className="w-16 h-16 rounded-full object-cover border-2 border-white/15"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.05 }}
                className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                >
                  <Heart className="w-6 h-6 text-primary" fill="currentColor" />
                </motion.div>
              </motion.div>
              <motion.img
                key={`them-${matchDialog.id}`}
                src={matchDialog.avatar_url || matchDialog.image}
                alt={matchDialog.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/15"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            </div>
          ) : null}

          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setMatchDialog(null)} className="flex-1 border-white/10 text-white/70 hover:bg-white/10 hover:text-white">{t("match.later")}</Button>
            <Button
              onClick={() => {
                if (!matchDialog) return;
                const hasMutualMatch = iLiked.some((p) => p.id === matchDialog.id) && likedMe.some((p) => p.id === matchDialog.id);
                if (!hasMutualMatch) {
                  toast.error("WhatsApp unlock requires a mutual match");
                  setMatchDialog(null);
                  return;
                }
                setMatchDialog(null);
                handleUnlock(matchDialog);
              }}
              className="flex-1 gradient-love text-primary-foreground border-0"
            >
              <Heart className="w-4 h-4 mr-1" /> {matchDialog && hasUnlockBadges(matchDialog) ? t("match.unlock299") : t("match.unlock")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unlock Payment Dialog */}
      <Dialog open={!!unlockDialog} onOpenChange={() => setUnlockDialog(null)}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/10 text-white max-w-xs mx-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-center text-white">
              <MessageCircle className="w-10 h-10 mx-auto mb-2" fill="white" stroke="white" />
              {t("popup.unlockTitle")}
            </DialogTitle>
            <DialogDescription className="text-center text-white/60">
              {unlockDialog && hasUnlockBadges(unlockDialog) ? t("popup.unlockDesc299") : t("popup.unlockDesc")}
            </DialogDescription>
          </DialogHeader>
          <ul className="text-white/50 text-xs space-y-1 mt-1">
            <li>💬 {t("popup.unlockBullet1")}</li>
            <li>🔒 {t("popup.unlockBullet2")}</li>
            <li>⏰ {t("popup.unlockBullet3")}</li>
          </ul>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setUnlockDialog(null)} className="flex-1 border-white/10 text-white/70 hover:bg-white/10 hover:text-white">{t("popup.cancel")}</Button>
            <Button onClick={confirmUnlock} disabled={paymentLoading} className="flex-1 gradient-love text-primary-foreground border-0 font-bold">
              {paymentLoading ? t("popup.processing") : (unlockDialog && hasUnlockBadges(unlockDialog) ? t("popup.pay299") : t("popup.pay199"))}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature Purchase Dialog */}
      <FeaturePurchaseDialog
        feature={featureDialog}
        onClose={() => setFeatureDialog(null)}
        onContinue={handleConfirmPurchase}
        loading={featureLoading}
      />

      {/* Filter Panel */}
      <FilterPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={(newFilters) => {
          // Clear the stored queue so new filters get a fresh shuffle
          sessionStorage.removeItem("swipe_queue_ids");
          sessionStorage.removeItem("swipe_seen_ids");
          seenIdsRef.current = new Set();
          shuffledQueueRef.current = [];
          setFilters(newFilters);
        }}
      />

      {/* Terms Acceptance Dialog */}
      <AnimatePresence>
        {showTerms && <TermsAcceptanceDialog onAccept={handleAcceptTerms} />}
      </AnimatePresence>

      {/* Guest auth prompt */}
      <GuestAuthPrompt
        open={guestPrompt.open}
        trigger={guestPrompt.trigger}
        onClose={() => setGuestPrompt(p => ({ ...p, open: false }))}
      />

      {/* ── Welcome Back modal ── */}
      <AnimatePresence>
        {showWelcomeBack && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
              onClick={() => setShowWelcomeBack(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="fixed inset-x-4 bottom-8 z-50 max-w-sm mx-auto bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Brand accent bar */}
              <div className="h-1 w-full gradient-love" />

              <div className="p-6 text-center space-y-4">
                {/* Animated hearts stack */}
                <div className="relative flex items-center justify-center h-20">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="absolute"
                      initial={{ opacity: 0, y: 10, scale: 0.6 }}
                      animate={{ opacity: [0, 1, 0.85], y: [10, -8 - i * 10], scale: [0.6, 1 - i * 0.12] }}
                      transition={{ delay: i * 0.15, duration: 0.7, ease: "easeOut" }}
                    >
                      <Heart
                        className="text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.7)]"
                        style={{ width: 36 - i * 8, height: 36 - i * 8 }}
                        fill="currentColor"
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Headline */}
                <div>
                  <motion.h2
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="font-display font-bold text-white text-2xl leading-tight"
                  >
                    {t("popup.welcomeBack")}{welcomeBackName.current ? `, ${welcomeBackName.current}` : ""}! 💕
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="text-white/60 text-sm mt-2 leading-relaxed"
                  >
                    {t("popup.welcomeBackDesc")}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="text-primary font-semibold text-sm mt-3 leading-relaxed"
                  >
                    {t("popup.welcomeBackCta")} 🔥
                  </motion.p>
                </div>

                {/* CTA */}
                <motion.button
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                  onClick={() => setShowWelcomeBack(false)}
                  className="w-full py-3.5 rounded-2xl gradient-love text-white font-bold text-base shadow-lg"
                >
                  {t("popup.letsGo")} 🚀
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
