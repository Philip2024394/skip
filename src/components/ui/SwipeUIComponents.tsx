import { useState } from "react";

const InfoChip = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div style={{
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 20,
      padding: "4px 10px",
      display: "flex",
      alignItems: "center",
      gap: 4,
    }}>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{label}</span>
      <span style={{ fontSize: 11, color: "white", fontWeight: 600 }}>{value}</span>
    </div>
  ) : null;

const Section = ({ title, chips }: { title: string; chips: React.ReactNode }) => (
  <div style={{ marginBottom: 12 }}>
    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{title}</p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {chips}
    </div>
  </div>
);

const ContainerBlock = ({
  emoji, title, subtitle, children, accentColor, defaultOpen
}: {
  emoji: string; title: string; subtitle: string;
  children: React.ReactNode; accentColor: string; defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div style={{
      borderRadius: 16,
      overflow: "hidden",
      border: `1px solid ${accentColor}33`,
      background: `linear-gradient(135deg, ${accentColor}11, rgba(0,0,0,0.3))`,
      marginBottom: 8,
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 22,
            width: 40, height: 40,
            borderRadius: 12,
            background: `${accentColor}22`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{emoji}</span>
          <div style={{ textAlign: "left" }}>
            <p style={{ color: "white", fontWeight: 700, fontSize: 13, margin: 0 }}>{title}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>{open ? "Tap to close" : subtitle}</p>
          </div>
        </div>
        <span style={{ color: accentColor, fontSize: 16 }}>{open ? "\u25b2" : "\u25bc"}</span>
      </button>

      {open && (
        <div style={{
          padding: "0 14px 14px",
          borderTop: `1px solid ${accentColor}22`,
          paddingTop: 12,
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

export { InfoChip, Section, ContainerBlock };
