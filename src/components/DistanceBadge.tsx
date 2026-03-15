import { MapPin, Eye } from "lucide-react";

interface DistanceBadgeProps {
  profile: any;
  onClick?: () => void;
}

export default function DistanceBadge({ profile, onClick }: DistanceBadgeProps) {
  // Calculate distance if profile has coordinates
  const getDistance = () => {
    if (!profile?.latitude || !profile?.longitude) return null;
    
    // For now, show a placeholder distance
    // In a real implementation, you'd calculate from user's location
    const distanceKm = Math.floor(Math.random() * 20) + 1; // 1-20 km
    return distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm}km`;
  };

  const distance = getDistance();
  
  if (!distance) return null;

  return (
    <button
      onClick={onClick}
      className="absolute top-2 left-2 bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] flex items-center gap-1 hover:bg-black/90 transition-colors"
      style={{
        zIndex: 10,
      }}
    >
      <Eye className="w-3 h-3 text-pink-400" />
      <span>View</span>
      <span className="text-pink-400 font-bold">Km{distance.replace('km', '')}</span>
    </button>
  );
}
