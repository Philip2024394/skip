import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import securityFilter from "@/shared/services/securityFilter";

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

const MAX_LEN = 500;

const NUMBER_WORDS = [
  // English
  "zero","one","two","three","four","five","six","seven","eight","nine",
  "ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen",
  "seventeen","eighteen","nineteen","twenty","thirty","forty","fifty",
  "sixty","seventy","eighty","ninety","hundred","thousand","million",
  // Indonesian / Malay
  "nol","satu","dua","tiga","empat","lima","enam","tujuh","delapan",
  "sembilan","sepuluh","sebelas","seratus","seribu","juta",
];

const CONTACT_PATTERNS = [
  /\b(call|text|msg|dm|pm|reach|hit me|contact|add me|find me)\b/i,
  /\b(my number|my no|my id|my handle|my user|my wa|my whatsapp)\b/i,
  /@/,
];

export function validateChatMessage(text: string): string | null {
  if (!text.trim()) return "Message cannot be empty";
  if (text.length > MAX_LEN) return `Max ${MAX_LEN} characters`;

  // Layer 1 — full security filter
  const result = securityFilter.filterText(text, "chat_message");
  if (!result.isAllowed) return result.warningMessage || "Message contains prohibited content";

  // Layer 2 — zero-tolerance on any digit
  if (/\d/.test(text)) return "Numbers are not allowed — share contact only via the unlock feature";

  // Layer 3 — block any number word
  const lower = text.toLowerCase();
  for (const w of NUMBER_WORDS) {
    if (new RegExp(`\\b${w}\\b`, "i").test(lower)) {
      return "Number words are not allowed — use the unlock feature to share contact";
    }
  }

  // Layer 4 — contact-sharing phrases
  for (const p of CONTACT_PATTERNS) {
    if (p.test(text)) return "Contact-sharing phrases are not allowed in chat";
  }

  return null;
}

export function useMessages(currentUserId: string | null, otherUserId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUserId || !otherUserId) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await (supabase as any)
        .from("messages")
        .select("id, sender_id, recipient_id, content, created_at, read_at")
        .or(
          `and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),` +
          `and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: true })
        .limit(100);

      if (!error && data) setMessages(data);
      setLoading(false);

      // Mark unread messages as read
      await (supabase as any)
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("recipient_id", currentUserId)
        .eq("sender_id", otherUserId)
        .is("read_at", null);
    };

    fetchMessages();

    // Real-time subscription for new incoming messages
    const channelName = `chat-${[currentUserId, otherUserId].sort().join("-")}`;
    const channel = (supabase as any)
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload: any) => {
          if (payload.new.sender_id === otherUserId) {
            setMessages((prev) => [...prev, payload.new as Message]);
            // Immediately mark as read since panel is open
            (supabase as any)
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", payload.new.id);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId, otherUserId]);

  const sendMessage = async (content: string): Promise<string | null> => {
    if (!currentUserId || !otherUserId) return "Not authenticated";

    const err = validateChatMessage(content);
    if (err) return err;

    setSending(true);
    try {
      const { data, error } = await (supabase as any)
        .from("messages")
        .insert({ sender_id: currentUserId, recipient_id: otherUserId, content: content.trim() })
        .select("id, sender_id, recipient_id, content, created_at, read_at")
        .single();

      if (error) throw error;
      setMessages((prev) => [...prev, data as Message]);
      // Push notification to recipient
      supabase.functions.invoke("send-push", { body: {
        recipientId: otherUserId,
        title: "💬 New message",
        body: content.trim().slice(0, 80),
        url: "/",
      }}).catch(() => {});
      return null;
    } catch (e: any) {
      return e.message || "Failed to send";
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter(
    (m) => m.sender_id === otherUserId && !m.read_at
  ).length;

  return { messages, loading, sending, sendMessage, unreadCount };
}
