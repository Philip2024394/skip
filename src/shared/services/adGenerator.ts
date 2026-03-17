// Ad & Commercial Generation System
// Multi-platform ad generation with queue management and localization

interface AdContent {
  id: string;
  platform: Platform;
  type: 'image' | 'video';
  title: string;
  description: string;
  hashtags: string[];
  callToAction: string;
  link: string;
  imageUrl?: string;
  videoUrl?: string;
  language: string;
  country: string;
  generatedAt: Date;
  isUsed: boolean;
}

interface AdTemplate {
  id: string;
  platform: Platform;
  type: 'image' | 'video';
  templates: {
    title: Record<string, string>; // language -> text
    description: Record<string, string>;
    hashtags: Record<string, string[]>;
    callToAction: Record<string, string>;
  };
  imagePrompts?: Record<string, string>; // language -> AI prompt
  videoPrompts?: Record<string, string>; // language -> AI prompt
}

type Platform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'twitter' | 'youtube';

class AdGenerator {
  private static instance: AdGenerator;
  private queue: AdContent[] = [];
  private templates: AdTemplate[] = [];
  private readonly queueSize = 50;
  private readonly appUrl = 'https://2DateMe.com';
  private readonly brandSlogan = 'Find Your Perfect Match';

  // Platform-specific configurations
  private static readonly PLATFORM_CONFIGS: Record<Platform, {
    maxTitleLength: number;
    maxDescriptionLength: number;
    maxHashtags: number;
    imageDimensions: { width: number; height: number };
    videoDuration: { min: number; max: number };
    characterLimits: {
      title: number;
      description: number;
      hashtags: number;
    };
  }> = {
    instagram: {
      maxTitleLength: 125,
      maxDescriptionLength: 2200,
      maxHashtags: 30,
      imageDimensions: { width: 1080, height: 1080 },
      videoDuration: { min: 15, max: 60 },
      characterLimits: {
        title: 125,
        description: 2200,
        hashtags: 30
      }
    },
    facebook: {
      maxTitleLength: 100,
      maxDescriptionLength: 5000,
      maxHashtags: 20,
      imageDimensions: { width: 1200, height: 630 },
      videoDuration: { min: 15, max: 120 },
      characterLimits: {
        title: 100,
        description: 5000,
        hashtags: 20
      }
    },
    tiktok: {
      maxTitleLength: 100,
      maxDescriptionLength: 150,
      maxHashtags: 5,
      imageDimensions: { width: 1080, height: 1920 },
      videoDuration: { min: 15, max: 60 },
      characterLimits: {
        title: 100,
        description: 150,
        hashtags: 5
      }
    },
    linkedin: {
      maxTitleLength: 200,
      maxDescriptionLength: 3000,
      maxHashtags: 15,
      imageDimensions: { width: 1200, height: 627 },
      videoDuration: { min: 30, max: 180 },
      characterLimits: {
        title: 200,
        description: 3000,
        hashtags: 15
      }
    },
    twitter: {
      maxTitleLength: 100,
      maxDescriptionLength: 280,
      maxHashtags: 10,
      imageDimensions: { width: 1200, height: 675 },
      videoDuration: { min: 15, max: 140 },
      characterLimits: {
        title: 100,
        description: 280,
        hashtags: 10
      }
    },
    youtube: {
      maxTitleLength: 100,
      maxDescriptionLength: 5000,
      maxHashtags: 15,
      imageDimensions: { width: 1280, height: 720 },
      videoDuration: { min: 30, max: 180 },
      characterLimits: {
        title: 100,
        description: 5000,
        hashtags: 15
      }
    }
  };

  // Language configurations with country codes
  private static readonly LANGUAGE_CONFIGS: Record<string, {
    code: string;
    name: string;
    countryCode: string;
    prefix: string;
    rtl: boolean;
  }> = {
    'en': { code: 'en', name: 'English', countryCode: 'US', prefix: '+1', rtl: false },
    'id': { code: 'id', name: 'Bahasa Indonesia', countryCode: 'ID', prefix: '+62', rtl: false },
    'es': { code: 'es', name: 'Español', countryCode: 'ES', prefix: '+34', rtl: false },
    'fr': { code: 'fr', name: 'Français', countryCode: 'FR', prefix: '+33', rtl: false },
    'de': { code: 'de', name: 'Deutsch', countryCode: 'DE', prefix: '+49', rtl: false },
    'it': { code: 'it', name: 'Italiano', countryCode: 'IT', prefix: '+39', rtl: false },
    'pt': { code: 'pt', name: 'Português', countryCode: 'PT', prefix: '+351', rtl: false },
    'nl': { code: 'nl', name: 'Nederlands', countryCode: 'NL', prefix: '+31', rtl: false },
    'ja': { code: 'ja', name: '日本語', countryCode: 'JP', prefix: '+81', rtl: false },
    'ko': { code: 'ko', name: '한국어', countryCode: 'KR', prefix: '+82', rtl: false },
    'zh': { code: 'zh', name: '中文', countryCode: 'CN', prefix: '+86', rtl: false },
    'ar': { code: 'ar', name: 'العربية', countryCode: 'SA', prefix: '+966', rtl: true },
    'hi': { code: 'hi', name: 'हिन्दी', countryCode: 'IN', prefix: '+91', rtl: false },
    'th': { code: 'th', name: 'ไทย', countryCode: 'TH', prefix: '+66', rtl: false },
    'vi': { code: 'vi', name: 'Tiếng Việt', countryCode: 'VN', prefix: '+84', rtl: false }
  };

  public static getInstance(): AdGenerator {
    if (!AdGenerator.instance) {
      AdGenerator.instance = new AdGenerator();
    }
    return AdGenerator.instance;
  }

  constructor() {
    this.initializeTemplates();
    this.initializeQueue();
  }

