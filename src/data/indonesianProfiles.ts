import { Profile, BasicInfo, LifestyleInfo, RelationshipGoals } from "@/shared/types/profile";
import { generateAppUserId } from "@/shared/utils/userIdUtils";
import indoGirl1 from "@/assets/images/indo-girl-1.png";
import indoGirl2 from "@/assets/images/indo-girl-2.png";
import indoGirl3 from "@/assets/images/indo-girl-3.png";
import indoGirl4 from "@/assets/images/indo-girl-4.png";
import indoGirl5 from "@/assets/images/indo-girl-5.png";
import indoGirl6 from "@/assets/images/indo-girl-6.png";
import indoGirl7 from "@/assets/images/indo-girl-7.png";
import indoGirl8 from "@/assets/images/indo-girl-8.png";
import indoGirl9 from "@/assets/images/indo-girl-9.png";
import indoGirl10 from "@/assets/images/indo-girl-10.png";
import indoGirl11 from "@/assets/images/indo-girl-11.png";
import indoGirl12 from "@/assets/images/indo-girl-12.png";
import indoGirl13 from "@/assets/images/indo-girl-13.png";
import indoGirl14 from "@/assets/images/indo-girl-14.png";
import indoGirl15 from "@/assets/images/indo-girl-15.png";
import indoGirl16 from "@/assets/images/indo-girl-16.png";
import indoGirl17 from "@/assets/images/indo-girl-17.png";
import indoGirl18 from "@/assets/images/indo-girl-18.png";
import indoGirl19 from "@/assets/images/indo-girl-19.png";
import indoGirl20 from "@/assets/images/indo-girl-20.png";
import indoGirl21 from "@/assets/images/indo-girl-21.png";
import indoGirl22 from "@/assets/images/indo-girl-22.png";
import indoGirl23 from "@/assets/images/indo-girl-23.png";
import indoGirl24 from "@/assets/images/indo-girl-24.png";
import indoGirl25 from "@/assets/images/indo-girl-25.png";
import indoGirl26 from "@/assets/images/indo-girl-26.png";
import indoGirl27 from "@/assets/images/indo-girl-27.png";
import indoGirl28 from "@/assets/images/indo-girl-28.png";
import indoGirl29 from "@/assets/images/indo-girl-29.png";
import indoGirl30 from "@/assets/images/indo-girl-30.png";
import indoGirl31 from "@/assets/images/indo-girl-31.png";
import indoGirl32 from "@/assets/images/indo-girl-32.png";
import indoGirl33 from "@/assets/images/indo-girl-33.png";
import indoGirl34 from "@/assets/images/indo-girl-34.png";
import indoGuy1 from "@/assets/images/indo-guy-1.png";
import indoGuy2 from "@/assets/images/indo-guy-2.png";
import indoGuy3 from "@/assets/images/indo-guy-3.png";
import indoGuy4 from "@/assets/images/indo-guy-4.png";
import indoGuy5 from "@/assets/images/indo-guy-5.png";
import indoGuy6 from "@/assets/images/indo-guy-6.png";
import indoGuy7 from "@/assets/images/indo-guy-7.png";
import indoGuy8 from "@/assets/images/indo-guy-8.png";
import indoGuy9 from "@/assets/images/indo-guy-9.png";

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
  "Putri", "Dewi", "Sari", "Ayu", "Rina", "Wulan", "Indah", "Ratna", "Mega", "Dian",
  "Lestari", "Anisa", "Fitri", "Nurul", "Sinta", "Kartika", "Melati", "Citra", "Bunga", "Kirana",
  "Dinda", "Nadia", "Laras", "Tari", "Widya", "Ariani", "Bella", "Cahya", "Devi", "Eka",
  "Farah", "Gita", "Hasna", "Intan", "Jasmine", "Kezia", "Lila", "Maya", "Nova", "Olivia",
  "Puspita", "Qanita", "Rara", "Salma", "Tiara", "Ulfa", "Vina", "Widi", "Xena", "Yola",
  "Zahra", "Amira", "Binta", "Celine", "Diana", "Elsa", "Fanny", "Grace", "Hana", "Ines",
  "Jihan", "Krisna", "Lana", "Mira", "Nayla", "Ophi", "Putri", "Qisti", "Reni", "Sela",
  "Tria", "Uma", "Vera", "Wenny", "Yasmin", "Zelia", "Adinda", "Brena", "Calista", "Dahlia",
  "Elina", "Firda", "Ghina", "Hesti", "Ira", "Julita", "Katya", "Lidya", "Mala", "Nisa",
  "Okta", "Prisca", "Reina", "Shinta", "Tasya", "Uswah", "Vanya", "Winni", "Xanthe", "Yuni",
];

const MALE_NAMES = [
  "Budi", "Rizky", "Dimas", "Arief", "Bayu", "Dwi", "Eko", "Gilang",
  "Hendra", "Irfan", "Joko", "Kevin", "Made", "Naufal", "Oka",
  "Teguh", "Umar", "Vito", "Wahyu", "Xander", "Yusuf", "Zaki",
  "Adrian", "Bima", "Chandra", "Daffa", "Evan", "Fajar", "Guntur",
  "Hanif", "Ivan", "Jaya",
];

const CITIES = [
  "Jakarta", "Bali", "Bandung", "Surabaya", "Yogyakarta",
  "Medan", "Semarang", "Makassar", "Malang", "Solo",
  "Palembang", "Balikpapan", "Manado", "Pontianak", "Lombok",
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
  "Marketing exec by day, home chef by night 🍳 Cari jodoh yang bisa ikut makan malam seru",
  "Freelance designer based in Bali 🎨 Lagi cari teman hidup yang suka sunset di Seminyak",
  "Med student, coffee addict ☕ Kencan serius only — let's grab nasi goreng sometime?",
  "Teaching English to kids 📚 Weekend hiker, cari pasangan yang suka alam & petualangan",
  "Working in fintech 💼 Single di Jakarta, obsessed with matcha & bookstores. Mau kencan?",
  "Fashion buyer ✨ Jodoh online memang ada — always planning my next trip, love Komodo Island",
  "Nurse at RS Siloam 🏥 Enjoy cooking for friends and karaoke nights. Cari kencan serius 💕",
  "Content creator 📱 Cat mom to 3 rescue babies 🐱 DM langsung via WhatsApp ya!",
  "Accountant who dreams of opening a bakery 🧁 Cari pasangan hidup yang suka dessert juga",
  "Environmental scientist 🌿 Beach cleanups on weekends — cari jodoh yang peduli lingkungan",
  "Graphic designer & part-time DJ 🎧 Always discovering new music — single & ready to mingle",
  "Hotel management graduate 🏨 Cari kencan di Bali? Love meeting people from different cultures",
  "Psychology student 🧠 Good listener, better cook. Cari teman hidup yang genuine. Try me!",
  "Software engineer 💻 Yoga every morning, gaming every night — kencan serius di Jakarta 💙",
  "Dance teacher 💃 Salsa, contemporary, traditional — cari jodoh yang mau nari bareng",
  "Pharmacist by profession, traveler by heart ✈️ 15 countries and counting — cari pasangan serius",
  "Interior designer 🏠 Bisa rearrange your living room — and help us find jodoh online together",
  "Marine biologist 🐠 Cari pasangan yang cinta laut seperti aku. Kencan di Bali? Let's talk",
  "Journalist 📝 Always chasing stories — single di Jakarta, cari jodoh yang seru diajak ngobrol",
  "Pilates instructor 🧘‍♀️ Believe in balance — cari kencan serius, bukan main-main 🌸",
  "Architect student 📐 Love old buildings and new conversations — aplikasi kencan terbaik bawa kita ke sini",
  "Barista at a specialty coffee shop ☕ I'll make you the perfect cup — yuk kencan offline!",
  "Digital marketer 📊 Weekend painter, terrible singer but enthusiastic — cari teman hidup 💌",
  "Law student ⚖️ Kencan serius only — debate me over dinner?",
  "Veterinarian 🐾 My golden retriever approves all my dates first — cari jodoh yang suka hewan",
  "Flight attendant ✈️ Based in Jakarta but my heart belongs everywhere — cari pasangan hidup",
  "Beauty influencer 💄 Honest reviews, real opinions — cari jodoh online yang jujur & serius",
  "Product manager at a startup 🚀 Weekend runner — single Indonesia yang siap kencan serius",
  "Event organiser 🎉 If there's a party, I probably planned it — cari pasangan yang aktif",
  "Culinary arts student 🍱 Javanese cuisine with a modern twist — kencan sambil makan enak yuk",
  "Yoga instructor & wellness coach 🌸 Cari jodoh yang hidup sehat & mau komitmen serius",
  "Fashion illustrator ✏️ Drawing what I wish I could wear — jodoh online itu nyata, percaya deh",
  "Real estate agent 🏡 Good at finding hidden gems — termasuk cari pasangan hidup di sini 💕",
  "University lecturer 📖 Philosophy & literature — cari kencan serius, let's have a proper conversation",
  "Tattoo artist 🖋️ My body is a canvas — cari pasangan hidup yang berani & kreatif",
  "Surf girl 🏄‍♀️ Canggu mornings, Bali sunsets — cari co-pilot untuk kencan serius",
  "Pediatric nurse 👶 Passionate about community care — single & cari jodoh yang baik hati",
  "App developer 📲 Building something cool — cari teman hidup yang suka tech & boardgames",
  "Entrepreneur running an online batik boutique 🪴 Cari jodoh yang cinta budaya Indonesia",
  "Sports physiotherapist 💪 Train smart — cari pasangan serius yang active lifestyle",
  "Food stylist 🍜 Making Indonesian food look beautiful — kencan sambil kulineran? Yuk!",
  "Scuba instructor 🤿 Took 200+ people to their first reef — cari jodoh yang suka laut",
  "Singer-songwriter 🎵 Open mics around Jakarta — cari kencan serius, bukan sekadar chat",
  "Corporate lawyer ⚖️ Intimidating in the boardroom — cari pasangan hidup yang soft at heart",
  "Ceramics artist 🏺 My studio is my happy place — jodoh online itu nyata, ketemu di sini",
  "High school biology teacher 🔬 Science nerd — cari teman kencan yang suka K-drama & hiking",
  "Brand strategist 🎯 Making brands memorable — cari pasangan hidup yang punya goals jelas",
  "Midwife & maternal health advocate 🌺 Cari jodoh yang family-oriented & serius",
  "Luxury travel blogger 🌏 Seminyak to Santorini — cari co-traveler sekaligus pasangan hidup",
  "Data analyst 📈 By day I find patterns — malam ini cari jodoh di aplikasi kencan terbaik",
];

