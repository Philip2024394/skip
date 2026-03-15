import { useState } from "react";
import { MapPin, Eye } from "lucide-react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import DistanceMapOverlay from "@/components/profile-view/DistanceMapOverlay";

interface DistanceBadgeProps {
  profile: any;
  allProfiles?: any[];
  onClick?: () => void;
}

export default function DistanceBadge({ profile, allProfiles = [], onClick }: DistanceBadgeProps) {
  // Calculate distance - always show something for demo purposes
  const getDistance = () => {
    // For now, show a placeholder distance for all profiles
    // In a real implementation, you'd calculate from user's location if coordinates exist
    // For demo, generate a consistent distance based on profile ID
    const seed = profile?.id ? profile.id.charCodeAt(0) : Math.random() * 100;
    const distanceKm = (seed % 20) + 1; // 1-20 km based on profile
    return distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm}km`;
  };

  const distance = getDistance();
  const [showMap, setShowMap] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior: show map overlay
      setShowMap(true);
    }
  };

  const handleCloseMap = () => {
    setShowMap(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="absolute top-2 left-2 bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] flex items-center gap-1 hover:bg-black/90 transition-colors"
        style={{
          zIndex: 10,
        }}
      >
        <Eye className="w-3 h-3 text-pink-400" />
        <span>View</span>
        <span className="text-pink-400 font-bold">Km{distance.replace('km', '')}</span>
      </button>

      {/* Map overlay */}
      {showMap && createPortal(
        <AnimatePresence>
          <DistanceMapOverlay
            profile={profile}
            allProfiles={allProfiles}
            onClose={handleCloseMap}
            onLike={() => {}}
            onSuperLike={() => {}}
          />
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