  private initializeTemplates(): void {
    this.templates = [
      // Instagram templates
      {
        id: 'ig_romantic_1',
        platform: 'instagram',
        type: 'image',
        templates: {
          title: {
            en: 'Ready to Find Your Perfect Match? 💕',
            id: 'Siap Temukan Jodohmu? 💕',
            es: '¿Lista para Encontrar a tu Alma Gemela? 💕',
            fr: 'Prête à Trouver ton Âme Sœur? 💕',
            de: 'Bereit, deine perfekte Übereinstimmung zu finden? 💕',
            it: 'Pronta a Trovare l\'Anima Gemella? 💕',
            pt: 'Pronta para Encontrar sua Alma Gêmea? 💕',
            ja: '完璧な相手を見つける準備はできましたか？💕',
            ko: '완벽한 짝을 찾을 준비되셨나요? 💕',
            zh: '准备好找到你的完美匹配了吗？💕',
            ar: 'مستعدة للعثور على شريكك المثالي؟ 💕',
            hi: 'अपना उत्तम मिलान खोजने के लिए तैयार? 💕',
            th: 'พร้อมหาคู่ที่ใช่ของคุณหรือยัง? 💕',
            vi: 'Sẵn sàng tìm kiếm nửa còn lại của bạn? 💕'
          },
          description: {
            en: 'Tired of swiping endlessly? 2DateMe uses advanced AI to connect you with people who truly match your personality and values. Join thousands who found love through smart matching! 🚀\n\nDownload now and start your journey to meaningful connections.\n\n#DatingApp #Love #Relationships #OnlineDating #FindLove #2DateMe',
            id: 'Bosan swipe tanpa henti? 2DateMe menggunakan AI canggih untuk menghubungkan Anda dengan orang yang benar-benar sesuai dengan kepribadian dan nilai-nilai Anda. Bergabunglah dengan ribuan orang yang menemukan cinta melalui pencocokan cerdas! 🚀\n\nUnduh sekarang dan mulai perjalanan Anda ke koneksi yang bermakna.\n\n#AplikasiKencan #Cinta #Hubungan #KencanOnline #TemukanCinta #2DateMe',
            es: '¿Cansada de deslizar sin fin? 2DateMe usa IA avanzada para conectarte con personas que realmente coinciden con tu personalidad y valores. ¡Únete a miles que encontraron el amor a través de emparejamiento inteligente! 🚀\n\nDescarga ahora y comienza tu viaje hacia conexiones significativas.\n\n#AppDeCitas #Amor #Relaciones #CitasOnline #EncontrarAmor #2DateMe',
            fr: 'Fatiguée de swiper sans fin ? 2DateMe utilise l\'IA avancée pour vous connecter avec des personnes qui correspondent vraiment à votre personnalité et à vos valeurs. Rejoignez les milliers qui ont trouvé l\'amour grâce au matching intelligent ! 🚀\n\nTéléchargez maintenant et commencez votre voyage vers des connexions significatives.\n\n#AppDeRencontre #Amour #Relations #RencontreEnLigne #TrouverAmour #2DateMe',
            de: 'Müde vom endlosen Swipen? 2DateMe verwendet fortschrittliche KI, um Sie mit Menschen zu verbinden, die wirklich zu Ihrer Persönlichkeit und Ihren Werten passen. Schließen Sie sich Tausenden an, die durch intelligentes Matching Liebe gefunden haben! 🚀\n\nJetzt herunterladen und Ihre Reise zu bedeutungsvollen Verbindungen beginnen.\n\n#DatingApp #Liebe #Beziehungen #OnlineDating #LiebeFinden #2DateMe',
            it: 'Stanca di swipare all\'infinito? 2DateMe usa l\'IA avanzata per connetterti con persone che corrispondono davvero alla tua personalità e ai tuoi valori. Unisciti a migliaia che hanno trovato l\'amore attraverso il matching intelligente! 🚀\n\nScarica ora e inizia il tuo viaggio verso connessioni significative.\n\n#AppDiIncontri #Amore #Relazioni #IncontriOnline #TrovaAmore #2DateMe',
            pt: 'Cansada de swipar sem fim? 2DateMe usa IA avançada para conectar você com pessoas que realmente correspondem à sua personalidade e valores. Junte-se a milhares que encontraram amor através de matching inteligente! 🚀\n\nBaixe agora e comece sua jornada para conexões significativas.\n\n#AppDeNamoro #Amor #Relacionamentos #NamoroOnline #EncontreAmor #2DateMe',
            ja: '無限にスワイプするのに疲れましたか？2DateMeは高度なAIを使用して、あなたの性格と価値観に本当に合う人々とつながります。スマートマッチングで愛を見つけた何千人もの人々に参加してください！🚀\n\n今すぐダウンロードして、意味のあるつながりの旅を始めましょう。\n\n#デートアプリ #恋愛 #関係 #オンラインデート #恋を見つける #2DateMe',
            ko: '끝없이 스와이프하는 데 지쳤나요? 2DateMe는 고급 AI를 사용하여 당신의 성격과 가치에 정말로 맞는 사람들과 연결합니다. 스마트 매칭으로 사랑을 찾은 수천 명과 함께하세요! 🚀\n\n지금 다운로드하고 의미 있는 연결의 여정을 시작하세요.\n\n#데이팅앱 #사랑 #관계 #온라인데이팅 #사랑찾기 #2DateMe',
            zh: '厌倦了无休止的滑动吗？2DateMe使用先进的AI将您与真正符合您个性和价值观的人联系起来。加入数千名通过智能匹配找到爱情的人！🚀\n\n立即下载，开始您有意义连接的旅程。\n\n#约会应用 #爱情 #关系 #在线约会 #寻找爱情 #2DateMe',
            ar: 'متعباة من التمرير اللامتناهي؟ تستخدم 2DateMe ذكاء اصطناعي متقدم لتوصلك بأشخاص يتطابقون حقًا مع شخصيتك وقيمك. انضمي إلى آلاف من وجدن الحب من خلال المطابقة الذكية! 🚀\n\nحملي الآن وابدئي رحلتك نحو علاقات ذات معنى.\n\n#تطبيقالمواعدة #الحب #العلاقات #المواعدةالإلكترونية #ابحثي عن الحب #2DateMe',
            hi: 'अंतहीन स्वाइप करने से थक गईं? 2DateMe उन्नत AI का उपयोग करके आपको ऐसे लोगों से जोड़ता है जो वास्तव में आपके व्यक्तित्व और मूल्यों से मेल खाते हैं। स्मार्ट मैचिंग के माध्यम से प्यार पाने वाले हजारों लोगों में शामिल हों! 🚀\n\nअभी डाउनलोड करें और सार्थक कनेक्शन की यात्रा शुरू करें।\n\n#डेटिंगऐप #प्यार #रिश्ते #ऑनलाइनडेटिंग #प्यारढूंढो #2DateMe',
            th: 'เบื่อกับการสไวป์ไม่รู้จบ? 2DateMe ใช้ AI ขั้นสูงเพื่อเชื่อมต่อคุณกับคนที่ตรงกับบุคลิกและค่านิยมของคุณจริงๆ มาร่วมกับพันคนที่พบรักผ่านการจับคู่อัจฉริยะ! 🚀\n\nดาวน์โหลดตอนนี้และเริ่มการเดินทางของคุณสู่การเชื่อมต่อที่มีความหมาย\n\n#แอปพลิเคชันหาคู่ #ความรัก #ความสัมพันธ์ #หาคู่ออนไลน์ #หารัก #2DateMe',
            vi: 'Mệt mỏi vì vuốt vô tận? 2DateMe sử dụng AI tiên tiến để kết nối bạn với những người thực sự phù hợp với tính cách và giá trị của bạn. Hàng ngàn người đã tìm thấy tình yêu thông qua kết hợp thông minh! 🚀\n\nTải xuống ngay và bắt đầu hành trình của bạn đến những kết nối ý nghĩa.\n\n#ỨngDụngHẹnHò #TìnhYêu #MốiQuanHệ #HẹnHòTrựcTuyến #TìmTìnhYêu #2DateMe'
          },
          hashtags: {
            en: ['DatingApp', 'Love', 'Relationships', 'OnlineDating', 'FindLove', '2DateMe', 'MatchMaking', 'Soulmate'],
            id: ['AplikasiKencan', 'Cinta', 'Hubungan', 'KencanOnline', 'TemukanCinta', '2DateMe', 'Pencocokan', 'Jodoh'],
            es: ['AppDeCitas', 'Amor', 'Relaciones', 'CitasOnline', 'EncontrarAmor', '2DateMe', 'MatchMaking', 'AlmaGemela'],
            fr: ['AppDeRencontre', 'Amour', 'Relations', 'RencontreEnLigne', 'TrouverAmour', '2DateMe', 'MatchMaking', 'AmeSoeur'],
            de: ['DatingApp', 'Liebe', 'Beziehungen', 'OnlineDating', 'LiebeFinden', '2DateMe', 'MatchMaking', 'Seelenverwandter'],
            it: ['AppDiIncontri', 'Amore', 'Relazioni', 'IncontriOnline', 'TrovaAmore', '2DateMe', 'MatchMaking', 'AnimaGemella'],
            pt: ['AppDeNamoro', 'Amor', 'Relacionamentos', 'NamoroOnline', 'EncontreAmor', '2DateMe', 'MatchMaking', 'AlmaGemea'],
            ja: ['デートアプリ', '恋愛', '関係', 'オンラインデート', '恋を見つける', '2DateMe', 'マッチング', 'ソウルメイト'],
            ko: ['데이팅앱', '사랑', '관계', '온라인데이팅', '사랑찾기', '2DateMe', '매칭', '영혼의짝'],
            zh: ['约会应用', '爱情', '关系', '在线约会', '寻找爱情', '2DateMe', '匹配', '灵魂伴侣'],
            ar: ['تطبيقالمواعدة', 'الحب', 'العلاقات', 'المواعدةالإلكترونية', 'ابحثي عن الحب', '2DateMe', 'المطابقة', 'الروحالتوأم'],
            hi: ['डेटिंगऐप', 'प्यार', 'रिश्ते', 'ऑनलाइनडेटिंग', 'प्यारढूंढो', '2DateMe', 'मैचमेकिंग', 'सोलमेट'],
            th: ['แอปพลิเคชันหาคู่', 'ความรัก', 'ความสัมพันธ์', 'หาคู่ออนไลน์', 'หารัก', '2DateMe', 'การจับคู่', 'คู่ที่ใช่'],
            vi: ['ỨngDụngHẹnHò', 'TìnhYêu', 'MốiQuanHệ', 'HẹnHòTrựcTuyến', 'TìmTìnhYêu', '2DateMe', 'MatchMaking', 'BạnĐôi']
          },
          callToAction: {
            en: 'Download 2DateMe now and find your perfect match! 💕',
            id: 'Unduh 2DateMe sekarang dan temukan jodohmu! 💕',
            es: '¡Descarga 2DateMe ahora y encuentra a tu alma gemela! 💕',
            fr: 'Téléchargez 2DateMe maintenant et trouve ton âme sœur! 💕',
            de: 'Lade 2DateMe jetzt herunter und finde deine perfekte Übereinstimmung! 💕',
            it: 'Scarica 2DateMe ora e trova l\'anima gemella! 💕',
            pt: 'Baixe 2DateMe agora e encontre sua alma gêmea! 💕',
            ja: '今すぐ2DateMeをダウンロードして完璧な相手を見つけましょう！💕',
            ko: '지금 2DateMe를 다운로드하고 완벽한 짝을 찾으세요! 💕',
            zh: '立即下载2DateMe，找到你的完美匹配！💕',
            ar: 'حملي 2DateMe الآن وابحثي عن شريكك المثالي! 💕',
            hi: 'अभी 2DateMe डाउनलोड करें और अपना उत्तम मिलान खोजें! 💕',
            th: 'ดาวน์โหลด 2DateMe ตอนนี้และหาคู่ที่ใช่ของคุณ! 💕',
            vi: 'Tải xuống 2DateMe ngay bây giờ và tìm thấy nửa còn lại của bạn! 💕'
          }
        }
      },
      // Facebook templates
      {
        id: 'fb_professional_1',
        platform: 'facebook',
        type: 'image',
        templates: {
          title: {
            en: 'Revolutionary Dating App with AI-Powered Matching',
            id: 'Aplikasi Kencan Revolusioner dengan Pencocokan Berbasis AI',
            es: 'App de Citas Revolucionaria con Matching Impulsado por IA',
            fr: 'App de Rencontres Révolutionnaire avec Matching IA',
            de: 'Revolutionäre Dating-App mit KI-gestütztem Matching',
            it: 'App di Incontri Rivoluzionaria con Matching basato su IA',
            pt: 'App de Namoro Revolucionária com Matching baseado em IA',
            ja: 'AIマッチング搭載の革命的デートアプリ',
            ko: 'AI 기반 매칭이 있는 혁신적인 데이팅 앱',
            zh: '具有AI匹配功能的革命性约会应用',
            ar: 'تطبيق مواعدة ثوري مع مطابقة تعمل بالذكاء الاصطناعي',
            hi: 'AI-संचालित मिलान के साथ क्रांतिकारी डेटिंग ऐप',
            th: 'แอปหาคู่ปฏิวัติด้วยการจับคู่ AI',
            vi: 'Ứng dụng hẹn hò cách mạng với matching được hỗ trợ bởi AI'
          },
          description: {
            en: 'Discover why thousands of singles are choosing 2DateMe for meaningful connections. Our advanced AI algorithm analyzes your personality, interests, and values to suggest compatible matches.\n\n✨ Features:\n• AI-powered personality matching\n• Video calls and virtual dates\n• Secure messaging system\n• Local and global connections\n\nTry it free today and see the difference smart dating makes!\n\n#OnlineDating #DatingApp #AI #Love #Relationships #Technology',
            id: 'Temukan mengapa ribuan lajang memilih 2DateMe untuk koneksi yang bermakna. Algoritma AI canggih kami menganalisis kepribadian, minat, dan nilai-nilai Anda untuk menyarankan kecocokan yang kompatibel.\n\n✨ Fitur:\n• Pencocokan kepribadian berbasis AI\n• Panggilan video dan kencan virtual\n• Sistem pesan aman\n• Koneksi lokal dan global\n\nCoba gratis hari ini dan lihat perbedaan yang dibuat kencan cerdas!\n\n#KencanOnline #AplikasiKencan #AI #Cinta #Hubungan #Teknologi',
            es: 'Descubre por qué miles de solteros están eligiendo 2DateMe para conexiones significativas. Nuestro avanzado algoritmo de IA analiza tu personalidad, intereses y valores para sugerir coincidencias compatibles.\n\n✨ Características:\n• Matching de personalidad impulsado por IA\n• Llamadas de video y citas virtuales\n• Sistema de mensajería seguro\n• Conexiones locales y globales\n\n¡Pruébalo gratis hoy y ve la diferencia que hace el citas inteligentes!\n\n#CitasOnline #AppDeCitas #IA #Amor #Relaciones #Tecnología',
            fr: 'Découvrez pourquoi des milliers de célibataires choisissent 2DateMe pour des connexions significatives. Notre algorithme IA avancé analyse votre personnalité, vos intérêts et vos valeurs pour suggérer des compatibilités.\n\n✨ Caractéristiques:\n• Matching de personnalité IA\n• Appels vidéo et rendez-vous virtuels\n• Système de messagerie sécurisé\n• Connexions locales et globales\n\nEssayez gratuitement aujourd\'hui et voyez la différence que fait le rencontre intelligent!\n\n#RencontreEnLigne #AppDeRencontre #IA #Amour #Relations #Technologie',
            de: 'Entdecken Sie, warum Tausende von Singles 2DateMe für bedeutungsvolle Verbindungen wählen. Unser fortschrittlicher KI-Algorithmus analysiert Ihre Persönlichkeit, Interessen und Werte, um kompatible Übereinstimmungen vorzuschlagen.\n\n✨ Funktionen:\n• KI-gestützte Persönlichkeitsübereinstimmung\n• Videoanrufe und virtuelle Dates\n• Sicheres Messaging-System\n• Lokale und globale Verbindungen\n\nKostenlos heute testen und den Unterschied sehen, den intelligentes Dating macht!\n\n#OnlineDating #DatingApp #KI #Liebe #Beziehungen #Technologie',
            it: 'Scopri perché migliaia di single scelgono 2DateMe per connessioni significative. Il nostro avanzato algoritmo IA analizza la tua personalità, interessi e valori per suggerire compatibilità.\n\n✨ Caratteristiche:\n• Matching di personalità basato su IA\n• Chiamate video e appuntamenti virtuali\n• Sistema di messaggistica sicuro\n• Connessioni locali e globali\n\nProvalo gratis oggi e vedi la differenza che fa il dating intelligente!\n\n#IncontriOnline #AppDiIncontri #IA #Amore #Relazioni #Tecnologia',
            pt: 'Descubra por que milhares de solteiros estão escolhendo 2DateMe para conexões significativas. Nosso algoritmo avançado de IA analisa sua personalidade, interesses e valores para sugerir compatibilidades.\n\n✨ Recursos:\n• Matching de personalidade baseado em IA\n• Chamadas de vídeo e encontros virtuais\n• Sistema de mensagens seguro\n• Conexões locais e globais\n\nExperimente grátis hoje e veja a diferença que o namoro inteligente faz!\n\n#NamoroOnline #AppDeNamoro #IA #Amor #Relacionamentos #Tecnologia',
            ja: 'なぜ何千人ものシングルが意味のあるつながりのために2DateMeを選ぶのかを発見してください。私たちの高度なAIアルゴリズムが、あなたの性格、興味、価値観を分析して互換性のある相手を提案します。\n\n✨ 機能:\n• AIベースの性格マッチング\n• ビデオ通話とバーチャルデート\n• セキュアなメッセージングシステム\n• ローカルおよびグローバルなつながり\n\n今日無料で試して、スマートデートングがもたらす違いを確認してください！\n\n#オンラインデート #デートアプリ #AI #恋愛 #関係 #テクノロジー',
            ko: '수천 명의 싱글이 의미 있는 연결을 위해 2DateMe를 선택하는 이유를 알아보세요. 우리의 고급 AI 알고리즘이 당신의 성격, 관심사, 가치를 분석하여 호환되는 매치를 제안합니다.\n\n✨ 기능:\n• AI 기반 성격 매칭\n• 영상 통화 및 가상 데이트\n• 안전한 메시징 시스템\n• 지역 및 글로벌 연결\n\n오늘 무료로 시도하고 스마트 데이팅이 만드는 차이를 보세요!\n\n#온라인데이팅 #데이팅앱 #AI #사랑 #관계 #기술',
            zh: '发现为什么成千上万的单身人士选择2DateMe进行有意义的连接。我们先进的AI算法分析您的个性、兴趣和价值观，以建议兼容的匹配。\n\n✨ 特点:\n• AI驱动的个性匹配\n• 视频通话和虚拟约会\n• 安全消息系统\n• 本地和全球连接\n\n今天免费试用，看看智能约会带来的不同！\n\n#在线约会 #约会应用 #AI #爱情 #关系 #技术',
            ar: 'اكتشفي لماذا آلاف العازبين يختارون 2DateMe للعلاقات المعنوية. خوارزميتنا المتقدمة للذكاء الاصطناعي تحلل شخصيتك واهتماماتك وقيمك لتقترح توافقات متوافقة.\n\n✨ ميزات:\n• مطابقة شخصية تعمل بالذكاء الاصطناعي\n• مكالمات فيديو ومواعيد افتراضية\n• نظام رسائل آمن\n• اتصالات محلية وعالمية\n\nجربيها مجاناً اليوم واشاهدي الفرق الذي يصنعه المواعدة الذكية!\n\n#المواعدةالإلكترونية #تطبيقالمواعدة #الذكاءالاصطناعي #الحب #العلاقات #التقنية',
            hi: 'जानें कि हजारों सिंगल अर्थपूर्ण कनेक्शन के लिए 2DateMe क्यों चुन रहे हैं। हमारा उन्नत AI एल्गोरिथ्म आपके व्यक्तित्व, रुचियों और मूल्यों का विश्लेषण करके अनुकूल मैच का सुझाव देता है।\n\n✨ विशेषताएं:\n• AI-संचालित व्यक्तित्व मैचिंग\n• वीडियो कॉल और वर्चुअल डेट\n• सुरक्षित मैसेजिंग सिस्टम\n• स्थानीय और वैश्विक कनेक्शन\n\nआज मुफ्त आज़माएं और देखें कि स्मार्ट डेटिंग क्या अंतर लाता है!\n\n#ऑनलाइनडेटिंग #डेटिंगऐप #AI #प्यार #रिश्ते #तकनीक',
            th: 'ค้นพบว่าทำไมพันคนโสดเลือก 2DateMe สำหรับการเชื่อมต่อที่มีความหมาย อัลกอริทึม AI ขั้นสูงของเราวิเคราะห์บุคลิก ความสนใจ และค่านิยมของคุณเพื่อแนะนำคู่ที่เข้ากันได้\n\n✨ คุณสมบัติ:\n• การจับคู่บุคลิกฐาน AI\n• การโทรวิดีโอและนัดหมายเสมือนจริง\n• ระบบข้อความปลอดภัย\n• การเชื่อมต่อท้องถิ่นและทั่วโลก\n\nลองฟรีวันนี้และดูความแตกต่างที่การหาคู่อัจฉริยะทำ!\n\n#หาคู่ออนไลน์ #แอปหาคู่ #AI #ความรัก #ความสัมพันธ์ #เทคโนโลยี',
            vi: 'Khám phá lý do tại sao hàng ngàn người độc thân chọn 2DateMe cho các kết nối ý nghĩa. Thuật toán AI tiên tiến của chúng tôi phân tích tính cách, sở thích và giá trị của bạn để đề xuất các trận tương thích.\n\n✨ Tính năng:\n• Matching tính cách dựa trên AI\n• Cuộc gọi video và hẹn hò ảo\n• Hệ thống nhắn tin an toàn\n• Kết nối địa phương và toàn cầu\n\nThử miễn phí hôm nay và xem sự khác biệt mà hẹn hò thông minh tạo ra!\n\n#HẹnHòTrựcTuyến #ỨngDụngHẹnHò #AI #TìnhYêu #MốiQuanHệ #CôngNghệ'
          },
          hashtags: {
            en: ['OnlineDating', 'DatingApp', 'AI', 'Love', 'Relationships', 'Technology', 'MatchMaking', 'Innovation'],
            id: ['KencanOnline', 'AplikasiKencan', 'AI', 'Cinta', 'Hubungan', 'Teknologi', 'Pencocokan', 'Inovasi'],
            es: ['CitasOnline', 'AppDeCitas', 'IA', 'Amor', 'Relaciones', 'Tecnología', 'MatchMaking', 'Innovación'],
            fr: ['RencontreEnLigne', 'AppDeRencontre', 'IA', 'Amour', 'Relations', 'Technologie', 'MatchMaking', 'Innovation'],
            de: ['OnlineDating', 'DatingApp', 'KI', 'Liebe', 'Beziehungen', 'Technologie', 'MatchMaking', 'Innovation'],
            it: ['IncontriOnline', 'AppDiIncontri', 'IA', 'Amore', 'Relazioni', 'Tecnologia', 'MatchMaking', 'Innovazione'],
            pt: ['NamoroOnline', 'AppDeNamoro', 'IA', 'Amor', 'Relacionamentos', 'Tecnologia', 'MatchMaking', 'Inovação'],
            ja: ['オンラインデート', 'デートアプリ', 'AI', '恋愛', '関係', 'テクノロジー', 'マッチング', 'イノベーション'],
            ko: ['온라인데이팅', '데이팅앱', 'AI', '사랑', '관계', '기술', '매칭', '혁신'],
            zh: ['在线约会', '约会应用', 'AI', '爱情', '关系', '技术', '匹配', '创新'],
            ar: ['المواعدةالإلكترونية', 'تطبيقالمواعدة', 'الذكاءالاصطناعي', 'الحب', 'العلاقات', 'التقنية', 'المطابقة', 'الابتكار'],
            hi: ['ऑनलाइनडेटिंग', 'डेटिंगऐप', 'AI', 'प्यार', 'रिश्ते', 'तकनीक', 'मैचमेकिंग', 'नवाचार'],
            th: ['หาคู่ออนไลน์', 'แอปหาคู่', 'AI', 'ความรัก', 'ความสัมพันธ์', 'เทคโนโลยี', 'การจับคู่', 'นวัตกรรม'],
            vi: ['HẹnHòTrựcTuyến', 'ỨngDụngHẹnHò', 'AI', 'TìnhYêu', 'MốiQuanHệ', 'CôngNghệ', 'MatchMaking', 'ĐổiMới']
          },
          callToAction: {
            en: 'Experience the future of online dating. Download 2DateMe today! 🚀',
            id: 'Rasakan masa depan kencan online. Unduh 2DateMe hari ini! 🚀',
            es: 'Experimenta el futuro de las citas online. ¡Descarga 2DateMe hoy! 🚀',
            fr: 'Expérimentez l\'avenir des rencontres en ligne. Téléchargez 2DateMe aujourd\'hui! 🚀',
            de: 'Erlebe die Zukunft des Online-Datings. Lade 2DateMe heute herunter! 🚀',
            it: 'Sperimenta il futuro degli incontri online. Scarica 2DateMe oggi! 🚀',
            pt: 'Experimente o futuro dos encontros online. Baixe 2DateMe hoje! 🚀',
            ja: 'オンラインデートの未来を体験してください。今日2DateMeをダウンロード！🚀',
            ko: '온라인 데이팅의 미래를 경험하세요. 오늘 2DateMe를 다운로드하세요! 🚀',
            zh: '体验在线约会的未来。今天下载2DateMe！🚀',
            ar: 'جربي مستقبل المواعدة الإلكترونية. حملي 2DateMe اليوم! 🚀',
            hi: 'ऑनलाइन डेटिंग का भविष्य अनुभव करें। आज 2DateMe डाउनलोड करें! 🚀',
            th: 'สัมผัสอนาคตของการหาคู่ออนไลน์ ดาวน์โหลด 2DateMe วันนี้! 🚀',
            vi: 'Trải nghiệm tương lai của hẹn hò trực tuyến. Tải xuống 2DateMe ngay hôm nay! 🚀'
          }
        }
      },
      // TikTok templates
      {
        id: 'tt_trending_1',
        platform: 'tiktok',
        type: 'video',
        templates: {
          title: {
            en: 'POV: You finally found your perfect match 💕',
            id: 'POV: Akhirnya kamu menemukan jodohmu 💕',
            es: 'POV: Finalmente encontraste a tu alma gemela 💕',
            fr: 'POV: Tu as enfin trouvé ton âme sœur 💕',
            de: 'POV: Du hast endlich deine perfekte Übereinstimmung gefunden 💕',
            it: 'POV: Hai finalmente trovato la tua anima gemella 💕',
            pt: 'POV: Você finalmente encontrou sua alma gêmea 💕',
            ja: 'POV: ついに完璧な相手を見つけた 💕',
            ko: 'POV: 마침내 완벽한 짝을 찾았다 💕',
            zh: 'POV: 你终于找到了你的完美匹配 💕',
            ar: 'نقطة نظر: وجدتِ أخيراً شريكك المثالي 💕',
            hi: 'POV: आपने आखिरकार अपना उत्तम मिलान खोजा 💕',
            th: 'POV: สุดท้ายคุณก็เจอคู่ที่ใช่แล้ว 💕',
            vi: 'POV: Cuối cùng bạn cũng tìm thấy nửa còn lại của mình 💕'
          },
          description: {
            en: 'Stop swiping, start matching! 🎯 2DateMe AI finds your perfect match based on personality, not just looks. Download now! #dating #love #perfectmatch #2DateMe',
            id: 'Berhenti swipe, mulai pencocokan! 🎯 AI 2DateMe menemukan jodohmu berdasarkan kepribadian, bukan hanya penampilan. Unduh sekarang! #kencan #cinta #jodoh #2DateMe',
            es: '¡Deja de swipar, empieza a hacer match! 🎯 La IA de 2DateMe encuentra tu alma gemela basada en personalidad, no solo en apariencia. ¡Descarga ahora! #citas #amor #almaGemela #2DateMe',
            fr: 'Arrête de swiper, commence à matcher! 🎯 L\'IA de 2DateMe trouve ton âme sœur basée sur la personnalité, pas seulement l\'apparence. Télécharge maintenant! #rencontres #amour #ameSoeur #2DateMe',
            de: 'Hör auf zu swipen, fange an zu matchen! 🎯 2DateMe KI findet deine perfekte Übereinstimmung basierend auf Persönlichkeit, nicht nur Aussehen. Jetzt herunterladen! #dating #liebe #perfekteÜbereinstimmung #2DateMe',
            it: 'Smettila di swipare, inizia a fare match! 🎯 L\'IA di 2DateMe trova la tua anima gemella basata sulla personalità, non solo sull\'aspetto. Scarica ora! #incontri #amore #animaGemella #2DateMe',
            pt: 'Pare de swipar, comece a fazer match! 🎯 A IA do 2DateMe encontra sua alma gêmea baseada na personalidade, não apenas na aparência. Baixe agora! #namoro #amor #almaGemea #2DateMe',
            ja: 'スワイプをやめて、マッチングを始めよう！🎯 2DateMe AIは見た目だけでなく、性格に基づいて完璧な相手を見つけます。今すぐダウンロード！#デート #恋愛 #完璧な相手 #2DateMe',
            ko: '스와이프를 멈추고 매칭을 시작하세요! 🎯 2DateMe AI는 외모뿐만 아니라 성격에 기반하여 완벽한 짝을 찾아줍니다. 지금 다운로드하세요! #데이팅 #사랑 #완벽한짝 #2DateMe',
            zh: '停止滑动，开始匹配！🎯 2DateMe AI根据性格而不仅仅是外表找到你的完美匹配。立即下载！#约会 #爱情 #完美匹配 #2DateMe',
            ar: 'توقفي عن التمرير، ابدئي المطابقة! 🎯 2DateMe AI يجد شريكك المثالي بناءً على الشخصية، وليس فقط المظهر. حملي الآن! #مواعدة #حب #شريك_مثالي #2DateMe',
            hi: 'स्वाइप करना बंद करें, मैचिंग शुरू करें! 🎯 2DateMe AI आपके व्यक्तित्व के आधार पर आपका उत्तम मिलान खोजता है, केवल दिखावट नहीं। अभी डाउनलोड करें! #डेटिंग #प्यार #उत्तममिलान #2DateMe',
            th: 'หยุดสไปป์ เริ่มจับคู่! 🎯 2DateMe AI หาคู่ที่ใช่ของคุณจากบุคลิก ไม่ใช่แค่หน้าตา ดาวน์โหลดตอนนี้! #หาคู่ #ความรัก #คู่ที่ใช่ #2DateMe',
            vi: 'Ngừng vuốt, bắt đầu kết nối! 🎯 AI 2DateMe tìm thấy nửa còn lại của bạn dựa trên tính cách, không chỉ ngoại hình. Tải xuống ngay! #hẹn hò #tình yêu #hoàn hảo #2DateMe'
          },
          hashtags: {
            en: ['dating', 'love', 'perfectmatch', '2DateMe', 'AI', 'relationships', 'soulmate'],
            id: ['kencan', 'cinta', 'jodoh', '2DateMe', 'AI', 'hubungan', 'jodoh'],
            es: ['citas', 'amor', 'almaGemela', '2DateMe', 'IA', 'relaciones', 'pareja'],
            fr: ['rencontres', 'amour', 'ameSoeur', '2DateMe', 'IA', 'relations', 'couple'],
            de: ['dating', 'liebe', 'perfekteÜbereinstimmung', '2DateMe', 'KI', 'beziehungen', 'partner'],
            it: ['incontri', 'amore', 'animaGemella', '2DateMe', 'IA', 'relazioni', 'partner'],
            pt: ['namoro', 'amor', 'almaGemea', '2DateMe', 'IA', 'relacionamentos', 'parceiro'],
            ja: ['デート', '恋愛', '完璧な相手', '2DateMe', 'AI', '関係', 'パートナー'],
            ko: ['데이팅', '사랑', '완벽한짝', '2DateMe', 'AI', '관계', '파트너'],
            zh: ['约会', '爱情', '完美匹配', '2DateMe', 'AI', '关系', '伴侣'],
            ar: ['مواعدة', 'حب', 'شريك_مثالي', '2DateMe', 'الذكاءالاصطناعي', 'علاقات', 'شريك'],
            hi: ['डेटिंग', 'प्यार', 'उत्तममिलान', '2DateMe', 'AI', 'रिश्ते', 'पार्टनर'],
            th: ['หาคู่', 'ความรัก', 'คู่ที่ใช่', '2DateMe', 'AI', 'ความสัมพันธ์', 'แฟน'],
            vi: ['hẹn hò', 'tình yêu', 'hoàn hảo', '2DateMe', 'AI', 'mối quan hệ', 'bạn đời']
          },
          callToAction: {
            en: 'Download 2DateMe and find your soulmate! 💕',
            id: 'Unduh 2DateMe dan temukan jodohmu! 💕',
            es: '¡Descarga 2DateMe y encuentra a tu alma gemela! 💕',
            fr: 'Télécharge 2DateMe et trouve ton âme sœur! 💕',
            de: 'Lade 2DateMe herunter und finde deine Seelepartnerin! 💕',
            it: 'Scarica 2DateMe e trova la tua anima gemella! 💕',
            pt: 'Baixe 2DateMe e encontre sua alma gêmea! 💕',
            ja: '2DateMeをダウンロードしてソウルメイトを見つけよう！💕',
            ko: '2DateMe를 다운로드하고 영혼의 짝을 찾으세요! 💕',
            zh: '下载2DateMe，找到你的灵魂伴侣！💕',
            ar: 'حملي 2DateMe وابحثي عن روحك التوأم! 💕',
            hi: '2DateMe डाउनलोड करें और अपना सोलमेट खोजें! 💕',
            th: 'ดาวน์โหลด 2DateMe และหาคู่ที่ใช่ของคุณ! 💕',
            vi: 'Tải xuống 2DateMe và tìm thấy bạn đời của bạn! 💕'
          }
        }
      }
    ];
  }

