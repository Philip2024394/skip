export type LocalizedText = {
  en: string;
  id: string;
};

export type TarotContextReadings = {
  beingPicky: LocalizedText;
  openHearted: LocalizedText;
  focusedOnOne: LocalizedText;
  newUser: LocalizedText;
  returning: LocalizedText;
  mutual: LocalizedText;
};

export type TarotCard = {
  id: number;
  name: string;
  image: string;
  keywords: string[];
  loveReading: LocalizedText;
  contextReadings: TarotContextReadings;
};

export const TAROT_CARDS_LEGACY: TarotCard[] = [
  {
    id: 0,
    name: "The Fool",
    image: "🃏",
    keywords: ["fresh start", "bold leap", "curiosity", "playful"],
    loveReading: {
      en: "Love wants you brave today. Say yes to the vibe, not the fear — a surprising connection can begin with one playful message.",
      id: "Cinta ingin kamu berani hari ini. Katakan ya pada vibe, bukan pada rasa takut — koneksi yang mengejutkan bisa dimulai dari satu pesan yang ringan.",
    },
    contextReadings: {
      beingPicky: {
        en: "You’re protecting your heart, but don’t let perfection block magic. Try one ‘maybe’ profile — love can’t be filtered perfectly.",
        id: "Kamu sedang melindungi hati, tapi jangan biarkan perfeksionis menutup keajaiban. Coba satu profil yang ‘mungkin’ — cinta tidak bisa difilter sempurna.",
      },
      openHearted: {
        en: "Your open energy is magnetic. Keep it light, keep it fun — the right person will match your fearless yes.",
        id: "Energi terbukamu itu magnet. Tetap ringan, tetap seru — orang yang tepat akan menyamai ‘yes’ kamu yang berani.",
      },
      focusedOnOne: {
        en: "You keep circling one person for a reason. Take the leap: send the message or make the move.",
        id: "Kamu berkali-kali kembali ke satu orang karena ada alasan. Ambil langkah: kirim pesan atau mulai duluan.",
      },
      newUser: {
        en: "Welcome — your story is just starting. Explore with curiosity; the first spark often comes when you least expect it.",
        id: "Selamat datang — ceritamu baru dimulai. Jelajahi dengan rasa ingin tahu; percikan pertama sering muncul saat tak terduga.",
      },
      returning: {
        en: "You’re back with fresh eyes. Don’t repeat old patterns — try a new type and see what happens.",
        id: "Kamu kembali dengan sudut pandang baru. Jangan ulang pola lama — coba tipe baru dan lihat hasilnya.",
      },
      mutual: {
        en: "Mutual energy is here — keep it playful and direct. A simple invite can turn into a real date.",
        id: "Energi mutual sudah ada — tetap playful dan to the point. Ajakan sederhana bisa jadi kencan nyata.",
      },
    },
  },
  {
    id: 1,
    name: "The Magician",
    image: "✨",
    keywords: ["manifest", "confidence", "spark", "initiative"],
    loveReading: {
      en: "You have all the tools today — charm, timing, words. Start the conversation you’ve been waiting for; your intent is powerful.",
      id: "Hari ini kamu punya semua ‘alat’ — pesona, timing, kata-kata. Mulai percakapan yang kamu tunggu; niatmu itu kuat.",
    },
    contextReadings: {
      beingPicky: {
        en: "Instead of searching for ‘perfect’, create the connection. Ask a better question — depth beats flawless photos.",
        id: "Daripada mencari yang ‘sempurna’, ciptakan koneksi. Tanyakan pertanyaan yang lebih bagus — kedalaman mengalahkan foto yang flawless.",
      },
      openHearted: {
        en: "Your momentum is real. Choose one match to focus on and turn flirting into a plan.",
        id: "Momentummu nyata. Pilih satu match untuk difokuskan dan ubah flirting jadi rencana.",
      },
      focusedOnOne: {
        en: "You can make this happen. Be clear, be warm, and suggest a simple next step.",
        id: "Kamu bisa mewujudkan ini. Jelas, hangat, dan ajukan langkah berikutnya yang simpel.",
      },
      newUser: {
        en: "Set your intention: what kind of love do you want? Your first swipes are planting seeds.",
        id: "Tentukan niat: cinta seperti apa yang kamu mau? Swipe pertamamu sedang menanam benih.",
      },
      returning: {
        en: "You’re not here by accident. Use what you learned — approach with confidence, not hesitation.",
        id: "Kamu kembali bukan kebetulan. Gunakan pelajaranmu — dekati dengan percaya diri, bukan ragu.",
      },
      mutual: {
        en: "This is the moment to act. A mutual match is an open door — walk through it.",
        id: "Ini momennya untuk bergerak. Mutual match itu pintu terbuka — masuk saja.",
      },
    },
  },
  {
    id: 2,
    name: "The High Priestess",
    image: "🌙",
    keywords: ["intuition", "mystery", "inner truth", "signals"],
    loveReading: {
      en: "Listen between the lines. Your intuition is louder than the noise — trust the profile that feels calm, not chaotic.",
      id: "Dengarkan yang tersirat. Intuisimu lebih keras dari keramaian — percaya pada profil yang terasa tenang, bukan kacau.",
    },
    contextReadings: {
      beingPicky: {
        en: "Your standards are sacred — but check if you’re rejecting your own desire. Choose what feels aligned.",
        id: "Standarmu itu sakral — tapi cek apakah kamu menolak keinginanmu sendiri. Pilih yang terasa sejalan.",
      },
      openHearted: {
        en: "Stay open, but stay discerning. Give attention to the one who is consistent, not just exciting.",
        id: "Tetap terbuka, tapi tetap selektif. Beri perhatian pada yang konsisten, bukan hanya yang heboh.",
      },
      focusedOnOne: {
        en: "You sense a hidden potential. Ask one honest question — you’ll know quickly if it’s real.",
        id: "Kamu merasakan potensi tersembunyi. Tanyakan satu pertanyaan jujur — kamu akan cepat tahu apakah ini nyata.",
      },
      newUser: {
        en: "Take your time. Observe the energy first — your best match will feel safe and intriguing.",
        id: "Pelan-pelan. Amati energinya dulu — match terbaikmu akan terasa aman sekaligus menarik.",
      },
      returning: {
        en: "You’re wiser now. Trust what your body says — calm is a green flag.",
        id: "Kamu lebih bijak sekarang. Percaya pada sinyal tubuhmu — tenang itu green flag.",
      },
      mutual: {
        en: "A mutual match is a sign — but let their actions speak. Keep it private and intentional.",
        id: "Mutual match adalah tanda — tapi biarkan tindakan yang bicara. Tetap privat dan penuh niat.",
      },
    },
  },
  {
    id: 3,
    name: "The Empress",
    image: "👑",
    keywords: ["abundance", "beauty", "care", "receiving"],
    loveReading: {
      en: "Today is about receiving. Let yourself be adored — choose the person who shows effort, not just attraction.",
      id: "Hari ini tentang menerima. Biarkan dirimu diapresiasi — pilih orang yang menunjukkan usaha, bukan cuma ketertarikan.",
    },
    contextReadings: {
      beingPicky: {
        en: "You don’t need to lower your standards — just soften your grip. Love grows in warmth, not control.",
        id: "Kamu tidak perlu menurunkan standar — cukup longgarkan genggaman. Cinta tumbuh di kehangatan, bukan kontrol.",
      },
      openHearted: {
        en: "Your kindness is your power. Say yes to the one who treats you gently and consistently.",
        id: "Kebaikanmu adalah kekuatanmu. Katakan ya pada yang memperlakukanmu dengan lembut dan konsisten.",
      },
      focusedOnOne: {
        en: "If you want them, nurture it. Compliment them, ask about their day, invite them into your world.",
        id: "Kalau kamu mau dia, rawat. Pujilah, tanya harinya, ajak masuk ke duniamu.",
      },
      newUser: {
        en: "Welcome — you’re allowed to enjoy this. Choose connection that feels nourishing, not draining.",
        id: "Selamat datang — kamu boleh menikmati ini. Pilih koneksi yang menyehatkan, bukan menguras.",
      },
      returning: {
        en: "Come back to your worth. Don’t chase — let love meet you halfway.",
        id: "Kembali pada nilai dirimu. Jangan mengejar — biarkan cinta datang setengah jalan.",
      },
      mutual: {
        en: "Mutual matches can bloom fast. Keep it sweet and grounded — propose a simple plan.",
        id: "Mutual match bisa cepat berkembang. Tetap manis dan membumi — ajukan rencana sederhana.",
      },
    },
  },
  {
    id: 4,
    name: "The Emperor",
    image: "🛡️",
    keywords: ["stability", "standards", "boundaries", "leadership"],
    loveReading: {
      en: "Love wants structure today. Be clear about what you want — the right person respects boundaries and consistency.",
      id: "Cinta butuh struktur hari ini. Jelaskan apa yang kamu mau — orang yang tepat menghargai batas dan konsistensi.",
    },
    contextReadings: {
      beingPicky: {
        en: "Your standards are strong — keep them, but don’t confuse control with safety. Choose steady, not perfect.",
        id: "Standarmu kuat — pertahankan, tapi jangan samakan kontrol dengan aman. Pilih yang stabil, bukan sempurna.",
      },
      openHearted: {
        en: "Your openness is great — now choose intentionally. One good conversation beats ten shallow ones.",
        id: "Keterbukaanmu bagus — sekarang pilih dengan niat. Satu percakapan berkualitas lebih baik dari sepuluh yang dangkal.",
      },
      focusedOnOne: {
        en: "If you want something real, lead with clarity. Ask for a plan, not endless texting.",
        id: "Kalau kamu mau yang nyata, pimpin dengan kejelasan. Minta rencana, bukan chat tanpa ujung.",
      },
      newUser: {
        en: "Set your dating rules early. You’ll attract better matches when you know your non‑negotiables.",
        id: "Tetapkan aturan dating dari awal. Kamu akan menarik match lebih baik saat tahu hal yang tidak bisa ditawar.",
      },
      returning: {
        en: "You’re back to build something stronger. Move with discipline — don’t fall for mixed signals.",
        id: "Kamu kembali untuk membangun yang lebih kuat. Bergerak dengan disiplin — jangan terjebak sinyal campur.",
      },
      mutual: {
        en: "A mutual match is promising. Take leadership: suggest a time and place.",
        id: "Mutual match itu menjanjikan. Ambil peran: sarankan waktu dan tempat.",
      },
    },
  },
  {
    id: 5,
    name: "The Hierophant",
    image: "⛪",
    keywords: ["values", "commitment", "tradition", "guidance"],
    loveReading: {
      en: "Choose someone who shares your values. Today favors sincere intentions over flashy chemistry.",
      id: "Pilih seseorang yang sejalan dengan nilai hidupmu. Hari ini lebih mendukung niat tulus daripada chemistry yang heboh.",
    },
    contextReadings: {
      beingPicky: {
        en: "Ask about values, not just vibes. Your best match is the one who wants the same kind of relationship.",
        id: "Tanya soal nilai, bukan cuma vibe. Match terbaikmu adalah yang menginginkan jenis hubungan yang sama.",
      },
      openHearted: {
        en: "Your heart is open — now filter by intention. Who is consistent, respectful, and serious?",
        id: "Hatimu terbuka — sekarang saring berdasarkan niat. Siapa yang konsisten, menghargai, dan serius?",
      },
      focusedOnOne: {
        en: "If you’re focused on one person, talk about what you both want. Clarity is romance.",
        id: "Kalau kamu fokus pada satu orang, bicarakan apa yang kalian mau. Kejelasan itu romantis.",
      },
      newUser: {
        en: "Start with good habits: honest profile, respectful chats, and clear boundaries.",
        id: "Mulai dengan kebiasaan baik: profil jujur, chat sopan, dan batas yang jelas.",
      },
      returning: {
        en: "You’re returning with lessons. Honor them — don’t settle for less than respect.",
        id: "Kamu kembali dengan pelajaran. Hargai itu — jangan menerima kurang dari rasa hormat.",
      },
      mutual: {
        en: "A mutual match can become something real. Keep it respectful and move toward a real plan.",
        id: "Mutual match bisa jadi sesuatu yang nyata. Tetap sopan dan arahkan ke rencana yang nyata.",
      },
    },
  },
  {
    id: 6,
    name: "The Lovers",
    image: "💞",
    keywords: ["choice", "union", "alignment", "chemistry"],
    loveReading: {
      en: "A meaningful choice appears. Pick the connection that aligns with your future, not just your moment.",
      id: "Pilihan bermakna muncul. Pilih koneksi yang sejalan dengan masa depanmu, bukan hanya momen.",
    },
    contextReadings: {
      beingPicky: {
        en: "Stop searching for flaws. Choose based on how you feel with them — calm, seen, respected.",
        id: "Berhenti mencari-cari kekurangan. Pilih berdasarkan perasaanmu bersama dia — tenang, terlihat, dihargai.",
      },
      openHearted: {
        en: "Your likes are creating possibilities. Now pick one to explore deeply.",
        id: "Like kamu membuka banyak kemungkinan. Sekarang pilih satu untuk digali lebih dalam.",
      },
      focusedOnOne: {
        en: "This person keeps calling you back. Make a clear move — invite them into a real conversation.",
        id: "Orang ini terus menarikmu kembali. Ambil langkah jelas — ajak ke percakapan yang nyata.",
      },
      newUser: {
        en: "Explore, but don’t overthink. Your first real match will feel like ease.",
        id: "Jelajahi, tapi jangan terlalu overthinking. Match pertamamu yang nyata akan terasa mudah.",
      },
      returning: {
        en: "You’re back for love that’s aligned. Choose better — not louder.",
        id: "Kamu kembali untuk cinta yang sejalan. Pilih yang lebih baik — bukan yang lebih berisik.",
      },
      mutual: {
        en: "Mutual match = green light. Make it real: suggest a date idea.",
        id: "Mutual match = lampu hijau. Jadikan nyata: sarankan ide kencan.",
      },
    },
  },
  {
    id: 7,
    name: "The Chariot",
    image: "🏎️",
    keywords: ["momentum", "drive", "victory", "direction"],
    loveReading: {
      en: "Love moves fast when you choose direction. Take control: message first, be bold, and set the pace.",
      id: "Cinta melaju cepat saat kamu punya arah. Ambil kendali: chat duluan, berani, dan tentukan tempo.",
    },
    contextReadings: {
      beingPicky: {
        en: "You’re hesitating. Decide what matters most and commit to the search — love rewards focus.",
        id: "Kamu ragu. Putuskan apa yang paling penting dan fokus — cinta menghargai fokus.",
      },
      openHearted: {
        en: "Your energy is strong. Don’t scatter — pick a top match and move it forward.",
        id: "Energi kamu kuat. Jangan menyebar — pilih match terbaik dan maju.",
      },
      focusedOnOne: {
        en: "Stop waiting for ‘perfect timing’. Create it — invite them out.",
        id: "Jangan menunggu ‘timing sempurna’. Ciptakan — ajak dia.",
      },
      newUser: {
        en: "Make your first move count. A confident hello changes everything.",
        id: "Buat langkah pertama berarti. Sapaan yang percaya diri bisa mengubah segalanya.",
      },
      returning: {
        en: "You came back ready. Now act — momentum is your secret weapon.",
        id: "Kamu kembali dengan siap. Sekarang bergerak — momentum adalah senjata rahasiamu.",
      },
      mutual: {
        en: "Mutual match + momentum = yes. Suggest a time, place, and keep it simple.",
        id: "Mutual match + momentum = iya. Sarankan waktu, tempat, dan buat simpel.",
      },
    },
  },
  {
    id: 8,
    name: "Strength",
    image: "🦁",
    keywords: ["confidence", "gentleness", "patience", "self-worth"],
    loveReading: {
      en: "Your power is gentle. Love grows when you lead with kindness and self-respect — don’t chase, attract.",
      id: "Kekuatanmu itu lembut. Cinta tumbuh saat kamu memimpin dengan kebaikan dan harga diri — jangan mengejar, menarik.",
    },
    contextReadings: {
      beingPicky: {
        en: "Your guard is strong. Try warmth without lowering standards — ask something sweet and real.",
        id: "Pertahananmu kuat. Coba hangat tanpa menurunkan standar — tanya sesuatu yang manis dan nyata.",
      },
      openHearted: {
        en: "You’re loving boldly. Protect your energy by choosing people who match your effort.",
        id: "Kamu mencintai dengan berani. Lindungi energimu dengan memilih yang menyamai usahamu.",
      },
      focusedOnOne: {
        en: "Your patience is a gift. Show interest, but keep your dignity — let them meet you.",
        id: "Kesabaranmu itu hadiah. Tunjukkan minat, tapi tetap bermartabat — biarkan dia menyamakan langkah.",
      },
      newUser: {
        en: "Start with confidence. You don’t need to impress — you just need to be you.",
        id: "Mulai dengan percaya diri. Kamu tidak perlu memukau — cukup jadi dirimu.",
      },
      returning: {
        en: "You’re stronger than your past. Choose love that feels safe, not addictive.",
        id: "Kamu lebih kuat dari masa lalu. Pilih cinta yang terasa aman, bukan yang bikin candu.",
      },
      mutual: {
        en: "Mutual match is here — approach with calm confidence. A sincere message wins.",
        id: "Mutual match sudah ada — dekati dengan percaya diri yang tenang. Pesan tulus menang.",
      },
    },
  },
  {
    id: 9,
    name: "The Hermit",
    image: "🕯️",
    keywords: ["reflection", "truth", "slow love", "wisdom"],
    loveReading: {
      en: "Slow down. Today is for quality over quantity — one honest conversation beats a hundred swipes.",
      id: "Pelan-pelan. Hari ini untuk kualitas daripada kuantitas — satu percakapan jujur lebih baik dari seratus swipe.",
    },
    contextReadings: {
      beingPicky: {
        en: "You’re tired of noise. Choose someone who feels peaceful — love doesn’t need drama.",
        id: "Kamu lelah dengan keramaian. Pilih yang terasa damai — cinta tidak butuh drama.",
      },
      openHearted: {
        en: "Pause and listen. Don’t rush — let the right connection reveal itself.",
        id: "Berhenti sejenak dan dengarkan. Jangan buru-buru — biarkan koneksi yang tepat muncul.",
      },
      focusedOnOne: {
        en: "If you keep returning to one profile, you’re seeking depth. Ask a deeper question.",
        id: "Kalau kamu terus kembali ke satu profil, kamu mencari kedalaman. Tanyakan hal yang lebih dalam.",
      },
      newUser: {
        en: "Explore gently. Your best match will feel like quiet certainty.",
        id: "Jelajahi dengan lembut. Match terbaikmu akan terasa seperti kepastian yang tenang.",
      },
      returning: {
        en: "You returned for something real. Be selective with your time — invest wisely.",
        id: "Kamu kembali untuk sesuatu yang nyata. Selektif dengan waktu — investasikan dengan bijak.",
      },
      mutual: {
        en: "Mutual match exists — move slowly but surely. Ask for a call or a simple plan.",
        id: "Mutual match ada — bergerak pelan tapi pasti. Minta call atau rencana sederhana.",
      },
    },
  },
  {
    id: 10,
    name: "Wheel of Fortune",
    image: "🎡",
    keywords: ["luck", "timing", "turning point", "chance"],
    loveReading: {
      en: "A turn of fate is near. Say yes to the unexpected — a small choice today can change your love path.",
      id: "Perputaran nasib mendekat. Katakan ya pada yang tak terduga — pilihan kecil hari ini bisa mengubah jalur cintamu.",
    },
    contextReadings: {
      beingPicky: {
        en: "Your luck shifts when you shift. Try one new type — fate likes flexibility.",
        id: "Keberuntungan berubah saat kamu berubah. Coba tipe baru — takdir suka fleksibilitas.",
      },
      openHearted: {
        en: "You’re in a lucky window. Follow up with the best conversation — don’t let it fade.",
        id: "Kamu sedang di jendela hoki. Lanjutkan percakapan terbaik — jangan biarkan pudar.",
      },
      focusedOnOne: {
        en: "Timing is everything. Reach out today — the wheel is turning in your favor.",
        id: "Timing itu segalanya. Hubungi hari ini — roda berputar memihakmu.",
      },
      newUser: {
        en: "Your first day has lucky energy. Be curious — your match could be closer than you think.",
        id: "Hari pertamamu punya energi hoki. Penasaran saja — matchmu bisa lebih dekat dari yang kamu kira.",
      },
      returning: {
        en: "Coming back was the right move. This time, something different can happen.",
        id: "Kembali itu keputusan tepat. Kali ini, sesuatu yang berbeda bisa terjadi.",
      },
      mutual: {
        en: "Mutual match is a lucky sign. Take the chance — suggest a meet.",
        id: "Mutual match itu tanda hoki. Ambil kesempatan — ajak ketemu.",
      },
    },
  },
  {
    id: 11,
    name: "Justice",
    image: "⚖️",
    keywords: ["truth", "fairness", "standards", "alignment"],
    loveReading: {
      en: "Love asks for honesty today — with yourself and others. Choose what’s balanced, not what’s intense.",
      id: "Cinta meminta kejujuran hari ini — pada diri sendiri dan orang lain. Pilih yang seimbang, bukan yang terlalu intens.",
    },
    contextReadings: {
      beingPicky: {
        en: "Your judgment is sharp. Make sure it’s fair — don’t punish new people for old stories.",
        id: "Penilaianmu tajam. Pastikan adil — jangan menghukum orang baru karena cerita lama.",
      },
      openHearted: {
        en: "Keep it fair. If they don’t match your effort, redirect your energy.",
        id: "Jaga agar seimbang. Kalau dia tidak menyamai usaha kamu, alihkan energimu.",
      },
      focusedOnOne: {
        en: "Ask for clarity. Mixed signals aren’t romance — truth is.",
        id: "Minta kejelasan. Sinyal campur bukan romantis — kebenaranlah yang romantis.",
      },
      newUser: {
        en: "Start with honesty. The right match loves the real you.",
        id: "Mulai dengan jujur. Match yang tepat mencintai dirimu yang nyata.",
      },
      returning: {
        en: "You’re returning to choose better. Balance your heart with your standards.",
        id: "Kamu kembali untuk memilih lebih baik. Seimbangkan hati dengan standar.",
      },
      mutual: {
        en: "Mutual match is promising — keep it respectful and direct. Fair effort creates fast progress.",
        id: "Mutual match menjanjikan — tetap sopan dan jelas. Usaha yang seimbang membuat cepat maju.",
      },
    },
  },
  {
    id: 12,
    name: "The Hanged Man",
    image: "🙃",
    keywords: ["pause", "new perspective", "surrender", "patience"],
    loveReading: {
      en: "Pause and see differently. Love may arrive from a direction you usually ignore — try a fresh perspective.",
      id: "Berhenti sejenak dan lihat dari sudut baru. Cinta bisa datang dari arah yang biasanya kamu abaikan — coba perspektif baru.",
    },
    contextReadings: {
      beingPicky: {
        en: "You’re stuck in a pattern. Flip it — give one profile a chance and watch your mood change.",
        id: "Kamu terjebak pola. Balikkan — beri satu profil kesempatan dan lihat moodmu berubah.",
      },
      openHearted: {
        en: "Don’t rush. Let conversations breathe — the right one deepens with time.",
        id: "Jangan buru-buru. Biarkan percakapan mengalir — yang tepat akan makin dalam seiring waktu.",
      },
      focusedOnOne: {
        en: "If it’s not moving, change approach. Try a different question or a simple invite.",
        id: "Kalau tidak bergerak, ubah pendekatan. Coba pertanyaan lain atau ajakan sederhana.",
      },
      newUser: {
        en: "Observe first. You don’t need to decide immediately — your perspective will sharpen.",
        id: "Amati dulu. Kamu tidak harus memutuskan cepat — perspektifmu akan semakin tajam.",
      },
      returning: {
        en: "This time, do it differently. The shift is your secret.",
        id: "Kali ini, lakukan berbeda. Perubahan itu rahasiamu.",
      },
      mutual: {
        en: "Mutual match exists — give it space to grow. Move steady, not rushed.",
        id: "Mutual match ada — beri ruang untuk bertumbuh. Bergerak stabil, bukan tergesa.",
      },
    },
  },
  {
    id: 13,
    name: "Death",
    image: "🦋",
    keywords: ["ending", "rebirth", "transformation", "release"],
    loveReading: {
      en: "Let the old story end. Today favors transformation — release what doesn’t serve you and make space for real love.",
      id: "Biarkan cerita lama selesai. Hari ini mendukung transformasi — lepaskan yang tidak lagi baik dan beri ruang untuk cinta yang nyata.",
    },
    contextReadings: {
      beingPicky: {
        en: "You’re done with the same pattern. Good. Choose new — not familiar.",
        id: "Kamu lelah dengan pola yang sama. Bagus. Pilih yang baru — bukan yang familiar.",
      },
      openHearted: {
        en: "Your openness is changing you. Keep the lessons — drop the attachments.",
        id: "Keterbukaanmu mengubahmu. Simpan pelajarannya — lepaskan keterikatannya.",
      },
      focusedOnOne: {
        en: "If it’s not giving you life, let it go. Real love feels like renewal.",
        id: "Kalau itu tidak membuatmu hidup, lepaskan. Cinta yang nyata terasa seperti pembaruan.",
      },
      newUser: {
        en: "You’re starting fresh. Don’t bring old fears into new love.",
        id: "Kamu mulai baru. Jangan bawa ketakutan lama ke cinta baru.",
      },
      returning: {
        en: "You came back transformed. Choose what matches your new standards.",
        id: "Kamu kembali dengan versi yang berubah. Pilih yang sejalan dengan standar barumu.",
      },
      mutual: {
        en: "Mutual match can be a new chapter. Show up as the new you.",
        id: "Mutual match bisa jadi bab baru. Hadir sebagai dirimu yang baru.",
      },
    },
  },
  {
    id: 14,
    name: "Temperance",
    image: "🌈",
    keywords: ["balance", "healing", "flow", "patience"],
    loveReading: {
      en: "Love wants harmony. Go slow, mix chemistry with respect, and let the connection build naturally.",
      id: "Cinta ingin harmoni. Pelan-pelan, gabungkan chemistry dengan rasa hormat, dan biarkan koneksi tumbuh alami.",
    },
    contextReadings: {
      beingPicky: {
        en: "Balance standards with softness. Choose someone who feels peaceful.",
        id: "Seimbangkan standar dengan kelembutan. Pilih yang terasa damai.",
      },
      openHearted: {
        en: "You’re meeting many energies — keep your center. The right one won’t drain you.",
        id: "Kamu bertemu banyak energi — tetap di pusatmu. Yang tepat tidak akan menguras.",
      },
      focusedOnOne: {
        en: "Bring balance to this connection. Don’t over-give — let it be equal.",
        id: "Bawa keseimbangan ke koneksi ini. Jangan terlalu memberi — biarkan setara.",
      },
      newUser: {
        en: "Take it step by step. You don’t need to rush to be chosen.",
        id: "Langkah demi langkah. Kamu tidak perlu buru-buru agar dipilih.",
      },
      returning: {
        en: "Come back to calm love. Choose the person who communicates clearly.",
        id: "Kembali pada cinta yang tenang. Pilih yang komunikasinya jelas.",
      },
      mutual: {
        en: "Mutual match is sweet — keep it balanced and consistent.",
        id: "Mutual match itu manis — jaga keseimbangan dan konsistensi.",
      },
    },
  },
  {
    id: 15,
    name: "The Devil",
    image: "🔥",
    keywords: ["temptation", "attachment", "chemistry", "patterns"],
    loveReading: {
      en: "Chemistry is strong — but check the pattern. Choose desire that feels respectful, not consuming.",
      id: "Chemistry kuat — tapi cek polanya. Pilih hasrat yang terasa menghargai, bukan menghabiskan.",
    },
    contextReadings: {
      beingPicky: {
        en: "If you’re rejecting everyone, you might be avoiding vulnerability. Let one person in — safely.",
        id: "Kalau kamu menolak semua orang, mungkin kamu menghindari kerentanan. Biarkan satu orang masuk — dengan aman.",
      },
      openHearted: {
        en: "Don’t confuse attention with love. Choose the one who treats you well.",
        id: "Jangan samakan perhatian dengan cinta. Pilih yang memperlakukanmu baik.",
      },
      focusedOnOne: {
        en: "If you’re obsessed, pause. Real love feels steady — not anxious.",
        id: "Kalau kamu terlalu terpaku, jeda. Cinta yang nyata terasa stabil — bukan cemas.",
      },
      newUser: {
        en: "Stay playful, but keep boundaries. Hot doesn’t always mean healthy.",
        id: "Tetap playful, tapi jaga batas. Yang panas belum tentu sehat.",
      },
      returning: {
        en: "Old temptation can return. Choose growth over the same addictive loop.",
        id: "Godaan lama bisa kembali. Pilih berkembang daripada loop candu yang sama.",
      },
      mutual: {
        en: "Mutual match + chemistry is intense. Keep it respectful and don’t rush intimacy.",
        id: "Mutual match + chemistry itu intens. Tetap sopan dan jangan buru-buru intim.",
      },
    },
  },
  {
    id: 16,
    name: "The Tower",
    image: "⚡",
    keywords: ["surprise", "truth", "shake-up", "breakthrough"],
    loveReading: {
      en: "A surprise message or sudden clarity may hit today. Let the truth set you free — it opens a better match.",
      id: "Pesan mengejutkan atau kejelasan mendadak bisa datang hari ini. Biarkan kebenaran membebaskanmu — itu membuka match yang lebih baik.",
    },
    contextReadings: {
      beingPicky: {
        en: "You might be judging from fear. One honest conversation can break the illusion.",
        id: "Mungkin kamu menilai dari rasa takut. Satu percakapan jujur bisa memecahkan ilusi.",
      },
      openHearted: {
        en: "If something feels off, trust it. Your heart deserves stability.",
        id: "Kalau ada yang terasa tidak pas, percaya. Hatimu layak stabil.",
      },
      focusedOnOne: {
        en: "Stop building fantasies. Ask directly — truth creates the breakthrough.",
        id: "Jangan membangun fantasi. Tanya langsung — kebenaran menciptakan terobosan.",
      },
      newUser: {
        en: "New apps bring new lessons. Stay open, but let red flags fall away quickly.",
        id: "Aplikasi baru membawa pelajaran baru. Tetap terbuka, tapi biarkan red flag cepat tersingkir.",
      },
      returning: {
        en: "You’re back after a reset. Build on truth, not old illusions.",
        id: "Kamu kembali setelah reset. Bangun di atas kebenaran, bukan ilusi lama.",
      },
      mutual: {
        en: "Mutual match can change things fast. Keep your feet on the ground.",
        id: "Mutual match bisa cepat mengubah. Tetap membumi.",
      },
    },
  },
  {
    id: 17,
    name: "The Star",
    image: "⭐",
    keywords: ["hope", "healing", "destiny", "wish"],
    loveReading: {
      en: "Hope is returning. Your love life is healing — keep showing up and the right match will find you.",
      id: "Harapan kembali. Kisah cintamu sedang pulih — tetap hadir dan match yang tepat akan menemukanmu.",
    },
    contextReadings: {
      beingPicky: {
        en: "Don’t lose hope. One good match can arrive after ten boring swipes.",
        id: "Jangan kehilangan harapan. Satu match yang bagus bisa datang setelah sepuluh swipe yang membosankan.",
      },
      openHearted: {
        en: "Your openness is blessed. Keep your standards and your optimism.",
        id: "Keterbukaanmu diberkati. Jaga standar dan optimisme.",
      },
      focusedOnOne: {
        en: "If your heart keeps pointing to them, nurture it with gentle consistency.",
        id: "Kalau hatimu terus menunjuk padanya, rawat dengan konsistensi yang lembut.",
      },
      newUser: {
        en: "A new chapter begins with hope. Stay authentic — it attracts miracles.",
        id: "Bab baru dimulai dengan harapan. Tetap autentik — itu menarik keajaiban.",
      },
      returning: {
        en: "You came back at the right time. The universe is aligning new possibilities.",
        id: "Kamu kembali di waktu yang tepat. Semesta sedang menyelaraskan kemungkinan baru.",
      },
      mutual: {
        en: "Mutual match is a wish granted. Keep it sweet and move toward a real plan.",
        id: "Mutual match adalah harapan yang terkabul. Tetap manis dan arahkan ke rencana nyata.",
      },
    },
  },
  {
    id: 18,
    name: "The Moon",
    image: "🌕",
    keywords: ["mystery", "feelings", "dreams", "intuition"],
    loveReading: {
      en: "Not everything is clear yet. Trust your intuition and avoid rushing — real love becomes obvious with time.",
      id: "Tidak semuanya jelas dulu. Percaya intuisimu dan jangan buru-buru — cinta yang nyata akan jelas seiring waktu.",
    },
    contextReadings: {
      beingPicky: {
        en: "You might be swiping from uncertainty. Ground yourself — choose calm over confusing.",
        id: "Mungkin kamu swipe dari ketidakpastian. Bumi-kan dirimu — pilih yang tenang, bukan yang membingungkan.",
      },
      openHearted: {
        en: "Keep your heart open, but verify with actions. Consistency is your compass.",
        id: "Tetap terbuka, tapi verifikasi lewat tindakan. Konsistensi adalah kompasmu.",
      },
      focusedOnOne: {
        en: "If you’re unsure, ask. Don’t guess their feelings — communicate.",
        id: "Kalau kamu ragu, tanya. Jangan menebak perasaannya — komunikasikan.",
      },
      newUser: {
        en: "Don’t rush to label anything. Enjoy the mystery and move slowly.",
        id: "Jangan cepat memberi label. Nikmati misterinya dan bergerak pelan.",
      },
      returning: {
        en: "You’re back — but don’t repeat old confusion. Choose clarity.",
        id: "Kamu kembali — tapi jangan ulang kebingungan lama. Pilih kejelasan.",
      },
      mutual: {
        en: "Mutual match exists — now bring clarity. A direct message ends the guessing game.",
        id: "Mutual match ada — sekarang bawa kejelasan. Pesan yang jelas mengakhiri tebak-tebakan.",
      },
    },
  },
  {
    id: 19,
    name: "The Sun",
    image: "☀️",
    keywords: ["joy", "confidence", "warmth", "success"],
    loveReading: {
      en: "Joy is your love spell today. Flirt, laugh, and be seen — your best match loves your bright energy.",
      id: "Kebahagiaan adalah mantra cintamu hari ini. Flirt, tertawa, dan tampil — match terbaikmu menyukai energi cerahmu.",
    },
    contextReadings: {
      beingPicky: {
        en: "Lighten up. You don’t need a perfect person to have a great connection.",
        id: "Lebih santai. Kamu tidak butuh orang sempurna untuk punya koneksi yang bagus.",
      },
      openHearted: {
        en: "Your likes are creating sunshine. Follow the fun conversation — it’s leading somewhere.",
        id: "Like kamu menciptakan sinar. Ikuti percakapan yang seru — itu mengarah ke sesuatu.",
      },
      focusedOnOne: {
        en: "Bring warmth to them. A simple compliment can unlock their heart.",
        id: "Bawa kehangatan. Pujian sederhana bisa membuka hatinya.",
      },
      newUser: {
        en: "Welcome — this can be fun. Let yourself enjoy the process.",
        id: "Selamat datang — ini bisa menyenangkan. Izinkan dirimu menikmati proses.",
      },
      returning: {
        en: "You’re back and glowing. This time, choose joy over stress.",
        id: "Kamu kembali dan bersinar. Kali ini, pilih bahagia daripada stres.",
      },
      mutual: {
        en: "Mutual match brings sunshine. Turn it into a plan — coffee, dinner, or a walk.",
        id: "Mutual match membawa sinar. Jadikan rencana — kopi, makan, atau jalan.",
      },
    },
  },
  {
    id: 20,
    name: "Judgement",
    image: "📣",
    keywords: ["awakening", "decision", "truth", "second chance"],
    loveReading: {
      en: "A clear decision is calling. Release what’s not aligned and answer the connection that feels like a second chance.",
      id: "Keputusan jelas memanggil. Lepaskan yang tidak sejalan dan jawab koneksi yang terasa seperti kesempatan kedua.",
    },
    contextReadings: {
      beingPicky: {
        en: "You’re evaluating hard. Ask: is this fear or wisdom? Choose from truth.",
        id: "Kamu menilai dengan keras. Tanya: ini takut atau bijak? Pilih dari kebenaran.",
      },
      openHearted: {
        en: "You’ve learned from many interactions. Now choose one path and commit.",
        id: "Kamu belajar dari banyak interaksi. Sekarang pilih satu jalan dan komit.",
      },
      focusedOnOne: {
        en: "This feels like a turning point. Speak your truth and see what happens.",
        id: "Ini terasa seperti titik balik. Ucapkan kebenaranmu dan lihat hasilnya.",
      },
      newUser: {
        en: "Your new chapter starts with one brave message.",
        id: "Bab barumu dimulai dengan satu pesan berani.",
      },
      returning: {
        en: "You’re returning for a reason. Choose differently — your growth is the reward.",
        id: "Kamu kembali karena alasan. Pilih berbeda — pertumbuhanmu adalah hadiahnya.",
      },
      mutual: {
        en: "Mutual match is a calling. Don’t delay — take the next step.",
        id: "Mutual match adalah panggilan. Jangan tunda — ambil langkah berikutnya.",
      },
    },
  },
  {
    id: 21,
    name: "The World",
    image: "🌍",
    keywords: ["completion", "success", "next level", "alignment"],
    loveReading: {
      en: "You’re ready for a new level of love. Today favors completion — close old loops and step into something real.",
      id: "Kamu siap untuk level cinta yang baru. Hari ini mendukung penyelesaian — tutup loop lama dan masuk ke sesuatu yang nyata.",
    },
    contextReadings: {
      beingPicky: {
        en: "Perfection isn’t the goal — alignment is. Choose the one who fits your life.",
        id: "Kesempurnaan bukan tujuan — keselarasan yang penting. Pilih yang cocok dengan hidupmu.",
      },
      openHearted: {
        en: "Your openness is bringing results. Now choose one connection to complete the circle.",
        id: "Keterbukaanmu membawa hasil. Sekarang pilih satu koneksi untuk menutup lingkaran.",
      },
      focusedOnOne: {
        en: "This can become real. Take it out of the app and into a plan.",
        id: "Ini bisa jadi nyata. Bawa dari aplikasi menjadi rencana.",
      },
      newUser: {
        en: "Welcome — you’re entering a bigger world. Stay authentic and let love find you.",
        id: "Selamat datang — kamu memasuki dunia yang lebih luas. Tetap autentik dan biarkan cinta menemukanmu.",
      },
      returning: {
        en: "You’re back to finish what you started. This time, go all in on what’s aligned.",
        id: "Kamu kembali untuk menyelesaikan yang kamu mulai. Kali ini, total pada yang sejalan.",
      },
      mutual: {
        en: "Mutual match is the final piece. Celebrate and make it real.",
        id: "Mutual match adalah potongan terakhir. Rayakan dan jadikan nyata.",
      },
    },
  },
];

