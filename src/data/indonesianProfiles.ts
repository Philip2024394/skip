import { Profile } from "@/components/SwipeCard";
import indoGirl1 from "@/assets/indo-girl-1.png";
import indoGirl2 from "@/assets/indo-girl-2.png";
import indoGirl3 from "@/assets/indo-girl-3.png";
import indoGirl4 from "@/assets/indo-girl-4.png";
import indoGirl5 from "@/assets/indo-girl-5.png";
import indoGirl6 from "@/assets/indo-girl-6.png";
import indoGirl7 from "@/assets/indo-girl-7.png";
import indoGirl8 from "@/assets/indo-girl-8.png";
import indoGirl9 from "@/assets/indo-girl-9.png";
import indoGirl10 from "@/assets/indo-girl-10.png";
import indoGirl11 from "@/assets/indo-girl-11.png";
import indoGirl12 from "@/assets/indo-girl-12.png";
import indoGirl13 from "@/assets/indo-girl-13.png";
import indoGirl14 from "@/assets/indo-girl-14.png";
import indoGirl15 from "@/assets/indo-girl-15.png";
import indoGirl16 from "@/assets/indo-girl-16.png";
import indoGirl17 from "@/assets/indo-girl-17.png";
import indoGirl18 from "@/assets/indo-girl-18.png";
import indoGirl19 from "@/assets/indo-girl-19.png";
import indoGirl20 from "@/assets/indo-girl-20.png";
import indoGirl21 from "@/assets/indo-girl-21.png";
import indoGirl22 from "@/assets/indo-girl-22.png";
import indoGirl23 from "@/assets/indo-girl-23.png";
import indoGirl24 from "@/assets/indo-girl-24.png";
import indoGirl25 from "@/assets/indo-girl-25.png";
import indoGirl26 from "@/assets/indo-girl-26.png";
import indoGirl27 from "@/assets/indo-girl-27.png";
import indoGirl28 from "@/assets/indo-girl-28.png";
import indoGirl29 from "@/assets/indo-girl-29.png";
import indoGirl30 from "@/assets/indo-girl-30.png";
import indoGirl31 from "@/assets/indo-girl-31.png";
import indoGirl32 from "@/assets/indo-girl-32.png";
import indoGirl33 from "@/assets/indo-girl-33.png";
import indoGirl34 from "@/assets/indo-girl-34.png";
import indoGuy1 from "@/assets/indo-guy-1.png";
import indoGuy2 from "@/assets/indo-guy-2.png";
import indoGuy3 from "@/assets/indo-guy-3.png";
import indoGuy4 from "@/assets/indo-guy-4.png";
import indoGuy5 from "@/assets/indo-guy-5.png";
import indoGuy6 from "@/assets/indo-guy-6.png";
import indoGuy7 from "@/assets/indo-guy-7.png";
import indoGuy8 from "@/assets/indo-guy-8.png";
import indoGuy9 from "@/assets/indo-guy-9.png";

const FEMALE_NAMES = [
  "Putri", "Dewi", "Sari", "Ayu", "Rina", "Wulan", "Indah", "Ratna", "Mega", "Dian",
  "Lestari", "Anisa", "Fitri", "Nurul", "Sinta", "Kartika", "Melati", "Citra", "Bunga", "Kirana",
  "Dinda", "Nadia", "Laras", "Tari", "Widya",
];

const MALE_NAMES = [
  "Budi", "Rizky", "Dimas", "Arief", "Bayu", "Dwi", "Eko", "Gilang",
  "Hendra", "Irfan", "Joko", "Kevin", "Made", "Naufal", "Oka",
  "Teguh", "Umar",
];

const CITIES = [
  "Jakarta", "Bali", "Bandung", "Surabaya", "Yogyakarta",
  "Medan", "Semarang", "Makassar", "Malang", "Solo",
  "Palembang", "Balikpapan", "Manado", "Pontianak", "Lombok",
];

