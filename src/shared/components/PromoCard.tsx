import { motion } from "framer-motion";
import { Button } from "@/shared/components/button";
import { PremiumFeature, getFeatureIcon, getFeatureGradient } from "@/data/premiumFeatures";

interface PromoCardProps {
  feature: PremiumFeature;
  onPurchase: (feature: PremiumFeature) => void;
}

const PromoCard = ({ feature, onPurchase }: PromoCardProps) => {
  const Icon = getFeatureIcon(feature.icon);
  const gradient = getFeatureGradient(feature.color);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer glass border-primary/20 hover:scale-105 transition-all"
      style={{ width: 80 }}
      onClick={() => onPurchase(feature)}
    >
      <div className={`w-12 h-12 rounded-full ${gradient} flex items-center justify-center`}>
        {feature.id === "vip" ? (
          <img
            src="https://ik.imagekit.io/7grri5v7d/VIP%20heart%20with%20golden%20accents.png"
            alt="VIP"
            style={{ width: 28, height: 28, objectFit: "contain" }}
          />
        ) : (
          <Icon className="w-5 h-5 text-primary-foreground" />
        )}
      </div>
      <p className="text-foreground text-[10px] font-semibold truncate w-full text-center">
        {feature.emoji} {feature.name}
      </p>
      <p className="text-muted-foreground text-[8px] leading-tight text-center line-clamp-2 px-0.5">
        {feature.description}
      </p>
      <Button
        size="sm"
        className={`${gradient} text-primary-foreground border-0 text-[8px] h-5 px-1.5 mt-0.5`}
        onClick={(e) => { e.stopPropagation(); onPurchase(feature); }}
      >
        {feature.price}
      </Button>
    </motion.div>
  );
};

export default PromoCard;
