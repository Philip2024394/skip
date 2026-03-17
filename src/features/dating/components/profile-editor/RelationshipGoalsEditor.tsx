import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const LOOKING_FOR = ["Serious relationship", "Marriage", "Friendship first", "Casual dating", "Not sure yet"];
const TIMELINE = ["As soon as possible", "Within 1 year", "1–2 years", "3–5 years", "No rush"];
const RELIGION = ["Islam", "Christian Protestant", "Catholic", "Hindu", "Buddhist", "Konghucu", "Other", "Not religious"];
const PRAYER = ["Very devout — practise daily", "Moderately religious", "Spiritual but not strict", "Cultural only", "Not religious"];
const HIJAB = ["Wears hijab", "Does not wear hijab", "Comfortable either way", "Not applicable"];
const DOWRY = ["Open to traditional dowry/mahar", "Flexible — open to discuss", "Family requires traditional", "Not required", "Not applicable"];
const FAMILY_INVOLVEMENT = ["Very involved — family decides together", "Somewhat involved", "Mostly my own decision", "Completely independent"];
const MARITAL_STATUS = ["Never married", "Divorced", "Widowed", "Separated"];
const POLYGAMY = ["Not open to polygamy", "Open to discuss", "Currently open to co-wife", "Not applicable"];
const RELOCATE = ["Happy to relocate anywhere", "Within same city only", "Within same island", "Would discuss together", "Not willing to relocate"];
const DATE_TYPE = ["Modern dating", "Traditional courting", "Ta'aruf process", "Family introduction first", "Open to any approach"];
const PARTNER_RELIGION = ["Same religion only", "Open to all religions", "Prefer same but flexible", "No preference"];

interface RelationshipGoals {
  looking_for?: string;
  timeline?: string;
  religion?: string;
  prayer?: string;
  hijab?: string;
  dowry?: string;
  family_involvement?: string;
  marital_status?: string;
  polygamy?: string;
  relocate?: string;
  date_type?: string;
  partner_religion?: string;
  about_partner?: string;
}

export const RelationshipGoalsEditor = ({
  value,
  onChange,
}: {
  value: RelationshipGoals;
  onChange: (v: RelationshipGoals) => void;
}) => {
  const [open, setOpen] = useState(false);
  const update = (key: keyof RelationshipGoals, val: any) => onChange({ ...value, [key]: val });

  const PillSelect = ({ label, field, options }: {
    label: string; field: keyof RelationshipGoals; options: string[];
  }) => (
    <div className="mb-4">
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value[field] === opt;
          return (
            <button
              key={opt}
              onClick={() => update(field, selected ? undefined : opt)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                border: selected ? "1px solid #F59E0B" : "1px solid rgba(255,255,255,0.15)",
                background: selected ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.05)",
                color: selected ? "#fde68a" : "rgba(255,255,255,0.85)",
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
          <span className="text-xl">💍</span>
          <div className="text-left">
            <p style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: 14, margin: 0 }}>Relationship Goals</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>What you're looking for, timeline, values</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-pink-300 text-xs">💡 These details help people understand if you are compatible before they swipe. Be honest — it saves everyone time.</p>
          </div>

          <PillSelect label="💍 I Am Looking For" field="looking_for" options={LOOKING_FOR} />
          <PillSelect label="⏱️ My Timeline" field="timeline" options={TIMELINE} />

          <div className="my-4 border-t border-white/10" />
          <p className="text-white/40 text-xs mb-3 font-semibold uppercase tracking-wider">Religion & Culture</p>

          <PillSelect label="🕌 My Religion" field="religion" options={RELIGION} />
          <PillSelect label="🙏 How I Practise" field="prayer" options={PRAYER} />
          <PillSelect label="👤 Hijab" field="hijab" options={HIJAB} />
          <PillSelect label="🤲 Partner Religion" field="partner_religion" options={PARTNER_RELIGION} />

          <div className="my-4 border-t border-white/10" />
          <p className="text-white/40 text-xs mb-3 font-semibold uppercase tracking-wider">Family & Tradition</p>

          <PillSelect label="💛 Dowry / Mahar" field="dowry" options={DOWRY} />
          <PillSelect label="👨‍👩‍👧 Family Involvement" field="family_involvement" options={FAMILY_INVOLVEMENT} />
          <PillSelect label="💔 Marital Status" field="marital_status" options={MARITAL_STATUS} />
          <PillSelect label="⚠️ Polygamy" field="polygamy" options={POLYGAMY} />

          <div className="my-4 border-t border-white/10" />
          <p className="text-white/40 text-xs mb-3 font-semibold uppercase tracking-wider">Dating Style</p>

          <PillSelect label="🌹 Type of Courtship" field="date_type" options={DATE_TYPE} />
          <PillSelect label="📍 Willing to Relocate" field="relocate" options={RELOCATE} />

          <div className="mb-4">
            <p className="text-white/60 text-xs mb-2 font-medium">💬 What I Am Looking For In A Partner</p>
            <textarea
              value={value.about_partner || ""}
              onChange={(e) => update("about_partner", e.target.value)}
              placeholder="Describe your ideal partner honestly... religion, values, personality..."
              rows={3}
              maxLength={300}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30 resize-none"
            />
            <p className="text-white/30 text-xs mt-1 text-right">{(value.about_partner || "").length}/300</p>
          </div>
        </div>
      )}
    </div>
  );
};
