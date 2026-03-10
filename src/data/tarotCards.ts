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

export const TAROT_CARDS: TarotCard[] = [
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

export const getTarotCardById = (cardId: number) => TAROT_CARDS.find((c) => c.id === cardId) || TAROT_CARDS[0];
