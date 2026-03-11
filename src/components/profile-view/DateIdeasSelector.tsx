import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shuffle, Check } from "lucide-react";
import { FIRST_DATE_IDEAS } from "@/data/firstDateIdeas";

interface DateIdeasImage {
  id: string;
  idea_name: string;
  image_url: string;
  image_alt: string | null;
  category: string;
  is_active: boolean;
}

interface DateIdeasSelectorProps {
  selectedIdeas: string[];
  onSelectionChange: (ideas: string[]) => void;
  maxSelection?: number;
}

export const DateIdeasSelector = ({ 
  selectedIdeas, 
  onSelectionChange, 
  maxSelection = 3 
}: DateIdeasSelectorProps) => {
  const [dateIdeasImages, setDateIdeasImages] = useState<DateIdeasImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [randomizing, setRandomizing] = useState(false);

  useEffect(() => {
    fetchDateIdeasImages();
  }, []);

  const fetchDateIdeasImages = async () => {
    try {
      const { data, error } = await supabase
        .from("date_ideas_images")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });

      if (error) throw error;
      setDateIdeasImages(data || []);
    } catch (error) {
      console.error("Error fetching date ideas images:", error);
    } finally {
      setLoading(false);
    }
  };

  const getImageForIdea = (ideaName: string): DateIdeasImage | undefined => {
    return dateIdeasImages.find(img => img.idea_name === ideaName);
  };

  const toggleIdeaSelection = (ideaName: string) => {
    const isSelected = selectedIdeas.includes(ideaName);
    
    if (isSelected) {
      // Remove from selection
      onSelectionChange(selectedIdeas.filter(idea => idea !== ideaName));
    } else if (selectedIdeas.length < maxSelection) {
      // Add to selection if under limit
      onSelectionChange([...selectedIdeas, ideaName]);
    }
  };

  const randomizeSelection = async () => {
    setRandomizing(true);
    
    // Get available ideas that have images
    const availableIdeas = dateIdeasImages.map(img => img.idea_name);
    
    if (availableIdeas.length >= maxSelection) {
      // Select 3 random ideas
      const shuffled = [...availableIdeas].sort(() => Math.random() - 0.5);
      const randomSelection = shuffled.slice(0, maxSelection);
      onSelectionChange(randomSelection);
    }
    
    // Add animation delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setRandomizing(false);
  };

  const getIdeasByCategory = () => {
    const categories: { [key: string]: string[] } = {};
    
    FIRST_DATE_IDEAS.forEach(idea => {
      // Extract category from the comment lines in the source file
      // This is a simplified approach - in production, you might want to store categories separately
      let category = "Other";
      
      if (idea.includes("☕") || idea.includes("🍵") || idea.includes("🧋") || idea.includes("🥤")) {
        category = "Café & Drinks";
      } else if (idea.includes("🍝") || idea.includes("🍽️") || idea.includes("🌮") || idea.includes("🍣") || idea.includes("🍕") || idea.includes("🥐") || idea.includes("🍰") || idea.includes("🍦") || idea.includes("🍜")) {
        category = "Food & Dining";
      } else if (idea.includes("🌳") || idea.includes("🧺") || idea.includes("🦢") || idea.includes("🌅") || idea.includes("🏖️") || idea.includes("🏔️") || idea.includes("🌺") || idea.includes("🌲") || idea.includes("⛰️")) {
        category = "Outdoors & Nature";
      } else if (idea.includes("🎬") || idea.includes("🎵") || idea.includes("🎷") || idea.includes("😂") || idea.includes("🎤") || idea.includes("🎨") || idea.includes("🏛️") || idea.includes("💃")) {
        category = "Entertainment & Culture";
      } else if (idea.includes("🎳") || idea.includes("🎯") || idea.includes("🔐") || idea.includes("⛸️") || idea.includes("🏎️") || idea.includes("🎢")) {
        category = "Active & Fun";
      } else if (idea.includes("🌃") || idea.includes("⭐") || idea.includes("✨") || idea.includes("🔥") || idea.includes("🎶") || idea.includes("🛋️")) {
        category = "Romantic & Relaxed";
      } else if (idea.includes("🎣") || idea.includes("⛺") || idea.includes("🚗")) {
        category = "Outdoor Lifestyle";
      } else if (idea.includes("🛍️") || idea.includes("📚")) {
        category = "Simple & Modest";
      } else if (idea.includes("🕺") || idea.includes("💃") || idea.includes("🎧") || idea.includes("🍸") || idea.includes("🍹") || idea.includes("🍺")) {
        category = "Nightlife & Party";
      } else if (idea.includes("🐶") || idea.includes("🐱") || idea.includes("🎲") || idea.includes("🍪") || idea.includes("🎨") || idea.includes("🍬") || idea.includes("🪁")) {
        category = "Cute & Playful";
      }
      
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(idea);
    });
    
    return categories;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const categories = getIdeasByCategory();
  const selectedCount = selectedIdeas.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Select Your Date Ideas</h3>
          <p className="text-white/60 text-sm">
            Choose {maxSelection} ideas that best represent your ideal dates
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-white border-white/20">
            {selectedCount}/{maxSelection} selected
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={randomizeSelection}
            disabled={randomizing}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Shuffle className={`w-4 h-4 mr-2 ${randomizing ? 'animate-spin' : ''}`} />
            Random
          </Button>
        </div>
      </div>

      {/* Date Ideas Grid */}
      <div className="space-y-6">
        {Object.entries(categories).map(([category, ideas]) => (
          <div key={category}>
            <h4 className="text-white/80 font-medium mb-3 text-sm uppercase tracking-wide">
              {category}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ideas.map((idea) => {
                const isSelected = selectedIdeas.includes(idea);
                const imageData = getImageForIdea(idea);
                
                return (
                  <Card
                    key={idea}
                    className={`cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? "border-pink-500 bg-pink-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}
                    onClick={() => toggleIdeaSelection(idea)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        {/* Image */}
                        {imageData && (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={imageData.image_url}
                              alt={imageData.image_alt || idea}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            
                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium line-clamp-2 ${
                            isSelected ? "text-pink-400" : "text-white"
                          }`}>
                            {idea}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selection Summary */}
      {selectedIdeas.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h4 className="text-white font-medium mb-3">Your Selected Ideas:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedIdeas.map((idea) => {
              const imageData = getImageForIdea(idea);
              return (
                <Badge
                  key={idea}
                  variant="secondary"
                  className="bg-pink-500/20 text-pink-300 border-pink-500/30"
                >
                  {idea}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
