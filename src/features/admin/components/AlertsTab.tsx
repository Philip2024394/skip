import React from "react";
import { Wifi, WifiOff, CheckCircle2 } from "lucide-react";

// ── Alerts Tab ────────────────────────────────────────────────────────────────
export type AlertItem = { id: string; level: "critical" | "warning" | "info"; title: string; detail: string; icon: React.ReactNode; action?: string };

const AlertsTab = ({ alerts, dbConnected }: { alerts: AlertItem[]; dbConnected: boolean }) => {
  const criticals = alerts.filter(a => a.level === "critical");
  const warnings = alerts.filter(a => a.level === "warning");
  const infos = alerts.filter(a => a.level === "info");

  const color = (level: AlertItem["level"]) => ({
    critical: "bg-red-500/15 border-red-500/30 text-red-400",
    warning: "bg-orange-500/15 border-orange-500/30 text-orange-400",
    info: "bg-blue-500/15 border-blue-500/30 text-blue-400",
  }[level]);

  const iconBg = (level: AlertItem["level"]) => ({
    critical: "bg-red-500/20 text-red-400",
    warning: "bg-orange-500/20 text-orange-400",
    info: "bg-blue-500/20 text-blue-400",
  }[level]);

  return (
    <div className="space-y-4">
      {/* DB Status */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${dbConnected ? "bg-green-500/15 border-green-500/30" : "bg-red-500/15 border-red-500/30"}`}>
        {dbConnected ? <Wifi className="w-5 h-5 text-green-400" /> : <WifiOff className="w-5 h-5 text-red-400" />}
        <div>
          <p className={`font-bold text-sm ${dbConnected ? "text-green-300" : "text-red-300"}`}>
            {dbConnected ? "Supabase Connected" : "Database Offline"}
          </p>
          <p className={`text-xs ${dbConnected ? "text-green-400/80" : "text-red-400/80"}`}>
            {dbConnected ? "All services operational" : "Check Supabase credentials in .env.local"}
          </p>
        </div>
        <span className={`ml-auto w-2.5 h-2.5 rounded-full ${dbConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-3 text-center">
          <p className="text-red-400 font-bold text-xl">{criticals.length}</p>
          <p className="text-red-400/70 text-[10px] font-medium">Critical</p>
        </div>
        <div className="bg-orange-500/15 border border-orange-500/30 rounded-xl p-3 text-center">
          <p className="text-orange-400 font-bold text-xl">{warnings.length}</p>
          <p className="text-orange-400/70 text-[10px] font-medium">Warnings</p>
        </div>
        <div className="bg-blue-500/15 border border-blue-500/30 rounded-xl p-3 text-center">
          <p className="text-blue-400 font-bold text-xl">{infos.length}</p>
          <p className="text-blue-400/70 text-[10px] font-medium">Info</p>
        </div>
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-white font-semibold text-base">All Systems Operational</p>
          <p className="text-white/40 text-sm mt-1">No issues detected</p>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-2xl border ${color(alert.level)}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg(alert.level)}`}>
                {alert.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{alert.title}</p>
                <p className="text-xs mt-0.5 opacity-80">{alert.detail}</p>
                {alert.action && <p className="text-[10px] mt-1 font-medium opacity-70">→ {alert.action}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsTab;
