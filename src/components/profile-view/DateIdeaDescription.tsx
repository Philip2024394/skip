import { getDateIdeaDescription } from "@/data/dateIdeaDescriptions";

interface DateIdeaDescriptionProps {
  selectedDateIdea: string | null;
  className?: string;
}

const truncate = (text: string, maxWords: number) => {
  const words = text.split(" ");
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
};

export const DateIdeaDescription = ({ selectedDateIdea, className }: DateIdeaDescriptionProps) => {
  const text = selectedDateIdea
    ? truncate(getDateIdeaDescription(selectedDateIdea), 40)
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
