import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Upload, Trash2, Image, Video, Users, Check, X,
  Crown, Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TeddyPinGate from "@/features/teddy/components/TeddyPinGate";

const FREE_PHOTOS = 5;
const FREE_VIDEOS = 3;
const MAX_FILE_MB = 50;

type VaultItem = {
  id: string;
  file_url: string;
  file_type: "photo" | "video";
  thumbnail_url: string | null;
  size_bytes: number;
  created_at: string;
};

type AccessRequest = {
  id: string;
  requester_id: string;
  status: "pending" | "approved" | "denied";
  created_at: string;
  requester?: { name: string; avatar_url: string | null; age: number };
};

type GrantedViewer = {
  viewer_id: string;
  viewer?: { name: string; avatar_url: string | null };
};

export default function TeddyRoomPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [pinHash, setPinHash] = useState<string | null | undefined>(undefined); // undefined = loading
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<"vault" | "requests" | "viewers">("vault");
  const [items, setItems] = useState<VaultItem[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [viewers, setViewers] = useState<GrantedViewer[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<VaultItem | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user session + profile
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/"); return; }
      setUserId(session.user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("teddy_pin_hash, is_vip")
        .eq("id", session.user.id)
        .single();
      if (error) {
        // Column might not exist yet — treat as first time
        setPinHash(null);
      } else {
        setPinHash((data as any).teddy_pin_hash ?? null);
        setHasSubscription(!!(data as any).is_vip);
      }
    });
  }, []);

  // Load vault + requests when unlocked
  useEffect(() => {
    if (!unlocked || !userId) return;
    loadVault();
    loadRequests();
    loadViewers();
  }, [unlocked, userId]);

  const loadVault = async () => {
    const { data } = await supabase
      .from("teddy_vault" as any)
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    setItems((data as unknown as VaultItem[]) ?? []);
  };

  const loadRequests = async () => {
    const { data } = await supabase
      .from("teddy_access_requests" as any)
      .select("*, requester:requester_id(name, avatar_url, age)")
      .eq("owner_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setRequests((data as unknown as AccessRequest[]) ?? []);
  };

  const loadViewers = async () => {
    const { data } = await supabase
      .from("teddy_access" as any)
      .select("viewer_id, viewer:viewer_id(name, avatar_url)")
      .eq("owner_id", userId);
    setViewers((data as unknown as GrantedViewer[]) ?? []);
  };

  const photos = items.filter(i => i.file_type === "photo");
  const videos = items.filter(i => i.file_type === "video");
  const photoLimit = hasSubscription ? Infinity : FREE_PHOTOS;
  const videoLimit = hasSubscription ? Infinity : FREE_VIDEOS;
  const canUploadPhoto = photos.length < photoLimit;
  const canUploadVideo = videos.length < videoLimit;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    e.target.value = "";

    const isVideo = file.type.startsWith("video/");
    const isPhoto = file.type.startsWith("image/");
    if (!isVideo && !isPhoto) { toast.error("Only photos and videos are supported."); return; }
    if (file.size > MAX_FILE_MB * 1024 * 1024) { toast.error(`File too large. Max ${MAX_FILE_MB}MB.`); return; }
    if (isPhoto && !canUploadPhoto) {
      toast.error(hasSubscription ? "Upload failed." : `Free limit: ${FREE_PHOTOS} photos. Subscribe for unlimited.`);
      return;
    }
    if (isVideo && !canUploadVideo) {
      toast.error(hasSubscription ? "Upload failed." : `Free limit: ${FREE_VIDEOS} videos. Subscribe for unlimited.`);
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg");
      const path = `teddy/${userId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("teddy-vault")
        .upload(path, file, { upsert: false });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("teddy-vault").getPublicUrl(path);

      await (supabase.from("teddy_vault" as any).insert as any)({
        owner_id: userId,
        file_url: publicUrl,
        file_type: isVideo ? "video" : "photo",
        size_bytes: file.size,
      });

      await loadVault();
      toast.success(isVideo ? "Video added to your Teddy Room 🎥" : "Photo added to your Teddy Room 📸");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: VaultItem) => {
    if (!userId) return;
    setDeleting(item.id);
    try {
      // Extract path from URL
      const url = new URL(item.file_url);
      const pathParts = url.pathname.split("/teddy-vault/");
      if (pathParts[1]) {
        await supabase.storage.from("teddy-vault").remove([pathParts[1]]);
      }
      await (supabase.from("teddy_vault" as any).delete as any)().eq("id", item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      toast.success("Removed from your Teddy Room");
    } catch {
      toast.error("Couldn't delete. Try again.");
    } finally {
      setDeleting(null);
    }
  };

  const handleApproveRequest = async (req: AccessRequest) => {
    if (!userId) return;
    try {
      // Update request status
      await (supabase.from("teddy_access_requests" as any).update as any)({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", req.id);
      // Grant access
      await (supabase.from("teddy_access" as any).insert as any)({
        owner_id: userId,
        viewer_id: req.requester_id,
      });
      setRequests(prev => prev.filter(r => r.id !== req.id));
      loadViewers();
      toast.success(`Access granted to ${req.requester?.name ?? "them"} 🧸`);
    } catch {
      toast.error("Couldn't approve. Try again.");
    }
  };

  const handleDenyRequest = async (req: AccessRequest) => {
    try {
      await (supabase.from("teddy_access_requests" as any).update as any)({ status: "denied", updated_at: new Date().toISOString() })
        .eq("id", req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch {
      toast.error("Couldn't deny. Try again.");
    }
  };

  const handleRevokeAccess = async (viewerId: string) => {
    if (!userId) return;
    try {
      await (supabase.from("teddy_access" as any).delete as any)()
        .eq("owner_id", userId)
        .eq("viewer_id", viewerId);
      setViewers(prev => prev.filter(v => v.viewer_id !== viewerId));
      toast.success("Access revoked");
    } catch {
      toast.error("Couldn't revoke. Try again.");
    }
  };

  // Loading state
  if (pinHash === undefined || !userId) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          className="text-6xl select-none"
        >
          🧸
        </motion.div>
        <p className="text-white/30 text-sm">Loading your Teddy Room…</p>
      </div>
    );
  }

  // PIN gate
  if (!unlocked) {
    return (
      <TeddyPinGate
        userId={userId}
        storedHash={pinHash}
        onUnlocked={() => setUnlocked(true)}
      />
    );
  }

  return (
    <div className="h-screen-safe bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/8"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))", background: "rgba(10,10,10,0.95)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => navigate("/dashboard")}
          className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg select-none">🧸</span>
          <span className="font-display font-bold text-white text-sm">My Teddy Room</span>
        </div>
        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
        >
          {uploading
            ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Upload className="w-3.5 h-3.5 text-white" />
          }
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleUpload}
        />
      </header>

      {/* Quota bar (free users) */}
      {!hasSubscription && (
        <div className="px-4 py-2 flex items-center gap-3 border-b border-white/5 text-[11px]">
          <div className="flex items-center gap-1.5 text-white/40">
            <Image className="w-3 h-3" />
            <span className={photos.length >= FREE_PHOTOS ? "text-red-400" : "text-white/60"}>
              {photos.length}/{FREE_PHOTOS} photos
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40">
            <Video className="w-3 h-3" />
            <span className={videos.length >= FREE_VIDEOS ? "text-red-400" : "text-white/60"}>
              {videos.length}/{FREE_VIDEOS} videos
            </span>
          </div>
          <button
            onClick={() => navigate("/dashboard?purchase=teddy")}
            className="ml-auto flex items-center gap-1 text-amber-400 font-bold"
          >
            <Crown className="w-3 h-3" /> Unlimited
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/8">
        {(["vault", "requests", "viewers"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[11px] font-bold transition-colors relative ${tab === t ? "text-white" : "text-white/30"}`}
          >
            {t === "vault" ? "My Vault" : t === "requests" ? `Requests${requests.length > 0 ? ` (${requests.length})` : ""}` : "Viewers"}
            {tab === t && (
              <motion.div layoutId="teddy-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 gradient-love" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}>

        {/* ── VAULT TAB ── */}
        {tab === "vault" && (
          <>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 gap-4">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                >
                  <span className="text-6xl select-none opacity-40">🧸</span>
                </motion.div>
                <p className="text-white/30 text-sm text-center">Your Teddy Room is empty.<br />Tap the upload button to add photos or videos.</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-2xl text-white text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
                >
                  Upload your first file
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                <AnimatePresence>
                  {items.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className="relative aspect-square rounded-xl overflow-hidden bg-white/5 cursor-pointer group"
                      onClick={() => setPreviewItem(item)}
                    >
                      {item.file_type === "video" ? (
                        <>
                          <video
                            src={item.file_url}
                            className="w-full h-full object-cover"
                            muted playsInline preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Video className="w-6 h-6 text-white drop-shadow" />
                          </div>
                        </>
                      ) : (
                        <img src={item.file_url} alt="" className="w-full h-full object-cover" />
                      )}
                      {/* Delete button — appears on hover */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                        disabled={deleting === item.id}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {deleting === item.id
                          ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                          : <Trash2 className="w-3 h-3 text-white" />
                        }
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* ── REQUESTS TAB ── */}
        {tab === "requests" && (
          <>
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3">
                <Users className="w-10 h-10 text-white/15" />
                <p className="text-white/30 text-sm text-center">No pending access requests.<br />When someone wants to see your Teddy Room, they'll appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => (
                  <div key={req.id}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-white/8"
                    style={{ background: "rgba(255,255,255,0.03)" }}>
                    <img
                      src={req.requester?.avatar_url ?? "/placeholder.svg"}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {req.requester?.name ?? "Someone"}{req.requester?.age ? `, ${req.requester.age}` : ""}
                      </p>
                      <p className="text-white/30 text-[11px]">wants to enter your Teddy Room</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDenyRequest(req)}
                        className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                      >
                        <X className="w-4 h-4 text-white/50" />
                      </button>
                      <button
                        onClick={() => handleApproveRequest(req)}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── VIEWERS TAB ── */}
        {tab === "viewers" && (
          <>
            {viewers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3">
                <Eye className="w-10 h-10 text-white/15" />
                <p className="text-white/30 text-sm text-center">No one has access yet.<br />Approve requests to let matches view your Teddy Room.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {viewers.map(v => (
                  <div key={v.viewer_id}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-white/8"
                    style={{ background: "rgba(255,255,255,0.03)" }}>
                    <img
                      src={(v.viewer as any)?.avatar_url ?? "/placeholder.svg"}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{(v.viewer as any)?.name ?? "Viewer"}</p>
                      <p className="text-white/30 text-[11px]">has access to your Teddy Room</p>
                    </div>
                    <button
                      onClick={() => handleRevokeAccess(v.viewer_id)}
                      className="text-[11px] font-semibold text-red-400/70 hover:text-red-400 transition-colors px-3 py-1.5 rounded-xl border border-red-400/20 hover:border-red-400/40"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Media preview overlay */}
      <AnimatePresence>
        {previewItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
              onClick={() => setPreviewItem(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 z-50 flex items-center justify-center"
            >
              <button
                onClick={() => setPreviewItem(null)}
                className="absolute top-0 right-0 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center z-10"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              {previewItem.file_type === "video" ? (
                <video
                  src={previewItem.file_url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded-2xl"
                  style={{ maxHeight: "calc(100vh - 2rem)" }}
                />
              ) : (
                <img
                  src={previewItem.file_url}
                  alt=""
                  className="max-w-full max-h-full rounded-2xl object-contain"
                  style={{ maxHeight: "calc(100vh - 2rem)" }}
                />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
