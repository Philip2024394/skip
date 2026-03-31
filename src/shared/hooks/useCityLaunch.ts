import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CityStatus {
  city: string;
  country: string;
  member_count: number;
  threshold: number;
  is_live: boolean;
  went_live_at: string | null;
  rank: number;
  is_pioneer: boolean;
  progress: number; // 0–1
  remaining: number; // members needed
}

const DEFAULT_THRESHOLD = 500;

export function useCityLaunch(userId: string | null, city: string | null, country: string | null) {
  const [status, setStatus] = useState<CityStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [justWentLive, setJustWentLive] = useState(false);

  const load = useCallback(async () => {
    if (!city || !country) return;
    setLoading(true);
    try {
      if (import.meta.env.DEV) {
        // Mock: simulate Jakarta at 247/500
        setStatus({
          city,
          country,
          member_count: 247,
          threshold: DEFAULT_THRESHOLD,
          is_live: false,
          went_live_at: null,
          rank: 47,
          is_pioneer: true,
          progress: 247 / 500,
          remaining: 253,
        });
        return;
      }

      const { data, error } = await supabase.rpc("get_city_status" as any, {
        p_city: city,
        p_country: country,
      });

      if (!error && data) {
        const d = data as any;
        setStatus({
          city:         d.city,
          country:      d.country,
          member_count: d.member_count,
          threshold:    d.threshold,
          is_live:      d.is_live,
          went_live_at: d.went_live_at ?? null,
          rank:         d.rank,
          is_pioneer:   d.is_pioneer,
          progress:     Math.min(1, d.member_count / d.threshold),
          remaining:    Math.max(0, d.threshold - d.member_count),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [city, country]);

  // Register user in city on first load
  useEffect(() => {
    if (!userId || !city || !country || import.meta.env.DEV) {
      load();
      return;
    }
    (async () => {
      const { data } = await supabase.rpc("register_city_member" as any, {
        p_city:    city,
        p_country: country,
      });
      if ((data as any)?.just_went_live) {
        setJustWentLive(true);
      }
      load();
    })();
  }, [userId, city, country]);

  return { status, loading, justWentLive, reload: load };
}
