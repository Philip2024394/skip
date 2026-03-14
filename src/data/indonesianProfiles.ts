import { Profile, BasicInfo, LifestyleInfo, RelationshipGoals } from "@/types/profile";
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

type DatePlace = {
  idea: string;
  url: string;
  instagram_url?: string;
  google_url?: string;
  other_url?: string;
  image_url: string | null;
  title: string | null;
};

const FEMALE_NAMES = [
  "Putri","Dewi","Sari","Ayu","Rina","Wulan","Indah","Ratna","Mega","Dian",
  "Lestari","Anisa","Fitri","Nurul","Sinta","Kartika","Melati","Citra","Bunga","Kirana",
  "Dinda","Nadia","Laras","Tari","Widya","Ariani","Bella","Cahya","Devi","Eka",
  "Farah","Gita","Hasna","Intan","Jasmine","Kezia","Lila","Maya","Nova","Olivia",
  "Puspita","Qanita","Rara","Salma","Tiara","Ulfa","Vina","Widi","Xena","Yola",
  "Zahra","Amira","Binta","Celine","Diana","Elsa","Fanny","Grace","Hana","Ines",
  "Jihan","Krisna","Lana","Mira","Nayla","Ophi","Putri","Qisti","Reni","Sela",
  "Tria","Uma","Vera","Wenny","Yasmin","Zelia","Adinda","Brena","Calista","Dahlia",
  "Elina","Firda","Ghina","Hesti","Ira","Julita","Katya","Lidya","Mala","Nisa",
  "Okta","Prisca","Reina","Shinta","Tasya","Uswah","Vanya","Winni","Xanthe","Yuni",
];

const MALE_NAMES = [
  "Budi","Rizky","Dimas","Arief","Bayu","Dwi","Eko","Gilang",
  "Hendra","Irfan","Joko","Kevin","Made","Naufal","Oka",
  "Teguh","Umar","Vito","Wahyu","Xander","Yusuf","Zaki",
  "Adrian","Bima","Chandra","Daffa","Evan","Fajar","Guntur",
  "Hanif","Ivan","Jaya",
];

const CITIES = [
  "Jakarta","Bali","Bandung","Surabaya","Yogyakarta",
  "Medan","Semarang","Makassar","Malang","Solo",
  "Palembang","Balikpapan","Manado","Pontianak","Lombok",
];

const COORDS: [number, number][] = [
  [-6.2088, 106.8456],
  [-8.3405, 115.092],
  [-6.9175, 107.6191],
  [-7.2575, 112.7521],
  [-7.7956, 110.3695],
  [3.5952, 98.6722],
  [-6.9666, 110.4196],
  [-5.1477, 119.4327],
  [-7.9666, 112.6326],
  [-7.5755, 110.8243],
  [-2.9761, 104.7754],
  [-1.2654, 116.8312],
  [1.4748, 124.8421],
  [-0.0263, 109.3425],
  [-8.5833, 116.1167],
];

// 60 high-quality Unsplash portrait URLs for female fallback pool
const FEMALE_IMAGES_UNSPLASH = [
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1548142813-c348350df52b?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1521146764736-56c929d59c83?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1505503693641-1926193e8d57?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1488207954978-2b3f2df4ba43?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1568457537842-6c3df79bb471?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1536766820879-059fec98ec0a?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1577368211130-4bbd0181ddf0?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1560087637-bf797bc7796a?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1559067096-49ebca3406aa?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1569913486515-b74bf7751574?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1508243771214-6e95d137426b?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1597586124394-fbd6ef244026?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1564923630403-2284b87c0041?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1592621385612-4d7129426394?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1624558283588-95b8a40f06df?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1611403119860-57c4353a1d07?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1614520616468-b61c01f23b90?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1595152772835-219674b2a163?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1586987405340-044dfaf9cf85?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1582142306909-195724d33fcc?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1625716411024-d8f4b47aabb8?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1626957341926-98752fc2ba21?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1618641986557-1ecd230959aa?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1602233158242-3ba0ac4d2167?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1623609163859-ca93c959b98a?w=400&h=500&fit=crop&face",
];

