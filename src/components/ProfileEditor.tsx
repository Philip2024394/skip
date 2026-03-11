import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, MapPin, Save, Loader2, CalendarHeart, Calendar, Star, ZoomIn, ZoomOut, MoveHorizontal, MoveVertical, Heart, PauseCircle, Moon, Gift, CalendarDays, MoonStar, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import VoiceRecorder from "./VoiceRecorder";
import { FIRST_DATE_IDEAS } from "@/data/firstDateIdeas";
import DatePlacesEditor, { DatePlace } from "./DatePlacesEditor";
import { LANGUAGES, getCountryFlag, getLanguageFlag, getNativeLanguage } from "@/data/languages";
import { HelpCircle, Languages, Plus, X as XIcon } from "lucide-react";
import { PREMIUM_FEATURES } from "@/data/premiumFeatures";
import { BIO_MAX_LENGTH } from "@/lib/constants";
import { sanitizeBio } from "@/utils/bio";
import { BasicInfoEditor } from "@/components/profile-editor/BasicInfoEditor";
import { LifestyleEditor } from "@/components/profile-editor/LifestyleEditor";
import { RelationshipGoalsEditor } from "@/components/profile-editor/RelationshipGoalsEditor";

const GENDERS = ["Male", "Female", "Non-binary", "Other"];
const LOOKING_FOR = ["Men", "Women", "Everyone"];

interface ImagePosition {
  x: number; // 0-100
  y: number; // 0-100
  zoom: number; // 100-300 (percentage scale)
}

const defaultPos: ImagePosition = { x: 50, y: 50, zoom: 100 };

interface ProfileData {
  name: string;
  age: number;
  gender: string;
  looking_for: string;
  country: string;
  city: string;
  bio: string;
  whatsapp: string;
  avatar_url: string | null;
  images: string[];
  latitude: number | null;
  longitude: number | null;
  available_tonight: boolean;
  voice_intro_url: string | null;
  image_positions: ImagePosition[];
  first_date_idea: string | null;
  first_date_places: DatePlace[];
  languages: string[];
  is_plusone: boolean;
  generous_lifestyle: boolean;
  weekend_plans: boolean;
  late_night_chat: boolean;
  no_drama: boolean;
  height_cm: number | null;
  drinking: string;
  smoking: string;
  fitness: string;
  pets: string;
  interests: string[];
  orientation: string;
  basic_info: Record<string, unknown>;
  lifestyle_info: Record<string, unknown>;
  relationship_goals: Record<string, unknown>;
}

