import { useState, useMemo } from "react";
import type { Cabin } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Users, Phone, User, CheckCircle, Loader2, CalendarIcon, AlertCircle, CreditCard, Wallet, Bitcoin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCabinBookedDates, isDateBooked, useCreateReservation } from "@/hooks/useBooking";
import { useCalculatePrice } from "@/hooks/useBooking";
import { differenceInDays, format, addDays, startOfDay } from "date-fns";
import { cn, toPersianDigits } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import type { PaymentMethod as DBPaymentMethod, CreateReservationResponse } from "@/integrations/supabase/types";
import { notifyNewReservation } from "@/utils/telegram";
import { faIR } from "date-fns-jalali/locale";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";

interface BookingModalProps {
  cabin: Cabin | null;
  isOpen: boolean;
  onClose: () => void;
}

type PaymentMethod = "online" | "paypal" | "crypto" | "location";

const BookingModal = ({ cabin, isOpen, onClose }: BookingModalProps) => {
  const [step, setStep] = useState<"form" | "success">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    guests: "2",
  });

  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { data = { bookedDates: [], startDates: [] } } = useCabinBookedDates(cabin?.id);
  const { bookedDates, startDates } = data;

  const { data: priceData } = useCalculatePrice(cabin?.id, checkInDate, checkOutDate);
  const { mutateAsync: createReservation, isPending: isCreating } = useCreateReservation();

  const cabinName = cabin ? (isRTL ? cabin.name_fa : cabin.name_en) : "";

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    return isDateBooked(date, bookedDates);
  };

  const isCheckOutDisabled = (date: Date) => {
    if (!checkInDate) return true;
    if (date <= checkInDate) return true;
    const currentDate = new Date(checkInDate);
    currentDate.setDate(currentDate.getDate() + 1);
    while (currentDate <= date) {
      if (isDateBooked(currentDate, bookedDates)) {
        return true;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return false;
  };

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    return differenceInDays(checkOutDate, checkInDate);
  }, [checkInDate, checkOutDate]);

  // Use server-calculated prices if available, otherwise use base price
  const totalPrice = priceData?.total_irr ?? (cabin ? nights * cabin.base_price_irr : 0);
  const totalPriceUSD = priceData?.total_usd ?? (cabin ? nights * Number(cabin.base_price_usd) : 0);

  const displayPrice = isRTL ? totalPrice : totalPriceUSD;
  const unitPrice = isRTL ? cabin?.base_price_irr : (cabin ? Number(cabin.base_price_usd) : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !checkInDate || !checkOutDate) {
      toast.error(t("booking.fillAllFields"));
      return;
    }

    if (!cabin) return;

    // Different phone validation for Persian vs English
    if (isRTL) {
      const phoneRegex = /^09\d{9}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        toast.error(t("booking.invalidPhone"));
        return;
      }
    } else {
      // International phone validation (E.164 format or common formats)
      // eslint-disable-next-line no-useless-escape
      const intlPhoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
      if (!intlPhoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        toast.error(t("booking.invalidPhone"));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Map UI payment method to database payment method
      const dbPaymentMethod: DBPaymentMethod =
        paymentMethod === 'online' ? 'online_zarinpal' :
          paymentMethod === 'paypal' ? 'online_paypal' :
            paymentMethod === 'crypto' ? 'crypto_usdt' :
              'cash_on_arrival';

      // Create the reservation using secure database function
      const result = await createReservation({
        cabinId: cabin.id,
        guestName: formData.name,
        guestPhone: formData.phone,
        guestEmail: formData.email,
        guestsCount: parseInt(formData.guests),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        paymentMethod: dbPaymentMethod,
      });



      if (!result.success) {
        console.error('Reservation failed:', result.error);
        // Use i18n for error messages
        const errorKeyMap: Record<string, string> = {
          'CABIN_NOT_AVAILABLE': 'booking.errors.cabinNotAvailable',
          'EXCEEDS_CAPACITY': 'booking.errors.exceedsCapacity',
          'INVALID_CHECK_IN_DATE': 'booking.errors.invalidCheckInDate',
          'INVALID_DATE_RANGE': 'booking.errors.invalidDateRange',
          'DATES_NOT_AVAILABLE': 'booking.errors.datesNotAvailable',
        };
        const errorKey = errorKeyMap[result.error || ''];
        toast.error(errorKey ? t(errorKey) : t("booking.bookingError"));
        return;
      }

      const reservationId = result.reservation_id;

      // Send Telegram notification to admin (async, don't wait)
      notifyNewReservation({
        cabinName,
        guestName: formData.name,
        guestPhone: formData.phone,
        checkIn: checkInDate?.toLocaleDateString('fa-IR-u-ca-persian') || '',
        checkOut: checkOutDate?.toLocaleDateString('fa-IR-u-ca-persian') || '',
        nights,
        totalPrice: `${totalPrice.toLocaleString('fa-IR')} تومان`,
        paymentMethod: paymentMethod === 'location' ? 'در محل' :
          paymentMethod === 'online' ? 'آنلاین' :
            paymentMethod === 'crypto' ? 'کریپتو' : 'PayPal',
      }).catch(() => { /* Notification failed silently */ });

      if (paymentMethod === 'online' && isRTL) {
        // Redirect to Zarinpal payment (Persian only)
        const callbackUrl = `${window.location.origin}/payment/callback?reservationId=${reservationId}&amount=${totalPrice * 10}`;

        const response = await supabase.functions.invoke('zarinpal-payment', {
          body: {
            amount: totalPrice * 10, // Convert to Rials
            description: `${t("booking.title")} ${cabinName} - ${nights} ${t("booking.nights")}`,
            callbackUrl,
            reservationId: reservationId,
            mobile: formData.phone,
          },
        });

        const paymentData = response.data;

        if (paymentData?.success && paymentData?.paymentUrl) {
          toast.info(t("booking.redirectingToPayment"));
          window.location.href = paymentData.paymentUrl;
          return;
        } else if (paymentData?.code === 'MERCHANT_NOT_CONFIGURED') {
          toast.error(t("booking.paymentNotConfigured"));
          setStep("success");
        } else {
          toast.error(t("booking.paymentError"));
          setStep("success");
        }
      } else if (paymentMethod === 'paypal') {
        // PayPal integration - show success and info
        toast.info(t("booking.paypalProcessing"));
        // For now, mark as pending and show success
        // In production, you'd redirect to PayPal
        setStep("success");
      } else if (paymentMethod === 'crypto') {
        // Crypto payment - show success with info
        toast.info(t("booking.cryptoPaymentInfo"));
        setStep("success");
      } else {
        setStep("success");
        toast.success(t("booking.successTitle"));
      }
    } catch (error) {
      console.error('Reservation error:', error);
      toast.error(t("booking.bookingError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setFormData({ name: "", phone: "", email: "", guests: "2" });
    setCheckInDate(undefined);
    setCheckOutDate(undefined);
    setPaymentMethod(isRTL ? "online" : "paypal");
    onClose();
  };

  const formatPriceLocal = (price: number) => {
    return new Intl.NumberFormat(isRTL ? "fa-IR" : "en-US").format(price);
  };

  // Set default payment method based on language
  useMemo(() => {
    if (!isRTL && paymentMethod === "online") {
      setPaymentMethod("paypal");
    } else if (isRTL && (paymentMethod === "paypal" || paymentMethod === "crypto")) {
      setPaymentMethod("online");
    }
  }, [isRTL]);

  if (!cabin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-forest-deep">
            {step === "form" ? `${t("booking.title")} ${cabinName}` : t("booking.successTitle")}
          </DialogTitle>
        </DialogHeader>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Cabin Summary */}
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-secondary rounded-xl">
              <img
                src={cabin.images?.[0] || '/cabin-placeholder.jpg'}
                alt={cabinName}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">
                  {cabinName}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isRTL ? toPersianDigits(cabin.size_sqm) : cabin.size_sqm} {t("cabins.sqm")} | {isRTL ? toPersianDigits(cabin.capacity) : cabin.capacity} {t("cabins.capacity")}
                </p>
                <p className="text-forest-medium font-bold text-sm sm:text-base">
                  {isRTL ? "" : "$"}{formatPriceLocal(unitPrice || 0)} {isRTL && t("cabins.toman")} / {t("cabins.perNight")}
                </p>
              </div>
            </div>

            {/* Booked Dates Notice */}
            {bookedDates.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-gold/10 border border-gold/30 rounded-lg text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gold flex-shrink-0 mt-0.5" />
                <p className="text-foreground">{t("booking.bookedDatesNotice")}</p>
              </div>
            )}

            {/* Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-2 block">
                  <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mx-1" />
                  {t("booking.checkIn")}
                </Label>
                <DatePicker
                  value={checkInDate}
                  onChange={(date: DateObject | null) => {
                    if (date) {
                      const d = date.toDate();
                      setCheckInDate(d);
                      if (checkOutDate && d && checkOutDate <= d) {
                        setCheckOutDate(undefined);
                      }
                    } else {
                      setCheckInDate(undefined);
                    }
                  }}
                  calendar={isRTL ? persian : undefined}
                  locale={isRTL ? persian_fa : undefined}
                  calendarPosition="bottom-center"
                  minDate={new Date()}
                  mapDays={({ date }) => {
                    const d = date.toDate();
                    // Check if booked
                    // Note: isDateBooked expects exact date match
                    const isBlocked = isDateBooked(d, bookedDates);
                    if (isBlocked) {
                      return {
                        disabled: true,
                        style: { color: "#ccc", textDecoration: "line-through", backgroundColor: "rgba(255, 0, 0, 0.1)" }
                      };
                    }
                    return {};
                  }}
                  render={(value, openCalendar) => (
                    <Button
                      type="button" // Prevent form submission
                      variant="outline"
                      onClick={openCalendar}
                      className={cn(
                        "w-full justify-start text-right font-normal rounded-lg h-10 sm:h-11 text-xs sm:text-sm",
                        !checkInDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mx-2 h-3 w-3 sm:h-4 sm:w-4" />
                      {checkInDate ? (isRTL ? new DateObject(checkInDate).convert(persian, persian_fa).format("YYYY/MM/DD") : format(checkInDate, "yyyy/MM/dd")) : t("booking.selectDate")}
                    </Button>
                  )}
                  containerClassName="w-full"
                />
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium mb-2 block">
                  <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mx-1" />
                  {t("booking.checkOut")}
                </Label>
                <DatePicker
                  value={checkOutDate}
                  onChange={(date: DateObject | null) => {
                    if (date) {
                      setCheckOutDate(date.toDate());
                    } else {
                      setCheckOutDate(undefined);
                    }
                  }}
                  calendar={isRTL ? persian : undefined}
                  locale={isRTL ? persian_fa : undefined}
                  calendarPosition="bottom-center"
                  minDate={checkInDate ? startOfDay(addDays(checkInDate, 1)) : new Date()}
                  mapDays={({ date }) => {
                    const d = date.toDate();
                    d.setHours(0, 0, 0, 0); // Force midnight

                    const isBooked = isDateBooked(d, bookedDates);
                    const isNextCheckIn = isDateBooked(d, startDates);

                    if (isBooked && !isNextCheckIn) {
                      return {
                        disabled: true,
                        style: { color: "#ccc", textDecoration: "line-through", backgroundColor: "rgba(255, 0, 0, 0.1)" }
                      };
                    }

                    // Disable dates if there's a booking between check-in and this date
                    if (checkInDate && d > checkInDate) {
                      const currentDate = new Date(checkInDate);
                      currentDate.setDate(currentDate.getDate() + 1);
                      while (currentDate < d) {
                        if (isDateBooked(currentDate, bookedDates)) {
                          return { disabled: true, style: { color: "#ccc" } };
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                      }
                    }

                    return {};
                  }}
                  render={(value, openCalendar) => (
                    <Button
                      type="button" // Prevent form submission
                      variant="outline"
                      onClick={() => checkInDate && openCalendar()}
                      disabled={!checkInDate}
                      className={cn(
                        "w-full justify-start text-right font-normal rounded-lg h-10 sm:h-11 text-xs sm:text-sm",
                        !checkOutDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mx-2 h-3 w-3 sm:h-4 sm:w-4" />
                      {checkOutDate ? (isRTL ? new DateObject(checkOutDate).convert(persian, persian_fa).format("YYYY/MM/DD") : format(checkOutDate, "yyyy/MM/dd")) : t("booking.selectDate")}
                    </Button>
                  )}
                  containerClassName="w-full"
                />
              </div>
            </div>

            {/* Price Summary */}
            {nights > 0 && (
              <div className="p-3 sm:p-4 bg-forest-medium/10 rounded-xl">
                <div className="flex justify-between items-center text-xs sm:text-sm mb-2">
                  <span className="text-muted-foreground">
                    {isRTL ? "" : "$"}{formatPriceLocal(unitPrice || 0)} × {isRTL ? toPersianDigits(nights) : nights} {t("booking.nights")}
                  </span>
                  <span className="text-foreground">
                    {isRTL ? "" : "$"}{formatPriceLocal(displayPrice)} {isRTL && t("cabins.toman")}
                  </span>
                </div>
                <div className="flex justify-between items-center font-bold text-base sm:text-lg border-t border-border pt-2">
                  <span className="text-forest-deep">{t("booking.totalPrice")}</span>
                  <span className="text-forest-medium">{isRTL ? "" : "$"}{formatPriceLocal(displayPrice)} {isRTL && t("cabins.toman")}</span>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="name" className="text-xs sm:text-sm font-medium mb-2 block">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 inline mx-1" />
                  {t("booking.guestName")}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={isRTL ? "مثال: علی محمدی" : "e.g. John Doe"}
                  className="rounded-lg h-10 sm:h-11 text-sm"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs sm:text-sm font-medium mb-2 block">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 inline mx-1" />
                  {t("booking.guestPhone")}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={isRTL ? "09123456789" : "+1 555 123 4567"}
                  className="rounded-lg text-left h-10 sm:h-11 text-sm"
                  dir="ltr"
                  maxLength={isRTL ? 11 : 20}
                />
              </div>

              {/* Email field for international payments */}
              {!isRTL && (
                <div>
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium mb-2 block">
                    📧 Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="rounded-lg text-left h-10 sm:h-11 text-sm"
                    dir="ltr"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="guests" className="text-xs sm:text-sm font-medium mb-2 block">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 inline mx-1" />
                  {t("booking.guests")}
                </Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max={cabin.capacity}
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                  className="rounded-lg h-10 sm:h-11 text-sm"
                />
              </div>

              {/* Payment Method */}
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-3 block">
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 inline mx-1" />
                  {t("booking.paymentMethod")}
                </Label>

                {isRTL ? (
                  // Persian payment options
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all",
                      paymentMethod === "online"
                        ? "border-forest-medium bg-forest-medium/5"
                        : "border-border hover:border-forest-medium/50"
                    )}>
                      <RadioGroupItem value="online" id="online" />
                      <Label htmlFor="online" className="cursor-pointer flex items-center gap-2 text-xs sm:text-sm">
                        <CreditCard className="w-4 h-4 text-forest-medium" />
                        {t("booking.payNow")}
                      </Label>
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all",
                      paymentMethod === "location"
                        ? "border-forest-medium bg-forest-medium/5"
                        : "border-border hover:border-forest-medium/50"
                    )}>
                      <RadioGroupItem value="location" id="location" />
                      <Label htmlFor="location" className="cursor-pointer flex items-center gap-2 text-xs sm:text-sm">
                        <Wallet className="w-4 h-4 text-forest-medium" />
                        {t("booking.payLater")}
                      </Label>
                    </div>
                  </RadioGroup>
                ) : (
                  // English payment options (PayPal, Crypto, Location)
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <div className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all",
                      paymentMethod === "paypal"
                        ? "border-forest-medium bg-forest-medium/5"
                        : "border-border hover:border-forest-medium/50"
                    )}>
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="cursor-pointer flex items-center gap-2 text-xs sm:text-sm">
                        <CreditCard className="w-4 h-4 text-[#003087]" />
                        PayPal
                      </Label>
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all",
                      paymentMethod === "crypto"
                        ? "border-forest-medium bg-forest-medium/5"
                        : "border-border hover:border-forest-medium/50"
                    )}>
                      <RadioGroupItem value="crypto" id="crypto" />
                      <Label htmlFor="crypto" className="cursor-pointer flex items-center gap-2 text-xs sm:text-sm">
                        <Bitcoin className="w-4 h-4 text-[#F7931A]" />
                        {t("booking.payCrypto")}
                      </Label>
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all",
                      paymentMethod === "location"
                        ? "border-forest-medium bg-forest-medium/5"
                        : "border-border hover:border-forest-medium/50"
                    )}>
                      <RadioGroupItem value="location" id="location" />
                      <Label htmlFor="location" className="cursor-pointer flex items-center gap-2 text-xs sm:text-sm">
                        <Wallet className="w-4 h-4 text-forest-medium" />
                        {t("booking.payLater")}
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !checkInDate || !checkOutDate}
              className="w-full bg-forest-medium hover:bg-forest-deep text-primary-foreground py-5 sm:py-6 rounded-xl font-semibold text-sm sm:text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mx-2 animate-spin" />
                  {t("booking.submitting")}
                </>
              ) : paymentMethod === "location" ? (
                t("booking.submit")
              ) : paymentMethod === "paypal" ? (
                "Pay with PayPal"
              ) : paymentMethod === "crypto" ? (
                "Pay with Crypto"
              ) : (
                t("booking.payNow")
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-forest-medium/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-forest-medium" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
              {t("booking.successTitle")}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-2">
              {t("booking.successMessage")}
            </p>
            {(paymentMethod === "crypto") && (
              <p className="text-xs sm:text-sm text-forest-medium mb-2">
                {t("booking.cryptoPaymentInfo")}
              </p>
            )}
            <p className="text-xs sm:text-sm text-forest-medium font-medium mb-4 sm:mb-6">
              {t("booking.totalToPay")}: {isRTL ? "" : "$"}{formatPriceLocal(displayPrice)} {isRTL && t("cabins.toman")}
            </p>
            <Button
              onClick={handleClose}
              className="bg-forest-medium hover:bg-forest-deep text-primary-foreground px-6 sm:px-8 py-5 sm:py-6 rounded-xl"
            >
              {t("booking.close")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
