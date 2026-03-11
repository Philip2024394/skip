import { useState } from "react";

interface DateIdeaDescriptionProps {
  selectedDateIdea: string | null;
  className?: string;
}

// Mock descriptions for date ideas (275 characters including spaces)
const DATE_IDEA_DESCRIPTIONS: { [key: string]: string } = {
  "Coffee At A Cozy Café ☕": "Perfect for intimate conversations and getting to know someone special. A cozy coffee shop provides the ideal relaxed atmosphere for meaningful discussions. The warm lighting, comfortable seating, and aromatic coffee create a welcoming environment where you can both feel at ease while sharing stories and discovering common interests.",
  
  "Dinner At A Nice Restaurant 🍝": "An elegant dining experience that shows thoughtfulness and sophistication. Choose a restaurant with ambient lighting and excellent service to create a memorable evening. This setting allows for deeper conversations over delicious food, demonstrating your ability to plan special occasions and appreciate fine dining experiences together.",
  
  "Walk In The Park 🌳": "A refreshing outdoor activity that combines conversation with light exercise. Strolling through beautiful green spaces provides natural conversation starters and a relaxed atmosphere. The changing scenery keeps things interesting while allowing for comfortable pacing of discussions about life, dreams, and aspirations.",
  
  "Night At The Cinema 🎬": "Share the magic of movies and create lasting memories together. The dark theater creates an intimate setting where you can enjoy entertainment side by side. Post-movie discussions about favorite scenes, characters, and themes provide natural conversation starters and insights into each other's perspectives.",
  
  "Bowling Night Together 🎳": "A fun, lighthearted activity that brings out playful competition and teamwork. The casual atmosphere encourages laughter and friendly banter while the physical activity keeps energy levels high. Perfect for showing your fun side and creating memorable moments through shared experiences.",
  
  "Watching The Stars Together ⭐": "A romantic and peaceful experience that fosters deep connection under the night sky. Find a quiet spot away from city lights to share dreams, aspirations, and intimate conversations. The vastness of stars creates a magical backdrop for meaningful discussions about life and the future.",
  
  "Cooking Together At Home 🧑‍🍳": "An intimate and collaborative experience that reveals teamwork and creativity. Working together in the kitchen allows for natural conversation, playful moments, and the satisfaction of creating something delicious. This activity shows your ability to cooperate and enjoy simple pleasures together.",
  
  "Beach Sunset Walk 🌅": "A breathtakingly romantic experience combining natural beauty with intimate conversation. The golden hour lighting creates picture-perfect moments while the sound of waves provides a soothing backdrop. This setting encourages deep discussions and creates unforgettable memories together.",
  
  "Live Music Night 🎵": "Share the energy and emotion of live performances while discovering musical tastes. The vibrant atmosphere allows for both conversation and shared experiences through music. Whether jazz, rock, or classical, live shows create memorable moments and natural conversation about artistic preferences.",
  
  "Mini Golf Or Arcade Fun 🎯": "A playful and competitive activity that brings out your fun side. The lighthearted atmosphere encourages laughter, friendly competition, and teamwork. Perfect for breaking the ice and showing your ability to enjoy simple, entertaining activities without pressure.",
  
  "Art Gallery Visit 🎨": "An intellectually stimulating date that reveals cultural interests and perspectives. Walking through exhibitions provides natural conversation starters about art, creativity, and personal interpretations. This sophisticated setting shows your appreciation for culture and ability to engage in meaningful discussions.",
  
  "Ice Cream And A Stroll 🍦": "A sweet and casual activity perfect for relaxed conversations. The simple pleasure of ice cream combined with a leisurely walk creates a comfortable atmosphere for getting to know each other. This low-pressure date allows for natural flow of conversation and shared enjoyment.",
  
  "Picnic In The Park 🧺": "A thoughtful and romantic outdoor experience that shows planning and care. Prepare delicious food and find a scenic spot to enjoy nature together. The intimate setting allows for relaxed conversation while enjoying good food and beautiful surroundings in each other's company.",
  
  "Shopping Together 🛍️": "A casual activity that reveals preferences and decision-making styles. Browsing stores together provides insights into tastes, budget priorities, and shopping habits. The relaxed atmosphere allows for conversation while discovering shared interests and enjoying each other's company.",
  
  "Morning Coffee Date ☀️": "Start the day with energizing conversation and fresh perspectives. Morning coffee dates show you're an early riser who values productive beginnings. The bright, optimistic atmosphere encourages positive discussions about goals, dreams, and plans for the future together.",
  
  "Wine Tasting Evening 🍷": "A sophisticated experience that demonstrates refined taste and cultural appreciation. Sample different wines while learning about each other's preferences and engaging in educated discussions. The elegant atmosphere creates opportunities for meaningful conversation and shared learning experiences."
};

const generateDefaultDescription = (dateIdea: string): string => {
  return `This wonderful date idea offers the perfect opportunity to connect and create lasting memories together. The experience combines thoughtful planning with spontaneous moments, allowing you both to enjoy each other's company in a comfortable setting. Whether you're just getting to know each other or deepening an existing connection, this activity provides the ideal backdrop for meaningful conversations and shared experiences.`;
};

export const DateIdeaDescription = ({ selectedDateIdea, className }: DateIdeaDescriptionProps) => {
  const description = selectedDateIdea 
    ? (DATE_IDEA_DESCRIPTIONS[selectedDateIdea] || generateDefaultDescription(selectedDateIdea))
    : "Select a date idea above to see a detailed description. This will help you understand what makes each date idea special and how it can create meaningful connections with someone special.";

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Date Idea Description</h3>
        {selectedDateIdea && (
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">Selected:</span>
            <span className="text-pink-400 text-sm font-medium">{selectedDateIdea}</span>
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="space-y-4">
          {/* Description text */}
          <div>
            <p className="text-white/90 leading-relaxed text-sm">
              {description}
            </p>
          </div>

          {/* Date idea highlights */}
          {selectedDateIdea && (
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-pink-400 text-sm">💕</span>
                <span className="text-white font-medium text-sm">Why This Date Works Well</span>
              </div>
              <ul className="text-white/70 text-xs space-y-1">
                <li>• Creates natural conversation opportunities</li>
                <li>• Provides comfortable atmosphere for connection</li>
                <li>• Shows thoughtfulness and planning ability</li>
                <li>• Offers memorable shared experiences</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
