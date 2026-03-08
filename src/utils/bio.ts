import { BIO_MAX_LENGTH } from "@/lib/constants";

/** Remove emoji and phone-number-like sequences from bio text. */
export function sanitizeBio(text: string): string {
  if (!text || typeof text !== "string") return "";
  // Remove emoji (common ranges: emoticons, symbols, misc symbols)
  let out = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F910}-\u{1F92F}\u{2300}-\u{23FF}\u{2B50}\u{2764}\u{FE00}-\u{FE0F}]/gu, "");
  // Remove phone-number-like sequences (7+ digits, with optional spaces/dashes/dots/parens)
  out = out.replace(/\d[\d\s\-\.\(\)]{5,}\d/g, "").replace(/\d{7,}/g, "");
  return out.trim().slice(0, BIO_MAX_LENGTH);
}
