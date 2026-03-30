/**
 * Smart photo validation — runs instantly in-browser, zero external deps.
 *
 * Strategy (fastest reliable approach without ML):
 *  1. Browser FaceDetector API  (Chrome/Android) — true face detection, 0ms extra
 *  2. Canvas skin-tone heuristic — ~15ms, ~80% accuracy for selfies
 *  3. Brightness / contrast gate — catches pure black / solid colour uploads
 *
 * Returns a { passed, warnings, confidence } result used to show inline UI hints.
 */

export interface PhotoCheckResult {
  passed: boolean;        // false = block + show guidance; true = proceed to admin review
  faceDetected: boolean | null; // null = API unavailable
  warnings: string[];     // human-readable issues shown to user
  confidence: "high" | "medium" | "low"; // how sure we are
}

// ── Canvas helpers ─────────────────────────────────────────────────────────────

function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

async function analyseCanvas(bitmap: ImageBitmap): Promise<{
  brightness: number;    // 0–255 mean luminance
  skinRatio: number;     // 0–1 fraction of skin-tone pixels
  edgeScore: number;     // 0–1 approximate "detail density" (not a solid fill)
}> {
  const SIZE = 128; // downscale for speed
  const canvas = new OffscreenCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0, SIZE, SIZE);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

  let totalLum = 0;
  let skinCount = 0;
  const total = SIZE * SIZE;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    totalLum += 0.299 * r + 0.587 * g + 0.114 * b;

    // Broad skin-tone range covering diverse complexions
    if (
      r > 60 && g > 35 && b > 20 &&
      r > g && r > b &&
      (r - g) > 10 &&
      r < 250 && g < 220 && b < 200
    ) skinCount++;
  }

  const brightness = totalLum / total;
  const skinRatio = skinCount / total;

  // Simple edge score: sample 5×5 grid, measure neighbour variance
  let edgeSum = 0;
  const step = Math.floor(SIZE / 5);
  for (let y = step; y < SIZE - step; y += step) {
    for (let x = step; x < SIZE - step; x += step) {
      const idx = (y * SIZE + x) * 4;
      const ni  = ((y + 1) * SIZE + x) * 4;
      edgeSum += Math.abs(data[idx] - data[ni]) + Math.abs(data[idx + 1] - data[ni + 1]);
    }
  }
  const edgeScore = Math.min(1, edgeSum / (25 * 255 * 2));

  return { brightness, skinRatio, edgeScore };
}

// ── FaceDetector API (Chrome/Android) ─────────────────────────────────────────

async function tryFaceDetector(file: File): Promise<boolean | null> {
  if (typeof window === "undefined" || !("FaceDetector" in window)) return null;
  try {
    // @ts-expect-error — experimental API
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    const bitmap = await loadImageBitmap(file);
    const faces = await detector.detect(bitmap);
    bitmap.close();
    return faces.length > 0;
  } catch {
    return null;
  }
}

// ── Main export ────────────────────────────────────────────────────────────────

export async function checkProfilePhoto(file: File): Promise<PhotoCheckResult> {
  const warnings: string[] = [];

  // Basic file checks
  if (!file.type.startsWith("image/")) {
    return { passed: false, faceDetected: null, warnings: ["File must be an image (JPG, PNG, WEBP)."], confidence: "high" };
  }
  if (file.size > 20 * 1024 * 1024) {
    warnings.push("Image is very large — consider compressing it.");
  }

  // Run FaceDetector + canvas analysis in parallel
  const [faceResult, bitmap] = await Promise.all([
    tryFaceDetector(file),
    loadImageBitmap(file),
  ]);

  const { brightness, skinRatio, edgeScore } = await analyseCanvas(bitmap);
  bitmap.close();

  let faceDetected = faceResult;

  // ── Brightness gate ────────────────────────────────────────────────────────
  if (brightness < 30) {
    warnings.push("Photo is too dark — make sure your face is well-lit.");
  } else if (brightness > 240) {
    warnings.push("Photo is overexposed — try a softer light source.");
  }

  // ── Edge / detail gate (catches solid colour fills or blurred blobs) ────────
  if (edgeScore < 0.05) {
    warnings.push("Photo appears to be a solid colour or extremely blurred — please use a clear selfie.");
  }

  // ── Skin heuristic (only if FaceDetector not available) ──────────────────
  if (faceDetected === null) {
    if (skinRatio < 0.04 && edgeScore < 0.15) {
      warnings.push("We couldn't detect a face — make sure your face is clearly visible and centred.");
      faceDetected = false;
    } else if (skinRatio >= 0.06) {
      faceDetected = true; // high confidence from skin heuristic
    }
  }

  // ── Decision ──────────────────────────────────────────────────────────────
  const criticalWarnings = warnings.filter(w =>
    w.includes("too dark") || w.includes("solid colour") || w.includes("detect a face")
  );

  const passed = criticalWarnings.length === 0;
  const confidence = faceResult !== null ? "high" : skinRatio > 0.08 ? "medium" : "low";

  return { passed, faceDetected, warnings, confidence };
}

// ── Guidance checklist (always shown to user before upload) ──────────────────

export const PHOTO_GUIDELINES = [
  { id: "face",      text: "Face clearly visible and centred" },
  { id: "light",     text: "Good natural or indoor lighting" },
  { id: "solo",      text: "Solo photo — no group shots" },
  { id: "recent",    text: "Recent photo (within 2 years)" },
  { id: "no_filter", text: "No heavy filters or face-altering edits" },
] as const;
