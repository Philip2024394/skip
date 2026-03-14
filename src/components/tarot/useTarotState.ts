import { useRef, useState } from "react";

// ── Tarot image constants ─────────────────────────────────────────────────────
export const GRAVEYARD_BG = "https://ik.imagekit.io/7grri5v7d/arot%20card.png?updatedAt=1773487551052";

export const TAROT_READER_SEQUENCE = [];

export const TAROT_READER_IMAGE_URL = "";

export const TAROT_CARD_BACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 280'%3E%3Crect width='200' height='280' fill='%231a1a2e'/%3E%3Crect x='10' y='10' width='180' height='260' fill='%23162841' stroke='%23d4af37' stroke-width='2'/%3E%3Ccircle cx='100' cy='140' r='60' fill='none' stroke='%23d4af37' stroke-width='3'/%3E%3Cpath d='M100 80 L100 200 M40 140 L160 140' stroke='%23d4af37' stroke-width='2'/%3E%3Ctext x='100' y='250' text-anchor='middle' fill='%23d4af37' font-family='serif' font-size='14'%3ETAROT%3C/text%3E%3C/svg%3E";

export const TAROT_CARD_FRONT_IMAGES: Record<number, string> = {
  1: "https://ik.imagekit.io/7grri5v7d/T_1-removebg-preview.png",
  2: "https://ik.imagekit.io/7grri5v7d/Tha_magician-removebg-preview.png",
  3: "https://ik.imagekit.io/7grri5v7d/higher-removebg-preview.png",
  4: "https://ik.imagekit.io/7grri5v7d/empressd-removebg-preview.png",
  5: "https://ik.imagekit.io/7grri5v7d/emperor-removebg-preview.png",
  6: "https://ik.imagekit.io/7grri5v7d/higherfdsdfsdf-removebg-preview.png",
  7: "https://ik.imagekit.io/7grri5v7d/higherfdsdfsdfsss-removebg-preview.png",
  8: "https://ik.imagekit.io/7grri5v7d/higherfdsdfsdfssstertert-removebg-preview.png",
  9: "https://ik.imagekit.io/7grri5v7d/higherfdsdfsdfssstertertddd-removebg-preview.png",
};

export const TAROT_HEADERS = [
  "Today's Message", "The Cards Speak", "Written In The Stars",
  "Your Path Reveals", "The Universe Whispers", "Fated For You",
  "Destiny Calls", "The Veil Lifts", "Ancient Wisdom Speaks",
  "Your Truth Awaits", "The Spirits Guide", "Madam Zofee Sees",
  "From The Beyond", "The Mist Clears", "Your Soul Knows",
  "The Cards Have Chosen", "Cosmic Forces Align", "Listen Closely",
  "The Stars Confess", "Written In Fire", "From Within The Flame",
  "The Night Reveals", "Your Heart Speaks", "The Moon Knows",
  "Fate Has Spoken", "The Ancestors Whisper", "Love's True Message",
  "The Oracle Awakens", "Hidden No Longer", "Your Energy Speaks",
  "The Cosmos Answers", "What Was Hidden", "The Future Stirs",
  "Revealed By Moonlight", "The Wheel Turns", "Read Your Destiny",
  "The Unseen Speaks", "Forces Beyond Guide", "From The Deep",
  "Your Chapter Opens", "The Light Breaks Through", "Shadows Become Clear",
  "The Sacred Reveals", "Drawn For You Alone", "Only You May Know",
  "This Card Chose You", "The Stars Selected This", "Your Moment Has Come",
  "The Mystic Sees You", "Love Finds Its Way",
];

// ── Tarot state hook ──────────────────────────────────────────────────────────
export const useTarotState = () => {
  const [showTarotDrawer, setShowTarotDrawer] = useState(false);
  const [showPremiumReading, setShowPremiumReading] = useState(false);
  const [premiumReadingType, setPremiumReadingType] = useState<string | null>(null);
  const [premiumReadingResult, setPremiumReadingResult] = useState<any | null>(null);
  const [premiumReadingLoading, setPremiumReadingLoading] = useState(false);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [madamZofeeReward, setMadamZofeeReward] = useState<{
    type: string;
    amount: number;
    message: string;
    claimed: boolean;
  } | null>(null);
  const [showMadamZofee, setShowMadamZofee] = useState(false);
  const [showMadamZofeeParticles, setShowMadamZofeeParticles] = useState(false);
  const [tarotReaderSrc, setTarotReaderSrc] = useState(TAROT_READER_IMAGE_URL);
  const [showDailyTarotFront, setShowDailyTarotFront] = useState(false);
  const [tarotProgressStep, setTarotProgressStep] = useState(0);
  const [tarotHeader, setTarotHeader] = useState("");
  const tarotSequenceTimeoutsRef = useRef<number[]>([]);

  const resetTarot = () => {
    setShowTarotDrawer(false);
    setShowPremiumReading(false);
    setPremiumReadingType(null);
    setPremiumReadingResult(null);
    setPremiumReadingLoading(false);
    setSelectedCards([]);
    setRevealedCards([]);
    setMadamZofeeReward(null);
    setShowMadamZofee(false);
    setShowMadamZofeeParticles(false);
    setTarotReaderSrc(TAROT_READER_IMAGE_URL);
    setShowDailyTarotFront(false);
    setTarotProgressStep(0);
    setTarotHeader("");
    tarotSequenceTimeoutsRef.current.forEach(clearTimeout);
    tarotSequenceTimeoutsRef.current = [];
  };

  return {
    showTarotDrawer, setShowTarotDrawer,
    showPremiumReading, setShowPremiumReading,
    premiumReadingType, setPremiumReadingType,
    premiumReadingResult, setPremiumReadingResult,
    premiumReadingLoading, setPremiumReadingLoading,
    selectedCards, setSelectedCards,
    revealedCards, setRevealedCards,
    madamZofeeReward, setMadamZofeeReward,
    showMadamZofee, setShowMadamZofee,
    showMadamZofeeParticles, setShowMadamZofeeParticles,
    tarotReaderSrc, setTarotReaderSrc,
    showDailyTarotFront, setShowDailyTarotFront,
    tarotProgressStep, setTarotProgressStep,
    tarotHeader, setTarotHeader,
    tarotSequenceTimeoutsRef,
    resetTarot,
  };
};