const MALE_BIOS = [
  "Software developer 💻 Weekend surfer in Kuta — cari pasangan hidup yang chill & genuine",
  "Running a small coffee roastery in Bandung ☕ Cari jodoh yang suka ngopi bareng. Let's talk!",
  "Civil engineer building bridges 🌉 Cari kencan serius di Jakarta — siap komitmen",
  "Photographer 📸 Chasing golden hours across Java — cari teman hidup yang suka traveling",
  "Chef at a fusion restaurant 🍜 Cari jodoh yang suka kulineran — I'll cook you something amazing",
  "Startup founder in edtech 🚀 Single Indonesia yang cari pasangan serius & punya visi sama",
  "Music producer 🎵 Guitar player, vinyl collector — jodoh online itu nyata, ketemu di sini",
  "Doctor at a community clinic 🩺 Cari pasangan hidup yang family-oriented & caring",
  "Architect designing sustainable homes 🏡 Cari jodoh yang cinta alam & mau kencan serius",
  "Marine tour guide in Raja Ampat 🤿 Cari teman kencan yang suka petualangan — best life!",
  "Teacher and part-time soccer coach ⚽ Kids call me Pak Cool — cari pasangan yang down to earth",
  "Import-export business 📦 20+ countries — cari jodoh di aplikasi kencan terbaik Indonesia",
  "Mechanical engineer 🔧 Weekend motorbike adventures — cari kencan serius di Surabaya",
  "Graphic designer & street art enthusiast 🎨 Cari jodoh di Jogja — know every mural in town",
  "Personal trainer 💪 Help you get fit — cari pasangan hidup yang sehat & aktif",
  "Pilot trainee ✈️ Head in the clouds — cari kencan serius, bukan sekadar swipe",
  "Marine biologist studying coral reefs 🐙 Cari teman hidup yang peduli lingkungan",
  "Rice farmer's son turned tech entrepreneur 🌾➡️💻 Cari jodoh yang appreciate kerja keras",
  "Surf instructor in Canggu 🏄 Chill vibes only — kencan di Bali? DM langsung ya!",
  "Dentist with a sweet tooth 🦷🍫 Cari pasangan serius yang bisa tertawa sama ironi ini",
  "Film student 🎬 Making docs about Indonesian culture — cari jodoh yang cinta budaya kita",
  "Hotel manager in Ubud 🏨 Hospitality is in my blood — cari kencan serius di Bali",
  "Freelance translator 🌐 Speak 4 languages — cari pasangan hidup yang open-minded",
  "Environmental activist 🌍 Cari jodoh yang peduli bumi — planting trees one weekend at a time",
  "Culinary school graduate 👨‍🍳 My rendang is legendary — cari teman makan sekaligus jodoh",
  "Investment banker 💼 Weekend trail runner — single di Jakarta, cari kencan serius 💪",
  "Barista champion ☕ Third wave coffee — cari pasangan yang appreciate hal-hal kecil",
  "Motorbike mechanic 🏍️ Restoring classic bikes — cari jodoh yang suka adventure",
  "Navy officer ⚓ Disciplined & ready for adventure — cari pasangan hidup yang setia",
  "Digital nomad & UX designer 🖥️ Working from Bali — cari co-pilot untuk kencan & hidup",
];

const LOOKING_FOR_FEMALE = [
  "Dating", "Relationship", "Dating", "Relationship", "Dating",
  "Friendship", "Relationship", "Dating", "Relationship", "Dating",
  "Friendship", "Dating", "Relationship", "Dating", "Relationship",
  "Dating", "Friendship", "Relationship", "Dating", "Relationship",
  "Dating", "Relationship", "Dating", "Friendship", "Relationship",
  "Dating", "Relationship", "Dating", "Relationship", "Friendship",
  "Dating", "Relationship", "Friendship", "Dating", "Relationship",
  "Dating", "Relationship", "Dating", "Friendship", "Relationship",
  "Dating", "Relationship", "Dating", "Relationship", "Dating",
  "Friendship", "Relationship", "Dating", "Relationship", "Dating",
];

const LOOKING_FOR_MALE = [
  "Dating", "Relationship", "Dating", "Friendship", "Dating",
  "Relationship", "Dating", "Dating", "Relationship", "Friendship",
  "Dating", "Networking", "Relationship", "Dating", "Friendship",
  "Relationship", "Dating", "Dating", "Friendship", "Relationship",
  "Dating", "Relationship", "Dating", "Networking", "Dating",
  "Relationship", "Dating", "Dating", "Friendship", "Relationship",
];

const EXTRA_LANGS_POOL: (string[] | undefined)[] = [
  ["English"], ["English", "Arabic"], ["English"], undefined, ["English"],
  ["Arabic"], ["English"], ["English"], undefined, ["English", "Arabic"],
  ["English"], undefined, ["Arabic"], ["English"], ["English"],
  undefined, ["English", "Arabic"], ["English"], ["Arabic"], ["English"],
  undefined, ["English"], ["English"], ["Arabic"], ["English"],
  ["English"], undefined, ["English", "Arabic"], ["English"], ["Arabic"],
];

