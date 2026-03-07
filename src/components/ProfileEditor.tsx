import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, X, MapPin, Save, Loader2, CalendarHeart, Star, ZoomIn, ZoomOut, MoveHorizontal, MoveVertical, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import VoiceRecorder from "./VoiceRecorder";
import { FIRST_DATE_IDEAS } from "@/data/firstDateIdeas";
import DatePlacesEditor, { DatePlace } from "./DatePlacesEditor";
import { LANGUAGES, getNativeLanguage } from "@/data/languages";
import { Languages, Plus, X as XIcon } from "lucide-react";

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
}

const ProfileEditor = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSlot, setUploadSlot] = useState<number>(0);
  const [userId, setUserId] = useState<string>("");
  const [editingImageIdx, setEditingImageIdx] = useState<number | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("name, age, gender, looking_for, country, city, bio, whatsapp, avatar_url, latitude, longitude, images, available_tonight, voice_intro_url, image_positions, first_date_idea, first_date_places, languages")
        .eq("id", user.id)
        .single();

      if (data) {
        const imgs = (data as any).images || [];
        const positions: ImagePosition[] = (data as any).image_positions || [];
        // Ensure positions array matches images length
        while (positions.length < imgs.length) positions.push({ ...defaultPos });

        setProfile({
          name: data.name,
          age: data.age,
          gender: data.gender,
          looking_for: data.looking_for,
          country: data.country,
          city: data.city || "",
          bio: data.bio || "",
          whatsapp: data.whatsapp,
          avatar_url: data.avatar_url,
          images: imgs,
          latitude: data.latitude,
          longitude: data.longitude,
          available_tonight: (data as any).available_tonight || false,
          voice_intro_url: (data as any).voice_intro_url || null,
          image_positions: positions,
          first_date_idea: (data as any).first_date_idea || null,
          first_date_places: (data as any).first_date_places || [],
          languages: (data as any).languages || [],
        });
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const update = (key: keyof ProfileData, value: any) => {
    setProfile((p) => p ? { ...p, [key]: value } : p);
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
        bio: profile.bio,
        whatsapp: profile.whatsapp,
        avatar_url: profile.avatar_url,
        images: profile.images as any,
        latitude: profile.latitude,
        longitude: profile.longitude,
        available_tonight: profile.available_tonight as any,
        voice_intro_url: profile.voice_intro_url as any,
        image_positions: profile.image_positions as any,
        first_date_idea: profile.first_date_idea as any,
        first_date_places: profile.first_date_places as any,
        languages: profile.languages as any,
        main_image_pos: `${mainPos.x}% ${mainPos.y}%` as any,
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
          <div className={`relative w-full rounded-2xl overflow-hidden border border-border ${
            isMainImage(editingImageIdx) ? "aspect-[4/5] max-h-[50vh]" : "aspect-square max-h-[40vh]"
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-muted-foreground text-xs mb-1 block">Name</Label>
          <Input value={profile.name} onChange={(e) => update("name", e.target.value)} className="bg-muted border-border h-9 text-sm" />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs mb-1 block">Age</Label>
          <Input type="number" min={18} max={99} value={profile.age} onChange={(e) => update("age", parseInt(e.target.value) || 18)} className="bg-muted border-border h-9 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-muted-foreground text-xs mb-1 block">Gender</Label>
          <Select value={profile.gender} onValueChange={(v) => update("gender", v)}>
            <SelectTrigger className="bg-muted border-border h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-muted-foreground text-xs mb-1 block">Looking for</Label>
          <Select value={profile.looking_for} onValueChange={(v) => update("looking_for", v)}>
            <SelectTrigger className="bg-muted border-border h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{LOOKING_FOR.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-muted-foreground text-xs mb-1 block">Country</Label>
          <Input value={profile.country} onChange={(e) => update("country", e.target.value)} className="bg-muted border-border h-9 text-sm" />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs mb-1 block">City</Label>
          <Input value={profile.city} onChange={(e) => update("city", e.target.value)} className="bg-muted border-border h-9 text-sm" />
        </div>
      </div>

      <div>
        <Label className="text-muted-foreground text-xs mb-1 block">WhatsApp</Label>
        <Input value={profile.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} className="bg-muted border-border h-9 text-sm" />
      </div>

      {/* Languages */}
      <div>
        <Label className="text-muted-foreground text-xs mb-1 block flex items-center gap-1">
          <Languages className="w-3 h-3" /> Languages I Speak
        </Label>
        <div className="space-y-2">
          {/* Native language (auto from country) */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border">
            <span className="text-sm text-foreground flex-1">{getNativeLanguage(profile.country)}</span>
            <span className="text-[10px] text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Native</span>
          </div>
          
          {/* Extra languages */}
          {profile.languages.map((lang, idx) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border">
              <span className="text-sm text-foreground flex-1">{lang}</span>
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
          {profile.languages.length < 3 && (
            <Select
              value=""
              onValueChange={(v) => {
                if (v && !profile.languages.includes(v) && v !== getNativeLanguage(profile.country)) {
                  update("languages", [...profile.languages, v]);
                }
              }}
            >
              <SelectTrigger className="bg-muted border-border h-9 text-sm border-dashed">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add a language ({3 - profile.languages.length} remaining)</span>
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

      <div>
        <Label className="text-muted-foreground text-xs mb-1 block">Bio</Label>
        <Textarea value={profile.bio} onChange={(e) => update("bio", e.target.value)} rows={3} className="bg-muted border-border text-sm resize-none" />
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

      {/* Available Tonight */}
      <div className="flex items-center justify-between glass rounded-xl p-3">
        <div className="flex items-center gap-2">
          <CalendarHeart className="w-4 h-4 text-secondary" />
          <div>
            <p className="text-foreground text-sm font-medium">Available Tonight</p>
            <p className="text-muted-foreground text-[10px]">Show a badge on your profile</p>
          </div>
        </div>
        <Switch
          checked={profile.available_tonight}
          onCheckedChange={(checked) => update("available_tonight", checked)}
        />
      </div>

      {/* First Date Idea */}
      <div>
        <Label className="text-muted-foreground text-xs mb-1 block flex items-center gap-1">
          <Heart className="w-3 h-3 text-primary" /> First Date Would Be Nice...
        </Label>
        <Select value={profile.first_date_idea || ""} onValueChange={(v) => update("first_date_idea", v || null)}>
          <SelectTrigger className="bg-muted border-border h-9 text-sm"><SelectValue placeholder="Select your ideal first date" /></SelectTrigger>
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

      {/* Voice Intro */}
      <VoiceRecorder
        voiceUrl={profile.voice_intro_url}
        userId={userId}
        onSaved={(url) => update("voice_intro_url", url)}
      />

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving || profile.images.length < 2}
        className="w-full gradient-love text-primary-foreground border-0 font-bold h-11 rounded-xl"
      >
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Profile</>}
      </Button>
    </div>
  );
};

export default ProfileEditor;
