import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Shield, Users, DollarSign, Ban, RefreshCw, Search,
  TrendingUp, Heart, Star, Zap, Eye, Trash2, CheckCircle,
  Download, ChevronUp, ChevronDown, X, MessageSquare, UserCheck,
  Activity, Calendar, Globe, BarChart2, BadgeCheck, AlertTriangle,
  AlertCircle, CheckCircle2, Bell, Wifi, WifiOff, CreditCard, Image,
  Edit2, Save, MapPin, Plus, Camera, MoveHorizontal, MoveVertical, ZoomIn, ClipboardList,
  Copy, Settings, Terminal, ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BasicInfoEditor } from "@/components/profile-editor/BasicInfoEditor";
import { LifestyleEditor } from "@/components/profile-editor/LifestyleEditor";
import { RelationshipGoalsEditor } from "@/components/profile-editor/RelationshipGoalsEditor";
import { FIRST_DATE_IDEAS } from "@/data/firstDateIdeas";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminProfile {
  id: string;
  name: string;
  age: number;
  country: string;
  city: string | null;
  gender: string;
  whatsapp: string;
  is_active: boolean;
  is_banned: boolean;
  is_spotlight: boolean;
  is_mock: boolean;
  hidden_until: string | null;
  created_at: string;
  last_seen_at: string | null;
  avatar_url: string | null;
  looking_for: string;
  bio: string | null;
  visible_in_countries: string[] | null;
  images: string[] | null;
  image_positions: Array<{ x: number; y: number; zoom: number }> | null;
  available_tonight: boolean | null;
  is_plusone: boolean;
  weekend_plans: boolean;
  late_night_chat: boolean;
  no_drama: boolean;
  generous_lifestyle: boolean;
  is_incognito: boolean;
  is_verified: boolean;
  mock_online_hours: number | null;
  mock_offline_days: number[] | null;
  height_cm: number | null;
  orientation: string | null;
  interests: string[] | null;
  basic_info: Record<string, any> | null;
  lifestyle_info: Record<string, any> | null;
  relationship_goals: Record<string, any> | null;
  first_date_idea: string | null;
  date_idea_image_url: string | null;
  second_date_idea: string | null;
  second_date_idea_image_url: string | null;
  third_date_idea: string | null;
  third_date_idea_image_url: string | null;
  phone_country_code: string | null;
  country_override_requested: boolean;
  country_override_approved: boolean;
}

const DEFAULT_IMG_POS = { x: 50, y: 50, zoom: 100 };

const getDateIdeaCategory = (idea: string): string => {
  if (idea.includes("☕") || idea.includes("🍵") || idea.includes("🧋") || idea.includes("🥤")) return "Café & Drinks";
  if (idea.includes("🍝") || idea.includes("🍽️") || idea.includes("🍣") || idea.includes("🍕") || idea.includes("🥐") || idea.includes("🍰") || idea.includes("🍦") || idea.includes("🍜") || idea.includes("🍱") || idea.includes("🔥") || idea.includes("🧑‍🍳")) return "Food & Dining";
  if (idea.includes("🌳") || idea.includes("🧺") || idea.includes("🌅") || idea.includes("🏖️") || idea.includes("⛰️") || idea.includes("🌺") || idea.includes("🌿") || idea.includes("🦆") || idea.includes("🦢")) return "Outdoors & Nature";
  if (idea.includes("🚣") || idea.includes("🌊") || idea.includes("🤿") || idea.includes("🏄") || idea.includes("🪂") || idea.includes("🚤")) return "Water & Beach";
  if (idea.includes("🎬") || idea.includes("🎵") || idea.includes("🎷") || idea.includes("😂") || idea.includes("🎤") || idea.includes("🎨") || idea.includes("🏛️") || idea.includes("💃") || idea.includes("📷") || idea.includes("⚽")) return "Entertainment & Culture";
  if (idea.includes("🎳") || idea.includes("🎯") || idea.includes("🔐") || idea.includes("⛸️") || idea.includes("🏎️") || idea.includes("🎢") || idea.includes("🎱") || idea.includes("🏓") || idea.includes("🏸") || idea.includes("🏐") || idea.includes("🧗") || idea.includes("🧘")) return "Active & Fun";
  if (idea.includes("🌃") || idea.includes("⭐") || idea.includes("✨") || idea.includes("🎶") || idea.includes("🛋️") || idea.includes("🕯️")) return "Romantic & Relaxed";
  if (idea.includes("🎣") || idea.includes("⛺") || idea.includes("🚗") || idea.includes("🏘️")) return "Outdoor Lifestyle";
  if (idea.includes("🛍️") || idea.includes("🍵") || idea.includes("📚") || idea.includes("🌙")) return "Simple & Modest";
  if (idea.includes("🕺") || idea.includes("🎧") || idea.includes("🍸") || idea.includes("🍹") || idea.includes("🍺") || idea.includes("🍾")) return "Nightlife & Party";
  if (idea.includes("🐶") || idea.includes("🐱") || idea.includes("🎲") || idea.includes("🍪") || idea.includes("🪁")) return "Cute & Playful";
  return "Other";
};

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Bangladesh","Belgium",
  "Bolivia","Brazil","Bulgaria","Cambodia","Canada","Chile","China","Colombia","Croatia",
  "Czech Republic","Denmark","Ecuador","Egypt","Ethiopia","Finland","France","Germany",
  "Ghana","Greece","Guatemala","Honduras","Hungary","India","Indonesia","Iran","Iraq",
  "Ireland","Israel","Italy","Japan","Jordan","Kenya","Malaysia","Mexico","Morocco",
  "Myanmar","Nepal","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Peru",
  "Philippines","Poland","Portugal","Romania","Russia","Saudi Arabia","Senegal",
  "Singapore","South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden",
  "Switzerland","Taiwan","Tanzania","Thailand","Tunisia","Turkey","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Venezuela","Vietnam","Zimbabwe",
] as const;

// Interests pill options for admin Details tab
const OPT = {
  interests: ["Travel","Cooking","Fitness","Music","Art","Gaming","Reading","Movies","Nature","Fashion","Tech","Food","Coffee","Beach","Hiking","Yoga","Photography","Dancing","Pets","Spirituality"],
} as const;

interface Payment {
  id: string;
  user_id: string;
  target_user_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  stripe_session_id: string;
}

type Tab = "overview" | "users" | "income" | "alerts" | "verify" | "setup";
type UserFilter = "all" | "active" | "banned" | "hidden" | "spotlight" | "mock";

// ── Helpers ────────────────────────────────────────────────────────────────────
const startOf = (unit: "day" | "week" | "month") => {
  const d = new Date();
  if (unit === "day")   { d.setHours(0,0,0,0); }
  if (unit === "week")  { d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); }
  if (unit === "month") { d.setDate(1); d.setHours(0,0,0,0); }
  return d;
};
const rev = (payments: Payment[], since?: Date) =>
  payments
    .filter(p => p.status === "paid" && (!since || new Date(p.created_at) >= since))
    .reduce((s, p) => s + p.amount_cents, 0) / 100;