const COORDS: [number, number][] = [
  [-6.2088, 106.8456],   // Jakarta
  [-8.3405, 115.092],    // Bali
  [-6.9175, 107.6191],   // Bandung
  [-7.2575, 112.7521],   // Surabaya
  [-7.7956, 110.3695],   // Yogyakarta
  [3.5952, 98.6722],     // Medan
  [-6.9666, 110.4196],   // Semarang
  [-5.1477, 119.4327],   // Makassar
  [-7.9666, 112.6326],   // Malang
  [-7.5755, 110.8243],   // Solo
  [-2.9761, 104.7754],   // Palembang
  [-1.2654, 116.8312],   // Balikpapan
  [1.4748, 124.8421],    // Manado
  [-0.0263, 109.3425],   // Pontianak
  [-8.5833, 116.1167],   // Lombok
];

const FEMALE_IMAGES = [
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop",
];

const MALE_IMAGES = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=500&fit=crop",
];

const FEMALE_BIOS = [
  "Marketing exec by day, home chef by night 🍳 Love trying new warungs around the city",
  "Freelance designer based in Bali 🎨 Looking for someone to watch sunsets with",
  "Med student, coffee addict ☕ Let's grab nasi goreng sometime?",
  "Teaching English to kids 📚 Weekend hiker, love Bromo & Rinjani",
  "Working in fintech 💼 Obsessed with matcha lattes and bookstores",
  "Fashion buyer ✨ Always planning my next trip, love Komodo Island",
  "Nurse at RS Siloam 🏥 Enjoy cooking for friends and karaoke nights",
  "Content creator 📱 Cat mom to 3 rescue babies 🐱",
  "Accountant who dreams of opening a bakery 🧁 Swipe right if you love dessert",
  "Environmental scientist 🌿 Beach cleanups on weekends, let's make a difference",
  "Graphic designer & part-time DJ 🎧 Always discovering new music",
  "Hotel management graduate 🏨 Love meeting people from different cultures",
  "Psychology student 🧠 Good listener, better cook. Try me!",
  "Software engineer 💻 Yoga every morning, gaming every night",
  "Dance teacher 💃 Salsa, contemporary, traditional — I do it all",
  "Pharmacist by profession, traveler by heart ✈️ 15 countries and counting",
  "Interior designer 🏠 Can rearrange your living room and your life priorities",
  "Marine biologist 🐠 If you love the ocean as much as I do, let's talk",
  "Journalist 📝 Always chasing stories and good street food",
  "Pilates instructor 🧘‍♀️ Believe in balance — work hard, rest harder",
  "Architect student 📐 Love old buildings and new conversations",
  "Barista at a specialty coffee shop ☕ I'll make you the perfect cup",
  "Digital marketer 📊 Weekend painter, terrible singer but enthusiastic",
  "Law student ⚖️ Debate me over dinner?",
  "Veterinarian 🐾 My golden retriever approves all my dates first",
];

const MALE_BIOS = [
  "Software developer 💻 Weekend surfer in Kuta, coffee snob",
  "Running a small coffee roastery in Bandung ☕ Let's talk beans",
  "Civil engineer building bridges — literally 🌉 Love hiking on weekends",
  "Photographer 📸 Chasing golden hours across Java",
  "Chef at a fusion restaurant 🍜 I'll cook you something amazing",
  "Startup founder in edtech 🚀 Passionate about education access",
  "Music producer 🎵 Guitar player, vinyl collector",
  "Doctor at a community clinic 🩺 Believe in giving back",
  "Architect designing sustainable homes 🏡 Nature lover",
  "Marine tour guide in Raja Ampat 🤿 Best job in the world",
  "Teacher and part-time soccer coach ⚽ Kids call me Pak Cool",
  "Import-export business 📦 Traveled to 20+ countries for work",
  "Mechanical engineer 🔧 Weekend motorbike adventures",
  "Graphic designer & street art enthusiast 🎨 Know every mural in Jogja",
  "Personal trainer 💪 Help you get fit, one rep at a time",
  "Pilot trainee ✈️ Head in the clouds, feet on the ground",
  "Marine biologist studying coral reefs 🐙 Ocean conservation is my thing",
  "Rice farmer's son turned tech entrepreneur 🌾➡️💻",
  "Surf instructor in Canggu 🏄 Chill vibes only",
  "Dentist with a sweet tooth 🦷🍫 Ironic, I know",
  "Film student 🎬 Making short docs about Indonesian culture",
  "Hotel manager in Ubud 🏨 Hospitality is in my blood",
  "Freelance translator 🌐 Speak 4 languages fluently",
  "Environmental activist 🌍 Planting trees one weekend at a time",
  "Culinary school graduate 👨‍🍳 My rendang is legendary",
];