const buildGoogleMapsSearchUrl = (query: string, lat: number, lng: number) => {
  const q = `${query} near ${lat.toFixed(4)},${lng.toFixed(4)}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
};

// ── Category image pools — each date idea picks from its category's images ──
const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&h=220&fit=crop`;
const CATEGORY_IMAGES: Record<string, string[]> = {
  cafe: [IMG("1501339847302-ac426a4a7cbb"), IMG("1509042239860-f550ce710b93"), IMG("1445116572660-236099ec97a0"), IMG("1495474472287-4d71bcdd2085"), IMG("1442512595331-e89e73853f31"), IMG("1521017432531-fbd92d768814")],
  food: [IMG("1414235077428-338989a2e8c0"), IMG("1517248135467-4c7edcad34c4"), IMG("1550966871-3ed3cdb51f3a"), IMG("1504674900247-0877df9cc836"), IMG("1565299624946-b28f40a0ae38"), IMG("1476224203421-9ac39bcb3327")],
  dessert: [IMG("1551024601-bec78aea704b"), IMG("1488477181946-6428a0291777"), IMG("1563729784474-d77dbb933a9e"), IMG("1587314168485-3236d6710814"), IMG("1486427944299-d1955d23e34d"), IMG("1567206563064-6f60f40a2b57")],
  park: [IMG("1500534314209-a25ddb2bd429"), IMG("1476673160081-cf065607f449"), IMG("1510270929905-aa8d499cf5fc"), IMG("1473448912268-2022ce9509d8"), IMG("1441974231531-c6227db76b6e"), IMG("1502082553048-f009c37129b9")],
  beach: [IMG("1507525428034-b723cf961d3e"), IMG("1519046904884-53103b34b206"), IMG("1471922694854-ff1b63b20054"), IMG("1520454974749-611b7248ffdb"), IMG("1506953823976-0678e0aaf346"), IMG("1468413253725-0d5181091126")],
  sunset: [IMG("1508193638397-1c4234db14d8"), IMG("1473116763249-2faaef81ccda"), IMG("1414609245224-afa02bfb3fda"), IMG("1506354666786-959d6d497f1a"), IMG("1495616811223-4d98c6e9c869"), IMG("1472120435266-95a3f747eb08")],
  nightlife: [IMG("1527769929938-b77e7fb4c0f3"), IMG("1470337458703-46ad1756a187"), IMG("1566417713940-fe7c737a9ef2"), IMG("1572116469696-31de0f17cc34"), IMG("1516450360452-9312f5e86fc7"), IMG("1429962714451-bb934ecdc4ec")],
  market: [IMG("1555939594-58d7cb561ad1"), IMG("1504544750208-dc0358e63f7f"), IMG("1567521464027-f127ff144326"), IMG("1514933651103-005eec06c04b"), IMG("1529692236671-f1f6cf9683ba"), IMG("1533777857889-4be7d998efb0")],
  art: [IMG("1518998053901-5348d3961a04"), IMG("1531243269054-5ebf6f34081e"), IMG("1544967082-d9d25d867d66"), IMG("1460661419201-fd4cecdf8a8b"), IMG("1513364776144-60967b0f800f"), IMG("1561214115-f2f134cc4912")],
  cooking: [IMG("1556909114-f6e7ad7d3136"), IMG("1507048331197-7d4ac70811cf"), IMG("1466637574441-749b8f19452f"), IMG("1528712306091-ed0763094c98"), IMG("1556910103-1c02745aae4d"), IMG("1551218808-94e220e084d2")],
  music: [IMG("1493225457124-a3eb161ffa5f"), IMG("1501612780327-45045538702b"), IMG("1459749411175-04bf5292ceea"), IMG("1524368535928-5b5e00ddc76b"), IMG("1470229722913-7c0e2dbbafd3"), IMG("1511671782779-c97d3d27a1d4")],
  cinema: [IMG("1489599849927-2ee91cede3ba"), IMG("1536440136628-849c177e76a1"), IMG("1478720568477-152d9b164e26"), IMG("1517604931442-7e0c8ed2963c")],
  active: [IMG("1545232979-a9ba987ce37c"), IMG("1558618666-fcd25c85f82e"), IMG("1596464716388-e3c15a40e69a"), IMG("1544551763-46a013bb70d5"), IMG("1571019614242-c5c5dee9f50c"), IMG("1540479859555-17af45c78602")],
  water: [IMG("1544551763-46a013bb70d5"), IMG("1530053969600-cacd2598338c"), IMG("1516728778615-2d590ea1855e"), IMG("1559827260-dc66d6f5e3a5"), IMG("1504458174710-8ef9f463798f"), IMG("1537519646099-2ee971dcefc0")],
  romantic: [IMG("1470252649378-9c29740c9fa8"), IMG("1475738198235-4b30fc2fca88"), IMG("1507400492013-162706c8c05e"), IMG("1474524955719-b9f87c50ce47"), IMG("1505765050516-f72dcac9c60e"), IMG("1519681393784-d120267933ba")],
  nature: [IMG("1441974231531-c6227db76b6e"), IMG("1472396961693-142e6e269027"), IMG("1518173946687-1e1e4b4d15b7"), IMG("1475113548554-5a36f1f523d6"), IMG("1469474968028-56623f02e42e"), IMG("1426604966848-d7adac402bff")],
  playful: [IMG("1558618666-fcd25c85f82e"), IMG("1596464716388-e3c15a40e69a"), IMG("1571019614242-c5c5dee9f50c"), IMG("1540479859555-17af45c78602"), IMG("1560448204-e02f11c3d0e2"), IMG("1541532713592-79a0317b6b77")],
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

const FEMALE_HEIGHTS = ["155cm", "157cm", "158cm", "160cm", "162cm", "163cm", "165cm", "167cm", "168cm", "170cm"];
const MALE_HEIGHTS = ["168cm", "170cm", "172cm", "174cm", "175cm", "177cm", "178cm", "180cm", "182cm", "185cm"];

const FEMALE_BODY_TYPES = ["Slim", "Petite", "Athletic", "Curvy", "Average"];
const MALE_BODY_TYPES = ["Slim", "Athletic", "Muscular", "Average", "Lean"];

const ETHNICITIES_F = ["Javanese", "Sundanese", "Balinese", "Minangkabau", "Betawi", "Bugis", "Madurese", "Chinese-Indonesian", "Mixed", "Batak"];
const ETHNICITIES_M = ["Javanese", "Sundanese", "Balinese", "Minangkabau", "Betawi", "Bugis", "Makassarese", "Chinese-Indonesian", "Mixed", "Malay"];

const EDUCATIONS = ["High School", "Diploma", "Bachelor's Degree", "Bachelor's Degree", "Bachelor's Degree", "Master's Degree", "Master's Degree", "Doctorate", "Vocational", "Professional Degree"];

const INCOMES = ["< Rp 5M/mo", "Rp 5–10M/mo", "Rp 10–20M/mo", "Rp 20–40M/mo", "Rp 40M+/mo", "Prefer not to say"];

const LIVES_WITH = ["Lives alone", "With family", "With housemates", "With partner", "Own home"];

const CHILDREN_OPTIONS = ["No children", "1 child", "2 children", "3+ children", "No children, open to having", "No children, not planning to"];

const SMOKING_OPTIONS = ["Non-smoker", "Non-smoker", "Social smoker", "Light smoker", "Non-smoker", "Quit smoking"];
const DRINKING_OPTIONS = ["Non-drinker", "Social drinker", "Non-drinker", "Light drinker", "Rarely drinks", "Non-drinker", "Social drinker"];
const EXERCISE_OPTIONS = ["Daily", "4–5×/week", "2–3×/week", "Occasionally", "Rarely", "Weekly gym", "Yoga & pilates", "Running & cycling"];
const DIET_OPTIONS = ["No preference", "Halal only", "Vegetarian", "Mostly healthy", "Loves street food", "Home-cooked meals"];
const SLEEP_OPTIONS = ["Night owl", "Early bird", "Flexible", "Late sleeper", "Varies by week", "Usually by midnight"];
const SOCIAL_STYLES = ["Introvert", "Ambivert", "Extrovert", "Social but selective", "Homebody", "Outgoing"];
const LOVE_LANGUAGES = ["Quality time", "Words of affirmation", "Acts of service", "Physical touch", "Gift giving", "Quality time", "Words of affirmation"];
const PETS_OPTIONS = ["Cat lover", "Dog person", "Has cats", "Has a dog", "No pets", "Animal lover", "Allergic to pets", "Open to pets"];

const HOBBIES_POOL: string[][] = [
  ["Cooking", "Hiking", "Reading"],
  ["Travel", "Photography", "Yoga"],
  ["Music", "Dancing", "Cooking"],
  ["Gaming", "Movies", "Gym"],
  ["Painting", "Cycling", "Coffee"],
  ["Surfing", "Swimming", "Food tours"],
  ["Badminton", "Running", "Karaoke"],
  ["Gardening", "Baking", "Journaling"],
  ["Diving", "Motorbike trips", "Street photography"],
  ["Crafts", "Watching K-dramas", "Board games"],
];

const RELIGIONS_F = ["Muslim", "Muslim", "Muslim", "Muslim", "Muslim", "Christian", "Hindu", "Buddhist", "Catholic", "Muslim"];
const RELIGIONS_M = ["Muslim", "Muslim", "Muslim", "Muslim", "Muslim", "Christian", "Hindu", "Buddhist", "Catholic", "Muslim"];
const PRAYER_OPTS = ["5× daily", "Regularly", "Occasionally", "Fridays only", "Trying to improve", "Not practicing"];
const HIJAB_OPTS = ["Yes, full hijab", "Yes, sometimes", "No", "Syari", "Prefer not to say"];
const DATE_TYPES = ["Traditional courtship", "Modern casual dating", "Getting to know first", "Halal approach", "Open to both"];
const TIMELINES = ["Ready when it feels right", "Within 1 year", "1–2 years", "Not rushing", "Serious about marriage"];
const MARITAL_OPTS = ["Never married", "Divorced", "Widowed", "Prefer not to say"];
const LAST_REL_TYPE_OPTS = ["Long-term partner", "Short-term dating", "Marriage / Engaged", "On-and-off relationship", "Long distance", "Never been in a relationship"];
const REL_LENGTH_OPTS = ["Less than 6 months", "6–12 months", "1–2 years", "2–4 years", "5–7 years", "8–10 years", "10+ years"];
const SINGLE_FOR_OPTS = ["Just ended (< 1 month)", "A few months", "About 6 months", "About a year", "1–2 years", "2–5 years", "5+ years"];
const DOWRY_OPTS = ["Open to discussion", "Important to my family", "Flexible", "Symbolic amount", "Not required"];
const FAMILY_OPTS = ["Very important", "Somewhat involved", "Independent decision", "Meet the family first"];
const PARENT_SUPPORT_OPTS = [
  "Yes — I fully support my parents financially",
  "Yes — I contribute regularly to household expenses",
  "Occasionally when they need help",
  "No — my parents are financially independent",
];
const MARRIAGE_COUNT_OPTS = ["Never been married", "Never been married", "Never been married", "Married once", "Never been married", "Never been married", "Married once", "Never been married"];
const MARRIAGE_REG_OPTS = ["State / legally registered", "Religious or traditional ceremony only", "Both state-registered and religious", "Not applicable"];
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
  // Relationship history — not every profile has these (stagger with modulo)
  ...(i % 4 !== 0 ? { last_relationship_type: LAST_REL_TYPE_OPTS[i % LAST_REL_TYPE_OPTS.length] } : {}),
  ...(i % 4 !== 0 && i % 5 !== 0 ? { relationship_length: REL_LENGTH_OPTS[i % REL_LENGTH_OPTS.length] } : {}),
  ...(i % 3 !== 0 ? { single_for: SINGLE_FOR_OPTS[i % SINGLE_FOR_OPTS.length] } : {}),
  religion: gender === "Female" ? RELIGIONS_F[i % RELIGIONS_F.length] : RELIGIONS_M[i % RELIGIONS_M.length],
  prayer: PRAYER_OPTS[i % PRAYER_OPTS.length],
  ...(gender === "Female" ? { hijab: HIJAB_OPTS[i % HIJAB_OPTS.length] } : {}),
  dowry: DOWRY_OPTS[i % DOWRY_OPTS.length],
  family_involvement: FAMILY_OPTS[i % FAMILY_OPTS.length],
  about_partner: ABOUT_PARTNER_POOL[i % ABOUT_PARTNER_POOL.length],
  parent_financial_support: PARENT_SUPPORT_OPTS[i % PARENT_SUPPORT_OPTS.length],
  marriage_count: MARRIAGE_COUNT_OPTS[i % MARRIAGE_COUNT_OPTS.length],
  ...(MARRIAGE_COUNT_OPTS[i % MARRIAGE_COUNT_OPTS.length] !== "Never been married"
    ? { marriage_registration: MARRIAGE_REG_OPTS[i % MARRIAGE_REG_OPTS.length] }
    : {}),
});

