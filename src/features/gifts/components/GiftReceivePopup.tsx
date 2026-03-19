import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, X, Users, Send, ChevronRight } from "lucide-react";
import GiftFloatingAnimation from "./GiftFloatingAnimation";
import { motion, AnimatePresence } from "framer-motion";

interface SentGift {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  gift_id: string;
  gift_name: string;
  gift_image_url: string;
  gift_emoji?: string;
  message: string;
  status: string;
  created_at: string;
  // Super Like style fields
  super_like_style?: string;
  super_like_emoji?: string;
  is_super_like?: boolean;
}

interface GiftReceivePopupProps {
  gift: SentGift;
  onClose: () => void;
  onGiftAccepted: () => void;
  onGiftRefused: () => void;
  onMatch?: (senderName: string, senderId: string) => void;
  onBestieReferred?: (bestieId: string, senderName: string, senderId: string) => void;
}

export default function GiftReceivePopup({
  gift,
  onClose,
  onGiftAccepted,
  onGiftRefused,
  onMatch,
  onBestieReferred,
}: GiftReceivePopupProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<"main" | "bestie">("main");
  const [bestieId, setBestieId] = useState("");
  const [bestieIdError, setBestieIdError] = useState("");

  const isSuperLike = gift.is_super_like || !!gift.super_like_style;
  const displayEmoji = gift.super_like_emoji || gift.gift_emoji || "⭐";
  const displayName = isSuperLike
    ? (gift.gift_name || "Super Like")
    : gift.gift_name;

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as any)
        .from("sent_gifts")
        .update({ status: "accepted" })
        .eq("id", gift.id);

      await supabase.from("likes").insert({
        liker_id: gift.sender_id,
        liked_id: user.id,
        created_at: new Date().toISOString(),
      });

      const { data: existingLike } = await supabase
        .from("likes")
        .select("id")
        .eq("liker_id", user.id)
        .eq("liked_id", gift.sender_id)
        .maybeSingle();

      if (existingLike && onMatch) {
        onMatch(gift.sender_name, gift.sender_id);
      } else {
        onGiftAccepted();
        onClose();
      }
    } catch (error) {
      console.error("Error accepting:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePass = async () => {
    setIsProcessing(true);
    try {
      await (supabase as any)
        .from("sent_gifts")
        .update({ status: "refused" })
        .eq("id", gift.id);
      onGiftRefused();
      onClose();
    } catch {
      onGiftRefused();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestBestie = () => {
    setView("bestie");
    setBestieId("");
    setBestieIdError("");
  };

  const handleBestieSubmit = () => {
    const clean = bestieId.trim().toUpperCase();
    if (!clean.match(/^2D-\d{5}$/)) {
      setBestieIdError("Please enter a valid ID like 2D-35262");
      return;
    }
    setBestieIdError("");
    // Notify sender via callback
    onBestieReferred?.(clean, gift.sender_name, gift.sender_id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      {!isSuperLike && (
        <GiftFloatingAnimation giftImageUrl={gift.gift_image_url} giftEmoji={gift.gift_emoji} />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.52)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          style={{
            background: "rgba(12,12,18,0.72)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.10)",
            width: "100%",
            maxWidth: 360,
            overflow: "hidden",
          }}
        >
          {/* Pink top bar */}
          <div style={{ height: 4, background: "linear-gradient(90deg, #ec4899, #f472b6, #ec4899)" }} />
          <AnimatePresence mode="wait">
            {view === "main" ? (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                style={{ padding: "24px 22px 22px" }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{displayEmoji}</span>
                    <h3 style={{ color: "#fff", fontSize: 17, fontWeight: 800, margin: 0 }}>
                      {isSuperLike ? "Super Like Received!" : "Gift Received!"}
                    </h3>
                  </div>
                  <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4 }}>
                    <X style={{ width: 16, height: 16 }} />
                  </button>
                </div>

                {/* Sender */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  {isSuperLike ? (
                    <div style={{
                      width: 80, height: 80, borderRadius: "50%",
                      background: "radial-gradient(circle, rgba(250,204,21,0.25) 0%, rgba(0,0,0,0.4) 100%)",
                      border: "2.5px solid rgba(250,204,21,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 40,
                      boxShadow: "0 0 24px rgba(250,204,21,0.35)",
                    }}>
                      {displayEmoji}
                    </div>
                  ) : (
                    <div style={{ width: 80, height: 80, borderRadius: 18, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {gift.gift_image_url
                        ? <img src={gift.gift_image_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        : <span style={{ fontSize: 38 }}>{displayEmoji}</span>
                      }
                    </div>
                  )}
                  <div style={{ textAlign: "center" }}>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: 0 }}>{displayName}</p>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 }}>from {gift.sender_name}</p>
                  </div>
                </div>

                {/* Message */}
                {gift.message && (
                  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>"{gift.message}"</p>
                  </div>
                )}

                {/* Prompt */}
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, textAlign: "center", marginBottom: 16, lineHeight: 1.4 }}>
                  {isSuperLike
                    ? `${gift.sender_name} really wants to connect — what would you like to do?`
                    : `Would you like to connect with ${gift.sender_name}?`
                  }
                </p>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <button
                    onClick={handlePass}
                    disabled={isProcessing}
                    style={{
                      flex: 1, padding: "11px 0", borderRadius: 14,
                      background: "rgba(255,255,255,0.06)",
                      border: "1.5px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.55)", fontWeight: 700, fontSize: 13,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}
                  >
                    <X style={{ width: 15, height: 15 }} /> Pass
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={isProcessing}
                    style={{
                      flex: 2, padding: "11px 0", borderRadius: 14,
                      background: "linear-gradient(135deg, #ec4899, #f472b6)",
                      border: "none",
                      color: "#fff", fontWeight: 800, fontSize: 13,
                      cursor: isProcessing ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      boxShadow: "0 4px 16px rgba(236,72,153,0.4)",
                      opacity: isProcessing ? 0.6 : 1,
                    }}
                  >
                    {isProcessing
                      ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                      : <><Heart style={{ width: 15, height: 15 }} fill="white" /> Accept</>
                    }
                  </button>
                </div>

                {/* Suggest bestie */}
                <button
                  onClick={handleSuggestBestie}
                  style={{
                    width: "100%", padding: "10px 0", borderRadius: 14,
                    background: "rgba(236,72,153,0.07)",
                    border: "1px solid rgba(236,72,153,0.25)",
                    color: "rgba(249,168,212,0.9)", fontWeight: 700, fontSize: 12,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <Users style={{ width: 14, height: 14 }} />
                  Suggest a Bestie instead
                  <ChevronRight style={{ width: 12, height: 12 }} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="bestie"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                style={{ padding: "24px 22px 22px" }}
              >
                {/* Back + header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <button
                    onClick={() => setView("main")}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)", flexShrink: 0 }}
                  >
                    ‹
                  </button>
                  <div>
                    <p style={{ color: "#fff", fontWeight: 800, fontSize: 15, margin: 0 }}>Suggest a Bestie 👯</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>Enter your friend's 2D ID</p>
                  </div>
                </div>

                {/* Explanation */}
                <div style={{ background: "rgba(236,72,153,0.07)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 14, padding: "12px 14px", marginBottom: 18 }}>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.55, margin: 0 }}>
                    Not feeling it with {gift.sender_name}? Enter a Bestie's ID below — they'll receive a message saying you think your friend could be a better match 💕
                  </p>
                </div>

                {/* ID input */}
                <div style={{ marginBottom: 6 }}>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Bestie's App ID
                  </p>
                  <input
                    type="text"
                    value={bestieId}
                    onChange={e => {
                      setBestieId(e.target.value);
                      setBestieIdError("");
                    }}
                    placeholder="2D-35262"
                    maxLength={8}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.06)",
                      border: `1.5px solid ${bestieIdError ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.18)"}`,
                      borderRadius: 12,
                      padding: "11px 14px",
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      outline: "none",
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                    }}
                  />
                  {bestieIdError && (
                    <p style={{ color: "rgba(239,68,68,0.8)", fontSize: 11, margin: "5px 0 0", fontWeight: 600 }}>{bestieIdError}</p>
                  )}
                </div>

                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginBottom: 18, lineHeight: 1.4 }}>
                  Their ID can be found on any profile below the name — it starts with 2D-
                </p>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setView("main")}
                    style={{
                      flex: 1, padding: "11px 0", borderRadius: 14,
                      background: "rgba(255,255,255,0.06)",
                      border: "1.5px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleBestieSubmit}
                    style={{
                      flex: 2, padding: "11px 0", borderRadius: 14,
                      background: "linear-gradient(135deg, #ec4899, #f472b6)",
                      border: "none",
                      color: "#fff", fontWeight: 800, fontSize: 13,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      boxShadow: "0 4px 14px rgba(236,72,153,0.4)",
                    }}
                  >
                    <Send style={{ width: 14, height: 14 }} /> Send Suggestion
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