// 35 high-quality Unsplash portrait URLs for male fallback pool
const MALE_IMAGES_UNSPLASH = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1584999734482-0361aecad844?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1557862921-37829c790f19?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1613297694015-7c4e0b7ebc9c?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1629425733761-caae3b5f2e50?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1631947430066-48c30d57b943?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1615109398623-88346a601842?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1596075780750-81249df16d19?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1565464027194-7957a2295fb7?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1571844307880-751c6d86f3f3?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1625504615927-c14c8ee2e67d?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1618516276677-add4b3fa22f7?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1506956191951-7a88da4435e5?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1474978528675-4a50a4508dc6?w=400&h=500&fit=crop&face",
  "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&h=500&fit=crop&face",
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
  "Flight attendant ✈️ Based in Jakarta but my heart belongs everywhere",
  "Beauty influencer 💄 Honest reviews, real opinions — and I bake on weekends",
  "Product manager at a startup 🚀 Weekend runner and trail hiker",
  "Event organiser 🎉 If there's a party, I probably planned it",
  "Culinary arts student 🍱 Specialising in Javanese cuisine with a modern twist",
  "Yoga instructor & wellness coach 🌸 Living slowly and intentionally",
  "Fashion illustrator ✏️ Drawing what I wish I could wear",
  "Real estate agent 🏡 Good at finding hidden gems — in properties and people",
  "University lecturer 📖 Philosophy & literature. Let's have a proper conversation",
  "Tattoo artist 🖋️ My body is a canvas and so is yours",
  "Surf girl 🏄‍♀️ Canggu mornings, Bali sunsets, looking for a co-pilot",
  "Pediatric nurse 👶 Passionate about maternal health and community care",
  "App developer 📲 Building something cool. Love boardgames and true crime podcasts",
  "Entrepreneur running an online batik boutique 🪴 Culture is my craft",
  "Sports physiotherapist 💪 Train smart, recover smarter",
  "Food stylist 🍜 Making Indonesian food look as beautiful as it tastes",
  "Scuba instructor 🤿 Took 200+ people to see their first reef. Let me show you too",
  "Singer-songwriter 🎵 Playing open mics around Jakarta on Friday nights",
  "Corporate lawyer ⚖️ Intimidating in the boardroom, soft at heart",
  "Ceramics artist 🏺 My studio is my happy place — and yes I'll teach you",
  "High school biology teacher 🔬 Science nerd who loves hiking and K-dramas",
  "Brand strategist 🎯 Making brands memorable. Still figuring out my own story",
  "Midwife & maternal health advocate 🌺 Strong believer in community wellness",
  "Luxury travel blogger 🌏 Sipping cocktails in Seminyak, writing from Santorini",
  "Data analyst 📈 By day I find patterns. By night I get lost in them on purpose",
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
  "Investment banker 💼 Weekend trail runner and amateur photographer",
  "Barista champion ☕ Third wave coffee is serious business",
  "Motorbike mechanic 🏍️ Restoring classic bikes in my garage on weekends",
  "Navy officer ⚓ Disciplined, calm, and ready for adventure",
  "Digital nomad & UX designer 🖥️ Working from Bali, dreaming of everywhere",
];

const LOOKING_FOR_FEMALE = [
  "Dating","Relationship","Dating","Relationship","Dating",
  "Friendship","Relationship","Dating","Relationship","Dating",
  "Friendship","Dating","Relationship","Dating","Relationship",
  "Dating","Friendship","Relationship","Dating","Relationship",
  "Dating","Relationship","Dating","Friendship","Relationship",
  "Dating","Relationship","Dating","Relationship","Friendship",
  "Dating","Relationship","Friendship","Dating","Relationship",
  "Dating","Relationship","Dating","Friendship","Relationship",
  "Dating","Relationship","Dating","Relationship","Dating",
  "Friendship","Relationship","Dating","Relationship","Dating",
];

const LOOKING_FOR_MALE = [
  "Dating","Relationship","Dating","Friendship","Dating",
  "Relationship","Dating","Dating","Relationship","Friendship",
  "Dating","Networking","Relationship","Dating","Friendship",
  "Relationship","Dating","Dating","Friendship","Relationship",
  "Dating","Relationship","Dating","Networking","Dating",
  "Relationship","Dating","Dating","Friendship","Relationship",
];

const EXTRA_LANGS_POOL: (string[] | undefined)[] = [
  ["English"],["English","Arabic"],["English"],undefined,["English"],
  ["Arabic"],["English"],["English"],undefined,["English","Arabic"],
  ["English"],undefined,["Arabic"],["English"],["English"],
  undefined,["English","Arabic"],["English"],["Arabic"],["English"],
  undefined,["English"],["English"],["Arabic"],["English"],
  ["English"],undefined,["English","Arabic"],["English"],["Arabic"],
];

