import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useBlockUser() {
  const [blocking, setBlocking] = useState(false);

  const blockUser = async (blockedId: string, blockedName: string, onBlocked?: () => void) => {
    setBlocking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Sign in required"); setBlocking(false); return; }

      // 1. Insert block record (ignore duplicate)
      await supabase.from("blocked_users").upsert(
        { blocker_id: user.id, blocked_id: blockedId },
        { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true }
      );

      // 2. Delete likes both directions
      await Promise.all([
        supabase.from("likes").delete().eq("liker_id", user.id).eq("liked_id", blockedId),
        supabase.from("likes").delete().eq("liker_id", blockedId).eq("liked_id", user.id),
      ]);

      // 3. Delete connections both directions
      await Promise.all([
        supabase.from("connections").delete().eq("user_a", user.id).eq("user_b", blockedId),
        supabase.from("connections").delete().eq("user_a", blockedId).eq("user_b", user.id),
      ]);

      // 4. Delete sent_gifts both directions (if table exists)
      await Promise.all([
        supabase.from("sent_gifts").delete().eq("sender_id", user.id).eq("receiver_id", blockedId),
        supabase.from("sent_gifts").delete().eq("sender_id", blockedId).eq("receiver_id", user.id),
      ]);

      toast.success(`${blockedName} blocked and removed`);
      onBlocked?.();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBlocking(false);
    }
  };

  return { blockUser, blocking };
}
