import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Unlock, Clock, Sparkles, MapPin, Gift, CalendarDays, MoonStar, ShieldCheck } from "lucide-react";
import { Profile } from "./SwipeCard";
import { Button } from "@/components/ui/button";
import PromoCard from "./PromoCard";
import { PREMIUM_FEATURES, PremiumFeature } from "@/data/premiumFeatures";
import { isOnline } from "@/hooks/useOnlineStatus";
import { getUnlockPriceLabel } from "@/utils/unlockPrice";

const TAROT_CARD_BACK_URL = "https://ik.imagekit.io/7grri5v7d/tarot_cards-removebg-preview.png";
const TAROT_DRAWER_CARD_URL = "https://ik.imagekit.io/7grri5v7d/tarot_cards_new-removebg-preview.png";
const TAROT_READER_IMAGE_URL = "https://ik.imagekit.io/7grri5v7d/old_woman-removebg-preview.png";
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
const TAROT_READER_SEQUENCE: Array<{ src: string; durationMs: number }> = [
  { src: "https://ik.imagekit.io/7grri5v7d/old_woman-removebg-preview.png?updatedAt=1773149993777", durationMs: 4000 },
  { src: "https://ik.imagekit.io/7grri5v7d/tarot_card_woman_2-removebg-preview.png", durationMs: 3000 },
  { src: "https://ik.imagekit.io/7grri5v7d/tarot_card_woman_4-removebg-preview.png", durationMs: 2000 },
  { src: "https://ik.imagekit.io/7grri5v7d/tarot_card_woman_5-removebg-preview.png", durationMs: 2000 },
  { src: "https://ik.imagekit.io/7grri5v7d/tarot_card_woman_6-removebg-preview.png", durationMs: 2000 },
  { src: "https://ik.imagekit.io/7grri5v7d/tarot_card_woman_7-removebg-preview.png", durationMs: 2000 },
];
const TAROT_CARD_FRONT_IMAGES: Record<number, string> = {
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

// ── Countdown hook ────────────────────────────────────────────────────────────
const useCountdown = (expiresAt: string | null | undefined) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) { setTimeLeft(""); return; }
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setIsExpired(true); setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
      setIsExpired(false);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return { timeLeft, isExpired };
};

const CountdownBadge = ({ expiresAt }: { expiresAt: string | null | undefined }) => {
  const { timeLeft, isExpired } = useCountdown(expiresAt);
  if (!timeLeft) return null;
  return (
    <span className={`flex items-center gap-0.5 text-[8px] font-medium ${isExpired ? "text-destructive" : "text-accent"}`}>
      <Clock className="w-2.5 h-2.5" /> {timeLeft}
    </span>
  );
};

