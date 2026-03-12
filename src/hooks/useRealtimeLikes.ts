import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/components/SwipeCard";
import { LIKE_EXPIRY_MS } from "@/lib/constants";

interface UseRealtimeLikesProps {
  user: any;
  likedMe: Profile[];
  setLikedMe: (v: Profile[]) => void;
  setLikeParticlesActive: (v: boolean) => void;
  setSuperLikeParticlesActive: (v: boolean) => void;
  setSuperLikeGlowProfileId: (v: string | null) => void;
  setSuperLikeRevealProfile: (v: Profile | null) => void;
  getLocalLikedMeProfiles: () => Profile[];
  saveLocalLikedMeProfiles: (profiles: Profile[]) => void;
}

export const useRealtimeLikes = (props: UseRealtimeLikesProps) => {
  const prevLikedMeIdsRef = useRef<Set<string>>(new Set());

  // Detect new like: trigger hearts for regular likes, hearts+stars for super likes
  useEffect(() => {
    const currentIds = new Set(props.likedMe.map((p) => p.id));
    const prev = prevLikedMeIdsRef.current;
    const newProfiles = props.likedMe.filter((p) => !prev.has(p.id));
    const newRegular = newProfiles.find((p) => !p.is_rose);
    if (prev.size > 0 && newRegular) {
      props.setLikeParticlesActive(true);
    }
    const newSuperLike = newProfiles.find((p) => p.is_rose);
    if (prev.size > 0 && newSuperLike) {
      props.setSuperLikeParticlesActive(true);
      props.setSuperLikeGlowProfileId(newSuperLike.id);
    }
    prevLikedMeIdsRef.current = currentIds;
  }, [props.likedMe]);

  // Realtime: when someone likes the current user, add them to likedMe
  useEffect(() => {
    if (!props.user?.id) return;
    const channel = supabase
      .channel("likes-received")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "likes",
          filter: `liked_id=eq.${props.user.id}`,
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
            props.setLikedMe((prev) => [profile, ...prev.filter((x) => x.id !== profile.id)]);
            props.setSuperLikeRevealProfile(profile);
            props.saveLocalLikedMeProfiles([profile, ...props.getLocalLikedMeProfiles().filter((x) => x.id !== profile.id)].slice(0, 100));
          } else {
            props.setLikedMe((prev) => (prev.some((x) => x.id === profile.id) ? prev : [...prev, profile]));
            props.saveLocalLikedMeProfiles([...props.getLocalLikedMeProfiles().filter((x) => x.id !== profile.id), profile].slice(0, 100));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [props.user?.id]);
};
