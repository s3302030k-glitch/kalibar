import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Notification } from "@/integrations/supabase/types";
import { useEffect } from "react";

// Fetch unread notifications count
export const useUnreadNotificationsCount = () => {
    return useQuery({
        queryKey: ["notifications", "unread", "count"],
        queryFn: async () => {
            const { count, error } = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true })
                .eq("is_read", false);

            if (error) {
                console.error("Error fetching notifications count:", error);
                throw error;
            }

            return count || 0;
        },
        refetchInterval: 30 * 1000, // Refresh every 30 seconds
    });
};

// Fetch all notifications
export const useNotifications = (limit: number = 20) => {
    return useQuery({
        queryKey: ["notifications", limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error) {
                console.error("Error fetching notifications:", error);
                throw error;
            }

            return data as Notification[];
        },
    });
};

// Fetch unread notifications
export const useUnreadNotifications = () => {
    return useQuery({
        queryKey: ["notifications", "unread"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("is_read", false)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching unread notifications:", error);
                throw error;
            }

            return data as Notification[];
        },
    });
};

// Mark notification as read
export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from("notifications")
                .update({
                    is_read: true,
                    read_at: new Date().toISOString(),
                    read_by: user?.id,
                })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
};

// Mark all notifications as read
export const useMarkAllNotificationsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from("notifications")
                .update({
                    is_read: true,
                    read_at: new Date().toISOString(),
                    read_by: user?.id,
                })
                .eq("is_read", false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
};

// Delete notification
export const useDeleteNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
};

// Real-time notifications subscription hook
export const useRealtimeNotifications = (onNewNotification?: (notification: Notification) => void) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel("notifications-changes")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                },
                (payload) => {
                    const newNotification = payload.new as Notification;

                    // Invalidate queries to refresh data
                    queryClient.invalidateQueries({ queryKey: ["notifications"] });

                    // Call callback if provided
                    if (onNewNotification) {
                        onNewNotification(newNotification);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient, onNewNotification]);
};

// Mark notification as read by reference ID (reservation_id or review_id)
export const useMarkNotificationReadByReference = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ recordId, type }: { recordId: string; type?: string }) => {
            const { error } = await supabase
                .rpc("mark_notification_read_by_reference", {
                    p_record_id: recordId,
                    p_type: type || null,
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
            queryClient.invalidateQueries({ queryKey: ["notifications", "unread", "count"] });
        },
    });
};

// Get notification icon and color based on type
export const getNotificationStyle = (type: string) => {
    switch (type) {
        case "new_reservation":
            return { icon: "🎉", color: "text-green-600", bg: "bg-green-50" };
        case "new_review":
            return { icon: "⭐", color: "text-yellow-600", bg: "bg-yellow-50" };
        case "payment_received":
            return { icon: "💰", color: "text-blue-600", bg: "bg-blue-50" };
        case "reservation_cancelled":
            return { icon: "❌", color: "text-red-600", bg: "bg-red-50" };
        default:
            return { icon: "🔔", color: "text-gray-600", bg: "bg-gray-50" };
    }
};
