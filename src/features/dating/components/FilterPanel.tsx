import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, MapPin } from "lucide-react";
import { Button } from "@/shared/components/button";
import { Input } from "@/shared/components/input";
import { Slider } from "@/shared/components/slider";
import { ScrollArea } from "@/shared/components/scroll-area";
import { Badge } from "@/shared/components/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { ALL_COUNTRIES } from "@/data/countries";

export interface FilterState {
  // Location
  country: string;
  city: string;
  isVisiting: boolean;
  openToTravel: boolean;
  // Who
  gender: string;
  orientation: string;
  // Age & Height
  ageRange: [number, number];
  heightRange: [number, number];
  // Intention
  lookingFor: string;
  // Lifestyle & Values
  religion: string;
  education: string;
  children: string;
  // Activity Badges
  availableTonight: boolean;
  onlineNow: boolean;
  plusOne: boolean;
  generousLifestyle: boolean;
  weekendPlans: boolean;
  lateNightChat: boolean;
  noDrama: boolean;
  // Quality
  verifiedOnly: boolean;
  withPhotoOnly: boolean;
}

export const defaultFilters: FilterState = {
  country: "",
  city: "",
  isVisiting: false,
  openToTravel: false,
  gender: "",
  orientation: "",
  ageRange: [18, 60],
  heightRange: [145, 200],
  lookingFor: "",
  religion: "",
  education: "",
  children: "",
  availableTonight: false,
  onlineNow: false,
  plusOne: false,
  generousLifestyle: false,
  weekendPlans: false,
  lateNightChat: false,
  noDrama: false,
  verifiedOnly: false,
  withPhotoOnly: false,
};

const LOOKING_FOR_OPTIONS = [
  { value: "", label: "All" },
  { value: "Marriage", label: "💍 Marriage" },
  { value: "Serious", label: "💍 Serious" },
  { value: "Casual", label: "☕ Casual" },
  { value: "Friendship", label: "📱 Friends" },
  { value: "Foreigner", label: "✈️ Foreigner" },
  { value: "Fun", label: "🎉 Fun" },
];

const RELIGION_OPTIONS = [
  "Islam", "Christian Protestant", "Catholic",
  "Hindu", "Buddhist", "Konghucu", "Not religious",
];

const EDUCATION_OPTIONS = [
  "High School", "Diploma / D3", "University / S1",
  "Master's / S2", "Doctorate / S3",
];

const CHILDREN_OPTIONS = [
  { value: "none", label: "No children" },
  { value: "has", label: "Has children" },
  { value: "wants", label: "Wants children" },
];

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontSize: 9, fontWeight: 800, letterSpacing: "0.12em",
    textTransform: "uppercase", color: "rgba(236,72,153,0.85)",
    margin: "0 0 8px",
  }}>
    {children}
  </p>
);

