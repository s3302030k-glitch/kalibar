// SAFE STUB for Telegram notification utility
// Original file moved to __deprecated__/telegram.ts
// This stub ensures BookingModal.tsx continues to build without errors.

export interface TelegramConfig {
    botToken: string;
    chatId: string;
}

export interface NotificationPayload {
    type: 'new_reservation' | 'payment_received' | 'cancelled';
    title: string;
    message: string;
    metadata?: Record<string, string | number | undefined>;
}

export const sendTelegramNotification = async (payload: NotificationPayload): Promise<boolean> => {
    console.warn('Telegram notifications are disabled on the frontend for security.', payload);
    return Promise.resolve(true); // Return true to prevent UI errors
};

export const notifyNewReservation = async (data: {
    cabinName: string;
    guestName: string;
    guestPhone: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    totalPrice: string;
    paymentMethod: string;
}): Promise<boolean> => {
    console.warn('Telegram notifications are disabled on the frontend.', data);
    return Promise.resolve(true);
};
