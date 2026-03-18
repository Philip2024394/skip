// ── Profile Lock Utility ──────────────────────────────────────────────────────
// When a WhatsApp connection is purchased, both profiles become "locked"
// after 1 hour and stay locked for 3 days unless manually uplifted.
// Locks are stored in localStorage. In production these would be written
// to the Supabase profiles table (profile_locked_until column).

const LS_KEY = "profile_locks";
const MY_LOCK_KEY = "my_profile_lock";

const ONE_HOUR_MS = 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

interface LockEntry {
  activatesAt: string;  // ISO — 1 hour after payment
  expiresAt: string;    // ISO — 1 hour + 3 days after payment
}

function getLocks(): Record<string, LockEntry> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}

/** Lock a viewed profile (the person whose WhatsApp was purchased). */
export function setProfileLock(profileId: string) {
  const now = Date.now();
  const entry: LockEntry = {
    activatesAt: new Date(now + ONE_HOUR_MS).toISOString(),
    expiresAt: new Date(now + ONE_HOUR_MS + THREE_DAYS_MS).toISOString(),
  };
  const locks = getLocks();
  locks[profileId] = entry;
  localStorage.setItem(LS_KEY, JSON.stringify(locks));
}

/** Lock the current user's own profile (buyer also becomes locked). */
export function setMyProfileLock() {
  const now = Date.now();
  const entry: LockEntry = {
    activatesAt: new Date(now + ONE_HOUR_MS).toISOString(),
    expiresAt: new Date(now + ONE_HOUR_MS + THREE_DAYS_MS).toISOString(),
  };
  localStorage.setItem(MY_LOCK_KEY, JSON.stringify(entry));
}

/** Returns true if a profile is in the active lock window. */
export function isProfileLocked(profileId: string): boolean {
  const locks = getLocks();
  const entry = locks[profileId];
  if (!entry) return false;
  const now = Date.now();
  const activates = new Date(entry.activatesAt).getTime();
  const expires = new Date(entry.expiresAt).getTime();
  // Auto-clean expired locks
  if (now >= expires) {
    delete locks[profileId];
    localStorage.setItem(LS_KEY, JSON.stringify(locks));
    return false;
  }
  return now >= activates;
}

/** Returns true if the current user's own profile is locked. */
export function isMyProfileLocked(): boolean {
  try {
    const entry: LockEntry | null = JSON.parse(localStorage.getItem(MY_LOCK_KEY) || "null");
    if (!entry) return false;
    const now = Date.now();
    const activates = new Date(entry.activatesAt).getTime();
    const expires = new Date(entry.expiresAt).getTime();
    if (now >= expires) {
      localStorage.removeItem(MY_LOCK_KEY);
      return false;
    }
    return now >= activates;
  } catch { return false; }
}

/** Returns lock expiry date for own profile (for display). */
export function getMyLockExpiry(): Date | null {
  try {
    const entry: LockEntry | null = JSON.parse(localStorage.getItem(MY_LOCK_KEY) || "null");
    return entry ? new Date(entry.expiresAt) : null;
  } catch { return null; }
}

/** Uplift (remove) the lock from a specific profile. */
export function upliftProfileLock(profileId: string) {
  const locks = getLocks();
  delete locks[profileId];
  localStorage.setItem(LS_KEY, JSON.stringify(locks));
}

/** Uplift the current user's own profile lock. */
export function upliftMyProfileLock() {
  localStorage.removeItem(MY_LOCK_KEY);
}
