import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, PanInfo, useMotionValue, animate } from "framer-motion";
import { Heart, MapPin, Zap, LogIn, MessageCircle, SlidersHorizontal, Fingerprint } from "lucide-react";
import AppLogo from "@/components/AppLogo";
import DetailPanel from "@/components/DetailPanel";
import { Profile } from "@/components/SwipeCard";
import SwipeStack from "@/components/SwipeStack";
import LikesLibrary from "@/components/LikesLibrary";
import ButterflyLikeAnimation from "@/components/ButterflyLikeAnimation";
import { generateIndonesianProfiles } from "@/data/indonesianProfiles";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PremiumFeature } from "@/data/premiumFeatures";
import FeaturePurchaseDialog from "@/components/FeaturePurchaseDialog";
import FilterPanel, { FilterState, defaultFilters } from "@/components/FilterPanel";
import { isOnline } from "@/hooks/useOnlineStatus";
import GuestAuthPrompt from "@/components/GuestAuthPrompt";
import TermsAcceptanceDialog from "@/components/TermsAcceptanceDialog";
import { useLanguage } from "@/i18n/LanguageContext";
import { LIKE_EXPIRY_MS, ROSE_RESET_DAYS, MS_PER_DAY, APP_NAME } from "@/lib/constants";
import { isNetworkError } from "@/utils/payments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [user, setUser] = useState<any>(null);
  const [userGender, setUserGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => {
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
  const [detailProfile, setDetailProfile] = useState<Profile | null>(null);
  const topCardX = useMotionValue(0);
  const isAnimatingTopCardRef = useRef(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const welcomeBackName = useRef<string>("");

  // Butterfly: when a new like appears, fly to library and drop heart on that profile's card
  const libraryRef = useRef<HTMLDivElement>(null);
  const prevLikedMeIdsRef = useRef<Set<string>>(new Set());
  const [butterflyTarget, setButterflyTarget] = useState<string | null>(null);
  const [heartDropProfileId, setHeartDropProfileId] = useState<string | null>(null);

  // Guest auth prompt
  const [guestPrompt, setGuestPrompt] = useState<{ open: boolean; trigger: "like" | "superlike" | "profile" | "map" | "match" | "filter" | "generic" }>({ open: false, trigger: "generic" });
  const showGuestPrompt = (trigger: typeof guestPrompt["trigger"]) => setGuestPrompt({ open: true, trigger });

  const selectedProfile = selectedList.length > 0 ? selectedList[selectedIndex] : null;

  // Reset top card position when selection changes so next card starts at 0
  useEffect(() => {
    topCardX.set(0);
  }, [selectedIndex, selectedList.length, topCardX]);

  // New profiles for the library — all profiles (sorted by recency), optionally filtered by country
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
          .select("last_rose_at, terms_accepted_at, gender, is_active, display_name, username")
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
            const name = (myProfile as any).display_name || (myProfile as any).username || "friend";
            welcomeBackName.current = name;
            setShowWelcomeBack(true);
          }
        }
      }
      setLoading(false);

      // Fetch real profiles from DB (excluding current user)
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

  // Detect new like: when likedMe gains an id we didn't have before (and we had a previous set), trigger butterfly
  useEffect(() => {
    const currentIds = new Set(likedMe.map((p) => p.id));
    const prev = prevLikedMeIdsRef.current;
    const newIds = likedMe.filter((p) => !prev.has(p.id)).map((p) => p.id);
    if (prev.size > 0 && newIds.length > 0) {
      setButterflyTarget(newIds[0]);
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
        async (payload: { new?: { liker_id: string; expires_at?: string } }) => {
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
          };
          setLikedMe((prev) => (prev.some((x) => x.id === profile.id) ? prev : [...prev, profile]));
          saveLocalLikedMeProfiles([...getLocalLikedMeProfiles().filter((x) => x.id !== profile.id), profile].slice(0, 100));
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
    setDetailProfile(null);
  }, []);

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
      toast.error("🌹 Rose used this week!", { description: "Your free rose resets weekly." });
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
    setPaymentLoading(true);
    const invokeCreatePayment = async () =>
      supabase.functions.invoke("create-payment", { body: { targetUserId: unlockDialog!.id } });
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
        toast.success("Opening checkout… Complete payment in the new tab.");
      } else {
        toast.error("Could not start checkout. Please try again.");
      }
    } catch (err: any) {
      const msg = err?.message || "Payment failed";
      if (msg.toLowerCase().includes("not authenticated") || msg.toLowerCase().includes("not logged in")) {
        setGuestPrompt({ open: true, trigger: "purchase" });
        toast.info("Please sign in or create an account to purchase.");
      } else if (isNetworkError(err)) {
        toast.error("Connection issue. Please check your internet and try again.");
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
        toast.success("Opening checkout… Complete payment in the new tab.");
        setFeatureDialog(null);
      } else {
        toast.error("Could not start checkout. Please try again.");
      }
    } catch (err: any) {
      const msg = err?.message || "Purchase failed";
      if (msg.toLowerCase().includes("not authenticated") || msg.toLowerCase().includes("not logged in")) {
        setFeatureDialog(null);
        setGuestPrompt({ open: true, trigger: "purchase" });
        toast.info("Please sign in or create an account to purchase.");
      } else if (isNetworkError(err)) {
        toast.error("Connection issue. Please check your internet and try again.");
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
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleLibraryCardDrag = (_: any, info: PanInfo) => {
    const { offset } = info;
    if (offset.y < -80) {
      if (selectedProfile) setDetailProfile(selectedProfile);
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
    setDetailProfile(null);
  };

  const handleMapSelectUser = (userId: string) => {
    const profile = allProfiles.find((p) => p.id === userId);
    if (profile) {
      setDetailProfile(profile);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <AppLogo
        className="w-24 h-24 object-contain"
        style={{ imageRendering: "crisp-edges", filter: "drop-shadow(0 0 24px rgba(220,80,150,0.6))" }}
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
        </div>
      </header>

      {/* Main 3-container layout */}
      <div className="flex-1 grid grid-rows-[1fr_auto_1fr] gap-2 p-2 min-h-0 pb-safe" style={{ paddingBottom: `max(0.5rem, env(safe-area-inset-bottom, 0px))` }}>
        {/* Top Card — isolation so transform doesn't affect bottom */}
        <div className="relative rounded-2xl overflow-hidden min-h-0 bg-black/40 backdrop-blur-xl border-2 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-white/5 isolate">
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
                src={selectedProfile.image}
                alt={selectedProfile.name}
                className="w-full h-full object-cover"
                style={{
                  objectPosition: selectedProfile.main_image_pos || "50% 50%",
                  transform: selectedProfile.main_image_zoom ? `scale(${selectedProfile.main_image_zoom / 100})` : undefined,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

              {/* ── Status badge — Free Tonight only (+1 no longer on image) ── */}
              {!(selectedProfile as any).is_plusone && selectedProfile.available_tonight ? (
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-yellow-400/70 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.45)]">
                  <span className="text-yellow-400">🌙</span>
                  Free Tonight
                </div>
              ) : null}

              {/* Fingerprint next — swipe this card only; stop propagation so bottom stack is not affected */}
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
                if (user) setDetailProfile(p);
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
              iLiked={iLiked}
              likedMe={likedMe}
              newProfiles={libraryNewProfiles}
              filterCountry={filters.country}
              receivedHighlightProfileId={butterflyTarget}
              heartDropProfileId={heartDropProfileId}
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

        {/* Bottom Card — isolation so top transform cannot affect this */}
        <div className="relative rounded-2xl overflow-hidden min-h-0 bg-black/40 backdrop-blur-xl border-2 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-white/5 isolate">
          {bottomProfiles.length > 0 ? (
            <SwipeStack
              key="bottom-stack"
              profiles={bottomProfiles}
              direction="down"
              roseAvailable={roseAvailable}
              onRose={handleRose}
              onLike={(p) => {
                handleLike(p);
                advanceQueue(p.id);
                if (user) setDetailProfile(p);
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

      {/* Full Detail Bottom Slide-Up Panel */}
      <AnimatePresence>
        {detailProfile && (
          <DetailPanel
            profile={detailProfile}
            isMatch={iLiked.some((p) => p.id === detailProfile.id) && likedMe.some((p) => p.id === detailProfile.id)}
            onClose={() => setDetailProfile(null)}
            onUnlock={handleUnlock}
            onLike={handleLike}
            alreadyLiked={iLiked.some((p) => p.id === detailProfile.id)}
            nearbyUsers={allProfiles}
            onSelectUser={handleMapSelectUser}
            likedMeProfiles={likedMe}
            onPurchaseFeature={handlePurchaseFeature}
          />
        )}
      </AnimatePresence>

      {/* Match Dialog */}
      <Dialog open={!!matchDialog} onOpenChange={() => setMatchDialog(null)}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/10 text-white max-w-xs mx-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-center text-white">
               <span className="text-3xl">🔥</span><br />{t("match.title")}
            </DialogTitle>
            <DialogDescription className="text-center text-white/60">
              <span className="text-primary font-semibold">{matchDialog?.name}</span> {t("match.desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setMatchDialog(null)} className="flex-1 border-white/10 text-white/70 hover:bg-white/10 hover:text-white">{t("match.later")}</Button>
            <Button onClick={() => { setMatchDialog(null); if (matchDialog) handleUnlock(matchDialog); }} className="flex-1 gradient-love text-primary-foreground border-0">
              <Heart className="w-4 h-4 mr-1" /> Unlock $1.99
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
              Unlock WhatsApp
            </DialogTitle>
            <DialogDescription className="text-center text-white/60">
              Pay <span className="text-primary font-bold">$1.99</span> to reveal both WhatsApp numbers.<br />
              Both profiles will go offline for 3 days.
            </DialogDescription>
          </DialogHeader>
          <ul className="text-white/50 text-xs space-y-1 mt-1">
            <li>💬 Get each other's WhatsApp</li>
            <li>🔒 Private & secure connection</li>
            <li>⏰ Profiles hidden for 3 days</li>
          </ul>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setUnlockDialog(null)} className="flex-1 border-white/10 text-white/70 hover:bg-white/10 hover:text-white">Cancel</Button>
            <Button onClick={confirmUnlock} disabled={paymentLoading} className="flex-1 gradient-love text-primary-foreground border-0 font-bold">
              {paymentLoading ? "Processing..." : "Pay $1.99"}
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
                    Welcome back{welcomeBackName.current ? `, ${welcomeBackName.current}` : ""}! 💕
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="text-white/60 text-sm mt-2 leading-relaxed"
                  >
                    We genuinely missed you — and we're not just saying that. Your profile is live again and the connections are waiting.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="text-primary font-semibold text-sm mt-3 leading-relaxed"
                  >
                    Someone out there is about to be very glad you came back. Let's find them. 🔥
                  </motion.p>
                </div>

                {/* CTA */}
                <motion.button
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                  onClick={() => setShowWelcomeBack(false)}
                  className="w-full py-3.5 rounded-2xl gradient-love text-white font-bold text-base shadow-lg"
                >
                  Let's go! 🚀
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
