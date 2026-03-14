// Enhanced metadata for date ideas with contextual information
export interface DateIdeaMetadata {
  dateType: string;
  duration: string;
  costLevel: string;
  costLevelIDR: string;
  bestTime: string;
  vibe: string;
  whyGoodDate: string[];
  conversationStarters: string[];
  suggestedExtras: Array<{
    icon: string;
    text: string;
    service: string;
  }>;
}

export const DATE_IDEA_METADATA: Record<string, DateIdeaMetadata> = {
  // ── Café & Drinks ──
  "Coffee At A Cozy Café ☕": {
    dateType: "Café",
    duration: "1-2 hours",
    costLevel: "$",
    costLevelIDR: "Rp 50k-150k",
    bestTime: "Morning / Afternoon",
    vibe: "Casual & Intimate",
    whyGoodDate: [
      "Quiet environment perfect for conversation",
      "Relaxed atmosphere reduces first date pressure",
      "Easy to extend if things go well",
      "Ideal for getting to know each other"
    ],
    conversationStarters: [
      "What's your favorite way to start the day?",
      "Are you a coffee person or tea person?",
      "What's the best café you've ever been to?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  "Coffee And Deep Conversation ☕": {
    dateType: "Café",
    duration: "2-3 hours",
    costLevel: "$",
    costLevelIDR: "Rp 50k-150k",
    bestTime: "Afternoon / Evening",
    vibe: "Intimate & Thoughtful",
    whyGoodDate: [
      "Perfect for meaningful conversations",
      "Comfortable setting encourages openness",
      "No time pressure or distractions",
      "Shows genuine interest in connection"
    ],
    conversationStarters: [
      "What's something you're passionate about?",
      "What's a dream you've always had?",
      "What matters most to you in life?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  "Morning Coffee Date ☀️": {
    dateType: "Café",
    duration: "1-2 hours",
    costLevel: "$",
    costLevelIDR: "Rp 50k-150k",
    bestTime: "Morning",
    vibe: "Fresh & Energetic",
    whyGoodDate: [
      "Fresh start with positive morning energy",
      "Shows commitment (waking up early)",
      "Natural time limit keeps it casual",
      "Great for busy professionals"
    ],
    conversationStarters: [
      "Are you a morning person?",
      "What's your morning routine like?",
      "What gets you excited to start the day?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  "Rooftop Café Sunset Drinks 🌇": {
    dateType: "Café / Bar",
    duration: "2-3 hours",
    costLevel: "$$",
    costLevelIDR: "Rp 150k-400k",
    bestTime: "Sunset / Evening",
    vibe: "Romantic & Relaxed",
    whyGoodDate: [
      "Stunning sunset views create romantic atmosphere",
      "Elevated setting feels special",
      "Great photo opportunities",
      "Perfect transition from day to evening"
    ],
    conversationStarters: [
      "What's the most beautiful sunset you've seen?",
      "Do you prefer city views or nature views?",
      "What's your ideal evening like?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "🏨", text: "Book nearby hotel for after", service: "hotel_booking" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  // ── Food & Dining ──
  "Dinner At A Nice Restaurant 🍝": {
    dateType: "Restaurant",
    duration: "2-3 hours",
    costLevel: "$$$",
    costLevelIDR: "Rp 300k-800k",
    bestTime: "Evening",
    vibe: "Romantic & Elegant",
    whyGoodDate: [
      "Shows thoughtfulness and effort",
      "Ambient lighting creates intimate mood",
      "Great food enhances the experience",
      "Perfect for making a good impression"
    ],
    conversationStarters: [
      "What's your favorite type of cuisine?",
      "Do you enjoy cooking or dining out more?",
      "What's the best meal you've ever had?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "💎", text: "Browse jewelry for special occasions", service: "jewelry" },
      { icon: "🏨", text: "Book nearby hotel for after", service: "hotel_booking" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  "Street Food Adventure 🍜": {
    dateType: "Street Food",
    duration: "2-3 hours",
    costLevel: "$",
    costLevelIDR: "Rp 50k-150k",
    bestTime: "Evening / Night",
    vibe: "Fun & Adventurous",
    whyGoodDate: [
      "Exciting and full of energy",
      "Trying new foods together creates bonding",
      "Casual and pressure-free",
      "Shows adventurous personality"
    ],
    conversationStarters: [
      "What's the most adventurous food you've tried?",
      "Do you prefer adventure dates or calm ones?",
      "What's your go-to comfort food?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" }
    ]
  },

  "Cooking Together At Home 🧑‍🍳": {
    dateType: "Home Activity",
    duration: "3-4 hours",
    costLevel: "$$",
    costLevelIDR: "Rp 150k-300k",
    bestTime: "Evening",
    vibe: "Intimate & Fun",
    whyGoodDate: [
      "Teamwork reveals compatibility",
      "Intimate setting builds connection",
      "Fun and interactive activity",
      "Shared accomplishment of cooking together"
    ],
    conversationStarters: [
      "What's your signature dish?",
      "Do you prefer sweet or savory?",
      "What's a food memory from childhood?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "🏨", text: "Book nearby villa for privacy", service: "hotel_booking" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  // ── Beach & Sunset ──
  "Beach Sunset Walk 🌅": {
    dateType: "Beach",
    duration: "1-2 hours",
    costLevel: "$",
    costLevelIDR: "Free-Rp 50k",
    bestTime: "Sunset",
    vibe: "Romantic & Peaceful",
    whyGoodDate: [
      "Natural beauty creates romantic atmosphere",
      "Sound of waves is calming",
      "Perfect for meaningful conversation",
      "Unforgettable sunset views"
    ],
    conversationStarters: [
      "What's your favorite place to relax?",
      "Beach person or mountain person?",
      "What makes you feel most peaceful?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "🏨", text: "Book beachfront hotel", service: "hotel_booking" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  "Watching The Sunset Together 🌇": {
    dateType: "Outdoor",
    duration: "1-2 hours",
    costLevel: "$",
    costLevelIDR: "Free-Rp 50k",
    bestTime: "Sunset",
    vibe: "Romantic & Serene",
    whyGoodDate: [
      "Shared beautiful moment creates connection",
      "Natural conversation starter",
      "No pressure, just enjoying the view",
      "Memorable and romantic"
    ],
    conversationStarters: [
      "What's the most beautiful place you've been?",
      "Do you prefer sunrise or sunset?",
      "What's your happy place?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "🏨", text: "Book nearby hotel with view", service: "hotel_booking" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  // ── Spa & Wellness ──
  "Spa Day Together 💆": {
    dateType: "Spa / Wellness",
    duration: "2-4 hours",
    costLevel: "$$$",
    costLevelIDR: "Rp 500k-1.5jt",
    bestTime: "Afternoon",
    vibe: "Relaxing & Intimate",
    whyGoodDate: [
      "Ultimate relaxation together",
      "Intimate and pampering experience",
      "Shows care for wellbeing",
      "Creates lasting memories"
    ],
    conversationStarters: [
      "What's your favorite way to unwind?",
      "Do you prioritize self-care?",
      "What helps you de-stress?"
    ],
    suggestedExtras: [
      { icon: "💆", text: "Book couples massage", service: "massage" },
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "🏨", text: "Book spa resort stay", service: "hotel_booking" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  "Couples Massage 💆‍♀️": {
    dateType: "Spa / Wellness",
    duration: "2-3 hours",
    costLevel: "$$$",
    costLevelIDR: "Rp 400k-1jt",
    bestTime: "Afternoon / Evening",
    vibe: "Relaxing & Romantic",
    whyGoodDate: [
      "Deeply relaxing shared experience",
      "Intimate without pressure",
      "Shows thoughtfulness",
      "Perfect for stress relief together"
    ],
    conversationStarters: [
      "How often do you take time for yourself?",
      "What's your ideal way to relax?",
      "Do you prefer active dates or relaxing ones?"
    ],
    suggestedExtras: [
      { icon: "💆", text: "Book couples massage", service: "massage" },
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "🏨", text: "Book spa hotel package", service: "hotel_booking" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  // ── Outdoor & Nature ──
  "Walk In The Park 🌳": {
    dateType: "Outdoor",
    duration: "1-2 hours",
    costLevel: "$",
    costLevelIDR: "Free-Rp 50k",
    bestTime: "Morning / Afternoon",
    vibe: "Casual & Peaceful",
    whyGoodDate: [
      "Fresh air and natural scenery",
      "Low pressure environment",
      "Easy conversation flow",
      "Can extend naturally if going well"
    ],
    conversationStarters: [
      "Do you prefer city life or nature?",
      "What's your favorite outdoor activity?",
      "Where do you go to clear your mind?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  "Picnic In The Park 🧺": {
    dateType: "Outdoor",
    duration: "2-3 hours",
    costLevel: "$$",
    costLevelIDR: "Rp 100k-250k",
    bestTime: "Afternoon",
    vibe: "Romantic & Relaxed",
    whyGoodDate: [
      "Thoughtful preparation shows care",
      "Intimate outdoor setting",
      "Natural conversation environment",
      "Memorable and romantic"
    ],
    conversationStarters: [
      "What's your favorite picnic food?",
      "Do you enjoy outdoor activities?",
      "What's your ideal weekend like?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  "Hiking A Scenic Trail 🥾": {
    dateType: "Outdoor Adventure",
    duration: "3-5 hours",
    costLevel: "$",
    costLevelIDR: "Free-Rp 100k",
    bestTime: "Morning",
    vibe: "Adventurous & Active",
    whyGoodDate: [
      "Builds trust through shared challenge",
      "Reveals character and endurance",
      "Breathtaking views as reward",
      "Great for active personalities"
    ],
    conversationStarters: [
      "Are you into fitness and outdoor activities?",
      "What's the most adventurous thing you've done?",
      "Do you prefer adventure or relaxation?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  // ── Entertainment ──
  "Night At The Cinema 🎬": {
    dateType: "Entertainment",
    duration: "3-4 hours",
    costLevel: "$$",
    costLevelIDR: "Rp 150k-300k",
    bestTime: "Evening",
    vibe: "Fun & Casual",
    whyGoodDate: [
      "Built-in conversation topic afterward",
      "Low pressure during the movie",
      "Classic date choice",
      "Easy to extend with dinner"
    ],
    conversationStarters: [
      "What's your favorite movie genre?",
      "Cinema or streaming at home?",
      "What movie made you cry or laugh the most?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "🏨", text: "Book nearby hotel for after", service: "hotel_booking" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  "Live Music Night 🎵": {
    dateType: "Entertainment",
    duration: "3-4 hours",
    costLevel: "$$",
    costLevelIDR: "Rp 200k-500k",
    bestTime: "Evening / Night",
    vibe: "Energetic & Fun",
    whyGoodDate: [
      "Shared energy creates connection",
      "Music reveals personality",
      "No awkward silences",
      "Memorable experience"
    ],
    conversationStarters: [
      "What kind of music do you love?",
      "Have you been to any great concerts?",
      "Do you play any instruments?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "🏨", text: "Book nearby hotel for after", service: "hotel_booking" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  "Art Gallery Visit 🎨": {
    dateType: "Cultural",
    duration: "2-3 hours",
    costLevel: "$$",
    costLevelIDR: "Rp 50k-200k",
    bestTime: "Afternoon",
    vibe: "Thoughtful & Cultured",
    whyGoodDate: [
      "Stimulating and different",
      "Reveals how each person sees the world",
      "Natural conversation starters",
      "Shows cultural interest"
    ],
    conversationStarters: [
      "What kind of art speaks to you?",
      "Do you have a creative side?",
      "What's the most interesting exhibit you've seen?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  // ── Active & Fun ──
  "Bowling Night Together 🎳": {
    dateType: "Active Fun",
    duration: "2-3 hours",
    costLevel: "$$",
    costLevelIDR: "Rp 150k-300k",
    bestTime: "Evening",
    vibe: "Playful & Competitive",
    whyGoodDate: [
      "Playful competition breaks ice",
      "Lots of laughter and banter",
      "Reveals competitive side",
      "Fun and memorable"
    ],
    conversationStarters: [
      "Are you competitive or laid-back?",
      "What games did you love as a kid?",
      "Do you prefer team sports or solo activities?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  "Escape Room Challenge 🔐": {
    dateType: "Active Fun",
    duration: "2-3 hours",
    costLevel: "$$",
    costLevelIDR: "Rp 200k-400k",
    bestTime: "Afternoon / Evening",
    vibe: "Thrilling & Collaborative",
    whyGoodDate: [
      "Reveals problem-solving skills",
      "Shows communication style",
      "Builds teamwork",
      "Exciting and memorable"
    ],
    conversationStarters: [
      "Do you like puzzles and challenges?",
      "How do you handle pressure?",
      "Are you a leader or team player?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  // ── Romantic ──
  "Watching The Stars Together ⭐": {
    dateType: "Romantic",
    duration: "2-3 hours",
    costLevel: "$",
    costLevelIDR: "Free-Rp 50k",
    bestTime: "Night",
    vibe: "Romantic & Intimate",
    whyGoodDate: [
      "Quiet and romantic atmosphere",
      "Opens up deep conversations",
      "Perfect for meaningful connection",
      "Unforgettable experience"
    ],
    conversationStarters: [
      "What are your biggest dreams?",
      "Do you believe in fate or destiny?",
      "What makes you feel most alive?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "🏨", text: "Book romantic villa", service: "hotel_booking" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  "Rooftop Bar Drinks 🍸": {
    dateType: "Bar / Lounge",
    duration: "2-3 hours",
    costLevel: "$$$",
    costLevelIDR: "Rp 300k-600k",
    bestTime: "Evening / Night",
    vibe: "Sophisticated & Romantic",
    whyGoodDate: [
      "City lights create romantic mood",
      "Cool breeze and great views",
      "Perfect for flirty conversations",
      "Elevated and special setting"
    ],
    conversationStarters: [
      "What's your favorite cocktail?",
      "Do you prefer rooftops or cozy corners?",
      "What's your ideal night out?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "🏨", text: "Book nearby luxury hotel", service: "hotel_booking" },
      { icon: "💎", text: "Browse jewelry for special occasions", service: "jewelry" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  },

  // ── Default for unmapped ideas ──
  "_default": {
    dateType: "Date Activity",
    duration: "2-3 hours",
    costLevel: "$$",
    costLevelIDR: "Rp 100k-300k",
    bestTime: "Afternoon / Evening",
    vibe: "Fun & Casual",
    whyGoodDate: [
      "Great opportunity to connect",
      "Comfortable and relaxed setting",
      "Perfect for first meetings",
      "Natural conversation flow"
    ],
    conversationStarters: [
      "What do you like to do in your free time?",
      "What's something you're passionate about?",
      "What kind of dates do you enjoy most?"
    ],
    suggestedExtras: [
      { icon: "💐", text: "Send flowers before the date", service: "flower_delivery" },
      { icon: "💅", text: "Book beautician home service", service: "beautician" }
    ]
  }
};

export const getDateIdeaMetadata = (idea: string): DateIdeaMetadata => {
  return DATE_IDEA_METADATA[idea] || DATE_IDEA_METADATA["_default"];
};
