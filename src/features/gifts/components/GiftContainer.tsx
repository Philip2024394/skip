import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/avatar';
import { Badge } from '@/shared/components/badge';
import { Gift, Star, Heart } from 'lucide-react';
import { cn } from '@/shared/services/utils';
import { toast } from 'sonner';
import { GuestAuthPrompt } from '@/features/auth/components';

interface GiftContainerProps {
  gift: {
    id: string;
    name: string;
    description: string;
    price: number;
    image?: string;
    category?: string;
    isPopular?: boolean;
  };
  sender?: {
    name: string;
    avatar?: string;
  };
  user?: any; // 🔴 [01] Auth Section Integration
  className?: string;
}

const GiftContainer = ({ gift, sender, user, className }: GiftContainerProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 🔴 FEATURE GATE: Auth Check for Interactions
  const handleInteraction = (action: 'send' | 'preview') => {
    if (!user) {
      // 🔴 Trigger Section [01] Auth Popup
      setShowAuthModal(true);
      toast("🔮 Sign up to send this gift!");
      return;
    }

    // Proceed with interaction logic
    if (action === 'send') {
      toast(`🎁 Sending ${gift.name}...`);
    } else if (action === 'preview') {
      toast(`👀 Previewing ${gift.name}...`);
    }
  };
  return (
    <Card className={cn(
      "w-full max-w-sm overflow-hidden transition-all duration-300 hover:shadow-lg",
      className
    )}>
      <CardContent className="p-0">
        {/* Gift Header - EXACT SAME STRUCTURE */}
        <div className="relative">
          <Avatar className="w-full h-48 rounded-none">
            <AvatarImage src={gift.image} alt={gift.name} />
            <AvatarFallback className="text-2xl">
              <Gift className="w-12 h-12 text-pink-500" />
            </AvatarFallback>
          </Avatar>

          {/* POPULAR Badge - EXACT SAME POSITION AS NEW BADGE */}
          {gift.isPopular && (
            <Badge className="absolute top-2 right-2 bg-purple-500 hover:bg-purple-600">
              POPULAR
            </Badge>
          )}
        </div>

        {/* Gift Info - EXACT SAME STRUCTURE */}
        <div className="p-4 space-y-3">
          {/* Name and Price - EXACT SAME LAYOUT AS NAME AND AGE */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {gift.name}
            </h3>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm text-gray-600">{gift.price}</span>
            </div>
          </div>

          {/* Category - EXACT SAME LAYOUT AS LOCATION */}
          {gift.category && (
            <div className="flex items-center text-sm text-gray-600">
              <Gift className="w-4 h-4 mr-1" />
              {gift.category}
            </div>
          )}

          {/* Description - EXACT SAME LAYOUT AS BIO */}
          {gift.description && (
            <p className="text-sm text-gray-700 line-clamp-2">
              {gift.description}
            </p>
          )}

          {/* Sender Info - EXACT SAME LAYOUT AS INTERESTS */}
          {sender && (
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">
                From {sender.name}
              </Badge>
            </div>
          )}

          {/* Action Buttons - EXACT SAME LAYOUT */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => handleInteraction('send')}
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <Heart className="w-4 h-4 mr-1" />
              Send
            </button>
            <button
              onClick={() => handleInteraction('preview')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              View
            </button>
          </div>
        </div>
      </CardContent>

      {/* 🔴 [01] Auth Modal Integration */}
      {showAuthModal && (
        <GuestAuthPrompt
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          trigger="purchase"
        />
      )}
    </Card>
  );
};

export default GiftContainer;
