import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp, ExternalLink, Plane, MapPin, Smartphone, CreditCard, ShieldCheck, Heart } from "lucide-react";

// ── City data ─────────────────────────────────────────────────────────────────

interface CityData {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  airports: { name: string; code: string; note: string }[];
  transport: { icon: string; label: string; price: string; tip: string }[];
  areas: string[];
  hotels: { tier: string; area: string; priceRange: string; note: string }[];
  embassy: string;
}

const CITIES: CityData[] = [
  {
    id: "bali",
    name: "Bali",
    emoji: "🌴",
    tagline: "Most popular destination for foreign visitors — spiritual, beautiful, expat-friendly",
    airports: [{ name: "I Gusti Ngurah Rai International Airport", code: "DPS", note: "Located in Tuban, 15–90 min to main areas depending on destination" }],
    transport: [
      { icon: "🚕", label: "Official Airport Taxi (fixed price counter)", price: "Kuta Rp 100k · Seminyak Rp 130k · Ubud Rp 280–380k · Nusa Dua Rp 150k", tip: "Go to the OFFICIAL taxi counter inside arrivals. Never accept drivers who approach you outside — they will quote 3–5× the fair price." },
      { icon: "📱", label: "Grab / Gojek (app-based)", price: "20–40% cheaper than official counter", tip: "Exit the terminal and walk to the designated rideshare pickup zone. Show your driver the app booking." },
      { icon: "🛵", label: "Scooter Rental", price: "Rp 70,000–120,000 per day", tip: "Widely used. Requires international driving licence technically, though rarely checked. Wear a helmet always." },
    ],
    areas: ["Kuta / Legian — party & budget", "Seminyak — upscale, restaurants, beach clubs", "Canggu — digital nomad, surfers, trendy cafes", "Ubud — spiritual, rice terraces, arts", "Nusa Dua — luxury resorts, quieter", "Sanur — relaxed, family-friendly, calmer sea"],
    hotels: [
      { tier: "Budget", area: "Kuta / Legian", priceRange: "Rp 150k–350k/night (~$10–23)", note: "Hundreds of guesthouses. Clean, good value. Noisy at night near main strip." },
      { tier: "Mid-range", area: "Seminyak / Canggu", priceRange: "Rp 500k–1.5M/night (~$33–100)", note: "Private villas with pool widely available. Great value vs Western hotels." },
      { tier: "Luxury", area: "Nusa Dua / Ubud", priceRange: "Rp 1.5M–10M+/night (~$100–650+)", note: "World-class resorts. Four Seasons, Mandapa, COMO Shambhala." },
    ],
    embassy: "Most embassies are in Jakarta. Bali has US Consular Agency (Renon, Denpasar), Australian Consulate-General (Renon), and several European honorary consulates. Emergency: call your Jakarta embassy.",
  },
  {
    id: "jakarta",
    name: "Jakarta",
    emoji: "🏙️",
    tagline: "Capital city — massive, modern, chaotic, and exciting. Economic and cultural centre",
    airports: [{ name: "Soekarno-Hatta International Airport", code: "CGK", note: "Located in Tangerang, 45–120 min to central Jakarta depending on traffic" }],
    transport: [
      { icon: "🚆", label: "Airport Railink Train (recommended)", price: "Rp 70,000 · 35–40 min to Sudirman/Dukuh Atas", tip: "BEST option. Fast, air-conditioned, no traffic. Connects to MRT and TransJakarta bus network." },
      { icon: "🚕", label: "Bluebird Taxi (official, metered)", price: "Rp 150,000–350,000 to central Jakarta", tip: "Use Bluebird (blue cars) or MyBluebird app. Metered and honest. Avoid unmarked taxis." },
      { icon: "📱", label: "Grab / Gojek (app-based)", price: "Rp 100,000–250,000 to central Jakarta", tip: "Pick up from designated rideshare zone outside arrivals. Reliable and fair-priced." },
      { icon: "🚌", label: "Damri Bus (budget)", price: "Rp 40,000–60,000 to various city points", tip: "Cheap but slow. Stops at major hotels and Gambir train station. Good for budget travel." },
    ],
    areas: ["Sudirman / SCBD — business, expat hub, modern malls", "Menteng — leafy, central, boutique hotels", "Kemang — expat-friendly, restaurants, bars, relaxed", "Kota Tua — historic area, heritage buildings, cultural sights", "Senayan — sports, malls, upscale dining"],
    hotels: [
      { tier: "Budget", area: "Menteng / Gambir area", priceRange: "Rp 200k–500k/night (~$13–33)", note: "City guesthouses and budget business hotels. Clean and central." },
      { tier: "Mid-range", area: "Sudirman / Thamrin", priceRange: "Rp 600k–1.5M/night (~$40–100)", note: "International chain hotels. Often include breakfast. Good base for exploring." },
      { tier: "Luxury", area: "SCBD / Senayan", priceRange: "Rp 1.5M–8M+/night (~$100–530+)", note: "Raffles, Four Seasons, The Ritz-Carlton. World-class service." },
    ],
    embassy: "Jakarta hosts embassies from virtually every country. Most are in the Kuningan and Menteng districts. Key: US Embassy (Jl. Merdeka Selatan), Australian Embassy (Jl. Rasuna Said), UK Embassy (Jl. Patra), EU delegations all nearby. Search '[your country] embassy Jakarta' for exact address.",
  },
  {
    id: "yogyakarta",
    name: "Yogyakarta",
    emoji: "🏛️",
    tagline: "Cultural heart of Java — arts, history, Borobudur, Prambanan, royal palace, batik",
    airports: [
      { name: "Yogyakarta International Airport (new)", code: "YIA", note: "45km west of city. Take DAMRI bus or taxi to city" },
      { name: "Adisutjipto Airport (old, domestic)", code: "JOG", note: "7km from city centre — very convenient" },
    ],
    transport: [
      { icon: "🚌", label: "DAMRI Bus from YIA", price: "Rp 40,000–60,000 to city", tip: "From the new YIA airport, DAMRI buses connect directly to central Yogya. Comfortable and reliable." },
      { icon: "🚕", label: "Taxi (metered or app)", price: "Rp 50,000–120,000 from JOG / Rp 200,000–300,000 from YIA", tip: "Gojek and Grab are widely used in Yogya. Very affordable for getting around the city." },
      { icon: "🛵", label: "Scooter Rental", price: "Rp 70,000–100,000 per day", tip: "Ideal for Yogya — roads are manageable and most sights are within 30 min scooter ride." },
      { icon: "🚲", label: "Becak (cycle rickshaw) / Andong (horse cart)", price: "Rp 20,000–60,000 short trips", tip: "Part of the Yogya experience. Negotiate price before boarding. Great around Keraton and Malioboro." },
    ],
    areas: ["Malioboro — iconic shopping street, central, lively", "Prawirotaman — boutique hotels, art galleries, Western-friendly cafes", "Kraton area — near royal palace, traditional atmosphere", "Lembah UGM — near university, young and vibrant"],
    hotels: [
      { tier: "Budget", area: "Malioboro / Sosrowijayan", priceRange: "Rp 100k–300k/night (~$7–20)", note: "Backpacker guesthouses. Great social atmosphere. Very close to main sights." },
      { tier: "Mid-range", area: "Prawirotaman", priceRange: "Rp 400k–1.2M/night (~$27–80)", note: "Charming boutique heritage hotels. Quiet, artistic neighbourhood. Highly recommended." },
      { tier: "Luxury", area: "Ring Road / Kaliurang", priceRange: "Rp 1M–5M+/night (~$65–330+)", note: "Hyatt, Royal Ambarrukmo. Full facilities." },
    ],
    embassy: "No foreign embassies in Yogyakarta. Nearest are in Jakarta (2 hrs by flight, ~8 hrs by train). Australian Consulate-General in Surabaya is another option. For emergencies, contact local police (Polda DIY) and your Jakarta embassy by phone.",
  },
  {
    id: "bandung",
    name: "Bandung",
    emoji: "☕",
    tagline: "City of cool air, fashion, coffee culture, creative scene, and stunning highland scenery",
    airports: [
      { name: "Husein Sastranegara Airport", code: "BDO", note: "Very close to city — 15 min to most hotels" },
      { name: "Kertajati Airport (new, larger)", code: "KJT", note: "100km from Bandung city. Shuttle buses connect to the city (~2 hrs)" },
    ],
    transport: [
      { icon: "🚆", label: "Train from Jakarta (recommended)", price: "Rp 100,000–350,000 · 3–4 hrs (Argo Parahyangan / Lodaya)", tip: "Arguably the most scenic and pleasant way to arrive. Book on KAI Access app. Executive class is very comfortable." },
      { icon: "🚕", label: "Taxi from BDO", price: "Rp 50,000–100,000 to city hotels", tip: "Short ride from Husein Airport to most city areas. Use Grab/Gojek from the airport or a metered taxi." },
      { icon: "🚌", label: "Shuttle from Kertajati", price: "Rp 60,000–80,000 to Bandung city", tip: "Damri and private shuttle services run between Kertajati and central Bandung. Allow 1.5–2 hrs." },
      { icon: "📱", label: "Grab / Gojek", price: "Very affordable within city — Rp 10,000–50,000", tip: "Essential in Bandung. Traffic can be heavy on weekends when Jakarta tourists visit." },
    ],
    areas: ["Dago — upscale, cafe-lined, cool breezes, trendy restaurants", "Jalan Braga — heritage colonial street, boutiques, galleries", "Lembang — highland 30 min north, fresh air, strawberry farms, cooler temperatures", "Cihampelas — jeans street, shopping, dense with clothing outlets", "Setiabudhi — middle-class residential, good warung scene"],
    hotels: [
      { tier: "Budget", area: "City centre / Braga", priceRange: "Rp 150k–350k/night (~$10–23)", note: "Dozens of clean guesthouses. Heritage architecture. Walking distance to sights." },
      { tier: "Mid-range", area: "Dago / Setiabudhi", priceRange: "Rp 400k–1.2M/night (~$27–80)", note: "Comfortable modern hotels. Great breakfast options. Easy access to Dago cafes." },
      { tier: "Luxury", area: "Dago / Lembang", priceRange: "Rp 1M–4M+/night (~$65–265+)", note: "Trans Luxury Hotel, Padma Hotel Bandung (Lembang — stunning views)." },
    ],
    embassy: "No embassies in Bandung. Nearest are in Jakarta, roughly 3–4 hrs by road or 45 min by flight. Contact your Jakarta embassy by phone for consular assistance. Bandung has a strong expat community — the international schools can also provide emergency contact resources.",
  },
  {
    id: "surabaya",
    name: "Surabaya",
    emoji: "⚓",
    tagline: "Indonesia's second city — port city, industrial hub, proud Javanese-Madurese culture",
    airports: [{ name: "Juanda International Airport", code: "SUB", note: "Located in Sidoarjo, ~30 min south of city centre" }],
    transport: [
      { icon: "🚌", label: "Damri Bus", price: "Rp 25,000–45,000 to city terminals", tip: "Budget option. Runs to major points including Bungurasih bus terminal and various hotels." },
      { icon: "🚕", label: "Taxi (metered)", price: "Rp 100,000–180,000 to city centre", tip: "Use Blue Bird (Bluebird group) for metered honest service. Avoid tout drivers." },
      { icon: "📱", label: "Grab / Gojek", price: "Rp 70,000–140,000 to city", tip: "Designated rideshare pickup area outside arrivals. Very reliable in Surabaya." },
    ],
    areas: ["Tunjungan / Basuki Rahmat — city centre, malls, business hotels", "Gubeng — residential, near train station, comfortable mid-range options", "Darmo — upscale residential, good restaurant strip", "Kenjeran — coastal area, seafood restaurants, local experience"],
    hotels: [
      { tier: "Budget", area: "Gubeng / Tunjungan", priceRange: "Rp 180k–400k/night (~$12–27)", note: "Clean business guesthouses. Practical for exploring the city." },
      { tier: "Mid-range", area: "Darmo / Basuki Rahmat", priceRange: "Rp 500k–1.2M/night (~$33–80)", note: "International chains like Ibis, Swiss-Belhotel. Good breakfast included." },
      { tier: "Luxury", area: "Tunjungan Plaza area", priceRange: "Rp 1.5M–6M+/night (~$100–400+)", note: "JW Marriott, Westin, Sheraton. World-class facilities." },
    ],
    embassy: "Australian Consulate-General is located in Surabaya (Jl. Darmo, main consular office for East Java region). Most other countries' embassies are in Jakarta. US, UK, EU — contact Jakarta embassies for assistance.",
  },
  {
    id: "lombok",
    name: "Lombok",
    emoji: "🏝️",
    tagline: "Quieter, more authentic than Bali — pristine beaches, Sasak culture, Mount Rinjani",
    airports: [{ name: "Lombok International Airport", code: "LOP", note: "Located in Praya, Central Lombok — ~30 min south of Mataram city" }],
    transport: [
      { icon: "🚕", label: "Official taxi (fixed price counter)", price: "Mataram Rp 100k · Senggigi Rp 120k · Kuta Lombok Rp 150k", tip: "Use the official counter inside arrivals. Prices are fixed and posted clearly." },
      { icon: "📱", label: "Grab / Gojek", price: "Available but limited coverage vs Bali/Java", tip: "Available in main areas. Coverage is expanding. May need to walk slightly from airport to pickup zone." },
      { icon: "🛵", label: "Scooter Rental", price: "Rp 60,000–90,000 per day", tip: "Essential for exploring Lombok's coast and interior. Roads are good in main areas." },
    ],
    areas: ["Senggigi — main tourist strip, beach, bars, restaurants", "Kuta Lombok (south) — stunning beaches, quieter, backpacker scene growing", "Mataram — the capital, very local, less tourist infrastructure", "Gili Islands — Trawangan (party), Meno (romantic), Air (snorkelling) — 30–45 min boat from Bangsal"],
    hotels: [
      { tier: "Budget", area: "Senggigi / Kuta Lombok", priceRange: "Rp 150k–350k/night (~$10–23)", note: "Guesthouses and small bungalows. Charming and well-located." },
      { tier: "Mid-range", area: "Senggigi / Gili T", priceRange: "Rp 400k–1.2M/night (~$27–80)", note: "Beach resorts with pools. Very good value. Gili Trawangan has excellent options." },
      { tier: "Luxury", area: "South Lombok coast", priceRange: "Rp 1.5M–8M+/night (~$100–530+)", note: "Jeeva Beloam, The Oberoi, Katamaran Resort. World-class and far less crowded than Bali." },
    ],
    embassy: "No embassies on Lombok. Nearest consular services are in Bali (US, Australian consular agents) or Jakarta. Emergency contact through Bali options is quickest. Local police emergency: 110.",
  },
];

