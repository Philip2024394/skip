import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseProfileDataProps {
  selectedProfile: any;
  user: any;
  aboutMeTab: string;
  isProfileRoute: boolean;
  setSelectedDateIdeaIndex: (v: number) => void;
  setSelectedProfileSection: (v: "basic" | "lifestyle" | "interests" | null) => void;
  setSelectedUnlockItemKey: (v: string) => void;
  setProfileImageIndex: (v: number) => void;
  setProfileImageDirection: (v: 1 | -1) => void;
  topCardX: any;
  selectedIndex: number;
  selectedList: any[];
  loading: boolean;
  setShowPostLoginLanding: (v: boolean) => void;
  POST_LOGIN_LANDING_KEY: string;
  allProfiles: any[];
  filters: any;
}

export const useProfileData = (props: UseProfileDataProps) => {
  const [profileReviews, setProfileReviews] = useState<Array<{ id: string; text: string; created_at: string; reviewer_id: string }> | null>(null);
  const [profileReviewsLoading, setProfileReviewsLoading] = useState(false);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [reviewerAvatarById, setReviewerAvatarById] = useState<Record<string, string>>({});
  const [profileImageIndex, setProfileImageIndex] = useState(0);
  const [profileImageDirection, setProfileImageDirection] = useState<1 | -1>(1);

  useEffect(() => {
    if (!props.isProfileRoute) return;
    props.setSelectedDateIdeaIndex(0);
    props.setSelectedProfileSection(null);
    props.setSelectedUnlockItemKey("unlock:single");
  }, [props.isProfileRoute, props.selectedProfile?.id, props.setSelectedDateIdeaIndex, props.setSelectedProfileSection, props.setSelectedUnlockItemKey]);

  useEffect(() => {
    if (!props.isProfileRoute) return;
    if (props.aboutMeTab !== "sent") return;
    props.setSelectedDateIdeaIndex(0);
  }, [props.aboutMeTab, props.isProfileRoute, props.selectedProfile?.id, props.setSelectedDateIdeaIndex]);

  useEffect(() => {
    if (!props.isProfileRoute) return;
    if (props.aboutMeTab !== "received") return;
    if (!props.selectedProfile?.id) return;

    if (!props.user) {
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
          .eq("profile_id", props.selectedProfile.id)
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
  }, [props.aboutMeTab, props.isProfileRoute, props.selectedProfile?.id, props.user]);

  useEffect(() => {
    setActiveReviewIndex(0);
  }, [props.selectedProfile?.id, props.aboutMeTab]);

  useEffect(() => {
    if (!props.isProfileRoute) return;
    if (props.aboutMeTab !== "received") return;
    if (!props.user) return;

    const len = profileReviews?.length ?? 0;
    if (len <= 1) return;

    const id = window.setInterval(() => {
      setActiveReviewIndex((i) => (i + 1) % len);
    }, 5000);

    return () => window.clearInterval(id);
  }, [props.aboutMeTab, props.isProfileRoute, profileReviews?.length, props.user]);

  useEffect(() => {
    if (!props.isProfileRoute) return;
    if (props.aboutMeTab !== "received") return;
    if (!props.user) return;

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
  }, [props.aboutMeTab, props.isProfileRoute, profileReviews, reviewerAvatarById, props.user]);

  useEffect(() => {
    if (!props.isProfileRoute) return;
    setProfileImageIndex(0);
    setProfileImageDirection(1);
  }, [props.isProfileRoute, props.selectedProfile?.id]);

  useEffect(() => {
    props.topCardX.set(0);
  }, [props.selectedIndex, props.selectedList.length, props.topCardX]);

  // Show post-login landing once per session when user lands on /
  useEffect(() => {
    if (!props.loading && props.user && typeof sessionStorage !== "undefined" && !sessionStorage.getItem(props.POST_LOGIN_LANDING_KEY)) {
      props.setShowPostLoginLanding(true);
    }
  }, [props.loading, props.user, props.POST_LOGIN_LANDING_KEY, props.setShowPostLoginLanding]);

  return {
    profileReviews,
    profileReviewsLoading,
    activeReviewIndex,
    setActiveReviewIndex,
    reviewerAvatarById,
    profileImageIndex,
    setProfileImageIndex,
    profileImageDirection,
    setProfileImageDirection,
  };
};
