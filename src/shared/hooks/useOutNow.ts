import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OutNowSession {
  userId: string;
  name: string;
  avatar: string;
  distanceBand: "under 1km" | "1–2km" | "2–5km" | "nearby";
  expiresAt: string;
  lockedBy: string | null;
  lockExpiresAt: string | null;
  isVerified: boolean;
  contactNumber?: string;
}

interface OwnState {
  isActive: boolean;
  expiresAt: string | null;
}

interface UseOutNowReturn {
  isActive: boolean;
  expiresAt: string | null;
  incomingSession: OutNowSession | null;
  myPurchasedSession: OutNowSession | null;
  setIncomingSession: (s: OutNowSession | null) => void;
  activateOutNow: (hours: 1 | 2 | 3) => Promise<void>;
  deactivateOutNow: () => Promise<void>;
  purchaseOTW: (targetUserId: string) => Promise<{ url?: string; contactNumber?: string; locked?: boolean; free?: boolean; lockExpiresAt?: string }>;
  moveOn: (targetUserId: string) => Promise<void>;
  confirmMet: (targetUserId: string) => Promise<void>;
  joinWaitlist: (sessionUserId: string) => Promise<void>;
}

// ── Haversine distance in km ──────────────────────────────────────────────────
function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toDistanceBand(km: number): OutNowSession["distanceBand"] {
  if (km < 1) return "under 1km";
  if (km < 2) return "1–2km";
  if (km < 5) return "2–5km";
  return "nearby";
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useOutNow(
  userId: string | null,
  mutualMatchIds: string[]
): UseOutNowReturn {
  const [ownState, setOwnState] = useState<OwnState>({ isActive: false, expiresAt: null });
  const [incomingSession, setIncomingSession] = useState<OutNowSession | null>(null);
  const [myPurchasedSession, setMyPurchasedSession] = useState<OutNowSession | null>(null);

  // Own lat/lon cached from profile
  const myLatRef = useRef<number | null>(null);
  const myLonRef = useRef<number | null>(null);

  // ── Load own Out Now state on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await (supabase.from as any)("profiles")
        .select("meet_now_active, meet_now_expires_at, latitude, longitude")
        .eq("id", userId)
        .maybeSingle();

      if (!data) return;
      myLatRef.current = data.latitude ?? null;
      myLonRef.current = data.longitude ?? null;

      const isActive =
        data.meet_now_active === true &&
        data.meet_now_expires_at != null &&
        new Date(data.meet_now_expires_at) > new Date();

      setOwnState({
        isActive,
        expiresAt: isActive ? data.meet_now_expires_at : null,
      });
    })();
  }, [userId]);

  // ── Load active sessions from mutual matches ─────────────────────────────────
  useEffect(() => {
    if (!userId || mutualMatchIds.length === 0) return;

    (async () => {
      const now = new Date().toISOString();
      const { data } = await (supabase.from as any)("profiles")
        .select(
          "id, name, avatar_url, latitude, longitude, is_verified, meet_now_expires_at, meet_now_locked_by, meet_now_lock_expires_at"
        )
        .eq("meet_now_active", true)
        .gt("meet_now_expires_at", now)
        .in("id", mutualMatchIds);

      if (!data || data.length === 0) return;

      // Pick the most recently activated session (first one)
      const row = data[0];
      const myLat = myLatRef.current;
      const myLon = myLonRef.current;

      let distanceBand: OutNowSession["distanceBand"] = "nearby";
      if (
        myLat != null && myLon != null &&
        row.latitude != null && row.longitude != null
      ) {
        distanceBand = toDistanceBand(haversineKm(myLat, myLon, row.latitude, row.longitude));
      }

      const session: OutNowSession = {
        userId:       row.id,
        name:         row.name ?? "Someone",
        avatar:       row.avatar_url ?? "",
        distanceBand,
        expiresAt:    row.meet_now_expires_at,
        lockedBy:     row.meet_now_locked_by ?? null,
        lockExpiresAt: row.meet_now_lock_expires_at ?? null,
        isVerified:   row.is_verified ?? false,
      };

      // If the buyer is the current user, populate myPurchasedSession
      if (row.meet_now_locked_by === userId) {
        // Fetch contact number
        const { data: contact } = await (supabase.from as any)("profiles")
          .select("whatsapp")
          .eq("id", row.id)
          .maybeSingle();
        setMyPurchasedSession({ ...session, contactNumber: contact?.whatsapp ?? undefined });
      } else {
        setIncomingSession(session);
      }
    })();
  }, [userId, mutualMatchIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Realtime subscription — watch mutual matches go Out Now ──────────────────
  useEffect(() => {
    if (!userId || mutualMatchIds.length === 0) return;

    const channel = supabase
      .channel("out-now-realtime")
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        async (payload: any) => {
          const row = payload.new;
          if (!mutualMatchIds.includes(row.id)) return;

          const stillActive =
            row.meet_now_active === true &&
            row.meet_now_expires_at != null &&
            new Date(row.meet_now_expires_at) > new Date();

          if (!stillActive) {
            // Clear sessions involving this user
            setIncomingSession((prev) => (prev?.userId === row.id ? null : prev));
            setMyPurchasedSession((prev) => (prev?.userId === row.id ? null : prev));
            return;
          }

          const myLat = myLatRef.current;
          const myLon = myLonRef.current;
          let distanceBand: OutNowSession["distanceBand"] = "nearby";
          if (
            myLat != null && myLon != null &&
            row.latitude != null && row.longitude != null
          ) {
            distanceBand = toDistanceBand(haversineKm(myLat, myLon, row.latitude, row.longitude));
          }

          const session: OutNowSession = {
            userId:        row.id,
            name:          row.name ?? "Someone",
            avatar:        row.avatar_url ?? "",
            distanceBand,
            expiresAt:     row.meet_now_expires_at,
            lockedBy:      row.meet_now_locked_by ?? null,
            lockExpiresAt: row.meet_now_lock_expires_at ?? null,
            isVerified:    row.is_verified ?? false,
          };

          if (row.meet_now_locked_by === userId) {
            const { data: contact } = await (supabase.from as any)("profiles")
              .select("whatsapp")
              .eq("id", row.id)
              .maybeSingle();
            setMyPurchasedSession({ ...session, contactNumber: contact?.whatsapp ?? undefined });
            setIncomingSession(null);
          } else {
            setIncomingSession(session);
            setMyPurchasedSession((prev) => (prev?.userId === row.id ? null : prev));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, mutualMatchIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── activateOutNow ───────────────────────────────────────────────────────────
  const activateOutNow = useCallback(
    async (hours: 1 | 2 | 3) => {
      if (!userId) return;
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

      await (supabase.from as any)("profiles")
        .update({ meet_now_active: true, meet_now_expires_at: expiresAt })
        .eq("id", userId);

      setOwnState({ isActive: true, expiresAt });

      // Notify mutual matches via edge function
      await supabase.functions.invoke("activate-out-now", {
        body: { userId, mutualMatchIds },
      });
    },
    [userId, mutualMatchIds]
  );

  // ── deactivateOutNow ─────────────────────────────────────────────────────────
  const deactivateOutNow = useCallback(async () => {
    if (!userId) return;
    await (supabase.from as any)("profiles")
      .update({
        meet_now_active: false,
        meet_now_expires_at: null,
        meet_now_locked_by: null,
        meet_now_lock_expires_at: null,
      })
      .eq("id", userId);
    setOwnState({ isActive: false, expiresAt: null });
  }, [userId]);

  // ── purchaseOTW ──────────────────────────────────────────────────────────────
  const purchaseOTW = useCallback(
    async (targetUserId: string) => {
      if (!userId) return {};
      const { data, error } = await supabase.functions.invoke("out-now-purchase", {
        body: { targetUserId, buyerId: userId },
      });
      if (error) throw error;
      return data as { url?: string; contactNumber?: string; locked?: boolean; free?: boolean; lockExpiresAt?: string };
    },
    [userId]
  );

  // ── moveOn ───────────────────────────────────────────────────────────────────
  const moveOn = useCallback(
    async (targetUserId: string) => {
      if (!userId) return;

      // Remove connection between these two users in both directions
      await (supabase.from as any)("connections")
        .delete()
        .or(
          `and(user_a.eq.${userId},user_b.eq.${targetUserId}),and(user_a.eq.${targetUserId},user_b.eq.${userId})`
        );

      // Clear the lock on the target profile
      await (supabase.from as any)("profiles")
        .update({ meet_now_locked_by: null, meet_now_lock_expires_at: null })
        .eq("id", targetUserId);

      setMyPurchasedSession(null);
    },
    [userId]
  );

  // ── confirmMet ───────────────────────────────────────────────────────────────
  const confirmMet = useCallback(
    async (targetUserId: string) => {
      if (!userId) return;
      await deactivateOutNow();
      setMyPurchasedSession(null);
      setIncomingSession(null);

      // Award 25 coins
      await (supabase.rpc as any)("award_coins", {
        p_user_id: userId,
        p_amount: 25,
        p_reason: "out_now_met",
      });
    },
    [userId, deactivateOutNow]
  );

  // ── joinWaitlist ─────────────────────────────────────────────────────────────
  const joinWaitlist = useCallback(
    async (sessionUserId: string) => {
      if (!userId) return;
      await (supabase.from as any)("meet_now_waitlist")
        .upsert(
          { session_user_id: sessionUserId, waiter_user_id: userId },
          { onConflict: "session_user_id,waiter_user_id" }
        );
    },
    [userId]
  );

  return {
    isActive:          ownState.isActive,
    expiresAt:         ownState.expiresAt,
    incomingSession,
    myPurchasedSession,
    setIncomingSession,
    activateOutNow,
    deactivateOutNow,
    purchaseOTW,
    moveOn,
    confirmMet,
    joinWaitlist,
  };
}