const LOOKING_FOR_FEMALE = [
  "Dating", "Relationship", "Dating", "Relationship", "Dating",
  "Friendship", "Relationship", "Dating", "Relationship", "Dating",
  "Friendship", "Dating", "Relationship", "Dating", "Relationship",
  "Dating", "Friendship", "Relationship", "Dating", "Relationship",
  "Dating", "Relationship", "Dating", "Friendship", "Relationship",
];

const LOOKING_FOR_MALE = [
  "Dating", "Relationship", "Dating", "Friendship", "Dating",
  "Relationship", "Dating", "Dating", "Relationship", "Friendship",
  "Dating", "Networking", "Relationship", "Dating", "Friendship",
  "Relationship", "Dating", "Dating", "Friendship", "Relationship",
  "Dating", "Relationship", "Dating", "Networking", "Dating",
];

// Every profile speaks Indonesian natively.
// ~60% also speak English, ~20% also speak Arabic, some speak both.
const EXTRA_LANGS_POOL: (string[] | undefined)[] = [
  ["English"],
  ["English", "Arabic"],
  ["English"],
  undefined,
  ["English"],
  ["Arabic"],
  ["English"],
  ["English"],
  undefined,
  ["English", "Arabic"],
  ["English"],
  undefined,
  ["Arabic"],
  ["English"],
  ["English"],
  undefined,
  ["English", "Arabic"],
  ["English"],
  ["Arabic"],
  ["English"],
  undefined,
  ["English"],
  ["English"],
  ["Arabic"],
  ["English"],
];

