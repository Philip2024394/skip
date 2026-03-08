import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, ArrowLeft, MapPin, Star, MessageCircle, Unlock,
  LocateFixed, ChevronUp, Zap, X, Moon, Users, Eye,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { generateIndonesianProfiles } from "@/data/indonesianProfiles";
import { Profile } from "@/components/SwipeCard";
import DetailPanel from "@/components/DetailPanel";
import { isOnline } from "@/hooks/useOnlineStatus";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LIKE_EXPIRY_MS } from "@/lib/constants";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import GuestAuthPrompt from "@/components/GuestAuthPrompt";
import { PREMIUM_FEATURES } from "@/data/premiumFeatures";

// ── Geometry helpers ──────────────────────────────────────────────────────────
const spreadOverlapping = (positions: Map<string, [number, number]>, minDistDeg = 0.003) => {
  const ids = Array.from(positions.keys());
  const spread = new Map(positions);
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = spread.get(ids[i])!;
        const b = spread.get(ids[j])!;
        const dx = b[1] - a[1], dy = b[0] - a[0];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistDeg) {
          const angle = Math.atan2(dy, dx);
          const push = (minDistDeg - dist) / 2 + 0.0005;
          spread.set(ids[i], [a[0] - Math.sin(angle) * push, a[1] - Math.cos(angle) * push]);
          spread.set(ids[j], [b[0] + Math.sin(angle) * push, b[1] + Math.cos(angle) * push]);
        }
      }
    }
  }
  return spread;
};

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Approximate radius (km) visible on screen for a given Leaflet zoom level. */
const zoomToRadiusKm = (zoom: number): number => {
  // At zoom 10 the visible area is roughly 50km radius on mobile
  return Math.round(50 * Math.pow(2, 10 - zoom));
};

