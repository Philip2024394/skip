import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VirtualGift {
  id: string;
  name: string;
  image_url: string;
  name_display: string;
  price: number;
}

interface GiftSenderProps {
  receiverId: string;
  receiverName: string;
  onClose: () => void;
}

export default function GiftSender({ receiverId, receiverName, onClose }: GiftSenderProps) {
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
  const [selectedGift, setSelectedGift] = useState<VirtualGift | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'payment' | 'confirm'>('select');

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    const { data, error } = await supabase
      .from('virtual_gifts')
      .select('id, name, image_url, name_display, price')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching gifts:', error);
      // Use fallback gifts with all 25 images
      const fallbackGifts = [
        // Original 19 gift images
        { id: 'gift001', name: 'Classic Rose', image_url: 'https://ik.imagekit.io/7grri5v7d/classic-rose-removebg-preview.png', name_display: 'Classic Rose', price: 5.99 },
        { id: 'gift002', name: 'Romantic Heart', image_url: 'https://ik.imagekit.io/7grri5v7d/romantic-heart-removebg-preview.png', name_display: 'Romantic Heart', price: 6.99 },
        { id: 'gift003', name: 'Diamond Ring', image_url: 'https://ik.imagekit.io/7grri5v7d/diamond-ring-removebg-preview.png', name_display: 'Diamond Ring', price: 15.99 },
        { id: 'gift004', name: 'Chocolate Box', image_url: 'https://ik.imagekit.io/7grri5v7d/chocolate-box-removebg-preview.png', name_display: 'Chocolate Box', price: 8.99 },
        { id: 'gift005', name: 'Teddy Bear', image_url: 'https://ik.imagekit.io/7grri5v7d/teddy-bear-removebg-preview.png', name_display: 'Teddy Bear', price: 9.99 },
        { id: 'gift006', name: 'Flower Bouquet', image_url: 'https://ik.imagekit.io/7grri5v7d/flower-bouquet-removebg-preview.png', name_display: 'Flower Bouquet', price: 12.99 },
        { id: 'gift007', name: 'Love Letter', image_url: 'https://ik.imagekit.io/7grri5v7d/love-letter-removebg-preview.png', name_display: 'Love Letter', price: 4.99 },
        { id: 'gift008', name: 'Perfume', image_url: 'https://ik.imagekit.io/7grri5v7d/perfume-removebg-preview.png', name_display: 'Perfume', price: 14.99 },
        { id: 'gift009', name: 'Jewelry Box', image_url: 'https://ik.imagekit.io/7grri5v7d/jewelry-box-removebg-preview.png', name_display: 'Jewelry Box', price: 18.99 },
        { id: 'gift010', name: 'Wine Bottle', image_url: 'https://ik.imagekit.io/7grri5v7d/wine-bottle-removebg-preview.png', name_display: 'Wine Bottle', price: 16.99 },
        { id: 'gift011', name: 'Cake Slice', image_url: 'https://ik.imagekit.io/7grri5v7d/cake-slice-removebg-preview.png', name_display: 'Cake Slice', price: 7.99 },
        { id: 'gift012', name: 'Music Box', image_url: 'https://ik.imagekit.io/7grri5v7d/music-box-removebg-preview.png', name_display: 'Music Box', price: 11.99 },
        { id: 'gift013', name: 'Photo Frame', image_url: 'https://ik.imagekit.io/7grri5v7d/photo-frame-removebg-preview.png', name_display: 'Photo Frame', price: 10.99 },
        { id: 'gift014', name: 'Candle Light', image_url: 'https://ik.imagekit.io/7grri5v7d/candle-light-removebg-preview.png', name_display: 'Candle Light', price: 5.99 },
        { id: 'gift015', name: 'Keychain', image_url: 'https://ik.imagekit.io/7grri5v7d/keychain-removebg-preview.png', name_display: 'Keychain', price: 6.49 },
        { id: 'gift016', name: 'Bracelet', image_url: 'https://ik.imagekit.io/7grri5v7d/bracelet-removebg-preview.png', name_display: 'Bracelet', price: 13.99 },
        { id: 'gift017', name: 'Necklace', image_url: 'https://ik.imagekit.io/7grri5v7d/necklace-removebg-preview.png', name_display: 'Necklace', price: 17.99 },
        { id: 'gift018', name: 'Earrings', image_url: 'https://ik.imagekit.io/7grri5v7d/earrings-removebg-preview.png', name_display: 'Earrings', price: 14.49 },
        { id: 'gift019', name: 'Watch', image_url: 'https://ik.imagekit.io/7grri5v7d/watch-removebg-preview.png', name_display: 'Watch', price: 22.99 },
        // New 6 gift images
        { id: 'gift020', name: 'Special Gift 1', image_url: 'https://ik.imagekit.io/7grri5v7d/dsfgsdfgsdfgds-removebg-preview.png?updatedAt=1773600046900', name_display: 'Special Gift 1', price: 7.99 },
        { id: 'gift021', name: 'Special Gift 2', image_url: 'https://ik.imagekit.io/7grri5v7d/dsfgsdfgsdfgdgsfgsdfg-removebg-preview.png?updatedAt=1773600149048', name_display: 'Special Gift 2', price: 8.99 },
        { id: 'gift022', name: 'Special Gift 3', image_url: 'https://ik.imagekit.io/7grri5v7d/dgafsgsdfgsdfgsdfgd-removebg-preview.png?updatedAt=1773600246313', name_display: 'Special Gift 3', price: 9.99 },
        { id: 'gift023', name: 'Special Gift 4', image_url: 'https://ik.imagekit.io/7grri5v7d/sdfasdfasdfasdfasdf-removebg-preview.png?updatedAt=1773601143240', name_display: 'Special Gift 4', price: 10.99 },
        { id: 'gift024', name: 'Special Gift 5', image_url: 'https://ik.imagekit.io/7grri5v7d/sdfasdfasdfaasdfasdf-removebg-preview.png?updatedAt=1773601223203', name_display: 'Special Gift 5', price: 11.99 },
        { id: 'gift025', name: 'Special Gift 6', image_url: 'https://ik.imagekit.io/7grri5v7d/dfsgdfgsdfgd-removebg-preview.png?updatedAt=1773601367483', name_display: 'Special Gift 6', price: 13.99 },
      ];
      setGifts(fallbackGifts);
      return;
    }

    setGifts(data || []);
  };

  const handleGiftSelect = (gift: VirtualGift) => {
    setSelectedGift(gift);
    setStep('payment');
  };

  const handlePayment = async () => {
    if (!selectedGift) return;

    setLoading(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Send the gift
      const { error } = await supabase
        .from('sent_gifts')
        .insert({
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          receiver_id: receiverId,
          gift_id: selectedGift.id,
          message: message.trim(),
        });

      if (error) {
        toast.error('Failed to send gift');
        return;
      }

      setStep('confirm');
      toast.success(`Gift sent to ${receiverName}! 🎁`);
      
      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'confirm') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <div style={{
          background: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(168,85,247,0.2))",
          border: "2px solid rgba(236,72,153,0.6)",
          borderRadius: 20,
          padding: 32,
          textAlign: "center",
          maxWidth: 400,
        }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            style={{ 
              width: 80, 
              height: 80, 
              marginBottom: 16,
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.1)",
            }}
          >
            <img 
              src={selectedGift?.image_url} 
              alt={selectedGift?.name_display}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = "none";
                const parent = img.parentElement;
                if (parent && !parent.querySelector('.fallback-emoji')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'fallback-emoji';
                  fallback.textContent = '🎁';
                  fallback.style.cssText = 'font-size: 32px; display: flex; align-items: center; justify-content: center; height: 100%; color: white;';
                  parent.appendChild(fallback);
                }
              }}
            />
          </motion.div>
          <h2 style={{
            color: "white",
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
          }}>
            Gift Sent! 🎉
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: 14,
            marginBottom: 16,
          }}>
            Your {selectedGift?.name_display} has been sent to {receiverName}
          </p>
          <p style={{
            color: "rgba(236,72,153,0.8)",
            fontSize: 12,
          }}>
            Closing automatically...
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div style={{
        background: "rgba(0,0,0,0.9)",
        border: "2px solid rgba(236,72,153,0.6)",
        borderRadius: 20,
        padding: 24,
        maxWidth: 500,
        width: "90%",
        maxHeight: "80vh",
        overflowY: "auto",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}>
          <h2 style={{
            color: "white",
            fontSize: 20,
            fontWeight: 800,
          }}>
            Send a Gift to {receiverName}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {step === 'select' && (
          <>
            <p style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 14,
              marginBottom: 20,
            }}>
              Choose a virtual gift to send
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}>
              {gifts.map((gift) => (
                <motion.div
                  key={gift.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleGiftSelect(gift)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: 16,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{
                    width: 60,
                    height: 60,
                    marginBottom: 8,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <img 
                      src={gift.image_url} 
                      alt={gift.name_display}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = "none";
                        const parent = img.parentElement;
                        if (parent && !parent.querySelector('.fallback-emoji')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'fallback-emoji';
                          fallback.textContent = '🎁';
                          fallback.style.cssText = 'font-size: 24px; display: flex; align-items: center; justify-content: center; height: 100%; color: white;';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                  <div style={{
                    color: "white",
                    fontSize: 11,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}>
                    {gift.name_display}
                  </div>
                  <div style={{
                    color: "rgba(236,72,153,0.8)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}>
                    ${gift.price}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {step === 'payment' && selectedGift && (
          <>
            <div style={{
              background: "rgba(236,72,153,0.1)",
              border: "1px solid rgba(236,72,153,0.3)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              textAlign: "center",
            }}>
              <div style={{
                width: 60,
                height: 60,
                marginBottom: 8,
                borderRadius: 8,
                overflow: "hidden",
                background: "rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px auto",
              }}>
                <img 
                  src={selectedGift.image_url} 
                  alt={selectedGift.name_display}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = "none";
                    const parent = img.parentElement;
                    if (parent && !parent.querySelector('.fallback-emoji')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'fallback-emoji';
                      fallback.textContent = '🎁';
                      fallback.style.cssText = 'font-size: 24px; display: flex; align-items: center; justify-content: center; height: 100%; color: white;';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <h3 style={{
                color: "white",
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 4,
              }}>
                {selectedGift.name_display}
              </h3>
              <p style={{
                color: "rgba(236,72,153,0.8)",
                fontSize: 16,
                fontWeight: 800,
              }}>
                ${selectedGift.price}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 12,
                display: "block",
                marginBottom: 8,
              }}>
                Add a message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a sweet message..."
                maxLength={100}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: 12,
                  color: "white",
                  fontSize: 14,
                  resize: "vertical",
                  minHeight: 80,
                }}
              />
              <p style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 10,
                textAlign: "right",
                marginTop: 4,
              }}>
                {message.length}/100
              </p>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}>
              <h4 style={{
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 12,
              }}>
                Payment Details
              </h4>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                  Gift Price:
                </span>
                <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>
                  ${selectedGift.price}
                </span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 8,
                borderTop: "1px solid rgba(255,255,255,0.1)",
              }}>
                <span style={{ color: "white", fontSize: 14, fontWeight: 600 }}>
                  Total:
                </span>
                <span style={{
                  color: "rgba(236,72,153,0.8)",
                  fontSize: 16,
                  fontWeight: 800,
                }}>
                  ${selectedGift.price}
                </span>
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: 12,
            }}>
              <button
                onClick={() => setStep('select')}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  padding: 12,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                style={{
                  flex: 2,
                  background: loading 
                    ? "rgba(236,72,153,0.5)" 
                    : "linear-gradient(135deg, rgba(236,72,153,0.8), rgba(168,85,247,0.8))",
                  border: "none",
                  borderRadius: 8,
                  padding: 12,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {loading ? "Processing..." : `Pay $${selectedGift.price}`}
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
