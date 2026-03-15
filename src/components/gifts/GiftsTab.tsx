import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReceivedGift {
  id: string;
  gift_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  gift: {
    emoji: string;
    name: string;
  };
  message: string;
  created_at: string;
}

interface GiftsTabProps {
  currentUserId: string;
}

export default function GiftsTab({ currentUserId }: GiftsTabProps) {
  const [receivedGifts, setReceivedGifts] = useState<ReceivedGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<{
    isOpen: boolean;
    profile: any;
  }>({
    isOpen: false,
    profile: null,
  });

  useEffect(() => {
    fetchReceivedGifts();
  }, [currentUserId]);

  const fetchReceivedGifts = async () => {
    try {
      const { data, error } = await supabase
        .from('sent_gifts')
        .select(`
          id,
          gift_id,
          sender_id,
          message,
          created_at,
          virtual_gifts!inner(
            emoji,
            name
          ),
          profiles!inner(
            name,
            full_name,
            first_name,
            avatar_url
          )
        `)
        .eq('receiver_id', currentUserId)
        .eq('is_displayed', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching received gifts:', error);
        return;
      }

      const gifts = data?.map(gift => ({
        id: gift.id,
        gift_id: gift.gift_id,
        sender_id: gift.sender_id,
        sender_name: gift.profiles?.name || gift.profiles?.full_name || gift.profiles?.first_name || "Someone",
        sender_avatar: gift.profiles?.avatar_url,
        gift: {
          emoji: gift.virtual_gifts.emoji,
          name: gift.virtual_gifts.name
        },
        message: gift.message || '',
        created_at: gift.created_at
      })) || [];

      setReceivedGifts(gifts);
    } catch (error) {
      console.error('Error fetching gifts:', error);
      toast.error('Failed to load gifts');
    } finally {
      setLoading(false);
    }
  };

  const openProfileView = (senderProfile: any) => {
    setSelectedProfile({
      isOpen: true,
      profile: {
        id: senderProfile.sender_id,
        name: senderProfile.sender_name,
        avatar_url: senderProfile.sender_avatar,
        // Add other profile fields as needed
      }
    });
  };

  const closeProfileView = () => {
    setSelectedProfile({ isOpen: false, profile: null });
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "200px",
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
      }}>
        Loading gifts...
      </div>
    );
  }

  if (receivedGifts.length === 0) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "200px",
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🎁</div>
        <p>No gifts received yet</p>
        <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
          When someone sends you a gift, it will appear here
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={{
        padding: "16px",
        height: "100%",
        overflow: "hidden",
      }}>
        <h3 style={{
          color: "rgba(236,72,153,0.9)",
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}>
          Your Gifts
        </h3>

        <div style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          overflowY: "hidden",
          padding: "4px 0 16px 0",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(236,72,153,0.4) transparent",
        }}>
          {receivedGifts.map((gift, index) => (
            <motion.div
              key={gift.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              style={{
                flex: "0 0 auto",
                width: "140px",
                background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.12))",
                border: "1px solid rgba(236,72,153,0.4)",
                borderRadius: 16,
                padding: 16,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => openProfileView(gift)}
            >
              {/* Sender Profile */}
              <div style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 12,
              }}>
                {gift.sender_avatar ? (
                  <img
                    src={gift.sender_avatar}
                    alt={gift.sender_name}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid rgba(236,72,153,0.6)",
                      marginRight: 8,
                    }}
                  />
                ) : (
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(236,72,153,0.2)",
                    border: "2px solid rgba(236,72,153,0.6)",
                    marginRight: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(236,72,153,0.8)",
                    fontSize: 16,
                    fontWeight: 700,
                  }}>
                    {gift.sender_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: "white",
                    fontSize: 11,
                    fontWeight: 600,
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {gift.sender_name}
                  </p>
                  <p style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 9,
                    margin: 0,
                  }}>
                    {new Date(gift.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Gift Emoji */}
              <div style={{
                fontSize: 48,
                textAlign: "center",
                marginBottom: 8,
                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
              }}>
                {gift.gift.emoji}
              </div>

              {/* Gift Name */}
              <p style={{
                color: "rgba(236,72,153,0.8)",
                fontSize: 10,
                fontWeight: 600,
                textAlign: "center",
                margin: "0 0 8px 0",
                textTransform: "uppercase",
              }}>
                {gift.gift.name}
              </p>

              {/* Message */}
              {gift.message && (
                <p style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 9,
                  textAlign: "center",
                  margin: 0,
                  fontStyle: "italic",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  "{gift.message}"
                </p>
              )}

              {/* Tap hint */}
              <p style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 8,
                textAlign: "center",
                margin: "8px 0 0 0",
              }}>
                Tap to view profile
              </p>
            </motion.div>
          ))}
        </div>

        {/* Scroll hint */}
        {receivedGifts.length > 2 && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 4,
            marginTop: 8,
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(236,72,153,0.6)",
            }} />
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(236,72,153,0.3)",
            }} />
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(236,72,153,0.3)",
            }} />
          </div>
        )}
      </div>

      {/* Profile View Modal */}
      {selectedProfile.isOpen && selectedProfile.profile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeProfileView}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(0,0,0,0.9)",
              border: "2px solid rgba(236,72,153,0.6)",
              borderRadius: 20,
              padding: 24,
              maxWidth: 400,
              width: "90%",
              textAlign: "center",
            }}
          >
            <h3 style={{
              color: "white",
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 16,
            }}>
              {selectedProfile.profile.name}
            </h3>
            
            {selectedProfile.profile.avatar_url ? (
              <img
                src={selectedProfile.profile.avatar_url}
                alt={selectedProfile.profile.name}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid rgba(236,72,153,0.6)",
                  marginBottom: 16,
                }}
              />
            ) : (
              <div style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(236,72,153,0.2)",
                border: "3px solid rgba(236,72,153,0.6)",
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(236,72,153,0.8)",
                fontSize: 48,
                fontWeight: 700,
              }}>
                {selectedProfile.profile.name.charAt(0).toUpperCase()}
              </div>
            )}

            <button
              onClick={closeProfileView}
              style={{
                background: "linear-gradient(135deg, rgba(236,72,153,0.8), rgba(168,85,247,0.8))",
                border: "none",
                borderRadius: 12,
                padding: "12px 24px",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
