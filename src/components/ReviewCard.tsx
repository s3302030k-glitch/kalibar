import { Star } from "lucide-react";
import type { Review } from "@/integrations/supabase/types";
import { useLanguage } from "@/hooks/useLanguage";

interface ReviewWithCabin extends Review {
  cabins?: {
    name_fa: string;
    name_en: string;
  } | null;
}

interface ReviewCardProps {
  review: ReviewWithCabin;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  const { isRTL } = useLanguage();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(isRTL ? "fa-IR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Get cabin name from joined data or fallback
  const cabinName = review.cabins
    ? (isRTL ? review.cabins.name_fa : review.cabins.name_en)
    : (isRTL ? `کلبه ${review.cabin_id}` : `Cabin ${review.cabin_id}`);

  return (
    <div className="glass-card rounded-xl p-6 hover-lift">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-bold text-foreground">{review.guest_name}</h4>
          <p className="text-sm text-muted-foreground">{cabinName}</p>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < review.rating
                  ? "text-gold fill-gold"
                  : "text-muted-foreground"
                }`}
            />
          ))}
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed mb-3">
        {review.comment}
      </p>

      {/* Admin response if exists */}
      {review.admin_response && (
        <div className="mt-4 p-3 bg-secondary/50 rounded-lg border-r-2 border-forest-medium">
          <p className="text-sm font-medium text-forest-medium mb-1">
            {isRTL ? "پاسخ مدیریت:" : "Admin Response:"}
          </p>
          <p className="text-sm text-muted-foreground">{review.admin_response}</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        {formatDate(review.created_at)}
      </p>
    </div>
  );
};

export default ReviewCard;
