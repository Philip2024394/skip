import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, Calendar, Users, ExternalLink,
  Plus, Search, RefreshCw, Check, X, Loader2, Globe
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocalEvent {
  id: string;
  title: string;
  description?: string | null;
  venue_name: string;
  address?: string | null;
  city: string;
  country?: string | null;
  category: string;
  starts_at: string;
  ends_at?: string | null;
  image_url?: string | null;
  external_url?: string | null;
  source: "user" | "admin" | "eventbrite" | "scraped";
  is_pinned: boolean;
  is_admin_post: boolean;
  attendees_count: number;
  profiles?: { name: string; avatar_url: string | null } | null;
  // client-side
  isAttending?: boolean;
}

const CATEGORIES = [
  { key: "all",       label: "All",       emoji: "✨" },
  { key: "social",    label: "Social",    emoji: "🥂" },
  { key: "dining",    label: "Dining",    emoji: "🍽️" },
  { key: "music",     label: "Music",     emoji: "🎵" },
  { key: "outdoor",   label: "Outdoor",   emoji: "🌿" },
  { key: "sports",    label: "Sports",    emoji: "⚽" },
  { key: "arts",      label: "Arts",      emoji: "🎨" },
  { key: "nightlife", label: "Nightlife", emoji: "🌙" },
  { key: "wellness",  label: "Wellness",  emoji: "🧘" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function categoryEmoji(cat: string) {
  return CATEGORIES.find(c => c.key === cat)?.emoji ?? "📅";
}

const SOURCE_BADGE: Record<string, { label: string; color: string }> = {
  eventbrite: { label: "Eventbrite", color: "#f05537" },
  admin:      { label: "Official",   color: "#a855f7" },
  user:       { label: "Community",  color: "#ec4899" },
  scraped:    { label: "Live",       color: "#22c55e" },
};

// ── Create Event Modal ────────────────────────────────────────────────────────

function CreateEventModal({ onClose, onCreated, userId, userCity }: {
  onClose: () => void;
  onCreated: () => void;
  userId: string;
  userCity: string;
}) {
  const [title, setTitle]         = useState("");
  const [venue, setVenue]         = useState("");
  const [city, setCity]           = useState(userCity);
  const [category, setCategory]   = useState("social");
  const [date, setDate]           = useState("");
  const [description, setDesc]    = useState("");
  const [extUrl, setExtUrl]       = useState("");
  const [saving, setSaving]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `${userId}/event_${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch { toast.error("Image upload failed"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !venue.trim() || !date || !city.trim()) {
      toast.error("Fill in title, venue, city and date");
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("local_events").insert({
        user_id: userId,
        title: title.trim(),
        venue_name: venue.trim(),
        city: city.trim(),
        category,
        starts_at: new Date(date).toISOString(),
        description: description.trim() || null,
        external_url: extUrl.trim() || null,
        image_url: imageUrl,
        source: "user",
      });
      if (error) throw error;
      toast.success("Event posted!");
      onCreated();
    } catch { toast.error("Failed to post event"); }
    finally { setSaving(false); }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg rounded-t-3xl overflow-hidden overflow-y-auto"
        style={{ maxHeight: "90vh", background: "#111" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Post an Event</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          {/* Image */}
          <button onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl overflow-hidden flex items-center justify-center"
            style={{ height: 140, background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.15)" }}>
            {uploading ? <Loader2 className="w-6 h-6 animate-spin text-white/40" /> :
              imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" alt="" /> :
              <div className="flex flex-col items-center gap-1 text-white/40">
                <Plus className="w-6 h-6" /><span className="text-xs">Add photo</span>
              </div>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event name *"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm" />
          <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Venue / Place name *"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm" />
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="City *"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm" />
          <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter(c => c.key !== "all").map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={category === c.key
                  ? { background: "#ec4899", color: "white" }
                  : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          <textarea value={description} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)"
            rows={3}
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm resize-none" />
          <input value={extUrl} onChange={e => setExtUrl(e.target.value)} placeholder="Link (Eventbrite, Instagram, etc.) — optional"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm" />

          <button onClick={handleSubmit} disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-white transition-all active:scale-95 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)" }}>
            {saving ? "Posting…" : "Post Event"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────

function EventCard({ event, onAttend, onUnattend, onClick }: {
  event: LocalEvent;
  onAttend: () => void;
  onUnattend: () => void;
  onClick: () => void;
}) {
  const badge = SOURCE_BADGE[event.source];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      onClick={onClick}
    >
      {/* Image */}
      {event.image_url ? (
        <div className="relative" style={{ aspectRatio: "16/7", background: "#000" }}>
          <img src={event.image_url} className="w-full h-full object-cover" alt={event.title} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7))" }} />
          {event.is_pinned && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ background: "#a855f7" }}>📌 Pinned</span>
          )}
          {badge && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ background: badge.color }}>{badge.label}</span>
          )}
          <span className="absolute bottom-2 left-2 text-lg">{categoryEmoji(event.category)}</span>
        </div>
      ) : (
        <div className="flex items-center justify-center text-4xl"
          style={{ aspectRatio: "16/7", background: "linear-gradient(135deg,rgba(236,72,153,0.15),rgba(168,85,247,0.15))" }}>
          {categoryEmoji(event.category)}
          {badge && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ background: badge.color }}>{badge.label}</span>
          )}
        </div>
      )}

      {/* Body */}
      <div className="p-3 space-y-2">
        <h3 className="text-white font-bold text-sm leading-snug">{event.title}</h3>

        <div className="flex items-center gap-1.5 text-white/50 text-xs">
          <Calendar className="w-3 h-3 flex-shrink-0" />
          {fmtDate(event.starts_at)}
        </div>
        <div className="flex items-center gap-1.5 text-white/50 text-xs">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          {event.venue_name}{event.city ? ` · ${event.city}` : ""}
        </div>

        {event.description && (
          <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{event.description}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-white/40 text-xs">
            <Users className="w-3 h-3" />
            {event.attendees_count} going
          </div>
          <div className="flex items-center gap-2">
            {event.external_url && (
              <a href={event.external_url} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-white/30 hover:text-white/70 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={e => { e.stopPropagation(); event.isAttending ? onUnattend() : onAttend(); }}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
              style={event.isAttending
                ? { background: "rgba(236,72,153,0.2)", color: "#ec4899", border: "1px solid rgba(236,72,153,0.4)" }
                : { background: "linear-gradient(135deg,#ec4899,#a855f7)", color: "white" }}>
              {event.isAttending ? <><Check className="w-3 h-3 inline mr-0.5" />Going</> : "Attend"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents]         = useState<LocalEvent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory]     = useState("all");
  const [search, setSearch]         = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [userId, setUserId]         = useState<string | null>(null);
  const [userCity, setUserCity]     = useState("Jakarta");
  const [attending, setAttending]   = useState<Set<string>>(new Set());

  // Load session + profile
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase.from("profiles").select("city").eq("id", session.user.id).maybeSingle();
      if ((data as any)?.city) setUserCity((data as any).city);
    });
  }, []);

  const loadEvents = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      // Load from DB directly (edge function used for live sync)
      const { data: dbEvts } = await (supabase as any)
        .from("local_events")
        .select("*, profiles(name, avatar_url)")
        .gte("starts_at", new Date().toISOString())
        .order("is_pinned", { ascending: false })
        .order("starts_at", { ascending: true })
        .limit(60);

      // Also try to fetch live Eventbrite events via edge function (non-blocking)
      let liveEvts: LocalEvent[] = [];
      try {
        const { data: edgeData } = await supabase.functions.invoke("fetch-events", {
          body: { city: userCity, mode: "fetch" }
        });
        if (edgeData?.live?.length) liveEvts = edgeData.live;
      } catch { /* no Eventbrite key or network issue — silent */ }

      // Merge: DB first (deduped by external_url)
      const seen = new Set<string>();
      const merged: LocalEvent[] = [];
      for (const e of [...(dbEvts ?? []), ...liveEvts]) {
        const key = e.external_url || e.id;
        if (!seen.has(key)) { seen.add(key); merged.push(e); }
      }

      // Load current user attending set
      if (userId) {
        const { data: att } = await (supabase as any)
          .from("event_attendees").select("event_id").eq("user_id", userId);
        const attSet = new Set<string>((att ?? []).map((a: any) => a.event_id));
        setAttending(attSet);
        setEvents(merged.map(e => ({ ...e, isAttending: attSet.has(e.id) })));
      } else {
        setEvents(merged);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (userCity) loadEvents(); }, [userCity, userId]);

  const handleAttend = async (event: LocalEvent) => {
    if (!userId) return;
    try {
      await (supabase as any).from("event_attendees").insert({ event_id: event.id, user_id: userId });
      await (supabase as any).from("local_events").update({ attendees_count: event.attendees_count + 1 }).eq("id", event.id);
      setAttending(prev => new Set(prev).add(event.id));
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, isAttending: true, attendees_count: e.attendees_count + 1 } : e));
    } catch { toast.error("Could not RSVP"); }
  };

  const handleUnattend = async (event: LocalEvent) => {
    if (!userId) return;
    try {
      await (supabase as any).from("event_attendees").delete().eq("event_id", event.id).eq("user_id", userId);
      await (supabase as any).from("local_events").update({ attendees_count: Math.max(0, event.attendees_count - 1) }).eq("id", event.id);
      setAttending(prev => { const s = new Set(prev); s.delete(event.id); return s; });
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, isAttending: false, attendees_count: Math.max(0, e.attendees_count - 1) } : e));
    } catch { toast.error("Could not cancel RSVP"); }
  };

  const filtered = events.filter(e => {
    const matchCat  = category === "all" || e.category === category;
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue_name.toLowerCase().includes(search.toLowerCase()) ||
      e.city.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/8 px-4 py-3"
        style={{ paddingTop: `max(0.75rem, env(safe-area-inset-top, 0px))` }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 20, border: "1.5px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.15)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ← Back
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-white text-base">Events Near Me</h1>
            <p className="text-white/40 text-xs flex items-center gap-1">
              <Globe className="w-3 h-3" />{userCity} · Updates daily
            </p>
          </div>
          <button onClick={() => loadEvents(true)} disabled={refreshing}
            className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          {userId && (
            <button onClick={() => setShowCreate(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors"
              style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)" }}>
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events, venues…"
            className="w-full bg-white/6 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/30 text-sm"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCategory(c.key)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={category === c.key
                ? { background: "linear-gradient(135deg,#ec4899,#a855f7)", color: "white" }
                : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 px-4 py-4 space-y-3 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white/30" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span className="text-4xl">📅</span>
            <p className="text-white/60 font-semibold">No events found</p>
            <p className="text-white/30 text-sm">Be the first to post one!</p>
            {userId && (
              <button onClick={() => setShowCreate(true)}
                className="mt-2 px-5 py-2.5 rounded-full font-bold text-white text-sm"
                style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)" }}>
                + Post Event
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onAttend={() => handleAttend(event)}
                onUnattend={() => handleUnattend(event)}
                onClick={() => { if (event.external_url) window.open(event.external_url, "_blank"); }}
              />
            ))}
          </AnimatePresence>
        )}
      </main>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && userId && (
          <CreateEventModal
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); loadEvents(true); }}
            userId={userId}
            userCity={userCity}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