// ── Universal section data ────────────────────────────────────────────────────

const FOOD_PRICES = [
  { place: "Street food stall (kaki lima)", examples: "Nasi goreng, mie goreng, bakso, satay", price: "Rp 8,000–25,000", usd: "~$0.50–$1.70", tip: "The best food in Indonesia. Fresh, fast, cooked in front of you. A full meal under $1.50." },
  { place: "Local warung (small restaurant)", examples: "Nasi padang, soto, pecel, gado-gado", price: "Rp 20,000–50,000", usd: "~$1.30–$3.30", tip: "Family-run, home-style cooking. Often the most delicious option. Water included." },
  { place: "Shopee Food / GoFood prices", examples: "Delivery from local restaurants", price: "Rp 15,000–60,000 + delivery", usd: "~$1–$4 + delivery fee", tip: "Use this to benchmark fair local food prices before you walk into any restaurant." },
  { place: "Mall food court (e.g. Grand Indonesia)", examples: "Yoshinoya, local fast food, noodles", price: "Rp 35,000–80,000", usd: "~$2.30–$5.30", tip: "Clean, air-conditioned, consistent quality. Good mid-point option." },
  { place: "Mid-range restaurant", examples: "Bebek goreng, grilled fish, Western menu", price: "Rp 60,000–200,000", usd: "~$4–$13", tip: "Widely available. Quality varies. Indonesian restaurants at this level are often excellent." },
  { place: "Tourist / expat restaurant", examples: "Burgers, pasta, brunch cafes", price: "Rp 100,000–350,000", usd: "~$7–$23", tip: "Prices approaching Western levels. Fine for variety but daily eating here is unnecessary." },
  { place: "Beachfront / rooftop dining (Bali)", examples: "Sunsets, cocktails, grilled seafood", price: "Rp 150,000–600,000+", usd: "~$10–$40+", tip: "Worth it for the experience occasionally. A romantic dinner at a great beach restaurant is still far cheaper than Europe." },
  { place: "Airport food & drink", examples: "Any café, restaurant or even water", price: "Rp 50,000–300,000+", usd: "~$3.30–$20+", tip: "Always 3–8× street price. Eat before you arrive at the airport, or bring snacks for the flight." },
  { place: "Hotel restaurant (international chain)", examples: "Breakfast buffet, room service", price: "Rp 100,000–500,000+", usd: "~$7–$33+", tip: "Convenient but expensive. Breakfast included is a real saving — choose hotels that offer it." },
];

