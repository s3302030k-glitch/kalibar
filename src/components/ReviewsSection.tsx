import { useState } from "react";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ReviewCard from "@/components/ReviewCard";
import ReviewForm from "@/components/ReviewForm";
import { useApprovedReviews } from "@/hooks/useReviews";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

const ReviewsSection = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: reviews, isLoading } = useApprovedReviews();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-forest-medium/10 px-4 py-2 rounded-full mb-4">
            <MessageSquare className="w-5 h-5 text-forest-medium" />
            <span className="text-forest-medium text-sm font-medium">
              {t("reviews.title")}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-forest-deep mb-4">
            {t("reviews.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            {t("reviews.subtitle")}
          </p>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-forest-medium hover:bg-forest-deep">
                <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t("reviews.writeReview")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("reviews.form.title")}</DialogTitle>
              </DialogHeader>
              <ReviewForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground">
            {isRTL ? "در حال بارگذاری نظرات..." : "Loading reviews..."}
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            {t("reviews.noReviews")}
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