const ProfileEditor = () => {
  const navigate = useNavigate();
  const [editorStep, setEditorStep] = useState<"profile" | "details">("profile");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivateDone, setDeactivateDone] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [freeTonightUntil, setFreeTonightUntil] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [schemaHasBadgeColumns, setSchemaHasBadgeColumns] = useState(true);
  const [showBadgesHelp, setShowBadgesHelp] = useState(false);

  // Check if Free Tonight has expired and auto-clear it (runs whenever userId is set)
  useEffect(() => {
    if (!userId) return;
    const stored = localStorage.getItem(`free_tonight_until_${userId}`);
    if (stored) {
      const expiry = new Date(stored);
      if (Date.now() >= expiry.getTime()) {
        // Expired — clear in DB silently
        localStorage.removeItem(`free_tonight_until_${userId}`);
        supabase.from("profiles").update({ available_tonight: false }).eq("id", userId);
        setFreeTonightUntil(null);
      } else {
        setFreeTonightUntil(expiry);
      }
    }
  }, [userId]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSlot, setUploadSlot] = useState<number>(0);
  const [editingImageIdx, setEditingImageIdx] = useState<number | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Use select("*") so we never 400 on missing columns — any column absent
      // from the DB simply won't appear in the result and gets a safe default below.
      let data: Record<string, unknown> | null = null;
      let useBadgeColumns = true;

      const { data: fullData, error: fullError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fullError) {
        // As a last-resort fallback, try only the guaranteed-core columns.
        const coreColumns = "name, age, gender, looking_for, country, city, bio, whatsapp, avatar_url, images, available_tonight";
        const { data: fallbackData } = await supabase
          .from("profiles")
          .select(coreColumns)
          .eq("id", user.id)
          .single();
        data = fallbackData as Record<string, unknown> | null;
        useBadgeColumns = false;
      } else {
        data = fullData as Record<string, unknown>;
      }

      // Build a safe record even if data is null (new account / no row yet)
      const row: Record<string, unknown> = data ?? {};

      const imgs = ((row.images as string[]) || []);
      const positions: ImagePosition[] = ((row.image_positions as ImagePosition[]) || []);
      while (positions.length < imgs.length) positions.push({ ...defaultPos });

      const available_tonight = (row.available_tonight as boolean) || false;
      const is_plusone = (row.is_plusone as boolean) || false;
      const generous_lifestyle = (row.generous_lifestyle as boolean) || false;
      const weekend_plans = (row.weekend_plans as boolean) || false;
      const late_night_chat = (row.late_night_chat as boolean) || false;
      const no_drama = (row.no_drama as boolean) || false;

      const badgePriority: Array<keyof Pick<ProfileData,
        "available_tonight" | "is_plusone" | "generous_lifestyle" | "weekend_plans" | "late_night_chat" | "no_drama"
      >> = ["available_tonight", "is_plusone", "generous_lifestyle", "weekend_plans", "late_night_chat", "no_drama"];

      const badgeState = { available_tonight, is_plusone, generous_lifestyle, weekend_plans, late_night_chat, no_drama };
      const activeBadges = badgePriority.filter((k) => badgeState[k]);
      const keepBadge = activeBadges.length > 0 ? activeBadges[0] : null;

      const normalizedBadges = {
        available_tonight: keepBadge === "available_tonight" ? available_tonight : false,
        is_plusone: keepBadge === "is_plusone" ? is_plusone : false,
        generous_lifestyle: keepBadge === "generous_lifestyle" ? generous_lifestyle : false,
        weekend_plans: keepBadge === "weekend_plans" ? weekend_plans : false,
        late_night_chat: keepBadge === "late_night_chat" ? late_night_chat : false,
        no_drama: keepBadge === "no_drama" ? no_drama : false,
      };

      setProfile({
        name: (row.name as string) || "",
        age: (row.age as number) || 18,
        gender: (row.gender as string) || "",
        looking_for: (row.looking_for as string) || "",
        country: (row.country as string) || "",
        city: (row.city as string) || "",
        bio: sanitizeBio((row.bio as string) || ""),
        whatsapp: (row.whatsapp as string) || "",
        avatar_url: (row.avatar_url as string | null) || null,
        images: imgs,
        latitude: (row.latitude as number | null) ?? null,
        longitude: (row.longitude as number | null) ?? null,
        voice_intro_url: (row.voice_intro_url as string | null) || null,
        image_positions: positions,
        first_date_idea: (row.first_date_idea as string | null) || null,
        first_date_places: ((row.first_date_places as DatePlace[]) || []),
        languages: (((row.languages as string[]) || []).slice(0, 2)),
        height_cm: (row.height_cm as number | null) ?? null,
        drinking: (row.drinking as string) || "",
        smoking: (row.smoking as string) || "",
        fitness: (row.fitness as string) || "",
        pets: (row.pets as string) || "",
        interests: ((row.interests as string[]) || []).slice(0, 8),
        orientation: (row.orientation as string) || "",
        basic_info: (row.basic_info as Record<string, unknown>) || {},
        lifestyle_info: (row.lifestyle_info as Record<string, unknown>) || {},
        relationship_goals: (row.relationship_goals as Record<string, unknown>) || {},
        ...normalizedBadges,
      });
      setSchemaHasBadgeColumns(useBadgeColumns);
      setLoading(false);
    };
    loadProfile();
  }, []);

  const update = (key: keyof ProfileData, value: ProfileData[keyof ProfileData]) => {
    setProfile((p) => p ? { ...p, [key]: value } : p);
  };

  const clearOtherBadges = (keep: keyof Pick<ProfileData,
    "available_tonight" | "is_plusone" | "generous_lifestyle" | "weekend_plans" | "late_night_chat" | "no_drama"
  >) => {
    const keys: Array<keyof Pick<ProfileData,
      "available_tonight" | "is_plusone" | "generous_lifestyle" | "weekend_plans" | "late_night_chat" | "no_drama"
    >> = ["available_tonight", "is_plusone", "generous_lifestyle", "weekend_plans", "late_night_chat", "no_drama"];
    for (const k of keys) {
      if (k !== keep) update(k, false);
    }
  };

  const updateImagePos = (idx: number, field: keyof ImagePosition, value: number) => {
    setProfile((p) => {
      if (!p) return p;
      const positions = [...p.image_positions];
      while (positions.length <= idx) positions.push({ ...defaultPos });
      positions[idx] = { ...positions[idx], [field]: value };
      return { ...p, image_positions: positions };
    });
  };

  const getPos = (idx: number): ImagePosition => {
    return profile?.image_positions[idx] || defaultPos;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadingIdx(uploadSlot);
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploadingIdx(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
    const url = urlData.publicUrl;

    setProfile((p) => {
      if (!p) return p;
      const imgs = [...p.images];
      const positions = [...p.image_positions];
      if (uploadSlot < imgs.length) {
        imgs[uploadSlot] = url;
        positions[uploadSlot] = { ...defaultPos };
      } else {
        imgs.push(url);
        positions.push({ ...defaultPos });
      }
      const avatar = p.avatar_url || imgs[0];
      return { ...p, images: imgs, image_positions: positions, avatar_url: avatar };
    });

    setUploadingIdx(null);
    setEditingImageIdx(uploadSlot);
    toast.success("Photo uploaded! Adjust positioning below.");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setProfile((p) => {
      if (!p) return p;
      const imgs = p.images.filter((_, i) => i !== idx);
      const positions = p.image_positions.filter((_, i) => i !== idx);
      const mainImg = p.avatar_url;
      const newAvatar = imgs.length > 0 ? (imgs.includes(mainImg || "") ? mainImg : imgs[0]) : null;
      return { ...p, images: imgs, image_positions: positions, avatar_url: newAvatar };
    });
    if (editingImageIdx === idx) setEditingImageIdx(null);
    else if (editingImageIdx !== null && editingImageIdx > idx) setEditingImageIdx(editingImageIdx - 1);
  };

  const setAsMain = (idx: number) => {
    if (!profile) return;
    const img = profile.images[idx];
    if (img) {
      update("avatar_url", img);
      toast.success("Main photo updated!");
    }
  };

  const handleSetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("latitude", pos.coords.latitude);
        update("longitude", pos.coords.longitude);
        setLocating(false);
        toast.success("Location set! You'll appear on the map 📍");
      },
      () => {
        toast.error("Location access denied");
        setLocating(false);
      }
    );
  };

  const handleSave = async () => {
    if (!profile || !userId) return;

    // Validation: require at least 2 images
    if (profile.images.length < 2) {
      toast.error("Please add at least 2 photos: 1 main image + 1 profile image");
      return;
    }
    if (!profile.avatar_url) {
      toast.error("Please set a main image");
      return;
    }

    setSaving(true);

    const mainIdx = profile.images.indexOf(profile.avatar_url);
    const mainPos = getPos(mainIdx >= 0 ? mainIdx : 0);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        looking_for: profile.looking_for,
        country: profile.country,
        city: profile.city,
        bio: sanitizeBio(profile.bio),
        whatsapp: profile.whatsapp,
        avatar_url: profile.avatar_url,
        images: profile.images,
        latitude: profile.latitude,
        longitude: profile.longitude,
        available_tonight: profile.available_tonight,
        voice_intro_url: profile.voice_intro_url,
        image_positions: profile.image_positions as unknown as import("@/integrations/supabase/types").Json,
        first_date_idea: profile.first_date_idea,
        first_date_places: profile.first_date_places as unknown as import("@/integrations/supabase/types").Json,
        languages: profile.languages as unknown as import("@/integrations/supabase/types").Json,
        height_cm: profile.height_cm,
        drinking: profile.drinking || null,
        smoking: profile.smoking || null,
        fitness: profile.fitness || null,
        pets: profile.pets || null,
        interests: profile.interests as unknown as import("@/integrations/supabase/types").Json,
        orientation: profile.orientation || null,
        basic_info: profile.basic_info as unknown as import("@/integrations/supabase/types").Json,
        lifestyle_info: profile.lifestyle_info as unknown as import("@/integrations/supabase/types").Json,
        relationship_goals: profile.relationship_goals as unknown as import("@/integrations/supabase/types").Json,
        is_plusone: profile.is_plusone,
        generous_lifestyle: profile.generous_lifestyle,
        ...(schemaHasBadgeColumns && {
          weekend_plans: profile.weekend_plans,
          late_night_chat: profile.late_night_chat,
          no_drama: profile.no_drama,
        }),
        main_image_pos: `${mainPos.x}% ${mainPos.y}%`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSaving(false);
    if (error) {
      toast.error("Save failed: " + error.message);
    } else {
      toast.success("Profile saved! ✅");
    }
  };

  const handleDeactivate = async () => {
    if (!userId) return;
    setDeactivating(true);
    const hiddenUntil = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: false, hidden_until: hiddenUntil })
      .eq("id", userId);
    setDeactivating(false);
    if (error) {
      toast.error("Could not deactivate: " + error.message);
    } else {
      setShowDeactivateConfirm(false);
      setDeactivateDone(true);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Deletion failed");
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not delete account";
      toast.error(msg);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-muted-foreground text-xs text-center py-8">Profile not found</p>;
  }

  const mainIdx = profile.images.indexOf(profile.avatar_url || "");

  const getImageLabel = (idx: number) => {
    if (profile.images[idx] === profile.avatar_url) return "Main Image (Swipe Card)";
    if (idx === 0 || (mainIdx === 0 && idx === 1) || (mainIdx !== 0 && idx === 0)) return "Profile Page";
    return `Photo ${idx + 1}`;
  };

  const isMainImage = (idx: number) => profile.images[idx] === profile.avatar_url;

  return (
    <div className="space-y-4">
      {/* ── Step Navigation ─────────────────────────────────────────── */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "white",
        borderBottom: "1px solid rgba(236,72,153,0.12)",
        padding: "10px 16px 8px",
        boxShadow: "0 2px 12px rgba(236,72,153,0.08)",
      }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
          {[
            { key: "profile", emoji: "👤", label: "Profile" },
            { key: "details", emoji: "🌿", label: "Details" },
          ].map(({ key, emoji, label }) => (
            <button
              key={key}
              onClick={() => setEditorStep(key as any)}
              style={{
                flexShrink: 0,
                padding: "7px 14px",
                borderRadius: 999,
                border: editorStep === key
                  ? "none"
                  : "1px solid rgba(236,72,153,0.2)",
                background: editorStep === key
                  ? "linear-gradient(135deg, #EC4899, #8B5CF6)"
                  : "white",
                color: editorStep === key ? "white" : "#9CA3AF",
                fontSize: 11,
                fontWeight: editorStep === key ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.2s",
                boxShadow: editorStep === key ? "0 4px 10px rgba(236,72,153,0.3)" : "none",
              }}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {editorStep === "profile" && (
        <>
          {/* Photo Gallery */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">
              Photos (min 2, max 5) — tap image to adjust position
            </Label>
            <p className="text-[10px] text-muted-foreground mb-2">⭐ = set as main swipe card image</p>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, idx) => {
                const img = profile.images[idx];
                const isMain = isMainImage(idx);
                const isEditing = editingImageIdx === idx;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`aspect-square w-full rounded-xl overflow-hidden relative cursor-pointer group ${
                        isEditing ? "ring-2 ring-secondary" : isMain ? "ring-2 ring-primary" : "glass"
                      }`}
                      onClick={() => {
                        if (!img) {
                          setUploadSlot(idx);
                          fileInputRef.current?.click();
                        } else {
                          setEditingImageIdx(isEditing ? null : idx);
                        }
                      }}
                    >
                      {uploadingIdx === idx ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      ) : img ? (
                        <>
                          <div className="absolute inset-0 overflow-hidden">
                            <img
                              src={img}
                              alt={`Photo ${idx + 1}`}
                              className="absolute w-full h-full object-cover pointer-events-none"
                              style={{
                                transform: `scale(${getPos(idx).zoom / 100}) translate(${50 - getPos(idx).x}%, ${50 - getPos(idx).y}%)`,
                                transformOrigin: "center center",
                              }}
                            />
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {!isMain && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setAsMain(idx); }}
                              className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Set as main"
                            >
                              <Star className="w-3 h-3 text-secondary" />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                          <Camera className="w-4 h-4" />
                          <span className="text-[8px] mt-0.5">{idx === 0 ? "Main" : idx === 1 ? "Profile" : "Add"}</span>
                        </div>
                      )}
                    </motion.div>
                    {img && (
                      <span className={`text-[8px] font-medium leading-tight text-center ${isMain ? "text-primary" : "text-muted-foreground"}`}>
                        {isMain ? "Main" : idx === 0 ? "Profile" : `Photo ${idx + 1}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* Image Position Editor */}
          {editingImageIdx !== null && profile.images[editingImageIdx] && (
            <div className="space-y-3 p-3 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-foreground text-xs font-semibold">
                  {isMainImage(editingImageIdx) ? "📸 Main Image (Swipe Card)" : `📸 ${getImageLabel(editingImageIdx)}`}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] px-2 text-muted-foreground"
                  onClick={() => {
                    updateImagePos(editingImageIdx, "x", 50);
                    updateImagePos(editingImageIdx, "y", 50);
                    updateImagePos(editingImageIdx, "zoom", 100);
                  }}
                >
                  Reset
                </Button>
              </div>

              {/* Preview frame */}
              <div className={`relative w-full rounded-2xl overflow-hidden shadow-card ${
                isMainImage(editingImageIdx) ? "aspect-[4/5] max-h-[70vh]" : "aspect-square max-h-[40vh]"
              }`}>
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={profile.images[editingImageIdx]}
                    alt="Preview"
                    className="absolute w-full h-full object-cover pointer-events-none"
                    style={{
                      transform: `scale(${getPos(editingImageIdx).zoom / 100}) translate(${50 - getPos(editingImageIdx).x}%, ${50 - getPos(editingImageIdx).y}%)`,
                      transformOrigin: "center center",
                    }}
                    draggable={false}
                  />
                </div>
                {isMainImage(editingImageIdx) && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 pointer-events-none">
                      <p className="font-display font-bold text-lg text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                        {profile.name}, {profile.age}
                      </p>
                      <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {profile.city || "Your city"}, {profile.country}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Sliders */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MoveHorizontal className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground w-6">L/R</span>
                  <Slider
                    value={[getPos(editingImageIdx).x]}
                    onValueChange={([v]) => updateImagePos(editingImageIdx, "x", v)}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <MoveVertical className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground w-6">U/D</span>
                  <Slider
                    value={[getPos(editingImageIdx).y]}
                    onValueChange={([v]) => updateImagePos(editingImageIdx, "y", v)}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <ZoomIn className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground w-6">Zoom</span>
                  <Slider
                    value={[getPos(editingImageIdx).zoom]}
                    onValueChange={([v]) => updateImagePos(editingImageIdx, "zoom", v)}
                    min={100}
                    max={300}
                    step={5}
                    className="flex-1"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={() => setEditingImageIdx(null)}
              >
                Done Positioning
              </Button>
            </div>
          )}

          {/* Validation hint */}
          {profile.images.length < 2 && (
            <p className="text-destructive text-[10px] font-medium text-center">
              ⚠️ Please add at least 2 photos (1 main + 1 profile) to save
            </p>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">Name</Label>
              <Input value={profile.name} onChange={(e) => update("name", e.target.value)} className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-gray-800 focus:border-pink-300 focus:outline-none" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">Age</Label>
              <Input type="number" min={18} max={99} value={profile.age} onChange={(e) => update("age", parseInt(e.target.value) || 18)} className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-gray-800 focus:border-pink-300 focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">Gender</Label>
              <Select value={profile.gender} onValueChange={(v) => update("gender", v)}>
                <SelectTrigger className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-gray-800 focus:border-pink-300 focus:outline-none"><SelectValue /></SelectTrigger>
                <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">Looking for</Label>
              <Select value={profile.looking_for} onValueChange={(v) => update("looking_for", v)}>
                <SelectTrigger className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-gray-800 focus:border-pink-300 focus:outline-none"><SelectValue /></SelectTrigger>
                <SelectContent>{LOOKING_FOR.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">Country</Label>
              <Input value={profile.country} onChange={(e) => update("country", e.target.value)} className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-gray-800 focus:border-pink-300 focus:outline-none" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">City</Label>
              <Input value={profile.city} onChange={(e) => update("city", e.target.value)} className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-gray-800 focus:border-pink-300 focus:outline-none" />
            </div>
          </div>

          {/* About Section */}
          <div className="mt-6">
            <Label className="text-muted-foreground text-xs mb-1 block">Bio</Label>
            <Textarea
              value={profile.bio}
              onChange={(e) => update("bio", sanitizeBio(e.target.value))}
              rows={3}
              className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-gray-800 focus:border-pink-300 focus:outline-none resize-none"
              placeholder="About you (no emoji or phone numbers, max 250 characters)"
            />
            <p className="text-muted-foreground text-[10px] mt-1 text-right">
              {profile.bio.length}/{BIO_MAX_LENGTH}
            </p>
          </div>

          <div className="mt-4">
            <Label className="text-muted-foreground text-xs mb-1 block">WhatsApp</Label>
            <Input value={profile.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-gray-800 focus:border-pink-300 focus:outline-none" />
          </div>

          {/* Voice Intro */}
          <VoiceRecorder
            voiceUrl={profile.voice_intro_url}
            userId={userId}
            onSaved={(url) => update("voice_intro_url", url)}
          />
        </>
      )}

      
      {editorStep === "details" && (
        <>
          {/* Lifestyle Section */}
          <div className="pb-2">
            <BasicInfoEditor
              value={profile.basic_info as any}
              onChange={(v) => update("basic_info", v)}
            />
            <LifestyleEditor
              value={profile.lifestyle_info as any}
              onChange={(v) => update("lifestyle_info", v)}
            />
          </div>

          {/* Goals Section */}
          <div className="pb-2">
            <RelationshipGoalsEditor
              value={profile.relationship_goals as any}
              onChange={(v) => update("relationship_goals", v)}
            />
          </div>

          {/* Dating Preferences */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block flex items-center gap-1">
              <Languages className="w-3 h-3" /> Languages I Speak
            </Label>
            <div className="space-y-2">
          {/* Native language (auto from country) */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border">
            <span className="text-sm text-foreground flex-1 flex items-center gap-2">
              <span className="text-base leading-none">{getCountryFlag(profile.country)}</span>
              {getNativeLanguage(profile.country)}
            </span>
            <span className="text-[10px] text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Native</span>
          </div>
          
          {/* Extra languages */}
          {profile.languages.map((lang, idx) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border">
              <span className="text-sm text-foreground flex-1 flex items-center gap-2">
                <span className="text-base leading-none">{getLanguageFlag(lang)}</span>
                {lang}
              </span>
              <button
                onClick={() => {
                  const updated = profile.languages.filter((_, i) => i !== idx);
                  update("languages", updated);
                }}
                className="w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {/* Add language dropdown */}
          {profile.languages.length < 2 && (
            <Select
              value=""
              onValueChange={(v) => {
                if (v && !profile.languages.includes(v) && v !== getNativeLanguage(profile.country)) {
                  update("languages", [...profile.languages, v].slice(0, 2));
                }
              }}
            >
              <SelectTrigger className="bg-muted border-border h-9 text-sm border-dashed">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add a language ({2 - profile.languages.length} remaining)</span>
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {LANGUAGES.filter(
                  (l) => l !== getNativeLanguage(profile.country) && !profile.languages.includes(l)
                ).map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
            </div>
          </div>

          {/* Orientation */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">Orientation (optional)</Label>
            <div className="flex gap-2">
          {[
            { value: "", label: "Not specified" },
            { value: "Straight", label: "Straight" },
            { value: "Same-Sex", label: "Gay / Lesbian" },
          ].map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => update("orientation", o.value)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                profile.orientation === o.value
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-muted/30 text-muted-foreground border-border/50 hover:border-primary/50"
              }`}
            >
              {o.label}
            </button>
          ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">Map Location</Label>
            <Button
          variant="outline"
          onClick={handleSetLocation}
          disabled={locating}
          className="w-full h-9 text-sm border-border rounded-xl"
        >
          {locating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Getting location...</>
          ) : profile.latitude ? (
            <><MapPin className="w-4 h-4 mr-2 text-primary" /> Location set — tap to update</>
          ) : (
            <><MapPin className="w-4 h-4 mr-2" /> Set my location on the map</>
          )}
        </Button>
        {profile.latitude && (
          <p className="text-[10px] text-muted-foreground mt-1 text-center">
            📍 Approx: {profile.latitude.toFixed(2)}°, {profile.longitude?.toFixed(2)}°
          </p>
        )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-semibold">Badges</p>
            <button
          type="button"
          onClick={() => setShowBadgesHelp(true)}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <HelpCircle className="w-4 h-4" /> Help
            </button>
          </div>

          <Dialog open={showBadgesHelp} onOpenChange={setShowBadgesHelp}>
            <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-sm rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-gray-900">Badge meanings</DialogTitle>
                <DialogDescription className="text-gray-500">
                  You can select 1 badge at a time (or none). Badges help others understand your vibe.
                </DialogDescription>
              </DialogHeader>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-gray-900">Free Tonight</p>
              <p className="text-gray-600 text-xs mt-0.5">Shows you're available tonight. Auto-clears at midnight.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Plus-One Premium</p>
              <p className="text-gray-600 text-xs mt-0.5">Signals you're open to events and social outings.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Generous Lifestyle</p>
              <p className="text-gray-600 text-xs mt-0.5">You enjoy treating companions to dinners, events, or experiences.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Weekend Plans</p>
              <p className="text-gray-600 text-xs mt-0.5">Usually available on weekends for meetups and social plans.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Late Night Chat</p>
              <p className="text-gray-600 text-xs mt-0.5">Prefer nighttime conversations and late evening activity.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">No Drama</p>
              <p className="text-gray-600 text-xs mt-0.5">Prefer calm, positive, and respectful connections.</p>
            </div>
          </div>
            </DialogContent>
          </Dialog>

      {/* Free Tonight */}
      <div className="glass rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-yellow-400" fill="currentColor" />
            <div>
              <p className="text-foreground text-sm font-medium">Free Tonight</p>
              <p className="text-muted-foreground text-[10px]">
                {freeTonightUntil
                  ? `Auto-clears at midnight · expires ${freeTonightUntil.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "Shows a badge on your profile until midnight"}
              </p>
            </div>
          </div>
          <Switch
            checked={profile.available_tonight}
            onCheckedChange={(checked) => {
              update("available_tonight", checked);
              if (checked) clearOtherBadges("available_tonight");
              if (checked) {
                // Set expiry to end of today (midnight local time)
                const midnight = new Date();
                midnight.setHours(23, 59, 59, 999);
                setFreeTonightUntil(midnight);
                if (userId) localStorage.setItem(`free_tonight_until_${userId}`, midnight.toISOString());
                // Schedule auto-clear
                const msLeft = midnight.getTime() - Date.now();
                setTimeout(async () => {
                  await supabase.from("profiles").update({ available_tonight: false }).eq("id", userId);
                  if (userId) localStorage.removeItem(`free_tonight_until_${userId}`);
                  setFreeTonightUntil(null);
                  update("available_tonight", false);
                  toast("🌙 Free Tonight badge has been automatically removed at midnight.");
                }, msLeft);
              } else {
                setFreeTonightUntil(null);
                if (userId) localStorage.removeItem(`free_tonight_until_${userId}`);
              }
            }}
          />
        </div>
        {profile.available_tonight && freeTonightUntil && (
          <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-2.5 py-1.5">
            <Moon className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="currentColor" />
            <p className="text-yellow-300 text-[10px]">
              Badge is live on your profile and will automatically turn off at{" "}
              <span className="font-bold">midnight tonight</span>. Turn the switch off anytime to remove it early.
            </p>
          </div>
        )}
      </div>

      {/* Plus-One Premium */}
      <div className="glass rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-yellow-400" />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-foreground text-sm font-medium">Plus-One Premium</p>
                <span className="bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">$19.99</span>
              </div>
              <p className="text-muted-foreground text-[10px]">Show you're open to events & social outings</p>
            </div>
          </div>
          <Switch
            checked={profile.is_plusone}
            onCheckedChange={(checked) => {
              if (checked) {
                // Redirect to purchase — cannot enable for free
                const plusoneFeature = PREMIUM_FEATURES.find(f => f.id === "plusone");
                if (plusoneFeature) {
                  toast("🎫 Purchase Plus-One Premium to activate this badge.", { duration: 3000 });
                  navigate(`/dashboard?purchase=plusone`);
                }
                return;
              }
              // Turning off is always free
              update("is_plusone", false);
            }}
          />
        </div>
        {profile.is_plusone && (
          <div className="flex items-start gap-1.5 bg-yellow-500/10 border border-yellow-400/30 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-300 text-[10px] leading-relaxed">
              Your <span className="font-bold">🎫 Plus-One</span> badge is live! Others can see you're open to dinners, weddings, concerts, travel & social occasions. Connect via WhatsApp to coordinate plans.
            </p>
          </div>
        )}
      </div>

      {/* Generous Lifestyle badge */}
      <div className="glass rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-foreground text-sm font-medium">Generous Lifestyle</p>
              <p className="text-muted-foreground text-[10px]">You enjoy treating companions to dinners, events & memorable experiences</p>
            </div>
          </div>
          <Switch
            checked={profile.generous_lifestyle}
            onCheckedChange={(checked) => {
              update("generous_lifestyle", checked);
              if (checked) clearOtherBadges("generous_lifestyle");
            }}
          />
        </div>
        {profile.generous_lifestyle && (
          <div className="flex items-start gap-1.5 bg-amber-500/10 border border-amber-400/30 rounded-lg px-2.5 py-1.5">
            <Gift className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-[10px] leading-relaxed">
              Your <span className="font-bold">Generous Lifestyle</span> badge is live. It signals that you enjoy sharing experiences and thoughtful gestures—no expectations or obligations.
            </p>
          </div>
        )}
      </div>

      {/* Weekend Plans badge */}
      <div className="glass rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <div>
              <p className="text-foreground text-sm font-medium">Weekend Plans</p>
              <p className="text-muted-foreground text-[10px]">Usually available on weekends for meetups & social plans</p>
            </div>
          </div>
          <Switch
            checked={profile.weekend_plans}
            onCheckedChange={(checked) => {
              update("weekend_plans", checked);
              if (checked) clearOtherBadges("weekend_plans");
            }}
          />
        </div>
      </div>

      {/* Late Night Chat badge */}
      <div className="glass rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MoonStar className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-foreground text-sm font-medium">Late Night Chat</p>
              <p className="text-muted-foreground text-[10px]">Typically active later in the evening; prefer nighttime conversations</p>
            </div>
          </div>
          <Switch
            checked={profile.late_night_chat}
            onCheckedChange={(checked) => {
              update("late_night_chat", checked);
              if (checked) clearOtherBadges("late_night_chat");
            }}
          />
        </div>
      </div>

      {/* No Drama badge */}
      <div className="glass rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <div>
              <p className="text-foreground text-sm font-medium">No Drama</p>
              <p className="text-muted-foreground text-[10px]">Prefer relaxed, positive & respectful connections</p>
            </div>
          </div>
          <Switch
            checked={profile.no_drama}
            onCheckedChange={(checked) => {
              update("no_drama", checked);
              if (checked) clearOtherBadges("no_drama");
            }}
          />
        </div>
      </div>

      {/* First Date Idea */}
      <div>
        <Label className="text-muted-foreground text-xs mb-1 block flex items-center gap-1">
          <Heart className="w-3 h-3 text-primary" /> First Date Would Be Nice...
        </Label>
        <Select value={profile.first_date_idea || ""} onValueChange={(v) => update("first_date_idea", v || null)}>
          <SelectTrigger className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-gray-800 focus:border-pink-300 focus:outline-none"><SelectValue placeholder="Select your ideal first date" /></SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {FIRST_DATE_IDEAS.map((idea) => <SelectItem key={idea} value={idea}>{idea}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Date Places */}
      <DatePlacesEditor
        places={profile.first_date_places}
        onChange={(places) => update("first_date_places", places)}
      />
        </>
      )}

      {/* ── Step Navigation Footer ──────────────────────────────────── */}
      <div style={{
        position: "sticky",
        bottom: 0,
        background: "white",
        borderTop: "1px solid rgba(236,72,153,0.12)",
        padding: "12px 16px",
        display: "flex",
        gap: 8,
        boxShadow: "0 -4px 20px rgba(236,72,153,0.08)",
      }}>
        {(() => {
          const steps = ["profile", "details"];
          const currentIdx = steps.indexOf(editorStep);
          const isFirst = currentIdx === 0;
          const isLast = currentIdx === steps.length - 1;

          return (
            <>
              {!isFirst && (
                <button
                  onClick={() => setEditorStep(steps[currentIdx - 1] as any)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 14,
                    border: "1px solid rgba(236,72,153,0.25)",
                    background: "white",
                    color: "#EC4899",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
              )}

              {!isLast ? (
                <button
                  onClick={async () => {
  // Auto save current step data silently
  if (profile && userId) {
    await supabase.from("profiles").update({
      basic_info: profile.basic_info as any,
      lifestyle_info: profile.lifestyle_info as any,
      relationship_goals: profile.relationship_goals as any,
      name: profile.name,
      age: profile.age,
      bio: profile.bio,
    }).eq("id", userId);
  }
  setEditorStep(steps[currentIdx + 1] as any);
}}
                  style={{
                    flex: 2,
                    padding: "12px",
                    borderRadius: 14,
                    border: "none",
                    background: "linear-gradient(135deg, #EC4899, #8B5CF6)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(236,72,153,0.4)",
                  }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    flex: 2,
                    padding: "12px",
                    borderRadius: 14,
                    border: "none",
                    background: saving
                      ? "rgba(255,255,255,0.1)"
                      : "linear-gradient(135deg, #EC4899, #8B5CF6)",
                    color: saving ? "rgba(255,255,255,0.4)" : "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "✅ Save Profile"}
                </button>
              )}
            </>
          );
        })()}
      </div>

      {/* Deactivate / Delete account */}
      <div className="pt-2 border-t border-border space-y-1">
        <button
          onClick={() => setShowDeactivateConfirm(true)}
          className="w-full py-2.5 text-xs text-muted-foreground hover:text-amber-400 transition-colors flex items-center justify-center gap-1.5"
        >
          <PauseCircle className="w-3.5 h-3.5" />
          Deactivate my account
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full py-2.5 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1.5"
        >
          <XIcon className="w-3.5 h-3.5" />
          Permanently delete my account
        </button>
      </div>

      {/* ── Deactivate confirmation dialog ── */}
      <AnimatePresence>
        {showDeactivateConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowDeactivateConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-x-4 bottom-8 z-50 bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-w-sm mx-auto"
            >
              <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center mx-auto">
                  <PauseCircle className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg">Taking a break?</h3>
                  <p className="text-white/50 text-xs mt-2 leading-relaxed">
                    No worries — life gets busy. Deactivating hides your profile from everyone while keeping everything safe and intact.
                  </p>
                  <p className="text-white/70 text-sm mt-3 font-medium leading-relaxed">
                    Whenever you're ready to come back, simply log in and you'll be right where you left off — your profile, matches and history all waiting for you. 👋
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleDeactivate}
                    disabled={deactivating}
                    className="w-full py-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 font-semibold text-sm hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    {deactivating
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Deactivating...</>
                      : <><PauseCircle className="w-4 h-4" /> Yes, deactivate my account</>
                    }
                  </button>
                  <button
                    onClick={() => setShowDeactivateConfirm(false)}
                    className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:text-white transition-colors"
                  >
                    Cancel — keep my account active
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Deactivate success dialog ── */}
      <AnimatePresence>
        {deactivateDone && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="fixed inset-x-4 bottom-8 z-50 bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-w-sm mx-auto"
            >
              <div className="h-1 w-full gradient-love" />
              <div className="p-6 text-center space-y-4">
                {/* Animated heart */}
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="w-16 h-16 rounded-full gradient-love flex items-center justify-center mx-auto shadow-[0_0_24px_rgba(180,80,150,0.4)]"
                >
                  <Heart className="w-8 h-8 text-white" fill="white" />
                </motion.div>

                <div>
                  <h3 className="font-display font-bold text-white text-xl">Until next time 💕</h3>
                  <p className="text-white/60 text-sm mt-2 leading-relaxed">
                    Your account has been quietly deactivated and your profile is now hidden. Everything is safe and ready for when you return.
                  </p>
                  <p className="text-white/80 text-sm mt-3 font-medium leading-relaxed">
                    We'll be here whenever you're ready — just log back in and you're all set. No fuss, no re-setup, just straight back into it.
                  </p>
                  <p className="text-primary text-xs mt-3 font-semibold">
                    The whole team at 2DateMe thanks you for being part of our community. We hope to see you back soon! 🙏
                  </p>
                </div>

                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  }}
                  className="w-full py-3 rounded-2xl gradient-love text-white font-bold text-sm"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* ── Delete account confirmation dialog ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
              onClick={() => !deleting && setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-x-4 bottom-8 z-50 bg-[#111] border border-red-500/30 rounded-3xl overflow-hidden shadow-2xl max-w-sm mx-auto"
            >
              <div className="h-1 w-full bg-gradient-to-r from-red-500 to-rose-600" />
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
                  <XIcon className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg">Delete Account?</h3>
                  <p className="text-white/50 text-xs mt-2 leading-relaxed">
                    This is permanent and cannot be undone. Your profile, photos, matches, and all data will be erased immediately.
                  </p>
                  <p className="text-red-400 text-xs mt-2 font-medium">
                    ⚠️ There is no way to recover your account after this.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="w-full py-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    {deleting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting everything...</>
                      : <><XIcon className="w-4 h-4" /> Yes, permanently delete my account</>
                    }
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:text-white transition-colors"
                  >
                    Cancel — keep my account
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProfileEditor;
