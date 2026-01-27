import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [refId, setRefId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const authority = searchParams.get("Authority");
      const paymentStatus = searchParams.get("Status");
      const reservationId = searchParams.get("reservationId");
      const amount = searchParams.get("amount");

      if (paymentStatus !== "OK" || !authority) {
        setStatus("failed");
        setError(t("payment.cancelled"));
        return;
      }

      try {
        // Verify payment using Edge Function
        // The Edge Function handles updating reservation status automatically
        const response = await supabase.functions.invoke("zarinpal-payment", {
          body: {
            authority,
            amount: parseInt(amount || "0"),
            reservationId,
          },
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = response.data;

        if (data?.success) {
          setRefId(data.refId);
          setStatus("success");
          // Reservation is already updated by the Edge Function
        } else {
          setStatus("failed");
          setError(data?.error || t("payment.verifyFailed"));
        }
      } catch (err) {
        console.error("Payment verification error:", err);
        setStatus("failed");
        setError(t("payment.error"));
      }
    };

    verifyPayment();
  }, [searchParams, t]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl p-8 shadow-lg text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-forest-medium animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">
              {t("payment.verifying")}
            </h1>
            <p className="text-muted-foreground">{t("payment.pleaseWait")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 bg-forest-medium/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-forest-medium" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              {t("payment.success")}
            </h1>
            <p className="text-muted-foreground mb-4">
              {t("payment.successDesc")}
            </p>
            {refId && (
              <div className="bg-secondary p-4 rounded-xl mb-6">
                <p className="text-sm text-muted-foreground mb-1">
                  {t("payment.refId")}
                </p>
                <p className="text-lg font-bold text-forest-medium" dir="ltr">
                  {refId}
                </p>
              </div>
            )}
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-forest-medium hover:bg-forest-deep text-primary-foreground py-6 rounded-xl"
            >
              {t("payment.backToHome")}
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              {t("payment.failed")}
            </h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-forest-medium hover:bg-forest-deep text-primary-foreground py-6 rounded-xl"
            >
              {t("payment.backToHome")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
