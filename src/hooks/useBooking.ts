import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useEffect } from "react";
import type {
    Reservation,
    ReservationUpdate,
    PaymentMethod,
    CreateReservationResponse
} from "@/integrations/supabase/types";


// Types for booking
export interface BookingRequest {
    cabinId: number;
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
    guestsCount: number;
    checkIn: Date;
    checkOut: Date;
    paymentMethod: PaymentMethod;
    couponCode?: string;
}

export interface PriceCalculation {
    total_irr: number;
    total_usd: number;
    nights: number;
}

export interface CouponValidationResponse {
    valid: boolean;
    message?: string;
    code?: string;
    discount_amount?: number;
    final_price?: number;
    type?: 'percent' | 'fixed';
    value?: number;
}

// Validate coupon hook
export const useValidateCoupon = () => {
    return useMutation({
        mutationFn: async ({ code, totalAmount }: { code: string; totalAmount: number }): Promise<CouponValidationResponse> => {
            const { data, error } = await supabase
                .rpc("validate_coupon", {
                    p_code: code,
                    p_total_amount: totalAmount,
                });

            if (error) {
                console.error("Error validating coupon:", error);
                throw error;
            }

            return data as unknown as CouponValidationResponse;
        }
    });
};

// Fetch reservations for a specific cabin (for availability calendar)
export const useReservations = (cabinId?: number) => {
    return useQuery({
        queryKey: ["reservations", cabinId],
        queryFn: async () => {
            let query = supabase
                .from("reservations")
                .select("id, cabin_id, check_in_date, check_out_date, status")
                .in("status", ["pending", "pending_payment", "confirmed"]);

            if (cabinId) {
                query = query.eq("cabin_id", cabinId);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching reservations:", error);
                throw error;
            }

            return data;
        },
        staleTime: 30 * 1000,
    });
};

// Fetch booked dates specifically (Publicly accessible via RPC)
export const useCabinBookedDates = (cabinId: number | undefined) => {
    const queryClient = useQueryClient();

    // Realtime subscription
    useEffect(() => {
        if (!cabinId) return;

        const channel = supabase
            .channel('realtime-reservations')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reservations',
                    filter: `cabin_id=eq.${cabinId}`
                },
                () => {
                    // console.log("Reservation changed, invalidating calendar...");
                    queryClient.invalidateQueries({ queryKey: ["booked-dates", cabinId] });
                    queryClient.invalidateQueries({ queryKey: ["reservations", cabinId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [cabinId, queryClient]);

    return useQuery({
        queryKey: ["booked-dates", cabinId],
        queryFn: async () => {
            if (!cabinId) return { bookedDates: [], startDates: [] };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase.rpc as any)("get_cabin_booked_dates", { p_cabin_id: cabinId });

            if (error) {
                console.error("Error fetching booked dates:", error);
                return { bookedDates: [], startDates: [] };
            }

            const rawData = data as any || [];
            const bookedDates = getBookedDates(rawData);

            // Extract start dates for check-out logic
            const startDates = rawData.map((r: any) => {
                const [y, m, d] = r.check_in_date.split('-').map(Number);
                return new Date(y, m - 1, d);
            });

            return { bookedDates, startDates };
        },
        enabled: !!cabinId,
        staleTime: 60 * 1000,
    });
};

// Fetch all reservations (admin)
export const useAllReservations = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ["reservations", "all"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("reservations")
                .select(`
          *,
          cabins:cabin_id (
            name_fa,
            name_en
          )
        `)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching all reservations:", error);
                throw error;
            }

            return data;
        },
        staleTime: 60 * 1000, // Data remains fresh for 1 minute
        refetchOnWindowFocus: false, // Don't refetch when clicking back on window
        retry: 1, // Don't retry too many times if auth fails
        enabled: options?.enabled !== undefined ? options.enabled : true,
    });
};

// Calculate price for dates (uses database function)
export const useCalculatePrice = (cabinId: number | undefined, checkIn: Date | undefined, checkOut: Date | undefined) => {
    return useQuery({
        queryKey: ["price", cabinId, checkIn?.toISOString(), checkOut?.toISOString()],
        queryFn: async (): Promise<PriceCalculation | null> => {
            if (!cabinId || !checkIn || !checkOut) return null;

            const { data, error } = await supabase
                .rpc("calculate_reservation_price", {
                    p_cabin_id: cabinId,
                    p_check_in: format(checkIn, "yyyy-MM-dd"),
                    p_check_out: format(checkOut, "yyyy-MM-dd"),
                });

            if (error) {
                console.error("Error calculating price:", error);
                throw error;
            }

            return data?.[0] || null;
        },
        enabled: !!cabinId && !!checkIn && !!checkOut,
    });
};