const buildGoogleMapsSearchUrl = (query: string, lat: number, lng: number) => {
  const q = `${query} near ${lat.toFixed(4)},${lng.toFixed(4)}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
};

// ── Category image pools — each date idea picks from its category's images ──
const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&h=220&fit=crop`;
const CATEGORY_IMAGES: Record<string, string[]> = {
  cafe:       [IMG("1501339847302-ac426a4a7cbb"), IMG("1509042239860-f550ce710b93"), IMG("1445116572660-236099ec97a0"), IMG("1495474472287-4d71bcdd2085"), IMG("1442512595331-e89e73853f31"), IMG("1521017432531-fbd92d768814")],
  food:       [IMG("1414235077428-338989a2e8c0"), IMG("1517248135467-4c7edcad34c4"), IMG("1550966871-3ed3cdb51f3a"), IMG("1504674900247-0877df9cc836"), IMG("1565299624946-b28f40a0ae38"), IMG("1476224203421-9ac39bcb3327")],
  dessert:    [IMG("1551024601-bec78aea704b"), IMG("1488477181946-6428a0291777"), IMG("1563729784474-d77dbb933a9e"), IMG("1587314168485-3236d6710814"), IMG("1486427944299-d1955d23e34d"), IMG("1567206563064-6f60f40a2b57")],
  park:       [IMG("1500534314209-a25ddb2bd429"), IMG("1476673160081-cf065607f449"), IMG("1510270929905-aa8d499cf5fc"), IMG("1473448912268-2022ce9509d8"), IMG("1441974231531-c6227db76b6e"), IMG("1502082553048-f009c37129b9")],
  beach:      [IMG("1507525428034-b723cf961d3e"), IMG("1519046904884-53103b34b206"), IMG("1471922694854-ff1b63b20054"), IMG("1520454974749-611b7248ffdb"), IMG("1506953823976-0678e0aaf346"), IMG("1468413253725-0d5181091126")],
  sunset:     [IMG("1508193638397-1c4234db14d8"), IMG("1473116763249-2faaef81ccda"), IMG("1414609245224-afa02bfb3fda"), IMG("1506354666786-959d6d497f1a"), IMG("1495616811223-4d98c6e9c869"), IMG("1472120435266-95a3f747eb08")],
  nightlife:  [IMG("1527769929938-b77e7fb4c0f3"), IMG("1470337458703-46ad1756a187"), IMG("1566417713940-fe7c737a9ef2"), IMG("1572116469696-31de0f17cc34"), IMG("1516450360452-9312f5e86fc7"), IMG("1429962714451-bb934ecdc4ec")],
  market:     [IMG("1555939594-58d7cb561ad1"), IMG("1504544750208-dc0358e63f7f"), IMG("1567521464027-f127ff144326"), IMG("1514933651103-005eec06c04b"), IMG("1529692236671-f1f6cf9683ba"), IMG("1533777857889-4be7d998efb0")],
  art:        [IMG("1518998053901-5348d3961a04"), IMG("1531243269054-5ebf6f34081e"), IMG("1544967082-d9d25d867d66"), IMG("1460661419201-fd4cecdf8a8b"), IMG("1513364776144-60967b0f800f"), IMG("1561214115-f2f134cc4912")],
  cooking:    [IMG("1556909114-f6e7ad7d3136"), IMG("1507048331197-7d4ac70811cf"), IMG("1466637574441-749b8f19452f"), IMG("1528712306091-ed0763094c98"), IMG("1556910103-1c02745aae4d"), IMG("1551218808-94e220e084d2")],
  music:      [IMG("1493225457124-a3eb161ffa5f"), IMG("1501612780327-45045538702b"), IMG("1459749411175-04bf5292ceea"), IMG("1524368535928-5b5e00ddc76b"), IMG("1470229722913-7c0e2dbbafd3"), IMG("1511671782779-c97d3d27a1d4")],
  cinema:     [IMG("1489599849927-2ee91cede3ba"), IMG("1536440136628-849c177e76a1"), IMG("1478720568477-152d9b164e26"), IMG("1517604931442-7e0c8ed2963c")],
  active:     [IMG("1545232979-a9ba987ce37c"), IMG("1558618666-fcd25c85f82e"), IMG("1596464716388-e3c15a40e69a"), IMG("1544551763-46a013bb70d5"), IMG("1571019614242-c5c5dee9f50c"), IMG("1540479859555-17af45c78602")],
  water:      [IMG("1544551763-46a013bb70d5"), IMG("1530053969600-cacd2598338c"), IMG("1516728778615-2d590ea1855e"), IMG("1559827260-dc66d6f5e3a5"), IMG("1504458174710-8ef9f463798f"), IMG("1537519646099-2ee971dcefc0")],
  romantic:   [IMG("1470252649378-9c29740c9fa8"), IMG("1475738198235-4b30fc2fca88"), IMG("1507400492013-162706c8c05e"), IMG("1474524955719-b9f87c50ce47"), IMG("1505765050516-f72dcac9c60e"), IMG("1519681393784-d120267933ba")],
  nature:     [IMG("1441974231531-c6227db76b6e"), IMG("1472396961693-142e6e269027"), IMG("1518173946687-1e1e4b4d15b7"), IMG("1475113548554-5a36f1f523d6"), IMG("1469474968028-56623f02e42e"), IMG("1426604966848-d7adac402bff")],
  playful:    [IMG("1558618666-fcd25c85f82e"), IMG("1596464716388-e3c15a40e69a"), IMG("1571019614242-c5c5dee9f50c"), IMG("1540479859555-17af45c78602"), IMG("1560448204-e02f11c3d0e2"), IMG("1541532713592-79a0317b6b77")],
};

// Map each of the 135 date ideas to a search key and image category
import { FIRST_DATE_IDEAS } from "./firstDateIdeas";

const IDEA_CATEGORY: Record<string, { key: string; cat: string }> = {};
const assignCat = (ideas: string[], key: string, cat: string) => ideas.forEach(i => { IDEA_CATEGORY[i] = { key, cat }; });

assignCat([
  "Coffee At A Cozy Café ☕", "Coffee And Deep Conversation ☕", "Morning Coffee Date ☀️",
  "Iced Coffee And A Walk 🧋", "Tea House Date 🍵", "Smoothies And Fresh Juice Date 🥤",
  "Coffee And Bookstore Browsing 📚", "Rooftop Café Sunset Drinks 🌇",
  "Sharing Dessert At A Café 🍰", "Late Night Café Chat ☕",
], "cafe", "cafe");

assignCat([
  "Dinner At A Nice Restaurant 🍝", "Casual Lunch Date 🍽️", "Trying A New Restaurant Together 🍽️",
  "Sushi Night Together 🍣", "Pizza And A Movie Night 🍕", "Brunch On A Lazy Weekend 🥐",
  "Food Market Exploration 🛒", "Cooking Together At Home 🧑‍🍳", "BBQ Night Together 🔥",
  "Breakfast Date ☀️", "Trying Indonesian Local Food 🍜",
  "Family Friendly Restaurant Dinner 🍽️",
], "restaurant", "food");

assignCat([
  "Street Food Adventure 🍜", "Night Market Street Food 🌙", "Visit A Night Market 🌙",
  "Explore Local Street Food 🍜",
], "street food", "market");

assignCat([
  "Dessert And Late Night Walk 🍰", "Ice Cream And A Stroll 🍦", "Ice Cream And Conversation 🍦",
], "dessert cafe", "dessert");

assignCat([
  "Walk In The Park 🌳", "Picnic In The Park 🧺", "Visiting A City Park 🌳",
  "Botanical Garden Visit 🌺", "Feeding Ducks By The Lake 🦆", "Lakeside Picnic 🦢",
], "park", "park");

assignCat([
  "Beach Sunset Walk 🌅", "Walk Along The Beach 🏖️", "Moonlight Beach Walk 🌙",
  "Beach Walk At Dusk 🏖️", "Watching The Ocean Waves 🌊",
  "Watching The Sunset At The Beach 🌅",
], "beach", "beach");

assignCat([
  "Watching The Sunset Together 🌇", "Sunset Picnic 🌅", "Sunrise Walk Before The World Wakes ☀️",
  "Sunrise Mountain View ⛰️", "Mountain View Picnic ⛰️",
], "scenic viewpoint", "sunset");

assignCat([
  "Hiking A Scenic Trail 🥾", "Waterfall Hike 💧", "Nature Forest Walk 🌿",
], "hiking trail", "nature");

assignCat([
  "Night At The Cinema 🎬", "Outdoor Movie Night 🎬", "Pizza And A Movie Night 🍕",
  "Cozy Movie Night At Home 🛋️",
], "cinema", "cinema");

assignCat([
  "Live Music Night 🎵", "Jazz Bar And Conversation 🎷", "Comedy Night Out 😂",
  "Karaoke Night 🎤", "Theatre Or Dance Show 💃", "Cultural Festival 🎭",
  "Watching A Sports Game Together ⚽",
], "entertainment venue", "music");

assignCat([
  "Art Gallery Visit 🎨", "Art Gallery Together 🎨", "Museum Visit 🏛️",
  "Photography Walk 📷", "Drawing Or Painting Together 🎨",
], "art gallery", "art");

assignCat([
  "Cooking Class For Two 👨‍🍳", "Baking Cookies Together 🍪",
], "cooking class", "cooking");

assignCat([
  "Bowling Night Together 🎳", "Mini Golf Or Arcade Fun 🎯", "Escape Room Challenge 🔐",
  "Ice Skating Together ⛸️", "Go Kart Racing 🏎️", "Amusement Park Adventure 🎢",
  "Playing Pool Together 🎱", "Table Tennis Match 🏓", "Badminton Game 🏸",
  "Beach Volleyball 🏐", "Rock Climbing Gym 🧗", "Yoga In The Park 🧘",
  "Board Game Café 🎲",
], "fun activities", "active");

assignCat([
  "Kayaking Together 🚣", "Paddleboarding 🌊", "Jet Ski Adventure 🏄",
  "Snorkeling Together 🤿", "Surfing At The Beach 🏄", "Parasailing Over The Ocean 🪂",
  "Banana Boat Ride 🍌🚤", "Romantic Boat Ride 🚤", "Sunset Boat Cruise 🌅",
  "Fishing By The Lake 🎣", "Fishing By The Ocean 🌊🎣",
], "water sports", "water");

assignCat([
  "Watching The City Lights Together 🌃", "Watching The Stars Together ⭐",
  "Wine And Stargazing ✨", "Firepit And Good Conversation 🔥",
  "Long Drive With Music 🎶", "Sharing Stories Under The Stars ✨",
  "Balcony Dinner Together 🕯️", "Slow Dancing Together 💃",
], "romantic spot", "romantic");

assignCat([
  "Drinks At A Rooftop Bar 🍸", "Rooftop Bar Drinks 🍸",
  "Dancing At A Nightclub 🕺", "Clubbing All Night 💃", "DJ Party Night 🎧",
  "Cocktails And Good Vibes 🍹", "Craft Beer At A Local Brewery 🍺",
  "Champagne Celebration 🍾", "Dancing Until Sunrise 🌅",
  "Wine Tasting Evening 🍷",
], "rooftop bar", "nightlife");

assignCat([
  "Camping Under The Stars ⛺", "Road Trip Adventure 🚗",
  "Exploring A New Town Together 🏘️",
], "campsite", "nature");

assignCat([
  "Walk Around The Mall 🛍️", "Bookstore Date 📚",
  "Café Chat After Maghrib ☕", "Casual Afternoon Tea 🍵",
], "cafe", "cafe");

assignCat([
  "Pet Café Visit 🐶", "Cat Café Date 🐱", "Trying Weird Snacks Together 🍬",
  "Flying A Kite 🪁",
], "fun activities", "playful");

// Build the full DATE_IDEAS array from all 135 ideas
const DATE_IDEAS = FIRST_DATE_IDEAS.map((idea) => {
  const info = IDEA_CATEGORY[idea] ?? { key: "cafe", cat: "cafe" };
  return { idea, key: info.key, cat: info.cat };
});

const buildFirstDatePlaces = (_city: string, lat: number, lng: number, seed: number): DatePlace[] => {
  // Pick 3 deterministic ideas based on seed so they don't shuffle on every render
  const picks: typeof DATE_IDEAS = [];
  const used = new Set<number>();
  let s = seed;
  while (picks.length < 3) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const idx = s % DATE_IDEAS.length;
    if (!used.has(idx)) {
      used.add(idx);
      picks.push(DATE_IDEAS[idx]);
    }
  }

  return picks.map((p, i) => {
    // Use seed + index to pick a different image variant per profile from the category pool
    const catImages = CATEGORY_IMAGES[p.cat] ?? CATEGORY_IMAGES.cafe;
    const imgIdx = ((seed + i * 7) & 0x7fffffff) % catImages.length;
    return {
      idea: p.idea,
      url: buildGoogleMapsSearchUrl(p.key, lat, lng),
      google_url: buildGoogleMapsSearchUrl(p.key, lat, lng),
      image_url: catImages[imgIdx],
      title: null,
    };
  });
};

