import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Cabin, CabinInsert, CabinUpdate } from "@/integrations/supabase/types";

// Fetch all available cabins
export const useCabins = () => {
    return useQuery({
        queryKey: ["cabins"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("cabins")
                .select("*")
                .eq("is_available", true)
                .order("sort_order", { ascending: true });

            if (error) {
                console.error("Error fetching cabins:", error);
                throw error;
            }

            return data as Cabin[];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes - cabins don't change often
    });
};

// Fetch all cabins (admin)
export const useAllCabins = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ["cabins", "all"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("cabins")
                .select("*")
                .order("sort_order", { ascending: true });

            if (error) {
                console.error("Error fetching all cabins:", error);
                throw error;
            }

            return data as Cabin[];
        },
        enabled: options?.enabled !== undefined ? options.enabled : true,
    });
};

// Fetch single cabin by ID
export const useCabin = (id: number | undefined) => {
    return useQuery({
        queryKey: ["cabins", id],
        queryFn: async () => {
            if (!id) return null;

            const { data, error } = await supabase
                .from("cabins")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                console.error("Error fetching cabin:", error);
                throw error;
            }

            return data as Cabin;
        },
        enabled: !!id,
    });
};

// Fetch cabin by slug
export const useCabinBySlug = (slug: string | undefined) => {
    return useQuery({
        queryKey: ["cabins", "slug", slug],
        queryFn: async () => {
            if (!slug) return null;

            const { data, error } = await supabase
                .from("cabins")
                .select("*")
                .eq("slug", slug)
                .single();

            if (error) {
                console.error("Error fetching cabin by slug:", error);
                throw error;
            }

            return data as Cabin;
        },
        enabled: !!slug,
    });
};

// Create cabin (admin)
export const useCreateCabin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (cabin: CabinInsert) => {
            const { data, error } = await supabase
                .from("cabins")
                .insert(cabin)
                .select()
                .single();

            if (error) throw error;
            return data as Cabin;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cabins"] });
            queryClient.invalidateQueries({ queryKey: ["cabins", "all"] }); // Explicit refresh
        },
    });
};

// Update cabin (admin)
export const useUpdateCabin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: number; updates: CabinUpdate }) => {
            const { data, error } = await supabase
                .from("cabins")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as Cabin;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["cabins"] });
            queryClient.invalidateQueries({ queryKey: ["cabins", "all"] }); // Explicit refresh
            queryClient.invalidateQueries({ queryKey: ["cabins", variables.id] });
        },
    });
};

// Delete cabin (admin)
export const useDeleteCabin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const { error } = await supabase
                .from("cabins")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cabins"] });
            queryClient.invalidateQueries({ queryKey: ["cabins", "all"] }); // Explicit refresh
        },
    });
};

// Toggle cabin availability (admin)
export const useToggleCabinAvailability = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, is_available }: { id: number; is_available: boolean }) => {
            const { error } = await supabase
                .from("cabins")
                .update({ is_available })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cabins"] });
            queryClient.invalidateQueries({ queryKey: ["cabins", "all"] }); // Explicit refresh
        },
    });
};

// Helper hook to get cabin name based on language
export const useCabinName = (cabin: Cabin | null | undefined, isRTL: boolean): string => {
    if (!cabin) return "";
    return isRTL ? cabin.name_fa : cabin.name_en;
};

// Helper hook to get cabin features based on language
export const useCabinFeatures = (cabin: Cabin | null | undefined, isRTL: boolean): string[] => {
    if (!cabin) return [];
    return isRTL ? cabin.features_fa : cabin.features_en;
};
