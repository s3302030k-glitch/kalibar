import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get allowed origin from environment or default to production domain
const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "https://arasbaran.lodge";

const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CryptoPaymentRequest {
    reservationId: string;
    amount_usd: number;
}

interface VerifyPaymentRequest {
    reservationId: string;
    txHash: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "get-address";

    try {
        if (action === "get-address") {
            // Return the USDT wallet address for payment
            const walletAddress = Deno.env.get("USDT_TRC20_ADDRESS");

            if (!walletAddress) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Crypto payment not configured",
                        code: "WALLET_NOT_CONFIGURED",
                    }),
                    { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const body: CryptoPaymentRequest = await req.json();

            if (!body.reservationId || !body.amount_usd) {
                return new Response(
                    JSON.stringify({ success: false, error: "Missing required fields" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Generate a unique payment reference
            const paymentRef = `USDT-${body.reservationId.slice(0, 8)}-${Date.now()}`;

            // Update reservation with pending crypto payment
            const { error: updateError } = await supabase
                .from("reservations")
                .update({
                    payment_method: "crypto_usdt",
                    payment_status: "pending",
                    payment_reference: paymentRef,
                    internal_notes: `Awaiting USDT payment of $${body.amount_usd} to ${walletAddress}`,
                })
                .eq("id", body.reservationId);

            if (updateError) {
                console.error("Update error:", updateError);
                return new Response(
                    JSON.stringify({ success: false, error: "Failed to update reservation" }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Send notification to admin
            await supabase.functions.invoke("send-notification", {
                body: {
                    type: "new_reservation",
                    title: "رزرو جدید - پرداخت کریپتو",
                    message: `یک رزرو جدید با پرداخت USDT ثبت شد. مبلغ: $${body.amount_usd}`,
                    metadata: {
                        "شناسه رزرو": body.reservationId,
                        "مبلغ": `$${body.amount_usd} USDT`,
                        "آدرس کیف پول": walletAddress,
                        "کد پیگیری": paymentRef,
                    },
                },
            });

            return new Response(
                JSON.stringify({
                    success: true,
                    walletAddress: walletAddress,
                    network: "TRC20",
                    amount: body.amount_usd,
                    currency: "USDT",
                    paymentReference: paymentRef,
                    instructions: {
                        fa: [
                            `مبلغ دقیق ${body.amount_usd} USDT را به آدرس زیر ارسال کنید:`,
                            `آدرس: ${walletAddress}`,
                            `شبکه: TRC20 (Tron)`,
                            `پس از ارسال، هش تراکنش را یادداشت کنید.`,
                            `تیم ما در کمتر از ۲۴ ساعت پرداخت را تأیید می‌کند.`,
                        ],
                        en: [
                            `Send exactly ${body.amount_usd} USDT to the address below:`,
                            `Address: ${walletAddress}`,
                            `Network: TRC20 (Tron)`,
                            `After sending, note down the transaction hash.`,
                            `Our team will verify the payment within 24 hours.`,
                        ],
                    },
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (action === "submit-txhash") {
            // Guest submits their transaction hash for verification
            const body: VerifyPaymentRequest = await req.json();

            if (!body.reservationId || !body.txHash) {
                return new Response(
                    JSON.stringify({ success: false, error: "Missing required fields" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Validate transaction hash format (TRC20 tx hash is 64 hex characters)
            const txHashRegex = /^[a-fA-F0-9]{64}$/;
            if (!txHashRegex.test(body.txHash)) {
                return new Response(
                    JSON.stringify({ success: false, error: "Invalid transaction hash format" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Get reservation details
            const { data: reservation, error: fetchError } = await supabase
                .from("reservations")
                .select("*, cabins:cabin_id(name_fa, name_en)")
                .eq("id", body.reservationId)
                .single();

            if (fetchError || !reservation) {
                return new Response(
                    JSON.stringify({ success: false, error: "Reservation not found" }),
                    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Update reservation with transaction hash
            const { error: updateError } = await supabase
                .from("reservations")
                .update({
                    payment_reference: body.txHash,
                    internal_notes: `USDT TX Hash submitted: ${body.txHash}\nAwaiting manual verification.`,
                })
                .eq("id", body.reservationId);

            if (updateError) {
                return new Response(
                    JSON.stringify({ success: false, error: "Failed to update reservation" }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Create notification for admin to verify
            await supabase.from("notifications").insert({
                type: "payment_received",
                title: "تراکنش کریپتو جهت بررسی",
                message: `مهمان ${reservation.guest_name} هش تراکنش USDT را ارسال کرده است. لطفاً تأیید کنید.`,
                metadata: {
                    reservation_id: body.reservationId,
                    tx_hash: body.txHash,
                    amount_usd: reservation.calculated_price_usd,
                    guest_name: reservation.guest_name,
                    cabin_name: reservation.cabins?.name_fa,
                },
            });

            // Send notification
            await supabase.functions.invoke("send-notification", {
                body: {
                    type: "payment_received",
                    title: "تراکنش کریپتو جهت تأیید",
                    message: `مهمان ${reservation.guest_name} هش تراکنش را ارسال کرد.`,
                    metadata: {
                        "نام مهمان": reservation.guest_name,
                        "کلبه": reservation.cabins?.name_fa,
                        "مبلغ": `$${reservation.calculated_price_usd} USDT`,
                        "هش تراکنش": body.txHash,
                        "لینک بررسی": `https://tronscan.org/#/transaction/${body.txHash}`,
                    },
                },
            });

            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Transaction hash submitted successfully. We will verify it within 24 hours.",
                    verificationLink: `https://tronscan.org/#/transaction/${body.txHash}`,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: false, error: "Invalid action" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Crypto payment error:", error);
        return new Response(
            JSON.stringify({ success: false, error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