// ─── About Me data pools ────────────────────────────────────────────────────

const FEMALE_HEIGHTS = ["155cm","157cm","158cm","160cm","162cm","163cm","165cm","167cm","168cm","170cm"];
const MALE_HEIGHTS   = ["168cm","170cm","172cm","174cm","175cm","177cm","178cm","180cm","182cm","185cm"];

const FEMALE_BODY_TYPES = ["Slim","Petite","Athletic","Curvy","Average"];
const MALE_BODY_TYPES   = ["Slim","Athletic","Muscular","Average","Lean"];

const ETHNICITIES_F = ["Javanese","Sundanese","Balinese","Minangkabau","Betawi","Bugis","Madurese","Chinese-Indonesian","Mixed","Batak"];
const ETHNICITIES_M = ["Javanese","Sundanese","Balinese","Minangkabau","Betawi","Bugis","Makassarese","Chinese-Indonesian","Mixed","Malay"];

const EDUCATIONS = ["High School","Diploma","Bachelor's Degree","Bachelor's Degree","Bachelor's Degree","Master's Degree","Master's Degree","Doctorate","Vocational","Professional Degree"];

const INCOMES = ["< Rp 5M/mo","Rp 5–10M/mo","Rp 10–20M/mo","Rp 20–40M/mo","Rp 40M+/mo","Prefer not to say"];

