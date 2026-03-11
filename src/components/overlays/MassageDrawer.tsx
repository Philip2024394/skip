import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Gift, MessageCircle, Shield, MapPin, Clock } from "lucide-react";

interface MassageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock therapist data for Yogyakarta
const massageTherapists = [
  {
    id: 1,
    name: "Dewi Lestari",
    image: "https://ik.imagekit.io/7grri5v7d/indo-girl-1-D8oP4zi2.png",
    massageType: "Traditional Javanese Massage",
    experience: 8,
    hasSafePass: true,
    description: "Professional massage therapist specializing in traditional Javanese healing techniques. Expert in deep tissue massage, aromatherapy, and reflexology. Certified in spa therapy with extensive experience in luxury hotels and villas throughout Yogyakarta. Passionate about providing authentic Indonesian wellness experiences with modern therapeutic techniques.",
    whatsapp: "+628123456789"
  },
  {
    id: 2,
    name: "Siti Nurhaliza",
    image: "https://ik.imagekit.io/7grri5v7d/indo-girl-2-DCkzfPZR.png",
    massageType: "Swedish & Hot Stone Therapy",
    experience: 6,
    hasSafePass: true,
    description: "Certified massage therapist with expertise in Swedish massage and hot stone therapy. Trained in international spa standards with focus on relaxation and stress relief. Experience working with premium resorts and private villas in Yogyakarta area. Specialized in prenatal massage and therapeutic treatments for muscle recovery.",
    whatsapp: "+628234567890"
  },
  {
    id: 3,
    name: "Ratna Sari",
    image: "https://ik.imagekit.io/7grri5v7d/indo-girl-3-XzPDioa8.png",
    massageType: "Balinese Massage & Reflexology",
    experience: 10,
    hasSafePass: false,
    description: "Senior massage therapist with decade of experience in Balinese massage techniques. Master of reflexology and energy healing. Worked with prestigious spa centers and wellness retreats across Yogyakarta. Known for intuitive touch and personalized treatment approaches combining traditional wisdom with contemporary wellness practices.",
    whatsapp: "+628345678901"
  }
];

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
                  <p className="text-white/70 text-sm">Professional Massage Services</p>
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
              <div className="space-y-4">
                {massageTherapists.map((therapist) => (
                  <motion.div
                    key={therapist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: therapist.id * 0.1 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
                  >
                    {/* Landscape Card Layout */}
                    <div className="flex gap-4">
                      {/* Profile Image */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white/30">
                          <img
                            src={therapist.image}
                            alt={therapist.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white mb-1">{therapist.name}</h3>
                            <p className="text-white/80 text-sm font-medium mb-2">{therapist.massageType}</p>
                            
                            {/* Experience and Safe Pass */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-yellow-300" />
                                <span className="text-white/70 text-xs">{therapist.experience} years exp</span>
                              </div>
                              {therapist.hasSafePass && (
                                <div className="flex items-center gap-1">
                                  <Shield className="w-4 h-4 text-green-300" />
                                  <span className="text-green-300 text-xs">Safe Pass</span>
                                </div>
                              )}
                            </div>

                            {/* Description */}
                            <p className="text-white/60 text-xs leading-relaxed mb-3 line-clamp-3">
                              {therapist.description}
                            </p>
                          </div>
                        </div>

                        {/* WhatsApp Button */}
                        <button
                          onClick={() => {
                            window.open(`https://wa.me/${therapist.whatsapp.replace('+', '')}`, '_blank');
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

              {/* Info Section */}
              <div className="mt-6 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-300 mt-0.5" />
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">Verified Professionals</p>
                    <p className="text-white/60 text-xs">
                      All therapists are certified professionals with verified experience in Yogyakarta's premium wellness centers
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