const fmtDist = (km: number | undefined) => {
  if (km === undefined || isNaN(km)) return null;
  return km < 1 ? `${Math.round(km * 1000)}m` : `${Math.round(km)}km`;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const PINK       = "hsl(320, 50%, 50%)";
const PINK_GLOW  = "rgba(180, 80, 150, 0.5)";
const PINK_LIGHT = "rgba(180, 80, 150, 0.2)";
const AMBER      = "hsl(45, 95%, 58%)";
const AMBER_GLOW = "rgba(251,191,36,0.5)";
const TEAL       = "hsl(174, 72%, 56%)";
const LOCAL_LIKES_KEY = "local-liked-profiles";

// ── LocalStorage helpers ──────────────────────────────────────────────────────
const getLocalLikedProfiles = (): Profile[] => {
  try {
    const raw = localStorage.getItem(LOCAL_LIKES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Profile[];
    const now = Date.now();
    return parsed.filter((p) => !p.expires_at || new Date(p.expires_at).getTime() > now);
  } catch { return []; }
};

const upsertLocalLikedProfile = (profile: Profile, isRose = false) => {
  try {
    const expires_at = new Date(Date.now() + LIKE_EXPIRY_MS).toISOString();
    const entry: Profile = { ...profile, expires_at, is_rose: isRose || !!profile.is_rose };
    const merged = [entry, ...getLocalLikedProfiles().filter(p => p.id !== profile.id)].slice(0, 100);
    localStorage.setItem(LOCAL_LIKES_KEY, JSON.stringify(merged));
  } catch { /* no-op */ }
};

// ── Map icon factory ──────────────────────────────────────────────────────────
type LikeState = "none" | "liked" | "superliked";

const createAvatarIcon = (
  imageUrl: string,
  isSelected: boolean,
  likeState: LikeState,
  online: boolean,
  availableTonight: boolean,
  viewedMe: boolean,
) => {
  const size = isSelected ? 56 : 42;

  const borderColor = isSelected
    ? PINK
    : likeState === "superliked" ? AMBER
    : likeState === "liked"      ? PINK
    : availableTonight           ? TEAL
    : "rgba(255,255,255,0.25)";

  const glow = isSelected
    ? `0 0 22px ${PINK_GLOW}, 0 0 44px ${PINK_LIGHT}`
    : likeState === "superliked" ? `0 0 16px ${AMBER_GLOW}, 0 2px 8px rgba(0,0,0,0.6)`
    : likeState === "liked"      ? `0 0 14px ${PINK_GLOW}, 0 2px 8px rgba(0,0,0,0.6)`
    : availableTonight           ? `0 0 14px rgba(56,215,193,0.45), 0 2px 8px rgba(0,0,0,0.6)`
    : "0 2px 10px rgba(0,0,0,0.6)";

  const badge = likeState === "superliked"
    ? `<div style="position:absolute;top:-5px;right:-5px;width:20px;height:20px;border-radius:50%;
        background:${AMBER};display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 8px ${AMBER_GLOW};z-index:10;">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg></div>`
    : likeState === "liked"
    ? `<div style="position:absolute;top:-5px;right:-5px;width:20px;height:20px;border-radius:50%;
        background:linear-gradient(135deg,${PINK},hsl(315,40%,55%));display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 8px ${PINK_GLOW};z-index:10;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg></div>`
    : availableTonight
    ? `<div style="position:absolute;top:-5px;right:-5px;width:18px;height:18px;border-radius:50%;
        background:${TEAL};display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 8px rgba(56,215,193,0.5);z-index:10;font-size:9px;">🌙</div>`
    : "";

  const onlineDot = online
    ? `<div style="position:absolute;bottom:${isSelected ? "-2px" : "-1px"};right:${isSelected ? "-2px" : "-1px"};
        width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid #000;
        box-shadow:0 0 6px rgba(34,197,94,0.6);z-index:10;"></div>`
    : "";

  // Outer ring pulse for profiles that have viewed the current user
  const viewedRing = viewedMe
    ? `<div style="position:absolute;inset:-6px;border-radius:50%;
        border:2px solid rgba(56,215,193,0.35);
        animation:viewedPulse 2.5s ease-in-out infinite;z-index:1;pointer-events:none;"></div>`
    : "";

  const selDot = isSelected
    ? `<div style="position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);
        width:8px;height:8px;border-radius:50%;background:${PINK};box-shadow:0 0 8px ${PINK_GLOW};"></div>`
    : "";

  return L.divIcon({
    className: "map-avatar-marker",
    html: `<div style="position:relative;">
      ${viewedRing}
      <div style="width:${size}px;height:${size}px;border-radius:50%;
        border:${isSelected ? "3px" : "2.5px"} solid ${borderColor};overflow:hidden;background:#1a1a1a;
        box-shadow:${glow};cursor:pointer;transition:all 0.3s ease;position:relative;z-index:2;">
        <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      ${badge}${onlineDot}${selDot}
    </div>`,
    iconSize: [size + 16, size + (isSelected ? 22 : 16)],
    iconAnchor: [(size + 16) / 2, (size + 16) / 2],
  });
};

const createUserIcon = () => L.divIcon({
  className: "map-avatar-marker",
  html: `<div style="position:relative;">
    <div style="width:20px;height:20px;border-radius:50%;background:${PINK};border:3px solid white;
      box-shadow:0 0 12px ${PINK_GLOW},0 0 24px ${PINK_LIGHT};z-index:2;position:relative;"></div>
    <div style="position:absolute;inset:-8px;border-radius:50%;
      border:2px solid ${PINK_LIGHT};animation:userPulse 2s ease-in-out infinite;z-index:1;pointer-events:none;"></div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// ── "Get their attention" bottom sheet ───────────────────────────────────────
interface AttentionSheetProps {
  profile: Profile;
  onSuperLike: () => void;
  onClose: () => void;
}

const AttentionSheet = ({ profile, onSuperLike, onClose }: AttentionSheetProps) => (
  <motion.div
    initial={{ y: "100%" }}
    animate={{ y: 0 }}
    exit={{ y: "100%" }}
    transition={{ type: "spring", damping: 28, stiffness: 320 }}
    className="fixed inset-x-0 bottom-0 z-50 px-4 pb-8 pt-2"
    onClick={(e) => e.stopPropagation()}
  >
    <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
    <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-display font-bold text-lg leading-tight">
            {profile.name} hasn't liked back yet
          </p>
          <p className="text-white/50 text-xs mt-0.5">Get their attention — Super Like moves you to the top!</p>
        </div>
        <button onClick={onClose} aria-label="Close"
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors flex-shrink-0 ml-3">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Glowing card preview */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ boxShadow: `0 0 0 2px ${AMBER}, 0 0 24px ${AMBER_GLOW}, 0 0 48px rgba(251,191,36,0.2)` }}>
        <img src={profile.avatar_url || profile.image} alt={profile.name}
          className="w-full h-36 object-cover"
          style={{ objectPosition: profile.main_image_pos || "50% 20%" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-400/90 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star className="w-3 h-3 text-white" fill="white" />
          <span className="text-white text-[10px] font-bold">Super Like</span>
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5
          bg-amber-400/20 backdrop-blur-sm border border-amber-400/40 rounded-xl px-3 py-1.5">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-amber-300 text-[10px] font-semibold tracking-wide">
            Appears FIRST in {profile.name}'s library
          </span>
        </div>
      </div>

      <ul className="space-y-1.5">
        {[
          "⭐  Jumps to top of their Likes Library",
          "🔔  They get an instant notification",
          "✨  Your card glows with a gold border",
          "💘  3× more likely to get a match",
        ].map(item => (
          <li key={item} className="text-white/70 text-xs">{item}</li>
        ))}
      </ul>

      <Button onClick={onSuperLike}
        className="w-full h-12 gradient-gold border-0 font-bold text-base rounded-2xl text-white
          shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-shadow">
        <Star className="w-5 h-5 mr-2" fill="currentColor" />
        Super Like {profile.name} — $1.99
      </Button>
      <p className="text-white/30 text-[10px] text-center">One-time purchase • Secure via Stripe</p>
    </div>
  </motion.div>
);

// ── Main component ────────────────────────────────────────────────────────────
const MapPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusProfileId = searchParams.get("profile");

  const mapRef         = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef     = useRef<Map<string, L.Marker>>(new Map());
  const radiusCircle   = useRef<L.Circle | null>(null);
  const userMarkerRef  = useRef<L.Marker | null>(null);
  const selLineRef     = useRef<L.Polyline | null>(null);
  const selLabelRef    = useRef<L.Marker | null>(null);
  const hasFocusedRef  = useRef(false);
  const _clickedIdRef  = useRef<string | null>(null);

  const [profiles,        setProfiles]        = useState<Profile[]>([]);
  const [selectedIndex,   setSelectedIndex]   = useState(0);
  const [detailProfile,   setDetailProfile]   = useState<Profile | null>(null);
  const [attentionProfile,setAttentionProfile] = useState<Profile | null>(null);
  const [user,            setUser]            = useState<any>(null);
  const [userLocation,    setUserLocation]    = useState<{ lat: number; lng: number } | null>(null);
  const [likedIds,        setLikedIds]        = useState<Set<string>>(new Set());
  const [superLikedIds,   setSuperLikedIds]   = useState<Set<string>>(new Set());
  const [likedMeIds,      setLikedMeIds]      = useState<Set<string>>(new Set());
  const [viewedMeIds,     setViewedMeIds]     = useState<Set<string>>(new Set());
  const [matchDialog,     setMatchDialog]     = useState<Profile | null>(null);
  const [paymentLoading,  setPaymentLoading]  = useState(false);
  const [mapCenter,       setMapCenter]       = useState<{ lat: number; lng: number } | null>(null);
  const [mapZoom,         setMapZoom]         = useState(10);
  const [filterTonight,   setFilterTonight]   = useState(false);
  const [showRadius,      setShowRadius]      = useState(true);
  const [guestPrompt, setGuestPrompt] = useState<{ open: boolean; trigger: "like" | "superlike" | "profile" | "map" | "match" | "filter" | "generic" }>({ open: false, trigger: "generic" });
  const showGuestPrompt = (trigger: typeof guestPrompt["trigger"]) => setGuestPrompt({ open: true, trigger });

  // ── Geolocation ────────────────────────────────────────────────────
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // ── Load profiles + likes + views ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);

        const { data: myLikes } = await supabase
          .from("likes").select("liked_id, is_rose")
          .eq("liker_id", session.user.id)
          .gte("expires_at", new Date().toISOString());
        if (myLikes) {
          setLikedIds(new Set(myLikes.map((l: any) => l.liked_id)));
          setSuperLikedIds(new Set(myLikes.filter((l: any) => l.is_rose).map((l: any) => l.liked_id)));
        }

        const { data: likesReceived } = await supabase
          .from("likes").select("liker_id")
          .eq("liked_id", session.user.id)
          .gte("expires_at", new Date().toISOString());
        if (likesReceived) setLikedMeIds(new Set(likesReceived.map((l: any) => l.liker_id)));

        // Fetch who viewed my profile (table may not exist in all envs — swallow error)
        const { data: views } = await supabase
          .from("profile_views" as any).select("viewer_id")
          .eq("viewed_id", session.user.id)
          .gte("viewed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        if (views) setViewedMeIds(new Set((views as any[]).map(v => v.viewer_id)));
      }

      const query = supabase.from("profiles_public" as any).select("*")
        .eq("is_active", true).eq("is_banned", false);
      if (session) query.neq("id", session.user.id);
      const { data } = await query;

      if (data && data.length > 0) {
        const mapped: Profile[] = (data as any[])
          .filter((p) => p.avatar_url || (p.images?.length > 0))
          .map((p) => ({
            id: p.id, name: p.name, age: p.age,
            city: p.city || "", country: p.country || "",
            bio: p.bio || "", gender: p.gender,
            image: p.avatar_url || p.images[0],
            images: p.images?.length > 0 ? p.images : (p.avatar_url ? [p.avatar_url] : []),
            avatar_url: p.avatar_url,
            latitude: p.latitude, longitude: p.longitude,
            available_tonight: p.available_tonight,
            voice_intro_url: p.voice_intro_url,
            last_seen_at: p.last_seen_at,
            main_image_pos: p.main_image_pos,
          }));
        setProfiles(mapped);
      } else {
        const useMocks = import.meta.env.VITE_USE_MOCK_PROFILES === "true" || import.meta.env.DEV;
        if (useMocks) setProfiles(generateIndonesianProfiles(50));
      }
    };
    load();
  }, []);

  // ── Filtered + nearest 5 profiles ─────────────────────────────────
  const visibleProfiles = useMemo(() => {
    return filterTonight ? profiles.filter(p => p.available_tonight) : profiles;
  }, [profiles, filterTonight]);

  const nearestProfiles = useMemo(() => {
    const refLat = mapCenter?.lat ?? userLocation?.lat ?? visibleProfiles.find(p => p.latitude)?.latitude ?? 0;
    const refLng = mapCenter?.lng ?? userLocation?.lng ?? visibleProfiles.find(p => p.longitude)?.longitude ?? 0;
    return visibleProfiles
      .filter(p => p.latitude && p.longitude)
      .map(p => ({
        ...p,
        distanceKm: userLocation
          ? haversineKm(userLocation.lat, userLocation.lng, p.latitude!, p.longitude!)
          : undefined,
        distanceFromCenter: haversineKm(refLat, refLng, p.latitude!, p.longitude!),
      }))
      .sort((a, b) => a.distanceFromCenter - b.distanceFromCenter)
      .slice(0, 5);
  }, [visibleProfiles, userLocation, mapCenter]);

  const selectedProfile = nearestProfiles[selectedIndex] ?? null;

  // ── Map stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const refLat = mapCenter?.lat ?? userLocation?.lat ?? 0;
    const refLng = mapCenter?.lng ?? userLocation?.lng ?? 0;
    const radiusKm = zoomToRadiusKm(mapZoom);
    const nearby = visibleProfiles.filter(p =>
      p.latitude && p.longitude &&
      haversineKm(refLat, refLng, p.latitude!, p.longitude!) <= radiusKm
    );
    return {
      total: nearby.length,
      online: nearby.filter(p => isOnline(p.last_seen_at)).length,
      liked: nearby.filter(p => likedIds.has(p.id)).length,
      matches: nearby.filter(p => likedIds.has(p.id) && likedMeIds.has(p.id)).length,
    };
  }, [visibleProfiles, mapCenter, userLocation, mapZoom, likedIds, likedMeIds]);

  // ── Focus on URL profile param ─────────────────────────────────────
  useEffect(() => {
    if (!focusProfileId || profiles.length === 0 || hasFocusedRef.current) return;
    const target = profiles.find(p => p.id === focusProfileId);
    if (target?.latitude && target?.longitude) {
      hasFocusedRef.current = true;
      setMapCenter({ lat: target.latitude, lng: target.longitude });
    }
  }, [focusProfileId, profiles]);

  useEffect(() => {
    if (!focusProfileId || !hasFocusedRef.current) return;
    const idx = nearestProfiles.findIndex(p => p.id === focusProfileId);
    if (idx >= 0) setSelectedIndex(idx);
  }, [nearestProfiles, focusProfileId]);

  // ── After marker click — resolve correct index once memo updates ───
  useEffect(() => {
    if (!_clickedIdRef.current) return;
    const idx = nearestProfiles.findIndex(p => p.id === _clickedIdRef.current);
    if (idx >= 0) { setSelectedIndex(idx); _clickedIdRef.current = null; }
  }, [nearestProfiles]);

  // ── Init Leaflet map ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || profiles.length === 0) return;

    const focusTarget = focusProfileId ? profiles.find(p => p.id === focusProfileId) : null;
    const center: [number, number] = focusTarget?.latitude && focusTarget?.longitude
      ? [focusTarget.latitude, focusTarget.longitude]
      : userLocation ? [userLocation.lat, userLocation.lng]
      : profiles.find(p => p.latitude && p.longitude)
        ? [profiles.find(p => p.latitude)!.latitude!, profiles.find(p => p.longitude)!.longitude!]
        : [0, 20];

    const map = L.map(mapRef.current, {
      center, zoom: 10,
      maxZoom: 17, minZoom: 2,
      // Built-in zoom control is kept but we also support pinch-to-zoom on mobile natively
      zoomControl: true,
      attributionControl: false,
      // Smooth scroll with mouse wheel on desktop
      scrollWheelZoom: true,
      // Double-tap zoom on mobile
      tap: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
      maxZoom: 19, noWrap: false,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Free scroll + zoom tracking
    map.on("moveend zoomend", () => {
      const c = map.getCenter();
      setMapCenter({ lat: c.lat, lng: c.lng });
      setMapZoom(map.getZoom());
    });

    if (userLocation) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: createUserIcon(), zIndexOffset: 1000,
      }).addTo(map);
    }

    // Spread overlapping markers
    const rawPos = new Map<string, [number, number]>();
    profiles.forEach(p => { if (p.latitude && p.longitude) rawPos.set(p.id, [p.latitude, p.longitude]); });
    const spread = spreadOverlapping(rawPos);

    profiles.forEach(profile => {
      const pos = spread.get(profile.id);
      if (!pos) return;
      const img = profile.avatar_url || profile.image || "/placeholder.svg";
      const likeState: LikeState = superLikedIds.has(profile.id) ? "superliked"
        : likedIds.has(profile.id) ? "liked" : "none";

      const marker = L.marker(pos, {
        icon: createAvatarIcon(
          img, false, likeState,
          isOnline(profile.last_seen_at),
          !!profile.available_tonight,
          viewedMeIds.has(profile.id),
        ),
      }).addTo(map);

      marker.on("click", () => {
        setMapCenter({ lat: pos[0], lng: pos[1] });
        setSelectedIndex(0);
        _clickedIdRef.current = profile.id;
      });

      markersRef.current.set(profile.id, marker);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
      radiusCircle.current = null;
      userMarkerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, userLocation]);

  // ── Radius circle — updates on zoom change ─────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    if (radiusCircle.current) { radiusCircle.current.remove(); radiusCircle.current = null; }
    if (!showRadius) return;

    const radiusKm = zoomToRadiusKm(mapZoom);
    radiusCircle.current = L.circle([userLocation.lat, userLocation.lng], {
      radius: radiusKm * 1000,
      color: PINK,
      weight: 1.2,
      opacity: 0.35,
      fillColor: PINK,
      fillOpacity: 0.04,
      dashArray: "6 10",
      interactive: false,
    }).addTo(map);
  }, [userLocation, mapZoom, showRadius]);

  // ── Update marker icons + draw selection line ──────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (selLineRef.current) { selLineRef.current.remove(); selLineRef.current = null; }
    if (selLabelRef.current) { selLabelRef.current.remove(); selLabelRef.current = null; }

    markersRef.current.forEach((marker, id) => {
      const p = profiles.find(pr => pr.id === id);
      if (!p) return;
      const img = p.avatar_url || p.image || "/placeholder.svg";
      const likeState: LikeState = superLikedIds.has(id) ? "superliked"
        : likedIds.has(id) ? "liked" : "none";
      marker.setIcon(createAvatarIcon(
        img, id === selectedProfile?.id, likeState,
        isOnline(p.last_seen_at),
        !!p.available_tonight,
        viewedMeIds.has(id),
      ));
    });

    if (!selectedProfile?.latitude || !selectedProfile?.longitude || !map) return;

    if (userLocation) {
      const userPos: [number, number] = [userLocation.lat, userLocation.lng];
      const profPos: [number, number] = [selectedProfile.latitude, selectedProfile.longitude];
      const distKm = haversineKm(userPos[0], userPos[1], profPos[0], profPos[1]);

      selLineRef.current = L.polyline([userPos, profPos], {
        color: PINK, weight: 1.8, opacity: 0.45, dashArray: "6 10",
      }).addTo(map);

      const label = fmtDist(distKm) ?? "?";
      selLabelRef.current = L.marker(
        [(userPos[0] + profPos[0]) / 2, (userPos[1] + profPos[1]) / 2],
        {
          icon: L.divIcon({
            className: "map-km-label",
            html: `<span style="font-size:10px;font-weight:600;color:${PINK};
              background:rgba(0,0,0,0.75);padding:2px 7px;border-radius:8px;
              white-space:nowrap;pointer-events:none;">${label}</span>`,
            iconSize: [50, 16], iconAnchor: [25, 8],
          }),
          interactive: false,
        }
      ).addTo(map);
    }
  }, [selectedIndex, selectedProfile, profiles, likedIds, superLikedIds, viewedMeIds, userLocation]);

  // ── Like / super-like handlers ─────────────────────────────────────
  const handleLike = useCallback(async (profile: Profile) => {
    if (!user) { showGuestPrompt("like"); return; }
    if (likedIds.has(profile.id)) {
      if (!likedMeIds.has(profile.id)) setAttentionProfile(profile);
      return;
    }
    const likedProfile = { ...profile, expires_at: new Date(Date.now() + LIKE_EXPIRY_MS).toISOString(), is_rose: false };
    setLikedIds(prev => new Set(prev).add(profile.id));
    upsertLocalLikedProfile(likedProfile, false);
    window.dispatchEvent(new Event("storage"));

    const isMock = profile.id.startsWith("indo-") || profile.id.startsWith("profile-");
    if (!isMock) await supabase.from("likes").insert({ liker_id: user.id, liked_id: profile.id });

    if (likedMeIds.has(profile.id)) setMatchDialog(profile);
    else toast("💗 Liked!", { description: `You liked ${profile.name}` });
  }, [user, likedIds, likedMeIds, navigate]);

  const handleSuperLike = useCallback(async (profile: Profile) => {
    if (!user) { showGuestPrompt("superlike"); return; }

    // Super Like requires payment — invoke purchase-feature Stripe checkout
    const superLikeFeature = PREMIUM_FEATURES.find(f => f.id === "superlike");
    if (!superLikeFeature) return;

    try {
      toast("⭐ Starting Super Like checkout…");
      const { data, error } = await supabase.functions.invoke("purchase-feature", {
        body: {
          priceId: superLikeFeature.priceId,
          featureId: "superlike",
          targetUserId: profile.id,
          targetUserName: profile.name,
        },
      });
      if (error) throw error;
      if (data?.url) {
        // Optimistically mark locally so UI updates
        setLikedIds(prev => new Set(prev).add(profile.id));
        setSuperLikedIds(prev => new Set(prev).add(profile.id));
        upsertLocalLikedProfile({ ...profile, expires_at: new Date(Date.now() + LIKE_EXPIRY_MS).toISOString(), is_rose: true }, true);
        window.dispatchEvent(new Event("storage"));
        setAttentionProfile(null);
        window.open(data.url, "_blank");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Super Like failed. Please try again.");
    }
  }, [user, showGuestPrompt, likedIds, likedMeIds, navigate, upsertLocalLikedProfile]);

  const handleUnlockMatch = async () => {
    if (!matchDialog) return;
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", { body: { targetUserId: matchDialog.id } });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setPaymentLoading(false);
      setMatchDialog(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="h-screen-safe w-screen relative overflow-hidden bg-black">
      {/* Map */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/70 to-transparent z-10 pointer-events-none" />

      {/* ── Top-left: Back ── */}
      <button
        onClick={() => navigate("/")}
        aria-label="Back to home"
        className="absolute left-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        style={{ top: `max(1rem, env(safe-area-inset-top, 0px))` }}
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* ── Top-right stack: Recenter + Radius toggle + "Tonight" filter ── */}
      <div className="absolute right-4 z-30 flex flex-col gap-2" style={{ top: `max(1rem, env(safe-area-inset-top, 0px))` }}>
        {userLocation && (
          <button
            onClick={() => {
              const map = mapInstanceRef.current;
              if (map) map.flyTo([userLocation.lat, userLocation.lng], 10, { duration: 1 });
            }}
            aria-label="Recenter on my location"
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-primary transition-colors"
          >
            <LocateFixed className="w-5 h-5" />
          </button>
        )}

        {/* Radius ring toggle */}
        <button
          onClick={() => setShowRadius(v => !v)}
          aria-label={showRadius ? "Hide search radius" : "Show search radius"}
          className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors ${
            showRadius
              ? "bg-primary/20 border-primary/40 text-primary"
              : "bg-black/50 border-white/10 text-white/50 hover:text-white"
          }`}
        >
          <Eye className="w-4.5 h-4.5" />
        </button>

        {/* Available Tonight filter */}
        <button
          onClick={() => setFilterTonight(v => !v)}
          aria-label={filterTonight ? "Show all profiles" : "Show free tonight only"}
          className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors ${
            filterTonight
              ? "bg-yellow-400/15 border-yellow-400/60 text-yellow-400"
              : "bg-black/50 border-white/10 text-white/50 hover:text-white"
          }`}
          title={filterTonight ? "Showing: free tonight" : "Filter: free tonight"}
        >
          <Moon className="w-4 h-4" />
        </button>
      </div>

      {/* ── Stats pill (top-center) ── */}
      {!detailProfile && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        >
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1 flex items-center gap-3 whitespace-nowrap">
            <span className="flex items-center gap-1 text-[10px] text-white/70">
              <Users className="w-3 h-3 text-white/50" />
              <span className="font-semibold text-white">{stats.total}</span> nearby
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1 text-[10px] text-white/70">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <span className="font-semibold text-green-400">{stats.online}</span> online
            </span>
            {stats.liked > 0 && <>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1 text-[10px] text-white/70">
                <Heart className="w-3 h-3 text-primary" fill="currentColor" />
                <span className="font-semibold text-primary">{stats.liked}</span>
              </span>
            </>}
            {stats.matches > 0 && <>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1 text-[10px] text-amber-400">
                <Star className="w-3 h-3" fill="currentColor" />
                <span className="font-semibold">{stats.matches} match{stats.matches > 1 ? "es" : ""}</span>
              </span>
            </>}
            {showRadius && (
              <>
                <span className="w-px h-3 bg-white/10" />
                <span className="text-[10px] text-white/40">{zoomToRadiusKm(mapZoom)}km radius</span>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Selected profile name chip (replaces stats while a profile is active) ── */}
      <AnimatePresence>
        {selectedProfile && !detailProfile && (
          <motion.div
            key={selectedProfile.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute top-[3.6rem] left-4 right-16 z-20 pointer-events-none"
          >
            <div className="bg-black/65 backdrop-blur-xl border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 overflow-hidden">
              <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="text-white text-xs font-medium truncate">{selectedProfile.name}, {selectedProfile.age}</span>
              {selectedProfile.distanceKm !== undefined ? (
                <span className="text-primary text-[10px] font-semibold flex-shrink-0">
                  {fmtDist(selectedProfile.distanceKm)}
                </span>
              ) : (
                <span className="text-white/30 text-[10px] flex-shrink-0">— km</span>
              )}
              <span className="text-white/40 text-[10px] flex-shrink-0 hidden sm:inline">{selectedProfile.city}</span>
              {selectedProfile.available_tonight && !(selectedProfile as any).is_plusone && (
                <span className="text-yellow-400 text-[10px] flex-shrink-0 flex items-center gap-0.5">
                  <Moon className="w-2.5 h-2.5" fill="currentColor" /> free tonight
                </span>
              )}
              {(selectedProfile as any).is_plusone && (
                <span className="text-yellow-400 text-[10px] flex-shrink-0 flex items-center gap-0.5 font-bold">
                  +1
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── "Tonight" filter active banner ── */}
      <AnimatePresence>
        {filterTonight && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-[7rem] left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="bg-teal-500/20 backdrop-blur-xl border border-teal-400/40 rounded-full px-3 py-1 flex items-center gap-1.5">
              <Moon className="w-3 h-3 text-teal-400" />
              <span className="text-yellow-400 text-[10px] font-semibold">Free Tonight only</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom UI ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20" style={{ paddingBottom: `env(safe-area-inset-bottom, 0px)` }}>
        <div className="h-20 bg-gradient-to-t from-black/85 to-transparent pointer-events-none" />
        <div className="px-4 pb-6">

          {/* Avatar strip */}
          <div className="flex items-end justify-center gap-4 mb-4 overflow-x-auto scroll-touch px-2" style={{ scrollbarWidth: "none" }}>
            {nearestProfiles.map((profile, idx) => {
              const isActive     = idx === selectedIndex;
              const isLiked      = likedIds.has(profile.id);
              const isSuperLiked = superLikedIds.has(profile.id);
              const noMatchBack  = isLiked && !likedMeIds.has(profile.id);
              const viewed       = viewedMeIds.has(profile.id);
              return (
                <button
                  key={profile.id}
                  onClick={() => {
                    if (isActive) {
                      if (!user) { showGuestPrompt("profile"); return; }
                      if (noMatchBack) setAttentionProfile(profile);
                      else setDetailProfile(profile);
                    } else {
                      setSelectedIndex(idx);
                    }
                  }}
                  aria-label={`${profile.name}${isLiked ? " (liked)" : ""}${viewed ? " (viewed you)" : ""}`}
                  className="flex flex-col items-center gap-1 transition-all active:scale-95"
                >
                  <div className="relative">
                    {/* "viewed me" outer pulse ring */}
                    {viewed && (
                      <div className="absolute inset-[-5px] rounded-full border-2 border-teal-400/40 animate-pulse pointer-events-none" />
                    )}
                    <div className={`rounded-full overflow-hidden transition-all duration-300 ${
                      isActive
                        ? "w-16 h-16 ring-2 ring-primary shadow-[0_0_22px_rgba(180,80,150,0.5)]"
                        : "w-12 h-12 ring-1 ring-white/20 opacity-60 hover:opacity-90"
                    }`}>
                      <img src={profile.avatar_url || profile.image} alt={profile.name} className="w-full h-full object-cover" />
                    </div>
                    {isSuperLiked && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                        <Star className="w-3 h-3 text-white" fill="white" />
                      </div>
                    )}
                    {!isSuperLiked && isLiked && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-love flex items-center justify-center shadow-[0_0_8px_rgba(180,80,150,0.5)]">
                        <Heart className="w-3 h-3 text-white" fill="white" />
                      </div>
                    )}
                    {(profile as any).is_plusone ? (
                      <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-black border border-yellow-400/70 flex items-center justify-center text-[7px] font-black text-yellow-300 shadow-[0_0_6px_rgba(250,204,21,0.5)]">+1</div>
                    ) : profile.available_tonight && !isLiked ? (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black border border-yellow-400/70 flex items-center justify-center text-[8px] shadow-[0_0_6px_rgba(250,204,21,0.5)]">🌙</div>
                    ) : null}
                    {!isLiked && !profile.available_tonight && isOnline(profile.last_seen_at) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-black shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                    )}
                    {noMatchBack && isActive && (
                      <div className="absolute inset-0 rounded-full border-2 border-amber-400/60 animate-ping pointer-events-none" />
                    )}
                  </div>
                  <span className={`text-[9px] font-medium truncate max-w-[60px] transition-colors ${isActive ? "text-white" : "text-white/50"}`}>
                    {profile.name}
                  </span>
                  {/* distance under name */}
                  {profile.distanceKm !== undefined && (
                    <span className={`text-[8px] transition-colors ${isActive ? "text-primary" : "text-white/30"}`}>
                      {fmtDist(profile.distanceKm)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action buttons — diamond layout */}
          {selectedProfile && (
            <div className="flex items-center justify-center gap-3">
              {/* Like */}
              <button
                onClick={() => handleLike(selectedProfile)}
                aria-label={likedIds.has(selectedProfile.id) ? "Already liked" : `Like ${selectedProfile.name}`}
                className={`w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-90 hover:scale-105 shadow-lg ${
                  likedIds.has(selectedProfile.id)
                    ? "bg-pink-500/20 border-pink-400/50 text-pink-400"
                    : "bg-black/50 border-white/10 text-white/70 hover:text-pink-400 hover:border-pink-400/40"
                }`}
              >
                <Heart className="w-5 h-5" fill={likedIds.has(selectedProfile.id) ? "currentColor" : "none"} />
              </button>

              {/* View Profile (centre — bigger) */}
              <button
                onClick={() => {
                  if (!user) { showGuestPrompt("profile"); return; }
                  if (likedIds.has(selectedProfile.id) && !likedMeIds.has(selectedProfile.id)) {
                    setAttentionProfile(selectedProfile);
                  } else {
                    setDetailProfile(selectedProfile);
                  }
                }}
                aria-label={`View ${selectedProfile.name}'s profile`}
                className="w-14 h-14 rounded-full gradient-love border-0 flex items-center justify-center transition-all active:scale-90 hover:scale-105 shadow-[0_0_20px_rgba(180,80,150,0.4)]"
              >
                <ChevronUp className="w-6 h-6 text-white" />
              </button>

              {/* Super Like */}
              <button
                onClick={() => {
                  if (superLikedIds.has(selectedProfile.id)) {
                    toast("Already Super Liked!", { description: `You already super liked ${selectedProfile.name}` });
                  } else {
                    handleSuperLike(selectedProfile);
                  }
                }}
                aria-label={`Super Like ${selectedProfile.name}`}
                className={`w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-90 hover:scale-105 shadow-lg ${
                  superLikedIds.has(selectedProfile.id)
                    ? "bg-amber-400/20 border-amber-400/50 text-amber-400"
                    : "bg-black/50 border-white/10 text-white/70 hover:text-amber-400 hover:border-amber-400/40"
                }`}
              >
                <Star className="w-5 h-5" fill={superLikedIds.has(selectedProfile.id) ? "currentColor" : "none"} />
              </button>

              {/* WhatsApp — mutual match only */}
              {likedIds.has(selectedProfile.id) && likedMeIds.has(selectedProfile.id) && (
                <button
                  onClick={() => setMatchDialog(selectedProfile)}
                  aria-label={`Unlock WhatsApp with ${selectedProfile.name}`}
                  className="w-12 h-12 rounded-full bg-green-500/20 border border-green-400/50 text-green-400 flex items-center justify-center transition-all active:scale-90 hover:scale-105 shadow-lg"
                >
                  <MessageCircle className="w-5 h-5" fill="currentColor" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Attention sheet ── */}
      <AnimatePresence>
        {attentionProfile && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setAttentionProfile(null)}
            />
            <AttentionSheet
              profile={attentionProfile}
              onSuperLike={() => handleSuperLike(attentionProfile)}
              onClose={() => setAttentionProfile(null)}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── Match dialog ── */}
      <Dialog open={!!matchDialog} onOpenChange={(open) => !open && setMatchDialog(null)}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/10 text-white max-w-sm rounded-3xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-display font-bold text-center">It's a Match! 🎉</DialogTitle>
            <DialogDescription className="text-white/60 text-center">
              You and {matchDialog?.name} liked each other!
            </DialogDescription>
          </DialogHeader>
          {matchDialog && (
            <div className="flex flex-col items-center gap-4 py-4">
              <img src={matchDialog.avatar_url || matchDialog.image} alt={matchDialog.name}
                className="w-24 h-24 rounded-full object-cover ring-2 ring-primary" />
              <p className="text-white font-semibold">{matchDialog.name}, {matchDialog.age}</p>
              <p className="text-white/50 text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {matchDialog.city}, {matchDialog.country}
              </p>
              <Button onClick={handleUnlockMatch} disabled={paymentLoading}
                className="w-full gradient-love text-white border-0 h-12 text-base font-semibold rounded-xl">
                <Unlock className="w-4 h-4 mr-2" />
                {paymentLoading ? "Processing..." : "Unlock WhatsApp — $1.99"}
              </Button>
              <button onClick={() => setMatchDialog(null)} className="text-white/40 hover:text-white/70 text-sm transition-colors">
                Maybe later
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Detail panel ── */}
      <AnimatePresence>
        {detailProfile && (
          <DetailPanel
            profile={detailProfile}
            isMatch={likedIds.has(detailProfile.id) && likedMeIds.has(detailProfile.id)}
            onClose={() => setDetailProfile(null)}
            onUnlock={() => setMatchDialog(detailProfile)}
            nearbyUsers={profiles}
            onSelectUser={(userId) => {
              const p = profiles.find(pr => pr.id === userId);
              if (p) {
                setDetailProfile(p);
                const idx = nearestProfiles.findIndex(pr => pr.id === userId);
                if (idx >= 0) setSelectedIndex(idx);
              }
            }}
            likedMeProfiles={profiles.filter(p => likedMeIds.has(p.id))}
          />
        )}
      </AnimatePresence>

      {/* ── Guest auth prompt ── */}
      <GuestAuthPrompt
        open={guestPrompt.open}
        trigger={guestPrompt.trigger}
        onClose={() => setGuestPrompt(p => ({ ...p, open: false }))}
      />

      <style>{`
        /* Leaflet reset */
        .map-avatar-marker { background: none !important; border: none !important; }
        .map-km-label      { background: none !important; border: none !important; }
        .leaflet-container { background: #000 !important; }
        .leaflet-tile-pane { filter: brightness(0.85) saturate(0.8); }

        /* Zoom controls — positioned mid-right, styled dark */
        .leaflet-control-zoom {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        }
        .leaflet-control-zoom a {
          background: rgba(0,0,0,0.55) !important;
          color: rgba(255,255,255,0.75) !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          backdrop-filter: blur(12px);
          width: 36px !important; height: 36px !important;
          line-height: 36px !important; font-size: 20px !important;
        }
        .leaflet-control-zoom a:hover  { color: white !important; background: rgba(0,0,0,0.75) !important; }
        .leaflet-control-zoom-in       { border-radius: 12px 12px 0 0 !important; }
        .leaflet-control-zoom-out      { border-radius: 0 0 12px 12px !important; }

        /* Radius circle soft dash */
        .leaflet-interactive { outline: none; }

        /* Keyframe animations embedded in marker HTML */
        @keyframes userPulse {
          0%,100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 0.8; transform: scale(1.15); }
        }
        @keyframes viewedPulse {
          0%,100% { opacity: 0.25; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
};

export default MapPage;