export const getLegacyTarotCardById = (cardId: number) =>
  TAROT_CARDS_LEGACY.find((c) => c.id === cardId) || TAROT_CARDS_LEGACY[0];

export type TarotContextKey = "beingPicky" | "openHearted" | "focusedOnOne" | "newUser" | "returning" | "mutual";

export type TarotCardEnglishExact = {
  id: number;
  name: string;
  emoji: string;
  keywords: string[];
  loveReading: string;
  contextReadings: Record<TarotContextKey, string>;
};

export type TarotCardLocalizedExact = {
  id: number;
  name: string;
  emoji: string;
  keywords: string[];
  loveReading: LocalizedText;
  contextReadings: Record<TarotContextKey, LocalizedText>;
};

export const TAROT_CARDS: TarotCardEnglishExact[] = [
  {
    id: 1,
    name: "The Fool",
    emoji: "🌟",
    keywords: ["new beginning", "adventure", "spontaneity"],
    loveReading:
      "A fresh start in love is calling you. Don't let fear stop you from taking that first step. The most beautiful love stories begin with one brave moment.",
    contextReadings: {
      beingPicky: "You are waiting for perfection — but love arrives unexpectedly. Open your heart just a little wider today.",
      openHearted: "Your open heart is your greatest strength. Someone out there is about to surprise you completely.",
      focusedOnOne: "Your heart already knows. Stop overthinking and take the leap.",
      newUser: "Welcome — your love journey begins today. Anything is possible from this moment.",
      returning: "You came back for a reason. The universe brought you here again — this time something is different.",
      mutual: "You already have a connection waiting. Take the next step — what are you waiting for?",
    },
  },
  {
    id: 2,
    name: "The Magician",
    emoji: "✨",
    keywords: ["power", "skill", "manifestation"],
    loveReading:
      "You have everything you need to attract the love you deserve. Your confidence and charm are magnetic right now. Use them.",
    contextReadings: {
      beingPicky: "Your standards are high because you know your worth. The right person will meet every one of them.",
      openHearted: "You are radiating attractive energy today. Someone has already noticed you.",
      focusedOnOne: "You have the power to make this connection real. One message changes everything.",
      newUser: "You arrived here with everything you need. Your perfect match is already in this app.",
      returning: "You came back stronger. Your energy has shifted — and others will feel it.",
      mutual: "The connection is real and it is mutual. Now use your magic and make it happen.",
    },
  },
  {
    id: 3,
    name: "The High Priestess",
    emoji: "🌙",
    keywords: ["intuition", "mystery", "inner knowing"],
    loveReading:
      "Your intuition is speaking loudly right now. That feeling you have about someone — trust it completely. Your inner wisdom knows things your mind hasn't caught up with yet.",
    contextReadings: {
      beingPicky: "Your gut is protecting you. Keep trusting it — the right one will feel completely different.",
      openHearted: "You feel something stirring. Pay attention to who makes your heart quietly flutter.",
      focusedOnOne: "You keep coming back to this person for a reason. Your soul recognises something.",
      newUser: "First impressions matter here. Trust your very first feeling about each person you see.",
      returning: "Something brought you back today. Listen to that quiet voice — it knows why.",
      mutual: "You both felt it at the same time. That is not coincidence. That is the universe speaking.",
    },
  },
  {
    id: 4,
    name: "The Empress",
    emoji: "🌹",
    keywords: ["love", "beauty", "abundance"],
    loveReading:
      "Love is blooming around you right now. A season of warmth, connection and deep feeling is beginning. Let yourself receive as much as you give.",
    contextReadings: {
      beingPicky: "You deserve abundance in love — not scraps. Your patience will be rewarded beautifully.",
      openHearted: "Your loving energy is drawing beautiful people toward you right now.",
      focusedOnOne: "This connection has real potential to grow into something deeply beautiful.",
      newUser: "You arrived at exactly the right time. Love is in full bloom on this app today.",
      returning: "You are ready to receive love now in a way you weren't before. Everything has changed.",
      mutual: "This mutual connection is a seed. Water it with attention and watch it grow.",
    },
  },
  {
    id: 5,
    name: "The Emperor",
    emoji: "👑",
    keywords: ["stability", "strength", "commitment"],
    loveReading:
      "You are ready for something real and solid. Not games, not uncertainty — but genuine committed love built on trust and respect.",
    contextReadings: {
      beingPicky: "You want something substantial and lasting. Never apologise for that standard.",
      openHearted: "Among the people you are connecting with — one is looking for exactly what you are.",
      focusedOnOne: "A strong foundation is built between two people who both show up consistently.",
      newUser: "Set your intentions clearly from the start. Know exactly what you are here for.",
      returning: "You know what you want now. That clarity will attract the right person instantly.",
      mutual: "You have found someone worth building something real with. Don't let it slip away.",
    },
  },
  {
    id: 6,
    name: "The Hierophant",
    emoji: "🕊️",
    keywords: ["tradition", "commitment", "soulmate"],
    loveReading:
      "A deep and meaningful connection is on the horizon — one that feels right in every traditional sense. Someone who shares your values is closer than you think.",
    contextReadings: {
      beingPicky: "You want a love that means something. That person exists and they are looking for you too.",
      openHearted: "Somewhere in your connections today is a person who shares your deepest values.",
      focusedOnOne: "This could be the real thing. Take time to truly get to know them.",
      newUser: "You are here for something meaningful. The right energy always finds its match.",
      returning: "Your values have not changed — and neither has what you deserve. Keep going.",
      mutual: "This connection has the energy of something that could truly last.",
    },
  },
  {
    id: 7,
    name: "The Lovers",
    emoji: "💕",
    keywords: ["choice", "connection", "harmony"],
    loveReading:
      "A meaningful choice about love stands before you. Your heart already knows the answer — it is time to stop letting your head argue with it.",
    contextReadings: {
      beingPicky: "You are weighing your options carefully. But your heart has already chosen — listen to it.",
      openHearted: "You are open to love and love is open to you. A beautiful harmony is forming.",
      focusedOnOne: "You keep coming back to this one person. That is your answer right there.",
      newUser: "Every connection you make here is a choice. Choose with both your heart and your wisdom.",
      returning: "You chose to come back. Now choose to be fully open to what arrives.",
      mutual: "Two people chose each other. That is where all great love stories begin.",
    },
  },
  {
    id: 8,
    name: "The Chariot",
    emoji: "⚡",
    keywords: ["confidence", "victory", "momentum"],
    loveReading:
      "Move forward with total confidence. Stop second guessing yourself. You are more attractive, more worthy and more ready than you realise right now.",
    contextReadings: {
      beingPicky: "Your standards are your chariot. They will carry you to exactly where you need to be.",
      openHearted: "Your momentum is building. Keep going — you are getting closer with every connection.",
      focusedOnOne: "Stop hesitating. Send the message. Make the move. Victory favours the brave.",
      newUser: "You arrived with great energy. Ride that momentum — great things are ahead.",
      returning: "You came back with more confidence than before. Use it. This is your time.",
      mutual: "You both moved toward each other. Now keep moving — don't let this stop here.",
    },
  },
  {
    id: 9,
    name: "Strength",
    emoji: "🦁",
    keywords: ["courage", "patience", "inner power"],
    loveReading:
      "Real love requires real courage. The strength to be vulnerable, to show your true self, to risk rejection — that is the bravest thing a human being can do.",
    contextReadings: {
      beingPicky: "Your discernment IS your strength. You know what you deserve and you refuse to settle.",
      openHearted: "Your open heart takes tremendous courage. That strength is exactly what attracts the right person.",
      focusedOnOne: "It takes strength to admit when someone has caught your attention. Be brave enough to act.",
      newUser: "It took courage to join. Now have the courage to connect fully and honestly.",
      returning: "You came back. That took strength. Now let that same strength guide you forward.",
      mutual: "You both had the courage to choose each other. Now be brave enough to go deeper.",
    },
  },
  {
    id: 10,
    name: "The Hermit",
    emoji: "🕯️",
    keywords: ["reflection", "wisdom", "self-discovery"],
    loveReading:
      "Before you can truly love someone else you must know yourself completely. Take a moment today to reflect on what you truly need — not just what you want.",
    contextReadings: {
      beingPicky: "Your careful approach shows wisdom. You are not being picky — you are being wise.",
      openHearted: "Even as you connect with others — stay connected to yourself. Know your own heart.",
      focusedOnOne: "Ask yourself honestly — why does this person keep drawing your attention?",
      newUser: "Start this journey by being completely honest about who you are and what you truly need.",
      returning: "Time away gave you clarity. Bring that wisdom with you into every connection now.",
      mutual: "Before you go deeper — make sure you truly know what you are looking for.",
    },
  },
  {
    id: 11,
    name: "Wheel of Fortune",
    emoji: "🎡",
    keywords: ["destiny", "turning point", "luck"],
    loveReading:
      "The wheel of your love life is turning right now — toward something better. What feels like coincidence is actually destiny moving you exactly where you need to be.",
    contextReadings: {
      beingPicky: "Your fortune is about to turn. The right person is entering your orbit right now.",
      openHearted: "Your good energy is creating good fortune. The wheel is spinning in your favour.",
      focusedOnOne: "This person appearing in your life is not random. The universe arranged this moment.",
      newUser: "You joined at exactly the right moment. Timing in love is everything — and yours is perfect.",
      returning: "You came back at exactly the right time. The wheel has turned and everything is different now.",
      mutual: "This mutual connection is destiny doing its work. Don't ignore what the universe arranged.",
    },
  },
  {
    id: 12,
    name: "Justice",
    emoji: "⚖️",
    keywords: ["balance", "truth", "fairness"],
    loveReading:
      "The love you give is the love you will receive. Be honest in all your connections today — with others and especially with yourself about what you truly need.",
    contextReadings: {
      beingPicky: "You are right to hold your standards. Justice says you deserve exactly what you are asking for.",
      openHearted: "Your honesty and openness will be matched by someone equally genuine very soon.",
      focusedOnOne: "Be honest with yourself about why this person draws you back again and again.",
      newUser: "Start as you mean to go on — with complete honesty about who you are.",
      returning: "The universe has balanced things in your favour. What you put out returns to you now.",
      mutual: "Both of you chose honestly. That is the foundation of everything real.",
    },
  },
  {
    id: 13,
    name: "The Hanged Man",
    emoji: "🌊",
    keywords: ["surrender", "letting go", "new perspective"],
    loveReading:
      "Let go of the love that was never meant for you. Release the expectation of how things should look. When you surrender control — the right person arrives almost immediately.",
    contextReadings: {
      beingPicky: "What if the right person looks completely different from what you imagined? Let go of the picture.",
      openHearted: "Your willingness to let love surprise you is your greatest gift right now.",
      focusedOnOne: "Let this connection unfold naturally. Stop trying to control how it develops.",
      newUser: "Arrive here with no expectations. Let the experience surprise you completely.",
      returning: "You let go of something that wasn't working. Now space has opened for what will.",
      mutual: "Let this connection breathe. Don't rush it — let it become what it wants to be.",
    },
  },
  {
    id: 14,
    name: "Death",
    emoji: "🦋",
    keywords: ["transformation", "ending", "rebirth"],
    loveReading:
      "Something old is ending to make room for something beautiful and new. This is not loss — this is transformation. Your love life is being reborn into something far better.",
    contextReadings: {
      beingPicky: "The old version of who you were in love is gone. A wiser, stronger you is choosing now.",
      openHearted: "You have transformed. The connections you make now reflect the new version of you.",
      focusedOnOne: "This person represents something new beginning in your life — not just a match.",
      newUser: "You are here because something in your love life needed to change. That change starts now.",
      returning: "Something shifted while you were away. You are not the same person who left. Good.",
      mutual: "This connection marks the beginning of a new chapter for both of you.",
    },
  },
  {
    id: 15,
    name: "Temperance",
    emoji: "🌈",
    keywords: ["patience", "balance", "divine timing"],
    loveReading:
      "The right love is worth waiting for. Don't rush, don't force, don't settle. Everything is moving toward you at exactly the right pace — trust the timing of your life.",
    contextReadings: {
      beingPicky: "Your patience is not weakness — it is wisdom. The right person is worth every moment of waiting.",
      openHearted: "You are balancing openness with discernment perfectly. Keep this beautiful balance.",
      focusedOnOne: "Take your time with this one. The best connections are built slowly and carefully.",
      newUser: "Don't rush your first connections here. Let things develop at their natural pace.",
      returning: "The timing of your return is perfect. Everything happens exactly when it should.",
      mutual: "Don't rush this mutual connection. Let it breathe and grow at its own beautiful pace.",
    },
  },
  {
    id: 16,
    name: "The Devil",
    emoji: "🔥",
    keywords: ["passion", "attraction", "awareness"],
    loveReading:
      "Intense attraction is powerful but make sure it is built on something real. Passion without foundation burns bright and fast. Look deeper than the surface today.",
    contextReadings: {
      beingPicky: "You are wise to look beyond just physical attraction. Keep looking for substance.",
      openHearted: "Your passion is magnetic — just make sure the connections you make have real depth.",
      focusedOnOne: "Ask yourself honestly — is this attraction based on something real or just intensity?",
      newUser: "Physical attraction will catch your eye here — but look for what lies beneath it.",
      returning: "You learned something about attraction that wasn't serving you. Apply that wisdom now.",
      mutual: "The attraction is real and mutual — now find out if the connection goes even deeper.",
    },
  },
  {
    id: 17,
    name: "The Tower",
    emoji: "⚡",
    keywords: ["change", "breakthrough", "revelation"],
    loveReading:
      "Something unexpected is about to shift your love life completely — in the best possible way. The structures that needed to fall are falling to reveal something magnificent underneath.",
    contextReadings: {
      beingPicky: "Your entire idea of what you want in a partner might be about to change. Stay open.",
      openHearted: "An unexpected connection today could completely change how you see love.",
      focusedOnOne: "This person might surprise you in ways you never expected. Let them.",
      newUser: "Prepare to be surprised. What you find here may be completely different from what you expected.",
      returning: "Everything you thought you knew about your love life is shifting. Embrace the change.",
      mutual: "This connection will surprise both of you. Something unexpected and wonderful is coming.",
    },
  },
  {
    id: 18,
    name: "The Star",
    emoji: "⭐",
    keywords: ["hope", "healing", "inspiration"],
    loveReading:
      "After everything you have been through — hope is returning. Your heart is healing and opening again. A love that feels like coming home is finding its way to you.",
    contextReadings: {
      beingPicky: "Your hope in real love has never died — and it is about to be rewarded.",
      openHearted: "Your hopeful energy is like a star — visible from far away and drawing people toward you.",
      focusedOnOne: "This person gives you hope. That feeling is trying to tell you something important.",
      newUser: "Hope brought you here. Let that same hope guide every connection you make.",
      returning: "You came back because hope never completely left you. That hope is about to pay off.",
      mutual: "Both of you hoped for this. Now let that shared hope become something beautiful.",
    },
  },
  {
    id: 19,
    name: "The Moon",
    emoji: "🌕",
    keywords: ["intuition", "dreams", "the subconscious"],
    loveReading:
      "Pay attention to your dreams and your deepest feelings right now. Something about a connection is trying to reach you beneath the surface. Trust what you feel — even the parts you cannot explain.",
    contextReadings: {
      beingPicky: "Your subconscious is protecting you from the wrong connections. Trust that quiet feeling.",
      openHearted: "Your emotional sensitivity is your superpower right now. Feel everything fully.",
      focusedOnOne: "You think about this person even when you don't mean to. Your subconscious is speaking.",
      newUser: "Pay attention to your very first emotional reaction to each profile. It knows things.",
      returning: "Something drew you back that you cannot fully explain. That is the moon speaking. Listen.",
      mutual: "This connection exists on a level deeper than either of you fully understands yet.",
    },
  },
  {
    id: 20,
    name: "The Sun",
    emoji: "☀️",
    keywords: ["joy", "happiness", "success"],
    loveReading:
      "Pure joy in love is coming your way. Not complicated, not painful — just warm, bright, beautiful happiness with someone who makes everything feel lighter and better.",
    contextReadings: {
      beingPicky: "The sunny joyful love you deserve is real and it is coming. Don't settle for anything less.",
      openHearted: "Your joyful energy today is completely irresistible. Someone is already drawn to your light.",
      focusedOnOne: "This person makes you feel something light and warm. That feeling is important.",
      newUser: "You brought sunshine with you today. The right person will be drawn straight to it.",
      returning: "You came back with more joy than before. That lightness will attract something wonderful.",
      mutual: "This connection has genuine joy at its core. That is rare and precious — cherish it.",
    },
  },
  {
    id: 21,
    name: "Judgement",
    emoji: "🎺",
    keywords: ["renewal", "second chances", "awakening"],
    loveReading:
      "A second chance at love — or a completely new awakening of your heart — is arriving. Answer the call. Do not let fear make you miss what is being offered to you right now.",
    contextReadings: {
      beingPicky: "Perhaps someone you overlooked deserves a second look today. Judgement asks you to reconsider.",
      openHearted: "You are awake to love in a way you never were before. This awareness will change everything.",
      focusedOnOne: "This person might represent a second chance at something your heart needed.",
      newUser: "This is your awakening moment in love. Everything before led you here. Now answer the call.",
      returning: "Coming back was your answer to the call. Now go all in — no half measures.",
      mutual: "This mutual connection is an awakening for both of you. Don't let it pass.",
    },
  },
  {
    id: 22,
    name: "The World",
    emoji: "🌍",
    keywords: ["completion", "fulfilment", "your person"],
    loveReading:
      "You are at the threshold of finding your person — a complete and fulfilling love that makes the whole world feel right. Everything you have been through has led to this moment.",
    contextReadings: {
      beingPicky: "Your journey has been long and worth every moment. Completion is very close now.",
      openHearted: "You have opened yourself to the whole world of love. It is about to deliver something complete.",
      focusedOnOne: "This person could be your world. That feeling deserves to be explored fully.",
      newUser: "Your whole world of love begins here today. Welcome to the start of everything.",
      returning: "You completed a cycle. Now a new and better one is beginning — this is it.",
      mutual: "Two complete people finding each other. This is what the whole journey was for.",
    },
  },
];

