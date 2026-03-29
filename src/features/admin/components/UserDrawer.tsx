import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Shield, Users, Ban, Star, Eye, Trash2, CheckCircle, Image,
  Edit2, Save, MapPin, Plus, Camera, MoveHorizontal, MoveVertical, ZoomIn, ClipboardList,
  Search, X, Heart, BadgeCheck, RefreshCw,
} from "lucide-react";
import { Slider } from "@/shared/components/slider";
import { Badge } from "@/shared/components/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BasicInfoEditor } from "@/features/dating/components/profile-editor/BasicInfoEditor";
import { LifestyleEditor } from "@/features/dating/components/profile-editor/LifestyleEditor";
import { RelationshipGoalsEditor } from "@/features/dating/components/profile-editor/RelationshipGoalsEditor";
import MockGiftSelector from "@/features/gifts/components/MockGiftSelector";
import { FIRST_DATE_IDEAS } from "@/data/firstDateIdeas";
import { AdminProfile } from "../types";
import { DEFAULT_IMG_POS, getDateIdeaCategory, COUNTRIES, OPT, isOnlineNow } from "../utils";

// Inline Gift icon since lucide's Gift may not be imported elsewhere in this file
const Gift = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

// ── Photo Verification Review ─────────────────────────────────────────────────
function PhotoVerificationReview({ profileId, isVerified, onApproved }: { profileId: string; isVerified: boolean; onApproved: () => void }) {
  const [selfies, setSelfies] = React.useState<{ id: string; selfie_url: string; status: string; created_at: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [approving, setApproving] = React.useState(false);

  React.useEffect(() => {
    supabase.from("verification_selfies" as any).select("id, selfie_url, status, created_at")
      .eq("user_id", profileId).order("created_at", { ascending: false }).limit(3)
      .then(({ data }) => { setSelfies((data as any) ?? []); setLoading(false); });
  }, [profileId]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await supabase.from("profiles").update({ photo_verified: true, photo_verified_at: new Date().toISOString() } as any).eq("id", profileId);
      if (selfies[0]) {
        await (supabase.from("verification_selfies" as any).update as any)({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", selfies[0].id);
      }
      onApproved();
      toast.success("Photo verified ✅");
    } catch { toast.error("Failed to approve"); }
    finally { setApproving(false); }
  };

  if (loading) return null;
  if (selfies.length === 0 && !isVerified) return (
    <div className="mt-3 rounded-xl bg-white/5 border border-white/8 px-3 py-2.5 text-white/30 text-xs text-center">No selfies submitted</div>
  );

  return (
    <div className="mt-3 rounded-2xl bg-white/5 border border-white/8 p-3 space-y-2">
      <p className="text-white/50 text-[10px] font-bold uppercase tracking-wide">Photo Verification</p>
      {isVerified && <p className="text-green-400 text-xs font-bold">✅ Already approved</p>}
      <div className="flex gap-2 flex-wrap">
        {selfies.map(s => (
          <img key={s.id} src={s.selfie_url} alt="selfie"
            className="w-16 h-16 rounded-xl object-cover border border-white/10" />
        ))}
      </div>
      {!isVerified && selfies.some(s => s.status === "pending") && (
        <button onClick={handleApprove} disabled={approving}
          className="w-full h-9 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
          <CheckCircle className="w-3.5 h-3.5" />{approving ? "Approving…" : "Approve — Mark Photo Verified"}
        </button>
      )}
    </div>
  );
}

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
  const [drawerTab, setDrawerTab] = useState<"actions" | "edit" | "images" | "details" | "gifts">("actions");
  const [saving, setSaving] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [targetCountries, setTargetCountries] = useState<string[]>(profile.visible_in_countries ?? []);
  const [adminImages, setAdminImages] = useState<string[]>(profile.images ?? []);
  const [adminImgPos, setAdminImgPos] = useState<Array<{ x: number; y: number; zoom: number }>>(
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
  const [residingCountry, setResidingCountry] = useState<string>(profile.residing_country ?? "");
  const [visitedCountries, setVisitedCountries] = useState<string[]>(profile.visited_countries ?? []);
  const [details, setDetails] = useState({
    height_cm: profile.height_cm ?? ("" as number | ""),
    orientation: profile.orientation ?? "",
    interests: profile.interests ?? [] as string[],
    basic_info: { ...(profile.basic_info ?? {}) } as Record<string, any>,
    lifestyle_info: { ...(profile.lifestyle_info ?? {}) } as Record<string, any>,
    relationship_goals: { ...(profile.relationship_goals ?? {}) } as Record<string, any>,
  });
  const toggleMulti = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const saveDetails = async () => {
    setSaving(true);
    const heightStr = details.basic_info.height as string | undefined;
    const parsedHeight = heightStr ? parseInt(heightStr, 10) || null : null;
    await onEditProfile(profile.id, {
      height_cm: parsedHeight,
      orientation: details.orientation || null,
      interests: details.interests.length > 0 ? details.interests : null,
      basic_info: details.basic_info,
      lifestyle_info: details.lifestyle_info,
      relationship_goals: details.relationship_goals,
    } as any);
    setSaving(false);
  };

  const uploading = actionLoading === `upload-images:${profile.id}`;

  const getImgPos = (i: number) => adminImgPos[i] ?? { ...DEFAULT_IMG_POS };
  const updateImgPos = (i: number, field: "x" | "y" | "zoom", val: number) => {
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
      residing_country: residingCountry || null,
      visited_countries: visitedCountries.length > 0 ? visitedCountries : null,
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
              <button onClick={() => setDrawerTab("details")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${drawerTab === "details" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"}`}>
                <ClipboardList className="w-3.5 h-3.5" /> Details
              </button>
              <button onClick={() => setDrawerTab("gifts")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${drawerTab === "gifts" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"}`}>
                <Gift className="w-3.5 h-3.5" /> Gifts
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
                        <img src={img} alt={`Photo ${i + 1}`}
                          className={`w-16 h-16 rounded-xl object-cover border-2 ${i === 0 ? "border-amber-400" : "border-white/15"
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
                      <span className="text-green-400 font-semibold">{profile.mock_online_hours}h {profile.mock_offline_days?.length ? `· offline ${profile.mock_offline_days.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}` : ""}</span>
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

                {/* ── Contact Number ── */}
                <div className="p-3 rounded-2xl space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-white/50 text-xs font-semibold flex items-center gap-1.5">
                      📱 Contact Number
                      {(profile as any).contact_locked && (
                        <span className="text-[9px] bg-amber-500/15 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">🔒 Locked</span>
                      )}
                      {(profile as any).contact_unlock_requested && (
                        <span className="text-[9px] bg-blue-500/15 border border-blue-500/30 text-blue-400 px-1.5 py-0.5 rounded-full font-bold">Unlock Requested</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-xs w-20 flex-shrink-0">{(profile as any).contact_provider || "WhatsApp"}</span>
                    <span className="text-white text-xs font-mono flex-1 truncate">{profile.whatsapp || "—"}</span>
                  </div>
                  {(profile as any).contact_locked ? (
                    <button
                      onClick={async () => {
                        await onEditProfile(profile.id, { contact_locked: false, contact_confirmed: false, contact_unlock_requested: false } as any);
                      }}
                      className="w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-blue-500/15 border border-blue-500/30 text-blue-400 transition-all active:scale-95"
                    >
                      🔓 Unlock Contact for Editing
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] text-green-400/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Editable by user
                    </div>
                  )}
                </div>

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

                {/* Travel Information */}
                <div className="space-y-3 pt-1 border-t border-white/8">
                  <p className="text-white/60 text-xs font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" /> Travel Information
                  </p>
                  <div className="space-y-1">
                    <label className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">Residing Country (if different)</label>
                    <select value={residingCountry} onChange={e => setResidingCountry(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-blue-400/50 transition-colors">
                      <option value="">— Same as country —</option>
                      {COUNTRIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">Visited Countries</label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {visitedCountries.map(c => (
                          <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs">
                            {c}
                            <button onClick={() => setVisitedCountries(prev => prev.filter(x => x !== c))}
                              className="w-3 h-3 rounded-full bg-blue-500/25 hover:bg-blue-500/40 flex items-center justify-center">
                              <X className="w-2 h-2" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <select
                        value=""
                        onChange={e => {
                          if (e.target.value && !visitedCountries.includes(e.target.value)) {
                            setVisitedCountries(prev => [...prev, e.target.value]);
                          }
                          e.target.value = "";
                        }}
                        className="w-full h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-blue-400/50 transition-colors">
                        <option value="">— Add visited country —</option>
                        {COUNTRIES.filter(c => !visitedCountries.includes(c)).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
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
                        {(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const).map((label, idx) => {
                          const active = offlineDays.includes(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setOfflineDays(d =>
                                active ? d.filter(x => x !== idx) : [...d, idx]
                              )}
                              className={`w-10 h-8 rounded-xl text-[11px] font-bold border transition-all active:scale-95 ${active
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
                      { key: "available_tonight", label: "🌙 Free Tonight", color: "purple" },
                      { key: "is_plusone", label: "👫 Plus One", color: "emerald" },
                      { key: "weekend_plans", label: "📅 Weekends", color: "blue" },
                      { key: "late_night_chat", label: "🌃 Late Night Chat", color: "indigo" },
                      { key: "no_drama", label: "✌️ No Drama", color: "green" },
                      { key: "generous_lifestyle", label: "💎 Generous", color: "amber" },
                      { key: "is_incognito", label: "👁️ Incognito", color: "gray" },
                      { key: "is_verified", label: "✅ Verified", color: "sky" },
                      { key: "video_verified", label: "🎥 Video Verified", color: "sky" },
                      { key: "is_spotlight", label: "⭐ Spotlight", color: "yellow" },
                      { key: "is_active", label: "🟢 Active", color: "green" },
                      { key: "is_mock", label: "🎭 Mock Profile", color: "pink" },
                    ] as const).map(({ key, label, color }) => {
                      const val = !!(profile as any)[key];
                      const active = badgeOverrides.hasOwnProperty(key)
                        ? !!(badgeOverrides as any)[key]
                        : val;
                      const colorMap: Record<string, string> = {
                        purple: "bg-purple-500/15 border-purple-500/30 text-purple-400",
                        emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
                        blue: "bg-blue-500/15 border-blue-500/30 text-blue-400",
                        indigo: "bg-indigo-500/15 border-indigo-500/30 text-indigo-400",
                        green: "bg-green-500/15 border-green-500/30 text-green-400",
                        amber: "bg-amber-500/15 border-amber-500/30 text-amber-400",
                        gray: "bg-white/8 border-white/15 text-white/50",
                        sky: "bg-sky-500/15 border-sky-500/30 text-sky-400",
                        yellow: "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
                        pink: "bg-pink-500/15 border-pink-500/30 text-pink-400",
                      };
                      return (
                        <button
                          key={key}
                          onClick={() => setBadgeOverrides(b => ({ ...b, [key]: !active }))}
                          className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold transition-all active:scale-95 ${active
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
                          className={`aspect-square w-full rounded-xl overflow-hidden relative cursor-pointer group border-2 transition-all ${isEditing ? "border-pink-400 shadow-md" : isMain && img ? "border-amber-400" : "border-white/15 hover:border-white/30"
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

                {/* ── Video Verified review ── */}
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-white/70 text-xs font-bold flex items-center gap-1.5">
                      🎥 Video Verification
                    </p>
                    {profile.video_verified && (
                      <span className="text-[10px] bg-sky-500/20 border border-sky-500/30 text-sky-400 rounded-full px-2 py-0.5 font-bold">
                        ✅ Verified {profile.video_verified_at ? new Date(profile.video_verified_at).toLocaleDateString() : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-[10px]">Review profile photos and voice/video intro below, then mark as verified.</p>

                  {/* All profile photos */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {adminImages.filter(Boolean).map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-white/10">
                        <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>

                  {/* Voice/video intro */}
                  {profile.voice_intro_url && (
                    <div className="space-y-1.5">
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-wide">Voice / Video Intro</p>
                      {profile.voice_intro_url.includes(".mp4") || profile.voice_intro_url.includes(".mov") || profile.voice_intro_url.includes(".webm") ? (
                        <video
                          src={profile.voice_intro_url}
                          controls
                          className="w-full rounded-xl border border-white/10 max-h-48 bg-black"
                        />
                      ) : (
                        <audio
                          src={profile.voice_intro_url}
                          controls
                          className="w-full"
                        />
                      )}
                    </div>
                  )}

                  {/* Mark as Video Verified button */}
                  <button
                    disabled={saving || profile.video_verified}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await supabase
                          .from("profiles")
                          .update({ video_verified: true, video_verified_at: new Date().toISOString() } as any)
                          .eq("id", profile.id);
                        toast.success(`${profile.name} marked as Video Verified`);
                      } catch {
                        toast.error("Failed to save");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className={`h-11 w-full rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${profile.video_verified ? "bg-sky-500/20 border border-sky-500/30 text-sky-400 cursor-default" : "bg-sky-500 text-white shadow-md hover:bg-sky-400"}`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {profile.video_verified ? "Already Video Verified" : saving ? "Saving…" : "Mark as Video Verified"}
                  </button>
                </div>

                {/* ── Photo Verification Review ── */}
                <PhotoVerificationReview profileId={profile.id} isVerified={!!profile.photo_verified} onApproved={() => {
                  setProfile((p: any) => p ? { ...p, photo_verified: true } : p);
                }} />

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
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "", label: "Not specified" },
                      { value: "Straight", label: "Straight" },
                      { value: "Gay", label: "Gay" },
                      { value: "Lesbian", label: "Lesbian" },
                      { value: "Bisexual", label: "Bisexual" },
                      { value: "Pansexual", label: "Pansexual" },
                    ].map(o => (
                      <button key={o.value} type="button"
                        onClick={() => setDetails(d => ({ ...d, orientation: o.value }))}
                        className={`py-2 rounded-xl text-xs font-medium border transition-all ${details.orientation === o.value
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
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${on ? "bg-pink-500 border-pink-600 text-white" : "bg-white/5 border-white/10 text-white/50 hover:border-pink-500/40"
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
                  onChange={v => setDetails(d => ({ ...d, basic_info: v as Record<string, any> }))}
                />
                <LifestyleEditor
                  value={details.lifestyle_info as any}
                  onChange={v => setDetails(d => ({ ...d, lifestyle_info: v as Record<string, any> }))}
                />
                <RelationshipGoalsEditor
                  value={details.relationship_goals as any}
                  onChange={v => setDetails(d => ({ ...d, relationship_goals: v as Record<string, any> }))}
                />

                <button onClick={saveDetails} disabled={saving}
                  className="h-12 w-full rounded-2xl text-sm font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-60">
                  <Save className="w-4 h-4" />{saving ? "Saving…" : "Save Profile Details"}
                </button>
              </div>
            )}

            {/* ── GIFTS TAB ─────────────────────────────────────── */}
            {drawerTab === "gifts" && (
              <div className="space-y-3">
                <p className="text-white/40 text-[10px] font-medium">Select up to 5 virtual gifts for this mock profile. These will be the gifts that users can send to this profile.</p>

                {profile.is_mock ? (
                  <MockGiftSelector profileId={profile.id} />
                ) : (
                  <div className="text-center py-8 bg-white/5 border border-white/10 rounded-2xl">
                    <Gift className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-white/40 text-sm">Gift selection is only available for mock profiles</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </>
  );
};

export default UserDrawer;
