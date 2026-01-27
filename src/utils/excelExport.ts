import * as XLSX from 'xlsx';

export interface ReservationForExport {
    id: string;
    guest_name: string;
    guest_phone: string;
    guest_email?: string;
    guests_count: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
    payment_status: string;
    payment_method: string;
    calculated_price_irr: number;
    calculated_price_usd: number;
    cabins?: { name_fa: string };
    created_at: string;
}

const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        pending: 'در انتظار تأیید',
        pending_payment: 'در انتظار پرداخت',
        confirmed: 'تأیید شده',
        cancelled: 'لغو شده',
        completed: 'اتمام اقامت',
    };
    return labels[status] || status;
};

const getPaymentStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        unpaid: 'پرداخت نشده',
        pending: 'در انتظار تأیید',
        paid: 'پرداخت شده',
        refunded: 'برگشت داده شده',
        failed: 'ناموفق',
    };
    return labels[status] || status;
};

const getPaymentMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
        online_zarinpal: 'زرین‌پال',
        online_paypal: 'پی‌پال',
        crypto_usdt: 'کریپتو (USDT)',
        cash_on_arrival: 'پرداخت در محل',
    };
    return labels[method] || method;
};

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fa-IR-u-ca-persian');
};

const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fa-IR').format(price);
};

export const exportReservationsToExcel = (reservations: ReservationForExport[]) => {
    // Prepare data for Excel
    const data = reservations.map((res, index) => ({
        'ردیف': index + 1,
        'نام مهمان': res.guest_name,
        'شماره تماس': res.guest_phone,
        'ایمیل': res.guest_email || '-',
        'کلبه': res.cabins?.name_fa || '-',
        'تعداد مهمانان': res.guests_count,
        'تاریخ ورود': formatDate(res.check_in_date),
        'تاریخ خروج': formatDate(res.check_out_date),
        'وضعیت رزرو': getStatusLabel(res.status),
        'وضعیت پرداخت': getPaymentStatusLabel(res.payment_status),
        'روش پرداخت': getPaymentMethodLabel(res.payment_method),
        'مبلغ (تومان)': formatPrice(res.calculated_price_irr),
        'مبلغ (دلار)': res.calculated_price_usd,
        'تاریخ ثبت': formatDate(res.created_at),
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data, {
        header: [
            'ردیف',
            'نام مهمان',
            'شماره تماس',
            'ایمیل',
            'کلبه',
            'تعداد مهمانان',
            'تاریخ ورود',
            'تاریخ خروج',
            'وضعیت رزرو',
            'وضعیت پرداخت',
            'روش پرداخت',
            'مبلغ (تومان)',
            'مبلغ (دلار)',
            'تاریخ ثبت',
        ]
    });

    // Set column widths
    worksheet['!cols'] = [
        { wch: 5 },   // ردیف
        { wch: 20 },  // نام مهمان
        { wch: 15 },  // شماره تماس
        { wch: 25 },  // ایمیل
        { wch: 15 },  // کلبه
        { wch: 12 },  // تعداد مهمانان
        { wch: 12 },  // تاریخ ورود
        { wch: 12 },  // تاریخ خروج
        { wch: 15 },  // وضعیت رزرو
        { wch: 15 },  // وضعیت پرداخت
        { wch: 15 },  // روش پرداخت
        { wch: 15 },  // مبلغ (تومان)
        { wch: 12 },  // مبلغ (دلار)
        { wch: 12 },  // تاریخ ثبت
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'رزروها');

    // Generate filename with current date
    const today = new Date().toLocaleDateString('fa-IR-u-ca-persian').replace(/\//g, '-');
    const filename = `reservations-${today}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
};
