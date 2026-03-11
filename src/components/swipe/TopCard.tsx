import { motion, animate } from "framer-motion";
import { Heart, MapPin, Fingerprint, ChevronLeft, ChevronRight } from "lucide-react";
import { getPrimaryBadgeKey } from "@/utils/profileBadges";
import { isOnline } from "@/hooks/useOnlineStatus";
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
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

          {/* ── Single badge display ─────────────────────────── */}
          {(() => {
            const key = getPrimaryBadgeKey(props.selectedProfile as any);
            if (!key) return null;

            if (key === "available_tonight") {
              return (
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-yellow-400/70 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.45)]">
                  <span className="text-yellow-400">🌙</span>
                  {props.t("popup.freeTonight")}
                </div>
              );
            }

            if (key === "is_plusone") {
              return (
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-yellow-400/70 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.45)]">
                  <span className="text-yellow-300 font-black">+1</span>
                  Plus One
                </div>
              );
            }

            if (key === "generous_lifestyle") {
              return (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-amber-400/70 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.45)]">
                  <span className="text-amber-400">🎁</span> Generous
                </div>
              );
            }

            if (key === "weekend_plans") {
              return (
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-primary/60 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  <span className="text-primary">📅</span> Weekend
                </div>
              );
            }

            if (key === "late_night_chat") {
              return (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-indigo-400/60 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  <span className="text-indigo-400">🌙</span> Late Night
                </div>
              );
            }

            if (key === "no_drama") {
              return (
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-teal-400/60 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  <span className="text-teal-400">✨</span> No Drama
                </div>
              );
            }

            return null;
          })()}

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

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
              {(props.selectedProfile as any).is_plusone && (
                <span className="flex items-center gap-0.5 bg-black/60 backdrop-blur-sm border border-yellow-400/50 rounded-md px-1.5 py-0.5 text-yellow-300 font-black text-[10px] leading-none">+1</span>
              )}
              {props.selectedProfile.name}, {props.selectedProfile.age}
              {isOnline(props.selectedProfile.last_seen_at) && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                </span>
              )}
            </h3>
            <p className="text-white/60 text-sm flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" /> {props.selectedProfile.city}, {props.selectedProfile.country}
            </p>
          </div>
        </motion.div>
      ) : props.topProfiles.length > 0 ? (
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
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-white/50 text-sm">{props.t("swipe.noMore")}</p>
        </div>
      )}
    </div>
  );
}