export const TAROT_CARDS_ID: TarotCardEnglishExact[] = [
  {
    id: 1,
    name: "The Fool",
    emoji: "🌟",
    keywords: ["new beginning", "adventure", "spontaneity"],
    loveReading:
      "Awal baru dalam cinta sedang memanggilmu. Jangan biarkan rasa takut menghentikanmu mengambil langkah pertama. Kisah cinta terindah dimulai dari satu momen berani.",
    contextReadings: {
      beingPicky: "Kamu menunggu kesempurnaan — padahal cinta sering datang tak terduga. Buka hatimu sedikit lebih lebar hari ini.",
      openHearted: "Hati terbukamu adalah kekuatan terbesarmu. Seseorang akan segera mengejutkanmu sepenuhnya.",
      focusedOnOne: "Hatimu sudah tahu. Berhenti overthinking dan ambil langkahnya.",
      newUser: "Selamat datang — perjalanan cintamu dimulai hari ini. Apa pun mungkin dari momen ini.",
      returning: "Kamu kembali karena suatu alasan. Semesta membawamu ke sini lagi — kali ini ada yang berbeda.",
      mutual: "Kamu sudah punya koneksi yang menunggumu. Ambil langkah berikutnya — kamu menunggu apa lagi?",
    },
  },
  {
    id: 2,
    name: "The Magician",
    emoji: "✨",
    keywords: ["power", "skill", "manifestation"],
    loveReading:
      "Kamu punya semua yang kamu butuhkan untuk menarik cinta yang kamu pantas dapatkan. Kepercayaan diri dan pesonamu sedang sangat magnetis. Gunakan itu.",
    contextReadings: {
      beingPicky: "Standarmu tinggi karena kamu tahu nilai dirimu. Orang yang tepat akan memenuhi semuanya.",
      openHearted: "Kamu memancarkan energi yang menarik hari ini. Seseorang sudah memperhatikanmu.",
      focusedOnOne: "Kamu punya kekuatan untuk membuat koneksi ini nyata. Satu pesan mengubah segalanya.",
      newUser: "Kamu datang dengan semua yang kamu butuhkan. Match sempurnamu sudah ada di aplikasi ini.",
      returning: "Kamu kembali lebih kuat. Energi kamu berubah — dan orang lain akan merasakannya.",
      mutual: "Koneksinya nyata dan saling. Sekarang gunakan sihirmu dan wujudkan.",
    },
  },
  {
    id: 3,
    name: "The High Priestess",
    emoji: "🌙",
    keywords: ["intuition", "mystery", "inner knowing"],
    loveReading:
      "Intuisimu sedang berbicara keras sekarang. Perasaanmu tentang seseorang — percaya sepenuhnya. Kebijaksanaan batinmu tahu hal-hal yang pikiranmu belum kejar.",
    contextReadings: {
      beingPicky: "Nalurimu melindungimu. Terus percaya — yang tepat akan terasa sangat berbeda.",
      openHearted: "Ada sesuatu yang bergerak di dalam diri. Perhatikan siapa yang membuat hati kamu berdebar pelan.",
      focusedOnOne: "Kamu terus kembali ke orang ini karena alasan. Jiwamu mengenali sesuatu.",
      newUser: "Kesan pertama penting di sini. Percaya perasaan pertamamu tentang setiap orang yang kamu lihat.",
      returning: "Ada sesuatu yang membawamu kembali hari ini. Dengarkan suara pelan itu — ia tahu alasannya.",
      mutual: "Kalian berdua merasakannya bersamaan. Itu bukan kebetulan. Itu semesta yang berbicara.",
    },
  },
  {
    id: 4,
    name: "The Empress",
    emoji: "🌹",
    keywords: ["love", "beauty", "abundance"],
    loveReading:
      "Cinta sedang mekar di sekelilingmu. Musim hangat, koneksi, dan perasaan yang dalam sedang dimulai. Izinkan dirimu menerima sebanyak kamu memberi.",
    contextReadings: {
      beingPicky: "Kamu pantas mendapat kelimpahan cinta — bukan sisa. Kesabaranmu akan terbayar indah.",
      openHearted: "Energi penuh cintamu menarik orang-orang yang indah mendekat.",
      focusedOnOne: "Koneksi ini punya potensi nyata untuk tumbuh menjadi sesuatu yang sangat indah.",
      newUser: "Kamu datang di waktu yang tepat. Cinta sedang mekar di aplikasi ini hari ini.",
      returning: "Kamu siap menerima cinta dengan cara yang belum pernah sebelumnya. Semuanya sudah berubah.",
      mutual: "Koneksi mutual ini adalah benih. Sirami dengan perhatian dan lihat ia tumbuh.",
    },
  },
  {
    id: 5,
    name: "The Emperor",
    emoji: "👑",
    keywords: ["stability", "strength", "commitment"],
    loveReading:
      "Kamu siap untuk sesuatu yang nyata dan kokoh. Bukan permainan, bukan ketidakpastian — tapi cinta berkomitmen yang dibangun dari kepercayaan dan rasa hormat.",
    contextReadings: {
      beingPicky: "Kamu ingin sesuatu yang solid dan bertahan lama. Jangan pernah minta maaf untuk standar itu.",
      openHearted: "Di antara orang-orang yang kamu hubungi — ada satu yang mencari hal yang sama seperti kamu.",
      focusedOnOne: "Fondasi kuat dibangun oleh dua orang yang sama-sama hadir dengan konsisten.",
      newUser: "Tentukan niatmu dengan jelas sejak awal. Tahu persis kamu ada di sini untuk apa.",
      returning: "Sekarang kamu tahu apa yang kamu mau. Kejelasan itu akan menarik orang yang tepat dengan cepat.",
      mutual: "Kamu menemukan seseorang yang layak dibangun bersama. Jangan biarkan lepas.",
    },
  },
  {
    id: 6,
    name: "The Hierophant",
    emoji: "🕊️",
    keywords: ["tradition", "commitment", "soulmate"],
    loveReading:
      "Koneksi yang dalam dan bermakna sudah dekat — yang terasa benar secara nilai dan komitmen. Seseorang yang sejalan dengan nilaimu lebih dekat dari yang kamu kira.",
    contextReadings: {
      beingPicky: "Kamu ingin cinta yang berarti. Orang itu ada dan mereka juga mencarimu.",
      openHearted: "Di antara koneksimu hari ini ada seseorang yang berbagi nilai terdalam kamu.",
      focusedOnOne: "Ini bisa jadi yang nyata. Luangkan waktu untuk benar-benar mengenalnya.",
      newUser: "Kamu di sini untuk sesuatu yang bermakna. Energi yang tepat selalu menemukan pasangannya.",
      returning: "Nilaimu tidak berubah — begitu juga dengan apa yang kamu pantas dapatkan. Teruskan.",
      mutual: "Koneksi ini punya energi sesuatu yang bisa benar-benar bertahan lama.",
    },
  },
  {
    id: 7,
    name: "The Lovers",
    emoji: "💕",
    keywords: ["choice", "connection", "harmony"],
    loveReading:
      "Pilihan bermakna tentang cinta ada di depanmu. Hatimu sudah tahu jawabannya — saatnya berhenti membiarkan kepala berdebat.",
    contextReadings: {
      beingPicky: "Kamu menimbang pilihan dengan hati-hati. Tapi hatimu sudah memilih — dengarkan.",
      openHearted: "Kamu terbuka untuk cinta dan cinta terbuka untukmu. Harmoni indah sedang terbentuk.",
      focusedOnOne: "Kamu terus kembali ke satu orang ini. Itu jawabannya.",
      newUser: "Setiap koneksi di sini adalah pilihan. Pilih dengan hati dan kebijaksanaan.",
      returning: "Kamu memilih kembali. Sekarang pilih untuk benar-benar terbuka pada yang datang.",
      mutual: "Dua orang memilih satu sama lain. Di situlah semua kisah cinta besar dimulai.",
    },
  },
  {
    id: 8,
    name: "The Chariot",
    emoji: "⚡",
    keywords: ["confidence", "victory", "momentum"],
    loveReading:
      "Majulah dengan percaya diri sepenuhnya. Berhenti meragukan diri. Kamu lebih menarik, lebih layak, dan lebih siap daripada yang kamu sadari.",
    contextReadings: {
      beingPicky: "Standarmu adalah keretamu. Itu akan membawamu tepat ke tempat yang kamu butuhkan.",
      openHearted: "Momentummu sedang terbentuk. Teruskan — kamu makin dekat di setiap koneksi.",
      focusedOnOne: "Berhenti ragu. Kirim pesan. Ambil langkah. Kemenangan memihak yang berani.",
      newUser: "Kamu datang dengan energi yang bagus. Naiki momentum itu — hal hebat menanti.",
      returning: "Kamu kembali dengan lebih percaya diri. Gunakan. Ini waktumu.",
      mutual: "Kalian berdua bergerak menuju satu sama lain. Sekarang teruskan — jangan berhenti di sini.",
    },
  },
  {
    id: 9,
    name: "Strength",
    emoji: "🦁",
    keywords: ["courage", "patience", "inner power"],
    loveReading:
      "Cinta yang nyata butuh keberanian yang nyata. Berani rentan, menunjukkan diri yang asli, berani ditolak — itulah hal paling berani yang bisa dilakukan manusia.",
    contextReadings: {
      beingPicky: "Kehati-hatianmu adalah kekuatanmu. Kamu tahu yang kamu pantas dapatkan dan kamu tidak mau settle.",
      openHearted: "Hati terbukamu butuh keberanian besar. Kekuatan itu yang menarik orang yang tepat.",
      focusedOnOne: "Butuh keberanian untuk mengakui seseorang menarik perhatianmu. Beranilah untuk bertindak.",
      newUser: "Butuh keberanian untuk bergabung. Sekarang beranilah untuk terhubung dengan jujur.",
      returning: "Kamu kembali. Itu butuh kekuatan. Biarkan kekuatan itu menuntunmu.",
      mutual: "Kalian berdua berani memilih satu sama lain. Sekarang berani untuk lebih dalam.",
    },
  },
  {
    id: 10,
    name: "The Hermit",
    emoji: "🕯️",
    keywords: ["reflection", "wisdom", "self-discovery"],
    loveReading:
      "Sebelum kamu benar-benar bisa mencintai orang lain, kamu harus mengenal dirimu. Ambil waktu hari ini untuk merenungkan apa yang benar-benar kamu butuhkan — bukan hanya yang kamu inginkan.",
    contextReadings: {
      beingPicky: "Pendekatanmu yang hati-hati menunjukkan kebijaksanaan. Kamu bukan picky — kamu bijak.",
      openHearted: "Saat kamu terhubung dengan orang lain — tetap terhubung dengan dirimu. Kenali hatimu.",
      focusedOnOne: "Tanya jujur — kenapa orang ini terus menarik perhatianmu?",
      newUser: "Mulai perjalanan ini dengan jujur tentang siapa kamu dan apa yang benar-benar kamu butuhkan.",
      returning: "Waktu jauh memberimu kejelasan. Bawa kebijaksanaan itu ke setiap koneksi.",
      mutual: "Sebelum lebih dalam — pastikan kamu benar-benar tahu apa yang kamu cari.",
    },
  },
  {
    id: 11,
    name: "Wheel of Fortune",
    emoji: "🎡",
    keywords: ["destiny", "turning point", "luck"],
    loveReading:
      "Roda kehidupan cintamu sedang berputar — menuju sesuatu yang lebih baik. Yang terasa kebetulan sebenarnya adalah takdir yang menggerakkanmu ke tempat yang tepat.",
    contextReadings: {
      beingPicky: "Keberuntunganmu akan segera berubah. Orang yang tepat sedang masuk ke orbitmu.",
      openHearted: "Energi baikmu menciptakan keberuntungan baik. Roda berputar memihakmu.",
      focusedOnOne: "Orang ini hadir bukan kebetulan. Semesta mengatur momen ini.",
      newUser: "Kamu bergabung di saat yang tepat. Timing dalam cinta itu segalanya — dan timingmu pas.",
      returning: "Kamu kembali tepat waktu. Roda sudah berputar dan semuanya berbeda sekarang.",
      mutual: "Koneksi mutual ini adalah takdir. Jangan abaikan yang semesta atur.",
    },
  },
  {
    id: 12,
    name: "Justice",
    emoji: "⚖️",
    keywords: ["balance", "truth", "fairness"],
    loveReading:
      "Cinta yang kamu beri adalah cinta yang akan kamu terima. Bersikap jujur dalam koneksimu hari ini — terutama pada diri sendiri tentang apa yang benar-benar kamu butuhkan.",
    contextReadings: {
      beingPicky: "Kamu benar mempertahankan standar. Keadilan berkata kamu pantas mendapatkan yang kamu minta.",
      openHearted: "Kejujuran dan keterbukaanmu akan dibalas oleh seseorang yang sama tulusnya.",
      focusedOnOne: "Jujur pada diri sendiri kenapa orang ini menarikmu lagi dan lagi.",
      newUser: "Mulai dengan jujur tentang siapa kamu.",
      returning: "Semesta menyeimbangkan hal-hal untukmu. Apa yang kamu berikan akan kembali.",
      mutual: "Kalian berdua memilih dengan jujur. Itu fondasi untuk semua yang nyata.",
    },
  },
  {
    id: 13,
    name: "The Hanged Man",
    emoji: "🌊",
    keywords: ["surrender", "letting go", "new perspective"],
    loveReading:
      "Lepaskan cinta yang memang bukan untukmu. Lepaskan ekspektasi bagaimana seharusnya terlihat. Saat kamu melepaskan kontrol — orang yang tepat datang hampir segera.",
    contextReadings: {
      beingPicky: "Bagaimana jika orang yang tepat terlihat sangat berbeda dari bayanganmu? Lepaskan gambarnya.",
      openHearted: "Kesediaanmu membiarkan cinta mengejutkanmu adalah hadiah terbesarmu.",
      focusedOnOne: "Biarkan koneksi ini berkembang alami. Berhenti mencoba mengontrolnya.",
      newUser: "Datang tanpa ekspektasi. Biarkan pengalaman ini mengejutkanmu.",
      returning: "Kamu melepas sesuatu yang tidak bekerja. Sekarang ada ruang untuk yang akan datang.",
      mutual: "Biarkan koneksi ini bernapas. Jangan buru-buru — biarkan menjadi apa adanya.",
    },
  },
  {
    id: 14,
    name: "Death",
    emoji: "🦋",
    keywords: ["transformation", "ending", "rebirth"],
    loveReading:
      "Sesuatu yang lama berakhir untuk memberi ruang bagi yang baru dan indah. Ini bukan kehilangan — ini transformasi. Kehidupan cintamu sedang terlahir kembali menjadi jauh lebih baik.",
    contextReadings: {
      beingPicky: "Versi lama dirimu dalam cinta sudah selesai. Dirimu yang lebih bijak dan kuat sedang memilih sekarang.",
      openHearted: "Kamu sudah berubah. Koneksi yang kamu buat sekarang mencerminkan versi barumu.",
      focusedOnOne: "Orang ini mewakili awal baru dalam hidupmu — bukan hanya match.",
      newUser: "Kamu ada di sini karena sesuatu dalam cinta perlu berubah. Perubahan itu mulai sekarang.",
      returning: "Ada yang bergeser saat kamu pergi. Kamu bukan orang yang sama. Bagus.",
      mutual: "Koneksi ini menandai awal bab baru untuk kalian berdua.",
    },
  },
  {
    id: 15,
    name: "Temperance",
    emoji: "🌈",
    keywords: ["patience", "balance", "divine timing"],
    loveReading:
      "Cinta yang tepat pantas ditunggu. Jangan terburu-buru, jangan memaksa, jangan settle. Semuanya bergerak menuju kamu dengan ritme yang tepat — percayai timing hidupmu.",
    contextReadings: {
      beingPicky: "Kesabaranmu bukan kelemahan — itu kebijaksanaan. Orang yang tepat pantas setiap detik menunggu.",
      openHearted: "Kamu menyeimbangkan keterbukaan dan seleksi dengan indah. Pertahankan keseimbangan ini.",
      focusedOnOne: "Pelan-pelan dengan yang ini. Koneksi terbaik dibangun perlahan dan hati-hati.",
      newUser: "Jangan buru-buru dengan koneksi pertama. Biarkan berkembang dengan ritme natural.",
      returning: "Timing kembalimu sempurna. Semua terjadi saat seharusnya.",
      mutual: "Jangan buru-buru koneksi mutual ini. Biarkan tumbuh dengan ritme indahnya.",
    },
  },
  {
    id: 16,
    name: "The Devil",
    emoji: "🔥",
    keywords: ["passion", "attraction", "awareness"],
    loveReading:
      "Ketertarikan yang intens itu kuat, tapi pastikan dibangun di atas sesuatu yang nyata. Gairah tanpa fondasi cepat menyala dan cepat padam. Lihat lebih dalam hari ini.",
    contextReadings: {
      beingPicky: "Kamu bijak melihat lebih dari sekadar ketertarikan fisik. Terus cari substansi.",
      openHearted: "Gairahmu magnetis — pastikan koneksi yang kamu buat punya kedalaman.",
      focusedOnOne: "Tanya jujur — ini koneksi nyata atau sekadar intensitas?",
      newUser: "Ketertarikan fisik akan menarik perhatianmu — tapi lihat apa yang ada di baliknya.",
      returning: "Kamu belajar sesuatu tentang ketertarikan yang tidak sehat. Terapkan kebijaksanaan itu sekarang.",
      mutual: "Ketertarikan ini saling. Sekarang cari tahu apakah koneksinya lebih dalam.",
    },
  },
  {
    id: 17,
    name: "The Tower",
    emoji: "⚡",
    keywords: ["change", "breakthrough", "revelation"],
    loveReading:
      "Sesuatu yang tak terduga akan menggeser kehidupan cintamu — dengan cara terbaik. Struktur yang perlu runtuh sedang runtuh untuk menampakkan sesuatu yang luar biasa.",
    contextReadings: {
      beingPicky: "Ide kamu tentang pasangan yang kamu mau mungkin akan berubah total. Tetap terbuka.",
      openHearted: "Koneksi tak terduga hari ini bisa mengubah cara kamu melihat cinta.",
      focusedOnOne: "Orang ini mungkin mengejutkanmu dengan cara yang tak kamu duga. Biarkan.",
      newUser: "Siap-siap terkejut. Apa yang kamu temukan bisa sangat berbeda dari ekspektasimu.",
      returning: "Semua yang kamu kira kamu tahu tentang cinta sedang bergeser. Rangkul perubahan.",
      mutual: "Koneksi ini akan mengejutkan kalian. Sesuatu yang tak terduga dan indah sedang datang.",
    },
  },
  {
    id: 18,
    name: "The Star",
    emoji: "⭐",
    keywords: ["hope", "healing", "inspiration"],
    loveReading:
      "Setelah semua yang kamu lewati — harapan kembali. Hatimu sedang sembuh dan terbuka lagi. Cinta yang terasa seperti pulang sedang menemukan jalan ke kamu.",
    contextReadings: {
      beingPicky: "Harapanmu pada cinta yang nyata tidak pernah mati — dan akan segera terbayar.",
      openHearted: "Energi penuh harapanmu seperti bintang — terlihat dari jauh dan menarik orang mendekat.",
      focusedOnOne: "Orang ini memberimu harapan. Perasaan itu ingin bilang sesuatu yang penting.",
      newUser: "Harapan membawamu ke sini. Biarkan harapan itu menuntun setiap koneksi.",
      returning: "Kamu kembali karena harapan tidak pernah benar-benar pergi. Harapan itu akan terbayar.",
      mutual: "Kalian berdua berharap untuk ini. Sekarang biarkan harapan itu jadi sesuatu yang indah.",
    },
  },
  {
    id: 19,
    name: "The Moon",
    emoji: "🌕",
    keywords: ["intuition", "dreams", "the subconscious"],
    loveReading:
      "Perhatikan mimpi dan perasaan terdalammu. Ada sesuatu tentang koneksi ini yang ingin menjangkau kamu di bawah permukaan. Percaya apa yang kamu rasakan — bahkan yang sulit dijelaskan.",
    contextReadings: {
      beingPicky: "Alam bawah sadarmu melindungimu dari koneksi yang salah. Percaya perasaan itu.",
      openHearted: "Kepekaan emosimu adalah superpower hari ini. Rasakan sepenuhnya.",
      focusedOnOne: "Kamu memikirkan orang ini bahkan saat tidak bermaksud. Alam bawah sadarmu bicara.",
      newUser: "Perhatikan reaksi emosional pertamamu pada setiap profil. Itu tahu.",
      returning: "Ada sesuatu yang menarikmu kembali dan kamu tidak bisa menjelaskan. Itu suara bulan. Dengarkan.",
      mutual: "Koneksi ini ada di level yang lebih dalam dari yang kalian pahami saat ini.",
    },
  },
  {
    id: 20,
    name: "The Sun",
    emoji: "☀️",
    keywords: ["joy", "happiness", "success"],
    loveReading:
      "Kebahagiaan murni dalam cinta sedang datang. Bukan rumit, bukan menyakitkan — hanya hangat, cerah, dan indah bersama seseorang yang membuat segalanya terasa lebih ringan.",
    contextReadings: {
      beingPicky: "Cinta yang cerah dan bahagia itu nyata dan sedang datang. Jangan settle.",
      openHearted: "Energi bahagiamu hari ini tak tertahankan. Seseorang sudah tertarik pada cahayamu.",
      focusedOnOne: "Orang ini membuatmu merasa ringan dan hangat. Perasaan itu penting.",
      newUser: "Kamu membawa sinar matahari hari ini. Orang yang tepat akan tertarik.",
      returning: "Kamu kembali dengan lebih banyak kebahagiaan. Cahaya itu akan menarik sesuatu yang indah.",
      mutual: "Koneksi ini punya kebahagiaan tulus di intinya. Itu langka dan berharga — jaga baik-baik.",
    },
  },
  {
    id: 21,
    name: "Judgement",
    emoji: "🎺",
    keywords: ["renewal", "second chances", "awakening"],
    loveReading:
      "Kesempatan kedua dalam cinta — atau kebangkitan baru dari hatimu — sedang datang. Jawab panggilan itu. Jangan biarkan takut membuatmu melewatkan yang ditawarkan padamu.",
    contextReadings: {
      beingPicky: "Mungkin seseorang yang kamu lewatkan layak dilihat lagi hari ini. Judgement memintamu mempertimbangkan ulang.",
      openHearted: "Kamu sadar akan cinta dengan cara yang belum pernah. Kesadaran ini akan mengubah segalanya.",
      focusedOnOne: "Orang ini mungkin mewakili kesempatan kedua atas sesuatu yang dibutuhkan hatimu.",
      newUser: "Ini momen kebangkitan cintamu. Semua sebelumnya membawamu ke sini. Sekarang jawab panggilannya.",
      returning: "Kembalimu adalah jawabanmu pada panggilan. Sekarang total — jangan setengah-setengah.",
      mutual: "Koneksi mutual ini adalah kebangkitan untuk kalian berdua. Jangan biarkan lewat.",
    },
  },
  {
    id: 22,
    name: "The World",
    emoji: "🌍",
    keywords: ["completion", "fulfilment", "your person"],
    loveReading:
      "Kamu berada di ambang menemukan orangmu — cinta yang lengkap dan memuaskan yang membuat dunia terasa benar. Semua yang kamu lewati membawamu ke momen ini.",
    contextReadings: {
      beingPicky: "Perjalananmu panjang dan sepadan. Penyelesaian sudah sangat dekat.",
      openHearted: "Kamu membuka diri pada seluruh dunia cinta. Dunia akan memberi sesuatu yang lengkap.",
      focusedOnOne: "Orang ini bisa jadi duniamu. Perasaan itu pantas dieksplorasi.",
      newUser: "Duniamu dalam cinta dimulai di sini hari ini. Selamat datang di awal segalanya.",
      returning: "Kamu menuntaskan satu siklus. Sekarang siklus yang lebih baik dimulai — inilah saatnya.",
      mutual: "Dua orang utuh menemukan satu sama lain. Inilah tujuan perjalanan itu.",
    },
  },
];

