import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Coins, ShoppingBag } from "lucide-react";

interface TokenPackage {
  tokens: number;
  price: number;
  priceId: string;
}

const TOKEN_PACKAGES: TokenPackage[] = [
  { tokens: 5, price: 1.25, priceId: "price_5_tokens" },
  { tokens: 15, price: 3.25, priceId: "price_15_tokens" },
  { tokens: 35, price: 6.50, priceId: "price_35_tokens" },
  { tokens: 75, price: 12.50, priceId: "price_75_tokens" },
];

interface TokenPurchaseProps {
  onClose: () => void;
  onPurchaseSuccess: () => void;
}

export default function TokenPurchase({ onClose, onPurchaseSuccess }: TokenPurchaseProps) {
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (pkg: TokenPackage) => {
    setIsProcessing(true);
    setSelectedPackage(pkg);

    try {
      const { data, error } = await supabase.functions.invoke("purchase-tokens", {
        body: { 
          tokens: pkg.tokens,
          priceId: pkg.priceId,
          price: pkg.price,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout
        window.open(data.url, "_blank");
        
        // Poll for payment completion (in a real app, you'd use webhooks)
        const checkPayment = async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: tokens } = await supabase
              .from("user_tokens")
              .select("tokens_balance")
              .eq("user_id", user.id)
              .single();

            // If tokens increased, payment was successful
            if (tokens && tokens.tokens_balance >= pkg.tokens) {
              onPurchaseSuccess();
              onClose();
            } else {
              // Check again in 2 seconds
              setTimeout(checkPayment, 2000);
            }
          } catch (error) {
            console.error("Error checking payment:", error);
          }
        };

        setTimeout(checkPayment, 2000);
      }
    } catch (error) {
      console.error("Error initiating purchase:", error);
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-pink-900/90 via-black/90 to-violet-900/90 rounded-3xl border-2 border-pink-400/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-lg w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <h3 className="text-white text-xl font-bold">Purchase Tokens</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <p className="text-white/90 text-sm">
            Purchase tokens to send virtual gifts to other users. Tokens never expire!
          </p>
        </div>

        {/* Token Packages */}
        <div className="space-y-3 mb-6">
          {TOKEN_PACKAGES.map((pkg, index) => (
            <div
              key={pkg.tokens}
              className={`bg-white/5 border rounded-xl p-4 cursor-pointer transition-all ${
                selectedPackage?.tokens === pkg.tokens
                  ? "border-pink-400/50 bg-pink-400/10"
                  : "border-white/20 hover:border-pink-400/30 hover:bg-white/10"
              }`}
              onClick={() => !isProcessing && handlePurchase(pkg)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-400/30 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{pkg.tokens} Tokens</p>
                    <p className="text-white/60 text-sm">
                      {pkg.tokens === 5 ? "Perfect for trying out" :
                       pkg.tokens === 15 ? "Most popular choice" :
                       pkg.tokens === 35 ? "Great value" :
                       "Best value - send many gifts!"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-lg">${pkg.price}</p>
                  <p className="text-green-400 text-sm">
                    ${(pkg.price / pkg.tokens).toFixed(2)}/token
                  </p>
                </div>
              </div>
              
              {isProcessing && selectedPackage?.tokens === pkg.tokens && (
                <div className="mt-3">
                  <div className="bg-pink-500/20 rounded-lg p-2">
                    <p className="text-pink-300 text-sm text-center">
                      Opening payment page...
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-white/50 text-xs">
            Secure payment powered by Stripe. Tokens are added instantly after payment.
          </p>
        </div>
      </div>
    </div>
  );
}
