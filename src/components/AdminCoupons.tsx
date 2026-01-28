import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCoupons, useCreateCoupon, useDeleteCoupon, useUpdateCoupon } from "@/hooks/useCoupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Tag, Percent, DollarSign, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";

const AdminCoupons = () => {
    const { t } = useTranslation();
    const { data: coupons, isLoading } = useCoupons();
    const { mutateAsync: createCoupon, isPending: isCreating } = useCreateCoupon();
    const { mutateAsync: updateCoupon, isPending: isUpdating } = useUpdateCoupon();
    const { mutateAsync: deleteCoupon, isPending: isDeleting } = useDeleteCoupon();

    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        code: "",
        discount_type: "percent" as "percent" | "fixed",
        discount_value: "",
        max_uses: "",
        expires_at: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.code || !formData.discount_value) {
                toast.error("کد و مقدار تخفیف الزامی است");
                return;
            }

            await createCoupon({
                code: formData.code.toUpperCase(),
                discount_type: formData.discount_type,
                discount_value: Number(formData.discount_value),
                max_uses: formData.max_uses ? Number(formData.max_uses) : null,
                expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
            });

            toast.success("کد تخفیف با موفقیت ایجاد شد");
            setIsOpen(false);
            setFormData({
                code: "",
                discount_type: "percent",
                discount_value: "",
                max_uses: "",
                expires_at: "",
            });
        } catch (error) {
            console.error(error);
            toast.error("خطا در ایجاد کد تخفیف");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("آیا از حذف این کد تخفیف اطمینان دارید؟")) {
            try {
                await deleteCoupon(id);
                toast.success("کد تخفیف حذف شد");
            } catch (error) {
                toast.error("خطا در حذف کد تخفیف");
            }
        }
    };

    const handleToggleActive = async (id: string, currentState: boolean) => {
        try {
            await updateCoupon({ id, updates: { is_active: !currentState } });
            toast.success("وضعیت تغییر کرد");
        } catch (error) {
            toast.error("خطا در تغییر وضعیت");
        }
    };

    if (isLoading) return <Loader2 className="w-8 h-8 animate-spin mx-auto text-forest-medium" />;

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Tag className="w-6 h-6" />
                    کدهای تخفیف
                </h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-forest-medium hover:bg-forest-deep text-white">
                            <Plus className="w-4 h-4 ml-2" />
                            افزودن کد تخفیف
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]" dir="rtl">
                        <DialogHeader>
                            <DialogTitle className="text-right">ایجاد کد تخفیف جدید</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div>
                                <Label className="text-right block mb-2">کد تخفیف</Label>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="مثال: SUMMER1403"
                                    className="uppercase text-left"
                                    dir="ltr"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-right block mb-2">نوع تخفیف</Label>
                                    <Select
                                        value={formData.discount_type}
                                        onValueChange={(val: "percent" | "fixed") => setFormData({ ...formData, discount_type: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent dir="rtl">
                                            <SelectItem value="percent">درصدی (٪)</SelectItem>
                                            <SelectItem value="fixed">مبلغ ثابت (تومان)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-right block mb-2">مقدار</Label>
                                    <Input
                                        type="number"
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                        placeholder={formData.discount_type === "percent" ? "10" : "50000"}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-right block mb-2">تعداد استفاده (اختیاری)</Label>
                                    <Input
                                        type="number"
                                        value={formData.max_uses}
                                        onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                                        placeholder="خالی = نامحدود"
                                    />
                                </div>
                                <div>
                                    <div>
                                        <Label className="text-right block mb-2">تاریخ انقضا (اختیاری)</Label>
                                        <div className="flex bg-background border border-input rounded-md ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                            <DatePicker
                                                value={formData.expires_at}
                                                onChange={(date: DateObject | null) => {
                                                    setFormData({
                                                        ...formData,
                                                        expires_at: date ? date.toDate().toISOString() : ""
                                                    });
                                                }}
                                                calendar={persian}
                                                locale={persian_fa}
                                                calendarPosition="bottom-right"
                                                placeholder="انتخاب تاریخ"
                                                containerClassName="w-full"
                                                inputClass="w-full h-10 bg-transparent border-0 px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground"
                                                format="YYYY/MM/DD"
                                            />
                                            <div className="p-2 text-muted-foreground">
                                                <CalendarIcon className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-forest-medium" disabled={isCreating}>
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "ایجاد کد تخفیف"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">کد تخفیف</TableHead>
                            <TableHead className="text-right">مقدار</TableHead>
                            <TableHead className="text-right">مصرف شده / کل</TableHead>
                            <TableHead className="text-right">انقضا</TableHead>
                            <TableHead className="text-right">وضعیت</TableHead>
                            <TableHead className="text-center">عملیات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {coupons?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    هیچ کد تخفیفی یافت نشد. اولین کد را ایجاد کنید!
                                </TableCell>
                            </TableRow>
                        ) : (
                            coupons?.map((coupon) => (
                                <TableRow key={coupon.id}>
                                    <TableCell className="font-mono font-bold text-right" dir="ltr">{coupon.code}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-start gap-1">
                                            {coupon.discount_type === "percent" ? (
                                                <Percent className="w-3 h-3 text-muted-foreground" />
                                            ) : (
                                                <span className="text-xs text-muted-foreground">تومان</span>
                                            )}
                                            {coupon.discount_value.toLocaleString('fa-IR')}
                                            {coupon.discount_type === "percent" ? "٪" : ""}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {coupon.used_count.toLocaleString('fa-IR')} / {coupon.max_uses ? coupon.max_uses.toLocaleString('fa-IR') : "∞"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {coupon.expires_at ? new DateObject(new Date(coupon.expires_at)).convert(persian, persian_fa).format("YYYY/MM/DD") : "بدون انقضا"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-start gap-2">
                                            <span className={`text-xs w-10 ${coupon.is_active ? "text-green-600" : "text-gray-400"}`}>
                                                {coupon.is_active ? "فعال" : "غیرفعال"}
                                            </span>
                                            <Switch
                                                checked={coupon.is_active}
                                                onCheckedChange={() => handleToggleActive(coupon.id, coupon.is_active)}
                                                disabled={isUpdating}
                                                dir="ltr"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(coupon.id)}
                                            disabled={isDeleting}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div >
    );
};

export default AdminCoupons;
