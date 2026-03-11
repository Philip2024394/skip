import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DateIdeasImage {
  id: string;
  idea_name: string;
  image_url: string;
  image_alt: string | null;
  category: string;
  is_active: boolean;
}

interface SelectedDateIdeasProps {
  selectedIdeas: string[];
  className?: string;
}

export const SelectedDateIdeas = ({ selectedIdeas, className }: SelectedDateIdeasProps) => {
  const [dateIdeasImages, setDateIdeasImages] = useState<DateIdeasImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDateIdeasImages();
  }, []);

  const fetchDateIdeasImages = async () => {
    try {
      const { data, error } = await supabase
        .from("date_ideas_images")
        .select("*")
        .eq("is_active", true);

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

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  if (selectedIdeas.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center p-8">
          <p className="text-white/60 text-sm">No date ideas selected yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">My Date Ideas</h3>
        <Badge variant="outline" className="text-white border-white/20">
          {selectedIdeas.length} selected
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {selectedIdeas.map((idea, index) => {
          const imageData = getImageForIdea(idea);
          
          return (
            <Card key={idea} className="bg-white/5 border-white/10 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Image */}
                  {imageData && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={imageData.image_url}
                        alt={imageData.image_alt || idea}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Index indicator */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium text-sm line-clamp-2 mb-1">
                      {idea}
                    </h4>
                    
                    {imageData && (
                      <Badge 
                        variant="secondary" 
                        className="bg-white/10 text-white/80 border-white/20 text-xs"
                      >
                        {imageData.category}
                      </Badge>
                    )}
                    
                    <p className="text-white/60 text-xs mt-2 leading-relaxed">
                      💕 Perfect for getting to know someone special with this fun and engaging date idea.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">💕</span>
          </div>
          <div>
            <p className="text-white font-medium text-sm">
              Your Perfect Date Ideas
            </p>
            <p className="text-white/60 text-xs">
              These ideas show what kind of experiences you're looking for
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
