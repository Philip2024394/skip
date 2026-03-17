import { useState } from "react";
import GiftSender from "./GiftSender";

interface GiftSenderProviderProps {
  children: React.ReactNode;
}

export default function GiftSenderProvider({ children }: GiftSenderProviderProps) {
  const [giftSenderState, setGiftSenderState] = useState<{
    isOpen: boolean;
    receiverId: string;
    receiverName: string;
  }>({
    isOpen: false,
    receiverId: "",
    receiverName: "",
  });

  const openGiftSender = (profile: any) => {
    setGiftSenderState({
      isOpen: true,
      receiverId: profile.id,
      receiverName: profile.name || profile.full_name || profile.first_name || "Someone",
    });
  };

  const closeGiftSender = () => {
    setGiftSenderState({
      isOpen: false,
      receiverId: "",
      receiverName: "",
    });
  };

  // Set up global function for gift sending
  if (typeof window !== "undefined") {
    window.sendGiftToProfile = openGiftSender;
  }

  return (
    <>
      {children}
      {giftSenderState.isOpen && (
        <GiftSender
          receiverId={giftSenderState.receiverId}
          receiverName={giftSenderState.receiverName}
          onClose={closeGiftSender}
        />
      )}
    </>
  );
}
