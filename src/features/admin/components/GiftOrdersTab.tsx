import { useState } from "react";
import { Gift, Search, MapPin, Package, CheckCircle, Eye, EyeOff, Plus, MessageCircle } from "lucide-react";
import { QUESTION_TEMPLATES } from "@/features/dating/data/profileQuestions";

// ── Test profile question blocker ─────────────────────────────────────────────
function injectTestQuestion(templateId: string) {
  const template = QUESTION_TEMPLATES.find(t => t.id === templateId);
  if (!template) return;
  const RECEIVED_KEY = "received_questions_v1";
  try {
    const existing = JSON.parse(localStorage.getItem(RECEIVED_KEY) || "[]");
    existing.push({
      id: `rq_test_${Date.now()}`,
      fromName: "Sari",
      fromAvatar: undefined,
      templateId: template.id,
      fieldLabel: template.fieldLabel,
      question: template.question,
      askedAt: Date.now(),
      status: "pending",
    });
    localStorage.setItem(RECEIVED_KEY, JSON.stringify(existing));
    window.location.reload();
  } catch { /* no-op */ }
}
import type { GiftOrder } from "@/features/real-gifts/RealGiftOrderFlow";
import { setGiftNotificationStage } from "@/features/real-gifts/GiftDeliveryNotification";

// ── City activation ────────────────────────────────────────────────────────────
const CITY_LS_KEY = "gift_service_cities";
const ALL_CITIES = ["Yogyakarta", "Jakarta", "Bali", "Surabaya", "Bandung", "Medan"];

export function getActiveCities(): string[] {
  try { return JSON.parse(localStorage.getItem(CITY_LS_KEY) || '["Yogyakarta"]'); }
  catch { return ["Yogyakarta"]; }
}
function saveActiveCities(cities: string[]) {
  localStorage.setItem(CITY_LS_KEY, JSON.stringify(cities));
}

// ── Storage helpers ────────────────────────────────────────────────────────────
const LS_KEY = "admin_gift_orders";

function loadOrders(): GiftOrder[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveOrders(orders: GiftOrder[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(orders));
}

// ── Status display ─────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<GiftOrder["status"], { label: string; color: string; emoji: string }> = {
  pending_payment: { label: "Pending Payment", color: "#F59E0B", emoji: "⏳" },
  confirmed:       { label: "Payment Confirmed", color: "#3B82F6", emoji: "✅" },
  address_released:{ label: "Address Released", color: "#8B5CF6", emoji: "📍" },
  otw:             { label: "On The Way", color: "#22C55E", emoji: "🚚" },
  delivered:       { label: "Delivered", color: "#6B7280", emoji: "📦" },
};

// ── Blank order form ───────────────────────────────────────────────────────────
const blankForm = (): Partial<GiftOrder> => ({
  id: "ORD-" + Math.random().toString(36).toUpperCase().slice(2, 8),
  gift_type: "",
  gift_emoji: "🎁",
  recipient_id: "",
  recipient_name: "",
  recipient_city: "",
  sender_name: "",
  sender_id: "",
  fee_usd: 9.99,
  status: "pending_payment",
  created_at: new Date().toISOString(),
});

const GIFT_EMOJIS: Record<string, string> = {
  "Flowers & Bouquet": "💐",
  "Jewelry & Accessories": "💍",
  "Spa & Beauty Treatment": "💆",
  "Massage & Wellness": "🧖",
  "Cake & Sweet Treats": "🍰",
  "Surprise Gift Box": "🎁",
};

