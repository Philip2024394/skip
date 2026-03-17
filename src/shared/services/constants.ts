export const APP_NAME = "2DateMe";

/** Max bio length (letters + spaces) */
export const BIO_MAX_LENGTH = 250;

/** 48 hours in milliseconds — how long a like stays active */
export const LIKE_EXPIRY_MS = 48 * 60 * 60 * 1000;

/** 5 minutes in milliseconds — threshold for "online now" indicator */
export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

/** Days between free rose resets */
export const ROSE_RESET_DAYS = 7;

/** ms per day */
export const MS_PER_DAY = 86_400_000;

/** Storage key for super likes balance */
export const SUPER_LIKES_BALANCE_KEY = "super_likes_balance";

/** Storage key for post login landing dismissal */
export const POST_LOGIN_LANDING_KEY = "post_login_landing_dismissed";

/** Storage key for referral popup shown state */
export const REFERRAL_POPUP_SHOWN_KEY = "referralPopupShown";
