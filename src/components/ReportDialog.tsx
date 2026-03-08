import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

const REASON_KEYS: { value: string; key: "report.inappropriatePhotos" | "report.harassment" | "report.fakeProfile" | "report.spam" | "report.underage" | "report.other" }[] = [
  { value: "Inappropriate photos", key: "report.inappropriatePhotos" },
  { value: "Harassment or abuse", key: "report.harassment" },
  { value: "Fake profile / Catfishing", key: "report.fakeProfile" },
  { value: "Spam or scam", key: "report.spam" },
  { value: "Underage user", key: "report.underage" },
  { value: "Other", key: "report.other" },
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName: string;
}

const ReportDialog = ({ open, onOpenChange, reportedUserId, reportedUserName }: ReportDialogProps) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) { toast.error(t("report.selectReason")); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error(t("report.signIn")); setLoading(false); return; }

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: reportedUserId,
      reason,
      details: details || null,
    });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.error(t("report.alreadyReported"));
      else toast.error(t("report.failed"));
      return;
    }
    toast.success(t("report.success"));
    onOpenChange(false);
    setReason("");
    setDetails("");
  };

  const handleBlock = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error(t("report.signIn")); return; }
    await supabase.from("blocked_users").insert({
      blocker_id: user.id,
      blocked_id: reportedUserId,
    });
    toast.success(`${reportedUserName} ${t("report.blocked")}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/90 backdrop-blur-xl border-white/10 text-white max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">{t("report.title")} {reportedUserName}</DialogTitle>
          <DialogDescription className="text-white/50">{t("report.why")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {REASON_KEYS.map(({ value, key }) => (
            <button key={key} onClick={() => setReason(value)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${reason === value ? "gradient-love text-white" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
              {t(key)}
            </button>
          ))}
        </div>
        {reason && (
          <Textarea placeholder={t("report.details")} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl resize-none" rows={2} value={details} onChange={(e) => setDetails(e.target.value)} />
        )}
        <div className="flex gap-2 mt-2">
          <Button onClick={handleBlock} variant="outline" className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl">
            {t("report.blockUser")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !reason} className="flex-1 gradient-love text-white border-0 rounded-xl">
            {loading ? t("report.sending") : t("report.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
