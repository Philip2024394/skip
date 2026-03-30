import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Calendar, Plus, X, ChevronLeft,
  MapPin, Camera, Video, Send, Sparkles, Filter, CornerDownRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DatePost {
  id: string;
  user_id: string;
  place_name: string;
  place_category: string;
  caption: string | null;
  media_url: string;
  media_type: "image" | "video";
  city: string | null;
  country: string | null;
  likes_count: number;
  comments_count: number;
  is_admin_post: boolean;
  is_pinned: boolean;
  created_at: string;
  // joined from profiles
  profile?: { name: string; age: number; avatar_url: string | null; city: string | null };
  liked_by_me?: boolean;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  reply_to_id?: string | null;
  likes_count?: number;
  liked_by_me?: boolean;
  profile?: { name: string; avatar_url: string | null };
  replies?: Comment[];
}

interface Invitee {
  id: string; name: string; age: number; avatar_url: string | null; city: string | null;
}

const CATEGORIES = [
  { key: "all",       label: "All",        emoji: "✨" },
  { key: "restaurant",label: "Dine",       emoji: "🍽️" },
  { key: "cafe",      label: "Café",       emoji: "☕" },
  { key: "rooftop",   label: "Rooftop",    emoji: "🌆" },
  { key: "beach",     label: "Beach",      emoji: "🏖️" },
  { key: "park",      label: "Park",       emoji: "🌿" },
  { key: "nightlife", label: "Night",      emoji: "🎶" },
  { key: "activity",  label: "Activity",   emoji: "🎯" },
  { key: "culture",   label: "Culture",    emoji: "🏛️" },
  { key: "scenic",    label: "Scenic",     emoji: "🌄" },
];

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Indonesia:    ["Jakarta","Bali","Surabaya","Bandung","Medan","Yogyakarta","Semarang","Makassar"],
  Malaysia:     ["Kuala Lumpur","Penang","Johor Bahru","Kota Kinabalu","Kuching","Ipoh"],
  Singapore:    ["Singapore"],
  Thailand:     ["Bangkok","Chiang Mai","Pattaya","Phuket","Hua Hin"],
  Philippines:  ["Manila","Cebu","Davao","Makati","Quezon City"],
  Australia:    ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast"],
  "United Kingdom": ["London","Manchester","Birmingham","Edinburgh","Liverpool","Bristol"],
  "United States":  ["New York","Los Angeles","Miami","Chicago","Houston","San Francisco"],
  Germany:      ["Berlin","Munich","Hamburg","Frankfurt","Cologne"],
  France:       ["Paris","Lyon","Marseille","Nice","Bordeaux"],
  Japan:        ["Tokyo","Osaka","Kyoto","Yokohama","Sapporo"],
  "South Korea":["Seoul","Busan","Incheon","Daegu"],
  India:        ["Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune"],
  UAE:          ["Dubai","Abu Dhabi","Sharjah"],
  "Saudi Arabia":["Riyadh","Jeddah","Mecca","Medina"],
};

const ALL_COUNTRIES = Object.keys(CITIES_BY_COUNTRY);

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}


// ── Mock posts for offline/dev ────────────────────────────────────────────────
const MOCK_POSTS: DatePost[] = [
  {
    id: "m1", user_id: "u1", place_name: "Skywalk Rooftop Bar", place_category: "rooftop",
    caption: "Best sunset view in the city 🌆 Perfect first date spot", media_url: "https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=600",
    media_type: "image", city: "Jakarta", country: "Indonesia", likes_count: 48, comments_count: 12,
    is_admin_post: true, is_pinned: true, created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
    profile: { name: "Admin", age: 0, avatar_url: null, city: "Jakarta" }, liked_by_me: false,
  },
  {
    id: "m2", user_id: "u2", place_name: "Café Botanica", place_category: "cafe",
    caption: "Hidden gem — amazing matcha and cozy vibes 🌿 Totally date-worthy", media_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600",
    media_type: "image", city: "Bali", country: "Indonesia", likes_count: 31, comments_count: 7,
    is_admin_post: false, is_pinned: false, created_at: new Date(Date.now() - 5 * 3600_000).toISOString(),
    profile: { name: "Sari", age: 26, avatar_url: "https://i.pravatar.cc/150?img=47", city: "Bali" }, liked_by_me: false,
  },
  {
    id: "m3", user_id: "u3", place_name: "Seminyak Beach Walk", place_category: "beach",
    caption: "Sunset beach walk then dinner — this is the move 🏖️🌅", media_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
    media_type: "image", city: "Bali", country: "Indonesia", likes_count: 67, comments_count: 19,
    is_admin_post: false, is_pinned: false, created_at: new Date(Date.now() - 1 * 86400_000).toISOString(),
    profile: { name: "Ayu", age: 24, avatar_url: "https://i.pravatar.cc/150?img=44", city: "Bali" }, liked_by_me: true,
  },
  {
    id: "m4", user_id: "u4", place_name: "Museum MACAN Art Date", place_category: "culture",
    caption: "Art lovers unite 🎨 Best conversation starter", media_url: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600",
    media_type: "image", city: "Jakarta", country: "Indonesia", likes_count: 22, comments_count: 5,
    is_admin_post: false, is_pinned: false, created_at: new Date(Date.now() - 2 * 86400_000).toISOString(),
    profile: { name: "Dewi", age: 29, avatar_url: "https://i.pravatar.cc/150?img=56", city: "Jakarta" }, liked_by_me: false,
  },
];

