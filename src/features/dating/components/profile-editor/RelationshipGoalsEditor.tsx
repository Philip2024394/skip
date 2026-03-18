import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const LOOKING_FOR = [
  "Looking for Marriage",
  "Serious Relationship",
  "Long-term Partner",
  "Life Companion",
  "Friendship First, Then More",
  "Casual Dating",
  "Looking for Fun",
  "New Friends",
  "Adventure Partner",
  "Travel Partner",
  "Open to Foreigners",
  "Traditional Courtship",
  "Modern Equal Partnership",
  "Financial Stability",
  "Emotional Support & Depth",
  "Spiritual Partner",
  "Family-Oriented Partner",
  "Independent & Ambitious",
  "Loyal & Committed",
  "Outgoing & Social",
  "Calm & Homebody",
  "Not Sure Yet",
];
const TIMELINE = ["As soon as possible", "Within 1 year", "1–2 years", "3–5 years", "No rush"];

const LAST_REL_TYPE = ["Long-term partner", "Short-term dating", "Marriage / Engaged", "On-and-off relationship", "Long distance", "Never been in a relationship"];
const REL_LENGTH = ["Less than 6 months", "6–12 months", "1–2 years", "2–4 years", "5–7 years", "8–10 years", "10+ years"];
const SINGLE_FOR = ["Just ended (< 1 month)", "A few months", "About 6 months", "About a year", "1–2 years", "2–5 years", "5+ years"];
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
  last_relationship_type?: string;
  relationship_length?: string;
  single_for?: string;
  polygamy?: string;
  relocate?: string;
  date_type?: string;
  partner_religion?: string;
  about_partner?: string;
  // Values quiz
  values_religion?: number;
  values_family?: number;
  values_children?: string;
  values_finances?: string;
  values_location?: string;
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
          <p className="text-white/40 text-xs mb-3 font-semibold uppercase tracking-wider">Relationship History <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400, textTransform: "none" }}>(optional)</span></p>
          <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-pink-300 text-xs">💡 Sharing your history helps people understand where you are emotionally. All fields are optional.</p>
          </div>
          <PillSelect label="💑 My Last Relationship Was" field="last_relationship_type" options={LAST_REL_TYPE} />
          <PillSelect label="⏳ It Lasted" field="relationship_length" options={REL_LENGTH} />
          <PillSelect label="🌱 I Have Been Single For" field="single_for" options={SINGLE_FOR} />

          <div className="my-4 border-t border-white/10" />
          <p className="text-white/40 text-xs mb-3 font-semibold uppercase tracking-wider">Dating Style</p>

          <PillSelect label="🌹 Type of Courtship" field="date_type" options={DATE_TYPE} />
          <PillSelect label="📍 Willing to Relocate" field="relocate" options={RELOCATE} />

          <div className="my-4 border-t border-white/10" />
          <p className="text-white/40 text-xs mb-2 font-semibold uppercase tracking-wider">Values Compatibility Quiz</p>
          <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.20)" }}>
            <p className="text-purple-300 text-xs">💡 Your answers are used to calculate a real % compatibility score shown to other users. Not star signs — actual values.</p>
          </div>

          {/* Religion importance 1–5 */}
          <div className="mb-4">
            <p className="text-white/60 text-xs mb-2 font-medium">🕌 How important is religion in your daily life? <span className="text-white/30">(1 = not at all · 5 = very central)</span></p>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => update("values_religion", value.values_religion === n ? undefined : n)}
                  className={`flex-1 h-9 rounded-xl text-sm font-bold border transition-all ${value.values_religion === n ? "bg-purple-500/30 border-purple-400/60 text-purple-200" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"}`}>{n}</button>
              ))}
            </div>
          </div>

          {/* Family closeness 1–5 */}
          <div className="mb-4">
            <p className="text-white/60 text-xs mb-2 font-medium">👨‍👩‍👧 How close are you to your family? <span className="text-white/30">(1 = very independent · 5 = family-first)</span></p>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => update("values_family", value.values_family === n ? undefined : n)}
                  className={`flex-1 h-9 rounded-xl text-sm font-bold border transition-all ${value.values_family === n ? "bg-purple-500/30 border-purple-400/60 text-purple-200" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"}`}>{n}</button>
              ))}
            </div>
          </div>

          <PillSelect label="👶 Children" field="values_children" options={["Yes — I want children", "No — I don't want children", "Maybe / open to it"]} />
          <PillSelect label="💰 Financial Style" field="values_finances" options={["Saver — security first", "Balanced — save & enjoy", "Spender — enjoy life now"]} />
          <PillSelect label="🌍 Where I Want to Live" field="values_location" options={["My city / stay local", "Flexible — open to moving", "Abroad — prefer overseas"]} />

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
