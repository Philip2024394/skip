import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, MapPin, Save, Loader2, CalendarHeart, Calendar, Star, ZoomIn, ZoomOut, MoveHorizontal, MoveVertical, Heart, PauseCircle, Moon, Gift, CalendarDays, MoonStar, ShieldCheck } from "lucide-react";
import { Button } from "@/shared/components/button";
import { Input } from "@/shared/components/input";
import { Label } from "@/shared/components/label";
import { Textarea } from "@/shared/components/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/select";
import { Switch } from "@/shared/components/switch";
import { Slider } from "@/shared/components/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import VoiceRecorder from "@/features/video/components/VoiceRecorder";
import VideoIntroUploader from "@/features/video/components/VideoIntroUploader";
import { FIRST_DATE_IDEAS } from "@/data/firstDateIdeas";
import DatePlacesEditor, { DatePlace } from "./DatePlacesEditor";
import { LANGUAGES, getCountryFlag, getLanguageFlag, getNativeLanguage } from "@/data/languages";
import { HelpCircle, Languages, Plus, X as XIcon } from "lucide-react";
import { PREMIUM_FEATURES } from "@/data/premiumFeatures";
import { BIO_MAX_LENGTH } from "@/shared/services/constants";
import { sanitizeBio } from "@/shared/utils/bio";
import { CONTACT_PREFERENCE_OPTIONS, type ContactPreference } from "@/shared/utils/contactPreference";
import { BasicInfoEditor } from "@/features/dating/components/profile-editor/BasicInfoEditor";
import { LifestyleEditor } from "@/features/dating/components/profile-editor/LifestyleEditor";
import { RelationshipGoalsEditor } from "@/features/dating/components/profile-editor/RelationshipGoalsEditor";
import { GiftDeliverySettings } from "@/features/real-gifts/GiftDeliverySettings";
import { isMyProfileLocked, getMyLockExpiry, upliftMyProfileLock } from "@/features/dating/utils/profileLock";

