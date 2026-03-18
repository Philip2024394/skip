import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail, Heart, Shield, CreditCard, User, Map, Zap, MessageCircle, UserPlus, Gift, BadgeCheck, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLogo from "@/shared/components/AppLogo";

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
    color: "text-pink-400",
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
    color: "text-pink-400",
    items: [
      {
        q: "How do I get someone's WhatsApp number?",
        a: "When there's a mutual like (you both liked each other), tap the unlock button on their profile card in the Likes Library. A secure payment ($1.99, or $2.99 for profiles with badges) unlocks their WhatsApp number and opens a pre-filled message to break the ice.",
      },
      {
        q: "What is the $1.99 / $2.99 fee for?",
        a: "The unlock fee covers the WhatsApp connection for both profiles — you get their number and they get yours. It's $1.99 for standard profiles, or $2.99 for profiles that have badges (e.g. Free Tonight, Generous Lifestyle, Weekend Plans). One-time fee per connection, not a subscription.",
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
    color: "text-pink-400",
    items: [
      {
        q: "What does the Map page show?",
        a: "The Map shows real profiles near you with their approximate distance. You can zoom in and out, scroll to any area in the world, filter by 'Free Tonight' availability, and see your radius circle. Tap a profile avatar to select them and like or view their profile.",
      },
      {
        q: "Profiles Free Tonight",
        a: "The Free Tonight option shows that a profile is available to meet on short notice. It's designed for people who are open to spontaneous plans such as dinner, a drink, a walk, an event, or simply meeting someone new the same day.\n\nThis feature helps connect members who don't want to spend days chatting before meeting. Instead, it allows two people who are both available tonight to quickly arrange something simple and enjoyable.\n\nActivating Free Tonight does not create any obligation. It simply lets others know you are open to meeting if the right opportunity comes up. Always communicate clearly, meet in safe public places, and respect each other's comfort levels.",
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
    color: "text-pink-400",
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
    title: "Plus One",
    icon: <UserPlus className="w-4 h-4" />,
    color: "text-pink-400",
    items: [
      {
        q: "What is +1 Plus One?",
        a: "The Plus-One option is for profiles who enjoy being part of social occasions and good company but are not currently looking for a traditional date or a serious relationship.\n\nPeople who select this option prefer a more relaxed connection. They may be open to attending events, dinners, gatherings, or special occasions as a companion, without the expectation of constant communication or romantic commitment.\n\nIn many cases, Plus-One members may be shy about dating or new to the dating world. This feature allows them to connect with others in a comfortable, low-pressure way. Over time, these connections may naturally grow into friendship, closer companionship, or potentially a relationship if both people feel the same.\n\nBecause many Plus-One profiles may have limited dating experience, it's important to approach them with respect, patience, and emotional consideration.",
      },
    ],
  },
  {
    title: "Badges",
    icon: <Gift className="w-4 h-4" />,
    color: "text-pink-400",
    items: [
      {
        q: "What does the \"Generous Lifestyle\" badge mean?",
        a: "The Generous Lifestyle badge indicates that a member enjoys sharing experiences and may like treating their companion to things such as dinners, events, travel, or special outings.\n\nMembers who select this badge often appreciate traditional gestures of generosity and enjoy creating memorable moments when spending time with someone. It reflects a lifestyle preference where kindness, appreciation, and thoughtful experiences are part of the connection.\n\nThis badge does not imply any expectations or obligations between members. It simply helps people understand each other's lifestyle preferences and dating style. All interactions should remain respectful, genuine, and based on mutual interest.",
      },
      {
        q: "What does the \"Weekend Plans\" badge mean?",
        a: "The Weekend Plans badge shows that a member is usually available on weekends and may be open to meeting, socializing, or making plans during that time.\n\nMany people have busy weekday schedules, so this badge helps connect members who prefer to arrange activities such as dinners, events, outings, or casual meetups on Saturdays or Sundays.\n\nHaving this badge simply signals availability and interest in weekend social plans. All arrangements should be discussed and agreed upon between members.",
      },
      {
        q: "What does the \"Late Night Chat\" badge mean?",
        a: "The Late Night Chat badge indicates that a member is typically active later in the evening and enjoys conversations during nighttime hours.\n\nSome members prefer connecting when their day is finished and things are more relaxed. This badge helps others know that late evening chats, messages, or conversations may be the best time to connect with this person.\n\nIt does not create any expectation—only a signal of preferred communication times.",
      },
      {
        q: "What does the \"No Drama\" badge mean?",
        a: "The No Drama badge shows that a member prefers relaxed, positive, and respectful connections.\n\nPeople who select this badge usually value simple communication, honesty, and enjoyable interactions without unnecessary conflict or tension. They are generally looking for easygoing connections where both people feel comfortable and respected.\n\nThis badge helps signal a calm and friendly approach to meeting new people.",
      },
    ],
  },
  {
    title: "Verified Profiles",
    icon: <BadgeCheck className="w-4 h-4" />,
    color: "text-sky-400",
    items: [
      {
        q: "What is the Verified Badge (✅)?",
        a: "The Verified Badge is awarded by the 2DateMe team after reviewing a member's identity information. It signals to other members that this person's name and main profile photo have been confirmed as genuine — adding a layer of trust to the connection.",
      },
      {
        q: "How do I get verified?",
        a: "Verification is granted by our admin team. If you'd like to be considered, ensure your profile is complete and your photos are clear and accurate. Our team reviews profiles and may reach out, or you can contact us at support@2DateMe.com to request a review.",
      },
      {
        q: "What happens to my profile after I'm verified?",
        a: "Once verified, your registered name and main profile photo are confirmed and locked — they cannot be changed. This ensures the verified identity stays accurate for everyone who views your profile.\n\nYour additional photos and all other profile details (bio, interests, relationship goals, etc.) can still be updated freely at any time.",
      },
      {
        q: "Can I still change my photos after verification?",
        a: "Yes — you can add, remove, and update all photos except your main (verified) profile photo. Your main photo is locked as part of the verification to confirm your identity remains consistent.",
      },
      {
        q: "Does the Verified Badge mean someone has passed a background check?",
        a: "No. The Verified Badge confirms identity information only — it does not indicate a background check, criminal record review, or personal conduct assessment.\n\nFor members seeking deeper assurance before a serious commitment, our partner agency offers a confidential Personal Due Diligence service, covering criminal records, identity authenticity, and more. Learn more on the International Marriage Services page (visible on female profiles).",
      },
    ],
  },
  {
    title: "Partner Services",
    icon: <UserPlus className="w-4 h-4" />,
    color: "text-amber-400",
    items: [
      {
        q: "Does 2DateMe charge a fee or take commission from service providers?",
        a: "No. All services listed on 2DateMe — including international marriage facilitation, visa assistance, and background checks — are offered directly by independent, third-party service providers.\n\n2DateMe does not charge, earn, or receive any fee, commission, or referral payment from any service provider featured on the platform. Our role is solely to introduce members to reputable specialists; all agreements, payments, and arrangements are made directly between you and the service provider.",
      },
      {
        q: "Why am I given 5 WhatsApp contact options for a service provider?",
        a: "We provide up to 5 consultant contact numbers for each service category to ensure you can always reach someone. In any professional network, individual consultants may occasionally be unavailable, travelling, or temporarily unreachable.\n\nWe cannot guarantee that all 5 contacts will respond, however based on our experience with our listed partners, you can reasonably expect a reply from at least 2 or more. We recommend trying more than one contact if you do not hear back within 24 hours.",
      },
    ],
  },
  {
    title: "Besties & Mates",
    icon: <Users className="w-4 h-4" />,
    color: "text-pink-400",
    items: [
      {
        q: "What are Besties and Mates?",
        a: "Besties (for female members) and Mates (for male members) are your trusted friends on 2DateMe. You can add up to 10 people from the app as your Bestie or Mate — they appear as a circle with their unique ID code at the bottom of your profile so everyone can see your social circle.\n\nThis feature is mutual — the other person must accept your request before you are both connected as Besties.",
      },
      {
        q: "How do I send a Bestie or Mate request?",
        a: "Open any profile in the full-screen view and tap the 👯 button on the top-right of their photo. A request is sent immediately. The other person will see a pop-up notification when they are online asking them to accept or decline.",
      },
      {
        q: "What happens when my Bestie request is accepted?",
        a: "Once accepted:\n• You both appear in each other's Besties/Mates section at the bottom of your profiles.\n• You earn 1 free Super Like — automatically credited to your account.\n• Their unique 2D-XXXXX ID code is displayed on your profile, and yours on theirs.\n\nYou can earn up to 10 free Super Likes this way — one for each accepted Bestie or Mate (maximum 10 total).",
      },
      {
        q: "Why are Besties and Mates shown on my profile?",
        a: "Your Besties section lets other members see who you're socially connected with on the app. It adds a layer of authenticity and helps prevent situations where multiple friends are unknowingly pursuing the same person — your social circle is visible, creating a natural awareness and respect between friends.",
      },
      {
        q: "Can I remove a Bestie or Mate?",
        a: "Yes. Go to your profile settings and remove any Bestie or Mate from your list at any time. The connection is removed from both profiles immediately.",
      },
      {
        q: "Is there a maximum number of Besties I can add?",
        a: "Yes — the maximum is 10 Besties or Mates per account. This keeps the social circle meaningful and genuine rather than a large list of strangers. You earn 1 Super Like for each accepted Bestie, up to a maximum of 10 free Super Likes total.",
      },
    ],
  },
  {
    title: "Free Likes & Rewards",
    icon: <Star className="w-4 h-4" />,
    color: "text-yellow-400",
    items: [
      {
        q: "How can I earn free Super Likes?",
        a: "There are two ways to earn free Super Likes:\n\n1. Besties & Mates — Every time someone accepts your Bestie or Mate request, you earn 1 free Super Like. Add up to 10 Besties to earn up to 10 free Super Likes total.\n\n2. Invite a Friend — Share your unique invite link. Every time a friend signs up using your link and creates a profile, you both receive 5 free Likes as a welcome bonus.",
      },
      {
        q: "How do I invite a friend and get 5 free likes?",
        a: "Go to Dashboard → Power-ups → scroll to the 'Earn Free Rewards' section. Tap 'Copy Invite Link' to copy your personal invite link.\n\nShare it on WhatsApp, Instagram, or any messaging app. When your friend signs up using your link and completes their profile, you both automatically receive 5 free Likes — no payment required.",
      },
      {
        q: "What is the difference between a Like and a Super Like?",
        a: "A regular Like signals interest — the other person sees you in their Likes Library.\n\nA Super Like is more powerful — it places your profile at the very top of their Likes Library with a golden glow effect, so you stand out immediately. Super Likes show serious interest and get significantly more attention.",
      },
      {
        q: "Do free Likes and Super Likes expire?",
        a: "Free Likes and Super Likes earned through Bestie rewards or friend referrals do not expire. They stay in your account until you use them. Purchased packs also never expire.",
      },
      {
        q: "Can I earn rewards more than once from the same friend?",
        a: "No — the 5 free Likes reward is a one-time bonus per referred friend. Each person can only use one referral link when signing up. However you can invite as many friends as you like — there is no cap on the total referral bonus you can earn.",
      },
    ],
  },
  {
    title: "Safety & Privacy",
    icon: <Shield className="w-4 h-4" />,
    color: "text-pink-400",
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
    color: "text-pink-400",
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
          <p className="px-4 pb-4 text-white/55 text-sm leading-relaxed border-t border-white/8 pt-3 whitespace-pre-line">
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
    <div className="h-screen-safe bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/8 px-4 py-3 flex items-center gap-3" style={{ paddingTop: `max(0.75rem, env(safe-area-inset-top, 0px))` }}>
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors"
          aria-label="Go back"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <div className="flex items-center gap-2">
          <AppLogo className="w-7 h-7 object-contain" />
          <div>
            <h1 className="font-display font-bold text-base leading-none">Help & FAQ</h1>
            <p className="text-white/40 text-[10px] mt-0.5">2DateMe Support</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-4 py-6 max-w-lg mx-auto space-y-8" style={{ paddingBottom: `max(6rem, env(safe-area-inset-bottom, 0px))` }}>
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
    </div>
  );
};

export default FaqPage;