const SIM_PROVIDERS = [
  { name: "Telkomsel (Simpati / As / Loop)", coverage: "Best nationwide coverage — essential outside cities", price: "Starter pack Rp 25k–50k · Data bundles Rp 50k–100k/month", note: "Market leader. Strongest signal in rural areas, highlands, and islands. Slightly pricier but worth it." },
  { name: "XL Axiata", coverage: "Excellent in Java, Bali, Sumatra", price: "Starter pack Rp 10k–25k · Data bundles Rp 40k–80k/month", note: "Very competitive data packages. Good choice if staying in major cities." },
  { name: "Indosat Ooredoo (IM3)", coverage: "Good in Java and Bali, improving nationally", price: "Starter pack Rp 10k–20k · Data bundles Rp 35k–75k/month", note: "Budget-friendly. Freedom Internet packages popular with younger Indonesians." },
];

const VISA_OPTIONS = [
  { type: "Visa on Arrival (B213)", duration: "30 days", cost: "USD $35", note: "Available at major international airports and seaports. Extendable once for another 30 days at any Immigration office (~Rp 350,000). Total 60 days possible. Available to 100+ nationalities." },
  { type: "Tourist Visa (B211)", duration: "60 days", cost: "USD $50–70 (applied online)", note: "Apply via evisa.imigrasi.go.id before travelling. More flexibility than VoA. Can be extended." },
  { type: "Social / Cultural Visa (B211A)", duration: "60 days + up to 5 extensions", cost: "USD $50–70 + extension fees", note: "Requires a sponsor letter from an Indonesian citizen or organisation. Total stay can reach 6 months. Ideal for serious relationships." },
  { type: "KITAS (Limited Stay Permit)", duration: "1–2 years (renewable)", cost: "Varies — requires legal processing", note: "For those married to an Indonesian citizen. Requires official state-registered marriage certificate. Gives right of permanent residency path (KITAP after 5 years)." },
];

