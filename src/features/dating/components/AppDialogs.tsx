import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, MessageCircle } from "lucide-react";
import MatchCelebrationOverlay from "@/features/dating/components/MatchCelebrationOverlay";
import { Button } from "@/shared/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/dialog";
import FeaturePurchaseDialog from "@/features/payments/components/FeaturePurchaseDialog";
import FilterPanel from "@/features/dating/components/FilterPanel";
import TermsAcceptanceDialog from "@/features/auth/components/TermsAcceptanceDialog";
import GuestAuthPrompt from "@/features/auth/components/GuestAuthPrompt";
import AppLogo from "@/shared/components/AppLogo";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { hasUnlockBadges } from "@/shared/utils/unlockPrice";
import { toast } from "sonner";

interface AppDialogsProps {
  // Referral
  showReferralPopup: boolean;
  setShowReferralPopup: (v: boolean) => void;
  referralCode: string;
  user: any;
  REFERRAL_POPUP_SHOWN_KEY: string;
  // Daily Tarot
  showTarotPopup: boolean;
  setShowTarotPopup: (v: boolean) => void;
  dailyTarot: any;
  tarotPhase: string;
  markDailyCardShown: () => void;
  exportTarotShareImage: () => Promise<void>;
  // Match
  matchedProfile: any;
  setMatchedProfile: (v: any) => void;
  iLiked: any[];
  likedMe: any[];
  handleUnlock: (profile: any, packageKey?: string, connectionType?: string) => void;
  // Unlock payment
  showUnlockDialog: boolean;
  setShowUnlockDialog: (v: boolean) => void;
  unlockProfile: any;
  confirmUnlock: () => Promise<void>;
  paymentLoading: boolean;
  // Feature purchase
  featurePurchaseItem: any;
  setFeaturePurchaseItem: (v: any) => void;
  handleConfirmPurchase: (feature: any) => Promise<void>;
  featureLoading: boolean;
  // Filter panel
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  filters: any;
  setFilters: (v: any) => void;
  seenIdsRef: React.MutableRefObject<Set<string>>;
  shuffledQueueRef: React.MutableRefObject<any[]>;
  // Terms
  showTerms: boolean;
  handleAcceptTerms: () => void;
  // Guest auth
  guestPrompt: { open: boolean; trigger: string };
  setGuestPrompt: (v: any) => void;
  // Welcome back
  showWelcomeBack: boolean;
  setShowWelcomeBack: (v: boolean) => void;
  welcomeBackName: React.MutableRefObject<string>;
  // A2HS
  showA2HS: boolean;
  handleA2HSAdd: () => void;
  handleA2HSDismiss: () => void;
}

