import { motion, animate } from "framer-motion";
import { Heart, MapPin, Fingerprint, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
// Badge rendering is centralised in ProfileBadge — do not add badge logic here
import ProfileBadge from "@/components/ProfileBadge";
import ContactPreferenceBadge from "@/components/ContactPreferenceBadge";
import DistanceBadge from "@/components/DistanceBadge";
import SentGiftsDisplay from "@/components/gifts/SentGiftsDisplay";
import { isOnline } from "@/hooks/useOnlineStatus";
import { isMockCurrentlyOnline } from "@/utils/mockOnlineSchedule";
import SwipeStack from "@/components/SwipeStack";

interface TopCardProps {
  selectedProfile: any;
  isProfileRoute: boolean;
  topProfiles: any[];
  topCardX: any;
  profileImageIndex: number;
  profileImageDirection: 1 | -1;
  iLiked: any[];
  roseAvailable: boolean;
  user: any;
  t: any;
  isAnimatingTopCardRef: any;
  selectedList: any[];
  selectedProfileSection: "basic" | "lifestyle" | "interests" | "images" | null;
  setSelectedIndex: (fn: (i: number) => number) => void;
  setProfileImageIndex: (fn: (i: number) => number) => void;
  setProfileImageDirection: (v: 1 | -1) => void;
  handleLike: (p: any) => void;
  handleRose: (p: any) => void;
  handleLibraryCardDrag: (_: any, info: any) => void;
  advanceQueue: (id: string) => void;
  navigate: (path: string) => void;
  sessionStatsRef: any;
  setSessionTick: (fn: (v: number) => number) => void;
  persistSessionBehavior: () => void;
}


export default function TopCard(props: TopCardProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden min-h-0 bg-black/40 backdrop-blur-xl border-2 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-white/5 isolate" style={{ contain: "layout" }}>
      {props.selectedProfile ? (
        <motion.div
          key={`lib-${props.selectedProfile.id}`}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.9}
          onDragEnd={props.handleLibraryCardDrag}
          style={{ x: props.topCardX }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <img
            src={(() => {
              if (!props.isProfileRoute) return props.selectedProfile.image;
              const imgs = (
                (Array.isArray((props.selectedProfile as any).images) ? (props.selectedProfile as any).images : []) as string[]
              )
                .filter(Boolean)
                .slice(0, 5);
              const fallback = props.selectedProfile.avatar_url ? [props.selectedProfile.avatar_url] : [props.selectedProfile.image];
              const list = imgs.length > 0 ? imgs : fallback;
              const idx = ((props.profileImageIndex % list.length) + list.length) % list.length;
              return list[idx];
            })()}
            alt={props.selectedProfile.name}
            className="w-full h-full object-cover"
            style={{
              objectPosition: props.selectedProfile.main_image_pos || "50% 50%",
              transform: props.selectedProfile.main_image_zoom ? `scale(${props.selectedProfile.main_image_zoom / 100})` : undefined,
            }}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              const fallback = props.selectedProfile.avatar_url || "/placeholder.svg";
              if (img.src !== fallback) img.src = fallback;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

          {/* ── Single badge — locked: yellow, top-left only (ProfileBadge) ── */}
          <ProfileBadge profile={props.selectedProfile} t={props.t} isProfilePage={props.isProfileRoute} />
          
          {/* ── Distance badge — top-right, opens map ── */}
          <DistanceBadge 
            profile={props.selectedProfile} 
            onClick={() => {
              // Open distance map - you'll need to implement this logic
              console.log("Open distance map for:", props.selectedProfile);
            }}
          />

          {!props.isProfileRoute ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (props.isAnimatingTopCardRef.current || props.selectedList.length === 0) return;
                props.isAnimatingTopCardRef.current = true;
                animate(props.topCardX, 700, { duration: 0.22, ease: "easeOut" }).then(() => {
                  props.setSelectedIndex((i: number) => (i + 1) % props.selectedList.length);
                  props.topCardX.set(0);
                  props.isAnimatingTopCardRef.current = false;
                });
              }}
              aria-label="Next profile"
              className="absolute z-20 w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 hover:scale-110 transition-transform bottom-3 right-3 shadow-[0_0_12px_rgba(255,255,255,0.25)]"
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
              title="Next profile"
            >
              <Fingerprint className="w-7 h-7 text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
            </button>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const imgs = (
                    (Array.isArray((props.selectedProfile as any).images) ? (props.selectedProfile as any).images : []) as string[]
                  )
                    .filter(Boolean)
                    .slice(0, 5);
                  const fallback = props.selectedProfile.avatar_url ? [props.selectedProfile.avatar_url] : [props.selectedProfile.image];
                  const list = imgs.length > 0 ? imgs : fallback;
                  if (list.length <= 1) return;

                  props.setProfileImageIndex((v: number) => {
                    const last = list.length - 1;
                    if (props.profileImageDirection === 1) {
                      if (v >= last) {
                        props.setProfileImageDirection(-1);
                        return Math.max(0, last - 1);
                      }
                      return v + 1;
                    }

                    if (v <= 0) {
                      props.setProfileImageDirection(1);
                      return Math.min(last, 1);
                    }
                    return v - 1;
                  });
                }}
                aria-label={props.profileImageDirection === 1 ? "Next image" : "Previous image"}
                className="absolute z-20 w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 hover:scale-110 transition-transform bottom-3 right-3 shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                title={props.profileImageDirection === 1 ? "Next image" : "Previous image"}
              >
                {props.profileImageDirection === 1 ? (
                  <ChevronRight className="w-8 h-8 text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                ) : (
                  <ChevronLeft className="w-8 h-8 text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                )}
              </button>
            </>
          )}

          {/* Like button — pink heart circle, top-right */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.handleLike(props.selectedProfile);
            }}
            aria-label={`Like ${props.selectedProfile.name}`}
            className={`absolute z-20 w-10 h-10 rounded-full flex items-center justify-center active:scale-95 hover:scale-110 transition-all top-3 right-3 ${
              props.iLiked.some(p => p.id === props.selectedProfile.id)
                ? "bg-pink-500/40 border border-pink-400/60 shadow-[0_0_14px_rgba(180,80,150,0.5)]"
                : "gradient-love border-0 shadow-[0_0_14px_rgba(180,80,150,0.4)]"
            }`}
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
          >
            <Heart className="w-5 h-5 text-white" fill="white" />
          </button>

          {/* Name / location footer — always visible */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
              {/* No badge duplicate here — badge locked to top-left via ProfileBadge */}
              {props.selectedProfile.is_verified && (
                <BadgeCheck className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)] flex-shrink-0" />
              )}
              {props.selectedProfile.name}, {props.selectedProfile.age}
              {(props.selectedProfile.is_mock && (props.selectedProfile as any).mock_online_hours
                ? isMockCurrentlyOnline(props.selectedProfile.id, props.selectedProfile.country, (props.selectedProfile as any).mock_online_hours, (props.selectedProfile as any).mock_offline_days)
                : isOnline(props.selectedProfile.last_seen_at)) && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                </span>
              )}
            </h3>
            <p className="text-white/60 text-sm flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" /> {props.selectedProfile.city}, {props.selectedProfile.country}
            </p>
            <SentGiftsDisplay profileId={props.selectedProfile.id} />
            {props.selectedProfile.contact_preference && (
              <div className="mt-1.5">
                <ContactPreferenceBadge preference={props.selectedProfile.contact_preference} />
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <SwipeStack
          profiles={props.topProfiles}
          direction="up"
          roseAvailable={props.roseAvailable}
          onRose={props.handleRose}
          onLike={(p) => {
            props.handleLike(p);
            props.advanceQueue(p.id);
            if (props.user) props.navigate(`/profile/${p.id}`);
          }}
          onPass={(p) => {
            props.sessionStatsRef.current.passed += 1;
            props.setSessionTick((v: number) => v + 1);
            props.persistSessionBehavior();
            props.advanceQueue(p.id);
          }}
        />
      )}
    </div>
  );
}
