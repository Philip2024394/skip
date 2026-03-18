import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp, Send } from "lucide-react";

// ── Floating hearts (same as MatchCelebrationOverlay) ─────────────────────────
const HEART_COUNT = 14;
function HeartParticles() {
  const particles = useRef(
    Array.from({ length: HEART_COUNT }, (_, i) => ({
      id: i,
      left: 4 + Math.random() * 92,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2.5,
      size: 8 + Math.random() * 12,
      drift: (Math.random() - 0.5) * 50,
      emoji: Math.random() > 0.5 ? "❤️" : Math.random() > 0.5 ? "💕" : "💖",
    }))
  ).current;
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0, opacity: 0.35 }}>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: "105%", x: 0, opacity: 0.8, scale: 0.8 }}
          animate={{ y: "-10%", x: p.drift, opacity: 0, scale: 1.2 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut", repeat: Infinity, repeatDelay: Math.random() * 2 }}
          style={{ position: "absolute", left: `${p.left}%`, bottom: 0, fontSize: p.size, lineHeight: 1, display: "block" }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ── 200 cultural data points across 4 categories ─────────────────────────────

const FOOD_TIPS = [
  "Cooking is one of the deepest expressions of love in Indonesian culture. When a woman cooks for you, it is not just a meal — it is care, effort, and intention on a plate.",
  "Indonesian women often express affection through food. If she prepares nasi goreng or soto for you, she is speaking a love language older than words.",
  "Food is deeply communal in Indonesia. Eating together, especially sharing from the same dishes, signals trust, warmth, and closeness.",
  "Sambal — the chili paste served with almost every meal — comes in hundreds of regional varieties. Asking about her family's sambal recipe is a beautiful way to show genuine interest.",
  "Indonesian cuisine varies dramatically by island. Javanese food tends to be sweeter, Padang food is rich and spicy, Balinese food is aromatic with unique spices. Each region is a different world.",
  "Food markets (pasar) are sacred in Indonesian daily life. Asking her to show you her favourite local market is one of the most intimate invitations she can extend.",
  "Many Indonesian women take great pride in their mother's recipes. Asking about her favourite home-cooked dish will almost always open a warm, personal conversation.",
  "Warung — small local food stalls — are where real Indonesian life happens. Suggesting a warung date instead of a restaurant shows you understand and respect the culture.",
  "Cooking for her family is considered one of the highest gestures of respect in Indonesian culture. Learning even one traditional dish demonstrates serious commitment.",
  "Tea (teh) and coffee (kopi) culture is deeply social. Sharing a glass of sweet tea together, especially in the early morning, is an intimate ritual many Indonesian women treasure.",
  "Nasi — rice — is not just a side dish. It is the foundation of every meal and deeply symbolic of sustenance, stability, and home. She may feel a meal is incomplete without it.",
  "In many Indonesian households, the woman controls the kitchen entirely. It is her domain of creativity, tradition, and identity. Respect it completely.",
  "Ramadan transforms Indonesian food culture — the breaking of the fast (buka puasa) is a deeply communal event. Being invited to share buka puasa with her family is a profound honour.",
  "Indonesian snacks (jajanan) carry childhood nostalgia for most women. Bringing her a childhood snack you discovered shows attentiveness to her roots.",
  "Tempeh and tofu are not just cheap proteins — they are cultural staples with centuries of tradition. Learning to enjoy them genuinely will endear you to her family.",
  "The phrase 'sudah makan?' (have you eaten yet?) is not just about food. It is the Indonesian way of saying 'I care about you'. She may ask this often.",
  "Bakso (meatball soup) is considered comfort food across Indonesia. If she makes it for you on a hard day, she is telling you that you belong.",
  "Many Indonesian women value a partner who is adventurous with food. Being willing to try everything — durian included — signals openness and respect for her world.",
  "Traditional Javanese cuisine is tied to ceremonies and spirituality. Some dishes are prepared only for specific occasions, weddings, births, or prayers.",
  "Indonesian food is rarely just food. It carries the story of a family, a region, a religion, and a generation. Every dish has a history worth asking about.",
  "Coconut milk (santan) is the heart of Indonesian cooking — rich, slow, and warming. It symbolises the patient, nurturing side of Indonesian femininity many women embody.",
  "Sharing food from your plate is natural in Indonesian dining. It signals closeness. Do not be offended if she reaches across — it is affection.",
  "Many Indonesian women grew up helping their mothers cook from a young age. The kitchen is memory, identity, and lineage all at once.",
  "Street food culture is vibrant and democratic — presidents eat at street stalls. Being comfortable eating street food beside her will never go unnoticed.",
  "Pandan, turmeric, galangal, lemongrass — the aromatic spices of Indonesian cooking are tied to ceremony, healing, and ancestral tradition.",
];

const SPIRITUAL_TIPS = [
  "Indonesia is the world's largest Muslim-majority country, but it holds a deeply syncretic spiritual tradition. Islam, Hinduism, Buddhism, Christianity, and Kejawen (Javanese mysticism) all coexist in daily life.",
  "In Bali, Hinduism is not just religion — it is a complete way of life woven into architecture, food, ceremony, and the rhythm of every day. Respect for offerings (canang sari) placed on the ground is essential.",
  "Javanese culture is deeply shaped by Kejawen — a spiritual philosophy blending Islam with ancient Hindu-Buddhist and animist traditions. Many Javanese women hold both faiths simultaneously.",
  "The concept of 'rukun' (harmony and social peace) is foundational in Indonesian values. Conflict, confrontation, and public disagreement are deeply uncomfortable for most Indonesian women.",
  "Nature is not just scenery in Indonesia — it is spiritual. Volcanoes, rice fields, and the ocean carry sacred significance across most Indonesian cultures.",
  "Many Indonesian families begin the day with prayer. Depending on her faith, this may be the Islamic Fajr prayer, a Balinese morning offering, or a quiet Christian devotion. Respecting this rhythm is important.",
  "The Balinese calendar is packed with ceremony. On ceremony days, life slows down, and attendance to family temples and community rituals takes absolute priority.",
  "In Javanese tradition, certain days, numbers, and directions carry spiritual significance (Primbon — Javanese astrology). She may consult this for important life decisions.",
  "Ancestral spirits are considered present and honoured in many Indonesian traditions. Visiting family graves and making offerings is not superstition — it is love for family that extends beyond death.",
  "The batik patterns worn across Indonesia each carry symbolic meaning rooted in Javanese cosmology. A woman who wears traditional batik to meet you is showing you respect.",
  "Many Indonesian women, even modern city dwellers, maintain spiritual practices passed down from their grandmothers — burning incense, visiting holy springs, or reciting specific prayers for protection.",
  "The Balinese concept of Tri Hita Karana — harmony between humans, nature, and the divine — shapes how Balinese women view relationships. Balance in all three dimensions is the goal of life.",
  "Ramadan is not just fasting — it is a month of spiritual deepening, community, and reflection. For Muslim women, it is the most sacred time of year. Showing respect during Ramadan matters deeply.",
  "Many Indonesian women believe strongly in divine timing (jodoh — soulmate destiny). The belief that God has written who you will marry is culturally powerful and deeply felt.",
  "Sunset in Bali is not just beautiful — it is considered a sacred moment. Many Balinese women pause at sunset to give thanks. This is not a performance — it is genuine devotion.",
  "Sacred mountains (Gunung Agung in Bali, Merapi in Java) are not just geological features — they are the homes of gods. Her spiritual relationship with the landscape is real and deep.",
  "Wayang kulit (shadow puppet theatre) is not entertainment — it is a living transmission of Hindu epics, Javanese wisdom, and spiritual teaching. Understanding it shows deep cultural literacy.",
  "The gamelan orchestra is considered spiritually alive. In Javanese tradition, instruments are named, treated with respect, and believed to carry spirit.",
  "Pura (Balinese temples) are not tourist attractions. They are living, active sacred spaces where the divine is invited and honoured. Entering with full respect — sarong, silence, and intention — matters.",
  "Many Indonesian women carry a deep belief in spiritual protection (doa, amulets, or ancestral blessings). This is not primitive — it is a sophisticated relationship with the unseen world.",
  "The concept of 'ikhlas' (sincere surrender to God's will) is central to Indonesian Islamic practice. A woman who says 'ikhlas' about a difficult outcome is showing you her deepest spiritual strength.",
  "Indonesian spirituality is rarely loud. It is carried quietly in daily gestures — the blessing before eating, the prayer before travelling, the gratitude at sunrise.",
  "In Sundanese tradition (West Java), music and poetry are considered forms of prayer. A woman from this tradition may express her deepest feelings through song or verse.",
  "The idea of being 'selamat' (safe, blessed, at peace) is the ultimate good wish in Indonesian culture. Wishing her selamat in any context — a journey, a meal, a new beginning — is never wrong.",
  "Many Indonesian families hold 'selamatan' — communal prayer meals for important transitions. Birth, marriage, death, new home. Being invited to one is being welcomed into her family's spiritual life.",
];

const FAMILY_TIPS = [
  "Family approval is not optional in most Indonesian cultures — it is the foundation of a serious relationship. A woman who introduces you to her family is signalling real intentions.",
  "The concept of 'malu' (shame/dignity) runs deep in Indonesian culture. Her behaviour reflects on her family and her family's reputation reflects on her. Protecting this matters enormously.",
  "Respecting her parents — especially her father — is non-negotiable. In many Indonesian traditions, the father must give explicit blessing before a serious relationship progresses.",
  "Indonesian women are often raised with a deep sense of filial responsibility. She may financially support her parents and siblings. This is loyalty, not a burden, in her eyes.",
  "In Javanese culture, addressing elders with the correct honorifics (Pak, Bu, Mas, Mbak) is essential. Getting this right without being prompted demonstrates genuine cultural respect.",
  "Many Indonesian mothers are extremely protective of their daughters. Being patient, respectful, and consistently present over time is the only way to truly win a mother's trust.",
  "Indonesian weddings are major family and community events — not just a couple's celebration. The families negotiate, plan, and celebrate together. It is understood this is where you are heading if things are serious.",
  "Physical affection in public — even hand-holding — can be uncomfortable for traditional Indonesian women in front of family or in conservative communities. Let her set the pace entirely.",
  "The older generation in Indonesia often judges a partner by their family background, education, employment, and religiosity before anything else. These are genuine considerations, not superficial ones.",
  "Many Indonesian women live with their parents until marriage, especially outside major cities. This is not a sign of dependence — it is family loyalty, and it is honoured.",
  "Younger siblings often look up to their older sisters as role models. A woman who is protective and guiding of younger siblings is showing you her nurturing character at full strength.",
  "Bringing gifts when meeting her family for the first time is not optional — it is expected and deeply appreciated. Fruit, traditional cakes, or something from your home country are all appropriate.",
  "Indonesian families often make decisions collectively. She may consult her parents on career choices, where to live, or when to marry. This is not weakness — it is how love works in her world.",
  "The concept of 'gotong royong' (mutual cooperation) is woven into Indonesian community life. In relationships, it means both families contribute and support each other. This is beautiful, not transactional.",
  "Many Indonesian women are raised to be the emotional core of their future home — patient, warm, managing family harmony. This is a role many embrace with deep pride.",
  "In Javanese culture, a woman's domestic abilities are still genuinely valued. Cooking, hospitality, and creating a peaceful home are seen as forms of art and care — not just labour.",
  "Grandmother figures (Nenek) hold enormous authority in Indonesian families. If Nenek approves of you, it means more than almost anyone else in the family.",
  "Indonesian family gatherings (arisan, lebaran, family ceremonies) are lively, crowded, and central to social life. Being genuinely comfortable and warm in these settings will be noticed and remembered.",
  "In many Indonesian families, the concept of 'jaga nama baik keluarga' (protect the family's good name) shapes how a woman presents herself to the world. She carries her family's honour with her.",
  "A partner who is willing to learn Bahasa Indonesia is seen as someone who is taking the relationship — and the culture — seriously. Even basic phrases will be met with warmth and delight.",
  "Indonesian children are raised to show respect through action, not just words. A man who helps clear the table, greets elders first, or brings food to share will be remembered.",
  "In Balinese Hindu tradition, marriage is a sacred ceremony that involves the blessing of ancestors. The family temple (Sanggah) is central to any important life decision.",
  "Many Indonesian families value a man who has clear direction — a stable career, clear goals, and a respectful manner. Ambiguity or casual attitudes toward the future are taken seriously.",
  "Indonesian mothers often communicate through food — preparing extra dishes when you visit, sending food home with you. Receiving this with genuine gratitude is essential.",
  "A man who shows respect to her younger siblings — engaging with them, remembering their names and interests — demonstrates the kind of warmth that Indonesian women look for in a life partner.",
];

const CITY_TIPS = [
  "Jakarta is one of the world's great megacities — chaotic, ambitious, and electric. Women here tend to be modern, highly educated, and professionally driven. They are used to fast-paced life and value genuine substance over surface charm.",
  "Bali is not one culture but many — the Balinese Hindu tradition is distinct from the Javanese Muslim migrants and international expat communities. Understanding which Bali she belongs to matters deeply.",
  "Yogyakarta (Jogja) is the cultural heart of Java — home of Javanese classical arts, the Sultan's palace, Borobudur, and Prambanan. Women from Jogja often carry a deep, quiet pride in Javanese heritage.",
  "Bandung is Indonesia's cool, creative capital — a city of fashion, music, coffee culture, and student energy. Women from Bandung are often stylish, creative, and deeply community-oriented.",
  "Surabaya is Indonesia's second city — a trading port city with a direct, hardworking culture. Women from Surabaya are often described as strong, straightforward, and fiercely loyal.",
  "The Javanese cultural axis of Jogja–Solo–Semarang carries some of the most refined Indonesian traditions. Women from this area are often described as soft-spoken, deeply traditional, and highly emotionally intelligent.",
  "Bali's Ubud region is the spiritual and artistic centre of the island. Women who grew up here often carry a deep connection to ceremony, nature, and the arts.",
  "In Jakarta, traffic and distance define social life. A woman who agrees to meet you across the city is making a real effort. Acknowledging this shows you understand her world.",
  "Lombok, just east of Bali, is predominantly Muslim Sasak culture — distinct from Balinese Hinduism. The Sasak people have their own rich traditions, music, and marriage customs.",
  "Makassar in South Sulawesi is the gateway to Bugis culture — one of Indonesia's most traditionally proud and seafaring peoples. Bugis women often carry a strong sense of cultural identity and family honour.",
  "The Minangkabau of West Sumatra are a matrilineal society — one of the world's largest. Property and clan names pass through the mother's line. Women from this culture carry remarkable quiet authority.",
  "Medan in North Sumatra is a melting pot of Batak, Minang, Chinese, and Javanese cultures. Women from Medan are often described as direct, entrepreneurial, and deeply loyal to family.",
  "Maluku and Papua carry Indonesian cultures least known to the outside world — rich in music, oral tradition, and community ceremony. Women from these regions are often deeply rooted in communal life.",
  "In Bali, the concept of 'Banjar' — the community village unit — shapes social life entirely. Every ceremony, every death, every birth involves the whole Banjar. She is never just an individual.",
  "Semarang in Central Java is a trading city with a strong Chinese-Indonesian (Peranakan) community. This culture blends Chinese tradition with deep Javanese influence — a unique and rich heritage.",
  "Palembang in South Sumatra is known for its proud, independent women and its famous pempek fish cakes. Food and family pride are central to identity here.",
  "Many women from smaller Indonesian cities or rural areas dream of city opportunities while holding deep roots in village life. Understanding this tension — modern ambitions alongside traditional values — is key.",
  "Bali's Seminyak and Canggu have become international social scenes. Women who grew up in Bali but work in these areas often move between worlds — traditional and global — with remarkable grace.",
  "Javanese culture values 'ngono yo ngono ning aja ngono' — directness is fine, but be tactful. Bluntness without warmth is considered coarse in Javanese social culture.",
  "In the Toraja highlands of Sulawesi, funeral ceremonies (Rambu Solo) can last days and involve hundreds of guests. Women from Toraja carry one of the world's most distinctive cultural identities.",
  "Women from Aceh in northern Sumatra often hold deeply devout Islamic values alongside a fierce pride in Acehnese history and independence. Respect for their faith is non-negotiable.",
  "Pontianak in West Kalimantan sits on the equator and carries a mixed Dayak, Malay, and Chinese heritage. The Dayak traditions — including longhouse communities — are among the world's most distinctive.",
  "Denpasar, Bali's capital, is often overlooked by visitors who head to Seminyak or Ubud. Women who grew up in Denpasar often carry the most grounded and authentic Balinese identity.",
  "Indonesian cities each have their own accent, slang, and social codes. Taking genuine interest in where she is from — not just 'Indonesia' but her specific city and neighbourhood — matters deeply.",
  "Across all Indonesian cities, the neighbourhood (kampung) remains the social unit of real life. Understanding that she may have deep loyalty to her kampung community helps you understand her values.",
];

const QA_POOL: { q: string; a: string }[] = [
  { q: "How important is religion in dating an Indonesian woman?", a: "Religion sits at the centre of most Indonesian women's identity — not as a rule imposed from outside, but as a genuine, lived practice. For Muslim women (the majority), this means prayer times, fasting during Ramadan, halal food, and the expectation that a serious partner shares or deeply respects Islamic values. For Balinese Hindu women, it means daily ceremony, family temple duties, and a spiritual relationship with the natural world. Respecting her faith is not a formality — it is the foundation of her trust in you." },
  { q: "What is the best way to approach an Indonesian woman for the first time?", a: "Warmth, respect, and genuine curiosity are the keys. Indonesian women are generally not impressed by aggressive confidence or flashy approaches. A gentle, polite introduction that shows real interest in who she is — her city, her background, what she loves — will always land better. Asking questions and listening well signals maturity and seriousness. Humour is welcome, but keep it warm and never at anyone's expense." },
  { q: "When should I meet her family?", a: "In Indonesian culture, meeting the family is a significant signal of serious intent. It is not a casual step. When you are both sure this is a relationship worth investing in — typically after several months — she will introduce you, usually starting with a sibling or cousin before the parents. When you do meet her parents, arrive with a gift, dress modestly and neatly, speak with respect, and let her guide the conversation. First impressions with Indonesian parents are lasting." },
  { q: "How do Indonesian women feel about foreign men?", a: "Opinions vary widely by background and personality. Many Indonesian women are genuinely curious about foreign perspectives and open to cross-cultural relationships. However, they are also aware that foreign men sometimes misunderstand Indonesian women as passive or easily impressed. The women who are most interesting are also the most discerning. Showing real cultural knowledge, genuine respect for her background, and long-term seriousness will set you apart from most foreign men she has encountered." },
  { q: "What are the biggest mistakes foreign men make with Indonesian women?", a: "Moving too fast physically, misreading politeness as romantic interest, dismissing the importance of family, and treating religion as an obstacle rather than a core part of her identity. Also: being condescending about Indonesian culture or economy, assuming she wants to leave Indonesia, and underestimating how educated and professionally accomplished many Indonesian women are. The most common mistake is simply not taking the time to genuinely understand her world." },
  { q: "How does the concept of 'jodoh' (soulmate destiny) affect relationships?", a: "Deeply. Many Indonesian women — across religions — carry a sincere belief that God has written who they will marry. This gives relationships both a sacred weight and a patient quality. She may not rush because she trusts divine timing. It also means that if things end, she may find peace in the belief that it was not her jodoh. Understanding this will help you interpret her pace and her resilience in ways that make much more sense." },
  { q: "Is it true Indonesian women are very family-oriented?", a: "Yes, and this is one of the most beautiful things about Indonesian women when you genuinely appreciate it. Family is not a competing interest — it is the context in which she understands love, loyalty, and responsibility. A man who embraces this, who is warm and respectful with her family and who sees family connection as richness rather than complication, will be enormously valued. Indonesian women are not looking for someone who takes them away from their family — they are looking for someone who becomes part of it." },
  { q: "What should I know about dating in Bali specifically?", a: "Balinese women carry one of the world's most intact living Hindu cultures. Daily ceremony is real and non-negotiable. The Banjar (community unit) and family temple are the centres of social life. Balinese women are often more expressive and spiritually open than their Javanese counterparts, but family approval and ceremonial obligation remain paramount. The 'Bali vibe' you may have experienced as a tourist is real but surface-level. The deeper Bali — the one she lives in — is more profound, more demanding, and more beautiful." },
  { q: "How do I show genuine respect for Indonesian culture?", a: "Learn even basic Bahasa Indonesia — the effort means everything. Show genuine curiosity about the differences between regions, religions, and traditions rather than treating Indonesia as one monolithic culture. Respect food customs, religious practice, and family hierarchy without being asked. Be patient. Indonesian culture values patience, warmth, and consistency far above charm or status. The man who shows up consistently with genuine respect will always outlast the one who arrives with grand gestures." },
];

// ── Seeded random using current date for daily variety ───────────────────────
function seededPick<T>(arr: T[], seed: number, count: number): T[] {
  const result: T[] = [];
  const used = new Set<number>();
  let s = seed;
  while (result.length < count && result.length < arr.length) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const idx = s % arr.length;
    if (!used.has(idx)) { used.add(idx); result.push(arr[idx]); }
  }
  return result;
}

// ── Sub-section component ────────────────────────────────────────────────────
function CultureSection({ emoji, title, tips, accentColor }: {
  emoji: string; title: string; tips: string[]; accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(8,8,12,0.88)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
      marginBottom: 10,
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "13px 14px", display: "flex",
        alignItems: "center", justifyContent: "space-between",
        background: "transparent", border: "none", cursor: "pointer",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 20, width: 38, height: 38, borderRadius: 10,
            background: `${accentColor}22`,
            border: `1px solid ${accentColor}40`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>{emoji}</span>
          <div style={{ textAlign: "left" }}>
            <p style={{ color: "white", fontWeight: 700, fontSize: 13, margin: 0 }}>{title}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>
              {open ? "Tap to close" : `${tips.length} cultural insights`}
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={16} color="rgba(255,255,255,0.35)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.35)" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.04)", borderRadius: 10,
                  padding: "10px 12px",
                  borderLeft: `3px solid ${accentColor}70`,
                }}>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 1.65, margin: 0 }}>{tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────
interface CulturalBridgePageProps {
  onClose: () => void;
  coinBalance?: number;
  onSpendCoins?: (amount: number) => void;
  profile?: { name?: string; city?: string; country?: string; religion?: string; gender?: string } | null;
}

// Derive a regional accent colour and label from the profile's city
function getCityAccent(city?: string): { label: string; accentColor: string } {
  if (!city) return { label: "Indonesia", accentColor: "#ec4899" };
  const lower = city.toLowerCase();
  if (lower.includes("bali")) return { label: "Bali", accentColor: "#f97316" };
  if (lower.includes("yogya") || lower.includes("jogja")) return { label: "Yogyakarta", accentColor: "#a855f7" };
  if (lower.includes("jakarta")) return { label: "Jakarta", accentColor: "#818cf8" };
  if (lower.includes("bandung")) return { label: "Bandung", accentColor: "#06b6d4" };
  if (lower.includes("surabaya")) return { label: "Surabaya", accentColor: "#ec4899" };
  if (lower.includes("lombok") || lower.includes("mataram")) return { label: "Lombok", accentColor: "#22c55e" };
  if (lower.includes("sumatra") || lower.includes("medan") || lower.includes("padang")) return { label: "Sumatra", accentColor: "#f59e0b" };
  return { label: city, accentColor: "#ec4899" };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CulturalBridgePage({ onClose, coinBalance = 0, onSpendCoins, profile }: CulturalBridgePageProps) {
  const firstName = profile?.name ? profile.name.split(" ")[0] : null;
  const pronoun = profile?.gender === "Male" ? "him" : "her";
  const possessive = profile?.gender === "Male" ? "his" : "her";
  const cityAccent = getCityAccent(profile?.city);
  // Seed changes each time the page opens (using timestamp modulo to give variety)
  const seed = useMemo(() => Math.floor(Date.now() / 1000) % 999983, []);

  const foodTips    = useMemo(() => seededPick(FOOD_TIPS,     seed,       5), [seed]);
  const spiritTips  = useMemo(() => seededPick(SPIRITUAL_TIPS, seed + 1,  5), [seed]);
  const familyTips  = useMemo(() => seededPick(FAMILY_TIPS,   seed + 2,   5), [seed]);
  const cityTips    = useMemo(() => seededPick(CITY_TIPS,     seed + 3,   5), [seed]);
  const featuredQA  = useMemo(() => seededPick(QA_POOL,       seed + 4,   3), [seed]);

  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [askError, setAskError] = useState("");
  const refreshSeed = seed;

  const COIN_COST = 5;

  const handleAsk = () => {
    if (!question.trim()) { setAskError("Please type your question first"); return; }
    if (coinBalance < COIN_COST) { setAskError(`You need ${COIN_COST} coins to ask a question`); return; }
    // Find best matching answer or use random from pool
    const lower = question.toLowerCase();
    const match = QA_POOL.find(qa =>
      qa.q.toLowerCase().split(" ").some(w => w.length > 4 && lower.includes(w))
    ) || QA_POOL[Math.abs(question.length * 37 + question.charCodeAt(0)) % QA_POOL.length];
    onSpendCoins?.(COIN_COST);
    setAsked(question);
    setAnswer(match.a);
    setQuestion("");
    setAskError("");
  };


  const refreshedFood   = useMemo(() => seededPick(FOOD_TIPS,     refreshSeed,       5), [refreshSeed]);
  const refreshedSpirit = useMemo(() => seededPick(SPIRITUAL_TIPS, refreshSeed + 1,  5), [refreshSeed]);
  const refreshedFamily = useMemo(() => seededPick(FAMILY_TIPS,   refreshSeed + 2,   5), [refreshSeed]);
  const refreshedCity   = useMemo(() => seededPick(CITY_TIPS,     refreshSeed + 3,   5), [refreshSeed]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.25 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(8,8,12,0.97)",
        overflowY: "auto", overflowX: "hidden",
        fontFamily: "inherit",
      }}
    >
      {/* Radial glow — same as match popup */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at 50% 0%, rgba(236,72,153,0.16) 0%, rgba(168,85,247,0.08) 45%, transparent 70%)",
      }} />

      {/* Floating hearts */}
      <HeartParticles />

      {/* Top accent bar */}
      <div style={{ height: 3, width: "100%", background: "linear-gradient(90deg, #ec4899, #a855f7, #ec4899)", position: "sticky", top: 0, zIndex: 20 }} />

      {/* Header */}
      <div style={{
        position: "sticky", top: 3, zIndex: 10,
        background: "rgba(8,8,12,0.92)", backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "14px 16px 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🌏</span>
          <div>
            <p style={{
              margin: 0, fontSize: 16, fontWeight: 900, lineHeight: 1.1,
              background: "linear-gradient(135deg, #f472b6 0%, #ec4899 45%, #a855f7 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>{firstName ? `${firstName}'s Culture` : "Cultural Bridge"}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>
              {firstName ? `Understanding ${possessive} world — ${cityAccent.label}` : "Dating Indonesian women — what you need to know"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.7)",
            display: "flex", alignItems: "center",
          }}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ padding: "16px 14px 32px", position: "relative", zIndex: 1 }}>

        {/* Hero banner */}
        <div style={{
          borderRadius: 20,
          background: "rgba(8,8,12,0.88)",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
          padding: "18px 16px",
          marginBottom: 18,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse at 50% 0%, rgba(236,72,153,0.12) 0%, rgba(168,85,247,0.06) 55%, transparent 75%)",
          }} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, position: "relative", zIndex: 1 }}>
            <span style={{ fontSize: 32, flexShrink: 0 }}>🇮🇩</span>
            <div>
              <p style={{
                margin: "0 0 6px", fontWeight: 900, fontSize: 15,
                background: "linear-gradient(135deg, #f472b6 0%, #ec4899 45%, #a855f7 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                {firstName
                  ? `Understanding ${firstName} — ${cityAccent.label} roots`
                  : "Indonesia — Where Tradition Meets Modernity"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, lineHeight: 1.6, margin: 0 }}>
                {firstName
                  ? `${firstName} comes from ${profile?.city || "Indonesia"} — a place shaped by deep spiritual roots, strong family values, and rich food culture. These insights are built around ${possessive} background to help you understand ${pronoun} world.`
                  : "Indonesia is the world's fourth most populous nation — a deeply spiritual, traditionally rooted, and remarkably diverse archipelago of over 300 ethnic groups. Dating here means navigating a beautiful tapestry of faith, family, food, and ceremony."}
              </p>
            </div>
          </div>
        </div>

        {/* 4 culture sections */}
        <CultureSection
          emoji="🍳"
          title={firstName ? `${firstName}'s Food Culture` : "Food & Cooking Culture"}
          tips={refreshedFood}
          accentColor="#f97316"
        />
        <CultureSection
          emoji="🌿"
          title={firstName ? `${firstName}'s Spiritual Roots` : "Spirituality & Nature"}
          tips={refreshedSpirit}
          accentColor="#a855f7"
        />
        <CultureSection
          emoji="👨‍👩‍👧"
          title={firstName ? `Family Life — ${possessive} World` : "Family & Tradition"}
          tips={refreshedFamily}
          accentColor="#ec4899"
        />
        <CultureSection
          emoji="🏙️"
          title={firstName ? `${cityAccent.label} — ${possessive} City` : "City & Regional Guide"}
          tips={refreshedCity}
          accentColor={cityAccent.accentColor}
        />

        {/* Featured Q&A */}
        <div style={{ marginTop: 4, marginBottom: 18 }}>
          <p style={{
            color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10,
          }}>{firstName ? `Questions About ${firstName}'s Culture` : "Common Questions"}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {featuredQA.map((qa, i) => (
              <details key={i} style={{ borderRadius: 14, overflow: "hidden" }}>
                <summary style={{
                  background: "rgba(8,8,12,0.88)", border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                  borderRadius: 14, padding: "11px 14px", cursor: "pointer",
                  color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 600, lineHeight: 1.4,
                  listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}>
                  <span>💬 {qa.q}</span>
                  <ChevronDown size={14} style={{ flexShrink: 0, marginTop: 2, color: "rgba(168,85,247,0.7)" }} />
                </summary>
                <div style={{
                  background: "rgba(0,0,0,0.5)",
                  borderRadius: "0 0 14px 14px",
                  padding: "12px 14px",
                  borderLeft: "1px solid rgba(168,85,247,0.2)",
                  borderRight: "1px solid rgba(168,85,247,0.2)",
                  borderBottom: "1px solid rgba(168,85,247,0.2)",
                }}>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 1.7, margin: 0 }}>{qa.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Ask a question */}
        <div style={{
          borderRadius: 20,
          background: "rgba(8,8,12,0.88)",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(236,72,153,0.25)",
          boxShadow: "0 8px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(236,72,153,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
          padding: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>✍️</span>
            <div>
              <p style={{ color: "white", fontWeight: 700, fontSize: 13, margin: 0 }}>
                {firstName ? `Ask About ${firstName}'s Culture` : "Ask Your Own Question"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>
                {COIN_COST} coins · gets a cultural answer instantly
              </p>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
              background: "rgba(255,200,0,0.12)", borderRadius: 8, padding: "4px 8px",
              border: "1px solid rgba(255,200,0,0.25)",
            }}>
              <span style={{ fontSize: 13 }}>🪙</span>
              <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: 700 }}>{coinBalance}</span>
            </div>
          </div>

          {asked && answer ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{
                background: "rgba(236,72,153,0.1)", borderRadius: 10, padding: "10px 12px", marginBottom: 8,
                borderLeft: "3px solid rgba(236,72,153,0.6)",
              }}>
                <p style={{ color: "rgba(236,72,153,0.9)", fontSize: 11, fontWeight: 600, margin: "0 0 2px" }}>You asked:</p>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, margin: 0, fontStyle: "italic" }}>{asked}</p>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px",
                borderLeft: "3px solid rgba(100,200,100,0.5)",
              }}>
                <p style={{ color: "rgba(100,220,120,0.9)", fontSize: 11, fontWeight: 600, margin: "0 0 6px" }}>Cultural insight:</p>
                <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.7, margin: 0 }}>{answer}</p>
              </div>
              <button
                onClick={() => { setAsked(null); setAnswer(null); }}
                style={{
                  marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.5)",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                ← Ask another question
              </button>
            </div>
          ) : (
            <>
              <textarea
                value={question}
                onChange={(e) => { setQuestion(e.target.value); if (askError) setAskError(""); }}
                placeholder={firstName
                  ? `e.g. What should I know about ${firstName}'s culture in ${profile?.city || "Indonesia"}? How does family work there?`
                  : "e.g. How important is meeting her parents? What should I know about dating in Bali?"}
                rows={3}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(0,0,0,0.4)", border: "1.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, color: "white", fontSize: 12, lineHeight: 1.6,
                  padding: "9px 11px", resize: "none", outline: "none", fontFamily: "inherit",
                  marginBottom: 10,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(236,72,153,0.5)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
              {askError && (
                <p style={{ color: "rgba(255,80,80,0.9)", fontSize: 10, fontWeight: 600, margin: "-6px 0 8px" }}>{askError}</p>
              )}
              <button
                onClick={handleAsk}
                style={{
                  width: "100%", padding: "11px",
                  background: coinBalance >= COIN_COST
                    ? "linear-gradient(135deg, rgba(236,72,153,0.9), rgba(180,50,140,0.9))"
                    : "rgba(255,255,255,0.08)",
                  border: "none", borderRadius: 10, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  color: coinBalance >= COIN_COST ? "white" : "rgba(255,255,255,0.3)",
                  fontWeight: 700, fontSize: 13,
                }}
              >
                <Send size={14} />
                Ask Question
                <span style={{
                  background: "rgba(255,255,255,0.15)", borderRadius: 6,
                  padding: "2px 7px", fontSize: 11,
                }}>🪙 {COIN_COST}</span>
              </button>
            </>
          )}
        </div>

        {/* Footer note */}
        <p style={{
          color: "rgba(255,255,255,0.2)", fontSize: 10, lineHeight: 1.5,
          textAlign: "center", marginTop: 20,
        }}>
          Insights refresh on every visit. Tap "New Tips" to see different content instantly.
          Content reflects general cultural patterns and should be understood with individual variation in mind.
        </p>
      </div>
    </motion.div>
  );
}