export const getTarotCardById = (cardId: number, locale: "en" | "id" = "en"): TarotCardLocalizedExact => {
  const base = TAROT_CARDS.find((c) => c.id === cardId) || TAROT_CARDS[0];
  const idCard = TAROT_CARDS_ID.find((c) => c.id === cardId) || TAROT_CARDS_ID[0];

  const idFallback = idCard || base;
  return {
    id: base?.id ?? cardId,
    name: base?.name ?? "",
    emoji: base?.emoji ?? "",
    keywords: base?.keywords ?? [],
    loveReading: {
      en: base?.loveReading ?? "",
      id: idFallback?.loveReading ?? base?.loveReading ?? "",
    },
    contextReadings: {
      beingPicky: { en: base?.contextReadings?.beingPicky ?? "", id: idFallback?.contextReadings?.beingPicky ?? base?.contextReadings?.beingPicky ?? "" },
      openHearted: { en: base?.contextReadings?.openHearted ?? "", id: idFallback?.contextReadings?.openHearted ?? base?.contextReadings?.openHearted ?? "" },
      focusedOnOne: { en: base?.contextReadings?.focusedOnOne ?? "", id: idFallback?.contextReadings?.focusedOnOne ?? base?.contextReadings?.focusedOnOne ?? "" },
      newUser: { en: base?.contextReadings?.newUser ?? "", id: idFallback?.contextReadings?.newUser ?? base?.contextReadings?.newUser ?? "" },
      returning: { en: base?.contextReadings?.returning ?? "", id: idFallback?.contextReadings?.returning ?? base?.contextReadings?.returning ?? "" },
      mutual: { en: base?.contextReadings?.mutual ?? "", id: idFallback?.contextReadings?.mutual ?? base?.contextReadings?.mutual ?? "" },
    },
  };
};
