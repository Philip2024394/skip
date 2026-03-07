import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // Check if user arrived via recovery link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsUpdateMode(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSendReset = async () => {
    if (!email) { toast.error("Please enter your email"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Check your email for the reset link! 📧");
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated! Redirecting...");
    setTimeout(() => navigate("/"), 1500);
  };

  return (
    <div className="h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundImage: "url('/images/app-background.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-display font-bold text-white">
            {isUpdateMode ? "Set New Password" : "Reset Password"}
          </h1>
          <p className="text-white/50 text-xs mt-1">
            {isUpdateMode ? "Enter your new password below" : "We'll send you a reset link"}
          </p>
        </div>

        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-4">
          {isUpdateMode ? (
            <>
              <div>
                <Label className="text-white/50 text-xs mb-1.5 block">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input type="password" placeholder="Min 6 characters" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleUpdatePassword} disabled={loading} className="w-full gradient-love text-white border-0 h-12 text-base font-semibold rounded-xl">
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </>
          ) : sent ? (
            <div className="text-center py-4">
              <Mail className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-white/80 text-sm">Reset link sent to <span className="text-primary font-semibold">{email}</span></p>
              <p className="text-white/40 text-xs mt-2">Check your inbox and spam folder</p>
            </div>
          ) : (
            <>
              <div>
                <Label className="text-white/50 text-xs mb-1.5 block">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input type="email" placeholder="your@email.com" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleSendReset} disabled={loading} className="w-full gradient-love text-white border-0 h-12 text-base font-semibold rounded-xl">
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </>
          )}

          <Button variant="outline" onClick={() => navigate("/auth")} className="w-full border-white/10 text-white/70 hover:bg-white/10 hover:text-white rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
