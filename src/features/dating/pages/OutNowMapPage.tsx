import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, Users, MapPin, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OutNowToggle from "@/features/dating/components/OutNowToggle";
import { useOutNow } from "@/shared/hooks/useOutNow";
import { pushNotify } from "@/shared/utils/pushNotify";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface OutNowUser {
  id: string;
  name: string;
  age: number;
  avatar_url: string;
  lat: number;
  lng: number;
  distanceKm: number;
  distanceBand: string;
  isVerified: boolean;
  isMutualMatch: boolean;
  expiresAt: string;
  lockedBy: string | null;
  lockExpiresAt: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBand(km: number): string {
  if (km < 0.5) return "< 500m";
  if (km < 1)   return "< 1km";
  if (km < 2)   return "~1km";
  if (km < 5)   return `~${Math.round(km)}km`;
  return `${Math.round(km)}km`;
}

function fmtLockTime(ms: number): string {
  if (ms <= 0) return "";
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Inject CSS animations once ────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById("out-now-map-styles")) return;
  const style = document.createElement("style");
  style.id = "out-now-map-styles";
  style.textContent = `
    @keyframes onm-ping {
      0%   { transform: scale(1); opacity: 0.8; }
      70%  { transform: scale(1.8); opacity: 0; }
      100% { transform: scale(1.8); opacity: 0; }
    }
    @keyframes onm-spin { to { transform: rotate(360deg); } }
    @keyframes onm-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.6); }
      50%       { box-shadow: 0 0 0 8px rgba(251,191,36,0); }
    }
    .leaflet-container { background: #0f0f1a !important; }
    .leaflet-tile-pane { filter: brightness(0.85) saturate(0.8); }
    .onm-marker { cursor: pointer; }
    .onm-marker:active { transform: scale(0.92); }
  `;
  document.head.appendChild(style);
}

