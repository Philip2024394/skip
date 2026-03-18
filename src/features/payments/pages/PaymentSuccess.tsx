import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setProfileLock, setMyProfileLock } from "@/features/dating/utils/profileLock";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Loader2, EyeOff, Star, Shield, Heart, ChevronDown, ChevronUp, Video } from "lucide-react";
import { AppLogo } from "@/shared/components";

// ── Confetti particle ─────────────────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

const COLORS = ["#ff6b9d", "#c44dff", "#ffd700", "#ff4d4d", "#4dffb8", "#4d9fff", "#ff9f4d"];

const Confetti = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const list: Particle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));
    setParticles(list);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: "-10px",
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            rotate: p.rotation,
          }}
          initial={{ y: -20, opacity: 1, rotate: p.rotation }}
          animate={{
            y: "110vh",
            opacity: [1, 1, 0.8, 0],
            rotate: p.rotation + 360 * (Math.random() > 0.5 ? 1 : -1),
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
};

// ── Safety tip accordion ──────────────────────────────────────────────────────
const SafetyAdvisory = ({ name }: { name: string }) => {
  const [open, setOpen] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
      className="w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span className="text-white/80 text-xs font-semibold">Safety & Connection Tips</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 text-white/60 text-xs leading-relaxed">
              <p>
                Congratulations on your new connection with <span className="text-primary font-semibold">{name}</span>! WhatsApp opens up a world of authentic conversation — but as with all new connections, a little caution goes a long way.
              </p>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-amber-400 flex-shrink-0">⏳</span>
                  <p><span className="text-white/80 font-medium">Take your time.</span> For the first few days — until you've had a live WhatsApp call and spoken with {name} — we recommend keeping your personal details private. No home address, workplace, or daily routines just yet.</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-teal-400 flex-shrink-0">📍</span>
                  <p><span className="text-white/80 font-medium">Meet smart.</span> When the time feels right to meet in person, always choose a well-established public place — a café, restaurant, or shopping mall you know well.</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">🛡️</span>
                  <p><span className="text-white/80 font-medium">Trust WhatsApp's tools.</span> WhatsApp has some of the most advanced blocking and reporting software available. If at any point you feel uncomfortable, don't hesitate to use it — no explanation needed.</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary flex-shrink-0">💬</span>
                  <p><span className="text-white/80 font-medium">Evaluate before you trust.</span> Every profile deserves a period of genuine conversation before personal or private information is shared. Real connections build naturally over time.</p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 text-center space-y-1">
                <p className="text-white/50 text-[10px]">
                  From all of us at <span className="text-primary font-semibold">2DateMe</span> — we're genuinely excited for this connection. Bringing people together is what we do best, and your trust means everything to us.
                </p>
                <p className="text-white/40 text-[10px]">
                  We wish you many wonderful conversations and hope this is the beginning of something truly special. Thank you for being a valued member of <span className="text-primary">2DateMe.com</span> 💕
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ whatsapp: string; name: string; connectionType?: string } | null>(null);
  const [featureActivated, setFeatureActivated] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const sessionId = searchParams.get("session_id");
      const feature = searchParams.get("feature");

      if (!sessionId) {
        toast.error("Invalid payment session");
        navigate("/");
        return;
      }

      try {
        if (feature === "incognito") {
          // Server-side activation via dedicated edge function
          const { data, error } = await supabase.functions.invoke("activate-incognito", { body: { sessionId } });
          if (error) throw error;
          if (!data.success) throw new Error(data.error);
          setFeatureActivated("incognito");
        } else if (feature === "spotlight") {
          const { data, error } = await supabase.functions.invoke("activate-spotlight", { body: { sessionId } });
          if (error) throw error;
          if (!data.success) throw new Error(data.error);
          setFeatureActivated("spotlight");
        } else if (feature) {
          // All other features (boost, vip, plusone, verified, superlike):
          // Call verify-payment which validates the Stripe session server-side
          // and activates via the webhook handler — no client-side DB writes
          const { data, error } = await supabase.functions.invoke("verify-payment", {
            body: { sessionId, featureId: feature },
          });
          if (error) throw error;
          if (!data?.success) throw new Error(data?.error || "Payment verification failed");
          setFeatureActivated(feature);
        } else {
          // Connection unlock (WhatsApp / Video / Both)
          const { data, error } = await supabase.functions.invoke("verify-payment", { body: { sessionId } });
          if (error) throw error;
          if (!data.success) throw new Error(data.error);
          setResult({
            whatsapp: data.whatsapp,
            name: data.name,
            connectionType: data.connectionType,
          });
          // Lock both profiles for 3 days (activates after 1 hour)
          const targetProfileId = searchParams.get("target");
          if (targetProfileId) setProfileLock(targetProfileId);
          setMyProfileLock();
        }
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4500);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Payment verification failed");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [searchParams, navigate]);

  const openWhatsApp = () => {
    if (!result?.whatsapp) return;
    const cleaned = result.whatsapp.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hi ${result.name}! 👋 I just unlocked your contact on 2DateMe — the dating app where real connections start with a real conversation. I'd love to get to know you! 😊`
    );
    window.open(`https://wa.me/${cleaned}?text=${message}`, "_blank");
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen-safe bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <AppLogo className="w-16 h-16 object-contain mx-auto animate-pulse" />
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          <p className="text-white/50 text-sm">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  // ── Feature activated (non-unlock) ──────────────────────────────
  const featureContent: Record<string, { icon: React.ReactNode; headline: string; sub: string }> = {
    incognito: {
      icon: <EyeOff className="w-8 h-8 text-white/80" />,
      headline: "You're Invisible! 👻",
      sub: "Incognito Mode is active for 24 hours. Browse freely — nobody can see you.",
    },
    spotlight: {
      icon: <Star className="w-8 h-8 text-amber-400" fill="currentColor" />,
      headline: "You're in the Spotlight! 🌟",
      sub: "Your profile is now featured at the top of everyone's stack for 24 hours.",
    },
    vip: {
      icon: <span className="text-4xl">👑</span>,
      headline: "VIP Membership Activated!",
      sub: "You now have 7 WhatsApp unlocks and 5 Super Likes ready to use this month.",
    },
    boost: {
      icon: <span className="text-4xl">🚀</span>,
      headline: "Profile Boost Active!",
      sub: "You're now at the top of the swipe stack for the next hour.",
    },
    superlike: {
      icon: <Star className="w-8 h-8 text-amber-400" fill="currentColor" />,
      headline: "Super Like Ready!",
      sub: "Your Super Like has been added. Use it to stand out from the crowd.",
    },
    verified: {
      icon: <span className="text-4xl">✅</span>,
      headline: "Verification Submitted!",
      sub: "Your verified badge will appear once our team reviews your submission.",
    },
    plusone: {
      icon: <span className="text-4xl">🎫</span>,
      headline: "Plus-One Premium Activated!",
      sub: "Your Plus-One badge is now on your profile. Others can see you're open to events and outings — connect via WhatsApp to coordinate plans.",
    },
    video_extend: {
      icon: <Video className="w-8 h-8 text-purple-400" />,
      headline: "Call Extended! 📹",
      sub: "15 more minutes have been added to your video call. Enjoy your conversation!",
    },
  };

  const fc = featureActivated ? (featureContent[featureActivated] ?? {
    icon: <span className="text-4xl">⚡</span>,
    headline: "Power-Up Activated!",
    sub: `Your ${featureActivated} feature is now active.`,
  }) : null;

  return (
    <div className="h-screen-safe bg-black flex flex-col items-center justify-start p-4 overflow-y-auto scroll-touch" style={{ paddingTop: `max(2.5rem, env(safe-area-inset-top, 0px))`, paddingBottom: `max(1rem, env(safe-area-inset-bottom, 0px))` }}>
      {/* Confetti */}
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      <div className="relative z-20 w-full max-w-sm flex flex-col items-center gap-5">

        {/* Logo + brand */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="relative">
            <AppLogo className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(220,80,150,0.6)]" />
            {/* Pulsing ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/40"
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">2DateMe</span>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 22 }}
          className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
        >
          {/* Top gradient bar */}
          <div className="h-1 w-full gradient-love" />

          <div className="p-6 text-center space-y-4">

            {/* Connection unlock */}
            {result ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                  className="w-20 h-20 rounded-full gradient-love flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(180,80,150,0.5)]"
                >
                  <Heart className="w-10 h-10 text-white" fill="white" />
                </motion.div>

                <div>
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="font-display font-black text-2xl text-white"
                  >
                    Congratulations! 🎉
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.75 }}
                    className="text-white/60 text-sm mt-1"
                  >
                    You've unlocked a direct connection with
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.85 }}
                    className="text-primary font-display font-bold text-xl mt-0.5"
                  >
                    {result.name}
                  </motion.p>
                </div>

                {/* WhatsApp number */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5"
                >
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">WhatsApp</p>
                  <p className="text-white font-mono font-semibold text-base">{result.whatsapp}</p>
                </motion.div>

                {/* Connection CTA buttons */}
                {(result.connectionType === "video" || result.connectionType === "both") && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.02 }}
                    onClick={() => navigate("/?startVideoCall=true")}
                    className="w-full h-13 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    <Video className="w-5 h-5" />
                    Video Call {result.name}
                  </motion.button>
                )}

                {result.connectionType !== "video" && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.05 }}
                    onClick={openWhatsApp}
                    className="w-full h-13 py-3.5 rounded-2xl gradient-love text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(180,80,150,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    <MessageCircle className="w-5 h-5" fill="white" />
                    Message {result.name} on WhatsApp
                  </motion.button>
                )}

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="text-white/30 text-[10px]"
                >
                  {result.connectionType === "video"
                    ? "15 minutes of video calling included — start from the home screen"
                    : result.connectionType === "both"
                      ? "Video call + WhatsApp both available for this connection"
                      : "A warm intro message has been pre-filled for you ✨"}
                </motion.p>
              </>
            ) : fc ? (
              /* Feature activated */
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                  className="flex justify-center"
                >
                  {fc.icon}
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="font-display font-black text-xl text-white"
                >
                  {fc.headline}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.75 }}
                  className="text-white/60 text-sm"
                >
                  {fc.sub}
                </motion.p>
              </>
            ) : null}

          </div>
        </motion.div>

        {/* Safety advisory — shown for WhatsApp unlocks */}
        {result && <SafetyAdvisory name={result.name} />}

        {/* Back to browsing */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          onClick={() => navigate("/")}
          className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors"
        >
          Back to Browsing
        </motion.button>

        {/* Footer brand */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-white/20 text-[10px] text-center pb-6"
        >
          2DateMe.com · Real connections, real conversations
        </motion.p>

      </div>
    </div>
  );
};

export default PaymentSuccess;
