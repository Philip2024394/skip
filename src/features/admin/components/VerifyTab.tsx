import React, { useState } from "react";
import { Users, BadgeCheck, CheckCircle2, X } from "lucide-react";
import { AdminProfile } from "../types";

// ── Verify Tab ────────────────────────────────────────────────────────────────
const VerifyTab = ({
  profiles,
  onApprove,
  onReject,
}: {
  profiles: AdminProfile[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) => {
  const pending = profiles.filter((p: any) => (p as any).verification_status === "pending");
  const approved = profiles.filter((p: any) => (p as any).verification_status === "approved");
  const rejected = profiles.filter((p: any) => (p as any).verification_status === "rejected");
  const [acting, setActing] = useState<string | null>(null);

  const act = async (id: string, fn: (id: string) => Promise<void>) => {
    setActing(id);
    await fn(id);
    setActing(null);
  };

  const Card = ({ p, showActions }: { p: AdminProfile; showActions: boolean }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        {(p as any).avatar_url ? (
          <img src={(p as any).avatar_url} className="w-12 h-12 rounded-full object-cover ring-2 ring-white/15 flex-shrink-0" alt={p.name} />
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm flex items-center gap-1.5">
            {(p as any).is_verified && <BadgeCheck className="w-4 h-4 text-sky-400 flex-shrink-0" />}
            {p.name}, {p.age}
          </p>
          <p className="text-white/50 text-xs">{p.city ? `${p.city}, ` : ""}{p.country || "Unknown"}</p>
          <p className="text-white/40 text-[10px] mt-0.5">{p.whatsapp}</p>
        </div>
      </div>

      {/* Submitted ID info */}
      <div className="bg-white/5 rounded-xl p-3 space-y-1.5 text-xs border border-white/8">
        <div className="flex gap-2">
          <span className="text-white/40 w-20 flex-shrink-0">ID Type</span>
          <span className="text-white font-medium uppercase">{(p as any).verification_id_type || "—"}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-white/40 w-20 flex-shrink-0">Name on ID</span>
          <span className="text-white font-medium">{(p as any).verification_name || "—"}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-white/40 w-20 flex-shrink-0">Age on ID</span>
          <span className={`font-semibold ${(p as any).verification_age && Math.abs((p as any).verification_age - p.age) > 1 ? "text-red-400" : "text-white"}`}>
            {(p as any).verification_age || "—"}
            {(p as any).verification_age && Math.abs((p as any).verification_age - p.age) > 1 && " ⚠️ mismatch"}
          </span>
        </div>
      </div>

      {/* ID photo */}
      {(p as any).verification_id_url && (
        <a href={(p as any).verification_id_url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-white/10">
          <img src={(p as any).verification_id_url} alt="ID" className="w-full h-32 object-cover" />
          <p className="text-white/40 text-[10px] text-center py-1">Tap to open full size</p>
        </a>
      )}

      {showActions && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => act(p.id, onApprove)}
            disabled={acting === p.id}
            className="h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 bg-sky-500/15 border border-sky-500/30 text-sky-400 active:scale-95 transition-all disabled:opacity-50"
          >
            <BadgeCheck className="w-4 h-4" /> Approve
          </button>
          <button
            onClick={() => act(p.id, onReject)}
            disabled={acting === p.id}
            className="h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 bg-red-500/15 border border-red-500/30 text-red-400 active:scale-95 transition-all disabled:opacity-50"
          >
            <X className="w-4 h-4" /> Reject
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white font-semibold text-sm">ID Verification Requests</p>
        {pending.length > 0 && <span className="ml-auto bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{pending.length} pending</span>}
      </div>

      {pending.length === 0 && (
        <div className="text-center py-10 bg-white/5 border border-white/10 rounded-2xl">
          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-white/40 text-sm">No pending verification requests</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-orange-400 text-[10px] font-bold uppercase tracking-wider">Pending ({pending.length})</p>
          {pending.map(p => <Card key={p.id} p={p} showActions />)}
        </div>
      )}

      {approved.length > 0 && (
        <div className="space-y-3">
          <p className="text-sky-400 text-[10px] font-bold uppercase tracking-wider">Approved ({approved.length})</p>
          {approved.map(p => <Card key={p.id} p={p} showActions={false} />)}
        </div>
      )}

      {rejected.length > 0 && (
        <div className="space-y-3">
          <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider">Rejected ({rejected.length})</p>
          {rejected.map(p => <Card key={p.id} p={p} showActions={false} />)}
        </div>
      )}
    </div>
  );
};

export default VerifyTab;
