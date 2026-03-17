import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import GiftReceivePopup from "./GiftReceivePopup";
import GiftRefusedNotification from "./GiftRefusedNotification";

// How long after the app opens before the first queued gift popup appears
const OPEN_DELAY_MS = 30_000;
// Gap between consecutive gift popups
const BETWEEN_GIFTS_MS = 1_500;

interface PendingGift {
  id: string;
  recipient_id?: string;
  sender_id: string;
  sender_name: string;
  gift_id: string;
  gift_name: string;
  gift_image_url: string;
  gift_emoji?: string;
  message: string;
  status: string;
  created_at: string;
}

interface GiftReceiverProps {
  currentUserId?: string;
  onMatch?: (senderName: string, senderId: string) => void;
}

export default function GiftReceiver({ currentUserId, onMatch }: GiftReceiverProps) {
  // The ordered queue of unprocessed gifts
  const queueRef = useRef<PendingGift[]>([]);
  // IDs we've already enqueued so we never double-add
  const seenIdsRef = useRef<Set<string>>(new Set());

  const [activeGift, setActiveGift] = useState<PendingGift | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [readyToShow, setReadyToShow] = useState(false);
  const [showRefusedNotification, setShowRefusedNotification] = useState(false);

  // Dequeue and display the next gift if nothing is currently showing
  const showNextGift = useCallback(() => {
    if (showPopup) return; // already showing one
    const next = queueRef.current.shift();
    if (next) {
      setActiveGift(next);
      setShowPopup(true);
    }
  }, [showPopup]);

  // Add a gift to the queue (idempotent)
  const enqueue = useCallback((gift: PendingGift) => {
    if (seenIdsRef.current.has(gift.id)) return;
    seenIdsRef.current.add(gift.id);
    queueRef.current.push(gift);
  }, []);

  // ── On mount: load all existing pending gifts, then wait OPEN_DELAY_MS ──────
  useEffect(() => {
    if (!currentUserId) return;

    const loadPending = async () => {
      // 1. Try Supabase first
      try {
        const { data, error } = await (supabase as any)
          .from("sent_gifts")
          .select("id, sender_id, sender_name, gift_id, gift_name, gift_image_url, gift_emoji, message, status, created_at, recipient_id")
          .eq("recipient_id", currentUserId)
          .eq("status", "pending")
          .order("created_at", { ascending: true });

        if (!error && data) {
          (data as PendingGift[]).forEach(enqueue);
        }
      } catch {
        // Supabase table may not exist yet — fall through to localStorage
      }

      // 2. Always also pull from localStorage (demo / offline gifts)
      try {
        const local: PendingGift[] = JSON.parse(localStorage.getItem("sent_gifts_demo") || "[]");
        local
          .filter((g) => g.recipient_id === currentUserId && g.status === "pending")
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .forEach(enqueue);
      } catch {
        // ignore
      }
    };

    loadPending();

    // Wait ~30s then start draining the queue
    const openTimer = setTimeout(() => {
      setReadyToShow(true);
    }, OPEN_DELAY_MS);

    return () => clearTimeout(openTimer);
  }, [currentUserId, enqueue]);

  // ── When readyToShow flips true, show the first queued gift ─────────────────
  useEffect(() => {
    if (readyToShow && !showPopup) {
      showNextGift();
    }
  }, [readyToShow, showPopup, showNextGift]);

  // ── Supabase realtime — catch gifts that arrive while the app is open ────────
  useEffect(() => {
    if (!currentUserId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(`gift-inbox-${currentUserId}`)
        .on(
          "postgres_changes" as any,
          {
            event: "INSERT",
            schema: "public",
            table: "sent_gifts",
            filter: `recipient_id=eq.${currentUserId}`,
          },
          (payload: any) => {
            const gift = payload.new as PendingGift;
            if (gift.status !== "pending") return;
            enqueue(gift);
            // If we're past the open-delay and nothing is showing, display now
            if (readyToShow && !showPopup) {
              showNextGift();
            }
          }
        )
        .subscribe();
    } catch {
      // Realtime not available — polling fallback below handles it
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [currentUserId, readyToShow, showPopup, enqueue, showNextGift]);

  // ── Polling fallback for localStorage gifts (catches demo / offline flow) ────
  useEffect(() => {
    if (!currentUserId || !readyToShow) return;

    const poll = () => {
      try {
        const local: PendingGift[] = JSON.parse(localStorage.getItem("sent_gifts_demo") || "[]");
        local
          .filter((g) => g.recipient_id === currentUserId && g.status === "pending")
          .forEach(enqueue);
      } catch {
        // ignore
      }
      if (!showPopup) showNextGift();
    };

    const interval = setInterval(poll, 5_000);
    return () => clearInterval(interval);
  }, [currentUserId, readyToShow, showPopup, enqueue, showNextGift]);

  // ── Mark gift handled in localStorage ───────────────────────────────────────
  const markLocalStatus = (id: string, status: string) => {
    try {
      const local: any[] = JSON.parse(localStorage.getItem("sent_gifts_demo") || "[]");
      localStorage.setItem(
        "sent_gifts_demo",
        JSON.stringify(local.map((g) => (g.id === id ? { ...g, status } : g)))
      );
    } catch {
      // ignore
    }
  };

  // ── After each gift is handled, advance the queue after a short gap ──────────
  const advanceQueue = useCallback(() => {
    setShowPopup(false);
    setActiveGift(null);
    setTimeout(() => {
      showNextGift();
    }, BETWEEN_GIFTS_MS);
  }, [showNextGift]);

  const handleAccept = useCallback(() => {
    if (activeGift) markLocalStatus(activeGift.id, "accepted");
    advanceQueue();
  }, [activeGift, advanceQueue]);

  const handleRefuse = useCallback(() => {
    if (activeGift) {
      markLocalStatus(activeGift.id, "refused");
      // Store refusal notification so sender sees it
      try {
        const refusals: any[] = JSON.parse(localStorage.getItem("gift_refusals") || "[]");
        refusals.push({
          sender_id: activeGift.sender_id,
          message: "Unfortunately, this profile has refused your gift for now. Let's try again.",
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem("gift_refusals", JSON.stringify(refusals));
      } catch {
        // ignore
      }
    }
    advanceQueue();
  }, [activeGift, advanceQueue]);

  // ── Check for refusal notifications aimed at this user (as sender) ──────────
  useEffect(() => {
    if (!currentUserId) return;
    try {
      const refusals: any[] = JSON.parse(localStorage.getItem("gift_refusals") || "[]");
      if (refusals.some((r) => r.sender_id === currentUserId)) {
        setShowRefusedNotification(true);
      }
    } catch {
      // ignore
    }
  }, [currentUserId]);

  return (
    <>
      {showPopup && activeGift && (
        <GiftReceivePopup
          gift={{
            id: activeGift.id,
            sender_id: activeGift.sender_id,
            sender_name: activeGift.sender_name || "Someone",
            gift_id: activeGift.gift_id,
            gift_name: activeGift.gift_name,
            gift_image_url: activeGift.gift_image_url,
            gift_emoji: activeGift.gift_emoji,
            message: activeGift.message,
            status: activeGift.status,
            created_at: activeGift.created_at,
          }}
          onClose={advanceQueue}
          onGiftAccepted={handleAccept}
          onGiftRefused={handleRefuse}
          onMatch={onMatch}
        />
      )}

      {showRefusedNotification && (
        <GiftRefusedNotification
          onClose={() => setShowRefusedNotification(false)}
          onTryAgain={() => setShowRefusedNotification(false)}
        />
      )}
    </>
  );
}