const LIVES_WITH = ["Lives alone","With family","With housemates","With partner","Own home"];

const CHILDREN_OPTIONS = ["No children","1 child","2 children","3+ children","No children, open to having","No children, not planning to"];

const SMOKING_OPTIONS   = ["Non-smoker","Non-smoker","Social smoker","Light smoker","Non-smoker","Quit smoking"];
const DRINKING_OPTIONS  = ["Non-drinker","Social drinker","Non-drinker","Light drinker","Rarely drinks","Non-drinker","Social drinker"];
const EXERCISE_OPTIONS  = ["Daily","4–5×/week","2–3×/week","Occasionally","Rarely","Weekly gym","Yoga & pilates","Running & cycling"];
const DIET_OPTIONS      = ["No preference","Halal only","Vegetarian","Mostly healthy","Loves street food","Home-cooked meals"];
const SLEEP_OPTIONS     = ["Night owl","Early bird","Flexible","Late sleeper","Varies by week","Usually by midnight"];
const SOCIAL_STYLES     = ["Introvert","Ambivert","Extrovert","Social but selective","Homebody","Outgoing"];
const LOVE_LANGUAGES    = ["Quality time","Words of affirmation","Acts of service","Physical touch","Gift giving","Quality time","Words of affirmation"];
const PETS_OPTIONS      = ["Cat lover","Dog person","Has cats","Has a dog","No pets","Animal lover","Allergic to pets","Open to pets"];

