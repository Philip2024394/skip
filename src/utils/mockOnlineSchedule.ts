/**
 * Mock profile online/offline scheduler.
 *
 * Given a profile ID, country, and daily-hours budget the scheduler
 * produces a deterministic-but-realistic set of online windows for
 * today (re-seeds daily so each new day has a different schedule).
 *
 * Rules:
 *  - Sessions only fall inside waking hours for the profile's country
 *    timezone (07:00 – 23:00 local).
 *  - Offline gaps between any two sessions are ≥ 30 minutes.
 *  - Session lengths are between 25 and 110 minutes.
 *  - Sleeping block (23:00 – 07:00 local) is completely avoided.
 *  - Meals reduce probability: breakfast 07-08, lunch 12-13, dinner 18-19.
 */

// ── Seeded PRNG (Mulberry32) ──────────────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ── Country → UTC offset (hours, standard time) ───────────────────────────────
const UTC_OFFSET: Record<string, number> = {
  Afghanistan: 4.5, Albania: 1, Algeria: 1, Argentina: -3,
  Australia: 10, Austria: 1, Bangladesh: 6, Belgium: 1,
  Bolivia: -4, Brazil: -3, Bulgaria: 2, Cambodia: 7,
  Canada: -5, Chile: -4, China: 8, Colombia: -5,
  Croatia: 1, "Czech Republic": 1, Denmark: 1, Ecuador: -5,
  Egypt: 2, Ethiopia: 3, Finland: 2, France: 1,
  Germany: 1, Ghana: 0, Greece: 2, Guatemala: -6,
  Honduras: -6, Hungary: 1, India: 5.5, Indonesia: 7,
  Iran: 3.5, Iraq: 3, Ireland: 0, Israel: 2,
  Italy: 1, Japan: 9, Jordan: 2, Kenya: 3,
  Malaysia: 8, Mexico: -6, Morocco: 1, Netherlands: 1,
  "New Zealand": 12, Nigeria: 1, Norway: 1, Pakistan: 5,
  Peru: -5, Philippines: 8, Poland: 1, Portugal: 0,
  Romania: 2, Russia: 3, "Saudi Arabia": 3, Singapore: 8,
  "South Africa": 2, "South Korea": 9, Spain: 1, Sweden: 1,
  Switzerland: 1, Taiwan: 8, Thailand: 7, Turkey: 3,
  UAE: 4, Ukraine: 2, "United Kingdom": 0, "United States": -5,
  Vietnam: 7, Venezuela: -4,
};

// ── Realistic activity windows (local hours) ──────────────────────────────────
// Each entry: [windowStart, windowEnd, weight]
// Lower weight = less likely to pick a session here (meal / transition times)
const ACTIVITY_WINDOWS: [number, number, number][] = [
  [7.25, 9.5,  0.7],  // morning (post-breakfast)
  [9.5,  11.75, 1.0], // mid-morning
  [13.0, 14.75, 0.8], // post-lunch
  [15.0, 17.5,  1.0], // afternoon
  [17.5, 19.0,  0.6], // pre-dinner
  [19.5, 21.5,  1.0], // evening
  [21.5, 22.75, 0.7], // late evening
];

export interface OnlineWindow {
  /** Minutes from midnight UTC */
  start: number;
  end: number;
}

const MIN_OFFLINE_GAP = 30; // minutes between any two sessions
const MIN_SESSION     = 25; // minutes minimum session length
const MAX_SESSION     = 110;// minutes maximum session length

/**
 * Returns deterministic online windows for the given profile on `dateStr`.
 * dateStr defaults to today (UTC date).
 */
export function getMockOnlineWindows(
  profileId: string,
  country: string,
  hoursPerDay: number,
  dateStr?: string,
): OnlineWindow[] {
  if (!hoursPerDay || hoursPerDay <= 0) return [];

  const today = dateStr ?? new Date().toISOString().slice(0, 10);
  const rand  = mulberry32(hashStr(profileId + "|" + today));
  const utcOff = (UTC_OFFSET[country] ?? 7) * 60; // minutes

  const budget = Math.round(hoursPerDay * 60); // total minutes to distribute
  let remaining = budget;

  // Weighted shuffle of activity windows
  const windows = ACTIVITY_WINDOWS.map(w => ({ w, sort: rand() / w[2] }));
  windows.sort((a, b) => a.sort - b.sort);

  const sessions: OnlineWindow[] = [];

  for (const { w: [localStart, localEnd] } of windows) {
    if (remaining < MIN_SESSION) break;

    const winMins   = (localEnd - localStart) * 60;
    const maxLen    = Math.min(MAX_SESSION, winMins, remaining);
    if (maxLen < MIN_SESSION) continue;

    const sessionLen = Math.round(
      MIN_SESSION + rand() * (maxLen - MIN_SESSION)
    );

    // Random start within the window (leave room for full session)
    const maxStartOffset = Math.max(0, winMins - sessionLen);
    const startOffset    = Math.round(rand() * maxStartOffset);

    const localStartMin  = localStart * 60 + startOffset;
    const localEndMin    = localStartMin + sessionLen;

    // Convert to UTC minutes-from-midnight
    const utcStart = localStartMin - utcOff;
    const utcEnd   = localEndMin   - utcOff;

    // Enforce minimum offline gap against all existing sessions
    const tooClose = sessions.some(s =>
      utcStart < s.end  + MIN_OFFLINE_GAP &&
      utcEnd   > s.start - MIN_OFFLINE_GAP
    );
    if (tooClose) continue;

    sessions.push({ start: utcStart, end: utcEnd });
    remaining -= sessionLen;
  }

  return sessions.sort((a, b) => a.start - b.start);
}

/**
 * Returns the local day-of-week (0=Sun … 6=Sat) for the given country right now.
 */
export function getLocalDayOfWeek(country: string): number {
  const utcOff = (UTC_OFFSET[country] ?? 0) * 60; // minutes
  const now = new Date();
  const localMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + utcOff;
  // localMinutes can be negative or > 1440 — normalise into a day offset
  const dayOffset = Math.floor(localMinutes / 1440);
  const utcDay = now.getUTCDay();
  return ((utcDay + dayOffset) % 7 + 7) % 7;
}

/**
 * Returns true if the mock profile is currently "online" based on its schedule.
 * offlineDays: array of JS day numbers (0=Sun, 1=Mon … 6=Sat) that are fully offline.
 */
export function isMockCurrentlyOnline(
  profileId: string,
  country: string,
  hoursPerDay: number,
  offlineDays?: number[] | null,
): boolean {
  if (!hoursPerDay || hoursPerDay <= 0) return false;

  // Check if today (in the profile's local timezone) is a forced-offline day
  if (offlineDays && offlineDays.length > 0) {
    const localDay = getLocalDayOfWeek(country);
    if (offlineDays.includes(localDay)) return false;
  }

  const now  = new Date();
  const date = now.toISOString().slice(0, 10);
  const nowMinUTC = now.getUTCHours() * 60 + now.getUTCMinutes();

  // Also check yesterday's windows in case a session started before midnight UTC
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

  const todayWindows = getMockOnlineWindows(profileId, country, hoursPerDay, date);
  const yestWindows  = getMockOnlineWindows(profileId, country, hoursPerDay, yesterday)
    .map(w => ({ start: w.start - 1440, end: w.end - 1440 }));

  return [...yestWindows, ...todayWindows].some(
    w => nowMinUTC >= w.start && nowMinUTC < w.end
  );
}
