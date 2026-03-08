import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail, Heart, Shield, CreditCard, User, Map, Zap, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoHeart from "@/assets/logo-heart.png";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "Getting Started",
    icon: <User className="w-4 h-4" />,
    color: "text-pink-400",
    items: [
      {
        q: "What is 2DateMe?",
        a: "2DateMe is a dating app that cuts straight to the point — instead of endless in-app chatting, we connect you directly via WhatsApp so real conversations can happen. No gimmicks, just genuine connections.",
      },
      {
        q: "Is it free to join?",
        a: "Yes! Creating an account and browsing profiles is completely free. A small one-time fee of $1.99 applies when you want to unlock a person's WhatsApp number so you can connect directly off the platform.",
      },
      {
        q: "How do I create my profile?",
        a: "Sign up with your email, then head to the Dashboard → My Profile tab. Add at least 2 photos, fill in your details, and hit Save. The more you add — voice intro, first date suggestions, bio — the more your profile stands out.",
      },
      {
        q: "Can I browse profiles without an account?",
        a: "Yes! You can browse and explore the app as a guest. You'll need to create a free account when you want to like, super like, or unlock a WhatsApp connection.",
      },
    ],
  },
  {
    title: "Swiping & Liking",
    icon: <Heart className="w-4 h-4" />,
    color: "text-rose-400",
    items: [
      {
        q: "How does swiping work?",
        a: "Swipe RIGHT (or tap the heart button) to Like someone. Swipe LEFT (or tap the fingerprint button) to pass. You can also swipe UP to Super Like, which places you at the top of their likes library with a glowing effect.",
      },
      {
        q: "What is a Super Like?",
        a: "A Super Like signals serious interest. It puts your profile at the top of the other person's Likes Library with a golden glow, making you impossible to miss. Super Likes are included in the VIP package or available as individual add-ons.",
      },
      {
        q: "What happens when someone likes me back?",
        a: "It's a match! Their profile will appear in your Likes Library under the 'Likes Me' tab. From there you can unlock their WhatsApp number for $1.99 and start chatting directly.",
      },
      {
        q: "Can I see who liked me?",
        a: "Yes — go to the Home tab and scroll to the Likes Library section. The 'Likes Me' tab shows everyone who has liked your profile.",
      },
    ],
  },
  {
    title: "WhatsApp Connection",
    icon: <MessageCircle className="w-4 h-4" />,
    color: "text-green-400",
    items: [
      {
        q: "How do I get someone's WhatsApp number?",
        a: "When there's a mutual like (you both liked each other), tap the unlock button on their profile card in the Likes Library. A secure $1.99 payment unlocks their WhatsApp number and opens a pre-filled message to break the ice.",
      },
      {
        q: "What is the $1.99 fee for?",
        a: "The $1.99 covers the WhatsApp unlock for both profiles — you get their number and they get yours. It's a one-time fee per connection, not a subscription.",
      },
      {
        q: "What does the pre-filled message say?",
        a: "We send a warm, friendly intro: \"Hi [Name]! 👋 I just unlocked your contact on 2DateMe — the dating app where real connections start with a real conversation. I'd love to get to know you! 😊\" You can of course edit it before sending.",
      },
      {
        q: "Is my WhatsApp number safe?",
        a: "Your number is never shown publicly on your profile. It is only revealed to users who have mutually liked you AND completed the unlock payment. You stay in full control.",
      },
    ],
  },
  {
    title: "The Map",
    icon: <Map className="w-4 h-4" />,
    color: "text-blue-400",
    items: [
      {
        q: "What does the Map page show?",
        a: "The Map shows real profiles near you with their approximate distance. You can zoom in and out, scroll to any area in the world, filter by 'Free Tonight' availability, and see your radius circle. Tap a profile avatar to select them and like or view their profile.",
      },
      {
        q: "Does the map show my exact location?",
        a: "No — profile locations are approximate, not pin-point accurate. This protects everyone's privacy while still showing who is nearby.",
      },
      {
        q: "What does the heart icon on map avatars mean?",
        a: "A pink heart overlay on a map avatar means you've already liked that person. If they haven't liked you back yet, tapping them shows a tip about Super Liking to get their attention.",
      },
    ],
  },
  {
    title: "VIP & Premium Features",
    icon: <Zap className="w-4 h-4" />,
    color: "text-amber-400",
    items: [
      {
        q: "What is the VIP membership?",
        a: "VIP is $10.99/month and includes 7 WhatsApp unlocks + 5 Super Likes every month, priority placement in search results, a verified VIP badge, and early access to new features. Great value if you're actively dating.",
      },
      {
        q: "What other premium features are available?",
        a: "Beyond VIP you can purchase individual add-ons: Boost (more visibility for 30 min), Super Like packs, Verified badge, Incognito mode (browse without being seen), and Spotlight (glow effect that puts you first in everyone's feed).",
      },
      {
        q: "Can I cancel VIP anytime?",
        a: "Yes. VIP is a monthly subscription and you can cancel at any time. Your benefits continue until the end of the billing period.",
      },
    ],
  },
  {
    title: "Safety & Privacy",
    icon: <Shield className="w-4 h-4" />,
    color: "text-teal-400",
    items: [
      {
        q: "How do I stay safe when connecting on WhatsApp?",
        a: "Take your time — don't rush to share personal information. For the first few conversations, keep details like your home address and workplace private. Always meet for the first time in busy, well-established public places. WhatsApp has advanced blocking tools — use them any time you feel uncomfortable.",
      },
      {
        q: "What if I encounter a fake or inappropriate profile?",
        a: "Use the Report button on any profile (flag icon in the profile detail view). Our team reviews all reports promptly. Repeat offenders are permanently banned.",
      },
      {
        q: "How do I block someone?",
        a: "On WhatsApp, open the chat → tap the three-dot menu → Block. You can also report the profile to us directly from within the app. On 2DateMe, a blocked profile will no longer appear in your browsing.",
      },
      {
        q: "Can I deactivate my account temporarily?",
        a: "Yes! Go to Dashboard → My Profile → scroll to the bottom → tap 'Deactivate my account'. Your profile is hidden from everyone instantly. Simply log back in whenever you're ready and everything is restored automatically.",
      },
    ],
  },
  {
    title: "Payments & Billing",
    icon: <CreditCard className="w-4 h-4" />,
    color: "text-purple-400",
    items: [
      {
        q: "What payment methods are accepted?",
        a: "All major credit and debit cards are accepted through our secure Stripe payment gateway. Apple Pay and Google Pay are also supported where available.",
      },
      {
        q: "Is my payment information stored on 2DateMe?",
        a: "No. All payment processing is handled by Stripe, a certified PCI-compliant payment provider. 2DateMe never stores your card details.",
      },
      {
        q: "What is the refund policy?",
        a: "WhatsApp unlocks are non-refundable once the number has been revealed. VIP subscriptions can be cancelled before the next billing cycle for a prorated refund. Please contact us at support@2DateMe.com for any billing issues.",
      },
    ],
  },
];

