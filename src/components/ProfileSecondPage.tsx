import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, X, MapPin, ExternalLink, Sparkles, ShieldCheck,
  Heart, Zap, Calendar, Gift, CalendarDays, MoonStar, Share2,
} from "lucide-react";
import { Profile } from "./SwipeCard";
import { isOnline } from "@/hooks/useOnlineStatus";
import { useLanguage } from "@/i18n/LanguageContext";
import type { DatePlace } from "./DatePlacesEditor";
import { supabase } from "@/integrations/supabase/client";
import { getCountryFlag, getLanguageFlag, getNativeLanguage } from "@/data/languages";

const CATEGORY_IMAGES: Record<string, string> = {
  "☕": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=300&fit=crop",
  "🌅": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
  "🍝": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
  "🍸": "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop",
  "🎵": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
  "🌸": "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop",
  "✨": "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop",
};

const getEmojiFromIdea = (idea: string): string => {
  const match = idea.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);
  return match?.[match.length - 1] || "☕";
};

const getFallbackImage = (idea: string): string => {
  const emoji = getEmojiFromIdea(idea);
  return CATEGORY_IMAGES[emoji] || CATEGORY_IMAGES["☕"];
};

interface ProfileSecondPageProps {
  profile: Profile;
  onBack: () => void;
}

