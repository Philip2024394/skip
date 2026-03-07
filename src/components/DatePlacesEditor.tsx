import { useState } from "react";
import { Plus, X, Loader2, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FIRST_DATE_IDEAS } from "@/data/firstDateIdeas";

export interface DatePlace {
  idea: string;
  url: string;
  image_url: string | null;
  title: string | null;
}

interface DatePlacesEditorProps {
  places: DatePlace[];
  onChange: (places: DatePlace[]) => void;
}

const CATEGORY_IMAGES: Record<string, string> = {
  "☕": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop",
  "🧋": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  "🌳": "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400&h=300&fit=crop",
  "🎬": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop",
  "🌅": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
  "🍝": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
  "🌮": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop",
  "🍸": "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop",
  "🍹": "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&h=300&fit=crop",
  "🍺": "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=300&fit=crop",
  "🍦": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=300&fit=crop",
  "🎵": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
  "🎷": "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=300&fit=crop",
  "🎯": "https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=300&fit=crop",
  "🎳": "https://images.unsplash.com/photo-1585504198199-20277593b94f?w=400&h=300&fit=crop",
  "🕯️": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
  "✨": "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop",
  "🧺": "https://images.unsplash.com/photo-1526662092594-e98c1e356d28?w=400&h=300&fit=crop",
  "🌊": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
  "🌃": "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop",
  "🍰": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
  "🥐": "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=400&h=300&fit=crop",
  "🍕": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
  "🍣": "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=300&fit=crop",
  "🌸": "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop",
  "🏙️": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop",
  "🌙": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
  "🍷": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop",
  "🚤": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop",
  "🌇": "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400&h=300&fit=crop",
  "🎶": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
  "🦢": "https://images.unsplash.com/photo-1526662092594-e98c1e356d28?w=400&h=300&fit=crop",
  "🔥": "https://images.unsplash.com/photo-1475738198235-4b30fc29c482?w=400&h=300&fit=crop",
  "⭐": "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop",
  "🏛️": "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=300&fit=crop",
  "🏔️": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop",
  "🚲": "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=400&h=300&fit=crop",
  "🚣": "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop",
  "🎨": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop",
  "🎤": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
  "😂": "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400&h=300&fit=crop",
  "🔐": "https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=400&h=300&fit=crop",
  "⛸️": "https://images.unsplash.com/photo-1548777123-e216912df7d8?w=400&h=300&fit=crop",
  "💃": "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400&h=300&fit=crop",
  "🧘": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop",
  "💆": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop",
  "☀️": "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=300&fit=crop",
  "🧑‍🍳": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
  "🛒": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
  "⚡": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
};

const getEmojiFromIdea = (idea: string): string => {
  const match = idea.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);
  return match?.[match.length - 1] || "☕";
};

const getFallbackImage = (idea: string): string => {
  const emoji = getEmojiFromIdea(idea);
  return CATEGORY_IMAGES[emoji] || CATEGORY_IMAGES["☕"];
};

const DatePlacesEditor = ({ places, onChange }: DatePlacesEditorProps) => {
  const [fetchingIdx, setFetchingIdx] = useState<number | null>(null);

  const addPlace = () => {
    if (places.length >= 3) {
      toast.error("Maximum 3 date places");
      return;
    }
    onChange([...places, { idea: "", url: "", image_url: null, title: null }]);
  };

  const removePlace = (idx: number) => {
    onChange(places.filter((_, i) => i !== idx));
  };

  const updatePlace = (idx: number, field: keyof DatePlace, value: string | null) => {
    const updated = [...places];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const fetchPreview = async (idx: number) => {
    const url = places[idx].url;
    if (!url) {
      toast.error("Please enter a URL first");
      return;
    }

    setFetchingIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-og-image", {
        body: { url },
      });

      if (error || !data?.success) {
        // Use fallback image
        const fallback = getFallbackImage(places[idx].idea);
        updatePlace(idx, "image_url", fallback);
        toast.info("Using category image as preview");
      } else {
        updatePlace(idx, "image_url", data.image_url || getFallbackImage(places[idx].idea));
        if (data.title) updatePlace(idx, "title", data.title);
        toast.success("Preview loaded!");
      }
    } catch {
      const fallback = getFallbackImage(places[idx].idea);
      updatePlace(idx, "image_url", fallback);
      toast.info("Using category image as preview");
    }
    setFetchingIdx(null);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-muted-foreground text-xs mb-0.5 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-primary" /> My Suggested First Date Places (up to 3)
        </Label>
        <p className="text-[10px] text-muted-foreground mb-2">
          Add up to 3 places you'd love to visit on a first date. Paste an <span className="text-pink-400 font-medium">Instagram link</span> for the place — viewers can tap to see it on Instagram. 📸
        </p>
      </div>

      {places.map((place, idx) => (
        <div key={idx} className="p-3 rounded-xl border border-border bg-muted/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">Place {idx + 1}</span>
            <button onClick={() => removePlace(idx)} className="text-destructive hover:text-destructive/80">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Date idea type */}
          <Select value={place.idea} onValueChange={(v) => updatePlace(idx, "idea", v)}>
            <SelectTrigger className="bg-muted border-border h-8 text-xs">
              <SelectValue placeholder="Select date idea type" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {FIRST_DATE_IDEAS.map((idea) => (
                <SelectItem key={idea} value={idea} className="text-xs">{idea}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Instagram URL input */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#E1306C" }}>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              <span className="text-[10px] text-muted-foreground">Instagram link for this place</span>
            </div>
            <div className="flex gap-1.5">
              <Input
                value={place.url}
                onChange={(e) => updatePlace(idx, "url", e.target.value)}
                placeholder="https://www.instagram.com/p/... or place URL"
                className="bg-muted border-border h-8 text-xs flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-[10px] shrink-0"
                onClick={() => fetchPreview(idx)}
                disabled={fetchingIdx === idx || !place.url}
              >
                {fetchingIdx === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : "Preview"}
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground/70">Viewers tap the image to open the Instagram post 📱</p>
          </div>

          {/* Preview card */}
          {(place.image_url || place.idea) && (
            <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-muted">
              <img
                src={place.image_url || getFallbackImage(place.idea)}
                alt={place.idea}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-semibold drop-shadow-lg truncate">
                  {place.idea || "Select a date idea"}
                </p>
                {place.title && (
                  <p className="text-white/70 text-[10px] truncate">{place.title}</p>
                )}
              </div>
              {place.url && (
                <a
                  href={place.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      ))}

      {places.length < 3 && (
        <Button
          variant="outline"
          size="sm"
          onClick={addPlace}
          className="w-full h-8 text-xs border-dashed border-border"
        >
          <Plus className="w-3 h-3 mr-1" /> Add Date Place
        </Button>
      )}
    </div>
  );
};

export default DatePlacesEditor;
