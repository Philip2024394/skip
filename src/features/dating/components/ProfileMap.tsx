import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapUser {
  id: string;
  name: string;
  age: number;
  avatar_url?: string;
  image?: string;
  latitude: number;
  longitude: number;
}

interface ProfileMapProps {
  mainUser: MapUser;
  nearbyUsers: MapUser[];
  onSelectUser: (userId: string) => void;
  onClose: () => void;
}

const JITTER_RANGE = 0.015; // ~1.5km jitter for privacy

const jitter = (val: number) => val + (Math.random() - 0.5) * JITTER_RANGE * 2;

const createCircleIcon = (imageUrl: string, isMain: boolean) => {
  const size = isMain ? 48 : 36;
  return L.divIcon({
    className: "custom-map-marker",
    html: `
      <div style="
        width: ${size}px; height: ${size}px; border-radius: 50%;
        border: 3px solid ${isMain ? "#e53e3e" : "#a0aec0"};
        overflow: hidden; background: #1a1a1a;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        cursor: pointer;
      ">
        <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;" />
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const ProfileMap = ({ mainUser, nearbyUsers, onSelectUser, onClose }: ProfileMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const lat = jitter(mainUser.latitude);
    const lng = jitter(mainUser.longitude);

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 12,
      maxZoom: 14, // prevent zooming too close for privacy
      minZoom: 8,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 14,
    }).addTo(map);

    // Add main user marker with red circle
    const mainImg = mainUser.avatar_url || mainUser.image || "/placeholder.svg";
    const mainMarker = L.marker([lat, lng], {
      icon: createCircleIcon(mainImg, true),
    }).addTo(map);
    
    // Red radius circle around main user (~2km)
    L.circle([lat, lng], {
      radius: 2000,
      color: "#e53e3e",
      fillColor: "#e53e3e",
      fillOpacity: 0.08,
      weight: 1.5,
    }).addTo(map);

    mainMarker.bindPopup(`<b>${mainUser.name}, ${mainUser.age}</b>`);

    // Add nearby users
    nearbyUsers.forEach((user) => {
      if (!user.latitude || !user.longitude) return;
      const uLat = jitter(user.latitude);
      const uLng = jitter(user.longitude);
      const img = user.avatar_url || user.image || "/placeholder.svg";

      const marker = L.marker([uLat, uLng], {
        icon: createCircleIcon(img, false),
      }).addTo(map);

      marker.on("click", () => onSelectUser(user.id));
      marker.bindPopup(`<b>${user.name}, ${user.age}</b>`);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mainUser, nearbyUsers, onSelectUser]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[60] bg-background flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 glass border-b border-border/50">
        <h3 className="font-display font-bold text-sm text-foreground">
          📍 {mainUser.name}'s Area
        </h3>
        <button
          onClick={onClose}
          className="glass px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <X className="w-4 h-4" /> Close
        </button>
      </div>
      <div ref={mapRef} className="flex-1" />
      <style>{`
        .custom-map-marker { background: none !important; border: none !important; }
        .leaflet-popup-content-wrapper { background: hsl(15, 20%, 10%); color: hsl(30, 20%, 92%); border: 1px solid hsl(15, 15%, 18%); border-radius: 12px; }
        .leaflet-popup-tip { background: hsl(15, 20%, 10%); }
      `}</style>
    </motion.div>
  );
};

export default ProfileMap;
