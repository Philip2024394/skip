// [01] Auth - components/LegalModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Shield, FileText, Lock } from 'lucide-react';
import { Button } from '@/shared/components/button';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTermsAgreed: (agreed: boolean) => void;
  onPrivacyAgreed: (agreed: boolean) => void;
  onLegalVerified: (verified: boolean) => void;
  initialTermsAgreed: boolean;
  initialPrivacyAgreed: boolean;
}

const LegalModal = ({ 
  isOpen, 
  onClose, 
  onTermsAgreed, 
  onPrivacyAgreed, 
  onLegalVerified,
  initialTermsAgreed,
  initialPrivacyAgreed 
}: LegalModalProps) => {
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [privacyScrolled, setPrivacyScrolled] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(initialTermsAgreed);
  const [privacyAgreed, setPrivacyAgreed] = useState(initialPrivacyAgreed);
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
  const termsRef = useRef<HTMLDivElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);

  // Check if user has scrolled to bottom of terms
  useEffect(() => {
    const checkScroll = (ref: React.RefObject<HTMLDivElement>, setter: (scrolled: boolean) => void) => {
      if (ref.current) {
        const element = ref.current;
        const isScrolledToBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 10;
        setter(isScrolledToBottom);
      }
    };

    const handleTermsScroll = () => checkScroll(termsRef, setTermsScrolled);
    const handlePrivacyScroll = () => checkScroll(privacyRef, setPrivacyScrolled);

    const termsElement = termsRef.current;
    const privacyElement = privacyRef.current;

    if (termsElement) termsElement.addEventListener('scroll', handleTermsScroll);
    if (privacyElement) privacyElement.addEventListener('scroll', handlePrivacyScroll);

    return () => {
      if (termsElement) termsElement.removeEventListener('scroll', handleTermsScroll);
      if (privacyElement) privacyElement.removeEventListener('scroll', handlePrivacyScroll);
    };
  }, []);

  useEffect(() => {
    const isVerified = termsAgreed && privacyAgreed && termsScrolled && privacyScrolled;
    onLegalVerified(isVerified);
  }, [termsAgreed, privacyAgreed, termsScrolled, privacyScrolled, onLegalVerified]);

  const handleTermsAgree = () => {
    if (termsScrolled) {
      setTermsAgreed(!termsAgreed);
      onTermsAgreed(!termsAgreed);
    } else {
      // Show toast or message to scroll first
      alert('Please scroll through the Terms of Service before agreeing.');
    }
  };

  const handlePrivacyAgree = () => {
    if (privacyScrolled) {
      setPrivacyAgreed(!privacyAgreed);
      onPrivacyAgreed(!privacyAgreed);
    } else {
      // Show toast or message to scroll first
      alert('Please scroll through the Privacy Policy before agreeing.');
    }
  };

  const isVerified = termsAgreed && privacyAgreed && termsScrolled && privacyScrolled;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Black Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Pink-Bordered Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-black border-2 border-pink-500 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl shadow-pink-500/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-pink-500/30">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-pink-500" />
                <h2 className="text-xl font-bold text-white">Legal Agreement Required</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-pink-500/30">
              <button
                onClick={() => setActiveTab('terms')}
                className={`flex-1 px-4 py-3 font-semibold transition-colors ${
                  activeTab === 'terms'
                    ? 'bg-pink-500 text-white'
                    : 'text-pink-400 hover:bg-pink-500/10 hover:text-pink-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Terms of Service
                {termsAgreed && <CheckCircle className="w-4 h-4 inline ml-2" />}
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex-1 px-4 py-3 font-semibold transition-colors ${
                  activeTab === 'privacy'
                    ? 'bg-pink-500 text-white'
                    : 'text-pink-400 hover:bg-pink-500/10 hover:text-pink-300'
                }`}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                Privacy Policy
                {privacyAgreed && <CheckCircle className="w-4 h-4 inline ml-2" />}
              </button>
            </div>

            {/* Content Area with Pink Scrollbar */}
            <div className="p-6">
              {activeTab === 'terms' && (
                <div
                  ref={termsRef}
                  className="h-64 overflow-y-auto pr-2 custom-scrollbar"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#ec4899 transparent',
                  }}
                >
                  <div className="text-white/80 space-y-4">
                    <h3 className="text-lg font-bold text-pink-400">Skip App Terms of Service</h3>
                    
                    <section>
                      <h4 className="font-semibold text-white mb-2">1. Acceptance of Terms</h4>
                      <p className="text-sm leading-relaxed">
                        By accessing and using the Skip App, you accept and agree to be bound by the terms and provision of this agreement.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">2. Use License</h4>
                      <p className="text-sm leading-relaxed">
                        Permission is granted to temporarily download one copy of the materials on Skip App for personal, non-commercial transitory viewing only.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">3. Disclaimer</h4>
                      <p className="text-sm leading-relaxed">
                        The materials on Skip App are provided on an 'as is' basis. Skip makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">4. Limitations</h4>
                      <p className="text-sm leading-relaxed">
                        In no event shall Skip or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Skip App.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">5. Privacy Policy</h4>
                      <p className="text-sm leading-relaxed">
                        Your Privacy is important to Skip. Please review our Privacy Policy, which also governs the Site and informs users of our data collection practices.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">6. Revisions and Errata</h4>
                      <p className="text-sm leading-relaxed">
                        The materials appearing on Skip App could include technical, typographical, or photographic errors. Skip does not promise that any of the materials on its web site are accurate, complete, or current.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">7. Governing Law</h4>
                      <p className="text-sm leading-relaxed">
                        These terms and conditions are governed by and construed in accordance with the laws of South Africa and you irrevocably submit to the exclusive jurisdiction of the courts.
                      </p>
                    </section>

                    <div className="pt-4 text-center text-pink-400 text-sm">
                      {termsScrolled ? '✅ You have scrolled through the entire Terms of Service' : '📜 Please scroll to the bottom to continue'}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div
                  ref={privacyRef}
                  className="h-64 overflow-y-auto pr-2 custom-scrollbar"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#ec4899 transparent',
                  }}
                >
                  <div className="text-white/80 space-y-4">
                    <h3 className="text-lg font-bold text-pink-400">Skip App Privacy Policy</h3>
                    
                    <section>
                      <h4 className="font-semibold text-white mb-2">1. Information We Collect</h4>
                      <p className="text-sm leading-relaxed">
                        We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">2. How We Use Your Information</h4>
                      <p className="text-sm leading-relaxed">
                        We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">3. Information Sharing</h4>
                      <p className="text-sm leading-relaxed">
                        We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">4. Data Security</h4>
                      <p className="text-sm leading-relaxed">
                        We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">5. WhatsApp Marketing</h4>
                      <p className="text-sm leading-relaxed">
                        By providing your WhatsApp number, you expressly consent to receive automated marketing messages from Skip. Message and data rates may apply. You can opt-out at any time.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">6. Cookies and Tracking</h4>
                      <p className="text-sm leading-relaxed">
                        We use cookies and similar tracking technologies to track activity on our service and hold certain information to improve your experience.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">7. Your Rights</h4>
                      <p className="text-sm leading-relaxed">
                        You have the right to access, update, or delete your personal information. You may also object to processing of your personal information or request restriction of processing.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">8. International Data Transfers</h4>
                      <p className="text-sm leading-relaxed">
                        Your information may be transferred to, and maintained on, computers located outside of your state, province, country or other governmental jurisdiction.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">9. Children's Privacy</h4>
                      <p className="text-sm leading-relaxed">
                        Our service does not address anyone under the age of 18. We do not knowingly collect personally identifiable information from anyone under the age of 18.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-white mb-2">10. Changes to This Policy</h4>
                      <p className="text-sm leading-relaxed">
                        We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page.
                      </p>
                    </section>

                    <div className="pt-4 text-center text-pink-400 text-sm">
                      {privacyScrolled ? '✅ You have scrolled through the entire Privacy Policy' : '📜 Please scroll to the bottom to continue'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-pink-500/30 space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={handleTermsAgree}
                  disabled={!termsScrolled}
                  className={`flex-1 ${
                    termsAgreed 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : termsScrolled
                      ? 'bg-pink-600 hover:bg-pink-700'
                      : 'bg-gray-600 cursor-not-allowed'
                  } text-white font-semibold`}
                >
                  {termsAgreed ? '✓ Terms Agreed' : 'I Agree to Terms'}
                </Button>
                <Button
                  onClick={handlePrivacyAgree}
                  disabled={!privacyScrolled}
                  className={`flex-1 ${
                    privacyAgreed 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : privacyScrolled
                      ? 'bg-pink-600 hover:bg-pink-700'
                      : 'bg-gray-600 cursor-not-allowed'
                  } text-white font-semibold`}
                >
                  {privacyAgreed ? '✓ Privacy Agreed' : 'I Agree to Privacy'}
                </Button>
              </div>

              {isVerified && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500 rounded-full">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 font-semibold">Legal Verification Complete</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Custom scrollbar styles
const style = document.createElement('style');
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #ec4899;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #db2777;
  }
`;
document.head.appendChild(style);

export default LegalModal;