const BULE_TIPS = [
  { icon: "💡", tip: "The word 'bule' (foreigner) is not offensive — it is how Indonesians commonly refer to Westerners. It is descriptive, not derogatory. Embrace it with good humour." },
  { icon: "💰", tip: "Two-tier pricing is real and widely accepted. Markets, becak drivers, and some tourist services will quote higher to foreigners. This is cultural and not dishonest in local context — it has existed for generations." },
  { icon: "📱", tip: "The single most powerful tool to access local pricing is Grab or Gojek. Transport via app = transparent, local pricing. Negotiating with a street driver = tourist price. Always use the app." },
  { icon: "🛒", tip: "In malls, supermarkets (Indomaret, Alfamart, Carrefour), and fixed-price shops — prices are the same for everyone. No negotiation needed or expected." },
  { icon: "🤝", tip: "When shopping in markets or with local vendors, having your Indonesian partner or friend with you naturally shifts the dynamic. Local presence, local price. This is one of the genuine joys of building a local connection." },
  { icon: "🗣️", tip: "Learning even 10 words of Bahasa Indonesia changes everything. 'Berapa?' (how much?), 'Mahal' (expensive), 'Murah' (cheap), 'Terima kasih' (thank you). Vendors respect the effort enormously." },
  { icon: "⏳", tip: "Integration takes time and is a natural process. The longer you spend in a neighbourhood, visiting the same warungs, greeting the same neighbours, the more you are treated as a local. Patience and genuine respect are the only path." },
  { icon: "😊", tip: "Never show frustration or anger when negotiating prices. Indonesian culture values calm, warmth, and face-saving above all. A smile and a gentle 'kurang sedikit?' (a little less?) will always get further than any argument." },
];

