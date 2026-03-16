import { Button } from "@/components/ui/button";
import { X, XCircle, Heart } from "lucide-react";

interface GiftRefusedNotificationProps {
  onClose: () => void;
  onTryAgain: () => void;
}

export default function GiftRefusedNotification({
  onClose,
  onTryAgain,
}: GiftRefusedNotificationProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-red-900/90 via-black/90 to-orange-900/90 rounded-3xl border-2 border-red-400/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-white text-xl font-bold">Gift Refused</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 mb-6">
          <p className="text-white text-center">
            Unfortunately, this profile has refused your gift for now. Let's try again!
          </p>
        </div>

        {/* Encouragement */}
        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-5 h-5 text-pink-400" />
            <p className="text-white font-medium">Don't give up!</p>
          </div>
          <p className="text-white/70 text-sm">
            There are plenty of other profiles waiting to connect. Keep sending gifts to find your perfect match!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Close
          </Button>
          <Button
            onClick={onTryAgain}
            className="flex-1 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white font-medium"
          >
            <Heart className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
