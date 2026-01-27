import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Review, ReviewInsert, ReviewUpdate } from "@/integrations/supabase/types";

// Fetch approved reviews (public)
export const useApprovedReviews = (cabinId?: number) => {
  return useQuery({
    queryKey: ["reviews", "approved", cabinId],
    queryFn: async () => {
      let query = supabase
        .from("reviews")
        .select(`
          *,
          cabins:cabin_id (
            name_fa,
            name_en
          )
        `)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (cabinId) {
        query = query.eq("cabin_id", cabinId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch featured reviews for homepage
export const useFeaturedReviews = (limit: number = 6) => {
  return useQuery({
    queryKey: ["reviews", "featured", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          cabins:cabin_id (
            name_fa,
            name_en
          )
        `)
        .eq("is_approved", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch all reviews (admin)
export const useAllReviews = () => {
  return useQuery({
    queryKey: ["reviews", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          cabins:cabin_id (
            name_fa,
            name_en
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Create review (public)
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: {
      cabin_id: number;
      guest_name: string;
      guest_phone?: string;
      rating: number;
      title?: string;
      comment: string;
    }) => {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          cabin_id: review.cabin_id,
          guest_name: review.guest_name.trim(),
          guest_phone: review.guest_phone?.replace(/\s/g, ""),
          rating: review.rating,
          title: review.title?.trim(),
          comment: review.comment.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as Review;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};

// Approve/reject review (admin)
export const useApproveReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};

// Toggle featured status (admin)
export const useToggleFeaturedReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase
        .from("reviews")
        .update({ is_featured })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};

// Add admin response (admin)
export const useAddAdminResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const { error } = await supabase
        .from("reviews")
        .update({
          admin_response: response.trim(),
          admin_response_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};

// Delete review (admin)
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};

// Get average rating for a cabin
export const useCabinAverageRating = (cabinId: number | undefined) => {
  return useQuery({
    queryKey: ["reviews", "rating", cabinId],
    queryFn: async () => {
      if (!cabinId) return null;

      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("cabin_id", cabinId)
        .eq("is_approved", true);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const average = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      return {
        average: Math.round(average * 10) / 10,
        count: data.length,
      };
    },
    enabled: !!cabinId,
  });
};