// ── Component ─────────────────────────────────────────────────────────────────
export const GiftOrdersTab = () => {
  const [orders, setOrders] = useState<GiftOrder[]>(loadOrders);
  const [activeCities, setActiveCities] = useState<string[]>(getActiveCities);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddressFor, setShowAddressFor] = useState<string | null>(null);
  const [etaInputs, setEtaInputs] = useState<Record<string, { value: string; unit: "hours" | "days" }>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState<Partial<GiftOrder>>(blankForm());
  const [addressLookup, setAddressLookup] = useState<Record<string, string>>({});

  const refresh = () => setOrders(loadOrders());

  const updateOrderStatus = (id: string, status: GiftOrder["status"]) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    saveOrders(updated);
    setOrders(updated);
  };

  const lookupAddress = (recipientId: string) => {
    // In production this would query Supabase profiles.delivery_address
    // For demo, check localStorage user profile data
    try {
      const profiles = JSON.parse(localStorage.getItem("app_profiles") || "[]");
      const profile = profiles.find((p: any) => p.id === recipientId);
      if (profile?.delivery_address) {
        setAddressLookup(prev => ({ ...prev, [recipientId]: profile.delivery_address }));
        setShowAddressFor(recipientId);
        return;
      }
      // Also check the current user's own profile (for testing)
      const ownProfile = JSON.parse(localStorage.getItem("user_profile") || "{}");
      if (ownProfile?.id === recipientId && ownProfile?.delivery_address) {
        setAddressLookup(prev => ({ ...prev, [recipientId]: ownProfile.delivery_address }));
        setShowAddressFor(recipientId);
        return;
      }
    } catch { /* ignore */ }
    setAddressLookup(prev => ({ ...prev, [recipientId]: "⚠️ No address on file — recipient has not opted in or has not saved an address." }));
    setShowAddressFor(recipientId);
  };

  const markAddressReleased = (id: string) => {
    updateOrderStatus(id, "address_released");
  };

  const setPresentsOtw = (order: GiftOrder) => {
    const eta = etaInputs[order.id];
    if (!eta?.value) return;
    const ms = eta.unit === "hours"
      ? parseFloat(eta.value) * 60 * 60 * 1000
      : parseFloat(eta.value) * 24 * 60 * 60 * 1000;
    const etaDate = new Date(Date.now() + ms).toISOString();
    const updated = orders.map(o => o.id === order.id ? { ...o, status: "otw" as const, delivery_eta: etaDate } : o);
    saveOrders(updated);
    setOrders(updated);
    // Trigger recipient notification (stage 1)
    // In production this writes to Supabase. For demo: localStorage keyed by recipient ID.
    try {
      const existing = JSON.parse(localStorage.getItem(`gift_notification_${order.recipient_id}`) || "null");
      const notif = {
        order_id: order.id,
        gift_emoji: order.gift_emoji,
        gift_type: order.gift_type,
        sender_name: order.sender_name,
        reveal_sender: false,
        dismissed_stages: [],
        ...(existing || {}),
        notif_stage: 1,
        delivery_eta: etaDate,
      };
      localStorage.setItem(`gift_notification_${order.recipient_id}`, JSON.stringify(notif));
    } catch { /* ignore */ }
  };

  const markDelivered = (id: string) => {
    const order = orders.find(o => o.id === id);
    if (order) {
      // Advance notification to stage 3 (photo request)
      setGiftNotificationStage(order.recipient_id, 3);
    }
    updateOrderStatus(id, "delivered");
  };

  const addOrder = () => {
    if (!newForm.recipient_id || !newForm.gift_type || !newForm.sender_name) return;
    const order: GiftOrder = {
      id: newForm.id!,
      sender_id: newForm.sender_id || "",
      sender_name: newForm.sender_name!,
      recipient_id: newForm.recipient_id!,
      recipient_name: newForm.recipient_name || "",
      recipient_city: newForm.recipient_city || "",
      gift_type: newForm.gift_type!,
      gift_emoji: GIFT_EMOJIS[newForm.gift_type!] || "🎁",
      fee_usd: 9.99,
      status: "pending_payment",
      created_at: new Date().toISOString(),
    };
    const updated = [order, ...orders];
    saveOrders(updated);
    setOrders(updated);
    setNewForm(blankForm());
    setShowNewForm(false);
  };

  const filtered = orders.filter(o =>
    !search ||
    o.recipient_id.toLowerCase().includes(search.toLowerCase()) ||
    o.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
    o.sender_name.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  const pending = orders.filter(o => o.status === "pending_payment").length;
  const otw = orders.filter(o => o.status === "otw").length;

  return (
    <div className="space-y-4">
      {/* City Service Activation */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-amber-400" />
          <p className="text-white font-semibold text-sm">Service Cities</p>
          <span className="ml-auto text-white/40 text-xs">{activeCities.length} active</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ALL_CITIES.map(city => {
            const isActive = activeCities.includes(city);
            return (
              <button
                key={city}
                onClick={() => {
                  const next = isActive
                    ? activeCities.filter(c => c !== city)
                    : [...activeCities, city];
                  saveActiveCities(next);
                  setActiveCities(next);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: isActive ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isActive ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)"}`,
                  color: isActive ? "#86EFAC" : "#ffffff60",
                }}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-green-400" : "bg-white/20"}`} />
                {city}
                {city === "Yogyakarta" && <span className="ml-auto text-[9px] opacity-60">launch</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Question Blocker — demo */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="w-4 h-4 text-pink-400" />
          <p className="text-white font-semibold text-sm">Profile Questions</p>
          <span className="ml-auto text-white/40 text-xs">test blocker</span>
        </div>
        <p className="text-white/40 text-xs">Send a test question to yourself to preview the blocking popup experience.</p>
        <div className="grid grid-cols-2 gap-2">
          {QUESTION_TEMPLATES.slice(0, 6).map(t => (
            <button
              key={t.id}
              onClick={() => injectTestQuestion(t.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left"
              style={{
                background: "rgba(236,72,153,0.08)",
                border: "1px solid rgba(236,72,153,0.2)",
                color: "rgba(244,114,182,0.9)",
              }}
            >
              <span>{t.emoji}</span>
              <span className="truncate">{t.fieldLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Orders", val: orders.length, color: "#F59E0B" },
          { label: "Pending Payment", val: pending, color: "#EF4444" },
          { label: "On The Way", val: otw, color: "#22C55E" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="font-bold text-lg" style={{ color: s.color }}>{s.val}</p>
            <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add order button */}
      <button
        onClick={() => setShowNewForm(!showNewForm)}
        className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#FDE68A" }}
      >
        <Plus className="w-4 h-4" />
        {showNewForm ? "Cancel" : "Add Order (from WhatsApp)"}
      </button>

      {/* New order form */}
      {showNewForm && (
        <div className="p-4 rounded-2xl space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Enter Order Details from WhatsApp</p>
          {[
            { label: "Order Ref (e.g. ORD-ABC123)", key: "id" },
            { label: "Sender Name", key: "sender_name" },
            { label: "Sender Profile ID", key: "sender_id" },
            { label: "Recipient Profile ID *", key: "recipient_id" },
            { label: "Recipient Name", key: "recipient_name" },
            { label: "Recipient City", key: "recipient_city" },
          ].map(field => (
            <input
              key={field.key}
              value={(newForm as any)[field.key] || ""}
              onChange={e => setNewForm(prev => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.label}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30"
            />
          ))}
          <select
            value={newForm.gift_type || ""}
            onChange={e => setNewForm(prev => ({ ...prev, gift_type: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm"
          >
            <option value="">Select Gift Type *</option>
            {Object.keys(GIFT_EMOJIS).map(g => (
              <option key={g} value={g}>{GIFT_EMOJIS[g]} {g}</option>
            ))}
          </select>
          <button
            onClick={addOrder}
            disabled={!newForm.recipient_id || !newForm.gift_type || !newForm.sender_name}
            className="w-full py-3 rounded-xl text-sm font-bold text-black disabled:opacity-40"
            style={{ background: "#F59E0B" }}
          >
            Save Order
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, ID, or order ref..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder-white/30"
        />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10">
          <Gift className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-white/30 text-sm">No gift orders yet</p>
          <p className="text-white/20 text-xs mt-1">Orders appear here when senders message admin via WhatsApp</p>
        </div>
      )}

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.map(order => {
          const st = STATUS_LABELS[order.status];
          const isExpanded = expandedId === order.id;
          const eta = etaInputs[order.id];

          return (
            <div key={order.id} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Summary row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">{order.gift_emoji}</span>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{order.gift_type}</p>
                    <p className="text-white/40 text-xs truncate">To: {order.recipient_name || order.recipient_id} · {order.recipient_city}</p>
                    <p className="text-white/30 text-xs">{order.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${st.color}22`, color: st.color }}>
                    {st.emoji} {st.label}
                  </span>
                </div>
              </button>

              {/* Expanded order detail */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                  {/* Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ["Order", order.id],
                      ["Fee", `$${order.fee_usd} USD`],
                      ["From", `${order.sender_name} (${order.sender_id || "—"})`],
                      ["Recipient ID", order.recipient_id],
                      ["Created", new Date(order.created_at).toLocaleString()],
                      order.delivery_eta ? ["ETA", new Date(order.delivery_eta).toLocaleString()] : ["ETA", "Not set"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-white/30 uppercase tracking-wider" style={{ fontSize: 9 }}>{k}</p>
                        <p className="text-white/80 font-medium break-all">{v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Address lookup */}
                  <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-white/40" />
                        <p className="text-white/60 text-xs font-semibold">Recipient Address</p>
                      </div>
                      <button
                        onClick={() => {
                          if (showAddressFor === order.recipient_id) setShowAddressFor(null);
                          else lookupAddress(order.recipient_id);
                        }}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
                      >
                        {showAddressFor === order.recipient_id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showAddressFor === order.recipient_id ? "Hide" : "Look Up"}
                      </button>
                    </div>
                    {showAddressFor === order.recipient_id && (
                      <p className="text-white/70 text-xs leading-relaxed font-mono" style={{ wordBreak: "break-word" }}>
                        {addressLookup[order.recipient_id]}
                      </p>
                    )}
                  </div>

                  {/* Action buttons by status */}
                  <div className="space-y-2">
                    {order.status === "pending_payment" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, "confirmed")}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                        style={{ background: "rgba(59,130,246,0.2)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.3)" }}
                      >
                        <CheckCircle className="w-4 h-4" /> Mark Payment Confirmed
                      </button>
                    )}

                    {order.status === "confirmed" && (
                      <button
                        onClick={() => markAddressReleased(order.id)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                        style={{ background: "rgba(139,92,246,0.2)", color: "#C4B5FD", border: "1px solid rgba(139,92,246,0.3)" }}
                      >
                        <MapPin className="w-4 h-4" /> Address Released to Provider
                      </button>
                    )}

                    {(order.status === "confirmed" || order.status === "address_released") && (
                      <div className="p-3 rounded-xl space-y-2" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                        <p className="text-green-300/70 text-xs font-semibold">Set Delivery Time → triggers notification to recipient</p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            max="999"
                            placeholder="e.g. 3"
                            value={etaInputs[order.id]?.value || ""}
                            onChange={e => setEtaInputs(prev => ({ ...prev, [order.id]: { value: e.target.value, unit: prev[order.id]?.unit || "hours" } }))}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30"
                          />
                          <select
                            value={etaInputs[order.id]?.unit || "hours"}
                            onChange={e => setEtaInputs(prev => ({ ...prev, [order.id]: { value: prev[order.id]?.value || "", unit: e.target.value as "hours" | "days" } }))}
                            className="bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-white text-sm"
                          >
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                          </select>
                        </div>
                        <button
                          onClick={() => setPresentsOtw(order)}
                          disabled={!etaInputs[order.id]?.value}
                          className="w-full py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-40 flex items-center justify-center gap-2"
                          style={{ background: "#22c55e" }}
                        >
                          <Package className="w-4 h-4" /> Present On The Way 🚚
                        </button>
                      </div>
                    )}

                    {order.status === "otw" && (
                      <button
                        onClick={() => markDelivered(order.id)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                        style={{ background: "rgba(107,114,128,0.2)", color: "#D1D5DB", border: "1px solid rgba(107,114,128,0.3)" }}
                      >
                        <CheckCircle className="w-4 h-4" /> Mark Delivered (triggers photo request)
                      </button>
                    )}

                    {order.status === "delivered" && (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <CheckCircle className="w-4 h-4 text-white/30" />
                        <p className="text-white/30 text-sm">Delivered — complete</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GiftOrdersTab;