const MOCK_PROFILES: Invitee[] = [
  { id: "p1", name: "Sari Indah", age: 26, avatar_url: "https://i.pravatar.cc/150?img=47", city: "Jakarta" },
  { id: "p2", name: "Ayu Putri", age: 24, avatar_url: "https://i.pravatar.cc/150?img=44", city: "Bali" },
  { id: "p3", name: "Dewi Cantik", age: 29, avatar_url: "https://i.pravatar.cc/150?img=56", city: "Bandung" },
  { id: "p4", name: "Rina Manis", age: 27, avatar_url: "https://i.pravatar.cc/150?img=48", city: "Surabaya" },
  { id: "p5", name: "Farah Elok", age: 23, avatar_url: "https://i.pravatar.cc/150?img=45", city: "Medan" },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DateFeedPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<DatePost[]>(MOCK_POSTS);
  const [category, setCategory] = useState("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [openComments, setOpenComments] = useState<DatePost | null>(null);
  const [openInvite, setOpenInvite] = useState<DatePost | null>(null);
  const [loading, setLoading] = useState(true);
  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  // Pending (in-panel) filter state — applied on "Apply"
  const [pendingCountry, setPendingCountry] = useState("");
  const [pendingCity, setPendingCity] = useState("");
  const [pendingSort, setPendingSort] = useState<"newest" | "popular">("newest");

  // ── Load session + posts ─────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        const { data: prof } = await supabase.from("profiles")
          .select("name, age, avatar_url, city")
          .eq("id", session.user.id)
          .maybeSingle();
        setCurrentUserProfile(prof);
      }
      await loadPosts(session?.user.id ?? null);
      setLoading(false);
    };
    init();
  }, []);

  const loadPosts = async (uid: string | null) => {
    try {
      const { data, error } = await (supabase as any)
        .from("date_posts")
        .select(`*, profile:profiles!user_id(name, age, avatar_url, city)`)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      if (data && data.length > 0) {
        // Check which posts user liked
        let likedIds: string[] = [];
        if (uid) {
          const { data: liked } = await (supabase as any)
            .from("date_post_likes").select("post_id").eq("user_id", uid);
          likedIds = (liked ?? []).map((l: any) => l.post_id);
        }
        setPosts(data.map((p: any) => ({ ...p, liked_by_me: likedIds.includes(p.id) })));
      }
    } catch {
      // Stay on mock posts
    }
  };

  const handleLike = async (post: DatePost) => {
    if (!currentUserId) { toast.error("Sign in to like posts"); return; }
    const wasLiked = post.liked_by_me;
    // Optimistic
    setPosts(ps => ps.map(p => p.id === post.id
      ? { ...p, liked_by_me: !wasLiked, likes_count: p.likes_count + (wasLiked ? -1 : 1) }
      : p));
    try {
      if (wasLiked) {
        await (supabase as any).from("date_post_likes").delete()
          .eq("post_id", post.id).eq("user_id", currentUserId);
        await (supabase as any).from("date_posts")
          .update({ likes_count: post.likes_count - 1 }).eq("id", post.id);
      } else {
        await (supabase as any).from("date_post_likes")
          .insert({ post_id: post.id, user_id: currentUserId });
        await (supabase as any).from("date_posts")
          .update({ likes_count: post.likes_count + 1 }).eq("id", post.id);
      }
    } catch {
      // Revert
      setPosts(ps => ps.map(p => p.id === post.id
        ? { ...p, liked_by_me: wasLiked, likes_count: post.likes_count }
        : p));
    }
  };

  const handleShare = (post: DatePost) => {
    const text = `${post.place_name} — ${post.caption ?? "Check this amazing date spot!"} via 2DateMe`;
    if (navigator.share) {
      navigator.share({ title: post.place_name, text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard!");
    }
  };

  const activeFilterCount = (filterCountry ? 1 : 0) + (filterCity ? 1 : 0) + (sortBy !== "newest" ? 1 : 0);
  const filteredPosts = posts
    .filter(p => category === "all" || p.place_category === category)
    .filter(p => !filterCountry || p.country === filterCountry)
    .filter(p => !filterCity || p.city === filterCity)
    .sort((a, b) => sortBy === "popular"
      ? b.likes_count - a.likes_count
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div style={{ position: "fixed", inset: 0, background: "linear-gradient(160deg, #0a0014 0%, #1a0030 50%, #050008 100%)", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>
      {/* ── Top accent ── */}
      <motion.div style={{ height: 3, width: "100%", background: "linear-gradient(90deg,#ec4899,#a855f7,#ec4899)", backgroundSize: "200%" }}
        animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 10px",
        background: "rgba(12,12,20,0.95)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft style={{ width: 18, height: 18, color: "rgba(255,255,255,0.7)" }} />
          </button>
          <div>
            <p style={{ color: "white", fontWeight: 900, fontSize: 17, margin: 0, lineHeight: 1 }}>Date Spots</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, margin: "3px 0 0", fontWeight: 600 }}>
              {filterCity || filterCountry || currentUserProfile?.city || "Everywhere"} · {filteredPosts.length} places
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Filter button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => { setPendingCountry(filterCountry); setPendingCity(filterCity); setPendingSort(sortBy); setShowFilter(true); }}
            style={{
              position: "relative", display: "flex", alignItems: "center", gap: 5,
              background: activeFilterCount > 0 ? "rgba(236,72,153,0.2)" : "rgba(255,255,255,0.07)",
              border: activeFilterCount > 0 ? "1px solid rgba(236,72,153,0.5)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 22, padding: "8px 13px",
              color: activeFilterCount > 0 ? "#ec4899" : "rgba(255,255,255,0.6)",
              fontWeight: 700, fontSize: 12, cursor: "pointer",
            }}
          >
            <Filter style={{ width: 13, height: 13 }} /> Filter
            {activeFilterCount > 0 && (
              <span style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%", background: "#ec4899", color: "white", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {activeFilterCount}
              </span>
            )}
          </motion.button>
          {/* Post button */}
          <motion.button
            whileTap={{ scale: 0.93 }} whileHover={{ scale: 1.05 }}
            onClick={() => { if (!currentUserId) { toast.error("Sign in to post"); return; } setShowCreate(true); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "linear-gradient(135deg,#ec4899,#a855f7)",
              border: "none", borderRadius: 22, padding: "9px 14px",
              color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer",
              boxShadow: "0 3px 16px rgba(236,72,153,0.4)",
            }}
          >
            <Plus style={{ width: 15, height: 15 }} /> Post
          </motion.button>
        </div>
      </div>

      {/* ── Category filter strip ── */}
      <div style={{
        display: "flex", gap: 6, padding: "10px 14px",
        overflowX: "auto", flexShrink: 0,
        scrollbarWidth: "none", msOverflowStyle: "none",
      }}>
        {CATEGORIES.map(cat => (
          <motion.button
            key={cat.key}
            whileTap={{ scale: 0.94 }}
            onClick={() => setCategory(cat.key)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 13px", borderRadius: 22, border: "none",
              background: category === cat.key
                ? "linear-gradient(135deg,#ec4899,#a855f7)"
                : "rgba(255,255,255,0.07)",
              color: category === cat.key ? "white" : "rgba(255,255,255,0.45)",
              fontWeight: 700, fontSize: 11, cursor: "pointer",
              flexShrink: 0,
              boxShadow: category === cat.key ? "0 2px 12px rgba(236,72,153,0.35)" : "none",
            }}
          >
            <span style={{ fontSize: 13 }}>{cat.emoji}</span> {cat.label}
          </motion.button>
        ))}
      </div>

      {/* ── Feed ── */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid rgba(236,72,153,0.25)", borderTopColor: "#ec4899", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 80, gap: 12 }}>
            <span style={{ fontSize: 48 }}>📍</span>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 15, fontWeight: 700 }}>No spots in this category yet</p>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Be the first to post one!</p>
          </div>
        ) : (
          <div style={{ paddingBottom: 40 }}>
            {filteredPosts.map((post, idx) => (
              <DatePostCard
                key={post.id}
                post={post}
                idx={idx}
                onLike={() => handleLike(post)}
                onComment={() => setOpenComments(post)}
                onShare={() => handleShare(post)}
                onInvite={() => setOpenInvite(post)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create Post Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <CreatePostModal
            userId={currentUserId!}
            userProfile={currentUserProfile}
            onClose={() => setShowCreate(false)}
            onCreated={(newPost) => {
              setPosts(ps => [{ ...newPost, profile: currentUserProfile, liked_by_me: false }, ...ps]);
              setShowCreate(false);
              toast.success("Posted! 🎉");
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Comments Sheet ── */}
      <AnimatePresence>
        {openComments && (
          <CommentsSheet
            post={openComments}
            currentUserId={currentUserId}
            onClose={() => setOpenComments(null)}
            onCommentAdded={() => setPosts(ps => ps.map(p => p.id === openComments.id ? { ...p, comments_count: p.comments_count + 1 } : p))}
          />
        )}
      </AnimatePresence>

      {/* ── Invite Date Sheet ── */}
      <AnimatePresence>
        {openInvite && (
          <InviteDateSheet
            post={openInvite}
            currentUserId={currentUserId}
            onClose={() => setOpenInvite(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Filter Panel ── */}
      <AnimatePresence>
        {showFilter && (
          <>
            <motion.div
              key="filter-scrim"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
              onClick={() => setShowFilter(false)}
            />
            <motion.div
              key="filter-sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201, backgroundImage: "url('/images/app-background.png')", backgroundSize: "cover", backgroundPosition: "center", borderRadius: "24px 24px 0 0", border: "1px solid rgba(236,72,153,0.25)", borderBottom: "none", paddingBottom: "env(safe-area-inset-bottom, 20px)" }}
            >
              {/* accent bar */}
              <div style={{ height: 3, background: "linear-gradient(90deg,#ec4899,#a855f7)", borderRadius: "24px 24px 0 0" }} />
              {/* handle */}
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.15)" }} />
              </div>

              <div style={{ padding: "4px 20px 24px" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <p style={{ color: "white", fontWeight: 900, fontSize: 17, margin: 0 }}>Filters</p>
                  <button onClick={() => setShowFilter(false)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X style={{ width: 15, height: 15, color: "rgba(255,255,255,0.6)" }} />
                  </button>
                </div>

                {/* Sort */}
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Sort by</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {[{ key: "newest", label: "🕐 Newest" }, { key: "popular", label: "🔥 Most Liked" }].map(s => (
                    <button key={s.key} onClick={() => setPendingSort(s.key as any)}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
                        background: pendingSort === s.key ? "linear-gradient(135deg,#ec4899,#a855f7)" : "rgba(255,255,255,0.07)",
                        color: pendingSort === s.key ? "white" : "rgba(255,255,255,0.5)",
                        boxShadow: pendingSort === s.key ? "0 2px 12px rgba(236,72,153,0.35)" : "none",
                      }}>{s.label}</button>
                  ))}
                </div>

                {/* Country dropdown */}
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Country</p>
                <div style={{ position: "relative", marginBottom: 14 }}>
                  <select
                    value={pendingCountry}
                    onChange={e => { setPendingCountry(e.target.value); setPendingCity(""); }}
                    style={{ width: "100%", appearance: "none", WebkitAppearance: "none", padding: "12px 40px 12px 14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: pendingCountry ? "white" : "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: 600, cursor: "pointer", outline: "none" }}
                  >
                    <option value="">All Countries</option>
                    {ALL_COUNTRIES.map(c => <option key={c} value={c} style={{ background: "#1a0030", color: "white" }}>{c}</option>)}
                  </select>
                  <MapPin style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "rgba(236,72,153,0.7)", pointerEvents: "none" }} />
                </div>

                {/* City dropdown — only shown when country selected */}
                {pendingCountry && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>City</p>
                    <div style={{ position: "relative" }}>
                      <select
                        value={pendingCity}
                        onChange={e => setPendingCity(e.target.value)}
                        style={{ width: "100%", appearance: "none", WebkitAppearance: "none", padding: "12px 40px 12px 14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: pendingCity ? "white" : "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: 600, cursor: "pointer", outline: "none" }}
                      >
                        <option value="">All Cities</option>
                        {(CITIES_BY_COUNTRY[pendingCountry] ?? []).map(c => <option key={c} value={c} style={{ background: "#1a0030", color: "white" }}>{c}</option>)}
                      </select>
                      <MapPin style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "rgba(168,85,247,0.7)", pointerEvents: "none" }} />
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button
                    onClick={() => { setPendingCountry(""); setPendingCity(""); setPendingSort("newest"); setFilterCountry(""); setFilterCity(""); setSortBy("newest"); setShowFilter(false); }}
                    style={{ flex: 1, padding: "13px 0", borderRadius: 16, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                  >Clear</button>
                  <button
                    onClick={() => { setFilterCountry(pendingCountry); setFilterCity(pendingCity); setSortBy(pendingSort); setShowFilter(false); }}
                    style={{ flex: 2, padding: "13px 0", borderRadius: 16, border: "none", background: "linear-gradient(135deg,#ec4899,#a855f7)", color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 3px 16px rgba(236,72,153,0.4)" }}
                  >Apply Filters</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function DatePostCard({ post, idx, onLike, onComment, onShare, onInvite }: {
  post: DatePost; idx: number;
  onLike: () => void; onComment: () => void; onShare: () => void; onInvite: () => void;
}) {
  const catMeta = CATEGORIES.find(c => c.key === post.place_category) ?? CATEGORIES[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.06, 0.3) }}
      style={{ margin: "0 0 2px" }}
    >
      {/* Media */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden" }}>
        {post.media_type === "video" ? (
          <video
            src={post.media_url}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            autoPlay muted loop playsInline
          />
        ) : (
          <img
            src={post.media_url}
            alt={post.place_name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        )}

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 35%, rgba(0,0,0,0.72) 100%)" }} />

        {/* Pinned badge */}
        {post.is_pinned && (
          <div style={{ position: "absolute", top: 12, left: 12, background: "linear-gradient(135deg,#ec4899,#a855f7)", borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
            <Sparkles style={{ width: 10, height: 10, color: "white" }} />
            <span style={{ color: "white", fontSize: 10, fontWeight: 800 }}>Featured</span>
          </div>
        )}

        {/* Category badge */}
        <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 10px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>{catMeta.emoji} {catMeta.label}</span>
        </div>

        {/* User info bottom-left */}
        <div style={{ position: "absolute", bottom: 14, left: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(236,72,153,0.7)", flexShrink: 0 }}>
            {post.profile?.avatar_url ? (
              <img src={post.profile.avatar_url} alt={post.profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#ec4899,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontWeight: 900, fontSize: 14 }}>{post.profile?.name?.[0] ?? "?"}</span>
              </div>
            )}
          </div>
          <div>
            <p style={{ color: "white", fontWeight: 800, fontSize: 13, margin: 0, lineHeight: 1.2, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
              {post.is_admin_post ? "2DateMe" : `${post.profile?.name ?? "User"}${post.profile?.age ? `, ${post.profile.age}` : ""}`}
            </p>
            {post.city && (
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 3, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                <MapPin style={{ width: 9, height: 9 }} /> {post.city}
              </p>
            )}
          </div>
        </div>

        {/* Time */}
        <div style={{ position: "absolute", bottom: 14, right: 14 }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{timeAgo(post.created_at)}</span>
        </div>
      </div>

      {/* Content + actions */}
      <div style={{ background: "rgba(14,14,22,1)", padding: "12px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <p style={{ color: "white", fontWeight: 800, fontSize: 15, margin: "0 0 4px" }}>{post.place_name}</p>
        {post.caption && (
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: "0 0 10px", lineHeight: 1.5 }}>{post.caption}</p>
        )}

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onLike}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: 0 }}
          >
            <Heart
              style={{ width: 20, height: 20, color: post.liked_by_me ? "#ec4899" : "rgba(255,255,255,0.4)", transition: "all 0.18s" }}
              fill={post.liked_by_me ? "#ec4899" : "none"}
            />
            <span style={{ color: post.liked_by_me ? "#ec4899" : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700 }}>{post.likes_count}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onComment}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: 0 }}
          >
            <MessageCircle style={{ width: 20, height: 20, color: "rgba(255,255,255,0.4)" }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700 }}>{post.comments_count}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onShare}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <Share2 style={{ width: 20, height: 20, color: "rgba(255,255,255,0.4)" }} />
          </motion.button>

          {/* Invite to this date — right-aligned */}
          <motion.button
            whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.03 }}
            onClick={onInvite}
            style={{
              marginLeft: "auto",
              display: "flex", alignItems: "center", gap: 6,
              background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.15))",
              border: "1px solid rgba(236,72,153,0.3)",
              borderRadius: 22, padding: "6px 13px", cursor: "pointer",
            }}
          >
            <Calendar style={{ width: 13, height: 13, color: "#ec4899" }} />
            <span style={{ color: "#ec4899", fontSize: 11, fontWeight: 800 }}>Invite Date</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Comments Sheet — drops DOWN from the image ───────────────────────────────
function CommentsSheet({ post, currentUserId, onClose, onCommentAdded }: {
  post: DatePost; currentUserId: string | null;
  onClose: () => void; onCommentAdded: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await (supabase as any)
          .from("date_post_comments")
          .select("*, profile:profiles!user_id(name, avatar_url)")
          .eq("post_id", post.id)
          .order("created_at", { ascending: true })
          .limit(150);
        if (data && data.length > 0) {
          // Thread replies under their parents
          const top: Comment[] = [];
          const byId = new Map<string, Comment>();
          data.forEach((c: Comment) => { byId.set(c.id, { ...c, replies: [] }); });
          byId.forEach(c => {
            if (c.reply_to_id && byId.has(c.reply_to_id)) {
              byId.get(c.reply_to_id)!.replies!.push(c);
            } else {
              top.push(c);
            }
          });
          setComments(top);
        }
      } catch { /* use mock */ }
    };
    load();
  }, [post.id]);

  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  const handleSend = async () => {
    if (!draft.trim() || !currentUserId || sending) return;
    setSending(true);
    const text = draft.trim();
    const tmpId = `tmp-${Date.now()}`;
    const newComment: Comment = {
      id: tmpId, user_id: currentUserId, content: text,
      created_at: new Date().toISOString(),
      reply_to_id: replyTo?.id ?? null,
      likes_count: 0, liked_by_me: false, replies: [],
    };
    if (replyTo) {
      setComments(cs => cs.map(c => c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), newComment] } : c));
    } else {
      setComments(cs => [...cs, newComment]);
    }
    setDraft("");
    setReplyTo(null);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    try {
      const { data } = await (supabase as any).from("date_post_comments")
        .insert({ post_id: post.id, user_id: currentUserId, content: text, reply_to_id: replyTo?.id ?? null })
        .select("*, profile:profiles!user_id(name, avatar_url)").single();
      if (data) {
        const updated = { ...data, replies: [], liked_by_me: false, likes_count: 0 };
        if (replyTo) {
          setComments(cs => cs.map(c => c.id === replyTo.id
            ? { ...c, replies: (c.replies ?? []).map(r => r.id === tmpId ? updated : r) }
            : c));
        } else {
          setComments(cs => cs.map(c => c.id === tmpId ? updated : c));
        }
      }
      await (supabase as any).from("date_posts").update({ comments_count: post.comments_count + 1 }).eq("id", post.id);
      onCommentAdded();
    } catch { /* keep optimistic */ }
    setSending(false);
  };

  const handleLikeComment = async (comment: Comment, parentId?: string) => {
    if (!currentUserId) { toast.error("Sign in to like"); return; }
    const wasLiked = comment.liked_by_me;
    const update = (c: Comment) => c.id === comment.id
      ? { ...c, liked_by_me: !wasLiked, likes_count: (c.likes_count ?? 0) + (wasLiked ? -1 : 1) }
      : c;
    if (parentId) {
      setComments(cs => cs.map(c => c.id === parentId ? { ...c, replies: (c.replies ?? []).map(update) } : c));
    } else {
      setComments(cs => cs.map(update));
    }
    try {
      if (wasLiked) {
        await (supabase as any).from("comment_likes").delete().eq("comment_id", comment.id).eq("user_id", currentUserId);
      } else {
        await (supabase as any).from("comment_likes").insert({ comment_id: comment.id, user_id: currentUserId });
      }
    } catch { /* optimistic only */ }
  };

  const CommentRow = ({ c, parentId, indent = false }: { c: Comment; parentId?: string; indent?: boolean }) => (
    <div style={{ display: "flex", gap: 10, marginBottom: 10, paddingLeft: indent ? 40 : 0 }}>
      <div style={{ width: indent ? 26 : 32, height: indent ? 26 : 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `1.5px solid ${indent ? "rgba(168,85,247,0.4)" : "rgba(236,72,153,0.4)"}` }}>
        {c.profile?.avatar_url ? (
          <img src={c.profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: indent ? "rgba(168,85,247,0.25)" : "rgba(236,72,153,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: indent ? "#a855f7" : "#ec4899", fontSize: indent ? 10 : 12, fontWeight: 900 }}>{c.profile?.name?.[0] ?? "?"}</span>
          </div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0 12px 12px 12px", padding: "8px 12px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: indent ? "#a855f7" : "#ec4899", fontSize: 11, fontWeight: 800, margin: "0 0 3px" }}>{c.profile?.name ?? "User"}</p>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, margin: 0, lineHeight: 1.45 }}>{c.content}</p>
        </div>
        {/* Actions row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 5, paddingLeft: 4 }}>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{timeAgo(c.created_at)}</span>
          <button
            onClick={() => handleLikeComment(c, parentId)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, padding: 0 }}
          >
            <Heart style={{ width: 13, height: 13, color: c.liked_by_me ? "#ec4899" : "rgba(255,255,255,0.3)", transition: "all 0.15s" }} fill={c.liked_by_me ? "#ec4899" : "none"} />
            {(c.likes_count ?? 0) > 0 && <span style={{ color: c.liked_by_me ? "#ec4899" : "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700 }}>{c.likes_count}</span>}
          </button>
          {!indent && (
            <button
              onClick={() => { setReplyTo(c); setDraft(`@${c.profile?.name ?? "User"} `); }}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, padding: 0 }}
            >
              <CornerDownRight style={{ width: 12, height: 12, color: "rgba(255,255,255,0.3)" }} />
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700 }}>Reply</span>
            </button>
          )}
        </div>
        {/* Replies */}
        {(c.replies ?? []).map(r => <CommentRow key={r.id} c={r} parentId={c.id} indent />)}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      {/* Panel drops DOWN from the top (from the image area) */}
      <motion.div
        initial={{ y: "-100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          maxHeight: "88dvh",
          background: "linear-gradient(160deg,#0a0014,#1a0030)",
          borderRadius: "0 0 24px 24px",
          border: "1px solid rgba(236,72,153,0.2)",
          borderTop: "none",
          display: "flex", flexDirection: "column",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Mini post preview (image thumbnail + title) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "max(44px,env(safe-area-inset-top,44px)) 16px 12px", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <div style={{ width: 46, height: 46, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1.5px solid rgba(236,72,153,0.4)" }}>
            {post.media_type === "video"
              ? <div style={{ width: "100%", height: "100%", background: "rgba(236,72,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Video style={{ width: 18, height: 18, color: "#ec4899" }} /></div>
              : <img src={post.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "white", fontWeight: 800, fontSize: 14, margin: 0 }}>{post.place_name}</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "2px 0 0" }}>
              {comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)} comments
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X style={{ width: 15, height: 15, color: "rgba(255,255,255,0.6)" }} />
          </button>
        </div>

        {/* Comments list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 8px", scrollbarWidth: "none" }}>
          {comments.length === 0 && (
            <div style={{ textAlign: "center", paddingTop: 32 }}>
              <p style={{ fontSize: 28 }}>💬</p>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No comments yet — be the first!</p>
            </div>
          )}
          {comments.map(c => <CommentRow key={c.id} c={c} />)}
          <div ref={bottomRef} />
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px", background: "rgba(168,85,247,0.1)", borderTop: "1px solid rgba(168,85,247,0.2)", flexShrink: 0 }}>
            <p style={{ color: "rgba(168,85,247,0.9)", fontSize: 11, fontWeight: 700, margin: 0 }}>
              Replying to @{replyTo.profile?.name ?? "User"}
            </p>
            <button onClick={() => { setReplyTo(null); setDraft(""); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X style={{ width: 13, height: 13, color: "rgba(168,85,247,0.7)" }} />
            </button>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "10px 14px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0 }}>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value.slice(0, 300))}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={replyTo ? `Reply to ${replyTo.profile?.name ?? "User"}…` : "Add a comment…"}
            rows={1}
            style={{
              flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16, padding: "11px 14px", color: "white", fontSize: 14,
              fontFamily: "inherit", resize: "none", outline: "none", maxHeight: 80,
            }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!draft.trim() || !currentUserId || sending}
            style={{
              width: 44, height: 44, borderRadius: "50%", border: "none", flexShrink: 0,
              background: draft.trim() && currentUserId ? "linear-gradient(135deg,#ec4899,#a855f7)" : "rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              boxShadow: draft.trim() && currentUserId ? "0 3px 14px rgba(236,72,153,0.4)" : "none",
            }}
          >
            <Send style={{ width: 16, height: 16, color: draft.trim() && currentUserId ? "white" : "rgba(255,255,255,0.2)", marginLeft: 1 }} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Invite Date Sheet ─────────────────────────────────────────────────────────
function InviteDateSheet({ post, currentUserId, onClose }: {
  post: DatePost; currentUserId: string | null; onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<Invitee[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!currentUserId) { setProfiles(MOCK_PROFILES); return; }
      const { data } = await supabase.from("profiles")
        .select("id, name, age, avatar_url, city")
        .neq("id", currentUserId)
        .eq("is_active", true)
        .limit(30);
      if (data && data.length > 0) setProfiles(data as Invitee[]);
      else setProfiles(MOCK_PROFILES);
    };
    load();
  }, [currentUserId]);

  const filtered = profiles.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.city ?? "").toLowerCase().includes(search.toLowerCase()));

  const handleInvite = async (invitee: Invitee) => {
    if (!currentUserId) { toast.error("Sign in to send invitations"); return; }
    setSending(invitee.id);
    try {
      await (supabase as any).from("date_invitations").insert({
        sender_id: currentUserId,
        receiver_id: invitee.id,
        post_id: post.id,
        message: `Hey! I found this amazing spot — ${post.place_name}. Want to go on a date here? 😊`,
      });
      setSentIds(s => new Set([...s, invitee.id]));
      toast.success(`Date invitation sent to ${invitee.name.split(" ")[0]}! 🎉`);
    } catch {
      toast.error("Could not send invitation.");
    }
    setSending(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 360, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "#0c0c14", borderRadius: "20px 20px 0 0",
          border: "1px solid rgba(255,255,255,0.09)", maxHeight: "82vh",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
        </div>

        <div style={{ padding: "10px 18px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <p style={{ color: "white", fontWeight: 900, fontSize: 15, margin: 0 }}>Invite to Date</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "2px 0 0" }}>{post.place_name} 📍</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X style={{ width: 20, height: 20, color: "rgba(255,255,255,0.4)" }} />
            </button>
          </div>
          <input
            placeholder="Search by name or city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)", color: "white", fontSize: 13,
              padding: "0 14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 40px", scrollbarWidth: "none" }}>
          {filtered.map(p => {
            const isSent = sentIds.has(p.id);
            const isLoading = sending === p.id;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "rgba(236,72,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#ec4899", fontWeight: 900, fontSize: 16 }}>{p.name[0]}</span>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.2 }}>{p.name}, {p.age}</p>
                  {p.city && <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "2px 0 0" }}>{p.city}</p>}
                </div>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => !isSent && !isLoading && handleInvite(p)}
                  style={{
                    padding: "8px 16px", borderRadius: 22, border: "none", cursor: isSent ? "default" : "pointer",
                    background: isSent ? "rgba(74,222,128,0.12)" : "linear-gradient(135deg,#ec4899,#a855f7)",
                    color: isSent ? "#4ade80" : "white", fontWeight: 800, fontSize: 12,
                    boxShadow: isSent ? "none" : "0 2px 12px rgba(236,72,153,0.35)",
                    opacity: isLoading ? 0.6 : 1,
                    flexShrink: 0,
                  }}
                >
                  {isLoading ? "…" : isSent ? "✓ Sent" : "Invite 📅"}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Create Post Modal ─────────────────────────────────────────────────────────
function CreatePostModal({ userId, userProfile, onClose, onCreated }: {
  userId: string; userProfile: any; onClose: () => void; onCreated: (post: DatePost) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [placeName, setPlaceName] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [city, setCity] = useState(userProfile?.city ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setIsVideo(f.type.startsWith("video/"));
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file || !placeName.trim()) { toast.error("Add a photo and place name to post."); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `date-posts/${userId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

      const payload = {
        user_id: userId, place_name: placeName.trim(),
        place_category: category, caption: caption.trim() || null,
        media_url: publicUrl, media_type: isVideo ? "video" : "image",
        city: city.trim() || null, country: null,
      };
      const { data, error } = await (supabase as any).from("date_posts").insert(payload).select().single();
      if (error) throw error;
      onCreated(data);
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed.");
    }
    setUploading(false);
  };

  const cats = CATEGORIES.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 360, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "#0c0c14", borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(255,255,255,0.09)", maxHeight: "92vh",
          overflowY: "auto", scrollbarWidth: "none",
        }}
      >
        <div style={{ padding: "14px 18px 40px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <p style={{ color: "white", fontWeight: 900, fontSize: 17, margin: 0 }}>Share a Date Spot</p>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X style={{ width: 22, height: 22, color: "rgba(255,255,255,0.4)" }} />
            </button>
          </div>

          {/* Media picker */}
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFile} />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => fileRef.current?.click()}
            style={{
              width: "100%", height: preview ? "auto" : 180, borderRadius: 16,
              border: `2px dashed ${preview ? "rgba(236,72,153,0.4)" : "rgba(255,255,255,0.12)"}`,
              background: "rgba(255,255,255,0.02)", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 10, overflow: "hidden", padding: preview ? 0 : 24, marginBottom: 16,
            }}
          >
            {preview ? (
              isVideo
                ? <video src={preview} style={{ width: "100%", maxHeight: 260, objectFit: "cover" }} muted playsInline />
                : <img src={preview} alt="Preview" style={{ width: "100%", maxHeight: 260, objectFit: "cover" }} />
            ) : (
              <>
                <div style={{ display: "flex", gap: 16 }}>
                  <Camera style={{ width: 32, height: 32, color: "rgba(255,255,255,0.25)" }} />
                  <Video style={{ width: 32, height: 32, color: "rgba(255,255,255,0.25)" }} />
                </div>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, margin: 0, fontWeight: 600 }}>Add Photo or Video</p>
              </>
            )}
          </motion.button>
          {preview && (
            <button onClick={() => fileRef.current?.click()} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", color: "rgba(255,255,255,0.35)", fontSize: 11, cursor: "pointer", marginBottom: 16 }}>
              Change media
            </button>
          )}

          {/* Place name */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Place Name *</p>
            <input
              value={placeName}
              onChange={e => setPlaceName(e.target.value)}
              placeholder="e.g. Skywalk Rooftop Bar"
              style={{ width: "100%", height: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "white", fontSize: 14, padding: "0 14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          {/* Caption */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Caption</p>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value.slice(0, 300))}
              placeholder="What makes this spot special for a date?"
              rows={2}
              style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "white", fontSize: 14, padding: "10px 14px", outline: "none", fontFamily: "inherit", resize: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* City */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>City</p>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Jakarta"
              style={{ width: "100%", height: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "white", fontSize: 14, padding: "0 14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          {/* Category */}
          <div style={{ marginBottom: 22 }}>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Category</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {cats.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  style={{
                    padding: "6px 12px", borderRadius: 22, border: "none", cursor: "pointer",
                    background: category === cat.key ? "linear-gradient(135deg,#ec4899,#a855f7)" : "rgba(255,255,255,0.08)",
                    color: category === cat.key ? "white" : "rgba(255,255,255,0.45)",
                    fontWeight: 700, fontSize: 12,
                  }}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}
            onClick={handleSubmit}
            disabled={uploading || !file || !placeName.trim()}
            style={{
              width: "100%", height: 52, borderRadius: 16, border: "none",
              background: file && placeName.trim() ? "linear-gradient(135deg,#ec4899,#a855f7)" : "rgba(255,255,255,0.08)",
              color: file && placeName.trim() ? "white" : "rgba(255,255,255,0.25)",
              fontWeight: 800, fontSize: 15, cursor: "pointer",
              boxShadow: file && placeName.trim() ? "0 4px 20px rgba(236,72,153,0.38)" : "none",
              opacity: uploading ? 0.7 : 1,
            }}
          >
            {uploading ? "Posting…" : "Share Spot 📍"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
