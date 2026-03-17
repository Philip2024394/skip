import { useState } from "react";
import { X, Calendar, Sparkles } from "lucide-react";

export default function LaunchBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 via-pink-600 to-violet-600 text-white">
      <div className="relative">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <Sparkles className="w-2 h-2 text-white/60" />
            </div>
          ))}
        </div>
        
        {/* Banner content */}
        <div className="relative flex items-center justify-center px-4 py-3">
          <div className="flex items-center gap-3 text-center">
            <Calendar className="w-5 h-5 animate-pulse" />
            <span className="font-semibold text-sm md:text-base">
              🚀 Launching soon on March 25th! You will be notified in advance of the most advanced dating app ever.
            </span>
            <Calendar className="w-5 h-5 animate-pulse" />
          </div>
          
          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Close banner"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        
        {/* Gradient overlay effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </div>
    </div>
  );
}
