import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 30_000;

async function sha256(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

interface TeddyPinGateProps {
  userId: string;
  storedHash: string | null; // null = first time (create PIN)
  onUnlocked: () => void;
}

export default function TeddyPinGate({ userId, storedHash, onUnlocked }: TeddyPinGateProps) {
  const isCreate = storedHash === null;
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [confirmDigits, setConfirmDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [shake, setShake] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  const activeDigits = step === "confirm" ? confirmDigits : digits;
  const activeRefs = step === "confirm" ? confirmRefs : inputRefs;
  const activeSet = step === "confirm"
    ? (d: string[]) => setConfirmDigits(d)
    : (d: string[]) => setDigits(d);

  // Focus first empty input on mount / step change
  useEffect(() => {
    const idx = activeDigits.findIndex(d => d === "");
    const target = idx === -1 ? 5 : idx;
    setTimeout(() => activeRefs.current[target]?.focus(), 80);
  }, [step]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const clearDigits = useCallback((which: "main" | "confirm") => {
    if (which === "main") {
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } else {
      setConfirmDigits(["", "", "", "", "", ""]);
      setTimeout(() => confirmRefs.current[0]?.focus(), 50);
    }
  }, []);

  const handleInput = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...activeDigits];
    next[idx] = val.slice(-1);
    activeSet(next);
    if (val && idx < 5) {
      activeRefs.current[idx + 1]?.focus();
    }
    // Auto-submit when all 6 filled
    if (next.every(d => d !== "") && (val !== "" || idx === 5)) {
      handleComplete(next.join(""));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !activeDigits[idx] && idx > 0) {
      activeRefs.current[idx - 1]?.focus();
    }
  };

  const handleComplete = async (pin: string) => {
    if (pin.length !== 6) return;

    // Lockout check
    if (Date.now() < lockedUntil) {
      setError(`Too many attempts. Try again in ${Math.ceil((lockedUntil - Date.now()) / 1000)}s.`);
      triggerShake();
      clearDigits(step === "confirm" ? "confirm" : "main");
      return;
    }

    if (isCreate) {
      if (step === "enter") {
        // Move to confirm step
        setStep("confirm");
        return;
      }
      // Confirm step: check they match
      if (digits.join("") !== pin) {
        setError("PINs don't match. Try again.");
        triggerShake();
        clearDigits("confirm");
        setStep("enter");
        clearDigits("main");
        return;
      }
      // Save to DB
      setSaving(true);
      try {
        const hash = await sha256(pin);
        await supabase.from("profiles").update({ teddy_pin_hash: hash } as any).eq("id", userId);
        onUnlocked();
      } catch {
        setError("Couldn't save PIN. Try again.");
      } finally {
        setSaving(false);
      }
    } else {
      // Verify PIN
      const hash = await sha256(pin);
      if (hash === storedHash) {
        onUnlocked();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_MS);
          setError("Too many wrong attempts. Locked for 30 seconds.");
          setAttempts(0);
        } else {
          setError(`Wrong PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? "" : "s"} left.`);
        }
        triggerShake();
        clearDigits("main");
      }
    }
  };

  const currentDigits = step === "confirm" ? confirmDigits : digits;
  const currentRefs = step === "confirm" ? confirmRefs : inputRefs;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a]"
      style={{ background: "radial-gradient(ellipse at center, rgba(180,80,150,0.08) 0%, #0a0a0a 70%)" }}>

      {/* Bear + title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center mb-8"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeInOut" }}
          className="text-7xl select-none drop-shadow-[0_0_20px_rgba(236,72,153,0.3)]"
        >
          🧸
        </motion.div>
        <h1 className="font-display font-bold text-white text-2xl mt-3">My Teddy Room</h1>
        <p className="text-white/40 text-sm mt-1 text-center px-8">
          {isCreate
            ? step === "enter"
              ? "Create a 6-digit secret PIN to protect your room"
              : "Confirm your PIN"
            : "Enter your secret PIN to enter"}
        </p>
      </motion.div>

      {/* PIN inputs */}
      <motion.div
        animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.45 }}
        className="flex gap-3 mb-6"
      >
        {currentDigits.map((d, i) => (
          <input
            key={`${step}-${i}`}
            ref={(el) => { currentRefs.current[i] = el; }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-11 h-14 rounded-xl text-center text-white text-2xl font-black border-2 outline-none transition-all"
            style={{
              background: d ? "rgba(236,72,153,0.12)" : "rgba(255,255,255,0.04)",
              borderColor: d ? "rgba(236,72,153,0.6)" : "rgba(255,255,255,0.12)",
              caretColor: "transparent",
            }}
          />
        ))}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            key={error}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-red-400 text-sm font-semibold mb-4 text-center px-8"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Step indicator for create flow */}
      {isCreate && (
        <div className="flex gap-2 mb-6">
          {[0, 1].map(i => (
            <div
              key={i}
              className="h-1.5 w-8 rounded-full transition-all"
              style={{ background: (step === "enter" ? 0 : 1) >= i ? "rgba(236,72,153,0.8)" : "rgba(255,255,255,0.12)" }}
            />
          ))}
        </div>
      )}

      {saving && (
        <p className="text-white/40 text-sm animate-pulse">Saving your PIN…</p>
      )}

      <p className="text-white/20 text-[11px] mt-8 text-center px-8 leading-relaxed">
        Your PIN is hashed and never stored in plain text.
        {"\n"}Forgot your PIN? Contact support.
      </p>
    </div>
  );
}
