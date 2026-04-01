import { supabase } from "@/integrations/supabase/client";

/** Send a push notification to a specific user via the send-push edge function.
 *  Fire-and-forget — never throws. */
export async function pushNotify(
  targetUserId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  try {
    await supabase.functions.invoke("send-push", {
      body: { user_id: targetUserId, title, body, data: data ?? {} },
    });
  } catch {
    // Silent — push is enhancement only
  }
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

export const pushLikeReceived = (targetUserId: string, senderName: string) =>
  pushNotify(targetUserId, "💝 Someone liked you!", `${senderName} liked your profile — see who it is`, { type: "like" });

export const pushMatchReceived = (targetUserId: string, matchName: string) =>
  pushNotify(targetUserId, "🎉 It's a match!", `You and ${matchName} both liked each other!`, { type: "match" });

export const pushMessageReceived = (targetUserId: string, senderName: string, preview: string) =>
  pushNotify(targetUserId, `💬 ${senderName}`, preview.slice(0, 80), { type: "message" });

export const pushFeatureUnlocked = (targetUserId: string, featureName: string, emoji: string) =>
  pushNotify(targetUserId, `${emoji} ${featureName} unlocked!`, `Your ${featureName} feature is now live — tap to explore`, { type: "feature_unlock" });
