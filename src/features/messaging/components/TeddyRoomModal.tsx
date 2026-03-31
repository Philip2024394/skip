import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImagePlus, Play, Trash2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────
interface RoomMedia {
  id: string;
  media_url: string;
  media_type: "photo" | "video";
  caption: string | null;
  uploaded_by: string;
  created_at: string;
}

interface TeddyRoomInvite {
  id: string;
  room_owner_id: string;
  invited_user_id: string;
  status: "pending" | "accepted" | "declined" | "expired";
  expires_at: string | null;
}

interface Props {
  userId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  invite: TeddyRoomInvite;
  onClose: () => void;
}

const TEDDY_BG = "https://ik.imagekit.io/dateme/Teddy%20bear%20in%20a%20cozy%20office.png?updatedAt=1774818471382";

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TeddyRoomModal({ userId, partnerId, partnerName, partnerAvatar, invite, onClose }: Props) {
  const [media, setMedia] = useState<RoomMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<RoomMedia | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const ownerId = invite.room_owner_id;
  const isOwner = userId === ownerId;

  // ── Load media ────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadMedia();
    // Real-time subscription
    const sub = supabase
      .channel(`teddy_room_${invite.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "teddy_room_media",
        filter: `room_owner_id=eq.${ownerId}`,
      }, () => loadMedia())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [invite.id]);

  const loadMedia = async () => {
    const { data } = await supabase
      .from("teddy_room_media")
      .select("*")
      .eq("room_owner_id", ownerId)
      .eq("invited_user_id", invite.invited_user_id)
      .order("created_at", { ascending: false }) as any;
    setMedia(data ?? []);
    setLoading(false);
  };

  // ── Upload ────────────────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isPhoto = file.type.startsWith("image/");
    if (!isVideo && !isPhoto) {
      toast.error("Only photos and videos are supported.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large — max 50 MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `teddy_rooms/${invite.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("teddy-room-media")
        .upload(path, file, { upsert: false });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("teddy-room-media")
        .getPublicUrl(path);

      await supabase.from("teddy_room_media").insert({
        room_owner_id: ownerId,
        invited_user_id: invite.invited_user_id,
        uploaded_by: userId,
        media_url: urlData.publicUrl,
        media_type: isVideo ? "video" : "photo",
      } as any);

      toast.success("Uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (item: RoomMedia) => {
    if (item.uploaded_by !== userId) return;
    await supabase.from("teddy_room_media").delete().eq("id", item.id) as any;
    setMedia(prev => prev.filter(m => m.id !== item.id));
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
        className="fixed inset-x-0 bottom-0 z-[9999] mx-auto max-w-md rounded-t-3xl overflow-hidden flex flex-col"
        style={{
          backgroundImage: "url('/images/app-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "1.5px solid rgba(160,100,255,0.5)",
          borderBottom: "none",
          boxShadow: "0 -32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(140,80,255,0.2)",
          maxHeight: "92dvh",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: "rgba(6,4,14,0.88)" }} />

        {/* Purple rim */}
        <div className="absolute top-0 left-0 right-0 h-0.5 z-10 pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, #a855f7, rgba(168,85,247,0.8), #a855f7, transparent)" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3">
            <div className="flex items-center gap-3">
              {/* Teddy icon + partner avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/50"
                  style={{ background: "rgba(140,80,255,0.15)" }}>
                  <img src={TEDDY_BG} alt="Room" className="w-full h-full object-cover opacity-80" />
                </div>
                {partnerAvatar && (
                  <img src={partnerAvatar} alt={partnerName}
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-purple-500/60 object-cover" />
                )}
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">🐻 Teddy Room</p>
                <p className="text-purple-300/70 text-[11px]">with {partnerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Upload button */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 0 12px rgba(168,85,247,0.3)" }}
              >
                <ImagePlus className="w-3.5 h-3.5" />
                {uploading ? "Uploading…" : "Add"}
              </button>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Media grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-purple-500/40 border-t-purple-500 animate-spin" />
              </div>
            ) : media.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden opacity-60">
                  <img src={TEDDY_BG} alt="Empty room" className="w-full h-full object-cover" />
                </div>
                <p className="text-white/40 text-sm text-center leading-relaxed">
                  Your private room is ready 🐻<br />
                  <span className="text-white/25 text-xs">Tap <strong className="text-purple-400">Add</strong> to share photos or videos — only {partnerName} can see them.</span>
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                <AnimatePresence>
                  {media.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ delay: i * 0.03 }}
                      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                      onClick={() => setLightbox(item)}
                    >
                      {item.media_type === "video" ? (
                        <>
                          <video src={item.media_url} className="w-full h-full object-cover" muted playsInline />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-7 h-7 text-white drop-shadow-lg" fill="white" />
                          </div>
                        </>
                      ) : (
                        <img src={item.media_url} alt={item.caption ?? ""} className="w-full h-full object-cover" />
                      )}

                      {/* Uploader badge */}
                      <div className="absolute top-1.5 left-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{
                            background: item.uploaded_by === userId ? "rgba(168,85,247,0.85)" : "rgba(255,255,255,0.15)",
                            color: "white",
                          }}>
                          {item.uploaded_by === userId ? "You" : partnerName.split(" ")[0]}
                        </span>
                      </div>

                      {/* Delete (own uploads only) */}
                      {item.uploaded_by === userId && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(item); }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Privacy footer */}
          <div className="px-5 pb-4 pt-2 border-t border-white/5">
            <p className="text-white/25 text-[10px] text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Private room — visible only to you and {partnerName}
            </p>
          </div>
        </div>

        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
              onClick={() => setLightbox(null)}>
              <X className="w-5 h-5" />
            </button>
            {lightbox.media_type === "video" ? (
              <video
                src={lightbox.media_url}
                controls autoPlay
                className="max-w-full max-h-[85dvh] rounded-2xl"
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <img
                src={lightbox.media_url}
                alt={lightbox.caption ?? ""}
                className="max-w-full max-h-[85dvh] rounded-2xl object-contain"
                onClick={e => e.stopPropagation()}
              />
            )}
            {lightbox.caption && (
              <p className="absolute bottom-6 left-0 right-0 text-center text-white/70 text-sm px-6">{lightbox.caption}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