  private initializeQueue(): void {
    // Initialize queue with ads
    this.generateAdsForQueue();
  }

  // Generate ads for queue
  private generateAdsForQueue(): void {
    const platforms: Platform[] = ['instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'youtube'];
    const languages = Object.keys(AdGenerator.LANGUAGE_CONFIGS);
    
    // Generate ads to maintain queue size
    while (this.queue.length < this.queueSize) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const language = languages[Math.floor(Math.random() * languages.length)];
      const type = Math.random() > 0.5 ? 'image' : 'video';
      
      const ad = this.generateAd(platform, type, language);
      if (ad) {
        this.queue.push(ad);
      }
    }
  }

  // Generate single ad
  public generateAd(platform: Platform, type: 'image' | 'video', language: string): AdContent | null {
    const config = AdGenerator.PLATFORM_CONFIGS[platform];
    const langConfig = AdGenerator.LANGUAGE_CONFIGS[language];
    
    // Find suitable template
    const templates = this.templates.filter(t => 
      t.platform === platform && 
      t.type === type
    );
    
    if (templates.length === 0) return null;
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Generate content
    const title = template.templates.title[language] || template.templates.title['en'];
    const description = template.templates.description[language] || template.templates.description['en'];
    const hashtags = template.templates.hashtags[language] || template.templates.hashtags['en'];
    const callToAction = template.templates.callToAction[language] || template.templates.callToAction['en'];
    
    // Apply security filtering
    const filteredContent = this.filterContent(title + ' ' + description + ' ' + callToAction);
    if (!filteredContent.isValid) {
      console.warn('Ad content filtered due to security violations:', filteredContent.violations);
      return null;
    }
    
    // Generate media URLs (in production, these would be CDN URLs)
    const imageUrl = type === 'image' ? this.generateImageUrl(platform, language) : undefined;
    const videoUrl = type === 'video' ? this.generateVideoUrl(platform, language) : undefined;
    
    return {
      id: this.generateAdId(),
      platform,
      type,
      title: title.substring(0, config.maxTitleLength),
      description: description.substring(0, config.maxDescriptionLength),
      hashtags: hashtags.slice(0, config.maxHashtags),
      callToAction,
      link: this.appUrl,
      imageUrl,
      videoUrl,
      language,
      country: langConfig.countryCode,
      generatedAt: new Date(),
      isUsed: false
    };
  }

