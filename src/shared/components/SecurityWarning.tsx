import { AlertTriangle, Shield, X } from "lucide-react";
import { Button } from "@/shared/components/button";

interface SecurityWarningProps {
  message: string;
  violations: Array<{
    type: string;
    content: string;
    severity: string;
  }>;
  onDismiss: () => void;
  onRetry?: () => void;
}

export default function SecurityWarning({
  message,
  violations,
  onDismiss,
  onRetry
}: SecurityWarningProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 border-red-400/30 bg-red-500/10';
      case 'medium': return 'text-orange-400 border-orange-400/30 bg-orange-500/10';
      case 'low': return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10';
      default: return 'text-red-400 border-red-400/30 bg-red-500/10';
    }
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'link': return '🔗';
      case 'phone': return '📞';
      case 'disguised_phone': return '🎭';
      case 'platform': return '📱';
      case 'creative_disguise': return '🧩';
      default: return '⚠️';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-red-900/95 via-black/95 to-orange-900/95 rounded-3xl border-2 border-red-400/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-white text-xl font-bold">Security Alert</h3>
              <p className="text-white/70 text-sm">Content blocked for safety</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Close warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Message */}
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-white text-sm leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Detected Violations */}
        {violations.length > 0 && (
          <div className="mb-6">
            <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-3">
              Detected Issues ({violations.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {violations.map((violation, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-lg border ${getSeverityColor(violation.severity)}`}
                >
                  <span className="text-lg">{getViolationIcon(violation.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">
                      {violation.content}
                    </p>
                    <p className="text-white/60 text-xs capitalize">
                      {violation.type.replace('_', ' ')} • {violation.severity} severity
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Guidelines */}
        <div className="mb-6 p-3 bg-blue-500/10 border border-blue-400/30 rounded-xl">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-blue-200 text-xs leading-relaxed">
              <p className="font-semibold mb-1">Stay Safe on 2DateMe:</p>
              <ul className="space-y-1 text-blue-300">
                <li>• Keep all communication within the app</li>
                <li>• Never share personal contact information</li>
                <li>• Report suspicious behavior to admins</li>
                <li>• Use our built-in video call feature</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Try Again
            </Button>
          )}
          <Button
            onClick={onDismiss}
            className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium"
          >
            I Understand
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-white/40 text-xs">
            This helps keep our community safe and secure
          </p>
        </div>
      </div>
    </div>
  );
}