// Derive the primary badge for a profile index + gender, mirroring the flag logic below.
const derivePrimaryBadge = (i: number, gender: "Female" | "Male"): string | null => {
  if (gender === "Female") {
    if (i % 5 === 1) return "is_plusone";
    if (i % 3 === 0) return "available_tonight";
    if (i % 6 === 2) return "generous_lifestyle";
    if (i % 7 === 1) return "weekend_plans";
    if (i % 8 === 3) return "late_night_chat";
    if (i % 9 === 0) return "no_drama";
  } else {
    if (i % 6 === 2) return "is_plusone";
    if (i % 4 === 0) return "available_tonight";
    if (i % 7 === 1) return "generous_lifestyle";
    if (i % 5 === 3) return "weekend_plans";
    if (i % 8 === 0) return "late_night_chat";
    if (i % 9 === 4) return "no_drama";
  }
  return null; // no badge — premium profile
};

// Base offline-window start hour per badge/persona (all windows = 8 hrs → 16 hrs online).
// Jitter of 0–2 hrs per profile keeps same-badge profiles from all going offline together.
const BADGE_OFFLINE_START: Record<string, number> = {
  late_night_chat:   8,  // day sleeper — offline 08–16, awake evenings/nights
  available_tonight: 3,  // party/social — offline 03–11, active from midday onward
  is_plusone:        12, // event person — offline 12–20, rests midday, out at night
  generous_lifestyle: 2, // luxury lifestyle — offline 02–10, late riser
  weekend_plans:     0,  // regular schedule — offline 00–08
  no_drama:          22, // early bird — offline 22–06, sleeps early
  is_visiting:       23, // tourist — offline 23–07, early exploring days
};
const PREMIUM_OFFLINE_START = 4; // no-badge premium — offline 04–12, sleeps very late