export default function ProfileSecondPage({ profile, onBack }: ProfileSecondPageProps) {
  const { t } = useLanguage();
  const images = (profile.images ?? [profile.image]).filter(Boolean).slice(0, 4);
  const backgroundImage = images[0] || profile.image || "";
  const places = (profile.first_date_places ?? []).slice(0, 3) as DatePlace[];
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(null);
  const [enlargedPlaceIndex, setEnlargedPlaceIndex] = useState<number | null>(null);

  const [connectionsCount, setConnectionsCount] = useState<number | null>(null);
  const [likedMeCount, setLikedMeCount] = useState<number | null>(null);

  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState<
    Array<{
      id: string;
      reviewer_id: string;
      profile_id: string;
      text: string;
      created_at: string;
      connection_id?: string | null;
      reviewer_avatar_url?: string | null;
      reviewer_name?: string | null;
    }>
  >([]);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [hasSession, setHasSession] = useState(false);
  const [canLeaveReview, setCanLeaveReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [whatsAppConfirm, setWhatsAppConfirm] = useState("");

  const activeOn2DateMe = isOnline(profile.last_seen_at);
  const activityPercent = activeOn2DateMe ? 85 : 60;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id ?? null;
      if (!cancelled) setHasSession(Boolean(userId));

      const [{ count: likesReceived }] = await Promise.all([
        (supabase as any)
          .from("likes")
          .select("id", { count: "exact", head: true })
          .eq("liked_id", profile.id),
      ]);

      if (!cancelled) {
        setConnectionsCount(typeof profile.whatsapp_connections_count === "number" ? profile.whatsapp_connections_count : 0);
        setLikedMeCount(typeof likesReceived === "number" ? likesReceived : 0);
      }

      if (!userId) {
        if (!cancelled) setCanLeaveReview(false);
        return;
      }

      const [{ data: connA }, { data: connB }] = await Promise.all([
        (supabase as any)
          .from("connections")
          .select("id,last_paid_at")
          .eq("user_a", userId)
          .eq("user_b", profile.id)
          .order("last_paid_at", { ascending: false })
          .limit(1),
        (supabase as any)
          .from("connections")
          .select("id,last_paid_at")
          .eq("user_a", profile.id)
          .eq("user_b", userId)
          .order("last_paid_at", { ascending: false })
          .limit(1),
      ]);

      const best = [connA?.[0], connB?.[0]]
        .filter(Boolean)
        .sort((x: any, y: any) => new Date(y.last_paid_at).getTime() - new Date(x.last_paid_at).getTime())[0] as
          | { id: string; last_paid_at: string }
          | undefined;

      if (!best) {
        if (!cancelled) setCanLeaveReview(false);
        return;
      }

      const withinWindow = Date.now() - new Date(best.last_paid_at).getTime() <= 5 * 24 * 60 * 60 * 1000;
      if (!withinWindow) {
        if (!cancelled) setCanLeaveReview(false);
        return;
      }

      const { data: existingReview } = await (supabase as any)
        .from("personality_reviews")
        .select("id")
        .eq("profile_id", profile.id)
        .eq("reviewer_id", userId)
        .eq("connection_id", best.id)
        .limit(1);

      if (!cancelled) {
        setCanLeaveReview(!(existingReview && existingReview.length > 0));
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [profile.id]);

  const loadReviews = async () => {
    const { data: rows } = await (supabase as any)
      .from("personality_reviews")
      .select("id, reviewer_id, profile_id, connection_id, text, created_at")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const base = (rows ?? []) as Array<{
      id: string;
      reviewer_id: string;
      profile_id: string;
      connection_id?: string | null;
      text: string;
      created_at: string;
    }>;

    const reviewerIds = Array.from(new Set(base.map((r) => r.reviewer_id).filter(Boolean)));
    let reviewerMap = new Map<string, { avatar_url: string | null; name: string | null }>();
    if (reviewerIds.length > 0) {
      const { data: reviewers } = await (supabase as any)
        .from("profiles_public")
        .select("id, avatar_url, name")
        .in("id", reviewerIds);
      (reviewers ?? []).forEach((p: any) => {
        reviewerMap.set(p.id, { avatar_url: p.avatar_url ?? null, name: p.name ?? null });
      });
    }

    const enriched = base.map((r) => {
      const info = reviewerMap.get(r.reviewer_id);
      return {
        ...r,
        reviewer_avatar_url: info?.avatar_url ?? null,
        reviewer_name: info?.name ?? null,
      };
    });

    setReviews(enriched);
    setActiveReviewIndex(0);
  };

  useEffect(() => {
    void loadReviews();
  }, [profile.id]);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 10000);
    return () => window.clearInterval(id);
  }, [reviews.length]);

  const activeReview = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews[Math.min(activeReviewIndex, reviews.length - 1)] ?? null;
  }, [activeReviewIndex, reviews]);

  const submitReview = async () => {
    const trimmed = reviewText.trim();
    if (!trimmed) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;

    setIsSubmittingReview(true);
    try {
      const { error } = await (supabase as any).rpc("create_personality_review", {
        _profile_id: profile.id,
        _text: trimmed,
        _whatsapp: whatsAppConfirm,
      });
      if (error) throw error;
      setReviewText("");
      setWhatsAppConfirm("");
      setShowReviewForm(false);
      setCanLeaveReview(false);
      await loadReviews();
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const shareProfileViaWhatsApp = () => {
    const appUrl = window.location.origin;
    const text = `${profile.name}, ${profile.age} — ${profile.city}, ${profile.country}. Check out on 2DateMe: ${appUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[55] flex flex-col overflow-hidden"
    >
      <div className="absolute inset-0 bg-black" />

      <button
        onClick={onBack}
        aria-label="Back to profile"
        className="absolute top-4 right-4 z-[60] w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:bg-black/70 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="relative flex-1 overflow-y-auto overflow-x-hidden pt-2">
        {/* Hero name strip */}
        <div className="px-4 pt-6 pb-4">
          <h1 className="font-display font-bold text-2xl text-white">
            {profile.name}, <span className="text-white/70 font-normal">{profile.age}</span>
          </h1>
          <p className="text-white/50 text-sm flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" /> {profile.city}, {profile.country}
          </p>
        </div>

        {/* Pro / trust badges — safe, positive only */}
        <div className="px-4 mb-6">
          {/* Activity / profile strength — visual only, pro look */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-white/70 text-xs font-medium mb-2">2DateMe activity</p>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activityPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-white/50 text-[10px]">
                {activeOn2DateMe ? "Highly active profile" : "Active profile"}
              </p>
              <p className="text-white/60 text-[10px] font-semibold">{activityPercent}%</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/25 text-amber-300 text-[11px] font-medium">
                <Heart className="w-3.5 h-3.5" />
                Clean dating record
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-[11px] font-medium">
                <Calendar className="w-3.5 h-3.5" />
                Has dated on 2DateMe
              </span>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2">
                <p className="text-white/50 text-[9px]">WhatsApp Connections</p>
                <p className="text-white/90 text-xs font-semibold">
                  {connectionsCount === null ? "—" : connectionsCount}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2">
                <p className="text-white/50 text-[9px]">Liked Me</p>
                <p className="text-white/90 text-xs font-semibold">
                  {likedMeCount === null ? "—" : likedMeCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="px-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white/90 text-sm font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Personality review
              <span className="text-white/40 text-[10px] font-semibold">({reviews.length})</span>
            </h2>

            {hasSession && canLeaveReview && (
              <button
                onClick={() => setShowReviewForm((v) => !v)}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white/80 text-[11px] font-semibold"
              >
                {showReviewForm ? "Close" : "Review"}
              </button>
            )}
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
            {activeReview ? (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/10 shrink-0">
                  {activeReview.reviewer_avatar_url ? (
                    <img
                      src={activeReview.reviewer_avatar_url}
                      alt={activeReview.reviewer_name || "Reviewer"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-white/80 text-xs font-semibold">
                      {activeReview.reviewer_name || "Member"}
                    </p>
                    <p className="text-white/40 text-[10px]">
                      {new Date(activeReview.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-white/70 text-xs mt-1 leading-relaxed">{activeReview.text}</p>

                  {reviews.length > 1 && (
                    <p className="text-white/40 text-[10px] pt-2">
                      {activeReviewIndex + 1}/{reviews.length}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-white/50 text-xs">No reviews yet.</p>
            )}

            {hasSession && showReviewForm && canLeaveReview && (
              <div className="mt-4">
                <div className="grid grid-cols-1 gap-2">
                  <input
                    value={whatsAppConfirm}
                    onChange={(e) => setWhatsAppConfirm(e.target.value)}
                    placeholder="Enter your WhatsApp number to confirm"
                    className="w-full rounded-xl bg-black/30 border border-white/10 text-white/90 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    inputMode="tel"
                  />
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write a personality review…"
                    className="w-full min-h-[90px] rounded-xl bg-black/30 border border-white/10 text-white/90 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    maxLength={350}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-white/40 text-[10px]">{reviewText.length}/350</p>
                  <button
                    onClick={submitReview}
                    disabled={isSubmittingReview || !reviewText.trim() || !whatsAppConfirm.trim()}
                    className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReview ? "Posting…" : "Post review"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Photos — up to 4, 2x2 grid, tap to enlarge */}
        <section className="px-4 mb-8">
          <h2 className="text-white/90 text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Photos
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {images.map((src, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setEnlargedImageIndex(idx)}
                className="aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <img
                  src={src}
                  alt={`${profile.name} ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        </section>

        {/* First date places — up to 3 */}
        {places.length > 0 && (
          <section className="px-4 mb-8">
            <h2 className="text-white/90 text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              First date ideas
            </h2>
            <div className="space-y-3">
              {places.map((place, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  onClick={() => setEnlargedPlaceIndex(idx)}
                  className="w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 text-left focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <div className="relative aspect-[2/1]">
                    <img
                      src={place.image_url || getFallbackImage(place.idea)}
                      alt={place.idea}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white font-semibold text-sm">{place.idea}</p>
                      {place.title && (
                        <p className="text-white/70 text-xs mt-0.5">{place.title}</p>
                      )}
                    </div>
                    {place.url && (
                      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 text-white/80" />
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* First date idea one-liner if present */}
        {profile.first_date_idea && (
          <section className="px-4 mb-8">
            <div className="rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3">
              <p className="text-primary text-sm font-medium">💕 {profile.first_date_idea}</p>
            </div>
          </section>
        )}

        {/* Languages */}
        {profile.country && (
          <section className="px-4 mb-10">
            <h2 className="text-white/90 text-sm font-semibold mb-2">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const native = getNativeLanguage(profile.country);
                const langs = [native, ...((profile.languages || []) as string[])].filter(Boolean).slice(0, 3);
                return langs.map((lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs inline-flex items-center gap-1.5"
                  >
                    <span className="text-[14px] leading-none">{lang === native ? getCountryFlag(profile.country) : getLanguageFlag(lang)}</span>
                    {lang}
                  </span>
                ));
              })()}
            </div>
          </section>
        )}
      </div>

      {/* Fullscreen image lightbox */}
      <AnimatePresence>
        {enlargedImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black flex items-center justify-center"
            onClick={() => setEnlargedImageIndex(null)}
          >
            <button
              onClick={() => setEnlargedImageIndex(null)}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/80"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={images[enlargedImageIndex]}
              alt={`${profile.name} photo ${enlargedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen place detail */}
      <AnimatePresence>
        {enlargedPlaceIndex !== null && places[enlargedPlaceIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col"
            onClick={() => setEnlargedPlaceIndex(null)}
          >
            <div className="flex-1 overflow-y-auto p-4">
              <button
                onClick={() => setEnlargedPlaceIndex(null)}
                aria-label="Close"
                className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <X className="w-6 h-6" />
              </button>
              {(() => {
                const place = places[enlargedPlaceIndex!];
                return (
                  <div className="pt-12 max-w-md mx-auto">
                    <div className="rounded-2xl overflow-hidden border border-white/10 mb-4">
                      <img
                        src={place.image_url || getFallbackImage(place.idea)}
                        alt={place.idea}
                        className="w-full aspect-video object-cover"
                      />
                    </div>
                    <h3 className="text-white text-xl font-display font-bold">{place.idea}</h3>
                    {place.title && (
                      <p className="text-white/60 text-sm mt-1 flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {place.title}
                      </p>
                    )}
                    {place.url && (
                      <a
                        href={place.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white text-sm font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                        View place
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
