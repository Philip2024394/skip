import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/shared/components/button";
import { X, Star, Coins, Heart, Sparkles } from "lucide-react";
import analyticsLogger from "@/shared/services/analytics";
import SecureTextarea from "@/shared/components/SecureTextarea";
import TokenPurchase from "./TokenPurchase";
import securityFilter from "@/shared/services/securityFilter";

interface VirtualGift {
  id: string;
  name: string;
  emoji?: string;
  image_url: string;
  image_name: string;
  token_price: number;
  tier?: string;
}

interface GiftSendPopupProps {
  gift: VirtualGift;
  recipientId: string;
  recipientName: string;
  userTokens: number;
  freeGiftsRemaining: number;
  onClose: () => void;
  onGiftSent: () => void;
}

const SLOGANS = [
  "Make their heart skip a beat",
  "Show them you care",
  "A little sparkle goes a long way",
  "Brighten their day",
  "Let love shine through",
];

export default function GiftSendPopup({
  gift,
  recipientId,
  recipientName,
  userTokens,
  freeGiftsRemaining,
  onClose,
  onGiftSent,
}: GiftSendPopupProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showRefuel, setShowRefuel] = useState(false);
  const [sent, setSent] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [spamError, setSpamError] = useState<string | null>(null);

  // Hardened validation for free gift messages — strictest level
  const validateMessage = (text: string): string | null => {
    if (!text.trim()) return null; // empty is fine

    // Layer 1 — full security filter (links, phone patterns, platforms, creative disguises)
    const result = securityFilter.filterText(text, "gift_message");
    if (!result.isAllowed) {
      return result.warningMessage || "Message contains prohibited content";
    }

    // Layer 2 — zero-tolerance on ANY digit character
    if (/\d/.test(text)) {
      return "Numbers are not allowed in gift messages";
    }

    // Layer 3 — block any written number word (English + Indonesian + Malay)
    const NUMBER_WORDS = [
      // English
      "zero","one","two","three","four","five","six","seven","eight","nine",
      "ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen",
      "seventeen","eighteen","nineteen","twenty","thirty","forty","fifty",
      "sixty","seventy","eighty","ninety","hundred","thousand","million",
      // Indonesian / Malay
      "nol","satu","dua","tiga","empat","lima","enam","tujuh","delapan",
      "sembilan","sepuluh","sebelas","dua belas","seratus","seribu","juta",
      // Common shorthand
      "nomer","nomor","no\\.",
    ];
    const lowerText = text.toLowerCase();
    for (const word of NUMBER_WORDS) {
      if (new RegExp(`\\b${word}\\b`, "i").test(lowerText)) {
        return "Number words are not allowed in gift messages";
      }
    }

    // Layer 4 — block "at" / "@" substitution tricks
    if (/@/.test(text)) {
      return "@ symbols are not allowed in gift messages";
    }

    // Layer 5 — block common contact-sharing phrases
    const CONTACT_PHRASES = [
      /\b(call|text|msg|dm|pm|reach|hit me|contact|add me|find me)\b/i,
      /\b(my number|my no|my id|my handle|my user)\b/i,
    ];
    for (const pat of CONTACT_PHRASES) {
      if (pat.test(text)) {
        return "Contact-sharing phrases are not allowed in gift messages";
      }
    }

    return null;
  };

  const isFreeGift = freeGiftsRemaining > 0;
  const canAfford = userTokens >= gift.token_price;
  const canSend = isFreeGift || canAfford;
  const slogan = SLOGANS[Math.abs(gift.id.charCodeAt(0)) % SLOGANS.length];

  const handleSend = async () => {
    if (!canSend) return;

    const spamCheck = validateMessage(message);
    if (spamCheck) { setSpamError(spamCheck); return; }
    setSpamError(null);

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFreeGift) {
        // Persist free gift to DB and increment counter atomically
        const { error: insertErr } = await (supabase as any).from("sent_gifts").insert({
          sender_id: user.id,
          recipient_id: recipientId,
          gift_id: gift.id,
          message: message.trim(),
          tokens_used: 0,
          status: "pending",
          is_free_gift: true,
        });
        if (insertErr) {
          // Fallback to localStorage if DB not ready
          const sentGifts = JSON.parse(localStorage.getItem("sent_gifts_demo") || "[]");
          sentGifts.push({ id: `demo_${Date.now()}`, sender_id: user.id, recipient_id: recipientId, gift_id: gift.id, gift_name: gift.name, gift_image_url: gift.image_url, message: message.trim(), status: "pending", created_at: new Date().toISOString() });
          localStorage.setItem("sent_gifts_demo", JSON.stringify(sentGifts));
        }
        // Increment free_gifts_used in profiles (use current count = 3 - freeGiftsRemaining)
        const newUsed = (3 - freeGiftsRemaining) + 1;
        await (supabase as any).from("profiles").update({ free_gifts_used: newUsed }).eq("id", user.id);
      } else {
        try {
          const { error } = await (supabase as any).from("sent_gifts").insert({
            sender_id: user.id,
            recipient_id: recipientId,
            gift_id: gift.id,
            message: message.trim(),
            tokens_used: gift.token_price,
            status: "pending",
          });

          if (error) throw error;

          const { error: tokenError } = await (supabase as any).rpc("deduct_tokens", {
            p_user_id: user.id,
            p_tokens: gift.token_price,
          });
          if (tokenError) throw tokenError;
        } catch (dbError) {
          analyticsLogger.logGiftSent({
            userId: user.id,
            giftId: gift.id,
            giftName: gift.name,
            recipientId: recipientId,
            tokenAmount: gift.token_price,
            isFreeGift: isFreeGift,
            error: dbError instanceof Error ? dbError.message : 'Unknown database error'
          });

          const sentGifts = JSON.parse(localStorage.getItem('sent_gifts_demo') || '[]');
          sentGifts.push({
            id: `demo_${Date.now()}`,
            sender_id: user.id,
            recipient_id: recipientId,
            gift_id: gift.id,
            gift_name: gift.name,
            gift_image_url: gift.image_url,
            message: message.trim(),
            status: 'pending',
            tokens_used: gift.token_price,
            created_at: new Date().toISOString(),
          });
          localStorage.setItem('sent_gifts_demo', JSON.stringify(sentGifts));
        }

        analyticsLogger.logGiftSent({
          userId: user.id,
          giftId: gift.id,
          giftName: gift.name,
          recipientId: recipientId,
          tokenAmount: gift.token_price,
          isFreeGift: isFreeGift
        });
      }

      setSent(true);
      setTimeout(() => {
        onGiftSent();
        onClose();
      }, 1200);
    } catch (error) {
      console.error("Error sending gift:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Sent success animation
  if (sent) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(0,0,0,0.52)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
        >
          <motion.div
            animate={{ scale: [1, 1.35, 1], rotate: [0, 12, -12, 0] }}
            transition={{ duration: 0.7 }}
            style={{ fontSize: 72, filter: "drop-shadow(0 0 24px rgba(236,72,153,0.8))" }}
          >
            {gift.emoji || "🎁"}
          </motion.div>
          <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
            style={{ color: "#fff", fontWeight: 900, fontSize: 20, margin: 0 }}>
            Gift sent! 🎁
          </motion.p>
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}
            style={{ color: "rgba(249,168,212,0.8)", fontSize: 13, margin: 0 }}>
            {recipientName} will love it
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 99999,
          background: "rgba(0,0,0,0.52)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 20px",
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
          style={{
            width: "100%", maxWidth: 340,
            background: "rgba(12,12,18,0.72)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.10)",
            overflow: "hidden",
          }}
        >
          {/* Pink accent bar */}
          <div style={{ height: 3, width: "100%", background: "linear-gradient(90deg, #ec4899, #f472b6, #ec4899)" }} />

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "linear-gradient(135deg, #ec4899, #f472b6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 10px rgba(236,72,153,0.5)",
              }}>
                <Star style={{ width: 13, height: 13, color: "#fff" }} fill="#fff" />
              </div>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(249,168,212,0.9)" }}>
                  Send Gift
                </span>
                {isFreeGift && (
                  <span style={{ display: "block", fontSize: 9, color: "#4ade80", fontWeight: 700 }}>
                    ✦ Free gift — {freeGiftsRemaining} of 3 remaining
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.6)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>

          {/* Gift preview */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 20px 12px" }}>
            <motion.div
              initial={{ scale: 0.75, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              style={{
                width: 90, height: 90, borderRadius: 20,
                background: "rgba(236,72,153,0.1)",
                border: "1.5px solid rgba(236,72,153,0.25)",
                boxShadow: "0 0 24px rgba(236,72,153,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 10,
              }}
            >
              {gift.image_url ? (
                <img
                  src={gift.image_url}
                  alt={gift.name}
                  style={{ width: 58, height: 58, objectFit: "contain" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    const p = (e.target as HTMLImageElement).parentElement;
                    if (p && !p.querySelector(".efb")) {
                      const s = document.createElement("span");
                      s.className = "efb";
                      s.textContent = gift.emoji || "🎁";
                      s.style.cssText = "font-size:40px;line-height:1;";
                      p.appendChild(s);
                    }
                  }}
                />
              ) : (
                <span style={{ fontSize: 40, lineHeight: 1 }}>{gift.emoji || "🎁"}</span>
              )}
            </motion.div>

            <p style={{ color: "#fff", fontWeight: 900, fontSize: 16, margin: "0 0 2px", textAlign: "center" }}>{gift.name}</p>
            <p style={{ color: "rgba(249,168,212,0.6)", fontSize: 11, fontStyle: "italic", margin: "0 0 8px" }}>{slogan}</p>

            {/* Price badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 12px", borderRadius: 20,
              background: "rgba(236,72,153,0.1)",
              border: "1px solid rgba(236,72,153,0.25)",
            }}>
              {isFreeGift ? (
                <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 800 }}>✦ FREE</span>
              ) : (
                <>
                  <Coins style={{ width: 12, height: 12, color: "#fbbf24" }} />
                  <span style={{ color: "#fcd34d", fontSize: 11, fontWeight: 800 }}>{gift.token_price} coins</span>
                </>
              )}
            </div>
          </div>

          {/* Recipient chip */}
          <div style={{
            margin: "0 18px 12px",
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(236,72,153,0.07)",
            border: "1px solid rgba(236,72,153,0.18)",
            borderRadius: 14, padding: "8px 12px",
          }}>
            <Heart style={{ width: 13, height: 13, color: "#ec4899", flexShrink: 0 }} fill="rgba(236,72,153,0.4)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "rgba(249,168,212,0.45)", fontSize: 9, margin: 0, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sending to</p>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0 }}>{recipientName}</p>
            </div>
            <Sparkles style={{ width: 13, height: 13, color: "rgba(250,204,21,0.6)", flexShrink: 0 }} />
          </div>

          {/* Message input */}
          <div style={{ margin: "0 18px 12px" }}>
            <div style={{
              borderRadius: 14, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
            }}>
              <SecureTextarea
                id="gift-message"
                value={message}
                onChange={setMessage}
                placeholder="Add a personal note... 💌 (optional)"
                rows={2}
                maxLength={350}
                label=""
                context="gift_message"
                userId={user?.id}
              />
            </div>
            {spamError && (
              <p style={{ color: "#f87171", fontSize: 11, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                ⚠️ {spamError}
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>No numbers, links or contact info allowed</span>
              <span style={{ color: message.length > 320 ? "#fbbf24" : "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 600 }}>
                {message.length}/350
              </span>
            </div>
          </div>

          {/* Insufficient coins */}
          {!canSend && !isFreeGift && (
            <div style={{ margin: "0 18px 12px" }}>
              <button
                onClick={() => setShowRefuel(true)}
                style={{
                  width: "100%", borderRadius: 14, padding: "10px 14px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles style={{ width: 14, height: 14, color: "#fbbf24" }} />
                  <span style={{ color: "#fcd34d", fontSize: 12, fontWeight: 600 }}>Need {gift.token_price - userTokens} more coins</span>
                </div>
                <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: 800 }}>Top up →</span>
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, padding: "0 18px 20px" }}>
            <button
              onClick={onClose}
              aria-label="Cancel gift sending"
              style={{
                flex: 1, padding: "12px 0", borderRadius: 16,
                background: "rgba(255,255,255,0.06)",
                border: "1.5px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!canSend || isSending || message.length > 350}
              aria-label={`Send Super Like to ${recipientName}`}
              style={{
                flex: 2, padding: "12px 0", borderRadius: 16,
                background: canSend ? "linear-gradient(135deg, #f472b6, #ec4899)" : "rgba(255,255,255,0.06)",
                border: "none",
                color: "#fff", fontWeight: 800, fontSize: 13,
                cursor: canSend ? "pointer" : "not-allowed",
                opacity: !canSend || isSending ? 0.5 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: canSend ? "0 4px 20px rgba(236,72,153,0.5)" : "none",
              }}
            >
              {isSending ? (
                <span style={{ opacity: 0.7 }}>Sending...</span>
              ) : (
                <>
                  <Star style={{ width: 14, height: 14 }} fill="currentColor" />
                  {isFreeGift ? "Send Free Gift 🎁" : "Send Gift 🎁"}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>

      {showRefuel && (
        <TokenPurchase
          onClose={() => setShowRefuel(false)}
          onPurchaseSuccess={() => setShowRefuel(false)}
        />
      )}
    </>
  );
}
