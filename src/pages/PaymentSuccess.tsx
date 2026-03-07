import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageCircle, Loader2, EyeOff, Star } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ whatsapp: string; name: string } | null>(null);
  const [featureActivated, setFeatureActivated] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      const sessionId = searchParams.get("session_id");
      const feature = searchParams.get("feature");

      if (!sessionId) {
        toast.error("Invalid payment session");
        navigate("/");
        return;
      }

      try {
        if (feature === "incognito") {
          const { data, error } = await supabase.functions.invoke("activate-incognito", {
            body: { sessionId },
          });
          if (error) throw error;
          if (!data.success) throw new Error(data.error);
          setFeatureActivated("incognito");
          toast.success("👻 Incognito Mode activated for 24 hours!");
        } else if (feature === "spotlight") {
          const { data, error } = await supabase.functions.invoke("activate-spotlight", {
            body: { sessionId },
          });
          if (error) throw error;
          if (!data.success) throw new Error(data.error);
          setFeatureActivated("spotlight");
          toast.success("🌟 Spotlight activated for 24 hours!");
        } else if (feature) {
          // Other features (boost, superlike, verified) - just confirm
          setFeatureActivated(feature);
          toast.success("Power-Up activated! ⚡");
        } else {
          // Connection unlock flow
          const { data, error } = await supabase.functions.invoke("verify-payment", {
            body: { sessionId },
          });
          if (error) throw error;
          if (!data.success) throw new Error(data.error);
          setResult({ whatsapp: data.whatsapp, name: data.name });
          toast.success("Payment verified! Connection unlocked 🔓");
        }
      } catch (err: any) {
        toast.error(err.message || "Payment verification failed");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [searchParams, navigate]);

  const openWhatsApp = () => {
    if (!result?.whatsapp) return;
    const cleaned = result.whatsapp.replace(/\D/g, "");
    const message = encodeURIComponent(`Hey ${result.name}! We matched on SkipTheApp 🔥`);
    window.open(`https://wa.me/${cleaned}?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center space-y-6">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />

        {featureActivated === "incognito" ? (
          <>
            <EyeOff className="w-12 h-12 text-muted-foreground mx-auto" />
            <h1 className="font-display font-bold text-2xl text-foreground">👻 You're Invisible!</h1>
            <p className="text-muted-foreground">
              Incognito Mode is active for <span className="text-accent font-semibold">24 hours</span>. Browse freely — nobody can see you.
            </p>
          </>
        ) : featureActivated === "spotlight" ? (
          <>
            <Star className="w-12 h-12 text-accent mx-auto" />
            <h1 className="font-display font-bold text-2xl text-foreground">🌟 You're in the Spotlight!</h1>
            <p className="text-muted-foreground">
              Your profile is featured at the <span className="text-accent font-semibold">top of everyone's stack</span> for 24 hours!
            </p>
          </>
        ) : featureActivated ? (
          <>
            <h1 className="font-display font-bold text-2xl text-foreground">⚡ Power-Up Activated!</h1>
            <p className="text-muted-foreground">Your <span className="text-primary font-semibold">{featureActivated}</span> is now active.</p>
          </>
        ) : result ? (
          <>
            <h1 className="font-display font-bold text-2xl text-foreground">Connection Unlocked!</h1>
            <p className="text-muted-foreground">
              You can now message <span className="text-primary font-semibold">{result.name}</span> on WhatsApp!
            </p>
            <p className="text-foreground text-lg font-mono glass rounded-lg p-3">{result.whatsapp}</p>
            <Button onClick={openWhatsApp} className="w-full gradient-love text-primary-foreground border-0 h-12 text-base font-semibold">
              <MessageCircle className="w-5 h-5 mr-2" /> Open WhatsApp
            </Button>
          </>
        ) : (
          <h1 className="font-display font-bold text-2xl text-foreground">Payment Complete!</h1>
        )}

        <Button variant="outline" onClick={() => navigate("/")} className="w-full border-border">
          Back to Browsing
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