const HOBBIES_POOL: string[][] = [
  ["Cooking","Hiking","Reading"],
  ["Travel","Photography","Yoga"],
  ["Music","Dancing","Cooking"],
  ["Gaming","Movies","Gym"],
  ["Painting","Cycling","Coffee"],
  ["Surfing","Swimming","Food tours"],
  ["Badminton","Running","Karaoke"],
  ["Gardening","Baking","Journaling"],
  ["Diving","Motorbike trips","Street photography"],
  ["Crafts","Watching K-dramas","Board games"],
];

const RELIGIONS_F  = ["Muslim","Muslim","Muslim","Muslim","Muslim","Christian","Hindu","Buddhist","Catholic","Muslim"];
const RELIGIONS_M  = ["Muslim","Muslim","Muslim","Muslim","Muslim","Christian","Hindu","Buddhist","Catholic","Muslim"];
const PRAYER_OPTS  = ["5× daily","Regularly","Occasionally","Fridays only","Trying to improve","Not practicing"];
const HIJAB_OPTS   = ["Yes, full hijab","Yes, sometimes","No","Syari","Prefer not to say"];
const DATE_TYPES   = ["Traditional courtship","Modern casual dating","Getting to know first","Halal approach","Open to both"];
const TIMELINES    = ["Ready when it feels right","Within 1 year","1–2 years","Not rushing","Serious about marriage"];
const MARITAL_OPTS = ["Never married","Divorced","Widowed","Prefer not to say"];
const DOWRY_OPTS   = ["Open to discussion","Important to my family","Flexible","Symbolic amount","Not required"];
const FAMILY_OPTS  = ["Very important","Somewhat involved","Independent decision","Meet the family first"];
const ABOUT_PARTNER_POOL = [
  "Someone who is honest, kind, and values family. I appreciate a person who communicates openly.",
  "Looking for someone with a good sense of humour and a warm heart. Ambition is attractive.",
  "Loyalty and faith are most important to me. I want someone who is ready to grow together.",
  "I'd love someone who enjoys simple pleasures — a walk, good food, and real conversations.",
  "Someone grounded, caring, and who isn't afraid of commitment. Maturity matters more than age.",
  "I'm looking for a partner who respects my independence while building something beautiful together.",
  "Faith, family, and kindness. If those are your priorities too, let's talk.",
  "An emotionally available person who makes time for the people they love.",
  "Someone who shares my curiosity about the world and isn't afraid to be vulnerable.",
  "Genuine, patient, and supportive. I want a partner, not just a companion.",
];

const buildBasicInfo = (i: number, gender: string, languages: string[]): BasicInfo => ({
  height: gender === "Female" ? FEMALE_HEIGHTS[i % FEMALE_HEIGHTS.length] : MALE_HEIGHTS[i % MALE_HEIGHTS.length],
  body_type: gender === "Female" ? FEMALE_BODY_TYPES[i % FEMALE_BODY_TYPES.length] : MALE_BODY_TYPES[i % MALE_BODY_TYPES.length],
  ethnicity: gender === "Female" ? ETHNICITIES_F[i % ETHNICITIES_F.length] : ETHNICITIES_M[i % ETHNICITIES_M.length],
  education: EDUCATIONS[i % EDUCATIONS.length],
  occupation: undefined, // derived from bio naturally
  income: INCOMES[i % INCOMES.length],
  lives_with: LIVES_WITH[i % LIVES_WITH.length],
  children: CHILDREN_OPTIONS[i % CHILDREN_OPTIONS.length],
  languages,
});

const buildLifestyleInfo = (i: number): LifestyleInfo => ({
  smoking: SMOKING_OPTIONS[i % SMOKING_OPTIONS.length],
  drinking: DRINKING_OPTIONS[i % DRINKING_OPTIONS.length],
  exercise: EXERCISE_OPTIONS[i % EXERCISE_OPTIONS.length],
  diet: DIET_OPTIONS[i % DIET_OPTIONS.length],
  sleep: SLEEP_OPTIONS[i % SLEEP_OPTIONS.length],
  social_style: SOCIAL_STYLES[i % SOCIAL_STYLES.length],
  love_language: LOVE_LANGUAGES[i % LOVE_LANGUAGES.length],
  pets: PETS_OPTIONS[i % PETS_OPTIONS.length],
  hobbies: HOBBIES_POOL[i % HOBBIES_POOL.length],
});

const buildRelationshipGoals = (i: number, gender: string, lookingFor: string): RelationshipGoals => ({
  looking_for: lookingFor,
  timeline: TIMELINES[i % TIMELINES.length],
  date_type: DATE_TYPES[i % DATE_TYPES.length],
  marital_status: MARITAL_OPTS[i % MARITAL_OPTS.length],
  religion: gender === "Female" ? RELIGIONS_F[i % RELIGIONS_F.length] : RELIGIONS_M[i % RELIGIONS_M.length],
  prayer: PRAYER_OPTS[i % PRAYER_OPTS.length],
  ...(gender === "Female" ? { hijab: HIJAB_OPTS[i % HIJAB_OPTS.length] } : {}),
  dowry: DOWRY_OPTS[i % DOWRY_OPTS.length],
  family_involvement: FAMILY_OPTS[i % FAMILY_OPTS.length],
  about_partner: ABOUT_PARTNER_POOL[i % ABOUT_PARTNER_POOL.length],
});

