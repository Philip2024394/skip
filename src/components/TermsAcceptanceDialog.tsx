import { useState } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield } from "lucide-react";
import logoHeart from "@/assets/logo-heart.png";

interface TermsAcceptanceDialogProps {
  onAccept: () => void;
}

const TermsAcceptanceDialog = ({ onAccept }: TermsAcceptanceDialogProps) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card border border-border rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border">
          <img src={logoHeart} alt="SkipTheApp" className="w-10 h-10 object-contain" />
          <div>
            <h2 className="font-display font-bold text-lg text-foreground">Terms & Conditions</h2>
            <p className="text-muted-foreground text-xs">Please read and accept to continue</p>
          </div>
          <Shield className="w-5 h-5 text-primary ml-auto" />
        </div>

        {/* Scrollable Terms Content */}
        <ScrollArea className="flex-1 min-h-0" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <div className="px-6 py-4 text-muted-foreground text-xs leading-relaxed space-y-4">
            <p className="text-foreground font-semibold text-sm">SKIPTHEAPP — TERMS AND CONDITIONS OF USE</p>
            <p><strong>Effective Date:</strong> March 2026</p>
            <p>Welcome to SkipTheApp ("the Platform", "we", "us", "our"). By creating an account and using SkipTheApp, you ("User", "you", "your") agree to be bound by these Terms and Conditions. If you do not agree to any part of these terms, do not use the Platform.</p>

            <p className="text-foreground font-semibold text-sm mt-4">1. NATURE OF THE PLATFORM</p>
            <p>1.1. SkipTheApp is a social meeting platform that facilitates introductions between users. The Platform serves solely as a venue for users to discover and connect with one another.</p>
            <p>1.2. SkipTheApp is <strong>NOT</strong> a dating agency, matchmaking service, or relationship consultancy. We do not guarantee compatibility, safety, or the outcome of any interaction between users.</p>
            <p>1.3. The Platform does not verify, endorse, or guarantee the accuracy, completeness, or truthfulness of any user profile, photograph, personal information, or any content submitted by users.</p>

            <p className="text-foreground font-semibold text-sm mt-4">2. LIMITATION OF LIABILITY</p>
            <p>2.1. SkipTheApp shall not be held responsible, liable, or accountable for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The accuracy, quality, or legitimacy of any user profile or the information contained therein.</li>
              <li>Any interactions, communications, meetings, or relationships that occur between users, whether online or offline.</li>
              <li>Any damages, losses, injuries, emotional distress, financial losses, or any other harm arising from the use of the Platform or interactions with other users.</li>
              <li>Any misrepresentation, fraud, deception, or criminal activity committed by any user.</li>
              <li>The conduct, behaviour, or actions of any user on or off the Platform.</li>
            </ul>
            <p>2.2. You acknowledge and agree that you use the Platform and interact with other users <strong>entirely at your own risk</strong>. SkipTheApp provides no warranties, express or implied, regarding the safety, reliability, or quality of any user or interaction.</p>
            <p>2.3. To the maximum extent permitted by applicable law, SkipTheApp's total aggregate liability for any claim arising from or related to the Platform shall not exceed the amount you paid to SkipTheApp in the twelve (12) months preceding the claim.</p>

            <p className="text-foreground font-semibold text-sm mt-4">3. USER PROFILES AND CONTENT</p>
            <p>3.1. Users are solely responsible for the content they upload, including but not limited to photographs, biographical information, and any other personal data.</p>
            <p>3.2. SkipTheApp does not verify user identities, ages, backgrounds, or any claims made in user profiles. Users should exercise their own judgment and caution when interacting with others.</p>
            <p>3.3. You warrant that all information you provide is accurate and that you will not impersonate any person or create a false or misleading profile.</p>

            <p className="text-foreground font-semibold text-sm mt-4">4. WHATSAPP AS PRIMARY CONTACT</p>
            <p>4.1. SkipTheApp uses WhatsApp as the primary point of contact for matched users. By providing your WhatsApp number, you consent to its disclosure to mutual matches upon payment completion.</p>
            <p>4.2. You acknowledge that WhatsApp is a third-party service and SkipTheApp has no control over, and accepts no responsibility for, any communications that occur on WhatsApp or any other external platform.</p>
            <p>4.3. You have the absolute right to <strong>block and delete</strong> any contact on WhatsApp who you feel has offended you, used improper or abusive language, harassed you, or made you feel uncomfortable in any way.</p>
            <p>4.4. You are encouraged to <strong>report any such user to SkipTheApp</strong> immediately so that we may investigate and take appropriate action, including permanent account termination.</p>

            <p className="text-foreground font-semibold text-sm mt-4">5. PROHIBITED CONDUCT AND ENFORCEMENT</p>
            <p>5.1. The following conduct is strictly prohibited and will result in immediate account suspension or permanent ban:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Harassment, bullying, intimidation, or threatening behaviour of any kind.</li>
              <li>Hate speech, discrimination, or any content that violates human rights or human dignity.</li>
              <li>Abusive, offensive, vulgar, or sexually explicit language or content directed at other users.</li>
              <li>Stalking, unsolicited contact, or any behaviour that causes another user to feel unsafe.</li>
              <li>Scamming, phishing, fraud, or any attempt to deceive or financially exploit other users.</li>
              <li>Creating fake profiles, impersonating others, or using stolen photographs.</li>
              <li>Solicitation of illegal activities or services.</li>
              <li>Any violation of applicable local, national, or international laws.</li>
            </ul>
            <p>5.2. SkipTheApp reserves the absolute right to <strong>monitor, investigate, suspend, and permanently delete</strong> any account that we, in our sole discretion, determine has violated these Terms, community standards, or applicable law.</p>
            <p>5.3. Decisions regarding account suspension or termination are final and are not subject to appeal.</p>

            <p className="text-foreground font-semibold text-sm mt-4">6. REPORTING AND SAFETY</p>
            <p>6.1. Users are encouraged to report any profile or behaviour that violates these Terms using the in-app reporting feature.</p>
            <p>6.2. SkipTheApp will review all reports and take action as deemed appropriate. However, we do not guarantee a specific outcome or timeline for any report investigation.</p>
            <p>6.3. In cases of immediate danger or criminal activity, users should contact local law enforcement directly. SkipTheApp will cooperate with law enforcement agencies as required by law.</p>

            <p className="text-foreground font-semibold text-sm mt-4">7. PAYMENTS AND REFUNDS</p>
            <p>7.1. Certain features of SkipTheApp require payment. All payments are processed through secure third-party payment processors (Stripe).</p>
            <p>7.2. All payments are <strong>non-refundable</strong> unless otherwise required by applicable consumer protection laws.</p>
            <p>7.3. SkipTheApp reserves the right to modify pricing at any time. Existing purchases will not be retroactively affected.</p>

            <p className="text-foreground font-semibold text-sm mt-4">8. PRIVACY AND DATA PROTECTION</p>
            <p>8.1. Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference.</p>
            <p>8.2. By using the Platform, you consent to the collection, use, and processing of your personal data as described in our Privacy Policy.</p>
            <p>8.3. SkipTheApp will not sell your personal data to third parties. Data may be shared with law enforcement if required by law or to protect the safety of users.</p>

            <p className="text-foreground font-semibold text-sm mt-4">9. AGE REQUIREMENT</p>
            <p>9.1. You must be at least <strong>18 years of age</strong> to create an account and use SkipTheApp. By creating an account, you confirm that you are at least 18 years old.</p>
            <p>9.2. SkipTheApp reserves the right to terminate any account that we believe belongs to a person under 18 years of age.</p>

            <p className="text-foreground font-semibold text-sm mt-4">10. INDEMNIFICATION</p>
            <p>10.1. You agree to indemnify, defend, and hold harmless SkipTheApp, its officers, directors, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising from:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your use of the Platform.</li>
              <li>Your violation of these Terms.</li>
              <li>Your violation of any rights of a third party.</li>
              <li>Any content you submit to the Platform.</li>
              <li>Any interaction with another user, whether on or off the Platform.</li>
            </ul>

            <p className="text-foreground font-semibold text-sm mt-4">11. INTELLECTUAL PROPERTY</p>
            <p>11.1. All content, trademarks, logos, and intellectual property on the Platform belong to SkipTheApp or its licensors.</p>
            <p>11.2. You may not copy, modify, distribute, or create derivative works from any part of the Platform without prior written consent.</p>

            <p className="text-foreground font-semibold text-sm mt-4">12. ACCOUNT TERMINATION</p>
            <p>12.1. You may delete your account at any time through the Platform settings.</p>
            <p>12.2. SkipTheApp may suspend or terminate your account at any time, for any reason, without prior notice.</p>
            <p>12.3. Upon termination, your right to use the Platform ceases immediately. Certain provisions of these Terms shall survive termination.</p>

            <p className="text-foreground font-semibold text-sm mt-4">13. DISCLAIMER OF WARRANTIES</p>
            <p>13.1. The Platform is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind, whether express or implied.</p>
            <p>13.2. SkipTheApp does not warrant that the Platform will be uninterrupted, error-free, secure, or free from viruses or other harmful components.</p>

            <p className="text-foreground font-semibold text-sm mt-4">14. GOVERNING LAW AND DISPUTE RESOLUTION</p>
            <p>14.1. These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which SkipTheApp operates.</p>
            <p>14.2. Any disputes arising from these Terms or the use of the Platform shall first be attempted to be resolved through good faith negotiation. If unresolved, disputes shall be submitted to binding arbitration.</p>

            <p className="text-foreground font-semibold text-sm mt-4">15. MODIFICATIONS TO TERMS</p>
            <p>15.1. SkipTheApp reserves the right to modify these Terms at any time. Updated Terms will be posted on the Platform with a revised effective date.</p>
            <p>15.2. Your continued use of the Platform after changes constitutes acceptance of the modified Terms.</p>

            <p className="text-foreground font-semibold text-sm mt-4">16. SEVERABILITY</p>
            <p>16.1. If any provision of these Terms is found to be unenforceable or invalid, the remaining provisions shall continue in full force and effect.</p>

            <p className="text-foreground font-semibold text-sm mt-4">17. ENTIRE AGREEMENT</p>
            <p>17.1. These Terms, together with the Privacy Policy, constitute the entire agreement between you and SkipTheApp regarding the use of the Platform and supersede all prior agreements.</p>

            <p className="mt-4 text-foreground text-xs font-medium">By checking the box below and clicking "I Accept", you confirm that you have read, understood, and agree to be bound by these Terms and Conditions in their entirety.</p>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms-agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="terms-agree" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              I have read, understood, and agree to the <strong className="text-foreground">Terms & Conditions</strong> and <strong className="text-foreground">Privacy Policy</strong> of SkipTheApp.
            </label>
          </div>
          <Button
            onClick={onAccept}
            disabled={!agreed}
            className="w-full gradient-love text-primary-foreground border-0 rounded-xl h-11 font-semibold"
          >
            I Accept — Continue
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TermsAcceptanceDialog;
