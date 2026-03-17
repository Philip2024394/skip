import { useState, forwardRef, useImperativeHandle } from "react";
import { Textarea } from "@/shared/components/textarea";
import { Label } from "@/shared/components/label";
import securityFilter from "@/shared/services/securityFilter";
import SecurityWarning from "./SecurityWarning";
import { Shield } from "lucide-react";

interface SecureTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
  label?: string;
  showCharCount?: boolean;
  context?: string;
  disabled?: boolean;
  userId?: string;
}

const SecureTextarea = forwardRef<
  HTMLTextAreaElement,
  SecureTextareaProps
>(({
  id,
  value,
  onChange,
  placeholder,
  maxLength = 350,
  rows = 3,
  className = "",
  label,
  showCharCount = true,
  context = "general",
  disabled = false,
  userId
}, ref) => {
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [securityViolations, setSecurityViolations] = useState<any[]>([]);
  const [lastValidValue, setLastValidValue] = useState(value);

  // Forward ref to the textarea element
  useImperativeHandle(ref, () => {
    const textarea = document.getElementById(id || 'secure-textarea') as HTMLTextAreaElement;
    return textarea;
  });

  const handleChange = (newValue: string) => {
    // Basic validation first
    if (newValue.length > maxLength) {
      return; // Don't allow exceeding max length
    }

    // Security filter validation
    const securityResult = securityFilter.filterText(newValue, context);

    if (!securityResult.isAllowed) {
      setSecurityViolations(securityResult.violations);
      setShowSecurityWarning(true);

      // Log security violation
      if (userId) {
        securityFilter.logViolation(
          userId,
          newValue,
          securityResult.violations,
          context
        );
      }

      // Don't update the value if it contains violations
      return;
    }

    // Update the value if it passes security check
    onChange(newValue);
    setLastValidValue(newValue);
  };

  const handleWarningDismiss = () => {
    setShowSecurityWarning(false);
    setSecurityViolations([]);
    // Revert to last valid value
    onChange(lastValidValue);
  };

  const handleWarningRetry = () => {
    setShowSecurityWarning(false);
    setSecurityViolations([]);
    // Clear the message completely
    onChange("");
    setLastValidValue("");
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="text-white/70 text-sm block mb-2">
          {label}
        </Label>
      )}

      <div className="relative">
        <Textarea
          id={id || 'secure-textarea'}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={`bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none rounded-xl ${className}`}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
        />

        {/* Security indicator */}
        <div className="absolute top-2 right-2">
          <Shield className="w-4 h-4 text-green-400/60" />
        </div>
      </div>

      {showCharCount && (
        <div className="flex items-center justify-between">
          <p className="text-white/50 text-xs">
            {value.length}/{maxLength} characters
          </p>
          <p className="text-white/40 text-xs flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Secured
          </p>
        </div>
      )}

      {/* Security Warning Modal */}
      {showSecurityWarning && (
        <SecurityWarning
          message={securityFilter.filterText(value, context).warningMessage || "Sharing phone numbers, links, or external platform references is strictly prohibited. Please use the app's features to connect safely."}
          violations={securityViolations}
          onDismiss={handleWarningDismiss}
          onRetry={handleWarningRetry}
        />
      )}
    </div>
  );
});

SecureTextarea.displayName = 'SecureTextarea';

export default SecureTextarea;
