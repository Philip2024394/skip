import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { ALL_COUNTRIES } from "@/data/countries";

export interface FilterState {
  country: string;
  city: string;
  ageRange: [number, number];
  gender: string;
  lookingFor: string;
  availableTonight: boolean;
  onlineNow: boolean;
  plusOne: boolean;
}

export const defaultFilters: FilterState = {
  country: "",
  city: "",
  ageRange: [18, 60],
  gender: "",
  lookingFor: "",
  availableTonight: false,
  onlineNow: false,
  plusOne: false,
};

const COUNTRIES = ALL_COUNTRIES;

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

const FilterPanel = ({ open, onClose, filters, onApply }: FilterPanelProps) => {
  const { t } = useLanguage();
  const [local, setLocal] = useState<FilterState>(filters);
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryList, setShowCountryList] = useState(false);

  const filteredCountries = useMemo(
    () =>
      countrySearch.length > 0
        ? COUNTRIES.filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase()))
        : COUNTRIES,
    [countrySearch]
  );

  const activeCount = [
    local.country, local.city, local.gender, local.lookingFor,
    local.availableTonight, local.onlineNow, local.plusOne,
    local.ageRange[0] !== 18 || local.ageRange[1] !== 60,
  ].filter(Boolean).length;

  const handleReset = () => { setLocal(defaultFilters); setCountrySearch(""); };
  const handleApply = () => { onApply(local); onClose(); };

  const genderOptions = [
    { value: "", label: t("filter.all") },
    { value: "Female", label: t("gender.female") },
    { value: "Male", label: t("gender.male") },
    { value: "Other", label: t("gender.other") },
  ];

  const lookingForOptions = [
    { value: "", label: t("filter.all") },
    { value: "Friendship", label: t("lookingFor.friendship") },
    { value: "Dating", label: t("lookingFor.dating") },
    { value: "Relationship", label: t("lookingFor.relationship") },
    { value: "Networking", label: t("lookingFor.networking") },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="w-full max-w-lg bg-card border-t border-x border-border rounded-t-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg text-foreground">{t("filter.title")}</h2>
                {activeCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-primary/20 text-primary border-0">
                    {activeCount}
                  </Badge>
                )}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <ScrollArea className="px-5 pb-4 overflow-y-auto [&>[data-radix-scroll-area-viewport]]:!overflow-y-auto [&_[data-radix-scroll-area-scrollbar]]:w-1 [&_[data-radix-scroll-area-scrollbar]]:opacity-40" style={{ maxHeight: "60vh" }}>
              <div className="space-y-5 pb-2">
                {/* Country */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">{t("filter.country")}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      value={local.country || countrySearch}
                      onChange={(e) => { setCountrySearch(e.target.value); setLocal((f) => ({ ...f, country: "" })); setShowCountryList(true); }}
                      onFocus={() => setShowCountryList(true)}
                      placeholder={t("filter.searchCountry")}
                      className="pl-9 bg-muted/30 border-border/50 rounded-xl h-10 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                    {local.country && (
                      <button onClick={() => { setLocal((f) => ({ ...f, country: "" })); setCountrySearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {showCountryList && !local.country && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-1 bg-muted/40 border border-border/30 rounded-xl overflow-hidden">
                        <ScrollArea className="[&_[data-radix-scroll-area-scrollbar]]:w-1 [&_[data-radix-scroll-area-scrollbar]]:opacity-40" style={{ maxHeight: 160 }}>
                          <div className="py-1">
                            {filteredCountries.map((c) => (
                              <button key={c} onClick={() => { setLocal((f) => ({ ...f, country: c })); setCountrySearch(""); setShowCountryList(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-muted-foreground" /> {c}
                              </button>
                            ))}
                            {filteredCountries.length === 0 && <p className="px-4 py-3 text-xs text-muted-foreground">{t("filter.noCountries")}</p>}
                          </div>
                        </ScrollArea>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* City */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">{t("filter.city")}</label>
                  <Input value={local.city} onChange={(e) => setLocal((f) => ({ ...f, city: e.target.value }))} placeholder={t("filter.anyCity")}
                    className="bg-muted/30 border-border/50 rounded-xl h-10 text-sm text-foreground placeholder:text-muted-foreground" />
                </div>

                {/* Age Range */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">{t("filter.ageRange")}</label>
                    <span className="text-xs font-medium text-primary">{local.ageRange[0]} – {local.ageRange[1]}</span>
                  </div>
                  <Slider min={18} max={60} step={1} value={local.ageRange} onValueChange={(v) => setLocal((f) => ({ ...f, ageRange: v as [number, number] }))}
                    className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary" />
                  <div className="flex justify-between mt-1 text-[10px] text-muted-foreground"><span>18</span><span>60+</span></div>
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">{t("filter.gender")}</label>
                  <div className="flex gap-2">
                    {genderOptions.map((g) => (
                      <button key={g.value} onClick={() => setLocal((f) => ({ ...f, gender: g.value }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                          local.gender === g.value ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-muted/30 text-muted-foreground border-border/50 hover:border-primary/50"
                        }`}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Looking For */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">{t("filter.lookingFor")}</label>
                  <div className="flex gap-2 flex-wrap">
                    {lookingForOptions.map((l) => (
                      <button key={l.value} onClick={() => setLocal((f) => ({ ...f, lookingFor: l.value }))}
                        className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                          local.lookingFor === l.value ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-muted/30 text-muted-foreground border-border/50 hover:border-primary/50"
                        }`}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle Options */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-foreground block uppercase tracking-wider">{t("filter.quickFilters")}</label>
                  {[
                    { key: "availableTonight" as const, label: t("filter.availableTonight"), desc: t("filter.availableTonightDesc") },
                    { key: "onlineNow" as const, label: t("filter.onlineNow"), desc: t("filter.onlineNowDesc") },
                    { key: "plusOne" as const, label: t("filter.plusOne"), desc: t("filter.plusOneDesc") },
                  ].map(({ key, label, desc }) => (
                    <button key={key} onClick={() => setLocal((f) => ({ ...f, [key]: !f[key] }))}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        local[key] ? "bg-primary/10 border-primary/30" : "bg-muted/20 border-border/30"
                      }`}>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-[10px] text-muted-foreground">{desc}</p>
                      </div>
                      <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${local[key] ? "bg-primary" : "bg-muted/50"}`}>
                        <motion.div animate={{ x: local[key] ? 16 : 0 }} className="w-5 h-5 rounded-full bg-primary-foreground shadow-sm" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <div className="px-5 py-4 border-t border-border/50 flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1 rounded-xl h-11 border-border/50 text-muted-foreground hover:text-foreground">
                {t("filter.resetAll")}
              </Button>
              <Button onClick={handleApply} className="flex-1 rounded-xl h-11 gradient-love text-primary-foreground border-0 font-semibold">
                {t("filter.apply")}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterPanel;
