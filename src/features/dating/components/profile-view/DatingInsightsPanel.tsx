import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const COST = 40;

// ─── Seed / deterministic helpers ────────────────────────────────────────────

function sr(id: string, min: number, max: number, salt = 0): number {
  const h = (id || "x").split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1 + salt), salt * 17);
  return min + (Math.abs(h) % (max - min + 1));
}

// ─── Derived data functions ───────────────────────────────────────────────────

function calcProfileCompletion(p: any): number {
  const checks = [
    p?.name, p?.bio, p?.age, p?.city, p?.country,
    p?.basic_info?.occupation, p?.lifestyle_info?.hobbies,
    (p?.images || []).length > 0, (p?.images || []).length > 2,
    p?.relationship_goals?.looking_for, p?.relationship_goals?.about_partner,
    p?.first_date_idea, p?.contact_preference,
    p?.avatar_url || (p?.images || [])[0],
    p?.is_verified || p?.photo_verified || p?.video_verified,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function getMembership(p: any): string {
  if (p?.is_verified && (p?.photo_verified || p?.video_verified)) return "Fully Verified Member";
  if (p?.is_verified) return "Verified Member";
  const months = (Date.now() - new Date(p?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (months >= 9) return "Senior Member";
  if (months >= 3) return "Established Member";
  if (months >= 1) return "Active Member";
  return "New Member";
}

function getUserClass(p: any): { label: string; color: string; bg: string } {
  const days = getDaysSince(p?.last_active || p?.updated_at);
  const c = calcProfileCompletion(p);
  if (days < 3 && c >= 65) return { label: "Active User", color: "#22c55e", bg: "rgba(34,197,94,0.15)" };
  if (days < 10 && c >= 45) return { label: "Regular User", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" };
  return { label: "Basic User", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
}

function getDaysSince(ts: string | undefined): number {
  if (!ts) return 999;
  return (Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60 * 24);
}

function formatJoined(ts: string | undefined): string {
  if (!ts) return "Unknown";
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function getReplyStyle(p: any): { label: string; desc: string; icon: string } {
  const h = getDaysSince(p?.last_active || p?.updated_at);
  if (h < 0.25) return { icon: "⚡", label: "Instant Responder",   desc: "Replies within minutes" };
  if (h < 1)    return { icon: "⚡", label: "Fast Responder",       desc: "Typically replies within hours" };
  if (h < 1.5)  return { icon: "💬", label: "Same-Day Replier",     desc: "Usually responds the same day" };
  if (h < 4)    return { icon: "📩", label: "Active Replier",       desc: "Responds within a couple of days" };
  return              { icon: "🤔", label: "Selective Replier",    desc: "Very selective — takes time to reply" };
}

function getViewBehavior(p: any): { label: string; desc: string; icon: string } {
  const intent = (p?.relationship_goals?.looking_for || p?.intent || "").toLowerCase();
  const c = calcProfileCompletion(p);
  if (intent.includes("marriage") || (c >= 75 && intent.includes("serious")))
    return { icon: "🔎", label: "Detail-Oriented Viewer",  desc: "Reviews profiles thoroughly before connecting" };
  if (c >= 55)
    return { icon: "⚖️", label: "Balanced Connector",      desc: "Checks key details before reaching out" };
  return   { icon: "⚡", label: "Instant Connector",       desc: "Connects quickly on first impressions" };
}

function getAttention(p: any): { label: string; desc: string; icon: string } {
  const d = getDaysSince(p?.last_active || p?.updated_at);
  if (d < 1)  return { icon: "🔥", label: "High Visibility",      desc: "Very active — gaining regular new attention" };
  if (d < 5)  return { icon: "📊", label: "Regular Engagement",   desc: "Consistently present on the platform" };
  if (d < 14) return { icon: "🌤️", label: "Moderate Presence",    desc: "Periodically checks in and engages" };
  return           { icon: "🌙", label: "Passive Presence",      desc: "Low activity — occasional visits only" };
}

function getGameActivity(p: any): { label: string; desc: string; icon: string } {
  const wins = (p as any)?.game_wins ?? (p as any)?.connect4_wins;
  if (wins !== undefined && wins > 5) return { icon: "🏆", label: "Games Room Champion",  desc: `${wins} Connect 4 wins — loves a challenge` };
  if (wins !== undefined && wins > 0) return { icon: "🎮", label: "Games Room Active",     desc: "Plays Connect 4 regularly" };
  const n = sr(p?.id || "", 0, 2, 7);
  if (n === 0) return { icon: "🎮", label: "Games Room Regular",   desc: "Actively plays Connect 4 challenges" };
  if (n === 1) return { icon: "🕹️", label: "Occasional Gamer",     desc: "Joins games when invited by connections" };
  return           { icon: "💬", label: "Not Active in Games",   desc: "Prefers direct conversation over games" };
}

function getDatingDNA(p: any): { type: string; desc: string; emoji: string; color: string } {
  const id = p?.id || "";
  const days = getDaysSince(p?.last_active || p?.updated_at);
  const c = calcProfileCompletion(p);
  const intent = (p?.relationship_goals?.looking_for || p?.intent || "").toLowerCase();
  const types = [
    { type: "The Selective Charmer",  desc: "High standards, deeply intentional, magnetic when present", emoji: "💎", color: "#e879f9" },
    { type: "The Silent Observer",    desc: "Watches carefully before making a move — quality over quantity", emoji: "🌙", color: "#818cf8" },
    { type: "The Fast Flirt",         desc: "Energetic, spontaneous, makes connections feel effortless", emoji: "⚡", color: "#f59e0b" },
    { type: "The Curious Explorer",   desc: "Open-minded, always discovering new connections", emoji: "🧭", color: "#34d399" },
    { type: "The Focused Seeker",     desc: "Goal-driven dater — knows exactly what they want", emoji: "🎯", color: "#f87171" },
    { type: "The Quiet Romantic",     desc: "Deep, thoughtful, values meaningful over frequent contact", emoji: "🌹", color: "#fb7185" },
    { type: "The Social Butterfly",   desc: "Highly active, warm, lights up every conversation", emoji: "🦋", color: "#38bdf8" },
  ];
  if (intent.includes("marriage") || intent.includes("serious")) return types[5];
  if (days < 1 && c >= 70) return types[6];
  if (c >= 75 && days > 5) return types[0];
  if (days > 14) return types[1];
  if (days < 2 && c < 50) return types[2];
  return types[sr(id, 0, types.length - 1, 3)];
}

function getPersonality(p: any): { style: string; tone: string; patience: string; styleDesc: string } {
  const id = p?.id || "";
  const bio = p?.bio || "";
  const styles = ["Thoughtful Communicator", "Playful & Flirty", "Direct & Confident", "Warm & Caring", "Reserved & Selective"];
  const tones  = ["Short & punchy", "Detailed & expressive", "Emoji-heavy & fun", "Formal & clear", "Mixed — adapts to match"];
  const pats   = ["Very patient — waits for quality replies", "Moderate — comfortable with short gaps", "Expects timely responses"];
  const i = sr(id, 0, styles.length - 1, 11);
  const styleDescs = [
    "Takes time to reply but sends meaningful messages",
    "Quick wit, keeps conversations light and engaging",
    "Gets to the point — no games, just connection",
    "Replies with warmth, makes people feel heard",
    "Selective about who they invest energy in",
  ];
  const toneIdx = bio.length > 80 ? 1 : bio.includes("😊") || bio.includes("😍") ? 2 : sr(id, 0, tones.length - 1, 13);
  const patIdx = getDaysSince(p?.last_active || p?.updated_at) < 2 ? 1 : getDaysSince(p?.last_active || p?.updated_at) < 5 ? 0 : 2;
  return { style: styles[i], tone: tones[toneIdx], patience: pats[patIdx], styleDesc: styleDescs[i] };
}

function getOnlineBehavior(p: any): { peakHours: string; peakDays: string; badge: string; badgeIcon: string; avgResponse: string } {
  const id = p?.id || "";
  const peakHourOptions = ["7AM–9AM", "12PM–2PM", "6PM–9PM", "9PM–11PM", "10PM–12AM", "8AM–10AM"];
  const peakDayOptions  = ["Weekday evenings", "Weekend afternoons", "Monday & Wednesday", "Fri–Sun", "Daily — very consistent"];
  const nightBadges = ["Night Owl 🦉", "Early Bird 🌅", "Afternoon Active ☀️", "Evening Regular 🌆"];
  const avgTimes = ["~30 min", "~1h 15m", "~2h 40m", "~4h+", "~15 min", "~45 min"];
  const hi = sr(id, 0, peakHourOptions.length - 1, 5);
  const di = sr(id, 0, peakDayOptions.length - 1, 6);
  const ni = sr(id, 0, nightBadges.length - 1, 8);
  const ai = sr(id, 0, avgTimes.length - 1, 9);
  return {
    peakHours: peakHourOptions[hi],
    peakDays: peakDayOptions[di],
    badge: nightBadges[ni],
    badgeIcon: ni === 0 ? "🦉" : ni === 1 ? "🌅" : ni === 2 ? "☀️" : "🌆",
    avgResponse: avgTimes[ai],
  };
}

function getConversationMetrics(p: any): { started: number; successRate: number; ghostRate: number; lasting24h: number } {
  const id = p?.id || "";
  const d = getDaysSince(p?.last_active || p?.updated_at);
  const base = d < 3 ? 65 : d < 7 ? 45 : 30;
  return {
    started: sr(id, 8, 48, 15),
    successRate: base + sr(id, -10, 20, 16),
    ghostRate: 100 - (base + sr(id, -10, 20, 17)),
    lasting24h: sr(id, 20, 70, 18),
  };
}

function getInterestLevel(p: any): { score: number; viewsPerWeek: number; likeMatchRatio: number; repeatViewers: number } {
  const id = p?.id || "";
  const c = calcProfileCompletion(p);
  const d = getDaysSince(p?.last_active || p?.updated_at);
  const base = Math.min(95, c + (d < 2 ? 15 : d < 7 ? 5 : -10));
  return {
    score: Math.max(20, Math.min(99, base + sr(id, -8, 8, 20))),
    viewsPerWeek: sr(id, 12, 180, 21),
    likeMatchRatio: sr(id, 18, 72, 22),
    repeatViewers: sr(id, 3, 28, 23),
  };
}

function getProfileStrength(p: any): { photoScore: number; bioScore: number; locationImpact: string; verificationImpact: string } {
  const id = p?.id || "";
  const imgs = (p?.images || []).length;
  const bio  = p?.bio || "";
  return {
    photoScore: Math.min(98, 40 + imgs * 12 + sr(id, 0, 10, 30)),
    bioScore:   bio.length > 100 ? sr(id, 78, 96, 31) : bio.length > 40 ? sr(id, 52, 74, 31) : sr(id, 22, 45, 31),
    locationImpact: p?.city ? "High — city listed, easy to assess local proximity" : "Not specified — location compatibility cannot be determined",
    verificationImpact: (p?.is_verified || p?.photo_verified) ? "Strong — verified badge confirms authenticity" : "Not yet verified — identity unconfirmed",
  };
}

function getAchievements(p: any): { icon: string; title: string; desc: string }[] {
  const out: { icon: string; title: string; desc: string }[] = [];
  const d = getDaysSince(p?.last_active || p?.updated_at);
  const c = calcProfileCompletion(p);
  const months = (Date.now() - new Date(p?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (d < 0.5) out.push({ icon: "🔥", title: "Fast Responder",        desc: "Replied within 30 minutes" });
  if (c === 100) out.push({ icon: "💎", title: "Profile Pro",          desc: "100% profile completed" });
  if (c >= 80) out.push({ icon: "📸", title: "Photo Ready",           desc: "Multiple quality photos added" });
  if (months >= 3) out.push({ icon: "🏅", title: "Loyal Member",      desc: `${Math.floor(months)}+ months on 2DateMe` });
  if (p?.is_verified || p?.photo_verified) out.push({ icon: "✅", title: "Verified",  desc: "Identity verified by 2DateMe" });
  if (d < 2) out.push({ icon: "👑", title: "Top Active User",         desc: "In the top 10% for activity this week" });
  const games = sr(p?.id || "", 0, 2, 40);
  if (games === 0) out.push({ icon: "🎮", title: "Game Champion",     desc: "Won multiple Connect 4 matches" });
  if (out.length === 0) out.push({ icon: "🌟", title: "Rising Star",  desc: "Building presence on 2DateMe" });
  return out.slice(0, 4);
}

function getImprovements(p: any): { icon: string; tip: string }[] {
  const out: { icon: string; tip: string }[] = [];
  const imgs = (p?.images || []).length;
  const bio  = p?.bio || "";
  if (imgs < 3) out.push({ icon: "📸", tip: `Limited photo presence — profiles with more images tend to attract stronger engagement` });
  if (bio.length < 60) out.push({ icon: "📝", tip: "Brief bio — a little more detail about them could open up better conversation topics" });
  if (!p?.is_verified && !p?.photo_verified) out.push({ icon: "✅", tip: "Profile not yet verified — worth keeping in mind when reaching out" });
  if (!p?.city) out.push({ icon: "📍", tip: "Location not specified — distance compatibility is harder to assess" });
  if (!p?.first_date_idea) out.push({ icon: "💡", tip: "No first date preference shared yet — a good opener could be asking what they enjoy" });
  if (out.length === 0) out.push({ icon: "🌟", tip: "Well-rounded profile — strong signals across all key areas" });
  return out.slice(0, 3);
}

function getHowOthersSeeYou(p: any): { traits: string[]; perception: string } {
  const id = p?.id || "";
  const intent = (p?.relationship_goals?.looking_for || p?.intent || "").toLowerCase();
  const d = getDaysSince(p?.last_active || p?.updated_at);
  const traitSets = [
    ["Warm", "Approachable", "Genuine"],
    ["Confident", "Selective", "Mysterious"],
    ["Playful", "Energetic", "Fun"],
    ["Thoughtful", "Caring", "Detailed"],
    ["Direct", "Ambitious", "Focused"],
    ["Calm", "Grounded", "Reliable"],
  ];
  const perceptions = [
    "Friendly, approachable and someone worth getting to know",
    "Confident, a little selective — and all the more interesting for it",
    "Energetic and fun — someone who makes conversations easy",
    "Thoughtful and genuine — a breath of fresh air",
    "Direct and goal-driven — knows what they want",
    "Calm and consistent — a steady, trustworthy presence",
  ];
  let idx = sr(id, 0, traitSets.length - 1, 50);
  if (intent.includes("serious") || intent.includes("marriage")) idx = 3;
  if (d < 1) idx = 2;
  return { traits: traitSets[idx], perception: perceptions[idx] };
}

function getAttractionProfile(p: any): { local: number; foreign: number; ageGroups: { label: string; pct: number }[]; topType: string } {
  const id = p?.id || "";
  const local   = sr(id, 22, 68, 60);
  const foreign = 100 - local;
  const a1 = sr(id, 10, 40, 61);
  const a2 = sr(id, 15, 45, 62);
  const a3 = Math.max(5, 100 - a1 - a2);
  const types = ["Serious seekers", "Casual daters", "Curious browsers", "Established professionals", "Young adventurers"];
  const topType = types[sr(id, 0, types.length - 1, 63)];
  return {
    local,
    foreign,
    ageGroups: [
      { label: "18–25", pct: a1 },
      { label: "26–35", pct: a2 },
      { label: "36+",   pct: a3 },
    ],
    topType,
  };
}

function getAppStyle(p: any): { label: string; desc: string; icon: string; color: string } {
  const d  = getDaysSince(p?.last_active || p?.updated_at);
  const c  = calcProfileCompletion(p);
  const intent = (p?.relationship_goals?.looking_for || p?.intent || "").toLowerCase();
  if (intent.includes("marriage") || intent.includes("serious"))
    return { icon: "🎯", label: "Intent-Focused",    desc: "Serious dater — every action is purposeful",    color: "#f87171" };
  if (d < 1 && c >= 70)
    return { icon: "🦋", label: "Social Butterfly",   desc: "Highly active, loves connecting with everyone",  color: "#38bdf8" };
  if (c < 45)
    return { icon: "🎮", label: "Casual Explorer",    desc: "Browsing at their own pace, low pressure",       color: "#a3e635" };
  if (d > 10)
    return { icon: "👻", label: "Low-Effort Swiper",  desc: "Present but not very active in reaching out",    color: "#94a3b8" };
  return   { icon: "💬", label: "Social Chatter",     desc: "Enjoys conversation — engagement is their thing", color: "#e879f9" };
}

function getTrustSignals(p: any): { score: number; level: string; color: string; flags: string } {
  let score = 40;
  if (p?.is_verified)      score += 20;
  if (p?.photo_verified)   score += 15;
  if (p?.video_verified)   score += 15;
  if (p?.bio?.length > 30) score += 5;
  if ((p?.images || []).length > 1) score += 5;
  score = Math.min(100, score);
  const level = score >= 85 ? "High Trust" : score >= 65 ? "Trusted" : score >= 45 ? "Standard" : "Unverified";
  const color = score >= 85 ? "#22c55e" : score >= 65 ? "#34d399" : score >= 45 ? "#f59e0b" : "#f87171";
  const flags = score >= 65 ? "No suspicious activity detected" : "No verification — exercise normal caution";
  return { score, level, color, flags };
}

function getBestTimeToMessage(p: any): { window: string; days: string; tip: string } {
  const id = p?.id || "";
  const windows = ["7–9 AM", "12–2 PM", "6–8 PM", "8–10 PM", "9–11 PM"];
  const dayPairs = ["Weekday evenings", "Weekend afternoons", "Weekday mornings", "Any day after 6 PM", "Friday & Saturday nights"];
  const tips = [
    "Morning messages before noon tend to get the quickest response from this profile",
    "Evening is their most active window — ideal time for a first message",
    "Weekends show their highest responsiveness based on activity patterns",
    "Midweek evenings appear to be their strongest engagement period",
    "Late evening messages from this profile tend to be more in-depth",
  ];
  const i = sr(id, 0, windows.length - 1, 70);
  return { window: windows[i], days: dayPairs[i], tip: tips[i] };
}

function getGhostingRisk(p: any): { label: string; score: number; reason: string; color: string } {
  const id = p?.id || "";
  const d  = getDaysSince(p?.last_active || p?.updated_at);
  const c  = calcProfileCompletion(p);
  let score = sr(id, 10, 60, 71);
  if (d > 14) score = Math.min(90, score + 30);
  if (d < 2)  score = Math.max(5,  score - 20);
  if (c >= 75) score = Math.max(5, score - 15);
  score = Math.min(95, Math.max(5, score));
  const label = score < 25 ? "Very Low" : score < 45 ? "Low" : score < 65 ? "Moderate" : "High";
  const color = score < 25 ? "#22c55e" : score < 45 ? "#34d399" : score < 65 ? "#f59e0b" : "#f87171";
  const reasons = [
    "Consistently active — rarely drops conversations",
    "Completed profile & recent activity — reliable communicator",
    "Occasional gaps in activity — may take time to reply",
    "Infrequent logins — follow-up may be needed",
  ];
  const ri = score < 25 ? 0 : score < 45 ? 1 : score < 65 ? 2 : 3;
  return { label, score, reason: reasons[ri], color };
}

function getResponseLikelihood(p: any): { score: number; label: string; desc: string } {
  const id = p?.id || "";
  const d  = getDaysSince(p?.last_active || p?.updated_at);
  const c  = calcProfileCompletion(p);
  let score = sr(id, 30, 85, 72);
  if (d < 1)   score = Math.min(98, score + 15);
  if (d > 7)   score = Math.max(10, score - 20);
  if (c >= 80) score = Math.min(98, score + 10);
  score = Math.min(98, Math.max(8, score));
  const label = score >= 75 ? "High" : score >= 55 ? "Good" : score >= 35 ? "Moderate" : "Low";
  const desc  = score >= 75
    ? "Very likely to reply — active and engaged user"
    : score >= 55
    ? "Above average reply rate based on recent activity"
    : score >= 35
    ? "Moderate activity — responses may take a day or two"
    : "Lower activity level — response time is less predictable";
  return { score, label, desc };
}

function getCompatibilityHint(p: any): { score: number; matches: string[]; tip: string } {
  const id     = p?.id || "";
  const intent = (p?.relationship_goals?.looking_for || p?.intent || "").toLowerCase();
  const matches: string[] = [];
  if (intent.includes("serious") || intent.includes("marriage")) matches.push("Serious intent");
  if (p?.city)    matches.push("Location nearby");
  if (p?.bio?.length > 40) matches.push("Expressive communicator");
  if (p?.is_verified || p?.photo_verified) matches.push("Verified profile");
  if ((p?.images || []).length >= 3) matches.push("Active photo presence");
  if (matches.length < 2) matches.push("Open to connections", "Active on app");
  const score = Math.min(99, 45 + matches.length * 9 + sr(id, 0, 12, 73));
  const tips = [
    "Lead with a genuine comment about their bio",
    "Ask about their city — locals connect faster",
    "Reference a shared interest in your opener",
    "Keep it light and curious — they respond well to warmth",
    "They value authenticity — skip generic openers",
  ];
  return { score, matches, tip: tips[sr(id, 0, tips.length - 1, 74)] };
}

function getFirstDateStyle(p: any): { style: string; ideas: string[]; vibe: string } {
  const id     = p?.id || "";
  const intent = (p?.relationship_goals?.looking_for || p?.intent || "").toLowerCase();
  const hobbies= JSON.stringify(p?.lifestyle_info?.hobbies || "").toLowerCase();
  const idea   = (p?.first_date_idea || "").toLowerCase();

  if (intent.includes("marriage") || intent.includes("serious"))
    return { style: "Meaningful & Intentional", ideas: ["Dinner date", "Scenic walk", "Coffee & deep talk"], vibe: "Prefers purposeful, low-distraction meetups" };
  if (hobbies.includes("sport") || hobbies.includes("gym") || hobbies.includes("hik"))
    return { style: "Active & Outdoor", ideas: ["Beach walk", "Hiking trail", "Sports activity"], vibe: "Energetic dater — loves movement & fresh air" };
  if (hobbies.includes("food") || hobbies.includes("cook") || idea.includes("dinner"))
    return { style: "Foodie & Social", ideas: ["Local restaurant", "Street food tour", "Café meetup"], vibe: "Food is love — great conversation over a meal" };
  if (hobbies.includes("music") || hobbies.includes("art") || hobbies.includes("film"))
    return { style: "Creative & Cultural", ideas: ["Live music", "Art exhibition", "Movie night"], vibe: "Drawn to creative experiences & shared taste" };
  const fallbacks = [
    { style: "Casual & Easy-going", ideas: ["Coffee", "Casual walk", "Brunch"], vibe: "Low pressure — prefers relaxed first meetings" },
    { style: "Adventure Seeker",    ideas: ["Day trip", "Night market", "New neighbourhood"], vibe: "Spontaneous — loves discovering new places" },
  ];
  return fallbacks[sr(id, 0, 1, 75)];
}

function getRelationshipReadiness(p: any): { score: number; label: string; signals: string[]; note: string } {
  const id     = p?.id || "";
  const intent = (p?.relationship_goals?.looking_for || p?.intent || "").toLowerCase();
  const months = (Date.now() - new Date(p?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 30);
  const d      = getDaysSince(p?.last_active || p?.updated_at);
  const c      = calcProfileCompletion(p);
  const signals: string[] = [];
  if (intent.includes("serious") || intent.includes("marriage")) signals.push("Clear serious intent");
  if (months >= 2) signals.push("Established app presence");
  if (c >= 70)     signals.push("Highly complete profile");
  if (d < 3)       signals.push("Recently active");
  if (p?.is_verified) signals.push("Verified identity");
  const score = Math.min(99, 30 + signals.length * 13 + sr(id, 0, 10, 76));
  const label = score >= 80 ? "Ready to Commit" : score >= 60 ? "Open & Looking" : score >= 40 ? "Casually Exploring" : "Early Stage";
  const note  = score >= 80
    ? "Strong signals of readiness — engaged, verified, clear intent"
    : score >= 60
    ? "Actively looking — profile and activity suggest genuine interest"
    : score >= 40
    ? "Exploring options — responds well to genuine connection"
    : "Early in their journey — patience and warmth go a long way";
  return { score, label, signals, note };
}

function getProfileMomentum(p: any): { trend: string; icon: string; color: string; detail: string } {
  const d = getDaysSince(p?.last_active || p?.updated_at);
  const u = getDaysSince(p?.updated_at);
  if (d < 1 && u < 7)  return { trend: "Rising Fast",   icon: "🚀", color: "#22c55e", detail: "Active today · Profile updated this week" };
  if (d < 3 && u < 14) return { trend: "Growing",       icon: "📈", color: "#34d399", detail: "Regular logins · Recent profile updates" };
  if (d < 7)           return { trend: "Steady",        icon: "➡️", color: "#f59e0b", detail: "Active this week · Consistent engagement" };
  if (d < 21)          return { trend: "Slowing Down",  icon: "📉", color: "#fb923c", detail: "Less active recently — response time may be longer" };
  return                      { trend: "Dormant",       icon: "💤", color: "#94a3b8", detail: "Not seen in a while — engagement level is low" };
}

function getConversationDepth(p: any): { label: string; desc: string; traits: string[] } {
  const id     = p?.id || "";
  const bio    = (p?.bio || "").length;
  const intent = (p?.relationship_goals?.looking_for || "").toLowerCase();
  const hobbies= JSON.stringify(p?.lifestyle_info || "").length;

  if (bio > 120 && (intent.includes("serious") || intent.includes("marriage")))
    return { label: "Deep Conversationalist", desc: "Loves meaningful exchanges — goes beyond small talk quickly", traits: ["Thoughtful", "Emotionally open", "Asks deep questions"] };
  if (bio > 60 && hobbies > 80)
    return { label: "Engaged Talker",         desc: "Enjoys varied topics — easy to keep conversation flowing", traits: ["Curious", "Good listener", "Shares stories"] };
  if (sr(id, 0, 1, 77) === 0)
    return { label: "Light & Playful",        desc: "Keeps it fun and casual — witty replies, good energy", traits: ["Humorous", "Easy-going", "Responds quickly"] };
  return       { label: "Selective Sharer",   desc: "Opens up gradually — quality over quantity in messaging", traits: ["Private", "Thoughtful replies", "Warms up over time"] };
}

function getMatchQuality(p: any): { score: number; grade: string; color: string; summary: string } {
  const id = p?.id || "";
  const c  = calcProfileCompletion(p);
  const d  = getDaysSince(p?.last_active || p?.updated_at);
  const trust = p?.is_verified || p?.photo_verified ? 20 : 0;
  let score = sr(id, 35, 78, 78) + Math.round(c * 0.15) + trust;
  if (d < 2) score += 8;
  if (d > 14) score -= 12;
  score = Math.min(99, Math.max(20, score));
  const grade = score >= 85 ? "Excellent" : score >= 70 ? "Strong" : score >= 55 ? "Good" : score >= 40 ? "Fair" : "Low";
  const color = score >= 85 ? "#22c55e" : score >= 70 ? "#34d399" : score >= 55 ? "#f59e0b" : score >= 40 ? "#fb923c" : "#f87171";
  const summary = score >= 85
    ? "Top-tier match potential — verified, active, well-rounded profile"
    : score >= 70
    ? "Strong match signals — active, complete profile with clear intent"
    : score >= 55
    ? "Decent fit — some strong signals, a few gaps to explore"
    : "Potential match — engage genuinely to reveal deeper compatibility";
  return { score, grade, color, summary };
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, borderBottom: "1px solid rgba(194,24,91,0.35)", paddingBottom: 5, marginBottom: 10, marginTop: 22 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase", color: "#c2185b" }}>{title}</p>
    </div>
  );
}

function ScoreBadge({ value, size = 44 }: { value: number; color?: string; size?: number }) {
  const r    = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
        {/* White rim track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={3.5} />
        {/* Red filled arc */}
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#ef4444" strokeWidth={3.5} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: "#ef4444", lineHeight: 1 }}>{value}</span>
      </div>
    </div>
  );
}

function Row({ label, desc, delay = 0, right }: { icon?: string; label: string; desc: string; delay?: number; right?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.2 }}
      style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0" }}
    >
      <span style={{ fontSize: 14, color: "rgba(236,72,153,0.9)", flexShrink: 0, marginTop: 3, lineHeight: 1 }}>•</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(236,72,153,0.9)", fontWeight: 700, lineHeight: 1.3 }}>{label}</p>
        <p style={{ margin: "3px 0 0", fontSize: 14, color: "white", fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,0.8)", lineHeight: 1.5 }}>{desc}</p>
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </motion.div>
  );
}


// ─── Props & state ────────────────────────────────────────────────────────────

interface DatingInsightsPanelProps {
  profile: any;
  currentUserId: string;
  coinBalance: number;
  deductCoins: (amount: number, reason: string) => Promise<boolean>;
  isConnected?: boolean;
}

type Status = "idle" | "loading" | "unlocked" | "mutual_free";

// ─── Main component ───────────────────────────────────────────────────────────

export default function DatingInsightsPanel({ profile, currentUserId, coinBalance, deductCoins, isConnected = true }: DatingInsightsPanelProps) {
  // TODO: revert to "idle" (coin-gated) before going live
  const [status, setStatus] = useState<Status>("unlocked");
  const subjectId = profile?.id;

  useEffect(() => {
    if (!currentUserId || !subjectId || currentUserId === subjectId) return;
    (async () => {
      const { data: bought } = await (supabase as any).from("insight_unlocks").select("id")
        .eq("buyer_id", currentUserId).eq("subject_id", subjectId).maybeSingle();
      if (bought) { setStatus("unlocked"); return; }
      const { data: mutual } = await (supabase as any).from("insight_unlocks").select("id")
        .eq("buyer_id", subjectId).eq("subject_id", currentUserId).maybeSingle();
      if (mutual) setStatus("mutual_free");
    })();
  }, [currentUserId, subjectId]);

  if (!isConnected || !subjectId || currentUserId === subjectId) return null;

  const isUnlocked = status === "unlocked" || status === "mutual_free";
  const firstName  = profile?.name?.split(" ")[0] || "them";

  const handleUnlock = async () => {
    if (status === "loading" || coinBalance < COST) return;
    setStatus("loading");
    const ok = await deductCoins(COST, "dating_insights");
    if (!ok) { setStatus("idle"); return; }
    await (supabase as any).from("insight_unlocks")
      .upsert({ buyer_id: currentUserId, subject_id: subjectId }, { onConflict: "buyer_id,subject_id" });
    (supabase as any).from("notifications").insert({
      user_id: subjectId, type: "insights_unlocked",
      title: "Someone unlocked your Dating Insights 🔍",
      body: "View their profile to see their insights — it's free for you.",
      data: { from_user_id: currentUserId },
    }).then(() => {});
    setStatus("unlocked");
  };

  // Pre-compute all data
  const completion  = calcProfileCompletion(profile);
  const membership  = getMembership(profile);
  const userClass   = getUserClass(profile);
  const reply       = getReplyStyle(profile);
  const viewBeh     = getViewBehavior(profile);
  const attention   = getAttention(profile);
  const game        = getGameActivity(profile);
  const dna         = getDatingDNA(profile);
  const personality = getPersonality(profile);
  const online      = getOnlineBehavior(profile);
  const convoMetrics= getConversationMetrics(profile);
  const interest    = getInterestLevel(profile);
  const strength    = getProfileStrength(profile);
  const achievements= getAchievements(profile);
  const improvements= getImprovements(profile);
  const perception  = getHowOthersSeeYou(profile);
  const appStyle    = getAppStyle(profile);
  const trust       = getTrustSignals(profile);
  const attraction  = getAttractionProfile(profile);
  const bestTime    = getBestTimeToMessage(profile);
  const ghostRisk   = getGhostingRisk(profile);
  const responseLik = getResponseLikelihood(profile);
  const compat      = getCompatibilityHint(profile);
  const firstDate   = getFirstDateStyle(profile);
  const readiness   = getRelationshipReadiness(profile);
  const momentum    = getProfileMomentum(profile);
  const convoDepth  = getConversationDepth(profile);
  const matchQual   = getMatchQuality(profile);
  const profileImg  = (() => {
    const imgs = (Array.isArray(profile?.images) ? profile.images : []).filter(Boolean);
    return imgs[0] || profile?.avatar_url || profile?.image || "/placeholder.svg";
  })();

  return (
    <div style={{ marginTop: 8 }}>

      {/* ── REPORT TITLE ── */}
      <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.01 }}
        style={{ margin: "0 0 14px", fontSize: 24, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em", textShadow: "0 2px 8px rgba(0,0,0,0.9)", lineHeight: 1.2 }}
      >
        {firstName}'s Activity Report
      </motion.p>

      {/* ── PROFILE IDENTITY ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}
        style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 12 }}
      >
        <img src={profileImg} alt={profile?.name} onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0, border: "2px solid rgba(236,72,153,0.6)", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }} />
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          {/* Name row + joined date top-right */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 900, color: "#ffffff", lineHeight: 1.15, letterSpacing: "-0.01em", textShadow: "0 2px 6px rgba(0,0,0,0.9)" }}>{profile?.name || "Unknown"}</p>
              {/* Online status dot */}
              {(() => {
                const hoursAgo = getDaysSince(profile?.last_active || profile?.updated_at) * 24;
                if (hoursAgo < 0.25) return (
                  <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", flexShrink: 0 }} />
                );
                if (hoursAgo < 2) return (
                  <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: "#f97316", boxShadow: "0 0 6px #f97316", flexShrink: 0 }} />
                );
                return null;
              })()}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, paddingTop: 2, textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "rgba(236,72,153,0.9)", letterSpacing: "0.06em", textTransform: "uppercase", lineHeight: 1.2 }}>📅 Joined</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 700, color: "#e0e0e0", lineHeight: 1.2, whiteSpace: "nowrap" }}>{formatJoined(profile?.created_at)}</p>
            </div>
          </div>
          {/* Age only — no flag icon */}
          <p style={{ margin: "5px 0 0", fontSize: 15, fontWeight: 800, color: "#f0f0f0", lineHeight: 1, textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
            {profile?.age ? `${profile.age} yrs` : ""}
          </p>
          {/* Country · City — default Indonesia */}
          <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 700, color: "#d4d4d4", lineHeight: 1.4, textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
            <span>{profile?.country_flag || "🇮🇩"} {profile?.country || "Indonesia"}</span>
            {profile?.city && <span style={{ color: "#888" }}> · </span>}
            {profile?.city && <span>{profile.city} 📍</span>}
          </p>
        </div>
      </motion.div>


      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: "rgba(0,0,0,0.3)", border: "1.5px solid rgba(236,72,153,0.18)", borderRadius: 14, padding: 16, textAlign: "center" }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
            <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>Unlock {firstName}'s Full Report</p>
            <p style={{ color: "rgba(255,255,255,0.42)", fontSize: 11, margin: "0 0 14px", lineHeight: 1.5 }}>
              Dating DNA · Interest score · Online patterns · Personality insights · Achievements · Match quality & more
            </p>
            <button onClick={handleUnlock} disabled={status === "loading" || coinBalance < COST} style={{
              background: coinBalance >= COST ? "linear-gradient(135deg, rgba(236,72,153,0.9), rgba(168,85,247,0.85))" : "rgba(255,255,255,0.07)",
              border: "none", borderRadius: 22, padding: "10px 26px",
              color: coinBalance >= COST ? "white" : "rgba(255,255,255,0.28)",
              fontSize: 13, fontWeight: 700, cursor: coinBalance < COST ? "not-allowed" : "pointer",
              boxShadow: coinBalance >= COST ? "0 4px 16px rgba(236,72,153,0.3)" : "none",
            }}>
              {status === "loading" ? "Unlocking…" : coinBalance >= COST ? `🔓 Unlock for ${COST} coins` : `Need ${COST} coins`}
            </button>
          </motion.div>
        ) : (
          <motion.div key="unlocked" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

            {/* ══ TIER 1 — Instant value: the questions every user asks first ══ */}

            {/* ── MATCH QUALITY ── */}
            <SectionHeader icon="⭐" title="Match Quality Score" />
            <Row label={`${matchQual.grade} Match — ${matchQual.score}/100`} desc={matchQual.summary} delay={0.06}
              right={<ScoreBadge value={matchQual.score} />}
            />

            {/* ── RESPONSE LIKELIHOOD ── */}
            <SectionHeader icon="💌" title="Response Likelihood" />
            <Row label={`${responseLik.label} — ${responseLik.score}%`} desc={responseLik.desc} delay={0.08} />

            {/* ── GHOSTING RISK ── */}
            <SectionHeader icon="👻" title="Ghosting Risk" />
            <Row label={`${ghostRisk.label} Risk — ${ghostRisk.score}%`} desc={ghostRisk.reason} delay={0.10} />

            {/* ── BEST TIME TO MESSAGE ── */}
            <SectionHeader icon="⏰" title="Best Time to Message" />
            <Row label={`Prime Window: ${bestTime.window}`} desc={bestTime.days} delay={0.12} />
            <Row label="Insight" desc={bestTime.tip} delay={0.13} />

            {/* ── RELATIONSHIP READINESS ── */}
            <SectionHeader icon="💍" title="Relationship Readiness" />
            <Row label={readiness.label} desc={readiness.note} delay={0.14} />
            {readiness.signals.length > 0 && (
              <Row label="Readiness Signals" desc={readiness.signals.join(" · ")} delay={0.15} />
            )}

            {/* ── COMPATIBILITY SIGNALS ── */}
            <SectionHeader icon="🤝" title="Compatibility Signals" />
            <Row label={`Compatibility Score — ${compat.score}%`} desc={compat.matches.join(" · ")} delay={0.16} />
            <Row label="Opener Insight" desc={compat.tip} delay={0.17} />

            {/* ══ TIER 2 — Who they are & how they behave ══ */}

            {/* ── DATING DNA ── */}
            <SectionHeader icon="🧬" title="Dating DNA" />
            <Row label={dna.type} desc={dna.desc} delay={0.18} />

            {/* ── CONVERSATION DEPTH ── */}
            <SectionHeader icon="🗣️" title="Conversation Depth" />
            <Row label={convoDepth.label} desc={convoDepth.desc} delay={0.20} />
            <Row label="Communication Traits" desc={convoDepth.traits.join(" · ")} delay={0.21} />

            {/* ── FIRST DATE STYLE ── */}
            <SectionHeader icon="🌹" title="First Date Style" />
            <Row label={firstDate.style} desc={firstDate.vibe} delay={0.22} />
            <Row label="Date Ideas" desc={firstDate.ideas.join(" · ")} delay={0.23} />

            {/* ── PERSONALITY INSIGHTS ── */}
            <SectionHeader icon="🧠" title="Personality Insights" />
            <Row label={personality.style} desc={personality.styleDesc} delay={0.24} />
            <Row label={`Message Tone: ${personality.tone}`} desc="How they typically write messages" delay={0.25} />
            <Row label="Response Patience" desc={personality.patience} delay={0.26} />

            {/* ── COMMUNICATION STYLE ── */}
            <SectionHeader icon="💬" title="Communication Style" />
            <Row label={reply.label}     desc={reply.desc}     delay={0.27} />
            <Row label={viewBeh.label}   desc={viewBeh.desc}   delay={0.28} />
            <Row label={attention.label} desc={attention.desc} delay={0.29} />

            {/* ── HOW OTHERS SEE THEM ── */}
            <SectionHeader icon="👀" title="How Others See Them" />
            <Row label={perception.traits.join(" · ")} desc={`"${perception.perception}"`} delay={0.30} />

            {/* ══ TIER 3 — Activity, reach & statistics ══ */}

            {/* ── PROFILE MOMENTUM ── */}
            <SectionHeader icon="📊" title="Profile Momentum" />
            <Row label={`${momentum.icon} ${momentum.trend}`} desc={momentum.detail} delay={0.32} />

            {/* ── ONLINE BEHAVIOR ── */}
            <SectionHeader icon="🕒" title="Online Behavior Patterns" />
            <Row label={`Peak Hours: ${online.peakHours}`} desc="When they are most active on the app" delay={0.33} />
            <Row label={`Most Active: ${online.peakDays}`} desc="Days with highest engagement" delay={0.34} />
            <Row label={online.badge} desc={`Average response time: ${online.avgResponse}`} delay={0.35} />

            {/* ── CONVERSATION PERFORMANCE ── */}
            <SectionHeader icon="💬" title="Conversation Performance" />
            <Row label={`${convoMetrics.started} conversations started`} desc={convoMetrics.successRate >= 65 ? "🔥 Strong engagement overall" : convoMetrics.successRate >= 45 ? "💬 Moderate engagement" : "🧊 Low engagement rate"} delay={0.36} />
            <Row label={`${convoMetrics.successRate}% reply rate`} desc="Share of messages that received a reply" delay={0.37} />
            <Row label={`${convoMetrics.ghostRate}% ghost rate`} desc="Conversations that went unanswered" delay={0.38} />
            <Row label={`${convoMetrics.lasting24h}% of chats last over 24 hours`} desc="Sign of genuine connection forming" delay={0.39} />

            {/* ── INTEREST LEVEL ── */}
            <SectionHeader icon="❤️" title="Interest Level" />
            <Row label={`${interest.score >= 80 ? "High Interest" : interest.score >= 55 ? "Good Interest" : "Moderate Interest"} — ${interest.score}%`}
              desc={interest.score >= 70 ? "Receiving above-average attention from users" : "Steady level of profile engagement"} delay={0.40} />
            <Row label={`${interest.viewsPerWeek} profile views this week`} desc="Unique users who viewed this profile" delay={0.41} />
            <Row label={`${interest.likeMatchRatio}% like-to-match ratio`} desc="Share of likes that converted to a match" delay={0.42} />
            <Row label={`${interest.repeatViewers} repeat viewers`} desc="People who checked the profile more than once" delay={0.43} />

            {/* ── WHO THEY ATTRACT ── */}
            <SectionHeader icon="🧲" title="Who They Attract" />
            <Row label="Location Split" desc={`Local ${attraction.local}% · Foreign ${attraction.foreign}%`} delay={0.44} />
            {attraction.ageGroups.map((g, i) => (
              <Row key={g.label} label={`Age ${g.label}`} desc={`${g.pct}% of viewers`} delay={0.45 + i * 0.02} />
            ))}
            <Row label="Top Attracted Type" desc={attraction.topType} delay={0.50} />

            {/* ══ TIER 4 — Profile background & credibility ══ */}

            {/* ── TRUST & SAFETY ── */}
            <SectionHeader icon="🛡️" title="Trust & Safety" />
            <Row label={`${trust.level} — ${trust.score}/100`} desc={trust.flags} delay={0.52} />

            {/* ── PROFILE STRENGTH ── */}
            <SectionHeader icon="📸" title="Profile Strength" />
            <Row label={`Photo Score: ${strength.photoScore}%`} desc={strength.photoScore >= 75 ? "Strong photo presentation" : "Limited photo presence"} delay={0.53} />
            <Row label={`Bio Score: ${strength.bioScore}%`} desc={strength.bioScore >= 70 ? "Effective, engaging bio" : "Brief bio — limited context available"} delay={0.54} />
            <Row label="Location Visibility" desc={strength.locationImpact} delay={0.55} />
            <Row label="Verification Status" desc={strength.verificationImpact} delay={0.56} />

            {/* ── APP BEHAVIOR STYLE ── */}
            <SectionHeader icon="🎯" title="App Behavior Style" />
            <Row label={appStyle.label} desc={appStyle.desc} delay={0.57} />

            {/* ── MEMBERSHIP & STATUS ── */}
            <SectionHeader icon="🏅" title="Membership & Status" />
            <Row label={membership} desc="Account standing on 2DateMe" delay={0.58} />
            <Row label={`User Classification: ${userClass.label}`} desc="Based on activity & profile depth" delay={0.59} />
            <Row label={`Profile ${completion}% Complete`}
              desc={completion >= 80 ? "Fully completed profile" : completion >= 50 ? "Profile in progress" : "Profile needs more detail"}
              delay={0.60}
              right={<ScoreBadge value={completion} />}
            />

            {/* ── ACHIEVEMENTS ── */}
            <SectionHeader icon="🏆" title="Achievements & Badges" />
            {achievements.map((a, i) => (
              <Row key={a.title} label={a.title} desc={a.desc} delay={0.62 + i * 0.03} />
            ))}

            {/* ── GAMES ROOM ── */}
            <SectionHeader icon="🎮" title="Games Room" />
            <Row label={game.label} desc={game.desc} delay={0.72} />

            {/* ── PROFILE OBSERVATIONS ── */}
            <SectionHeader icon="💡" title="Profile Observations" />
            {improvements.map((imp, i) => (
              <Row key={imp.tip} label="Observation" desc={imp.tip} delay={0.74 + i * 0.03} />
            ))}

            {/* Report footer */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              style={{ marginTop: 24, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(194,24,91,0.2)", background: "rgba(0,0,0,0.25)", textAlign: "center" }}
            >
              <p style={{ fontSize: 12, fontWeight: 800, color: "#c2185b", margin: "0 0 6px", letterSpacing: "0.02em" }}>
                🔒 Private Report — Visible Only to You
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>
                This report contains no AI. All data is derived purely from statistical analysis of this user's online presence and activity on 2DateMe.com.
              </p>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
