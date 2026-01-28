import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Coupon, CouponInsert, CouponUpdate } from "@/integrations/supabase/types";

export const useCoupons = () => {
    return useQuery({
        queryKey: ["coupons"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("coupons")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Coupon[];
        },
    });
};

export const useCreateCoupon = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (coupon: CouponInsert) => {
            const { data, error } = await supabase
                .from("coupons")
                .insert(coupon)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons"] });
        },
    });
};

export const useUpdateCoupon = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: CouponUpdate }) => {
            const { data, error } = await supabase
                .from("coupons")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons"] });
        },
    });
};

export const useDeleteCoupon = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("coupons")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons"] });
        },
    });
};
