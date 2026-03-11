import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/components/SwipeCard";
import { PremiumFeature } from "@/data/premiumFeatures";
import { LIKE_EXPIRY_MS, SUPER_LIKES_BALANCE_KEY, POST_LOGIN_LANDING_KEY } from "@/lib/constants";
import { isNetworkError } from "@/utils/payments";
import { hasUnlockBadges } from "@/utils/unlockPrice";

interface UseSwipeActionsProps {
  user: any;
  iLiked: Profile[];
  likedMe: Profile[];
  setILiked: (v: Profile[]) => void;
  setMatchDialog: (v: Profile | null) => void;
  setUnlockDialog: (v: Profile | null) => void;
  setFeatureDialog: (v: PremiumFeature | null) => void;
  setShowTerms: (v: boolean) => void;
  setGuestPrompt: (v: any) => void;
  setPaymentLoading: (v: boolean) => void;
  setFeatureLoading: (v: boolean) => void;
  setRoseAvailable: (v: boolean) => void;
  setLastRoseAt: (v: string | null) => void;
  setSuperLikesCount: (v: number) => void;
  sessionStatsRef: React.MutableRefObject<any>;
  setSessionTick: (v: number) => void;
  unlockDialog: Profile | null;
  roseAvailable: boolean;
  superLikesCount: number;
  showGuestPrompt: (trigger: any) => void;
  upsertLocalLikedProfile: (profile: Profile) => void;
  toast: any;
  t: (key: string) => string;
  navigate: (path: string) => void;
}