// Determine if a profile is "online" based on an 18-hour window per day.
// Each profile gets a unique 6-hour offline block so they stagger naturally.
const computeOnlineStatus = (profileIndex: number): { isOnline: boolean; last_seen_at: string } => {
  const now = Date.now();
  const currentHour = new Date().getHours();
  // Each profile's offline window starts at a different hour (6-hour window)
  const offlineStart = (profileIndex * 7 + 2) % 24;
  const offlineEnd = (offlineStart + 6) % 24;
  const inOfflineWindow = offlineStart < offlineEnd
    ? currentHour >= offlineStart && currentHour < offlineEnd
    : currentHour >= offlineStart || currentHour < offlineEnd;
  const isOnline = !inOfflineWindow;
  const last_seen_at = isOnline
    ? new Date(now - Math.floor((profileIndex % 11) * 45 * 1000)).toISOString()
    : new Date(now - (30 + (profileIndex % 90)) * 60 * 1000).toISOString();
  return { isOnline, last_seen_at };
};

export const generateIndonesianProfiles = (_count?: number): Profile[] => {
  const TOTAL_FEMALE = 100;
  const TOTAL_MALE = 30;
  const profiles: Profile[] = [];

  // Build female profiles
  for (let fi = 0; fi < TOTAL_FEMALE; fi++) {
    const cityIdx = fi % CITIES.length;
    const [lat, lng] = COORDS[cityIdx];
    const offset = () => ((fi * 17 + 3) % 100 - 50) / 100 * 0.6;
    const latitude = lat + offset();
    const longitude = lng + offset();
    const { isOnline, last_seen_at } = computeOnlineStatus(fi);
    const imgUrl = FEMALE_IMAGES_UNSPLASH[fi % FEMALE_IMAGES_UNSPLASH.length];
    const extraLangs = EXTRA_LANGS_POOL[fi % EXTRA_LANGS_POOL.length];

    const femaleLangs = ["Indonesian", ...(extraLangs || [])];
    const femaleLookingFor = LOOKING_FOR_FEMALE[fi % LOOKING_FOR_FEMALE.length];
    profiles.push({
      id: `indo-f-${fi}`,
      name: FEMALE_NAMES[fi % FEMALE_NAMES.length],
      age: 19 + (fi % 16),
      city: CITIES[cityIdx],
      country: "Indonesia",
      bio: FEMALE_BIOS[fi % FEMALE_BIOS.length],
      image: imgUrl,
      images: [imgUrl, FEMALE_IMAGES_UNSPLASH[(fi + 10) % FEMALE_IMAGES_UNSPLASH.length], FEMALE_IMAGES_UNSPLASH[(fi + 22) % FEMALE_IMAGES_UNSPLASH.length]],
      gender: "Female",
      latitude,
      longitude,
      available_tonight: fi % 3 === 0,
      looking_for: femaleLookingFor,
      last_seen_at,
      languages: femaleLangs,
      first_date_places: buildFirstDatePlaces(CITIES[cityIdx], latitude, longitude, fi * 31 + 7),
      main_image_pos: "50% 20%",
      is_plusone: fi % 5 === 1,
      generous_lifestyle: fi % 6 === 2,
      weekend_plans: fi % 7 === 1,
      late_night_chat: fi % 8 === 3,
      no_drama: fi % 9 === 0,
      is_verified: fi % 10 < 7,
      basic_info: buildBasicInfo(fi, "Female", femaleLangs),
      lifestyle_info: buildLifestyleInfo(fi),
      relationship_goals: buildRelationshipGoals(fi, "Female", femaleLookingFor),
    });
  }

  // Build male profiles
  for (let mi = 0; mi < TOTAL_MALE; mi++) {
    const cityIdx = mi % CITIES.length;
    const [lat, lng] = COORDS[cityIdx];
    const offset = () => ((mi * 13 + 7) % 100 - 50) / 100 * 0.6;
    const latitude = lat + offset();
    const longitude = lng + offset();
    const { isOnline, last_seen_at } = computeOnlineStatus(TOTAL_FEMALE + mi);
    const imgUrl = MALE_IMAGES_UNSPLASH[mi % MALE_IMAGES_UNSPLASH.length];
    const extraLangs = EXTRA_LANGS_POOL[mi % EXTRA_LANGS_POOL.length];

    const maleLangs = ["Indonesian", ...(extraLangs || [])];
    const maleLookingFor = LOOKING_FOR_MALE[mi % LOOKING_FOR_MALE.length];
    profiles.push({
      id: `indo-m-${mi}`,
      name: MALE_NAMES[mi % MALE_NAMES.length],
      age: 21 + (mi % 15),
      city: CITIES[cityIdx],
      country: "Indonesia",
      bio: MALE_BIOS[mi % MALE_BIOS.length],
      image: imgUrl,
      images: [imgUrl, MALE_IMAGES_UNSPLASH[(mi + 8) % MALE_IMAGES_UNSPLASH.length], MALE_IMAGES_UNSPLASH[(mi + 17) % MALE_IMAGES_UNSPLASH.length]],
      gender: "Male",
      latitude,
      longitude,
      available_tonight: mi % 4 === 0,
      looking_for: maleLookingFor,
      last_seen_at,
      languages: maleLangs,
      first_date_places: buildFirstDatePlaces(CITIES[cityIdx], latitude, longitude, mi * 47 + 13),
      main_image_pos: "50% 20%",
      is_plusone: mi % 6 === 2,
      generous_lifestyle: mi % 7 === 1,
      weekend_plans: mi % 5 === 3,
      late_night_chat: mi % 8 === 0,
      no_drama: mi % 9 === 4,
      is_verified: mi % 10 < 7,
      basic_info: buildBasicInfo(mi, "Male", maleLangs),
      lifestyle_info: buildLifestyleInfo(mi),
      relationship_goals: buildRelationshipGoals(mi, "Male", maleLookingFor),
    });
  }

  // Shuffle so males and females are interleaved (not all females first)
  for (let i = profiles.length - 1; i > 0; i--) {
    const j = (i * 1664525 + 1013904223) % (i + 1);
    [profiles[i], profiles[j]] = [profiles[j], profiles[i]];
  }

  // Override female profiles with real uploaded local assets (faces guaranteed)
  const girlOverrides: { img: string; gallery: string[]; pos: string }[] = [
    { img: indoGirl1,  gallery: [indoGirl1,  indoGirl2],  pos: "50% 20%" },
    { img: indoGirl3,  gallery: [indoGirl3,  indoGirl27], pos: "50% 15%" },
    { img: indoGirl4,  gallery: [indoGirl4,  indoGirl26], pos: "50% 20%" },
    { img: indoGirl5,  gallery: [indoGirl5,  indoGirl7],  pos: "50% 15%" },
    { img: indoGirl6,  gallery: [indoGirl6,  indoGirl29], pos: "50% 25%" },
    { img: indoGirl8,  gallery: [indoGirl8,  indoGirl30], pos: "50% 20%" },
    { img: indoGirl9,  gallery: [indoGirl9,  indoGirl32], pos: "50% 20%" },
    { img: indoGirl10, gallery: [indoGirl10, indoGirl33], pos: "50% 15%" },
    { img: indoGirl11, gallery: [indoGirl11, indoGirl34], pos: "50% 15%" },
    { img: indoGirl12, gallery: [indoGirl12, indoGirl28], pos: "50% 20%" },
    { img: indoGirl13, gallery: [indoGirl13, indoGirl31], pos: "50% 15%" },
    { img: indoGirl14, gallery: [indoGirl14, indoGirl20], pos: "50% 20%" },
    { img: indoGirl15, gallery: [indoGirl15, indoGirl21], pos: "50% 15%" },
    { img: indoGirl16, gallery: [indoGirl16, indoGirl26], pos: "50% 15%" },
    { img: indoGirl17, gallery: [indoGirl17, indoGirl34], pos: "50% 15%" },
    { img: indoGirl18, gallery: [indoGirl18, indoGirl27], pos: "50% 15%" },
    { img: indoGirl19, gallery: [indoGirl19, indoGirl30], pos: "50% 15%" },
    { img: indoGirl20, gallery: [indoGirl20, indoGirl2],  pos: "50% 15%" },
    { img: indoGirl21, gallery: [indoGirl21, indoGirl4],  pos: "50% 15%" },
    { img: indoGirl22, gallery: [indoGirl22, indoGirl6],  pos: "50% 15%" },
    { img: indoGirl23, gallery: [indoGirl23, indoGirl8],  pos: "50% 15%" },
    { img: indoGirl24, gallery: [indoGirl24, indoGirl9],  pos: "50% 15%" },
    { img: indoGirl25, gallery: [indoGirl25, indoGirl11], pos: "50% 15%" },
    { img: indoGirl26, gallery: [indoGirl26, indoGirl13], pos: "50% 15%" },
    { img: indoGirl27, gallery: [indoGirl27, indoGirl1],  pos: "50% 15%" },
    { img: indoGirl28, gallery: [indoGirl28, indoGirl3],  pos: "50% 15%" },
    { img: indoGirl29, gallery: [indoGirl29, indoGirl5],  pos: "50% 15%" },
    { img: indoGirl30, gallery: [indoGirl30, indoGirl8],  pos: "50% 20%" },
    { img: indoGirl31, gallery: [indoGirl31, indoGirl10], pos: "50% 15%" },
    { img: indoGirl32, gallery: [indoGirl32, indoGirl12], pos: "50% 15%" },
    { img: indoGirl33, gallery: [indoGirl33, indoGirl14], pos: "50% 15%" },
    { img: indoGirl34, gallery: [indoGirl34, indoGirl16], pos: "50% 15%" },
    { img: indoGirl2,  gallery: [indoGirl2,  indoGirl18], pos: "50% 15%" },
    { img: indoGirl7,  gallery: [indoGirl7,  indoGirl19], pos: "50% 15%" },
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

  // Override male profiles with real uploaded local assets
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
