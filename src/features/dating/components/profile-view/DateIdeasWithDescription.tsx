import { useState } from "react";
import { DateIdeasSelector } from "./DateIdeasSelector";
import { DateIdeaDescription } from "./DateIdeaDescription";

interface DateIdeasWithDescriptionProps {
  selectedIdeas: string[];
  onSelectionChange: (ideas: string[]) => void;
  maxSelection?: number;
  className?: string;
}

export const DateIdeasWithDescription = ({ 
  selectedIdeas, 
  onSelectionChange, 
  maxSelection = 3,
  className
}: DateIdeasWithDescriptionProps) => {
  const [selectedDateIdea, setSelectedDateIdea] = useState<string | null>(null);

  const handleDateIdeaSelect = (idea: string | null) => {
    setSelectedDateIdea(idea);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Date Ideas Selector */}
      <DateIdeasSelector
        selectedIdeas={selectedIdeas}
        onSelectionChange={onSelectionChange}
        maxSelection={maxSelection}
        onDateIdeaSelect={handleDateIdeaSelect}
      />

      {/* Date Idea Description */}
      <DateIdeaDescription
        selectedDateIdea={selectedDateIdea}
      />
    </div>
  );
};
