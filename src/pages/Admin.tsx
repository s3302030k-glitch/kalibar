
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  TreePine,
  LogOut,
  Calendar,
  Settings,
  Bell,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Mail,
  Home,
  MessageSquare,
  Loader2,
  RefreshCcw,
  DollarSign,
  Ban,
  Download,
  UserCog,
  Users,
  Tag,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAllReservations, useConfirmReservation, useCancelReservation, useVerifyPayment } from "@/hooks/useBooking";
import { useAllReviews, useApproveReview, useDeleteReview } from "@/hooks/useReviews";
import { useUnreadNotificationsCount, useUnreadNotifications, useMarkNotificationRead, useMarkNotificationReadByReference, getNotificationStyle } from "@/hooks/useNotifications";
import AdminCabins from "@/components/AdminCabins";
import AdminCalendar from "@/components/AdminCalendar";
import AdminStats from "@/components/AdminStats";
import AdminSeasonalPrices from "@/components/AdminSeasonalPrices";
import AdminBlockedDates from "@/components/AdminBlockedDates";
import AdminCoupons from "@/components/AdminCoupons";
import { AdminUsers } from "@/components/AdminUsers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { exportReservationsToExcel } from "@/utils/excelExport";
import type { ReservationStatus, PaymentStatus } from "@/integrations/supabase/types";

