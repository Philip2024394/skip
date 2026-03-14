import { motion } from "framer-motion";
import { Phone, PhoneOff } from "lucide-react";
import { useEffect, useState } from "react";

interface IncomingCallScreenProps {
  callerName: string;
  callerPhoto?: string;
  onAccept: () => void;
  onDecline: () => void;
}

const RING_DURATION = 30000; // 30 seconds

export default function IncomingCallScreen({
  callerName,
  callerPhoto,
  onAccept,
  onDecline,
}: IncomingCallScreenProps) {
  const [timeLeft, setTimeLeft] = useState(RING_DURATION / 1000);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDecline]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex flex-col items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mb-8"
        >
          {callerPhoto ? (
            <img
              src={callerPhoto}
              alt={callerName}
              className="w-32 h-32 rounded-full mx-auto border-4 border-white/30 shadow-2xl object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-full mx-auto border-4 border-white/30 shadow-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <span className="text-5xl font-bold text-white">
                {callerName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </motion.div>

        <h2 className="text-3xl font-bold text-white mb-2">{callerName}</h2>
        <p className="text-white/70 text-lg mb-2">Incoming Video Call</p>
        <p className="text-white/50 text-sm mb-12">Auto-declines in {timeLeft}s</p>

        <div className="flex gap-6 justify-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onDecline}
            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="w-8 h-8 text-white" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onAccept}
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(34, 197, 94, 0.7)",
                "0 0 0 20px rgba(34, 197, 94, 0)",
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
            className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-2xl hover:bg-green-600 transition-colors"
          >
            <Phone className="w-8 h-8 text-white" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
