import { useState } from "react";
import { ChevronDown, ChevronUp, Gift, MapPin, ShieldCheck } from "lucide-react";

interface GiftDeliverySettingsProps {
  giftDeliveryOptedIn: boolean;
  deliveryAddress: string;
  onOptInChange: (val: boolean) => void;
  onAddressChange: (val: string) => void;
}

export const GiftDeliverySettings = ({
  giftDeliveryOptedIn,
  deliveryAddress,
  onOptInChange,
  onAddressChange,
}: GiftDeliverySettingsProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4"
        style={{ background: "transparent" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🎁</span>
          <div className="text-left">
            <p style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: 14, margin: 0 }}>Real Gift Delivery</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>
              {giftDeliveryOptedIn ? "Opted in · address saved" : "Let people send you real gifts"}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>

          {/* Privacy note */}
          <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-300 text-xs leading-relaxed">
                Your address is <strong>100% private</strong>. It is never shared with the person sending you a gift. Our admin team only releases it to verified local service providers, and only after confirming a real order has been paid.
              </p>
            </div>
          </div>

          {/* Opt-in toggle */}
          <div className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-white text-sm font-semibold">Allow real gift delivery</p>
                <p className="text-white/40 text-xs">Admins can share your address with verified providers</p>
              </div>
            </div>
            <button
              onClick={() => onOptInChange(!giftDeliveryOptedIn)}
              className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
              style={{ background: giftDeliveryOptedIn ? "#F59E0B" : "rgba(255,255,255,0.15)" }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  width: 20, height: 20,
                  borderRadius: "50%",
                  background: "white",
                  left: giftDeliveryOptedIn ? "calc(100% - 22px)" : 2,
                  transition: "left 0.2s ease",
                }}
              />
            </button>
          </div>

          {/* Address field — only shown when opted in */}
          {giftDeliveryOptedIn && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-white/40" />
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Your Delivery Address</p>
              </div>
              <p className="text-white/30 text-xs mb-3 leading-relaxed">
                Enter your full address including street, area, city, and postal code. Only visible to admin and verified service providers — never to other users.
              </p>
              <textarea
                value={deliveryAddress}
                onChange={e => onAddressChange(e.target.value)}
                placeholder={`e.g.\nJl. Raya Kuta No. 12, Gang Melati\nKuta, Badung, Bali 80361\n(near Kuta Beach area)`}
                rows={4}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 resize-none"
              />
              {deliveryAddress.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-green-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <p className="text-xs">Address saved — only visible to admin</p>
                </div>
              )}
              {deliveryAddress.length === 0 && (
                <p className="text-amber-400 text-xs mt-2">
                  ⚠️ You won't receive gifts until an address is saved.
                </p>
              )}
            </div>
          )}

          {!giftDeliveryOptedIn && (
            <p className="text-white/30 text-xs text-center leading-relaxed">
              Turn on gift delivery to let people surprise you with flowers, jewelry, spa treatments and more — while keeping your address completely private.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GiftDeliverySettings;