  // Get next ad from queue
  public getNextAd(platform?: Platform, language?: string): AdContent | null {
    // Find unused ad matching criteria
    let availableAds = this.queue.filter(ad => !ad.isUsed);
    
    if (platform) {
      availableAds = availableAds.filter(ad => ad.platform === platform);
    }
    
    if (language) {
      availableAds = availableAds.filter(ad => ad.language === language);
    }
    
    if (availableAds.length === 0) {
      // Generate new ad if none available
      const selectedPlatform = platform || 'instagram';
      const selectedLanguage = language || 'en';
      const type = Math.random() > 0.5 ? 'image' : 'video';
      
      const newAd = this.generateAd(selectedPlatform, type, selectedLanguage);
      if (newAd) {
        this.queue.push(newAd);
        return newAd;
      }
      return null;
    }
    
    // Mark as used and return
    const ad = availableAds[0];
    ad.isUsed = true;
    
    // Generate replacement ad
    this.generateAdsForQueue();
    
    return ad;
  }

  // Get queue status
  public getQueueStatus(): {
    total: number;
    used: number;
    available: number;
    byPlatform: Record<Platform, number>;
    byLanguage: Record<string, number>;
  } {
    const total = this.queue.length;
    const used = this.queue.filter(ad => ad.isUsed).length;
    const available = total - used;
    
    const byPlatform: Record<Platform, number> = {
      instagram: 0,
      facebook: 0,
      tiktok: 0,
      linkedin: 0,
      twitter: 0,
      youtube: 0
    };
    
    const byLanguage: Record<string, number> = {};
    
    this.queue.forEach(ad => {
      byPlatform[ad.platform]++;
      byLanguage[ad.language] = (byLanguage[ad.language] || 0) + 1;
    });
    
    return {
      total,
      used,
      available,
      byPlatform,
      byLanguage
    };
  }