export const generateIndonesianProfiles = (count: number = 50): Profile[] => {
  const profiles: Profile[] = [];

  for (let i = 0; i < count; i++) {
    const isFemale = i % 2 === 0;
    const nameList = isFemale ? FEMALE_NAMES : MALE_NAMES;
    const imageList = isFemale ? FEMALE_IMAGES : MALE_IMAGES;
    const name = nameList[i % nameList.length];
    const cityIdx = i % CITIES.length;
    const [lat, lng] = COORDS[cityIdx];
    const offset = () => (Math.random() - 0.5) * 0.6;

    const imageCount = 3 + (i % 3);
    const images: string[] = [];
    for (let j = 0; j < imageCount; j++) {
      images.push(imageList[(Math.floor(i / 2) + j) % imageList.length]);
    }

    const isOnline = Math.random() > 0.35;
    const now = Date.now();
    const last_seen_at = isOnline
      ? new Date(now - Math.random() * 3 * 60 * 1000).toISOString()
      : new Date(now - (10 + Math.random() * 120) * 60 * 1000).toISOString();

    const profileIdx = Math.floor(i / 2);
    const bioList = isFemale ? FEMALE_BIOS : MALE_BIOS;
    const lookingForList = isFemale ? LOOKING_FOR_FEMALE : LOOKING_FOR_MALE;
    const extraLangs = EXTRA_LANGS_POOL[profileIdx % EXTRA_LANGS_POOL.length];
    const langs: string[] = ["Indonesian", ...(extraLangs || [])];

    profiles.push({
      id: `indo-${i}`,
      name,
      age: 19 + Math.floor(Math.random() * 18),
      city: CITIES[cityIdx],
      country: "Indonesia",
      bio: bioList[profileIdx % bioList.length],
      image: images[0],
      images,
      gender: isFemale ? "Female" : "Male",
      latitude: lat + offset(),
      longitude: lng + offset(),
      available_tonight: Math.random() > 0.65,
      looking_for: lookingForList[profileIdx % lookingForList.length],
      last_seen_at,
      languages: langs,
      is_plusone: i % 4 === 1,   // every 4th profile shows the +1 badge
    });
  }

  // Override female profiles with real uploaded images (1 per profile)
  const girlOverrides: { img: string; gallery: string[]; pos: string }[] = [
    { img: indoGirl1, gallery: [indoGirl1, indoGirl2], pos: "50% 20%" },
    { img: indoGirl3, gallery: [indoGirl3, indoGirl27], pos: "50% 15%" },
    { img: indoGirl4, gallery: [indoGirl4, indoGirl26], pos: "50% 20%" },
    { img: indoGirl5, gallery: [indoGirl5, indoGirl7], pos: "50% 15%" },
    { img: indoGirl6, gallery: [indoGirl6, indoGirl29], pos: "50% 25%" },
    { img: indoGirl8, gallery: [indoGirl8, indoGirl30], pos: "50% 20%" },
    { img: indoGirl9, gallery: [indoGirl9, indoGirl32], pos: "50% 20%" },
    { img: indoGirl10, gallery: [indoGirl10, indoGirl33], pos: "50% 15%" },
    { img: indoGirl11, gallery: [indoGirl11, indoGirl34], pos: "50% 15%" },
    { img: indoGirl12, gallery: [indoGirl12, indoGirl28], pos: "50% 20%" },
    { img: indoGirl13, gallery: [indoGirl13, indoGirl31], pos: "50% 15%" },
    { img: indoGirl14, gallery: [indoGirl14], pos: "50% 20%" },
    { img: indoGirl15, gallery: [indoGirl15], pos: "50% 15%" },
    { img: indoGirl16, gallery: [indoGirl16, indoGirl26], pos: "50% 15%" },
    { img: indoGirl17, gallery: [indoGirl17, indoGirl34], pos: "50% 15%" },
    { img: indoGirl18, gallery: [indoGirl18, indoGirl27], pos: "50% 15%" },
    { img: indoGirl19, gallery: [indoGirl19, indoGirl30], pos: "50% 15%" },
    { img: indoGirl27, gallery: [indoGirl27, indoGirl1], pos: "50% 15%" },
    { img: indoGirl28, gallery: [indoGirl28, indoGirl3], pos: "50% 15%" },
    { img: indoGirl29, gallery: [indoGirl29, indoGirl5], pos: "50% 15%" },
    { img: indoGirl30, gallery: [indoGirl30, indoGirl8], pos: "50% 20%" },
    { img: indoGirl31, gallery: [indoGirl31, indoGirl10], pos: "50% 15%" },
    { img: indoGirl32, gallery: [indoGirl32, indoGirl12], pos: "50% 15%" },
    { img: indoGirl33, gallery: [indoGirl33, indoGirl14], pos: "50% 15%" },
    { img: indoGirl34, gallery: [indoGirl34, indoGirl16], pos: "50% 15%" },
  ];

  let girlIdx = 0;
  for (let i = 0; i < profiles.length && girlIdx < girlOverrides.length; i++) {
    if (profiles[i].gender === "Female") {
      const o = girlOverrides[girlIdx++];
      profiles[i].image = o.img;
      profiles[i].images = o.gallery;
      profiles[i].main_image_pos = o.pos;
    }
  }

  // Override male profiles with real uploaded images
  const guyOverrides: { img: string; gallery: string[]; pos: string }[] = [
    { img: indoGuy1, gallery: [indoGuy1, indoGuy7], pos: "50% 15%" },
    { img: indoGuy2, gallery: [indoGuy2, indoGuy8], pos: "50% 15%" },
    { img: indoGuy3, gallery: [indoGuy3, indoGuy9], pos: "50% 15%" },
    { img: indoGuy4, gallery: [indoGuy4, indoGuy7], pos: "50% 15%" },
    { img: indoGuy5, gallery: [indoGuy5, indoGuy8], pos: "50% 15%" },
    { img: indoGuy6, gallery: [indoGuy6, indoGuy9], pos: "50% 15%" },
    { img: indoGuy7, gallery: [indoGuy7, indoGuy1], pos: "50% 15%" },
    { img: indoGuy8, gallery: [indoGuy8, indoGuy2], pos: "50% 15%" },
    { img: indoGuy9, gallery: [indoGuy9, indoGuy3], pos: "50% 15%" },
  ];

  let guyIdx = 0;
  for (let i = 0; i < profiles.length && guyIdx < guyOverrides.length; i++) {
    if (profiles[i].gender === "Male") {
      const o = guyOverrides[guyIdx++];
      profiles[i].image = o.img;
      profiles[i].images = o.gallery;
      profiles[i].main_image_pos = o.pos;
    }
  }

  return profiles;
};