const PillRow = ({
  options, value, onChange, wrap = false,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  wrap?: boolean;
}) => (
  <div style={{ display: "flex", flexWrap: wrap ? "wrap" : "nowrap", gap: 6 }}>
    {options.map((o) => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        style={{
          flex: wrap ? "none" : 1,
          padding: "7px 10px",
          borderRadius: 20,
          fontSize: 11, fontWeight: 600,
          border: value === o.value ? "1px solid rgba(236,72,153,0.8)" : "1px solid rgba(255,255,255,0.12)",
          background: value === o.value ? "rgba(236,72,153,0.18)" : "rgba(255,255,255,0.04)",
          color: value === o.value ? "rgba(255,200,220,1)" : "rgba(255,255,255,0.5)",
          cursor: "pointer",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const ToggleRow = ({
  label, desc, emoji, value, onChange,
}: {
  label: string; desc: string; emoji: string; value: boolean; onChange: () => void;
}) => (
  <button
    onClick={onChange}
    style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 12px", borderRadius: 14, cursor: "pointer",
      border: value ? "1px solid rgba(236,72,153,0.35)" : "1px solid rgba(255,255,255,0.08)",
      background: value ? "rgba(236,72,153,0.1)" : "rgba(255,255,255,0.03)",
      transition: "all 0.15s",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
      <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 }}>{emoji}</span>
      <div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.88)" }}>{label}</p>
        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{desc}</p>
      </div>
    </div>
    <div style={{
      width: 36, height: 20, borderRadius: 10,
      background: value ? "rgba(236,72,153,0.9)" : "rgba(255,255,255,0.15)",
      position: "relative", flexShrink: 0,
      transition: "background 0.2s",
    }}>
      <motion.div
        animate={{ x: value ? 16 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          position: "absolute", top: 2,
          width: 16, height: 16, borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      />
    </div>
  </button>
);

const Divider = () => (
  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
);

const FilterPanel = ({ open, onClose, filters, onApply }: FilterPanelProps) => {
  const { t } = useLanguage();
  const [local, setLocal] = useState<FilterState>(filters);
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryList, setShowCountryList] = useState(false);

  const filteredCountries = useMemo(
    () => countrySearch.length > 0
      ? ALL_COUNTRIES.filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase()))
      : ALL_COUNTRIES,
    [countrySearch]
  );

  const activeCount = [
    local.country, local.city, local.gender, local.lookingFor, local.orientation,
    local.religion, local.education, local.children,
    local.availableTonight, local.onlineNow, local.plusOne, local.generousLifestyle,
    local.weekendPlans, local.lateNightChat, local.noDrama,
    local.verifiedOnly, local.withPhotoOnly, local.isVisiting, local.openToTravel,
    local.ageRange[0] !== 18 || local.ageRange[1] !== 60,
    local.heightRange[0] !== 145 || local.heightRange[1] !== 200,
  ].filter(Boolean).length;

  const set = (key: keyof FilterState, val: any) => setLocal((f) => ({ ...f, [key]: val }));
  const handleReset = () => { setLocal(defaultFilters); setCountrySearch(""); };
  const handleApply = () => { onApply(local); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 90,
            background: "rgba(10,4,24,0.6)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              background: "rgba(8,8,14,0.96)",
              backdropFilter: "blur(40px)",
              borderRadius: "24px 24px 0 0",
              border: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "none",
              boxShadow: "0 -8px 48px rgba(0,0,0,0.6)",
              overflow: "hidden",
            }}
          >
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
            </div>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "white" }}>Filters</p>
                {activeCount > 0 && (
                  <div style={{
                    background: "rgba(236,72,153,0.9)", borderRadius: 10,
                    padding: "1px 7px", fontSize: 10, fontWeight: 800, color: "white",
                  }}>
                    {activeCount}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.6)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Scrollable body */}
            <ScrollArea
              style={{ maxHeight: "68vh", overflowY: "auto" }}
              className="[&>[data-radix-scroll-area-viewport]]:!overflow-y-auto [&_[data-radix-scroll-area-scrollbar]]:w-1 [&_[data-radix-scroll-area-scrollbar]]:opacity-30"
            >
              <div style={{ padding: "0 18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

                {/* ── LOCATION ── */}
                <div>
                  <SectionLabel>📍 Location</SectionLabel>
                  {/* Country */}
                  <div style={{ position: "relative", marginBottom: 8 }}>
                    <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                    <input
                      value={local.country || countrySearch}
                      onChange={(e) => { setCountrySearch(e.target.value); set("country", ""); setShowCountryList(true); }}
                      onFocus={() => setShowCountryList(true)}
                      placeholder="Country…"
                      style={{
                        width: "100%", padding: "8px 30px 8px 30px",
                        borderRadius: 12, fontSize: 12,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white", outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    {local.country && (
                      <button onClick={() => { set("country", ""); setCountrySearch(""); }}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {showCountryList && !local.country && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        style={{ marginBottom: 8, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
                      >
                        <ScrollArea className="[&_[data-radix-scroll-area-scrollbar]]:w-1 [&_[data-radix-scroll-area-scrollbar]]:opacity-30" style={{ maxHeight: 150 }}>
                          <div style={{ padding: "4px 0" }}>
                            {filteredCountries.map((c) => (
                              <button key={c} onClick={() => { set("country", c); setCountrySearch(""); setShowCountryList(false); }}
                                style={{
                                  width: "100%", textAlign: "left", padding: "8px 12px",
                                  fontSize: 12, color: "rgba(255,255,255,0.8)",
                                  background: "none", border: "none", cursor: "pointer",
                                  display: "flex", alignItems: "center", gap: 6,
                                }}>
                                <MapPin size={11} style={{ color: "rgba(236,72,153,0.6)", flexShrink: 0 }} /> {c}
                              </button>
                            ))}
                            {filteredCountries.length === 0 && (
                              <p style={{ padding: "8px 12px", fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>No countries found</p>
                            )}
                          </div>
                        </ScrollArea>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* City */}
                  <input
                    value={local.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="City…"
                    style={{
                      width: "100%", padding: "8px 12px",
                      borderRadius: 12, fontSize: 12,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white", outline: "none",
                      boxSizing: "border-box", marginBottom: 10,
                    }}
                  />
                  {/* Travel toggles */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { key: "isVisiting" as const, label: "✈️ Is Visiting" },
                      { key: "openToTravel" as const, label: "🌍 Open to Travel" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => set(key, !local[key])}
                        style={{
                          flex: 1, padding: "7px 0", borderRadius: 14, fontSize: 11, fontWeight: 600,
                          border: local[key] ? "1px solid rgba(236,72,153,0.8)" : "1px solid rgba(255,255,255,0.1)",
                          background: local[key] ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.04)",
                          color: local[key] ? "rgba(255,200,220,1)" : "rgba(255,255,255,0.45)",
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* ── WHO ── */}
                <div>
                  <SectionLabel>👤 Who I'm Looking For</SectionLabel>
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 6px", fontWeight: 600 }}>GENDER</p>
                    <PillRow
                      options={[
                        { value: "", label: "All" },
                        { value: "Female", label: "♀ Female" },
                        { value: "Male", label: "♂ Male" },
                        { value: "Other", label: "⚧ Other" },
                      ]}
                      value={local.gender}
                      onChange={(v) => set("gender", v)}
                    />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 6px", fontWeight: 600 }}>ORIENTATION</p>
                    <PillRow
                      options={[
                        { value: "", label: "All" },
                        { value: "Straight", label: "Straight" },
                        { value: "Same-Sex", label: "Gay / Lesbian" },
                        { value: "Bisexual", label: "Bisexual" },
                      ]}
                      value={local.orientation}
                      onChange={(v) => set("orientation", v)}
                    />
                  </div>
                </div>

                <Divider />

                {/* ── AGE & HEIGHT ── */}
                <div>
                  <SectionLabel>📐 Age & Height</SectionLabel>
                  {/* Age */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Age</p>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(236,72,153,0.9)" }}>
                        {local.ageRange[0]} – {local.ageRange[1]}{local.ageRange[1] === 60 ? "+" : ""}
                      </p>
                    </div>
                    <Slider
                      min={18} max={60} step={1}
                      value={local.ageRange}
                      onValueChange={(v) => set("ageRange", v as [number, number])}
                      className="[&_[role=slider]]:bg-pink-500 [&_[role=slider]]:border-pink-500"
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>18</span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>60+</span>
                    </div>
                  </div>
                  {/* Height */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Height</p>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(236,72,153,0.9)" }}>
                        {local.heightRange[0]}cm – {local.heightRange[1]}{local.heightRange[1] === 200 ? "+" : ""}cm
                      </p>
                    </div>
                    <Slider
                      min={145} max={200} step={1}
                      value={local.heightRange}
                      onValueChange={(v) => set("heightRange", v as [number, number])}
                      className="[&_[role=slider]]:bg-pink-500 [&_[role=slider]]:border-pink-500"
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>145cm</span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>200cm+</span>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* ── INTENTION ── */}
                <div>
                  <SectionLabel>💍 Their Intention</SectionLabel>
                  <PillRow
                    options={LOOKING_FOR_OPTIONS}
                    value={local.lookingFor}
                    onChange={(v) => set("lookingFor", v)}
                    wrap
                  />
                </div>

                <Divider />

                {/* ── LIFESTYLE & VALUES ── */}
                <div>
                  <SectionLabel>🌿 Lifestyle & Values</SectionLabel>
                  {/* Religion */}
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 6px", fontWeight: 600 }}>RELIGION</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[{ value: "", label: "Any" }, ...RELIGION_OPTIONS.map((r) => ({ value: r, label: r }))].map((o) => (
                        <button
                          key={o.value}
                          onClick={() => set("religion", o.value)}
                          style={{
                            padding: "5px 10px", borderRadius: 16, fontSize: 11, fontWeight: 600,
                            border: local.religion === o.value ? "1px solid rgba(236,72,153,0.8)" : "1px solid rgba(255,255,255,0.1)",
                            background: local.religion === o.value ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.04)",
                            color: local.religion === o.value ? "rgba(255,200,220,1)" : "rgba(255,255,255,0.45)",
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Education */}
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 6px", fontWeight: 600 }}>EDUCATION</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[{ value: "", label: "Any" }, ...EDUCATION_OPTIONS.map((e) => ({ value: e, label: e }))].map((o) => (
                        <button
                          key={o.value}
                          onClick={() => set("education", o.value)}
                          style={{
                            padding: "5px 10px", borderRadius: 16, fontSize: 11, fontWeight: 600,
                            border: local.education === o.value ? "1px solid rgba(236,72,153,0.8)" : "1px solid rgba(255,255,255,0.1)",
                            background: local.education === o.value ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.04)",
                            color: local.education === o.value ? "rgba(255,200,220,1)" : "rgba(255,255,255,0.45)",
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Children */}
                  <div>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 6px", fontWeight: 600 }}>CHILDREN</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[{ value: "", label: "Any" }, ...CHILDREN_OPTIONS].map((o) => (
                        <button
                          key={o.value}
                          onClick={() => set("children", o.value)}
                          style={{
                            flex: 1, padding: "7px 0", borderRadius: 14, fontSize: 11, fontWeight: 600,
                            border: local.children === o.value ? "1px solid rgba(236,72,153,0.8)" : "1px solid rgba(255,255,255,0.1)",
                            background: local.children === o.value ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.04)",
                            color: local.children === o.value ? "rgba(255,200,220,1)" : "rgba(255,255,255,0.45)",
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Divider />

                {/* ── QUALITY ── */}
                <div>
                  <SectionLabel>⭐ Profile Quality</SectionLabel>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { key: "verifiedOnly" as const, label: "✅ Verified Only" },
                      { key: "withPhotoOnly" as const, label: "📸 Has Photo" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => set(key, !local[key])}
                        style={{
                          flex: 1, padding: "8px 0", borderRadius: 14, fontSize: 11, fontWeight: 600,
                          border: local[key] ? "1px solid rgba(236,72,153,0.8)" : "1px solid rgba(255,255,255,0.1)",
                          background: local[key] ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.04)",
                          color: local[key] ? "rgba(255,200,220,1)" : "rgba(255,255,255,0.45)",
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* ── ACTIVITY BADGES ── */}
                <div>
                  <SectionLabel>🔥 Activity Badges</SectionLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <ToggleRow label="Online Now" desc="Currently active on the app" emoji="🟢" value={local.onlineNow} onChange={() => set("onlineNow", !local.onlineNow)} />
                    <ToggleRow label="Free Tonight" desc="Available to meet up tonight" emoji="🌙" value={local.availableTonight} onChange={() => set("availableTonight", !local.availableTonight)} />
                    <ToggleRow label="Plus One" desc="Open to social outings & friendship" emoji="✚" value={local.plusOne} onChange={() => set("plusOne", !local.plusOne)} />
                    <ToggleRow label="Weekend Plans" desc="Planning something this weekend" emoji="📅" value={local.weekendPlans} onChange={() => set("weekendPlans", !local.weekendPlans)} />
                  </div>
                </div>

              </div>
            </ScrollArea>

            {/* Footer */}
            <div style={{
              padding: "12px 18px 20px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              display: "flex", gap: 10,
            }}>
              <button
                onClick={handleReset}
                style={{
                  flex: 1, height: 44, borderRadius: 14, fontSize: 13, fontWeight: 700,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.5)", cursor: "pointer",
                }}
              >
                Reset All
              </button>
              <button
                onClick={handleApply}
                style={{
                  flex: 2, height: 44, borderRadius: 14, fontSize: 13, fontWeight: 800,
                  background: "linear-gradient(135deg, #ec4899, #f472b6)",
                  border: "none", color: "white", cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(236,72,199,0.4)",
                }}
              >
                {activeCount > 0 ? `Apply ${activeCount} Filter${activeCount > 1 ? "s" : ""}` : "Show All"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterPanel;
