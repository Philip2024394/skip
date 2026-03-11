import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CrowAnimation from "./CrowAnimation";
import {
  GRAVEYARD_BG,
  TAROT_READER_SEQUENCE,
  TAROT_READER_IMAGE_URL,
  TAROT_CARD_BACK,
  TAROT_CARD_FRONT_IMAGES,
  TAROT_HEADERS,
} from "./useTarotState";

// All the premium reading data arrays that were at top of LikesLibrary
// (PREMIUM_READINGS, MADAM_ZOFEE_REWARDS etc) — move them here too
const PREMIUM_READINGS = [
  {
    id: "love_3card",
    title: "3 Card Love Reading",
    subtitle: "Past • Present • Future",
    emoji: "💕",
    price: "$1.99",
    description: "Discover where your love has been, where it stands today, and where it is destined to go",
    cardCount: 3,
    cardLabels: ["Your Past in Love", "Your Present Energy", "Your Love Future"],
  },
  {
    id: "soulmate",
    title: "Soulmate Reading",
    subtitle: "Who • When • Where",
    emoji: "💫",
    price: "$2.99",
    description: "The universe knows exactly who is coming for you — let the cards reveal the truth",
    cardCount: 3,
    cardLabels: ["Who They Are", "When They Arrive", "Where You Will Meet"],
  },
  {
    id: "family_future",
    title: "Future Family Reading",
    subtitle: "Love • Home • Legacy",
    emoji: "🏡",
    price: "$2.99",
    description: "See the beautiful family life that awaits you — home, children, and lasting love",
    cardCount: 3,
    cardLabels: ["Your Love Foundation", "Your Future Home", "Your Legacy Together"],
  },
  {
    id: "yearly_forecast",
    title: "2026 Love Forecast",
    subtitle: "Your full year ahead",
    emoji: "🌟",
    price: "$3.99",
    description: "A complete love forecast for the year — every season holds a message for your heart",
    cardCount: 3,
    cardLabels: ["First Half of 2026", "Second Half of 2026", "Your Greatest Opportunity"],
  },
];

interface TarotDrawerProps {
  show: boolean;
  onClose: () => void;
  dailyTarot: any;
  onRevealDailyTarot: () => void;
  // all other props the drawer needs
  showTarotDrawer: boolean;
  setShowTarotDrawer: (v: boolean) => void;
  showPremiumReading: boolean;
  setShowPremiumReading: (v: boolean) => void;
  premiumReadingType: string | null;
  setPremiumReadingType: (v: string | null) => void;
  premiumReadingResult: any;
  setPremiumReadingResult: (v: any) => void;
  premiumReadingLoading: boolean;
  setPremiumReadingLoading: (v: boolean) => void;
  selectedCards: number[];
  setSelectedCards: (v: number[]) => void;
  revealedCards: number[];
  setRevealedCards: (v: number[]) => void;
  madamZofeeReward: any;
  setMadamZofeeReward: (v: any) => void;
  showMadamZofee: boolean;
  setShowMadamZofee: (v: boolean) => void;
  showMadamZofeeParticles: boolean;
  setShowMadamZofeeParticles: (v: boolean) => void;
  tarotReaderSrc: string;
  setTarotReaderSrc: (v: string) => void;
  showDailyTarotFront: boolean;
  setShowDailyTarotFront: (v: boolean) => void;
  tarotProgressStep: number;
  setTarotProgressStep: (v: number) => void;
  tarotHeader: string;
  setTarotHeader: (v: string) => void;
  tarotSequenceTimeoutsRef: React.MutableRefObject<number[]>;
}

