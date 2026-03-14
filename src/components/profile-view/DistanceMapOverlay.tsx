import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, Heart, Zap } from "lucide-react";

// ── Haversine ────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Badge filters ────────────────────────────────────────────────────────────
const BADGE_FILTERS = [
  { key: "available_tonight",  icon: "🌙", label: "Free Tonight" },
  { key: "weekend_plans",      icon: "📅", label: "Weekend" },
  { key: "is_plusone",         icon: "✚",  label: "Plus One" },
  { key: "late_night_chat",    icon: "💬", label: "Late Night" },
  { key: "no_drama",           icon: "✨", label: "No Drama" },
  { key: "generous_lifestyle", icon: "🎁", label: "Generous" },
];

// ── Marker helpers ───────────────────────────────────────────────────────────
const makeProfileMarker = (imgUrl: string, size: number, borderColor: string, glow: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;border:3px solid ${borderColor};overflow:hidden;background:#0a0018;box-shadow:0 0 0 5px ${glow},0 2px 12px rgba(0,0,0,0.7);cursor:pointer;">
      <img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='/placeholder.svg'"/>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const makeUserDot = () =>
  L.divIcon({
    className: "",
    html: `<div class="dist-user-dot"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

// ── Props ────────────────────────────────────────────────────────────────────
interface DistanceMapOverlayProps {
  profile: any;
  allProfiles: any[];
  onClose: () => void;
  onLike: (p: any) => void;
  onSuperLike: (p: any) => void;
}

export default function DistanceMapOverlay({
  profile,
  allProfiles,
  onClose,
  onLike,
  onSuperLike,
}: DistanceMapOverlayProps) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInst     = useRef<L.Map | null>(null);
  const layersRef   = useRef<L.Layer[]>([]);

  const [userPos, setUserPos]             = useState<[number, number] | null>(null);
  const [locError, setLocError]           = useState(false);
  const [featuredId, setFeaturedId]       = useState<string>(profile?.id ?? "");
  const [radiusKm, setRadiusKm]           = useState(10);
  const [activeFilter, setActiveFilter]   = useState<string | null>(null);

  // Resolve featured profile object
  const featuredProfile = useMemo(() =>
    allProfiles.find(p => p.id === featuredId) ?? profile,
    [allProfiles, featuredId, profile]
  );

  // Nearby profiles (have coords, sorted by distance from user or featured profile)
  const nearbyProfiles = useMemo(() => {
    const withCoords = allProfiles.filter(p => p.latitude && p.longitude && p.id !== featuredId);
    const refLat = userPos?.[0] ?? featuredProfile?.latitude;
    const refLon = userPos?.[1] ?? featuredProfile?.longitude;
    if (refLat && refLon) {
      return withCoords
        .map(p => ({ ...p, _km: haversineKm(refLat, refLon, p.latitude, p.longitude) }))
        .sort((a, b) => a._km - b._km);
    }
    return withCoords.slice(0, 20);
  }, [allProfiles, userPos, featuredId, featuredProfile]);

  // Distance from user to featured profile (fallback: distance from profile prop if no geolocation)
  const distToFeatured = useMemo(() => {
    if (!featuredProfile?.latitude) return null;
    // Use user geolocation if available
    if (userPos) {
      const km = haversineKm(userPos[0], userPos[1], featuredProfile.latitude, featuredProfile.longitude);
      return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
    }
    // Fallback: distance from the originally-selected profile
    if (profile?.latitude && profile.id !== featuredProfile.id) {
      const km = haversineKm(profile.latitude, profile.longitude, featuredProfile.latitude, featuredProfile.longitude);
      return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
    }
    return null;
  }, [userPos, featuredProfile, profile]);

  // Carousel: featured + 4 nearest
  const carouselProfiles = useMemo(() => {
    const nearest = nearbyProfiles.slice(0, 4);
    return [featuredProfile, ...nearest].filter(Boolean);
  }, [featuredProfile, nearbyProfiles]);

  // Geolocation — fallback to a position near the featured profile if denied/unavailable
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError(true);
      if (profile?.latitude) {
        setUserPos([profile.latitude + 0.015, profile.longitude - 0.012]);
      }
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {
        setLocError(true);
        if (profile?.latitude) {
          setUserPos([profile.latitude + 0.015, profile.longitude - 0.012]);
        }
      },
      { timeout: 8000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const center: [number, number] = featuredProfile?.latitude
      ? [featuredProfile.latitude, featuredProfile.longitude]
      : [-7.8, 110.4]; // Yogyakarta default

    const map = L.map(mapRef.current, {
      center,
      zoom: 12,
      minZoom: 3,
      zoomControl: false,
      attributionControl: false,
      maxBoundsViscosity: 1.0,
      maxBounds: L.latLngBounds([-85, -180], [85, 180]),
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
      noWrap: true,
    }).addTo(map);
    mapInst.current = map;

    // Force Leaflet to recalculate container size after portal renders
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      map.remove();
      mapInst.current = null;
      layersRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw layers whenever data/filter changes
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;

    // Remove old layers
    layersRef.current.forEach(l => { try { map.removeLayer(l); } catch { /* ignore */ } });
    layersRef.current = [];

    const add = (layer: L.Layer) => { layer.addTo(map); layersRef.current.push(layer); };

    // ── User dot ──────────────────────────────────────────────────────────
    if (userPos) {
      add(L.marker(userPos, { icon: makeUserDot(), zIndexOffset: 1000 }));

      // Radius circle around user
      add(L.circle(userPos, {
        radius: radiusKm * 1000,
        color: "#ec4899",
        fillColor: "#ec4899",
        fillOpacity: 0.05,
        weight: 1.5,
        dashArray: "6 5",
      }));

      // Dotted pink line to featured profile
      if (featuredProfile?.latitude) {
        add(L.polyline([userPos, [featuredProfile.latitude, featuredProfile.longitude]], {
          color: "#ec4899",
          weight: 2,
          dashArray: "8 6",
          opacity: 0.75,
        }));
      }
    }

    // ── Featured profile marker ───────────────────────────────────────────
    if (featuredProfile?.latitude) {
      const img = featuredProfile.avatar_url || featuredProfile.image || "/placeholder.svg";
      add(L.marker([featuredProfile.latitude, featuredProfile.longitude], {
        icon: makeProfileMarker(img, 52, "#ec4899", "rgba(236,72,153,0.3)"),
        zIndexOffset: 900,
      }));
    }

    // ── Nearby markers ────────────────────────────────────────────────────
    nearbyProfiles.forEach(p => {
      if (!p.latitude || !p.longitude) return;
      const hasBadge = activeFilter ? !!(p as any)[activeFilter] : false;
      const border   = hasBadge ? "#facc15" : "rgba(255,255,255,0.35)";
      const glow     = hasBadge ? "rgba(250,204,21,0.4)" : "rgba(0,0,0,0.3)";
      const img      = p.avatar_url || p.image || "/placeholder.svg";

      const marker = L.marker([p.latitude, p.longitude], {
        icon: makeProfileMarker(img, 38, border, glow),
        zIndexOffset: hasBadge ? 500 : 100,
      });
      marker.on("click", () => setFeaturedId(p.id));
      add(marker);
    });

    // Re-fit view around user + featured if both exist
    if (userPos && featuredProfile?.latitude) {
      const bounds = L.latLngBounds([userPos, [featuredProfile.latitude, featuredProfile.longitude]]);
      map.fitBounds(bounds.pad(0.35), { maxZoom: 13 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPos, featuredProfile, nearbyProfiles, radiusKm, activeFilter]);

  // Badge label with icon
  const activeBadge = activeFilter
    ? BADGE_FILTERS.find(f => f.key === activeFilter)
    : null;
  const badgeLabel = activeBadge ? `${activeBadge.icon} ${activeBadge.label}` : null;

  // Profile name — try common field names
  const featuredName = featuredProfile?.name || featuredProfile?.full_name || featuredProfile?.first_name || "Unknown";

  const topLabel = [
    featuredName,
    distToFeatured,
    badgeLabel,
  ].filter(Boolean).join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#06000f",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* ── CSS for user dot animation ── */}
      <style>{`
        .dist-user-dot {
          width: 20px; height: 20px; border-radius: 50%;
          background: #ec4899;
          box-shadow: 0 0 0 0 rgba(236,72,153,0.7);
          animation: dist-ping 1.5s ease-out infinite;
        }
        @keyframes dist-ping {
          0%   { box-shadow: 0 0 0 0 rgba(236,72,153,0.7); }
          70%  { box-shadow: 0 0 0 14px rgba(236,72,153,0); }
          100% { box-shadow: 0 0 0 0 rgba(236,72,153,0); }
        }
        .leaflet-container { background: #06000f !important; }
        .leaflet-tile-pane { z-index: 2 !important; }
        .leaflet-overlay-pane { z-index: 4 !important; }
        .leaflet-marker-pane { z-index: 6 !important; }
        .leaflet-popup-pane { z-index: 7 !important; }
        .custom-map-marker { background: none !important; border: none !important; }
        .leaflet-control-container { pointer-events: none !important; }
      `}</style>

      {/* ── Map ── */}
      <div ref={mapRef} style={{ flex: 1, width: "100%", minHeight: 0, position: "relative", background: "#06000f", zIndex: 1 }} />

      {/* ── Top badge + slider ── */}
      <div style={{
        position: "absolute", top: 12, left: 12, right: 52,
        display: "flex", flexDirection: "column", gap: 8, zIndex: 20,
        pointerEvents: "none",
      }}>
        {/* Name + distance badge */}
        <div style={{
          alignSelf: "flex-start",
          background: "rgba(10,0,24,0.82)",
          border: "1.5px solid rgba(236,72,153,0.45)",
          borderRadius: 22, padding: "6px 14px",
          backdropFilter: "blur(10px)",
          pointerEvents: "none",
        }}>
          <p style={{ color: "#fff", fontSize: 13, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
            📍 {topLabel || "Loading…"}
          </p>
          {locError && (
            <p style={{ color: "rgba(236,72,153,0.7)", fontSize: 10, margin: "2px 0 0", fontWeight: 600 }}>
              Enable location for exact distance
            </p>
          )}
        </div>

        {/* Radius slider */}
        <div style={{
          background: "rgba(10,0,24,0.78)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 14, padding: "8px 12px",
          backdropFilter: "blur(10px)",
          pointerEvents: "all",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Radius</span>
            <span style={{ color: "#ec4899", fontSize: 11, fontWeight: 800 }}>{radiusKm} km</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>1</span>
            <input
              type="range" min={1} max={50} value={radiusKm}
              onChange={e => setRadiusKm(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#ec4899", height: 3 }}
            />
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>50</span>
          </div>
        </div>
      </div>

      {/* ── Close button ── */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: "absolute", top: 12, right: 12, zIndex: 9999,
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(10,0,24,0.92)",
          border: "1.5px solid rgba(255,255,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#fff",
          backdropFilter: "blur(8px)",
          pointerEvents: "auto",
        }}
        aria-label="Close map"
      >
        <X size={18} />
      </button>

      {/* ── Right-side badge filter buttons ── */}
      <div style={{
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        display: "flex", flexDirection: "column", gap: 8, zIndex: 20,
      }}>
        {BADGE_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(prev => prev === f.key ? null : f.key)}
            title={f.label}
            style={{
              width: 38, height: 38, borderRadius: "50%",
              background: activeFilter === f.key
                ? "linear-gradient(135deg,#facc15,#f59e0b)"
                : "rgba(10,0,24,0.82)",
              border: activeFilter === f.key
                ? "2px solid #facc15"
                : "1.5px solid rgba(255,255,255,0.18)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17,
              boxShadow: activeFilter === f.key ? "0 0 10px rgba(250,204,21,0.5)" : "none",
              transition: "all 0.15s",
              backdropFilter: "blur(8px)",
            }}
          >
            {f.icon}
          </button>
        ))}
      </div>

      {/* ── Bottom carousel + actions ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
        background: "linear-gradient(to top, rgba(6,0,15,0.97) 0%, rgba(6,0,15,0.85) 80%, transparent 100%)",
        padding: "12px 12px 20px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {/* Profile carousel */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {carouselProfiles.map((p, i) => {
            const isFeatured = p.id === featuredId;
            const img = p.avatar_url || p.image || "/placeholder.svg";
            const km = userPos && p.latitude
              ? haversineKm(userPos[0], userPos[1], p.latitude, p.longitude)
              : null;
            const distStr = km !== null ? (km < 1 ? `${Math.round(km * 1000)}m` : `${Math.round(km)}km`) : "";
            return (
              <button
                key={p.id ?? i}
                onClick={() => setFeaturedId(p.id)}
                style={{
                  flexShrink: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  background: "transparent", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                <div style={{
                  width: 58, height: 58, borderRadius: "50%",
                  border: isFeatured ? "2.5px solid #ec4899" : "1.5px solid rgba(255,255,255,0.2)",
                  overflow: "hidden",
                  boxShadow: isFeatured ? "0 0 0 3px rgba(236,72,153,0.3)" : "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}>
                  <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                </div>
                <p style={{
                  color: isFeatured ? "#ec4899" : "rgba(255,255,255,0.7)",
                  fontSize: 9, fontWeight: 700, margin: 0, maxWidth: 60,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{p.name}</p>
                {distStr && (
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 8, margin: 0 }}>{distStr}</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center" }}>
          <button
            onClick={() => featuredProfile && onSuperLike(featuredProfile)}
            style={{
              flex: 1, height: 42, borderRadius: 22,
              background: "linear-gradient(135deg,rgba(250,204,21,0.18),rgba(245,158,11,0.12))",
              border: "1.5px solid rgba(250,204,21,0.45)",
              color: "#facc15", fontWeight: 800, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: "pointer",
            }}
          >
            <Zap size={15} fill="currentColor" /> Super Like
          </button>
          <button
            onClick={() => featuredProfile && onLike(featuredProfile)}
            style={{
              flex: 1, height: 42, borderRadius: 22,
              background: "linear-gradient(135deg,rgba(236,72,153,0.9),rgba(168,85,247,0.85))",
              border: "none",
              color: "#fff", fontWeight: 800, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: "pointer",
              boxShadow: "0 4px 18px rgba(236,72,153,0.4)",
            }}
          >
            <Heart size={15} fill="currentColor" /> Like
          </button>
          <button
            onClick={onClose}
            style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