// ── Collapsible section wrapper ──────────────────────────────────────────────
function Section({ emoji, title, subtitle, children, defaultOpen = false, accentColor = "rgba(236,72,153,0.8)" }: {
  emoji: string; title: string; subtitle?: string; children: React.ReactNode;
  defaultOpen?: boolean; accentColor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${accentColor}35`, background: `linear-gradient(135deg, ${accentColor}0d, rgba(0,0,0,0.3))`, marginBottom: 10 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", padding: "13px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, width: 38, height: 38, borderRadius: 10, background: `${accentColor}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{emoji}</span>
          <div style={{ textAlign: "left" }}>
            <p style={{ color: "white", fontWeight: 700, fontSize: 13, margin: 0 }}>{title}</p>
            {subtitle && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>{open ? "Tap to close" : subtitle}</p>}
          </div>
        </div>
        {open ? <ChevronUp size={15} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={15} color="rgba(255,255,255,0.4)" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 14px 14px" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoCard({ children, accent = "rgba(255,255,255,0.07)" }: { children: React.ReactNode; accent?: string }) {
  return <div style={{ background: accent, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>{children}</div>;
}

// ── Main component ────────────────────────────────────────────────────────────
interface VisitorGuidePageProps {
  onClose: () => void;
}

export default function VisitorGuidePage({ onClose }: VisitorGuidePageProps) {
  const [selectedCity, setSelectedCity] = useState<string>("bali");
  const city = CITIES.find(c => c.id === selectedCity)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.25 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "linear-gradient(160deg, #0a1628 0%, #0d0d1a 45%, #0a1a14 100%)",
        overflowY: "auto", overflowX: "hidden", fontFamily: "inherit",
      }}
    >
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10, background: "rgba(8,12,28,0.95)",
        backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "13px 16px 11px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>✈️</span>
          <div>
            <p style={{ color: "white", fontWeight: 800, fontSize: 15, margin: 0 }}>Visitor Guide</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>Everything you need to visit Indonesia</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "white", display: "flex", alignItems: "center" }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: "14px 14px 36px" }}>

        {/* Hero */}
        <div style={{ borderRadius: 16, background: "linear-gradient(135deg, rgba(14,90,50,0.25), rgba(14,50,100,0.2))", border: "1px solid rgba(34,197,94,0.2)", padding: "14px 16px", marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 32, flexShrink: 0 }}>🇮🇩</span>
          <div>
            <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: "0 0 5px" }}>Planning to visit your match?</p>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, lineHeight: 1.65, margin: 0 }}>
              This guide covers airports, transport, hotels, food prices, SIM cards, apps and visas for each major city. All prices are in Indonesian Rupiah (IDR). Current exchange: <span style={{ color: "rgba(255,200,80,0.9)", fontWeight: 600 }}>Rp 15,000–16,000 ≈ USD $1</span>. Always verify visa requirements before travelling.
            </p>
          </div>
        </div>

        {/* City selector */}
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Select her city</p>
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 8, marginBottom: 14 }}>
          {CITIES.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCity(c.id)}
              style={{
                flexShrink: 0, padding: "8px 12px", borderRadius: 12, cursor: "pointer",
                background: selectedCity === c.id ? "linear-gradient(135deg, rgba(34,197,94,0.35), rgba(14,80,50,0.4))" : "rgba(255,255,255,0.06)",
                border: selectedCity === c.id ? "1.5px solid rgba(34,197,94,0.5)" : "1px solid rgba(255,255,255,0.1)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              }}
            >
              <span style={{ fontSize: 18 }}>{c.emoji}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: selectedCity === c.id ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>{c.name}</span>
            </button>
          ))}
        </div>

        {/* City tagline */}
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px", marginBottom: 12, borderLeft: "3px solid rgba(34,197,94,0.5)" }}>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, margin: 0 }}>{city.emoji} <strong>{city.name}</strong> — {city.tagline}</p>
        </div>

        {/* ── Airport & Transport ── */}
        <Section emoji="✈️" title="Airport & Getting There" subtitle="Terminals, transport options and honest pricing" accentColor="rgba(99,179,237,0.8)" defaultOpen>
          {city.airports.map((a, i) => (
            <InfoCard key={i} accent="rgba(99,179,237,0.08)">
              <p style={{ color: "rgba(99,179,237,0.9)", fontWeight: 700, fontSize: 12, margin: "0 0 3px" }}>
                <Plane size={11} style={{ display: "inline", marginRight: 5 }} />{a.name} ({a.code})
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: 0 }}>{a.note}</p>
            </InfoCard>
          ))}
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: "12px 0 6px" }}>Transport options</p>
          {city.transport.map((t, i) => (
            <InfoCard key={i} accent="rgba(255,255,255,0.05)">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                <p style={{ color: "white", fontWeight: 700, fontSize: 12, margin: 0 }}>{t.icon} {t.label}</p>
                <span style={{ fontSize: 10, color: "rgba(255,200,80,0.9)", fontWeight: 700, background: "rgba(255,200,0,0.1)", borderRadius: 6, padding: "2px 7px", flexShrink: 0 }}>{t.price}</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: 0, lineHeight: 1.55 }}>{t.tip}</p>
            </InfoCard>
          ))}
        </Section>

        {/* ── Where to Stay ── */}
        <Section emoji="🏨" title="Where to Stay" subtitle={`Recommended areas and price tiers in ${city.name}`} accentColor="rgba(167,139,250,0.8)">
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 8px" }}>Best areas</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
            {city.areas.map((a, i) => (
              <span key={i} style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 8, padding: "4px 9px", fontSize: 10, color: "rgba(255,255,255,0.75)" }}>{a}</span>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 8px" }}>Price guide</p>
          {city.hotels.map((h, i) => (
            <InfoCard key={i} accent="rgba(167,139,250,0.07)">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 3 }}>
                <p style={{ color: "rgba(167,139,250,0.9)", fontWeight: 700, fontSize: 12, margin: 0 }}>{h.tier} · {h.area}</p>
                <span style={{ fontSize: 10, color: "rgba(255,200,80,0.9)", fontWeight: 700, background: "rgba(255,200,0,0.1)", borderRadius: 6, padding: "2px 7px", flexShrink: 0 }}>{h.priceRange}</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: 0 }}>{h.note}</p>
            </InfoCard>
          ))}
        </Section>

        {/* ── Embassy ── */}
        <Section emoji="🏛️" title="Embassy & Consular Contacts" subtitle="Emergency contacts and nearest consular services" accentColor="rgba(251,191,36,0.8)">
          <InfoCard accent="rgba(251,191,36,0.08)">
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 1.65, margin: "0 0 8px" }}>{city.embassy}</p>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <p style={{ color: "rgba(251,191,36,0.9)", fontSize: 11, fontWeight: 600, margin: 0 }}>🇮🇩 Indonesian Emergency Number: <strong>112</strong></p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: 0 }}>Search "[your country] embassy Jakarta" for exact address and emergency phone number. Save it in your phone before arrival.</p>
            </div>
          </InfoCard>
        </Section>

        {/* ── Marriage Services ── */}
        <Section emoji="💍" title="Marriage & Legal Services" subtitle="For serious relationships — what you need to know" accentColor="rgba(236,72,153,0.8)">
          <InfoCard accent="rgba(236,72,153,0.08)">
            <p style={{ color: "rgba(236,72,153,0.9)", fontWeight: 700, fontSize: 12, margin: "0 0 6px" }}>Marrying an Indonesian citizen as a foreigner</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                "You must be legally single — bring a certified 'Certificate of No Impediment' (CNI) or equivalent from your home country",
                "If previously divorced: bring your official divorce certificate, apostilled and translated to Bahasa Indonesia by a certified translator",
                "Religious marriage first (nikah for Muslims, church ceremony for Christians, etc.) then state registration at Dinas Kependudukan",
                "After legal marriage: apply for KITAS (spousal stay permit) at Indonesian Immigration",
                "After 5 years on KITAS: eligible to apply for KITAP (permanent stay permit)",
                "Your embassy in Jakarta can issue the CNI and advise on your specific country's requirements",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: "rgba(236,72,153,0.7)", fontSize: 12, flexShrink: 0, marginTop: 1 }}>→</span>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, margin: 0, lineHeight: 1.55 }}>{item}</p>
                </div>
              ))}
            </div>
          </InfoCard>
          <div style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.25)", borderRadius: 10, padding: "11px 13px", display: "flex", alignItems: "center", gap: 10 }}>
            <Heart size={18} color="rgba(236,72,153,0.9)" fill="rgba(236,72,153,0.4)" />
            <div>
              <p style={{ color: "white", fontWeight: 700, fontSize: 12, margin: "0 0 2px" }}>2DateMe Marriage Concierge</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: 0 }}>Our partner service guides you through every legal step — coming soon</p>
            </div>
          </div>
        </Section>

        {/* ── UNIVERSAL SECTIONS ── */}

        {/* Food prices */}
        <Section emoji="🍜" title="Food Price Guide" subtitle="Street food vs warung vs restaurant vs airport — know what's fair" accentColor="rgba(251,146,60,0.8)">
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {FOOD_PRICES.map((f, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "9px 11px", borderLeft: `3px solid ${i < 3 ? "rgba(34,197,94,0.5)" : i < 6 ? "rgba(251,146,60,0.5)" : "rgba(239,68,68,0.5)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 3 }}>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 11, margin: 0 }}>{f.place}</p>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ color: "rgba(255,200,80,0.9)", fontSize: 10, fontWeight: 700, margin: 0 }}>{f.price}</p>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, margin: 0 }}>{f.usd}</p>
                  </div>
                </div>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, margin: "0 0 3px", fontStyle: "italic" }}>{f.examples}</p>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: 0, lineHeight: 1.5 }}>{f.tip}</p>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "10px 12px", marginTop: 6 }}>
            <p style={{ color: "rgba(34,197,94,0.9)", fontWeight: 700, fontSize: 11, margin: "0 0 4px" }}>💡 The Golden Rule</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, margin: 0, lineHeight: 1.55 }}>Check Shopee Food or GoFood delivery prices for a restaurant before you sit down. If the delivery price and the in-restaurant menu price are wildly different — negotiate or walk.</p>
          </div>
        </Section>

        {/* Apps */}
        <Section emoji="📱" title="Essential Apps to Download" subtitle="Download before you land — these change everything" accentColor="rgba(99,179,237,0.8)" defaultOpen>
          {[
            {
              name: "Gojek",
              flag: "🇮🇩",
              desc: "Indonesia's super-app. GoRide (motorbike taxi), GoCar, GoFood (food delivery), GoMart (shopping), GoPay (cashless payment). Supports English and multiple languages.",
              why: "The single most important app for any visitor. Transport, food and payments all in one. Prices are transparent, fair and far below negotiated street rates.",
              search: "Search 'Gojek' on Google Play or Apple App Store",
              color: "rgba(0,185,107,0.9)",
            },
            {
              name: "Grab",
              flag: "🌏",
              desc: "Southeast Asia's leading ride and delivery app. Excellent English interface. GrabCar, GrabBike, GrabFood, GrabExpress. Available across Indonesia.",
              why: "Strong alternative to Gojek — often has better availability in certain areas. Prices are app-fixed and fair. GrabFood shows you real local restaurant prices.",
              search: "Search 'Grab' on Google Play or Apple App Store",
              color: "rgba(0,177,79,0.9)",
            },
            {
              name: "Shopee / Shopee Food",
              flag: "🛒",
              desc: "Indonesia's dominant e-commerce and food delivery platform. Shopee Food shows local restaurant menus at genuine Indonesian prices.",
              why: "Use it as a price reference tool. If you want to know what a plate of food SHOULD cost at a local restaurant, check Shopee Food delivery price first. This protects you from overcharging.",
              search: "Search 'Shopee' or 'ShopeeFood' on app stores",
              color: "rgba(238,77,45,0.9)",
            },
            {
              name: "Google Translate",
              flag: "🗣️",
              desc: "Camera translate works on Bahasa Indonesia menus, signs and written text. Download the Indonesian language pack offline before you fly.",
              why: "Essential for reading menus, signs, and messages. The camera mode translates text in real-time through your phone camera — a complete game-changer in local warungs.",
              search: "Search 'Google Translate' — download Indonesian language pack",
              color: "rgba(66,133,244,0.9)",
            },
            {
              name: "Google Maps",
              flag: "🗺️",
              desc: "Works excellently in Indonesia. Download offline maps for your city before arrival in case of poor data signal.",
              why: "Navigation, finding restaurants, checking opening hours. Works with Grab/Gojek links. Download the offline map for your region before you leave WiFi.",
              search: "Search 'Google Maps' — download offline map for your region",
              color: "rgba(234,67,53,0.9)",
            },
          ].map((app, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 13px", marginBottom: 8, borderLeft: `3px solid ${app.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{app.flag}</span>
                <p style={{ color: "white", fontWeight: 800, fontSize: 13, margin: 0 }}>{app.name}</p>
              </div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, lineHeight: 1.55, margin: "0 0 5px" }}>{app.desc}</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, lineHeight: 1.5, margin: "0 0 6px", fontStyle: "italic" }}>Why it matters: {app.why}</p>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "5px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                <Smartphone size={11} color="rgba(255,255,255,0.4)" />
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: 0 }}>{app.search}</p>
              </div>
            </div>
          ))}
        </Section>

        {/* SIM card */}
        <Section emoji="📶" title="Get a SIM Card — Most Important Purchase" subtitle="Changes everything about how you pay and move in Indonesia" accentColor="rgba(34,197,94,0.8)">
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "11px 13px", marginBottom: 10 }}>
            <p style={{ color: "rgba(34,197,94,0.95)", fontWeight: 700, fontSize: 12, margin: "0 0 5px" }}>Why this is the first thing to do after landing</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                "Transport: Grab/Gojek requires mobile data — without it you pay negotiated 'tourist price' for every ride (often 3–5× higher)",
                "Communication: WhatsApp with your match for free (no roaming charges)",
                "Navigation: Google Maps works offline if downloaded, but live updates need data",
                "Food: GoFood and Shopee Food delivery requires data — shows real local menu prices",
                "Payments: GoPay and OVO digital wallets require data for real-time transactions",
                "Safety: You can call emergency services, your match, and your embassy at any time",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                  <span style={{ color: "rgba(34,197,94,0.7)", fontSize: 11, flexShrink: 0 }}>✓</span>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, margin: 0, lineHeight: 1.5 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 8px" }}>Where to buy</p>
          {[
            { place: "Airport SIM kiosks (arrival hall)", note: "Most convenient. Telkomsel, XL and Indosat counters at all major airports. Tourist-friendly staff. You will need your passport." },
            { place: "Indomaret / Alfamart (24-hour convenience stores)", note: "Everywhere in Indonesia — literally every 100m in cities. Sell SIM starter packs and top-up credit. Cheapest option." },
            { place: "Authorized carrier shops", note: "Telkomsel GraPARI, XL Centre, myIM3 outlets in malls. Best for larger data bundles and full registration assistance." },
          ].map((s, i) => (
            <InfoCard key={i} accent="rgba(34,197,94,0.07)">
              <p style={{ color: "rgba(34,197,94,0.85)", fontWeight: 700, fontSize: 12, margin: "0 0 3px" }}>{s.place}</p>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: 0 }}>{s.note}</p>
            </InfoCard>
          ))}

          <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
            <p style={{ color: "rgba(251,191,36,0.9)", fontWeight: 700, fontSize: 11, margin: "0 0 3px" }}>📋 You must bring your passport</p>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: 0 }}>Since 2018, Indonesian law requires passport registration for all SIM cards. The process takes 5 minutes at the counter.</p>
          </div>

          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: "10px 0 8px" }}>Best providers</p>
          {SIM_PROVIDERS.map((s, i) => (
            <InfoCard key={i}>
              <p style={{ color: "rgba(34,197,94,0.9)", fontWeight: 700, fontSize: 12, margin: "0 0 2px" }}>{s.name}</p>
              <p style={{ color: "rgba(255,200,80,0.85)", fontSize: 10, fontWeight: 600, margin: "0 0 3px" }}>📡 {s.coverage}</p>
              <p style={{ color: "rgba(255,200,80,0.75)", fontSize: 10, margin: "0 0 4px" }}>💰 {s.price}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: 0 }}>{s.note}</p>
            </InfoCard>
          ))}
        </Section>

        {/* Visa */}
        <Section emoji="🛂" title="Visa & Stay Permits" subtitle="Entry, extension and long-term options" accentColor="rgba(251,191,36,0.8)">
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <p style={{ color: "rgba(239,68,68,0.9)", fontWeight: 700, fontSize: 11, margin: "0 0 3px" }}>⚠️ Always verify current requirements</p>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: 0 }}>Visa rules change. Confirm before booking at <strong style={{ color: "rgba(255,255,255,0.8)" }}>evisa.imigrasi.go.id</strong> or your country's Indonesian embassy website.</p>
          </div>
          {VISA_OPTIONS.map((v, i) => (
            <InfoCard key={i} accent="rgba(251,191,36,0.07)">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                <p style={{ color: "rgba(251,191,36,0.95)", fontWeight: 700, fontSize: 12, margin: 0 }}>{v.type}</p>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ color: "rgba(255,200,80,0.9)", fontSize: 10, fontWeight: 700, margin: 0 }}>{v.cost}</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, margin: 0 }}>{v.duration}</p>
                </div>
              </div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, margin: 0, lineHeight: 1.55 }}>{v.note}</p>
            </InfoCard>
          ))}
        </Section>

        {/* Bule price / integration */}
        <Section emoji="🤝" title="Foreigner Pricing — What to Expect" subtitle="Honest guide to 'bule price' and how integration changes things" accentColor="rgba(167,139,250,0.8)">
          <div style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <p style={{ color: "rgba(167,139,250,0.9)", fontWeight: 700, fontSize: 12, margin: "0 0 5px" }}>Understanding two-tier pricing in Indonesia</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, lineHeight: 1.65, margin: 0 }}>
              In Indonesia, foreigners (called <strong>'bule'</strong> — not derogatory, simply descriptive) are commonly charged higher prices in markets, tourist areas, and by informal service providers. This is a centuries-old cultural practice tied to visible economic disparity. It is widely accepted locally and not considered dishonest in its traditional context.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {BULE_TIPS.map((t, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "9px 11px", borderLeft: "3px solid rgba(167,139,250,0.4)" }}>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, lineHeight: 1.55, margin: 0 }}><span style={{ marginRight: 6 }}>{t.icon}</span>{t.tip}</p>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "10px 12px", marginTop: 8 }}>
            <p style={{ color: "rgba(34,197,94,0.9)", fontWeight: 700, fontSize: 11, margin: "0 0 4px" }}>The long game</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, lineHeight: 1.6, margin: 0 }}>Visitors who spend extended time in a neighbourhood, visit the same warungs, greet neighbours by name, and show genuine respect for local life — gradually transition from 'tourist bule' to 'regular bule' to simply a welcomed familiar face. This is the most rewarding integration and it happens naturally, on Indonesian time.</p>
          </div>
        </Section>

        {/* Footer */}
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "13px", textAlign: "center", marginTop: 4 }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, lineHeight: 1.6, margin: "0 0 6px" }}>
            All prices are approximate and subject to change. Exchange rates fluctuate — verify current rates before travel.
          </p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, margin: 0 }}>
            Visa requirements, embassy locations and immigration rules should always be confirmed through official government sources before booking travel.
          </p>
        </div>

      </div>
    </motion.div>
  );
}
