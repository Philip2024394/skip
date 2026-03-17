// /c/Users/Victus/skip-1/src/features/gifts/components/GiftFloatingAnimation.tsx
import { motion } from "framer-motion";

interface GiftFloatingAnimationProps {
  giftImageUrl: string;
  giftEmoji?: string;
}

export default function GiftFloatingAnimation({ giftImageUrl, giftEmoji }: GiftFloatingAnimationProps) {
  const items = [
    { size: 80, left: "8%", delay: 0, duration: 3.5, opacity: 0.35 },
    { size: 50, left: "22%", delay: 0.6, duration: 4, opacity: 0.25 },
    { size: 100, left: "40%", delay: 0.2, duration: 3.2, opacity: 0.4 },
    { size: 60, left: "58%", delay: 1.1, duration: 4.5, opacity: 0.2 },
    { size: 90, left: "75%", delay: 0.4, duration: 3.8, opacity: 0.3 },
    { size: 45, left: "88%", delay: 0.9, duration: 4.2, opacity: 0.22 },
    { size: 70, left: "15%", delay: 1.6, duration: 3.6, opacity: 0.28 },
    { size: 55, left: "65%", delay: 1.3, duration: 4.8, opacity: 0.18 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="absolute top-[-120px]"
          style={{ left: item.left, width: item.size, height: item.size, opacity: item.opacity }}
          animate={{ y: ["0vh", "110vh"] }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {giftImageUrl ? (
            <img src={giftImageUrl} alt="" className="w-full h-full object-contain" />
          ) : (
            <span style={{ fontSize: item.size * 0.7 }}>{giftEmoji || "🎁"}</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
