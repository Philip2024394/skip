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
  "🌳": "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400&h=300&fit=crop",
  "🎬": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop",
  "🌅": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
  "🍝": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
  "🌮": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop",
  "🍸": "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop",
  "🍦": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=300&fit=crop",
  "🎵": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
  "🎯": "https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=300&fit=crop",
  "🕯️": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
  "✨": "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop",
  "🧺": "https://images.unsplash.com/photo-1526662092594-e98c1e356d28?w=400&h=300&fit=crop",
  "🌊": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
  "🌃": "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop",
  "🍰": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
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
      <Label className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
        <MapPin className="w-3 h-3 text-primary" /> First Date Places (up to 3)
      </Label>

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

          {/* URL input */}
          <div className="flex gap-1.5">
            <Input
              value={place.url}
              onChange={(e) => updatePlace(idx, "url", e.target.value)}
              placeholder="Paste place URL (Google Maps, website...)"
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
