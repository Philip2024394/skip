import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/avatar';
import { Badge } from '@/shared/components/badge';
import { MapPin, Heart, Star } from 'lucide-react';
import { cn } from '@/shared/services/utils';
import { firstName } from '@/shared/utils';
import { toast } from 'sonner';
import { GuestAuthPrompt } from '@/features/auth/components';

interface NewMemberContainerProps {
  member: {
    id: string;
    name: string;
    age: number;
    location: string;
    avatar?: string;
    bio?: string;
    interests?: string[];
    isNew?: boolean;
  };
  user?: any; // 🔴 [01] Auth Section Integration
  className?: string;
}

const NewMemberContainer = ({ member, user, className }: NewMemberContainerProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 🔴 FEATURE GATE: Auth Check for Interactions
  const handleInteraction = (action: 'like' | 'message') => {
    if (!user) {
      // 🔴 Trigger Section [01] Auth Popup
      setShowAuthModal(true);
      toast("🔮 Sign up to interact with this member!");
      return;
    }

    // Proceed with interaction logic
    if (action === 'like') {
      toast(`❤️ You liked ${firstName(member.name)}!`);
    } else if (action === 'message') {
      toast(`💬 Opening chat with ${firstName(member.name)}...`);
    }
  };
  return (
    <Card className={cn(
      "w-full max-w-sm overflow-hidden transition-all duration-300 hover:shadow-lg",
      className
    )}>
      <CardContent className="p-0">
        {/* Profile Header */}
        <div className="relative">
          <Avatar className="w-full h-48 rounded-none">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback className="text-2xl">
              {member.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* New Member Badge */}
          {member.isNew && (
            <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">
              NEW
            </Badge>
          )}
        </div>

        {/* Profile Info */}
        <div className="p-4 space-y-3">
          {/* Name and Age */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {firstName(member.name)}, {member.age}
            </h3>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm text-gray-600">4.8</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-1" />
            {member.location}
          </div>

          {/* Bio */}
          {member.bio && (
            <p className="text-sm text-gray-700 line-clamp-2">
              {member.bio}
            </p>
          )}

          {/* Interests */}
          {member.interests && member.interests.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {member.interests.slice(0, 3).map((interest, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
              {member.interests.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{member.interests.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => handleInteraction('like')}
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <Heart className="w-4 h-4 mr-1" />
              Like
            </button>
            <button
              onClick={() => handleInteraction('message')}
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
          trigger="like"
        />
      )}
    </Card>
  );
};

export default NewMemberContainer;