export const useSwipeActions = (props: UseSwipeActionsProps) => {
  const handleLike = useCallback(async (profile: Profile) => {
    if (!props.user) {
      props.showGuestPrompt("like");
      return;
    }
    if (props.iLiked.some((p) => p.id === profile.id)) return;
    props.sessionStatsRef.current.liked += 1;
    props.setSessionTick((v) => v + 1);
    const likedProfile = { ...profile, expires_at: new Date(Date.now() + LIKE_EXPIRY_MS).toISOString() };
    props.setILiked((prev) => [...prev, likedProfile]);
    props.upsertLocalLikedProfile(likedProfile);

    // Only insert into DB if this is a real profile (not mock)
    const isMockProfile = profile.id.startsWith("indo-") || profile.id.startsWith("profile-");
    if (props.user && !isMockProfile) {
      await supabase.from("likes").insert({
        liker_id: props.user.id,
        liked_id: profile.id,
      });
    }

    const isMatch = props.likedMe.some((p) => p.id === profile.id);
    if (isMatch) {
      props.setMatchDialog(profile);
    } else {
      props.toast("💗 " + props.t("swipe.liked"), { description: `${props.t("swipe.youLiked")} ${profile.name}` });
    }
  }, [props.user, props.iLiked, props.likedMe, props.setILiked, props.setMatchDialog, props.upsertLocalLikedProfile, props.toast, props.t]);

  const handleRose = useCallback(async (profile: Profile) => {
    if (!props.user) {
      props.showGuestPrompt("superlike");
      return;
    }
    if (props.superLikesCount > 0) {
      props.sessionStatsRef.current.liked += 1;
      props.setSessionTick((v) => v + 1);
      const nextBalance = Math.max(0, props.superLikesCount - 1);
      props.setSuperLikesCount(nextBalance);
      try {
        await (supabase.from("profiles").update as any)({ super_likes_count: nextBalance }).eq("id", props.user.id);
      } catch {
        // ignore
      }

      try {
        localStorage.setItem(SUPER_LIKES_BALANCE_KEY, String(nextBalance));
      } catch {
        // ignore
      }

      const roseProfile = { ...profile, expires_at: new Date(Date.now() + LIKE_EXPIRY_MS).toISOString(), is_rose: true };
      props.setILiked((prev) => [...prev, roseProfile]);
      props.upsertLocalLikedProfile(roseProfile);

      const isMockProfile = profile.id.startsWith("indo-") || profile.id.startsWith("profile-");
      if (props.user && !isMockProfile) {
        await supabase.from("likes").insert({ liker_id: props.user.id, liked_id: profile.id, is_rose: true });
      }

      const isMatch = props.likedMe.some((p) => p.id === profile.id);
      if (isMatch) props.setMatchDialog(profile);
      else props.toast("❤️ " + props.t("swipe.roseSent"), { description: `${props.t("swipe.roseSentTo")} ${profile.name}` });
      return;
    }
    if (!props.roseAvailable) {
      props.toast.error("🌹 " + props.t("popup.roseUsed"), { description: props.t("popup.roseReset") });
      return;
    }
    props.setRoseAvailable(false);
    props.setLastRoseAt(new Date().toISOString());
    props.sessionStatsRef.current.liked += 1;
    props.setSessionTick((v) => v + 1);
    const roseProfile = { ...profile, expires_at: new Date(Date.now() + LIKE_EXPIRY_MS).toISOString(), is_rose: true };
    props.setILiked((prev) => [...prev, roseProfile]);
    props.upsertLocalLikedProfile(roseProfile);

    const isMockProfile = profile.id.startsWith("indo-") || profile.id.startsWith("profile-");
    if (props.user && !isMockProfile) {
      await supabase.from("likes").insert({
        liker_id: props.user.id,
        liked_id: profile.id,
        is_rose: true,
      });
      await (supabase.from("profiles").update as any)({ last_rose_at: new Date().toISOString() }).eq("id", props.user.id);
    }

    const isMatch = props.likedMe.some((p) => p.id === profile.id);
    if (isMatch) {
      props.setMatchDialog(profile);
    } else {
      props.toast("❤️ " + props.t("swipe.roseSent"), { description: `${props.t("swipe.roseSentTo")} ${profile.name}` });
    }
  }, [props.user, props.superLikesCount, props.roseAvailable, props.likedMe, props.setILiked, props.setMatchDialog, props.upsertLocalLikedProfile, props.setSuperLikesCount, props.setRoseAvailable, props.setLastRoseAt, props.toast, props.t]);

  const handleUnlock = useCallback((profile: Profile) => props.setUnlockDialog(profile), [props.setUnlockDialog]);

  const confirmUnlock = useCallback(async () => {
    if (!props.unlockDialog) return;
    const hasMutualMatch = props.iLiked.some((p) => p.id === props.unlockDialog.id) && props.likedMe.some((p) => p.id === props.unlockDialog.id);
    if (!hasMutualMatch) {
      props.toast.error("WhatsApp unlock requires a mutual match");
      props.setUnlockDialog(null);
      return;
    }
    props.setPaymentLoading(true);
    const invokeCreatePayment = async () =>
      supabase.functions.invoke("create-payment", {
        body: {
          targetUserId: props.unlockDialog!.id,
          targetHasBadges: hasUnlockBadges(props.unlockDialog),
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
        props.toast.success(props.t("popup.checkoutOpen"));
      } else {
        props.toast.error(props.t("popup.checkoutError"));
      }
    } catch (err: any) {
      const msg = err?.message || "Payment failed";
      if (msg.toLowerCase().includes("not authenticated") || msg.toLowerCase().includes("not logged in")) {
        props.setGuestPrompt({ open: true, trigger: "purchase" });
        props.toast.info(props.t("popup.signInToPurchase"));
      } else if (isNetworkError(err)) {
        props.toast.error(props.t("popup.connectionError"));
      } else {
        props.toast.error(msg);
      }
    } finally {
      props.setPaymentLoading(false);
      props.setUnlockDialog(null);
    }
  }, [props.unlockDialog, props.iLiked, props.likedMe, props.setPaymentLoading, props.setUnlockDialog, props.setGuestPrompt, props.toast, props.t]);

  const handlePurchaseFeature = useCallback((feature: PremiumFeature) => {
    if (!props.user) {
      props.setGuestPrompt({ open: true, trigger: "purchase" });
      return;
    }
    props.setFeatureDialog(feature);
  }, [props.user, props.setGuestPrompt, props.setFeatureDialog]);

  const handleConfirmPurchase = useCallback(async (feature: PremiumFeature) => {
    props.setFeatureLoading(true);
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
        props.toast.success(props.t("popup.checkoutOpen"));
        props.setFeatureDialog(null);
      } else {
        props.toast.error(props.t("popup.checkoutError"));
      }
    } catch (err: any) {
      const msg = err?.message || "Purchase failed";
      if (msg.toLowerCase().includes("not authenticated") || msg.toLowerCase().includes("not logged in")) {
        props.setFeatureDialog(null);
        props.setGuestPrompt({ open: true, trigger: "purchase" });
        props.toast.info(props.t("popup.signInToPurchase"));
      } else if (isNetworkError(err)) {
        props.toast.error(props.t("popup.connectionError"));
      } else {
        props.toast.error(msg);
      }
    } finally {
      props.setFeatureLoading(false);
    }
  }, [props.setFeatureLoading, props.setFeatureDialog, props.setGuestPrompt, props.toast, props.t]);

  const handleAcceptTerms = useCallback(async () => {
    if (props.user) {
      await (supabase.from("profiles").update as any)({
        terms_accepted_at: new Date().toISOString(),
      }).eq("id", props.user.id);
    }
    props.setShowTerms(false);
  }, [props.user, props.setShowTerms]);

  const handleLogout = useCallback(async () => {
    try {
      sessionStorage.removeItem(POST_LOGIN_LANDING_KEY);
    } catch {
      // ignore
    }
    await supabase.auth.signOut();
    props.navigate("/");
  }, [props.navigate]);

  return {
    handleLike,
    handleRose,
    handleUnlock,
    confirmUnlock,
    handlePurchaseFeature,
    handleConfirmPurchase,
    handleAcceptTerms,
    handleLogout,
  };
};