const FaqAccordion = ({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) => (
  <div className="border border-white/8 rounded-xl overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-white/5 transition-colors"
    >
      <span className="text-white/90 text-sm font-medium leading-snug">{item.q}</span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex-shrink-0 mt-0.5"
      >
        <ChevronDown className="w-4 h-4 text-white/40" />
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <p className="px-4 pb-4 text-white/55 text-sm leading-relaxed border-t border-white/8 pt-3">
            {item.a}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const FaqPage = () => {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId(prev => prev === id ? null : id);

  return (
    <div className="min-h-screen-safe bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/8 px-4 py-3 flex items-center gap-3" style={{ paddingTop: `max(0.75rem, env(safe-area-inset-top, 0px))` }}>
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors"
          aria-label="Go back"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <div className="flex items-center gap-2">
          <img src={logoHeart} alt="2DateMe" className="w-7 h-7" />
          <div>
            <h1 className="font-display font-bold text-base leading-none">Help & FAQ</h1>
            <p className="text-white/40 text-[10px] mt-0.5">2DateMe Support</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-8 scroll-touch" style={{ paddingBottom: `max(6rem, env(safe-area-inset-bottom, 0px))` }}>
        {/* Hero */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl gradient-love flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(180,80,150,0.35)]">
            <Heart className="w-7 h-7 text-white" fill="white" />
          </div>
          <h2 className="font-display font-bold text-xl text-white">How can we help?</h2>
          <p className="text-white/50 text-sm">Everything you need to know about 2DateMe.</p>
        </div>

        {/* Sections */}
        {FAQ_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-2">
            <div className={`flex items-center gap-2 mb-3 ${section.color}`}>
              {section.icon}
              <h3 className="font-semibold text-sm uppercase tracking-wider">{section.title}</h3>
            </div>
            <div className="space-y-2">
              {section.items.map((item, i) => {
                const id = `${section.title}-${i}`;
                return (
                  <FaqAccordion
                    key={id}
                    item={item}
                    isOpen={openId === id}
                    onToggle={() => toggle(id)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Contact card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-white">Still need help?</h3>
          </div>
          <p className="text-white/55 text-sm leading-relaxed">
            Our support team is here for you. Drop us an email and we'll get back to you within 24 hours.
          </p>
          <a
            href="mailto:support@2DateMe.com"
            className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 text-primary font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-primary/30 transition-colors"
          >
            <Mail className="w-4 h-4" />
            support@2DateMe.com
          </a>
          <p className="text-white/30 text-[11px]">
            For urgent safety concerns please include "URGENT" in the subject line.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center space-y-1 pt-2">
          <p className="text-white/25 text-[11px]">© 2025 2DateMe.com · All rights reserved</p>
          <div className="flex items-center justify-center gap-3 text-[11px]">
            <button onClick={() => navigate("/terms")} className="text-white/30 hover:text-white/60 transition-colors">Terms</button>
            <span className="text-white/20">·</span>
            <button onClick={() => navigate("/privacy")} className="text-white/30 hover:text-white/60 transition-colors">Privacy</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
