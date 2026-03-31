import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, X as XIcon, Flame } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TonightRequest {
  id: string;
  sender_id: string;
  gift_label: string;
  gift_id: string;
  message: string;
  status: "pending" | "accepted" | "declined" | "expired";
  coins_spent: number;
  created_at: string;
  expires_at: string;
  // joined from profiles_public
  sender_name?: string;
  sender_age?: number;
  sender_city?: string;
  sender_avatar?: string;
}

const GIFT_EMOJIS: Record<string, string> = {
  rose: "🌹", bouquet: "💐", champagne: "🍾",
  chocolate: "🍫", ring: "💍", teddy: "🧸",
  dinner: "🍽️", star: "🌟",
};

interface TonightInboxModalProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  onAccepted: (senderId: string) => void; // triggers contact unlock flow
}

export default function TonightInboxModal({
  open,
  onClose,
  currentUserId,
  onAccepted,
}: TonightInboxModalProps) {
  const [requests, setRequests] = useState<TonightRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const now = new Date().toISOString();

    // Mark expired ones first
    await (supabase.from("tonight_requests") as any)
      .update({ status: "expired" })
      .eq("receiver_id", currentUserId)
      .eq("status", "pending")
      .lt("expires_at", now);

    // Fetch pending requests with sender info
    const { data } = await (supabase.from("tonight_requests") as any)
      .select(`
        id, sender_id, gift_label, gift_id, message, status,
        coins_spent, created_at, expires_at
      `)
      .eq("receiver_id", currentUserId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Enrich with sender profile
    const enriched: TonightRequest[] = await Promise.all(
      data.map(async (r: any) => {
        const { data: sender } = await supabase
          .from("profiles_public")
          .select("name, age, city, avatar_url")
          .eq("id", r.sender_id)
          .single();
        return {
          ...r,
          sender_name: sender?.name ?? "Someone",
          sender_age: sender?.age,
          sender_city: sender?.city,
          sender_avatar: sender?.avatar_url,
        };
      })
    );

    setRequests(enriched);
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleAccept = async (req: TonightRequest) => {
    setActing(req.id);
    const { error } = await (supabase.from("tonight_requests") as any)
      .update({ status: "accepted" })
      .eq("id", req.id);

    if (error) {
      toast.error("Could not accept — try again");
      setActing(null);
      return;
    }
    toast.success(`You accepted ${req.sender_name}'s invite! 🌙`);
    setRequests(prev => prev.filter(r => r.id !== req.id));
    setActing(null);
    onAccepted(req.sender_id);
    if (requests.length <= 1) onClose();
  };

  const handleDecline = async (req: TonightRequest) => {
    setActing(req.id);
    const { error } = await (supabase.from("tonight_requests") as any)
      .update({ status: "declined" })
      .eq("id", req.id);

    if (!error) {
      // Refund coins to sender
      await supabase.rpc("refund_coins", {
        p_user_id: req.sender_id,
        p_amount: req.coins_spent,
        p_reason: "Free Tonight invite declined",
      }).catch(() => {}); // best-effort refund

      toast.success("Invite declined");
      setRequests(prev => prev.filter(r => r.id !== req.id));
    }
    setActing(null);
  };

  const timeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 190, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              maxHeight: "80vh", zIndex: 191,
              background: "linear-gradient(180deg, #0d0510 0%, #0a0212 100%)",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              border: "1px solid rgba(234,179,8,0.2)",
              borderBottom: "none",
              boxShadow: "0 -8px 48px rgba(234,179,8,0.12), 0 -2px 0 rgba(234,179,8,0.3)",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
            </div>

            {/* Header */}
            <div style={{ padding: "8px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: "1px solid rgba(234,179,8,0.12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(234,179,8,0.3), rgba(236,72,153,0.2))",
                  border: "1px solid rgba(234,179,8,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Flame size={18} color="#fbbf24" />
                </div>
                <div>
                  <p style={{ color: "#fff", fontWeight: 900, fontSize: 16, margin: 0, lineHeight: 1.1 }}>Tonight Invites</p>
                  <p style={{ color: "rgba(251,191,36,0.7)", fontSize: 10, margin: 0 }}>
                    {requests.length > 0 ? `${requests.length} waiting for you` : "All clear"}
                  </p>
                </div>
              </div>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.6)", display: "flex" }}>
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 32px" }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                  Loading invites…
                </div>
              ) : requests.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, gap: 10 }}>
                  <span style={{ fontSize: 36 }}>🌙</span>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center", margin: 0 }}>
                    No invites right now.<br />Turn on Free Tonight to receive them.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {requests.map(req => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(234,179,8,0.15)",
                        borderRadius: 16, overflow: "hidden",
                      }}
                    >
                      {/* Sender info row */}
                      <div style={{ padding: "12px 14px 10px", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 12, overflow: "hidden", border: "2px solid rgba(234,179,8,0.4)", flexShrink: 0 }}>
                          {req.sender_avatar ? (
                            <img src={req.sender_avatar} alt={req.sender_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: "#fff", fontWeight: 800, fontSize: 14, margin: 0 }}>
                            {req.sender_name}{req.sender_age ? `, ${req.sender_age}` : ""}
                          </p>
                          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>
                            📍 {req.sender_city ?? "Indonesia"}
                          </p>
                        </div>
                        {/* Gift */}
                        <div style={{ textAlign: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 28 }}>{GIFT_EMOJIS[req.gift_id] ?? "🎁"}</span>
                          <p style={{ color: "rgba(251,191,36,0.7)", fontSize: 9, margin: 0, fontWeight: 700 }}>{req.gift_label}</p>
                        </div>
                      </div>

                      {/* Message */}
                      <div style={{ margin: "0 14px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "9px 12px" }}>
                        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: 0, lineHeight: 1.55, fontStyle: "italic" }}>
                          "{req.message}"
                        </p>
                      </div>

                      {/* Expiry */}
                      <p style={{ color: "rgba(251,191,36,0.5)", fontSize: 10, margin: "0 14px 10px", fontWeight: 600 }}>
                        ⏱ {timeLeft(req.expires_at)}
                      </p>

                      {/* Accept / Decline */}
                      <div style={{ display: "flex", gap: 8, padding: "0 14px 14px" }}>
                        <button
                          onClick={() => handleDecline(req)}
                          disabled={acting === req.id}
                          style={{
                            flex: 1, padding: "11px",
                            borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.06)",
                            color: "rgba(255,255,255,0.55)", fontWeight: 700, fontSize: 13,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          }}
                        >
                          <XIcon size={14} /> Decline
                        </button>
                        <button
                          onClick={() => handleAccept(req)}
                          disabled={acting === req.id}
                          style={{
                            flex: 2, padding: "11px",
                            borderRadius: 12, border: "none",
                            background: "linear-gradient(135deg, #f59e0b, #ec4899)",
                            color: "#fff", fontWeight: 900, fontSize: 14,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
                          }}
                        >
                          <Check size={16} /> Accept & Connect
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
