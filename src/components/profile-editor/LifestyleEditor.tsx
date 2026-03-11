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
      <p className="text-white/60 text-xs mb-2 font-medium">{label}{max ? ` (pick up to ${max})` : ""}</p>
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
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selected
                  ? "bg-purple-500/30 border-purple-500 text-purple-300"
                  : atMax
                  ? "bg-white/2 border-white/8 text-white/25 cursor-not-allowed"
                  : "bg-white/5 border-white/15 text-white/60 hover:border-white/30"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🌿</span>
          <div className="text-left">
            <p className="text-white font-bold text-sm">Lifestyle</p>
            <p className="text-white/40 text-xs">Habits, hobbies, how you live</p>
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
