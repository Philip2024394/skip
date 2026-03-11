import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Gift } from "lucide-react";

interface MassageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MassageDrawer({ isOpen, onClose }: MassageDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Side Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[60%] z-50 gradient-bg shadow-2xl"
            style={{
              background: "linear-gradient(180deg, #CA6EAF 0%, #D88FC0 33%, #DA90C1 60%, #CD83B8 100%)"
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Massage Services</h2>
                  <p className="text-white/70 text-sm">Relaxation & wellness treatments</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Massage Options */}
                <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Available Treatments
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🕯️</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">Swedish Massage</h4>
                          <p className="text-white/70 text-sm mt-1">Gentle relaxation for body & mind</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🪨</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">Hot Stone Therapy</h4>
                          <p className="text-white/70 text-sm mt-1">Deep heat therapy for muscle tension</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💪</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">Deep Tissue Massage</h4>
                          <p className="text-white/70 text-sm mt-1">Targets deep muscle knots</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🌿</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">Aromatherapy</h4>
                          <p className="text-white/70 text-sm mt-1">Essential oils for total calm</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gift Section */}
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">🎁 Gift a Massage</h3>
                  <p className="text-white/70 text-sm mb-4">
                    Surprise someone special with a relaxing massage experience
                  </p>
                  <button className="w-full bg-white text-purple-600 font-semibold py-3 px-6 rounded-xl hover:bg-white/90 transition-colors">
                    Send as Gift
                  </button>
                </div>

                {/* Info Section */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-300 mt-0.5" />
                    <div>
                      <p className="text-white/80 text-sm">
                        All massages are performed by certified professionals in a relaxing spa environment
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