export default function AppDialogs(props: AppDialogsProps) {
  const { t, locale } = useLanguage();

  return (
    <>
      {/* Referral Popup */}
      <Dialog
        open={props.showReferralPopup && !!props.user}
        onOpenChange={(open) => {
          if (!open) {
            props.setShowReferralPopup(false);
            try { localStorage.setItem(props.REFERRAL_POPUP_SHOWN_KEY, "true"); } catch { /* ignore */ }
          }
        }}
      >
        <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/10 text-white max-w-sm mx-auto rounded-3xl overflow-hidden">
          <DialogHeader className="text-center">
            <DialogTitle className="font-display text-center text-white">
              <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-yellow-400/15 border border-yellow-300/30 flex items-center justify-center shadow-[0_0_18px_rgba(250,204,21,0.18)]">
                <Star className="w-8 h-8 text-yellow-300" />
              </div>
              Get 10 FREE Super Likes!
            </DialogTitle>
            <DialogDescription className="text-center text-white/60">
              Share 2DateMe with a friend on WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
              <p className="text-white/40 text-[10px] font-semibold">Your link</p>
              <p className="text-white text-[12px] font-bold break-all">
                {`https://2dateme.com/?ref=${props.referralCode || ""}`}
              </p>
            </div>

            <Button
              type="button"
              className="w-full h-12 rounded-2xl bg-green-500 hover:bg-green-500/90 text-white font-black"
              onClick={() => {
                const code = props.referralCode || "";
                const link = `https://2dateme.com/?ref=${code}`;
                const msg = `Hey! I just joined 2DateMe — Indonesia's dating app where you connect via WhatsApp! 🇮🇩❤️\nJoin me here: ${link}`;
                const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                try { localStorage.setItem(props.REFERRAL_POPUP_SHOWN_KEY, "true"); } catch { /* ignore */ }
                window.open(url, "_blank", "noopener,noreferrer");
                props.setShowReferralPopup(false);
              }}
            >
              Share on WhatsApp 💚
            </Button>

            <button
              type="button"
              className="w-full text-center text-white/60 text-[11px] font-semibold underline underline-offset-2"
              onClick={() => {
                props.setShowReferralPopup(false);
                try { localStorage.setItem(props.REFERRAL_POPUP_SHOWN_KEY, "true"); } catch { /* ignore */ }
              }}
            >
              Maybe later
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Tarot Popup */}
      <Dialog
        open={props.showTarotPopup}
        onOpenChange={(open) => {
          if (!open) props.setShowTarotPopup(false);
        }}
      >
        <DialogContent className="bg-black/95 backdrop-blur-2xl border border-white/10 text-white w-[95vw] max-w-md mx-auto rounded-3xl overflow-hidden p-0">
          <div className="relative w-full h-[78vh] min-h-[560px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.18),rgba(0,0,0,0)_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(168,85,247,0.22),rgba(0,0,0,0)_55%)]" />

            {/* stars */}
            {[...Array(26)].map((_, i) => (
              <motion.span
                key={`star-${i}`}
                className="absolute rounded-full"
                style={{
                  width: 2 + (i % 3),
                  height: 2 + (i % 3),
                  left: `${(i * 37) % 100}%`,
                  top: `${(i * 29) % 100}%`,
                  background: "rgba(255,215,130,0.65)",
                  boxShadow: "0 0 10px rgba(255,215,130,0.35)",
                }}
                animate={{ opacity: [0.25, 0.95, 0.35] }}
                transition={{ duration: 2.2 + (i % 5) * 0.5, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}

            <div className="relative z-10 h-full flex flex-col items-center justify-between px-5 pt-6 pb-5">
              <div className="text-center">
                <p className="text-white/70 text-xs font-semibold tracking-wide">2DateMe</p>
                <h2 className="font-display text-xl font-black text-yellow-200">{locale === "en" ? "Your Daily Love Reading" : "Ramalan Cinta Harianmu"}</h2>
                <p className="text-white/55 text-[11px] mt-1">{locale === "en" ? "A mystical message, personalized for your vibe" : "Pesan mistis, dipersonalisasi sesuai vibemu"}</p>
              </div>

              {/* Card */}
              <motion.div
                initial={{ y: 140, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full flex items-center justify-center"
              >
                <div
                  className="w-[86%] max-w-[320px] aspect-[3/5] rounded-3xl border border-yellow-300/30 bg-gradient-to-br from-[#2b0a45]/85 via-[#120018]/90 to-black/80 shadow-[0_0_24px_rgba(168,85,247,0.25)] relative overflow-hidden"
                  style={{ perspective: 1200 }}
                >
                  <motion.div
                    className="absolute inset-0"
                    animate={{ rotateY: props.tarotPhase === "flip" || props.tarotPhase === "revealed" ? 180 : 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* back */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backfaceVisibility: "hidden" }}>
                      <img
                        src="https://ik.imagekit.io/7grri5v7d/tarot%20card%20back.png?updatedAt=1773487777679"
                        alt="Tarot card back"
                        className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-80"
                      />
                      <div className="relative z-10 flex flex-col items-center">
                        <Sparkles className="w-8 h-8 text-yellow-200 drop-shadow-[0_0_14px_rgba(250,204,21,0.5)]" />
                        <p className="mt-2 text-white/90 text-xs font-black tracking-wide drop-shadow-lg">{locale === "en" ? "Shuffling the universe…" : "Mengocok semesta…"}</p>
                      </div>
                    </div>

                    {/* front */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center px-4"
                      style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,215,130,0.18),rgba(0,0,0,0)_55%)]" />
                      <motion.div
                        className="absolute -inset-16"
                        animate={{ opacity: props.tarotPhase === "revealed" ? 1 : 0 }}
                        transition={{ duration: 0.6 }}
                        style={{
                          background:
                            "radial-gradient(circle at center, rgba(250,204,21,0.18), rgba(168,85,247,0.10) 35%, rgba(0,0,0,0) 65%)",
                        }}
                      />
                      <p className="text-yellow-200 font-black text-[13px] tracking-wide text-center drop-shadow-[0_0_10px_rgba(250,204,21,0.35)]">
                        {props.dailyTarot?.card.name ?? ""}
                      </p>
                      <p className="text-6xl mt-3">{props.dailyTarot?.card.emoji ?? ""}</p>
                      <p className="mt-4 text-white/80 text-[11px] font-black">{locale === "en" ? "Your Reading Today:" : "Ramalan Cintamu Hari Ini:"}</p>
                      <motion.p
                        className="mt-2 text-white/85 text-[12px] leading-relaxed text-center"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: props.tarotPhase === "revealed" ? 1 : 0, y: props.tarotPhase === "revealed" ? 0 : 8 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                      >
                        {props.dailyTarot?.reading ?? ""}
                      </motion.p>
                      <p className="absolute bottom-3 text-white/30 text-[9px] font-semibold">2DateMe Daily Love Reading</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              <div className="w-full flex flex-col gap-2">
                <Button
                  type="button"
                  className="w-full h-12 rounded-2xl bg-yellow-400 hover:bg-yellow-400/90 text-black font-black"
                  onClick={async () => {
                    props.markDailyCardShown();
                    await props.exportTarotShareImage();
                  }}
                >
                  {locale === "en" ? "Share My Reading 💫" : "Bagikan Ramalanku 💫"}
                </Button>
                <Button
                  type="button"
                  className="w-full h-12 rounded-2xl gradient-love text-white border-0 font-black"
                  onClick={() => {
                    props.markDailyCardShown();
                    props.setShowTarotPopup(false);
                  }}
                >
                  {locale === "en" ? "Find My Match 💕" : "Cari Jodohku 💕"}
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-white/55 text-[11px] font-semibold underline underline-offset-2"
                  onClick={() => {
                    props.markDailyCardShown();
                    props.setShowTarotPopup(false);
                  }}
                >
                  {locale === "en" ? "Close" : "Tutup"}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Match Celebration Overlay — full screen, 5s auto-dismiss */}
      {props.matchedProfile && (
        <MatchCelebrationOverlay
          matchedProfile={props.matchedProfile}
          currentUser={props.user}
          onDismiss={() => props.setMatchedProfile(null)}
          onConnect={(packageKey, connectionType) => {
            if (!props.matchedProfile) return;
            props.setMatchedProfile(null);
            props.handleUnlock(props.matchedProfile, packageKey, connectionType);
          }}
        />
      )}

      {/* Unlock Payment Dialog */}
      <Dialog open={props.showUnlockDialog} onOpenChange={() => props.setShowUnlockDialog(false)}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/10 text-white max-w-xs mx-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-center text-white">
              <MessageCircle className="w-10 h-10 mx-auto mb-2" fill="white" stroke="white" />
              {t("popup.unlockTitle")}
            </DialogTitle>
            <DialogDescription className="text-center text-white/60">
              {props.unlockProfile && hasUnlockBadges(props.unlockProfile) ? t("popup.unlockDesc299") : t("popup.unlockDesc")}
            </DialogDescription>
          </DialogHeader>
          <ul className="text-white/50 text-xs space-y-1 mt-1">
            <li>💬 {t("popup.unlockBullet1")}</li>
            <li>🔒 {t("popup.unlockBullet2")}</li>
            <li>⏰ {t("popup.unlockBullet3")}</li>
          </ul>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => props.setShowUnlockDialog(false)} className="flex-1 border-white/10 text-white/70 hover:bg-white/10 hover:text-white">{t("popup.cancel")}</Button>
            <Button onClick={props.confirmUnlock} disabled={props.paymentLoading} className="flex-1 gradient-love text-primary-foreground border-0 font-bold">
              {props.paymentLoading ? t("popup.processing") : (props.unlockProfile && hasUnlockBadges(props.unlockProfile) ? t("popup.pay299") : t("popup.pay199"))}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature Purchase Dialog */}
      <FeaturePurchaseDialog
        feature={props.featurePurchaseItem}
        onClose={() => props.setFeaturePurchaseItem(null)}
        onContinue={props.handleConfirmPurchase}
        loading={props.featureLoading}
      />

      {/* Filter Panel */}
      <FilterPanel
        open={props.showFilters}
        onClose={() => props.setShowFilters(false)}
        filters={props.filters}
        onApply={(newFilters) => {
          // Clear the stored queue so new filters get a fresh shuffle
          sessionStorage.removeItem("swipe_queue_ids");
          sessionStorage.removeItem("swipe_seen_ids");
          props.seenIdsRef.current = new Set();
          props.shuffledQueueRef.current = [];
          props.setFilters(newFilters);
        }}
      />

      {/* Terms Acceptance Dialog */}
      <AnimatePresence>
        {props.showTerms && <TermsAcceptanceDialog onAccept={props.handleAcceptTerms} />}
      </AnimatePresence>

      {/* Guest auth prompt */}
      <GuestAuthPrompt
        open={props.guestPrompt.open}
        trigger={props.guestPrompt.trigger}
        onClose={() => props.setGuestPrompt((p: any) => ({ ...p, open: false }))}
      />

      {/* ── Welcome Back modal ── */}
      <AnimatePresence>
        {props.showWelcomeBack && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
              onClick={() => props.setShowWelcomeBack(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="fixed inset-x-4 bottom-8 z-50 max-w-sm mx-auto bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Brand accent bar */}
              <div className="h-1 w-full gradient-love" />

              <div className="p-6 text-center space-y-4">
                {/* Animated hearts stack */}
                <div className="relative flex items-center justify-center h-20">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="absolute"
                      initial={{ opacity: 0, y: 10, scale: 0.6 }}
                      animate={{ opacity: [0, 1, 0.85], y: [10, -8 - i * 10], scale: [0.6, 1 - i * 0.12] }}
                      transition={{ delay: i * 0.15, duration: 0.7, ease: "easeOut" }}
                    >
                      <Heart
                        className="text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.7)]"
                        style={{ width: 36 - i * 8, height: 36 - i * 8 }}
                        fill="currentColor"
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Headline */}
                <div>
                  <motion.h2
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="font-display font-bold text-white text-2xl leading-tight"
                  >
                    {t("popup.welcomeBack")}{props.welcomeBackName.current ? `, ${props.welcomeBackName.current}` : ""}! 💕
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="text-white/60 text-sm mt-2 leading-relaxed"
                  >
                    {t("popup.welcomeBackDesc")}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="text-primary font-semibold text-sm mt-3 leading-relaxed"
                  >
                    {t("popup.welcomeBackCta")} 🔥
                  </motion.p>
                </div>

                {/* CTA */}
                <motion.button
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                  onClick={() => props.setShowWelcomeBack(false)}
                  className="w-full py-3.5 rounded-2xl gradient-love text-white font-bold text-base shadow-lg"
                >
                  {t("popup.letsGo")} 🚀
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Add to Home Screen banner ─────────────────────────────────── */}
      <AnimatePresence>
        {props.showA2HS && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-20 inset-x-4 z-[99998] max-w-sm mx-auto"
          >
            <div className="rounded-2xl bg-[#0d0d0d] border border-white/10 p-4 flex items-center gap-3 shadow-2xl backdrop-blur-md">
              <AppLogo className="w-10 h-10 object-contain flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">Add 2DateMe to your home screen</p>
                <p className="text-white/50 text-[11px] mt-0.5">Quick access, no app store needed</p>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  onClick={props.handleA2HSAdd}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white text-[11px] font-black shadow-[0_0_12px_rgba(255,105,180,0.4)]"
                >
                  Add
                </button>
                <button
                  onClick={props.handleA2HSDismiss}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-white/60 text-[11px] font-semibold"
                >
                  Later
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
