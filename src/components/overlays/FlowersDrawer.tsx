import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Gift, MessageCircle, Shield, MapPin, Clock, Lock, Crown, Truck } from "lucide-react";

interface FlowersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked?: boolean;
  onUnlock?: () => void;
}

// Mock florist data for Yogyakarta
const florists = [
  {
    id: 1,
    name: "Bunga Indah Florist",
    image: "https://ik.imagekit.io/7grri5v7d/indo-girl-6-Bjf7eJJb.png",
    specialty: "Traditional Indonesian Bouquets",
    experience: 12,
    hasDelivery: true,
    description: "Premium florist specializing in traditional Indonesian flower arrangements and modern bouquets. Expert in creating stunning hand-tied bouquets using fresh local flowers like jasmine, orchids, and frangipani. Same-day delivery service across Yogyakarta with elegant packaging and personalized messages. Perfect for romantic gestures and special occasions.",
    whatsapp: "+628987654321"
  },
  {
    id: 2,
    name: "Yogya Bloom Studio",
    image: "https://ik.imagekit.io/7grri5v7d/indo-girl-7-DMNdWEOA.png",
    specialty: "Roses & Romantic Arrangements",
    experience: 8,
    hasDelivery: true,
    description: "Romantic flower specialist with expertise in premium rose arrangements and romantic bouquets. Sourced from the best flower farms with guaranteed freshness. Custom arrangements for anniversaries, proposals, and special moments. Luxury packaging with fragrance enhancement and personalized cards.",
    whatsapp: "+628876543210"
  },
  {
    id: 3,
    name: "Kampung Flower",
    image: "https://ik.imagekit.io/7grri5v7d/indo-girl-8-BIX_7qAq.png",
    specialty: "Exotic & Tropical Flowers",
    experience: 10,
    hasDelivery: true,
    description: "Specialist in exotic tropical flowers and unique Indonesian blooms. Rare flower varieties including bird of paradise, heliconia, and tropical orchids. Artistic arrangements that showcase the beauty of Indonesia's diverse flora. Eco-friendly packaging and sustainable sourcing practices.",
    whatsapp: "+628765432109"
  },
  {
    id: 4,
    name: "Sakura Florist Yogyakarta",
    image: "https://ik.imagekit.io/7grri5v7d/indo-girl-9-CTfu5-xR.png",
    specialty: "Wedding & Event Flowers",
    experience: 15,
    hasDelivery: true,
    description: "Wedding and event flower specialist with extensive experience in large-scale floral arrangements. Complete event decoration services including venue styling, bridal bouquets, boutonnieres, and table centerpieces. Premium imported flowers and custom design consultations available.",
    whatsapp: "+628654321098"
  },
  {
    id: 5,
    name: "Taman Bunga Cantik",
    image: "https://ik.imagekit.io/7grri5v7d/indo-girl-10-D5cLXRcE.png",
    specialty: "Preserved & Eternal Flowers",
    experience: 6,
    hasDelivery: true,
    description: "Innovative florist specializing in preserved flowers that last for years. Eternal rose arrangements and preserved flower bouquets that maintain beauty without maintenance. Perfect keepsakes for special memories and long-lasting romantic gestures. Premium gift boxes with elegant presentation.",
    whatsapp: "+628543210987"
  }
];

export default function FlowersDrawer({ isOpen, onClose, isUnlocked = false, onUnlock }: FlowersDrawerProps) {
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
            className="fixed top-0 right-0 h-full w-[60%] z-50 shadow-2xl overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #CA6EAF 0%, #D88FC0 33%, #DA90C1 60%, #CD83B8 100%)"
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Yogyakarta City</h2>
                  <p className="text-white/70 text-sm">Premium Flower Delivery</p>
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
              {!isUnlocked ? (
                /* Premium Unlock Section */
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-pink-400/20 to-rose-400/20 rounded-2xl p-6 backdrop-blur-sm border border-pink-300/30"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-pink-400/30 rounded-full flex items-center justify-center">
                        <Crown className="w-6 h-6 text-pink-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Unlock 5 Florists</h3>
                        <p className="text-white/70 text-sm">Get direct WhatsApp access</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
                        <p className="text-white/80 text-sm">Send flowers to loved ones</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
                        <p className="text-white/80 text-sm">Same-day delivery service</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
                        <p className="text-white/80 text-sm">Premium fresh flowers</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
                        <p className="text-white/80 text-sm">Direct WhatsApp ordering</p>
                      </div>
                    </div>

                    <button
                      onClick={onUnlock}
                      className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-gray-900 font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Lock className="w-5 h-5" />
                        <span className="text-lg">Unlock for $1.99</span>
                      </div>
                      <p className="text-xs mt-1 opacity-80">One-time payment • 5 florist numbers</p>
                    </button>
                  </motion.div>

                  {/* Preview Cards (Locked) */}
                  <div className="space-y-4">
                    {florists.slice(0, 2).map((florist) => (
                      <div key={florist.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 opacity-60">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white/30 relative">
                              <img
                                src={florist.image}
                                alt={florist.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Lock className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white mb-1">{florist.name}</h3>
                            <p className="text-white/80 text-sm font-medium mb-2">{florist.specialty}</p>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-yellow-300" />
                                <span className="text-white/70 text-xs">{florist.experience} years exp</span>
                              </div>
                              {florist.hasDelivery && (
                                <div className="flex items-center gap-1">
                                  <Truck className="w-4 h-4 text-green-300" />
                                  <span className="text-green-300 text-xs">Delivery</span>
                                </div>
                              )}
                            </div>
                            <p className="text-white/60 text-xs leading-relaxed line-clamp-2">
                              {florist.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center">
                    <p className="text-white/60 text-sm">+3 more florists available after unlock</p>
                  </div>
                </div>
              ) : (
                /* Unlocked Florist Cards */
                <div className="space-y-4">
                  {florists.map((florist) => (
                    <motion.div
                      key={florist.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: florist.id * 0.1 }}
                      className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
                    >
                      {/* Landscape Card Layout */}
                      <div className="flex gap-4">
                        {/* Profile Image */}
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white/30">
                            <img
                              src={florist.image}
                              alt={florist.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-white mb-1">{florist.name}</h3>
                              <p className="text-white/80 text-sm font-medium mb-2">{florist.specialty}</p>
                              
                              {/* Experience and Delivery */}
                              <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-yellow-300" />
                                  <span className="text-white/70 text-xs">{florist.experience} years exp</span>
                                </div>
                                {florist.hasDelivery && (
                                  <div className="flex items-center gap-1">
                                    <Truck className="w-4 h-4 text-green-300" />
                                    <span className="text-green-300 text-xs">Delivery</span>
                                  </div>
                                )}
                              </div>

                              {/* Description */}
                              <p className="text-white/60 text-xs leading-relaxed mb-3 line-clamp-3">
                                {florist.description}
                              </p>
                            </div>
                          </div>

                          {/* WhatsApp Button */}
                          <button
                            onClick={() => {
                              window.open(`https://wa.me/${florist.whatsapp.replace('+', '')}`, '_blank');
                            }}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Contact Me
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Info Section */}
              <div className="mt-6 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-pink-300 mt-0.5" />
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">
                      {isUnlocked ? "Premium Unlocked" : "Verified Florists"}
                    </p>
                    <p className="text-white/60 text-xs">
                      {isUnlocked 
                        ? "You now have direct access to order beautiful flowers for yourself or loved ones"
                        : "All florists are professional flower designers with verified experience in Yogyakarta's premium flower shops"
                      }
                    </p>
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
