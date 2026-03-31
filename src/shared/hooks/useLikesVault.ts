import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VaultEntry {
  id: string;
  name: string;
  age: number;
  city: string | null;
  country: string;
  avatar_url: string | null;
  images: string[] | null;
  is_verified: boolean;
  liked_at: string;
  revealed: boolean;          // true = user paid coins to see
}

const VAULT_REVEALED_KEY = "vault_revealed_ids";

function getRevealedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(VAULT_REVEALED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function markRevealed(id: string) {
  try {
    const ids = getRevealedIds();
    ids.add(id);
    localStorage.setItem(VAULT_REVEALED_KEY, JSON.stringify([...ids]));
  } catch { /* silent */ }
}

export function useLikesVault(userId: string | null, likedMeProfiles: any[]) {
  const [vault, setVault] = useState<VaultEntry[]>([]);
  const [revealing, setRevealing] = useState<string | null>(null); // id being revealed

  // Build vault from likedMe — all entries start blurred unless previously revealed
  useEffect(() => {
    if (!userId) return;
    const revealed = getRevealedIds();
    const entries: VaultEntry[] = likedMeProfiles.map((p) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      city: p.city ?? null,
      country: p.country,
      avatar_url: p.avatar_url ?? null,
      images: p.images ?? null,
      is_verified: p.is_verified ?? false,
      liked_at: p.liked_at ?? new Date().toISOString(),
      revealed: revealed.has(p.id),
    }));
    setVault(entries);
  }, [userId, likedMeProfiles]);

  const revealOne = useCallback(async (targetId: string): Promise<{ success: boolean; reason?: string }> => {
    if (!userId) return { success: false, reason: "no_user" };
    setRevealing(targetId);
    try {
      const { data } = await (supabase.rpc as any)("reveal_vault_like", {
        p_viewer_id: userId,
        p_liked_id: targetId,
      });
      if (data?.success) {
        markRevealed(targetId);
        setVault(prev => prev.map(v => v.id === targetId ? { ...v, revealed: true } : v));
        return { success: true };
      }
      return { success: false, reason: data?.reason ?? "error" };
    } catch {
      return { success: false, reason: "error" };
    } finally {
      setRevealing(null);
    }
  }, [userId]);

  // Reveal all (bulk discount: count * 8 coins instead of 10 each)
  const revealAll = useCallback(async (): Promise<{ success: boolean; total_cost: number }> => {
    const hidden = vault.filter(v => !v.revealed);
    if (hidden.length === 0) return { success: true, total_cost: 0 };
    const cost = Math.round(hidden.length * 8); // 20% bulk discount
    try {
      // Spend bulk coins first
      const { data: spendData } = await (supabase.rpc as any)("spend_coins", {
        p_user_id: userId,
        p_amount: cost,
        p_reason: "reveal_vault_all",
      });
      if (!spendData || spendData === -1) return { success: false, total_cost: cost };
      // Mark all as revealed locally
      hidden.forEach(v => markRevealed(v.id));
      setVault(prev => prev.map(v => ({ ...v, revealed: true })));
      return { success: true, total_cost: cost };
    } catch {
      return { success: false, total_cost: cost };
    }
  }, [userId, vault]);

  const hiddenCount = vault.filter(v => !v.revealed).length;
  const revealedCount = vault.filter(v => v.revealed).length;
  const totalCount = vault.length;

  return { vault, hiddenCount, revealedCount, totalCount, revealOne, revealAll, revealing };
}
