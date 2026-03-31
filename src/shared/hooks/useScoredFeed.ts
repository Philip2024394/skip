import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ScoredProfile {
  profile_id: string;
  feed_score: number;
  is_hope_inject: boolean;
}

export function useScoredFeed(viewerId: string | null) {
  const [scoredIds, setScoredIds] = useState<ScoredProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const fetched = useRef(false);

  const fetchFeed = useCallback(async (opts?: {
    country?: string | null;
    genderFilter?: string | null;
    limit?: number;
    offset?: number;
  }) => {
    if (!viewerId) return [];
    setLoading(true);
    try {
      const { data } = await (supabase.rpc as any)("get_scored_feed", {
        p_viewer_id: viewerId,
        p_limit: opts?.limit ?? 100,
        p_offset: opts?.offset ?? 0,
        p_country: opts?.country ?? null,
        p_gender_filter: opts?.genderFilter ?? null,
      });
      const rows: ScoredProfile[] = data ?? [];
      setScoredIds(rows);
      fetched.current = true;
      return rows;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, [viewerId]);

  // Sort a local profile array by score order
  const sortProfiles = useCallback((profiles: any[]): any[] => {
    if (scoredIds.length === 0) return profiles;
    const scoreMap = new Map(scoredIds.map(s => [s.profile_id, s.feed_score]));
    return [...profiles].sort((a, b) => {
      const sa = scoreMap.get(a.id) ?? 0.1;
      const sb = scoreMap.get(b.id) ?? 0.1;
      return sb - sa;
    });
  }, [scoredIds]);

  // Pick a "hope inject" profile — highest scoring from the set
  const getHopeInjectProfile = useCallback((profiles: any[]): any | null => {
    if (profiles.length === 0) return null;
    const scoreMap = new Map(scoredIds.map(s => [s.profile_id, s.feed_score]));
    const sorted = [...profiles].sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));
    return sorted[0] ?? null;
  }, [scoredIds]);

  return { scoredIds, loading, fetchFeed, sortProfiles, getHopeInjectProfile, fetched: fetched.current };
}
