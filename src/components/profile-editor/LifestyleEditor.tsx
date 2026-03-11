import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const SMOKING = ["Never", "Socially", "Regularly", "Trying to quit"];
const DRINKING = ["Never", "Socially only", "Regularly"];
const EXERCISE = ["Never", "Occasionally", "3x per week", "Daily"];
const DIET = ["No restrictions", "Halal only", "Vegetarian", "Vegan", "Kosher", "Other"];
const SLEEP = ["Early bird 🌅", "Night owl 🦉", "Flexible"];
const SOCIAL_STYLE = ["Introvert 🔋", "Extrovert ⚡", "Ambivert"];
const LOVE_LANGUAGE = ["Words of affirmation", "Acts of service", "Gift giving", "Quality time", "Physical touch"];
const PETS = ["No pets", "Has cat 🐱", "Has dog 🐶", "Has other pets", "Loves all animals", "Not an animal person"];
const SOCIAL_MEDIA = ["Very active", "Moderately active", "Private / low profile", "Not active"];
const HOBBIES = [
  "Traveling ✈️", "Cooking 🍳", "Gaming 🎮", "Reading 📚", "Music 🎵",
  "Fitness 💪", "Photography 📸", "Art & Design 🎨", "Hiking 🏔️",
  "Movies 🎬", "Shopping 🛍️", "Cafe hopping ☕", "Beach 🏖️",
  "Dancing 💃", "Volunteering 🤝", "Entrepreneurship 💡",
];

interface LifestyleInfo {
  smoking?: string;
  drinking?: string;
  exercise?: string;
  diet?: string;
  sleep?: string;
  social_style?: string;
  love_language?: string;
  pets?: string;
  social_media?: string;
  hobbies?: string[];
}

export const LifestyleEditor = ({
  value,
  onChange,
}: {
  value: LifestyleInfo;
  onChange: (v: LifestyleInfo) => void;
}) => {
  const [open, setOpen] = useState(false);
  const update = (key: keyof LifestyleInfo, val: any) => onChange({ ...value, [key]: val });

  const PillSelect = ({
    label, field, options, multi = false, max
  }: {
    label: string; field: keyof LifestyleInfo; options: string[]; multi?: boolean; max?: number;
  }) => (
    <div className="mb-4">
      <p style={{ color: "#EC4899", fontSize: 9, fontWeight: 700, marginBottom: 8 }}>{label}{max ? ` (pick up to ${max})` : ""}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = multi
            ? ((value[field] as string[]) || []).includes(opt)
            : value[field] === opt;
          const atMax = multi && max && ((value[field] as string[]) || []).length >= max && !selected;
          return (
            <button
              key={opt}
              disabled={!!atMax}
              onClick={() => {
                if (multi) {
                  const current = (value[field] as string[]) || [];
                  update(field, selected ? current.filter(x => x !== opt) : [...current, opt]);
                } else {
                  update(field, selected ? undefined : opt);
                }
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                border: selected
                  ? "1px solid #8B5CF6"
                  : atMax
                  ? "1px solid rgba(255,255,255,0.06)"
                  : "1px solid rgba(255,255,255,0.15)",
                background: selected
                  ? "rgba(139,92,246,0.25)"
                  : atMax
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(255,255,255,0.05)",
                color: selected
                  ? "#c4b5fd"
                  : atMax
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.85)",
                cursor: atMax ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap" as const,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "white", border: "1px solid rgba(236,72,153,0.15)", boxShadow: "0 2px 8px rgba(236,72,153,0.06)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-white"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🌿</span>
          <div className="text-left">
            <p style={{ color: "#1F2937", fontWeight: 700, fontSize: 14, margin: 0 }}>Lifestyle</p>
            <p style={{ color: "#9CA3AF", fontSize: 11, margin: 0 }}>Daily habits, hobbies, preferences</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/10 pt-4">
          <PillSelect label="🚬 Smoking" field="smoking" options={SMOKING} />
          <PillSelect label="🍷 Drinking" field="drinking" options={DRINKING} />
          <PillSelect label="🏃 Exercise" field="exercise" options={EXERCISE} />
          <PillSelect label="🍽️ Diet" field="diet" options={DIET} />
          <PillSelect label="🌙 Sleep Schedule" field="sleep" options={SLEEP} />
          <PillSelect label="🎭 Social Style" field="social_style" options={SOCIAL_STYLE} />
          <PillSelect label="❤️ Love Language" field="love_language" options={LOVE_LANGUAGE} />
          <PillSelect label="🐾 Pets" field="pets" options={PETS} />
          <PillSelect label="📱 Social Media" field="social_media" options={SOCIAL_MEDIA} />
          <PillSelect label="🎯 Hobbies & Interests" field="hobbies" options={HOBBIES} multi max={8} />
        </div>
      )}
    </div>
  );
};
