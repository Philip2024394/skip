interface DateIdeaDescriptionProps {
  selectedDateIdea: string | null;
  className?: string;
}

const DATE_IDEA_DESCRIPTIONS: Record<string, string> = {
  "Coffee At A Cozy Café ☕": "Perfect for intimate conversations in a warm, relaxed setting. Great coffee and comfortable chairs make it easy to open up and enjoy each other's company without pressure.",
  "Dinner At A Nice Restaurant 🍝": "A classic choice that shows care and thoughtfulness. Great food and ambient lighting create the perfect mood for deeper conversations and a memorable first impression.",
  "Walk In The Park 🌳": "Fresh air and natural scenery make conversations flow freely. Low pressure, no time limit — just two people strolling and discovering what they have in common.",
  "Night At The Cinema 🎬": "A fun shared experience with a built-in topic to discuss afterward. The post-movie chat often reveals a lot about how someone thinks and feels.",
  "Bowling Night Together 🎳": "Playful competition breaks the ice fast. Laughter, friendly banter, and a bit of friendly rivalry make this one of the most memorable first dates.",
  "Watching The Stars Together ⭐": "Quiet, romantic, and unhurried. Stargazing opens up big conversations about dreams and life — perfect for two people who want something genuinely meaningful.",
  "Cooking Together At Home 🧑‍🍳": "Teamwork in the kitchen reveals character. Expect laughter, small disasters, and the satisfaction of sharing a meal you made together.",
  "Beach Sunset Walk 🌅": "Golden light, sea breeze, and the sound of waves — hard to beat. The setting does the work, letting the conversation go wherever it needs to.",
  "Live Music Night 🎵": "Shared energy of a live performance creates instant connection. Music taste reveals personality, and the vibe carries the evening without awkward silences.",
  "Mini Golf Or Arcade Fun 🎯": "Keeps things light and fun — ideal if nerves are high. Playful competition reveals personality and creates natural laughter-filled moments.",
  "Art Gallery Visit 🎨": "Stimulating and different. Walking through art together sparks real opinions and reveals how each person sees the world.",
  "Ice Cream And A Stroll 🍦": "Simple and sweet. No pressure, no agenda — just two people walking, talking, and enjoying something delicious together.",
  "Picnic In The Park 🧺": "Thoughtful preparation goes a long way. A blanket, good food, and open sky create an intimate, relaxed atmosphere for real connection.",
  "Morning Coffee Date ☀️": "Fresh starts make for fresh conversations. Morning energy is positive and focused — great for people who want something genuine from the start.",
  "Wine Tasting Evening 🍷": "Relaxed, sophisticated, and social. Sampling wines side by side gives you something to talk about while revealing each other's tastes and personalities.",
};

const truncate = (text: string, maxWords: number) => {
  const words = text.split(" ");
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
};

const getDescription = (idea: string) =>
  DATE_IDEA_DESCRIPTIONS[idea] ??
  "A great opportunity to connect and enjoy each other's company in a relaxed, comfortable setting. Choose a place that feels natural to both of you and let the conversation lead the way.";

export const DateIdeaDescription = ({ selectedDateIdea, className }: DateIdeaDescriptionProps) => {
  const text = selectedDateIdea
    ? truncate(getDescription(selectedDateIdea), 40)
    : null;

  return (
    <div className={className}>
      <div
        style={{
          borderRadius: 14,
          background: selectedDateIdea
            ? "linear-gradient(135deg, rgba(236,72,153,0.18), rgba(168,85,247,0.14))"
            : "rgba(255,255,255,0.04)",
          border: selectedDateIdea
            ? "1.5px solid rgba(236,72,153,0.45)"
            : "1px solid rgba(255,255,255,0.10)",
          padding: "10px 14px",
          minHeight: 52,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          transition: "border-color 0.2s, background 0.2s",
        }}
      >
        {selectedDateIdea ? (
          <>
            <p style={{ color: "rgba(236,72,153,0.95)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>
              {selectedDateIdea}
            </p>
            <p style={{ color: "rgba(255,255,255,0.90)", fontSize: 12, lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
              {text}
            </p>
          </>
        ) : (
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textAlign: "center", margin: 0 }}>
            Tap a date idea card to see why it makes a great first date
          </p>
        )}
      </div>
    </div>
  );
};