// ── How "new" a profile is (joined in last 7 days) ────────────────────────────
const isNewProfile = (p: Profile) => {
  // Use created_at if available, fall back to last_seen_at for mock profiles
  const dateStr = (p as Profile & { created_at?: string }).created_at || p.last_seen_at;
  if (!dateStr) return false;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000; // joined within the last 7 days
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface LikesLibraryProps {
  title?: string;
  tabLabelOverrides?: Partial<Record<Tab, string>>;
  profileFirstDateIdea?: string | null;
  profileDatePlaces?: Profile["first_date_places"];
  onTabChange?: (tab: Tab) => void;
  selectedProfileSection?: "basic" | "lifestyle" | "interests";
  onSelectProfileSection?: (section: "basic" | "lifestyle" | "interests") => void;
  selectedUnlockItemKey?: string;
  onSelectUnlockItem?: (key: string) => void;
  selectedTreatItem?: TreatKey | null;
  onSelectTreatItem?: (key: TreatKey) => void;
  selectedDateIdeaIndex?: number;
  onSelectDateIdea?: (index: number) => void;
  iLiked: Profile[];
  likedMe: Profile[];
  newProfiles: Profile[];       // new: all profiles from Index, pre-filtered
  filterCountry?: string;       // new: active country filter so we can label it
  receivedHighlightProfileId?: string | null;  // when set, switch to "Likes Me" and butterfly is flying to this profile
  heartDropProfileId?: string | null;          // when set, show dropped heart on this profile's card (Likes Me tab)
  superLikeGlowProfileId?: string | null;     // when set, show yellow glow on this profile's card (Likes Me tab, first in list)
  dailyTarot?: {
    cardId: number;
    cardName: string;
    cardEmoji: string;
    reading: string;
    shown: boolean;
  } | null;
  onRevealDailyTarot?: () => void;
  onUnlock: (profile: Profile) => void;
  onSelectProfile: (profile: Profile, sourceList: Profile[]) => void;
  onPurchaseFeature: (feature: PremiumFeature) => void;
}

type Tab = "sent" | "received" | "new" | "treat";
type DisplayItem =
  | { type: "profile"; profile: Profile }
  | { type: "promo"; profile: null };

// ── Tab pill config ───────────────────────────────────────────────────────────
const TAB_LABELS: Record<Tab, (counts: Record<Tab, number>) => string> = {
  new:      () => "New",
  sent:     () => "I Liked",
  received: () => "Likes Me",
  treat:    () => "Treat",
};
const TABS: Tab[] = ["new", "sent", "received", "treat"];

const TREAT_ITEMS = [
  { key: "massage",    emoji: "💆", label: "Massage",    desc: "Relaxing full-body massage" },
  { key: "beautician", emoji: "💅", label: "Beautician",  desc: "Professional beauty treatment" },
  { key: "flowers",    emoji: "🌸", label: "Flowers",    desc: "Fresh flower bouquet" },
  { key: "jewelry",   emoji: "💎", label: "Jewelry",    desc: "Sparkling gift" },
] as const;
type TreatKey = typeof TREAT_ITEMS[number]["key"];

// ── Component ─────────────────────────────────────────────────────────────────
const LikesLibrary = ({
  title,
  tabLabelOverrides,
  profileFirstDateIdea,
  profileDatePlaces,
  onTabChange,
  selectedProfileSection,
  onSelectProfileSection,
  selectedUnlockItemKey,
  onSelectUnlockItem,
  selectedTreatItem,
  onSelectTreatItem,
  selectedDateIdeaIndex,
  onSelectDateIdea,
  iLiked, likedMe, newProfiles, filterCountry,
  dailyTarot,
  onRevealDailyTarot,
  receivedHighlightProfileId, heartDropProfileId, superLikeGlowProfileId,
  onUnlock, onSelectProfile, onPurchaseFeature,
}: LikesLibraryProps) => {
  const [tab, setTab] = useState<Tab>("new");
  const [activePromoIndex, setActivePromoIndex] = useState<number | null>(null);
  const [promoPosition, setPromoPosition] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
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
  const tarotSequenceTimeoutsRef = useRef<number[]>([]);

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
      soulmate: {
        title: "Your Soulmate Reading",
        intro: "A soulmate is not someone who completes you — they are someone who inspires you to complete yourself. The cards today carry a very specific energy around the person who is meant to find you.",
        cards: [
          {
            position: "Who They Are",
            message: "Your person carries a quiet strength that is immediately noticeable. They are not loud about who they are — they show you through actions rather than words. There is a warmth to them that feels safe — the kind of person who makes a room feel more comfortable simply by being in it. They have known their own struggles and it has made them compassionate rather than bitter. They are looking for exactly what you are looking for — not perfection, but presence. Not games, but genuine connection. They think about the person they are meant to meet more than they admit.",
            advice: "Your soulmate is not looking for the most impressive version of you — they are looking for the most authentic version.",
          },
          {
            position: "When They Arrive",
            message: "Timing in love is not random — it is orchestrated. The universe does not bring two people together until both are ready to receive each other properly. You are closer to that readiness than you think. The energy around your meeting carries a sense of the unexpected — this is not someone you will find by searching in the obvious places. They will arrive in a moment when you are simply being yourself, not performing, not trying. When you have stopped forcing and started flowing — that is when they appear.",
            advice: "Stop trying to control the timeline. The best love stories always begin with both people having given up on finding each other — and then finding each other anyway.",
          },
          {
            position: "Where You Will Meet",
            message: "The circumstances of your meeting carry an element of chance that will later feel like destiny. You may already be moving in overlapping circles without knowing it. Digital connection plays a role — an introduction that begins with words and curiosity before it becomes something felt in person. There will be a moment of recognition that you cannot explain logically — a feeling that this person is somehow already familiar. Pay attention to new connections that feel unusually comfortable from the very first moment.",
            advice: "Stay open to connections that begin simply. The greatest love stories rarely begin dramatically — they begin with curiosity and a conversation.",
          },
        ],
        closing: "Your soulmate is not a fantasy — they are a real person on their own journey right now, being shaped by their own experiences into exactly the right person for you. Trust the process. Trust the timing. Trust yourself enough to believe you deserve what is coming.",
        affirmations: [
          "My soulmate is real and they are on their way",
          "I trust divine timing in my love life",
          "I am exactly where I need to be right now",
          "The right connection will feel easy and natural",
          "What is meant for me will always find me",
        ],
      },
      family_future: {
        title: "Your Future Family Reading",
        intro: "Home is not a place — it is a feeling created by the people who choose each other every day. The cards today speak of the beautiful life being built for you.",
        cards: [
          {
            position: "Your Love Foundation",
            message: "The foundation of your future family begins with the love you build with your partner — and that foundation is strong in your cards. What is coming is not a relationship built on convenience or loneliness, but one built on genuine choice. Two people who see each other clearly — with all their imperfections — and choose each other anyway. This foundation will be built slowly and carefully, with honest conversations and shared values. It will not always be easy, but it will always be worth it. The strength of what you build together will surprise even you.",
            advice: "A strong family begins with a strong partnership. Invest in your relationship first — everything else grows from that.",
          },
          {
            position: "Your Future Home",
            message: "The home in your future is filled with warmth, laughter and the beautiful noise of a life well lived. It is not a perfect home — it is a real one. A place where people feel safe to be exactly who they are. There is light in this vision — natural light, open windows, the kind of space that feels alive. Children's energy is present in this reading — whether biological or chosen family — small voices and growing souls that bring a depth of love you cannot yet fully imagine. Your home will be a place people love to visit because of the energy inside it.",
            advice: "The home you dream of begins with the love you cultivate now. Every loving choice you make today is a brick in the foundation of that future.",
          },
          {
            position: "Your Legacy Together",
            message: "The love you build will outlast the years you spend building it. Your legacy is not measured in possessions or achievements — it is measured in the people who are better because you loved them. Children who grow up knowing what real love looks like. A partner who becomes their best self because of the safety you gave them. And your own heart — finally at rest in the knowledge that you chose well and were chosen in return. This is not a small life. This is a full and beautiful human life — and it is yours.",
            advice: "Do not underestimate the power of loving one person deeply and completely. That is one of the most significant things a human being can do.",
          },
        ],
        closing: "The family life in your cards is not guaranteed by fate — it is built by choice. The choice to be vulnerable, to communicate honestly, to stay when it is difficult and to love generously even when you are tired. You are capable of every single one of these choices. The beautiful life you imagine is not out of reach. It is waiting for you to walk toward it.",
        affirmations: [
          "I deserve a love that feels like home",
          "My future family is already being prepared for me",
          "I am becoming the partner and parent I want to be",
          "Love and stability are my birthright",
          "The family I dream of is possible and it is coming",
        ],
      },
      yearly_forecast: {
        title: "Your 2026 Love Forecast",
        intro: "2026 carries a powerful energy for love and connection. The cards drawn for your year ahead hold both challenge and extraordinary promise. Read each season with an open heart.",
        cards: [
          {
            position: "First Half of 2026",
            message: "The first half of 2026 asks you to do the internal work that makes external love possible. There may be moments of impatience — a feeling that things are moving too slowly, that everyone around you seems to be finding their person while you are still waiting. This feeling is the lesson, not the reality. The universe is not ignoring you — it is preparing you. Use this time to become deeply comfortable with who you are. Your standards, your values, your vision for your life. The person coming to you in 2026 will need you to know yourself — because they will love you for exactly who you are, not who you are pretending to be.",
            advice: "The waiting is not wasted time. It is preparation time. Use it.",
          },
          {
            position: "Second Half of 2026",
            message: "The energy shifts significantly in the second half of the year. What felt stagnant begins to move. A connection that carries real weight enters your orbit — perhaps someone entirely new, perhaps someone already present who you finally see differently. There is a turning point moment — a conversation, a decision, a single yes — that changes the direction of your love life completely. Do not let fear make that decision for you. The opportunity that arrives in this period is genuine and it deserves your courage. This is not a false start. This is the beginning of something real.",
            advice: "When the right opportunity arrives, do not talk yourself out of it. Trust the feeling more than the fear.",
          },
          {
            position: "Your Greatest Opportunity",
            message: "Your greatest opportunity in love this year is not a person — it is a version of yourself. The most powerful thing you can do for your love life in 2026 is to stop shrinking. Stop making yourself smaller to be more palatable. Stop apologising for knowing what you want. The person who is right for you will not be frightened by your wholeness — they will be drawn to it. Your greatest opportunity is to show up as the full, unedited, wonderfully imperfect human being that you actually are — and to trust that this person is exactly who the right one has been waiting for.",
            advice: "Be so fully yourself that the right person cannot help but find you.",
          },
        ],
        closing: "2026 is a year of genuine movement in your love life. Not all of it will be comfortable — growth rarely is. But the destination is worth every step of the journey. Keep your heart open, your standards high and your faith stronger than your fear. The love you deserve is not a dream. It is a destination — and you are already on your way.",
        affirmations: [
          "2026 is my year for real and lasting love",
          "I show up as my full self and the right person loves me for it",
          "I release fear and choose love",
          "Every day I am getting closer to the connection I deserve",
          "I am patient because I know what is coming is worth waiting for",
        ],
      },
    };
    return readings[readingType] || readings.love_3card;
  };

  const matches = iLiked.filter((p) => likedMe.some((l) => l.id === p.id));

  // Sort new profiles: most recently seen first, cap at 30
  const sortedNew = useMemo(() =>
    [...newProfiles]
      .sort((a, b) => {
        const ta = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const tb = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 50),
  [newProfiles]);

  const currentList: Profile[] =
    tab === "sent"     ? iLiked :
    tab === "received" ? likedMe :
    sortedNew;

  const counts: Record<Tab, number> = {
    sent:     iLiked.length,
    received: likedMe.length,
    new:      sortedNew.length,
    treat:    0,
  };

  // Scroll back to left whenever tab changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    onTabChange?.(tab);
  }, [onTabChange, tab]);

  // When butterfly is flying to a profile, show "Likes Me" so the user sees who liked them
  useEffect(() => {
    if (receivedHighlightProfileId) setTab("received");
  }, [receivedHighlightProfileId]);

  useEffect(() => {
    tarotSequenceTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    tarotSequenceTimeoutsRef.current = [];

    if (!showTarotDrawer) {
      setTarotReaderSrc(TAROT_READER_IMAGE_URL);
      setShowDailyTarotFront(false);
      return;
    }

    // Preload woman sequence frames so swaps don't flash blank while images load.
    TAROT_READER_SEQUENCE.forEach((step) => {
      const img = new Image();
      img.decoding = "async";
      img.src = step.src;
    });

    setShowDailyTarotFront(false);
    setTarotReaderSrc(TAROT_READER_SEQUENCE[0]?.src || TAROT_READER_IMAGE_URL);

    let cumulative = 0;
    TAROT_READER_SEQUENCE.forEach((step, idx) => {
      const timeoutId = window.setTimeout(() => {
        setTarotReaderSrc(step.src);
        if (idx === TAROT_READER_SEQUENCE.length - 1) {
          const revealId = window.setTimeout(() => setShowDailyTarotFront(true), step.durationMs);
          tarotSequenceTimeoutsRef.current.push(revealId);
        }
      }, cumulative);
      tarotSequenceTimeoutsRef.current.push(timeoutId);
      cumulative += step.durationMs;
    });

    return () => {
      tarotSequenceTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      tarotSequenceTimeoutsRef.current = [];
    };
  }, [showTarotDrawer]);

  // ── Promo rotation ──────────────────────────────────────────────
  const pickNewPromo = useCallback(() => {
    const idx = Math.floor(Math.random() * PREMIUM_FEATURES.length);
    setActivePromoIndex(idx);
    const maxPos = Math.max(0, currentList.length);
    setPromoPosition(Math.floor(Math.random() * (maxPos + 1)));
  }, [currentList.length]);

  useEffect(() => {
    const t = setTimeout(pickNewPromo, 2000);
    return () => clearTimeout(t);
  }, [pickNewPromo]);

  useEffect(() => {
    if (activePromoIndex === null) return;
    const t = setTimeout(pickNewPromo, 5000 + Math.random() * 5000);
    return () => clearTimeout(t);
  }, [activePromoIndex, pickNewPromo]);

  // ── Build display list (with promo injected, but NOT on new tab) ─
  const displayItems = useMemo((): DisplayItem[] => {
    const items: DisplayItem[] = currentList.map((p) => ({ type: "profile" as const, profile: p }));
    if (tab !== "new" && activePromoIndex !== null) {
      const pos = Math.min(promoPosition, items.length);
      items.splice(pos, 0, { type: "promo" as const, profile: null });
    }
    return items;
  }, [currentList, activePromoIndex, promoPosition, tab]);

  const displayItemsWithTarot = useMemo(() => {
    if (!dailyTarot) return displayItems;
    if (tab !== "new") return displayItems;

    // Always show exactly 1 tarot tile in the New carousel until the user reveals it.
    // Insert it near the start so new identities see it immediately.
    const items: DisplayItem[] = [...displayItems];
    const insertAt = Math.min(1, items.length);
    items.splice(insertAt, 0, { type: "promo" as const, profile: null } as any);
    return items;
  }, [dailyTarot, displayItems, tab]);

  // ── Swipe/scroll tabs on horizontal drag — header area only ────────────────
  const dragStart = useRef<{ x: number; y: number; tab: Tab } | null>(null);
  const handleTabAreaTouchStart = (e: React.TouchEvent) => {
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tab };
  };
  const handleTabAreaTouchEnd = (e: React.TouchEvent) => {
    if (!dragStart.current) return;
    const dx = e.changedTouches[0].clientX - dragStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - dragStart.current.y);
    // Only switch tabs if horizontal swipe is dominant (not a vertical scroll attempt)
    if (dy > Math.abs(dx)) { dragStart.current = null; return; }
    const idx = TABS.indexOf(dragStart.current.tab);
    if (dx < -50 && idx < TABS.length - 1) {
      const next = TABS[idx + 1];
      setTab(next);
      onTabChange?.(next);
    }
    if (dx > 50  && idx > 0) {
      const next = TABS[idx - 1];
      setTab(next);
      onTabChange?.(next);
    }
    dragStart.current = null;
  };

  // ── Empty-state copy ────────────────────────────────────────────
  const emptyText =
    tab === "new"      ? "Loading profiles..." :
    tab === "sent"     ? "Swipe up or down to like!" :
    "No likes yet — keep swiping!";

  const isDateIdeasTab =
    tab === "sent" &&
    tabLabelOverrides?.sent === "Date Ideas";

  const isProfileInfoTab =
    tab === "new" &&
    tabLabelOverrides?.new === "Profile";

  const isUnlockTab =
    tab === "received" &&
    tabLabelOverrides?.received === "Unlock";

  const isTreatTab =
    tab === "treat" &&
    tabLabelOverrides?.treat === "Treat";

  const dateIdeas = (
    (profileDatePlaces || [])
      .filter((p): p is NonNullable<typeof p> => !!p)
      .slice(0, 3)
  ) as NonNullable<Profile["first_date_places"]>;

  return (
    <div className="h-full flex flex-col">
      {/* ── Header — tab swipe gesture lives here only ── */}
      <div
        className="flex items-center justify-between mb-2 flex-shrink-0"
        onTouchStart={handleTabAreaTouchStart}
        onTouchEnd={handleTabAreaTouchEnd}
      >
        <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-primary" fill="currentColor" />
          {title ?? "Match"}
        </h2>

        {/* 3-tab pill */}
        <div className="relative flex gap-0 p-0.5 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          {/* Sliding background */}
          <motion.div
            className="absolute top-0.5 bottom-0.5 rounded-[10px] gradient-love"
            animate={{ left: `calc(${TABS.indexOf(tab)} * 25% + 2px)`, width: "calc(25% - 4px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          />
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                onTabChange?.(t);
                requestAnimationFrame(() => setTab(t));
              }}
              className={`relative z-10 py-1 px-1.5 rounded-[10px] text-[9px] font-semibold transition-colors min-w-[44px] text-center ${tab === t ? "text-white" : "text-white/40 hover:text-white/70"}`}
            >
              {tabLabelOverrides?.[t] ?? TAB_LABELS[t](counts)}
            </button>
          ))}
        </div>
      </div>

      {/* ── New profiles label ── */}
      <AnimatePresence>
        {tab === "new" && !isProfileInfoTab && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 mb-1.5 flex-shrink-0 overflow-hidden"
          >
            <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="text-[9px] text-white/50">
              {filterCountry
                ? `Recently active in ${filterCountry}`
                : "Recently active profiles — scroll to explore"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scrollable card row — native scroll, no tab-switch interference ── */}
      <div
        ref={scrollRef}
        className={`flex-1 [&::-webkit-scrollbar]:hidden ${
          isDateIdeasTab || isProfileInfoTab || isTreatTab
            ? "overflow-y-auto overflow-x-hidden"
            : "overflow-x-auto overflow-y-hidden"
        }`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          ...(isDateIdeasTab || isProfileInfoTab || isTreatTab
            ? { overscrollBehaviorY: "contain", touchAction: "pan-y" }
            : { overscrollBehaviorX: "contain", touchAction: "pan-x" }),
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className={(isDateIdeasTab || isProfileInfoTab || isTreatTab) ? "h-full py-1" : "flex gap-2 h-full py-1"}
          >
            {isProfileInfoTab ? (
              <div className="grid grid-cols-3 gap-2 h-full pb-2">
                {(
                  [
                    { key: "basic" as const, label: "Basic Info" },
                    { key: "lifestyle" as const, label: "Lifestyle" },
                    { key: "interests" as const, label: "Interests" },
                  ]
                ).map((s, idx) => (
                  <motion.button
                    key={s.key}
                    type="button"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.12) }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectProfileSection?.(s.key);
                    }}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] bg-black/50 backdrop-blur-md border relative w-full ${selectedProfileSection === s.key ? "border-fuchsia-300/50 ring-2 ring-fuchsia-300/20" : "border-white/10"}`}
                    style={{ height: 124 }}
                    aria-label={s.label}
                  >
                    <p className="text-white text-[11px] font-bold text-center leading-tight">{s.label}</p>
                    <p className="text-white/45 text-[9px] font-semibold text-center">Tap to view</p>
                  </motion.button>
                ))}
              </div>
            ) : isTreatTab ? (
              <div className="grid grid-cols-2 gap-2 h-full pb-2">
                {TREAT_ITEMS.map((item, idx) => (
                  <motion.button
                    key={item.key}
                    type="button"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ delay: Math.min(idx * 0.06, 0.18) }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectTreatItem?.(item.key);
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] bg-black/50 backdrop-blur-md border relative w-full ${
                      selectedTreatItem === item.key
                        ? "border-fuchsia-300/50 ring-2 ring-fuchsia-300/20"
                        : "border-white/10"
                    }`}
                    style={{ height: 124 }}
                    aria-label={item.label}
                  >
                    <span style={{ fontSize: 28 }}>{item.emoji}</span>
                    <p className="text-white text-[11px] font-bold text-center leading-tight">{item.label}</p>
                    <p className="text-white/45 text-[9px] font-semibold text-center">{item.desc}</p>
                  </motion.button>
                ))}
              </div>
            ) : isUnlockTab ? (
              <div className="pr-1">
                <div className="flex gap-2 pb-2 min-w-max items-start">
                  {(
                    [
                      { key: "unlock:single", title: "1 Unlock", price: "$1.99", sub: "Match unlock" },
                      { key: "unlock:pack3", title: "3 Pack", price: "$4.99", sub: "Popular" },
                      { key: "unlock:pack10", title: "10 Pack", price: "$12.99", sub: "Best value" },
                      { key: "unlock:vip", title: "VIP", price: "$9.99/mo", sub: "10 / month" },
                      ...PREMIUM_FEATURES.filter((f) => f.id !== "vip").map((f) => ({
                        key: `feature:${f.id}`,
                        title: `${f.emoji} ${f.name}`,
                        price: f.price,
                        sub: f.description,
                      })),
                    ]
                  ).map((p, idx) => (
                    <motion.button
                      key={p.key}
                      type="button"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.12) }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectUnlockItem?.(p.key);
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] bg-black/50 backdrop-blur-md border relative flex-shrink-0 w-[140px] ${selectedUnlockItemKey === p.key ? "border-fuchsia-300/50 ring-2 ring-fuchsia-300/20" : "border-white/10"}`}
                      style={{ height: 100 }}
                      aria-label={p.title}
                    >
                      <p className="text-white text-[10px] font-black text-center leading-tight line-clamp-2">{p.title}</p>
                      <p className="text-white/80 text-[12px] font-black">{p.price}</p>
                      <p className="text-white/45 text-[9px] font-semibold text-center">{p.sub}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : isDateIdeasTab ? (
              dateIdeas.length === 0 && !profileFirstDateIdea ? (
                <div className="flex items-center justify-center h-full px-4">
                  <p className="text-white/40 text-xs text-center">No date ideas yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 h-full">
                  {dateIdeas.map((place, idx) => (
                    <motion.button
                      key={`date-idea-${idx}`}
                      type="button"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.12) }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectDateIdea?.(idx);
                      }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer transition-all hover:scale-[1.02] bg-black/50 backdrop-blur-md border relative w-full ${selectedDateIdeaIndex === idx ? "border-fuchsia-300/50 ring-2 ring-fuchsia-300/20" : "border-white/10"}`}
                      style={{ height: 124 }}
                      aria-label={place.idea || "Date idea"}
                    >
                      <div className="relative w-full flex-1 rounded-lg overflow-hidden">
                        <img
                          src={place.image_url || "/placeholder.svg"}
                          alt={place.idea}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                      </div>

                      <p className="text-white text-[9px] font-semibold leading-tight line-clamp-2 text-center w-full">
                        {place.idea || "Date idea"}
                      </p>

                      <p className="text-white/50 text-[8px] truncate w-full text-center">
                        {place.title || (place.url ? "Open" : "")}
                      </p>
                    </motion.button>
                  ))}

                  {dateIdeas.length === 0 && profileFirstDateIdea ? (
                    <div className="col-span-3 flex items-center justify-center px-4">
                      <div className="w-full rounded-xl bg-black/50 backdrop-blur-md border border-white/10 p-3">
                        <p className="text-white/70 text-[10px] font-semibold text-center">{profileFirstDateIdea}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            ) : displayItemsWithTarot.length === 0 ? (
              <div className="flex items-center justify-center flex-1 px-4">
                <p className="text-white/40 text-xs text-center">{emptyText}</p>
              </div>
            ) : (
              displayItemsWithTarot.map((item, idx) => {
                // ── Tarot card injection (uses the promo slot shape) ──
                if (dailyTarot && tab === "new" && item.type === "promo") {
                  return (
                    <motion.button
                      key={`tarot-${dailyTarot.cardId}-${dailyTarot.shown ? "shown" : "new"}-${idx}`}
                      type="button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowTarotDrawer(true);
                        window.setTimeout(() => onRevealDailyTarot?.(), 0);
                      }}
                      className="flex-shrink-0 cursor-pointer transition-all hover:scale-105 relative overflow-visible bg-transparent border-0"
                      style={{ width: 80, height: 104 }}
                      aria-label="Open your Daily Love Reading"
                    >
                      <div className="absolute inset-0 -z-10 blur-xl opacity-70">
                        <div className="w-full h-full rounded-[18px] bg-[radial-gradient(circle_at_50%_70%,rgba(250,204,21,0.55),rgba(250,204,21,0.10),rgba(0,0,0,0)_70%)]" />
                      </div>
                      <motion.img
                        src="https://ik.imagekit.io/7grri5v7d/T_1ddrrr-removebg-preview.png"
                        alt="Tarot card"
                        className="absolute inset-0 w-full h-full object-contain"
                        decoding="async"
                        loading="lazy"
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </motion.button>
                  );
                }

                // ── Promo card ──
                if (item.type === "promo" && activePromoIndex !== null) {
                  return (
                    <PromoCard
                      key={`promo-${activePromoIndex}`}
                      feature={PREMIUM_FEATURES[activePromoIndex]}
                      onPurchase={onPurchaseFeature}
                    />
                  );
                }

                const profile = item.profile;
                if (!profile) return null;
                const isMatch = matches.some((m) => m.id === profile.id);
                const fresh   = tab === "new" && isNewProfile(profile);
                const iLikedThis = iLiked.some((p) => p.id === profile.id);

                return (
                  <motion.div
                    key={`${tab}-${profile.id}`}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                    onClick={() => onSelectProfile(profile, currentList)}
                    data-likes-library-profile-id={profile.id}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer transition-all hover:scale-105 bg-black/50 backdrop-blur-md border relative ${tab === "received" && superLikeGlowProfileId === profile.id ? "border-amber-400/60 shadow-[0_0_16px_rgba(251,191,36,0.4)] ring-2 ring-amber-400/30" : "border-white/10"}`}
                    style={{ width: 80 }}
                  >
                    {/* NEW badge */}
                    {fresh && (
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10">
                        <span className="bg-amber-400 text-black text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-wide shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                          NEW
                        </span>
                      </div>
                    )}

                    {/* Available tonight glow — shown as moon badge only, no ring */}

                    <div className="relative mt-1">
                      {/* Dropped heart from butterfly — behind the profile who liked you */}
                      {tab === "received" && heartDropProfileId === profile.id && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                          initial={{ y: -24, opacity: 1, scale: 1.2 }}
                          animate={{ y: 4, opacity: 0.85, scale: 1 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                          <Heart className="w-8 h-8 text-primary drop-shadow-lg" fill="currentColor" strokeWidth={1.5} />
                        </motion.div>
                      )}
                      <img
                        src={profile.avatar_url || profile.image}
                        alt={profile.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/10 relative z-10"
                      />
                      {/* Heart when I liked this profile */}
                      {iLikedThis && (
                        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 pointer-events-none">
                          <Heart className="w-6 h-6 text-primary drop-shadow-lg" fill="currentColor" />
                        </div>
                      )}
                      {profile.is_rose && tab !== "new" && (
                        <span className="absolute -top-1 -right-1 text-sm">❤️</span>
                      )}
                      {/* Plus-One badge — top-left corner, always visible */}
                      {/* Single status badge — +1 beats Free Tonight */}
                      {profile.is_plusone ? (
                        <span className="absolute -top-1 -left-1 bg-black border border-yellow-400/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(250,204,21,0.5)]">
                          <span className="text-yellow-300 font-black text-[7px] leading-none">+1</span>
                        </span>
                      ) : profile.generous_lifestyle ? (
                        <span className="absolute -top-1 -left-1 bg-black border border-amber-400/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(245,158,11,0.5)]">
                          <Gift className="w-2.5 h-2.5 text-amber-300" />
                        </span>
                      ) : profile.weekend_plans ? (
                        <span className="absolute -top-1 -left-1 bg-black border border-primary/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(180,80,150,0.5)]">
                          <CalendarDays className="w-2.5 h-2.5 text-primary" />
                        </span>
                      ) : profile.late_night_chat ? (
                        <span className="absolute -top-1 -left-1 bg-black border border-indigo-400/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(99,102,241,0.5)]">
                          <MoonStar className="w-2.5 h-2.5 text-indigo-300" />
                        </span>
                      ) : profile.no_drama ? (
                        <span className="absolute -top-1 -left-1 bg-black border border-teal-400/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(45,212,191,0.5)]">
                          <ShieldCheck className="w-2.5 h-2.5 text-teal-300" />
                        </span>
                      ) : tab === "new" && profile.available_tonight ? (
                        <span className="absolute -bottom-1 -right-1 text-[10px] bg-black border border-yellow-400/70 rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(250,204,21,0.5)]">🌙</span>
                      ) : null}
                      {/* Green heartbeat dot — avoid overlap with moon badge */}
                      {isOnline(profile.last_seen_at) && !(profile.is_plusone) && !(profile.generous_lifestyle) && !(profile.weekend_plans) && !(profile.late_night_chat) && !(profile.no_drama) && !(tab === "new" && profile.available_tonight) && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-black shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
                        </span>
                      )}
                      {/* online dot when free tonight badge is showing — move to left */}
                      {isOnline(profile.last_seen_at) && !(profile.is_plusone) && tab === "new" && profile.available_tonight && (
                        <span className="absolute -bottom-0.5 -left-0.5 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-black shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
                        </span>
                      )}
                      {/* online dot when +1 / generous / weekend / late / no-drama badge is showing — move to bottom-right */}
                      {isOnline(profile.last_seen_at) && (profile.is_plusone || profile.generous_lifestyle || profile.weekend_plans || profile.late_night_chat || profile.no_drama) && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-black shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
                        </span>
                      )}
                    </div>

                    <p className="text-white text-[10px] font-semibold truncate w-full text-center">
                      {profile.name}, {profile.age}
                    </p>

                    {tab === "new" ? (
                      <p className="text-white/50 text-[8px] truncate w-full text-center flex items-center justify-center gap-0.5">
                        <MapPin className="w-2 h-2 flex-shrink-0" />
                        {profile.city || profile.country}
                      </p>
                    ) : (
                      <p className="text-white/50 text-[9px] truncate w-full text-center">
                        {profile.country}
                      </p>
                    )}

                    {tab !== "new" && <CountdownBadge expiresAt={profile.expires_at} />}

                    {isMatch && tab !== "new" && (
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onUnlock(profile); }}
                        className="gradient-love text-primary-foreground border-0 text-[8px] h-5 px-1.5 mt-0.5 w-full"
                        aria-label={`Unlock WhatsApp with ${profile.name}`}
                      >
                        <Unlock className="w-2.5 h-2.5 mr-0.5" /> {getUnlockPriceLabel(profile)}
                      </Button>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Tab dot indicators removed — swipe tabs with finger ── */}

      {showTarotDrawer && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowTarotDrawer(false)}
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
              borderTop: "2px solid rgba(255,105,180,0.55)",
              boxShadow: "0 -4px 40px rgba(255,105,180,0.35)",
            }}
          >
            {/* Graveyard background image */}
            <img
              src="https://ik.imagekit.io/7grri5v7d/grave%20yard.png?updatedAt=1773169904335"
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
              {showDailyTarotFront && (
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

          {/* Grave digger — only appears when card text appears, same fade timing */}
            <AnimatePresence>
              {showDailyTarotFront && (
                <motion.img
                  src="https://ik.imagekit.io/7grri5v7d/grave_digger-removebg-preview.png"
                  alt=""
                  aria-hidden="true"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%) translateY(70px)",
                    width: "100%",
                    maxWidth: 420,
                    objectFit: "contain",
                    objectPosition: "bottom center",
                    zIndex: 2,
                    pointerEvents: "none",
                  }}
                />
              )}
            </AnimatePresence>

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
                  const text = `🔮 My Daily Love Reading:\n\n"${dailyTarot?.reading}"\n\n✨ Get your free reading at 2dateme.com`;
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
                onClick={() => setShowTarotDrawer(false)}
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
                onClick={(e) => { e.stopPropagation(); setShowPremiumReading(true); }}
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
              onClick={() => setShowTarotDrawer(false)}
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
                padding: "16px 20px 28px",
                overflowY: "auto",
                maxHeight: "88vh",
              }}
            >
              {/* Tarot woman — blends into background via mask */}
              <div
                style={{
                  position: "relative",
                  width: 160,
                  height: 160,
                  marginBottom: -8,
                  WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                  maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={tarotReaderSrc}
                    src={tarotReaderSrc}
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

              {/* Title */}
              <p
                style={{
                  color: "#FFD700",
                  fontSize: 13,
                  fontWeight: "bold",
                  letterSpacing: "0.1em",
                  marginBottom: 12,
                  textShadow: "0 0 12px rgba(255,215,0,0.5)",
                }}
              >
                ✨ Daily Love Reading
              </p>

              {/* Tarot card — face down until reveal */}
              {dailyTarot && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                  <AnimatePresence mode="wait">
                    {!showDailyTarotFront ? (
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
                          src={TAROT_DRAWER_CARD_URL}
                          alt="Card back"
                          style={{ width: 140, height: 185, objectFit: "contain" }}
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
                            style={{ width: 140, height: 185, objectFit: "contain" }}
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
                            {dailyTarot.cardEmoji}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Card info — only shows after card flips */}
                  <AnimatePresence>
                    {showDailyTarotFront && (
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        style={{
                          marginTop: 146,
                          width: "100%",
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            color: "#FFD700",
                            fontWeight: "bold",
                            fontSize: 13,
                            marginBottom: 8,
                            textShadow: "0 0 8px rgba(255,215,0,0.4)",
                          }}
                        >
                          {dailyTarot.cardName}
                        </p>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.88)",
                            fontSize: 13,
                            lineHeight: 1.7,
                          }}
                        >
                          {dailyTarot.reading}
                        </p>
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
      {showPremiumReading && !premiumReadingResult && (
        <>
          <div
            onClick={(e) => { e.stopPropagation(); setShowPremiumReading(false); setShowTarotDrawer(true); }}
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
              backgroundImage:
                "url('https://ik.imagekit.io/7grri5v7d/grave%20yard.png')",
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
              onClick={(e) => { e.stopPropagation(); setShowPremiumReading(false); setShowTarotDrawer(true); }}
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
                      setPremiumReadingType(reading.id);
                      setPremiumReadingLoading(true);
                      // Pick 3 random card IDs
                      const allIds = Object.keys(TAROT_CARD_FRONT_IMAGES).map(Number);
                      const shuffled = allIds.sort(() => Math.random() - 0.5).slice(0, 3);
                      setSelectedCards(shuffled);
                      setRevealedCards([]);
                      // Simulate payment then generate reading
                      setTimeout(() => {
                        const result = generatePremiumReading(reading.id, shuffled);
                        setPremiumReadingResult(result);
                        setPremiumReadingLoading(false);
                        // Reveal cards one by one
                        setTimeout(() => setRevealedCards([0]), 1000);
                        setTimeout(() => setRevealedCards([0, 1]), 3000);
                        setTimeout(() => setRevealedCards([0, 1, 2]), 5000);
                        // After all cards revealed — Madam Zofee appears
                        setTimeout(() => {
                          const reward = generateMadamZofeeReward();
                          setMadamZofeeReward(reward);
                          setTimeout(() => setShowMadamZofee(true), 800);
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
      {showPremiumReading && premiumReadingLoading && (
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
      {showPremiumReading && premiumReadingResult && !premiumReadingLoading && (
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
              setShowPremiumReading(false);
              setPremiumReadingResult(null);
              setPremiumReadingType(null);
              setSelectedCards([]);
              setRevealedCards([]);
              setShowTarotDrawer(true);
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
                {premiumReadingResult.title}
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
                {premiumReadingResult.intro}
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
              {selectedCards.map((cardId, idx) => (
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
                    {premiumReadingResult.cards[idx]?.position}
                  </p>

                  <div style={{ position: "relative", width: 90, height: 118 }}>
                    <AnimatePresence mode="wait">
                      {!revealedCards.includes(idx) ? (
                        <motion.img
                          key="back"
                          src={TAROT_DRAWER_CARD_URL}
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
                          src={TAROT_CARD_FRONT_IMAGES[cardId] || TAROT_DRAWER_CARD_URL}
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
              {premiumReadingResult.cards.map((card: any, idx: number) => (
                <AnimatePresence key={idx}>
                  {revealedCards.includes(idx) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      style={{
                        borderRadius: 18,
                        background:
                          premiumReadingType === "soulmate" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.06)",
                        border:
                          premiumReadingType === "soulmate"
                            ? "1px solid rgba(255,255,255,0.14)"
                            : "1px solid rgba(255,215,0,0.2)",
                        backdropFilter: premiumReadingType === "soulmate" ? "blur(10px)" : undefined,
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
              {revealedCards.length === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {/* Closing */}
                  <div
                    style={{
                      borderRadius: 18,
                      background:
                        premiumReadingType === "soulmate"
                          ? "rgba(0,0,0,0.55)"
                          : "linear-gradient(135deg, rgba(180,80,180,0.15), rgba(255,215,0,0.08))",
                      border:
                        premiumReadingType === "soulmate"
                          ? "1px solid rgba(255,255,255,0.14)"
                          : "1px solid rgba(180,80,180,0.3)",
                      backdropFilter: premiumReadingType === "soulmate" ? "blur(10px)" : undefined,
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
                      {premiumReadingResult.closing}
                    </p>
                  </div>

                  {/* Affirmations */}
                  <div
                    style={{
                      borderRadius: 18,
                      background: premiumReadingType === "soulmate" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.04)",
                      border:
                        premiumReadingType === "soulmate"
                          ? "1px solid rgba(255,255,255,0.14)"
                          : "1px solid rgba(255,255,255,0.1)",
                      backdropFilter: premiumReadingType === "soulmate" ? "blur(10px)" : undefined,
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
                      {premiumReadingResult.affirmations.map((affirmation: string, idx: number) => (
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
                    {showMadamZofee && madamZofeeReward && (
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
                            src="https://ik.imagekit.io/7grri5v7d/old_woman-removebg-preview.png"
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
                          "{madamZofeeReward.message}"
                        </p>

                        {/* Reward badge */}
                        {madamZofeeReward.type !== "wisdom" && (
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
                                {madamZofeeReward.type === "superlike" &&
                                  `⭐ ${madamZofeeReward.amount} Super Like${madamZofeeReward.amount > 1 ? "s" : ""} Granted`}
                                {madamZofeeReward.type === "boost" && "🚀 Profile Boost Granted"}
                                {madamZofeeReward.type === "discount" && `💫 ${madamZofeeReward.amount}% Discount Granted`}
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {/* Claim button */}
                        {madamZofeeReward.type !== "wisdom" && !madamZofeeReward.claimed && (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setShowMadamZofeeParticles(true);
                              setTimeout(() => setShowMadamZofeeParticles(false), 800);
                              setMadamZofeeReward((prev) => (prev ? { ...prev, claimed: true } : null));
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

                        {showMadamZofeeParticles &&
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
                        {madamZofeeReward.claimed && (
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
                      const text = `🔮 I just got my ${premiumReadingResult.title} on 2DateMe!\n\n"${premiumReadingResult.affirmations[0]}"\n\nGet your free daily reading at 2dateme.com ✨`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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
                      setPremiumReadingResult(null);
                      setPremiumReadingType(null);
                      setSelectedCards([]);
                      setRevealedCards([]);
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
    </div>
  );
};

export default LikesLibrary;