  // Regenerate ads with new settings
  public regenerateAds(settings: {
    platforms?: Platform[];
    languages?: string[];
    types?: ('image' | 'video')[];
  }): void {
    // Clear existing queue
    this.queue = [];
    
    // Generate new ads with settings
    const platforms = settings.platforms || ['instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'youtube'];
    const languages = settings.languages || Object.keys(AdGenerator.LANGUAGE_CONFIGS);
    const types = settings.types || ['image', 'video'];
    
    // Generate ads to fill queue
    while (this.queue.length < this.queueSize) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const language = languages[Math.floor(Math.random() * languages.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const ad = this.generateAd(platform, type, language);
      if (ad) {
        this.queue.push(ad);
      }
    }
  }

  // Get platform-specific formatted content
  public getFormattedAd(ad: AdContent): {
    title: string;
    description: string;
    hashtags: string;
    fullText: string;
    characterCount: {
      title: number;
      description: number;
      total: number;
    };
    withinLimits: boolean;
  } {
    const config = AdGenerator.PLATFORM_CONFIGS[ad.platform];
    
    const hashtags = ad.hashtags.map(tag => `#${tag}`).join(' ');
    const fullText = `${ad.title}\n\n${ad.description}\n\n${hashtags}\n\n${ad.callToAction}\n\n${ad.link}`;
    
    const characterCount = {
      title: ad.title.length,
      description: ad.description.length,
      total: fullText.length
    };
    
    const withinLimits = 
      ad.title.length <= config.maxTitleLength &&
      ad.description.length <= config.maxDescriptionLength &&
      ad.hashtags.length <= config.maxHashtags;
    
    return {
      title: ad.title,
      description: ad.description,
      hashtags,
      fullText,
      characterCount,
      withinLimits
    };
  }

  // Security filtering
  private filterContent(content: string): {
    isValid: boolean;
    violations: string[];
  } {
    // Apply same security filter as user content
    const violations: string[] = [];
    
    // Check for links
    if (/https?:\/\//.test(content)) {
      violations.push('links');
    }
    
    // Check for phone numbers
    if (/\d{7,}/.test(content)) {
      violations.push('phone_numbers');
    }
    
    // Check for platform references
    const platforms = ['instagram', 'facebook', 'twitter', 'tiktok', 'linkedin', 'whatsapp', 'telegram'];
    for (const platform of platforms) {
      if (new RegExp(`\\b${platform}\\b`, 'i').test(content)) {
        violations.push('platform_references');
        break;
      }
    }
    
    return {
      isValid: violations.length === 0,
      violations
    };
  }

  // Generate image URL (mock implementation)
  private generateImageUrl(platform: Platform, language: string): string {
    const config = AdGenerator.PLATFORM_CONFIGS[platform];
    const langConfig = AdGenerator.LANGUAGE_CONFIGS[language];
    
    // In production, this would generate or select from CDN
    return `https://cdn.2dateme.com/ads/${platform}/${language}/${Date.now()}.jpg`;
  }

  // Generate video URL (mock implementation)
  private generateVideoUrl(platform: Platform, language: string): string {
    // In production, this would generate or select from CDN
    return `https://cdn.2dateme.com/ads/${platform}/${language}/${Date.now()}.mp4`;
  }

  // Utility methods
  private generateAdId(): string {
    return `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get available platforms
  public getPlatforms(): Platform[] {
    return Object.keys(AdGenerator.PLATFORM_CONFIGS) as Platform[];
  }

  // Get available languages
  public getLanguages(): Array<{
    code: string;
    name: string;
    countryCode: string;
    prefix: string;
    rtl: boolean;
  }> {
    return Object.values(AdGenerator.LANGUAGE_CONFIGS);
  }

  // Get platform configuration
  public getPlatformConfig(platform: Platform): typeof AdGenerator.PLATFORM_CONFIGS[Platform] {
    return AdGenerator.PLATFORM_CONFIGS[platform];
  }

  // Copy ad to clipboard
  public async copyAdToClipboard(ad: AdContent): Promise<boolean> {
    try {
      const formatted = this.getFormattedAd(ad);
      await navigator.clipboard.writeText(formatted.fullText);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }
}

// Export singleton instance
export default AdGenerator.getInstance();
