import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Users } from "lucide-react";

export interface BestieRequest {
  fromId: string;
  fromName: string;
  fromAvatar: string;
  fromAppUserId: string;
  toId: string;
  toName: string;
}

interface BestieRequestPopupProps {
  request: BestieRequest | null;
  onAccept: (req: BestieRequest) => void;
  onDecline: (req: BestieRequest) => void;
}

export default function BestieRequestPopup({ request, onAccept, onDecline }: BestieRequestPopupProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onAccept(request);
    }, 600);
  };

  const handleDecline = () => {
    onDecline(request);
  };

  return (
    <AnimatePresence>
      {request && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 24px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleDecline(); }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            style={{
              width: "100%", maxWidth: 340,
              background: "linear-gradient(160deg, #1a0030 0%, #0d0020 100%)",
              borderRadius: 24,
              border: "1.5px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,72,199,0.15)",
              overflow: "hidden",
              padding: "28px 24px 24px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            }}
          >
            {/* Header icon */}
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(232,72,199,0.3), rgba(139,92,246,0.3))",
              border: "1.5px solid rgba(232,72,199,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Users style={{ width: 24, height: 24, color: "rgba(232,72,199,0.9)" }} />
            </div>

            {/* Avatar */}
            <div style={{ position: "relative" }}>
              <img
                src={request.fromAvatar || "/placeholder.svg"}
                alt={request.fromName}
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                style={{
                  width: 80, height: 80, borderRadius: "50%", objectFit: "cover",
                  border: "3px solid rgba(232,72,199,0.5)",
                  boxShadow: "0 0 20px rgba(232,72,199,0.3)",
                }}
              />
              <div style={{
                position: "absolute", bottom: -4, right: -4,
                background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
                borderRadius: 20, padding: "2px 7px",
                fontSize: 9, fontWeight: 800, color: "#fff",
                border: "1.5px solid rgba(0,0,0,0.4)",
                letterSpacing: "0.04em",
              }}>
                {request.fromAppUserId}
              </div>
            </div>

            {/* Text */}
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: 17, margin: 0 }}>
                {request.fromName} wants to add you
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                as their <span style={{ color: "rgba(232,72,199,0.9)", fontWeight: 700 }}>Bestie</span> 💕
              </p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>
                If you accept, you'll both appear in each other's Besties list
              </p>
            </div>

            {/* Super like reward note */}
            <div style={{
              background: "rgba(250,204,21,0.08)",
              border: "1px solid rgba(250,204,21,0.2)",
              borderRadius: 12, padding: "8px 14px",
              fontSize: 12, color: "rgba(250,204,21,0.8)",
              fontWeight: 600, textAlign: "center", width: "100%",
            }}>
              ⭐ They'll receive a free Super Like for your acceptance
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, width: "100%" }}>
              <button
                onClick={handleDecline}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 16,
                  background: "rgba(255,255,255,0.07)",
                  border: "1.5px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <X style={{ width: 16, height: 16 }} /> Decline
              </button>
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                style={{
                  flex: 2, padding: "12px 0", borderRadius: 16,
                  background: isProcessing
                    ? "rgba(232,72,199,0.4)"
                    : "linear-gradient(135deg, rgba(232,72,199,0.95), rgba(139,92,246,0.95))",
                  border: "none",
                  color: "#fff", fontWeight: 800, fontSize: 14,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: "0 4px 18px rgba(232,72,199,0.35)",
                  transition: "opacity 0.2s",
                }}
              >
                {isProcessing ? (
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                ) : (
                  <><Heart style={{ width: 16, height: 16 }} fill="white" /> Accept Bestie</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