// ── Marker HTML builder ───────────────────────────────────────────────────────
function buildMarkerHtml(user: OutNowUser, isSelected: boolean): string {
  const color  = isSelected ? "#ec4899" : user.isMutualMatch ? "#22c55e" : "#ef4444";
  const glow   = isSelected
    ? "0 0 0 3px rgba(236,72,153,0.4), 0 0 20px rgba(236,72,153,0.5)"
    : user.isMutualMatch
      ? "0 0 0 3px rgba(34,197,94,0.35), 0 0 14px rgba(34,197,94,0.4)"
      : "0 0 0 3px rgba(239,68,68,0.3),  0 0 12px rgba(239,68,68,0.35)";
  const size   = isSelected ? 62 : 52;
  const scale  = isSelected ? "transform:scale(1.08);" : "";
  const badge  = user.isMutualMatch && !isSelected
    ? `<div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);background:#22c55e;border-radius:8px;padding:2px 6px;font-size:7px;color:#fff;font-weight:800;white-space:nowrap;pointer-events:none;box-shadow:0 2px 6px rgba(0,0,0,0.4);">MATCH</div>`
    : "";
  const pulse  = isSelected
    ? `<div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid #ec4899;opacity:0.5;animation:onm-ping 1.8s infinite;pointer-events:none;"></div>`
    : "";

  return `
    <div class="onm-marker" onclick="window.__onmSelect('${user.id}')"
      style="position:relative;width:${size}px;height:${size}px;${scale}transition:transform 0.2s;">
      ${pulse}
      <div style="width:${size}px;height:${size}px;border-radius:50%;border:3px solid ${color};
        box-shadow:${glow};overflow:hidden;background:#1a1a2e;">
        <img src="${user.avatar_url || "/placeholder.svg"}"
          style="width:100%;height:100%;object-fit:cover;"
          onerror="this.src='/placeholder.svg'"/>
      </div>
      ${badge}
    </div>`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function OutNowMapPage() {
  const navigate    = useNavigate();
  const mapDivRef   = useRef<HTMLDivElement>(null);
  const leafletRef  = useRef<any>(null);
  const markersRef  = useRef<Map<string, any>>(new Map());

  const [authUser, setAuthUser]           = useState<any>(null);
  const [myLat, setMyLat]                 = useState<number | null>(null);
  const [myLng, setMyLng]                 = useState<number | null>(null);
  const [mapReady, setMapReady]           = useState(false);
  const [locLoading, setLocLoading]       = useState(true);
  const [outNowUsers, setOutNowUsers]     = useState<OutNowUser[]>([]);
  const [mutualIds, setMutualIds]         = useState<string[]>([]);
  const [selected, setSelected]           = useState<OutNowUser | null>(null);
  const [otwLoading, setOtwLoading]       = useState(false);
  const [likeLoading, setLikeLoading]     = useState(false);
  const [showToggle, setShowToggle]       = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const [now, setNow]                     = useState(Date.now());

  // Tick for lock countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthUser(data.user));
  }, []);

  // OutNow hook
  const outNow = useOutNow(authUser?.id ?? null, mutualIds);

  // Geolocation → fallback to profile lat/lng
  useEffect(() => {
    if (!authUser?.id) return;
    const tryProfileFallback = () =>
      (supabase.from as any)("profiles")
        .select("latitude, longitude")
        .eq("id", authUser.id)
        .single()
        .then(({ data }: any) => {
          if (data?.latitude) { setMyLat(data.latitude); setMyLng(data.longitude); }
          setLocLoading(false);
        });

    navigator.geolocation.getCurrentPosition(
      (pos) => { setMyLat(pos.coords.latitude); setMyLng(pos.coords.longitude); setLocLoading(false); },
      () => tryProfileFallback(),
      { timeout: 6_000, enableHighAccuracy: true },
    );
  }, [authUser?.id]);

  // Mutual match IDs from connections table
  useEffect(() => {
    if (!authUser?.id) return;
    (supabase.from as any)("connections")
      .select("user_a, user_b")
      .or(`user_a.eq.${authUser.id},user_b.eq.${authUser.id}`)
      .then(({ data }: any) => {
        if (data) setMutualIds(data.map((c: any) => c.user_a === authUser.id ? c.user_b : c.user_a));
      });
  }, [authUser?.id]);

  // Load all Out Now users within radius
  const loadUsers = useCallback(async (silent = false) => {
    if (!myLat || !myLng || !authUser?.id) return;
    if (!silent) setRefreshing(true);
    const { data } = await (supabase.from as any)("profiles")
      .select("id, name, age, avatar_url, latitude, longitude, is_verified, photo_verified, meet_now_active, meet_now_expires_at, meet_now_locked_by, meet_now_lock_expires_at")
      .eq("meet_now_active", true)
      .gt("meet_now_expires_at", new Date().toISOString())
      .neq("id", authUser.id);

    if (data) {
      const users: OutNowUser[] = data
        .map((p: any) => {
          // Round lat/lng to 2dp (~1km precision) for privacy
          const lat = p.latitude  ? Math.round(p.latitude  * 100) / 100 : myLat + (Math.random() - 0.5) * 0.005;
          const lng = p.longitude ? Math.round(p.longitude * 100) / 100 : myLng + (Math.random() - 0.5) * 0.005;
          const km  = haversineKm(myLat, myLng, lat, lng);
          return {
            id: p.id, name: p.name, age: p.age,
            avatar_url: p.avatar_url || "/placeholder.svg",
            lat, lng, distanceKm: km, distanceBand: getBand(km),
            isVerified: p.is_verified || p.photo_verified,
            isMutualMatch: mutualIds.includes(p.id),
            expiresAt: p.meet_now_expires_at,
            lockedBy: p.meet_now_locked_by,
            lockExpiresAt: p.meet_now_lock_expires_at,
          };
        })
        .filter((u: OutNowUser) => u.distanceKm <= 10)
        .sort((a: OutNowUser, b: OutNowUser) => a.distanceKm - b.distanceKm);
      setOutNowUsers(users);
    }
    setRefreshing(false);
  }, [myLat, myLng, authUser?.id, mutualIds]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Realtime: re-load when any profile's Out Now status changes
  useEffect(() => {
    if (!authUser?.id) return;
    const ch = supabase.channel("out-now-map-rt")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" },
        () => loadUsers(true))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [authUser?.id, loadUsers]);

  // ── Init Leaflet ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || leafletRef.current || !myLat || !myLng) return;
    injectStyles();

    const init = () => {
      const L = (window as any).L;
      if (!L || !mapDivRef.current) return;

      const map = L.map(mapDivRef.current, {
        center: [myLat, myLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        minZoom: 11,
        maxZoom: 18,
      });

      // Dark CartoDB tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 19,
      }).addTo(map);

      // Zoom control top-right but inset
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // My location marker — pink pulsing dot
      const myIcon = L.divIcon({
        html: `<div style="position:relative;width:20px;height:20px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:rgba(236,72,153,0.35);animation:onm-ping 2s infinite;"></div>
          <div style="position:absolute;inset:3px;border-radius:50%;background:#ec4899;border:2px solid white;box-shadow:0 0 12px rgba(236,72,153,0.8);"></div>
        </div>`,
        className: "", iconSize: [20, 20], iconAnchor: [10, 10],
      });
      L.marker([myLat, myLng], { icon: myIcon, zIndexOffset: 2000 })
        .bindTooltip("You", { permanent: false, className: "onm-tooltip" })
        .addTo(map);

      leafletRef.current = map;
      setMapReady(true);
    };

    if ((window as any).L) { init(); return; }

    // Load Leaflet from CDN dynamically
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = init;
    document.head.appendChild(script);

    return () => {
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; }
    };
  }, [myLat, myLng]);

  // ── Update markers whenever users or selection changes ───────────────────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    const map = leafletRef.current;

    const currentIds = new Set(outNowUsers.map(u => u.id));

    // Remove stale
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) { map.removeLayer(marker); markersRef.current.delete(id); }
    });

    // Add / refresh
    outNowUsers.forEach(u => {
      const html    = buildMarkerHtml(u, selected?.id === u.id);
      const size    = selected?.id === u.id ? 62 : 52;
      const icon    = L.divIcon({ html, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });

      if (markersRef.current.has(u.id)) {
        markersRef.current.get(u.id).setIcon(icon);
      } else {
        const marker = L.marker([u.lat, u.lng], { icon }).addTo(map);
        markersRef.current.set(u.id, marker);
      }
    });
  }, [outNowUsers, selected, mapReady]);

  // ── Global click handler for marker divs ─────────────────────────────────────
  useEffect(() => {
    (window as any).__onmSelect = (id: string) => {
      const found = outNowUsers.find(u => u.id === id);
      if (!found) return;
      setSelected(prev => prev?.id === id ? null : found);
      if (found) leafletRef.current?.panTo([found.lat, found.lng], { animate: true, duration: 0.5 });
    };
    return () => { delete (window as any).__onmSelect; };
  }, [outNowUsers]);

  // ── Nearest 5 (already sorted by distance) ──────────────────────────────────
  const nearest5 = useMemo(() => outNowUsers.slice(0, 5), [outNowUsers]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleLike = async (target: OutNowUser) => {
    if (!authUser?.id) return;
    setLikeLoading(true);
    try {
      await supabase.from("likes").insert({ liker_id: authUser.id, liked_id: target.id });
      await pushNotify(
        target.id,
        `⚡ Someone nearby just liked you!`,
        `They're Out Now too — you could meet tonight`,
        { type: "out_now_like", userId: authUser.id },
      );
      toast.success(`💗 Liked ${target.name.split(" ")[0]}! They'll be notified.`);
      // Optimistically mark so user sees the like was sent
      setSelected(prev => prev?.id === target.id ? { ...prev, isMutualMatch: false } : prev);
    } catch { toast.error("Failed to like. Try again."); }
    setLikeLoading(false);
  };

  const handleOTW = async (target: OutNowUser) => {
    if (!authUser?.id) return;
    setOtwLoading(true);
    const result = await outNow.purchaseOTW(target.id);
    setOtwLoading(false);
    if ((result as any)?.url)           window.open((result as any).url, "_blank");
    else if ((result as any)?.contactNumber) toast.success("🎉 Contact unlocked! Check the countdown.");
    else if ((result as any)?.locked)   toast.info("Someone got there first — you're on the waitlist.");
  };

  // ── Ring color helper ─────────────────────────────────────────────────────────
  const ringColor = (u: OutNowUser) =>
    selected?.id === u.id ? "#ec4899" : u.isMutualMatch ? "#22c55e" : "#ef4444";

  // ── Loading screen ────────────────────────────────────────────────────────────
  if (locLoading) return (
    <div style={{ position: "fixed", inset: 0, background: "#0f0f1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 44, height: 44, border: "3px solid rgba(236,72,153,0.2)", borderTop: "3px solid #ec4899", borderRadius: "50%", animation: "onm-spin 0.8s linear infinite" }} />
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: 0 }}>Finding your location…</p>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0f0f1a", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── MAP ──────────────────────────────────────────────────────────────── */}
      <div ref={mapDivRef} style={{ position: "absolute", inset: 0 }} />

      {/* ── HEADER OVERLAY ───────────────────────────────────────────────────── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 500, padding: "env(safe-area-inset-top, 44px) 16px 0", pointerEvents: "none" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10 }}>

          {/* Back */}
          <button onClick={() => navigate(-1)} style={{ pointerEvents: "auto", width: 42, height: 42, borderRadius: "50%", background: "rgba(0,0,0,0.72)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(12px)" }}>
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>

          {/* Title pill */}
          <div style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(12px)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 22, padding: "9px 18px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24", display: "block", boxShadow: "0 0 8px #fbbf24", animation: "onm-pulse 2s infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>Out Now</span>
          </div>

          {/* Count + refresh */}
          <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
            <div style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 22, padding: "9px 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <Users className="w-3.5 h-3.5 text-yellow-400" />
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fbbf24" }}>{outNowUsers.length}</span>
            </div>
            <button onClick={() => loadUsers()} style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(0,0,0,0.72)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(12px)" }}>
              <RefreshCw className="w-3.5 h-3.5 text-white/60" style={{ animation: refreshing ? "onm-spin 0.8s linear infinite" : "none" }} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 7, justifyContent: "center", paddingTop: 4 }}>
          {[["#22c55e", "💚 Match — OTW available"], ["#ef4444", "❤️ Discover — like to connect"], ["#ec4899", "💗 Selected"]] .map(([color, label]) => (
            <div key={label} style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", border: `1px solid ${color}30`, borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MY LOCATION RE-CENTER ────────────────────────────────────────────── */}
      <button
        onClick={() => myLat && myLng && leafletRef.current?.flyTo([myLat, myLng], 15, { animate: true, duration: 0.8 })}
        style={{ position: "absolute", right: 16, bottom: outNowUsers.length > 0 ? 300 : 120, zIndex: 500, width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.72)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(12px)" }}
      >
        <MapPin className="w-4 h-4 text-pink-400" />
      </button>

      {/* ── OUT NOW TOGGLE FAB ───────────────────────────────────────────────── */}
      {authUser?.id && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowToggle(true)}
          style={{ position: "absolute", right: 16, bottom: outNowUsers.length > 0 ? 348 : 168, zIndex: 500, width: 52, height: 52, borderRadius: "50%", background: outNow.isActive ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : "rgba(0,0,0,0.75)", border: outNow.isActive ? "none" : "1px solid rgba(251,191,36,0.35)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: outNow.isActive ? "0 4px 20px rgba(251,191,36,0.55)" : "0 4px 14px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}
        >
          <Zap className="w-5 h-5" style={{ color: outNow.isActive ? "#000" : "#fbbf24" }} />
          {outNow.isActive && (
            <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#22c55e", border: "2px solid #0f0f1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 8, color: "#fff", fontWeight: 900 }}>✓</span>
            </div>
          )}
        </motion.button>
      )}

      {/* ── BOTTOM FOOTER ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {outNowUsers.length > 0 && (
          <motion.div
            initial={{ y: 280 }} animate={{ y: 0 }} exit={{ y: 280 }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 400 }}
          >
            {/* Gradient fade */}
            <div style={{ height: 60, background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.7))", pointerEvents: "none" }} />

            <div style={{ background: "rgba(10,10,20,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>

              {/* ── Nearest 5 horizontal scroll ─────────────────────────── */}
              <div style={{ padding: "14px 16px 0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>
                    {outNowUsers.length > 5 ? `NEAREST 5 OF ${outNowUsers.length}` : `${outNowUsers.length} NEARBY`}
                  </span>
                  {outNowUsers.length > 5 && (
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>scroll for more →</span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {outNowUsers.slice(0, 7).map(u => {
                    const isSelected = selected?.id === u.id;
                    const color = ringColor(u);
                    return (
                      <motion.button
                        key={u.id}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => {
                          setSelected(isSelected ? null : u);
                          if (!isSelected && leafletRef.current)
                            leafletRef.current.panTo([u.lat, u.lng], { animate: true, duration: 0.5 });
                        }}
                        style={{ flexShrink: 0, width: 68, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
                      >
                        {/* Photo ring */}
                        <div style={{ position: "relative" }}>
                          <div style={{ width: 54, height: 54, borderRadius: "50%", overflow: "hidden", border: `3px solid ${color}`, boxShadow: `0 0 0 2px ${color}35, 0 4px 14px rgba(0,0,0,0.6)`, background: "#1a1a2e", transition: "transform 0.2s", transform: isSelected ? "scale(1.1)" : "scale(1)" }}>
                            <img src={u.avatar_url} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                          </div>
                          {/* Lock indicator */}
                          {u.lockedBy && u.lockExpiresAt && new Date(u.lockExpiresAt) > new Date() && (
                            <div style={{ position: "absolute", top: -2, right: -2, background: "#fbbf24", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, border: "2px solid #0a0a14" }}>⏳</div>
                          )}
                          {/* Verified */}
                          {u.isVerified && (
                            <div style={{ position: "absolute", bottom: -2, right: -2, fontSize: 11 }}>✅</div>
                          )}
                        </div>
                        {/* Name + distance */}
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: isSelected ? color : "rgba(255,255,255,0.82)", whiteSpace: "nowrap", maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {u.name.split(" ")[0]}
                          </div>
                          <div style={{ fontSize: 9, color: color, fontWeight: 700 }}>{u.distanceBand}</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* ── Selected profile action card ─────────────────────────── */}
              <AnimatePresence mode="wait">
                {selected && (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.97 }}
                    transition={{ type: "spring", damping: 28, stiffness: 320 }}
                    style={{ margin: "10px 12px 12px", background: "rgba(20,20,36,0.98)", border: `1px solid ${selected.isMutualMatch ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.25)"}`, borderRadius: 20, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, boxShadow: `0 -4px 24px ${selected.isMutualMatch ? "rgba(34,197,94,0.1)" : "rgba(236,72,153,0.08)"}` }}
                  >
                    {/* Photo */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{ width: 54, height: 54, borderRadius: "50%", overflow: "hidden", border: `3px solid ${selected.isMutualMatch ? "#22c55e" : "#ec4899"}`, boxShadow: `0 0 14px ${selected.isMutualMatch ? "rgba(34,197,94,0.45)" : "rgba(236,72,153,0.4)"}` }}>
                        <img src={selected.avatar_url} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      {selected.isVerified && <div style={{ position: "absolute", bottom: -3, right: -3, fontSize: 13 }}>✅</div>}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{selected.name.split(" ")[0]}</span>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{selected.age}</span>
                        {selected.isMutualMatch && (
                          <span style={{ fontSize: 8, background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.4)", color: "#22c55e", borderRadius: 10, padding: "2px 7px", fontWeight: 800, letterSpacing: "0.05em" }}>MATCH</span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                        <MapPin className="w-3 h-3 text-yellow-400" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>{selected.distanceBand} away</span>
                      </div>
                      {/* Lock countdown */}
                      {selected.lockedBy && selected.lockExpiresAt && (() => {
                        const ms = Math.max(0, new Date(selected.lockExpiresAt).getTime() - now);
                        return ms > 0 ? (
                          <div style={{ fontSize: 10, color: "rgba(251,191,36,0.7)", marginTop: 2 }}>
                            ⏳ Someone on the way · {fmtLockTime(ms)}
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Action button */}
                    {selected.isMutualMatch ? (
                      (() => {
                        const isLocked = selected.lockedBy && selected.lockedBy !== authUser?.id &&
                          selected.lockExpiresAt && new Date(selected.lockExpiresAt) > new Date();
                        return isLocked ? (
                          <button
                            onClick={() => { outNow.joinWaitlist(selected.id); toast.info("Added to waitlist — you'll be notified when free!"); }}
                            style={{ flexShrink: 0, padding: "12px 14px", borderRadius: 14, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                          >🔔 Waitlist</button>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={() => handleOTW(selected)}
                            disabled={otwLoading}
                            style={{ flexShrink: 0, padding: "13px 20px", borderRadius: 14, background: otwLoading ? "rgba(34,197,94,0.4)" : "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", cursor: otwLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 4px 18px rgba(34,197,94,0.35)" }}
                          >
                            {otwLoading
                              ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "onm-spin 0.8s linear infinite" }} />
                              : <><Zap className="w-4 h-4 text-white" /><span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>OTW</span></>
                            }
                          </motion.button>
                        );
                      })()
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => handleLike(selected)}
                        disabled={likeLoading}
                        style={{ flexShrink: 0, padding: "13px 20px", borderRadius: 14, background: likeLoading ? "rgba(236,72,153,0.4)" : "linear-gradient(135deg,#ec4899,#c2185b)", border: "none", cursor: likeLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 4px 18px rgba(236,72,153,0.35)" }}
                      >
                        {likeLoading
                          ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "onm-spin 0.8s linear infinite" }} />
                          : <><span style={{ fontSize: 15 }}>💗</span><span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Like</span></>
                        }
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EMPTY STATE ──────────────────────────────────────────────────────── */}
      {!locLoading && outNowUsers.length === 0 && (
        <div style={{ position: "absolute", bottom: 130, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.78)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "20px 28px", textAlign: "center", zIndex: 500, minWidth: 220 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", fontWeight: 700, margin: "0 0 4px" }}>Nobody Out Now nearby</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 14px" }}>Be the first — tap ⚡ below</p>
          <button
            onClick={() => setShowToggle(true)}
            style={{ padding: "10px 20px", borderRadius: 12, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 800, color: "#000" }}
          >Go Out Now ⚡</button>
        </div>
      )}

      {/* ── OUT NOW TOGGLE SHEET ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showToggle && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowToggle(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 600, backdropFilter: "blur(4px)" }} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 601, background: "#1a1a2e", borderRadius: "24px 24px 0 0", padding: "20px 20px env(safe-area-inset-bottom, 32px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 -12px 40px rgba(0,0,0,0.7)" }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)", margin: "0 auto 18px" }} />
              <OutNowToggle
                isActive={outNow.isActive}
                expiresAt={outNow.expiresAt}
                onActivate={async (h) => { await outNow.activateOutNow(h); setShowToggle(false); await loadUsers(); }}
                onDeactivate={async () => { await outNow.deactivateOutNow(); setShowToggle(false); }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
