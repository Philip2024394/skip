/**
 * usePopupQueue
 * Enforces major-player standards for when interrupting popups are allowed.
 *
 * Rules:
 *  - Blocking (show immediately): terms acceptance, match celebration
 *  - Timed (only after 3 min of swiping, max 1 per session): daily match suggestion
 *  - Deferred (session 3+ only): referral / bestie popup
 *  - Session 4+ only: travel notice — AND must be timed
 *  - Commercial asks (global dating upsell, coin refuel): max 1 per 24 h, never during first 2 min
 */

const SESSION_COUNT_KEY   = "2dm_session_count";
const LAST_COMMERCIAL_KEY = "2dm_last_commercial_ask";
const SWIPE_START_KEY     = "2dm_swipe_session_start";
const TIMED_SHOWN_KEY     = "2dm_timed_popup_shown"; // only 1 timed popup per session

const MIN_SWIPE_MS         = 3 * 60 * 1000;  // 3 minutes before timed popups
const COMMERCIAL_COOLDOWN  = 24 * 60 * 60 * 1000; // 24 h between commercial asks

function getSessionCount(): number {
  try { return parseInt(localStorage.getItem(SESSION_COUNT_KEY) || "1"); } catch { return 1; }
}

/** Call once per app mount (first render of the root page) to register a new session. */
export function registerSession(): void {
  try {
    const already = sessionStorage.getItem("2dm_session_registered");
    if (already) return;
    const n = getSessionCount() + 1;
    localStorage.setItem(SESSION_COUNT_KEY, String(n));
    sessionStorage.setItem("2dm_session_registered", "1");
  } catch { /* ignore */ }
}

/** Call as soon as the user performs their first swipe. */
export function markSwipeStart(): void {
  try {
    if (!sessionStorage.getItem(SWIPE_START_KEY)) {
      sessionStorage.setItem(SWIPE_START_KEY, String(Date.now()));
    }
  } catch { /* ignore */ }
}

/** Has the user been swiping for ≥ 3 minutes this session? */
export function canShowTimedPopup(): boolean {
  try {
    if (sessionStorage.getItem(TIMED_SHOWN_KEY)) return false; // already showed one this session
    const start = sessionStorage.getItem(SWIPE_START_KEY);
    if (!start) return false;
    return Date.now() - parseInt(start) >= MIN_SWIPE_MS;
  } catch { return false; }
}

/** Call after showing any timed popup so only 1 fires per session. */
export function markTimedPopupShown(): void {
  try { sessionStorage.setItem(TIMED_SHOWN_KEY, "1"); } catch { /* ignore */ }
}

/** May a commercial ask (upsell / refuel) be shown right now? */
export function canShowCommercial(): boolean {
  try {
    if (!canShowTimedPopup()) return false; // respect min swipe time
    const last = localStorage.getItem(LAST_COMMERCIAL_KEY);
    if (!last) return true;
    return Date.now() - parseInt(last) >= COMMERCIAL_COOLDOWN;
  } catch { return false; }
}

/** Call immediately after showing a commercial ask. */
export function markCommercialShown(): void {
  try { localStorage.setItem(LAST_COMMERCIAL_KEY, String(Date.now())); } catch { /* ignore */ }
}

/** Referral / bestie popups only from session 3 onwards. */
export function canShowReferral(): boolean {
  return getSessionCount() >= 3;
}

/** Travel notice only from session 4 onwards AND after 3 min of swiping. */
export function canShowTravelNotice(): boolean {
  return getSessionCount() >= 4 && canShowTimedPopup();
}