// Check availability (uses database function)
export const useCheckAvailability = (cabinId: number | undefined, checkIn: Date | undefined, checkOut: Date | undefined) => {
    return useQuery({
        queryKey: ["availability", cabinId, checkIn?.toISOString(), checkOut?.toISOString()],
        queryFn: async (): Promise<boolean> => {
            if (!cabinId || !checkIn || !checkOut) return false;

            const { data, error } = await supabase
                .rpc("check_availability", {
                    p_cabin_id: cabinId,
                    p_check_in: format(checkIn, "yyyy-MM-dd"),
                    p_check_out: format(checkOut, "yyyy-MM-dd"),
                });

            if (error) {
                console.error("Error checking availability:", error);
                throw error;
            }

            return data ?? false;
        },
        enabled: !!cabinId && !!checkIn && !!checkOut,
    });
};

// Create reservation securely (uses database function)
export const useCreateReservation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (booking: BookingRequest): Promise<CreateReservationResponse> => {
            const { data, error } = await supabase
                .rpc("create_reservation", {
                    p_cabin_id: booking.cabinId,
                    p_guest_name: booking.guestName.trim(),
                    p_guest_phone: booking.guestPhone.replace(/\s/g, ""),
                    p_guest_email: booking.guestEmail?.trim() || "",
                    p_guests_count: booking.guestsCount,
                    p_check_in: format(booking.checkIn, "yyyy-MM-dd"),
                    p_check_out: format(booking.checkOut, "yyyy-MM-dd"),
                    p_payment_method: booking.paymentMethod,
                    p_coupon_code: booking.couponCode,
                });

            if (error) {
                console.error("Error creating reservation:", error);
                throw error;
            }

            return data as CreateReservationResponse;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["reservations"] });
            queryClient.invalidateQueries({ queryKey: ["reservations", variables.cabinId] });
            queryClient.invalidateQueries({ queryKey: ["booked-dates", variables.cabinId] }); // Invalidate new hook
            queryClient.invalidateQueries({ queryKey: ["availability"] });
        },
    });
};

// Update reservation (admin)
export const useUpdateReservation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: ReservationUpdate }) => {
            const { data, error } = await supabase
                .from("reservations")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as Reservation;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reservations"] });
        },
    });
};

// Confirm reservation (admin)
export const useConfirmReservation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("reservations")
                .update({
                    status: "confirmed",
                    confirmed_at: new Date().toISOString(),
                })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reservations"] });
        },
    });
};

// Cancel reservation (admin)
export const useCancelReservation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
            const { error } = await supabase
                .from("reservations")
                .update({
                    status: "cancelled",
                    cancelled_at: new Date().toISOString(),
                    admin_notes: reason,
                })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reservations"] });
        },
    });
};

// Verify payment (admin)
export const useVerifyPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, reference }: { id: string; reference: string }) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from("reservations")
                .update({
                    payment_status: "paid",
                    payment_reference: reference,
                    payment_verified_at: new Date().toISOString(),
                    payment_verified_by: user?.id,
                    status: "confirmed",
                    confirmed_at: new Date().toISOString(),
                })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reservations"] });
        },
    });
};

// Helper: Get booked dates for calendar
export const getBookedDates = (reservations: { check_in_date: string; check_out_date: string }[]): Date[] => {
    const bookedDates: Date[] = [];

    reservations.forEach((reservation) => {
        // Parse YYYY-MM-DD manually to ensure local midnight and avoid UTC shifts
        const [startYear, startMonth, startDay] = reservation.check_in_date.split('-').map(Number);
        const [endYear, endMonth, endDay] = reservation.check_out_date.split('-').map(Number);

        // Create dates using local time constructor (Month is 0-indexed)
        const checkIn = new Date(startYear, startMonth - 1, startDay);
        const checkOut = new Date(endYear, endMonth - 1, endDay);

        const currentDate = new Date(checkIn);
        while (currentDate < checkOut) {
            bookedDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    return bookedDates;
};

// Helper: Check if a date is booked
export const isDateBooked = (date: Date, bookedDates: Date[]): boolean => {
    return bookedDates.some(
        (bookedDate) =>
            bookedDate.getFullYear() === date.getFullYear() &&
            bookedDate.getMonth() === date.getMonth() &&
            bookedDate.getDate() === date.getDate()
    );
};
