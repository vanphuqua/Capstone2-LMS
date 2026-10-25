"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface CourseRatingProps {
  courseId: string;
  hasPurchased: boolean;
}

export const CourseRating = ({ courseId, hasPurchased }: CourseRatingProps) => {
  const t = useTranslations("course.rating");
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRating, setUserRating] = useState<any>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchRatings = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/ratings`);
      setAverageRating(response.data.averageRating);
      setTotalRatings(response.data.totalRatings);
      if (response.data.userRating) {
        setUserRating(response.data.userRating);
        setRating(response.data.userRating.rating);
        setReview(response.data.userRating.review || "");
      }
    } catch (error) {
      console.error("Failed to fetch ratings:", error);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(t("select_rating_error"));
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(`/api/courses/${courseId}/ratings`, {
        rating,
        review: review.trim() || null,
      });

      toast.success(userRating ? t("rating_updated") : t("rating_submitted"));
      setOpen(false);
      fetchRatings();
      router.refresh();
    } catch (error) {
      toast.error(t("rating_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            disabled={!interactive || isSubmitting}
            className={`${interactive ? "cursor-pointer" : "cursor-default"} transition-colors`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= (interactive ? (hoverRating || rating) : averageRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Display Average Rating */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {renderStars(false)}
          <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {t("ratings_count", { count: totalRatings })}
        </span>
      </div>

      {/* Rate Course Button (Only for purchased courses) */}
      {hasPurchased && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Star className="w-4 h-4 mr-2" />
              {userRating ? t("update_rating") : t("rate_this_course")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {userRating ? t("update_rating") : t("rate_this_course")}
              </DialogTitle>
              <DialogDescription>
                {t("share_help")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">{t("your_rating")}</label>
                <div className="flex items-center gap-2">
                  {renderStars(true)}
                  {rating > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      {t("star_count", { count: rating })}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  {t("review_label")}
                </label>
                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder={t("review_placeholder")}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
                {isSubmitting ? t("submitting") : t("submit_rating")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};