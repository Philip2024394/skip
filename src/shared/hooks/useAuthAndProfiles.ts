import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/features/dating/components/SwipeCard";
import { ROSE_RESET_DAYS, MS_PER_DAY, SUPER_LIKES_BALANCE_KEY, REFERRAL_POPUP_SHOWN_KEY } from "@/shared/services/constants";
import { setUserCountry } from "@/shared/hooks/useUserCurrency";

interface UseAuthAndProfilesProps {
  setUser: (v: any) => void;
  setILiked: (v: Profile[]) => void;
  setLikedMe: (v: Profile[]) => void;
  setLoading: (v: boolean) => void;
  setDbProfiles: (v: Profile[]) => void;
  setRoseAvailable: (v: boolean) => void;
  setLastRoseAt: (v: string | null) => void;
  setSuperLikesCount: (v: number) => void;
  setMyReferralCode: (v: string | null) => void;
  setDaysSinceLastActive: (v: number) => void;
  setShowTerms: (v: boolean) => void;
  setUserGender: (v: string | null) => void;
  setUserLookingFor?: (v: string | null) => void;
  setShowWelcomeBack: (v: boolean) => void;
  welcomeBackName: React.MutableRefObject<string>;
  setShowReferralPopup: (v: boolean) => void;
  toast: any;
  getLocalLikedProfiles: () => Profile[];
  getLocalLikedMeProfiles: () => Profile[];
  upsertLocalLikedProfile: (profile: Profile) => void;
  saveLocalLikedMeProfiles: (profiles: Profile[]) => void;
}

export const useAuthAndProfiles = (props: UseAuthAndProfilesProps) => {
  useEffect(() => {
    const checkAuth = async () => {
      // Load locally persisted likes immediately
      const localLikes = props.getLocalLikedProfiles();
      if (localLikes.length > 0) {
        props.setILiked(localLikes);
      }
      const localLikedMe = props.getLocalLikedMeProfiles();
      if (localLikedMe.length > 0) {
        props.setLikedMe(localLikedMe);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        props.setUser(session.user);

        // Check rose availability, terms acceptance, and gender
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("last_rose_at, terms_accepted_at, gender, country, is_active, name, super_likes_count, referral_code, last_seen_at")
          .eq("id", session.user.id)
          .single();
        if (myProfile) {
          if (myProfile.last_rose_at) {
            const daysSince = (Date.now() - new Date(myProfile.last_rose_at).getTime()) / MS_PER_DAY;
            props.setRoseAvailable(daysSince >= ROSE_RESET_DAYS);
            props.setLastRoseAt(myProfile.last_rose_at);
          }
          const nextSuperLikes = (myProfile as any).super_likes_count ?? 0;
          props.setSuperLikesCount(nextSuperLikes);
          props.setMyReferralCode((myProfile as any).referral_code ?? null);

          try {
            const lastSeenAt = (myProfile as any).last_seen_at as string | null;
            if (lastSeenAt) {
              const diff = Date.now() - new Date(lastSeenAt).getTime();
              props.setDaysSinceLastActive(Math.floor(diff / MS_PER_DAY));
            }
          } catch {
            // ignore
          }

          try {
            const prevBalanceStr = localStorage.getItem(SUPER_LIKES_BALANCE_KEY);
            const prevBalance = prevBalanceStr ? parseInt(prevBalanceStr, 10) : 0;
            if (!Number.isNaN(prevBalance) && nextSuperLikes > prevBalance) {
              props.toast.success(`🌟 Super Likes +${nextSuperLikes - prevBalance}!`, { description: "A friend joined — you got rewarded." });
            }
            localStorage.setItem(SUPER_LIKES_BALANCE_KEY, String(nextSuperLikes));
          } catch {
            // ignore
          }

          if (!(myProfile as any).terms_accepted_at) {
            props.setShowTerms(true);
          }
          if ((myProfile as any).gender) {
            props.setUserGender((myProfile as any).gender);
          }
          if ((myProfile as any).looking_for && props.setUserLookingFor) {
            props.setUserLookingFor((myProfile as any).looking_for);
          }
          if ((myProfile as any).country) {
            setUserCountry((myProfile as any).country);
          }

          // Re-activate a previously deactivated account on login
          if ((myProfile as any).is_active === false) {
            await supabase
              .from("profiles")
              .update({ is_active: true, hidden_until: null } as any)
              .eq("id", session.user.id);
            const name = (myProfile as any).name || "friend";
            props.welcomeBackName.current = name;
            props.setShowWelcomeBack(true);
          }

          try {
            const shown = localStorage.getItem(REFERRAL_POPUP_SHOWN_KEY);
            // Only show from session 3+ (major-player standard: earn trust before asking for referrals)
            const sessionCount = parseInt(localStorage.getItem("2dm_session_count") || "1");
            if (!shown && sessionCount >= 3) {
              window.setTimeout(() => props.setShowReferralPopup(true), 3000);
            }
          } catch {
            // ignore
          }

          try {
            localStorage.setItem("hasVisitedHome", "true");
          } catch {
            // ignore
          }
        }
      }
      props.setLoading(false);

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
              basic_info: (p as any).basic_info ?? null,
              lifestyle_info: (p as any).lifestyle_info ?? null,
              relationship_goals: (p as any).relationship_goals ?? null,
              selected_date_ideas: (p as any).selected_date_ideas ?? null,
            }));
          // Sort spotlight profiles to front
          mapped.sort((a, b) => (spotlightIds.has(b.id) ? 1 : 0) - (spotlightIds.has(a.id) ? 1 : 0));
          props.setDbProfiles(mapped);
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
              props.setILiked(mergedLikes);
              mergedLikes.forEach((p) => props.upsertLocalLikedProfile(p));
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
              props.setLikedMe(likedProfiles);
              props.saveLocalLikedMeProfiles(likedProfiles);
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
      const updated = props.getLocalLikedProfiles();
      if (updated.length > 0) props.setILiked(updated);
    };
    window.addEventListener("storage", handleStorage);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        // In dev, keep the mock user active — don't wipe it on Supabase auth change
        if (!import.meta.env.DEV) props.setUser(null);
      } else {
        props.setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);
};
