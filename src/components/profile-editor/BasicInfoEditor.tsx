import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const HEIGHT_OPTIONS = Array.from({ length: 61 }, (_, i) => `${140 + i}cm`);

const BODY_TYPES = ["Slim", "Athletic", "Average", "Curvy", "Plus Size"];
const ETHNICITIES = ["Javanese", "Sundanese", "Batak", "Minang", "Bugis", "Chinese-Indonesian", "Mixed", "Other"];
const EDUCATION = ["High School", "Diploma (D3)", "Bachelor (S1)", "Master (S2)", "Doctorate (S3)"];
const INCOME = ["Rather not say", "Under Rp 5jt", "Rp 5-15jt", "Rp 15-30jt", "Rp 30jt+"];
const LANGUAGES = ["Bahasa Indonesia", "English", "Mandarin", "Arabic", "Javanese", "Sundanese", "Other"];
const LIVES_WITH = ["Live alone", "With family", "With housemates", "Own home"];
const CHILDREN = ["No children", "Have — don't live with me", "Have — live with me", "Want someday", "Don't want children"];

interface BasicInfo {
  height?: string;
  body_type?: string;
  ethnicity?: string;
  education?: string;
  occupation?: string;
  income?: string;
  languages?: string[];
  lives_with?: string;
  children?: string;
}

export const BasicInfoEditor = ({
  value,
  onChange,
}: {
  value: BasicInfo;
  onChange: (v: BasicInfo) => void;
}) => {
  const [open, setOpen] = useState(true);
  const update = (key: keyof BasicInfo, val: any) => onChange({ ...value, [key]: val });

  const PillSelect = ({
    label, field, options, multi = false
  }: {
    label: string; field: keyof BasicInfo; options: string[]; multi?: boolean;
  }) => (
    <div className="mb-4">
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = multi
            ? ((value[field] as string[]) || []).includes(opt)
            : value[field] === opt;
          return (
            <button
              key={opt}
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
                border: selected ? "1px solid #EC4899" : "1px solid rgba(255,255,255,0.15)",
                background: selected ? "rgba(236,72,153,0.25)" : "rgba(255,255,255,0.05)",
                color: selected ? "#f9a8d4" : "rgba(255,255,255,0.85)",
                cursor: "pointer",
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
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4"
        style={{ background: "transparent" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">👤</span>
          <div className="text-left">
            <p style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: 14, margin: 0 }}>Basic Info</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>Height, education, background</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {/* Height */}
          <div className="mb-4">
            <p className="text-white/60 text-xs mb-2 font-medium">📏 Height</p>
            <select
              value={value.height || ""}
              onChange={(e) => update("height", e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white text-sm"
            >
              <option value="">Select height</option>
              {HEIGHT_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          {/* Occupation */}
          <div className="mb-4">
            <p className="text-white/60 text-xs mb-2 font-medium">💼 Occupation</p>
            <input
              value={value.occupation || ""}
              onChange={(e) => update("occupation", e.target.value)}
              placeholder="e.g. Software Engineer, Teacher..."
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30"
            />
          </div>

          <PillSelect label="💪 Body Type" field="body_type" options={BODY_TYPES} />
          <PillSelect label="🌏 Ethnicity" field="ethnicity" options={ETHNICITIES} />
          <PillSelect label="🎓 Education" field="education" options={EDUCATION} />
          <PillSelect label="💰 Monthly Income" field="income" options={INCOME} />
          <PillSelect label="🗣️ Languages" field="languages" options={LANGUAGES} multi />
          <PillSelect label="🏠 Lives With" field="lives_with" options={LIVES_WITH} />
          <PillSelect label="👶 Children" field="children" options={CHILDREN} />
        </div>
      )}
    </div>
  );
};