const Admin = () => {
  const { user, isAdmin, loading, authReady, isAdminLoading, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  console.log("Admin Page Render:", {
    user: user?.email,
    role: userRole,
    authReady,
    isAdminLoading,
    loading
  });

  const [activeTab, setActiveTab] = useState("reservations");

  const { data: reviews, isLoading: reviewsLoading } = useAllReviews();

  // Destructure isError and refetch for stability
  const {
    data: reservations,
    isLoading: reservationsLoading,
    isError: isReservationsError,
    error: reservationsError,
    refetch: refetchReservations
  } = useAllReservations({ enabled: !!user && !!userRole });

  const { data: unreadNotifications, isLoading: notificationsLoading } = useUnreadNotifications();
  const { data: unreadCount } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationRead();
  const markNotificationReadByReference = useMarkNotificationReadByReference();

  const approveReview = useApproveReview();
  const deleteReview = useDeleteReview();
  const confirmReservation = useConfirmReservation();
  const cancelReservation = useCancelReservation();
  const verifyPayment = useVerifyPayment();

  // Redirect if not admin - only when auth is ready and admin check is done
  useEffect(() => {
    // Wait for auth to be ready and admin loading to finish
    if (!authReady || isAdminLoading) return;

    // If user has any role, allow access
    if (user && userRole) return;

    // If user is logged in but has no role (DB permission issue?)
    if (user && !userRole && authReady && !isAdminLoading) {
      console.warn("User logged in but no role found. Check DB permissions.");
      // Do NOT redirect immediately to avoid loops, just let the UI below handle it
      return;
    }

    // Otherwise redirect to login
    navigate("/admin/login", { replace: true });
  }, [user, userRole, authReady, isAdminLoading, navigate]);

  // Refetch data when admin status is confirmed
  useEffect(() => {
    if (user && userRole) {
      refetchReservations();
    }
  }, [user, userRole, refetchReservations]);

  // Handle Auth Errors (Auto Logout)
  useEffect(() => {
    if (isReservationsError) {
      console.error("Reservations Fetch Error:", reservationsError);
      // Optional: Force logout if it's an auth error (401/403)
      const error = reservationsError as unknown as { code?: string, message?: string };
      if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
        toast.error("نشست کاربری منقضی شد. لطفاً مجدداً وارد شوید.");
        signOut().then(() => navigate("/admin/login"));
      }
    }
  }, [isReservationsError, reservationsError, signOut, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const handleApproveReview = async (id: string, approve: boolean) => {
    try {
      await approveReview.mutateAsync({ id, is_approved: approve });
      if (approve) {
        await markNotificationReadByReference.mutateAsync({ recordId: id, type: 'new_review' });
      }
      toast.success(approve ? "نظر تأیید شد" : "تأیید نظر لغو شد");
    } catch (error) {
      toast.error("خطا در انجام عملیات");
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("آیا از حذف این نظر مطمئن هستید؟")) return;
    try {
      await deleteReview.mutateAsync(id);
      toast.success("نظر حذف شد");
    } catch (error) {
      toast.error("خطا در حذف نظر");
    }
  };

  const handleConfirmReservation = async (id: string) => {
    try {
      await confirmReservation.mutateAsync(id);
      await markNotificationReadByReference.mutateAsync({ recordId: id, type: 'new_reservation' });
      toast.success("رزرو تأیید شد");
    } catch (error) {
      toast.error("خطا در تأیید رزرو");
    }
  };

  const handleCancelReservation = async (id: string) => {
    const reason = prompt("دلیل لغو (اختیاری):");
    try {
      await cancelReservation.mutateAsync({ id, reason: reason || undefined });
      toast.success("رزرو لغو شد");
    } catch (error) {
      toast.error("خطا در لغو رزرو");
    }
  };

  const handleVerifyPayment = async (id: string) => {
    const reference = prompt("شماره پیگیری / هش تراکنش:");
    if (!reference) return;
    try {
      await verifyPayment.mutateAsync({ id, reference });
      await markNotificationReadByReference.mutateAsync({ recordId: id, type: 'new_reservation' });
      toast.success("پرداخت تأیید و رزرو تکمیل شد");
    } catch (error) {
      toast.error("خطا در تأیید پرداخت");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fa-IR").format(price);
  };

  const getStatusBadge = (status: ReservationStatus) => {
    const config: Record<ReservationStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "در انتظار تأیید" },
      pending_payment: { variant: "outline", label: "در انتظار پرداخت" },
      confirmed: { variant: "default", label: "تأیید شده" },
      cancelled: { variant: "destructive", label: "لغو شده" },
      completed: { variant: "default", label: "اتمام اقامت" },
    };
    return config[status] || { variant: "secondary", label: status };
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    const config: Record<PaymentStatus, { color: string; label: string }> = {
      unpaid: { color: "text-gray-500", label: "پرداخت نشده" },
      pending: { color: "text-yellow-600", label: "در انتظار تأیید" },
      paid: { color: "text-green-600", label: "پرداخت شده" },
      refunded: { color: "text-blue-600", label: "برگشت داده شده" },
      failed: { color: "text-red-600", label: "ناموفق" },
    };
    return config[status] || { color: "text-gray-500", label: status };
  };

  // Show loading while auth is initializing or user data is being fetched
  if (!authReady || loading || (user && !userRole)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background flex-col gap-4" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">در حال آماده‌سازی پنل مدیریت...</p>
      </div>
    );
  }

  // Prevent flash of content if not authorized (redirect handles navigation)
  if (!user || !userRole) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-forest-deep text-primary-foreground py-4 px-6 shadow-medium">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-white/10 rounded-xl backdrop-blur-sm">
              <img src="/logo.png" alt="Admin Logo" className="w-8 h-8 object-contain brightness-0 invert" />
            </div>
            <div>
              <h1 className="font-bold">پنل مدیریت</h1>
              <p className="text-sm text-primary-foreground/70">
                اقامتگاه جنگلی ارسباران
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5 text-primary-foreground" />
                  {unreadCount && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between p-2 border-b">
                  <span className="font-bold text-sm">اعلان‌های جدید</span>
                  <span className="text-xs text-muted-foreground">{unreadCount || 0} مورد</span>
                </div>
                {notificationsLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  </div>
                ) : unreadNotifications && unreadNotifications.length > 0 ? (
                  unreadNotifications.map((notif) => {
                    const style = getNotificationStyle(notif.type);
                    return (
                      <DropdownMenuItem
                        key={notif.id}
                        className="flex items-start gap-3 p-3 cursor-pointer focus:bg-accent"
                        onClick={() => {
                          markAsRead.mutate(notif.id);
                          // If it's a reservation, switch to reservations tab
                          if (notif.type === 'new_reservation' || notif.type === 'reservation_cancelled') {
                            setActiveTab("reservations");
                          }
                        }}
                      >
                        <div className={`p-2 rounded-full flex-shrink-0 ${style.bg} `}>
                          <span className="text-lg">{style.icon}</span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{notif.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                          <span className="text-[10px] text-muted-foreground/70">
                            {new Date(notif.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        )}
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    اعلان جدیدی وجود ندارد
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="text-sm text-primary-foreground/70">
              {user.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4" dir="rtl">
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="mb-6 flex-wrap w-full justify-start h-auto p-1 bg-muted/50">
            <TabsTrigger value="reservations" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              رزروها ({reservations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="cabins" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              کلبه‌ها
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              تقویم رزروها
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Settings className="w-4 h-4" /> {/* Using Settings icon for now or use BarChart if available */}
              گزارشات
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              کاربران
            </TabsTrigger>
            <TabsTrigger value="seasonal-prices" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              قیمت‌های فصلی
            </TabsTrigger>
            <TabsTrigger value="blocked-dates" className="flex items-center gap-2">
              <Ban className="w-4 h-4" />
              روزهای بسته
            </TabsTrigger>
            <TabsTrigger value="discounts" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              تخفیف‌ها
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              نظرات ({reviews?.length || 0})
            </TabsTrigger>

          </TabsList>

          {/* Reservations Tab */}
          <TabsContent value="reservations">
            <div className="glass-card rounded-xl overflow-hidden">
              {/* Header with Export button */}
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-bold text-lg">لیست رزروها</h3>
                {reservations && reservations.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportReservationsToExcel(reservations as unknown as import("@/utils/excelExport").ReservationForExport[])}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    خروجی Excel
                  </Button>
                )}
              </div>
              {reservationsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-forest-medium" />
                </div>
              ) : isReservationsError ? (
                <div className="p-8 text-center flex flex-col items-center gap-4">
                  <p className="text-destructive">خطا در بروزرسانی رزروها</p>
                  <Button
                    variant="outline"
                    onClick={() => refetchReservations()}
                    className="flex items-center gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    تلاش مجدد
                  </Button>
                </div>
              ) : reservations && reservations.length > 0 ? (
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead>مهمان</TableHead>
                      <TableHead>کلبه</TableHead>
                      <TableHead>تاریخ</TableHead>
                      <TableHead>شب‌ها</TableHead>
                      <TableHead>مبلغ (تومان)</TableHead>
                      <TableHead>وضعیت رزرو</TableHead>
                      <TableHead>وضعیت پرداخت</TableHead>
                      <TableHead>تراکنش</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <div className="font-medium">{reservation.guest_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {reservation.guest_phone.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d])}
                            </span>
                            {/* <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {reservation.guests_count} نفر
                            </span> */}
                          </div>
                        </TableCell>
                        <TableCell>
                          {reservation.cabins?.name_fa}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(reservation.check_in_date)}</div>
                            <div className="text-muted-foreground">تا {formatDate(reservation.check_out_date)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{reservation.nights_count.toLocaleString("fa-IR")}</TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(reservation.final_price_irr || reservation.calculated_price_irr)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px - 2 py - 1 rounded - full text - xs font - medium border ${getStatusBadge(reservation.status).variant === "default"
                              ? "bg-primary text-primary-foreground border-transparent"
                              : getStatusBadge(reservation.status).variant === "destructive"
                                ? "bg-destructive text-destructive-foreground border-transparent"
                                : getStatusBadge(reservation.status).variant === "outline"
                                  ? "text-foreground border-border"
                                  : "bg-secondary text-secondary-foreground border-transparent"
                              } `}
                          >
                            {getStatusBadge(reservation.status).label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text - xs ${getPaymentBadge(reservation.payment_status).color} `}>
                            {getPaymentBadge(reservation.payment_status).label}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {reservation.payment_reference || "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {reservation.status === "pending" && (
                                <DropdownMenuItem onClick={() => handleConfirmReservation(reservation.id)}>
                                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                  تأیید رزرو
                                </DropdownMenuItem>
                              )}
                              {(reservation.status === "pending_payment" || reservation.payment_status === "pending") && (
                                <DropdownMenuItem onClick={() => handleVerifyPayment(reservation.id)}>
                                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                  تأیید پرداخت
                                </DropdownMenuItem>
                              )}
                              {reservation.status !== "cancelled" && (
                                <DropdownMenuItem onClick={() => handleCancelReservation(reservation.id)} className="text-red-600">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  لغو رزرو
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  هیچ رزروی یافت نشد
                </div>
              )}
            </div>
          </TabsContent>

          {/* Cabins Tab */}
          <TabsContent value="cabins">
            <AdminCabins />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <AdminCalendar />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <AdminStats />
          </TabsContent>

          {/* Seasonal Prices Tab */}
          <TabsContent value="seasonal-prices">
            <AdminSeasonalPrices />
          </TabsContent>

          {/* Blocked Dates Tab */}
          <TabsContent value="blocked-dates">
            <AdminBlockedDates />
          </TabsContent>

          {/* Discounts Tab */}
          <TabsContent value="discounts">
            <AdminCoupons />
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <div className="grid gap-4">
              {reviewsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-forest-medium" />
                </div>
              ) : reviews && reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="glass-card p-6 rounded-xl relative group">
                    {/* Review content here... keeping brief for update */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-bold mb-1">{review.guest_name}</div>
                        <div className="text-sm text-muted-foreground">{review.cabins?.name_fa}</div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!review.is_approved ? (
                          <Button size="sm" onClick={() => handleApproveReview(review.id, true)} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> تأیید
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleApproveReview(review.id, false)}>
                            لغو تأیید
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteReview(review.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-foreground/80 mb-2">{review.comment}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>امتیاز: {review.rating}/5</span>
                      <span>{new Date(review.created_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  هیچ نظری ثبت نشده است
                </div>
              )}
            </div>
          </TabsContent>

          {/* Users Tab - Only for super_admin */}
          {userRole === 'super_admin' && (
            <TabsContent value="users">
              <AdminUsers />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
