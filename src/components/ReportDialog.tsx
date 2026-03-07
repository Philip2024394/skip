import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const REASONS = [
  "Inappropriate photos",
  "Harassment or abuse",
  "Fake profile / Catfishing",
  "Spam or scam",
  "Underage user",
  "Other",
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName: string;
}

const ReportDialog = ({ open, onOpenChange, reportedUserId, reportedUserName }: ReportDialogProps) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) { toast.error("Please select a reason"); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in"); setLoading(false); return; }

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: reportedUserId,
      reason,
      details: details || null,
    });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.error("You already reported this user");
      else toast.error("Failed to submit report");
      return;
    }
    toast.success("Report submitted. We'll review it shortly.");
    onOpenChange(false);
    setReason("");
    setDetails("");
  };

  const handleBlock = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in"); return; }
    await supabase.from("blocked_users").insert({
      blocker_id: user.id,
      blocked_id: reportedUserId,
    });
    toast.success(`${reportedUserName} has been blocked`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/90 backdrop-blur-xl border-white/10 text-white max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Report {reportedUserName}</DialogTitle>
          <DialogDescription className="text-white/50">Why are you reporting this user?</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {REASONS.map((r) => (
            <button key={r} onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${reason === r ? "gradient-love text-white" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
              {r}
            </button>
          ))}
        </div>
        {reason && (
          <Textarea placeholder="Additional details (optional)" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl resize-none" rows={2} value={details} onChange={(e) => setDetails(e.target.value)} />
        )}
        <div className="flex gap-2 mt-2">
          <Button onClick={handleBlock} variant="outline" className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl">
            Block User
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !reason} className="flex-1 gradient-love text-white border-0 rounded-xl">
            {loading ? "Sending..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
