// ============================================
// DEPRECATED: Use useBooking.ts instead
// This file is kept for backward compatibility
// ============================================

export {
  useReservations,
  useAllReservations,
  useCreateReservation,
  useUpdateReservation,
  useConfirmReservation,
  useCancelReservation,
  useVerifyPayment,
  useCalculatePrice,
  useCheckAvailability,
  getBookedDates,
  isDateBooked,
} from './useBooking';

export type {
  BookingRequest,
  PriceCalculation
} from './useBooking';

// Legacy type for backward compatibility
export interface Reservation {
  id: string;
  cabin_id: number;
  guest_name: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  total_price: number | null;
  status: string;
  created_at: string;
}
