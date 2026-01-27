import type { Cabin } from "@/integrations/supabase/types";
import { Users, Maximize, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { toPersianDigits } from "@/lib/utils";

// Default cabin image fallback
import cabinSmall from "@/assets/cabin-small.jpg";
import cabinLarge from "@/assets/cabin-large.jpg";

interface CabinCardProps {
  cabin: Cabin;
  onReserve: (cabin: Cabin) => void;
}

const CabinCard = ({ cabin, onReserve }: CabinCardProps) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(isRTL ? "fa-IR" : "en-US").format(price);
  };

  const displayPrice = isRTL ? cabin.base_price_irr : Number(cabin.base_price_usd);
  const cabinName = isRTL ? cabin.name_fa : cabin.name_en;
  const features = isRTL ? cabin.features_fa : cabin.features_en;

  // Use first image from array or fallback
  const cabinImage = cabin.images?.[0] || (cabin.size_sqm >= 100 ? cabinLarge : cabinSmall);

  return (
    <div className="group glass-card rounded-xl overflow-hidden hover-lift">
      <div className="relative h-56 overflow-hidden">
        <img
          src={cabinImage}
          alt={cabinName}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />

        <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'}`}>
          <Badge
            variant={cabin.is_available ? "default" : "secondary"}
            className={cabin.is_available ? "bg-forest-medium" : "bg-muted"}
          >
            {cabin.is_available
              ? (isRTL ? "موجود" : "Available")
              : (isRTL ? "رزرو شده" : "Booked")}
          </Badge>
        </div>

        <div className={`absolute bottom-4 ${isRTL ? 'right-4 left-4' : 'left-4 right-4'}`}>
          <h3 className="text-xl font-bold text-primary-foreground mb-1">
            {cabinName}
          </h3>
          <div className="flex items-center gap-4 text-primary-foreground/90 text-sm">
            <span className="flex items-center gap-1">
              <Maximize className="w-4 h-4" />
              {isRTL ? toPersianDigits(cabin.size_sqm) : cabin.size_sqm} {t("cabins.sqm")}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {isRTL ? toPersianDigits(cabin.capacity) : cabin.capacity} {t("cabins.capacity")}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <ul className="space-y-2">
            {features.slice(0, 4).map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-forest-medium" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <span className="text-2xl font-bold text-forest-deep">
              {isRTL ? "" : "$"}{formatPrice(displayPrice)}
            </span>
            <span className={`text-sm text-muted-foreground ${isRTL ? 'mr-1' : 'ml-1'}`}>
              {isRTL ? t("cabins.toman") : ""} / {t("cabins.perNight")}
            </span>
          </div>

          <Button
            onClick={() => onReserve(cabin)}
            disabled={!cabin.is_available}
            className="bg-forest-medium hover:bg-forest-deep text-primary-foreground"
          >
            {cabin.is_available ? t("cabins.reserve") : (isRTL ? "رزرو شده" : "Booked")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CabinCard;
