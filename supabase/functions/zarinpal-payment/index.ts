import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get allowed origin from environment or default to production domain
const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "https://arasbaran.lodge";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  amount: number; // Amount in Rials
  description: string;
  callbackUrl: string;
  reservationId: string;
  mobile?: string;
  email?: string;
}

interface VerifyRequest {
  authority: string;
  reservationId: string;
  // Note: amount is now fetched from DB, not trusted from client
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const merchantId = Deno.env.get("ZARINPAL_MERCHANT_ID");

    if (!merchantId) {
      console.error("ZARINPAL_MERCHANT_ID is not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment gateway is not configured. Please contact support.",
          code: "MERCHANT_NOT_CONFIGURED",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "create";

    if (action === "create") {
      const body: PaymentRequest = await req.json();
      const { amount, description, callbackUrl, reservationId, mobile, email } = body;

      if (!amount || !callbackUrl || !reservationId) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create payment request to Zarinpal
      const zarinpalResponse = await fetch("https://api.zarinpal.com/pg/v4/payment/request.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount: amount,
          description: description || "رزرو اقامتگاه جنگلی ارسباران",
          callback_url: callbackUrl,
          metadata: {
            reservation_id: reservationId,
            mobile: mobile,
            email: email,
          },
        }),
      });

      const zarinpalData = await zarinpalResponse.json();

      if (zarinpalData.data?.code === 100) {
        // Update reservation status
        await supabase
          .from("reservations")
          .update({
            payment_method: "online_zarinpal",
            payment_status: "pending",
            payment_reference: zarinpalData.data.authority,
          })
          .eq("id", reservationId);

        return new Response(
          JSON.stringify({
            success: true,
            authority: zarinpalData.data.authority,
            paymentUrl: `https://www.zarinpal.com/pg/StartPay/${zarinpalData.data.authority}`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.error("Zarinpal error:", zarinpalData);
        return new Response(
          JSON.stringify({
            success: false,
            error: zarinpalData.errors?.message || "Payment creation failed",
            code: zarinpalData.data?.code,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (action === "verify") {
      const body: VerifyRequest = await req.json();
      const { authority, reservationId } = body;

      if (!authority || !reservationId) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing authority or reservationId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // SECURITY FIX: Fetch the actual amount from database instead of trusting client
      const { data: reservation, error: fetchError } = await supabase
        .from("reservations")
        .select("calculated_price_irr, guest_name, cabins:cabin_id(name_fa)")
        .eq("id", reservationId)
        .single();

      if (fetchError || !reservation) {
        return new Response(
          JSON.stringify({ success: false, error: "Reservation not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Convert Toman to Rial for Zarinpal verification
      const amount = reservation.calculated_price_irr * 10;

      // Verify payment with Zarinpal
      const verifyResponse = await fetch("https://api.zarinpal.com/pg/v4/payment/verify.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          authority: authority,
          amount: amount,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.data?.code === 100 || verifyData.data?.code === 101) {
        // Payment successful - update reservation
        await supabase
          .from("reservations")
          .update({
            status: "confirmed",
            payment_status: "paid",
            payment_reference: verifyData.data.ref_id.toString(),
            payment_verified_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", reservationId);

        // Create notification
        await supabase.from("notifications").insert({
          type: "payment_received",
          title: "پرداخت موفق - زرین‌پال",
          message: `مهمان ${reservation.guest_name} مبلغ ${(amount / 10).toLocaleString()} تومان پرداخت کرد.`,
          metadata: {
            reservation_id: reservationId,
            ref_id: verifyData.data.ref_id,
            amount: amount,
            guest_name: reservation.guest_name,
            cabin_name: reservation.cabins?.name_fa,
          },
        });

        // Send notification
        await supabase.functions.invoke("send-notification", {
          body: {
            type: "payment_received",
            title: "پرداخت موفق",
            message: `مهمان ${reservation.guest_name} مبلغ ${(amount / 10).toLocaleString()} تومان پرداخت کرد.`,
            metadata: {
              "نام مهمان": reservation.guest_name,
              "کلبه": reservation.cabins?.name_fa,
              "مبلغ": `${(amount / 10).toLocaleString()} تومان`,
              "شماره پیگیری": verifyData.data.ref_id,
            },
          },
        });

        return new Response(
          JSON.stringify({
            success: true,
            refId: verifyData.data.ref_id,
            cardPan: verifyData.data.card_pan,
            cardHash: verifyData.data.card_hash,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Payment failed - update status
        await supabase
          .from("reservations")
          .update({
            payment_status: "failed",
            status: "pending",
          })
          .eq("id", reservationId);

        return new Response(
          JSON.stringify({
            success: false,
            error: "Payment verification failed",
            code: verifyData.data?.code,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
