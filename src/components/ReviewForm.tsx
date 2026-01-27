import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateReview } from "@/hooks/useReviews";
import { useCabins } from "@/hooks/useCabins";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

interface ReviewFormProps {
  onSuccess?: () => void;
}

const ReviewForm = ({ onSuccess }: ReviewFormProps) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [cabinId, setCabinId] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: cabins = [], isLoading: cabinsLoading } = useCabins();
  const createReview = useCreateReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim() || !guestPhone.trim() || !cabinId || !rating || !comment.trim()) {
      toast.error(t("booking.fillAllFields"));
      return;
    }

    const selectedCabin = cabins.find((c) => c.id === parseInt(cabinId));
    if (!selectedCabin) return;

    try {
      await createReview.mutateAsync({
        cabin_id: selectedCabin.id,
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        rating,
        comment: comment.trim(),
      });

      toast.success(t("reviews.form.successMessage"));

      // Reset form
      setGuestName("");
      setGuestPhone("");
      setCabinId("");
      setRating(0);
      setComment("");

      onSuccess?.();
    } catch (error) {
      toast.error(t("reviews.form.errorMessage"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="guestName">{t("reviews.form.name")}</Label>
          <Input
            id="guestName"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder={t("reviews.form.name")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guestPhone">{t("reviews.form.phone")}</Label>
          <Input
            id="guestPhone"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            placeholder="09123456789"
            dir="ltr"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("reviews.form.cabin")}</Label>
        <Select value={cabinId} onValueChange={setCabinId}>
          <SelectTrigger>
            <SelectValue placeholder={t("reviews.form.selectCabin")} />
          </SelectTrigger>
          <SelectContent>
            {cabinsLoading ? (
              <div className="p-2 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              cabins.map((cabin) => (
                <SelectItem key={cabin.id} value={cabin.id.toString()}>
                  {isRTL ? cabin.name_fa : cabin.name_en}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("reviews.form.rating")}</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${star <= (hoverRating || rating)
                    ? "text-gold fill-gold"
                    : "text-muted-foreground"
                  }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">{t("reviews.form.comment")}</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("reviews.form.commentPlaceholder")}
          rows={4}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-forest-medium hover:bg-forest-deep"
        disabled={createReview.isPending}
      >
        {createReview.isPending ? t("reviews.form.submitting") : t("reviews.form.submit")}
      </Button>
    </form>
  );
};

export default ReviewForm;