export default function TarotDrawer(props: TarotDrawerProps) {
  // paste the complete tarot drawer JSX here
  // all the useEffects for the tarot sequence go here too

  const [activeCrows, setActiveCrows] = useState<number[]>([]);
  const [crowContainerWidth, setCrowContainerWidth] = useState(390);
  const crowContainerRef = useRef<HTMLDivElement | null>(null);
  const crowSchedulerRef = useRef<number | null>(null);
  const crowIdRef = useRef(0);

  const generateMadamZofeeReward = () => {
    const roll = Math.random();
    if (roll < 0.40) return {
      type: "superlike",
      amount: 1,
      claimed: false,
      message: "The stars have looked upon thy journey with great favour this day, dear seeker. As thy cards speak of patience and an open heart — so too shall the cosmos reward thy faith. Madam Zofee grants thee ONE Super Like from the ancient vault of love. Use it not in haste, but with intention deep as the ocean floor. For the soul who receives this blessing... may already feel thy presence drawing near. Go forth, brave heart. The universe conspires in thy favour.",
    };
    if (roll < 0.60) return {
      type: "superlike",
      amount: 3,
      claimed: false,
      message: "Rare indeed is the seeker who draws such fortune from the cosmic well. The ancient ones have whispered thy name three times this evening — and three times the stars answered. Madam Zofee bestows upon thee THREE Super Likes, drawn from the celestial reserve kept only for those whose hearts are pure of intention. Wield these blessings as an archer wields arrows — with patience, with stillness, with certainty. One who is worthy of thy heart already walks this earth. These gifts shall help thy paths align.",
    };
    if (roll < 0.75) return {
      type: "boost",
      amount: 1,
      claimed: false,
      message: "The veil between worlds grows thin this hour, dear seeker, and through it Madam Zofee sees thy light — a light that others have yet to fully witness. Today the ancient ones lift this light higher. Thy presence shall shine with greater radiance upon those who seek what only thou can offer. A Boost has been granted unto thee — thy profile shall rise like the morning star above the horizon. Go. Be seen. For the one who is meant for thee needs only to lay eyes upon thy face.",
    };
    if (roll < 0.90) return {
      type: "discount",
      amount: 50,
      claimed: false,
      message: "The cosmos rewards the faithful seeker not only with wisdom but with earthly gifts. Madam Zofee has consulted the ancient scrolls and finds thy name written among those deserving of favour. A sacred discount of fifty parts in a hundred has been inscribed in thy name. Present this blessing upon thy next reading or premium offering — for the path of love is long and the wise traveller accepts provisions wherever they are offered. Thou art not alone on this journey, dear soul.",
    };
    return {
      type: "wisdom",
      amount: 0,
      claimed: false,
      message: "Not all gifts arrive as gold or stars, dear seeker. Some arrive as knowing. Today Madam Zofee offers thee the rarest gift of all — clarity. The cards have spoken with unusual precision about thy love path. Carry their words not merely in thy mind but in the marrow of thy bones. Thy reward today is not a thing that can be held — it is a truth that shall guide every choice thy heart makes from this moment forward. The greatest treasure was always the wisdom. Go. Love fearlessly.",
    };
  };

  const generatePremiumReading = (readingType: string, cards: number[]) => {
    const readings: Record<string, any> = {
      love_3card: {
        title: "Your 3 Card Love Reading",
        intro: "The cards have been drawn with intention and care. Each one carries a message your heart already knows — the cards simply give it words.",
        cards: [
          {
            position: "Your Past in Love",
            message: "Your past in love has shaped you in ways both beautiful and painful. You have loved deeply — perhaps too deeply at times — and the wounds you carry are not signs of weakness but proof of how fully you are capable of feeling. The experiences behind you were not mistakes. They were lessons delivered by the universe in the only language the heart truly understands — experience. You are not the same person who walked into those past chapters. You are wiser, softer in the right places and stronger where it matters.",
            advice: "Release what no longer serves you. The love that hurt you was not your destination — it was your education.",
          },
          {
            position: "Your Present Energy",
            message: "Right now your energy around love is at a turning point. There is something awakening in you — a readiness that was not there before. You may not feel it fully yet, but the universe sees it clearly. You are becoming magnetic. The walls you built for protection are beginning to soften — not because you are becoming careless, but because you are becoming confident enough to let someone in without losing yourself in the process. This present moment is more powerful than you realise.",
            advice: "Stop waiting to feel completely ready. The right person will not require you to be perfect — they will love you in progress.",
          },
          {
            position: "Your Love Future",
            message: "What is coming for you in love is something genuinely beautiful — a connection built on mutual respect, real conversation and shared laughter. Not a perfect relationship — but an honest one. One where you are chosen every single day, not just in the beginning. The person coming into your life has been shaped by their own journey, just as you have been shaped by yours. When you meet — and you will meet — there will be a recognition. A feeling of coming home to somewhere you have never been before. Trust this. It is already in motion.",
            advice: "What is meant for you will not pass you. Stop chasing and start becoming the person your future love needs you to be.",
          },
        ],
        closing: "The cards have spoken — but remember, you are not a passenger in your own love story. Every choice you make, every wall you lower, every moment of genuine connection you allow — these are the actions that bring your future closer. Be patient. Be present. Be open. Your love story is still being written and the best chapters are ahead.",
        affirmations: [
          "I am worthy of a love that is easy and real",
          "I release the past and welcome what is coming",
          "The right person is finding their way to me right now",
          "I do not need to chase — I need to be ready to receive",
          "Good things come to those who remain open and patient",
        ],
      },
    };
    return readings[readingType] || readings.love_3card;
  };

  useEffect(() => {
    props.tarotSequenceTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    props.tarotSequenceTimeoutsRef.current = [];

    if (!props.showTarotDrawer) {
      props.setTarotReaderSrc(TAROT_READER_IMAGE_URL);
      props.setShowDailyTarotFront(false);
      props.setTarotProgressStep(0);
      return;
    }

    // Preload woman sequence frames so swaps don't flash blank while images load.
    TAROT_READER_SEQUENCE.forEach((step: any) => {
      const img = new Image();
      (img as any).decoding = "async";
      img.src = step.src;
    });

    props.setShowDailyTarotFront(false);
    props.setTarotReaderSrc((TAROT_READER_SEQUENCE as any)[0]?.src || TAROT_READER_IMAGE_URL);
    props.setTarotProgressStep(1); // Preparing

    // Progress step timers — timed to match sequence
    props.tarotSequenceTimeoutsRef.current.push(window.setTimeout(() => props.setTarotProgressStep(2), 4000)); // Shuffling Cards
    props.tarotSequenceTimeoutsRef.current.push(window.setTimeout(() => props.setTarotProgressStep(3), 9000)); // Card Spread

    let cumulative = 0;
    (TAROT_READER_SEQUENCE as any).forEach((step: any, idx: number) => {
      const timeoutId = window.setTimeout(() => {
        props.setTarotReaderSrc(step.src);
        if (idx === (TAROT_READER_SEQUENCE as any).length - 1) {
          const revealId = window.setTimeout(() => {
            props.setShowDailyTarotFront(true);
            props.setTarotProgressStep(4); // Chosen Card
            props.setTarotHeader(TAROT_HEADERS[Math.floor(Math.random() * TAROT_HEADERS.length)]);
          }, step.duration);
          props.tarotSequenceTimeoutsRef.current.push(revealId);
        }
      }, cumulative);
      props.tarotSequenceTimeoutsRef.current.push(timeoutId);
      cumulative += step.duration;
    });

    return () => {
      props.tarotSequenceTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      props.tarotSequenceTimeoutsRef.current = [];
    };
  }, [props.showTarotDrawer]);

  // ── Crow scheduler ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!props.showTarotDrawer) {
      if (crowSchedulerRef.current) clearTimeout(crowSchedulerRef.current);
      setActiveCrows([]);
      return;
    }

    if (crowContainerRef.current) {
      setCrowContainerWidth(crowContainerRef.current.offsetWidth);
    }

    const spawnCrow = () => {
      const spawnDouble = Math.random() < 0.15;

      setActiveCrows((prev) => {
        const newId = ++crowIdRef.current;
        return [...prev, newId];
      });

      if (spawnDouble) {
        setTimeout(() => {
          setActiveCrows((prev) => {
            const newId = ++crowIdRef.current;
            return [...prev, newId];
          });
        }, 1200 + Math.random() * 800);
      }

      const nextIn = 18000 + Math.random() * 22000;
      crowSchedulerRef.current = window.setTimeout(spawnCrow, nextIn);
    };

    const firstDelay = 10000 + Math.random() * 4000;
    crowSchedulerRef.current = window.setTimeout(spawnCrow, firstDelay);

    return () => {
      if (crowSchedulerRef.current) clearTimeout(crowSchedulerRef.current);
    };
  }, [props.showTarotDrawer]);

  return (
    <>
      {props.showTarotDrawer && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => props.onClose()}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              zIndex: 99990,
            }}
          />

          {/* Bottom Sheet */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 99999,
              borderRadius: "20px 20px 0 0",
              overflow: "hidden",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              background: "#080010",
              borderTop: "2px solid rgba(255,105,180,0.55)",
              boxShadow: "0 -4px 40px rgba(255,105,180,0.35)",
            }}
          >
            {/* Hero area — crow flies here */}
            <div
              ref={crowContainerRef}
              style={{
                position: "relative",
                width: "100%",
                overflow: "hidden",
                height: 200,
                flexShrink: 0,
              }}
            >
              {/* Graveyard background image */}
              <img
                src={GRAVEYARD_BG}
                alt=""
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center top",
                  zIndex: 0,
                  pointerEvents: "none",
                }}
              />

              {/* Shade overlay — fades in when card is revealed */}
              <AnimatePresence>
                {props.showDailyTarotFront && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.45)",
                      zIndex: 1,
                      pointerEvents: "none",
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Tarot woman — blends into background via mask */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 130,
                  height: 130,
                  zIndex: 5,
                  WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                  maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={props.tarotReaderSrc}
                    src={props.tarotReaderSrc}
                    alt="Tarot reader"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      objectPosition: "bottom",
                    }}
                    loading="lazy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                </AnimatePresence>
              </div>

              {/* Crow animations */}
              {props.showTarotDrawer &&
                activeCrows.map((crowId) => (
                  <CrowAnimation
                    key={crowId}
                    containerWidth={crowContainerWidth}
                    containerHeight={260}
                    onDone={() => setActiveCrows((prev) => prev.filter((id) => id !== crowId))}
                  />
                ))}
            </div>

            {/* Right side vertical buttons */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: 44,
                zIndex: 99999,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "60px 0 24px",
                background: "linear-gradient(to left, rgba(10,0,20,0.8), transparent)",
              }}
            >
              {/* WhatsApp Share */}
              <button
                onClick={() => {
                  const text = `🔮 My Daily Love Reading:\n\n"${props.dailyTarot?.reading}"\n\n✨ Get your free reading at 2dateme.com`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(37,211,102,0.2)",
                  border: "1px solid rgba(37,211,102,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 18,
                }}
                title="Share on WhatsApp"
              >
                💚
              </button>

              {/* Close */}
              <button
                onClick={() => props.onClose()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(180,80,180,0.2)",
                  border: "1px solid rgba(180,80,180,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "white",
                }}
              >
                ✕
              </button>

              {/* Premium Reading */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  props.setShowPremiumReading(true);
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,215,0,0.15)",
                  border: "1px solid rgba(255,215,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 18,
                }}
                title="Premium Reading"
              >
                🔮
              </button>
            </div>

            {/* Close button — small circle top right */}
            <button
              onClick={() => props.onClose()}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 99999,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(255,105,180,0.65)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
              }}
            >
              ✕
            </button>

            {/* Content */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "12px 20px 16px",
                overflowY: "hidden",
                flex: 1,
                minHeight: 0,
              }}
            >
              {/* Progress steps */}
              {!props.showDailyTarotFront ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, width: "100%", maxWidth: 220 }}>
                  {([
                    { step: 1, label: "Preparing Spread" },
                    { step: 2, label: "Channelling" },
                    { step: 3, label: "Connected" },
                    { step: 4, label: "Your Card Awaits ✨" },
                  ] as { step: number; label: string }[]).map(({ step, label }) => {
                    const done = props.tarotProgressStep > step;
                    const active = props.tarotProgressStep === step;
                    return (
                      <div key={step} style={{ display: "flex", alignItems: "center", gap: 8, opacity: props.tarotProgressStep >= step ? 1 : 0.3, transition: "opacity 0.4s" }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%",
                          background: done ? "#FFD700" : active ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.1)",
                          border: active ? "2px solid #FFD700" : done ? "2px solid #FFD700" : "2px solid rgba(255,255,255,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: active ? "0 0 10px rgba(255,215,0,0.6)" : "none",
                          transition: "all 0.4s",
                        }}>
                          {done && <span style={{ fontSize: 9, color: "#000", fontWeight: "bold" }}>✓</span>}
                          {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFD700", display: "block" }} />}
                        </div>
                        <span style={{
                          fontSize: 11,
                          color: active ? "#FFD700" : done ? "rgba(255,215,0,0.7)" : "rgba(255,255,255,0.4)",
                          fontWeight: active ? "bold" : "normal",
                          letterSpacing: "0.04em",
                          textShadow: active ? "0 0 8px rgba(255,215,0,0.5)" : "none",
                          transition: "all 0.4s",
                        }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: "#FFD700", fontSize: 13, fontWeight: "bold", letterSpacing: "0.1em", marginBottom: 12, textShadow: "0 0 12px rgba(255,215,0,0.5)" }}>
                  🔮 {props.tarotHeader}
                </p>
              )}

              {/* Tarot card — face down until reveal */}
              {props.dailyTarot && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: 6 }}>
                  <AnimatePresence mode="wait">
                    {!props.showDailyTarotFront ? (
                      <motion.div
                        key="card-back"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, scale: [1, 1.03, 1] }}
                        exit={{ opacity: 0, rotateY: 90 }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                        style={{ position: "relative" }}
                      >
                        {/* Gold glow behind card */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            filter: "blur(20px)",
                            opacity: 0.6,
                            background:
                              "radial-gradient(circle at 50% 70%, rgba(250,204,21,0.65), transparent 70%)",
                            zIndex: -1,
                          }}
                        />
                        <img
                          src={TAROT_CARD_BACK}
                          alt="Card back"
                          style={{ width: 125, height: 165, objectFit: "contain" }}
                          decoding="async"
                          loading="lazy"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="card-front"
                        initial={{ opacity: 0, rotateY: -90 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        {TAROT_CARD_FRONT_IMAGES[1] ? (
                          <img
                            src={TAROT_CARD_FRONT_IMAGES[1]}
                            alt="The Fool"
                            style={{ width: 125, height: 165, objectFit: "contain" }}
                            decoding="async"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            style={{
                              width: 140,
                              height: 185,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 64,
                            }}
                          >
                            {props.dailyTarot.cardEmoji}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Grave digger + card text — image with text centered over it */}
                  <AnimatePresence>
                    {props.showDailyTarotFront && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        style={{
                          position: "relative",
                          width: "100%",
                          maxWidth: 320,
                          marginTop: 16,
                        }}
                      >
                        {/* Image */}
                        <img
                          src="https://ik.imagekit.io/7grri5v7d/grave_digger-removebg-preview.png"
                          alt=""
                          aria-hidden="true"
                          style={{
                            width: "100%",
                            objectFit: "contain",
                            objectPosition: "bottom center",
                            pointerEvents: "none",
                            display: "block",
                          }}
                        />
                        {/* Text centered over the image */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 20px",
                            textAlign: "center",
                            transform: "translateY(5px)",
                          }}
                        >
                          <p
                            style={{
                              color: "#FFD700",
                              fontWeight: "bold",
                              fontSize: 13,
                              marginBottom: 6,
                              textShadow: "0 0 10px rgba(0,0,0,0.9), 0 0 8px rgba(255,215,0,0.4)",
                            }}
                          >
                            {props.dailyTarot.cardName}
                          </p>
                          <p
                            style={{
                              color: "rgba(255,255,255,0.92)",
                              fontSize: 11,
                              lineHeight: 1.6,
                              textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                            }}
                          >
                            {props.dailyTarot.reading}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Premium Reading Selection Screen */}
      {props.showPremiumReading && !props.premiumReadingResult && (
        <>
          <div
            onClick={(e) => {
              e.stopPropagation();
              props.setShowPremiumReading(false);
              props.setShowTarotDrawer(true);
            }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              zIndex: 999990,
            }}
          />
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999999,
              backgroundImage: "url('https://ik.imagekit.io/7grri5v7d/grave%20yard.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
            className="premium-reading-selection"
          >
            <style>{`.premium-reading-selection{scrollbar-width:none;-ms-overflow-style:none}.premium-reading-selection::-webkit-scrollbar{width:0;height:0}`}</style>
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                props.setShowPremiumReading(false);
                props.setShowTarotDrawer(true);
              }}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(180,80,180,0.3)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 999999,
              }}
            >
              ✕
            </button>

            <div style={{ padding: "48px 20px 32px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <p style={{ fontSize: 40, marginBottom: 8 }}>🔮</p>
              <h2
                style={{
                  color: "#FFD700",
                  fontSize: 22,
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: 8,
                  textShadow: "0 0 20px rgba(255,215,0,0.4)",
                }}
              >
                Premium Readings
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 13,
                  textAlign: "center",
                  marginBottom: 28,
                  maxWidth: 280,
                  lineHeight: 1.6,
                }}
              >
                Go deeper than your daily card — receive a full personalised reading crafted for your love journey
              </p>

              {/* Reading options */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                {PREMIUM_READINGS.map((reading) => (
                  <button
                    key={reading.id}
                    onClick={() => {
                      props.setPremiumReadingType(reading.id);
                      props.setPremiumReadingLoading(true);
                      // Pick 3 random card IDs
                      const allIds = Object.keys(TAROT_CARD_FRONT_IMAGES).map(Number);
                      const shuffled = allIds.sort(() => Math.random() - 0.5).slice(0, 3);
                      props.setSelectedCards(shuffled);
                      props.setRevealedCards([]);
                      // Simulate payment then generate reading
                      setTimeout(() => {
                        const result = generatePremiumReading(reading.id, shuffled);
                        props.setPremiumReadingResult(result);
                        props.setPremiumReadingLoading(false);
                        // Reveal cards one by one
                        setTimeout(() => props.setRevealedCards([0]), 1000);
                        setTimeout(() => props.setRevealedCards([0, 1]), 3000);
                        setTimeout(() => props.setRevealedCards([0, 1, 2]), 5000);
                        // After all cards revealed — Madam Zofee appears
                        setTimeout(() => {
                          const reward = generateMadamZofeeReward();
                          props.setMadamZofeeReward(reward);
                          setTimeout(() => props.setShowMadamZofee(true), 800);
                        }, 7000);
                      }, 2000);
                    }}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: 16,
                      background: "rgba(0,0,0,0.55)",
                      border: "1px solid rgba(255,105,180,0.45)",
                      boxShadow: "0 0 18px rgba(255,105,180,0.18)",
                      backdropFilter: "blur(10px)",
                      color: "white",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <span style={{ fontSize: 32 }}>{reading.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: "bold", fontSize: 14, marginBottom: 2 }}>{reading.title}</p>
                      <p style={{ color: "rgba(255,215,0,0.7)", fontSize: 11, marginBottom: 4 }}>{reading.subtitle}</p>
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, lineHeight: 1.4 }}>{reading.description}</p>
                    </div>
                    <div
                      style={{
                        flexShrink: 0,
                        background: "linear-gradient(135deg, #ff1493, #ff69b4)",
                        borderRadius: 10,
                        padding: "6px 10px",
                        fontSize: 13,
                        fontWeight: "bold",
                      }}
                    >
                      {reading.price}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loading Screen */}
      {props.showPremiumReading && props.premiumReadingLoading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999999,
            background: "linear-gradient(135deg, #0a0015 0%, #1a0533 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ fontSize: 48 }}
          >
            🔮
          </motion.div>
          <p style={{ color: "#FFD700", fontSize: 16, fontWeight: "bold" }}>Reading the cards...</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center", maxWidth: 240 }}>
            The universe is preparing your personal reading
          </p>
        </div>
      )}

      {/* Full Screen Premium Reading Result */}
      {props.showPremiumReading && props.premiumReadingResult && !props.premiumReadingLoading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999999,
            background: "transparent",
            overflowY: "auto",
            color: "white",
          }}
        >
          {/* Background graveyard subtle */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundImage: "url('https://ik.imagekit.io/7grri5v7d/grave%20yardssssss.png?updatedAt=1773171437105')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 1,
              zIndex: 0,
            }}
          />

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.setShowPremiumReading(false);
              props.setPremiumReadingResult(null);
              props.setPremiumReadingType(null);
              props.setSelectedCards([]);
              props.setRevealedCards([]);
              props.setShowTarotDrawer(true);
            }}
            style={{
              position: "fixed",
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(180,80,180,0.3)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999999,
            }}
          >
            ✕
          </button>

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1, padding: "48px 20px 60px" }}>
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: "center", marginBottom: 24 }}
            >
              <p style={{ fontSize: 36, marginBottom: 8 }}>🔮</p>
              <h2
                style={{
                  color: "#FFD700",
                  fontSize: 22,
                  fontWeight: "bold",
                  textShadow: "0 0 20px rgba(255,215,0,0.4)",
                  marginBottom: 8,
                }}
              >
                {props.premiumReadingResult.title}
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 13,
                  lineHeight: 1.7,
                  maxWidth: 320,
                  margin: "0 auto",
                }}
              >
                {props.premiumReadingResult.intro}
              </p>
            </motion.div>

            {/* 3 Cards laid out */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginBottom: 32,
              }}
            >
              {props.selectedCards.map((cardId, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.3, duration: 0.5 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
                >
                  <p
                    style={{
                      color: "rgba(255,215,0,0.7)",
                      fontSize: 9,
                      fontWeight: "bold",
                      textAlign: "center",
                      maxWidth: 90,
                      lineHeight: 1.3,
                    }}
                  >
                    {props.premiumReadingResult.cards[idx]?.position}
                  </p>

                  <div style={{ position: "relative", width: 90, height: 118 }}>
                    <AnimatePresence mode="wait">
                      {!props.revealedCards.includes(idx) ? (
                        <motion.img
                          key="back"
                          src={TAROT_CARD_BACK}
                          alt="Card back"
                          exit={{ opacity: 0, rotateY: 90 }}
                          transition={{ duration: 0.3 }}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            position: "absolute",
                            inset: 0,
                          }}
                        />
                      ) : (
                        <motion.img
                          key="front"
                          src={TAROT_CARD_FRONT_IMAGES[cardId] || TAROT_CARD_BACK}
                          alt="Card front"
                          initial={{ opacity: 0, rotateY: -90 }}
                          animate={{ opacity: 1, rotateY: 0 }}
                          transition={{ duration: 0.5 }}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            position: "absolute",
                            inset: 0,
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Card Readings — reveal one by one */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 28 }}>
              {props.premiumReadingResult.cards.map((card: any, idx: number) => (
                <AnimatePresence key={idx}>
                  {props.revealedCards.includes(idx) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      style={{
                        borderRadius: 18,
                        background: "rgba(0,0,0,0.72)",
                        border: "1px solid rgba(255,215,0,0.2)",
                        backdropFilter: "blur(10px)",
                        padding: "18px 16px",
                      }}
                    >
                      {/* Card position label */}
                      <p
                        style={{
                          color: "#FFD700",
                          fontSize: 11,
                          fontWeight: "bold",
                          letterSpacing: "0.08em",
                          marginBottom: 10,
                          textTransform: "uppercase",
                        }}
                      >
                        {card.position}
                      </p>

                      {/* Reading */}
                      <p
                        style={{
                          color: "rgba(255,255,255,0.88)",
                          fontSize: 14,
                          lineHeight: 1.8,
                          marginBottom: 14,
                        }}
                      >
                        {card.message}
                      </p>

                      {/* Divider */}
                      <div
                        style={{
                          height: 1,
                          background:
                            "linear-gradient(to right, transparent, rgba(255,215,0,0.3), transparent)",
                          marginBottom: 12,
                        }}
                      />

                      {/* Advice */}
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>✨</span>
                        <p
                          style={{
                            color: "rgba(255,215,0,0.85)",
                            fontSize: 13,
                            lineHeight: 1.6,
                            fontStyle: "italic",
                          }}
                        >
                          {card.advice}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>

            {/* Closing message — shows after all cards revealed */}
            <AnimatePresence>
              {props.revealedCards.length === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {/* Closing */}
                  <div
                    style={{
                      borderRadius: 18,
                      background: "rgba(0,0,0,0.72)",
                      border: "1px solid rgba(255,215,0,0.2)",
                      backdropFilter: "blur(10px)",
                      padding: "18px 16px",
                      marginBottom: 20,
                    }}
                  >
                    <p style={{ fontSize: 20, textAlign: "center", marginBottom: 10 }}>🌙</p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.85)",
                        fontSize: 14,
                        lineHeight: 1.8,
                        textAlign: "center",
                      }}
                    >
                      {props.premiumReadingResult.closing}
                    </p>
                  </div>

                  {/* Affirmations */}
                  <div
                    style={{
                      borderRadius: 18,
                      background: "rgba(0,0,0,0.72)",
                      border: "1px solid rgba(255,215,0,0.2)",
                      backdropFilter: "blur(10px)",
                      padding: "18px 16px",
                      marginBottom: 24,
                    }}
                  >
                    <p
                      style={{
                        color: "#FFD700",
                        fontSize: 12,
                        fontWeight: "bold",
                        textAlign: "center",
                        marginBottom: 14,
                        letterSpacing: "0.08em",
                      }}
                    >
                      ✨ YOUR AFFIRMATIONS ✨
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {props.premiumReadingResult.affirmations.map((affirmation: string, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.15 }}
                          style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
                        >
                          <span style={{ color: "#FFD700", fontSize: 12, flexShrink: 0, marginTop: 1 }}>◆</span>
                          <p
                            style={{
                              color: "rgba(255,255,255,0.8)",
                              fontSize: 13,
                              lineHeight: 1.5,
                              fontStyle: "italic",
                            }}
                          >
                            {affirmation}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Madam Zofee Surprise Reward */}
                  <AnimatePresence>
                    {props.showMadamZofee && props.madamZofeeReward && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{
                          borderRadius: 20,
                          background: "linear-gradient(135deg, rgba(20,0,40,0.95), rgba(40,10,60,0.95))",
                          border: "1px solid rgba(255,215,0,0.4)",
                          padding: "24px 18px",
                          marginBottom: 20,
                          position: "relative",
                          overflow: "hidden",
                          boxShadow: "0 0 40px rgba(255,215,0,0.15), inset 0 0 40px rgba(180,80,180,0.1)",
                        }}
                      >
                        {[...Array(20)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{
                              duration: 1.5 + Math.random() * 2,
                              repeat: Infinity,
                              delay: Math.random() * 2,
                            }}
                            style={{
                              position: "absolute",
                              width: Math.random() * 3 + 1,
                              height: Math.random() * 3 + 1,
                              borderRadius: "50%",
                              background: "#FFD700",
                              top: `${Math.random() * 100}%`,
                              left: `${Math.random() * 100}%`,
                              pointerEvents: "none",
                              zIndex: 0,
                            }}
                          />
                        ))}

                        {/* Gold shimmer top */}
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 2,
                            background: "linear-gradient(to right, transparent, #FFD700, transparent)",
                            zIndex: 2,
                          }}
                        />

                        <div style={{ position: "relative", zIndex: 1 }}>
                          {/* Candle flicker */}
                          <motion.p
                            animate={{ opacity: [1, 0.6, 1, 0.8, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ textAlign: "center", fontSize: 28, marginBottom: 4 }}
                          >
                            🕯️
                          </motion.p>

                          <div
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: "50%",
                              overflow: "hidden",
                              border: "2px solid rgba(255,215,0,0.6)",
                              boxShadow: "0 0 20px rgba(255,215,0,0.3)",
                              margin: "0 auto 12px",
                              background: "#1a0533",
                            }}
                          >
                            <img
                              src={TAROT_READER_IMAGE_URL}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "top",
                              }}
                            />
                          </div>

                          {/* Madam Zofee title */}
                          <p
                            style={{
                              textAlign: "center",
                              color: "rgba(255,215,0,0.6)",
                              fontSize: 10,
                              letterSpacing: "0.2em",
                              marginBottom: 4,
                              textTransform: "uppercase",
                            }}
                          >
                            The Ancient One Speaks
                          </p>
                          <p
                            style={{
                              textAlign: "center",
                              color: "#FFD700",
                              fontSize: 18,
                              fontWeight: "bold",
                              marginBottom: 16,
                              textShadow: "0 0 16px rgba(255,215,0,0.5)",
                            }}
                          >
                            Madam Zofee
                          </p>

                          {/* Divider */}
                          <div
                            style={{
                              height: 1,
                              background: "linear-gradient(to right, transparent, rgba(255,215,0,0.3), transparent)",
                              marginBottom: 16,
                            }}
                          />

                          {/* Message */}
                          <p
                            style={{
                              color: "rgba(255,255,255,0.82)",
                              fontSize: 13,
                              lineHeight: 1.9,
                              textAlign: "center",
                              fontStyle: "italic",
                              marginBottom: 20,
                            }}
                          >
                            "{props.madamZofeeReward.message}"
                          </p>

                          {/* Reward badge */}
                          {props.madamZofeeReward.type !== "wisdom" && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                              style={{
                                textAlign: "center",
                                marginBottom: 16,
                              }}
                            >
                              <div
                                style={{
                                  display: "inline-block",
                                  background:
                                    "linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.05))",
                                  border: "1px solid rgba(255,215,0,0.5)",
                                  borderRadius: 50,
                                  padding: "8px 20px",
                                  marginBottom: 12,
                                }}
                              >
                                <p style={{ color: "#FFD700", fontSize: 15, fontWeight: "bold" }}>
                                  {props.madamZofeeReward.type === "superlike" &&
                                    `⭐ ${props.madamZofeeReward.amount} Super Like${props.madamZofeeReward.amount > 1 ? "s" : ""} Granted`}
                                  {props.madamZofeeReward.type === "boost" && "🚀 Profile Boost Granted"}
                                  {props.madamZofeeReward.type === "discount" && `💫 ${props.madamZofeeReward.amount}% Discount Granted`}
                                </p>
                              </div>
                            </motion.div>
                          )}

                          {/* Claim button */}
                          {props.madamZofeeReward.type !== "wisdom" && !props.madamZofeeReward.claimed && (
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                props.setShowMadamZofeeParticles(true);
                                setTimeout(() => props.setShowMadamZofeeParticles(false), 800);
                                props.setMadamZofeeReward((prev: any) => (prev ? { ...prev, claimed: true } : null));
                                // TODO: connect to onPurchaseFeature or super_likes_count update
                              }}
                              style={{
                                width: "100%",
                                padding: "14px",
                                borderRadius: 14,
                                background: "linear-gradient(135deg, #FFD700, #FFA500)",
                                border: "none",
                                color: "#000",
                                fontSize: 15,
                                fontWeight: "bold",
                                cursor: "pointer",
                                letterSpacing: "0.02em",
                              }}
                            >
                              ✨ Claim Thy Blessing
                            </motion.button>
                          )}

                          {props.showMadamZofeeParticles &&
                            [...Array(12)].map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                                animate={{
                                  opacity: 0,
                                  x: Math.cos((i / 12) * Math.PI * 2) * 80,
                                  y: Math.sin((i / 12) * Math.PI * 2) * 80,
                                  scale: 0,
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                style={{
                                  position: "absolute",
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: "#FFD700",
                                  top: "50%",
                                  left: "50%",
                                  pointerEvents: "none",
                                }}
                              />
                            ))}

                          {/* Claimed state */}
                          {props.madamZofeeReward.claimed && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center" }}>
                              <p style={{ color: "#FFD700", fontSize: 14, fontWeight: "bold" }}>
                                ✨ Blessing Received
                              </p>
                              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>
                                Go forth, dear seeker. Love awaits.
                              </p>
                            </motion.div>
                          )}
                        </div>

                        {/* Gold shimmer bottom */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 2,
                            background: "linear-gradient(to right, transparent, #FFD700, transparent)",
                            zIndex: 2,
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Share button */}
                  <button
                    onClick={() => {
                      const text = `🔮 I just got my ${props.premiumReadingResult.title} on 2DateMe!\n\n"${props.premiumReadingResult.affirmations[0]}"\n\nGet your free daily reading at 2dateme.com ✨`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                    }}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: 14,
                      background: "rgba(37,211,102,0.15)",
                      border: "1px solid rgba(37,211,102,0.4)",
                      color: "white",
                      fontSize: 15,
                      fontWeight: "bold",
                      cursor: "pointer",
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    💚 Share My Reading on WhatsApp
                  </button>

                  {/* New reading button */}
                  <button
                    onClick={() => {
                      props.setPremiumReadingResult(null);
                      props.setPremiumReadingType(null);
                      props.setSelectedCards([]);
                      props.setRevealedCards([]);
                    }}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #ff1493, #ff69b4)",
                      border: "none",
                      color: "white",
                      fontSize: 15,
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    🔮 Get Another Reading
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
}