const computeOnlineStatus = (
  profileIndex: number,
  gender: "Female" | "Male" = "Female",
): { isOnline: boolean; last_seen_at: string } => {
  const now = Date.now();
  const currentHour = new Date().getHours();
  const currentMin  = new Date().getMinutes();

  const badge = derivePrimaryBadge(profileIndex, gender);
  const baseStart = badge ? (BADGE_OFFLINE_START[badge] ?? PREMIUM_OFFLINE_START) : PREMIUM_OFFLINE_START;
  // 0–2 hr jitter so same-badge profiles stagger naturally
  const jitter = (profileIndex * 3 + 1) % 3;
  const offlineStart = (baseStart + jitter) % 24;
  const offlineEnd   = (offlineStart + 8) % 24;

  const nowFrac    = currentHour + currentMin / 60;
  const endFrac    = offlineStart < offlineEnd ? offlineEnd : offlineEnd + 24;
  const nowFracAdj = nowFrac < offlineStart ? nowFrac + 24 : nowFrac;
  const inOffline  = nowFracAdj >= offlineStart && nowFracAdj < endFrac;

  const isOnline = !inOffline;
  const last_seen_at = isOnline
    // Within last ~2 min — always passes the 3-min isOnline() threshold
    ? new Date(now - (profileIndex % 7) * 20_000).toISOString()
    // 1–3 hrs ago — clearly offline
    : new Date(now - (60 + (profileIndex % 120)) * 60_000).toISOString();

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
    const { last_seen_at: _f_last_seen } = computeOnlineStatus(fi, "Female");
    // Force half of tonight/weekend profiles always online — they're actively using the app
    const fIsTonight = fi % 3 === 0;
    const fIsWeekend = fi % 7 === 1;
    const fForceOnline = (fIsTonight && fi % 2 === 0) || (fIsWeekend && fi % 2 === 0);
    const last_seen_at = fForceOnline
      ? new Date(Date.now() - (fi % 7) * 20_000).toISOString()
      : _f_last_seen;
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
      app_user_id: generateAppUserId(`indo-f-${fi}`),
      bestie_ids: fi % 11 === 0
        // Mixed: 2 females + 1 male
        ? [`indo-f-${(fi + 1) % TOTAL_FEMALE}`, `indo-f-${(fi + 5) % TOTAL_FEMALE}`, `indo-m-${fi % TOTAL_MALE}`]
        : fi % 11 === 1
        // Female-only: 3 besties
        ? [`indo-f-${(fi + 2) % TOTAL_FEMALE}`, `indo-f-${(fi + 8) % TOTAL_FEMALE}`, `indo-f-${(fi + 14) % TOTAL_FEMALE}`]
        : fi % 11 === 2
        // Mixed: 1 female + 2 males
        ? [`indo-f-${(fi + 3) % TOTAL_FEMALE}`, `indo-m-${(fi + 1) % TOTAL_MALE}`, `indo-m-${(fi + 4) % TOTAL_MALE}`]
        : fi % 11 === 3
        // Female-only: 2 besties
        ? [`indo-f-${(fi + 4) % TOTAL_FEMALE}`, `indo-f-${(fi + 11) % TOTAL_FEMALE}`]
        : fi % 11 === 4
        // Male-only friend (1 mate)
        ? [`indo-m-${(fi + 2) % TOTAL_MALE}`]
        : fi % 11 === 5
        // Mixed: 1 female + 1 male
        ? [`indo-f-${(fi + 6) % TOTAL_FEMALE}`, `indo-m-${(fi + 3) % TOTAL_MALE}`]
        : fi % 11 === 6
        // Female-only: 1 bestie
        ? [`indo-f-${(fi + 9) % TOTAL_FEMALE}`]
        : fi % 11 === 7
        // Mixed: 2 males
        ? [`indo-m-${(fi + 5) % TOTAL_MALE}`, `indo-m-${(fi + 7) % TOTAL_MALE}`]
        : [],
    });
  }

  // Build male profiles
  for (let mi = 0; mi < TOTAL_MALE; mi++) {
    const cityIdx = mi % CITIES.length;
    const [lat, lng] = COORDS[cityIdx];
    const offset = () => ((mi * 13 + 7) % 100 - 50) / 100 * 0.6;
    const latitude = lat + offset();
    const longitude = lng + offset();
    const { last_seen_at: _m_last_seen } = computeOnlineStatus(mi, "Male");
    // Force half of tonight/weekend profiles always online
    const mIsTonight = mi % 4 === 0;
    const mIsWeekend = mi % 5 === 3;
    const mForceOnline = (mIsTonight && mi % 2 === 0) || (mIsWeekend && mi % 2 === 1);
    const last_seen_at = mForceOnline
      ? new Date(Date.now() - (mi % 7) * 20_000).toISOString()
      : _m_last_seen;
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
      app_user_id: generateAppUserId(`indo-m-${mi}`),
      bestie_ids: mi % 9 === 0
        // Mixed: 2 males + 1 female
        ? [`indo-m-${(mi + 1) % TOTAL_MALE}`, `indo-m-${(mi + 3) % TOTAL_MALE}`, `indo-f-${mi % TOTAL_FEMALE}`]
        : mi % 9 === 1
        // Male-only: 3 mates
        ? [`indo-m-${(mi + 2) % TOTAL_MALE}`, `indo-m-${(mi + 4) % TOTAL_MALE}`, `indo-m-${(mi + 6) % TOTAL_MALE}`]
        : mi % 9 === 2
        // Mixed: 1 male + 2 females
        ? [`indo-m-${(mi + 5) % TOTAL_MALE}`, `indo-f-${(mi + 3) % TOTAL_FEMALE}`, `indo-f-${(mi + 9) % TOTAL_FEMALE}`]
        : mi % 9 === 3
        // Male-only: 2 mates
        ? [`indo-m-${(mi + 7) % TOTAL_MALE}`, `indo-m-${(mi + 8) % TOTAL_MALE}`]
        : mi % 9 === 4
        // Female friend only
        ? [`indo-f-${(mi + 5) % TOTAL_FEMALE}`]
        : mi % 9 === 5
        // Mixed: 1 male + 1 female
        ? [`indo-m-${(mi + 2) % TOTAL_MALE}`, `indo-f-${(mi + 7) % TOTAL_FEMALE}`]
        : [],
    });
  }

  // Shuffle so males and females are interleaved (not all females first)
  for (let i = profiles.length - 1; i > 0; i--) {
    const j = (i * 1664525 + 1013904223) % (i + 1);
    [profiles[i], profiles[j]] = [profiles[j], profiles[i]];
  }

  // Override female profiles with real uploaded local assets + handcrafted profile data
  type FeaturedOverride = {
    img: string; gallery: string[]; pos: string;
    name: string; age: number; city: string; bio: string;
    hobbies: string[]; looking_for: string;
  };

  const girlOverrides: FeaturedOverride[] = [
    { img: indoGirl1,  gallery: [indoGirl1, indoGirl2],   pos: "50% 20%", name: "Ayu Maharani",    age: 24, city: "Jakarta",     bio: "Marketing exec at a tech startup ✨ Professionally caffeinated and weekend warung hunter — DM me if you know hidden gems in South Jakarta", hobbies: ["Coffee", "Food tours", "Running"],          looking_for: "Dating"       },
    { img: indoGirl3,  gallery: [indoGirl3, indoGirl27],  pos: "50% 15%", name: "Dewi Kartika",    age: 26, city: "Bali",        bio: "Yoga & meditation teacher in Ubud 🌿 I believe slow mornings and honest conversations are the real luxury. What does your ideal Sunday look like?", hobbies: ["Yoga", "Meditation", "Hiking"],           looking_for: "Relationship" },
    { img: indoGirl4,  gallery: [indoGirl4, indoGirl26],  pos: "50% 20%", name: "Sari Widyastuti", age: 22, city: "Bandung",     bio: "Architecture student drowning in studio deadlines ☕ I survive on kopi susu and live music. Take me to a gig?", hobbies: ["Music", "Coffee", "Sketching"],             looking_for: "Dating"       },
    { img: indoGirl5,  gallery: [indoGirl5, indoGirl7],   pos: "50% 15%", name: "Nadia Lestari",   age: 28, city: "Jakarta",     bio: "UX designer at a fintech startup 💻 I run 10K every Saturday then ruin it all at brunch. Priorities, right?", hobbies: ["Running", "Travel", "Cooking"],             looking_for: "Relationship" },
    { img: indoGirl6,  gallery: [indoGirl6, indoGirl29],  pos: "50% 25%", name: "Kirana Suci",     age: 25, city: "Yogyakarta",  bio: "Batik designer and cultural storyteller 🧵 Born in Jogja, heart in the archipelago. Looking for someone who actually wants to slow down with me", hobbies: ["Batik arts", "Cycling", "Coffee"],          looking_for: "Relationship" },
    { img: indoGirl8,  gallery: [indoGirl8, indoGirl30],  pos: "50% 20%", name: "Bella Rahayu",    age: 23, city: "Surabaya",    bio: "Med student, 3rd year and surviving 😅 I cook as therapy. If you want homemade soto Lamongan, maybe we can work something out", hobbies: ["Cooking", "Reading", "Badminton"],          looking_for: "Dating"       },
    { img: indoGirl9,  gallery: [indoGirl9, indoGirl32],  pos: "50% 20%", name: "Citra Wulandari", age: 27, city: "Jakarta",     bio: "Food content creator 📱 If I stop mid-date to photograph the plate — that's a compliment. It means the food and company are both worth showing off", hobbies: ["Food styling", "Photography", "Travel"],  looking_for: "Dating"       },
    { img: indoGirl10, gallery: [indoGirl10, indoGirl33], pos: "50% 15%", name: "Intan Samudera",  age: 24, city: "Bali",        bio: "Surf instructor and ocean conservationist 🌊 My happy place is anywhere the water is clear. I'll teach you to stand up if you're brave enough", hobbies: ["Surfing", "Diving", "Beach volleyball"], looking_for: "Dating"       },
    { img: indoGirl11, gallery: [indoGirl11, indoGirl34], pos: "50% 15%", name: "Maya Andriani",   age: 29, city: "Bandung",     bio: "Brand strategist, INFJ, proud overthinker 📚 I love a good bookshop date, hilly Bandung roads, and conversations that actually go somewhere", hobbies: ["Reading", "Hiking", "Coffee"],             looking_for: "Relationship" },
    { img: indoGirl12, gallery: [indoGirl12, indoGirl28], pos: "50% 20%", name: "Tiara Chandra",   age: 21, city: "Jakarta",     bio: "Fashion design student ✨ Aesthetic obsessive, K-drama addict, secretly makes the best sambal in my dorm. Swipe right for chaos", hobbies: ["Fashion", "K-dramas", "Cooking"],          looking_for: "Dating"       },
    { img: indoGirl13, gallery: [indoGirl13, indoGirl31], pos: "50% 15%", name: "Ratna Wibowo",    age: 30, city: "Surabaya",    bio: "Pediatrician at RS Premier 🩺 Half-marathons on weekends, banana bread at midnight. Life is about balance — sort of", hobbies: ["Running", "Baking", "Swimming"],            looking_for: "Relationship" },
    { img: indoGirl14, gallery: [indoGirl14, indoGirl20], pos: "50% 20%", name: "Laras Pramudita", age: 25, city: "Yogyakarta",  bio: "Javanese classical dance teacher 💃 I perform at Prambanan and teach children. Looking for someone who appreciates that beauty takes real discipline", hobbies: ["Dance", "Batik", "Travel"],                looking_for: "Relationship" },
    { img: indoGirl15, gallery: [indoGirl15, indoGirl21], pos: "50% 15%", name: "Widya Ningrum",   age: 27, city: "Jakarta",     bio: "Investment analyst at a local bank 💼 By day I analyse numbers, by night I'm unbeatable at board games. Don't judge", hobbies: ["Gaming", "Cycling", "Cooking"],             looking_for: "Dating"       },
    { img: indoGirl16, gallery: [indoGirl16, indoGirl26], pos: "50% 15%", name: "Dinda Asmara",    age: 23, city: "Bandung",     bio: "Barista training for my first SCA competition ☕ I will absolutely judge your coffee order — but only with love", hobbies: ["Coffee", "Baking", "Music"],               looking_for: "Dating"       },
    { img: indoGirl17, gallery: [indoGirl17, indoGirl34], pos: "50% 15%", name: "Nova Prastika",   age: 26, city: "Bali",        bio: "Marine biologist & scuba instructor 🐠 Studying coral reef recovery in Nusa Penida. The ocean keeps giving and so do I", hobbies: ["Scuba diving", "Marine research", "Surfing"], looking_for: "Relationship" },
    { img: indoGirl18, gallery: [indoGirl18, indoGirl27], pos: "50% 15%", name: "Jasmine Utami",   age: 24, city: "Jakarta",     bio: "Law student, debate team captain ⚖️ I like true crime, black coffee, and a good argument. Looking for someone who can hold their own", hobbies: ["Debate", "True crime podcasts", "Reading"], looking_for: "Dating"       },
    { img: indoGirl19, gallery: [indoGirl19, indoGirl30], pos: "50% 15%", name: "Ariani Putri",    age: 28, city: "Surabaya",    bio: "Professional event organizer 🎉 I've planned 200+ events. My social battery is huge — but I save the real me for small settings", hobbies: ["Event planning", "Travel", "Dancing"],    looking_for: "Relationship" },
    { img: indoGirl20, gallery: [indoGirl20, indoGirl2],  pos: "50% 15%", name: "Salma Nafisa",    age: 22, city: "Yogyakarta",  bio: "Psychology student & plant mum 🌿 I have 40 plants and zero chill. Looking for someone to repot succulents with on lazy Sundays", hobbies: ["Plants", "Psychology", "Journaling"],     looking_for: "Dating"       },
    { img: indoGirl21, gallery: [indoGirl21, indoGirl4],  pos: "50% 15%", name: "Fitri Ramadhani", age: 29, city: "Jakarta",     bio: "Senior journalist at Kompas 📰 Chasing stories by day, chasing street food by night. I will talk your ear off — you've been warned", hobbies: ["Journalism", "Street food", "Travel"],    looking_for: "Dating"       },
    { img: indoGirl22, gallery: [indoGirl22, indoGirl6],  pos: "50% 15%", name: "Bunga Pratiwi",   age: 25, city: "Bali",        bio: "Ceramics artist with a studio in Ubud 🏺 My hands are always dirty but my soul is clean. Come throw a pot with me?", hobbies: ["Ceramics", "Painting", "Hiking"],          looking_for: "Relationship" },
    { img: indoGirl23, gallery: [indoGirl23, indoGirl8],  pos: "50% 15%", name: "Eka Yunita",      age: 27, city: "Bandung",     bio: "Software engineer at a local unicorn 💻 Board game nights are my love language. If you beat me at Catan I might propose", hobbies: ["Board games", "Gaming", "Cooking"],        looking_for: "Dating"       },
    { img: indoGirl24, gallery: [indoGirl24, indoGirl9],  pos: "50% 15%", name: "Farah Zahra",     age: 24, city: "Jakarta",     bio: "Flight attendant based in CGK ✈️ 23 countries visited. Currently accepting applications for a travel partner who doesn't overpack", hobbies: ["Travel", "Photography", "Yoga"],          looking_for: "Dating"       },
    { img: indoGirl25, gallery: [indoGirl25, indoGirl11], pos: "50% 15%", name: "Gita Maharani",   age: 26, city: "Surabaya",    bio: "Singer-songwriter playing open mics 🎵 Also a nurse between sets. Life is complicated and I like it that way", hobbies: ["Music", "Singing", "Cooking"],              looking_for: "Relationship" },
    { img: indoGirl26, gallery: [indoGirl26, indoGirl13], pos: "50% 15%", name: "Hana Wijaya",     age: 23, city: "Bali",        bio: "Freelance graphic designer & digital nomad 🎨 Working from cafes in Canggu and pretending I have it figured out. Spoiler: I don't", hobbies: ["Design", "Surfing", "Photography"],       looking_for: "Dating"       },
    { img: indoGirl27, gallery: [indoGirl27, indoGirl1],  pos: "50% 15%", name: "Kartika Dewi",    age: 30, city: "Yogyakarta",  bio: "University lecturer — philosophy & literature 📖 I read Pramoedya for fun. If that doesn't scare you, we'll get along just fine", hobbies: ["Reading", "Writing", "Coffee"],            looking_for: "Relationship" },
    { img: indoGirl28, gallery: [indoGirl28, indoGirl3],  pos: "50% 15%", name: "Mira Santoso",    age: 25, city: "Jakarta",     bio: "Pilates instructor & wellness coach 🧘‍♀️ Helping people find their posture and their peace. Yes, I will comment on how you sit", hobbies: ["Pilates", "Nutrition", "Running"],         looking_for: "Dating"       },
    { img: indoGirl29, gallery: [indoGirl29, indoGirl5],  pos: "50% 15%", name: "Nurul Fajri",     age: 27, city: "Bandung",     bio: "Environmental scientist at ITB 🌿 Organising beach cleanups, studying ocean plastic. Looking for someone who brings their own bag", hobbies: ["Environment", "Hiking", "Cycling"],        looking_for: "Relationship" },
    { img: indoGirl30, gallery: [indoGirl30, indoGirl8],  pos: "50% 20%", name: "Olivia Tanaka",   age: 24, city: "Jakarta",     bio: "Interior designer & half-Japanese ✨ My apartment looks like a magazine and my fridge is always stocked. Come over?", hobbies: ["Interior design", "Cooking", "Movies"],   looking_for: "Dating"       },
    { img: indoGirl31, gallery: [indoGirl31, indoGirl10], pos: "50% 15%", name: "Puspita Handari", age: 28, city: "Surabaya",    bio: "Hotel manager at Shangri-La Surabaya 🏨 I live for exceptional experiences — give me yours and I promise to match it", hobbies: ["Hospitality", "Travel", "Food"],           looking_for: "Relationship" },
    { img: indoGirl32, gallery: [indoGirl32, indoGirl12], pos: "50% 15%", name: "Rara Amelia",     age: 22, city: "Bali",        bio: "Photographer chasing golden hour 📷 Based in Seminyak, shooting portraits and landscapes. I see beauty in things people walk straight past", hobbies: ["Photography", "Travel", "Music"],         looking_for: "Dating"       },
    { img: indoGirl33, gallery: [indoGirl33, indoGirl14], pos: "50% 15%", name: "Tari Handayani",  age: 26, city: "Jakarta",     bio: "Product manager at a B2B startup 🚀 Ship fast, iterate faster. Offline I hike, bake sourdough, and yell at football on TV", hobbies: ["Hiking", "Baking", "Football"],            looking_for: "Dating"       },
    { img: indoGirl34, gallery: [indoGirl34, indoGirl16], pos: "50% 15%", name: "Ulfa Nadia",      age: 29, city: "Bandung",     bio: "Hospital pharmacist & travel blogger 🌏 Visited 18 provinces and counting. Writing about Indonesia's hidden places between night shifts", hobbies: ["Travel", "Writing", "Photography"],       looking_for: "Relationship" },
    { img: indoGirl2,  gallery: [indoGirl2, indoGirl18],  pos: "50% 15%", name: "Vina Kusumawati", age: 23, city: "Yogyakarta",  bio: "Culinary arts student specializing in Javanese cuisine 🍱 Grandma taught me everything. I'm modernizing it — very carefully", hobbies: ["Cooking", "Food history", "Cycling"],     looking_for: "Dating"       },
    { img: indoGirl7,  gallery: [indoGirl7, indoGirl19],  pos: "50% 15%", name: "Wulan Saraswati", age: 25, city: "Jakarta",     bio: "Tattoo artist based in Kemang 🖋️ Covered in ink and full of opinions. Cat mum to two rescues 🐱 The studio is my home", hobbies: ["Tattoo art", "Music", "Cats"],             looking_for: "Dating"       },
  ];

  const featuredFemaleIds: string[] = [];
  let girlIdx = 0;
  for (let i = 0; i < profiles.length && girlIdx < girlOverrides.length; i++) {
    if (profiles[i].gender === "Female") {
      const o = girlOverrides[girlIdx++];
      profiles[i].image = o.img;
      profiles[i].images = o.gallery;
      profiles[i].main_image_pos = o.pos;
      profiles[i].name = o.name;
      profiles[i].age = o.age;
      profiles[i].city = o.city;
      profiles[i].bio = o.bio;
      profiles[i].looking_for = o.looking_for;
      if (profiles[i].lifestyle_info) profiles[i].lifestyle_info!.hobbies = o.hobbies;
      featuredFemaleIds.push(profiles[i].id);
    }
  }

  // Override male profiles with real uploaded local assets + handcrafted profile data
  const guyOverrides: FeaturedOverride[] = [
    { img: indoGuy1, gallery: [indoGuy1, indoGuy7], pos: "50% 15%", name: "Rizky Firmansyah", age: 27, city: "Jakarta",    bio: "Backend developer at a fintech company 💻 Surf Kuta on weekends, cold brew every morning. Let's debate whether Bali is overrated (it's not)", hobbies: ["Surfing", "Coffee", "Gaming"],            looking_for: "Dating"       },
    { img: indoGuy2, gallery: [indoGuy2, indoGuy8], pos: "50% 15%", name: "Dimas Pratama",    age: 30, city: "Bandung",    bio: "Former VC analyst, now running a coffee roastery ☕ Best decision I ever made. Come try something not on any menu yet", hobbies: ["Coffee", "Business", "Hiking"],            looking_for: "Relationship" },
    { img: indoGuy3, gallery: [indoGuy3, indoGuy9], pos: "50% 15%", name: "Arief Nugroho",    age: 28, city: "Yogyakarta", bio: "Civil engineer building bridges — literally 🌉 Trail run every weekend, Bromo twice a year. Looking for someone to share the summit view with", hobbies: ["Trail running", "Hiking", "Photography"], looking_for: "Relationship" },
    { img: indoGuy4, gallery: [indoGuy4, indoGuy7], pos: "50% 15%", name: "Bayu Santoso",     age: 25, city: "Jakarta",    bio: "Freelance photographer chasing golden hours across Indonesia 📸 Java, Flores, Kalimantan — if there's good light, I'm there", hobbies: ["Photography", "Travel", "Music"],         looking_for: "Dating"       },
    { img: indoGuy5, gallery: [indoGuy5, indoGuy8], pos: "50% 15%", name: "Eko Prasetyo",     age: 32, city: "Surabaya",   bio: "Co-founder of an edtech platform 🚀 Went from public school kid to building classrooms for 50,000 students. Still figuring the rest out", hobbies: ["Education tech", "Running", "Reading"],   looking_for: "Relationship" },
    { img: indoGuy6, gallery: [indoGuy6, indoGuy9], pos: "50% 15%", name: "Gilang Wibowo",    age: 26, city: "Bali",       bio: "Surf instructor by day, yoga at sunset 🏄 Canggu life. Spiritually fed, professionally salty. Looking for a co-pilot, not a passenger", hobbies: ["Surfing", "Yoga", "Cooking"],              looking_for: "Dating"       },
    { img: indoGuy7, gallery: [indoGuy7, indoGuy1], pos: "50% 15%", name: "Hendra Santoso",   age: 29, city: "Jakarta",    bio: "Music producer & session guitarist 🎵 Vinyl collector and gig junkie. If you know the difference between reverb and delay, let's talk", hobbies: ["Music production", "Guitar", "Live music"], looking_for: "Relationship" },
    { img: indoGuy8, gallery: [indoGuy8, indoGuy2], pos: "50% 15%", name: "Irfan Hakim",      age: 27, city: "Bandung",    bio: "Personal trainer & sports nutritionist 💪 I help people get strong. Off the clock I'm surprisingly soft — yes I cry at Studio Ghibli", hobbies: ["Fitness", "Cooking", "Movies"],           looking_for: "Dating"       },
    { img: indoGuy9, gallery: [indoGuy9, indoGuy3], pos: "50% 15%", name: "Kevin Tandean",    age: 31, city: "Jakarta",    bio: "Architect designing sustainable buildings 🏡 Half Chinese-Indonesian. I have strong opinions about mall design in Jakarta. Fight me", hobbies: ["Architecture", "Reading", "Cycling"],    looking_for: "Relationship" },
  ];

  const featuredMaleIds: string[] = [];
  let guyIdx = 0;
  for (let i = 0; i < profiles.length && guyIdx < guyOverrides.length; i++) {
    if (profiles[i].gender === "Male") {
      const o = guyOverrides[guyIdx++];
      profiles[i].image = o.img;
      profiles[i].images = o.gallery;
      profiles[i].main_image_pos = o.pos;
      profiles[i].name = o.name;
      profiles[i].age = o.age;
      profiles[i].city = o.city;
      profiles[i].bio = o.bio;
      profiles[i].looking_for = o.looking_for;
      if (profiles[i].lifestyle_info) profiles[i].lifestyle_info!.hobbies = o.hobbies;
      featuredMaleIds.push(profiles[i].id);
    }
  }

  // ── Bestie review text pools (max 350 chars, no digits, no social links)
  const REVIEWS_F_A = [
    "She is the warmest soul I have ever known. Her kindness, grace, and devotion to family make her truly remarkable. She loves wholeheartedly and stands by the people she chooses. Anyone lucky enough to have her will never feel alone.",
    "Growing up together, I watched her become the most courageous and compassionate woman. Funny, humble, and fiercely loyal — her traditions run deep and she carries them with quiet pride. She deserves the most genuine love.",
    "She brings light wherever she goes. Thoughtful, creative, and endlessly giving. She will make a wonderful life partner and her soul is as beautiful as her smile. She never stops surprising me with how deep she really is.",
    "I am lucky to call her my bestie. Confident but never arrogant, elegant but grounded. Her faith guides everything she does and she treats every person with the deepest respect. A truly rare and beautiful human being.",
    "She has been my sister in spirit for years. Patient, hilarious, and the most nurturing person I know. She dreams of building a beautiful family and has everything it takes to make that dream real and lasting.",
    "Her heart is pure and her intentions are always sincere. She remembers everyone, checks in when you are struggling, and celebrates your wins louder than her own. Choose her and she will choose you back every single day.",
    "She is disciplined, ambitious, and deeply caring — a combination that is so rare. She takes every commitment seriously and brings the same dedication to her relationships as everything else. Absolutely worth knowing.",
    "We met in university and she has been my anchor ever since. Sharp, emotionally intelligent, and endlessly kind. She will challenge you to be better while making you feel completely accepted as you are. That is her gift.",
    "She is the person you call at midnight and she answers every time. She has walked through hard things and come out softer, not harder. Her empathy runs deep and she loves with everything she has.",
    "There is no one more loyal, more genuine, or more full of life. She makes every room warmer and every conversation worth having. I would choose her as my best friend again in every lifetime.",
  ];
  const REVIEWS_F_B = [
    "She has been my closest friend through everything and I can honestly say she is one of the most sincere people alive. She gives without expecting anything back and loves without conditions. Recognising this will make someone very lucky.",
    "Funny, real, and completely without pretense. What you see is what you get — and what you get is extraordinary. She has a rare ability to make everyone around her feel truly seen and valued.",
    "I have watched her grow into the most incredible woman. Her strength is quiet but it is there in everything she does. She is the kind of partner who builds you up while standing tall herself.",
    "She is the definition of wife material — and I do not say that lightly. She is caring, devoted, and deeply intentional about the life she wants to build. She has high standards and she meets them herself every single day.",
    "She makes everything better just by being in the room. Her laugh, her honesty, her warmth — all of it. But what sets her apart is her loyalty. She does not give up on people. She fights for the ones she loves.",
    "The most thoughtful person I have ever met. She remembers the small things and shows up in big ways. She is modest about her gifts but they are many. Anyone who earns her trust will have a partner for life.",
    "She is radiant and she does not even know it. Humble to her core, deeply spiritual, and impossibly kind. She wants a love that is real and lasting — and she inspires exactly that kind of love in return.",
    "From the first day we met I knew she was someone remarkable. Calm, wise, and deeply warm — she has a way of making hard things feel manageable. She will bring that same steadiness to her relationship.",
    "She has so much to offer and she offers it quietly, without show. Her heart, her time, her energy — she gives generously. She is traditional in the best way and modern in all the right ways too.",
    "She is everything a person could want in a best friend — and she will be everything someone needs in a partner. Honest, funny, caring, and endlessly patient. She deserves a love story as beautiful as she is.",
  ];
  const REVIEWS_M_ABOUT_F = [
    "She is one of the most genuine people I know — kind, dependable, and full of warmth. I have seen how she treats the people she loves and it is something truly special. Whoever she chooses will be incredibly fortunate.",
    "We have been close for years and she is someone I trust completely. Thoughtful, strong, and deeply caring — she brings out the best in everyone around her. Whoever she chooses will be so lucky.",
    "She is honest and hardworking and she treats everyone around her with real dignity. Her ambition is matched only by her humility. Any person would be fortunate to have her choose them.",
    "She is thoughtful in a way that is rare. She listens — truly listens — and she remembers. She is steady, kind, and knows what she wants. The right person will see that very clearly.",
    "I have watched her grow into a person of real character. She is not flashy but she is the most reliable one in any room. She takes care of the people she loves quietly and consistently.",
  ];
  const REVIEWS_F_ABOUT_M = [
    "He is the most dependable man I know. Calm under pressure, generous to a fault, and deeply respectful. He takes his responsibilities seriously and leads with integrity. He is the kind of man who shows up every single time.",
    "We have been close friends for years and I have never met anyone more loyal or more genuine. He works hard, treats everyone with dignity, and has a heart that is bigger than he ever lets on.",
    "Honest, ambitious, and completely without ego. He builds people up instead of tearing them down. He is looking for something real and he brings the same sincerity to relationships as he does to everything else.",
    "He is thoughtful in a way that is rare in men his age. He listens — truly listens — and he remembers. He is steady, kind, and knows what he wants. The right person will see that clearly.",
    "I have watched him grow into a man of real character. He is not flashy but he is the most reliable person in any room. He takes care of the people he loves quietly and consistently. That is who he is.",
    "He is the friend everyone wishes they had. Funny, grounded, and incredibly loyal. He never speaks badly about anyone and always gives people the benefit of the doubt. He will make a wonderful partner.",
  ];

  // ── Wire featured female besties (after male overrides so we can cross-reference males)
  for (let g = 0; g < featuredFemaleIds.length; g++) {
    const idx = profiles.findIndex(p => p.id === featuredFemaleIds[g]);
    if (idx !== -1) {
      const a = featuredFemaleIds[(g + 1) % featuredFemaleIds.length];
      const b = featuredFemaleIds[(g + 3) % featuredFemaleIds.length];
      const m = featuredMaleIds[g % featuredMaleIds.length]; // cross-gender bestie
      // Every featured female always gets at least 1 bestie
      profiles[idx].bestie_ids = g % 3 === 0
        ? [a, b, m]
        : g % 2 === 0
        ? [a, b]
        : [a];
      // Add bestie reviews
      const reviews: Record<string, string> = {
        [a]: REVIEWS_F_A[g % REVIEWS_F_A.length],
      };
      if (g % 3 === 0) {
        reviews[b] = REVIEWS_F_B[g % REVIEWS_F_B.length];
        reviews[m] = REVIEWS_M_ABOUT_F[g % REVIEWS_M_ABOUT_F.length];
      } else if (g % 2 === 0) {
        reviews[b] = REVIEWS_F_B[g % REVIEWS_F_B.length];
      }
      profiles[idx].bestie_reviews = reviews;
    }
  }

  // ── Wire featured male besties
  for (let g = 0; g < featuredMaleIds.length; g++) {
    const idx = profiles.findIndex(p => p.id === featuredMaleIds[g]);
    if (idx !== -1) {
      const a = featuredMaleIds[(g + 1) % featuredMaleIds.length];
      const b = featuredMaleIds[(g + 2) % featuredMaleIds.length];
      const f = featuredFemaleIds[g % featuredFemaleIds.length]; // female friend
      // Every featured male always gets at least 1 bestie
      profiles[idx].bestie_ids = g % 3 === 0
        ? [a, b, f]
        : g % 2 === 0
        ? [a, b]
        : [a];
      // Add bestie reviews
      const reviews: Record<string, string> = {
        [a]: REVIEWS_F_ABOUT_M[g % REVIEWS_F_ABOUT_M.length],
      };
      if (g % 3 === 0) {
        reviews[b] = REVIEWS_F_ABOUT_M[(g + 1) % REVIEWS_F_ABOUT_M.length];
        reviews[f] = REVIEWS_F_ABOUT_M[(g + 2) % REVIEWS_F_ABOUT_M.length];
      } else if (g % 2 === 0) {
        reviews[b] = REVIEWS_F_ABOUT_M[(g + 1) % REVIEWS_F_ABOUT_M.length];
      }
      profiles[idx].bestie_reviews = reviews;
    }
  }

  return profiles;
};
