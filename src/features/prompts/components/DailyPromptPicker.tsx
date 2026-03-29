import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Prompt { id: number; text: string; category: string; }

interface DailyPromptPickerProps {
  userId: string;
  currentPromptId: number | null;
  currentAnswer: string | null;
  onSaved: (promptId: number, answer: string) => void;
  onClose: () => void;
}

export default function DailyPromptPicker({ userId, currentPromptId, currentAnswer, onSaved, onClose }: DailyPromptPickerProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(currentPromptId);
  const [answer, setAnswer] = useState(currentAnswer ?? "");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"pick" | "answer">(currentPromptId ? "answer" : "pick");

  useEffect(() => {
    supabase.from("daily_prompts" as any).select("id, text, category").order("id")
      .then(({ data }) => setPrompts((data as Prompt[]) ?? []));
  }, []);

  const selectedPrompt = prompts.find(p => p.id === selectedId);

  const handleSave = async () => {
    if (!selectedId || !answer.trim()) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        prompt_id: selectedId,
        prompt_answer: answer.trim(),
        prompt_updated_at: new Date().toISOString(),
      } as any).eq("id", userId);
      onSaved(selectedId, answer.trim());
      toast.success("Prompt saved! It'll show on your profile card 💬");
      onClose();
    } catch {
      toast.error("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const categoryEmoji: Record<string, string> = {
    lifestyle: "☀️", relationship: "💕", dating: "💘", fun: "😄",
    personality: "✨", travel: "✈️", adventure: "🎯", food: "🍜",
    culture: "🎬", growth: "🌱", goals: "🚀", confidence: "💪", general: "💬",
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]"
      style={{ background: "radial-gradient(ellipse at top, rgba(236,72,153,0.06) 0%, #0a0a0a 60%)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/8"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top, 0px))" }}>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">
          <X className="w-4 h-4 text-white/60" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span className="font-display font-bold text-white text-sm">Daily Prompt</span>
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">

          {/* Step 1: Pick a prompt */}
          {step === "pick" && (
            <motion.div key="pick" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-white/60 text-sm text-center mb-4">Choose a prompt to show on your profile card</p>
              <div className="space-y-2">
                {prompts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedId(p.id); setStep("answer"); }}
                    className="w-full text-left px-4 py-3.5 rounded-2xl border transition-all flex items-center gap-3"
                    style={{
                      background: selectedId === p.id ? "rgba(236,72,153,0.1)" : "rgba(255,255,255,0.03)",
                      borderColor: selectedId === p.id ? "rgba(236,72,153,0.5)" : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <span className="text-lg flex-shrink-0">{categoryEmoji[p.category] ?? "💬"}</span>
                    <span className="text-white text-sm font-medium">{p.text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Write answer */}
          {step === "answer" && selectedPrompt && (
            <motion.div key="answer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-4">
              <button onClick={() => setStep("pick")} className="text-pink-400 text-sm font-semibold text-left">← Change prompt</button>

              <div className="rounded-2xl px-4 py-3 border border-pink-500/30"
                style={{ background: "rgba(236,72,153,0.06)" }}>
                <p className="text-white font-bold text-base">{selectedPrompt.text}</p>
              </div>

              <div>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value.slice(0, 150))}
                  placeholder="Write your answer…"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none resize-none focus:border-pink-500/50 transition-colors"
                />
                <p className="text-white/30 text-[11px] text-right mt-1">{answer.length}/150</p>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !answer.trim()}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
              >
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><Check className="w-4 h-4" /> Save to my profile</>
                }
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