// ── Profile Lock uplift section ───────────────────────────────────────────────
const ProfileLockSection = () => {
  const [locked, setLocked] = useState(isMyProfileLocked());
  const expiry = getMyLockExpiry();
  if (!locked) return null;
  const daysLeft = expiry ? Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  return (
    <div className="mx-0 mb-4 rounded-2xl overflow-hidden border border-rose-900/40" style={{ background: "rgba(180,20,40,0.08)" }}>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <img
            src="https://ik.imagekit.io/7grri5v7d/Profile%20locked%20with%20heart-shaped%20padlock.png"
            alt="Locked"
            style={{ width: 36, height: 36, objectFit: "contain", mixBlendMode: "screen" as any }}
          />
          <div>
            <p className="text-rose-300 font-bold text-sm">Profile Locked</p>
            <p className="text-white/40 text-xs">
              {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining` : "Expiring soon"} · auto-unlocks
            </p>
          </div>
        </div>
        <p className="text-white/40 text-xs leading-relaxed mb-3">
          Your profile is currently locked after a WhatsApp connection was made. Other users can see your profile but cannot open it. You can uplift this at any time.
        </p>
        <button
          onClick={() => { upliftMyProfileLock(); setLocked(false); }}
          className="w-full py-2.5 rounded-xl text-xs font-semibold text-rose-200 border border-rose-800/60 hover:border-rose-600/60 hover:text-white transition-colors"
          style={{ background: "rgba(180,20,40,0.15)" }}
        >
          🔓 Uplift Badge — Unlock My Profile
        </button>
      </div>
    </div>
  );
};
import { ALL_COUNTRIES } from "@/data/countries";
import { detectCountryFromPhone, getDialCode } from "@/shared/services/phoneCountry";
import { firstName } from "@/shared/utils";

const GENDERS = ["Male", "Female", "Non-binary", "Other"];
const LOOKING_FOR = ["Men", "Women", "Everyone"];

interface ImagePosition {
  x: number; // 0-100
  y: number; // 0-100
  zoom: number; // 100-300 (percentage scale)
}

const defaultPos: ImagePosition = { x: 50, y: 0, zoom: 100 };

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
  video_url: string | null;
  image_positions: ImagePosition[];
  first_date_idea: string | null;
  first_date_places: DatePlace[];
  languages: string[];
  is_verified?: boolean;
  intent: "marriage" | "dating" | "unsure" | "";
  is_visiting: boolean;
  visiting_city: string;
  visiting_badge_type: "visiting" | "otw" | "just_arrived";
  visiting_badge_expires_at: string | null;
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
  residing_country: string | null;
  visited_countries: string[];
  interests: string[];
  orientation: string;
  contact_preference: string;
  contact_provider: string;
  contact_confirmed: boolean;
  contact_locked: boolean;
  contact_unlock_requested: boolean;
  basic_info: Record<string, unknown>;
  lifestyle_info: Record<string, unknown>;
  relationship_goals: Record<string, unknown>;
}

const ProfileEditor = () => {
  const navigate = useNavigate();
  const [editorStep, setEditorStep] = useState<"photos" | "about" | "details" | "status">("photos");
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
  const [countryOverrideApproved, setCountryOverrideApproved] = useState(false);
  const [countryOverrideRequested, setCountryOverrideRequested] = useState(false);
  const [contactLocked, setContactLocked] = useState(false);
  const [confirmingContact, setConfirmingContact] = useState(false);

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
      if (!user) { setLoading(false); return; }
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

      setCountryOverrideApproved(!!(row.country_override_approved as boolean));
      setCountryOverrideRequested(!!(row.country_override_requested as boolean));
      setContactLocked(!!(row.contact_locked as boolean));

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
        video_url: (row.video_url as string | null) || null,
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
        contact_preference: (row.contact_preference as string) || "whatsapp",
        contact_provider: (row.contact_provider as string) || "WhatsApp",
        contact_confirmed: !!(row.contact_confirmed as boolean),
        contact_locked: !!(row.contact_locked as boolean),
        contact_unlock_requested: !!(row.contact_unlock_requested as boolean),
        residing_country: (row.residing_country as string) || null,
        visited_countries: ((row.visited_countries as string[]) || []),
        basic_info: (row.basic_info as Record<string, unknown>) || {},
        lifestyle_info: (row.lifestyle_info as Record<string, unknown>) || {},
        relationship_goals: (row.relationship_goals as Record<string, unknown>) || {},
        ...normalizedBadges,
        intent: ((row.intent as string) || "") as "marriage" | "dating" | "unsure" | "",
        is_visiting: !!(row.is_visiting as boolean),
        visiting_city: (row.visiting_city as string) || "",
        visiting_badge_type: ((row.visiting_badge_type as string) || "visiting") as "visiting" | "otw" | "just_arrived",
        visiting_badge_expires_at: (row.visiting_badge_expires_at as string) || null,
        is_verified: !!(row.is_verified as boolean),
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
    "is_visiting" | "available_tonight" | "is_plusone" | "generous_lifestyle" | "weekend_plans" | "late_night_chat" | "no_drama"
  >) => {
    const keys: Array<keyof Pick<ProfileData,
      "is_visiting" | "available_tonight" | "is_plusone" | "generous_lifestyle" | "weekend_plans" | "late_night_chat" | "no_drama"
    >> = ["is_visiting", "available_tonight", "is_plusone", "generous_lifestyle", "weekend_plans", "late_night_chat", "no_drama"];
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

  const detectedPhoneCountry = detectCountryFromPhone(profile?.whatsapp ?? "");
  const phoneCountryMismatch =
    !!detectedPhoneCountry &&
    !!profile?.country &&
    detectedPhoneCountry !== profile.country &&
    !countryOverrideApproved;

  const handleConfirmContact = async () => {
    if (!profile || !userId) return;
    const num = profile.whatsapp.trim();
    if (!num || num === "+" || num.length < 6) {
      toast.error("Please enter a valid contact number first.");
      return;
    }
    setConfirmingContact(true);
    const { error } = await (supabase.from("profiles").update as any)({
      whatsapp: num,
      contact_provider: profile.contact_provider,
      contact_confirmed: true,
      contact_locked: true,
    }).eq("id", userId);
    setConfirmingContact(false);
    if (error) {
      toast.error(error.message);
    } else {
      setContactLocked(true);
      setProfile(p => p ? { ...p, contact_confirmed: true, contact_locked: true } : p);
      toast.success("Contact confirmed and locked ✓");
    }
  };

  const handleRequestContactUnlock = async () => {
    if (!userId) return;
    const { error } = await (supabase.from("profiles").update as any)({
      contact_unlock_requested: true,
    }).eq("id", userId);
    if (!error) {
      setProfile(p => p ? { ...p, contact_unlock_requested: true } : p);
      toast.success("Unlock request sent to admin ✓");
    }
  };

  const handleSave = async () => {
    if (!profile || !userId) return;

    if (!profile.country) {
      toast.error("Please select your country.");
      return;
    }

    // Validation: require at least 2 images
    if (profile.images.length < 2) {
      toast.error("Please add at least 2 photos: 1 main image + 1 profile image");
      return;
    }
    if (!profile.avatar_url) {
      toast.error("Please set a main image");
      return;
    }

    const overrideRequested = phoneCountryMismatch;
    setCountryOverrideRequested(overrideRequested);

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
        video_url: profile.video_url,
        image_positions: profile.image_positions as unknown as import("@/integrations/supabase/types").Json,
        first_date_idea: profile.first_date_idea,
        first_date_places: profile.first_date_places as unknown as import("@/integrations/supabase/types").Json,
        languages: profile.languages as unknown as import("@/integrations/supabase/types").Json,
        height_cm: profile.height_cm,
        drinking: profile.drinking || null,
        smoking: profile.smoking || null,
        fitness: profile.fitness || null,
        pets: profile.pets || null,
        residing_country: profile.residing_country || null,
        visited_countries: profile.visited_countries as unknown as import("@/integrations/supabase/types").Json || [],
        interests: profile.interests as unknown as import("@/integrations/supabase/types").Json,
        orientation: profile.orientation || null,
        basic_info: profile.basic_info as unknown as import("@/integrations/supabase/types").Json,
        lifestyle_info: profile.lifestyle_info as unknown as import("@/integrations/supabase/types").Json,
        relationship_goals: profile.relationship_goals as unknown as import("@/integrations/supabase/types").Json,
        intent: profile.intent || null,
        is_visiting: profile.is_visiting,
        visiting_city: profile.visiting_city || null,
        visiting_badge_type: profile.visiting_badge_type || null,
        visiting_badge_expires_at: profile.visiting_badge_expires_at || null,
        is_plusone: profile.is_plusone,
        generous_lifestyle: profile.generous_lifestyle,
        ...(schemaHasBadgeColumns && {
          weekend_plans: profile.weekend_plans,
          late_night_chat: profile.late_night_chat,
          no_drama: profile.no_drama,
        }),
        contact_preference: profile.contact_preference || "whatsapp",
        main_image_pos: `${mainPos.x}% ${mainPos.y}%`,
        updated_at: new Date().toISOString(),
        phone_country_code: detectedPhoneCountry ?? null,
        country_override_requested: phoneCountryMismatch,
      } as any)
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
    return <p className="text-white/40 text-xs text-center py-8">Profile not found</p>;
  }

  const mainIdx = profile.images.indexOf(profile.avatar_url || "");

  const getImageLabel = (idx: number) => {
    if (profile.images[idx] === profile.avatar_url) return "Main Image (Swipe Card)";
    if (idx === 0 || (mainIdx === 0 && idx === 1) || (mainIdx !== 0 && idx === 0)) return "Profile Page";
    return `Photo ${idx + 1}`;
  };

  const isMainImage = (idx: number) => profile.images[idx] === profile.avatar_url;

  // Completion score
  const completionItems = [
    profile.images.length >= 2,
    profile.images.length >= 4,
    !!profile.name,
    !!(profile.bio && profile.bio.length > 20),
    !!profile.voice_intro_url,
    !!(profile.basic_info as any)?.height,
    !!(profile.basic_info as any)?.education,
    !!(profile.lifestyle_info as any)?.smoking,
    !!(profile.relationship_goals as any)?.looking_for,
    !!(profile.relationship_goals as any)?.religion,
    !!profile.intent,
    !!profile.latitude,
  ];
  const completionScore = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100);

  return (
    <div className="space-y-3 px-3 sm:px-4" style={{ paddingBottom: "100px" }}>
      {/* ── Completion Banner ───────────────────────────────────────── */}
      <div style={{
        margin: "8px 0 0",
        padding: "10px 14px",
        borderRadius: 14,
        background: completionScore >= 80
          ? "rgba(34,197,94,0.12)"
          : "rgba(236,72,153,0.10)",
        border: completionScore >= 80
          ? "1px solid rgba(34,197,94,0.3)"
          : "1px solid rgba(236,72,153,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ color: "white", fontSize: 12, fontWeight: 700, margin: 0 }}>
            {completionScore >= 80 ? "🌟 Great profile!" : "🚀 Complete your profile"}
          </p>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            color: completionScore >= 80 ? "#86efac" : "#f9a8d4",
          }}>{completionScore}%</span>
        </div>
        <div style={{
          height: 5, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden", marginBottom: 5,
        }}>
          <div style={{
            height: "100%",
            width: `${completionScore}%`,
            borderRadius: 99,
            background: completionScore >= 80
              ? "linear-gradient(90deg,#22c55e,#86efac)"
              : "linear-gradient(90deg,#EC4899,#8B5CF6)",
            transition: "width 0.4s",
          }} />
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: 0 }}>
          {completionScore >= 80
            ? "Your profile stands out — you're getting top visibility!"
            : `Profiles with 80%+ completion get up to 70% more likes. Keep going! 💪`}
        </p>
      </div>
      {/* ── Step Navigation ─────────────────────────────────────────── */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#0a0a0a",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "8px 12px 6px",
      }}>
        <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none" }}>
          {[
            { key: "photos",  emoji: "📸", label: "Photos" },
            { key: "about",   emoji: "👤", label: "About" },
            { key: "details", emoji: "🌿", label: "Details" },
            { key: "status",  emoji: "✨", label: "Status" },
          ].map(({ key, emoji, label }) => (
            <button
              key={key}
              onClick={() => setEditorStep(key as any)}
              style={{
                flexShrink: 0,
                padding: "6px 10px",
                borderRadius: 999,
                border: editorStep === key
                  ? "none"
                  : "1px solid rgba(255,255,255,0.1)",
                background: editorStep === key
                  ? "linear-gradient(135deg, #EC4899, #8B5CF6)"
                  : "rgba(255,255,255,0.06)",
                color: editorStep === key ? "white" : "rgba(255,255,255,0.5)",
                fontSize: 10,
                fontWeight: editorStep === key ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
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

      {editorStep === "photos" && (
        <>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>📸</span>
            <div>
              <p style={{ color: "white", fontSize: 13, fontWeight: 800, margin: 0 }}>Your Photos</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>Profiles with 4+ photos get 3× more swipes. Your first photo is your first impression!</p>
            </div>
          </div>
          {/* Photo Gallery */}
          <div>
            <Label className="text-white/50 text-xs mb-1 block">
              Photos (min 2, max 5) — tap image to adjust position
            </Label>
            {profile.is_verified && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/25">
                <span className="text-sky-400 text-sm">✅</span>
                <p className="text-sky-400/80 text-[10px] leading-snug">Your main photo was confirmed during verification and is locked. Additional photos can still be added or changed.</p>
              </div>
            )}
            <p className="text-[10px] text-white/40 mb-2">⭐ = set as main swipe card image</p>
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
                      className={`aspect-square w-full rounded-xl overflow-hidden relative cursor-pointer group ${isEditing ? "ring-2 ring-violet-500" : isMain ? "ring-2 ring-pink-500" : "bg-white/5 border border-white/10"
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
                                objectPosition: "50% 0%", // Always show top part
                                transform: `scale(${getPos(idx).zoom / 100}) translateX(${50 - getPos(idx).x}%)`,
                                transformOrigin: "50% 0%", // Anchor from top center
                              }}
                            />
                          </div>
                          {!(isMain && profile.is_verified) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          {!isMain && !profile.is_verified && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setAsMain(idx); }}
                              className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Set as main"
                            >
                              <Star className="w-3 h-3 text-secondary" />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                          <Camera className="w-4 h-4" />
                          <span className="text-[8px] mt-0.5">{idx === 0 ? "Main" : idx === 1 ? "Profile" : "Add"}</span>
                        </div>
                      )}
                    </motion.div>
                    {img && (
                      <span className={`text-[8px] font-medium leading-tight text-center ${isMain ? "text-primary" : "text-white/40"}`}>
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
            <div className="space-y-3 p-3 rounded-xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <Label className="text-white text-xs font-semibold">
                  {isMainImage(editingImageIdx) ? "📸 Main Image (Swipe Card)" : `📸 ${getImageLabel(editingImageIdx)}`}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] px-2 text-white/40"
                  onClick={() => {
                    updateImagePos(editingImageIdx, "x", 50);
                    updateImagePos(editingImageIdx, "y", 0); // Reset to top
                    updateImagePos(editingImageIdx, "zoom", 100);
                  }}
                >
                  Reset
                </Button>
              </div>

              {/* Preview frame */}
              <div className={`relative w-full rounded-2xl overflow-hidden shadow-card ${isMainImage(editingImageIdx) ? "aspect-[4/5] max-h-[70vh]" : "aspect-square max-h-[40vh]"
                }`}>
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={profile.images[editingImageIdx]}
                    alt="Preview"
                    className="absolute w-full h-full object-cover pointer-events-none"
                    style={{
                      objectPosition: "50% 0%", // Always show top part
                      transform: `scale(${getPos(editingImageIdx).zoom / 100}) translateX(${50 - getPos(editingImageIdx).x}%)`,
                      transformOrigin: "50% 0%", // Anchor from top center
                    }}
                    draggable={false}
                  />
                </div>
                {isMainImage(editingImageIdx) && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 pointer-events-none">
                      <p className="font-display font-bold text-lg text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                        {firstName(profile.name)}, {profile.age}
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
                  <MoveHorizontal className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                  <span className="text-[10px] text-white/40 w-6">L/R</span>
                  <Slider
                    value={[getPos(editingImageIdx).x]}
                    onValueChange={([v]) => updateImagePos(editingImageIdx, "x", v)}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <MoveVertical className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                  <span className="text-[10px] text-white/40 w-6">U/D</span>
                  <Slider
                    value={[0]} // Fixed to top
                    disabled={true}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <ZoomIn className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                  <span className="text-[10px] text-white/40 w-6">Zoom</span>
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
                className="w-full h-8 text-xs border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
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
        </>
      )}

      {editorStep === "about" && (
        <>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>👤</span>
            <div>
              <p style={{ color: "white", fontSize: 13, fontWeight: 800, margin: 0 }}>About You</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>A great bio gets 50% more messages. Be genuine — tell people who you really are!</p>
            </div>
          </div>
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div>
              <Label className="text-white/50 text-xs mb-1 block flex items-center gap-1.5">
                Name
                {profile.is_verified && <span className="inline-flex items-center gap-1 text-sky-400 text-[9px] font-bold"><span>✅</span>Verified — locked</span>}
              </Label>
              <Input
                value={profile.name}
                onChange={(e) => update("name", e.target.value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, ""))}
                placeholder="First name only"
                maxLength={30}
                disabled={!!profile.is_verified}
                className={`w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:border-pink-500/50 focus:outline-none ${profile.is_verified ? "opacity-60 cursor-not-allowed" : ""}`}
              />
              {profile.is_verified && (
                <p className="text-sky-400/60 text-[10px] mt-1">Your name was confirmed during verification and cannot be changed.</p>
              )}
            </div>
            <div>
              <Label className="text-white/50 text-xs mb-1 block">Age</Label>
              <Input type="number" min={18} max={99} value={profile.age} onChange={(e) => update("age", parseInt(e.target.value) || 18)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:border-pink-500/50 focus:outline-none" />
            </div>
          </div>

          {/* Gender */}
          <div>
            <Label className="text-white/50 text-xs mb-1 block">I am a</Label>
            <div className="grid grid-cols-4 gap-2">
              {GENDERS.map((g) => (
                <button key={g} type="button" onClick={() => update("gender", g)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${profile.gender === g ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white border-pink-500/50" : "bg-white/5 text-white/40 border-white/10 hover:border-pink-500/30"}`}>
                  {g === "Male" ? "👨 Male" : g === "Female" ? "👩 Female" : g === "Non-binary" ? "🌈 Non-binary" : "🤍 Other"}
                </button>
              ))}
            </div>
          </div>

          {/* Seeking — this auto-filters your feed */}
          <div>
            <Label className="text-white/50 text-xs mb-1.5 block">I want to meet <span className="text-white/30 font-normal">(auto-filters your feed)</span></Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "Women", icon: "👩", label: "Women" },
                { value: "Men",   icon: "👨", label: "Men" },
                { value: "Everyone", icon: "💞", label: "Everyone" },
              ].map((opt) => (
                <button key={opt.value} type="button" onClick={() => update("looking_for", opt.value)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all ${profile.looking_for === opt.value ? "bg-gradient-to-br from-pink-500/20 to-violet-500/20 border-pink-500/60 text-white shadow-md" : "bg-white/5 text-white/40 border-white/10 hover:border-pink-500/30"}`}>
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-[11px] font-bold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Serious Intent */}
          <div>
            <Label className="text-white/50 text-xs mb-1 block">💍 Serious Intent <span className="text-white/25 font-normal normal-case">(shown prominently on your profile)</span></Label>
            <div className="flex gap-2">
              {([
                { value: "marriage", label: "💍 Open to Marriage", color: "amber" },
                { value: "dating",   label: "💕 Dating First",     color: "pink"  },
                { value: "unsure",   label: "🤔 Not Sure Yet",     color: "slate" },
              ] as const).map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => update("intent", profile.intent === value ? "" : value)}
                  className={`flex-1 px-2 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                    profile.intent === value
                      ? color === "amber" ? "bg-amber-500/25 border-amber-400/60 text-amber-200"
                        : color === "pink" ? "bg-pink-500/25 border-pink-400/60 text-pink-200"
                        : "bg-white/15 border-white/30 text-white/80"
                      : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/50 text-xs mb-1 block">Country *</Label>
              <Select value={profile.country} onValueChange={(v) => {
                update("country", v);
                const dialCode = getDialCode(v);
                if (!profile.whatsapp || profile.whatsapp === "+" || profile.whatsapp.trim() === "") {
                  update("whatsapp", dialCode + " ");
                }
              }}>
                <SelectTrigger className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:border-pink-500/50 focus:outline-none">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {ALL_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/50 text-xs mb-1 block">City</Label>
              <Input value={profile.city} onChange={(e) => update("city", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:border-pink-500/50 focus:outline-none" />
            </div>
            <div>
              <Label className="text-white/50 text-xs mb-1 block">Residing Country (if different)</Label>
              <Select value={profile.residing_country || ""} onValueChange={(v) => update("residing_country", v || null)}>
                <SelectTrigger className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:border-pink-500/50 focus:outline-none">
                  <SelectValue placeholder="Same as country" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="">Same as country</SelectItem>
                  {ALL_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/50 text-xs mb-1 block">Visited Countries</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {profile.visited_countries?.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs">
                      {c}
                      <button
                        onClick={() => update("visited_countries", profile.visited_countries?.filter((x) => x !== c) || [])}
                        className="w-3 h-3 rounded-full bg-blue-500/25 hover:bg-blue-500/40 flex items-center justify-center"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </span>
                  ))}
                </div>
                <Select
                  value=""
                  onValueChange={(v) => {
                    if (v && !profile.visited_countries?.includes(v)) {
                      update("visited_countries", [...(profile.visited_countries || []), v]);
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:border-pink-500/50 focus:outline-none">
                    <SelectValue placeholder="Add visited country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="">Add visited country</SelectItem>
                    {ALL_COUNTRIES.filter((c) => !profile.visited_countries?.includes(c)).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Phone–country mismatch warning */}
          {phoneCountryMismatch && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 space-y-1">
              <p className="font-semibold">⚠️ Country mismatch detected</p>
              <p>Your phone prefix (<strong>{getDialCode(detectedPhoneCountry!)}</strong>) is registered to <strong>{detectedPhoneCountry}</strong>, but your profile is set to <strong>{profile.country}</strong>.</p>
              <p>Your profile will be listed in <strong>{detectedPhoneCountry}</strong> until an admin approves the change. Your request will be saved automatically.</p>
            </div>
          )}
          {countryOverrideRequested && !phoneCountryMismatch && !countryOverrideApproved && (
            <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-3 text-xs text-blue-300">
              ⏳ Country override request pending admin approval.
            </div>
          )}
          {countryOverrideApproved && (
            <div className="rounded-xl border border-green-400/30 bg-green-500/10 p-3 text-xs text-green-300">
              ✅ Admin has approved your country listing.
            </div>
          )}

          {/* About Section */}
          <div className="mt-6">
            <Label className="text-white/50 text-xs mb-1 block">Bio</Label>
            <Textarea
              value={profile.bio}
              onChange={(e) => update("bio", sanitizeBio(e.target.value))}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:border-pink-500/50 focus:outline-none resize-none"
              placeholder="About you (no emoji or phone numbers, max 250 characters)"
            />
            <p className="text-white/40 text-[10px] mt-1 text-right">
              {profile.bio.length}/{BIO_MAX_LENGTH}
            </p>
          </div>

          {/* ── Contact Number ──────────────────────────────────────── */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-white/50 text-xs flex items-center gap-1.5">
                📱 Contact Number
                {contactLocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    🔒 Locked
                  </span>
                )}
              </Label>
              {contactLocked && !profile.contact_unlock_requested && (
                <button
                  onClick={handleRequestContactUnlock}
                  className="text-[10px] font-semibold text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors"
                >
                  Request change
                </button>
              )}
              {contactLocked && profile.contact_unlock_requested && (
                <span className="text-[10px] text-amber-400/70 font-semibold">Pending admin approval</span>
              )}
            </div>

            {contactLocked ? (
              /* ── Locked view ── */
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                <span className="text-xl leading-none flex-shrink-0">
                  {({ WhatsApp: "💬", WeChat: "💚", iMessage: "🍏", Telegram: "✈️", Line: "🟢", Signal: "🔵", Viber: "💜", KakaoTalk: "💛" } as Record<string, string>)[profile.contact_provider] ?? "📱"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm font-mono truncate">{profile.whatsapp}</p>
                  <p className="text-white/40 text-[10px]">{profile.contact_provider}</p>
                </div>
                <span className="text-amber-400 text-lg">🔒</span>
              </div>
            ) : (
              /* ── Edit view ── */
              <div className="space-y-2">
                {/* Provider dropdown */}
                <select
                  value={profile.contact_provider}
                  onChange={e => update("contact_provider" as any, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm appearance-none"
                >
                  {["WhatsApp","WeChat","iMessage","Telegram","Line","Signal","Viber","KakaoTalk"].map(p => (
                    <option key={p} value={p} className="bg-[#1a1a1a]">{p}</option>
                  ))}
                </select>

                {/* Number input */}
                <Input
                  value={profile.whatsapp}
                  onChange={e => update("whatsapp", e.target.value)}
                  placeholder="+62 812 3456 7890"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:border-pink-500/50 focus:outline-none font-mono"
                />
                <p className="text-white/30 text-[10px]">Include country code · e.g. +62 for Indonesia, +1 for US</p>

                {/* Confirm button */}
                {profile.whatsapp && profile.whatsapp.trim().length > 5 && (
                  <button
                    onClick={handleConfirmContact}
                    disabled={confirmingContact}
                    className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, rgba(236,72,153,0.25), rgba(168,85,247,0.2))",
                      border: "1px solid rgba(236,72,153,0.4)",
                      color: "#f9a8d4",
                    }}
                  >
                    {confirmingContact ? "Confirming…" : "✓ Confirm & Lock Contact"}
                  </button>
                )}
                <p className="text-white/25 text-[10px] text-center leading-snug">
                  Once confirmed, your contact is locked. Contact admin to make changes.
                </p>
              </div>
            )}
          </div>

          {/* Voice Intro */}
          <VoiceRecorder
            voiceUrl={profile.voice_intro_url}
            userId={userId}
            onSaved={(url) => update("voice_intro_url", url)}
          />

          {/* Video Intro */}
          <VideoIntroUploader
            videoUrl={profile.video_url}
            userId={userId}
            onSaved={(url) => update("video_url", url)}
          />
        </>
      )}


      {editorStep === "details" && (
        <>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>🌿</span>
            <div>
              <p style={{ color: "white", fontSize: 13, fontWeight: 800, margin: 0 }}>About Your Life</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>Details about your lifestyle help find truly compatible matches. The more you share, the better your matches!</p>
            </div>
          </div>
          {/* Lifestyle Section */}
          <div className="pb-2">
            <BasicInfoEditor
              value={profile.basic_info as any}
              onChange={(v) => update("basic_info", v as unknown as Record<string, unknown>)}
            />
            <LifestyleEditor
              value={profile.lifestyle_info as any}
              onChange={(v) => update("lifestyle_info", v as unknown as Record<string, unknown>)}
            />
          </div>

          {/* Goals Section */}
          <div className="pb-2">
            <RelationshipGoalsEditor
              value={profile.relationship_goals as any}
              onChange={(v) => update("relationship_goals", v as unknown as Record<string, unknown>)}
            />
            <GiftDeliverySettings
              giftDeliveryOptedIn={!!(profile as any).gift_delivery_opted_in}
              deliveryAddress={(profile as any).delivery_address || ""}
              onOptInChange={(val) => update("gift_delivery_opted_in" as any, val)}
              onAddressChange={(val) => update("delivery_address" as any, val)}
            />
          </div>

          {/* Dating Preferences */}
          <div>
            <Label className="text-white/50 text-xs mb-1 block flex items-center gap-1">
              <Languages className="w-3 h-3" /> Languages I Speak
            </Label>
            <div className="space-y-2">
              {/* Native language (auto from country) */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <span className="text-sm text-white flex-1 flex items-center gap-2">
                  <span className="text-base leading-none">{getCountryFlag(profile.country)}</span>
                  {getNativeLanguage(profile.country)}
                </span>
                <span className="text-[10px] bg-pink-500/15 text-pink-400 px-2 py-0.5 rounded-full font-medium">Native</span>
              </div>

              {/* Extra languages */}
              {profile.languages.map((lang, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-sm text-white flex-1 flex items-center gap-2">
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
                  <SelectTrigger className="bg-white/5 border-white/10 h-9 text-sm border-dashed text-white">
                    <div className="flex items-center gap-1.5 text-white/40">
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
            <Label className="text-white/50 text-xs mb-1 block">Orientation (optional)</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "", label: "Not specified", icon: "✨" },
                { value: "Straight", label: "Straight", icon: "💑" },
                { value: "Gay", label: "Gay", icon: "🏳️‍🌈" },
                { value: "Lesbian", label: "Lesbian", icon: "🌸" },
                { value: "Bisexual", label: "Bisexual", icon: "💜" },
                { value: "Pansexual", label: "Pansexual", icon: "🌈" },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => update("orientation", o.value)}
                  className={`py-2.5 rounded-xl text-xs font-medium border transition-all flex flex-col items-center gap-1 ${profile.orientation === o.value
                    ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white border-pink-500/50 shadow-md"
                    : "bg-white/5 text-white/50 border-white/10 hover:border-pink-500/30"
                    }`}
                >
                  <span className="text-base leading-none">{o.icon}</span>
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="text-white/50 text-xs mb-1 block">Map Location</Label>
            <Button
              variant="outline"
              onClick={handleSetLocation}
              disabled={locating}
              className="w-full h-9 text-sm border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-xl"
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
              <p className="text-[10px] text-white/40 mt-1 text-center">
                📍 Approx: {profile.latitude.toFixed(2)}°, {profile.longitude?.toFixed(2)}°
              </p>
            )}
          </div>

        </>
      )}

      {editorStep === "status" && (
        <>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <div>
              <p style={{ color: "white", fontSize: 13, fontWeight: 800, margin: 0 }}>Status & Badges</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>Badges boost your visibility and tell people your vibe immediately. Active badges increase profile views by 40%!</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-xs font-semibold">Badges</p>
            <button
              type="button"
              onClick={() => setShowBadgesHelp(true)}
              className="inline-flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white transition-colors"
            >
              <HelpCircle className="w-4 h-4" /> Help
            </button>
          </div>

          <Dialog open={showBadgesHelp} onOpenChange={setShowBadgesHelp}>
            <DialogContent className="bg-[#111] border-white/10 text-white max-w-sm rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Badge meanings</DialogTitle>
                <DialogDescription className="text-white/50">
                  You can select 1 badge at a time (or none). Badges help others understand your vibe.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-white">Free Tonight</p>
                  <p className="text-white/50 text-xs mt-0.5">Shows you're available tonight. Auto-clears at midnight.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Plus-One Premium</p>
                  <p className="text-white/50 text-xs mt-0.5">Signals you're open to events and social outings.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Generous Lifestyle</p>
                  <p className="text-white/50 text-xs mt-0.5">You enjoy treating companions to dinners, events, or experiences.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Weekend Plans</p>
                  <p className="text-white/50 text-xs mt-0.5">Usually available on weekends for meetups and social plans.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Late Night Chat</p>
                  <p className="text-white/50 text-xs mt-0.5">Prefer nighttime conversations and late evening activity.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">No Drama</p>
                  <p className="text-white/50 text-xs mt-0.5">Prefer calm, positive, and respectful connections.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Travel Badge */}
          {(() => {
            const INDO_CITIES = ["Bali","Jogja","Jakarta","Surabaya","Bandung","Lombok","Medan","Makassar","Semarang","Malang","Manado","Labuan Bajo","Solo","Batam","Palembang","Balikpapan","Denpasar","Flores","Raja Ampat","Komodo"];
            const BADGE_TYPES: { key: "otw" | "just_arrived" | "visiting"; label: string; icon: string; desc: string }[] = [
              { key: "otw",           label: "On the Way",   icon: "🛫", desc: "Otw [City]" },
              { key: "just_arrived",  label: "Just Arrived", icon: "🛬", desc: "🛬 [City]" },
              { key: "visiting",      label: "Visiting",     icon: "📍", desc: "📍 [City]" },
            ];

            const expiresAt = profile.visiting_badge_expires_at ? new Date(profile.visiting_badge_expires_at) : null;
            const isLive = profile.is_visiting && expiresAt && expiresAt > new Date();
            const hoursLeft = expiresAt ? Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 3600000)) : 0;

            const activateBadge = () => {
              const expires = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
              update("is_visiting", true);
              update("visiting_badge_expires_at", expires);
              clearOtherBadges("is_visiting");
            };
            const deactivateBadge = () => {
              update("is_visiting", false);
              update("visiting_city", "");
              update("visiting_badge_expires_at", null);
            };

            const previewLabel =
              profile.visiting_badge_type === "otw" ? `Otw ${profile.visiting_city || "…"}` :
              profile.visiting_badge_type === "just_arrived" ? `🛬 ${profile.visiting_city || "…"}` :
              `📍 ${profile.visiting_city || "…"}`;

            return (
              <div className="rounded-xl p-3 space-y-3 bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">✈️</span>
                    <div>
                      <p className="text-white text-sm font-medium">Travel Badge</p>
                      <p className="text-white/40 text-[10px]">Show locals your travel status · auto-clears in 48h</p>
                    </div>
                  </div>
                  {isLive && (
                    <button
                      onClick={deactivateBadge}
                      className="text-[10px] font-bold text-red-400/80 border border-red-400/30 rounded-lg px-2 py-1"
                    >Clear</button>
                  )}
                </div>

                {/* Badge type selector */}
                <div className="flex gap-2">
                  {BADGE_TYPES.map((bt) => {
                    const sel = profile.visiting_badge_type === bt.key;
                    return (
                      <button
                        key={bt.key}
                        onClick={() => update("visiting_badge_type", bt.key)}
                        className="flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 border transition-all"
                        style={{
                          background: sel ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)",
                          borderColor: sel ? "rgba(56,189,248,0.5)" : "rgba(255,255,255,0.1)",
                        }}
                      >
                        <span className="text-lg">{bt.icon}</span>
                        <span className="text-[10px] font-bold" style={{ color: sel ? "#7dd3fc" : "rgba(255,255,255,0.5)" }}>{bt.label}</span>
                        <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.25)" }}>{bt.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* City dropdown */}
                <select
                  value={profile.visiting_city}
                  onChange={(e) => update("visiting_city", e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500/50 focus:outline-none"
                  style={{ color: profile.visiting_city ? "white" : "rgba(255,255,255,0.3)" }}
                >
                  <option value="" disabled style={{ color: "#555" }}>🥂 Select a city…</option>
                  {INDO_CITIES.map((c) => (
                    <option key={c} value={c} style={{ color: "white", background: "#111" }}>🥂 {c}</option>
                  ))}
                </select>

                {/* Activate / expiry */}
                {!isLive ? (
                  <button
                    onClick={activateBadge}
                    disabled={!profile.visiting_city}
                    className="w-full py-2 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: profile.visiting_city ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.05)",
                      border: profile.visiting_city ? "1px solid rgba(56,189,248,0.5)" : "1px solid rgba(255,255,255,0.1)",
                      color: profile.visiting_city ? "#7dd3fc" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    Activate for 48h
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-sky-400/10 border border-sky-400/30 rounded-lg px-3 py-2">
                    <span className="text-sm">✅</span>
                    <div>
                      <p className="text-sky-300 text-xs font-bold">Badge live · <span className="font-normal">{previewLabel}</span></p>
                      <p className="text-sky-400/60 text-[10px]">{hoursLeft}h remaining · auto-clears after 48h</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Free Tonight */}
          <div className="rounded-xl p-3 space-y-2 bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-yellow-400" fill="currentColor" />
                <div>
                  <p className="text-white text-sm font-medium">Free Tonight</p>
                  <p className="text-white/40 text-[10px]">
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
          <div className="rounded-xl p-3 space-y-2 bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-400" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-white text-sm font-medium">Plus-One Premium</p>
                    <span className="bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">$19.99</span>
                  </div>
                  <p className="text-white/40 text-[10px]">Show you're open to events & social outings</p>
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
          <div className="rounded-xl p-3 space-y-2 bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-white text-sm font-medium">Generous Lifestyle</p>
                  <p className="text-white/40 text-[10px]">You enjoy treating companions to dinners, events & memorable experiences</p>
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
          <div className="rounded-xl p-3 space-y-2 bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-white text-sm font-medium">Weekend Plans</p>
                  <p className="text-white/40 text-[10px]">Usually available on weekends for meetups & social plans</p>
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
          <div className="rounded-xl p-3 space-y-2 bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MoonStar className="w-4 h-4 text-indigo-400" />
                <div>
                  <p className="text-white text-sm font-medium">Late Night Chat</p>
                  <p className="text-white/40 text-[10px]">Typically active later in the evening; prefer nighttime conversations</p>
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
          <div className="rounded-xl p-3 space-y-2 bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
                <div>
                  <p className="text-white text-sm font-medium">No Drama</p>
                  <p className="text-white/40 text-[10px]">Prefer relaxed, positive & respectful connections</p>
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

          {/* ── First Contact Preference ─────────────────────────────── */}
          <div>
            <Label className="text-white/50 text-xs mb-2 block flex items-center gap-1">
              📱📹 First Contact Preference
            </Label>
            <p className="text-white/40 text-[10px] mb-3">
              How would you like matches to connect with you?
            </p>
            <div className="space-y-2">
              {CONTACT_PREFERENCE_OPTIONS.map((opt) => {
                const isSelected = profile.contact_preference === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("contact_preference", opt.value)}
                    className="w-full text-left transition-all"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 14,
                      border: isSelected
                        ? "2px solid rgba(236,72,153,0.7)"
                        : "1.5px solid rgba(255,255,255,0.08)",
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(236,72,153,0.12), rgba(168,85,247,0.08))"
                        : "rgba(255,255,255,0.04)",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isSelected ? "#ec4899" : "rgba(255,255,255,0.8)",
                        margin: 0,
                      }}>
                        {opt.label}
                      </p>
                      <p style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.4)",
                        margin: "2px 0 0",
                      }}>
                        {opt.description}
                      </p>
                    </div>
                    {isSelected && (
                      <span style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: "linear-gradient(135deg, #ec4899, #a855f7)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, color: "white", fontWeight: 800, flexShrink: 0,
                      }}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* First Date Idea */}
          <div>
            <Label className="text-white/50 text-xs mb-1 block flex items-center gap-1">
              <Heart className="w-3 h-3 text-primary" /> First Date Would Be Nice...
            </Label>
            <Select value={profile.first_date_idea || ""} onValueChange={(v) => update("first_date_idea", v || null)}>
              <SelectTrigger className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:border-pink-500/50 focus:outline-none"><SelectValue placeholder="Select your ideal first date" /></SelectTrigger>
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
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#0a0a0a",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))",
        display: "flex",
        gap: 8,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.4)",
        zIndex: 50,
      }}>
        {(() => {
          const steps = ["photos", "about", "details", "status"];
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
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.7)",
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
                        basic_info: profile.basic_info as unknown as import("@/integrations/supabase/types").Json,
                        lifestyle_info: profile.lifestyle_info as unknown as import("@/integrations/supabase/types").Json,
                        relationship_goals: profile.relationship_goals as unknown as import("@/integrations/supabase/types").Json,
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

      {/* Uplift badge — shown when own profile is locked */}
      <ProfileLockSection />

      {/* Deactivate / Delete account */}
      <div className="pt-2 border-t border-white/10 space-y-1">
        <button
          onClick={() => setShowDeactivateConfirm(true)}
          className="w-full py-2.5 text-xs text-white/40 hover:text-amber-400 transition-colors flex items-center justify-center gap-1.5"
        >
          <PauseCircle className="w-3.5 h-3.5" />
          Deactivate my account
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full py-2.5 text-xs text-white/40 hover:text-destructive transition-colors flex items-center justify-center gap-1.5"
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