const fmtRev = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(2)}`;

const isOnlineNow = (last_seen_at: string | null) => {
  if (!last_seen_at) return false;
  return Date.now() - new Date(last_seen_at).getTime() < 5 * 60 * 1000;
};

const isNewToday = (created_at: string) =>
  new Date(created_at) >= startOf("day");

// ── Mini bar-chart component ─────────────────────────────────────────────────
const BarChart = ({ data, color = "hsl(320,50%,50%)" }: { data: { label: string; value: number }[]; color?: string }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-[8px] text-white/40 font-medium">{d.value > 0 ? (typeof d.value === "number" && d.value < 10 ? d.value : d.value > 999 ? `${(d.value/1000).toFixed(1)}k` : d.value) : ""}</span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{ height: `${Math.max((d.value / max) * 52, d.value > 0 ? 4 : 0)}px`, background: color }}
          />
          <span className="text-[8px] text-white/40 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// ── User detail drawer ────────────────────────────────────────────────────────
const UserDrawer = ({
  profile,
  onClose,
  onBan,
  onDelete,
  onSpotlight,
  onReactivate,
  onMock,
  onEditProfile,
  onUploadImages,
  onApproveCountryOverride,
  actionLoading,
}: {
  profile: AdminProfile;
  onClose: () => void;
  onBan: (id: string, ban: boolean) => void;
  onDelete: (id: string) => void;
  onSpotlight: (id: string, on: boolean) => void;
  onReactivate: (id: string) => void;
  onMock: (id: string, mock: boolean) => void;
  onEditProfile: (id: string, updates: Partial<AdminProfile>) => Promise<void>;
  onUploadImages: (id: string, files: File[]) => Promise<void>;
  onApproveCountryOverride: (id: string) => Promise<void>;
  actionLoading: string | null;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [drawerTab, setDrawerTab] = useState<"actions" | "edit" | "images">("actions");
  const [saving, setSaving] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [targetCountries, setTargetCountries] = useState<string[]>(profile.visible_in_countries ?? []);
  const [adminImages, setAdminImages] = useState<string[]>(profile.images ?? []);
  const [adminImgPos, setAdminImgPos] = useState<Array<{x:number;y:number;zoom:number}>>(
    profile.image_positions ?? []
  );
  const [editingImgIdx, setEditingImgIdx] = useState<number | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [pendingSlot, setPendingSlot] = useState<number>(0);
  const [badgeOverrides, setBadgeOverrides] = useState<Record<string, boolean>>({});
  const [editForm, setEditForm] = useState({
    name: profile.name,
    age: String(profile.age),
    gender: profile.gender,
    looking_for: profile.looking_for,
    country: profile.country,
    city: profile.city ?? "",
    bio: profile.bio ?? "",
    whatsapp: profile.whatsapp,
    mock_online_hours: String(profile.mock_online_hours ?? ""),
  });
  const [offlineDays, setOfflineDays] = useState<number[]>(profile.mock_offline_days ?? []);
  const [dateIdeas, setDateIdeas] = useState<string[]>([
    profile.first_date_idea ?? "",
    profile.second_date_idea ?? "",
    profile.third_date_idea ?? "",
  ]);
  const [dateIdeaImages, setDateIdeaImages] = useState<string[]>([
    profile.date_idea_image_url ?? "",
    profile.second_date_idea_image_url ?? "",
    profile.third_date_idea_image_url ?? "",
  ]);
  const [dateIdeaUploading, setDateIdeaUploading] = useState<number | null>(null);
  const dateIdeaImgRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const [details, setDetails] = useState({
    height_cm:   profile.height_cm ?? ("" as number | ""),
    orientation: profile.orientation ?? "",
    interests:   profile.interests ?? [] as string[],
    basic_info:       { ...(profile.basic_info ?? {}) } as Record<string,any>,
    lifestyle_info:   { ...(profile.lifestyle_info ?? {}) } as Record<string,any>,
    relationship_goals: { ...(profile.relationship_goals ?? {}) } as Record<string,any>,
  });
  const toggleMulti = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const saveDetails = async () => {
    setSaving(true);
    const heightStr = details.basic_info.height as string | undefined;
    const parsedHeight = heightStr ? parseInt(heightStr, 10) || null : null;
    await onEditProfile(profile.id, {
      height_cm:          parsedHeight,
      orientation:        details.orientation || null,
      interests:          details.interests.length > 0 ? details.interests : null,
      basic_info:         details.basic_info,
      lifestyle_info:     details.lifestyle_info,
      relationship_goals: details.relationship_goals,
    } as any);
    setSaving(false);
  };

  const uploading = actionLoading === `upload-images:${profile.id}`;

  const getImgPos = (i: number) => adminImgPos[i] ?? { ...DEFAULT_IMG_POS };
  const updateImgPos = (i: number, field: "x"|"y"|"zoom", val: number) => {
    setAdminImgPos(prev => {
      const arr = [...prev];
      while (arr.length <= i) arr.push({ ...DEFAULT_IMG_POS });
      arr[i] = { ...arr[i], [field]: val };
      return arr;
    });
  };

  const handleAdminImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlot(pendingSlot);
    const ext = file.name.split(".").pop();
    const path = `${profile.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); setUploadingSlot(null); return; }
    const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
    const url = urlData.publicUrl;
    setAdminImages(imgs => {
      const next = [...imgs];
      if (pendingSlot < next.length) next[pendingSlot] = url; else next.push(url);
      return next;
    });
    setAdminImgPos(pos => {
      const next = [...pos];
      while (next.length <= pendingSlot) next.push({ ...DEFAULT_IMG_POS });
      next[pendingSlot] = { ...DEFAULT_IMG_POS };
      return next;
    });
    setUploadingSlot(null);
    setEditingImgIdx(pendingSlot);
    toast.success("Photo uploaded! Adjust position below.");
    if (imgInputRef.current) imgInputRef.current.value = "";
  };

  const handleDateIdeaImgUpload = async (slot: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDateIdeaUploading(slot);
    const ext = file.name.split(".").pop();
    const path = `${profile.id}/date-idea-${slot}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); setDateIdeaUploading(null); return; }
    const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
    setDateIdeaImages(imgs => { const next = [...imgs]; next[slot] = urlData.publicUrl; return next; });
    setDateIdeaUploading(null);
    if (dateIdeaImgRefs[slot]?.current) dateIdeaImgRefs[slot].current!.value = "";
  };

  const saveImages = async () => {
    setSaving(true);
    const avatarUrl = adminImages[0] ?? profile.avatar_url;
    await onEditProfile(profile.id, {
      images: adminImages,
      image_positions: adminImgPos,
      avatar_url: avatarUrl,
    } as any);
    setSaving(false);
  };
  const field = (key: keyof typeof editForm) => (val: string) =>
    setEditForm(f => ({ ...f, [key]: val }));

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase()) && !targetCountries.includes(c)
  );

  const upsertGlobalDateIdeaImages = async (ideas: string[], images: string[]) => {
    const pairs = ideas.map((idea, i) => ({ idea, image: images[i] })).filter(p => p.idea && p.image);
    if (pairs.length === 0) return;
    await supabase.from("date_ideas_images").upsert(
      pairs.map(p => ({
        idea_name: p.idea,
        image_url: p.image,
        image_alt: p.idea,
        category: getDateIdeaCategory(p.idea),
        is_active: true,
      })),
      { onConflict: "idea_name" }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await onEditProfile(profile.id, {
      name: editForm.name.trim(),
      age: Number(editForm.age) || profile.age,
      gender: editForm.gender,
      looking_for: editForm.looking_for,
      country: editForm.country.trim(),
      city: editForm.city.trim() || null,
      bio: editForm.bio.trim() || null,
      whatsapp: editForm.whatsapp.trim(),
      visible_in_countries: targetCountries.length > 0 ? targetCountries : null,
      mock_online_hours: editForm.mock_online_hours !== "" ? Number(editForm.mock_online_hours) : null,
      mock_offline_days: offlineDays.length > 0 ? offlineDays : null,
      first_date_idea: dateIdeas[0] || null,
      date_idea_image_url: dateIdeaImages[0] || null,
      second_date_idea: dateIdeas[1] || null,
      second_date_idea_image_url: dateIdeaImages[1] || null,
      third_date_idea: dateIdeas[2] || null,
      third_date_idea_image_url: dateIdeaImages[2] || null,
      selected_date_ideas: dateIdeas.filter(idea => idea) || null,
      ...badgeOverrides,
    });
    await upsertGlobalDateIdeaImages(dateIdeas, dateIdeaImages);
    setBadgeOverrides({});
    setSaving(false);
  };

  return (
  <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 320 }}
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-8 pt-2"
    >
      <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
      <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400" />
        <div className="p-4 space-y-3 max-h-[82vh] overflow-y-auto">

          {/* Header */}
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white/15 flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white/40" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-white font-bold">{profile.name}, {profile.age}</p>
                {profile.is_banned && <Badge variant="destructive" className="text-[9px]">Banned</Badge>}
                {profile.is_spotlight && <Badge className="text-[9px] bg-amber-500 border-0 text-white">⭐</Badge>}
                {profile.is_mock && <Badge className="text-[9px] bg-purple-500 border-0 text-white">Mock</Badge>}
                {isOnlineNow(profile.last_seen_at) && <span className="w-2 h-2 rounded-full bg-green-400" />}
              </div>
              <p className="text-white/40 text-[10px]">{profile.gender} · {profile.country || "Unknown"} · {profile.whatsapp}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-white/8 rounded-2xl">
            <button onClick={() => setDrawerTab("actions")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${drawerTab === "actions" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"}`}>
              <Shield className="w-3.5 h-3.5" /> Actions
            </button>
            <button onClick={() => setDrawerTab("edit")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${drawerTab === "edit" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"}`}>
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => setDrawerTab("images")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${drawerTab === "images" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"}`}>
              <Camera className="w-3.5 h-3.5" /> Photos
            </button>
            <button onClick={() => setDrawerTab("details" as any)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${(drawerTab as string) === "details" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"}`}>
              <ClipboardList className="w-3.5 h-3.5" /> Details
            </button>
          </div>

          {/* ── ACTIONS TAB ─────────────────────────────────────── */}
          {drawerTab === "actions" && (
            <div className="space-y-3">
              {/* Profile images strip */}
              {profile.images && profile.images.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {profile.images.map((img, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      <img src={img} alt={`Photo ${i+1}`}
                        className={`w-16 h-16 rounded-xl object-cover border-2 ${
                          i === 0 ? "border-amber-400" : "border-white/15"
                        }`}
                        style={profile.image_positions?.[i] ? {
                          objectPosition: `${profile.image_positions[i].x}% ${profile.image_positions[i].y}%`,
                        } : {}}
                      />
                      {i === 0 && <span className="absolute bottom-0.5 left-0.5 text-[7px] bg-amber-500 text-white rounded px-1 font-bold">MAIN</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Key profile info */}
              <div className="bg-white/5 border border-white/8 rounded-2xl p-3 space-y-1.5 text-[11px]">
                <div className="flex gap-2">
                  <span className="text-white/35 w-24 flex-shrink-0">Joined</span>
                  <span className="text-white/80">{new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-white/35 w-24 flex-shrink-0">Last seen</span>
                  <span className="text-white/80">{profile.last_seen_at ? new Date(profile.last_seen_at).toLocaleString() : "never"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-white/35 w-24 flex-shrink-0">Location</span>
                  <span className="text-white/80">{profile.city ? `${profile.city}, ` : ""}{profile.country || "Unknown"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-white/35 w-24 flex-shrink-0">Gender</span>
                  <span className="text-white/80 capitalize">{profile.gender}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-white/35 w-24 flex-shrink-0">Looking for</span>
                  <span className="text-white/80 capitalize">{profile.looking_for}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-white/35 w-24 flex-shrink-0">WhatsApp</span>
                  <span className="text-white/80">{profile.whatsapp}</span>
                </div>
                {profile.height_cm && (
                  <div className="flex gap-2">
                    <span className="text-white/35 w-24 flex-shrink-0">Height</span>
                    <span className="text-white/80">{profile.height_cm} cm</span>
                  </div>
                )}
                {profile.orientation && (
                  <div className="flex gap-2">
                    <span className="text-white/35 w-24 flex-shrink-0">Orientation</span>
                    <span className="text-white/80">{profile.orientation}</span>
                  </div>
                )}
                {profile.interests && profile.interests.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-white/35 w-24 flex-shrink-0 mt-0.5">Interests</span>
                    <span className="text-white/80 leading-relaxed">{profile.interests.join(" · ")}</span>
                  </div>
                )}
                {profile.mock_online_hours != null && (
                  <div className="flex gap-2">
                    <span className="text-white/35 w-24 flex-shrink-0">Online hrs/day</span>
                    <span className="text-green-400 font-semibold">{profile.mock_online_hours}h {profile.mock_offline_days?.length ? `· offline ${profile.mock_offline_days.map(d => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]).join(", ")}` : ""}</span>
                  </div>
                )}
              </div>

              {profile.bio && (
                <p className="text-white/60 text-xs bg-white/5 rounded-xl p-3 border border-white/8 italic">{profile.bio}</p>
              )}
              {profile.visible_in_countries && profile.visible_in_countries.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <MapPin className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] text-purple-400 font-semibold">Targeting:</span>
                  {profile.visible_in_countries.map(c => (
                    <span key={c} className="text-[9px] bg-purple-500/15 border border-purple-500/25 text-purple-400 rounded-full px-1.5 py-0.5">{c}</span>
                  ))}
                </div>
              )}

              {/* Country override request */}
              {profile.country_override_requested && !profile.country_override_approved && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                  <p className="text-amber-400 text-xs font-bold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Country Override Request</p>
                  <p className="text-white/60 text-xs">Phone country: <strong className="text-white/80">{profile.phone_country_code || "Unknown"}</strong></p>
                  <p className="text-white/60 text-xs">Requested listing in: <strong className="text-white/80">{profile.country || "Unknown"}</strong></p>
                  <button
                    onClick={() => onApproveCountryOverride(profile.id)}
                    disabled={actionLoading === profile.id}
                    className="h-9 w-full rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 transition-all active:scale-95 disabled:opacity-60">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve Country Override
                  </button>
                </div>
              )}
              {profile.country_override_approved && (
                <div className="p-2 rounded-xl border border-green-500/20 bg-green-500/8 text-green-400 text-xs flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3" /> Country override approved
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onBan(profile.id, !profile.is_banned)} disabled={actionLoading === profile.id}
                  className={`h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 border ${profile.is_banned ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-red-500/15 border-red-500/30 text-red-400"}`}>
                  <Ban className="w-4 h-4" />{profile.is_banned ? "Unban" : "Ban"}
                </button>

                <button onClick={() => onSpotlight(profile.id, !profile.is_spotlight)} disabled={actionLoading === profile.id}
                  className={`h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 border ${profile.is_spotlight ? "bg-white/8 border-white/10 text-white/50" : "bg-amber-500/15 border-amber-500/30 text-amber-400"}`}>
                  <Star className="w-4 h-4" fill={profile.is_spotlight ? "none" : "currentColor"} />
                  {profile.is_spotlight ? "Un-Spotlight" : "Spotlight"}
                </button>

                {profile.hidden_until && new Date(profile.hidden_until) > new Date() && (
                  <button onClick={() => onReactivate(profile.id)} disabled={actionLoading === profile.id}
                    className="h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 bg-blue-500/15 border border-blue-500/30 text-blue-400 transition-all active:scale-95">
                    <CheckCircle className="w-4 h-4" /> Reactivate
                  </button>
                )}

                <button onClick={() => onMock(profile.id, !profile.is_mock)} disabled={actionLoading === profile.id}
                  className={`h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 border ${profile.is_mock ? "bg-white/8 border-white/10 text-white/50" : "bg-purple-500/15 border-purple-500/30 text-purple-400"}`}>
                  <Eye className="w-4 h-4" />{profile.is_mock ? "Remove Mock" : "Mark Mock"}
                </button>

                <button onClick={() => { if (confirm(`Permanently delete ${profile.name}?`)) { onDelete(profile.id); onClose(); } }}
                  disabled={actionLoading === profile.id}
                  className="h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 transition-all active:scale-95 col-span-2">
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-white/50 text-xs font-semibold">Profile Images</p>
                <input type="file" accept="image/*" multiple onChange={e => setFiles(Array.from(e.target.files || []).slice(0, 2))}
                  className="block w-full text-xs text-white/50 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-pink-500/20 file:text-pink-400 hover:file:bg-pink-500/30" />
                <button onClick={async () => { if (files.length !== 2) { alert("Choose exactly 2 images."); return; } await onUploadImages(profile.id, files); setFiles([]); }}
                  disabled={uploading}
                  className="h-11 w-full rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 bg-pink-500/15 border border-pink-500/30 text-pink-400 transition-all active:scale-95 disabled:opacity-60">
                  <Image className="w-4 h-4" />{uploading ? "Uploading..." : "Upload 2 Images"}
                </button>
              </div>
            </div>
          )}

          {/* ── EDIT TAB ────────────────────────────────────────── */}
          {drawerTab === "edit" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">Name</label>
                  <input value={editForm.name} onChange={e => field("name")(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors" />
                </div>
                <div className="space-y-1">
                  <label className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">Age</label>
                  <input type="number" min={18} max={99} value={editForm.age} onChange={e => field("age")(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">Gender</label>
                  <select value={editForm.gender} onChange={e => field("gender")(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">Looking For</label>
                  <select value={editForm.looking_for} onChange={e => field("looking_for")(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors">
                    <option value="women">Women</option>
                    <option value="men">Men</option>
                    <option value="everyone">Everyone</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">Country</label>
                  <select value={editForm.country} onChange={e => field("country")(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors">
                    <option value="">— Select country —</option>
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">City</label>
                  <input value={editForm.city} onChange={e => field("city")(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">WhatsApp</label>
                <input value={editForm.whatsapp} onChange={e => field("whatsapp")(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors" />
              </div>

              {/* Online schedule — mock profiles only */}
              {(profile.is_mock || (badgeOverrides as any).is_mock === true) && (
                <div className="space-y-1 p-3 bg-green-500/10 border border-green-500/20 rounded-2xl">
                  <label className="text-green-400 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                    🟢 Daily Online Hours (mock schedule)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min={0} max={18} step={0.5}
                      value={editForm.mock_online_hours}
                      onChange={e => field("mock_online_hours")(e.target.value)}
                      placeholder="e.g. 8"
                      className="w-24 h-9 px-3 rounded-xl border border-green-500/30 bg-white/5 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                    <span className="text-green-400/80 text-xs">hours / day (0 = always offline)</span>
                  </div>
                  <p className="text-green-400/70 text-[10px] leading-snug">
                    System distributes sessions realistically across waking hours in {editForm.country || profile.country}&apos;s timezone.
                    Offline gaps are always ≥ 30 min. Sleeping hours avoided.
                  </p>

                  {/* Offline days */}
                  <div className="space-y-1.5 pt-2 border-t border-green-500/20">
                    <label className="text-green-400 text-[10px] font-bold uppercase tracking-wide">
                      📴 Force Offline — Full Days
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {(["Sun","Mon","Tue","Wed","Thu","Fri","Sat"] as const).map((label, idx) => {
                        const active = offlineDays.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setOfflineDays(d =>
                              active ? d.filter(x => x !== idx) : [...d, idx]
                            )}
                            className={`w-10 h-8 rounded-xl text-[11px] font-bold border transition-all active:scale-95 ${
                              active
                                ? "bg-red-500 border-red-600 text-white shadow-sm"
                                : "bg-white/5 border-green-500/30 text-green-400 hover:bg-green-500/10"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-green-400/70 text-[10px]">
                      Red = offline 24 h · Checked against profile&apos;s local timezone · Changes saved with Save Changes
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">Bio</label>
                <textarea value={editForm.bio} onChange={e => field("bio")(e.target.value)} rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors resize-none" />
              </div>

              {/* Badge toggles */}
              <div className="space-y-2 pt-1 border-t border-white/8">
                <p className="text-white/60 text-xs font-bold flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-pink-400" /> Badges &amp; Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: "available_tonight",  label: "🌙 Free Tonight",       color: "purple" },
                    { key: "is_plusone",          label: "👫 Plus One",           color: "emerald" },
                    { key: "weekend_plans",       label: "📅 Weekends",           color: "blue" },
                    { key: "late_night_chat",     label: "🌃 Late Night Chat",    color: "indigo" },
                    { key: "no_drama",            label: "✌️ No Drama",           color: "green" },
                    { key: "generous_lifestyle",  label: "💎 Generous",           color: "amber" },
                    { key: "is_incognito",        label: "👁️ Incognito",         color: "gray" },
                    { key: "is_verified",         label: "✅ Verified",           color: "sky" },
                    { key: "is_spotlight",        label: "⭐ Spotlight",          color: "yellow" },
                    { key: "is_active",           label: "🟢 Active",             color: "green" },
                    { key: "is_mock",             label: "🎭 Mock Profile",       color: "pink" },
                  ] as const).map(({ key, label, color }) => {
                    const val = !!(profile as any)[key];
                    const active = badgeOverrides.hasOwnProperty(key)
                      ? !!(badgeOverrides as any)[key]
                      : val;
                    const colorMap: Record<string, string> = {
                      purple:  "bg-purple-500/15 border-purple-500/30 text-purple-400",
                      emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
                      blue:    "bg-blue-500/15 border-blue-500/30 text-blue-400",
                      indigo:  "bg-indigo-500/15 border-indigo-500/30 text-indigo-400",
                      green:   "bg-green-500/15 border-green-500/30 text-green-400",
                      amber:   "bg-amber-500/15 border-amber-500/30 text-amber-400",
                      gray:    "bg-white/8 border-white/15 text-white/50",
                      sky:     "bg-sky-500/15 border-sky-500/30 text-sky-400",
                      yellow:  "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
                      pink:    "bg-pink-500/15 border-pink-500/30 text-pink-400",
                    };
                    return (
                      <button
                        key={key}
                        onClick={() => setBadgeOverrides(b => ({ ...b, [key]: !active }))}
                        className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold transition-all active:scale-95 ${
                          active
                            ? colorMap[color]
                            : "bg-white/5 border-white/8 text-white/25 line-through"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-white/30 text-[10px]">Bold = active · Strikethrough = off · Changes saved with "Save Changes"</p>
              </div>

              {/* Country targeting */}
              <div className="space-y-2 pt-1 border-t border-white/8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    <label className="text-white/60 text-xs font-bold">Display Countries</label>
                  </div>
                  {targetCountries.length > 0 && (
                    <button onClick={() => setTargetCountries([])}
                      className="text-[10px] text-white/30 hover:text-white/60 underline">
                      Show everywhere
                    </button>
                  )}
                </div>

                {targetCountries.length === 0 ? (
                  <p className="text-white/40 text-xs bg-white/5 rounded-xl p-2.5 border border-white/8">
                    🌍 Showing in <strong className="text-white/60">all countries</strong>. Add countries below to restrict.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {targetCountries.map(c => (
                      <span key={c} className="flex items-center gap-1 text-[10px] bg-purple-500/15 border border-purple-500/25 text-purple-400 rounded-full pl-2 pr-1 py-0.5">
                        {c}
                        <button onClick={() => setTargetCountries(t => t.filter(x => x !== c))}
                          className="w-3.5 h-3.5 rounded-full bg-purple-500/25 hover:bg-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0 transition-colors">
                          <X className="w-2 h-2" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input
                    placeholder="Search & add country..."
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                {countrySearch.length > 0 && (
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                    {filteredCountries.length === 0 ? (
                      <p className="text-white/30 text-xs p-3 text-center">No results</p>
                    ) : (
                      filteredCountries.slice(0, 10).map(c => (
                        <button key={c} onClick={() => { setTargetCountries(t => [...t, c]); setCountrySearch(""); }}
                          className="w-full text-left px-3 py-2 text-xs text-white/60 hover:bg-purple-500/15 hover:text-purple-400 flex items-center gap-2 transition-colors border-b border-white/5 last:border-0">
                          <Plus className="w-3 h-3 text-purple-400 flex-shrink-0" />{c}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Date Ideas x3 */}
              <div className="space-y-3 pt-1 border-t border-white/8">
                <p className="text-white/60 text-xs font-bold flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-pink-400" /> Date Ideas (up to 3)
                </p>
                {([0, 1, 2] as const).map(slot => (
                  <div key={slot} className="space-y-1.5 p-2.5 rounded-xl bg-white/5 border border-white/8">
                    <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">Idea {slot + 1}</p>
                    <select
                      value={dateIdeas[slot]}
                      onChange={e => setDateIdeas(arr => { const next = [...arr]; next[slot] = e.target.value; return next; })}
                      className="w-full h-9 px-3 rounded-xl border border-white/10 bg-[#1a1a1a] text-white text-xs focus:outline-none focus:border-pink-400 transition-colors"
                    >
                      <option value="">— None —</option>
                      {FIRST_DATE_IDEAS.map(idea => (
                        <option key={idea} value={idea}>{idea}</option>
                      ))}
                    </select>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {dateIdeaImages[slot] && (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                            <img src={dateIdeaImages[slot]} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => setDateIdeaImages(imgs => { const next = [...imgs]; next[slot] = ""; return next; })}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => dateIdeaImgRefs[slot]?.current?.click()}
                          disabled={dateIdeaUploading === slot}
                          className="flex-1 h-8 rounded-xl border border-dashed border-pink-500/30 text-pink-400 text-[10px] font-semibold flex items-center justify-center gap-1 hover:bg-pink-500/10 transition-colors disabled:opacity-50"
                        >
                          <Camera className="w-3 h-3" />{dateIdeaUploading === slot ? "Uploading…" : dateIdeaImages[slot] ? "Replace" : "Upload Image"}
                        </button>
                        <input ref={dateIdeaImgRefs[slot]} type="file" accept="image/*" className="hidden" onChange={e => handleDateIdeaImgUpload(slot, e)} />
                      </div>
                      <input
                        type="url"
                        placeholder="Or paste image URL…"
                        value={dateIdeaImages[slot]}
                        onChange={e => setDateIdeaImages(imgs => { const next = [...imgs]; next[slot] = e.target.value; return next; })}
                        className="w-full h-7 px-2.5 rounded-lg border border-white/8 bg-white/5 text-white text-[10px] placeholder-white/25 focus:outline-none focus:border-pink-400/50 transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleSave} disabled={saving}
                className="h-12 w-full rounded-2xl text-sm font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-60 mt-2">
                <Save className="w-4 h-4" />{saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}

          {/* ── IMAGES TAB ──────────────────────────────────────── */}
          {drawerTab === "images" && (
            <div className="space-y-4">
              <p className="text-white/40 text-[10px] font-medium">Tap an empty slot to upload · Tap an image to adjust its position · First image becomes the main card</p>

              {/* 5-slot image grid */}
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const img = adminImages[idx];
                  const isMain = idx === 0;
                  const isEditing = editingImgIdx === idx;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div
                        onClick={() => {
                          if (!img) {
                            setPendingSlot(idx);
                            imgInputRef.current?.click();
                          } else {
                            setEditingImgIdx(isEditing ? null : idx);
                          }
                        }}
                        className={`aspect-square w-full rounded-xl overflow-hidden relative cursor-pointer group border-2 transition-all ${
                          isEditing ? "border-pink-400 shadow-md" : isMain && img ? "border-amber-400" : "border-white/15 hover:border-white/30"
                        }`}
                      >
                        {uploadingSlot === idx ? (
                          <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 text-white/40 animate-spin" />
                          </div>
                        ) : img ? (
                          <>
                            <div className="absolute inset-0 overflow-hidden bg-white/10">
                              <img src={img} alt={`Photo ${idx + 1}`}
                                className="absolute w-full h-full object-cover pointer-events-none"
                                style={{
                                  transform: `scale(${getImgPos(idx).zoom / 100}) translate(${50 - getImgPos(idx).x}%, ${50 - getImgPos(idx).y}%)`,
                                  transformOrigin: "center center",
                                }}
                              />
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); setAdminImages(imgs => imgs.filter((_, i) => i !== idx)); setAdminImgPos(pos => pos.filter((_, i) => i !== idx)); if (editingImgIdx === idx) setEditingImgIdx(null); }}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                            {isMain && <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-amber-500 text-white rounded px-1 font-bold leading-tight">MAIN</span>}
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-white/5 flex flex-col items-center justify-center text-white/20">
                            <Camera className="w-4 h-4" />
                            <span className="text-[8px] mt-0.5">{idx === 0 ? "Main" : `#${idx + 1}`}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleAdminImgUpload} />

              {/* Position editor */}
              {editingImgIdx !== null && adminImages[editingImgIdx] && (
                <div className="space-y-3 p-3 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <p className="text-white/70 text-xs font-bold">
                      {editingImgIdx === 0 ? "📸 Main Card Image" : `📸 Photo ${editingImgIdx + 1}`}
                    </p>
                    <button
                      onClick={() => { updateImgPos(editingImgIdx, "x", 50); updateImgPos(editingImgIdx, "y", 50); updateImgPos(editingImgIdx, "zoom", 100); }}
                      className="text-[10px] text-white/30 hover:text-white/60 underline"
                    >Reset</button>
                  </div>

                  {/* Preview — exact live card proportions */}
                  <div className={`relative w-full rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${editingImgIdx === 0 ? "aspect-[4/3]" : "aspect-square"}`}>
                    <div className="absolute inset-0 overflow-hidden bg-gray-900">
                      <img
                        src={adminImages[editingImgIdx]}
                        alt="Preview"
                        className="absolute w-full h-full object-cover pointer-events-none"
                        style={{
                          transform: `scale(${getImgPos(editingImgIdx).zoom / 100}) translate(${50 - getImgPos(editingImgIdx).x}%, ${50 - getImgPos(editingImgIdx).y}%)`,
                          transformOrigin: "center center",
                        }}
                        draggable={false}
                      />
                    </div>
                    {editingImgIdx === 0 && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                          <p className="font-bold text-xl text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">{profile.name}, {profile.age}</p>
                          <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />{profile.city ? `${profile.city}, ` : ""}{profile.country || "Unknown"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Sliders */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MoveHorizontal className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      <span className="text-[10px] text-white/30 w-5">L/R</span>
                      <Slider
                        value={[getImgPos(editingImgIdx).x]}
                        onValueChange={([v]) => updateImgPos(editingImgIdx, "x", v)}
                        min={0} max={100} step={1} className="flex-1"
                      />
                      <span className="text-[10px] text-white/30 w-6 text-right">{getImgPos(editingImgIdx).x}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MoveVertical className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      <span className="text-[10px] text-white/30 w-5">U/D</span>
                      <Slider
                        value={[getImgPos(editingImgIdx).y]}
                        onValueChange={([v]) => updateImgPos(editingImgIdx, "y", v)}
                        min={0} max={100} step={1} className="flex-1"
                      />
                      <span className="text-[10px] text-white/30 w-6 text-right">{getImgPos(editingImgIdx).y}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ZoomIn className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      <span className="text-[10px] text-white/30 w-5">Zoom</span>
                      <Slider
                        value={[getImgPos(editingImgIdx).zoom]}
                        onValueChange={([v]) => updateImgPos(editingImgIdx, "zoom", v)}
                        min={30} max={300} step={5} className="flex-1"
                      />
                      <span className="text-[10px] text-white/30 w-8 text-right">{getImgPos(editingImgIdx).zoom}%</span>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={saveImages} disabled={saving}
                className="h-12 w-full rounded-2xl text-sm font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-60">
                <Save className="w-4 h-4" />{saving ? "Saving…" : "Save Images & Positions"}
              </button>
            </div>
          )}

          {/* ── DETAILS TAB ─────────────────────────────────────── */}
          {(drawerTab as string) === "details" && (
            <div className="space-y-3">

              {/* Orientation — matches real app 3-button layout */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/8 space-y-2">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wide">Orientation (optional)</p>
                <div className="flex gap-2">
                  {[
                    { value: "", label: "Not specified" },
                    { value: "Straight", label: "Straight" },
                    { value: "Same-Sex", label: "Gay / Lesbian" },
                  ].map(o => (
                    <button key={o.value} type="button"
                      onClick={() => setDetails(d => ({ ...d, orientation: o.value }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                        details.orientation === o.value
                          ? "bg-pink-500 text-white border-pink-500 shadow-md"
                          : "bg-white/5 text-white/50 border-white/10 hover:border-pink-500/40"
                      }`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests pill select — matches real app */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/8 space-y-2">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wide">🎯 Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {OPT.interests.map(o => {
                    const on = details.interests.includes(o);
                    return (
                      <button key={o} type="button"
                        onClick={() => setDetails(d => ({ ...d, interests: toggleMulti(d.interests, o) }))}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                          on ? "bg-pink-500 border-pink-600 text-white" : "bg-white/5 border-white/10 text-white/50 hover:border-pink-500/40"
                        }`}>
                        {o}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exact same sub-editors as the real user profile editor */}
              <BasicInfoEditor
                value={details.basic_info as any}
                onChange={v => setDetails(d => ({ ...d, basic_info: v as Record<string,any> }))}
              />
              <LifestyleEditor
                value={details.lifestyle_info as any}
                onChange={v => setDetails(d => ({ ...d, lifestyle_info: v as Record<string,any> }))}
              />
              <RelationshipGoalsEditor
                value={details.relationship_goals as any}
                onChange={v => setDetails(d => ({ ...d, relationship_goals: v as Record<string,any> }))}
              />

              <button onClick={saveDetails} disabled={saving}
                className="h-12 w-full rounded-2xl text-sm font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-60">
                <Save className="w-4 h-4" />{saving ? "Saving…" : "Save Profile Details"}
              </button>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  </>
  );
};

// ── Verify Tab ────────────────────────────────────────────────────────────────
const VerifyTab = ({
  profiles,
  onApprove,
  onReject,
}: {
  profiles: AdminProfile[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) => {
  const pending = profiles.filter((p: any) => (p as any).verification_status === "pending");
  const approved = profiles.filter((p: any) => (p as any).verification_status === "approved");
  const rejected = profiles.filter((p: any) => (p as any).verification_status === "rejected");
  const [acting, setActing] = useState<string | null>(null);

  const act = async (id: string, fn: (id: string) => Promise<void>) => {
    setActing(id);
    await fn(id);
    setActing(null);
  };

  const Card = ({ p, showActions }: { p: AdminProfile; showActions: boolean }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        {(p as any).avatar_url ? (
          <img src={(p as any).avatar_url} className="w-12 h-12 rounded-full object-cover ring-2 ring-white/15 flex-shrink-0" alt={p.name} />
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm flex items-center gap-1.5">
            {(p as any).is_verified && <BadgeCheck className="w-4 h-4 text-sky-400 flex-shrink-0" />}
            {p.name}, {p.age}
          </p>
          <p className="text-white/50 text-xs">{p.city ? `${p.city}, ` : ""}{p.country || "Unknown"}</p>
          <p className="text-white/40 text-[10px] mt-0.5">{p.whatsapp}</p>
        </div>
      </div>

      {/* Submitted ID info */}
      <div className="bg-white/5 rounded-xl p-3 space-y-1.5 text-xs border border-white/8">
        <div className="flex gap-2">
          <span className="text-white/40 w-20 flex-shrink-0">ID Type</span>
          <span className="text-white font-medium uppercase">{(p as any).verification_id_type || "—"}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-white/40 w-20 flex-shrink-0">Name on ID</span>
          <span className="text-white font-medium">{(p as any).verification_name || "—"}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-white/40 w-20 flex-shrink-0">Age on ID</span>
          <span className={`font-semibold ${(p as any).verification_age && Math.abs((p as any).verification_age - p.age) > 1 ? "text-red-400" : "text-white"}`}>
            {(p as any).verification_age || "—"}
            {(p as any).verification_age && Math.abs((p as any).verification_age - p.age) > 1 && " ⚠️ mismatch"}
          </span>
        </div>
      </div>

      {/* ID photo */}
      {(p as any).verification_id_url && (
        <a href={(p as any).verification_id_url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-white/10">
          <img src={(p as any).verification_id_url} alt="ID" className="w-full h-32 object-cover" />
          <p className="text-white/40 text-[10px] text-center py-1">Tap to open full size</p>
        </a>
      )}

      {showActions && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => act(p.id, onApprove)}
            disabled={acting === p.id}
            className="h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 bg-sky-500/15 border border-sky-500/30 text-sky-400 active:scale-95 transition-all disabled:opacity-50"
          >
            <BadgeCheck className="w-4 h-4" /> Approve
          </button>
          <button
            onClick={() => act(p.id, onReject)}
            disabled={acting === p.id}
            className="h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 bg-red-500/15 border border-red-500/30 text-red-400 active:scale-95 transition-all disabled:opacity-50"
          >
            <X className="w-4 h-4" /> Reject
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white font-semibold text-sm">ID Verification Requests</p>
        {pending.length > 0 && <span className="ml-auto bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{pending.length} pending</span>}
      </div>

      {pending.length === 0 && (
        <div className="text-center py-10 bg-white/5 border border-white/10 rounded-2xl">
          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-white/40 text-sm">No pending verification requests</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-orange-400 text-[10px] font-bold uppercase tracking-wider">Pending ({pending.length})</p>
          {pending.map(p => <Card key={p.id} p={p} showActions />)}
        </div>
      )}

      {approved.length > 0 && (
        <div className="space-y-3">
          <p className="text-sky-400 text-[10px] font-bold uppercase tracking-wider">Approved ({approved.length})</p>
          {approved.map(p => <Card key={p.id} p={p} showActions={false} />)}
        </div>
      )}

      {rejected.length > 0 && (
        <div className="space-y-3">
          <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider">Rejected ({rejected.length})</p>
          {rejected.map(p => <Card key={p.id} p={p} showActions={false} />)}
        </div>
      )}
    </div>
  );
};

// ── Setup Tab ─────────────────────────────────────────────────────────────────
const SQL_STEPS = [
  {
    step: 1,
    title: "Create user_roles table",
    desc: "Stores which users have the admin role.",
    sql: `CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);`,
  },
  {
    step: 2,
    title: "Create is_admin() helper function",
    desc: "A secure function that checks if the current user is an admin. Used by all RLS policies.",
    sql: `CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role    = 'admin'
  );
$$;`,
  },
  {
    step: 3,
    title: "Add admin RLS bypass policies",
    desc: "Allows admin to SELECT, UPDATE and DELETE all rows in profiles, payments, likes, reports and whatsapp_leads — bypassing filters that hide inactive, banned or foreign-country profiles.",
    sql: `-- profiles
DROP POLICY IF EXISTS "Admin can select all profiles" ON public.profiles;
CREATE POLICY "Admin can select all profiles"
  ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
CREATE POLICY "Admin can update any profile"
  ON public.profiles FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete any profile" ON public.profiles;
CREATE POLICY "Admin can delete any profile"
  ON public.profiles FOR DELETE USING (public.is_admin());

-- payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can select all payments" ON public.payments;
CREATE POLICY "Admin can select all payments"
  ON public.payments FOR SELECT USING (public.is_admin());

-- likes
DROP POLICY IF EXISTS "Admin can select all likes" ON public.likes;
CREATE POLICY "Admin can select all likes"
  ON public.likes FOR SELECT USING (public.is_admin());

-- reports
DROP POLICY IF EXISTS "Admin can select all reports" ON public.reports;
CREATE POLICY "Admin can select all reports"
  ON public.reports FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can update reports" ON public.reports;
CREATE POLICY "Admin can update reports"
  ON public.reports FOR UPDATE USING (public.is_admin());

-- whatsapp_leads
DROP POLICY IF EXISTS "Admin can select all whatsapp_leads" ON public.whatsapp_leads;
CREATE POLICY "Admin can select all whatsapp_leads"
  ON public.whatsapp_leads FOR SELECT USING (public.is_admin());`,
  },
  {
    step: 4,
    title: "Grant yourself the admin role",
    desc: "Find your user UUID in: Supabase Dashboard → Authentication → Users → copy the UUID column. Replace the placeholder below.",
    sql: `-- ⚠️ Replace the UUID with YOUR actual Supabase auth user ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-UUID-HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;`,
    warn: true,
  },
];

const SetupTab = () => {
  const [copied, setCopied] = React.useState<number | null>(null);
  const [seeding, setSeeding]   = React.useState(false);
  const [refreshing2, setRefreshing2] = React.useState(false);
  const [seedResult, setSeedResult]     = React.useState<{ success: boolean; total?: number; created?: number; updated?: number; failed?: number; error?: string } | null>(null);
  const [refreshResult, setRefreshResult] = React.useState<{ success: boolean; updated?: number; total?: number; error?: string } | null>(null);

  const copy = (sql: string, step: number) => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(step);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleSeedMockProfiles = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("seed-mock-profiles", { body: {} });
      if (error) throw error;
      setSeedResult(data);
    } catch (err: unknown) {
      setSeedResult({ success: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setSeeding(false);
    }
  };

  const handleRefreshOnlineStatus = async () => {
    setRefreshing2(true);
    setRefreshResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("refresh-mock-online-status", { body: {} });
      if (error) throw error;
      setRefreshResult(data);
    } catch (err: unknown) {
      setRefreshResult({ success: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setRefreshing2(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Mock Profiles Section ─────────────────────────────── */}
      <div className="bg-purple-500/8 border border-purple-500/20 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <p className="text-purple-300 font-bold text-sm">Mock Profiles</p>
        </div>
        <p className="text-white/50 text-xs leading-relaxed">
          Seed 90 realistic Indonesian mock profiles into Supabase (creates auth users + full profile rows with <strong className="text-white/70">basic info, lifestyle, relationship goals</strong> and Unsplash images). Safe to run multiple times — existing profiles are updated, not duplicated. After seeding, use the <strong className="text-white/70">Users → Mock</strong> filter to view and edit them.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {/* Seed button */}
          <button
            onClick={handleSeedMockProfiles}
            disabled={seeding}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 hover:border-purple-500/50 transition-all font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {seeding ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Seeding…</>
            ) : (
              <><Zap className="w-3.5 h-3.5" /> Seed Mock Profiles</>
            )}
          </button>

          {/* Refresh online status button */}
          <button
            onClick={handleRefreshOnlineStatus}
            disabled={refreshing2}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-green-500/15 border border-green-500/25 text-green-400 hover:bg-green-500/25 hover:border-green-500/40 transition-all font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing2 ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating…</>
            ) : (
              <><Activity className="w-3.5 h-3.5" /> Refresh Online Status</>
            )}
          </button>
        </div>

        {/* Seed result */}
        {seedResult && (
          <div className={`rounded-xl px-3 py-2 text-xs font-medium border ${seedResult.success ? "bg-green-500/10 border-green-500/20 text-green-300" : "bg-red-500/10 border-red-500/20 text-red-300"}`}>
            {seedResult.success
              ? `✅ Done — ${seedResult.created} created, ${seedResult.updated} updated, ${seedResult.failed} failed (total ${seedResult.total})`
              : `❌ Error: ${seedResult.error}`}
          </div>
        )}

        {/* Refresh result */}
        {refreshResult && (
          <div className={`rounded-xl px-3 py-2 text-xs font-medium border ${refreshResult.success ? "bg-green-500/10 border-green-500/20 text-green-300" : "bg-red-500/10 border-red-500/20 text-red-300"}`}>
            {refreshResult.success
              ? `✅ Updated last_seen_at for ${refreshResult.updated}/${refreshResult.total} mock profiles`
              : `❌ Error: ${refreshResult.error}`}
          </div>
        )}

        <p className="text-white/30 text-[10px]">
          ⚠️ Requires the edge functions to be deployed. Run: <code className="bg-white/8 px-1 rounded text-purple-300/80">supabase functions deploy seed-mock-profiles</code> and <code className="bg-white/8 px-1 rounded text-purple-300/80">supabase functions deploy refresh-mock-online-status</code>
        </p>
      </div>

      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-pink-400" />
          <p className="text-white font-bold text-sm">Supabase Admin RLS Setup</p>
        </div>
        <p className="text-white/55 text-xs leading-relaxed">
          Run these SQL blocks <strong className="text-white/80">in order</strong> in your{" "}
          <strong className="text-white/80">Supabase Dashboard → SQL Editor</strong>.
          This gives the admin account full read/write access to all profiles from every country,
          bypassing RLS filters that hide inactive or banned users.
        </p>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 transition-colors font-semibold"
        >
          <ExternalLink className="w-3 h-3" /> Open Supabase Dashboard
        </a>
      </div>

      {/* SQL Steps */}
      {SQL_STEPS.map(({ step, title, desc, sql, warn }) => (
        <div
          key={step}
          className={`border rounded-2xl overflow-hidden ${warn ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 bg-white/5"}`}
        >
          {/* Step header */}
          <div className="flex items-start justify-between gap-3 p-4 pb-2">
            <div className="flex items-start gap-3">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${warn ? "bg-amber-500/25 text-amber-400" : "bg-pink-500/20 text-pink-400"}`}>
                {step}
              </span>
              <div>
                <p className={`font-bold text-sm ${warn ? "text-amber-400" : "text-white"}`}>{title}</p>
                <p className="text-white/45 text-[11px] mt-0.5 leading-snug">{desc}</p>
              </div>
            </div>
            <button
              onClick={() => copy(sql, step)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                copied === step
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-white/8 text-white/60 hover:text-white hover:bg-white/15 border border-white/10"
              }`}
            >
              {copied === step ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied === step ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* SQL block */}
          <div className="mx-4 mb-4 bg-[#0d0d0d] border border-white/8 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 bg-white/3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500/60" />
                <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
                <span className="w-2 h-2 rounded-full bg-green-500/60" />
              </div>
              <span className="text-white/20 text-[10px] font-mono">SQL Editor</span>
            </div>
            <pre className="px-3 py-3 text-[10px] text-green-300/80 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">
              {sql}
            </pre>
          </div>
        </div>
      ))}

      {/* How to find user ID */}
      <div className="bg-sky-500/8 border border-sky-500/20 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-400" />
          <p className="text-sky-400 font-bold text-sm">How to find your User UUID</p>
        </div>
        <ol className="space-y-1.5 text-xs text-white/55 leading-relaxed">
          <li className="flex gap-2"><span className="text-sky-400 font-bold flex-shrink-0">1.</span> Go to <strong className="text-white/70">Supabase Dashboard</strong></li>
          <li className="flex gap-2"><span className="text-sky-400 font-bold flex-shrink-0">2.</span> Click <strong className="text-white/70">Authentication</strong> in the left sidebar</li>
          <li className="flex gap-2"><span className="text-sky-400 font-bold flex-shrink-0">3.</span> Click <strong className="text-white/70">Users</strong></li>
          <li className="flex gap-2"><span className="text-sky-400 font-bold flex-shrink-0">4.</span> Find your email and copy the <strong className="text-white/70">UUID</strong> from the first column</li>
          <li className="flex gap-2"><span className="text-sky-400 font-bold flex-shrink-0">5.</span> Paste it into Step 4's SQL replacing <code className="bg-white/10 px-1 rounded text-sky-300">YOUR-USER-UUID-HERE</code></li>
        </ol>
      </div>

      {/* Verification note */}
      <div className="bg-green-500/8 border border-green-500/15 rounded-2xl p-4">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-green-400 font-bold text-sm">After running all 4 steps</p>
            <p className="text-white/45 text-xs leading-relaxed">
              Sign out and sign back in, then reload this admin page.
              The Users tab will now show <strong className="text-white/70">all profiles from every country</strong> including banned and inactive ones.
              All profile edits, bans and deletions will also work correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Alerts Tab ────────────────────────────────────────────────────────────────
type AlertItem = { id: string; level: "critical" | "warning" | "info"; title: string; detail: string; icon: React.ReactNode; action?: string };

const AlertsTab = ({ alerts, dbConnected }: { alerts: AlertItem[]; dbConnected: boolean }) => {
  const criticals = alerts.filter(a => a.level === "critical");
  const warnings  = alerts.filter(a => a.level === "warning");
  const infos     = alerts.filter(a => a.level === "info");

  const color = (level: AlertItem["level"]) => ({
    critical: "bg-red-500/15 border-red-500/30 text-red-400",
    warning:  "bg-orange-500/15 border-orange-500/30 text-orange-400",
    info:     "bg-blue-500/15 border-blue-500/30 text-blue-400",
  }[level]);

  const iconBg = (level: AlertItem["level"]) => ({
    critical: "bg-red-500/20 text-red-400",
    warning:  "bg-orange-500/20 text-orange-400",
    info:     "bg-blue-500/20 text-blue-400",
  }[level]);

  return (
    <div className="space-y-4">
      {/* DB Status */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${ dbConnected ? "bg-green-500/15 border-green-500/30" : "bg-red-500/15 border-red-500/30" }`}>
        {dbConnected ? <Wifi className="w-5 h-5 text-green-400" /> : <WifiOff className="w-5 h-5 text-red-400" />}
        <div>
          <p className={`font-bold text-sm ${ dbConnected ? "text-green-300" : "text-red-300" }`}>
            {dbConnected ? "Supabase Connected" : "Database Offline"}
          </p>
          <p className={`text-xs ${ dbConnected ? "text-green-400/80" : "text-red-400/80" }`}>
            {dbConnected ? "All services operational" : "Check Supabase credentials in .env.local"}
          </p>
        </div>
        <span className={`ml-auto w-2.5 h-2.5 rounded-full ${ dbConnected ? "bg-green-400 animate-pulse" : "bg-red-400" }`} />
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-3 text-center">
          <p className="text-red-400 font-bold text-xl">{criticals.length}</p>
          <p className="text-red-400/70 text-[10px] font-medium">Critical</p>
        </div>
        <div className="bg-orange-500/15 border border-orange-500/30 rounded-xl p-3 text-center">
          <p className="text-orange-400 font-bold text-xl">{warnings.length}</p>
          <p className="text-orange-400/70 text-[10px] font-medium">Warnings</p>
        </div>
        <div className="bg-blue-500/15 border border-blue-500/30 rounded-xl p-3 text-center">
          <p className="text-blue-400 font-bold text-xl">{infos.length}</p>
          <p className="text-blue-400/70 text-[10px] font-medium">Info</p>
        </div>
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-white font-semibold text-base">All Systems Operational</p>
          <p className="text-white/40 text-sm mt-1">No issues detected</p>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-2xl border ${color(alert.level)}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg(alert.level)}`}>
                {alert.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{alert.title}</p>
                <p className="text-xs mt-0.5 opacity-80">{alert.detail}</p>
                {alert.action && <p className="text-[10px] mt-1 font-medium opacity-70">→ {alert.action}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const AdminPage = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [superLikesCount, setSuperLikesCount] = useState(0);
  const [whatsappLeadsCount, setWhatsappLeadsCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [sortField, setSortField] = useState<"name" | "created_at" | "last_seen_at">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Dev bypass — skip role check but still require Supabase session for writes
      if (import.meta.env.DEV) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) setNeedsLogin(true);
        setIsAdmin(true);
        try { await loadData(); } catch (_) {}
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/"); return; }

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      if (!roles?.some((r: any) => r.role === "admin")) {
        toast.error("Access denied — admin only");
        navigate("/");
        return;
      }
      setIsAdmin(true);
      await loadData();
      setLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdminLogin = async () => {
    setLoginLoading(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) {
      setLoginError(error.message);
    } else {
      setNeedsLogin(false);
      toast.success("Signed in — saves will now work ✓");
    }
    setLoginLoading(false);
  };

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [profilesRes, paymentsRes, likesRes, leadsRes, reportsRes] = await Promise.all([
        supabase.from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10000),
        supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(1000),
        supabase.from("likes").select("id, is_rose", { count: "exact" }),
        (supabase.from as any)("whatsapp_leads").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("id", { count: "exact", head: true }),
      ]);
      if (profilesRes.data) { setProfiles(profilesRes.data as unknown as AdminProfile[]); setDbConnected(true); }
      if (paymentsRes.data) setPayments(paymentsRes.data as Payment[]);
      if (likesRes.data) {
        setLikesCount(likesRes.data.length);
        setSuperLikesCount(likesRes.data.filter((l: any) => l.is_rose).length);
      }
      if (leadsRes.count !== null) setWhatsappLeadsCount(leadsRes.count);
      if (reportsRes.count !== null) setReportsCount(reportsRes.count);
    } catch (_) {
      setDbConnected(false);
    }
    setRefreshing(false);
  };

  // Auto-refresh overview every 60 seconds
  useEffect(() => {
    const id = setInterval(() => { if (!refreshing) loadData(); }, 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing]);

  // ── Revenue calcs ────────────────────────────────────────────────
  const revTotal  = rev(payments);
  const revToday  = rev(payments, startOf("day"));
  const revWeek   = rev(payments, startOf("week"));
  const revMonth  = rev(payments, startOf("month"));

  // Last 7 days chart data
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d); nextDay.setDate(d.getDate() + 1);
      const dayRev = payments
        .filter(p => p.status === "paid" && new Date(p.created_at) >= d && new Date(p.created_at) < nextDay)
        .reduce((s, p) => s + p.amount_cents, 0) / 100;
      const label = d.toLocaleDateString("en", { weekday: "short" }).slice(0, 2);
      return { label, value: dayRev };
    });
  }, [payments]);

  const last7Signups = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d); nextDay.setDate(d.getDate() + 1);
      const count = profiles.filter(p => new Date(p.created_at) >= d && new Date(p.created_at) < nextDay).length;
      const label = d.toLocaleDateString("en", { weekday: "short" }).slice(0, 2);
      return { label, value: count };
    });
  }, [profiles]);

  // Revenue by product type (WhatsApp unlock = has target_user_id, features = no target_user_id)
  const whatsappRev = payments.filter(p => p.status === "paid" && p.target_user_id).reduce((s, p) => s + p.amount_cents, 0) / 100;
  const featureRev  = payments.filter(p => p.status === "paid" && !p.target_user_id).reduce((s, p) => s + p.amount_cents, 0) / 100;

  // ── User stats ───────────────────────────────────────────────────
  const activeCount    = profiles.filter(p => p.is_active && !p.is_banned).length;
  const bannedCount    = profiles.filter(p => p.is_banned).length;
  const hiddenCount    = profiles.filter(p => p.hidden_until && new Date(p.hidden_until) > new Date()).length;
  const spotlightCount = profiles.filter(p => p.is_spotlight).length;
  const onlineNow      = profiles.filter(p => isOnlineNow(p.last_seen_at)).length;
  const newToday       = profiles.filter(p => isNewToday(p.created_at)).length;
  const verifiedCount  = profiles.filter(p => (p as any).is_verified).length;
  const pendingVerifyCount2 = profiles.filter((p: any) => p.verification_status === "pending").length;

  // Feature revenue breakdown
  const featureRevByType = useMemo(() => {
    const map: Record<string, number> = {};
    payments.filter(p => p.status === "paid" && !p.target_user_id).forEach(p => {
      const key = (p as any).feature_id || "other";
      map[key] = (map[key] || 0) + p.amount_cents / 100;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [payments]);

  // Per-package revenue + purchase count breakdown
  const packageBreakdown = useMemo(() => {
    const meta: Record<string, { label: string; colorBar: string; colorText: string; emoji: string }> = {
      vip:       { label: "VIP Monthly",      colorBar: "bg-amber-400",   colorText: "text-amber-400",   emoji: "👑" },
      boost:     { label: "Profile Boost",    colorBar: "bg-pink-400",    colorText: "text-pink-400",    emoji: "🚀" },
      superlike: { label: "Super Like",       colorBar: "bg-rose-400",    colorText: "text-rose-400",    emoji: "⭐" },
      verified:  { label: "Verification",     colorBar: "bg-sky-400",     colorText: "text-sky-400",     emoji: "✅" },
      incognito: { label: "Incognito",        colorBar: "bg-slate-400",   colorText: "text-slate-400",   emoji: "👁️" },
      spotlight: { label: "Spotlight",        colorBar: "bg-yellow-400",  colorText: "text-yellow-400",  emoji: "🔦" },
      plusone:   { label: "Plus One",         colorBar: "bg-emerald-400", colorText: "text-emerald-400", emoji: "👫" },
      whatsapp:  { label: "WhatsApp Unlock",  colorBar: "bg-green-400",   colorText: "text-green-400",   emoji: "💬" },
      other:     { label: "Other",            colorBar: "bg-white/30",    colorText: "text-white/50",    emoji: "📦" },
    };
    const map: Record<string, { revenue: number; count: number } & typeof meta[string]> = {};
    payments.filter(p => p.status === "paid").forEach(p => {
      const key = p.target_user_id ? "whatsapp" : ((p as any).feature_id || "other");
      if (!map[key]) map[key] = { ...(meta[key] ?? { label: key, colorBar: "bg-white/30", colorText: "text-white/50", emoji: "📦" }), revenue: 0, count: 0 };
      map[key].revenue += p.amount_cents / 100;
      map[key].count += 1;
    });
    return Object.entries(map).map(([id, d]) => ({ id, ...d })).sort((a, b) => b.revenue - a.revenue);
  }, [payments]);

  // Failed / pending Stripe payments with customer details
  const failedPayments = useMemo(() => {
    const stageMap: Record<string, string> = {
      pending:  "Checkout opened — not completed",
      failed:   "Card declined / payment failed",
      expired:  "Session expired (cart abandoned)",
      canceled: "User canceled at checkout",
    };
    return payments
      .filter(p => p.status !== "paid")
      .map(p => {
        const profile = profiles.find(u => u.id === p.user_id);
        return {
          ...p,
          customerName:      profile?.name     ?? "Unknown User",
          customerWhatsApp:  profile?.whatsapp ?? "—",
          customerCountry:   profile?.country  ?? "—",
          stage:             stageMap[p.status] ?? `Status: ${p.status}`,
          packageLabel:      p.target_user_id   ? "WhatsApp Unlock" : ((p as any).feature_id ?? "Premium Feature"),
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [payments, profiles]);

  // Country breakdown (all countries, with online count per country)
  const countryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    const online: Record<string, number> = {};
    profiles.forEach(p => {
      const c = p.country || "Unknown";
      totals[c] = (totals[c] || 0) + 1;
      if (isOnlineNow(p.last_seen_at)) online[c] = (online[c] || 0) + 1;
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([country, count]) => ({ country, count, onlineNow: online[country] || 0 }));
  }, [profiles]);

  // ── Filtered + sorted users ──────────────────────────────────────
  const filteredProfiles = useMemo(() => {
    let list = profiles.filter(p => {
      const q = search.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !(p.country ?? "").toLowerCase().includes(q) && !p.whatsapp.includes(q) && !(p.city ?? "").toLowerCase().includes(q) && !(p.bio ?? "").toLowerCase().includes(q)) return false;
      if (userFilter === "active")    return p.is_active && !p.is_banned;
      if (userFilter === "banned")    return p.is_banned;
      if (userFilter === "hidden")    return !!(p.hidden_until && new Date(p.hidden_until) > new Date());
      if (userFilter === "spotlight") return p.is_spotlight;
      if (userFilter === "mock")      return !!p.is_mock;
      return true;
    });
    list = [...list].sort((a, b) => {
      const va = (a as any)[sortField] ?? "";
      const vb = (b as any)[sortField] ?? "";
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [profiles, search, userFilter, sortField, sortDir]);

  const mockCount     = useMemo(() => profiles.filter(p => p.is_mock).length, [profiles]);

  const filterCounts = useMemo(() => ({
    all:       profiles.length,
    active:    profiles.filter(p => p.is_active && !p.is_banned).length,
    banned:    profiles.filter(p => p.is_banned).length,
    hidden:    profiles.filter(p => !!(p.hidden_until && new Date(p.hidden_until) > new Date())).length,
    spotlight: profiles.filter(p => p.is_spotlight).length,
    mock:      profiles.filter(p => !!p.is_mock).length,
  }), [profiles]);

  // ── App Alerts computation ───────────────────────────────────────
  const appAlerts = useMemo((): AlertItem[] => {
    const list: AlertItem[] = [];
    if (!dbConnected) list.push({ id: "db", level: "critical", title: "Database Offline", detail: "Supabase is not responding. All data fetching and saving is broken.", icon: <WifiOff className="w-4 h-4" />, action: "Add real credentials to .env.local and restart dev server" });
    if (reportsCount > 0) list.push({ id: "reports", level: "critical", title: `${reportsCount} User Reports Pending`, detail: "Users have reported content or accounts that need review.", icon: <AlertCircle className="w-4 h-4" />, action: "Review reports in Supabase dashboard" });
    const pendingVerify = profiles.filter((p: any) => p.verification_status === "pending").length;
    if (pendingVerify > 0) list.push({ id: "verify", level: "warning", title: `${pendingVerify} ID Verifications Pending`, detail: "Users are waiting for identity verification approval.", icon: <UserCheck className="w-4 h-4" />, action: "Go to Verify tab to approve or reject" });
    const countryOverridePending = profiles.filter(p => p.country_override_requested && !p.country_override_approved).length;
    if (countryOverridePending > 0) list.push({ id: "country_override", level: "warning", title: `${countryOverridePending} Country Override Request${countryOverridePending > 1 ? "s" : ""} Pending`, detail: "Users want to list their profile in a country different from their phone prefix. Review in Users tab.", icon: <MapPin className="w-4 h-4" />, action: "Open user → Actions → Approve Country Override" });
    const failedPaymentsCount = payments.filter(p => p.status !== "paid").length;
    if (failedPaymentsCount > 0) list.push({ id: "payments", level: "warning", title: `${failedPaymentsCount} Failed / Pending Payments`, detail: "Some payment transactions did not complete successfully.", icon: <CreditCard className="w-4 h-4" />, action: "Check Income tab for customer details" });
    const noAvatarCount = profiles.filter(p => !p.avatar_url).length;
    if (noAvatarCount > 5) list.push({ id: "avatars", level: "warning", title: `${noAvatarCount} Profiles Without Photos`, detail: "These users have no profile image and will not appear attractive to matches.", icon: <Image className="w-4 h-4" />, action: "Upload images via Users tab or contact users" });
    const bannedCount2 = profiles.filter(p => p.is_banned).length;
    if (bannedCount2 > 10) list.push({ id: "bans", level: "warning", title: `High Ban Rate: ${bannedCount2} Banned Users`, detail: "A large number of users are currently banned.", icon: <Ban className="w-4 h-4" />, action: "Review ban reasons and ensure policies are clear" });
    if (profiles.length > 0 && dbConnected) list.push({ id: "health", level: "info", title: `${profiles.length} Total Users in Database`, detail: `${profiles.filter(p => p.is_active && !p.is_banned).length} active · ${profiles.filter(p => isOnlineNow(p.last_seen_at)).length} online now`, icon: <Activity className="w-4 h-4" /> });
    if (payments.filter(p => p.status === "paid").length > 0) list.push({ id: "revenue", level: "info", title: "Stripe Payments Active", detail: `${payments.filter(p => p.status === "paid").length} successful transactions totalling ${fmtRev(rev(payments))}`, icon: <CreditCard className="w-4 h-4" /> });
    return list;
  }, [dbConnected, reportsCount, profiles, payments]);

  const alertsBadge = appAlerts.filter(a => a.level === "critical" || a.level === "warning").length;

  // ── Actions ──────────────────────────────────────────────────────
  const rlsErr = (err: { message?: string; code?: string }) => {
    const isRls = err.message?.toLowerCase().includes("policy") ||
                  err.message?.toLowerCase().includes("violates") ||
                  err.code === "42501";
    toast.error(
      isRls
        ? "RLS blocked this action. Go to Admin \u2192 Setup tab and run all 4 SQL steps in Supabase."
        : err.message ?? "Unknown error",
      { duration: isRls ? 7000 : 4000 }
    );
  };

  const handleBan = async (userId: string, ban: boolean) => {
    setActionLoading(userId);
    const { error } = await supabase.from("profiles").update({ is_banned: ban }).eq("id", userId);
    if (error) rlsErr(error);
    else {
      toast.success(ban ? `User banned` : `User unbanned`);
      setProfiles(p => p.map(u => u.id === userId ? { ...u, is_banned: ban } : u));
      if (selectedUser?.id === userId) setSelectedUser(u => u ? { ...u, is_banned: ban } : u);
    }
    setActionLoading(null);
  };

  const handleDelete = async (userId: string) => {
    setActionLoading(userId);
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) { rlsErr(error); setActionLoading(null); return; }
    else {
      toast.success("Account deleted");
      setProfiles(p => p.filter(u => u.id !== userId));
    }
    setActionLoading(null);
  };

  const handleSpotlight = async (userId: string, on: boolean) => {
    setActionLoading(userId);
    const spotlight_until = on ? new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() : null;
    const { error } = await (supabase.from("profiles").update as any)({ is_spotlight: on, spotlight_until }).eq("id", userId);
    if (error) rlsErr(error);
    else {
      toast.success(on ? "Spotlight activated (7 days)" : "Spotlight removed");
      setProfiles(p => p.map(u => u.id === userId ? { ...u, is_spotlight: on } : u));
      if (selectedUser?.id === userId) setSelectedUser(u => u ? { ...u, is_spotlight: on } : u);
    }
    setActionLoading(null);
  };

  const handleReactivate = async (userId: string) => {
    setActionLoading(userId);
    const { error } = await supabase.from("profiles").update({ hidden_until: null, is_active: true }).eq("id", userId);
    if (error) rlsErr(error);
    else {
      toast.success("Profile reactivated");
      setProfiles(p => p.map(u => u.id === userId ? { ...u, hidden_until: null, is_active: true } : u));
    }
    setActionLoading(null);
  };

  const handleMock = async (userId: string, mock: boolean) => {
    setActionLoading(userId);
    const { error } = await (supabase.from("profiles").update as any)({ is_mock: mock }).eq("id", userId);
    if (error) rlsErr(error);
    else {
      toast.success(mock ? "Marked as mock profile" : "Removed mock flag");
      setProfiles(p => p.map(u => u.id === userId ? { ...u, is_mock: mock } : u));
      if (selectedUser?.id === userId) setSelectedUser(u => u ? { ...u, is_mock: mock } : u);
    }
    setActionLoading(null);
  };

  const handleApproveCountryOverride = async (userId: string) => {
    const { error } = await (supabase.from("profiles").update as any)({
      country_override_approved: true,
      country_override_requested: false,
    }).eq("id", userId);
    if (error) rlsErr(error);
    else {
      toast.success("Country override approved ✓");
      setProfiles(p => p.map(u => u.id === userId ? { ...u, country_override_approved: true, country_override_requested: false } : u));
      setSelectedUser(u => u && u.id === userId ? { ...u, country_override_approved: true, country_override_requested: false } : u);
    }
  };

  const handleEditProfile = async (userId: string, updates: Partial<AdminProfile>) => {
    const { data, error } = await (supabase.from("profiles").update as any)(updates).eq("id", userId).select("id");
    if (error) {
      rlsErr(error);
    } else if (!data || data.length === 0) {
      toast.error("Save blocked by database policy — please log in as admin first, then retry.");
    } else {
      toast.success("Profile updated ✓");
      setProfiles(p => p.map(u => u.id === userId ? { ...u, ...updates } : u));
      setSelectedUser(u => u && u.id === userId ? { ...u, ...updates } : u);
    }
  };

  const handleUploadImages = async (userId: string, files: File[]) => {
    setActionLoading(`upload-images:${userId}`);
    try {
      if (files.length !== 2) throw new Error("Please select exactly 2 images");

      const toPayload = async (file: File) => {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.onload = () => {
            const res = String(reader.result || "");
            const comma = res.indexOf(",");
            resolve(comma >= 0 ? res.slice(comma + 1) : res);
          };
          reader.readAsDataURL(file);
        });

        const extFromName = file.name.split(".").pop()?.toLowerCase();
        const ext = extFromName && /^[a-z0-9]+$/.test(extFromName) ? extFromName : "png";
        return { base64, contentType: file.type || "image/png", ext };
      };

      const images = await Promise.all(files.map(toPayload));
      const { data, error } = await supabase.functions.invoke("admin-upload-profile-images", {
        body: { targetUserId: userId, images },
      });

      if (error) throw error;
      if (!data?.success) throw new Error("Upload failed");

      toast.success("Images uploaded");
      setProfiles((p) => p.map((u) => (u.id === userId ? { ...u, avatar_url: data.avatar_url } : u)));
      setSelectedUser((u) => (u && u.id === userId ? { ...u, avatar_url: data.avatar_url } : u));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setActionLoading(null);
    }
  };

  // ── CSV Export ───────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["ID", "Name", "Age", "Gender", "Country", "City", "WhatsApp", "Looking For", "Active", "Banned", "Spotlight", "Joined", "Last Seen"];
    const rows = filteredProfiles.map(p => [
      p.id, p.name, p.age, p.gender, p.country, p.city || "", p.whatsapp, p.looking_for,
      p.is_active, p.is_banned, p.is_spotlight,
      new Date(p.created_at).toLocaleDateString(),
      p.last_seen_at ? new Date(p.last_seen_at).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "2DateMe_users.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredProfiles.length} users`);
  };

  const sortToggle = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading || !isAdmin) return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
        <Shield className="w-6 h-6 text-white animate-pulse" />
      </div>
      <p className="text-white/40 text-sm font-medium">Loading Admin Dashboard…</p>
    </div>
  );

  // ── Login overlay (no session) ───────────────────────────────────
  if (needsLogin) return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-6">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
        <Shield className="w-6 h-6 text-white" />
      </div>
      <p className="text-white font-bold text-lg">Admin Login Required</p>
      <p className="text-white/50 text-sm text-center">Sign in with your admin account to enable saves</p>
      <div className="w-full max-w-sm space-y-3">
        <input
          type="email" placeholder="Admin email" value={loginEmail}
          onChange={e => setLoginEmail(e.target.value)}
          className="w-full h-12 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 text-sm outline-none focus:border-pink-500"
        />
        <input
          type="password" placeholder="Password" value={loginPassword}
          onChange={e => setLoginPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
          className="w-full h-12 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 text-sm outline-none focus:border-pink-500"
        />
        {loginError && <p className="text-red-400 text-xs px-1">{loginError}</p>}
        <button
          onClick={handleAdminLogin} disabled={loginLoading || !loginEmail || !loginPassword}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm disabled:opacity-50"
        >
          {loginLoading ? "Signing in…" : "Sign In"}
        </button>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────
  const pendingVerifyCount = profiles.filter((p: any) => (p as any).verification_status === "pending").length;

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "overview", label: "Overview",            icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: "users",    label: `Users`,               icon: <Users className="w-3.5 h-3.5" />, badge: profiles.length },
    { id: "income",   label: "Income",              icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: "alerts",   label: "Alerts",              icon: <Bell className="w-3.5 h-3.5" />, badge: alertsBadge || undefined },
    { id: "verify",   label: "Verify",              icon: <UserCheck className="w-3.5 h-3.5" />, badge: pendingVerifyCount || undefined },
    { id: "setup",    label: "Setup",               icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#0a0a0a]/95 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Admin Dashboard</span>
          </div>
          {alertsBadge > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{alertsBadge}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dbConnected ? "bg-green-400" : "bg-red-400"}`} />
          <span className="text-[10px] text-white/40 font-medium">{dbConnected ? "Live" : "Offline"}</span>
          <button
            onClick={loadData}
            className={`w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-colors ${refreshing ? "animate-spin" : ""}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex px-3 pt-3 gap-1 flex-shrink-0 bg-[#0a0a0a] border-b border-white/8 pb-3">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-all relative ${
              tab === t.id
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                : "bg-white/8 text-white/50 hover:bg-white/12 hover:text-white/70"
            }`}
          >
            {t.icon}{t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full text-[8px] font-bold flex items-center justify-center px-0.5 ${tab === t.id ? "bg-white text-pink-600" : "bg-pink-500 text-white"}`}>
                {t.badge > 99 ? "99+" : t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ══ OVERVIEW TAB ══════════════════════════════════════════ */}
        {tab === "overview" && (
          <>
            {/* Alerts banner if issues */}
            {alertsBadge > 0 && (
              <button onClick={() => setTab("alerts")} className="w-full flex items-center gap-3 p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-left">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-400 font-semibold text-sm">{alertsBadge} issue{alertsBadge > 1 ? "s" : ""} need attention</p>
                  <p className="text-red-400/70 text-xs">Tap to view alerts →</p>
                </div>
              </button>
            )}

            {/* Revenue cards */}
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">💰 Revenue</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Today",      value: fmtRev(revToday),  sub: `${payments.filter(p => p.status === "paid" && new Date(p.created_at) >= startOf("day")).length} txns`, bg: "bg-green-500/15 border-green-500/30", val: "text-green-400" },
                  { label: "This Week",  value: fmtRev(revWeek),   sub: "since Monday",   bg: "bg-emerald-500/15 border-emerald-500/30", val: "text-emerald-400" },
                  { label: "This Month", value: fmtRev(revMonth),  sub: "since 1st",      bg: "bg-teal-500/15 border-teal-500/30", val: "text-teal-400" },
                  { label: "All Time",   value: fmtRev(revTotal),  sub: `${payments.filter(p => p.status === "paid").length} payments`, bg: "bg-pink-500/15 border-pink-500/30", val: "text-pink-400" },
                ].map(({ label, value, sub, bg, val }) => (
                  <div key={label} className={`border rounded-2xl p-3 shadow-sm ${bg}`}>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider">{label}</p>
                    <p className={`font-bold text-2xl mt-0.5 ${val}`}>{value}</p>
                    <p className="text-white/30 text-[9px] mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue by product */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-3">Revenue by Product</p>
              <div className="flex gap-3">
                <div className="flex-1 text-center bg-green-500/15 border border-green-500/25 rounded-xl p-3">
                  <MessageSquare className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <p className="text-green-400 font-bold text-lg">{fmtRev(whatsappRev)}</p>
                  <p className="text-white/30 text-[9px]">WhatsApp Unlocks</p>
                </div>
                <div className="flex-1 text-center bg-amber-500/15 border border-amber-500/25 rounded-xl p-3">
                  <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <p className="text-amber-400 font-bold text-lg">{fmtRev(featureRev)}</p>
                  <p className="text-white/30 text-[9px]">Premium Features</p>
                </div>
              </div>
            </div>

            {/* Feature revenue breakdown */}
            {featureRevByType.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-3">Revenue by Feature</p>
                <div className="space-y-2.5">
                  {featureRevByType.map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-white/60 text-xs capitalize flex-1">{key.replace(/_/g, " ")}</span>
                      <div className="w-24 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" style={{ width: `${(val / (featureRevByType[0]?.[1] || 1)) * 100}%` }} />
                      </div>
                      <span className="text-pink-400 text-xs font-bold w-14 text-right">${val.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7-day revenue chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">Revenue — Last 7 Days</p>
              <BarChart data={last7Days} color="hsl(330,80%,60%)" />
            </div>

            {/* User stats grid */}
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">👥 Users</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Online Now",  value: onlineNow,           bg: "bg-green-500/15 border-green-500/25",   val: "text-green-400",   icon: <Activity className="w-4 h-4" /> },
                  { label: "New Today",   value: newToday,            bg: "bg-blue-500/15 border-blue-500/25",     val: "text-blue-400",    icon: <Calendar className="w-4 h-4" /> },
                  { label: "Active",      value: activeCount,         bg: "bg-pink-500/15 border-pink-500/25",     val: "text-pink-400",    icon: <Users className="w-4 h-4" /> },
                  { label: "Verified",    value: verifiedCount,       bg: "bg-sky-500/15 border-sky-500/25",       val: "text-sky-400",     icon: <BadgeCheck className="w-4 h-4" /> },
                  { label: "ID Pending",  value: pendingVerifyCount2, bg: "bg-orange-500/15 border-orange-500/25", val: "text-orange-400",  icon: <UserCheck className="w-4 h-4" /> },
                  { label: "WA Leads",    value: whatsappLeadsCount,  bg: "bg-emerald-500/15 border-emerald-500/25",val: "text-emerald-400", icon: <MessageSquare className="w-4 h-4" /> },
                  { label: "Banned",      value: bannedCount,         bg: "bg-red-500/15 border-red-500/25",       val: "text-red-400",     icon: <Ban className="w-4 h-4" /> },
                  { label: "Spotlight",   value: spotlightCount,      bg: "bg-amber-500/15 border-amber-500/25",   val: "text-amber-400",   icon: <Star className="w-4 h-4" /> },
                  { label: "Reports",     value: reportsCount,        bg: reportsCount > 0 ? "bg-red-500/15 border-red-500/30" : "bg-white/5 border-white/10", val: reportsCount > 0 ? "text-red-400" : "text-white/40", icon: <AlertTriangle className="w-4 h-4" /> },
                  { label: "Mock Profiles",value: mockCount,           bg: mockCount > 0 ? "bg-purple-500/15 border-purple-500/25" : "bg-white/5 border-white/10", val: mockCount > 0 ? "text-purple-400" : "text-white/40", icon: <Eye className="w-4 h-4" /> },
                ].map(({ label, value, bg, val, icon }) => (
                  <div key={label} className={`border rounded-2xl p-3 text-center ${bg}`}>
                    <span className={`flex justify-center ${val}`}>{icon}</span>
                    <p className={`font-bold text-xl mt-1 ${val}`}>{value}</p>
                    <p className="text-white/30 text-[9px] mt-0.5 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-pink-500/10 border border-pink-500/25 rounded-2xl p-4 text-center">
                <Heart className="w-5 h-5 text-pink-400 mx-auto mb-1" fill="currentColor" />
                <p className="text-pink-400 font-bold text-2xl">{likesCount.toLocaleString()}</p>
                <p className="text-white/30 text-[9px] font-medium mt-0.5">Total Likes</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 text-center">
                <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" fill="currentColor" />
                <p className="text-amber-400 font-bold text-2xl">{superLikesCount.toLocaleString()}</p>
                <p className="text-white/30 text-[9px] font-medium mt-0.5">Super Likes</p>
              </div>
            </div>

            {/* Signups chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">New Signups — Last 7 Days</p>
              <BarChart data={last7Signups} color="hsl(174,72%,40%)" />
            </div>

            {/* Top countries */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-3">
                <Globe className="w-3.5 h-3.5 inline mr-1" />Top Countries
              </p>
              <div className="space-y-2.5">
                {countryBreakdown.slice(0, 10).map(({ country, count, onlineNow: cOnline }) => (
                  <div key={country} className="flex items-center gap-2">
                    <span className="text-white/70 text-xs w-24 truncate font-medium">{country}</span>
                    <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" style={{ width: `${(count / profiles.length) * 100}%` }} />
                    </div>
                    <span className="text-white/40 text-[10px] w-6 text-right font-medium">{count}</span>
                    {cOnline > 0 && <span className="text-green-400 text-[10px] w-10 text-right font-bold">●{cOnline}</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══ USERS TAB ═════════════════════════════════════════════ */}
        {tab === "users" && (
          <>
            {/* Search + export */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Name, country, WhatsApp..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-9 text-sm"
                />
              </div>
              <button onClick={exportCSV} className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-medium">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>

            {/* Filter chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(["all", "active", "banned", "hidden", "spotlight", "mock"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setUserFilter(f)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all capitalize flex items-center gap-1 ${
                    userFilter === f
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                      : "bg-white/5 border border-white/10 text-white/50 hover:border-white/25"
                  }`}
                >
                  {f}
                  <span className={`rounded-full px-1 min-w-[16px] text-center text-[9px] font-black ${
                    userFilter === f ? "bg-white/25 text-white" : "bg-white/8 text-white/40"
                  }`}>{filterCounts[f]}</span>
                </button>
              ))}
            </div>

            {/* Sort bar */}
            <div className="flex gap-2 text-[10px] text-white/40 items-center">
              <span className="font-medium">Sort:</span>
              {(["name", "created_at", "last_seen_at"] as const).map(f => (
                <button key={f} onClick={() => sortToggle(f)}
                  className={`flex items-center gap-0.5 font-semibold ${sortField === f ? "text-pink-400" : "hover:text-white/60"}`}>
                  {f === "name" ? "Name" : f === "created_at" ? "Joined" : "Last Seen"}
                  {sortField === f && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
              ))}
              <span className="ml-auto text-white/25 font-medium">{filteredProfiles.length} shown</span>
            </div>

            {/* User rows */}
            {filteredProfiles.map((profile, i) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.3) }}
                onClick={() => setSelectedUser(profile)}
                className="bg-white/5 border border-white/8 rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/8 hover:border-white/15 transition-all active:scale-[0.99]"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-white/10" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-white/40" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white font-semibold text-sm truncate">{profile.name}, {profile.age}</p>
                    {profile.is_banned && <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">Ban</Badge>}
                    {profile.is_spotlight && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-amber-500 border-0 text-white">⭐</Badge>}
                    {profile.is_mock && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-purple-500 border-0 text-white">Mock</Badge>}
                    {isOnlineNow(profile.last_seen_at) && <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
                  </div>
                  <p className="text-white/40 text-[10px] truncate">{profile.gender} · {profile.country || "Unknown"} · {profile.whatsapp}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-white/20 flex-shrink-0 -rotate-90" />
              </motion.div>
            ))}

            {filteredProfiles.length === 0 && (
              <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">No users match this filter</p>
              </div>
            )}
          </>
        )}

        {/* ══ INCOME TAB ════════════════════════════════════════════ */}
        {tab === "income" && (
          <>
            {/* All-time hero card */}
            <div className="bg-gradient-to-br from-green-600/80 to-emerald-700/80 border border-green-500/30 rounded-2xl p-5 text-center text-white">
              <TrendingUp className="w-6 h-6 mx-auto mb-1 opacity-80" />
              <p className="text-green-100 text-xs font-medium">All-Time Revenue</p>
              <p className="font-bold text-4xl mt-1">{fmtRev(revTotal)}</p>
              <p className="text-green-200 text-[10px] mt-2">{payments.filter(p => p.status === "paid").length} completed · {payments.filter(p => p.status !== "paid").length} pending/failed</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Today", value: fmtRev(revToday), bg: "bg-blue-500/15 border-blue-500/30", val: "text-blue-400" },
                { label: "This Month", value: fmtRev(revMonth), bg: "bg-violet-500/15 border-violet-500/30", val: "text-violet-400" },
              ].map(({ label, value, bg, val }) => (
                <div key={label} className={`border rounded-2xl p-4 text-center ${bg}`}>
                  <p className="text-white/40 text-[9px] font-bold uppercase">{label}</p>
                  <p className={`font-bold text-2xl mt-1 ${val}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* 7-day chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">Daily Revenue (7d)</p>
              <BarChart data={last7Days} color="hsl(142,71%,45%)" />
            </div>

            {/* ── Package popularity breakdown ─────────────────── */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Package Revenue &amp; Popularity</p>
                <span className="text-white/25 text-[10px]">{packageBreakdown.reduce((s, p) => s + p.count, 0)} sales</span>
              </div>
              {packageBreakdown.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-4">No paid transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {packageBreakdown.map((pkg, i) => {
                    const maxRev = packageBreakdown[0].revenue;
                    const maxCount = Math.max(...packageBreakdown.map(p => p.count));
                    return (
                      <div key={pkg.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base leading-none">{pkg.emoji}</span>
                            <span className={`font-semibold text-xs ${pkg.colorText}`}>{pkg.label}</span>
                            {i === 0 && <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-1.5 py-0.5 font-bold">TOP</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white/40 text-[10px]">{pkg.count}×</span>
                            <span className={`font-bold text-sm ${pkg.colorText}`}>{fmtRev(pkg.revenue)}</span>
                          </div>
                        </div>
                        {/* Revenue bar */}
                        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${pkg.colorBar} rounded-full transition-all duration-700`}
                            style={{ width: `${(pkg.revenue / maxRev) * 100}%` }}
                          />
                        </div>
                        {/* Purchase count bar */}
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${pkg.colorBar} opacity-40 rounded-full transition-all duration-700`}
                            style={{ width: `${(pkg.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Split legend */}
              {revTotal > 0 && (
                <div className="pt-2 border-t border-white/8 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-green-400" style={{ width: `${(whatsappRev / revTotal) * 100}%` }} />
                    <div className="bg-amber-400 flex-1" />
                  </div>
                  <span className="text-green-400 text-[10px] font-semibold whitespace-nowrap">💬 {fmtRev(whatsappRev)}</span>
                  <span className="text-amber-400 text-[10px] font-semibold whitespace-nowrap">⚡ {fmtRev(featureRev)}</span>
                </div>
              )}
            </div>

            {/* ── Failed / incomplete payments ─────────────────── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Failed &amp; Incomplete Payments
                </p>
                {failedPayments.length > 0 && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5 font-bold">
                    {failedPayments.length} issues
                  </span>
                )}
              </div>
              {failedPayments.length === 0 ? (
                <div className="text-center py-8 bg-green-500/8 border border-green-500/15 rounded-2xl">
                  <CheckCircle2 className="w-7 h-7 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 text-sm font-semibold">All payments successful</p>
                  <p className="text-white/30 text-[11px] mt-0.5">No failed or abandoned checkouts</p>
                </div>
              ) : (
                failedPayments.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.4) }}
                    className="bg-red-500/8 border border-red-500/20 rounded-2xl p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{p.customerName}</p>
                          <p className="text-white/50 text-[10px]">{p.customerCountry}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-red-400 font-bold text-sm">${(p.amount_cents / 100).toFixed(2)}</p>
                        <p className="text-white/30 text-[9px]">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className="bg-white/5 rounded-xl p-2">
                        <p className="text-white/30 mb-0.5">Package</p>
                        <p className="text-white/80 font-semibold">{p.packageLabel}</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2">
                        <p className="text-white/30 mb-0.5">WhatsApp</p>
                        <p className="text-white/80 font-semibold">{p.customerWhatsApp}</p>
                      </div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/15 rounded-xl px-3 py-2 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-300/80 text-[10px] leading-snug">{p.stage}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* ── All transactions (compact) ───────────────────── */}
            <div className="space-y-2">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">All Transactions</p>
              {payments.map((payment, i) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.012, 0.3) }}
                  className="bg-white/5 border border-white/8 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${payment.status === "paid" ? (payment.target_user_id ? "bg-green-500/20" : "bg-amber-500/20") : "bg-red-500/15"}`}>
                      {payment.status !== "paid"
                        ? <AlertCircle className="w-4 h-4 text-red-400" />
                        : payment.target_user_id
                          ? <MessageSquare className="w-4 h-4 text-green-400" />
                          : <Zap className="w-4 h-4 text-amber-400" />
                      }
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">${(payment.amount_cents / 100).toFixed(2)} <span className="text-white/30 text-[10px] font-normal">{payment.currency.toUpperCase()}</span></p>
                      <p className="text-white/40 text-[10px]">
                        {payment.target_user_id ? "WhatsApp Unlock" : ((payment as any).feature_id ?? "Feature")} · {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${payment.status === "paid" ? "bg-green-500/15 text-green-400" : payment.status === "pending" ? "bg-yellow-500/15 text-yellow-400" : "bg-red-500/15 text-red-400"}`}>
                    {payment.status}
                  </span>
                </motion.div>
              ))}
              {payments.length === 0 && (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                  <DollarSign className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-sm">No payments yet</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ ALERTS TAB ════════════════════════════════════════════ */}
        {tab === "alerts" && (
          <AlertsTab alerts={appAlerts} dbConnected={dbConnected} />
        )}

        {/* ══ SETUP TAB ═════════════════════════════════════════════ */}
        {tab === "setup" && (
          <SetupTab />
        )}

        {/* ══ VERIFY TAB ════════════════════════════════════════════ */}
        {tab === "verify" && (
          <VerifyTab profiles={profiles} onApprove={async (id) => {
            await supabase.from("profiles").update({ is_verified: true, verification_status: "approved" } as any).eq("id", id);
            toast.success("Profile verified ✓");
            await loadData();
          }} onReject={async (id) => {
            await supabase.from("profiles").update({ is_verified: false, verification_status: "rejected" } as any).eq("id", id);
            toast.success("Verification rejected");
            await loadData();
          }} />
        )}
      </div>

      {/* User detail drawer */}
      <AnimatePresence>
        {selectedUser && (
          <UserDrawer
            profile={selectedUser}
            onClose={() => setSelectedUser(null)}
            onBan={handleBan}
            onDelete={handleDelete}
            onSpotlight={handleSpotlight}
            onReactivate={handleReactivate}
            onMock={handleMock}
            onEditProfile={handleEditProfile}
            onUploadImages={handleUploadImages}
            onApproveCountryOverride={handleApproveCountryOverride}
            actionLoading={actionLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
