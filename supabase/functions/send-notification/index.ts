import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers - allow all origins since this is called from Supabase client
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
    type: "new_reservation" | "payment_received" | "new_review" | "reservation_cancelled";
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
}

// Send Telegram notification
async function sendTelegramNotification(message: string): Promise<boolean> {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");

    if (!botToken || !chatId) {
        console.log("Telegram not configured, skipping...");
        return false;
    }

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: "HTML",
                }),
            }
        );

        const result = await response.json();
        return result.ok;
    } catch (error) {
        console.error("Telegram error:", error);
        return false;
    }
}

// Send Email notification via Resend
async function sendEmailNotification(
    subject: string,
    htmlContent: string
): Promise<boolean> {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const toEmail = Deno.env.get("ADMIN_EMAIL") || "admin@arasbaran.lodge";

    if (!apiKey) {
        console.log("Resend not configured, skipping email...");
        return false;
    }

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "Arasbaran Lodge <notifications@arasbaran.lodge>",
                to: [toEmail],
                subject: subject,
                html: htmlContent,
            }),
        });

        return response.ok;
    } catch (error) {
        console.error("Email error:", error);
        return false;
    }
}

// Format notification for Telegram
function formatTelegramMessage(payload: NotificationPayload): string {
    const icons: Record<string, string> = {
        new_reservation: "🎉",
        payment_received: "💰",
        new_review: "⭐",
        reservation_cancelled: "❌",
    };

    const icon = icons[payload.type] || "🔔";
    let message = `${icon} <b>${payload.title}</b>\n\n${payload.message}`;

    if (payload.metadata) {
        message += "\n\n<i>جزئیات:</i>";
        for (const [key, value] of Object.entries(payload.metadata)) {
            if (value !== undefined && value !== null) {
                message += `\n• ${key}: ${value}`;
            }
        }
    }

    message += `\n\n🕐 ${new Date().toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}`;

    return message;
}

// Format email HTML
function formatEmailHtml(payload: NotificationPayload): string {
    const colors: Record<string, string> = {
        new_reservation: "#10B981",
        payment_received: "#3B82F6",
        new_review: "#F59E0B",
        reservation_cancelled: "#EF4444",
    };

    const color = colors[payload.type] || "#6B7280";

    let metadataHtml = "";
    if (payload.metadata) {
        metadataHtml = '<table style="margin-top: 16px; border-collapse: collapse;">';
        for (const [key, value] of Object.entries(payload.metadata)) {
            if (value !== undefined && value !== null) {
                metadataHtml += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; color: #6B7280;">${key}</td>
            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; font-weight: 500;">${value}</td>
          </tr>
        `;
            }
        }
        metadataHtml += "</table>";
    }

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Tahoma, Arial, sans-serif; background-color: #F3F4F6; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background-color: ${color}; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${payload.title}</h1>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">${payload.message}</p>
          ${metadataHtml}
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            اقامتگاه جنگلی ارسباران<br>
            ${new Date().toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const payload: NotificationPayload = await req.json();

        if (!payload.type || !payload.title || !payload.message) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing required fields" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Send notifications in parallel
        const [telegramResult, emailResult] = await Promise.all([
            sendTelegramNotification(formatTelegramMessage(payload)),
            sendEmailNotification(
                `[${payload.type}] ${payload.title}`,
                formatEmailHtml(payload)
            ),
        ]);

        return new Response(
            JSON.stringify({
                success: true,
                telegram: telegramResult,
                email: emailResult,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Notification error:", error);
        return new Response(
            JSON.stringify({ success: false, error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
