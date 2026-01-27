// Telegram notification utility
// NOTE: In production, these should be environment variables

interface TelegramConfig {
    botToken: string;
    chatId: string;
}

interface NotificationPayload {
    type: 'new_reservation' | 'payment_received' | 'cancelled';
    title: string;
    message: string;
    metadata?: Record<string, string | number | undefined>;
}

// Get config from environment or use empty (disabled)
const getTelegramConfig = (): TelegramConfig | null => {
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.warn('Telegram not configured. Set VITE_TELEGRAM_BOT_TOKEN and VITE_TELEGRAM_CHAT_ID in .env');
        return null;
    }

    return { botToken, chatId };
};

// Format message for Telegram
const formatTelegramMessage = (payload: NotificationPayload): string => {
    const icons: Record<string, string> = {
        new_reservation: '🎉',
        payment_received: '💰',
        cancelled: '❌',
    };

    const icon = icons[payload.type] || '🔔';
    let message = `${icon} <b>${payload.title}</b>\n\n${payload.message}`;

    if (payload.metadata) {
        message += '\n\n<i>جزئیات:</i>';
        for (const [key, value] of Object.entries(payload.metadata)) {
            if (value !== undefined && value !== null) {
                message += `\n• ${key}: ${value}`;
            }
        }
    }

    const tehranTime = new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });
    message += `\n\n🕐 ${tehranTime}`;

    return message;
};

// Send notification to Telegram
export const sendTelegramNotification = async (payload: NotificationPayload): Promise<boolean> => {
    const config = getTelegramConfig();

    if (!config) {
        return false;
    }

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${config.botToken}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: config.chatId,
                    text: formatTelegramMessage(payload),
                    parse_mode: 'HTML',
                }),
            }
        );

        const result = await response.json();

        if (!result.ok) {
            console.error('Telegram API error:', result);
            return false;
        }

        console.log('Telegram notification sent successfully');
        return true;
    } catch (error) {
        console.error('Telegram send error:', error);
        return false;
    }
};

// Convenience function for new reservation notification
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
    return sendTelegramNotification({
        type: 'new_reservation',
        title: 'رزرو جدید ثبت شد',
        message: `رزرو جدید برای ${data.cabinName} از ${data.guestName}`,
        metadata: {
            'کلبه': data.cabinName,
            'مهمان': data.guestName,
            'تلفن': data.guestPhone,
            'ورود': data.checkIn,
            'خروج': data.checkOut,
            'شب‌ها': data.nights,
            'مبلغ': data.totalPrice,
            'پرداخت': data.paymentMethod,
        },
    });
};
